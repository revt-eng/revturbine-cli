import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareSourceCli, SOURCE_CLI_SETUP_TIMEOUT_MS } from './helpers/source-cli';

const root = mkdtempSync(path.join(tmpdir(), 'revturbine-customer-cli-'));
const cli = process.env.REVTURBINE_TEST_CLI ?? path.join(root, 'package/dist/cli.js');
const token = 'rtk_fake_customer_operator_token';
const seen: { url: string; method: string; body: unknown; auth?: string }[] = [];
let status = 200;
let disconnect = false;
let nonJson = false;
let base = '';
const server = createServer(async (req, res) => {
  if (req.url === '/app/api/events') { res.writeHead(204).end(); return; }
  let text = '';
  for await (const chunk of req) text += chunk;
  seen.push({ url: req.url!, method: req.method!, body: text ? JSON.parse(text) : undefined, auth: req.headers.authorization });
  if (disconnect) { req.socket.destroy(); return; }
  if (nonJson) { res.writeHead(status, { 'Content-Type': 'text/html' }).end('upstream unavailable'); return; }
  if (status !== 200) { res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: `refused ${token}`, code: 'TEST_ERROR', request_id: 'test' })); return; }
  const parsed = new URL(req.url!, 'http://local');
  let result: unknown = { id: 'record', user_id: 'app-user' };
  if (req.method === 'POST') result = { id: 'created', ...(text ? JSON.parse(text) : {}) };
  else if (parsed.pathname.includes('customer-catalog')) result = { items: [{ handle: 'var_a', price_source: 'clerk' }] };
  else if (parsed.pathname.endsWith('customer-users')) result = { items: parsed.searchParams.get('page') === '1' ? [{ user_id: 'one' }] : [] };
  else if (parsed.pathname.endsWith('customer-entity-links')) result = { items: [] };
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result));
});
beforeAll(async () => {
  if (!process.env.REVTURBINE_TEST_CLI) {
    mkdirSync(path.dirname(cli), { recursive: true });
    writeFileSync(path.join(root, 'package/package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
    buildSync({ entryPoints: [fileURLToPath(new URL('../src/cli.ts', import.meta.url))], outfile: cli, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
    prepareSourceCli(cli, root);
  }
  writeFileSync(path.join(root, 'user.json'), JSON.stringify({ user_id: 'app-user', account_id: 'app-account' }));
  writeFileSync(path.join(root, 'variation.json'), JSON.stringify({ plan_id: 'pro', price_source: 'clerk', price_amount: 1200, billing_period: 'monthly', currency: 'usd', pricing_model: 'flat' }));
  writeFileSync(path.join(root, 'link.json'), JSON.stringify({ external_entity_type: 'billing_price', external_id: 'opaque-price', billing_period: 'monthly', currency: 'usd' }));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');
  base = `http://127.0.0.1:${address.port}/app`;
}, SOURCE_CLI_SETUP_TIMEOUT_MS);
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); rmSync(root, { recursive: true, force: true }); });

function run(args: string[]) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args, '--url', base, '--json'], { cwd: root, env: { ...process.env, REVTURBINE_CONFIG_DIR: root, REVTURBINE_TOKEN: token, REVTURBINE_HTTP_HEADERS: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('CLI test deadline exceeded')); }, 15_000);
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}
const scope = ['--environment', 'env_a', '--provider-instance', 'ins_a'];
describe('built customer CLI HTTP boundary', () => {
  it('creates customer users through the customer route with operator credentials', async () => {
    seen.length = 0;
    const result = await run(['customer-users', 'create', 'user.json']);
    expect(result.code, result.stderr).toBe(0);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ url: '/app/api/customer-users', method: 'POST', auth: `Bearer ${token}`, body: { user_id: 'app-user', account_id: 'app-account' } });
    expect(result.stdout).not.toContain(token);
  });
  it('follows bounded pages', async () => {
    seen.length = 0;
    const result = await run(['customer-users', 'list', '--all', '--per-page', '1']);
    expect(result.code, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ items: [{ user_id: 'one' }] });
    expect(seen.map(r => r.url)).toEqual(['/app/api/customer-users?page=1&per_page=1', '/app/api/customer-users?page=2&per_page=1']);
  });
  it('encodes application IDs', async () => {
    const result = await run(['customer-users', 'get', 'user/a?b']);
    expect(result.code, result.stderr).toBe(0);
    expect(seen.at(-1)?.url).toBe('/app/api/customer-users/user%2Fa%3Fb');
  });
  it('requires catalog selectors', async () => {
    const missing = await run(['plans', 'list', '--environment', 'env_a']);
    expect(missing.code).toBe(2);
  });
  it('carries the exact link scope', async () => {
    const linked = await run(['plan-variations', 'link', 'var_a', 'link.json', '--draft', ...scope]);
    expect(linked.code, linked.stderr).toBe(0);
    expect(seen.at(-1)?.body).toMatchObject({ resource_type: 'plan_variation', resource_key: 'var_a', state: 'draft', provider_instance_id: 'ins_a', environment_id: 'env_a' });
  });
  it('carries the exact catalog environment and release', async () => {
    const read = await run(['plan-variations', 'get', 'var_a', '--release', 'rel_a', '--environment', 'env_a']);
    expect(read.code, read.stderr).toBe(0);
    expect(seen.at(-1)?.url).toContain('state=release&release_id=rel_a&handle=var_a');
  });
  it.each([[401, 3], [422, 4], [409, 5], [500, 7]])('maps HTTP %i and redacts secrets', async (http, exit) => {
    status = http;
    try { const result = await run(['customer-users', 'get', 'x']); expect(result.code).toBe(exit); expect(result.stderr).not.toContain(token); }
    finally { status = 200; }
  });
  it('never retries a catalog POST after a lost response and explains recovery', async () => {
    disconnect = true; seen.length = 0;
    try {
      const result = await run(['plan-variations', 'create', 'variation.json', '--draft', '--environment', 'env_a']);
      expect(result.code).toBe(6); expect(result.stderr).toContain('reconcile');
      expect(seen).toHaveLength(1); expect(seen[0].url).toBe('/app/api/plan-variations?environment_id=env_a');
    } finally { disconnect = false; }
    const recovery = await run(['plan-variations', 'list', '--draft', '--environment', 'env_a']);
    expect(recovery.code, recovery.stderr).toBe(0);
    expect(JSON.parse(recovery.stdout).items[0].handle).toBe('var_a');
  });
  it.each([false, true])('explains uncertain catalog creation after a 502 (HTML: %s)', async (html) => {
    nonJson = html; status = 502; seen.length = 0;
    try {
      const result = await run(['plan-variations', 'create', 'variation.json', '--draft', '--environment', 'env_a']);
      expect(result.code).toBe(7);
      expect(result.stderr).toContain('reconcile');
      expect(result.stderr).not.toContain(token);
      expect(seen).toHaveLength(1);
    } finally { nonJson = false; status = 200; }
  });
  it('preserves the HTTP error class when a proxy returns a non-JSON body', async () => {
    nonJson = true; status = 401;
    try { const result = await run(['customer-users', 'get', 'x']); expect(result.code).toBe(3); }
    finally { nonJson = false; status = 200; }
  });
});
