// Tests for scripts/release-prerelease.mjs (EP-1747 phase 5), run by `node --test` in scripts/ci-l1.mjs (named .check.mjs so vitest does not collect it): the version scheme,
// the reuse of an earlier report for the same commit, and the publish guards.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildNumber,
  nextVersion,
  parseReportLines,
  plan,
  prereleaseVersion,
  priorReport,
  publish,
  registryOf,
  releaseFromBranch,
  report,
} from './release-prerelease.mjs';

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

test('<k> is a positive run number and the version reads <next>-rl.<n>.<k>', () => {
  assert.equal(buildNumber('40'), 40);
  for (const bad of ['0', '-1', '1.5', 'abc', '', undefined]) assert.throws(() => buildNumber(bad), /positive integer/);
  assert.equal(prereleaseVersion('0.1.562', 12, 40), '0.1.562-rl.12.40');
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

// A fake registry: `versions` maps name -> published versions, `tags` name -> dist-tags.
function fakeNpm(registry) {
  const calls = [];
  const run = (args) => {
    calls.push(args.join(' '));
    const json = (value) => ({ status: 0, stdout: JSON.stringify(value), stderr: '' });
    const missing = { status: 1, stdout: JSON.stringify({ error: { code: 'E404', summary: 'Not found' } }), stderr: '' };
    if (args[0] === 'view') {
      const [spec, field] = args.slice(1, 3);
      const at = spec.lastIndexOf('@');
      const name = at > 0 ? spec.slice(0, at) : spec;
      if (!registry.versions[name]) return missing;
      if (field === 'dist-tags') return json(registry.tags[name] ?? {});
      const wanted = spec.slice(at + 1);
      return registry.versions[name].includes(wanted) ? json(wanted) : missing;
    }
    if (args[0] === 'publish') {
      const name = registry.publishing;
      const version = registry.publishVersion;
      registry.versions[name].push(version);
      registry.tags[name][args[args.indexOf('--tag') + 1]] = version;
      if (registry.moveLatest) registry.tags[name].latest = version;
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'dist-tag') {
      const spec = args[2];
      const at = spec.lastIndexOf('@');
      registry.tags[spec.slice(0, at)][args[3]] = spec.slice(at + 1);
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

test('plan: a published base moves to its next patch; an unpublished bump is kept; lockstep shares one version', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' }, c: { name: 'c', version: '0.3.0' } });
  const registry = { versions: { '@revt-eng/a': ['0.1.561'], '@revt-eng/b': ['0.1.561'], c: ['0.2.9'] }, tags: {} };
  const { run } = fakeNpm(registry);
  const state = path.join(root, 'state.json');
  const opts = (packages, extra = {}) => ({ package: packages.map((dir) => path.join(root, dir)), positional: [], passthrough: [], branch: 'release/RL-12', build: '40', state, ...extra });

  const lockstep = await plan(opts(['a', 'b'], { lockstep: true }), { npm: run, checkRuns: async () => [] });
  assert.deepEqual(lockstep.packages.map((p) => p.version), ['0.1.562-rl.12.40', '0.1.562-rl.12.40']);
  assert.equal(lockstep.tag, 'rl-12');

  const independent = await plan(opts(['a', 'c']), { npm: run, checkRuns: async () => [] });
  assert.deepEqual(independent.packages.map((p) => p.version), ['0.1.562-rl.12.40', '0.3.0-rl.12.40']);
  assert.equal(JSON.parse(readFileSync(state, 'utf8')).packages[1].next, '0.3.0');
});

test('plan: an earlier successful report on the same commit is reused when its versions are in the registry', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' } });
  const registry = { versions: { '@revt-eng/a': ['0.1.561', '0.1.562-rl.12.7'] }, tags: {} };
  const { run } = fakeNpm(registry);
  const options = { package: [path.join(root, 'a')], positional: [], passthrough: [], branch: 'release/RL-12', build: '41', state: path.join(root, 'state.json') };
  const earlier = [{ name: 'release-prerelease', conclusion: 'success', external_id: 'RL-12', completed_at: '2026-11-12T10:00:00Z', output: { text: '@revt-eng/a@0.1.562-rl.12.7' } }];
  const reused = await plan(options, { npm: run, checkRuns: async () => earlier });
  assert.equal(reused.reuse, true);
  assert.equal(reused.packages[0].version, '0.1.562-rl.12.7');

  registry.versions['@revt-eng/a'] = ['0.1.561'];
  const fresh = await plan(options, { npm: run, checkRuns: async () => earlier });
  assert.equal(fresh.reuse, false, 'a reported version missing from the registry is not reused');
  assert.equal(fresh.packages[0].version, '0.1.562-rl.12.41');
});

test('publish: under the Release tag only, skipped on a re-run, latest kept, and refused for a package with no latest', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' } });
  const registry = { versions: { '@revt-eng/a': ['0.1.561'] }, tags: { '@revt-eng/a': { latest: '0.1.561' } }, publishing: '@revt-eng/a', publishVersion: '0.1.562-rl.12.40' };
  const { run, calls } = fakeNpm(registry);
  const dir = path.join(root, 'a');
  const options = { package: [dir], positional: [dir], passthrough: ['--provenance'], branch: 'release/RL-12', build: '40', state: path.join(root, 'state.json') };
  await plan(options, { npm: run, checkRuns: async () => [] });

  assert.throws(() => publish(options, { npm: run }), /stamp 0\.1\.562-rl\.12\.40/);
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: '@revt-eng/a', version: '0.1.562-rl.12.40' }));

  publish(options, { npm: run });
  const published = calls.filter((call) => call.startsWith('publish'));
  assert.deepEqual(published, ['publish --tag rl-12 --registry https://registry.npmjs.org/ --provenance']);
  assert.deepEqual(registry.tags['@revt-eng/a'], { latest: '0.1.561', 'rl-12': '0.1.562-rl.12.40' });

  publish(options, { npm: run });
  assert.equal(calls.filter((call) => call.startsWith('publish')).length, 1, 'a re-run does not publish again');

  registry.versions['@revt-eng/a'] = ['0.1.561'];
  registry.moveLatest = true;
  publish(options, { npm: run });
  assert.equal(registry.tags['@revt-eng/a'].latest, '0.1.561', 'a registry that moves latest has it put back');

  registry.tags['@revt-eng/a'] = {};
  registry.versions['@revt-eng/a'] = ['0.1.561'];
  assert.throws(() => publish(options, { npm: run }), /no latest dist-tag/);
});

