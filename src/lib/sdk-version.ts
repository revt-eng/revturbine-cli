/** Latest stable SDK guidance. Pure decisions; registry and project IO live in cli.ts. */
import { compare, minVersion, parse, prerelease, satisfies, valid, validRange } from 'semver';
import type { PackageManager } from './init';

export const SDK_NAME = '@revturbine/sdk';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sdkDeclaration(manifest: unknown): { spec: string; dev: boolean } | undefined {
  if (!record(manifest)) return undefined;
  for (const field of ['dependencies', 'devDependencies'] as const) {
    const deps = manifest[field];
    if (record(deps) && typeof deps[SDK_NAME] === 'string') {
      return { spec: deps[SDK_NAME], dev: field === 'devDependencies' };
    }
  }
  return undefined;
}

/** Require an actual semver, not a range, tag, coerced value, or other package. */
export function sdkPackageVersion(metadata: unknown): string | undefined {
  if (!record(metadata) || metadata.name !== SDK_NAME || typeof metadata.version !== 'string') return undefined;
  const parsed = parse(metadata.version);
  if (!parsed) return undefined;
  const canonical = parsed.version + (parsed.build.length ? `+${parsed.build.join('.')}` : '');
  return canonical === metadata.version ? metadata.version : undefined;
}

export function latestStableSdk(metadata: unknown): string | undefined {
  const version = sdkPackageVersion(metadata);
  return version && prerelease(version) === null ? version : undefined;
}

export function sdkVersionAdvice(input: {
  latest?: string;
  installed?: string;
  declaration?: { spec: string; dev: boolean };
  manager: PackageManager;
}): string {
  const { latest, declaration, manager } = input;
  if (!latest) return 'SDK version check unavailable: could not read the latest stable @revturbine/sdk release from public npm. Existing dependencies are unchanged.';
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'}${declaration?.dev ? ' -D' : ''} ${SDK_NAME}@${latest}`;
  const recommend = `Recommend ${SDK_NAME}@${latest}: ${command} (uses your project’s save-prefix settings).`;
  if (!declaration) return `Latest stable SDK: ${latest}. ${recommend}`;

  const installed = input.installed && valid(input.installed);
  if (installed) {
    const order = compare(installed, latest);
    if (order === 0) return `SDK installed ${installed}; latest stable ${latest}. Up to date.`;
    if (order > 0) return `SDK installed ${installed} is newer than latest stable ${latest}. Keep the installed version; no downgrade recommended.`;
    return `SDK installed ${installed}; latest stable ${latest}. ${recommend}`;
  }

  // A declaration is not proof of what is installed. Non-semver declarations
  // can contain private URLs, so never echo their contents into diagnostics.
  const range = validRange(declaration.spec);
  const declared = range === null ? 'a non-semver specification' : JSON.stringify(declaration.spec);
  const fallback = `SDK installed version unavailable; declared ${declared}. Latest stable ${latest}.`;
  const minimum = range === null ? null : minVersion(range);
  if (minimum && compare(minimum, latest) > 0) {
    return `${fallback} The declaration requires a newer version; no downgrade recommended.`;
  }
  if (valid(declaration.spec) && compare(declaration.spec, latest) === 0) {
    return `${fallback} The declaration matches latest; the installation could not be verified.`;
  }
  const permits = range !== null && satisfies(latest, range) ? ' The declaration permits latest; the installation could not be verified.' : '';
  return `${fallback}${permits} ${recommend}`;
}
