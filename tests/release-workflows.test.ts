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
    expect(snapshot).toContain('uses: actions/create-github-app-token@v1');
    expect(snapshot).toContain("app-id: ${{ vars.CI_PUSH_APP_ID }}");
    expect(snapshot).toContain('permission-contents: write');
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
    expect([...push.matchAll(/\$\{\{\s*secrets\.(\w+)/g)].map(m => m[1])).toEqual(['CI_PUSH_APP_PRIVATE_KEY']);
    expect(push).not.toMatch(/ref: refs\/heads\/\$\{\{ inputs\.branch \}\}/);
    expect(push).toContain('fetch --quiet --depth=1 --no-tags');
    expect(push).toContain('release-pin.mjs commit');
    expect(push).toContain('-c core.hooksPath=/dev/null -c core.fsmonitor=false');
  });

  it('retries a moved branch inside one run', () => {
    expect(caller).toMatch(/attempt-2:\n\s+needs: attempt-1\n\s+if: needs\.attempt-1\.outputs\.moved == 'true'/);
    expect(caller).toMatch(/attempt-3:\n\s+needs: attempt-2\n\s+if: needs\.attempt-2\.outputs\.moved == 'true'/);
    expect(caller).not.toMatch(/^\s*run: gh workflow run/m);
  });
});
