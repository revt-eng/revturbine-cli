import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type RequestListener } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareSourceCli, SOURCE_CLI_SETUP_TIMEOUT_MS } from './helpers/source-cli';

const repo = fileURLToPath(new URL('../', import.meta.url));
const root = mkdtempSync(path.join(tmpdir(), 'revturbine-sdk-version-'));
const preload = path.join(root, 'registry.mjs');
const shimDir = path.join(root, 'bin');
let cli = process.env.REVTURBINE_TEST_CLI;
let endpoint: string;
let httpsEndpoint: string;
let sequence = 0;
const registryResponse: RequestListener = (req, res) => {
  const url = new URL(req.url!, 'http://localhost');
  if (url.pathname === '/network') { req.socket.destroy(); return; }
  if (url.pathname === '/headers') return;
  if (url.pathname === '/body' || url.pathname === '/late-body') {
    const timer = setTimeout(() => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('{"name":');
    }, url.pathname === '/late-body' ? 1_800 : 0);
    res.on('close', () => clearTimeout(timer));
    return;
  }
  res.writeHead(url.pathname === '/http' ? 503 : 200, { 'content-type': 'application/json' });
  res.end(url.searchParams.get('body'));
};
const server = createServer(registryResponse);
// Public fixture key/certificate, used only for a trusted loopback HTTPS server.
const certificate = path.join(repo, 'tests/fixtures/sdk-version-localhost-cert.pem');
const httpsServer = createHttpsServer({
  key: readFileSync(path.join(repo, 'tests/fixtures/sdk-version-localhost-key.pem')),
  cert: readFileSync(certificate),
}, registryResponse);

beforeAll(async () => {
  if (!cli) {
    cli = path.join(root, 'package', 'dist', 'cli.js');
    mkdirSync(path.dirname(cli), { recursive: true });
    writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
    buildSync({ entryPoints: [path.join(repo, 'src/cli.ts')], outfile: cli, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
    prepareSourceCli(cli, root);
  }
  // Test-only interception: product code always addresses public npm. Use real
  // fetch against loopback so headers/body abort behavior is exercised too.
  writeFileSync(preload, `
    import { appendFileSync, writeFileSync } from 'node:fs';
    process.once('beforeExit', () => writeFileSync(process.env.SDK_DRAINED, 'drained'));
    const nativeFetch = globalThis.fetch;
    globalThis.fetch = (url, options = {}) => {
      appendFileSync(process.env.SDK_REQUESTS, JSON.stringify({ url: String(url), headers: Object.fromEntries(new Headers(options.headers)), credentials: options.credentials, redirect: options.redirect }) + '\\n');
      if (String(url) !== 'https://registry.npmjs.org/@revturbine%2fsdk/latest') throw new Error('unexpected network request');
      return nativeFetch(process.env.SDK_ENDPOINT, options);
    };
  `);
  mkdirSync(shimDir);
  const shim = path.join(shimDir, 'capture.cjs');
  writeFileSync(shim, "require('node:fs').appendFileSync(process.env.SDK_COMMANDS, JSON.stringify(process.argv.slice(2)) + '\\n');\n");
  for (const name of ['npm', 'pnpm', 'yarn', 'npx']) {
    const file = path.join(shimDir, `${name}${process.platform === 'win32' ? '.cmd' : ''}`);
    writeFileSync(file, process.platform === 'win32'
      ? `@"${process.execPath}" "${shim}" ${name} %*\r\n`
      : `#!/bin/sh\nexec '${process.execPath}' '${shim}' ${name} "$@"\n`, { mode: 0o755 });
  }
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fixture server did not listen');
  endpoint = `http://127.0.0.1:${address.port}`;
  await new Promise<void>((resolve) => httpsServer.listen(0, '127.0.0.1', resolve));
  const httpsAddress = httpsServer.address();
  if (!httpsAddress || typeof httpsAddress === 'string') throw new Error('HTTPS fixture server did not listen');
  httpsEndpoint = `https://127.0.0.1:${httpsAddress.port}`;
}, SOURCE_CLI_SETUP_TIMEOUT_MS);

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  httpsServer.closeAllConnections();
  await new Promise<void>((resolve, reject) => httpsServer.close((error) => error ? reject(error) : resolve()));
  rmSync(root, { recursive: true, force: true });
});

function write(dir: string, file: string, value: string) {
  const target = path.join(dir, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, value);
}

function installed(dir: string, version: string, name = '@revturbine/sdk') {
  write(dir, 'node_modules/@revturbine/sdk/package.json', JSON.stringify({ name, version }));
}

