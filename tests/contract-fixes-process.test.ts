/**
 * ST-1453 CLI contract fixes, end to end against the bundled CLI and local
 * stubs: usage exit code (BUG-1436), proxy support (BUG-821), whoami advice
 * (BUG-822), schema-lag warning (BUG-1189) and the tenant header (BL-0415).
 * All tokens are FAKE strings.
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

const root = mkdtempSync(path.join(tmpdir(), 'revturbine-contract-'));
const TOKEN = 'rtk_fake_contract_token_never_print_0001';
const INSTALLED = '0.0.0-test';
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
  writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: INSTALLED }));
  buildSync({
    entryPoints: [fileURLToPath(new URL('../src/cli.ts', import.meta.url))],
    outfile: cli,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    // undici (loaded only behind a proxy variable) is CommonJS.
    banner: { js: 'import { createRequire as __revtRequire } from "node:module"; const require = __revtRequire(import.meta.url);' },
  });
  prepareSourceCli(cli, root);
}, SOURCE_CLI_SETUP_TIMEOUT_MS);

afterAll(() => rmSync(root, { recursive: true, force: true }));

type Seen = { url: string; headers: IncomingHttpHeaders };
type Mode = { serverSchema?: string; latest?: string; tenantId?: string | null };

async function withServer(mode: Mode, check: (url: string, dir: string, seen: Seen[]) => Promise<void>) {
  const dir = mkdtempSync(path.join(root, 'case-'));
  const seen: Seen[] = [];
  const server = createServer((req, res) => {
    seen.push({ url: req.url ?? '', headers: req.headers });
    const json = { 'Content-Type': 'application/json' };
    if (req.url?.startsWith('/@revturbine%2fcli/latest')) {
      if (mode.latest === undefined) { res.writeHead(404).end(); return; }
      res.writeHead(200, json).end(JSON.stringify({ name: '@revturbine/cli', version: mode.latest }));
      return;
    }
    if (req.url?.startsWith('/app/api/config/export')) {
      res.writeHead(200, json).end(JSON.stringify({ ...playbook, ...(mode.serverSchema ? { schema_version: mode.serverSchema } : {}) }));
      return;
    }
    if (req.url === '/app/api/events') { res.writeHead(204).end(); return; }
    res.writeHead(200, json).end(JSON.stringify({ active: null }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server port');
  const origin = `http://127.0.0.1:${address.port}`;
  writeFileSync(path.join(dir, 'credentials.json'), JSON.stringify({ version: 1, credentials: {
    [origin]: { token: TOKEN, tenant_id: mode.tenantId === undefined ? null : mode.tenantId, created_at: '2026-01-01T00:00:00.000Z' },
  } }));
  writeFileSync(path.join(dir, 'x.json'), JSON.stringify(playbook));
  try {
    await check(`${origin}/app`, dir, seen);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function run(args: string[], dir: string, env: Record<string, string> = {}, cwd = dir) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    // Env names are case-sensitive off Windows and undici prefers the lower-case
    // proxy variables even when empty, so remove them rather than blanking them.
    const base: Record<string, string | undefined> = { ...process.env };
    for (const name of Object.keys(base)) if (/^(https?_proxy|no_proxy)$/i.test(name)) delete base[name];
    const child = spawn(process.execPath, [cli!, ...args], {
      cwd,
      env: {
        ...base,
        REVTURBINE_CONFIG_DIR: dir,
        REVTURBINE_TOKEN: '',
        REVTURBINE_HTTP_HEADERS: '',
        REVTURBINE_REGISTRY_URL: '',
        ...env,
      },
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

describe('subcommand usage errors exit 2 (BUG-1436, AC-1)', () => {
  it.each([
    ['validate --file x.json', ['validate', '--file', 'x.json']],
    ['diff --tenant t --live --draft', ['diff', '--tenant', 't', '--live', '--draft']],
    ['a nested subcommand option', ['events', 'track', '--nope']],
    ['a missing required option value', ['diff', '--exit-code', '--url']],
  ])('%s', async (_label, args) => {
    await withServer({}, async (_url, dir) => {
      const out = await run(args, dir);
      expect(out.code, out.stderr).toBe(2);
      expect(out.stderr).toMatch(/error:/);
    });
  }, 30_000);

  it('a mistyped diff never reads as "differences found" (exit 1)', async () => {
    await withServer({}, async (_url, dir) => {
      expect((await run(['diff', 'x.json', 'x.json', '--exit-code', '--tenant', 't'], dir)).code).toBe(2);
    });
  }, 30_000);
});

describe('no x-tenant-id without a configured tenant (BL-0415, AC-7)', () => {
  it('a stored credential with tenant_id null sends no header', async () => {
    await withServer({ tenantId: null }, async (url, dir, seen) => {
      const out = await run(['diff', 'x.json', '--live', '--url', url, '--exit-code'], dir);
      expect(out.code, out.stderr).toBe(0);
      const instance = seen.filter((r) => r.url.startsWith('/app/api/'));
      expect(instance.length).toBeGreaterThan(0);
      for (const r of instance) {
        expect(r.headers.authorization, r.url).toBe(`Bearer ${TOKEN}`);
        expect(r.headers['x-tenant-id'], r.url).toBeUndefined();
      }
    });
  }, 30_000);

  it('a stored tenant is still sent', async () => {
    await withServer({ tenantId: 'tn_stored' }, async (url, dir, seen) => {
      const out = await run(['diff', 'x.json', '--live', '--url', url], dir);
      expect(out.code, out.stderr).toBe(0);
      expect(seen.find((r) => r.url.startsWith('/app/api/config/export'))?.headers['x-tenant-id']).toBe('tn_stored');
    });
  }, 30_000);
});

describe('schema-lag warning (BUG-1189, AC-6)', () => {
  const lag = (stderr: string) => stderr.split('\n').filter((line) => line.includes("the server's schema"));

  it('names a newer published CLI, once, even when diff downloads two versions', async () => {
    await withServer({ serverSchema: '99.0.0', latest: '99.9.9' }, async (url, dir, seen) => {
      const out = await run(['diff', '--live', '--release', 'r1', '--url', url], dir, { REVTURBINE_REGISTRY_URL: new URL(url).origin });
      expect(out.code, out.stderr).toBe(0);
      const lines = lag(out.stderr);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('99.9.9');
      expect(lines[0]).toContain('offline validation may be missing rules');
      expect(seen.filter((r) => r.url.startsWith('/@revturbine%2fcli'))).toHaveLength(1);
    });
  }, 30_000);

  it('is silent when the installed CLI is already the latest published', async () => {
    await withServer({ serverSchema: '99.0.0', latest: INSTALLED }, async (url, dir) => {
      const out = await run(['diff', 'x.json', '--live', '--url', url], dir, { REVTURBINE_REGISTRY_URL: new URL(url).origin });
      expect(out.code, out.stderr).toBe(0);
      expect(lag(out.stderr)).toHaveLength(0);
    });
  }, 30_000);

  it('says it could not check npm, without install advice, when the registry is unreachable', async () => {
    await withServer({ serverSchema: '99.0.0' }, async (url, dir) => {
      const out = await run(['diff', 'x.json', '--live', '--url', url], dir, { REVTURBINE_REGISTRY_URL: new URL(url).origin });
      expect(lag(out.stderr)).toHaveLength(1);
      expect(lag(out.stderr)[0]).toContain('Could not check npm');
      expect(lag(out.stderr)[0]).not.toContain('npm install');
    });
  }, 30_000);

  it('stays silent when the server is not ahead', async () => {
    await withServer({ latest: '99.9.9' }, async (url, dir) => {
      const out = await run(['diff', 'x.json', '--live', '--url', url], dir, { REVTURBINE_REGISTRY_URL: new URL(url).origin });
      expect(lag(out.stderr)).toHaveLength(0);
    });
  }, 30_000);
});

describe('whoami gives no project-folder advice (BUG-822, AC-4)', () => {
  it('the machine-wide login note does not tell the user to create a .revturbine/ folder', async () => {
    await withServer({ tenantId: 'tn_stored' }, async (url, dir) => {
      // No REVTURBINE_CONFIG_DIR: resolve ~/.revturbine from a throwaway home,
      // from a cwd with no project .revturbine/ above it.
      const home = path.join(dir, 'home');
      mkdirSync(path.join(home, '.revturbine'), { recursive: true });
      writeFileSync(path.join(home, '.revturbine', 'credentials.json'), JSON.stringify({ version: 1, credentials: {
        [new URL(url).origin]: { token: TOKEN, tenant_id: 'tn_stored', created_at: '2026-01-01T00:00:00.000Z' },
      } }));
      const out = await run(['whoami', '--url', url], dir, { REVTURBINE_CONFIG_DIR: '', HOME: home, USERPROFILE: home }, path.parse(dir).root);
      expect(out.code, out.stderr).toBe(0);
      const text = out.stdout + out.stderr;
      expect(text).toContain('machine-wide login');
      expect(text).not.toMatch(/\.revturbine[\\/]\s*\)/);
      expect(text).not.toContain('own .revturbine/');
      expect(text).not.toContain('worktree');
    });
  }, 30_000);
});

describe('proxy support (BUG-821, AC-3)', () => {
  it('login reaches the proxy named by HTTP_PROXY', async () => {
    const proxied: string[] = [];
    const proxy = createServer((req, res) => {
      proxied.push(`${req.method} ${req.url}`);
      res.writeHead(500, { 'Content-Type': 'application/json' }).end('{}');
    });
    // undici tunnels through a proxy with CONNECT, even for an http:// target.
    proxy.on('connect', (req, socket) => {
      proxied.push(`CONNECT ${req.url}`);
      socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
    });
    await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve));
    const address = proxy.address();
    if (!address || typeof address === 'string') throw new Error('Missing proxy port');
    const dir = mkdtempSync(path.join(root, 'case-'));
    try {
      const out = await run(['login', 'http://login-target.invalid/app'], dir, { HTTP_PROXY: `http://127.0.0.1:${address.port}` });
      expect(out.code).not.toBe(0);
      expect(proxied.some((line) => line.includes('login-target.invalid'))).toBe(true);
    } finally {
      proxy.closeAllConnections();
      await new Promise<void>((resolve) => proxy.close(() => resolve()));
    }
  }, 30_000);

  it('a dead proxy prints the cause and names the variable, never its value', async () => {
    const dir = mkdtempSync(path.join(root, 'case-'));
    const out = await run(['login', 'https://login-target.invalid/app'], dir, { HTTPS_PROXY: 'http://proxyuser:proxysecret@127.0.0.1:1' });
    expect(out.code).toBe(3);
    expect(out.stderr).toContain('HTTPS_PROXY');
    expect(out.stderr).toMatch(/ECONNREFUSED|ECONNRESET|fetch failed \(/);
    expect(out.stderr).not.toContain('proxysecret');
  }, 30_000);

  it('without a proxy variable a bare network failure still gets the proxy hint', async () => {
    const dir = mkdtempSync(path.join(root, 'case-'));
    const out = await run(['login', 'http://127.0.0.1:1/app'], dir);
    expect(out.code).toBe(3);
    expect(out.stderr).toContain('set HTTPS_PROXY');
  }, 30_000);
});
