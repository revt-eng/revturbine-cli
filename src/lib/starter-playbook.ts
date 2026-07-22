/**
 * The starter Playbook `revturbine init` drops into a new app (plan 142 TASK-4,
 * REQ-7).
 *
 * Deliberately runnable with **no account**: the SDK consumes this file in
 * `local_only` runtime mode, so a builder sees a real gate resolve before they
 * have signed up for anything. That is the intentional reversal of the
 * "demote local_only" stance in sdk-developer-experience.md §4/§8 — local mode
 * is the zero-friction entry, and `go-live-hosted-cutover` is the marked path
 * out of it.
 *
 * It is a legacy-shape RevTurbineConfig (`version`, not `artifact_type`),
 * matching what real configs use and what the SDK's configProvider consumes.
 * That shape is also the one the vendored snapshot validates **in full**
 * offline — a canonical Playbook defers body validation to the server, which a
 * no-account starter can't reach.
 *
 * Both plans carry an explicit rule rather than relying on absence-of-rule
 * semantics. A starter is read as a worked example, so it should not teach a
 * pattern that depends on evaluator defaults.
 */

import { RevTurbineConfigSchema } from '../schema/exported-config.snapshot.mjs';
import { evaluate as evaluateOffline } from '../schema/validators.snapshot.mjs';

/** Written at the target repo root; referenced by the SDK provider and `validate`. */
export const STARTER_PLAYBOOK_FILENAME = 'revturbine.playbook.json';

export const STARTER_PLAYBOOK = {
  version: '1.0.0',
  plans: [
    { id: 'plan_free', unique_handle: 'free', name: 'Free', tier_position: 0, sort_order: 0 },
    { id: 'plan_pro', unique_handle: 'pro', name: 'Pro', tier_position: 1, sort_order: 1 },
  ],
  entitlements: [
    { id: 'ent_advanced_export', unique_handle: 'advanced_export', name: 'Advanced Export', type: 'feature' },
  ],
  entitlement_rules: [
    {
      id: 'er_advanced_export_free',
      entitlement_id: 'ent_advanced_export',
      targets: [{ kind: 'plan', id: 'plan_free' }],
      segment_ids: [],
      type_fields: { kind: 'feature', enabled: false },
      current_usage: 0,
    },
    {
      id: 'er_advanced_export_pro',
      entitlement_id: 'ent_advanced_export',
      targets: [{ kind: 'plan', id: 'plan_pro' }],
      segment_ids: [],
      type_fields: { kind: 'feature', enabled: true },
      current_usage: 0,
    },
  ],
  segments: [],
  content_ui_paths: [],
  surface_templates: [],
  placements: [],
} as const;

export type PlaybookValidation = {
  ok: boolean;
  /** Rendered findings from the offline evaluator, for display on failure. */
  findings: unknown[];
};

type SnapshotSchema = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: unknown };
};

/**
 * Validate a config through the same offline path `revturbine validate <file>`
 * uses — the vendored snapshot schema plus the shared semantic engine.
 *
 * REQ-7 requires this run **in-process**: shelling out to `revturbine validate`
 * would depend on a binary installed seconds earlier and on the target repo's
 * bin resolution, neither of which is guaranteed mid-scaffold.
 */
export function validatePlaybook(config: unknown): PlaybookValidation {
  const schema = RevTurbineConfigSchema as SnapshotSchema;
  const parsed = schema.safeParse(config);
  const findings = evaluateOffline((parsed.success ? parsed.data : config) as Record<string, unknown>, {
    structuralErrors: parsed.success ? undefined : parsed.error,
  }) as Array<{ severity?: string }>;
  const blocking = findings.filter((f) => f.severity === 'error_draft' || f.severity === 'error_launch');
  return { ok: parsed.success && blocking.length === 0, findings: blocking };
}
