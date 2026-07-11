/**
 * Per-collection diff between two ExportedConfig objects (plan 65).
 * Used by `--upload` to show what a config would change against the tenant's
 * current state before applying.
 */
export type CollectionDiff = { added: string[]; changed: string[]; removed: string[] };
export type ConfigDiff = Record<string, CollectionDiff>;

const COLLECTIONS = [
  'plans',
  'entitlements',
  'entitlement_rules',
  'segments',
  'content_ui_paths',
  'surface_templates',
  'placements',
  'free_trial_rules',
  'reverse_trial_rules',
] as const;

// Handle-first: under the anchor+ledger identity model, `handle` is the sole
// identity that is stable across databases — row ids are re-minted on import,
// so keying by id reads a re-imported entity as add+remove instead of a change.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function keyOf(item: any): string {
  return item?.handle ?? item?.unique_handle ?? item?.name ?? item?.id ?? JSON.stringify(item);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function diffExportedConfig(current: any, next: any): ConfigDiff {
  const diff: ConfigDiff = {};
  for (const coll of COLLECTIONS) {
    const cur = Array.isArray(current?.[coll]) ? current[coll] : [];
    const nxt = Array.isArray(next?.[coll]) ? next[coll] : [];
    if (cur.length === 0 && nxt.length === 0) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const curMap = new Map<string, any>(cur.map((i: any) => [keyOf(i), i]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nxtMap = new Map<string, any>(nxt.map((i: any) => [keyOf(i), i]));

    const added = [...nxtMap.keys()].filter((k) => !curMap.has(k));
    const removed = [...curMap.keys()].filter((k) => !nxtMap.has(k));
    const changed = [...nxtMap.keys()].filter(
      (k) => curMap.has(k) && JSON.stringify(curMap.get(k)) !== JSON.stringify(nxtMap.get(k)),
    );
    if (added.length || removed.length || changed.length) {
      diff[coll] = { added, changed, removed };
    }
  }
  return diff;
}

export function formatDiff(diff: ConfigDiff): string {
  const colls = Object.keys(diff);
  if (colls.length === 0) return '  (no changes — config matches the tenant)';
  const lines: string[] = [];
  for (const coll of colls) {
    const d = diff[coll];
    const parts: string[] = [];
    if (d.added.length) parts.push(`+${d.added.length} added`);
    if (d.changed.length) parts.push(`~${d.changed.length} changed`);
    if (d.removed.length) parts.push(`-${d.removed.length} only in tenant (import never deletes)`);
    lines.push(`  ${coll}: ${parts.join(', ')}`);
    for (const k of d.added) lines.push(`    + ${k}`);
    for (const k of d.changed) lines.push(`    ~ ${k}`);
    for (const k of d.removed) lines.push(`    - ${k}`);
  }
  return lines.join('\n');
}
