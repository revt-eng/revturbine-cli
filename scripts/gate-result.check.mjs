// Tests for scripts/gate-result.mjs, run by `node --test` in scripts/ci-l1.mjs (named .check.mjs so vitest does
// not collect it): which workflow runs prove a commit, how one run is judged, and when the wait ends.
import assert from 'node:assert/strict';
import test from 'node:test';
import { gateResult, isGateRun, judgeRun, parseArgs, readEntries, waitForGate } from './gate-result.mjs';

const SHA = 'a'.repeat(40);
const REPO = 'revt-eng/revturbine-cli';
const OPTIONS = {
  sha: SHA,
  repository: REPO,
  workflow: 'pr-gate.yml',
  wholeRun: true,
  requirements: [{ name: 'verify / l1', prefix: false }, { name: 'Packed CLI smoke (', prefix: true }],
};
const run = (over = {}) => ({
  id: 1,
  head_sha: SHA,
  event: 'push',
  path: '.github/workflows/pr-gate.yml',
  status: 'completed',
  conclusion: 'success',
  repository: { full_name: REPO },
  head_repository: { full_name: REPO },
  ...over,
});
const job = (name, conclusion = 'success', status = 'completed') => ({ name, status, conclusion: status === 'completed' ? conclusion : null });
const green = () => [job('verify / l1'), job('Packed CLI smoke (Node 24) / smoke-node-24'), job('Packed CLI smoke (Node 22.13.0) / smoke-node-22.13.0'), job('Release exhaustive / aggregate')];

test('only this repository\'s own push run of the gate on the commit is proof', () => {
  assert.equal(isGateRun(run(), OPTIONS), true);
  assert.equal(isGateRun(run({ event: 'pull_request' }), OPTIONS), false, 'a pull-request run tests the merge commit, and a fork can start one');
  assert.equal(isGateRun(run({ head_sha: 'b'.repeat(40) }), OPTIONS), false);
  assert.equal(isGateRun(run({ path: '.github/workflows/publish-on-main.yml' }), OPTIONS), false);
  assert.equal(isGateRun(run({ head_repository: { full_name: 'someone/fork' } }), OPTIONS), false);
  assert.equal(isGateRun(run({ repository: { full_name: 'someone/fork' } }), OPTIONS), false);
  assert.equal(isGateRun(null, OPTIONS), false);
});

test('a green run with every required job green is a success', () => {
  assert.equal(judgeRun(run(), green(), OPTIONS).result, 'success');
  assert.equal(gateResult([{ run: run(), jobs: green() }], OPTIONS).result, 'success');
});

test('a failed, cancelled or skipped required job is a failure', () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', 'timed_out']) {
    const jobs = green();
    jobs[2] = job('Packed CLI smoke (Node 22.13.0) / smoke-node-22.13.0', conclusion);
    const judged = judgeRun(run({ conclusion: 'failure' }), jobs, OPTIONS);
    assert.equal(judged.result, 'failure', conclusion);
    assert.match(judged.why, /smoke-node-22\.13\.0 concluded/);
  }
});

