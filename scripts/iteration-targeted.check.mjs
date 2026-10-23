import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTargets, run } from './iteration-targeted.mjs';

test('unknown runtime/config changes fail even when another file has coverage', () => {
  assert.throws(() => selectTargets(['tests/output.test.ts', 'package-lock.json']), /Missing targeted coverage/);
});
test('source dependency coverage and explicit changed tests are retained', () => {
  assert.deepEqual(selectTargets(['src/lib/output.ts', 'tests/output.test.ts']), {
    tests: ['tests/output.test.ts'], related: ['src/lib/output.ts'], policy: false,
  });
});
test('CLI process boundary selects process tests instead of relying on imports', () => {
  assert.ok(selectTargets(['src/cli.ts']).tests.includes('tests/customer-provisioning-http.test.ts'));
});
test('documentation has an explicit no-runtime selection', () => {
  assert.deepEqual(selectTargets(['README.md']), { tests: [], related: [], policy: false });
});
test('runner refuses invalid bases before invoking git', () => {
  assert.throws(() => run('--all', () => assert.fail('must not spawn')), /full PR base/);
});
test('each changed source must pass its own related test command', () => {
  const calls = [];
  run('a'.repeat(40), (command, args) => {
    calls.push([command, args]);
    if (command === 'git') return 'src/lib/output.ts\0src/lib/selectors.ts\0';
  });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[1][1].slice(1), ['related', 'src/lib/output.ts', '--run', '--maxWorkers=1', '--passWithNoTests=false']);
  assert.deepEqual(calls[2][1].slice(1), ['related', 'src/lib/selectors.ts', '--run', '--maxWorkers=1', '--passWithNoTests=false']);
});
test('a failing selected command propagates rather than falling back to full tests', () => {
  assert.throws(() => run('a'.repeat(40), (command) => {
    if (command === 'git') return 'src/lib/output.ts\0';
    throw new Error('No test files found');
  }), /No test files found/);
});

test('installed Vitest rejects an empty related-test selection', () => {
  const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs',
    'related', '__iteration_unmapped_probe__.ts', '--run', '--maxWorkers=1',
    '--passWithNoTests=false'], { encoding: 'utf8' });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}\n${result.stderr}`, /No test files found/);
});

test('exhaustive release evidence is push-only and requires verify and package smoke', () => {
  const workflow = readFileSync('.github/workflows/pr-gate.yml', 'utf8');
  const aggregate = workflow.slice(workflow.indexOf('  iteration-exhaustive:'));
  assert.match(aggregate, /github.event_name == 'push' && github.ref == 'refs\/heads\/main'/);
  assert.match(aggregate, /needs: \[verify, package-smoke\]/);
  assert.match(aggregate, /test "\$VERIFY_RESULT" = success && test "\$SMOKE_RESULT" = success/);
  assert.match(workflow, /if: github.event_name != 'pull_request' \|\| \(!startsWith\(github.base_ref, 'iteration\/'\) && !startsWith\(github.head_ref, 'iteration\/'\)\)/);
  assert.match(workflow, /git show "\$\{ITERATION_BASE_SHA\}:scripts\/iteration-targeted.mjs"/);
});
