/**
 * revturbine — verify RevTurbine ExportedConfig files and load them into a
 * RevTurbine instance through the playbook-version lifecycle.
 *
 * Configs are canonical ExportedConfig JSON files, addressed by path.
 *
 * Verification is MANDATORY and fully offline: configs are validated against a
 * vendored, version-stamped snapshot of ExportedConfigSchema (./schema/), so the
 * tool never uploads a config it could not validate and needs no access to any
 * private schema package or source tree.
 *
 * Loading a config stages a playbook version: `upload` STAGES it as a draft
 * (POST /api/config/import → playbook_version_id); deploying walks the lifecycle
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
import { trackEvent, shouldTrackCommandExecution } from './lib/track';
import { diffExportedConfig, formatDiff } from './lib/config-diff';
import { fetchValidation, formatFindings, hasBlockingFindings } from './lib/config-validate';

const LOG = '[revturbine]';
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
 * Walk the playbook-version lifecycle submit → approve → deploy. Deploy runs
 * compile-and-activate synchronously in-request (plan 68), so success means
 * the configuration is live.
 */
async function activatePlaybookVersion(conn: Connection, playbookVersionId: string): Promise<void> {
  console.log(`\n${LOG} Activating playbook version ${playbookVersionId} (submit → approve → deploy) …`);
  for (const step of ['submit', 'approve', 'deploy'] as const) {
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/${step}`, {});
    if (!res.ok) {
      console.error(`${LOG} ✗ ${step} failed (${res.status}). The draft is staged but NOT live.`);
      console.error(`  ${JSON.stringify(json)}`);
      console.error(`  Finish it from the UI (Drafts & Releases): playbook version ${playbookVersionId}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`  ✓ ${step}`);
  }
  console.log(`${LOG} ✓ Deployed — the playbook version is now the live configuration.`);
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
  playbookVersionId?: string,
): Promise<{ res: Response; config: unknown }> {
  const qs = playbookVersionId ? `?playbookVersionId=${encodeURIComponent(playbookVersionId)}` : '';
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
  # Author, validate, and ship against the default instance (revturbine.com/app)
  revturbine login
  revturbine verify ./export-config.json
  revturbine diff ./export-config.json
  revturbine upload ./export-config.json --deploy

  # Target a different instance — pass its URL (include the /app path)
  revturbine login https://app.example.com/app
  revturbine upload ./export-config.json --url https://app.example.com/app --deploy

  # Manual review flow (stage → inspect → submit → approve → deploy)
  revturbine upload ./export-config.json         # stage a draft playbook version
  revturbine preview <playbook-version-id>       # inspect runtime impact
  revturbine submit  <playbook-version-id>
  revturbine approve <playbook-version-id>
  revturbine deploy  <playbook-version-id>

  # Inspect and roll back
  revturbine status
  revturbine rollback <playbook-version-id>

Default instance:
  --url and the \`login\` argument default to https://revturbine.com/app —
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

// Dogfood each successful ONLINE command as a `cli_command_executed` control-
// plane event (plan 112 TASK-6). Fires only after the action resolves (so a
// failed command that exits non-zero emits nothing); auth commands emit their
// own events and offline `verify` has no connection, so both are skipped.
program.hook('postAction', async (_thisCommand, actionCommand) => {
  const opts = actionCommand.opts() as { url?: string; tenantId?: string };
  if (!shouldTrackCommandExecution(actionCommand.name(), Boolean(opts.url))) return;
  await trackEvent(opts.url as string, opts.tenantId, 'cli_command_executed', {
    command: actionCommand.name(),
  });
});

program
  .name('revturbine')
  .description('Verify ExportedConfig files and load them into a RevTurbine instance via playbook versions.')
  .version(`${pkgVersion} (schema ${SCHEMA_VERSION})`, '-V, --version', 'Print the revturbine and bundled schema versions')
  .showHelpAfterError()
  .addHelpText('after', HELP_AFTER);

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
      await trackEvent(baseUrl, undefined, 'cli_signed_up');
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
  .description('Stage an ExportedConfig file as a draft playbook version (POST /api/config/import). Use --deploy to also activate it.')
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
    console.log(`\n${LOG} Staging ${configFile} into a draft playbook version (${conn.url}/api/config/import) …`);
    const { res, json } = await postJson(conn, '/api/config/import', config);
    if (!res.ok) {
      console.error(`${LOG} ✗ Upload failed (${res.status})`);
      // A 409 means a draft playbook version is already open for the tenant —
      // deploy or discard it (Drafts & Releases) before importing.
      if (json && typeof json === 'object' && json.stage) {
        console.error(`  stage:  ${json.stage}`);
        console.error(`  detail: ${JSON.stringify(json.detail)}`);
      } else {
        console.error(`  ${JSON.stringify(json)}`);
      }
      authHint(conn.url, res.status);
      process.exit(1);
    }

    const playbookVersionId = json?.playbook_version_id as string | undefined;
    console.log(`${LOG} ✓ Staged ${configFile} as a draft playbook version (${res.status})`);
    console.log(`  imported: ${JSON.stringify(json.imported ?? {})}`);
    if (playbookVersionId) console.log(`  playbook_version_id: ${playbookVersionId}`);

    if (!opts.deploy) {
      console.log(
        `\n${LOG} Staged as a draft. Activate it with:\n` +
          (playbookVersionId
            ? `  revturbine deploy ${playbookVersionId} --url ${conn.url}\n`
            : '') +
          '  …or from the RevTurbine UI (Drafts & Releases).',
      );
      return;
    }
    if (!playbookVersionId) {
      console.warn(
        `${LOG} No playbook_version_id returned — the server predates the playbook-version wire; nothing to deploy.`,
      );
      return;
    }
    await activatePlaybookVersion(conn, playbookVersionId);
  });

program
  .command('deploy')
  .description('Activate a staged draft playbook version: submit → approve → deploy.')
  .argument('<playbook-version-id>', 'The playbook_version_id returned by `upload`')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  // Accepted for flag parity with the other mutating commands (discard/rollback);
  // deploy has no confirmation prompt, so --yes is a no-op rather than an error.
  .option('--yes', 'Accepted for parity with discard/rollback; deploy has no confirmation prompt')
  .action(async (playbookVersionId: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await activatePlaybookVersion(conn, playbookVersionId);
  });

program
  .command('validate')
  .description('Run config-validation against a staged draft. Prints findings; exits non-zero if any block.')
  .argument('<playbook-version-id>', 'The playbook_version_id to validate')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (playbookVersionId: string, opts: { url: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const result = await fetchValidation(conn.url, playbookVersionId, conn.headers);
    if (!result.ok) {
      console.error(`${LOG} ✗ validate failed (${result.status})${result.error ? `: ${result.error}` : ''}`);
      authHint(conn.url, result.status);
      process.exit(1);
    }

    console.log(`\n${LOG} Validation for playbook version ${playbookVersionId}:`);
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
  .option('--playbook-version <id>', 'Export a specific playbook version (default: the live configuration)')
  .action(async (opts: { url: string; tenantId?: string; format: string; save?: string; playbookVersion?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const qs = opts.playbookVersion ? `?playbookVersionId=${encodeURIComponent(opts.playbookVersion)}` : '';

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

    const { res, config } = await downloadLiveConfig(conn, opts.playbookVersion);
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
  .description("Show the tenant's active draft playbook version and recent releases.")
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
  .description('Discard (archive) an open draft playbook version so a new upload can proceed.')
  .argument('<playbook-version-id>', 'The draft playbook_version_id')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (playbookVersionId: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(`Discard draft playbook version ${playbookVersionId} on ${conn.url}?`, !!opts.yes);
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/archive`, {});
    if (!res.ok) {
      console.error(`${LOG} ✗ discard failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`${LOG} ✓ Discarded playbook version ${playbookVersionId}.`);
  });

program
  .command('rollback')
  .description('Roll back a deployed playbook version to the prior configuration (creates a reverting playbook version).')
  .argument('<playbook-version-id>', 'The deployed playbook_version_id to revert')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .option('--yes', 'Skip the confirmation prompt')
  .action(async (playbookVersionId: string, opts: { url: string; tenantId?: string; yes?: boolean }) => {
    const conn = connect(opts.url, opts.tenantId);
    await confirmOrExit(
      `Roll back playbook version ${playbookVersionId} on ${conn.url}? This changes the LIVE configuration.`,
      !!opts.yes,
    );
    const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/rollback`, {});
    if (!res.ok) {
      console.error(`${LOG} ✗ rollback failed (${res.status}): ${JSON.stringify(json)}`);
      authHint(conn.url, res.status);
      process.exit(1);
    }
    console.log(`${LOG} ✓ Rollback requested for playbook version ${playbookVersionId}.`);
    if (json?.playbook_version_id) console.log(`  reverting playbook_version_id: ${json.playbook_version_id}`);
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
  .description('Show the runtime-impact preview of a draft playbook version.')
  .argument('<playbook-version-id>', 'The draft playbook_version_id')
  .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
  .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
  .action(async (playbookVersionId: string, opts: { url: string; tenantId?: string }) => {
    const conn = connect(opts.url, opts.tenantId);
    const { res, json } = await getJson(conn, `/api/playbook-versions/${playbookVersionId}/preview`);
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
    .description(`Transition a playbook version: ${step}.`)
    .argument('<playbook-version-id>', 'The playbook_version_id')
    .option('-u, --url <url>', 'RevTurbine instance URL', DEFAULT_URL)
    .option('-t, --tenant-id <id>', 'x-tenant-id (defaults to the stored token tenant)')
    .action(async (playbookVersionId: string, opts: { url: string; tenantId?: string }) => {
      const conn = connect(opts.url, opts.tenantId);
      const { res, json } = await postJson(conn, `/api/playbook-versions/${playbookVersionId}/${step}`, {});
      if (!res.ok) {
        console.error(`${LOG} ✗ ${step} failed (${res.status}): ${JSON.stringify(json)}`);
        authHint(conn.url, res.status);
        process.exit(1);
      }
      console.log(`${LOG} ✓ ${step} → playbook version ${playbookVersionId}`);
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
    '  revturbine upload ./export-config.json --url <url>             Stage as a draft playbook version',
    '  revturbine upload ./export-config.json --url <url> --deploy    Stage, then submit → approve → deploy',
  ].join('\n'),
  deploy: ['', 'Example:', '  revturbine deploy cs_1a2b3c --url <url>        Activate a staged draft'].join('\n'),
  export: [
    '',
    'Examples:',
    '  revturbine export --url <url>                                 Active playbook version → stdout (JSON)',
    '  revturbine export --url <url> --save ./export-config.json     Write the live config to a file',
    '  revturbine export --url <url> --format flatbuffer --save ./bundle.fb  Compiled bundle → file',
    '  revturbine export --url <url> --playbook-version cs_1a2b3c    A specific playbook version’s frozen snapshot',
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
