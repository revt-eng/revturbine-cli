#!/usr/bin/env node
// Release prereleases (EP-1747 phase 5; ST-1754, ST-1755, ST-1757, ST-1758).
//
// A push to release/RL-<n> publishes this repository's packages as
// <next>-rl.<n>.<k> and points the dist-tag rl-<n> at them, so the other
// repositories in the same Release can pin them by exact version before anything
// is final. It never commits (versions are stamped into the job's checkout only)
// and never writes `latest`, except to put back a `latest` that the registry
// moved to this run's own prerelease. .github/workflows/release-prerelease.yml
// calls, in order:
//
//   plan     Compute the versions and check every package's dist-tags before
//            anything is published: each must have a `latest`, and it must not be
//            a prerelease. <n> comes from the branch name. <next> is the
//            manifest's version when that version is not published yet (a bump
//            already waiting in the Release), else its next patch; it is only a
//            prediction, and the final version is read from the registry after the
//            merge (decision 7). <k> is the workflow's run number. When an earlier
//            run already reported this commit for this Release, and the registry
//            says those versions came from this commit, the plan reuses them and
//            nothing is published again.
//   version  Print the planned version for one package directory.
//   stamp    Write the commit into a package's manifest as `gitHead`, so the
//            registry records it even for a tarball publish.
//   pack     `npm pack` a package into a directory next to the plan, for a publish
//            job that does not build.
//   publish  Publish each package (or one) under the run's own dist-tag,
//            rl-<n>-<k>, never under rl-<n> directly. A version already in the
//            registry is accepted only when its gitHead is this commit (a re-run);
//            from any other commit it fails. `latest` is read before and after: a
//            `latest` moved to this prerelease, or to any prerelease, is put back;
//            a `latest` moved to another release is left alone and the run fails.
//   promote  Once every package is published, point rl-<n> at this run's versions
//            and remove rl-<n>-<k>. rl-<n> never moves backwards: if it already
//            points at a later build for any package, it is left for all of them.
//            Two builds of one Release compare by <k>, not semver, because a
//            reverted version bump makes a newer build's <next> lower. A partial
//            publish never reaches this step, so rl-<n> is untouched; if moving
//            rl-<n> fails part-way, the packages already moved are put back, so the
//            set is never split.
//   report   Write the `name@version` lines to the job summary and to a check run
//            named `release-prerelease` on the commit, which Backlog reads and
//            confirms against the registry. `--failed` reports a failed run.
//
// The plan file comes from the build, which runs code this script does not
// control, so publish, promote and report trust none of it on its own. They take
// the Release, <k>, both tags and the commit from the workflow's context
// (GITHUB_REF_NAME, GITHUB_RUN_NUMBER, GITHUB_SHA), the package names and
// registries from the commit's own manifests (git show HEAD:<dir>/package.json)
// for the directories the workflow names with --package, and an expected
// registry from --registry. Every version must be <x.y.z>-rl.<n>.<k>, every
// tarball npm's name for it, and the only dist-tags written are rl-<n> and
// rl-<n>-<k> (latest only to put it back). Any mismatch writes nothing.
//
// Why the run number for <k>: it only grows, so a later build of the Release
// always sorts after an earlier one, and a re-run of a run keeps its number, so a
// re-run recomputes the same version and finds it already published by the same
// commit. Counting the Release's versions in the registry would race across
// packages and runs, and could disagree between packages after a partial failure.
//
// Identical copies live in revturbine-scaffold, revturbine-sdk-internal,
// revturbine-cli and create-revturbine; change them together.
//
// Usage:
//   node scripts/release-prerelease.mjs plan --package <dir> [--package <dir>...] [--lockstep]
//        [--branch release/RL-<n>] [--build <k>] [--state <file>] [--env-out <file>] [--github-output]
//   node scripts/release-prerelease.mjs version <dir> [--state <file>]
//   node scripts/release-prerelease.mjs stamp <dir> [--state <file>]
//   node scripts/release-prerelease.mjs pack <dir> [--state <file>]
//   node scripts/release-prerelease.mjs publish [<dir> | --all] --package <dir>... [--registry <url>] [--state <file>] [-- <npm publish args>]
//   node scripts/release-prerelease.mjs promote --package <dir>... [--registry <url>] [--state <file>]
//   node scripts/release-prerelease.mjs report [--failed] --package <dir>... [--registry <url>] [--state <file>]
// (--env-out, not --env-file: Node reads --env-file from anywhere on its command line.)

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const CHECK_NAME = 'release-prerelease';
export const RELEASE_BRANCH = /^release\/RL-([1-9][0-9]*)$/;
const EXACT = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
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

