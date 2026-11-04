/**
 * Semantic per-collection diff between two ExportedConfig objects (plan 65,
 * BL-0425). Used by `diff` and `--upload` to show what a config would change
 * against the tenant's current state before applying.
 *
 * "Semantic" means both sides are canonicalised before they are compared, so a
 * file that was uploaded and downloaded again reads as unchanged (exit 0 under
 * `diff --exit-code`) while a real field change is still reported, with the
 * field named. The allow-list of what is ignored is explicit and short:
 *
 *   - key order never matters (keys are sorted);
 *   - a property that is `null`, `[]` or `{}` equals an absent property
 *     (import/export drop `max_seats: null`, add `fields: []`);
 *   - server-owned fields are ignored: `created_at` / `updated_at` at any
 *     depth, `id` on a collection item (ids re-mint on import; identity is the
 *     handle), `segments[].dimension_id`, `entitlement_rules[].unit`
 *     (derived), `entitlements[].tier_description`;
 *   - the built-in `rt.*` segments the export adds are ignored;
 *   - `entitlements[].kind: "feature"` equals `"capability_tier"`;
 *   - the Playbook header (`version`, `format_version`, `artifact_type`,
 *     `playbook_handle`, `playbook_version_id`, `change_set_id`, `tenant_id`,
 *     `environment_id`, `schema_version`, `exported_at`) is ignored.
 *
 * Everything else is compared, including top-level objects and scalars.
 */
export type CollectionDiff = {
  added: string[];
  changed: string[];
  removed: string[];
  /** For each changed item, the property names whose canonical values differ. */
  fields?: Record<string, string[]>;
};
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
  // BL-0176 / BL-0178: first-class objectives, keyed by handle.
  'objectives',
] as const;

/** Reported collection name for top-level objects and scalars. */
export const TOP_LEVEL = '(top-level)';

const HEADER_FIELDS: ReadonlySet<string> = new Set([
  'version',
  'format_version',
  'artifact_type',
  'playbook_handle',
  'playbook_version_id',
  'change_set_id',
  'tenant_id',
  'environment_id',
  'schema_version',
  'exported_at',
]);

/** Server-owned properties ignored at any depth. */
const TIMESTAMPS: ReadonlySet<string> = new Set(['created_at', 'updated_at']);

/** Server-owned properties ignored on the item itself, per collection. */
const ITEM_IGNORED: Record<string, ReadonlySet<string>> = {
  segments: new Set(['dimension_id']),
  entitlement_rules: new Set(['unit']),
  entitlements: new Set(['tier_description']),
};

type Json = unknown;

function isEmpty(value: Json): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return typeof value === 'object' && Object.keys(value as object).length === 0;
}

/** Sorted keys, server-owned timestamps dropped, null / [] / {} treated as absent. */
function canonical(value: Json): Json {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out: Record<string, Json> = {};
    for (const key of Object.keys(value).sort()) {
      if (TIMESTAMPS.has(key)) continue;
      const inner = canonical((value as Record<string, Json>)[key]);
      if (!isEmpty(inner)) out[key] = inner;
    }
    return out;
  }
  return value;
}

/** The canonical body of one collection item (what is compared). */
function itemBody(coll: string, item: Json): Record<string, Json> | Json {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return canonical(item);
  const ignored = ITEM_IGNORED[coll];
  const copy: Record<string, Json> = {};
  for (const [k, v] of Object.entries(item as Record<string, Json>)) {
    if (k === 'id' || ignored?.has(k)) continue;
    copy[k] = v;
  }
  if (coll === 'entitlements' && copy.kind === 'feature') copy.kind = 'capability_tier';
  return canonical(copy);
}

