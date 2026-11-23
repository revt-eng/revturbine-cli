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
 *   - schema defaults from the Playbook item schemas are applied, so an
 *     omitted `plans[].tier_position` equals the exported `0`;
 *   - inline `placements[].payloads` are lifted to `placement_payloads`
 *     (keyed by `payload_id`, `source_mode` default `inline`) before compare;
 *   - server-owned fields are ignored: `created_at` / `updated_at` at any
 *     depth, `id` on a collection item (ids re-mint on import; identity is the
 *     handle), `segments[].dimension_id`, `entitlement_rules[].unit` /
 *     `kind` / `tier_name` / `tier_description` (derived; ignored on import),
 *     `entitlements[].tier_description` / `kind` (Playbook field is `type`);
 *   - the built-in `rt.*` segments the export adds are ignored;
 *   - `entitlements[].kind: "feature"` equals `"capability_tier"`;
 *   - the Playbook header (`version`, `format_version`, `artifact_type`,
 *     `playbook_handle`, `playbook_version_id`, `change_set_id`, `tenant_id`,
 *     `environment_id`, `schema_version`, `exported_at`) is ignored.
 *
 * Everything else is compared, including top-level objects and scalars.
 */
import * as exportedConfigSnapshot from '../schema/exported-config.snapshot.mjs';

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
  'placement_payloads',
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
  entitlement_rules: new Set(['unit', 'kind', 'tier_name', 'tier_description']),
  entitlements: new Set(['tier_description', 'kind']),
};

type Json = unknown;

type ZodSchema = {
  type?: string;
  shape?: Record<string, ZodSchema>;
  safeParse?: (value: unknown) => { success: boolean; data?: unknown };
  def?: {
    type?: string;
    shape?: Record<string, ZodSchema>;
    element?: ZodSchema;
    innerType?: ZodSchema;
    defaultValue?: unknown;
  };
};

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

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

function unwrapItemSchema(schema: ZodSchema | undefined): ZodSchema | undefined {
  let current = schema;
  for (let i = 0; i < 6 && current?.def; i += 1) {
    const t = current.def.type ?? current.type;
    if (t === 'optional' || t === 'nullable' || t === 'default') {
      current = current.def.innerType;
      continue;
    }
    if (t === 'array') {
      current = current.def.element;
      continue;
    }
    break;
  }
  return current;
}

function defaultValue(schema: ZodSchema | undefined): Json | undefined {
  let current = schema;
  for (let i = 0; i < 6 && current?.def; i += 1) {
    const t = current.def.type ?? current.type;
    if (t === 'default') return current.def.defaultValue as Json;
    if (t === 'optional' || t === 'nullable') {
      current = current.def.innerType;
      continue;
    }
    break;
  }
  return undefined;
}

function itemSchema(coll: string): ZodSchema | undefined {
  const body = (exportedConfigSnapshot as { PlaybookBodySchema?: ZodSchema }).PlaybookBodySchema;
  const field = body?.shape?.[coll] ?? body?.def?.shape?.[coll];
  return unwrapItemSchema(field);
}

/** Fill Playbook item-schema defaults without dropping unknown authored keys. */
function applyItemSchema(coll: string, item: Json): Json {
  const rec = isRecord(item) ? item : null;
  if (!rec) return item;
  const schema = itemSchema(coll);
  if (!schema) return item;
  const parsed = schema.safeParse?.(item);
  if (parsed?.success && isRecord(parsed.data)) {
    const extras: Record<string, Json> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (!(k in parsed.data)) extras[k] = v;
    }
    return { ...parsed.data, ...extras };
  }
  const shape = schema.def?.shape ?? schema.shape;
  if (!shape) return item;
  const out: Record<string, Json> = { ...rec };
  for (const [k, field] of Object.entries(shape)) {
    if (k in out) continue;
    const d = defaultValue(field);
    if (d !== undefined) out[k] = d;
  }
  return out;
}

/** The canonical body of one collection item (what is compared). */
function itemBody(coll: string, item: Json): Record<string, Json> | Json {
  const prepared = applyItemSchema(coll, item);
  if (!isRecord(prepared)) return canonical(prepared);
  const ignored = ITEM_IGNORED[coll];
  const copy: Record<string, Json> = {};
  for (const [k, v] of Object.entries(prepared)) {
    if (k === 'id' || ignored?.has(k)) continue;
    copy[k] = v;
  }
  if (coll === 'placement_payloads' && copy.payload_id === undefined && prepared.id !== undefined) {
    copy.payload_id = prepared.id;
  }
  if (coll === 'placement_payloads' && copy.source_mode === 'inline') delete copy.source_mode;
  return canonical(copy);
}