test('a completed run that never ran a required job is a failure, not a success', () => {
  const judged = judgeRun(run(), [job('verify / l1'), job('Release exhaustive / aggregate')], OPTIONS);
  assert.equal(judged.result, 'failure');
  assert.match(judged.why, /without a job named Packed CLI smoke \(\*/);
});

test('with --whole-run, a job outside the requirements that failed fails the result', () => {
  const failedRun = run({ conclusion: 'failure' });
  assert.equal(judgeRun(failedRun, green(), OPTIONS).result, 'failure');
  // Without it only the required jobs count (the SDK's pre-tag lookup needs one job, not the whole gate).
  assert.equal(judgeRun(failedRun, green(), { ...OPTIONS, wholeRun: false }).result, 'success');
});

test('queued or running jobs are pending, and so is a run whose required jobs are green but which has not finished', () => {
  const running = green();
  running[0] = job('verify / l1', null, 'in_progress');
  assert.equal(judgeRun(run({ status: 'in_progress', conclusion: null }), running, OPTIONS).result, 'pending');
  assert.equal(judgeRun(run({ status: 'queued', conclusion: null }), [], OPTIONS).result, 'pending');
  assert.equal(judgeRun(run({ status: 'in_progress', conclusion: null }), green().slice(0, 3), OPTIONS).result, 'pending');
  // The required jobs alone are enough when the whole run is not asked for.
  assert.equal(judgeRun(run({ status: 'in_progress', conclusion: null }), green().slice(0, 3), { ...OPTIONS, wholeRun: false }).result, 'success');
});

test('a failed required job decides the run even while other jobs still run', () => {
  const jobs = [job('verify / l1', 'failure'), job('Packed CLI smoke (Node 24) / smoke-node-24', null, 'in_progress')];
  assert.equal(judgeRun(run({ status: 'in_progress', conclusion: null }), jobs, OPTIONS).result, 'failure');
});

test('no gate run on the commit is absent; runs that prove nothing are ignored', () => {
  assert.equal(gateResult([], OPTIONS).result, 'absent');
  assert.equal(gateResult([{ run: run({ event: 'pull_request' }), jobs: green() }], OPTIONS).result, 'absent');
});

test('across several gate runs on one commit: any success wins, then pending, then failure', () => {
  const failed = { run: run({ id: 1, conclusion: 'failure' }), jobs: [job('verify / l1', 'failure')] };
  const pending = { run: run({ id: 2, status: 'in_progress', conclusion: null }), jobs: [] };
  const ok = { run: run({ id: 3 }), jobs: green() };
  assert.equal(gateResult([failed, pending, ok], OPTIONS).result, 'success');
  assert.equal(gateResult([failed, pending], OPTIONS).result, 'pending');
  assert.equal(gateResult([failed], OPTIONS).result, 'failure');
});

function clock() {
  let t = 0;
  const logs = [];
  return { now: () => t, sleep: async (ms) => { t += ms; }, log: (line) => logs.push(line), logs };
}

test('the wait ends at the first success or failure', async () => {
  const c = clock();
  const answers = [{ result: 'pending', why: 'a' }, { result: 'pending', why: 'a' }, { result: 'success', why: 'b' }];
  const outcome = await waitForGate(async () => answers.shift(), { waitMinutes: 40, pollSeconds: 20, ...c });
  assert.equal(outcome.result, 'success');
  assert.equal(c.now(), 40000);
  assert.equal(c.logs.length, 2, 'an unchanged state is logged once');
});

test('an absent gate is final after the absent window, long before the wait would end', async () => {
  const c = clock();
  const outcome = await waitForGate(async () => ({ result: 'absent', why: 'none' }), { waitMinutes: 40, absentAfterMinutes: 5, pollSeconds: 20, ...c });
  assert.equal(outcome.result, 'absent');
  assert.equal(c.now(), 5 * 60000);
});

test('a gate that never finishes is still pending when the wait ends', async () => {
  const c = clock();
  const outcome = await waitForGate(async () => ({ result: 'pending', why: 'slow' }), { waitMinutes: 2, pollSeconds: 30, ...c });
  assert.equal(outcome.result, 'pending');
  assert.equal(c.now(), 2 * 60000);
});

test('without a wait the result is read once', async () => {
  const c = clock();
  let reads = 0;
  const outcome = await waitForGate(async () => { reads += 1; return { result: 'pending', why: 'x' }; }, c);
  assert.equal(outcome.result, 'pending');
  assert.equal(reads, 1);
});

test('arguments: a workflow file, a full sha and at least one required job', () => {
  const parsed = parseArgs(['--workflow', 'pr-gate.yml', '--sha', SHA, '--require', 'verify / l1', '--require-prefix', 'Packed CLI smoke (', '--whole-run', '--wait-minutes', '40', '--expect', 'success']);
  assert.deepEqual(parsed.requirements, OPTIONS.requirements);
  assert.equal(parsed.wholeRun, true);
  assert.equal(parsed.waitMinutes, 40);
  assert.throws(() => parseArgs(['--workflow', '../x.yml', '--sha', SHA, '--require', 'a']), /--workflow/);
  assert.throws(() => parseArgs(['--workflow', 'pr-gate.yml', '--sha', 'abc', '--require', 'a']), /full commit sha/);
  assert.throws(() => parseArgs(['--workflow', 'pr-gate.yml', '--sha', SHA]), /at least one required job/);
  assert.throws(() => parseArgs(['--workflow', 'pr-gate.yml', '--sha', SHA, '--require', 'a', '--expect', 'failure']), /--expect/);
  assert.throws(() => parseArgs(['--workflow', 'pr-gate.yml', '--sha', SHA, '--require', 'a', '--wait-minutes', 'soon']), /whole number/);
  assert.throws(() => parseArgs(['--bogus']), /unknown argument/);
});

test('the API read asks for push runs on the commit and takes the jobs of the latest attempt', async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    const body = url.includes('/jobs?')
      ? { total_count: 4, jobs: green() }
      : { workflow_runs: [run(), run({ id: 2, event: 'pull_request' })] };
    return { ok: true, status: 200, json: async () => body };
  };
  const entries = await readEntries(OPTIONS, { fetcher, env: { GITHUB_TOKEN: 't', GITHUB_API_URL: 'https://api.example' } });
  assert.equal(entries.length, 1, 'a run that is not this repository\'s push run is not read');
  assert.equal(calls[0], `https://api.example/repos/${REPO}/actions/workflows/pr-gate.yml/runs?head_sha=${SHA}&event=push&per_page=100`);
  assert.equal(calls[1], `https://api.example/repos/${REPO}/actions/runs/1/jobs?filter=latest&per_page=100&page=1`);
  assert.equal(gateResult(entries, OPTIONS).result, 'success');
  await assert.rejects(readEntries(OPTIONS, { fetcher: async () => ({ ok: false, status: 502 }), env: { GITHUB_TOKEN: 't' } }), /HTTP 502/);
  await assert.rejects(readEntries(OPTIONS, { fetcher, env: {} }), /GITHUB_TOKEN/);
});
