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
    expect(snapshot).toContain('PUBLISHED=$(node scripts/npm-published.mjs @revturbine/cli "$VERSION")');
    expect(snapshot).not.toMatch(/^ *if npm view/m);
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
    expect(publish).toContain('PUBLISHED=$(node scripts/npm-published.mjs @revturbine/cli "$VERSION")');
    expect(publish).not.toMatch(/^ *if npm view/m);
  });
});

describe('publish-on-main reuses the PR gate on the same commit', () => {
  const publish = workflow('publish-on-main.yml');
  const gate = workflow('pr-gate.yml');
  const job = (text: string, id: string) => {
    const start = text.indexOf(`\n  ${id}:\n`);
    expect(start, `job ${id}`).toBeGreaterThan(-1);
    const rest = text.slice(start + 1);
    const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
    return next === -1 ? rest : rest.slice(0, next + 2);
  };

  it('waits for the gate push run on exactly this commit and requires all of it', () => {
    const wait = job(publish, 'gate');
    expect(wait).toContain('node scripts/gate-result.mjs --workflow pr-gate.yml --sha "$GITHUB_SHA"');
    expect(wait).toContain("--require 'verify / l1' --require-prefix 'Packed CLI smoke ('");
    expect(wait).toContain('--whole-run --wait-minutes 40 --absent-after-minutes 5 --github-output');
    expect(wait).toMatch(/^ {6}actions: read/m);
    // The wait is skipped only when there is nothing to publish.
    expect(wait).toContain("if: steps.state.outputs.published == 'false'");
    // The waiting job holds no publish credential.
    expect(wait).not.toMatch(/secrets\.|id-token|contents: write/);
  });

  it('fails the gate job when the gate failed or never finished, and only then', () => {
    const wait = job(publish, 'gate');
    expect(wait).toMatch(/^ {6}result: \$\{\{ steps\.wait\.outputs\.result \}\}$/m);
    // The script reports the result and exits 0; this step decides. A real failure is never retried here.
    expect(wait).not.toContain('--expect');
    expect(wait).toMatch(/^ {12}success\) /m);
    expect(wait).toMatch(/^ {12}cancelled\|absent\|unknown\) echo "::warning::/m);
    expect(wait).toMatch(/^ {12}\*\) echo "::error::.*; exit 1 ;;$/m);
  });

  it('runs the gate\'s own checks itself when the gate was cancelled, is absent or could not be read', () => {
    // A third push to main cancels the second push's queued gate jobs (one pending run per concurrency
    // group): that must not strand the second push's release.
    const condition = "if: ${{ needs.gate.outputs.published == 'false' && contains(fromJSON('[\"cancelled\", \"absent\", \"unknown\"]'), needs.gate.outputs.result) }}";
    // What a job runs: from `uses:` on, without comments. Identical text means identical checks.
    const runs = (text: string) => text.slice(text.indexOf('    uses: ')).split('\n').filter(line => line.trim() && !/^\s*#/.test(line)).join('\n');
    const strategy = (text: string) => /\n {4}strategy:\n(?: {6,}.*\n)+/.exec(text)?.[0];
    for (const [fallback, original] of [['fallback-verify', 'verify'], ['fallback-smoke', 'package-smoke']]) {
      const mine = job(publish, fallback);
      expect(mine).toMatch(/^ {4}needs: gate$/m);
      expect(mine).toContain(condition);
      expect(runs(mine)).toContain('uses: ./.github/workflows/ci-level.yml');
      expect(runs(mine), `${fallback} must run exactly what pr-gate.yml's ${original} runs`).toBe(runs(job(gate, original)));
      expect(strategy(mine)).toBe(strategy(job(gate, original)));
      expect(mine).not.toMatch(/secrets|id-token|contents: write/);
    }
    expect(strategy(job(publish, 'fallback-smoke'))).toContain("node: ['22.13.0', '24']");
    // The commands themselves live in one script, for the gate and the fallback alike.
    expect(job(gate, 'verify')).not.toMatch(/^ {6}command:/m);
    expect(job(gate, 'package-smoke')).toMatch(/^ {6}command: npm run ci:l1:smoke$/m);
  });

  it('publishes on the gate\'s success or on both fallback jobs, never on a failed gate', () => {
    const ship = job(publish, 'publish');
    expect(ship).toMatch(/^ {4}needs: \[gate, fallback-verify, fallback-smoke\]$/m);
    expect(ship).toContain("!cancelled() && needs.gate.result == 'success' &&");
    expect(ship).toContain("(needs.gate.outputs.published == 'true' ||");
    expect(ship).toContain("needs.gate.outputs.result == 'success' ||");
    expect(ship).toContain("(needs.fallback-verify.result == 'success' && needs.fallback-smoke.result == 'success'))");
    expect(ship).not.toMatch(/always\(\)|continue-on-error/);
  });

  it('names the gate jobs as pr-gate.yml names them', () => {
    // "verify / l1": the job id, then the shared workflow's job name (the level, when `name` is not passed).
    const verify = job(gate, 'verify');
    expect(verify).toContain('uses: ./.github/workflows/ci-level.yml');
    expect(verify).toMatch(/^ {6}level: l1$/m);
    expect(verify).not.toMatch(/^ {4}name:|^ {6}name:/m);
    expect(job(gate, 'package-smoke')).toMatch(/^ {4}name: Packed CLI smoke \(Node \$\{\{ matrix\.node \}\}\)$/m);
    // A push to main starts both workflows on the same commit.
    expect(gate).toMatch(/^ {2}push:\r?\n {4}branches: \[main\]/m);
    expect(workflow('ci-level.yml')).toContain("name: ${{ inputs.name != '' && inputs.name || inputs.level }}");
  });

  it('publishes only after the gate job, and runs no second verify', () => {
    const ship = job(publish, 'publish');
    expect(publish.split('\n').filter(line => !/^\s*#/.test(line)).join('\n')).not.toContain('npm run verify');
    expect(ship.indexOf('npm run build')).toBeLessThan(ship.indexOf('npm publish --access public --provenance'));
    expect(ship).toContain('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"');
  });

  it('bounds every job', () => {
    expect(job(publish, 'gate')).toMatch(/^ {4}timeout-minutes: 45$/m);
    expect(job(publish, 'publish')).toMatch(/^ {4}timeout-minutes: 15$/m);
    expect(workflow('release.yml')).toMatch(/^ {4}timeout-minutes: 20$/m);
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