/**
 * The named collections first (stable display order), then EVERY other
 * top-level array on either side, sorted (plan 129 TASK-2): `diff --exit-code`
 * must never report "no differences" while an add-on, variation or any
 * other Playbook collection changed.
 */
function collectionsOf(current: Record<string, Json> | null, next: Record<string, Json> | null): string[] {
  const named = new Set<string>(COLLECTIONS);
  const extra = new Set<string>();
  for (const side of [current, next]) {
    if (!side) continue;
    for (const [k, v] of Object.entries(side)) if (Array.isArray(v) && !named.has(k)) extra.add(k);
  }
  return [...COLLECTIONS, ...[...extra].sort()];
}

// Handle-first: under the anchor+ledger identity model, `handle` is the sole
// identity that is stable across databases — row ids are re-mint on import,
// so keying by id reads a re-imported entity as add+remove instead of a change.
function keyOf(item: Json): string {
  if (!isRecord(item)) return JSON.stringify(item);
  const key = item.handle ?? item.unique_handle ?? item.payload_id ?? item.name ?? item.id;
  return typeof key === 'string' ? key : JSON.stringify(item);
}

/** The built-in `rt.*` segments the export adds; never part of a Playbook file. */
function isBuiltIn(coll: string, item: Json): boolean {
  return coll === 'segments' && keyOf(item).startsWith('rt.');
}

function placementKey(item: Record<string, Json>): Json {
  return item.handle ?? item.unique_handle ?? item.id ?? item.name;
}

/**
 * Export moves inline `placements[].payloads` to the standalone
 * `placement_payloads` collection. Lift both sides so a hand-authored file
 * matches the export of the tenant it was uploaded to.
 */
function liftInlinePayloads(config: Json): Json {
  const rec = isRecord(config) ? config : null;
  if (!rec) return config;
  const placementsIn = Array.isArray(rec.placements) ? rec.placements : null;
  const lifted: Record<string, Json>[] = [];
  const placements = placementsIn
    ? placementsIn.map((pl) => {
        const row = isRecord(pl) ? pl : null;
        if (!row || !Array.isArray(row.payloads) || row.payloads.length === 0) return pl;
        const parent = placementKey(row);
        for (const payload of row.payloads) {
          const p = isRecord(payload) ? payload : null;
          if (!p) continue;
          lifted.push({
            source_mode: 'inline',
            ...p,
            payload_id: p.payload_id ?? p.id,
            placement_id: p.placement_id ?? parent,
          });
        }
        const rest = { ...row };
        delete rest.payloads;
        return rest;
      })
    : rec.placements;
  const existing = Array.isArray(rec.placement_payloads) ? rec.placement_payloads : [];
  if (lifted.length === 0 && existing.length === 0) {
    return placementsIn ? { ...rec, placements } : rec;
  }
  const map = new Map<string, Json>();
  for (const p of lifted) map.set(keyOf(p), p);
  for (const p of existing) map.set(keyOf(p), p);
  return {
    ...rec,
    ...(placementsIn ? { placements } : {}),
    placement_payloads: [...map.values()],
  };
}

/** Property names whose canonical values differ between two item bodies. */
function differingFields(a: Json, b: Json): string[] {
  if (!isRecord(a) || !isRecord(b)) return [];
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .sort();
}

function asConfig(value: Json): Record<string, Json> | null {
  const lifted = liftInlinePayloads(value);
  return isRecord(lifted) ? lifted : null;
}

export function diffExportedConfig(current: Json, next: Json): ConfigDiff {
  const left = asConfig(current);
  const right = asConfig(next);
  const diff: ConfigDiff = {};
  for (const coll of collectionsOf(left, right)) {
    const cur = (Array.isArray(left?.[coll]) ? left[coll] : []).filter((i: Json) => !isBuiltIn(coll, i));
    const nxt = (Array.isArray(right?.[coll]) ? right[coll] : []).filter((i: Json) => !isBuiltIn(coll, i));
    if (cur.length === 0 && nxt.length === 0) continue;

    const curMap = new Map<string, Json>(cur.map((i: Json) => [keyOf(i), itemBody(coll, i)]));
    const nxtMap = new Map<string, Json>(nxt.map((i: Json) => [keyOf(i), itemBody(coll, i)]));

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
  for (const side of [left, right]) {
    if (!side) continue;
    for (const [k, v] of Object.entries(side)) {
      if (!Array.isArray(v) && !HEADER_FIELDS.has(k)) topKeys.add(k);
    }
  }
  const topChanged = [...topKeys]
    .sort()
    .filter((k) => JSON.stringify(canonical(left?.[k])) !== JSON.stringify(canonical(right?.[k])))
    // A property that is null / empty on one side and absent on the other is equal (canonical() maps both to undefined).
    .filter((k) => !(isEmpty(left?.[k]) && isEmpty(right?.[k])));
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
