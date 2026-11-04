/**
 * Version-trail check (cli.md §Validation, plan 131 TASK-11): an on-demand
 * server render stamps the server's CURRENT schema version — when it is newer
 * than the bundled snapshot, this CLI's offline checks are behind. Frozen
 * release snapshots carry their historical stamp, so only a NEWER stamp warns.
 */
import { gt, valid } from 'semver';

/**
 * The CLI package version the registry reports as latest, or undefined when the
 * metadata is not a plain semver (so a lookup problem is never mistaken for news).
 */
export function publishedCliVersion(metadata: unknown): string | undefined {
  const version = (metadata as { name?: unknown; version?: unknown } | null)?.version;
  return typeof version === 'string' && valid(version) === version ? version : undefined;
}

/**
 * The schema-lag warning (BUG-1189). It keeps the true half ("offline validation
 * may be missing rules") and advises an install only when that changes the
 * running version: a newer published CLI is named; when the installed CLI is
 * already the latest there is nothing to install, so it stays silent.
 * `latest` is undefined when the registry could not be reached.
 */
export function schemaLagMessage(params: {
  server: string;
  bundled: string;
  installed: string;
  latest: string | undefined;
}): string | null {
  const base = `WARNING: the server's schema (${params.server}) is newer than this CLI's bundled snapshot (${params.bundled}) — offline validation may be missing rules.`;
  if (params.latest === undefined) return `${base} Could not check npm for a newer CLI.`;
  if (!valid(params.installed) || !gt(params.latest, params.installed)) return null;
  return `${base} A newer CLI is published: ${params.latest} (this is ${params.installed}). Run it once with \`npx @revturbine/cli@${params.latest}\`, or pin it with \`npm install -D @revturbine/cli@${params.latest}\`.`;
}

export function serverSchemaIsNewer(config: unknown, bundledVersion: string): string | null {
  const server = (config as { schema_version?: unknown })?.schema_version;
  if (typeof server !== 'string' || !server) return null;
  const parse = (v: string) => v.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const [a, b] = [parse(server), parse(bundledVersion)];
  const newer = a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : (a[2] ?? 0) > (b[2] ?? 0);
  return newer ? server : null;
}
