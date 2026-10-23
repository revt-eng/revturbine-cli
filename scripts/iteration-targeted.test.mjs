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
  assert.deepEqual(calls[1][1].slice(1), ['related', 'src/lib/output.ts', '--run', '--maxWorkers=1']);
  assert.deepEqual(calls[2][1].slice(1), ['related', 'src/lib/selectors.ts', '--run', '--maxWorkers=1']);
});
test('a failing selected command propagates rather than falling back to full tests', () => {
  assert.throws(() => run('a'.repeat(40), (command) => {
    if (command === 'git') return 'src/lib/output.ts\0';
    throw new Error('No test files found');
  }), /No test files found/);
});