test('report: one name@version per line in the check run text, success only when every package published', async () => {
  const root = workspace({ a: { name: '@revt-eng/a', version: '0.1.561' }, b: { name: '@revt-eng/b', version: '0.1.561' } });
  const registry = { versions: { '@revt-eng/a': ['0.1.561'], '@revt-eng/b': ['0.1.561'] }, tags: {} };
  const { run } = fakeNpm(registry);
  const state = path.join(root, 'state.json');
  const options = { package: [path.join(root, 'a'), path.join(root, 'b')], positional: [], passthrough: [], branch: 'release/RL-3', build: '9', state, lockstep: true };
  await plan(options, { npm: run, checkRuns: async () => [] });

  const created = [];
  const partial = JSON.parse(readFileSync(state, 'utf8'));
  partial.packages[0].published = true;
  writeFileSync(state, JSON.stringify(partial));
  const failed = await report({ state }, { createCheckRun: async (body) => created.push(body) });
  assert.equal(failed.ok, false);
  assert.equal(created[0].conclusion, 'failure');
  assert.equal(created[0].output.text, '@revt-eng/a@0.1.562-rl.3.9');

  partial.packages[1].published = true;
  writeFileSync(state, JSON.stringify(partial));
  const done = await report({ state }, { createCheckRun: async (body) => created.push(body) });
  assert.equal(done.ok, true);
  assert.equal(created[1].name, 'release-prerelease');
  assert.equal(created[1].external_id, 'RL-3');
  assert.equal(created[1].conclusion, 'success');
  assert.equal(created[1].output.text, '@revt-eng/a@0.1.562-rl.3.9\n@revt-eng/b@0.1.562-rl.3.9');
});