function project(spec?: string, version?: string, extra: Record<string, unknown> = {}) {
  const dir = path.join(root, `project-${++sequence}`);
  mkdirSync(dir);
  write(dir, 'package.json', JSON.stringify({ name: 'fixture', dependencies: spec === undefined ? {} : { '@revturbine/sdk': spec }, devDependencies: { '@revturbine/cli': '0.18.2' }, ...extra }));
  if (version) installed(dir, version);
  return dir;
}

const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const lines = (file: string) => existsSync(file) ? readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : [];

async function run(dir: string, options: { args?: string[]; latest?: unknown; body?: string; mode?: string; https?: boolean } = {}) {
  const requests = path.join(root, `requests-${++sequence}.jsonl`);
  const commands = path.join(root, `commands-${sequence}.jsonl`);
  const drained = path.join(root, `drained-${sequence}`);
  const body = options.body ?? JSON.stringify(options.latest ?? { name: '@revturbine/sdk', version: '0.9.3' });
  const env = { ...process.env };
  for (const name of ['NODE_OPTIONS', 'CLAUDECODE', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_ENTRYPOINT', 'CURSOR_TRACE_ID', 'CURSOR', 'CODEX_THREAD_ID', 'CODEX_CI', 'CODEX_SANDBOX', 'npm_config_user_agent', 'REVTURBINE_DELEGATED']) delete env[name];
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
  env[pathKey] = `${shimDir}${path.delimiter}${env[pathKey] ?? ''}`;
  const start = performance.now();
  const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', pathToFileURL(preload).href, cli!, ...(options.args ?? ['--version'])], {
      cwd: dir, env: { ...env, SDK_REQUESTS: requests, SDK_COMMANDS: commands, SDK_DRAINED: drained, SDK_ENDPOINT: `${options.https ? httpsEndpoint : endpoint}/${options.mode ?? 'ok'}?body=${encodeURIComponent(body)}`, NODE_EXTRA_CA_CERTS: certificate, REVTURBINE_CONFIG_DIR: path.join(dir, '.credentials'), NODE_AUTH_TOKEN: 'fixture-secret', NPM_TOKEN: 'fixture-secret' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = ''; let stderr = '';
    const timeout = setTimeout(() => { child.kill(); reject(new Error(`CLI exceeded 7 seconds: ${stderr}`)); }, 7_000);
    child.stdout.on('data', (data: Buffer) => { stdout += data; });
    child.stderr.on('data', (data: Buffer) => { stderr += data; });
    child.on('error', (error) => { clearTimeout(timeout); reject(error); });
    child.on('close', (code) => { clearTimeout(timeout); resolve({ code, stdout, stderr }); });
  });
  return { ...result, elapsed: performance.now() - start, requests: lines(requests), commands: lines(commands), drained: existsSync(drained) };
}

function versionContract(result: Awaited<ReturnType<typeof run>>) {
  expect(result.code, result.stderr).toBe(0);
  expect(result.stdout).toMatch(/^\d+\.\d+\.\d+(?:-test)? \(schema \d+\.\d+\.\d+\)\r?\n$/);
  expect(result.stderr).not.toContain('use a caret');
  expect(result.stdout + result.stderr).not.toContain('fixture-secret');
}

describe('latest SDK installed CLI contract', () => {
  it('drains HTTPS cleanup before successful version exit', async () => {
    const result = await run(project('^0.9.1', '0.9.1'), { https: true });
    versionContract(result);
    expect(result.stderr).toContain('npm install @revturbine/sdk@0.9.3');
    expect(result.stderr).not.toContain('Assertion failed');
    expect(result.drained).toBe(true);
  });

  it.each(['headers', 'body'])('drains a stalled HTTPS %s request without extending its deadline', async (mode) => {
    const result = await run(project('^0.9.1', '0.9.1'), { https: true, mode });
    versionContract(result);
    expect(result.stderr).toContain('SDK version check unavailable');
    expect(result.drained).toBe(true);
    expect(result.elapsed).toBeGreaterThanOrEqual(2_900);
    expect(result.elapsed).toBeLessThan(5_000);
  }, 8_000);

  it('keeps init JSON successful after HTTPS cleanup', async () => {
    const result = await run(project('^0.9.1', '0.9.1'), { https: true, args: ['init', '--dry-run', '--json', '--no-skills'] });
    expect(result.code, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).install).toEqual([]);
    expect(result.stderr).toContain('npm install @revturbine/sdk@0.9.3');
    expect(result.drained).toBe(true);
  });

  it.each([
    ['^0.9.1', '0.9.1', '0.9.3'], ['0.9.1', '0.9.1', '0.9.3'],
    ['^0.9.1', '0.9.1', '0.10.0'], ['^0.0.4', '0.0.4', '0.0.5'],
    ['workspace:*', '0.9.1', '0.9.3'], ['git+https://example.test/sdk', '0.9.1', '0.9.3'],
    ['1.0.0-rc.1', '1.0.0-rc.1', '1.0.0'],
  ])('recommends latest for declaration %s, install %s, latest %s', async (spec, version, latest) => {
    const dir = project(spec, version);
    const before = hash(path.join(dir, 'package.json'));
    const result = await run(dir, { latest: { name: '@revturbine/sdk', version: latest } });
    versionContract(result);
    expect(result.stderr).toContain(`SDK installed ${version}; latest stable ${latest}`);
    expect(result.stderr).toContain(`npm install @revturbine/sdk@${latest}`);
    expect(hash(path.join(dir, 'package.json'))).toBe(before);
    expect(result.requests).toEqual([{ url: 'https://registry.npmjs.org/@revturbine%2fsdk/latest', headers: {}, credentials: 'omit', redirect: 'error' }]);
    expect(existsSync(path.join(dir, '.credentials'))).toBe(false);
  });

  it.each(['0.9.3', '0.9.4', '0.10.0-rc.1'])('does not downgrade installed %s', async (version) => {
    const result = await run(project('^0.9.1', version));
    versionContract(result);
    expect(result.stderr).toContain(version === '0.9.3' ? 'Up to date' : 'no downgrade');
    expect(result.stderr).not.toContain('npm install');
  });

  it.each(['^0.9.1', '0.9.1', '^0.0.4', 'workspace:*', 'git+https://example.test/sdk'])('labels missing installed version for %s', async (spec) => {
    const result = await run(project(spec));
    versionContract(result);
    expect(result.stderr).toContain('installed version unavailable; declared');
    expect(result.stderr).toContain('npm install @revturbine/sdk@0.9.3');
  });

  it.each(['0.9.3', '^0.10.0', '1.0.0-rc.1'])('does not downgrade current/newer declaration %s', async (spec) => {
    const result = await run(project(spec));
    versionContract(result);
    expect(result.stderr).toContain(spec === '0.9.3' ? 'installation could not be verified' : 'no downgrade');
    expect(result.stderr).not.toContain('npm install');
  });

  it.each([
    { body: 'not-json' }, { body: 'null' }, { latest: {} },
    { latest: { name: 'wrong-package', version: '0.9.3' } },
    { latest: { name: '@revturbine/sdk', version: 'v0.9.3' } },
    { latest: { name: '@revturbine/sdk', version: '1.0.0-rc.1' } },
    { mode: 'http' }, { mode: 'network' },
  ])('keeps version output successful when registry unavailable: %j', async (options) => {
    const result = await run(project('0.9.1', '0.9.1'), options);
    versionContract(result);
    expect(result.stderr).toContain('SDK version check unavailable');
    expect(result.stderr).not.toContain('npm install');
    expect(result.requests).toHaveLength(1);
  });

  it.each(['headers', 'body', 'late-body'])('bounds the total %s request and body to three seconds', async (mode) => {
    const result = await run(project('^0.9.1', '0.9.1'), { mode });
    versionContract(result);
    expect(result.stderr).toContain('SDK version check unavailable');
    expect(result.elapsed).toBeGreaterThanOrEqual(2_900);
    expect(result.elapsed).toBeLessThan(5_000);
  }, 8_000);

  it('does not query without a declared SDK, and retains the exact CLI warning', async () => {
    const dir = project(undefined, undefined, { devDependencies: { '@revturbine/cli': '^0.18.2' } });
    const result = await run(dir);
    versionContract(result);
    expect(result.requests).toEqual([]);
    expect(result.stderr).toContain('CLI must be EXACT');
  });

  it('resolves a hoisted SDK only inside the project repository boundary', async () => {
    const dir = project('^0.9.1');
    mkdirSync(path.join(dir, '.git'));
    installed(dir, '0.9.1');
    const app = path.join(dir, 'apps', 'app');
    write(app, 'package.json', JSON.stringify({ dependencies: { '@revturbine/sdk': '^0.9.1' } }));
    const result = await run(app);
    expect(result.stderr).toContain('SDK installed 0.9.1; latest stable 0.9.3');
    const nested = path.join(dir, 'separate');
    write(nested, 'package.json', JSON.stringify({ dependencies: { '@revturbine/sdk': '^0.9.1' } }));
    mkdirSync(path.join(nested, '.git'));
    expect((await run(nested)).stderr).toContain('installed version unavailable');
  });

  it('falls back if the nearest installation is invalid instead of using the CLI runtime SDK', async () => {
    const dir = project('^0.9.1');
    installed(dir, '0.9.1', 'wrong-package');
    expect((await run(dir)).stderr).toContain('installed version unavailable');
    write(dir, 'node_modules/@revturbine/sdk/package.json', 'bad-json');
    expect((await run(dir)).stderr).toContain('installed version unavailable');
  });

  it('checks init --dir, preserves existing files, and keeps JSON free of diagnostics', async () => {
    const cwd = project('1.0.0', '1.0.0');
    const target = project('^0.9.1', '0.9.1', { packageManager: 'pnpm@10.0.0' });
    write(target, 'src/provider.tsx', "import { RevTurbineProvider } from '@revturbine/sdk';");
    write(target, 'server/playbook.json', '{"artifact_type":"playbook","custom":"preserved"}');
    const files = ['package.json', 'src/provider.tsx', 'server/playbook.json'].map((file) => path.join(target, file));
    const before = files.map(hash);
    const result = await run(cwd, { args: ['init', '--dir', target, '--yes', '--no-skills', '--json'] });
    expect(result.code, result.stderr).toBe(0);
    expect(result.stderr).toContain('SDK installed 0.9.1; latest stable 0.9.3');
    expect(result.stderr).toContain('pnpm add @revturbine/sdk@0.9.3');
    const plan = JSON.parse(result.stdout);
    expect(Object.keys(plan).sort()).toEqual(['dir', 'install', 'manager', 'playbook', 'project', 'skipped', 'skills', 'skills_agent', 'stack'].sort());
    expect(plan.install).toEqual([]);
    expect(plan.playbook).toBe('skipped');
    expect(result.commands).toEqual([]);
    expect(files.map(hash)).toEqual(before);
    expect(existsSync(path.join(target, 'revturbine.playbook.json'))).toBe(false);
  });

  it.each(['npm', 'pnpm', 'yarn'])('fresh init installs checked latest through %s without forcing a save prefix', async (manager) => {
    const dir = project(undefined, undefined, { packageManager: `${manager}@10.0.0` });
    const result = await run(dir, { args: ['init', '--yes', '--no-skills', '--json'] });
    expect(result.code, result.stderr).toBe(0);
    expect(result.commands).toEqual([[manager, manager === 'npm' ? 'install' : 'add', '@revturbine/sdk@0.9.3']]);
    expect(JSON.parse(result.stdout).install).toEqual([{ spec: '@revturbine/sdk@0.9.3', dev: false, exact: false }]);
  });

  it('fresh init requests @latest if the advisory is offline', async () => {
    const result = await run(project(), { args: ['init', '--yes', '--no-skills', '--json'], mode: 'network' });
    expect(result.code, result.stderr).toBe(0);
    expect(result.stderr).toContain('SDK version check unavailable');
    expect(result.commands).toEqual([['npm', 'install', '@revturbine/sdk@latest']]);
    expect(JSON.parse(result.stdout).install[0].spec).toBe('@revturbine/sdk@latest');
  });

  it('keeps an existing init JSON plan and files intact when the response body stalls', async () => {
    const dir = project('^0.9.1', '0.9.1');
    const before = hash(path.join(dir, 'package.json'));
    const result = await run(dir, { args: ['init', '--dry-run', '--no-skills', '--json'], mode: 'late-body' });
    expect(result.code, result.stderr).toBe(0);
    expect(result.stderr).toContain('SDK version check unavailable');
    expect(JSON.parse(result.stdout).install).toEqual([]);
    expect(hash(path.join(dir, 'package.json'))).toBe(before);
    expect(result.elapsed).toBeLessThan(5_000);
  }, 8_000);

  it('preserves dev dependency placement in the recommendation', async () => {
    const dir = project(undefined, undefined, { devDependencies: { '@revturbine/sdk': '0.9.1' }, packageManager: 'yarn@4.0.0' });
    const result = await run(dir, { args: ['-V'] });
    versionContract(result);
    expect(result.stderr).toContain('yarn add -D @revturbine/sdk@0.9.3');
  });

  it.each([
    ['validate', path.join(repo, 'tests/fixtures/valid.export-config.json')],
    ['--help'], ['schema', '--help'],
  ])('adds no version request to %j', async (...args) => {
    const result = await run(project('0.9.1', '0.9.1'), { args });
    expect(result.code, result.stderr).toBe(0);
    expect(result.requests).toEqual([]);
    expect(result.stderr).not.toContain('SDK version');
  });
});
