/**
 * revturbine — validate RevTurbine Playbooks and load them into a RevTurbine
 * instance through the playbook-version lifecycle (draft → Release).
 *
 * Configs are canonical RevTurbineConfig JSON files, addressed by path.
 *
 * Verification is MANDATORY and fully offline: configs are validated against a
 * vendored, version-stamped snapshot of RevTurbineConfigSchema (./schema/), so
 * the tool never uploads a config it could not validate and needs no access to
 * any private schema package or source tree.
 *
 * The 0.4.0 surface (plan 131) follows docs/specs/cli/cli.md: explicit version
 * selectors (`<file>` / `--draft` / `--live` / `--release <id>`), the stable
 * exit-code classes in src/lib/output.ts, results on stdout with diagnostics
 * on stderr, and `--json` for machines. Auth uses a token from `login`
 * (RFC 8628 device flow), persisted at ~/.revturbine/credentials.json (0600).
 *
 *   revturbine <command> --help
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { spawn, spawnSync } from 'node:child_process';

import { Command, CommanderError, Option } from 'commander';
import { z } from 'zod';

import { RevTurbineConfigSchema } from './schema/exported-config.snapshot.mjs';
import { evaluate as evaluateOffline } from './schema/validators.snapshot.mjs';
import { SCHEMA_VERSION } from './schema/version';
import { getCredential, normalizeBaseUrl, removeCredential, resolveConfigDir } from './lib/credentials';
import { deviceLogin } from './lib/device-auth';
import { signup } from './lib/signup';
import { trackEvent, shouldTrackCommandExecution } from './lib/track';
import { diffExportedConfig, formatDiff } from './lib/config-diff';
import { pruneQuery } from './lib/prune';
import { fetchValidation, formatFindings, hasBlockingFindings, type ValidationFinding } from './lib/config-validate';
import {
  assertSupportedFormat,
  describePlaybookHeader,
  readPlaybookHeader,
  UnsupportedFormatError,
} from './lib/playbook-header';
import { resolveActiveDraft } from './lib/drafts';
import { createIngestKey, listIngestKeys, revokeIngestKey, formatIngestKeyLine } from './lib/ingest-keys';
import { DELEGATION_ENV, NO_LOCAL_FLAG, planDelegation, skewNotice } from './lib/delegate';
import { schemaForConfig } from './lib/offline-schema';
import { checkOfflineConfig, offlineAdvisories } from './lib/offline-config-check';
import { detectPackageManager, detectStack, installArgs, newProjectManifest, planInstall } from './lib/init';
import { STARTER_PLAYBOOK, STARTER_PLAYBOOK_FILENAME, validatePlaybook } from './lib/starter-playbook';
import { detectHarness, finalOutputLines, skillsAddArgs, SKILLS_SOURCE, type SkillsOutcome } from './lib/init-skills';
import { generateHandleTypes } from './lib/handles-codegen';
import { classFromStatus, diag, diagRaw, emit, EXIT, fail, isNetworkError } from './lib/output';
import { checkPinDrift } from './lib/pin-drift';
import { describeSelector, orderDiffSelectors, requireSelectors, SelectorError, type VersionSelector } from './lib/selectors';
import { resolveUploadTarget } from './lib/target';
import { serverSchemaIsNewer } from './lib/version-trail';

const DOCS_URL = 'https://github.com/revt-eng/revturbine-cli#readme';
// Default RevTurbine instance. Includes the `/app` subfolder basePath (plan 85)
// so API calls resolve to `…/app/api/…`. Uses the bare apex `revturbine.com`,
// which is the canonical host (2026-07-09): `www.revturbine.com` now
// 308-redirects TO the apex, and that cross-origin redirect strips the
// `Authorization` header, which would 401 every authenticated command — so
// target the apex directly and never the `www` host.
const DEFAULT_URL = 'https://revturbine.com/app';

// ── Config loading (by explicit path) ───────────────────────────────────────────

function loadConfig(file: string): unknown {
  const resolved = path.resolve(file);
  if (!existsSync(resolved)) fail(EXIT.USAGE, `Config not found: ${resolved}`);
  try {
    return JSON.parse(readFileSync(resolved, 'utf8'));
  } catch (err) {
    fail(EXIT.VALIDATION, `invalid JSON in ${resolved}: ${(err as Error).message}`);
  }
}

/**
 * Returns the RAW config to POST (unchanged — every field), or null on a
 * blocking structural failure.
 *
 * plan 147 TASK-10 (OQ-1): the offline schema check is a DIAGNOSTIC only. It
 * reports structural problems and warns on unknown / deprecated fields, but it
 * never strips the body (AC-4: a legacy config uploaded via the CLI must reach
 * the server with all fields) and unknown / deprecated fields never block — the
 * server/SDK are the strict-reject tier. The pure decision lives in
 * `checkOfflineConfig`; this wrapper only does the IO (diag/diagRaw).
 */
function verifyConfig(file: string): unknown | null {
  const parsed = loadConfig(file);
  const header = readPlaybookHeader(parsed);

  // plan 118 TASK-23: reject an unknown/too-new Playbook format BEFORE any
  // network mutation (upload/launch both call verifyConfig first). The known
  // legacy shape is allowed; the server normalizes it.
  try {
    assertSupportedFormat(parsed);
  } catch (err) {
    if (err instanceof UnsupportedFormatError) {
      diag(`✗ ${file}: ${err.message}`);
      return null;
    }
    throw err;
  }

  const check = checkOfflineConfig(parsed);
  if (!check.ok) {
    diag(`✗ ${file}: schema validation FAILED:`);
    for (const issue of check.problems) {
      diagRaw(`  ${issue.path.join('.') || '<root>'}: ${issue.message}`);
    }
    return null;
  }

  diag(
    check.shape === 'canonical'
      ? `✓ ${file}: ${describePlaybookHeader(header)} — body validated server-side on import`
      : `✓ ${file}: schema validation passed — ${describePlaybookHeader(header)}`,
  );
  // OQ-1: unknown / deprecated fields WARN (they don't block), and the RAW
  // config — not a schema-stripped copy — is what flows to the POST body.
  if (check.advisories.length > 0) diagRaw(formatFindings(check.advisories));
  return check.body;
}

// ── Auth / HTTP ──────────────────────────────────────────────────────────────

interface Connection {
  url: string;
  tenantId: string;
  tenantSource: string;
  credentialsDir: string;
  credentialsSource: string;
  hasToken: boolean;
  headers: Record<string, string>;
}

/** Build the authenticated request context for an instance URL. */
function connect(rawUrl: string, explicitTenantId?: string): Connection {
  const url = normalizeBaseUrl(rawUrl);
  const { dir, source } = resolveConfigDir();
  const cred = getCredential(url);
  // Tenant precedence: explicit --tenant-id > the stored token's tenant > default.
  const tenantId = explicitTenantId ?? cred?.tenant_id ?? 'dev-tenant-001';
  const tenantSource = explicitTenantId ? '--tenant-id' : cred?.tenant_id ? 'stored token' : 'default';
  // Legibility (plan 86): always show which tenant + which credentials dir we resolved.
  diag(`Tenant ${tenantId} (${tenantSource}); credentials: ${dir} [${source}].`);
  if (source === 'global') {
    diag(
      `WARNING: using the global ${dir} - NOT worktree-scoped. ` +
        `If this session is for a specific customer, run from that customer's worktree ` +
        `(with its own .revturbine/) so a stale login can't target the wrong tenant.`,
    );
  }
  return {
    url,
    tenantId,
    tenantSource,
    credentialsDir: dir,
    credentialsSource: source,
    hasToken: Boolean(cred),
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...(cred ? { Authorization: `Bearer ${cred.token}` } : {}),
    },
  };
}

/**
 * The upload/launch tenant, honoring a Playbook file's embedded origin
 * (plan 131 TASK-10): explicit `-t` wins, an embedded `tenant_id` goes back
 * where it came from, and an embedded tenant contradicting the session with
 * no explicit choice is refused before anything is sent.
 */
function uploadTenantFor(rawUrl: string, config: unknown, explicit?: string): string {
  const cred = getCredential(normalizeBaseUrl(rawUrl));
  const target = resolveUploadTarget({
    embedded: (config as { tenant_id?: string })?.tenant_id,
    explicit,
    session: cred?.tenant_id ?? 'dev-tenant-001',
  });
  if (!target.ok) fail(EXIT.VALIDATION, target.error);
  if (target.note) diag(target.note);
  return target.tenantId;
}

