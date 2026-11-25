// A workflow that pushes, publishes or mints a token names every action and reusable workflow it uses by full
// commit SHA, with the tag in a trailing comment: a tag or branch can be moved to other code, which would then run with
// that token. Run by `node --test` in scripts/ci-l1.mjs (named .check.mjs so vitest does not collect it).
//
// The rule and the patterns are those of the shared workflow policy the other repositories keep in
// scripts/workflow-policy.mjs (checkPinnedRefs). This repository is public and keeps its own short copy here.
// Not seen: a push made inside a script with a personal token, and refs inside what a pinned or local `uses:` runs.
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const RELEASE_PATH = [
  ['mints an App token', /\bcreate-github-app-token\b|\b\w+_PRIVATE_KEY\b/i],
  ['mints an OIDC token', /['"]?\bid-token['"]?\s*:\s*['"]?write\b/],
  ['may push (contents: write)', /['"]?\bcontents['"]?\s*:\s*['"]?write\b/],
  ['may publish (packages, pages or attestations: write)', /['"]?\b(?:packages|pages|attestations)['"]?\s*:\s*['"]?write\b/],
  ['may deploy (deployments: write)', /['"]?\bdeployments['"]?\s*:\s*['"]?write\b/],
  ['may write everything (write-all)', /['"]?\bpermissions['"]?\s*:\s*['"]?write-all\b/],
  ['reads a registry token', /\b(?:NPM_TOKEN|CARGO_REGISTRY_TOKEN|PYPI_\w*TOKEN)\b/],
  ['publishes a package', /\b(?:npm|pnpm|yarn|cargo|uv|twine|poetry)\s+(?:[^\n|;&#]*\s)?(?:publish|upload)\b/],
  ['publishes a release', /\bgh\s+release\s+(?:create|upload|edit)\b/],
  ['pushes', /\bgit\b[^\n|;&#]*\spush\b|^\s*push\s+(?:-\S+\s+)*origin\b/],
];
const USES = /(?:^|[\s{,-])['"]?uses['"]?\s*:\s*(.*)$/;
const ignorable = line => line.trim() === '' || /^\s*#/.test(line);

/** Whether a `uses:` value can change without a commit here: only a full commit SHA, an image digest or a local file cannot. */
export function isMovingRef(value) {
  const ref = String(value ?? '');
  if (/^\.\//.test(ref)) return false;
  if (/^docker:\/\//.test(ref)) return !/@sha256:[0-9a-f]{64}$/.test(ref);
  return !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+@[0-9a-f]{40}$/.test(ref);
}

/** Moving refs in a workflow that pushes, publishes or mints a token: `{ line, ref, why }`. Empty when it does none of those. */
export function movingRefsOnReleasePath(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const reasons = new Set();
  for (const line of lines) if (!ignorable(line)) for (const [why, pattern] of RELEASE_PATH) if (pattern.test(line)) reasons.add(why);
  if (reasons.size === 0) return [];
  const findings = [];
  for (const [i, line] of lines.entries()) {
    const uses = ignorable(line) ? null : USES.exec(line);
    if (!uses) continue;
    const ref = uses[1].replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*?)\1.*$/, '$2').replace(/\s*[,}].*$/, '');
    if (isMovingRef(ref)) findings.push({ line: i + 1, ref, why: `${ref || 'an unreadable ref'} is not pinned to a commit in a workflow that ${[...reasons].join(', ')}` });
  }
  return findings;
}

const SHA = 'd72941d797fd3113feb6b93fd0dec494b13a2547';
const workflow = body => `on: push\npermissions:\n  contents: read\njobs:\n  a:\n    runs-on: ubuntu-latest\n${body}`;

test('a full commit SHA, an image digest and a local file are fixed; a tag, a branch and a short SHA move', () => {
  for (const ref of [`actions/checkout@${SHA}`, `acme/shared/.github/workflows/ci.yml@${SHA}`, './.github/workflows/ci-level.yml', `docker://alpine@sha256:${'a'.repeat(64)}`]) assert.equal(isMovingRef(ref), false, ref);
  for (const ref of ['actions/checkout@v7', 'actions/checkout@main', `actions/checkout@${SHA.slice(0, 7)}`, `actions/checkout@${SHA}0`, 'actions/checkout', 'docker://alpine:3', '', '>-', '${{ matrix.action }}']) assert.equal(isMovingRef(ref), true, ref);
});

test('a moving ref is refused where the workflow pushes, publishes or mints a token, and passes once pinned', () => {
  for (const body of [
    '    permissions:\n      contents: write\n',
    '    permissions:\n      id-token: write\n',
    '    steps:\n      - uses: actions/create-github-app-token@' + SHA + '\n',
    '    env:\n      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}\n',
    '    steps:\n      - run: npm publish --provenance\n',
    '    steps:\n      - run: git push origin HEAD:main\n',
  ]) {
    const moving = `${workflow(body)}    steps:\n      - uses: actions/checkout@v7\n`;
    assert.deepEqual(movingRefsOnReleasePath(moving).map(f => f.ref), ['actions/checkout@v7'], body);
    assert.deepEqual(movingRefsOnReleasePath(moving.replace('@v7', `@${SHA} # v7.0.1`)), [], body);
  }
});

test('a workflow that only checks keeps its tags, and a commented uses: is not read', () => {
  assert.deepEqual(movingRefsOnReleasePath(workflow('    steps:\n      - uses: actions/checkout@v7\n      # git push is not done here\n')), []);
  assert.deepEqual(movingRefsOnReleasePath(workflow(`    permissions:\n      contents: write\n    steps:\n      # uses: a/b@v1\n      - uses: a/e@${SHA} # v1.2.3\n`)), []);
});

test("this repository's release-path workflows name every action by commit", () => {
  const dir = new URL('../.github/workflows/', import.meta.url);
  for (const file of readdirSync(dir).filter(name => /\.ya?ml$/.test(name))) {
    assert.deepEqual(movingRefsOnReleasePath(readFileSync(new URL(file, dir), 'utf8')), [], file);
  }
});
