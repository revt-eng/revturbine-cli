// Tests for scripts/release-prerelease.mjs (EP-1747 phase 5), run by `node --test` in scripts/ci-l1.mjs (named .check.mjs so vitest does not collect it): the version scheme,
// the dist-tag guards, lockstep promotion, the commit check on a re-run, and a
// plan file that does not match the run.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildNumber,
  isLaterBuild,
  pack,
  trustedPlan,
  writableTag,
  compareSemver,
  distTagRefusal,
  latestAfterPublish,
  nextVersion,
  parseReportLines,
  plan,
  prereleaseVersion,
  priorReport,
  promote,
  publish,
  registryOf,
  releaseFromBranch,
  report,
  runTag,
  stamp,
} from './release-prerelease.mjs';

const SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);

test('the Release comes from the branch name, nothing else', () => {
  assert.deepEqual(releaseFromBranch('release/RL-12'), { release: 'RL-12', n: 12, tag: 'rl-12' });
  for (const branch of ['main', 'staging', 'release/0.2.0', 'release/RL-0', 'release/RL-012', 'release/RL-12/x', 'release/rl-12', 'refs/heads/release/RL-1', '']) {
    assert.throws(() => releaseFromBranch(branch), /not a Release branch/, branch);
  }
});

test('<next> is the manifest version until it is published, then its next patch', () => {
  assert.equal(nextVersion('0.1.561', true), '0.1.562');
  assert.equal(nextVersion('0.18.0', false), '0.18.0');
  assert.equal(nextVersion('1.9.9', true), '1.9.10');
  assert.throws(() => nextVersion('0.1.561-rl.1.2', true), /X\.Y\.Z/);
  assert.throws(() => nextVersion('', false), /X\.Y\.Z/);
});

test('<k> is a positive run number; the version reads <next>-rl.<n>.<k> and the run tag rl-<n>-<k>', () => {
  assert.equal(buildNumber('40'), 40);
  for (const bad of ['0', '-1', '1.5', 'abc', '', undefined]) assert.throws(() => buildNumber(bad), /positive integer/);
  assert.equal(prereleaseVersion('0.1.562', 12, 40), '0.1.562-rl.12.40');
  assert.equal(runTag(12, 40), 'rl-12-40');
});

test('semver precedence orders builds of a Release numerically, and a release after its prereleases', () => {
  assert.ok(compareSemver('0.1.562-rl.12.9', '0.1.562-rl.12.10') < 0);
  assert.ok(compareSemver('0.1.562-rl.13.1', '0.1.562-rl.12.40') > 0);
  assert.ok(compareSemver('0.1.562', '0.1.562-rl.12.40') > 0);
  assert.ok(compareSemver('0.1.563-rl.12.1', '0.1.562') > 0);
  assert.equal(compareSemver('1.2.3-rl.1.2', '1.2.3-rl.1.2'), 0);
});

test('dist-tags must have a latest that is a release', () => {
  assert.equal(distTagRefusal('a', { latest: '1.0.0', 'rl-3': '1.0.1-rl.3.1' }), null);
  assert.match(distTagRefusal('a', {}), /no latest dist-tag/);
  assert.match(distTagRefusal('a', { latest: '1.0.1-rl.3.1' }), /latest is the prerelease 1\.0\.1-rl\.3\.1/);
});

test('latest moved during a publish is put back only when it moved to a prerelease', () => {
  assert.equal(latestAfterPublish('1.0.0', '1.0.0', '1.0.1-rl.3.4'), 'keep');
  assert.equal(latestAfterPublish('1.0.0', '1.0.1-rl.3.4', '1.0.1-rl.3.4'), 'restore');
  assert.equal(latestAfterPublish('1.0.0', '1.0.1-rl.2.9', '1.0.1-rl.3.4'), 'restore');
  assert.equal(latestAfterPublish('1.0.0', '1.0.1', '1.0.1-rl.3.4'), 'fail', 'a real release published meanwhile is never rolled back');
});

