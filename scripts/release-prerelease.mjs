#!/usr/bin/env node
// Release prereleases (EP-1747 phase 5; ST-1754, ST-1755, ST-1757, ST-1758).
//
// A push to release/RL-<n> publishes this repository's packages as
// <next>-rl.<n>.<k> under the dist-tag rl-<n>, so the other repositories in the
// same Release can pin them by exact version before anything is final. It never
// moves `latest` or any other dist-tag and never commits: the version is stamped
// into the job's checkout only. .github/workflows/release-prerelease.yml calls:
//
//   plan     Compute the versions. <n> comes from the branch name. <next> is the
//            manifest's version when that version is not published yet (a bump
//            already waiting in the Release), else its next patch; it is only a
//            prediction, and the final version is read from the registry after
//            the merge (decision 7). <k> is the workflow's run number. When an
//            earlier run already reported this commit for this Release, the plan
//            reuses those versions and nothing is published again.
//   version  Print the planned version for one package directory.
//   publish  Publish one package under rl-<n>, unless that version is already in
//            the registry (a re-run). Refuses a package with no `latest` yet (its
//            first publish would set `latest`), and puts `latest` back if the
//            registry moved it.
//   report   Write the `name@version` lines to the job summary and to a check run
//            named `release-prerelease` on the commit, which Backlog reads and
//            confirms against the registry. `--failed` reports a failed run.
//
// Why the run number for <k>: it only grows, so a later build of the Release
// always sorts after an earlier one, and a re-run of a run keeps its number, so a
// re-run recomputes the same version and finds it already published. Counting
// the Release's versions in the registry would need the registry to say which
// commit each version came from, and in a repository that publishes several
// packages the counts can disagree after a partial failure.
//
// Identical copies live in revturbine-scaffold, revturbine-sdk-internal,
// revturbine-cli and create-revturbine; change them together.
//
// Usage:
//   node scripts/release-prerelease.mjs plan --package <dir> [--package <dir>...] [--lockstep]
//        [--branch release/RL-<n>] [--build <k>] [--state <file>] [--env-out <file>] [--github-output]
//   node scripts/release-prerelease.mjs version <dir> [--state <file>]
// (--env-out, not --env-file: Node reads --env-file from anywhere on its command line.)
//   node scripts/release-prerelease.mjs publish <dir> [--state <file>] [-- <npm publish args>]
//   node scripts/release-prerelease.mjs report [--failed] [--state <file>]

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const CHECK_NAME = 'release-prerelease';
export const RELEASE_BRANCH = /^release\/RL-([1-9][0-9]*)$/;
const EXACT = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const DEFAULT_REGISTRY = 'https://registry.npmjs.org/';

/** The Release a branch belongs to: release/RL-12 -> { release: 'RL-12', n: 12, tag: 'rl-12' }. */
export function releaseFromBranch(branch) {
  const match = RELEASE_BRANCH.exec(String(branch ?? ''));
  if (!match) throw new Error(`not a Release branch: ${JSON.stringify(branch)} (expected release/RL-<n>)`);
  const n = Number(match[1]);
  return { release: `RL-${n}`, n, tag: `rl-${n}` };
}

/** The build number <k>: the workflow's run number, a positive integer. */
export function buildNumber(value) {
  const text = String(value ?? '');
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error(`build number must be a positive integer; got ${JSON.stringify(value)}`);
  return Number(text);
}

/** <next>: the manifest's version when it is not published yet, else its next patch. */
export function nextVersion(base, published) {
  const match = EXACT.exec(String(base ?? ''));
  if (!match) throw new Error(`a package version must be X.Y.Z before a prerelease is cut; got ${JSON.stringify(base)}`);
  return published ? `${match[1]}.${match[2]}.${Number(match[3]) + 1}` : base;
}

/** <next>-rl.<n>.<k>. */
export function prereleaseVersion(next, n, k) {
  return `${next}-rl.${n}.${k}`;
}

/** `name@version` lines (a report's text); anything else on a line is ignored. */
export function parseReportLines(text) {
  const lines = [];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    const at = line.lastIndexOf('@');
    if (at <= 0) continue;
    const name = line.slice(0, at);
    const version = line.slice(at + 1);
    if (PACKAGE_NAME.test(name) && SEMVER.test(version)) lines.push({ name, version });
  }
  return lines;
}

