/**
 * revturbine — verify RevTurbine ExportedConfig files and load them into a
 * RevTurbine instance through the Change Set lifecycle.
 *
 * Configs are canonical ExportedConfig JSON files, addressed by path.
 *
 * Verification is MANDATORY and fully offline: configs are validated against a
 * vendored, version-stamped snapshot of ExportedConfigSchema (./schema/), so the
 * tool never uploads a config it could not validate and needs no access to any
 * private schema package or source tree.
 *
 * Loading a config is a Change Set: `upload` STAGES it as a draft
 * (POST /api/config/import → change_set_id); deploying walks the lifecycle
 * submit → approve → deploy so it becomes the live configuration (and stays
 * rollback-able). Auth uses a token from `login` (RFC 8628 device flow),
 * persisted at ~/.revturbine/credentials.json (0600).
 *
 *   revturbine <command> --help
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline/promises';

import { Command, Option } from 'commander';

import { ExportedConfigSchema } from './schema/exported-config.snapshot.mjs';
import { SCHEMA_VERSION } from './schema/version';
import { getCredential, normalizeBaseUrl, removeCredential, resolveConfigDir } from './lib/credentials';
import { deviceLogin } from './lib/device-auth';
import { signup } from './lib/signup';
import { diffExportedConfig, formatDiff } from './lib/config-diff';
import { fetchValidation, formatFindings, hasBlockingFindings } from './lib/config-validate';

const LOG = '[revturbine]';
// Default RevTurbine instance. Includes the `/app` subfolder basePath (plan 85)
// so API calls resolve to `…/app/api/…`. Uses `www` deliberately: the apex
// `revturbine.com` 308-redirects to `www`, and a cross-origin redirect strips
// the `Authorization` header, which would 401 every authenticated command.
const DEFAULT_URL = 'https://www.revturbine.com/app';

// ── Schema (vendored snapshot — mandatory, offline) ─────────────────────────────

type ParsedSchema = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };
};

const schema = ExportedConfigSchema as ParsedSchema;

// ── Config loading (by explicit path) ───────────────────────────────────────────

function loadConfig(file: string): unknown {
  const resolved = path.resolve(file);
  if (!existsSync(resolved)) {
    console.error(`${LOG} Config not found: ${resolved}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(resolved, 'utf8'));
  } catch (err) {
    console.error(`${LOG} invalid JSON in ${resolved}: ${(err as Error).message}`);
    process.exit(1);
  }
}

/** Returns the validated config, or null (logging the exact failing paths). */
function verifyConfig(file: string): unknown | null {
  const parsed = loadConfig(file);
  const result = schema.safeParse(parsed);
  if (result.success) {
    console.log(`${LOG} ✓ ${file}: schema validation passed`);
    return result.data;
  }
  console.error(`${LOG} ✗ ${file}: schema validation FAILED:`);
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join('.') || '<root>'}: ${issue.message}`);
  }
  return null;
}

// ── Auth / HTTP ──────────────────────────────────────────────────────────────

interface Connection {
  url: string;
  tenantId: string;
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
  console.log(`${LOG} Tenant ${tenantId} (${tenantSource}); credentials: ${dir} [${source}].`);
  if (source === 'global') {
    console.warn(
      `${LOG} WARNING: using the global ${dir} - NOT worktree-scoped. ` +
        `If this session is for a specific customer, run from that customer's worktree ` +
        `(with its own .revturbine/) so a stale login can't target the wrong tenant.`,
    );
  }
  return {
    url,
    tenantId,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...(cred ? { Authorization: `Bearer ${cred.token}` } : {}),
    },
  };
}

