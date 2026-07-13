/**
 * revturbine — verify RevTurbine Config Files and load them into a RevTurbine
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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';

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
import { fetchValidation, formatFindings, hasBlockingFindings } from './lib/config-validate';
import { resolveActiveDraft } from './lib/drafts';
import { classFromStatus, diag, diagRaw, emit, EXIT, fail, isNetworkError } from './lib/output';
import { requireSelectors, SelectorError, type VersionSelector } from './lib/selectors';

const DOCS_URL = 'https://github.com/revt-eng/revturbine-cli#readme';
// Default RevTurbine instance. Includes the `/app` subfolder basePath (plan 85)
// so API calls resolve to `…/app/api/…`. Uses the bare apex `revturbine.com`,
// which is the canonical host (2026-07-09): `www.revturbine.com` now
// 308-redirects TO the apex, and that cross-origin redirect strips the
// `Authorization` header, which would 401 every authenticated command — so
// target the apex directly and never the `www` host.
const DEFAULT_URL = 'https://revturbine.com/app';

// ── Schema (vendored snapshot — mandatory, offline) ─────────────────────────────

type ParsedSchema = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };
};

const schema = RevTurbineConfigSchema as ParsedSchema;

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

/** Returns the validated config, or null (logging the exact failing paths). */
function verifyConfig(file: string): unknown | null {
  const parsed = loadConfig(file);
  const result = schema.safeParse(parsed);
  if (result.success) {
    diag(`✓ ${file}: schema validation passed`);
    return result.data;
  }
  diag(`✗ ${file}: schema validation FAILED:`);
  for (const issue of result.error.issues) {
    diagRaw(`  ${issue.path.join('.') || '<root>'}: ${issue.message}`);
  }
  return null;
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

/** Download a config version's JSON; `playbookVersionId` scopes a draft/Release. */
async function downloadConfig(conn: Connection, playbookVersionId?: string): Promise<unknown> {
  const qs = playbookVersionId ? `?playbookVersionId=${encodeURIComponent(playbookVersionId)}` : '';
  const res = await request(conn, `/api/config/export${qs}`);
  if (!res.ok) httpFail(conn, 'download', res.status);
  return res.json().catch(() => ({}));
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
async function launchDraft(conn: Connection, playbookVersionId: string): Promise<void> {
  diag(`Launch gate: validating draft ${playbookVersionId} …`);
  const validation = await fetchValidation(conn.url, playbookVersionId, conn.headers);
  if (!validation.ok) httpFail(conn, 'validate', validation.status, validation.error);
  if (validation.findings.length > 0) diagRaw(formatFindings(validation.findings));
  if (hasBlockingFindings(validation.findings)) {
    fail(EXIT.VALIDATION, 'blocking findings — this draft cannot launch.');
  }

  diag(`Launching playbook version ${playbookVersionId} (submit → approve → deploy) …`);
  for (const step of ['submit', 'approve', 'deploy'] as const) {
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/${step}`, {});
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
  Auth & meta   login, logout, signup, whoami, schema, docs
  Download      download
  Check         validate, diff, show
  Stage/launch  upload, launch, discard, restore
  Inspect       status, history, preview, evaluate

Version selectors (no defaults — a command that reads a config requires one):
  <file>            a local Config File (positional, or --file <path>)
  --draft           the tenant's single open draft (resolved automatically)
  --live            the current live Release
  --release <id>    a specific playbook version / Release

Common workflows:
  # Author, validate, and ship against the default instance (revturbine.com/app)
  revturbine login
  revturbine download --live --save ./config.json
  revturbine validate ./config.json
  revturbine diff ./config.json --live
  revturbine launch ./config.json

  # Manual review flow (stage → inspect → launch)
  revturbine upload ./config.json          # stage as the open draft
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
  .description('Validate RevTurbine Config Files and ship them through the playbook-version lifecycle (draft → Release).')
  .version(`${pkgVersion} (schema ${SCHEMA_VERSION})`, '-V, --version', 'Print the revturbine and bundled schema versions')
  .showHelpAfterError()
  .addHelpText('after', HELP_AFTER);

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
  .description('Validate a Config File offline (schema), or the open draft against the full server catalog (--draft).')
  .argument('[file...]', 'Path(s) to a Config File (offline mode)')
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
        const parsed = schema.safeParse(raw);
        const findings = evaluateOffline((parsed.success ? parsed.data : raw) as Record<string, unknown>, {
          structuralErrors: parsed.success ? undefined : parsed.error,
        });
        diag(`Validation for ${file} (offline, schema ${SCHEMA_VERSION}):`);
        process.stdout.write(`${formatFindings(findings as never)}\n`);
        if (hasBlockingFindings(findings as never)) blockedFiles += 1;
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
  .description('Compare two config versions (first → second). Dry-run, no writes.')
  .argument('[file...]', 'Local Config File path(s)')
  .option('--draft', "The tenant's open draft")
  .option('--live', 'The current live Release')
  .option('--release <id>', 'A specific playbook version / Release')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (files: string[], opts: { draft?: boolean; live?: boolean; release?: string; url: string; tenantId?: string }) => {
    const sels = requireSelectors(opts, files, { count: 2, allowed: ['file', 'draft', 'live', 'release'], command: 'diff' });
    const needsServer = sels.some((s) => s.kind !== 'file');
    const conn = needsServer ? connect(opts.url, opts.tenantId) : (null as unknown as Connection);
    const [a, b] = await Promise.all(sels.map((s) => loadVersion(conn, s)));
    diag(`Diff (${sels.map((s) => (s.kind === 'file' ? s.path : s.kind === 'release' ? `--release ${s.id}` : `--${s.kind}`)).join(' → ')}):`);
    process.stdout.write(`${formatDiff(diffExportedConfig(a, b))}\n`);
  });

program
  .command('show')
  .description(`Render a summary view of a config version. <kind> ∈ ${SHOW_KINDS.join(' | ')}.`)
  .argument('<kind>', `One of: ${SHOW_KINDS.join(', ')}`)
  .option('--file <path>', 'A local Config File')
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

program
  .command('upload')
  .description('Stage a Config File as the open draft (POST /api/config/import).')
  .argument('<config>', 'Path to a Config File')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (configFile: string, opts: { url: string; tenantId?: string }) => {
    const config = verifyConfig(configFile);
    if (config === null) fail(EXIT.VALIDATION, `Fix the issues above in ${configFile}, then re-run.`);

    const conn = connect(opts.url, opts.tenantId);
    diag(`Staging ${configFile} as the open draft (${conn.url}/api/config/import) …`);
    const { res, json } = await postJson(conn, '/api/config/import', config);
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
  .argument('[file]', 'Config File to upload and launch directly')
  .option('--draft', 'Launch the already-open draft')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Accepted for parity with discard/restore; launch has no confirmation prompt')
  .action(async (file: string | undefined, opts: { draft?: boolean; url: string; tenantId?: string; yes?: boolean }) => {
    const [sel] = requireSelectors(opts, file ? [file] : [], { count: 1, allowed: ['file', 'draft'], command: 'launch' });
    const conn = connect(opts.url, opts.tenantId);

    let playbookVersionId: string;
    if (sel.kind === 'file') {
      const config = verifyConfig(sel.path);
      if (config === null) fail(EXIT.VALIDATION, `Fix the issues above in ${sel.path}, then re-run.`);
      diag(`Staging ${sel.path} as the open draft …`);
      const { res, json } = await postJson(conn, '/api/config/import', config);
      if (!res.ok) {
        diagRaw(`  ${JSON.stringify(json)}`);
        httpFail(conn, 'upload', res.status);
      }
      playbookVersionId = json?.playbook_version_id as string;
      if (!playbookVersionId) fail(EXIT.SERVER, 'No playbook_version_id returned by the import — cannot launch.');
      diag(`✓ Staged (${playbookVersionId})`);
    } else {
      playbookVersionId = await requireOpenDraft(conn);
    }
    await launchDraft(conn, playbookVersionId);
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
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (playbookVersionId: string, opts: { launch?: boolean; url: string; tenantId?: string; yes?: boolean }) => {
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
    await launchDraft(conn, reverting);
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
  .description("The open draft's staged changes (runtime-impact summary once plan 78 lands).")
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--json', 'Machine-readable output (default shape is already JSON)')
  .action(async (opts: { url: string; tenantId?: string; json?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    const playbookVersionId = await requireOpenDraft(conn);
    const { res, json } = await getJson(conn, `/api/playbook-versions/${playbookVersionId}/preview`);
    if (!res.ok) httpFail(conn, 'preview', res.status, json);
    emit(json, true);
  });

program
  .command('evaluate')
  .description("Run the live config's placement/entitlement decisions for a user context (from a JSON file). Draft/Release-targeted evaluation lands with plan 131 TASK-7.")
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .requiredOption('--user <file>', 'JSON file: { user_id, customer_id?, plan_handle?, placement_ids?, entitlement_handles?, traits?, now_iso? }')
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (opts: { url: string; user: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    if (!existsSync(opts.user)) fail(EXIT.USAGE, `user file not found: ${opts.user}`);
    let body: unknown;
    try {
      body = JSON.parse(readFileSync(opts.user, 'utf8'));
    } catch (err) {
      fail(EXIT.VALIDATION, `invalid JSON in ${opts.user}: ${(err as Error).message}`);
    }
    const { res, json } = await postJson(conn, '/api/sdk/evaluate', body);
    if (!res.ok) httpFail(conn, 'evaluate', res.status, json);
    emit(json, true);
  });

// Per-command examples surfaced in `revturbine <command> --help`.
const COMMAND_EXAMPLES: Record<string, string> = {
  download: [
    '',
    'Examples:',
    '  revturbine download --live --save ./config.json     The live config → file',
    '  revturbine download --draft                         The open draft (rendered on demand) → stdout',
    '  revturbine download --release cs_1a2b3c --format flatbuffer --save ./bundle.fb',
  ].join('\n'),
  validate: [
    '',
    'Examples:',
    '  revturbine validate ./config.json      Offline schema validation (no network)',
    '  revturbine validate --draft            Full server catalog against the open draft',
  ].join('\n'),
  diff: [
    '',
    'Examples:',
    '  revturbine diff ./config.json --live   Local edits vs the live config',
    '  revturbine diff --live --draft         What the open draft would change',
  ].join('\n'),
  show: ['', 'Examples:', '  revturbine show plans --live', '  revturbine show segments --file ./config.json'].join('\n'),
  upload: ['', 'Example:', '  revturbine upload ./config.json        Stage as the open draft'].join('\n'),
  launch: [
    '',
    'Examples:',
    '  revturbine launch ./config.json        Upload, gate, and go live',
    '  revturbine launch --draft              Launch the already-open draft',
  ].join('\n'),
  evaluate: [
    '',
    'Example:',
    '  revturbine evaluate --url <url> --user ./ctx.json',
    '    ctx.json: { "user_id": "u1", "plan_handle": "pro", "entitlement_handles": ["seats"] }',
  ].join('\n'),
};
for (const [name, text] of Object.entries(COMMAND_EXAMPLES)) {
  program.commands.find((c) => c.name() === name)?.addHelpText('after', text);
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