test('report lines parse back to name@version, scoped or not', () => {
  assert.deepEqual(parseReportLines('@revt-eng/schema@0.1.562-rl.12.40\ncreate-revturbine@0.2.1-rl.12.3\nnoise\n@x@'), [
    { name: '@revt-eng/schema', version: '0.1.562-rl.12.40' },
    { name: 'create-revturbine', version: '0.2.1-rl.12.3' },
  ]);
});

test('only a successful report for the same Release is reused, newest first', () => {
  const runs = [
    { name: 'release-prerelease', conclusion: 'success', external_id: 'RL-11', completed_at: '2026-11-12T09:00:00Z', output: { text: 'a@1.0.1-rl.11.1' } },
    { name: 'release-prerelease', conclusion: 'failure', external_id: 'RL-12', completed_at: '2026-11-12T11:00:00Z', output: { text: 'a@1.0.1-rl.12.9' } },
    { name: 'release-prerelease', conclusion: 'success', external_id: 'RL-12', completed_at: '2026-11-12T10:00:00Z', output: { text: 'a@1.0.1-rl.12.7' } },
    { name: 'release-prerelease', conclusion: 'success', external_id: 'RL-12', completed_at: '2026-11-12T08:00:00Z', output: { text: 'a@1.0.1-rl.12.5' } },
  ];
  assert.deepEqual(priorReport(runs, 'RL-12'), [{ name: 'a', version: '1.0.1-rl.12.7' }]);
  assert.equal(priorReport(runs, 'RL-13'), null);
  assert.equal(priorReport([], 'RL-12'), null);
});

test('the registry is publishConfig.registry, else the public registry', () => {
  assert.equal(registryOf({ publishConfig: { registry: 'https://npm.pkg.github.com' } }), 'https://npm.pkg.github.com/');
  assert.equal(registryOf({}), 'https://registry.npmjs.org/');
});

/**
 * A fake registry. `packages` maps name -> { versions: { version: gitHead }, tags: {} }.
 * `onPublish(name, version, tag)` can move tags the way a misbehaving registry or a concurrent publish would.
 */
function fakeRegistry(packages, { onPublish } = {}) {
  const calls = [];
  const json = (value) => ({ status: 0, stdout: JSON.stringify(value), stderr: '' });
  const missing = { status: 1, stdout: JSON.stringify({ error: { code: 'E404', summary: 'Not found' } }), stderr: '' };
  const split = (spec) => {
    const at = spec.lastIndexOf('@');
    return at > 0 ? [spec.slice(0, at), spec.slice(at + 1)] : [spec, null];
  };
  const run = (args, options = {}) => {
    calls.push(args.filter((arg) => !arg.startsWith('http')).join(' '));
    if (args[0] === 'view') {
      const [name, version] = split(args[1]);
      const pkg = packages[name];
      if (!pkg) return missing;
      if (args[2] === 'dist-tags') return json(pkg.tags);
      if (!(version in pkg.versions)) return missing;
      if (args[2] === 'version') return json(version);
      if (args[2] === 'gitHead') return pkg.versions[version] ? json(pkg.versions[version]) : { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'pack') {
      // A stand-in tarball: the manifest as JSON, under npm's file name.
      const manifest = JSON.parse(readFileSync(path.join(options.cwd, 'package.json'), 'utf8'));
      const out = args[args.indexOf('--pack-destination') + 1];
      writeFileSync(path.join(out, `${manifest.name.replace(/^@/, '').replace('/', '-')}-${manifest.version}.tgz`), JSON.stringify(manifest));
      return { status: 0 };
    }
    if (args[0] === 'publish') {
      const tag = args[args.indexOf('--tag') + 1];
      const tarball = args[1].endsWith('.tgz') ? args[1] : null;
      const manifest = JSON.parse(readFileSync(tarball ?? path.join(options.cwd, 'package.json'), 'utf8'));
      const pkg = packages[manifest.name];
      pkg.versions[manifest.version] = manifest.gitHead ?? null;
      pkg.tags[tag] = manifest.version;
      onPublish?.(manifest.name, manifest.version, tag);
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'dist-tag' && args[1] === 'add') {
      const [name, version] = split(args[2]);
      packages[name].tags[args[3]] = version;
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'dist-tag' && args[1] === 'rm') {
      delete packages[args[2]].tags[args[3]];
      return { status: 0, stdout: '', stderr: '' };
    }
    throw new Error(`unexpected npm ${args.join(' ')}`);
  };
  return { run, calls };
}

function workspace(manifests) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'release-prerelease-'));
  for (const [dir, manifest] of Object.entries(manifests)) {
    mkdirSync(path.join(root, dir), { recursive: true });
    writeFileSync(path.join(root, dir, 'package.json'), JSON.stringify(manifest));
  }
  return root;
}