function authHint(url: string, status: number): void {
  if (status === 401 || status === 403) {
    console.error(
      `\n${LOG} Authentication required for ${url}. Log in with:\n` +
        `  revturbine login ${url}`,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function postJson(conn: Connection, pathname: string, body: unknown): Promise<{ res: Response; json: any }> {
  const res = await fetch(`${conn.url}${pathname}`, {
    method: 'POST',
    headers: conn.headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

/**
 * Walk the Change Set lifecycle submit → approve → deploy. The deploy step is
 * async on the server (Inngest), so success means "activation requested".
 */
async function activateChangeSet(conn: Connection, changeSetId: string): Promise<void> {
  console.log(`\n${LOG} Activating change set ${changeSetId} (submit → approve → deploy) …`);
  for (const step of ['submit', 'approve', 'deploy'] as const) {
    const { res, json } = await postJson(conn, `/api/changesets/${changeSetId}/${step}`, {});
    if (!res.ok) {
      console.error(`${LOG} ✗ ${step} failed (${res.status}). The draft is staged but NOT live.`);
      console.error(`  ${JSON.stringify(json)}`);
      console.error(`  Finish it from the UI (Drafts & Releases): change set ${changeSetId}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`  ✓ ${step}`);
  }
  console.log(`${LOG} ✓ Deploy requested — the change set is activating as the live configuration.`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getJson(conn: Connection, pathname: string): Promise<{ res: Response; json: any }> {
  const res = await fetch(`${conn.url}${pathname}`, { headers: conn.headers });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

/** Download the tenant's live ExportedConfig JSON; returns `{}` on a non-OK status. */
async function downloadLiveConfig(
  conn: Connection,
  changeSetId?: string,
): Promise<{ res: Response; config: unknown }> {
  const qs = changeSetId ? `?changeSetId=${encodeURIComponent(changeSetId)}` : '';
  const res = await fetch(`${conn.url}/api/config/export${qs}`, { headers: conn.headers });
  const config = res.ok ? await res.json().catch(() => ({})) : {};
  return { res, config };
}

/**
 * Gate a destructive operation: proceed immediately when `--yes`, otherwise
 * prompt interactively. With no TTY and no `--yes`, refuse (scripts must opt in).
 */
async function confirmOrExit(promptText: string, yes: boolean): Promise<void> {
  if (yes) return;
  if (!process.stdin.isTTY) {
    console.error(`${LOG} Refusing a destructive action without confirmation (no TTY). Pass --yes.`);
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${promptText} [y/N] `)).trim().toLowerCase();
  rl.close();
  if (answer !== 'y' && answer !== 'yes') {
    console.log(`${LOG} Aborted.`);
    process.exit(0);
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

const pkgVersion =
  (createRequire(import.meta.url)('../package.json') as { version?: string }).version ?? '0.0.0';

// Appended to `revturbine --help`: command groups, copy-pasteable workflows,
// and the auth model. Mirrors the README — keep them in sync.
const HELP_AFTER = `
Command groups:
  Auth          login, logout
  Validate      verify, diff
  Stage/deploy  upload, deploy
  Inspect       status, preview, export
  Lifecycle     submit, approve, reject, discard, rollback
  Runtime/ops   evaluate, promote

Common workflows:
  # Author, validate, and ship against the default instance (www.revturbine.com/app)
  revturbine login
  revturbine verify ./export-config.json
  revturbine diff ./export-config.json
  revturbine upload ./export-config.json --deploy

  # Target a different instance — pass its URL (include the /app path)
  revturbine login https://app.example.com/app
  revturbine upload ./export-config.json --url https://app.example.com/app --deploy

  # Manual review flow (stage → inspect → submit → approve → deploy)
  revturbine upload ./export-config.json    # stage a draft change set
  revturbine preview <change-set-id>        # inspect runtime impact
  revturbine submit  <change-set-id>
  revturbine approve <change-set-id>
  revturbine deploy  <change-set-id>

  # Inspect and roll back
  revturbine status
  revturbine rollback <change-set-id>

Default instance:
  --url and the \`login\` argument default to https://www.revturbine.com/app —
  the /app subfolder is required for API routing. Pass an explicit URL (with its
  /app path) to target another instance.

Auth:
  Most commands need a token — run \`login\` first. Credentials live at
  ~/.revturbine/credentials.json (0600); the token's tenant is used by default,
  override with -t/--tenant-id. Mutating commands (discard, rollback, promote)
  prompt for confirmation unless --yes.

Full reference: https://github.com/revt-eng/revturbine-cli#commands
`;

const program = new Command();

program
  .name('revturbine')
  .description('Verify ExportedConfig files and load them into a RevTurbine instance via Change Sets.')
  .version(`${pkgVersion} (schema ${SCHEMA_VERSION})`, '-V, --version', 'Print the revturbine and bundled schema versions')
  .showHelpAfterError()
  .addHelpText('after', HELP_AFTER);

program
  .command('login')
  .description('Authorize this machine via the browser (device flow) and store a token for the instance (default: the production instance).')
  .argument('[url]', `RevTurbine instance URL (default: ${DEFAULT_URL})`)
  .action(async (url: string | undefined) => {
    try {
      await deviceLogin(normalizeBaseUrl(url ?? DEFAULT_URL));
    } catch (err) {
      console.error(`${LOG} ✗ Login failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

/** Prompt for one line of input. */
async function promptLine(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Prompt for a secret, masking the echoed characters. */
function promptHidden(question: string): Promise<string> {
  const { stdin, stdout } = process;
  // No TTY (piped/CI) -> fall back to a normal line read; there's no terminal
  // echo to mask anyway, and scripts should prefer the --password flag.
  if (!stdin.isTTY) return promptLine(question);

  return new Promise<string>((resolve) => {
    stdout.write(question);
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
          stdout.write('\n');
          resolve(input.trim());
          return;
        }
        if (code === 3) {
          // Ctrl-C (ETX) -> abort the way the shell would
          cleanup();
          stdout.write('\n');
          process.exit(130);
        }
        if (code === 127 || code === 8) {
          // Backspace / Delete -> erase one masked char
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
          continue;
        }
        input += ch;
        stdout.write('*');
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
        console.error(`${LOG} ✗ Name, email, and a password of at least 8 characters are required.`);
        process.exit(1);
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
    } catch (err) {
      console.error(`${LOG} ✗ Signup failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Remove the stored token for <url>.')
  .argument('[url]', `RevTurbine instance URL (default: ${DEFAULT_URL})`)
  .action((url: string | undefined) => {
    const normalized = normalizeBaseUrl(url ?? DEFAULT_URL);
    const removed = removeCredential(normalized);
    console.log(removed ? `${LOG} Logged out of ${normalized}.` : `${LOG} No stored credential for ${normalized}.`);
  });

program
  .command('verify')
  .description('Schema-validate one or more ExportedConfig files (offline).')
  .argument('<config...>', 'Path(s) to an export-config.json file')
  .action((configs: string[]) => {
    const failures = configs.filter((file) => verifyConfig(file) === null).length;
    if (configs.length > 1) console.log(`\n${LOG} ${configs.length - failures}/${configs.length} passed.`);
    process.exit(failures > 0 ? 1 : 0);
  });

program
  .command('diff')
  .description("Non-destructive: download the tenant's live config, diff against the local config, and dry-run the import.")
  .argument('<config>', 'Path to an export-config.json file')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (configFile: string, opts: { url: string; tenantId?: string }) => {
    const config = verifyConfig(configFile);
    if (config === null) process.exit(1);

    const conn = connect(opts.url, opts.tenantId);
    console.log(`\n${LOG} Comparing ${configFile} against ${conn.url} (tenant ${conn.tenantId})…`);

    const { res: exportRes, config: current } = await downloadLiveConfig(conn);
    if (!exportRes.ok && (exportRes.status === 401 || exportRes.status === 403)) {
      console.error(`${LOG} ✗ Could not download current config (${exportRes.status}).`);
      authHint(conn.url, exportRes.status);
      process.exit(1);
    } else if (!exportRes.ok) {
      console.log(`${LOG} (no current config — HTTP ${exportRes.status}; treating tenant as empty)`);
    }

    console.log(`\n${LOG} Diff (local vs tenant):`);
    console.log(formatDiff(diffExportedConfig(current, config)));

    const { res: dryRes, json: dry } = await postJson(conn, '/api/config/import?dryRun=true', config);
    console.log(`\n${LOG} Dry-run checks:`, JSON.stringify(dry.checks ?? dry, null, 2));
    const conflicts = Array.isArray(dry.conflicts) ? dry.conflicts : [];
    if (conflicts.length) {
      console.error(`\n${LOG} ✗ ${conflicts.length} uniqueness conflict(s):`);
      for (const c of conflicts) {
        const why =
          c.scope === 'existing'
            ? `handle already used by ${c.existing_id}`
            : `duplicated within the config (${c.config_id})`;
        console.error(`  - ${c.collection}.${c.handle}: ${why}`);
      }
    }
    if (!dryRes.ok || dry.ok === false) {
      authHint(conn.url, dryRes.status);
      console.error(`\n${LOG} Dry-run found problems. Fix them before uploading.`);
      process.exit(1);
    }
    console.log(
      `\n${LOG} ✓ No conflicts. Stage it with:\n` +
        `  revturbine upload ${configFile} --url ${conn.url} --deploy`,
    );
  });

program
  .command('upload')
  .description('Stage an ExportedConfig file as a draft Change Set (POST /api/config/import). Use --deploy to also activate it.')
  .argument('<config>', 'Path to an export-config.json file')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .addOption(new Option('--deploy', 'After staging, activate the draft (submit → approve → deploy)'))
  .action(async (configFile: string, opts: { url: string; tenantId?: string; deploy?: boolean }) => {
    const config = verifyConfig(configFile);
    if (config === null) {
      console.error(`\n${LOG} Fix the issues above in ${configFile}, then re-run.`);
      process.exit(1);
    }

    const conn = connect(opts.url, opts.tenantId);
    console.log(`\n${LOG} Staging ${configFile} into a draft change set (${conn.url}/api/config/import) …`);
    const { res, json } = await postJson(conn, '/api/config/import', config);
    if (!res.ok) {
      console.error(`${LOG} ✗ Upload failed (${res.status})`);
      // A 409 on change_sets_one_active_draft_per_tenant means a draft is already
      // open — deploy or discard it (Drafts & Releases) before importing.
      if (json && typeof json === 'object' && json.stage) {
        console.error(`  stage:  ${json.stage}`);
        console.error(`  detail: ${JSON.stringify(json.detail)}`);
      } else {
        console.error(`  ${JSON.stringify(json)}`);
      }
      authHint(conn.url, res.status);
      process.exit(1);
    }

    const changeSetId = json?.change_set_id as string | undefined;
    console.log(`${LOG} ✓ Staged ${configFile} as a draft change set (${res.status})`);
    console.log(`  imported: ${JSON.stringify(json.imported ?? {})}`);
    if (changeSetId) console.log(`  change_set_id: ${changeSetId}`);

    if (!opts.deploy) {
      console.log(
        `\n${LOG} Staged as a draft. Activate it with:\n` +
          (changeSetId
            ? `  revturbine deploy ${changeSetId} --url ${conn.url}\n`
            : '') +
          '  …or from the RevTurbine UI (Drafts & Releases).',
      );
      return;
    }
    if (!changeSetId) {
      console.warn(`${LOG} No change_set_id returned — server predates the staged-import model; nothing to deploy.`);
      return;
    }
    await activateChangeSet(conn, changeSetId);
  });

program
  .command('deploy')
  .description('Activate a staged draft Change Set: submit → approve → deploy.')
  .argument('<change-set-id>', 'The change_set_id returned by `upload`')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  // Accepted for flag parity with the other mutating commands (discard/rollback);
  // deploy has no confirmation prompt, so --yes is a no-op rather than an error.
  .option('--yes', 'Accepted for parity with discard/rollback; deploy has no confirmation prompt')
  .action(async (changeSetId: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await activateChangeSet(conn, changeSetId);
  });

program
  .command('validate')
  .description('Run config-validation against a staged draft. Prints findings; exits non-zero if any block.')
  .argument('<change-set-id>', 'The change_set_id to validate')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (changeSetId: string, opts: { url: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const result = await fetchValidation(conn.url, changeSetId, conn.headers);
    if (!result.ok) {
      console.error(`${LOG} ✗ validate failed (${result.status})${result.error ? `: ${result.error}` : ''}`);
      authHint(conn.url, result.status);
      process.exit(1);
    }

    console.log(`\n${LOG} Validation for change set ${changeSetId}:`);
    console.log(formatFindings(result.findings));

    if (hasBlockingFindings(result.findings)) {
      const blocking = result.findings.filter((f) => f.severity === 'error_draft' || f.severity === 'error_publish');
      console.error(`${LOG} ✗ ${blocking.length} blocking finding(s) — this draft cannot be deployed.`);
      process.exit(1);
    }
    console.log(`${LOG} ✓ No blocking findings.`);
  });

program
  .command('export')
  .description("Download the tenant's live config. JSON to stdout by default; --save <file> writes it to disk.")
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .addOption(new Option('-f, --format <format>', 'Representation').choices(['json', 'flatbuffer']).default('json'))
  .option('--save <file>', 'Write the downloaded config (json) or bundle (flatbuffer) to <file> instead of stdout')
  .option('--change-set <id>', 'Export a specific change set (default: the active change set)')
  .action(async (opts: { url: string; tenantId?: string; format: string; save?: string; changeSet?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const qs = opts.changeSet ? `?changeSetId=${encodeURIComponent(opts.changeSet)}` : '';

    if (opts.format === 'flatbuffer') {
      const res = await fetch(`${conn.url}/api/config/bundle${qs}`, { headers: conn.headers });
      if (!res.ok) {
        console.error(`${LOG} ✗ bundle download failed (${res.status})`);
        authHint(conn.url, res.status);
        process.exit(1);
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      if (opts.save) {
        const out = path.resolve(opts.save);
        mkdirSync(path.dirname(out), { recursive: true });
        writeFileSync(out, bytes);
        console.log(`${LOG} ✓ Wrote ${bytes.length} bytes → ${out}`);
      } else {
        process.stdout.write(`${bytes.toString('base64')}\n`);
      }
      return;
    }

    const { res, config } = await downloadLiveConfig(conn, opts.changeSet);
    if (!res.ok) {
      console.error(`${LOG} ✗ export failed (${res.status})`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    const out = `${JSON.stringify(config, null, 2)}\n`;
    if (opts.save) {
      const file = path.resolve(opts.save);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, out);
      console.log(`${LOG} ✓ Wrote ${file}`);
    } else {
      process.stdout.write(out);
    }
  });

program
  .command('status')
  .description("Show the tenant's active draft change set and recent releases.")
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (opts: { url: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const drafts = await getJson(conn, '/api/optimization/drafts');
    if (!drafts.res.ok) {
      console.error(`${LOG} ✗ Could not read drafts (${drafts.res.status})`);
      authHint(conn.url, drafts.res.status);
      process.exit(1);
    }
    console.log(`\n${LOG} Drafts:`);
    console.log(JSON.stringify(drafts.json, null, 2));
    const rel = await getJson(conn, '/api/optimization/releases');
    console.log(`\n${LOG} Recent releases:`);
    console.log(JSON.stringify(rel.res.ok ? rel.json : { error: rel.res.status }, null, 2));
  });

program
  .command('discard')
  .description('Discard (archive) an open draft change set so a new upload can proceed.')
  .argument('<change-set-id>', 'The draft change_set_id')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (changeSetId: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(`Discard draft change set ${changeSetId} on ${conn.url}?`, !!opts.yes);
    const { res, json } = await postJson(conn, `/api/changesets/${changeSetId}/archive`, {});
    if (!res.ok) {
      console.error(`${LOG} ✗ discard failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`${LOG} ✓ Discarded change set ${changeSetId}.`);
  });

program
  .command('rollback')
  .description('Roll back a deployed change set to the prior configuration (creates a reverting change set).')
  .argument('<change-set-id>', 'The deployed change_set_id to revert')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (changeSetId: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(
      `Roll back change set ${changeSetId} on ${conn.url}? This changes the LIVE configuration.`,
      !!opts.yes,
    );
    const { res, json } = await postJson(conn, `/api/changesets/${changeSetId}/rollback`, {});
    if (!res.ok) {
      console.error(`${LOG} ✗ rollback failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`${LOG} ✓ Rollback requested for change set ${changeSetId}.`);
    if (json?.change_set_id) console.log(`  reverting change_set_id: ${json.change_set_id}`);
  });

program
  .command('evaluate')
  .description("Run the live config's placement/entitlement decisions for a user context (from a JSON file).")
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .requiredOption('--user <file>', 'JSON file: { user_id, customer_id?, plan_handle?, placement_ids?, entitlement_handles?, traits?, now_iso? }')
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (opts: { url: string; user: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    if (!existsSync(opts.user)) {
      console.error(`${LOG} user file not found: ${opts.user}`);
      process.exit(1);
    }
    let body: unknown;
    try {
      body = JSON.parse(readFileSync(opts.user, 'utf8'));
    } catch (err) {
      console.error(`${LOG} invalid JSON in ${opts.user}: ${(err as Error).message}`);
      process.exit(1);
    }
    const { res, json } = await postJson(conn, '/api/sdk/evaluate', body);
    if (!res.ok) {
      console.error(`${LOG} ✗ evaluate failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(JSON.stringify(json, null, 2));
  });

program
  .command('preview')
  .description('Show the runtime-impact preview of a draft change set.')
  .argument('<change-set-id>', 'The draft change_set_id')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (changeSetId: string, opts: { url: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const { res, json } = await getJson(conn, `/api/changesets/${changeSetId}/preview`);
    if (!res.ok) {
      console.error(`${LOG} ✗ preview failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(JSON.stringify(json, null, 2));
  });

// Individual lifecycle transitions (for a review flow: submit → human approves → deploy).
for (const step of ['submit', 'approve', 'reject'] as const) {
  program
    .command(step)
    .description(`Transition a change set: ${step}.`)
    .argument('<change-set-id>', 'The change_set_id')
    .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
    .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
    .action(async (changeSetId: string, opts: { url: string; tenantId?: string }) => {
      const conn = connect(opts.url, opts.tenantId);
      const { res, json } = await postJson(conn, `/api/changesets/${changeSetId}/${step}`, {});
      if (!res.ok) {
        console.error(`${LOG} ✗ ${step} failed (${res.status}): ${JSON.stringify(json)}`);
        authHint(conn.url, res.status);
        process.exit(1);
      }
      console.log(`${LOG} ✓ ${step} → change set ${changeSetId}`);
    });
}

program
  .command('promote')
  .description('Promote a compiled config from one environment to another.')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .requiredOption('--from <env>', 'Source environment id')
  .requiredOption('--to <env>', 'Target environment id')
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (opts: { url: string; from: string; to: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(`Promote config ${opts.from} → ${opts.to} on ${conn.url}?`, !!opts.yes);
    const { res, json } = await postJson(conn, '/api/environments/promote', {
      source_environment_id: opts.from,
      target_environment_id: opts.to,
    });
    if (!res.ok) {
      console.error(`${LOG} ✗ promote failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`${LOG} ✓ Promotion ${opts.from} → ${opts.to} requested.`);
  });

// Per-command examples surfaced in `revturbine <command> --help`.
const COMMAND_EXAMPLES: Record<string, string> = {
  upload: [
    '',
    'Examples:',
    '  revturbine upload ./export-config.json --url <url>             Stage as a draft change set',
    '  revturbine upload ./export-config.json --url <url> --deploy    Stage, then submit → approve → deploy',
  ].join('\n'),
  deploy: ['', 'Example:', '  revturbine deploy cs_1a2b3c --url <url>        Activate a staged draft'].join('\n'),
  export: [
    '',
    'Examples:',
    '  revturbine export --url <url>                                 Active change set → stdout (JSON)',
    '  revturbine export --url <url> --save ./export-config.json     Write the live config to a file',
    '  revturbine export --url <url> --format flatbuffer --save ./bundle.fb  Compiled bundle → file',
    '  revturbine export --url <url> --change-set cs_1a2b3c          A specific change set’s frozen snapshot',
  ].join('\n'),
  evaluate: [
    '',
    'Example:',
    '  revturbine evaluate --url <url> --user ./ctx.json',
    '    ctx.json: { "user_id": "u1", "plan_handle": "pro", "entitlement_handles": ["seats"] }',
  ].join('\n'),
  promote: ['', 'Example:', '  revturbine promote --url <url> --from production --to staging'].join('\n'),
};
for (const [name, text] of Object.entries(COMMAND_EXAMPLES)) {
  program.commands.find((c) => c.name() === name)?.addHelpText('after', text);
}

await program.parseAsync(process.argv);
