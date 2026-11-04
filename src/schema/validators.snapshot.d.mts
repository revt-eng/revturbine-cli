// Type surface for the generated validation-engine snapshot
// (validators.snapshot.mjs). Structural types only — mirrors
// src/lib/config-validate.ts's ValidationFinding so no scaffold types leak.
// Regenerate with `node scripts/generate-schema-snapshot.mjs`.
export interface SnapshotFinding {
  code: string;
  severity: string;
  message: string;
  targetRef: { object_type?: string | null; object_id?: string | null; field?: string | null };
  detail?: string;
  specRef?: string;
}
export function evaluate(
  graph: Record<string, unknown>,
  opts?: { structuralErrors?: unknown },
): SnapshotFinding[];
/** One unknown field in a raw Playbook; `path` is the full path and ends with `key`. */
export interface UnknownField {
  path: (string | number)[];
  key: string;
}
/** Unknown fields at any depth (scaffold `collectUnknownFields`, BL-0518 TASK-14). `[]` when `raw` does not parse. */
export function collectUnknownFields(raw: unknown): UnknownField[];
/** `entitlements[2].allocation` style text for a path from `collectUnknownFields`. */
export function formatFieldPath(path: ReadonlyArray<string | number>): string;