/**
 * The named collections first (stable display order), then EVERY other
 * top-level array on either side, sorted (plan 129 TASK-2): `diff --exit-code`
 * must never report "no differences" while an add-on, variation or any
 * other Playbook collection changed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectionsOf(current: any, next: any): string[] {
  const named = new Set<string>(COLLECTIONS);
  const extra = new Set<string>();
  for (const side of [current, next]) {
    if (!side || typeof side !== 'object') continue;
    for (const [k, v] of Object.entries(side)) if (Array.isArray(v) && !named.has(k)) extra.add(k);
  }
  return [...COLLECTIONS, ...[...extra].sort()];
}

// Handle-first: under the anchor+ledger identity model, `handle` is the sole
// identity that is stable across databases — row ids are re-minted on import,
// so keying by id reads a re-imported entity as add+remove instead of a change.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function keyOf(item: any): string {
  return item?.handle ?? item?.unique_handle ?? item?.name ?? item?.id ?? JSON.stringify(item);
}

/** The built-in `rt.*` segments the export adds; never part of a Playbook file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBuiltIn(coll: string, item: any): boolean {
  return coll === 'segments' && typeof keyOf(item) === 'string' && keyOf(item).startsWith('rt.');
}

/** Property names whose canonical values differ between two item bodies. */
function differingFields(a: Json, b: Json): string[] {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) return [];
  const left = a as Record<string, Json>;
  const right = b as Record<string, Json>;
  return [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .filter((k) => JSON.stringify(left[k]) !== JSON.stringify(right[k]))
    .sort();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function diffExportedConfig(current: any, next: any): ConfigDiff {
  const diff: ConfigDiff = {};
  for (const coll of collectionsOf(current, next)) {
    const cur = (Array.isArray(current?.[coll]) ? current[coll] : []).filter((i: Json) => !isBuiltIn(coll, i));
    const nxt = (Array.isArray(next?.[coll]) ? next[coll] : []).filter((i: Json) => !isBuiltIn(coll, i));
    if (cur.length === 0 && nxt.length === 0) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const curMap = new Map<string, any>(cur.map((i: any) => [keyOf(i), itemBody(coll, i)]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nxtMap = new Map<string, any>(nxt.map((i: any) => [keyOf(i), itemBody(coll, i)]));

    const added = [...nxtMap.keys()].filter((k) => !curMap.has(k));
    const removed = [...curMap.keys()].filter((k) => !nxtMap.has(k));
    const changed = [...nxtMap.keys()].filter(
      (k) => curMap.has(k) && JSON.stringify(curMap.get(k)) !== JSON.stringify(nxtMap.get(k)),
    );
    if (added.length || removed.length || changed.length) {
      const fields: Record<string, string[]> = {};
      for (const k of changed) fields[k] = differingFields(curMap.get(k), nxtMap.get(k));
      diff[coll] = { added, changed, removed, ...(changed.length ? { fields } : {}) };
    }
  }

  // Top-level objects and scalars (e.g. a theme): compared canonically, minus the header.
  const topKeys = new Set<string>();
  for (const side of [current, next]) {
    if (!side || typeof side !== 'object') continue;
    for (const [k, v] of Object.entries(side)) {
      if (!Array.isArray(v) && !HEADER_FIELDS.has(k)) topKeys.add(k);
    }
  }
  const topChanged = [...topKeys]
    .sort()
    .filter((k) => JSON.stringify(canonical(current?.[k])) !== JSON.stringify(canonical(next?.[k])))
    // A property that is null / empty on one side and absent on the other is equal (canonical() maps both to undefined).
    .filter((k) => !(isEmpty(current?.[k]) && isEmpty(next?.[k])));
  if (topChanged.length) diff[TOP_LEVEL] = { added: [], changed: topChanged, removed: [] };
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
    if (d.removed.length) parts.push(`-${d.removed.length} only in tenant (pruned on launch unless --no-prune)`);
    lines.push(`  ${coll}: ${parts.join(', ')}`);
    for (const k of d.added) lines.push(`    + ${k}`);
    for (const k of d.changed) {
      const fields = d.fields?.[k];
      lines.push(`    ~ ${k}${fields?.length ? ` (${fields.join(', ')})` : ''}`);
    }
    for (const k of d.removed) lines.push(`    - ${k}`);
  }
  return lines.join('\n');
}
