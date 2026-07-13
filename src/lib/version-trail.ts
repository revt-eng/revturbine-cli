/**
 * Version-trail check (cli.md §Validation, plan 131 TASK-11): an on-demand
 * server render stamps the server's CURRENT schema version — when it is newer
 * than the bundled snapshot, this CLI's offline checks are behind. Frozen
 * release snapshots carry their historical stamp, so only a NEWER stamp warns.
 */
export function serverSchemaIsNewer(config: unknown, bundledVersion: string): string | null {
  const server = (config as { schema_version?: unknown })?.schema_version;
  if (typeof server !== 'string' || !server) return null;
  const parse = (v: string) => v.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const [a, b] = [parse(server), parse(bundledVersion)];
  const newer = a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : (a[2] ?? 0) > (b[2] ?? 0);
  return newer ? server : null;
}
