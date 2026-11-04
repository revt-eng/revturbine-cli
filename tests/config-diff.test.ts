import { describe, expect, it } from 'vitest';

import { diffExportedConfig, formatDiff } from '../src/lib/config-diff';

const base = {
  version: '1.0.0',
  plans: [{ id: 'plan_free', unique_handle: 'free', name: 'Free' }],
  entitlements: [{ id: 'ent_a', unique_handle: 'a', name: 'A', type: 'feature' }],
};

describe('diffExportedConfig', () => {
  it('reports added / changed / removed per collection by handle', () => {
    const next = {
      version: '1.0.0',
      plans: [
        { id: 'plan_free', unique_handle: 'free', name: 'Free Plan' }, // changed (name)
        { id: 'plan_pro', unique_handle: 'pro', name: 'Pro' }, // added
      ],
      entitlements: [], // 'a' removed
    };
    const diff = diffExportedConfig(base, next);
    expect(diff.plans).toEqual({ added: ['pro'], changed: ['free'], removed: [], fields: { free: ['name'] } });
    expect(diff.entitlements).toEqual({ added: [], changed: [], removed: ['a'] });
  });

  it('coalesces by handle when row ids differ (anchor+ledger: ids re-mint on import)', () => {
    const current = {
      segments: [{ id: 'seg_row_1', handle: 'enterprise', name: 'Enterprise' }],
    };
    const next = {
      segments: [{ id: 'seg_row_2', handle: 'enterprise', name: 'Enterprise (EMEA)' }],
    };
    const diff = diffExportedConfig(current, next);
    expect(diff.segments).toEqual({ added: [], changed: ['enterprise'], removed: [], fields: { enterprise: ['name'] } });
  });

  it('diffs the objectives collection by handle (BL-0176)', () => {
    const current = { objectives: [{ handle: 'expansion', name: 'Expansion' }, { handle: 'retention', name: 'Retention' }] };
    const next = { objectives: [{ handle: 'expansion', name: 'Seat expansion' }, { handle: 'trial_conversion', name: 'Trial conversion' }] };
    expect(diffExportedConfig(current, next).objectives).toEqual({
      added: ['trial_conversion'],
      changed: ['expansion'],
      removed: ['retention'],
      fields: { expansion: ['name'] },
    });
  });

  it('shows a changed objective reference on a placement (BL-0178)', () => {
    const pl = { id: 'nudge', name: 'Nudge', category: 'fixed', order: 0, trigger: { type: 'trial_ended' }, payloads: [] };
    const diff = diffExportedConfig({ placements: [pl] }, { placements: [{ ...pl, objective: 'expansion' }] });
    expect(diff.placements).toEqual({ added: [], changed: ['Nudge'], removed: [], fields: { Nudge: ['objective'] } });
  });

  it('is empty when the configs match', () => {
    expect(diffExportedConfig(base, base)).toEqual({});
    expect(formatDiff({})).toContain('no changes');
  });

  it('treats a missing current (empty tenant) as all-added', () => {
    const diff = diffExportedConfig({}, base);
    expect(diff.plans.added).toEqual(['free']);
    expect(diff.entitlements.added).toEqual(['a']);
  });

  it('formats a readable summary', () => {
    const out = formatDiff(diffExportedConfig({}, base));
    expect(out).toContain('plans: +1 added');
    expect(out).toContain('+ free');
  });
});

// BL-0425: a hand-authored file and the export of the tenant it was uploaded
// to differ only by server normalisation. The exported side below is built from
// the differences the bug enumerates (synthetic: a captured export is the
// follow-up fixture).
describe('diffExportedConfig is semantic (BL-0425)', () => {
  const authored = {
    version: '1.0.0',
    plans: [{ unique_handle: 'free', name: 'Free', max_seats: null }, { unique_handle: 'pro', name: 'Pro' }],
    entitlements: [{ unique_handle: 'seats', name: 'Seats', kind: 'feature', tier_description: 'Per seat' }],
    entitlement_rules: [{ unique_handle: 'r1', plan: 'pro', entitlement: 'seats', limit: { a: 1, b: 2 } }],
    segments: [{ handle: 'whales', name: 'Whales' }],
    surface_templates: [{ unique_handle: 'banner', name: 'Banner' }],
    theme: { color: 'blue' },
  };
  const exported = {
    schema_version: '0.1.544',
    tenant_id: 'tn_1',
    exported_at: '2026-11-04T00:00:00Z',
    version: '1.0.0',
    plans: [
      { id: 'p1', unique_handle: 'pro', name: 'Pro', created_at: 'x', updated_at: 'y' },
      { id: 'p0', unique_handle: 'free', name: 'Free' },
    ],
    entitlements: [{ id: 'e1', unique_handle: 'seats', name: 'Seats', kind: 'capability_tier' }],
    entitlement_rules: [{ id: 'r', unique_handle: 'r1', plan: 'pro', entitlement: 'seats', limit: { b: 2, a: 1 }, unit: 'seat' }],
    segments: [
      { id: 's1', handle: 'whales', name: 'Whales', dimension_id: 'dim_imported_tn_1' },
      { id: 's2', handle: 'rt.new_users', name: 'New users' },
    ],
    surface_templates: [{ unique_handle: 'banner', name: 'Banner', fields: [] }],
    theme: { color: 'blue' },
  };

  it('reads a round-tripped file as unchanged (key order, nulls, empties, server-owned fields, rt.* built-ins)', () => {
    expect(diffExportedConfig(authored, exported)).toEqual({});
    expect(diffExportedConfig(exported, authored)).toEqual({});
  });

  it('still reports a real field change, with the field', () => {
    const changed = structuredClone(exported);
    changed.plans[0].name = 'Professional';
    changed.entitlement_rules[0].limit = { a: 1, b: 3 };
    const diff = diffExportedConfig(authored, changed);
    expect(diff.plans).toEqual({ added: [], changed: ['pro'], removed: [], fields: { pro: ['name'] } });
    expect(diff.entitlement_rules.fields).toEqual({ r1: ['limit'] });
    expect(Object.keys(diff).sort()).toEqual(['entitlement_rules', 'plans']);
    expect(formatDiff(diff)).toContain('~ pro (name)');
  });

  it('sees a change to a top-level object or scalar', () => {
    const diff = diffExportedConfig(authored, { ...exported, theme: { color: 'red' } });
    expect(diff['(top-level)']).toEqual({ added: [], changed: ['theme'], removed: [] });
    expect(diffExportedConfig({}, { theme: {} })).toEqual({});
  });

  it('does not hide a missing item behind the built-in allow-list', () => {
    const gone = { ...exported, segments: [] };
    expect(diffExportedConfig(authored, gone).segments).toMatchObject({ added: [], removed: ['whales'] });
  });
});
