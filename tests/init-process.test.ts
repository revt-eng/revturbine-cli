import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareSourceCli, SOURCE_CLI_SETUP_TIMEOUT_MS } from './helpers/source-cli';

const repo = fileURLToPath(new URL('../', import.meta.url));
const root = mkdtempSync(path.join(tmpdir(), 'revturbine-init-'));
const shimDir = path.join(root, 'bin');
const preload = path.join(root, 'offline-registry.mjs');
let cli = process.env.REVTURBINE_TEST_CLI;

beforeAll(() => {
  writeFileSync(preload, "globalThis.fetch = async () => { throw new Error('offline fixture'); };\n");
  if (!cli) {
    cli = path.join(root, 'package', 'dist', 'cli.js');
    mkdirSync(path.dirname(cli), { recursive: true });
    writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
    buildSync({ entryPoints: [path.join(repo, 'src/cli.ts')], outfile: cli, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
    prepareSourceCli(cli, root);
  }
  mkdirSync(shimDir);
  const shim = path.join(shimDir, 'capture.cjs');
  writeFileSync(shim, "require('node:fs').appendFileSync(process.env.INIT_CAPTURE, JSON.stringify(process.argv.slice(2)) + '\\n');\n");
  for (const name of ['npm', 'npx']) {
    if (process.platform === 'win32') {
      writeFileSync(path.join(shimDir, `${name}.cmd`), `@"${process.execPath}" "${shim}" ${name} %*\r\n`);
    } else {
      const file = path.join(shimDir, name);
      writeFileSync(file, `#!/bin/sh\nexec '${process.execPath}' '${shim}' ${name} "$@"\n`, { mode: 0o755 });
    }
  }
}, SOURCE_CLI_SETUP_TIMEOUT_MS);

afterAll(() => rmSync(root, { recursive: true, force: true }));

function project(name: string, dependencies?: Record<string, string>) {
  const dir = path.join(root, name);
  mkdirSync(dir);
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, dependencies, devDependencies: { '@revturbine/cli': '0.17.2' } }));
  return dir;
}