/** The newest successful `release-prerelease` check run for this Release, as report lines, or null. */
export function priorReport(checkRuns, release) {
  const runs = (checkRuns ?? [])
    .filter((run) => run?.name === CHECK_NAME && run.conclusion === 'success' && run.external_id === release)
    .sort((a, b) => String(b.completed_at ?? '').localeCompare(String(a.completed_at ?? '')));
  for (const run of runs) {
    const lines = parseReportLines(run.output?.text);
    if (lines.length) return lines;
  }
  return null;
}

/** The registry a package publishes to: publishConfig.registry, else the public registry. */
export function registryOf(manifest) {
  const registry = manifest?.publishConfig?.registry || DEFAULT_REGISTRY;
  return registry.endsWith('/') ? registry : `${registry}/`;
}

/** The report's machine-readable text: one `name@version` per line. */
export function reportText(packages) {
  return packages.map((p) => `${p.name}@${p.version}`).join('\n');
}

// ── registry ────────────────────────────────────────────────────────────────

function npm(args, options = {}) {
  // npm is a .cmd shim on Windows; the arguments are fixed flags and validated values.
  return spawnSync('npm', args, { encoding: 'utf8', shell: process.platform === 'win32', ...options });
}

/** `npm view <spec> <field> --json`: the value, or null when the registry has no such package or version. */
export function npmView(spec, field, registry, run = npm) {
  const result = run(['view', spec, field, '--json', '--registry', registry]);
  const out = String(result.stdout ?? '').trim();
  let parsed;
  try {
    parsed = out ? JSON.parse(out) : null;
  } catch {
    parsed = null;
  }
  if (parsed && typeof parsed === 'object' && parsed.error) {
    if (parsed.error.code === 'E404') return null;
    throw new Error(`npm view ${spec} ${field} failed: ${parsed.error.code} ${parsed.error.summary ?? ''}`.trim());
  }
  if (result.status !== 0) throw new Error(`npm view ${spec} ${field} failed (exit ${result.status}): ${String(result.stderr ?? '').trim()}`);
  return parsed === '' ? null : parsed;
}

export function isPublished(name, version, registry, run = npm) {
  return npmView(`${name}@${version}`, 'version', registry, run) === version;
}

export function distTags(name, registry, run = npm) {
  return npmView(name, 'dist-tags', registry, run) ?? {};
}

// ── GitHub ──────────────────────────────────────────────────────────────────

async function github(method, route, body) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  const api = process.env.GITHUB_API_URL || 'https://api.github.com';
  const response = await fetch(`${api}${route}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${route}: HTTP ${response.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function githubContext() {
  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  const hasToken = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  return repository && sha && hasToken ? { repository, sha } : null;
}

async function checkRunsFor(context) {
  const route = `/repos/${context.repository}/commits/${context.sha}/check-runs?check_name=${CHECK_NAME}&filter=all&per_page=100`;
  return (await github('GET', route))?.check_runs ?? [];
}

// ── commands ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const options = { package: [], positional: [], passthrough: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      options.passthrough = argv.slice(i + 1);
      break;
    }
    if (arg === '--lockstep' || arg === '--failed' || arg === '--github-output') options[arg.slice(2)] = true;
    else if (arg === '--package') options.package.push(argv[++i]);
    else if (arg.startsWith('--')) options[arg.slice(2)] = argv[++i];
    else options.positional.push(arg);
  }
  return options;
}

const normalizeDir = (dir) => path.posix.normalize(String(dir).replaceAll('\\', '/')).replace(/\/$/, '') || '.';
const statePath = (options) => options.state || path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'release-prerelease.json');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function readState(options) {
  const file = statePath(options);
  if (!existsSync(file)) throw new Error(`no plan at ${file}; run \`plan\` first`);
  return readJson(file);
}

function writeState(options, state) {
  writeFileSync(statePath(options), `${JSON.stringify(state, null, 2)}\n`);
}

