// Checks on the PR gate (.github/workflows/pr-gate.yml and scripts/ci-l1.mjs), run by `node --test` in
// scripts/ci-l1.mjs (named .check.mjs so vitest does not collect it).
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// "Release exhaustive" is the job name Backlog matches on across repositories (named "Iteration exhaustive" until
// 2026-11-16, which Backlog still accepts): rename it only together with Backlog.
test('exhaustive release evidence is push-only and requires verify and package smoke', () => {
  const workflow = readFileSync('.github/workflows/pr-gate.yml', 'utf8');
  const aggregate = workflow.slice(workflow.indexOf('  release-exhaustive:'));
  assert.match(aggregate, /^ {4}name: Release exhaustive$/m);
  assert.doesNotMatch(workflow, /name: Iteration exhaustive|iteration-exhaustive:/, 'the job is no longer named after Iterations');
  assert.match(aggregate, /github.event_name == 'push' && github.ref == 'refs\/heads\/main'/);
  assert.match(aggregate, /needs: \[verify, package-smoke\]/);
  assert.match(aggregate, /test "\$\{\{ needs\.verify\.result \}\}" = success && test "\$\{\{ needs\.package-smoke\.result \}\}" = success/);
  // verify runs ci:l1 (scripts/ci-l1.mjs) by default, on a full-history checkout.
  const verify = workflow.slice(workflow.indexOf('  verify:'), workflow.indexOf('  package-smoke:'));
  assert.match(verify, /fetch-depth: 0/);
  assert.doesNotMatch(verify, /^ {6}command:/m);
});

// The targeted-tests mode for iteration/ pull requests (scripts/iteration-targeted.mjs, chosen by the PR base) went
// with Iterations (EP-1747): a pull request into release/RL-<n> or main runs every test, like a push.
test('every event runs the whole test suite: there is no targeted mode', () => {
  const script = readFileSync('scripts/ci-l1.mjs', 'utf8');
  assert.ok(script.includes("step('Exhaustive tests', npm(['run', 'test']));"), 'ci:l1 runs npm test unconditionally');
  assert.doesNotMatch(script, /GITHUB_BASE_REF|GITHUB_HEAD_REF|GITHUB_EVENT_NAME/, 'the tests do not depend on the event or branch');
  assert.equal(existsSync('scripts/iteration-targeted.mjs'), false);
});

// A branch's head can be gated by hand (workflow_dispatch): the jobs a pull request runs, no exhaustive job, and
// nothing a push run is read for. The push and pull_request triggers are unchanged. Check names carry " (on demand)"
// on a dispatch so that a dispatched run on a pull request's head never stands in for that pull request's own run.
test('a dispatched run has the pull-request jobs, no exhaustive job, and names of its own', () => {
  const workflow = readFileSync('.github/workflows/pr-gate.yml', 'utf8');
  assert.match(workflow, /^on:\n {2}push:\n {4}branches: \[main\]\n {2}pull_request:\n {2}workflow_dispatch: \{\}\n/m);
  const code = workflow.replace(/^\s*#.*\n/gm, '');
  assert.doesNotMatch(code, /^concurrency:/m, 'concurrency is the shared workflow\'s');
  assert.doesNotMatch(code, /reuse-passed/, 'no lane reuses an earlier pass');
  const jobs = Object.fromEntries(code.slice(code.indexOf('\njobs:\n')).split(/^(?= {2}[a-z][a-z-]+:\n)/m).slice(1)
    .map(block => [block.match(/^ {2}([a-z][a-z-]+):/)[1], block]));
  assert.deepEqual(Object.keys(jobs), ['verify', 'package-smoke', 'release-exhaustive']);
  assert.doesNotMatch(jobs.verify + jobs['package-smoke'], /\n {4}if:/, 'both run on every event, a dispatch included');
  assert.match(jobs['release-exhaustive'], /\n {4}if: always\(\) && github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'\n/);
  assert.match(jobs.verify, /^ {4}name: \$\{\{ github\.event_name == 'workflow_dispatch' && 'verify \(on demand\)' \|\| 'verify' \}\}$/m);
  assert.match(jobs['package-smoke'], /^ {4}name: \$\{\{ github\.event_name == 'workflow_dispatch' && format\('Packed CLI smoke \(Node \{0\}, on demand\)', matrix\.node\) \|\| format\('Packed CLI smoke \(Node \{0\}\)', matrix\.node\) \}\}$/m);
  // What publish-on-main.yml reads is a push run of this workflow.
  assert.match(readFileSync('scripts/gate-result.mjs', 'utf8'), /run\.event !== 'push'/);
});
