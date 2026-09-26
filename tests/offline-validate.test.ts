/**
 * Plan 131 TASK-8 — the vendored shared validation engine runs OFFLINE:
 * the structural tier (Zod → error_draft) plus the file-computable semantic
 * rules (e.g. VAL-PLN-05, two entitlement rules sharing a scope), with no
 * network. AC-10.
 */
import { describe, expect, it } from 'vitest';

import { RevTurbineConfigSchema } from '../src/schema/exported-config.snapshot.mjs';
import { evaluate } from '../src/schema/validators.snapshot.mjs';
import { hasBlockingFindings } from '../src/lib/config-validate';

function validateOffline(config: unknown) {
  const parsed = (RevTurbineConfigSchema as { safeParse(v: unknown): { success: boolean; data?: unknown; error?: unknown } }).safeParse(config);
  return evaluate((parsed.success ? parsed.data : {}) as Record<string, unknown>, {
    structuralErrors: parsed.success ? undefined : parsed.error,
  });
}

const base = {
  version: '1.0.0',
  plans: [],
  entitlements: [],
  entitlement_rules: [],
  segments: [],
  content_ui_paths: [],
};

describe('offline validation (vendored engine)', () => {
  it('a clean minimal config produces no blocking findings', () => {
    const findings = validateOffline(base);
    expect(hasBlockingFindings(findings as never)).toBe(false);
  });

  it('catches a duplicate rule scope offline (VAL-PLN-05, no network)', () => {
    const findings = validateOffline({
      ...base,
      entitlement_rules: [
        { id: 'r1', entitlement_id: 'e1', targets: [{ kind: 'plan', id: 'p1' }], segment_ids: [], type_fields: { kind: 'feature', enabled: true } },
        { id: 'r2', entitlement_id: 'e1', targets: [{ kind: 'plan', id: 'p1' }], segment_ids: [], type_fields: { kind: 'feature', enabled: true } },
      ],
    });
    expect(findings.some((f) => f.code === 'VAL-PLN-05')).toBe(true);
  });

  it('the structural tier maps schema failures to blocking error_draft findings', () => {
    const findings = validateOffline({ version: '1.0.0', plans: [{ name: 123 }] });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.severity === 'error_draft')).toBe(true);
    expect(hasBlockingFindings(findings as never)).toBe(true);
  });

  it('validates objectives offline: declared references resolve, a dangling one is VAL-OBJ-01 (BL-0176)', () => {
    const placement = { id: 'nudge', name: 'Nudge', category: 'fixed', order: 0, trigger: { type: 'trial_ended' }, payloads: [] };
    const withObjectives = { ...base, objectives: [{ handle: 'expansion', name: 'Expansion' }] };
    const clean = validateOffline({ ...withObjectives, placements: [{ ...placement, objective: 'expansion' }] });
    expect(clean.some((f) => f.code === 'VAL-OBJ-01')).toBe(false);

    const dangling = validateOffline({ ...withObjectives, placements: [{ ...placement, objective: 'retention' }] });
    const finding = dangling.find((f) => f.code === 'VAL-OBJ-01');
    expect(finding?.severity).toBe('error_launch');
    expect(finding?.targetRef).toMatchObject({ path: ['placements', 0, 'objective'] });
  });

  it('keeps objectives and objective references through the vendored parse (BL-0178)', () => {
    const result = (RevTurbineConfigSchema as { safeParse(v: unknown): { success: boolean; data?: unknown } }).safeParse({
      ...base,
      objectives: [{ handle: 'expansion', name: 'Expansion' }],
      entitlement_rules: [{ id: 'r1', entitlement_id: 'e1', targets: [{ kind: 'plan', id: 'p1' }], objective: 'expansion' }],
    });
    expect(result.success).toBe(true);
    const parsed = result.data as Record<string, unknown>;
    expect(parsed.objectives).toEqual([{ handle: 'expansion', name: 'Expansion' }]);
    expect((parsed.entitlement_rules as Array<Record<string, unknown>>)[0]?.objective).toBe('expansion');
  });
});
