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
