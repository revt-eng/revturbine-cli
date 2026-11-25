// Tests for scripts/npm-published.mjs, run by `node --test` in scripts/ci-l1.mjs (named .check.mjs so vitest does
// not collect it): only npm's E404 means "not published". The E404 answer is npm 11.18.0's for a missing version.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { isOnNpm, REGISTRY } from './npm-published.mjs';

const NAME = '@revturbine/cli';
const ask = (result) => isOnNpm(NAME, '0.21.23', () => result);
const error = (code) => JSON.stringify({ error: { code, summary: 's', detail: 'd' } });

test('the exact version on the registry is published', () => {
  let args;
  assert.equal(isOnNpm(NAME, '0.21.23', (a) => { args = a; return { status: 0, stdout: '"0.21.23"\n' }; }), true);
  assert.deepEqual(args, ['view', '@revturbine/cli@0.21.23', 'version', '--json', '--registry', REGISTRY]);
});

test('E404 is the only answer that means not published', () => {
  assert.equal(ask({ status: 1, stdout: error('E404') }), false);
  for (const code of ['E401', 'E403', 'E429', 'E500', 'E503', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', undefined]) {
    assert.throws(() => ask({ status: 1, stdout: error(code) }), /no usable answer/, String(code));
  }
});

test('an answer that cannot be read throws', () => {
  const unreadable = [
    { status: 1, stdout: '', stderr: 'npm error code E404' },
    { status: 1, stdout: '404 Not Found' },
    { status: 0, stdout: '' },
    { status: 0, stdout: 'null' },
    { status: 0, stdout: '"0.21.22"' },
    { status: 0, stdout: '["0.21.23"]' },
    { status: 0, stdout: error('E404') },
    { status: 1, stdout: '"0.21.23"' },
    { status: null, signal: 'SIGTERM', stdout: error('E404') },
    { status: null, stdout: null, error: new Error('spawn npm ENOENT') },
  ];
  for (const result of unreadable) assert.throws(() => ask(result), /no usable answer|did not run/, JSON.stringify(result));
});

test('only a package name and one exact version are asked about', () => {
  const never = () => assert.fail('npm must not run');
  for (const [name, version] of [[undefined, '1.0.0'], ['--x', '1.0.0'], ['a b', '1.0.0'], [NAME, undefined], [NAME, 'latest'], [NAME, '^1.0.0'], [NAME, '1.0.0; x']]) {
    assert.throws(() => isOnNpm(name, version, never), /not a/);
  }
});

// The workflow steps themselves, as bash, against a stub npm: what each writes to GITHUB_OUTPUT and how it exits.
function block(file, step) {
  const workflow = readFileSync(`.github/workflows/${file}`, 'utf8').replace(/\r/g, '');
  return workflow.split(`- name: ${step}\n`)[1].split(/\n {6}(?:- |#)/)[0].split('run: |\n')[1].replace(/^ {10}/gm, '');
}

function decide(script, stub) {
  const dir = mkdtempSync(path.join(tmpdir(), 'npm-published-'));
  try {
    const bin = path.join(dir, 'npm');
    writeFileSync(bin, `#!/bin/sh\n${stub}\n`);
    chmodSync(bin, 0o755);
    const output = path.join(dir, 'output');
    writeFileSync(output, '');
    const result = spawnSync('bash', ['-e', '-c', script], { encoding: 'utf8', env: { ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}`, GITHUB_OUTPUT: output } });
    return { status: result.status, output: readFileSync(output, 'utf8'), log: result.stdout + result.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const [file, step, output] of [
  ['snapshot-patch-release.yml', 'Decide whether a patch release is needed', 'release'],
  ['publish-on-main.yml', 'Resolve version state against the registry', 'published'],
]) {
  test(`${file}: published is true, E404 is false, and any other npm error fails the step`, { skip: process.platform === 'win32' }, () => {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    const script = block(file, step);
    const published = decide(script, `echo '"${version}"'`);
    assert.equal(published.status, 0, published.log);
    assert.match(published.output, new RegExp(`^${output}=true$`, 'm'));

    const missing = decide(script, `echo '${error('E404')}'; exit 1`);
    assert.equal(missing.status, 0, missing.log);
    assert.match(missing.output, new RegExp(`^${output}=false$`, 'm'));

    for (const stub of [`echo '${error('E503')}'; exit 1`, 'echo ECONNRESET >&2; exit 1', 'exit 0']) {
      const failed = decide(script, stub);
      assert.notEqual(failed.status, 0, stub);
      assert.doesNotMatch(failed.output, new RegExp(`^${output}=`, 'm'), stub);
    }
  });
}
