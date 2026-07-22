import { describe, expect, it } from 'vitest';

import {
  STARTER_PLAYBOOK,
  STARTER_PLAYBOOK_FILENAME,
  validatePlaybook,
} from '../src/lib/starter-playbook';

describe('the bundled starter Playbook', () => {
  // The regression guard that matters: a schema bump that invalidates the
  // starter must fail here, not in a builder's first thirty seconds.
  it('passes the same offline validation `revturbine validate` runs', () => {
    const result = validatePlaybook(STARTER_PLAYBOOK);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('is a CANONICAL Playbook, never the deprecated legacy wire shape', () => {
    // The starter is read as a worked example, so shipping the deprecated shape
    // would teach one. Legacy is identified by a top-level `version`.
    expect(STARTER_PLAYBOOK.artifact_type).toBe('playbook');
    expect(STARTER_PLAYBOOK.format_version).toBe('1.0.0');
    expect(STARTER_PLAYBOOK).not.toHaveProperty('version');
    expect(STARTER_PLAYBOOK).not.toHaveProperty('change_set_id');
  });

  it('carries the header targeting fields as account-less placeholders', () => {
    expect(STARTER_PLAYBOOK.tenant_id).toBe('local');
    expect(STARTER_PLAYBOOK.environment_id).toBe('local');
    expect(STARTER_PLAYBOOK.playbook_handle).toBe('default');
    expect(STARTER_PLAYBOOK.playbook_version_id).toBeNull();
  });

  it('survives a JSON round-trip — it is written to disk verbatim', () => {
    const roundTripped = JSON.parse(JSON.stringify(STARTER_PLAYBOOK));
    expect(validatePlaybook(roundTripped).ok).toBe(true);
  });

  it('gates one feature across both plans with explicit rules', () => {
    // Explicit rules on BOTH plans: a starter must not teach a pattern that
    // leans on absence-of-rule evaluator defaults.
    const rules = STARTER_PLAYBOOK.entitlement_rules.filter(
      (r) => r.entitlement_id === 'ent_advanced_export',
    );
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.type_fields.enabled).sort()).toEqual([false, true]);

    const targeted = rules.flatMap((r) => r.targets.map((t) => t.id)).sort();
    expect(targeted).toEqual(['plan_free', 'plan_pro']);
  });

  it('references only plans and entitlements it defines', () => {
    const planIds = new Set<string>(STARTER_PLAYBOOK.plans.map((p) => p.id));
    const entIds = new Set<string>(STARTER_PLAYBOOK.entitlements.map((e) => e.id));
    for (const rule of STARTER_PLAYBOOK.entitlement_rules) {
      expect(entIds.has(rule.entitlement_id)).toBe(true);
      for (const target of rule.targets) expect(planIds.has(target.id)).toBe(true);
    }
  });

  it('writes to a predictable root-level filename', () => {
    expect(STARTER_PLAYBOOK_FILENAME).toBe('revturbine.playbook.json');
    expect(STARTER_PLAYBOOK_FILENAME).not.toContain('/');
  });
});

describe('validatePlaybook', () => {
  it('rejects the deprecated legacy wire shape outright', () => {
    // Locks in the ruling: legacy is not an acceptable starter shape, so the
    // validator the scaffold path uses must not quietly accept one.
    const legacy = {
      version: '1.0.0',
      plans: [],
      entitlements: [],
      entitlement_rules: [],
      segments: [],
      content_ui_paths: [],
      surface_templates: [],
      placements: [],
    };
    expect(validatePlaybook(legacy).ok).toBe(false);
  });

  it('rejects a canonical Playbook missing required header targeting', () => {
    const withoutTenant: Record<string, unknown> = { ...STARTER_PLAYBOOK };
    delete withoutTenant['tenant_id'];
    expect(validatePlaybook(withoutTenant).ok).toBe(false);
  });

  it('rejects a structurally invalid body', () => {
    expect(validatePlaybook({ ...STARTER_PLAYBOOK, plans: 'not-an-array' }).ok).toBe(false);
  });

  it('rejects a config that is not a config at all', () => {
    expect(validatePlaybook({}).ok).toBe(false);
  });
});