/** Plan this run's versions (see the header). Returns the state it writes. */
export async function plan(options, deps = {}) {
  const run = deps.npm ?? npm;
  const dirs = options.package.map(normalizeDir);
  if (!dirs.length) throw new Error('plan needs at least one --package <dir>');
  const { release, n, tag } = releaseFromBranch(options.branch ?? process.env.GITHUB_REF_NAME);
  const k = buildNumber(options.build ?? process.env.GITHUB_RUN_NUMBER);
  const packages = dirs.map((dir) => {
    const manifest = readJson(path.join(dir, 'package.json'));
    if (manifest.private) throw new Error(`${dir}/package.json is private; it is not published`);
    if (!PACKAGE_NAME.test(manifest.name ?? '')) throw new Error(`${dir}/package.json has no valid name`);
    return { dir, name: manifest.name, base: manifest.version, registry: registryOf(manifest) };
  });
  if (new Set(packages.map((p) => p.name)).size !== packages.length) throw new Error('a package is listed twice');

  const state = { release, n, tag, k, sha: process.env.GITHUB_SHA ?? '', reuse: false, packages };
  const context = deps.checkRuns ? { repository: 'local', sha: state.sha } : githubContext();
  const prior = context ? priorReport(await (deps.checkRuns ?? checkRunsFor)(context), release) : null;
  if (prior) {
    const byName = new Map(prior.map((line) => [line.name, line.version]));
    const complete = packages.every((p) => byName.has(p.name) && isPublished(p.name, byName.get(p.name), p.registry, run));
    if (complete) {
      state.reuse = true;
      for (const p of packages) p.version = byName.get(p.name);
    }
  }
  if (!state.reuse) {
    if (options.lockstep) {
      const [first] = packages;
      const disagree = packages.filter((p) => p.base !== first.base);
      if (disagree.length) throw new Error(`lockstep packages disagree on the version: ${disagree.map((p) => `${p.name}@${p.base}`).join(', ')} vs ${first.base}`);
      const next = nextVersion(first.base, isPublished(first.name, first.base, first.registry, run));
      for (const p of packages) Object.assign(p, { next, version: prereleaseVersion(next, n, k) });
    } else {
      for (const p of packages) {
        const next = nextVersion(p.base, isPublished(p.name, p.base, p.registry, run));
        Object.assign(p, { next, version: prereleaseVersion(next, n, k) });
      }
    }
  }
  for (const p of packages) p.published = state.reuse;
  writeState(options, state);

  const values = { RL_RELEASE: release, RL_TAG: tag, RL_REUSE: String(state.reuse), RL_VERSION: packages[0].version };
  if (options['env-out']) writeFileSync(options['env-out'], Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
  if (options['github-output'] && process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key.slice(3).toLowerCase()}=${value}\n`).join(''));
  }
  console.log(state.reuse
    ? `${release}: this commit was already published for the Release; reusing ${reportText(packages).replaceAll('\n', ', ')}`
    : `${release}: ${packages.map((p) => `${p.name} ${p.base} -> ${p.version}`).join(', ')} under dist-tag ${tag}`);
  return state;
}

export function version(options) {
  const state = readState(options);
  const dir = normalizeDir(options.positional[0] ?? '');
  const found = state.packages.find((p) => p.dir === dir);
  if (!found) throw new Error(`no planned package in ${dir}`);
  console.log(found.version);
  return found.version;
}

/** Publish one planned package under the Release's dist-tag (see the header). */
export function publish(options, deps = {}) {
  const run = deps.npm ?? npm;
  const state = readState(options);
  const dir = normalizeDir(options.positional[0] ?? '');
  const p = state.packages.find((candidate) => candidate.dir === dir);
  if (!p) throw new Error(`no planned package in ${dir}`);
  if (state.reuse) {
    console.log(`${p.name}@${p.version} was published by an earlier run for this commit; nothing to do.`);
    return p;
  }
  const manifest = readJson(path.join(dir, 'package.json'));
  if (manifest.name !== p.name || manifest.version !== p.version) {
    throw new Error(`${dir}/package.json is ${manifest.name}@${manifest.version}; stamp ${p.version} into the checkout before publishing`);
  }
  const before = distTags(p.name, p.registry, run);
  if (!before.latest) throw new Error(`${p.name} has no latest dist-tag yet; its first publish would set latest, so it is not published as a prerelease`);
  if (isPublished(p.name, p.version, p.registry, run)) {
    console.log(`${p.name}@${p.version} is already in the registry (a re-run); not publishing it again.`);
  } else {
    console.log(`Publishing ${p.name}@${p.version} under dist-tag ${state.tag} to ${p.registry}`);
    const result = run(['publish', '--tag', state.tag, '--registry', p.registry, ...options.passthrough], { cwd: dir });
    process.stdout.write(String(result.stdout ?? ''));
    process.stderr.write(String(result.stderr ?? ''));
    if (result.status !== 0) {
      const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
      const conflict = /cannot publish over|previously published version|EPUBLISHCONFLICT|E409|409 Conflict/i.test(output);
      if (!conflict || !isPublished(p.name, p.version, p.registry, run)) throw new Error(`npm publish failed for ${p.name}@${p.version} (exit ${result.status})`);
      console.log(`${p.name}@${p.version} was published concurrently; continuing.`);
    }
  }
  const after = distTags(p.name, p.registry, run);
  if (after.latest !== before.latest) {
    console.log(`::warning::The registry moved ${p.name} latest from ${before.latest} to ${after.latest}; putting it back.`);
    const restored = run(['dist-tag', 'add', `${p.name}@${before.latest}`, 'latest', '--registry', p.registry]);
    if (restored.status !== 0 || distTags(p.name, p.registry, run).latest !== before.latest) {
      throw new Error(`${p.name} latest is ${after.latest}, not ${before.latest}; restore it with: npm dist-tag add ${p.name}@${before.latest} latest`);
    }
  }
  if (after[state.tag] !== p.version) console.log(`::warning::${p.name} dist-tag ${state.tag} points at ${after[state.tag] ?? 'nothing'}, not ${p.version}.`);
  p.published = true;
  writeState(options, state);
  return p;
}

/** Report the run (see the header). */
export async function report(options, deps = {}) {
  const file = statePath(options);
  const state = existsSync(file) ? readJson(file) : { ...releaseFromBranch(options.branch ?? process.env.GITHUB_REF_NAME), reuse: false, packages: [] };
  const done = state.packages.filter((p) => p.published);
  const ok = !options.failed && state.packages.length > 0 && done.length === state.packages.length;
  const text = reportText(done);
  const title = ok
    ? `${state.release}: ${done.length} prerelease${done.length === 1 ? '' : 's'} under dist-tag ${state.tag}`
    : `${state.release}: prerelease publish failed`;
  const summary = [
    `### ${title}`,
    '',
    ok
      ? `Install by exact version. The versions predict the next release; the final versions are read from the registry after the Release merges.${state.reuse ? ' This commit was already published by an earlier run, so nothing was published again.' : ''}`
      : `Not every package was published${done.length ? '; these were' : ''}. See the workflow run.`,
    '',
    ...(text ? ['```', text, '```'] : []),
  ].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  console.log(summary);

  if (state.reuse && ok) {
    console.log(`The ${CHECK_NAME} check run from the earlier run on this commit stands.`);
    return { ok, text, created: false };
  }
  const context = deps.createCheckRun ? { repository: 'local', sha: state.sha } : githubContext();
  if (!context) {
    console.log(`::warning::No GitHub context (GITHUB_REPOSITORY, GITHUB_SHA, GITHUB_TOKEN); the ${CHECK_NAME} check run was not created.`);
    return { ok, text, created: false };
  }
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body = {
    name: CHECK_NAME,
    head_sha: context.sha,
    status: 'completed',
    conclusion: ok ? 'success' : 'failure',
    completed_at: new Date().toISOString(),
    external_id: state.release,
    ...(process.env.GITHUB_RUN_ID ? { details_url: `${server}/${context.repository}/actions/runs/${process.env.GITHUB_RUN_ID}` } : {}),
    output: { title, summary, text },
  };
  await (deps.createCheckRun ?? ((payload) => github('POST', `/repos/${context.repository}/check-runs`, payload)))(body);
  console.log(`Created the ${CHECK_NAME} check run (${body.conclusion}) on ${context.sha}.`);
  return { ok, text, created: true, body };
}

async function main(argv) {
  const [command, ...rest] = argv;
  const options = parseArgs(rest);
  if (command === 'plan') await plan(options);
  else if (command === 'version') version(options);
  else if (command === 'publish') publish(options);
  else if (command === 'report') {
    const result = await report(options);
    if (!result.ok && !options.failed) process.exitCode = 1;
  } else throw new Error('usage: release-prerelease.mjs plan|version|publish|report (see the header)');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`::error::release-prerelease: ${error.message}`);
    process.exit(1);
  });
}
