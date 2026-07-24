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
 * It is a **canonical Playbook** (`artifact_type` + `format_version`). Since
 * plan 147 the one config schema is lenient — `PlaybookSchema` normalizes the
 * legacy `RevTurbineConfig` wire shape into the canonical form on parse, so it
 * absorbs legacy files unchanged — but a starter ships the canonical shape
 * deliberately: a starter is read as a worked example, and emitting the
 * deprecated shape would teach one.
 *
 * `tenant_id` / `environment_id` are optional on the reconciled header, but the
 * starter still carries them (`local`) — an account-less starter has no real
 * values, and `local` is honest rather than impersonating a real tenant. Useful
 * side effect: `resolveUploadTarget` refuses an embedded tenant that contradicts
 * the session, so the starter cannot be pushed to a live tenant without a
 * deliberate `-t`.
 *
 * Both plans carry an explicit rule rather than relying on absence-of-rule
 * semantics — again, worked-example discipline.
 */

import { PlaybookSchema } from '../schema/exported-config.snapshot.mjs';
import { evaluate as evaluateOffline } from '../schema/validators.snapshot.mjs';

/** Written at the target repo root; referenced by the SDK provider and `validate`. */
export const STARTER_PLAYBOOK_FILENAME = 'revturbine.playbook.json';

export const STARTER_PLAYBOOK = {
  artifact_type: 'playbook',
  format_version: '1.0.0',
  playbook_handle: 'default',
  playbook_version_id: null,
  tenant_id: 'local',
  environment_id: 'local',
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
      enabled: false,
      current_usage: 0,
    },
    {
      id: 'er_advanced_export_pro',
      entitlement_id: 'ent_advanced_export',
      targets: [{ kind: 'plan', id: 'plan_pro' }],
      segment_ids: [],
      enabled: true,
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
  /** Structural issues and/or blocking semantic findings, for display on failure. */
  problems: unknown[];
};

type SnapshotSchema = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues?: unknown[] } };
};

/**
 * Validate a canonical Playbook offline: the vendored `PlaybookSchema` for
 * structure, then the shared semantic engine for blocking findings — the same
 * two tiers `revturbine validate <file>` applies.
 *
 * REQ-7 requires this run **in-process**: shelling out to `revturbine validate`
 * would depend on a binary installed seconds earlier and on the target repo's
 * bin resolution, neither of which is guaranteed mid-scaffold.
 */
export function validatePlaybook(config: unknown): PlaybookValidation {
  const parsed = (PlaybookSchema as SnapshotSchema).safeParse(config);
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues ?? [parsed.error] };
  }
  const findings = evaluateOffline(parsed.data as Record<string, unknown>, {}) as Array<{ severity?: string }>;
  const blocking = findings.filter((f) => f.severity === 'error_draft' || f.severity === 'error_launch');
  return { ok: blocking.length === 0, problems: blocking };
}
