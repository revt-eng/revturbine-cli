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