function authHint(url: string, status: number): void {
  if (status === 401 || status === 403) {
    diag(`Authentication required for ${url}. Log in with:\n  revturbine login ${url}`);
  }
}

/** Fail with the right class for a non-OK HTTP response. */
function httpFail(conn: Connection, what: string, status: number, detail?: unknown): never {
  authHint(conn.url, status);
  fail(classFromStatus(status), `${what} failed (${status})${detail ? `: ${JSON.stringify(detail)}` : ''}`);
}

async function request(conn: Connection, pathname: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${conn.url}${pathname}`, { headers: conn.headers, ...init });
  } catch (err) {
    if (isNetworkError(err)) fail(EXIT.NETWORK, `network failure reaching ${conn.url}: ${(err as Error).message}`);
    throw err;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function postJson(conn: Connection, pathname: string, body: unknown): Promise<{ res: Response; json: any }> {
  const res = await request(conn, pathname, { method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getJson(conn: Connection, pathname: string): Promise<{ res: Response; json: any }> {
  const res = await request(conn, pathname);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

/** Warn when the server's schema stamp outruns the bundled snapshot. */
function warnIfSchemaBehind(config: unknown): void {
  const server = serverSchemaIsNewer(config, SCHEMA_VERSION);
  if (server) {
    diag(
      `WARNING: the server's schema (${server}) is newer than this CLI's bundled snapshot (${SCHEMA_VERSION}) — offline validation may be missing rules. Update the CLI pinned in this repo: npm install -D @revturbine/cli@latest (or your package manager's equivalent).`,
    );
  }
}

/** Download a config version's JSON; `playbookVersionId` scopes a draft/Release. */
async function downloadConfig(conn: Connection, playbookVersionId?: string): Promise<unknown> {
  const qs = playbookVersionId ? `?playbookVersionId=${encodeURIComponent(playbookVersionId)}` : '';
  const res = await request(conn, `/api/config/export${qs}`);
  if (!res.ok) httpFail(conn, 'download', res.status);
  const config = await res.json().catch(() => ({}));
  warnIfSchemaBehind(config);
  return config;
}

/** The open draft's id, or a class-4 failure when none is open. */
async function requireOpenDraft(conn: Connection): Promise<string> {
  const { ok, status, draft } = await resolveActiveDraft(conn.url, conn.headers);
  if (!ok) httpFail(conn, 'draft lookup', status);
  if (!draft) fail(EXIT.VALIDATION, 'No open draft for this tenant — stage one with `revturbine upload <file>`.');
  return draft.id;
}

/** Resolve a version selector to its config JSON. */
async function loadVersion(conn: Connection, sel: VersionSelector): Promise<unknown> {
  switch (sel.kind) {
    case 'file':
      return loadConfig(sel.path);
    case 'live':
      return downloadConfig(conn);
    case 'release':
      return downloadConfig(conn, sel.id);
    case 'draft':
      return downloadConfig(conn, await requireOpenDraft(conn));
  }
}

/**
 * The launch gate + go-live: run the full server validation catalog against
 * the draft (blocking on `error_draft` / `error_launch`), then walk
 * submit → approve → deploy. Deploy runs compile-and-activate synchronously
 * in-request (plan 68), so success means the configuration is live.
 */