function options(root, dirs, extra = {}) {
  return { package: dirs.map((dir) => path.join(root, dir)), positional: [], passthrough: [], branch: 'release/RL-12', build: '40', state: path.join(root, 'out', 'state.json'), ...extra };
}

/** What the workflow's context says for these options, and the commit's manifests (here, the files themselves). */
function ctx(opts, run, extra = {}) {
  return {
    npm: run,
    env: { GITHUB_REF_NAME: opts.branch, GITHUB_RUN_NUMBER: opts.build, GITHUB_SHA: SHA },
    readManifest: (dir) => JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')),
    ...extra,
  };
}

/** Stamp each planned version and the commit into the checkout, as the workflow does before publishing. */
function stampAll(root, opts, versions) {
  for (const [dir, version] of Object.entries(versions)) {
    const file = path.join(root, dir, 'package.json');
    writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), version }));
    stamp({ ...opts, positional: [path.join(root, dir)] });
  }
}

test('plan: a published base moves to its next patch, an unpublished bump is kept, lockstep shares one version', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' }, c: { name: 'c', version: '0.3.0' } });
  const { run } = fakeRegistry({
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    c: { versions: { '0.2.9': null }, tags: { latest: '0.2.9' } },
  });
  const lockstep = await plan(options(root, ['a', 'b'], { lockstep: true }), { npm: run, checkRuns: async () => [], sha: SHA });
  assert.deepEqual(lockstep.packages.map((p) => p.version), ['0.1.562-rl.12.40', '0.1.562-rl.12.40']);
  assert.equal(lockstep.runTag, 'rl-12-40');
  const independent = await plan(options(root, ['a', 'c']), { npm: run, checkRuns: async () => [], sha: SHA });
  assert.deepEqual(independent.packages.map((p) => p.version), ['0.1.562-rl.12.40', '0.3.0-rl.12.40']);
});

test('plan: every package\'s dist-tags are checked before anything publishes', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' } });
  const registry = {
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.562-rl.11.3' } },
  };
  const { run, calls } = fakeRegistry(registry);
  await assert.rejects(plan(options(root, ['a', 'b'], { lockstep: true }), { npm: run, checkRuns: async () => [], sha: SHA }), /@revt-eng\/b latest is the prerelease/);
  registry['@revt-eng/b'].tags = {};
  await assert.rejects(plan(options(root, ['a', 'b'], { lockstep: true }), { npm: run, checkRuns: async () => [], sha: SHA }), /@revt-eng\/b has no latest/);
  assert.ok(!calls.some((call) => call.startsWith('publish')));
});

test('plan: an earlier report on this commit is reused only when the registry says the versions came from this commit', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' } });
  const registry = { '@revt-eng/a': { versions: { '0.1.561': null, '0.1.562-rl.12.7': SHA }, tags: { latest: '0.1.561' } } };
  const { run } = fakeRegistry(registry);
  const earlier = [{ name: 'release-prerelease', conclusion: 'success', external_id: 'RL-12', completed_at: '2026-11-12T10:00:00Z', output: { text: '@revt-eng/a@0.1.562-rl.12.7' } }];
  const reused = await plan(options(root, ['a'], { build: '41' }), { npm: run, checkRuns: async () => earlier, sha: SHA });
  assert.equal(reused.reuse, true);
  assert.equal(reused.packages[0].version, '0.1.562-rl.12.7');

  registry['@revt-eng/a'].versions['0.1.562-rl.12.7'] = OTHER_SHA;
  const fresh = await plan(options(root, ['a'], { build: '41' }), { npm: run, checkRuns: async () => earlier, sha: SHA });
  assert.equal(fresh.reuse, false, 'a reported version from another commit is not reused');
  assert.equal(fresh.packages[0].version, '0.1.562-rl.12.41');
});