/** The run's own dist-tag, rl-<n>-<k>: publishes land here, and rl-<n> moves only once all of them succeeded. */
export function runTag(n, k) {
  return `rl-${n}-${k}`;
}

/** True for a semver version with a prerelease part. */
export function isPrerelease(version) {
  const match = SEMVER.exec(String(version ?? ''));
  return Boolean(match && match[4] !== undefined);
}

/** Semver precedence: negative when a sorts before b, 0 when equal, positive after. */
export function compareSemver(a, b) {
  const pa = SEMVER.exec(String(a ?? ''));
  const pb = SEMVER.exec(String(b ?? ''));
  if (!pa || !pb) throw new Error(`not a semver version: ${JSON.stringify(pa ? b : a)}`);
  for (let i = 1; i <= 3; i += 1) if (Number(pa[i]) !== Number(pb[i])) return Number(pa[i]) - Number(pb[i]);
  if (pa[4] === undefined || pb[4] === undefined) return (pa[4] === undefined ? 1 : 0) - (pb[4] === undefined ? 1 : 0);
  const xa = pa[4].split('.');
  const xb = pb[4].split('.');
  for (let i = 0; i < Math.max(xa.length, xb.length); i += 1) {
    if (xa[i] === undefined) return -1;
    if (xb[i] === undefined) return 1;
    const na = /^[0-9]+$/.test(xa[i]);
    const nb = /^[0-9]+$/.test(xb[i]);
    if (na && nb && Number(xa[i]) !== Number(xb[i])) return Number(xa[i]) - Number(xb[i]);
    if (na !== nb) return na ? -1 : 1;
    if (!na && xa[i] !== xb[i]) return xa[i] < xb[i] ? -1 : 1;
  }
  return 0;
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

/** Why a package's dist-tags forbid a prerelease publish, or null when they allow one. */
export function distTagRefusal(name, tags) {
  if (!tags?.latest) return `${name} has no latest dist-tag yet; its first publish would set latest, so it is not published as a prerelease`;
  if (isPrerelease(tags.latest)) return `${name} latest is the prerelease ${tags.latest}; put latest back on a release before publishing prereleases`;
  return null;
}

/**
 * What to do when `latest` changed during a publish: 'keep' when it did not,
 * 'restore' when it moved to this prerelease or any prerelease (the registry's
 * doing; put it back), 'fail' when another publish moved it to a release.
 */
export function latestAfterPublish(before, after, version) {
  if (after === before) return 'keep';
  if (after === version || isPrerelease(after)) return 'restore';
  return 'fail';
}

/** The Release build a version is: <x.y.z>-rl.<n>.<k> -> { n, k }, else null. */
export function releaseBuild(version) {
  const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)-rl\.([1-9][0-9]*)\.([1-9][0-9]*)$/.exec(String(version ?? ''));
  return match ? { n: Number(match[4]), k: Number(match[5]) } : null;
}

/**
 * Whether `at` is a later build than `ours`. Two builds of one Release compare by
 * build number: a reverted version bump makes a newer build's <next> lower, so
 * semver would call it older. Anything else (another Release, or a release)
 * compares by semver.
 */
export function isLaterBuild(at, ours) {
  const a = releaseBuild(at);
  const o = releaseBuild(ours);
  if (a && o && a.n === o.n) return a.k > o.k;
  return SEMVER.test(String(at ?? '')) && compareSemver(at, ours) > 0;
}