async function launchDraft(conn: Connection, playbookVersionId: string, force = false): Promise<void> {
  diag(`Launch gate: validating draft ${playbookVersionId} …`);
  const validation = await fetchValidation(conn.url, playbookVersionId, conn.headers);
  if (!validation.ok) httpFail(conn, 'validate', validation.status, validation.error);
  if (validation.findings.length > 0) diagRaw(formatFindings(validation.findings));
  if (hasBlockingFindings(validation.findings, force)) {
    fail(EXIT.VALIDATION, 'blocking findings — this draft cannot launch.');
  }
  // Name what `--force` is overriding so the bypass is never silent. Only the
  // launch-gate tier (`error_launch`) is relaxed; a structural `error_draft`
  // would have blocked above, force or not.
  const overridden = force ? validation.findings.filter((f) => f.severity === 'error_launch') : [];
  if (overridden.length > 0) {
    diag(`--force: overriding ${overridden.length} launch-gate finding(s) (error_launch).`);
  }

  diag(`Launching playbook version ${playbookVersionId} (submit → approve → deploy) …`);
  for (const step of ['submit', 'approve', 'deploy'] as const) {
    // `force` is a deploy-time precondition (409 bypass + launch gate); submit
    // and approve are plain status transitions that carry no force flag.
    const body = step === 'deploy' ? { force } : {};
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/${step}`, body);
    if (!res.ok) {
      diag(`✗ ${step} failed (${res.status}). The draft is staged but NOT live.`);
      diagRaw(`  ${JSON.stringify(json)}`);
      diag(`Finish it from the UI (Drafts & Releases): playbook version ${playbookVersionId}`);
      authHint(conn.url, res.status);
      process.exit(classFromStatus(res.status));
    }
    diag(`  ✓ ${step}`);
  }
  diag('✓ Launched — the playbook version is now the live configuration.');
}

/**
 * Gate a destructive operation: proceed immediately when `--yes`, otherwise
 * prompt interactively. With no TTY and no `--yes`, refuse (scripts must opt in).
 */
async function confirmOrExit(promptText: string, yes: boolean): Promise<void> {
  if (yes) return;
  if (!process.stdin.isTTY) {
    fail(EXIT.USAGE, 'Refusing a destructive action without confirmation (no TTY). Pass --yes.');
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = (await rl.question(`${promptText} [y/N] `)).trim().toLowerCase();
  rl.close();
  if (answer !== 'y' && answer !== 'yes') {
    diag('Aborted.');
    process.exit(0);
  }
}

/**
 * `init` in a directory with no package.json: offer to start a project rather
 * than refuse. Proceeds immediately with `--yes`; otherwise prompts, defaulting
 * to yes because creating a manifest in an empty directory is additive. With no
 * TTY and no `--yes` there's nobody to ask, so it refuses and names the flag.
 */
async function confirmNewProject(dir: string, yes: boolean): Promise<void> {
  if (yes) return;
  if (!process.stdin.isTTY) {
    fail(
      EXIT.USAGE,
      `No package.json in ${dir}. Re-run with --yes to start a new project here, or --dir <path> to target an existing one.`,
    );
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = (await rl.question(`No package.json in ${dir}. Start a new project here? [Y/n] `)).trim().toLowerCase();
  rl.close();
  if (answer === 'n' || answer === 'no') {
    diag('Aborted — no project created.');
    process.exit(0);
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function table(rows: string[][]): string {
  if (rows.length === 0) return '  (none)';
  const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => (r[col] ?? '').length)));
  return rows.map((r) => '  ' + r.map((cell, i) => (cell ?? '').padEnd(widths[i])).join('  ')).join('\n');
}

const SHOW_KINDS = ['plans', 'entitlements', 'segments', 'placements', 'trials'] as const;
type ShowKind = (typeof SHOW_KINDS)[number];

function renderShow(kind: ShowKind, config: AnyRecord): { data: unknown; text: string } {
  const arr = (key: string): AnyRecord[] => (Array.isArray(config[key]) ? config[key] : []);
  const handleOf = (item: AnyRecord): string => item.handle ?? item.unique_handle ?? item.id ?? '';
  switch (kind) {
    case 'plans': {
      const plans = arr('plans');
      const addons = arr('addons');
      const ents = arr('entitlements');
      const data = { plans, addons, entitlements: ents };
      const text = [
        `plans (${plans.length}):`,
        table(plans.map((p) => [handleOf(p), p.name ?? '', `tier ${p.tier_position ?? '-'}`])),
        `addons (${addons.length}):`,
        table(addons.map((a) => [handleOf(a), a.name ?? ''])),
        `entitlements (${ents.length}):`,
        table(ents.map((e) => [handleOf(e), e.name ?? '', e.type ?? ''])),
      ].join('\n');
      return { data, text };
    }
    case 'entitlements': {
      const ents = arr('entitlements');
      return { data: ents, text: table(ents.map((e) => [handleOf(e), e.name ?? '', e.type ?? ''])) };
    }
    case 'segments': {
      const segs = arr('segments');
      return {
        data: segs,
        text: table(segs.map((s) => [handleOf(s), s.name ?? '', `${(s.predicates ?? []).length} predicate(s)`])),
      };
    }
    case 'placements': {
      const pls = arr('placements');
      return {
        data: pls,
        text: table(
          pls.map((p) => [p.name ?? handleOf(p), p.category ?? '', p.trigger?.type ?? '', `${(p.payloads ?? []).length} payload(s)`]),
        ),
      };
    }
    case 'trials': {
      const free = arr('free_trial_rules');
      const reverse = arr('reverse_trial_rules');
      const data = { free_trial_rules: free, reverse_trial_rules: reverse };
      const text = [
        `free_trial_rules (${free.length}):`,
        table(free.map((r) => [handleOf(r), r.name ?? ''])),
        `reverse_trial_rules (${reverse.length}):`,
        table(reverse.map((r) => [handleOf(r), r.name ?? ''])),
      ].join('\n');
      return { data, text };
    }
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

const pkgVersion =
  (createRequire(import.meta.url)('../package.json') as { version?: string }).version ?? '0.0.0';

// Appended to `revturbine --help`: command groups, copy-pasteable workflows,
// and the auth model. Mirrors the README — keep them in sync.
const HELP_AFTER = `
Command groups:
  Set up        init (alias: create)
  Auth & meta   login, logout, signup, whoami, schema, docs
  Download      download
  Check         validate, diff, show
  Stage/launch  upload, launch, discard, restore
  Inspect       status, history, preview, evaluate
  Codegen       generate types
  Keys          ingest-keys create|list|revoke

Version selectors (no defaults — a command that reads a config requires one):
  <file>            a local Playbook file (positional, or --file <path>)
  --draft           the tenant's single open draft (resolved automatically)
  --live            the current live Release
  --release <id>    a specific playbook version / Release

Common workflows:
  # Add RevTurbine to an app (same routine as \`npm create revturbine@latest\`)
  revturbine init

  # Author, validate, and ship against the default instance (revturbine.com/app)
  revturbine login
  revturbine download --live --save ./revturbine.playbook.json
  revturbine validate ./revturbine.playbook.json
  revturbine diff ./revturbine.playbook.json --live
  revturbine launch ./revturbine.playbook.json

  # Manual review flow (stage → inspect → launch)
  revturbine upload ./revturbine.playbook.json          # stage as the open draft
  revturbine preview                       # inspect the open draft
  revturbine validate --draft              # full server catalog
  revturbine launch --draft

  # Inspect and roll back
  revturbine status
  revturbine history
  revturbine restore <playbook-version-id> --launch

Exit-code classes: 0 ok · 1 unexpected · 2 usage · 3 auth · 4 validation
blocked · 5 conflict/stale · 6 network · 7 server error.

Auth:
  Most commands need a token — run \`login\` first. Credentials live at
  ~/.revturbine/credentials.json (0600); the token's tenant is used by default,
  override with -t/--tenant-id. Mutating commands (discard, restore) prompt
  for confirmation unless --yes.

Full reference: ${DOCS_URL}
`;

const program = new Command();

// Dogfood each successful ONLINE command as a `cli_command_executed` control-
// plane event (plan 112 TASK-6). Fires only after the action resolves (so a
// failed command that exits non-zero emits nothing); auth commands emit their
// own events, and offline runs (no --url option, or `validate <file>` without
// --draft) are skipped.
program.hook('postAction', async (_thisCommand, actionCommand) => {
  const opts = actionCommand.opts() as { url?: string; tenantId?: string; draft?: boolean };
  if (actionCommand.name() === 'validate' && !opts.draft) return;
  if (!shouldTrackCommandExecution(actionCommand.name(), Boolean(opts.url))) return;
  await trackEvent(opts.url as string, opts.tenantId, 'cli_command_executed', {
    command: actionCommand.name(),
  });
});

program
  .name('revturbine')
  .description('Validate RevTurbine Playbooks and ship them through the playbook-version lifecycle (draft → Release).')
  .version(`${pkgVersion} (schema ${SCHEMA_VERSION})`, '-V, --version', 'Print the revturbine and bundled schema versions')
  // Consumed before commander parses (see the delegation block at the bottom);
  // declared here so it appears in --help and isn't rejected as unknown.
  .option(NO_LOCAL_FLAG, "Ignore the repo-pinned CLI and run this installation")
  .showHelpAfterError()
  .addHelpText('after', HELP_AFTER);

// ── Set up ───────────────────────────────────────────────────────────────────

/** Run a package-manager install to completion, streaming its output through. */
function runInstall(manager: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // `shell: true` so Windows resolves the .cmd shims for pnpm/npm/yarn. The
    // argv is built by installArgs() from a closed set of managers and package
    // specs we construct — never interpolated user input.
    const child = spawn(manager, args, { cwd, stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

program
  .command('init')
  // `revturbine create` is a synonym for `revturbine init`, so someone who
  // reaches for the `npm create revturbine` verb gets the same scaffold from the
  // CLI directly. Same action, same flags.
  .alias('create')
  .description('Scaffold RevTurbine into this app: detect the stack, install the SDK, pin the CLI, drop a starter Playbook, and install the Agent Skills. Offers to start a new project when the directory has no package.json.')
  .option('-d, --dir <path>', 'Target directory (defaults to the current directory)')
  .option('-y, --yes', 'Skip prompts — create a new project non-interactively when the directory has none')
  .option('--dry-run', 'Report what would be installed without running the package manager')
  .option('--no-skills', 'Do not install the RevTurbine Agent Skills')
  .option('--json', 'Emit the scaffold plan as JSON')
  .action(async (opts: { dir?: string; yes?: boolean; dryRun?: boolean; skills?: boolean; json?: boolean }) => {
    const dir = path.resolve(opts.dir ?? process.cwd());
    const manifestPath = path.join(dir, 'package.json');

    let manifest: {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      packageManager?: string;
    };
    let createdProject = false;

    if (existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      } catch (err) {
        fail(EXIT.VALIDATION, `invalid JSON in ${manifestPath}: ${(err as Error).message}`);
      }
    } else {
      // No project here yet — offer to start one instead of refusing. Creating a
      // package.json in an empty directory is additive, so the prompt defaults to
      // yes (unlike the destructive-action gate, which defaults to no).
      manifest = newProjectManifest(path.basename(dir));
      createdProject = true;
      if (!opts.dryRun) {
        await confirmNewProject(dir, opts.yes === true);
        mkdirSync(dir, { recursive: true });
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
        diag(`✓ Created a new project (package.json — ${manifest.name})`);
      }
    }

    const manager = detectPackageManager({
      files: existsSync(dir) ? readdirSync(dir) : [],
      packageManagerField: manifest.packageManager,
      userAgent: process.env['npm_config_user_agent'],
    });
    const stack = detectStack(manifest);
    const plan = planInstall({
      dependencies: manifest.dependencies,
      devDependencies: manifest.devDependencies,
      cliVersion: pkgVersion,
    });

    diag(`✓ Detected ${manager.name} (${manager.reason})`);
    if (stack !== 'unknown') diag(`✓ Detected ${stack}`);
    for (const note of plan.skipped) diag(`• ${note}`);

    // The starter Playbook is a separate axis from the installs: a repo can have
    // the deps but a deleted playbook, so this is never gated on install work
    // remaining.
    const playbookPath = path.join(dir, STARTER_PLAYBOOK_FILENAME);
    const playbookExists = existsSync(playbookPath);
    if (playbookExists) diag(`• ${STARTER_PLAYBOOK_FILENAME} already present — left as-is`);

    // Skills are installed by default; --no-skills opts out. commander stores
    // `--no-skills` as `opts.skills === false`.
    const installSkills = opts.skills !== false;

    if (opts.json) {
      emit(
        {
          dir,
          project: createdProject ? 'created' : 'existing',
          manager: manager.name,
          stack,
          install: plan.install,
          skipped: plan.skipped,
          playbook: playbookExists ? 'present' : STARTER_PLAYBOOK_FILENAME,
          skills: installSkills ? SKILLS_SOURCE : 'skipped',
        },
        true,
      );
    }

    if (opts.dryRun) {
      if (createdProject) diag(`would create: package.json (new project — ${manifest.name})`);
      for (const step of plan.install) {
        diag(`would run: ${manager.name} ${installArgs(manager.name, step).join(' ')}`);
      }
      if (!playbookExists) diag(`would write: ${STARTER_PLAYBOOK_FILENAME}`);
      if (installSkills) diag(`would run: npx ${skillsAddArgs().join(' ')}`);
      if (plan.install.length === 0 && playbookExists) diag('✓ Already set up — nothing to do.');
      return;
    }

    for (const step of plan.install) {
      const args = installArgs(manager.name, step);
      diag(`${manager.name} ${args.join(' ')}`);
      let code: number;
      try {
        code = await runInstall(manager.name, args, dir);
      } catch (err) {
        fail(EXIT.UNEXPECTED, `could not run ${manager.name}: ${(err as Error).message}`);
      }
      if (code !== 0) fail(EXIT.UNEXPECTED, `${manager.name} ${args.join(' ')} failed (exit ${code}).`);
    }
    if (plan.install.length > 0) {
      diag(`✓ Installed the RevTurbine SDK and CLI (CLI pinned to ${pkgVersion})`);
    }

    const playbookAdded = !playbookExists;
    if (playbookAdded) {
      // REQ-7: validate in-process, before writing — never leave a config on
      // disk that `revturbine validate` would immediately reject.
      const check = validatePlaybook(STARTER_PLAYBOOK);
      if (!check.ok) {
        fail(
          EXIT.VALIDATION,
          `the bundled starter Playbook failed validation against schema ${SCHEMA_VERSION} — this is a CLI bug, please report it.`,
        );
      }
      writeFileSync(playbookPath, `${JSON.stringify(STARTER_PLAYBOOK, null, 2)}\n`, 'utf8');
      diag(`✓ Added a starter playbook (${STARTER_PLAYBOOK_FILENAME} — local mode, no account needed)`);
    }

    // Agent Skills — delegated to `npx skills` (plan 142 REQ-8). A skills
    // failure MUST NOT fail generation (REQ-9): the SDK/CLI/playbook are already
    // in place, so a missing skills install degrades to a printed manual command.
    let skillsOutcome: SkillsOutcome = installSkills ? 'installed' : 'skipped';
    if (installSkills) {
      diag('Installing the RevTurbine Agent Skills (npx skills)…');
      const args = skillsAddArgs();
      let code: number;
      try {
        code = await runInstall('npx', args, dir);
      } catch {
        code = 1;
      }
      if (code === 0) {
        diag('✓ Installed the RevTurbine Agent Skills (some write app code — review before running them)');
      } else {
        skillsOutcome = 'failed';
        diag('⚠ Could not install the Agent Skills automatically. Add them by hand:');
        diag(`    npx ${args.join(' ')}`);
      }
    } else {
      diag('• Skipping the Agent Skills (--no-skills)');
    }

    // The last words: the harness-native entry point (plan 142 REQ-12, resolves
    // installable-skills §12.1). Suppressed under --json so machine output stays
    // a single object.
    if (!opts.json) {
      const lines = finalOutputLines({
        managerLabel: manager.name,
        installedSdkAndCli: plan.install.length > 0,
        cliVersion: pkgVersion,
        playbookAdded,
        skills: skillsOutcome,
        harness: detectHarness(process.env),
      });
      process.stdout.write(`${lines.join('\n')}\n`);
    }
  });

// ── Auth & meta ──────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Authorize this machine via the browser (device flow) and store a token for the instance (default: the production instance).')
  .argument('[url]', `RevTurbine instance URL (default: ${DEFAULT_URL})`)
  .action(async (url: string | undefined) => {
    try {
      const base = normalizeBaseUrl(url ?? DEFAULT_URL);
      await deviceLogin(base);
      await trackEvent(base, undefined, 'cli_signed_in');
    } catch (err) {
      fail(EXIT.AUTH, `Login failed: ${(err as Error).message}`);
    }
  });

/** Prompt for one line of input. */
async function promptLine(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Prompt for a secret, masking the echoed characters. */
function promptHidden(question: string): Promise<string> {
  const { stdin, stderr } = process;
  // No TTY (piped/CI) -> fall back to a normal line read; there's no terminal
  // echo to mask anyway, and scripts should prefer the --password flag.
  if (!stdin.isTTY) return promptLine(question);

  return new Promise<string>((resolve) => {
    stderr.write(question);
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let input = '';
    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(wasRaw);
      stdin.pause();
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        const code = ch.charCodeAt(0);
        if (code === 13 || code === 10 || code === 4) {
          // Enter (CR/LF) or Ctrl-D (EOT) -> submit
          cleanup();
          stderr.write('\n');
          resolve(input.trim());
          return;
        }
        if (code === 3) {
          // Ctrl-C (ETX) -> abort the way the shell would
          cleanup();
          stderr.write('\n');
          process.exit(130);
        }
        if (code === 127 || code === 8) {
          // Backspace / Delete -> erase one masked char
          if (input.length > 0) {
            input = input.slice(0, -1);
            stderr.write('\b \b');
          }
          continue;
        }
        input += ch;
        stderr.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

program
  .command('signup')
  .description('Create a RevTurbine account and log in (email + password + emailed verification code).')
  .argument('[url]', `RevTurbine instance URL (default: ${DEFAULT_URL})`)
  .option('--name <name>', 'Full name (prompted if omitted)')
  .option('--email <email>', 'Email address (prompted if omitted)')
  .option('--password <password>', 'Password, min 8 chars (prompted hidden if omitted)')
  .action(async (url: string | undefined, opts: { name?: string; email?: string; password?: string }) => {
    const baseUrl = normalizeBaseUrl(url ?? DEFAULT_URL);
    try {
      const name = opts.name ?? (await promptLine('Name: '));
      const email = opts.email ?? (await promptLine('Email: '));
      const password = opts.password ?? (await promptHidden('Password: '));
      if (!name || !email || password.length < 8) {
        fail(EXIT.USAGE, 'Name, email, and a password of at least 8 characters are required.');
      }
      const result = await signup({
        baseUrl,
        name,
        email,
        password,
        promptOtp: (attempt) =>
          promptLine(attempt > 1 ? 'Verification code (try again): ' : 'Verification code: '),
      });
      if (result.status === 'awaiting_invitation') process.exit(0);
      await trackEvent(baseUrl, undefined, 'cli_signed_up');
    } catch (err) {
      fail(EXIT.AUTH, `Signup failed: ${(err as Error).message}`);
    }
  });

program
  .command('logout')
  .description('Remove the stored token for <url>.')
  .argument('[url]', `RevTurbine instance URL (default: ${DEFAULT_URL})`)
  .action((url: string | undefined) => {
    const normalized = normalizeBaseUrl(url ?? DEFAULT_URL);
    const removed = removeCredential(normalized);
    diag(removed ? `Logged out of ${normalized}.` : `No stored credential for ${normalized}.`);
  });

program
  .command('whoami')
  .description('Show the resolved instance, tenant, credentials source, and whether the stored token works.')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output')
  .action(async (opts: { url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    let tokenValid: boolean | null = null;
    if (conn.hasToken) {
      const probe = await resolveActiveDraft(conn.url, conn.headers).catch(() => ({ ok: false, status: 0, draft: null }));
      tokenValid = probe.ok || (probe.status !== 401 && probe.status !== 403 && probe.status !== 0);
    }
    const data = {
      instance: conn.url,
      tenant: conn.tenantId,
      tenant_source: conn.tenantSource,
      credentials_dir: conn.credentialsDir,
      credentials_source: conn.credentialsSource,
      token_present: conn.hasToken,
      token_valid: tokenValid,
    };
    emit(
      data,
      Boolean(opts.json),
      [
        `instance:    ${data.instance}`,
        `tenant:      ${data.tenant} (${data.tenant_source})`,
        `credentials: ${data.credentials_dir} [${data.credentials_source}]`,
        `token:       ${data.token_present ? (tokenValid ? 'present, valid' : 'present, NOT accepted') : 'absent — run `revturbine login`'}`,
      ].join('\n'),
    );
  });

program
  .command('schema')
  .description('Emit the bundled RevTurbineConfig JSON schema for an agent to author against.')
  .option('--json', 'Accepted for symmetry; output is always JSON')
  .action(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsonSchema = (z as any).toJSONSchema(RevTurbineConfigSchema, { unrepresentable: 'any' });
      emit({ schema_version: SCHEMA_VERSION, schema: jsonSchema }, true);
    } catch (err) {
      fail(EXIT.UNEXPECTED, `could not render the bundled schema (${SCHEMA_VERSION}): ${(err as Error).message}`);
    }
  });

program
  .command('docs')
  .description('Print the canonical documentation URL (and open it in a browser when interactive).')
  .action(() => {
    process.stdout.write(`${DOCS_URL}\n`);
    if (process.stdout.isTTY) {
      const [cmd, args]: [string, string[]] =
        process.platform === 'win32'
          ? ['cmd', ['/c', 'start', '', DOCS_URL]]
          : process.platform === 'darwin'
            ? ['open', [DOCS_URL]]
            : ['xdg-open', [DOCS_URL]];
      try {
        spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
      } catch {
        // best-effort only
      }
    }
  });

// ── Download ─────────────────────────────────────────────────────────────────

program
  .command('download')
  .description('Fetch a config version from the server. Requires --live, --draft, or --release <id>.')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--draft', "The tenant's open draft (rendered on demand)")
  .option('--live', 'The current live Release')
  .option('--release <id>', 'A specific playbook version / Release')
  .addOption(new Option('-f, --format <format>', 'Representation').choices(['json', 'flatbuffer']).default('json'))
  .option('--save <file>', 'Write to <file> instead of stdout')
  .action(
    async (opts: {
      url: string;
      tenantId?: string;
      draft?: boolean;
      live?: boolean;
      release?: string;
      format: string;
      save?: string;
    }) => {
      const [sel] = requireSelectors(opts, [], { count: 1, allowed: ['draft', 'live', 'release'], command: 'download' });
      const conn = connect(opts.url, opts.tenantId);
      const playbookVersionId =
        sel.kind === 'release' ? sel.id : sel.kind === 'draft' ? await requireOpenDraft(conn) : undefined;

      if (opts.format === 'flatbuffer') {
        const qs = playbookVersionId ? `?playbookVersionId=${encodeURIComponent(playbookVersionId)}` : '';
        const res = await request(conn, `/api/config/bundle${qs}`);
        if (!res.ok) httpFail(conn, 'bundle download', res.status);
        const bytes = Buffer.from(await res.arrayBuffer());
        if (opts.save) {
          const out = path.resolve(opts.save);
          mkdirSync(path.dirname(out), { recursive: true });
          writeFileSync(out, bytes);
          diag(`✓ Wrote ${bytes.length} bytes → ${out}`);
        } else {
          process.stdout.write(`${bytes.toString('base64')}\n`);
        }
        return;
      }

      const config = await downloadConfig(conn, playbookVersionId);
      diag(`Downloaded: ${describePlaybookHeader(readPlaybookHeader(config))}`);
      const out = `${JSON.stringify(config, null, 2)}\n`;
      if (opts.save) {
        const file = path.resolve(opts.save);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, out);
        diag(`✓ Wrote ${file}`);
      } else {
        process.stdout.write(out);
      }
    },
  );

// ── Check ────────────────────────────────────────────────────────────────────

program
  .command('validate')
  .description('Validate a Playbook file offline (schema), or the open draft against the full server catalog (--draft).')
  .argument('[file...]', 'Path(s) to a Playbook file (offline mode)')
  .option('--draft', 'Validate the open draft server-side (full catalog)')
  .option('-u, --url <url>', 'RevTurbine instance URL (used with --draft)', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (files: string[], opts: { draft?: boolean; url: string; tenantId?: string }) => {
    if (opts.draft && files.length > 0) fail(EXIT.USAGE, 'validate takes either <file> or --draft, not both.');
    if (!opts.draft && files.length === 0) {
      throw new SelectorError('STATE_REQUIRED — validate needs a version: <file> (offline) or --draft (server catalog).');
    }

    if (!opts.draft) {
      // Fully offline (plan 131 TASK-8): the structural tier (Zod →
      // error_draft findings) plus the vendored shared semantic engine —
      // the file-computable subset of the same catalog the server runs.
      // `validate --draft` remains the authoritative full-catalog check.
      let blockedFiles = 0;
      for (const file of files) {
        const raw = loadConfig(file);
        // Shape-aware: a canonical Playbook is not described by the legacy
        // schema, so validating one against it reported "version is required".
        const { schema: fileSchema, shape } = schemaForConfig(raw);
        const parsed = fileSchema.safeParse(raw);
        const findings = evaluateOffline((parsed.success ? parsed.data : raw) as Record<string, unknown>, {
          structuralErrors: parsed.success ? undefined : parsed.error,
        });
        // plan 147 TASK-10 (OQ-1): also warn — never block — on unknown
        // top-level fields and deprecated fields. These are `warning` findings,
        // so they render alongside the catalog findings but leave the exit code
        // at 0 unless a real structural/semantic rule blocks.
        const allFindings: ValidationFinding[] = [
          ...(findings as unknown as ValidationFinding[]),
          ...offlineAdvisories(raw),
        ];
        diag(`Validation for ${file} (offline, ${shape} shape, schema ${SCHEMA_VERSION}):`);
        process.stdout.write(`${formatFindings(allFindings)}\n`);
        if (hasBlockingFindings(allFindings)) blockedFiles += 1;
      }
      if (files.length > 1) diag(`${files.length - blockedFiles}/${files.length} passed.`);
      if (blockedFiles > 0) {
        fail(EXIT.VALIDATION, `${blockedFiles} file(s) have blocking findings.`);
      }
      process.exit(0);
    }

    const conn = connect(opts.url, opts.tenantId);
    const playbookVersionId = await requireOpenDraft(conn);
    const result = await fetchValidation(conn.url, playbookVersionId, conn.headers);
    if (!result.ok) httpFail(conn, 'validate', result.status, result.error);

    diag(`Validation for the open draft (${playbookVersionId}):`);
    process.stdout.write(`${formatFindings(result.findings)}\n`);

    if (hasBlockingFindings(result.findings)) {
      const blocking = result.findings.filter((f) => f.severity === 'error_draft' || f.severity === 'error_launch');
      fail(EXIT.VALIDATION, `${blocking.length} blocking finding(s) — this draft cannot launch.`);
    }
    diag('✓ No blocking findings.');
  });

program
  .command('diff')
  .description('Compare two config versions (first → second; a file vs --draft/--live/--release previews the launch — the server side is the base). Dry-run, no writes.')
  .argument('[file...]', 'Local Playbook file path(s)')
  .option('--draft', "The tenant's open draft")
  .option('--live', 'The current live Release')
  .option('--release <id>', 'A specific playbook version / Release')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (files: string[], opts: { draft?: boolean; live?: boolean; release?: string; url: string; tenantId?: string }) => {
    const sels = requireSelectors(opts, files, { count: 2, allowed: ['file', 'draft', 'live', 'release'], command: 'diff' });
    // Launch-preview polarity (plan 171 TASK-11): a file vs a server-side
    // version diffs FROM the server state TO the file, so +/− read as
    // "created/pruned on launch" — see orderDiffSelectors.
    const ordered = orderDiffSelectors(sels);
    const needsServer = ordered.some((s) => s.kind !== 'file');
    const conn = needsServer ? connect(opts.url, opts.tenantId) : (null as unknown as Connection);
    const [a, b] = await Promise.all(ordered.map((s) => loadVersion(conn, s)));
    diag(`Diff (${ordered.map((s) => (s.kind === 'file' ? s.path : s.kind === 'release' ? `--release ${s.id}` : `--${s.kind}`)).join(' → ')}):`);
    process.stdout.write(`${formatDiff(diffExportedConfig(a, b))}\n`);
  });

program
  .command('show')
  .description(`Render a summary view of a config version. <kind> ∈ ${SHOW_KINDS.join(' | ')}.`)
  .argument('<kind>', `One of: ${SHOW_KINDS.join(', ')}`)
  .option('--file <path>', 'A local Playbook file')
  .option('--draft', "The tenant's open draft")
  .option('--live', 'The current live Release')
  .option('--release <id>', 'A specific playbook version / Release')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output')
  .action(
    async (
      kind: string,
      opts: { file?: string; draft?: boolean; live?: boolean; release?: string; url: string; tenantId?: string; json?: boolean },
    ) => {
      if (!SHOW_KINDS.includes(kind as ShowKind)) {
        fail(EXIT.USAGE, `unknown kind '${kind}' — use one of: ${SHOW_KINDS.join(', ')}.`);
      }
      const [sel] = requireSelectors(opts, [], { count: 1, allowed: ['file', 'draft', 'live', 'release'], command: 'show' });
      const needsServer = sel.kind !== 'file';
      const conn = needsServer ? connect(opts.url, opts.tenantId) : (null as unknown as Connection);
      const config = (await loadVersion(conn, sel)) as AnyRecord;
      const { data, text } = renderShow(kind as ShowKind, config);
      emit(data, Boolean(opts.json), text);
    },
  );

// ── Stage & launch ───────────────────────────────────────────────────────────

// Convergent-import controls (plan 155). Import is convergent by default (the
// file is the desired state): entities absent from it are removed, guarded
// against emptying / >50%-deleting a populated type. `--prune` confirms such a
// mass deletion; `--no-prune` keeps the old additive behavior. `opts.prune` is
// `undefined` with neither flag (guarded default), `true` for `--prune`,
// `false` for `--no-prune`. See `pruneQuery` in ./lib/prune.
const PRUNE_OPTION = ['--prune', 'Confirm a convergent delete past the mass-deletion guard (removes entities absent from the file)'] as const;
const NO_PRUNE_OPTION = ['--no-prune', 'Additive import — keep entities that are absent from the file (disables convergent delete)'] as const;

program
  .command('upload')
  .description('Stage a Playbook file as the open draft (POST /api/config/import).')
  .argument('<config>', 'Path to a Playbook file')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option(...PRUNE_OPTION)
  .option(...NO_PRUNE_OPTION)
  .action(async (configFile: string, opts: { url: string; tenantId?: string; prune?: boolean }) => {
    const config = verifyConfig(configFile);
    if (config === null) fail(EXIT.VALIDATION, `Fix the issues above in ${configFile}, then re-run.`);

    const conn = connect(opts.url, uploadTenantFor(opts.url, config, opts.tenantId));
    diag(`Staging ${configFile} as the open draft (${conn.url}/api/config/import) …`);
    const { res, json } = await postJson(conn, `/api/config/import${pruneQuery(opts.prune)}`, config);
    if (!res.ok) {
      // A 409 means a draft playbook version is already open for the tenant —
      // launch or discard it (Drafts & Releases) before importing.
      if (json && typeof json === 'object' && json.stage) {
        diagRaw(`  stage:  ${json.stage}`);
        diagRaw(`  detail: ${JSON.stringify(json.detail)}`);
      } else {
        diagRaw(`  ${JSON.stringify(json)}`);
      }
      httpFail(conn, 'upload', res.status);
    }

    const playbookVersionId = json?.playbook_version_id as string | undefined;
    diag(`✓ Staged ${configFile} as the open draft (${res.status})`);
    diagRaw(`  imported: ${JSON.stringify(json.imported ?? {})}`);
    if (playbookVersionId) diagRaw(`  playbook_version_id: ${playbookVersionId}`);
    diag('Launch it with `revturbine launch --draft`, or from the UI (Drafts & Releases).');
  });

program
  .command('launch')
  .description('Take a config live as a new Release: validate (launch gate), then submit → approve → deploy. Synchronous.')
  .argument('[file]', 'Playbook file to upload and launch directly')
  .option('--draft', 'Launch the already-open draft')
  .option('--force', 'Launch past incomplete-but-valid findings (error_launch); structural errors (error_draft) still block')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option(...PRUNE_OPTION)
  .option(...NO_PRUNE_OPTION)
  .option('--yes', 'Accepted for parity with discard/restore; launch has no confirmation prompt')
  .action(async (file: string | undefined, opts: { draft?: boolean; force?: boolean; url: string; tenantId?: string; yes?: boolean; prune?: boolean }) => {
    const [sel] = requireSelectors(opts, file ? [file] : [], { count: 1, allowed: ['file', 'draft'], command: 'launch' });

    let conn: Connection;
    let playbookVersionId: string;
    if (sel.kind === 'file') {
      const config = verifyConfig(sel.path);
      if (config === null) fail(EXIT.VALIDATION, `Fix the issues above in ${sel.path}, then re-run.`);
      conn = connect(opts.url, uploadTenantFor(opts.url, config, opts.tenantId));
      diag(`Staging ${sel.path} as the open draft …`);
      const { res, json } = await postJson(conn, `/api/config/import${pruneQuery(opts.prune)}`, config);
      if (!res.ok) {
        diagRaw(`  ${JSON.stringify(json)}`);
        httpFail(conn, 'upload', res.status);
      }
      playbookVersionId = json?.playbook_version_id as string;
      if (!playbookVersionId) fail(EXIT.SERVER, 'No playbook_version_id returned by the import — cannot launch.');
      diag(`✓ Staged (${playbookVersionId})`);
    } else {
      conn = connect(opts.url, opts.tenantId);
      playbookVersionId = await requireOpenDraft(conn);
    }
    await launchDraft(conn, playbookVersionId, !!opts.force);
  });

program
  .command('discard')
  .description('Discard (archive) the open draft so a fresh one can start.')
  .argument('[playbook-version-id]', 'A specific draft id (default: the open draft)')
  .option('--draft', 'The open draft (explicit form of the default)')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (id: string | undefined, opts: { draft?: boolean; url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const playbookVersionId = id ?? (await requireOpenDraft(conn));
    await confirmOrExit(`Discard draft ${playbookVersionId} on ${conn.url}?`, !!opts.yes);
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/archive`, {});
    if (!res.ok) httpFail(conn, 'discard', res.status, json);
    diag(`✓ Discarded draft ${playbookVersionId}.`);
  });

program
  .command('restore')
  .description('Stage a draft that restores a past release (from its frozen snapshot); `--launch` takes it live. Halts if a draft is already open.')
  .argument('<playbook-version-id>', 'The deployed playbook version to restore (see `history`)')
  .option('--launch', 'Launch the restoring draft immediately (gate + submit → approve → deploy)')
  .option('--force', 'With --launch, launch past incomplete-but-valid findings (error_launch); error_draft still blocks')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (playbookVersionId: string, opts: { launch?: boolean; force?: boolean; url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(
      `Restore playbook version ${playbookVersionId} on ${conn.url}?${opts.launch ? ' --launch will take it LIVE.' : ' (stages a draft; launch separately)'}`,
      !!opts.yes,
    );
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/rollback`, {});
    if (!res.ok) httpFail(conn, 'restore', res.status, json);
    const reverting = (json?.item?.id ?? json?.playbook_version_id) as string | undefined;
    diag(`✓ Staged a restoring draft from ${playbookVersionId}${reverting ? ` (${reverting})` : ''}.`);
    if (!opts.launch) {
      diag('Launch it with `revturbine launch --draft`, or discard it with `revturbine discard --yes`.');
      return;
    }
    if (!reverting) fail(EXIT.SERVER, 'No reverting draft id returned — cannot launch.');
    await launchDraft(conn, reverting, !!opts.force);
  });

// ── Inspect ──────────────────────────────────────────────────────────────────

program
  .command('status')
  .description('The current live Release and the open draft, side by side.')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output')
  .action(async (opts: { url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const drafts = await getJson(conn, '/api/optimization/drafts');
    if (!drafts.res.ok) httpFail(conn, 'draft lookup', drafts.res.status);
    const releases = await getJson(conn, '/api/optimization/releases');
    const items: AnyRecord[] = releases.res.ok && Array.isArray(releases.json?.items) ? releases.json.items : [];
    const live = items.find((r) => r.status === 'live') ?? items[0] ?? null;
    const draft: AnyRecord | null = drafts.json?.active ?? null;
    const parked: AnyRecord[] = Array.isArray(drafts.json?.parked) ? drafts.json.parked : [];

    const data = { live, draft, parked };
    const liveLine = live
      ? `v${live.version ?? '?'} "${live.playbook_version_name ?? live.name ?? ''}" (${live.playbook_version_id ?? live.id}) released ${live.released_at ?? '?'}`
      : '(none)';
    const draftLine = draft ? `"${draft.name ?? ''}" (${draft.id}) status ${draft.status ?? 'draft'}` : '(none)';
    emit(
      data,
      Boolean(opts.json),
      [
        `Live release: ${liveLine}`,
        `Open draft:   ${draftLine}`,
        `Parked:       ${parked.length === 0 ? '(none)' : `${parked.length} draft(s)`}`,
      ].join('\n'),
    );
  });

program
  .command('history')
  .description('The Release Version Log: recent Releases, newest first.')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output')
  .action(async (opts: { url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const { res, json } = await getJson(conn, '/api/optimization/releases');
    if (!res.ok) httpFail(conn, 'history', res.status);
    const items: AnyRecord[] = Array.isArray(json?.items) ? json.items : [];
    emit(
      items,
      Boolean(opts.json),
      table(
        items.map((r) => [
          `v${r.version ?? '?'}`,
          r.status ?? '',
          (r.released_at ?? '').slice(0, 19),
          r.playbook_version_name ?? r.name ?? '',
          r.playbook_version_id ?? r.id ?? '',
        ]),
      ),
    );
  });

program
  .command('preview')
  .description("The open draft's Runtime Impact summary (objects affected, billing impact) + field-level changes.")
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output')
  .action(async (opts: { url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const playbookVersionId = await requireOpenDraft(conn);
    const { res, json } = await getJson(conn, `/api/optimization/drafts/${playbookVersionId}/changes`);
    if (!res.ok) httpFail(conn, 'preview', res.status, json);
    const impact = (json?.impact ?? {}) as { byCategory?: Array<{ label: string; count: number }>; billing?: { objects?: string[] } };
    const changes = (Array.isArray(json?.changes) ? json.changes : []) as Array<AnyRecord>;
    const data = { playbook_version_id: playbookVersionId, impact, changes };
    const billingObjects = impact.billing?.objects ?? [];
    const text = [
      `Runtime impact (draft ${playbookVersionId}):`,
      table((impact.byCategory ?? []).map((c) => [c.label, `${c.count}`])),
      `Billing impact: ${billingObjects.length === 0 ? '(none)' : billingObjects.join(', ')}`,
      `Changes (${changes.length}):`,
      table(changes.map((c) => [String(c.action ?? ''), String(c.objectType ?? ''), String(c.objectName ?? ''), String(c.summary ?? '')])),
    ].join('\n');
    emit(data, Boolean(opts.json), text);
  });

program
  .command('evaluate')
  .description('Run placement/entitlement decisions for a user context against a config version. Requires --live, --draft, or --release <id>.')
  .option('--live', 'Evaluate the live configuration')
  .option('--draft', "Evaluate the tenant's open draft (clean-room: no suppression/cap history)")
  .option('--release <id>', 'Evaluate a past release (from its frozen snapshot)')
  .option('--entitlement <handle>', 'Check one entitlement (the checkEntitlement result)')
  .option('--slot <id>', 'Evaluate one surface slot (the getPlacement decision for that slot)')
  .option('--surface-type <type>', 'Disambiguate a slot that can render more than one surface (with --slot), or resolve by surface type alone')
  .option('--plan-handle <handle>', 'Evaluate as if the user were on this plan (overrides the ctx file)')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .requiredOption('--user <file>', 'JSON file: { user_id, customer_id?, plan_handle?, traits?, now_iso? }')
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(
    async (opts: {
      live?: boolean;
      draft?: boolean;
      release?: string;
      entitlement?: string;
      slot?: string;
      surfaceType?: string;
      planHandle?: string;
      url: string;
      user: string;
      tenantId?: string;
    }) => {
      const [sel] = requireSelectors(opts, [], { count: 1, allowed: ['draft', 'live', 'release'], command: 'evaluate' });
      const conn = connect(opts.url, opts.tenantId);
      if (!existsSync(opts.user)) fail(EXIT.USAGE, `user file not found: ${opts.user}`);
      let ctx: Record<string, unknown>;
      try {
        ctx = JSON.parse(readFileSync(opts.user, 'utf8')) as Record<string, unknown>;
      } catch (err) {
        fail(EXIT.VALIDATION, `invalid JSON in ${opts.user}: ${(err as Error).message}`);
      }

      const body: Record<string, unknown> = { ...ctx };
      if (opts.planHandle) body.plan_handle = opts.planHandle;
      // --entitlement / --slot narrow the ask; the ctx file's own lists apply
      // when neither is given (bulk evaluation). `--slot` (with optional
      // `--surface-type`) resolves the surface-keyed getPlacement decision on
      // the server (plan 147 TASK-17): it posts `slot_id` / `surface_type`, not
      // a placement id — the server returns the winning placement in `placement`.
      const wantsSlot = Boolean(opts.slot || opts.surfaceType);
      if (opts.entitlement && wantsSlot) {
        fail(EXIT.USAGE, 'pass exactly one of --entitlement or --slot/--surface-type (or neither for the ctx file lists).');
      }
      if (opts.entitlement) {
        body.entitlement_handles = [opts.entitlement];
        body.placement_ids = [];
      }
      if (wantsSlot) {
        if (opts.slot) body.slot_id = opts.slot;
        if (opts.surfaceType) body.surface_type = opts.surfaceType;
        body.placement_ids = [];
        body.entitlement_handles = [];
      }
      if (sel.kind === 'release') body.playbook_version_id = sel.id;
      if (sel.kind === 'draft') body.playbook_version_id = await requireOpenDraft(conn);

      const { res, json } = await postJson(conn, '/api/sdk/evaluate', body);
      if (!res.ok) httpFail(conn, 'evaluate', res.status, json);
      emit(json, true);
    },
  );

// ── Code generation ───────────────────────────────────────────────────────────
// `generate types` derives a typed entitlement-handle module from a config
// version so `can()` / `gate()` / `checkEntitlement()` call sites are
// compile-checked against the Playbook instead of passing free strings. Pure
// logic lives in lib/handles-codegen.ts; this action only resolves the version
// and writes the output.

const generateCmd = program
  .command('generate')
  .description('Code generation from a config version (see: generate types).');

generateCmd
  .command('types')
  .description(
    'Generate a TypeScript module of Playbook handles — entitlements (namespaced by type), plans, segments, surface-template ids, and ui-path action types — for type-safe call sites.',
  )
  .argument('[file...]', 'Path to a Playbook file')
  .option('--draft', "The tenant's open draft")
  .option('--live', 'The current live Release')
  .option('--release <id>', 'A specific playbook version / Release')
  .option('-o, --out <path>', 'Write the generated module to this path (parent dirs created); default stdout')
  .option('--json', 'Emit the handle map as JSON instead of TypeScript')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(
    async (
      files: string[],
      opts: {
        draft?: boolean;
        live?: boolean;
        release?: string;
        out?: string;
        json?: boolean;
        url: string;
        tenantId?: string;
      },
    ) => {
      const [sel] = requireSelectors(opts, files, {
        count: 1,
        allowed: ['file', 'draft', 'live', 'release'],
        command: 'generate types',
      });
      const conn = sel.kind !== 'file' ? connect(opts.url, opts.tenantId) : (null as unknown as Connection);
      const config = await loadVersion(conn, sel);

      // The regenerate command embedded in the generated header reconstructs
      // THIS invocation (selector + --out), so the file documents its own
      // refresh path. Deterministic — no timestamps.
      const selectorArg = sel.kind === 'file' ? sel.path : sel.kind === 'release' ? `--release ${sel.id}` : `--${sel.kind}`;
      const regenerate = ['revturbine generate types', selectorArg, ...(opts.out ? ['--out', opts.out] : [])].join(' ');
      const result = generateHandleTypes(config, { source: describeSelector(sel), regenerate });

      if (result.handles.length === 0) diag('No entitlement handles found in this config version.');
      const content = opts.json
        ? `${JSON.stringify({ source: describeSelector(sel), entitlements: result.byType }, null, 2)}\n`
        : result.ts;
      if (opts.out) {
        const resolved = path.resolve(opts.out);
        mkdirSync(path.dirname(resolved), { recursive: true });
        writeFileSync(resolved, content);
        diag(
          `✓ Wrote ${result.handles.length} handle(s) across ${Object.keys(result.byType).length} type(s) to ${opts.out}`,
        );
      } else {
        process.stdout.write(content);
      }
    },
  );

// ── Ingest keys ───────────────────────────────────────────────────────────────
// Public ingest keys are the embeddable SDK telemetry credentials a tenant hands
// to browser code. Minting/managing them was web-UI-only; plan 152 authorizes the
// CLI's `client` token on the endpoints so the CLI can do it too.

const ingestKeys = program
  .command('ingest-keys')
  .description('Manage public ingest keys (embeddable SDK telemetry credentials) for the tenant.');

ingestKeys
  .command('create')
  .description('Mint a public ingest key. The full token is printed ONCE and cannot be retrieved again.')
  .requiredOption('--origin <url...>', 'Allowed browser origin(s), e.g. https://app.example.com (repeatable; at least one required)')
  .option('--ip <cidr...>', 'Optional IP / CIDR allowlist (empty = no IP restriction)')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output (token on stdout for scripted capture)')
  .action(async (opts: { origin: string[]; ip?: string[]; url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const result = await createIngestKey(conn.url, conn.headers, { originAllowlist: opts.origin, ipAllowlist: opts.ip });
    if (!result.ok || !result.key) httpFail(conn, 'ingest-keys create', result.status, result.error);
    const key = result.key;
    if (opts.json) {
      emit(key, true);
      return;
    }
    // The token is the only copy — notice on stderr, token on stdout so a
    // `--json`-less run can still be read without the diagnostics interleaving.
    diag('✓ Minted a public ingest key. STORE THE TOKEN NOW — it is shown once and cannot be retrieved again.');
    emit(
      key,
      false,
      [
        `  id:      ${key.id}`,
        `  token:   ${key.token}`,
        `  origins: ${key.originAllowlist.join(', ')}`,
        key.ipAllowlist.length ? `  ips:     ${key.ipAllowlist.join(', ')}` : undefined,
      ]
        .filter((line): line is string => Boolean(line))
        .join('\n'),
    );
  });

ingestKeys
  .command('list')
  .description('List the active public ingest keys for the tenant (previews only — never the full token).')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output')
  .action(async (opts: { url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const result = await listIngestKeys(conn.url, conn.headers);
    if (!result.ok) httpFail(conn, 'ingest-keys list', result.status);
    emit(
      result.keys,
      Boolean(opts.json),
      result.keys.length ? result.keys.map(formatIngestKeyLine).join('\n') : '(no active ingest keys)',
    );
  });

ingestKeys
  .command('revoke')
  .description('Revoke a public ingest key by id. The key stops working immediately.')
  .argument('<id>', 'The ingest key id (see `revturbine ingest-keys list`)')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (id: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(`Revoke ingest key ${id} on ${conn.url}? The key stops working immediately.`, !!opts.yes);
    const result = await revokeIngestKey(conn.url, conn.headers, id);
    if (!result.ok) httpFail(conn, 'ingest-keys revoke', result.status);
    diag(`✓ Revoked ingest key ${id}.`);
  });

// Per-command examples surfaced in `revturbine <command> --help`.
const COMMAND_EXAMPLES: Record<string, string> = {
  download: [
    '',
    'Examples:',
    '  revturbine download --live --save ./revturbine.playbook.json     The live config → file',
    '  revturbine download --draft                         The open draft (rendered on demand) → stdout',
    '  revturbine download --release cs_1a2b3c --format flatbuffer --save ./bundle.fb',
  ].join('\n'),
  validate: [
    '',
    'Examples:',
    '  revturbine validate ./revturbine.playbook.json      Offline schema validation (no network)',
    '  revturbine validate --draft            Full server catalog against the open draft',
  ].join('\n'),
  diff: [
    '',
    'Examples:',
    '  revturbine diff ./revturbine.playbook.json --live   Local edits vs the live config',
    '  revturbine diff --live --draft         What the open draft would change',
  ].join('\n'),
  show: ['', 'Examples:', '  revturbine show plans --live', '  revturbine show segments --file ./revturbine.playbook.json'].join('\n'),
  generate: [
    '',
    'Examples:',
    '  revturbine generate types revturbine.playbook.json --out src/revturbine-handles.ts',
    '  revturbine generate types --live --out src/lib/revturbine-handles.gen.ts',
    '  revturbine generate types --draft --json',
    '',
    'The generated module exports `Entitlements` (handles namespaced by',
    'entitlement type) and the `EntitlementHandle` union for can()/gate()',
    'call sites. Its header records the exact command to regenerate it.',
  ].join('\n'),
  upload: ['', 'Example:', '  revturbine upload ./revturbine.playbook.json        Stage as the open draft'].join('\n'),
  launch: [
    '',
    'Examples:',
    '  revturbine launch ./revturbine.playbook.json        Upload, gate, and go live',
    '  revturbine launch --draft              Launch the already-open draft',
  ].join('\n'),
  evaluate: [
    '',
    'Example:',
    '  revturbine evaluate --live --user ./ctx.json --entitlement seats',
    '  revturbine evaluate --draft --user ./ctx.json --slot upgrade_banner --plan-handle pro',
    '    ctx.json: { "user_id": "u1", "plan_handle": "pro", "entitlement_handles": ["seats"] }',
  ].join('\n'),
};
for (const [name, text] of Object.entries(COMMAND_EXAMPLES)) {
  program.commands.find((c) => c.name() === name)?.addHelpText('after', text);
}

/**
 * Locate the CLI pinned by THIS PROJECT, walking up from cwd but stopping at
 * the project boundary.
 *
 * The bound is the point. An unbounded walk resolves the way Node does — all
 * the way to the filesystem root — and a stray `~/node_modules/@revturbine/cli`
 * then hijacks every invocation anywhere under the home directory. That is not
 * hypothetical: this machine had `C:/Users/kentg/node_modules/@revturbine/cli`
 * at 0.2.1 (schema 0.1.84), and an unbounded search silently delegated to it
 * from an unrelated temp directory. Delegating to a CLI the project never
 * asked for is worse than not delegating at all.
 *
 * Boundary = the git repository root, which is also the monorepo root, so a
 * hoisted install in a workspace still resolves. Outside a git repo, only cwd
 * itself is considered.
 */
function findRepoPinnedCli(from: string): { entry: string; version: string } | null {
  const start = path.resolve(from);
  const stopAt = gitRootOf(start) ?? start;

  let dir = start;
  for (;;) {
    const pkgDir = path.join(dir, 'node_modules', '@revturbine', 'cli');
    const pkgJson = path.join(pkgDir, 'package.json');
    if (existsSync(pkgJson)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJson, 'utf8')) as { version?: string; bin?: unknown };
        const rel = typeof pkg.bin === 'string' ? pkg.bin : (pkg.bin as Record<string, string>)?.revturbine;
        if (rel) {
          const entry = path.resolve(pkgDir, rel);
          if (existsSync(entry)) return { entry, version: pkg.version ?? '0.0.0' };
        }
      } catch {
        // A malformed pinned install must not break the global CLI — fall
        // through and run ourselves.
      }
      return null;
    }
    // Stop AT the project boundary — never above it.
    if (dir === stopAt) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Nearest ancestor containing `.git`, or null when not inside a repo. */
function gitRootOf(from: string): string | null {
  let dir = path.resolve(from);
  for (;;) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// Self-delegation (plan 142 REQ-14): hand off to the version this repo pins,
// because the bundled schema snapshot is pinned with it. Everything about the
// decision lives in lib/delegate.ts; this is only the IO.
{
  const ownEntry = fileURLToPath(import.meta.url);
  const decision = planDelegation({
    ownEntry,
    ownVersion: pkgVersion,
    local: findRepoPinnedCli(process.cwd()),
    env: process.env,
    argv: process.argv,
  });
  if (decision.delegate) {
    if (decision.skew) diag(skewNotice(decision.skew));
    const child = spawnSync(process.execPath, [decision.target, ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: { ...process.env, [DELEGATION_ENV]: '1' },
    });
    process.exit(child.status ?? EXIT.UNEXPECTED);
  }
}

// -V/--version is answered pre-parse (same pattern as the delegation flag) so
// the repo pin-drift warning (plan 174 TASK-12) can ride along on stderr —
// commander's built-in .version() would print and exit before any hook.
if (process.argv.includes('-V') || process.argv.includes('--version')) {
  process.stdout.write(`${pkgVersion} (schema ${SCHEMA_VERSION})\n`);
  try {
    const pkgPath = path.resolve('package.json');
    if (existsSync(pkgPath)) {
      for (const warning of checkPinDrift(JSON.parse(readFileSync(pkgPath, 'utf8')))) {
        diag(`⚠ pin drift: ${warning}`);
      }
    }
  } catch {
    // Best-effort — an unreadable package.json never breaks --version.
  }
  process.exit(EXIT.OK);
}

program.exitOverride();
try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err instanceof CommanderError) {
    if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version' || err.code === 'commander.help') {
      process.exit(0);
    }
    process.exit(EXIT.USAGE);
  }
  if (err instanceof SelectorError) {
    console.error(`[revturbine] ✗ ${err.message}`);
    process.exit(EXIT.USAGE);
  }
  console.error(`[revturbine] ✗ ${(err as Error).message}`);
  process.exit(EXIT.UNEXPECTED);
}
