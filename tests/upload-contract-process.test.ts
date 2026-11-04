/**
 * BL-0518 TASK-11 / TASK-16 end to end: the bundled CLI against a local stub of
 * `/api/config/import`. Covers the 409 renderings, `--dry-run`, `--report`,
 * the nested unknown-field warning that still posts the raw body, the import
 * notes on `preview`, and `discard`. All tokens are FAKE strings.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import { prepareSourceCli, SOURCE_CLI_SETUP_TIMEOUT_MS } from './helpers/source-cli';

const root = mkdtempSync(path.join(tmpdir(), 'revturbine-upload-'));
const TOKEN = 'rtk_fake_upload_token_never_print_0001';
let cli = process.env.REVTURBINE_TEST_CLI;

const basePlaybook = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/evaluate-playbook.json', import.meta.url)), 'utf8'),
) as Record<string, unknown>;
const withTypo = {
  ...basePlaybook,
  entitlements: [{ ...(basePlaybook.entitlements as Array<Record<string, unknown>>)[0], allocatoin: 5 }],
};

const PLAN = {
  create: [{ section: 'plans', handle: 'team' }],
  update: [],
  no_change: [{ section: 'plans', handle: 'free' }],
  remove: [{ section: 'segments', handle: 'old' }],
  conflict: [] as Array<{ section: string; handle: string }>,
};

const BEYOND = {
  ok: false,
  error: 'Config import failed',
  stage: 'in_flight_version',
  details: {
    error: 'in_flight_version_beyond_draft',
    playbook_version_id: 'pv_42',
    status: 'awaiting_approval',
    held_by: 'mark@example.com',
    held_by_source: 'submitted_by',
    backup_command: 'revturbine download --draft --save <file>',
  },
  detail: { message: 'Cannot upload' },
};

const CONFLICTS = {
  ok: false,
  stage: 'conflicts',
  details: {
    conflicts: [
      { objectType: 'Plan', objectName: 'Pro', action: 'modified', source: 'edited_since_last_upload', fields: [{ name: 'price', before: '10', after: '12' }] },
    ],
  },
  detail: { message: 'edited since the last upload' },
};

beforeAll(() => {
  if (cli) return;
  cli = path.join(root, 'package', 'dist', 'cli.js');
  mkdirSync(path.dirname(cli), { recursive: true });
  writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
  buildSync({
    entryPoints: [fileURLToPath(new URL('../src/cli.ts', import.meta.url))],
    outfile: cli,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    banner: { js: 'import { createRequire as __revtRequire } from "node:module"; const require = __revtRequire(import.meta.url);' },
  });
  prepareSourceCli(cli, root);
}, SOURCE_CLI_SETUP_TIMEOUT_MS);

afterAll(() => rmSync(root, { recursive: true, force: true }));

type Reply = { status: number; body: unknown };
type Seen = { method: string; url: string; body: string };

async function withServer(
  replies: { import?: Reply; drafts?: unknown; changes?: unknown },
  check: (url: string, dir: string, seen: Seen[]) => Promise<void>,
) {
  const dir = mkdtempSync(path.join(root, 'case-'));
  const seen: Seen[] = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      seen.push({ method: req.method ?? '', url: req.url ?? '', body: Buffer.concat(chunks).toString('utf8') });
      const json = { 'Content-Type': 'application/json' };
      const reply = (status: number, body: unknown) => res.writeHead(status, json).end(JSON.stringify(body));
      if (req.url?.startsWith('/app/api/config/import')) return reply(replies.import?.status ?? 200, replies.import?.body ?? { ok: true });
      if (req.url === '/app/api/optimization/drafts') return reply(200, replies.drafts ?? { active: null });
      if (req.url?.includes('/changes')) return reply(200, replies.changes ?? { impact: {}, changes: [] });
      if (req.url?.includes('/archive')) return reply(200, { ok: true });
      if (req.url?.startsWith('/app/api/config/export')) return reply(200, basePlaybook);
      return reply(404, {});
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server port');
  const origin = `http://127.0.0.1:${address.port}`;
  writeFileSync(
    path.join(dir, 'credentials.json'),
    JSON.stringify({ version: 1, credentials: { [origin]: { token: TOKEN, tenant_id: null, created_at: '2026-01-01T00:00:00.000Z' } } }),
  );
  writeFileSync(path.join(dir, 'x.json'), JSON.stringify(basePlaybook));
  writeFileSync(path.join(dir, 'typo.json'), JSON.stringify(withTypo));
  try {
    await check(`${origin}/app`, dir, seen);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function run(args: string[], dir: string) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const base: Record<string, string | undefined> = { ...process.env };
    for (const name of Object.keys(base)) if (/^(https?_proxy|no_proxy)$/i.test(name)) delete base[name];
    const child = spawn(process.execPath, [cli!, ...args], {
      cwd: dir,
      env: { ...base, REVTURBINE_CONFIG_DIR: dir, REVTURBINE_TOKEN: '', REVTURBINE_HTTP_HEADERS: '', REVTURBINE_REGISTRY_URL: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill(), 20_000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

interface ReportFile {
  outcome: string;
  plan: { playbook_version_id: string; groups: { remove: unknown[] } };
  rejected: { status: number; kind: string; body: { details: { playbook_version_id: string } } };
  warnings: { findings: unknown[]; notes: unknown[] };
}

const readReport = (dir: string, name = 'out.json') => JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as ReportFile;

describe('upload 409 renderings (AC-11)', () => {
  it('beyond draft: exit 5, names version, status, holder and the backup command; --report keeps the body', async () => {
    await withServer({ import: { status: 409, body: BEYOND } }, async (url, dir) => {
      const out = await run(['upload', 'x.json', '--url', url, '--report', 'out.json'], dir);
      expect(out.code, out.stderr).toBe(5);
      expect(out.stderr).toContain('pv_42');
      expect(out.stderr).toContain('awaiting_approval');
      expect(out.stderr).toContain('mark@example.com');
      expect(out.stderr).toContain('revturbine download --draft --save <file>');
      expect(out.stderr).toContain('Not prompting for a backup');
      const report = readReport(dir);
      expect(Object.keys(report)).toEqual(['outcome', 'plan', 'rejected', 'warnings']);
      expect(report.outcome).toBe('refused');
      expect(report.rejected).toMatchObject({ status: 409, kind: 'beyond_draft' });
      expect(report.rejected.body.details.playbook_version_id).toBe('pv_42');
    });
  }, 30_000);

  it('conflicts: exit 5, prints each edit and the instruction', async () => {
    await withServer({ import: { status: 409, body: CONFLICTS } }, async (url, dir) => {
      const out = await run(['upload', 'x.json', '--url', url], dir);
      expect(out.code, out.stderr).toBe(5);
      expect(out.stderr).toContain('Plan "Pro" (modified) — edited since the last upload');
      expect(out.stderr).toContain('price: "10" → "12"');
      expect(out.stderr).toContain('ask the human');
    });
  }, 30_000);

  it('a 422 writes the findings to --report and keeps exit 4', async () => {
    const body = { ok: false, error: 'Config has blocking validation findings', findings: [{ code: 'VAL-X', severity: 'error_draft', message: 'bad', targetRef: {} }] };
    await withServer({ import: { status: 422, body } }, async (url, dir) => {
      const out = await run(['upload', 'x.json', '--url', url, '--report', 'out.json'], dir);
      expect(out.code, out.stderr).toBe(4);
      expect(readReport(dir).rejected).toMatchObject({ status: 422, kind: 'validation' });
      expect(readReport(dir).warnings.findings).toEqual(body.findings);
    });
  }, 30_000);
});

describe('upload --dry-run (AC-11, AC-19)', () => {
  it('prints the plan with removals as their own group, exits 0, writes nothing, report is dry_run', async () => {
    await withServer({ import: { status: 200, body: { ok: true, dryRun: true, playbook_version_id: 'pv_1', imported: {}, plan: PLAN, findings: [] } } }, async (url, dir, seen) => {
      const out = await run(['upload', 'x.json', '--dry-run', '--prune', '--url', url, '--report', 'out.json'], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(out.stdout).toContain('1 create, 0 update, 1 remove, 0 conflict, 1 no change');
      expect(out.stdout).toContain('REMOVE (1)');
      expect(out.stdout).toContain('segments: old');
      expect(seen.find((r) => r.url.startsWith('/app/api/config/import'))?.url).toBe('/app/api/config/import?prune=force&dryRun=true');
      expect(readReport(dir)).toMatchObject({ outcome: 'dry_run', rejected: null });
      expect(readReport(dir).plan.groups.remove).toEqual([{ section: 'segments', handle: 'old' }]);
    });
  }, 30_000);

  it('exits 1 when the plan has conflicts', async () => {
    const plan = { ...PLAN, conflict: [{ section: 'plans', handle: 'pro' }] };
    await withServer({ import: { status: 200, body: { ok: true, dryRun: true, plan } } }, async (url, dir) => {
      const out = await run(['upload', 'x.json', '--dry-run', '--url', url], dir);
      expect(out.code, out.stderr).toBe(1);
      expect(out.stdout).toContain('CONFLICT (1)');
    });
  }, 30_000);

  it('a 200 {ok:false, dryRun:true, issues} prints the issues and exits 4, not a plan', async () => {
    const body = { ok: false, dryRun: true, issues: [{ path: ['plans', 0, 'name'], message: 'Required' }] };
    await withServer({ import: { status: 200, body } }, async (url, dir) => {
      const out = await run(['upload', 'x.json', '--dry-run', '--url', url, '--report', 'out.json'], dir);
      expect(out.code, out.stderr).toBe(4);
      expect(out.stderr).toContain('plans.0.name: Required');
      expect(out.stdout).not.toContain('no plan');
      expect(readReport(dir)).toMatchObject({ outcome: 'refused' });
    });
  }, 30_000);

  it('the real duplicate_handles 409 prints the server message, not an edit list, exit 5', async () => {
    const body = {
      ok: false,
      stage: 'duplicate_handles',
      details: { conflicts: [{ collection: 'plans', handle: 'pro', existing_id: 'pro', config_id: 'pro', scope: 'config' }] },
      detail: { message: 'Duplicate handles in the config' },
    };
    await withServer({ import: { status: 409, body } }, async (url, dir) => {
      const out = await run(['upload', 'x.json', '--url', url], dir);
      expect(out.code, out.stderr).toBe(5);
      expect(out.stderr).toContain('Duplicate handles in the config');
      expect(out.stderr).not.toContain('edit(s) made since');
    });
  }, 30_000);

  it('exits 1 when the dry run is refused with edits since the last upload, 5 for a beyond-draft version', async () => {
    await withServer({ import: { status: 409, body: CONFLICTS } }, async (url, dir) => {
      expect((await run(['upload', 'x.json', '--dry-run', '--url', url], dir)).code).toBe(1);
    });
    await withServer({ import: { status: 409, body: BEYOND } }, async (url, dir) => {
      expect((await run(['upload', 'x.json', '--dry-run', '--url', url], dir)).code).toBe(5);
    });
  }, 30_000);
});

describe('upload success: nested unknown fields and notes (AC-18, AC-19, AC-7)', () => {
  it('warns with the full path, still posts the raw key, prints findings and notes, writes an applied report', async () => {
    const body = {
      ok: true,
      imported: { plans: 2 },
      playbook_version_id: 'pv_9',
      plan: PLAN,
      findings: [{ code: 'entitlement_rule.field_dropped', severity: 'warning', message: "Rule 'r' declared 'status'", targetRef: {} }],
      import_notes: [{ code: 'import.default_injected', message: 'cooldown_days 7 injected', origin: 'platform default' }],
    };
    await withServer({ import: { status: 200, body } }, async (url, dir, seen) => {
      const out = await run(['upload', 'typo.json', '--url', url, '--report', 'out.json'], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(out.stderr).toContain("Unknown field 'entitlements[0].allocatoin'");
      const posted = JSON.parse(seen.find((r) => r.method === 'POST')!.body) as { entitlements: Array<Record<string, unknown>> };
      expect(posted.entitlements[0]?.allocatoin).toBe(5);
      expect(out.stderr).toContain('entitlement_rule.field_dropped');
      expect(out.stderr).toContain('cooldown_days 7 injected (origin: platform default)');
      const report = readReport(dir);
      expect(report).toMatchObject({ outcome: 'applied', rejected: null });
      expect(report.plan.playbook_version_id).toBe('pv_9');
      expect(report.warnings.notes).toHaveLength(1);
      expect(report.warnings.findings).toHaveLength(1);
    });
  }, 30_000);

  it('validate <file> warns on the same path and exits 0', async () => {
    await withServer({}, async (_url, dir) => {
      const out = await run(['validate', 'typo.json'], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(out.stdout + out.stderr).toContain("Unknown field 'entitlements[0].allocatoin'");
    });
  }, 30_000);

  it('an offline failure still writes a refused report and exits 4', async () => {
    await withServer({}, async (url, dir) => {
      writeFileSync(path.join(dir, 'bad.json'), JSON.stringify({ version: '1.0.0', plans: 'nope' }));
      const out = await run(['upload', 'bad.json', '--url', url, '--report', 'out.json'], dir);
      expect(out.code, out.stderr).toBe(4);
      expect(readReport(dir).rejected.kind).toBe('offline_validation');
    });
  }, 30_000);
});

describe('preview, diff and discard (AC-11, AC-7)', () => {
  const drafts = { active: { id: 'pv_7', status: 'draft' } };
  const changes = { impact: { byCategory: [], billing: { objects: [] } }, changes: [], import_notes: [{ message: "dropped 'status' from a payload" }] };

  it('preview prints the import notes', async () => {
    await withServer({ drafts, changes }, async (url, dir) => {
      const out = await run(['preview', '--url', url], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(out.stdout).toContain("dropped 'status' from a payload");
    });
  }, 30_000);

  it('diff <file> --draft prints the notes without changing the result', async () => {
    await withServer({ drafts, changes }, async (url, dir) => {
      const out = await run(['diff', 'x.json', '--draft', '--url', url, '--exit-code'], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(out.stderr).toContain("dropped 'status' from a payload");
    });
  }, 30_000);

  it('discard --yes archives the open draft', async () => {
    await withServer({ drafts }, async (url, dir, seen) => {
      const out = await run(['discard', '--yes', '--url', url], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(seen.some((r) => r.method === 'POST' && r.url === '/app/api/playbook-versions/pv_7/archive')).toBe(true);
    });
  }, 30_000);

  it('discard without --yes and without a terminal refuses and archives nothing', async () => {
    await withServer({ drafts }, async (url, dir, seen) => {
      const out = await run(['discard', '--url', url], dir);
      expect(out.code).toBe(2);
      expect(seen.some((r) => r.url.includes('/archive'))).toBe(false);
    });
  }, 30_000);

  it('--help lists no park or resume command and documents the new upload flags', async () => {
    await withServer({}, async (_url, dir) => {
      const top = await run(['--help'], dir);
      expect(top.stdout).not.toMatch(/\b(park|resume)\b/i);
      const upload = await run(['upload', '--help'], dir);
      expect(upload.stdout).toContain('--dry-run');
      expect(upload.stdout).toContain('--report <path>');
    });
  }, 30_000);
});

it('the stub never leaves a report behind when none is asked for', async () => {
  await withServer({ import: { status: 200, body: { ok: true, imported: {}, playbook_version_id: 'pv_1' } } }, async (url, dir) => {
    const out = await run(['upload', 'x.json', '--url', url], dir);
    expect(out.code, out.stderr).toBe(0);
    expect(existsSync(path.join(dir, 'out.json'))).toBe(false);
  });
}, 30_000);
