import { describe, expect, it } from 'vitest';

import { ExportedConfigSchema } from '../src/schema/exported-config.snapshot.mjs';
import { SCHEMA_VERSION } from '../src/schema/version';

/**
 * The public CLI validates configs offline against the vendored, version-stamped
 * ExportedConfigSchema snapshot — with zero access to the private @revt-eng/schema
 * package or the scaffold source. This is the unit-level guard for plan 100
 * AC-2/AC-3: a minimal valid config parses, and a clearly-invalid object is
 * rejected with issues. (Supersedes the plan-87 scaffold-fallback e2e test, which
 * tested a schema-resolution path that no longer exists.)
 */
describe('vendored ExportedConfigSchema snapshot', () => {
  it('exposes a stamped schema version', () => {
    expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('accepts a minimal valid ExportedConfig', () => {
    const minimal = {
      version: '1.0.0',
      plans: [],
      entitlements: [],
      entitlement_rules: [],
      segments: [],
      content_ui_paths: [],
      surface_templates: [],
      placements: [],
    };
    const result = ExportedConfigSchema.safeParse(minimal);
    // If the canonical shape drifts, this surfaces the failing paths rather than
    // silently passing — the snapshot must track the real schema.
    if (!result.success) {
      throw new Error(
        `minimal config rejected: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      );
    }
    expect(result.success).toBe(true);
  });

  it('rejects a clearly-invalid object', () => {
    const result = ExportedConfigSchema.safeParse({ not: 'a config' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeGreaterThan(0);
  });

  it('retains monthly and annual Clerk prices through offline config validation', () => {
    const variations = ['monthly', 'annual'].map(billing_period => ({
      handle: `clerk_${billing_period}`, plan_handle: 'pro', billing_period,
      currency: 'usd', price_amount: billing_period === 'monthly' ? 1200 : 12000,
      pricing_model: 'flat', price_source: 'clerk',
    }));
    const config = {
      version: '1.0.0', plans: [], entitlements: [], entitlement_rules: [],
      segments: [], content_ui_paths: [], surface_templates: [], placements: [],
      plan_variations: variations,
    };
    const result = ExportedConfigSchema.safeParse(config);
    if (!result.success) throw new Error(JSON.stringify(result.error.issues));
    expect(JSON.parse(JSON.stringify(result.data)).plan_variations).toEqual(
      variations.map(variation => ({ ...variation, segment_handle: null, stripe_price_id: null, visibility: 'public' })),
    );
    expect(ExportedConfigSchema.safeParse({ ...config, plan_variations: [{ ...variations[0], stripe_price_id: 'price_incompatible' }] }).success).toBe(false);
    expect(ExportedConfigSchema.safeParse({ ...config, plan_variations: [{ ...variations[0], billing_period: 'one_time' }] }).success).toBe(false);
  });
});
