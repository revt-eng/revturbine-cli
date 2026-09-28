/**
 * Plan 129 TASK-2 — non-interactive CI mode, end to end against the bundled
 * CLI and a local HTTP server: REVTURBINE_TOKEN precedence (no default
 * x-tenant-id), REVTURBINE_HTTP_HEADERS on every request with values never
 * printed, and the `diff --exit-code` statuses. All secrets are FAKE strings.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import { prepareSourceCli, SOURCE_CLI_SETUP_TIMEOUT_MS } from './helpers/source-cli';

const root = mkdtempSync(path.join(tmpdir(), 'revturbine-ci-mode-'));
const ENV_TOKEN = 'rtk_fake_ci_env_token_never_print_0001';
const STORED_TOKEN = 'rtk_fake_ci_stored_token_never_print_0002';
const BYPASS = 'fake-vercel-bypass-secret-never-print-0003';
const SECRETS = [ENV_TOKEN, STORED_TOKEN, BYPASS];
let cli = process.env.REVTURBINE_TEST_CLI;

const playbook = {
  version: '1.0.0',
  plans: [{ unique_handle: 'free', name: 'Free' }],
  entitlements: [],
  entitlement_rules: [],
  segments: [],
  content_ui_paths: [],
  surface_templates: [],
  placements: [],
};

beforeAll(() => {
  if (cli) return;
  cli = path.join(root, 'package', 'dist', 'cli.js');
  mkdirSync(path.dirname(cli), { recursive: true });
  writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
  buildSync({ entryPoints: [fileURLToPath(new URL('../src/cli.ts', import.meta.url))], outfile: cli, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
  prepareSourceCli(cli, root);
}, SOURCE_CLI_SETUP_TIMEOUT_MS);

afterAll(() => rmSync(root, { recursive: true, force: true }));

type Seen = { url: string; headers: IncomingHttpHeaders };
type Mode = { exportStatus?: number; exportBody?: unknown };

async function withServer(mode: Mode, check: (url: string, dir: string, seen: Seen[]) => Promise<void>) {
  const dir = mkdtempSync(path.join(root, 'case-'));
  const seen: Seen[] = [];
  const server = createServer((req, res) => {
    seen.push({ url: req.url ?? '', headers: req.headers });
    if (req.url === '/app/api/events') { res.writeHead(204).end(); return; }
    if (req.url?.startsWith('/app/api/config/export')) {
      // An error body that echoes the request's secrets back must still never be printed.
      const status = mode.exportStatus ?? 200;
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(
        JSON.stringify(status === 200 ? (mode.exportBody ?? playbook) : { error: `echo ${req.headers.authorization} ${req.headers['x-vercel-protection-bypass']}` }),
      );
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ active: null }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server port');
  const origin = `http://127.0.0.1:${address.port}`;
  writeFileSync(path.join(dir, 'credentials.json'), JSON.stringify({ version: 1, credentials: {
    [origin]: { token: STORED_TOKEN, tenant_id: 'stored-tenant', created_at: '2026-01-01T00:00:00.000Z' },
  } }));
  writeFileSync(path.join(dir, 'same.json'), JSON.stringify(playbook));
  writeFileSync(path.join(dir, 'changed.json'), JSON.stringify({ ...playbook, plans: [{ unique_handle: 'free', name: 'Free!' }] }));
  try {
    await check(`${origin}/app`, dir, seen);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function run(args: string[], dir: string, env: Record<string, string>) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [cli!, ...args], {
      cwd: dir,
      env: { ...process.env, REVTURBINE_CONFIG_DIR: dir, REVTURBINE_TOKEN: '', REVTURBINE_HTTP_HEADERS: '', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill(), 15_000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

const ciEnv = { REVTURBINE_TOKEN: ENV_TOKEN, REVTURBINE_HTTP_HEADERS: JSON.stringify({ 'x-vercel-protection-bypass': BYPASS }) };

function expectNoSecrets(out: { stdout: string; stderr: string }) {
  for (const s of SECRETS) {
    expect(out.stdout).not.toContain(s);
    expect(out.stderr).not.toContain(s);
  }
}

describe('CI mode (REVTURBINE_TOKEN + REVTURBINE_HTTP_HEADERS)', () => {
  it('env token wins over the stored credential, sends no x-tenant-id, and adds the headers to every request', async () => {
    await withServer({}, async (url, dir, seen) => {
      const out = await run(['diff', 'same.json', '--live', '--url', url, '--exit-code'], dir, ciEnv);
      expect(out.code, out.stderr).toBe(0);
      expectNoSecrets(out);
      expect(out.stderr).toContain('x-vercel-protection-bypass');
      expect(out.stderr).toContain('REVTURBINE_TOKEN');
      const instance = seen.filter((r) => r.url.startsWith('/app/api/'));
      expect(instance.map((r) => r.url)).toEqual(expect.arrayContaining(['/app/api/config/export', '/app/api/events']));
      for (const r of instance) {
        expect(r.headers.authorization, r.url).toBe(`Bearer ${ENV_TOKEN}`);
        expect(r.headers['x-tenant-id'], r.url).toBeUndefined();
        expect(r.headers['x-vercel-protection-bypass'], r.url).toBe(BYPASS);
      }
    });
  }, 30_000);

  it('an explicit -t is still sent with the env token', async () => {
    await withServer({}, async (url, dir, seen) => {
      const out = await run(['diff', 'same.json', '--live', '--url', url, '-t', 'tn_explicit'], dir, ciEnv);
      expect(out.code, out.stderr).toBe(0);
      expect(seen.find((r) => r.url === '/app/api/config/export')?.headers['x-tenant-id']).toBe('tn_explicit');
    });
  }, 30_000);

  it('whoami reports the env token source without printing it', async () => {
    await withServer({}, async (url, dir) => {
      const out = await run(['whoami', '--url', url, '--json'], dir, ciEnv);
      expect(out.code, out.stderr).toBe(0);
      expectNoSecrets(out);
      const data = JSON.parse(out.stdout);
      expect(data).toMatchObject({ token_present: true, tenant: null, token_valid: true });
      expect(data.tenant_source).toMatch(/REVTURBINE_TOKEN/);
      const human = await run(['whoami', '--url', url], dir, ciEnv);
      expectNoSecrets(human);
      expect(human.stdout).toContain('credentials: REVTURBINE_TOKEN');
    });
  }, 30_000);

  it('an auth failure that echoes the secrets back never prints them', async () => {
    await withServer({ exportStatus: 401 }, async (url, dir) => {
      const out = await run(['diff', 'same.json', '--live', '--url', url, '--exit-code'], dir, ciEnv);
      expect(out.code).toBe(3);
      expectNoSecrets(out);
      expect(out.stderr).toContain('REVTURBINE_TOKEN');
    });
  }, 30_000);

  it('a malformed REVTURBINE_HTTP_HEADERS is a usage error that does not echo the value', async () => {
    await withServer({}, async (url, dir, seen) => {
      const out = await run(['diff', 'same.json', '--live', '--url', url], dir, { ...ciEnv, REVTURBINE_HTTP_HEADERS: `{bad ${BYPASS}` });
      expect(out.code).toBe(2);
      expectNoSecrets(out);
      expect(out.stderr).toContain('REVTURBINE_HTTP_HEADERS');
      expect(seen.filter((r) => r.url.startsWith('/app/api/config'))).toHaveLength(0);
    });
  }, 30_000);
});

describe('diff --exit-code', () => {
  it('0 = no differences, 1 = differences, other = error', async () => {
    await withServer({}, async (url, dir) => {
      expect((await run(['diff', 'same.json', 'same.json', '--exit-code'], dir, {})).code).toBe(0);
      expect((await run(['diff', 'same.json', 'changed.json', '--exit-code'], dir, {})).code).toBe(1);
      expect((await run(['diff', 'changed.json', '--live', '--url', url, '--exit-code'], dir, ciEnv)).code).toBe(1);
      expect((await run(['diff', 'same.json', 'missing.json', '--exit-code'], dir, {})).code).toBe(2);
      expect((await run(['diff', 'same.json', '--live', '--url', url, '--exit-code'], dir, { ...ciEnv })).code).toBe(0);
    });
  }, 60_000);

  it('without --exit-code a difference still exits 0', async () => {
    await withServer({}, async (_url, dir) => {
      expect((await run(['diff', 'same.json', 'changed.json'], dir, {})).code).toBe(0);
    });
  }, 30_000);
});