test('publish and promote: the run tag first, rl-<n> only after every package, then the run tag is removed', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' } });
  const registry = {
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.30' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.30' } },
  };
  const { run, calls } = fakeRegistry(registry);
  const opts = options(root, ['a', 'b'], { lockstep: true });
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });

  assert.throws(() => publish({ ...opts, positional: [path.join(root, 'a')] }, ctx(opts, run)), /stamp 0\.1\.562-rl\.12\.40/);
  stampAll(root, opts, { a: '0.1.562-rl.12.40', b: '0.1.562-rl.12.40' });

  publish({ ...opts, positional: [path.join(root, 'a')] }, ctx(opts, run));
  assert.deepEqual(calls.filter((c) => c.startsWith('publish')), ['publish --tag rl-12-40 --registry']);
  assert.equal(registry['@revt-eng/a'].tags['rl-12'], '0.1.562-rl.12.30', 'rl-12 does not move per package');
  assert.throws(() => promote(opts, ctx(opts, run)), /not every package was published \(@revt-eng\/b\); rl-12 stays/);
  assert.equal(registry['@revt-eng/b'].tags['rl-12'], '0.1.562-rl.12.30');

  publish({ ...opts, all: true }, ctx(opts, run));
  assert.equal(calls.filter((c) => c.startsWith('publish')).length, 2, 'a re-run of the same commit does not publish a again');
  promote(opts, ctx(opts, run));
  for (const name of ['@revt-eng/a', '@revt-eng/b']) {
    assert.deepEqual(registry[name].tags, { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.40' });
  }
});

test('promote never moves rl-<n> backwards: a re-run of an older run leaves it for every package', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' } });
  const registry = {
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.41' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.39' } },
  };
  const { run } = fakeRegistry(registry);
  const opts = options(root, ['a', 'b'], { lockstep: true });
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '0.1.562-rl.12.40', b: '0.1.562-rl.12.40' });
  publish({ ...opts, all: true }, ctx(opts, run));
  const state = promote(opts, ctx(opts, run));
  assert.equal(state.promoted, 'superseded');
  assert.equal(registry['@revt-eng/a'].tags['rl-12'], '0.1.562-rl.12.41');
  assert.equal(registry['@revt-eng/b'].tags['rl-12'], '0.1.562-rl.12.39', 'the set is left as the later run left it');
  assert.equal(registry['@revt-eng/a'].tags['rl-12-40'], undefined, 'the run tag is removed either way');
});

test('publish: a version already in the registry from another commit fails instead of passing', async () => {
  const root = workspace({ a: { name: 'a', version: '1.0.0' } });
  const registry = { a: { versions: { '1.0.0': null }, tags: { latest: '1.0.0' } } };
  const { run } = fakeRegistry(registry);
  const opts = options(root, ['a']);
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '1.0.1-rl.12.40' });
  registry.a.versions['1.0.1-rl.12.40'] = OTHER_SHA;
  assert.throws(() => publish({ ...opts, all: true }, ctx(opts, run)), /already in the registry from commit b{40}, not a{40}/);
  registry.a.versions['1.0.1-rl.12.40'] = null;
  assert.throws(() => publish({ ...opts, all: true }, ctx(opts, run)), /from commit \(unknown\)/);
});

