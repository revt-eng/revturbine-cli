#!/usr/bin/env node
// Check level L1 for the CLI, run in CI by the shared check-level workflow (.github/workflows/ci-level.yml,
// EP-1747) after it sets up Node, the pinned npm and `npm ci`. The same steps the PR gate's jobs ran, in order:
//
//   npm run ci:l1        (job `verify`) selector regression checks, line endings (BL-0216), typecheck, lint,
//                        schema consistency, tests, build. Pull requests into or out of an iteration/ branch run
//                        the tests the PR base's own selector picks; everything else runs every test.
//   npm run ci:l1:smoke  (job `Packed CLI smoke`, Node 22.13.0 and 24) build, pack, install the tarball into a
//                        clean consumer with no workspace siblings, then exercise the installed binary.
//
// Iteration pull requests need full history (fetch-depth 0) for the PR base.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ITERATION_BRANCH = /^iteration\/(IT|it)-[0-9]+([/-][a-zA-Z0-9_/-]+)?$/;

/**
 * Which tests this run executes. Pull requests into or out of an iteration/ branch (compared without regard to
 * case, like the workflow's startsWith) run targeted tests and must name the branch iteration/it-<number>.
 */
export function testPlan(env, event) {
  const baseRef = env.GITHUB_BASE_REF ?? '';
  const headRef = env.GITHUB_HEAD_REF ?? '';
  const iteration = ref => ref.toLowerCase().startsWith('iteration/');
  if (env.GITHUB_EVENT_NAME !== 'pull_request' || (!iteration(baseRef) && !iteration(headRef))) return { kind: 'exhaustive' };
  if (!ITERATION_BRANCH.test(baseRef) && !ITERATION_BRANCH.test(headRef)) {
    return { kind: 'invalid', error: 'Iteration branch must use iteration/it-<number> with an optional slug' };
  }
  return { kind: 'targeted', baseSha: event?.pull_request?.base?.sha ?? '', baseRef, headRef };
}

const inActions = process.env.GITHUB_ACTIONS === 'true';

function fail(message) {
  console.error(inActions ? `::error::${message}` : message);
  process.exit(1);
}

// Run npm with the npm that runs this script (the pinned one in CI), on every platform.
const npmCli = process.env.npm_execpath && /\.c?js$/.test(process.env.npm_execpath) ? process.env.npm_execpath : '';
const npm = args => (npmCli ? [process.execPath, [npmCli, ...args]] : ['npm', args]);

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32' && !path.isAbsolute(command),
    ...options,
    env: { ...process.env, ...options.env },
  });
}

function step(label, [command, args], options = {}) {
  process.stdout.write(inActions ? `::group::${label}\n` : `\n== ${label}\n`);
  const result = run(command, args, options);
  if (inActions) process.stdout.write('::endgroup::\n');
  if (result.status !== 0) fail(`ci:l1 failed at "${label}" (exit ${result.status ?? result.signal}).`);
  return result;
}

function verify() {
  step('Iteration selector regression checks', [process.execPath, ['--test', 'scripts/iteration-targeted.check.mjs']]);
  step('Line-ending check (BL-0216)', [process.execPath, ['scripts/check-line-endings.mjs', '--all']]);
  step('npm run typecheck', npm(['run', 'typecheck']));
  step('npm run lint', npm(['run', 'lint']));
  step('npm run check:schema', npm(['run', 'check:schema']));

  const eventPath = process.env.GITHUB_EVENT_PATH;
  const event = eventPath && existsSync(eventPath) ? JSON.parse(readFileSync(eventPath, 'utf8')) : {};
  const plan = testPlan(process.env, event);
  if (plan.kind === 'invalid') fail(plan.error);
  if (plan.kind === 'targeted') {
    // The PR base's selector, not this tree's: a pull request cannot loosen the selector that judges it.
    const { baseSha, baseRef, headRef } = plan;
    const trusted = spawnSync('git', ['show', `${baseSha}:scripts/iteration-targeted.mjs`], { encoding: 'utf8' });
    if (trusted.status !== 0) fail(`Could not read the PR base's selector: ${trusted.stderr}`);
    const selector = path.join(mkdtempSync(path.join(process.env.RUNNER_TEMP || tmpdir(), 'iteration-')), 'iteration-targeted.mjs');
    writeFileSync(selector, trusted.stdout);
    step('Targeted iteration tests', [process.execPath, [selector, baseSha]], {
      env: { ITERATION_BASE_SHA: baseSha, ITERATION_BASE_REF: baseRef, ITERATION_HEAD_REF: headRef },
    });
  } else {
    step('Exhaustive tests', npm(['run', 'test']));
  }
  step('npm run build', npm(['run', 'build']));
}