function write(dir: string, file: string, content: string) {
  const target = path.join(dir, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  return () => createHash('sha256').update(readFileSync(target)).digest('hex');
}

function run(dir: string, args: string[] = [], agentEnv: Record<string, string> = {}) {
  const env = { ...process.env };
  for (const name of ['CLAUDECODE', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_ENTRYPOINT', 'CURSOR_TRACE_ID', 'CURSOR', 'CODEX_THREAD_ID', 'CODEX_CI', 'CODEX_SANDBOX', 'npm_config_user_agent']) delete env[name];
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
  env[pathKey] = `${shimDir}${path.delimiter}${env[pathKey] ?? ''}`;
  const capture = path.join(dir, 'commands.jsonl');
  const result = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, cli!, 'init', '--dir', dir, '--yes', ...args], {
    cwd: dir,
    env: { ...env, ...agentEnv, INIT_CAPTURE: capture, REVTURBINE_CONFIG_DIR: path.join(dir, '.credentials') },
    encoding: 'utf8', timeout: 20_000,
  });
  const commands = existsSync(capture) ? readFileSync(capture, 'utf8').trim().split('\n').map((line) => JSON.parse(line) as string[]) : [];
  return { ...result, commands };
}

describe('init process contract (also run against the installed npm tarball)', () => {
  it('creates a valid starter for a fresh project without changing existing app files', () => {
    const dir = project('fresh');
    const hash = write(dir, 'src/app.tsx', 'export const App = () => null;');
    const before = hash();
    const result = run(dir, ['--no-skills']);
    expect(result.status, result.stderr).toBe(0);
    expect(hash()).toBe(before);
    const playbook = path.join(dir, 'revturbine.playbook.json');
    expect(existsSync(playbook)).toBe(true);
    expect(() => execFileSync(process.execPath, [cli!, 'validate', playbook], { cwd: dir, stdio: 'pipe' })).not.toThrow();
    expect(result.commands).toEqual([['npm', 'install', '@revturbine/sdk@latest']]);
  });

  it('preserves an existing SDK/provider/non-root Playbook integration', () => {
    const dir = project('existing', { '@revturbine/sdk': '0.8.8' });
    const hashes = [
      write(dir, 'server/library/revturbine/config.json', '{"artifact_type":"playbook","custom":"kept"}'),
      write(dir, 'src/provider.tsx', "import { RevTurbineProvider } from '@revturbine/sdk';"),
      () => createHash('sha256').update(readFileSync(path.join(dir, 'package.json'))).digest('hex'),
    ];
    const before = hashes.map((hash) => hash());
    const result = run(dir, ['--no-skills', '--json']);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(path.join(dir, 'revturbine.playbook.json'))).toBe(false);
    expect(hashes.map((hash) => hash())).toEqual(before);
    expect(JSON.parse(result.stdout).playbook).toBe('skipped');
    expect(result.commands).toEqual([]);
    expect(result.stderr).toContain('--scaffold');
  });

  it.each(['provider', 'playbook'])('recognizes a %s without a root SDK dependency', (signal) => {
    const dir = project(`signal-${signal}`);
    const hash = signal === 'provider'
      ? write(dir, 'src/provider.tsx', "import { RevTurbineProvider } from '@revturbine/sdk';")
      : write(dir, 'server/config.json', '{"artifact_type":"playbook","format_version":1}');
    const before = hash();
    const result = run(dir, ['--no-skills']);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(path.join(dir, 'revturbine.playbook.json'))).toBe(false);
    expect(hash()).toBe(before);
  });

  it('creates a missing starter only when explicitly requested in an existing integration', () => {
    const dir = project('override', { '@revturbine/sdk': '^0.7.1' });
    const hash = write(dir, 'server/config.json', '{"artifact_type":"playbook"}');
    const before = hash();
    const result = run(dir, ['--no-skills', '--scaffold']);
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(path.join(dir, 'revturbine.playbook.json'))).toBe(true);
    expect(hash()).toBe(before);
  });

  it.each([{ flags: [] }, { flags: ['--scaffold'] }])('never overwrites the root Playbook, flags $flags', ({ flags }) => {
    const dir = project(`root-${flags.length}`, { '@revturbine/sdk': '^0.7.1' });
    const hash = write(dir, 'revturbine.playbook.json', '{"keep":"even an unfinished file"}\n');
    const before = hash();
    const result = run(dir, ['--no-skills', ...flags]);
    expect(result.status, result.stderr).toBe(0);
    expect(hash()).toBe(before);
  });

  it.each([
    [{ CLAUDECODE: '1' }, 'claude-code'],
    [{ CURSOR_TRACE_ID: 'test' }, 'cursor'],
    [{ CODEX_THREAD_ID: 'test' }, 'codex'],
  ] as const)('targets only the detected harness %j', (env, agent) => {
    const dir = project(`agent-${agent}`, { '@revturbine/sdk': '^0.7.1' });
    const result = run(dir, [], env);
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands).toEqual([['npx', '--yes', 'skills', 'add', 'revt-eng/revturbine-skills', '-y', '--copy', '-a', agent]]);
  });

  it('lets explicit validated agent selection override environment detection', () => {
    const dir = project('explicit-agent', { '@revturbine/sdk': '^0.7.1' });
    const result = run(dir, ['--agent', 'codex'], { CLAUDECODE: '1' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands[0]?.slice(-2)).toEqual(['-a', 'codex']);
    expect(result.stdout).toContain('Codex');
  });

  it('rejects invalid installer targets before any writes or subprocesses', () => {
    const dir = path.join(root, 'invalid-agent');
    mkdirSync(dir);
    const result = run(dir, ['--agent', 'codex&echo-bad']);
    expect(result.status).toBe(2);
    expect(existsSync(path.join(dir, 'package.json'))).toBe(false);
    expect(result.commands).toEqual([]);
  });

  it('skips unknown harnesses with a scoped manual command, without prompting', () => {
    const dir = project('unknown-agent', { '@revturbine/sdk': '^0.7.1' });
    const result = run(dir);
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands).toEqual([]);
    expect(result.stderr).toContain('--agent');
    expect(result.stdout).not.toContain('Installed the Agent Skills');
  });

  it('preserves --no-skills even when a target is known', () => {
    const dir = project('no-skills', { '@revturbine/sdk': '^0.7.1' });
    const result = run(dir, ['--no-skills', '--agent', 'codex']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands).toEqual([]);
  });

  it('dry-run reports the same decisions without writing or installing', () => {
    const dir = project('dry', { '@revturbine/sdk': '^0.7.1' });
    const result = run(dir, ['--dry-run', '--agent', 'codex', '--json']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands).toEqual([]);
    expect(existsSync(path.join(dir, 'revturbine.playbook.json'))).toBe(false);
    expect(JSON.parse(result.stdout).playbook).toBe('skipped');
    expect(result.stderr).toContain('-a codex');
  });
});