test('publish: latest moved to the prerelease is put back; moved to another release is left and fails; a prerelease latest is refused', async () => {
  const root = workspace({ a: { name: 'a', version: '1.0.0' } });
  const registry = { a: { versions: { '1.0.0': null }, tags: { latest: '1.0.0' } } };
  let move = null;
  const { run, calls } = fakeRegistry(registry, { onPublish: (name, version) => { if (move) registry[name].tags.latest = move(version); } });
  const opts = options(root, ['a']);
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '1.0.1-rl.12.40' });

  move = (version) => version;
  publish({ ...opts, all: true }, ctx(opts, run));
  assert.equal(registry.a.tags.latest, '1.0.0', 'the registry moved latest to our prerelease; it is put back');
  assert.ok(calls.includes('dist-tag add a@1.0.0 latest --registry'));

  delete registry.a.versions['1.0.1-rl.12.40'];
  move = () => '1.0.1';
  const before = calls.length;
  assert.throws(() => publish({ ...opts, all: true }, ctx(opts, run)), /latest moved from 1\.0\.0 to 1\.0\.1 during this publish; another publish did that/);
  assert.equal(registry.a.tags.latest, '1.0.1', 'a real release is never rolled back');
  assert.ok(!calls.slice(before).some((call) => call.startsWith('dist-tag add')), 'nothing was written');

  delete registry.a.versions['1.0.1-rl.12.40'];
  registry.a.tags.latest = '1.0.1-rl.11.2';
  move = null;
  assert.throws(() => publish({ ...opts, all: true }, ctx(opts, run)), /latest is the prerelease 1\.0\.1-rl\.11\.2/);
});

test('report: one name@version per line in the check run text, success only when every package published and rl-<n> was handled', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' } });
  const { run } = fakeRegistry({
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
  });
  const opts = options(root, ['a', 'b'], { lockstep: true, branch: 'release/RL-3', build: '9' });
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  const state = opts.state;
  const created = [];
  const partial = JSON.parse(readFileSync(state, 'utf8'));
  partial.packages[0].published = true;
  writeFileSync(state, JSON.stringify(partial));
  const failed = await report(opts, ctx(opts, run, { createCheckRun: async (body) => created.push(body) }));
  assert.equal(failed.ok, false);
  assert.equal(created[0].conclusion, 'failure');
  assert.equal(created[0].output.text, '@revt-eng/a@0.1.562-rl.3.9');

  partial.packages[1].published = true;
  writeFileSync(state, JSON.stringify(partial));
  assert.equal((await report(opts, ctx(opts, run, { createCheckRun: async (body) => created.push(body) }))).ok, false, 'not promoted yet');
  partial.promoted = true;
  writeFileSync(state, JSON.stringify(partial));
  const done = await report(opts, ctx(opts, run, { createCheckRun: async (body) => created.push(body) }));
  assert.equal(done.ok, true);
  assert.equal(created[2].name, 'release-prerelease');
  assert.equal(created[2].external_id, 'RL-3');
  assert.equal(created[2].conclusion, 'success');
  assert.equal(created[2].output.text, '@revt-eng/a@0.1.562-rl.3.9\n@revt-eng/b@0.1.562-rl.3.9');
});

test('a build job packs each package next to the plan, and the publish job publishes the tarballs it checks', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' } });
  const registry = { '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } } };
  const { run, calls } = fakeRegistry(registry);
  const opts = options(root, ['a']);
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '0.1.562-rl.12.40' });
  assert.equal(pack({ ...opts, positional: [path.join(root, 'a')] }, { npm: run }), 'revt-eng-a-0.1.562-rl.12.40.tgz');
  const readTarball = (file) => JSON.parse(readFileSync(file, 'utf8'));
  publish({ ...opts, all: true }, ctx(opts, run, { readTarball }));
  const published = calls.find((call) => call.startsWith('publish'));
  assert.match(published, /^publish \S+revt-eng-a-0\.1\.562-rl\.12\.40\.tgz --tag rl-12-40 --registry$/);
  assert.equal(registry['@revt-eng/a'].versions['0.1.562-rl.12.40'], SHA, 'the stamped gitHead reaches the registry');
});

