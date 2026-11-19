#!/usr/bin/env node
// The gate's result for one commit, read from GitHub Actions, so a workflow that
// publishes a commit can reuse the checks the gate already ran on it instead of
// running them a second time.
//
// The proof is a push run of the gate workflow on exactly that commit, in this
// repository. A pull-request run is never proof: it tests the merge of the pull
// request into its base, another tree, and a fork can start one. A check run by
// name alone is not proof either (any App with checks: write can create one), so
// the jobs are read from the workflow run itself.
//
//   success    a push run of the gate on the commit has every required job
//              completed with conclusion success (with --whole-run: the run
//              itself also completed with conclusion success, so no other job
//              failed)
//   failure    a required job ran and did not pass (failure, timed out, ...),
//              or, with --whole-run, the required jobs passed and the run did
//              not: the gate judged the commit and said no
//   cancelled  the gate did not judge the commit: a required job was cancelled
//              or skipped, or never ran in a run that completed. GitHub cancels
//              a queued run's jobs when a newer run takes its place in a
//              concurrency group, so a third push to a branch does this to the
//              second push's gate. It says nothing about the commit; the caller
//              runs the checks itself.
//   pending    a run could still become a success (jobs queued or in progress)
//   absent     the gate has no push run on the commit (with --max-age-hours:
//              none created within that window)
//   unknown    the GitHub API could not be read, several times in a row
//
// Across several gate runs on one commit: any success wins, then pending, then
// failure, then cancelled.
//
// With --wait-minutes it polls until the result is success, failure or
// cancelled. An absent result is final after --absent-after-minutes (a push
// starts the gate within seconds; a commit pushed with GITHUB_TOKEN never starts
// it). A re-run of a failed gate run turns failure back into pending, then
// success. A failed API read is tried again with backoff, inside the poll loop;
// only MAX_READ_FAILURES failures in a row end the wait, as `unknown`.
//
// Identical copies live in revturbine-cli (publish-on-main.yml) and
// revturbine-sdk-internal (auto-tag-release.yml); change them together.
//
// Usage:
//   node scripts/gate-result.mjs --workflow <file.yml> --sha <commit>
//        --require <job name> [--require ...] [--require-prefix <job name prefix> ...]
//        [--whole-run] [--max-age-hours <n>] [--wait-minutes <n>] [--absent-after-minutes <n>]
//        [--poll-seconds <n>] [--expect success] [--github-output]
// Needs GITHUB_TOKEN (or GH_TOKEN) with actions: read, and GITHUB_REPOSITORY.
// Exit code: 0 when a result was reached (whatever it is, `unknown` included),
// unless --expect names another result; 1 on bad arguments or an unmet --expect.

import { appendFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const FULL_SHA = /^[0-9a-f]{40}$/;
const WORKFLOW_FILE = /^[A-Za-z0-9._-]+\.ya?ml$/;
/** API read failures in a row before the result is `unknown`. */
export const MAX_READ_FAILURES = 5;
/** Conclusions that mean a job did not judge the commit, rather than judged it and failed. */
const DID_NOT_RUN = new Set(['cancelled', 'skipped']);

/**
 * Whether a workflow run can prove anything about `sha`: this repository's own push run of the gate on
 * that commit and, when `maxAgeHours` is given, one created no longer ago than that.
 */
export function isGateRun(run, { sha, repository, workflow, maxAgeHours, now = Date.now }) {
  if (!run || run.head_sha !== sha || run.event !== 'push' || run.path !== `.github/workflows/${workflow}`) return false;
  if (run.repository?.full_name !== repository || run.head_repository?.full_name !== repository) return false;
  if (maxAgeHours === undefined) return true;
  const created = Date.parse(run.created_at ?? '');
  return Number.isFinite(created) && now() - created <= maxAgeHours * 3600000;
}

/** The jobs of a run that a requirement names: an exact job name, or a name prefix. */
export function requiredJobs(jobs, requirement) {
  return (jobs ?? []).filter((job) => (requirement.prefix ? String(job?.name ?? '').startsWith(requirement.name) : job?.name === requirement.name));
}

/** One gate run judged against the requirements: 'success', 'failure', 'cancelled' or 'pending', and why (see the header). */
export function judgeRun(run, jobs, { requirements, wholeRun = false }) {
  const done = run.status === 'completed';
  let pending = null;
  let notRun = null;
  for (const requirement of requirements) {
    const label = requirement.prefix ? `${requirement.name}*` : requirement.name;
    const matching = requiredJobs(jobs, requirement);
    if (!matching.length) {
      if (done) notRun ??= `run ${run.id} completed without a job named ${label}`;
      else pending ??= `run ${run.id} has not started ${label}`;
      continue;
    }
    // A job that ran and did not pass decides the run, whatever happened to the others.
    const failed = matching.find((job) => job.status === 'completed' && job.conclusion !== 'success' && !DID_NOT_RUN.has(job.conclusion));
    if (failed) return { result: 'failure', why: `run ${run.id}: ${failed.name} concluded ${failed.conclusion}` };
    const dropped = matching.find((job) => job.status === 'completed' && DID_NOT_RUN.has(job.conclusion));
    if (dropped) notRun ??= `run ${run.id}: ${dropped.name} was ${dropped.conclusion}`;
    const running = matching.find((job) => job.status !== 'completed');
    if (running) pending ??= `run ${run.id}: ${running.name} is ${running.status}`;
  }
  // Checked after every requirement, so that a real failure beside a cancelled job is still a failure.
  if (notRun) return { result: 'cancelled', why: notRun };
  if (wholeRun) {
    if (done && run.conclusion === 'cancelled') return { result: 'cancelled', why: `run ${run.id} was cancelled` };
    if (done && run.conclusion !== 'success') return { result: 'failure', why: `run ${run.id} concluded ${run.conclusion}` };
    if (!done) pending ??= `run ${run.id} is ${run.status}`;
  }
  return pending ? { result: 'pending', why: pending } : { result: 'success', why: `run ${run.id} has every required job green` };
}

/**
 * The gate's result for a commit from every workflow run GitHub lists for it.
 * @param {{ run: object, jobs: object[] }[]} entries
 */
export function gateResult(entries, options) {
  const gate = (entries ?? []).filter(({ run }) => isGateRun(run, options));
  if (!gate.length) {
    const window = options.maxAgeHours === undefined ? '' : ` created in the last ${options.maxAgeHours} hours`;
    return { result: 'absent', why: `no push run of ${options.workflow} on ${options.sha}${window}` };
  }
  const judged = gate.map(({ run, jobs }) => judgeRun(run, jobs, options));
  return ['success', 'pending', 'failure', 'cancelled'].map((result) => judged.find((j) => j.result === result)).find(Boolean);
}

/**
 * Poll `read` until the result is final (see the header). A read that throws is tried again after 5 s,
 * 10 s, 20 s... (at most a minute); MAX_READ_FAILURES in a row give `unknown`. `now` and `sleep` are
 * injected by the tests.
 */
export async function waitForGate(read, { waitMinutes = 0, absentAfterMinutes = 5, pollSeconds = 20, now = Date.now, sleep = defaultSleep, log = console.log } = {}) {
  const started = now();
  const elapsedMinutes = () => (now() - started) / 60000;
  let last = '';
  let failures = 0;
  for (;;) {
    let outcome;
    try {
      outcome = await read();
      failures = 0;
    } catch (error) {
      failures += 1;
      if (failures >= MAX_READ_FAILURES) return { result: 'unknown', why: `the GitHub API could not be read ${failures} times in a row (${error.message})` };
      const wait = Math.min(60000, 5000 * 2 ** (failures - 1));
      log(`::warning::gate-result: ${error.message} (failure ${failures} of ${MAX_READ_FAILURES}); reading again in ${wait / 1000}s.`);
      await sleep(wait);
      continue;
    }
    if (outcome.why !== last) log(`gate: ${outcome.result} (${outcome.why})`);
    last = outcome.why;
    if (['success', 'failure', 'cancelled'].includes(outcome.result)) return outcome;
    if (outcome.result === 'absent' && elapsedMinutes() >= Math.min(absentAfterMinutes, waitMinutes)) return outcome;
    if (elapsedMinutes() >= waitMinutes) return outcome;
    await sleep(pollSeconds * 1000);
  }
}

function defaultSleep(ms) {
  return delay(ms);
}

export function parseArgs(argv) {
  const options = { requirements: [], wholeRun: false, githubOutput: false, waitMinutes: 0, absentAfterMinutes: 5, pollSeconds: 20 };
  const number = (flag, value) => {
    if (!/^[0-9]+$/.test(String(value ?? ''))) throw new Error(`${flag} takes a whole number; got ${JSON.stringify(value)}`);
    return Number(value);
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--whole-run') options.wholeRun = true;
    else if (arg === '--github-output') options.githubOutput = true;
    else if (arg === '--require') options.requirements.push({ name: argv[++i], prefix: false });
    else if (arg === '--require-prefix') options.requirements.push({ name: argv[++i], prefix: true });
    else if (arg === '--workflow') options.workflow = argv[++i];
    else if (arg === '--sha') options.sha = argv[++i];
    else if (arg === '--expect') options.expect = argv[++i];
    else if (arg === '--max-age-hours') options.maxAgeHours = Math.max(1, number(arg, argv[++i]));
    else if (arg === '--wait-minutes') options.waitMinutes = number(arg, argv[++i]);
    else if (arg === '--absent-after-minutes') options.absentAfterMinutes = number(arg, argv[++i]);
    else if (arg === '--poll-seconds') options.pollSeconds = Math.max(1, number(arg, argv[++i]));
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!WORKFLOW_FILE.test(String(options.workflow ?? ''))) throw new Error('--workflow takes the gate workflow file name, for example pr-gate.yml');
  if (!FULL_SHA.test(String(options.sha ?? ''))) throw new Error(`--sha takes a full commit sha; got ${JSON.stringify(options.sha)}`);
  if (!options.requirements.length || options.requirements.some((r) => !r.name)) throw new Error('name at least one required job with --require or --require-prefix');
  if (options.expect !== undefined && options.expect !== 'success') throw new Error('--expect takes only "success"');
  return options;
}

/** Read the gate runs and their jobs for the commit from the GitHub API. Throws on any response that is not 2xx. */
export async function readEntries(options, { fetcher = fetch, env = process.env } = {}) {
  const token = env.GITHUB_TOKEN || env.GH_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN (actions: read) is not set');
  const api = env.GITHUB_API_URL || 'https://api.github.com';
  const get = async (route) => {
    const response = await fetcher(`${api}${route}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    });
    if (!response.ok) throw new Error(`GET ${route}: HTTP ${response.status}`);
    return response.json();
  };
  const listed = await get(`/repos/${options.repository}/actions/workflows/${options.workflow}/runs?head_sha=${options.sha}&event=push&per_page=100`);
  const runs = (listed.workflow_runs ?? []).filter((run) => isGateRun(run, options));
  const entries = [];
  for (const run of runs) {
    const jobs = [];
    for (let page = 1; page <= 10; page += 1) {
      const body = await get(`/repos/${options.repository}/actions/runs/${run.id}/jobs?filter=latest&per_page=100&page=${page}`);
      jobs.push(...(body.jobs ?? []));
      if (jobs.length >= (body.total_count ?? 0) || !(body.jobs ?? []).length) break;
    }
    entries.push({ run, jobs });
  }
  return entries;
}

async function main(argv) {
  const options = parseArgs(argv);
  options.repository = process.env.GITHUB_REPOSITORY;
  if (!options.repository) throw new Error('GITHUB_REPOSITORY is not set');
  const outcome = await waitForGate(async () => gateResult(await readEntries(options), options), options);
  if (options.githubOutput && process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${outcome.result}\n`);
  console.log(`gate result for ${options.sha}: ${outcome.result} (${outcome.why})`);
  if (options.expect && outcome.result !== options.expect) {
    console.error(`::error::gate-result: expected the ${options.workflow} push run on ${options.sha} to be ${options.expect}, but it is ${outcome.result}: ${outcome.why}.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`::error::gate-result: ${error.message}`);
    process.exit(1);
  });
}
