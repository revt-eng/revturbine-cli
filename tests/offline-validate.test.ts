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
  return evaluate((parsed.success ? parsed.data : config) as Record<string, unknown>, {
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
});
