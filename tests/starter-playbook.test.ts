import { describe, expect, it } from 'vitest';

import {
  STARTER_PLAYBOOK,
  STARTER_PLAYBOOK_FILENAME,
  validatePlaybook,
} from '../src/lib/starter-playbook';

describe('the bundled starter playbook', () => {
  // The regression guard that matters: a schema bump that invalidates the
  // starter must fail here, not in a builder's first thirty seconds.
  it('passes the same offline validation `revturbine validate` runs', () => {
    const result = validatePlaybook(STARTER_PLAYBOOK);
    expect(result.findings).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('is the legacy shape the SDK configProvider consumes, not a canonical Playbook', () => {
    expect(STARTER_PLAYBOOK.version).toBe('1.0.0');
    expect(STARTER_PLAYBOOK).not.toHaveProperty('artifact_type');
  });

  it('survives a JSON round-trip — it is written to disk verbatim', () => {
    const roundTripped = JSON.parse(JSON.stringify(STARTER_PLAYBOOK));
    expect(validatePlaybook(roundTripped).ok).toBe(true);
  });

  it('gates one feature across both plans with explicit rules', () => {
    // Explicit rules on BOTH plans: a starter is read as a worked example, so
    // it must not teach a pattern that leans on absence-of-rule defaults.
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
  it('rejects a structurally invalid config', () => {
    const result = validatePlaybook({ version: '1.0.0', plans: 'not-an-array' });
    expect(result.ok).toBe(false);
  });

  it('rejects a config that is not a config at all', () => {
    expect(validatePlaybook({}).ok).toBe(false);
  });
});