function packageSmoke() {
  step('npm run build', npm(['run', 'build']));

  // Pack and install in a clean consumer: no workspace siblings (scaffold, demo-data) present.
  const packDir = path.join(process.env.RUNNER_TEMP || mkdtempSync(path.join(tmpdir(), 'cli-')), 'cli-pack');
  const smokeDir = mkdtempSync(path.join(tmpdir(), 'cli-smoke-'));
  mkdirSync(packDir, { recursive: true });
  step('npm pack', npm(['pack', '--pack-destination', packDir]));
  const tarball = readdirSync(packDir).find(file => file.endsWith('.tgz'));
  if (!tarball) fail('npm pack did not produce a CLI tarball');
  step('npm init in the clean consumer', npm(['init', '--yes']), { cwd: smokeDir, stdio: ['inherit', 'ignore', 'inherit'] });
  step('Install the tarball in the clean consumer', npm(['install', '--ignore-scripts', path.join(packDir, tarball)]), { cwd: smokeDir });
  const cliBin = path.join(smokeDir, 'node_modules', '.bin', process.platform === 'win32' ? 'revturbine.cmd' : 'revturbine');
  const env = { CLI_BIN: cliBin, REVTURBINE_TEST_CLI: path.join(smokeDir, 'node_modules', '@revturbine', 'cli', 'dist', 'cli.js') };
  const cli = args => [cliBin, args];
  const windowsBin = { shell: process.platform === 'win32' };

  for (const [label, file] of [
    ['init preserves existing integrations and targets one skills agent', 'tests/init-process.test.ts'],
    ['whoami reports authentication evidence and bounds unavailable services', 'tests/whoami-process.test.ts'],
    ['shared placement warnings remain advisory and validate offline', 'tests/placement-validation-process.test.ts'],
    ['latest SDK guidance preserves projects and bounds registry failures', 'tests/sdk-version-process.test.ts'],
    ['CI mode (env token, extra headers, diff --exit-code) never prints secrets', 'tests/ci-mode-process.test.ts'],
    ['customer provisioning preserves scope, selectors and safe retry behavior', 'tests/customer-provisioning-http.test.ts'],
  ]) step(label, npm(['test', '--', file]), { env });

  step('validate a valid config (expect exit 0)', cli(['validate', 'tests/fixtures/valid.export-config.json']), { env, ...windowsBin });

  process.stdout.write(inActions ? '::group::validate an invalid config (expect exit 4)\n' : '\n== validate an invalid config (expect exit 4)\n');
  const invalid = run(cliBin, ['validate', 'tests/fixtures/invalid.export-config.json'], { env, ...windowsBin });
  if (inActions) process.stdout.write('::endgroup::\n');
  if (invalid.status !== 4) fail(`invalid config exited ${invalid.status ?? invalid.signal}; expected 4`);
  console.log('invalid config correctly rejected');

  step('--version reports CLI + schema versions', cli(['--version']), { env, ...windowsBin });

  // Help snapshot: the 0.5.x surface, nothing retired (plan 131 AC-3).
  const help = run(cliBin, ['--help'], { env, ...windowsBin, stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  if (help.status !== 0) fail(`--help exited ${help.status ?? help.signal}`);
  for (const command of ['login', 'logout', 'signup', 'whoami', 'schema', 'docs', 'download', 'validate', 'diff', 'show', 'upload',
    'launch', 'discard', 'restore', 'status', 'history', 'preview', 'evaluate']) {
    if (!new RegExp(`^  ${command}`, 'm').test(help.stdout)) fail(`missing command '${command}' in --help`);
  }
  for (const gone of ['promote', 'submit', 'approve', 'reject', 'deploy', 'rollback', 'verify', 'export']) {
    if (new RegExp(`^  ${gone}( |\\[|<)`, 'm').test(help.stdout)) fail(`retired command '${gone}' still in --help`);
  }
  console.log('help surface matches the 0.5.x spec');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--package-smoke')) packageSmoke();
  else verify();
  console.log(`\nci:l1${process.argv.includes('--package-smoke') ? ':smoke' : ''} passed.`);
}