/** npm's tarball file name for a package version. */
export function tarballName(name, version) {
  return `${String(name).replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
}

/** What this run is, from the workflow's context rather than the plan file. */
export function runContext(env = process.env) {
  const { release, n, tag } = releaseFromBranch(env.GITHUB_REF_NAME);
  const k = buildNumber(env.GITHUB_RUN_NUMBER);
  const sha = String(env.GITHUB_SHA ?? '');
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`GITHUB_SHA is not a commit: ${JSON.stringify(sha)}`);
  return { release, n, k, tag, runTag: runTag(n, k), sha };
}

/** A dist-tag promote and its cleanup may write: this run's rl-<n> or rl-<n>-<k>, never latest. */
export function writableTag(tag, context) {
  if (tag === 'latest' || (tag !== context.tag && tag !== context.runTag)) {
    throw new Error(`refusing to write dist-tag ${JSON.stringify(tag)}: this run writes only ${context.tag} and ${context.runTag}`);
  }
  return tag;
}

function manifestAtCommit(dir) {
  const file = dir === '.' ? 'package.json' : `${dir}/package.json`;
  const result = spawnSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`could not read ${file} at the commit: ${String(result.stderr).trim()}`);
  return JSON.parse(result.stdout);
}

/**
 * The plan, checked against this run before anything is written (see the
 * header), rebuilt from the trusted values. Throws on any mismatch.
 */
export function trustedPlan(state, options, deps = {}) {
  const context = runContext(deps.env ?? process.env);
  const readManifest = deps.readManifest ?? manifestAtCommit;
  const refuse = (why) => new Error(`the plan does not match this run, so nothing is written: ${why}`);
  const dirs = (options.package ?? []).map(normalizeDir);
  if (!dirs.length) throw new Error('name every package this run publishes with --package <dir>');
  const expectedRegistry = options.registry ? registryOf({ publishConfig: { registry: options.registry } }) : null;
  for (const [key, want] of [['release', context.release], ['n', context.n], ['tag', context.tag], ['sha', context.sha]]) {
    if (state?.[key] !== want) throw refuse(`${key} is ${JSON.stringify(state?.[key])}, not ${JSON.stringify(want)}`);
  }
  const reuse = state.reuse === true;
  for (const [key, want] of [['k', context.k], ['runTag', context.runTag]]) {
    if (state[key] !== want) throw refuse(`${key} is ${JSON.stringify(state[key])}, not ${JSON.stringify(want)}`);
  }
  const listed = Array.isArray(state.packages) ? state.packages : [];
  if (listed.length !== dirs.length || !dirs.every((dir) => listed.filter((p) => p?.dir === dir).length === 1)) {
    throw refuse(`it lists ${listed.map((p) => p?.dir).join(', ') || 'no packages'}, not ${dirs.join(', ')}`);
  }
  const build = reuse ? '[1-9][0-9]*' : String(context.k);
  const versionPattern = new RegExp(`^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)-rl\\.${context.n}\\.${build}$`);
  const packages = dirs.map((dir) => {
    const p = listed.find((candidate) => candidate.dir === dir);
    const manifest = readManifest(dir);
    const registry = registryOf(manifest);
    if (p.name !== manifest.name) throw refuse(`${dir} is ${manifest.name} at this commit, not ${p.name}`);
    if (p.registry !== registry) throw refuse(`${p.name} publishes to ${registry} at this commit, not ${p.registry}`);
    if (expectedRegistry && registry !== expectedRegistry) throw refuse(`${p.name} publishes to ${registry}; this workflow publishes only to ${expectedRegistry}`);
    if (!versionPattern.test(String(p.version))) throw refuse(`${p.name}@${p.version} is not a build of ${context.release} from run ${context.k}`);
    if (p.tarball !== undefined && p.tarball !== tarballName(p.name, p.version)) {
      throw refuse(`${p.name}'s tarball is ${JSON.stringify(p.tarball)}, not ${tarballName(p.name, p.version)}`);
    }
    return { dir, name: p.name, registry, version: p.version, ...(p.tarball ? { tarball: p.tarball } : {}), published: p.published === true };
  });
  const promoted = reuse || state.promoted === true ? true : state.promoted === 'superseded' ? 'superseded' : false;
  return { ...context, reuse, promoted, packages };
}

// ── registry ────────────────────────────────────────────────────────────────

function npm(args, options = {}) {
  // npm is a .cmd shim on Windows; the arguments are fixed flags and validated values.
  return spawnSync('npm', args, { encoding: 'utf8', shell: process.platform === 'win32', ...options });
}

