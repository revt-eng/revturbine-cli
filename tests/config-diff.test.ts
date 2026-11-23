import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { diffExportedConfig, formatDiff } from '../src/lib/config-diff';
import { DIFF_EXIT, diffExitCode } from '../src/lib/output';

const here = dirname(fileURLToPath(import.meta.url));
const loadJson = (name: string): unknown => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));

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
// to differ only by server normalisation. The block below is the original
// synthetic allow-list; the evaluate-context fixture pair is the source-file
// round-trip.
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

  it('applies Playbook item-schema defaults (omitted plan fields equal exported zeros/public)', () => {
    const authored = { plans: [{ unique_handle: 'free', name: 'Free' }] };
    const exported = {
      plans: [{ unique_handle: 'free', name: 'Free', tier_position: 0, sort_order: 0, visibility: 'public' }],
    };
    expect(diffExportedConfig(authored, exported)).toEqual({});
  });

  it('ignores derived entitlement_rules fields the importer does not round-trip', () => {
    const authored = {
      entitlement_rules: [{ id: 'r1', entitlement_id: 'seats', targets: [{ kind: 'plan', id: 'pro' }] }],
    };
    const exported = {
      entitlement_rules: [
        {
          id: 'r1',
          entitlement_id: 'seats',
          targets: [{ kind: 'plan', id: 'pro' }],
          kind: 'capability_tier',
          unit: 'seat',
          tier_name: 'Pro',
          tier_description: 'Per seat',
          current_usage: 0,
          max_seats: null,
        },
      ],
    };
    expect(diffExportedConfig(authored, exported)).toEqual({});
  });

  it('lifts inline placement payloads onto placement_payloads (keyed by payload_id)', () => {
    const authored = {
      placements: [
        {
          id: 'pl_usage_warn',
          name: 'pl_usage_warn',
          category: 'usage_credit_seat',
          order: 0,
          trigger: { type: 'trial_ended' },
          payloads: [
            {
              id: 'pl_usage_warn_p0',
              target: { plan_ids: ['pro'], segment_chips: [] },
              surfaces: [{ template_id: 'banner_inline', fields: { header: 'Limit' } }],
            },
          ],
        },
      ],
    };
    const exported = {
      placements: [
        {
          id: 'pl_usage_warn',
          name: 'pl_usage_warn',
          category: 'usage_credit_seat',
          order: 0,
          trigger: { type: 'trial_ended' },
          payloads: [],
        },
      ],
      placement_payloads: [
        {
          payload_id: 'pl_usage_warn_p0',
          placement_id: 'pl_usage_warn',
          target: { plan_ids: ['pro'], segment_chips: [] },
          surfaces: [{ template_id: 'banner_inline', fields: { header: 'Limit' } }],
          source_mode: 'inline',
          created_at: '2026-11-04T00:00:00Z',
          updated_at: '2026-11-04T00:00:00Z',
        },
      ],
    };
    expect(diffExportedConfig(authored, exported)).toEqual({});
    expect(diffExportedConfig(exported, authored)).toEqual({});
  });

  it('still reports a real payload field change after the lift', () => {
    const authored = {
      placements: [
        {
          id: 'nudge',
          name: 'Nudge',
          category: 'fixed',
          order: 0,
          trigger: { type: 'trial_ended' },
          payloads: [{ id: 'p0', target: { plan_ids: [] }, surfaces: [{ template_id: 'banner_inline', fields: { header: 'A' } }] }],
        },
      ],
    };
    const exported = {
      placements: [
        { id: 'nudge', name: 'Nudge', category: 'fixed', order: 0, trigger: { type: 'trial_ended' }, payloads: [] },
      ],
      placement_payloads: [
        {
          payload_id: 'p0',
          placement_id: 'nudge',
          target: { plan_ids: [] },
          surfaces: [{ template_id: 'banner_inline', fields: { header: 'B' } }],
          source_mode: 'inline',
        },
      ],
    };
    const diff = diffExportedConfig(authored, exported);
    expect(diff.placement_payloads).toEqual({
      added: [],
      changed: ['p0'],
      removed: [],
      fields: { p0: ['surfaces'] },
    });
    expect(diff.placements).toBeUndefined();
  });

  it('reads evaluate-context source vs a documented export shape as unchanged (exit 0)', () => {
    const authored = loadJson('evaluate-context-playbook.json');
    const exported = loadJson('bl-0425-export.json');
    expect(diffExportedConfig(authored, exported)).toEqual({});
    expect(diffExportedConfig(exported, authored)).toEqual({});
    expect(diffExitCode(diffExportedConfig(authored, exported))).toBe(DIFF_EXIT.NO_DIFFERENCES);
  });

});