test('two builds of one Release compare by build number; anything else by semver', () => {
  assert.equal(isLaterBuild('0.2.0-rl.12.40', '0.1.562-rl.12.41'), false, 'a reverted bump: build 41 is newer despite a lower <next>');
  assert.equal(isLaterBuild('0.1.562-rl.12.41', '0.2.0-rl.12.40'), true);
  assert.equal(isLaterBuild('0.1.562-rl.13.1', '0.1.562-rl.12.40'), true, 'another Release: semver');
  assert.equal(isLaterBuild('0.1.562', '0.1.562-rl.12.40'), true, 'a release: semver');
});

test('promote moves rl-<n> forward after a reverted version bump', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' } });
  const registry = { '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.2.0-rl.12.40' } } };
  const { run } = fakeRegistry(registry);
  const opts = options(root, ['a'], { build: '41' });
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '0.1.562-rl.12.41' });
  publish({ ...opts, all: true }, ctx(opts, run));
  const state = promote(opts, ctx(opts, run));
  assert.equal(state.promoted, true);
  assert.equal(registry['@revt-eng/a'].tags['rl-12'], '0.1.562-rl.12.41');
});

test('promote never leaves rl-<n> split: a failed move puts back the packages already moved', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' }, c: { name: '@revt-eng/c', version: '0.1.561' } });
  const registry = {
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.30' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    '@revt-eng/c': { versions: { '0.1.561': null }, tags: { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.30' } },
  };
  const fake = fakeRegistry(registry);
  const run = (args, opt) => (args[0] === 'dist-tag' && args[1] === 'add' && args[2].startsWith('@revt-eng/c@') && args[3] === 'rl-12'
    ? { status: 1, stdout: '', stderr: 'E500 registry error' }
    : fake.run(args, opt));
  const opts = options(root, ['a', 'b', 'c'], { lockstep: true });
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '0.1.562-rl.12.40', b: '0.1.562-rl.12.40', c: '0.1.562-rl.12.40' });
  publish({ ...opts, all: true }, ctx(opts, run));
  assert.throws(() => promote(opts, ctx(opts, run)), /could not point rl-12 at @revt-eng\/c@0\.1\.562-rl\.12\.40 \(E500 registry error\); rl-12 was put back for the 2 package\(s\) already moved/);
  assert.equal(registry['@revt-eng/a'].tags['rl-12'], '0.1.562-rl.12.30', 'a is back on its previous build');
  assert.equal(registry['@revt-eng/b'].tags['rl-12'], undefined, 'b had no rl-12, so it has none again');
  assert.equal(registry['@revt-eng/c'].tags['rl-12'], '0.1.562-rl.12.30');
});

test('promote only warns when the temporary tag cannot be removed', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' } });
  const registry = { '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } } };
  const fake = fakeRegistry(registry);
  const run = (args, opt) => (args[0] === 'dist-tag' && args[1] === 'rm' ? { status: 1, stdout: '', stderr: 'E405' } : fake.run(args, opt));
  const opts = options(root, ['a']);
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '0.1.562-rl.12.40' });
  publish({ ...opts, all: true }, ctx(opts, run));
  assert.equal(promote(opts, ctx(opts, run)).promoted, true);
  assert.equal(registry['@revt-eng/a'].tags['rl-12'], '0.1.562-rl.12.40');
  assert.equal(registry['@revt-eng/a'].tags['rl-12-40'], '0.1.562-rl.12.40', 'left behind, with a warning');
});

test('only rl-<n> and rl-<n>-<k> are writable, never latest', () => {
  const context = { tag: 'rl-12', runTag: 'rl-12-40' };
  assert.equal(writableTag('rl-12', context), 'rl-12');
  assert.equal(writableTag('rl-12-40', context), 'rl-12-40');
  for (const tag of ['latest', 'rl-13', 'rl-12-41', 'next', '']) assert.throws(() => writableTag(tag, context), /refusing to write dist-tag/, tag);
});

