import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Every changed runtime surface must resolve to targeted coverage. Unknown
// files fail explicitly instead of silently selecting the exhaustive suite.
export function selectTargets(files) {
  const tests = new Set();
  const related = new Set();
  const unsupported = [];
  let policy = false;
  for (const file of files) {
    if (file === 'scripts/iteration-targeted.mjs' || file === 'scripts/iteration-targeted.check.mjs' || file === '.github/workflows/pr-gate.yml') {
      policy = true;
    } else if (/^tests\/.*\.test\.ts$/.test(file)) {
      tests.add(file);
    } else if (file === 'src/cli.ts') {
      for (const name of ['init-process', 'whoami-process', 'placement-validation-process', 'sdk-version-process', 'ci-mode-process', 'customer-provisioning-http']) tests.add(`tests/${name}.test.ts`);
    } else if (/^src\/.*\.(ts|mjs)$/.test(file)) {
      related.add(file);
    } else if (/\.md$/.test(file) || /^docs\//.test(file)) {
      // Documentation-only changes have no runtime coverage requirement.
    } else {
      unsupported.push(file);
    }
  }
  if (unsupported.length) throw new Error(`Missing targeted coverage mapping: ${unsupported.join(', ')}`);
  return { tests: [...tests], related: [...related], policy };
}

export function run(base, runCommand = execFileSync) {
  if (!/^[a-f0-9]{40}$/.test(base ?? '')) throw new Error('A full PR base commit SHA is required');
  const files = runCommand('git', ['diff', '--name-only', '-z', `${base}...HEAD`], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const selection = selectTargets(files);
  const execute = args => runCommand(process.execPath, args, { stdio: 'inherit' });
  if (selection.policy) execute(['--test', 'scripts/iteration-targeted.check.mjs']);
  for (const file of selection.tests) {
    if (!existsSync(file)) throw new Error(`Deleted test requires an explicit replacement mapping: ${file}`);
    execute(['node_modules/vitest/vitest.mjs', 'run', file, '--maxWorkers=1', '--passWithNoTests=false']);
  }
  // Run each changed source separately: one well-covered file must not hide
  // another file with no dependency-selected tests. Vitest fails on no tests.
  for (const file of selection.related) execute(['node_modules/vitest/vitest.mjs', 'related', file, '--run', '--maxWorkers=1', '--passWithNoTests=false']);
  console.log(JSON.stringify({ changed: files, selection }));
  return selection;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(process.argv[2]); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
