/**
 * The offline pre-check the CLI runs before staging a Config File
 * (plan 147 TASK-10, Workstream C — AC-4, AC-6 CLI half, OQ-1).
 *
 * OQ-1: the CLI is a developer tool — it WARNS, never rejects, on unknown or
 * deprecated fields, and it uploads the config RAW so the server sees every
 * field (the server/SDK are the strict-reject tier — TASK-11). This module is
 * the pure core of `cli.ts`'s `verifyConfig`: it decides the body to POST
 * (always the raw config, never a schema-stripped copy — AC-4) and computes
 * advisory `warning` findings for fields the vendored snapshot doesn't recognize
 * or has deprecated.
 *
 * Kept out of cli.ts (which owns IO) so the "post raw, warn — don't strip" rule
 * is unit-tested without a filesystem or network (AGENTS.md rule 3).
 */

// `collectUnknownFields` / `formatFieldPath` ship in the vendored snapshot
// (scaffold 0.1.544, BL-0518 TASK-14): the one shared implementation of
// "unknown field at any depth" that web also uses. It honours `catchall` and
// `z.record` fields and the legacy header aliases (`version`, `change_set_id`).
import * as validatorsSnapshot from '../schema/validators.snapshot.mjs';
import { collectUnknownFields, formatFieldPath } from '../schema/validators.snapshot.mjs';
import { schemaForConfig } from './offline-schema';
import type { ValidationFinding } from './config-validate';

/**
 * `repairDeprecatedFields` ships in the vendored 0.1.145 validators snapshot
 * (added upstream in TASK-8, from `@revt-eng/schema/validators`): given a raw
 * config it returns the config with any deprecated fields removed plus one
 * `warning` finding per removed field. It is NOT declared in the snapshot's
 * hand-authored `.d.mts` type surface, and `src/schema/` is generated — never
 * hand-edited — so we reach the runtime export through a typed namespace cast,
 * keeping every change in this task inside `src/lib`.
 */
interface DeprecationFinding {
  code: string;
  severity: string;
  message: string;
  targetRef?: { field?: string | null };
}
type RepairDeprecatedFields = (config: unknown) => { config: unknown; findings: DeprecationFinding[] };
const repairDeprecatedFields = (
  validatorsSnapshot as unknown as { repairDeprecatedFields: RepairDeprecatedFields }
).repairDeprecatedFields;


/**
 * Code for the CLI's own "unknown top-level field" advisory. Deliberately NOT a
 * `VAL-*` catalog code: those are minted by the shared validation engine and the
 * CLI never hard-codes one. Blocking is decided by severity
 * (`hasBlockingFindings`), never by matching this string.
 */
const UNKNOWN_FIELD_CODE = 'cli/unknown-field';


/**
 * Advisory `warning` findings for a raw config: one per deprecated field (from
 * the shared `repairDeprecatedFields` helper, which carries the catalog's own
 * code) and one per unknown top-level field. All are `warning` severity, so
 * `hasBlockingFindings` is false — they advise, they never block (OQ-1).
 */
export function offlineAdvisories(raw: unknown): ValidationFinding[] {
  const advisories: ValidationFinding[] = [];

  for (const finding of repairDeprecatedFields(raw).findings) {
    advisories.push({
      code: finding.code,
      severity: 'warning',
      message: finding.message,
      targetRef: { ...(finding.targetRef ?? {}) },
    });
  }

  for (const unknown of collectUnknownFields(raw)) {
    const fullPath = formatFieldPath(unknown.path);
    advisories.push({
      code: UNKNOWN_FIELD_CODE,
      severity: 'warning',
      message: `Unknown field '${fullPath}' is not part of the RevTurbine config schema (bundled offline snapshot). The CLI uploads it unchanged so the server can validate it — remove it if it was a typo.`,
      targetRef: { field: unknown.key, path: unknown.path },
    });
  }

  return advisories;
}

export interface OfflineConfigCheck {
  /**
   * Whether the config cleared the offline structural pre-check. Only a genuine
   * legacy structural failure (missing / mis-typed required fields) is `false` —
   * unknown and deprecated fields never fail here, they warn (OQ-1).
   */
  ok: boolean;
  /** The body to POST — ALWAYS the raw config, never a schema-stripped copy (AC-4). */
  body: unknown;
  shape: 'canonical' | 'legacy';
  /** Advisory `warning` findings (unknown + deprecated fields). Never blocking. */
  advisories: ValidationFinding[];
  /** Structural issues when `ok` is false, for display. */
  problems: Array<{ path: Array<string | number>; message: string }>;
}

/**
 * The pure core of `verifyConfig`. The schema check is a DIAGNOSTIC only — it
 * reports structural problems but never decides the POST body: `body` is always
 * the raw config so every field reaches the server (AC-4). A canonical Playbook
 * is validated server-side on import, so it skips the legacy structural
 * pre-check; a legacy config still gets it.
 */
export function checkOfflineConfig(raw: unknown): OfflineConfigCheck {
  const { schema, shape } = schemaForConfig(raw);
  const advisories = offlineAdvisories(raw);

  if (shape === 'canonical') {
    return { ok: true, body: raw, shape, advisories, problems: [] };
  }

  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, body: raw, shape, advisories, problems: [] };
  }
  return { ok: false, body: raw, shape, advisories, problems: parsed.error.issues };
}
