/**
 * `revturbine init` — the scaffold routine (plan 142 TASK-3).
 *
 * This module is the pure half: package-manager detection, stack detection, and
 * the install plan. The command in cli.ts does the IO (reading package.json,
 * spawning the package manager), so every decision here is testable without a
 * filesystem or a child process — the same split config-validate.ts uses.
 *
 * Two entry points execute this code (plan 142 REQ-1): `npm create revturbine`
 * (via the create-revturbine shim) and `revturbine init` in a repo that already
 * pins the CLI. They must behave identically, so nothing here may depend on how
 * the process was launched beyond the explicitly-passed signals.
 *
 * The CLI is pinned EXACTLY into the target repo (REQ-6): the vendored schema
 * snapshot makes CLI↔playbook compatibility a per-repo property, so it belongs
 * in the lockfile. The SDK takes an ordinary caret range — it is not
 * snapshot-coupled.
 */

export type PackageManager = 'pnpm' | 'npm' | 'yarn';

export type ManagerDetection = {
  name: PackageManager;
  /** Why this manager won — surfaced so `init` can echo an honest reason. */
  reason: string;
};

const LOCKFILES: ReadonlyArray<readonly [string, PackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

/**
 * Resolve the package manager from, in precedence order: the `packageManager`
 * field (Corepack's declared truth), a lockfile on disk, the invoking agent,
 * then npm as the floor.
 *
 * Lockfile beats user-agent deliberately: `npm create revturbine` in a pnpm repo
 * reports an npm user-agent, but the repo is unambiguously pnpm.
 */
export function detectPackageManager(signals: {
  /** Filenames present in the target directory. */
  files?: readonly string[];
  /** `packageManager` from the target package.json, if any. */
  packageManagerField?: string | null;
  /** `npm_config_user_agent` from the environment, if any. */
  userAgent?: string | null;
}): ManagerDetection {
  const field = signals.packageManagerField?.trim();
  if (field) {
    const name = field.split('@')[0]?.trim();
    if (name === 'pnpm' || name === 'npm' || name === 'yarn') {
      return { name, reason: `packageManager field (${field})` };
    }
  }

  const files = new Set(signals.files ?? []);
  for (const [lockfile, name] of LOCKFILES) {
    if (files.has(lockfile)) return { name, reason: lockfile };
  }

  const agent = signals.userAgent ?? '';
  for (const name of ['pnpm', 'yarn', 'npm'] as const) {
    if (agent.startsWith(`${name}/`)) return { name, reason: `npm_config_user_agent (${name})` };
  }

  return { name: 'npm', reason: 'default' };
}

export type Stack = 'next' | 'remix' | 'astro' | 'vite' | 'react' | 'unknown';

/**
 * Best-effort framework detection. Advisory only — `init` never edits app code
 * (REQ-4), so a wrong guess costs a line of output, not a broken repo. Later
 * tasks use it to pick the starter playbook and the skills bundle.
 */
export function detectStack(signals: {
  dependencies?: Readonly<Record<string, string>>;
  devDependencies?: Readonly<Record<string, string>>;
}): Stack {
  const deps = { ...signals.dependencies, ...signals.devDependencies };
  if (deps['next']) return 'next';
  if (deps['@remix-run/react'] || deps['@react-router/dev']) return 'remix';
  if (deps['astro']) return 'astro';
  if (deps['vite']) return 'vite';
  if (deps['react']) return 'react';
  return 'unknown';
}

export const SDK_PACKAGE = '@revturbine/sdk';
export const CLI_PACKAGE = '@revturbine/cli';

/**
 * Slugify a directory name into a valid npm package name: lowercased, only
 * url-safe characters, never leading/trailing separators, never empty. So `init`
 * in a fresh directory can name the project after the folder instead of refusing.
 */
export function projectNameFromDir(dirName: string): string {
  const slug = dirName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');
  return slug || 'my-app';
}

export type NewProjectManifest = {
  name: string;
  version: string;
  private: true;
  type: 'module';
};

/**
 * A minimal, valid package.json for a brand-new project, so `init` can offer to
 * start one rather than refusing when the directory has none. Intentionally bare
 * — `init` adds only RevTurbine, never a framework — and ESM by default to match
 * the SDK's module shape.
 */
export function newProjectManifest(dirName: string): NewProjectManifest {
  return { name: projectNameFromDir(dirName), version: '0.1.0', private: true, type: 'module' };
}

export type PackagePlan = { spec: string; dev: boolean; exact: boolean };

export type InstallPlan = {
  /** Packages that must be installed. Empty when the repo is already scaffolded. */
  install: PackagePlan[];
  /** Human-readable notes about what was already present and therefore skipped. */
  skipped: string[];
};

/**
 * Decide what still needs installing. Re-running against an already-scaffolded
 * repo yields an empty `install` (AC-3c): a dependency that is already declared
 * is left exactly as the repo has it, including a CLI pinned to a different
 * version — bumping a deliberate pin is not `init`'s call to make.
 */
export function planInstall(params: {
  dependencies?: Readonly<Record<string, string>>;
  devDependencies?: Readonly<Record<string, string>>;
  /** The running CLI's own version — what gets pinned into the repo. */
  cliVersion: string;
}): InstallPlan {
  const deps = params.dependencies ?? {};
  const devDeps = params.devDependencies ?? {};
  const install: PackagePlan[] = [];
  const skipped: string[] = [];

  const existingSdk = deps[SDK_PACKAGE] ?? devDeps[SDK_PACKAGE];
  if (existingSdk) {
    skipped.push(`${SDK_PACKAGE} already declared (${existingSdk})`);
  } else {
    install.push({ spec: SDK_PACKAGE, dev: false, exact: false });
  }

  const existingCli = devDeps[CLI_PACKAGE] ?? deps[CLI_PACKAGE];
  if (existingCli) {
    skipped.push(
      existingCli === params.cliVersion
        ? `${CLI_PACKAGE} already pinned (${existingCli})`
        : `${CLI_PACKAGE} already declared (${existingCli}) — left as-is; this CLI is ${params.cliVersion}`,
    );
  } else {
    install.push({ spec: `${CLI_PACKAGE}@${params.cliVersion}`, dev: true, exact: true });
  }

  return { install, skipped };
}

/**
 * Build the argv for one install step. The exact-pin flag is passed explicitly
 * because a bare `pkg@1.2.3` still writes a caret range under npm and pnpm
 * defaults — the pin is the point (REQ-6), so it can't be left implicit.
 */
export function installArgs(manager: PackageManager, plan: PackagePlan): string[] {
  const exact = plan.exact ? [manager === 'yarn' ? '--exact' : '--save-exact'] : [];
  const dev = plan.dev ? ['-D'] : [];
  const verb = manager === 'npm' ? 'install' : 'add';
  return [verb, ...dev, ...exact, plan.spec];
}