/** `npm view <spec> <field> --json`: the value, or null when the registry has no such package, version or field. */
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

/** The commit a published version came from (its gitHead), or null. */
export function publishedCommit(name, version, registry, run = npm) {
  return npmView(`${name}@${version}`, 'gitHead', registry, run);
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
    if (['--lockstep', '--failed', '--github-output', '--all'].includes(arg)) options[arg.slice(2)] = true;
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
  const file = statePath(options);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
}

function plannedPackage(state, dir) {
  const found = state.packages.find((p) => p.dir === normalizeDir(dir ?? ''));
  if (!found) throw new Error(`no planned package in ${dir}`);
  return found;
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

  // Every package's dist-tags are checked before anything is published, so one bad package stops the whole set.
  const refusals = packages.map((p) => distTagRefusal(p.name, distTags(p.name, p.registry, run))).filter(Boolean);
  if (refusals.length) throw new Error(refusals.join('; '));

  const sha = deps.sha ?? process.env.GITHUB_SHA ?? '';
  const state = { release, n, tag, k, runTag: runTag(n, k), sha, reuse: false, promoted: false, packages };
  const context = deps.checkRuns ? { repository: 'local', sha } : githubContext();
  const prior = context ? priorReport(await (deps.checkRuns ?? checkRunsFor)(context), release) : null;
  if (prior && sha) {
    const byName = new Map(prior.map((line) => [line.name, line.version]));
    const fromThisCommit = packages.every((p) => byName.has(p.name) && publishedCommit(p.name, byName.get(p.name), p.registry, run) === sha);
    if (fromThisCommit) {
      Object.assign(state, { reuse: true, promoted: true });
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
    : `${release}: ${packages.map((p) => `${p.name} ${p.base} -> ${p.version}`).join(', ')}, published under ${state.runTag}, then ${tag}`);
  return state;
}

export function version(options) {
  const found = plannedPackage(readState(options), options.positional[0]);
  console.log(found.version);
  return found.version;
}

/** Record the commit as the manifest's gitHead: npm keeps it, and `publish` checks it on a re-run. */
export function stamp(options) {
  const state = readState(options);
  const p = plannedPackage(state, options.positional[0]);
  if (!state.sha) throw new Error('the plan has no commit (GITHUB_SHA) to stamp');
  const file = path.join(p.dir, 'package.json');
  const manifest = readJson(file);
  if (manifest.version !== p.version) throw new Error(`${file} is at ${manifest.version}; stamp ${p.version} into it first`);
  manifest.gitHead = state.sha;
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

/** `npm pack` one package into the directory that holds the plan; the publish job publishes the tarball. */
export function pack(options, deps = {}) {
  const run = deps.npm ?? npm;
  const state = readState(options);
  const p = plannedPackage(state, options.positional[0]);
  const out = path.resolve(path.dirname(statePath(options)));
  // Lifecycle scripts (prepack, prepare) print to stdout too, so the tarball is found by npm's file name, not parsed output.
  const result = run(['pack', '--pack-destination', out], { cwd: p.dir, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`npm pack failed in ${p.dir} (exit ${result.status})`);
  p.tarball = tarballName(p.name, p.version);
  if (!existsSync(path.join(out, p.tarball))) throw new Error(`npm pack wrote no ${p.tarball} in ${out}`);
  writeState(options, state);
  console.log(`Packed ${p.name}@${p.version} as ${p.tarball}`);
  return p.tarball;
}

/** The manifest inside a packed tarball. */
function tarballManifest(file) {
  // Run beside the file: GNU tar reads a "C:" in a Windows path as a remote host.
  const result = spawnSync('tar', ['-xzOf', path.basename(file), 'package/package.json'], { cwd: path.dirname(path.resolve(file)), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`could not read package/package.json from ${file}: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function publishOne(options, state, p, run) {
  const tarball = p.tarball ? path.join(path.dirname(statePath(options)), p.tarball) : null;
  const manifest = tarball ? (options.readTarball ?? tarballManifest)(tarball) : readJson(path.join(p.dir, 'package.json'));
  if (manifest.name !== p.name || manifest.version !== p.version) {
    throw new Error(`${tarball ?? `${p.dir}/package.json`} is ${manifest.name}@${manifest.version}; stamp ${p.version} before publishing`);
  }
  if (state.sha && manifest.gitHead !== state.sha) throw new Error(`${p.name}@${p.version} carries gitHead ${manifest.gitHead ?? '(none)'}, not ${state.sha}; run \`stamp\` before packing or publishing`);

  const before = distTags(p.name, p.registry, run);
  const refusal = distTagRefusal(p.name, before);
  if (refusal) throw new Error(refusal);
  if (isPublished(p.name, p.version, p.registry, run)) {
    const commit = publishedCommit(p.name, p.version, p.registry, run);
    if (!state.sha || commit !== state.sha) {
      throw new Error(`${p.name}@${p.version} is already in the registry from commit ${commit ?? '(unknown)'}, not ${state.sha || '(unknown)'}; not reporting it as this run's`);
    }
    console.log(`${p.name}@${p.version} is already in the registry from this commit (a re-run); not publishing it again.`);
  } else {
    console.log(`Publishing ${p.name}@${p.version} under ${state.runTag} to ${p.registry}`);
    const result = run(['publish', ...(tarball ? [path.resolve(tarball)] : []), '--tag', writableTag(state.runTag, state), '--registry', p.registry, ...options.passthrough], tarball ? {} : { cwd: p.dir });
    process.stdout.write(String(result.stdout ?? ''));
    process.stderr.write(String(result.stderr ?? ''));
    if (result.status !== 0) {
      const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
      const conflict = /cannot publish over|previously published version|EPUBLISHCONFLICT|E409|409 Conflict/i.test(output);
      if (!conflict || publishedCommit(p.name, p.version, p.registry, run) !== state.sha) throw new Error(`npm publish failed for ${p.name}@${p.version} (exit ${result.status})`);
      console.log(`${p.name}@${p.version} was published concurrently from this commit; continuing.`);
    }
  }
  const after = distTags(p.name, p.registry, run);
  const decision = latestAfterPublish(before.latest, after.latest, p.version);
  if (decision === 'fail') {
    throw new Error(`${p.name} latest moved from ${before.latest} to ${after.latest} during this publish; another publish did that, so it is left alone`);
  }
  if (decision === 'restore') {
    console.log(`::warning::The registry moved ${p.name} latest from ${before.latest} to ${after.latest}; putting it back.`);
    const restored = run(['dist-tag', 'add', `${p.name}@${before.latest}`, 'latest', '--registry', p.registry]);
    if (restored.status !== 0 || distTags(p.name, p.registry, run).latest !== before.latest) {
      throw new Error(`${p.name} latest is ${after.latest}, not ${before.latest}; restore it with: npm dist-tag add ${p.name}@${before.latest} latest`);
    }
  }
  p.published = true;
  writeState(options, state);
}

/** Publish one planned package, or every one with --all (see the header). */
export function publish(options, deps = {}) {
  const run = deps.npm ?? npm;
  const state = trustedPlan(readState(options), options, deps);
  if (state.reuse) {
    console.log(`${reportText(state.packages).replaceAll('\n', ', ')} came from an earlier run on this commit; nothing to publish.`);
    return state;
  }
  const targets = options.all ? state.packages : [plannedPackage(state, options.positional[0])];
  for (const p of targets) publishOne({ ...options, readTarball: deps.readTarball }, state, p, run);
  return state;
}

/** Point rl-<n> at this run's versions once all of them are published (see the header). */
export function promote(options, deps = {}) {
  const run = deps.npm ?? npm;
  const state = trustedPlan(readState(options), options, deps);
  if (state.reuse) {
    console.log(`${state.tag} was handled by the earlier run on this commit.`);
    return state;
  }
  const missing = state.packages.filter((p) => !p.published);
  if (missing.length) throw new Error(`not every package was published (${missing.map((p) => p.name).join(', ')}); ${state.tag} stays where it is`);
  const tag = writableTag(state.tag, state);
  const temporary = writableTag(state.runTag, state);
  const current = state.packages.map((p) => ({ p, at: distTags(p.name, p.registry, run)[tag] }));
  const later = current.filter(({ p, at }) => at && isLaterBuild(at, p.version));
  if (later.length) {
    state.promoted = 'superseded';
    console.log(`${tag} already points at a later build (${later.map(({ p, at }) => `${p.name}@${at}`).join(', ')}); leaving it for every package.`);
  } else {
    const moved = [];
    for (const { p, at } of current) {
      if (at === p.version) continue;
      const result = run(['dist-tag', 'add', `${p.name}@${p.version}`, tag, '--registry', p.registry]);
      if (result.status !== 0) {
        // Never leave the set split: put back what this run already moved.
        const stuck = moved.filter(({ p: q, at: previous }) => {
          const back = previous
            ? run(['dist-tag', 'add', `${q.name}@${previous}`, tag, '--registry', q.registry])
            : run(['dist-tag', 'rm', q.name, tag, '--registry', q.registry]);
          return back.status !== 0;
        });
        const undone = moved.length
          ? stuck.length
            ? `could not put ${tag} back for ${stuck.map(({ p: q, at: previous }) => `${q.name} (${previous ? `npm dist-tag add ${q.name}@${previous} ${tag}` : `npm dist-tag rm ${q.name} ${tag}`})`).join(', ')}`
            : `${tag} was put back for the ${moved.length} package(s) already moved`
          : 'no package had moved';
        throw new Error(`could not point ${tag} at ${p.name}@${p.version} (${String(result.stderr ?? '').trim() || `exit ${result.status}`}); ${undone}`);
      }
      moved.push({ p, at });
      console.log(`${tag} -> ${p.name}@${p.version}`);
    }
    state.promoted = true;
  }
  for (const p of state.packages) {
    const removed = run(['dist-tag', 'rm', p.name, temporary, '--registry', p.registry]);
    if (removed.status !== 0) console.log(`::warning::Could not remove the temporary dist-tag ${temporary} from ${p.name}; it is harmless, remove it with: npm dist-tag rm ${p.name} ${temporary}`);
  }
  writeState(options, state);
  return state;
}

/** Report the run (see the header). */
export async function report(options, deps = {}) {
  const file = statePath(options);
  const env = deps.env ?? process.env;
  const unplanned = () => ({ ...releaseFromBranch(options.branch ?? env.GITHUB_REF_NAME), reuse: false, packages: [] });
  let state = unplanned();
  let untrusted = '';
  if (existsSync(file)) {
    try {
      state = trustedPlan(readJson(file), options, deps);
    } catch (error) {
      untrusted = error.message;
    }
  }
  const done = state.packages.filter((p) => p.published);
  const ok = !options.failed && !untrusted && state.packages.length > 0 && done.length === state.packages.length && Boolean(state.promoted);
  const text = reportText(done);
  const title = ok
    ? `${state.release}: ${done.length} prerelease${done.length === 1 ? '' : 's'} under dist-tag ${state.tag}`
    : `${state.release}: prerelease publish failed`;
  const notes = [
    state.reuse ? ' This commit was already published by an earlier run, so nothing was published again.' : '',
    state.promoted === 'superseded' ? ` ${state.tag} already pointed at a later build, so it was left there; install these by exact version.` : '',
  ].join('');
  const summary = [
    `### ${title}`,
    '',
    ok
      ? `Install by exact version. The versions predict the next release; the final versions are read from the registry after the Release merges.${notes}`
      : untrusted
        ? `${untrusted}. See the workflow run.`
        : `Not every package was published and tagged${done.length ? '; these were published' : ''}, and ${state.tag} was not moved. See the workflow run.`,
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
  console.log(`Created the ${CHECK_NAME} check run (${body.conclusion}).`);
  return { ok, text, created: true, body };
}

async function main(argv) {
  const [command, ...rest] = argv;
  const options = parseArgs(rest);
  if (command === 'plan') await plan(options);
  else if (command === 'version') version(options);
  else if (command === 'stamp') stamp(options);
  else if (command === 'pack') pack(options);
  else if (command === 'publish') publish(options);
  else if (command === 'promote') promote(options);
  else if (command === 'report') {
    const result = await report(options);
    if (!result.ok && !options.failed) process.exitCode = 1;
  } else throw new Error('usage: release-prerelease.mjs plan|version|stamp|pack|publish|promote|report (see the header)');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`::error::release-prerelease: ${error.message}`);
    process.exit(1);
  });
}
