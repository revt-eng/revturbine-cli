import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import { prepareSourceCli, SOURCE_CLI_SETUP_TIMEOUT_MS } from './helpers/source-cli';

const root = mkdtempSync(path.join(tmpdir(), 'revturbine-whoami-'));
const secret = 'rt_test_whoami_must_never_print_this_fake_token';
let cli = process.env.REVTURBINE_TEST_CLI;

beforeAll(() => {
  if (cli) return;
  cli = path.join(root, 'package', 'dist', 'cli.js');
  mkdirSync(path.dirname(cli), { recursive: true });
  writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
  buildSync({ entryPoints: [fileURLToPath(new URL('../src/cli.ts', import.meta.url))], outfile: cli, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
  prepareSourceCli(cli, root);
}, SOURCE_CLI_SETUP_TIMEOUT_MS);

afterAll(() => rmSync(root, { recursive: true, force: true }));

interface Scenario {
  present?: boolean;
  status?: number;
  unavailable?: boolean;
  stallProbe?: boolean;
  stallTelemetry?: boolean;
}

async function fixture(scenario: Scenario, check: (url: string, dir: string, requests: string[]) => Promise<void>) {
  const dir = mkdtempSync(path.join(root, 'case-'));
  const requests: string[] = [];
  const server = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    if (req.url === '/app/api/events') {
      if (scenario.stallTelemetry) return;
      res.writeHead(204).end();
      return;
    }
    if (scenario.stallProbe) return;
    if (scenario.unavailable) { req.socket.destroy(); return; }
    if (req.url === '/login') { res.writeHead(200).end('<html>Log in</html>'); return; }
    if (scenario.status === 302) { res.writeHead(302, { Location: '/login' }).end(); return; }
    res.writeHead(scenario.status ?? 200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ active: null }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server port');
  const origin = `http://127.0.0.1:${address.port}`;
  const credentials = path.join(dir, 'credentials.json');
  writeFileSync(credentials, JSON.stringify({ version: 1, credentials: scenario.present === false ? {} : {
    [origin]: { token: secret, tenant_id: 'stored-tenant', created_at: '2026-01-01T00:00:00.000Z' },
  } }));
  const hash = () => createHash('sha256').update(readFileSync(credentials)).digest('hex');
  const before = hash();
  try {
    await check(`${origin}/app`, dir, requests);
    expect(hash()).toBe(before);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function run(url: string, dir: string, json: boolean, explicitTenant = true) {
  return new Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean; elapsed: number }>((resolve, reject) => {
    const started = Date.now();
    const args = [cli!, 'whoami', '--url', url, ...(explicitTenant ? ['--tenant-id', 'configured-tenant'] : []), ...(json ? ['--json'] : [])];
    const child = spawn(process.execPath, args, { cwd: dir, env: { ...process.env, REVTURBINE_CONFIG_DIR: dir }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 7_000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut, elapsed: Date.now() - started });
    });
  });
}

const cases = [
  { label: 'absent credentials', present: false, valid: null, message: 'not logged in' },
  { label: 'accepted credentials without an active draft', status: 200, valid: true, message: 'credentials accepted' },
  { label: 'accepted empty response', status: 204, valid: true, message: 'credentials accepted' },
  { label: 'unauthorized credentials', status: 401, valid: false, message: 'credentials rejected' },
  { label: 'forbidden tenant', status: 403, valid: false, message: 'credentials rejected' },
  { label: 'missing endpoint', status: 404, valid: null, message: 'verification unavailable' },
  { label: 'rate limit', status: 429, valid: null, message: 'verification unavailable' },
  { label: 'server error', status: 500, valid: null, message: 'verification unavailable' },
  { label: 'redirect to login page', status: 302, valid: null, message: 'verification unavailable' },
  { label: 'unreachable verification', unavailable: true, valid: null, message: 'verification unavailable' },
] satisfies (Scenario & { label: string; valid: boolean | null; message: string })[];

describe('whoami process contract (also run against the installed npm tarball)', () => {
  it.each(cases)('$label leads the human report and preserves JSON/exit/stream contracts', async (scenario) => {
    await fixture(scenario, async (url, dir, requests) => {
      for (const json of [true, false]) {
        const result = await run(url, dir, json);
        expect(result.timedOut, result.stderr).toBe(false);
        expect(result.code, result.stderr).toBe(0);
        expect(result.stdout + result.stderr).not.toContain(secret);
        expect(result.stderr).toContain('Tenant configured-tenant (--tenant-id)');
        if (json) {
          expect(JSON.parse(result.stdout)).toEqual({
            instance: url, tenant: 'configured-tenant', tenant_source: '--tenant-id',
            credentials_dir: dir, credentials_source: 'env',
            token_present: scenario.present !== false, token_valid: scenario.valid,
          });
        } else {
          expect(result.stdout.split('\n')[0]).toContain(`authentication: ${scenario.message}`);
          expect(result.stdout).toContain(`instance:    ${url}`);
          expect(result.stdout).toContain('tenant:      configured-tenant (--tenant-id)');
          expect(result.stdout).toContain(`credentials: ${dir} [env]`);
          if (scenario.present === false) expect(result.stdout).toContain('revturbine login');
        }
      }
      if (scenario.present === false) expect(requests).toEqual([]);
      if (scenario.status === 302) expect(requests).not.toContain('GET /login');
    });
  });

  it.each([true, false])('preserves tenant resolution with token present=%s', async (present) => {
    await fixture({ present }, async (url, dir) => {
      const result = await run(url, dir, true, false);
      expect(result.code).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        tenant: present ? 'stored-tenant' : 'dev-tenant-001',
        tenant_source: present ? 'stored token' : 'default',
        token_present: present, token_valid: present ? true : null,
      });
    });
  });

  it.each([
    { label: 'probe', stallProbe: true, valid: null },
    { label: 'telemetry after successful verification', stallTelemetry: true, valid: true },
  ])('bounds a stalled $label without changing the status exit code', async (scenario) => {
    await fixture(scenario, async (url, dir) => {
      const result = await run(url, dir, true);
      expect(result.timedOut, `Process exceeded 7s; stdout: ${result.stdout}`).toBe(false);
      expect(result.code, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ token_present: true, token_valid: scenario.valid });
      expect(result.stdout + result.stderr).not.toContain(secret);
      expect(result.elapsed).toBeLessThan(6_500);
    });
  }, 12_000);
});