test('a plan file that does not match the run writes nothing', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561', publishConfig: { registry: 'https://npm.pkg.github.com' } }, b: { name: '@revt-eng/b', version: '0.1.561', publishConfig: { registry: 'https://npm.pkg.github.com' } } });
  const registry = {
    '@revt-eng/a': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    '@revt-eng/b': { versions: { '0.1.561': null }, tags: { latest: '0.1.561' } },
    '@revt-eng/other': { versions: { '1.0.0': null }, tags: { latest: '1.0.0' } },
  };
  const { run, calls } = fakeRegistry(registry);
  const opts = options(root, ['a', 'b'], { lockstep: true, registry: 'https://npm.pkg.github.com/' });
  await plan(opts, { npm: run, checkRuns: async () => [], sha: SHA });
  stampAll(root, opts, { a: '0.1.562-rl.12.40', b: '0.1.562-rl.12.40' });
  const good = JSON.parse(readFileSync(opts.state, 'utf8'));
  for (const p of good.packages) p.published = true;
  const tamper = (change) => {
    const bad = JSON.parse(JSON.stringify(good));
    change(bad);
    writeFileSync(opts.state, JSON.stringify(bad));
  };
  const cases = [
    ['tag latest', (bad) => { bad.tag = 'latest'; }, /tag is "latest", not "rl-12"/],
    ['run tag latest', (bad) => { bad.runTag = 'latest'; }, /runTag is "latest", not "rl-12-40"/],
    ['another Release', (bad) => { bad.release = 'RL-13'; bad.n = 13; bad.tag = 'rl-13'; }, /release is "RL-13"/],
    ['another build', (bad) => { bad.k = 39; }, /k is 39, not 40/],
    ['another commit', (bad) => { bad.sha = OTHER_SHA; }, /sha is "b{40}"/],
    ['another package', (bad) => { bad.packages[0].name = '@revt-eng/other'; }, /is @revt-eng\/a at this commit, not @revt-eng\/other/],
    ['another registry', (bad) => { bad.packages[0].registry = 'https://registry.npmjs.org/'; }, /publishes to https:\/\/npm\.pkg\.github\.com\/ at this commit/],
    ['a version from another run', (bad) => { bad.packages[0].version = '0.1.562-rl.12.39'; }, /is not a build of RL-12 from run 40/],
    ['a version that is not a prerelease', (bad) => { bad.packages[0].version = '9.9.9'; }, /9\.9\.9 is not a build of RL-12/],
    ['a tarball outside the plan', (bad) => { bad.packages[0].tarball = '../../etc/x.tgz'; }, /tarball is "\.\.\/\.\.\/etc\/x\.tgz"/],
    ['a missing package', (bad) => { bad.packages.pop(); }, /it lists .*, not /],
    ['an extra package', (bad) => { bad.packages.push({ ...bad.packages[0] }); }, /it lists .*, not /],
  ];
  for (const [label, change, error] of cases) {
    tamper(change);
    const before = calls.length;
    assert.throws(() => promote(opts, ctx(opts, run)), error, label);
    assert.throws(() => publish({ ...opts, all: true }, ctx(opts, run)), error, label);
    assert.ok(!calls.slice(before).some((call) => /^(publish|dist-tag)/.test(call)), `${label}: nothing was written`);
    const created = [];
    const result = await report(opts, ctx(opts, run, { createCheckRun: async (body) => created.push(body) }));
    assert.equal(result.ok, false, `${label}: the report fails`);
    assert.equal(created[0].conclusion, 'failure');
  }
  tamper(() => {});
  assert.throws(() => trustedPlan(good, { ...opts, registry: 'https://registry.npmjs.org/' }, ctx(opts, run)), /this workflow publishes only to https:\/\/registry\.npmjs\.org\//);
  assert.throws(() => trustedPlan(good, { ...opts, package: [] }, ctx(opts, run)), /--package/);
  assert.throws(() => trustedPlan(good, opts, ctx(opts, run, { env: { GITHUB_REF_NAME: 'main', GITHUB_RUN_NUMBER: '40', GITHUB_SHA: SHA } })), /not a Release branch/);
  assert.equal(trustedPlan(good, opts, ctx(opts, run)).packages.length, 2, 'the untouched plan passes');
});
