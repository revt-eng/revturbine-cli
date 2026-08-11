/**
 * Repo pin-drift check (plan 174 TASK-12 / REQ-16, spec-check F-69c).
 *
 * `revturbine init` pins `@revturbine/cli` EXACT (the repo-pinned CLI —
 * delegation runs the repo's version, so a range would make the running CLI
 * drift from the committed one) and `@revturbine/sdk` CARET (additive SDK
 * releases flow in). Nothing re-taught that rule after init — every builder
 * had to learn it by being burned. `--version` now warns when a repo has
 * drifted off it. Pure: takes parsed package.json content; the CLI owns IO.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pinOf(pkg: Record<string, unknown>, name: string): string | undefined {
  for (const field of ['devDependencies', 'dependencies']) {
    const deps = pkg[field];
    if (isRecord(deps) && typeof deps[name] === 'string') return deps[name] as string;
  }
  return undefined;
}

const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

/**
 * Return human-readable drift warnings for a parsed package.json. Empty when
 * the repo carries no RevTurbine pins (not every cwd is an integration repo)
 * or when both pins follow the rule.
 */
export function checkPinDrift(pkg: unknown): string[] {
  if (!isRecord(pkg)) return [];
  const warnings: string[] = [];

  const cliPin = pinOf(pkg, '@revturbine/cli');
  if (cliPin !== undefined && !EXACT.test(cliPin)) {
    warnings.push(
      `@revturbine/cli is pinned "${cliPin}" — the repo-pinned CLI must be EXACT ` +
        `(e.g. "0.14.0"): delegation runs the repo's version, and a range makes ` +
        `the running CLI drift from the committed one.`,
    );
  }

  const sdkPin = pinOf(pkg, '@revturbine/sdk');
  if (sdkPin !== undefined && !sdkPin.startsWith('^')) {
    warnings.push(
      `@revturbine/sdk is pinned "${sdkPin}" — use a caret (e.g. "^${sdkPin.replace(/^[~>=\s]*/, '')}") ` +
        `so additive SDK releases flow in. (Note: on 0.x, ^ spans PATCH releases only.)`,
    );
  }

  return warnings;
}
