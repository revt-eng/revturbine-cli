/**
 * BUG-1189 / ST-1453 TASK-5 — a scaffold schema publish ends in a CLI patch
 * release with no human step. The behaviour itself runs in GitHub Actions; this
 * pins the wiring so a refactor cannot silently cut the chain:
 * snapshot merge (version.ts changes) -> patch bump on main -> publish-on-main.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = (name: string) =>
  readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');

// The push App is revturbine-ci-bot, whose installation can do more than push. Every token it mints here
// is narrowed: contents: write and no other permission, on this repository only, from a pinned action.
const tokenAction = 'uses: actions/create-github-app-token@d72941d797fd3113feb6b93fd0dec494b13a2547 # v1.12.0';
const expectNarrowedToken = (text: string) => {
  expect(text).toContain(tokenAction);
  expect(text).not.toMatch(/create-github-app-token@v\d/);
  expect([...text.matchAll(/^\s+(permission-[\w-]+): (\S+)$/gm)].map(m => `${m[1]}: ${m[2]}`)).toEqual(['permission-contents: write']);
  expect(text).toContain('owner: ${{ github.repository_owner }}');
  expect(text).toContain('repositories: ${{ github.event.repository.name }}');
};

describe('snapshot -> patch release chain', () => {
  const snapshot = workflow('snapshot-patch-release.yml');
  const publish = workflow('publish-on-main.yml');

  it('starts when a merged snapshot changes the bundled schema version on main', () => {
    expect(snapshot).toMatch(/branches: \[main\]/);
    expect(snapshot).toContain("- 'src/schema/version.ts'");
  });

  it('only bumps when the current version is already on npm, and touches package files only', () => {
    expect(snapshot).toContain('npm view "@revturbine/cli@$VERSION"');
    expect(snapshot).toContain('npm version patch --no-git-tag-version');
    expect(snapshot).toContain('git add package.json package-lock.json');
    expect(snapshot).toContain('npm install --global --ignore-scripts "npm@$NPM_VERSION"');
  });

  it('pushes the bump with the push App, not a PAT, so the push starts publish-on-main', () => {
    // EP-1747 phase 7: only the bypass Apps may push to main without a pull request.
    expectNarrowedToken(snapshot);
    expect(snapshot).toContain("app-id: ${{ vars.CI_PUSH_APP_ID }}");
    expect(snapshot).toMatch(/^ {4}environment: ci-push$/m);
    expect([...snapshot.matchAll(/\$\{\{\s*secrets\.(\w+)/g)].map(m => m[1])).toEqual(['CI_PUSH_APP_PRIVATE_KEY']);
    expect(snapshot).not.toContain('REVTURBINE_GIT_TOKEN }}');
    expect(snapshot).toContain('push origin HEAD:main');
    expect(snapshot).not.toContain('gh workflow run publish-on-main.yml');
    expect(publish).toMatch(/^ {2}push:\r?\n {4}branches: \[main\]\r?\n {4}paths:\r?\n {6}- 'package\.json'/m);
    expect(publish).toMatch(/^ {2}workflow_dispatch:/m);
  });

  it('keeps publishing idempotent against the registry', () => {
    expect(publish).toContain('npm view "@revturbine/cli@$VERSION"');
  });
});

describe('release pin: the branch runs no code next to the push key (EP-1747 phase 7)', () => {
  const attempt = workflow('release-pin-attempt.yml');
  const caller = workflow('release-pin.yml');
  const job = (name: string) => {
    const start = attempt.indexOf(`\n  ${name}:\n`);
    expect(start).toBeGreaterThan(-1);
    const rest = attempt.slice(start + 1);
    const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
    return next === -1 ? rest : rest.slice(0, next + 2);
  };

  it('pins with no environment and no secrets', () => {
    const pin = job('pin');
    expect(pin).not.toMatch(/environment:/);
    expect(pin).not.toMatch(/secrets\./);
    expect(pin).toContain('release-pin.mjs package-manager --dir work');
    expect(pin).toContain('npm install --global --ignore-scripts "$pm"');
    expect(pin).toContain('persist-credentials: false');
  });

  it('pushes from the ci-push environment without checking the branch out', () => {
    const push = job('push');
    expect(push).toMatch(/^ {4}environment: ci-push$/m);
    expect(push).toContain('app-id: ${{ vars.CI_PUSH_APP_ID }}');
    expectNarrowedToken(push);
    expect([...push.matchAll(/\$\{\{\s*secrets\.(\w+)/g)].map(m => m[1])).toEqual(['CI_PUSH_APP_PRIVATE_KEY']);
    expect(push).not.toMatch(/ref: refs\/heads\/\$\{\{ inputs\.branch \}\}/);
    expect(push).toContain('fetch --quiet --depth=1 --no-tags');
    expect(push).toContain('release-pin.mjs commit');
    expect(push).toContain('-c core.hooksPath=/dev/null -c core.fsmonitor=false');
  });

  // The first Backlog-dispatched pins (2026-11-16) failed in the push job with "Input required and not supplied:
  // private-key". A called workflow's secrets context holds only what its caller passes, and release-pin.yml passed
  // nothing, so the ci-push environment's key read as empty. The caller now passes that one name. The key still
  // reaches the push job alone: it is an environment secret, and only that job declares the environment.
  const code = (text: string) => text.split('\n').filter(line => !/^\s*#/.test(line)).join('\n');
  // Every use of the secrets context: secrets.NAME by name, anything else (secrets['NAME'], toJSON(secrets)) as '*'.
  const secretUses = (text: string) => [...code(text).matchAll(/\bsecrets\b(?!:)(?:\.(\w+))?/g)].map(m => m[1] ?? '*');

  it('passes the called workflow the push key by name and no other secret', () => {
    const declared = /\n {4}secrets:\n((?: {6,}.*\n)+)/.exec(code(attempt.slice(0, attempt.indexOf('\njobs:\n') + 1)))?.[1] ?? '';
    expect([...declared.matchAll(/^ {6}(\w+):/gm)].map(m => m[1])).toEqual(['CI_PUSH_APP_PRIVATE_KEY']);
    expect(code(caller)).not.toMatch(/secrets:\s*inherit/);
    const calls = code(caller).split(/\n(?= {2}[\w-]+:\n)/).filter(block => block.includes('uses: ./.github/workflows/release-pin-attempt.yml'));
    expect(calls.map(block => /^ {2}([\w-]+):/.exec(block)?.[1])).toEqual(['attempt-1', 'attempt-2', 'attempt-3']);
    for (const call of calls) {
      expect(call).toMatch(/\n {4}secrets:\n {6}CI_PUSH_APP_PRIVATE_KEY: \$\{\{ secrets\.CI_PUSH_APP_PRIVATE_KEY \}\}\n(?! {6})/);
      expect(call).not.toMatch(/^ {4}environment:/m);
    }
    expect(secretUses(caller)).toEqual(['CI_PUSH_APP_PRIVATE_KEY', 'CI_PUSH_APP_PRIVATE_KEY', 'CI_PUSH_APP_PRIVATE_KEY']);
  });

  it('reads the push key only in the job that declares the ci-push environment', () => {
    const jobs = attempt.slice(attempt.indexOf('\njobs:\n'));
    expect([...jobs.matchAll(/^ {2}([\w-]+):$/gm)].map(m => m[1])).toEqual(['pin', 'push']);
    expect(secretUses(job('pin'))).toEqual([]);
    expect(job('pin')).not.toMatch(/^ {4}environment:/m);
    expect(secretUses(job('push'))).toEqual(['CI_PUSH_APP_PRIVATE_KEY']);
    expect(job('push')).toMatch(/^ {4}environment: ci-push$/m);
  });

  it('retries a moved branch inside one run', () => {
    expect(caller).toMatch(/attempt-2:\n\s+needs: attempt-1\n\s+if: needs\.attempt-1\.outputs\.moved == 'true'/);
    expect(caller).toMatch(/attempt-3:\n\s+needs: attempt-2\n\s+if: needs\.attempt-2\.outputs\.moved == 'true'/);
    expect(caller).not.toMatch(/^\s*run: gh workflow run/m);
  });
});
