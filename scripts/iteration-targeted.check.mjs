import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTargets, run } from './iteration-targeted.mjs';
import { testPlan } from './ci-l1.mjs';

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
test('gate policy changes run the selector checks', () => {
  for (const file of ['.github/workflows/pr-gate.yml', 'scripts/ci-l1.mjs']) assert.equal(selectTargets([file]).policy, true);
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
  assert.match(aggregate, /^ {4}name: Iteration exhaustive$/m);
  assert.match(aggregate, /github.event_name == 'push' && github.ref == 'refs\/heads\/main'/);
  assert.match(aggregate, /needs: \[verify, package-smoke\]/);
  assert.match(aggregate, /test "\$\{\{ needs\.verify\.result \}\}" = success && test "\$\{\{ needs\.package-smoke\.result \}\}" = success/);
  // verify runs ci:l1 (scripts/ci-l1.mjs), which reads the PR base's selector from full history.
  const verify = workflow.slice(workflow.indexOf('  verify:'), workflow.indexOf('  package-smoke:'));
  assert.match(verify, /fetch-depth: 0/);
  assert.doesNotMatch(verify, /^ {6}command:/m);
});

test('only pull requests into or out of an iteration branch run targeted tests', () => {
  const pr = (base, head) => testPlan({ GITHUB_EVENT_NAME: 'pull_request', GITHUB_BASE_REF: base, GITHUB_HEAD_REF: head },
    { pull_request: { base: { sha: 'b'.repeat(40) } } });
  assert.deepEqual(testPlan({ GITHUB_EVENT_NAME: 'push' }, {}), { kind: 'exhaustive' });
  assert.deepEqual(testPlan({}, {}), { kind: 'exhaustive' });
  assert.deepEqual(pr('main', 'feature/x'), { kind: 'exhaustive' });
  assert.deepEqual(pr('iteration/IT-12', 'feature/x'), { kind: 'targeted', baseSha: 'b'.repeat(40), baseRef: 'iteration/IT-12', headRef: 'feature/x' });
  assert.equal(pr('main', 'iteration/it-7-slug').kind, 'targeted');
  // startsWith in the old workflow ignored case; the branch-name rule did not.
  assert.equal(pr('Iteration/IT-12', 'feature/x').kind, 'invalid');
  assert.equal(pr('iteration/next', 'feature/x').kind, 'invalid');
});

test('targeted tests run the PR base\'s own selector', () => {
  const script = readFileSync('scripts/ci-l1.mjs', 'utf8');
  assert.match(script, /\['show', `\$\{baseSha\}:scripts\/iteration-targeted\.mjs`\]/);
});
