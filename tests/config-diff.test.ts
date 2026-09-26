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
    expect(diff.plans).toEqual({ added: ['pro'], changed: ['free'], removed: [] });
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
    expect(diff.segments).toEqual({ added: [], changed: ['enterprise'], removed: [] });
  });

  it('diffs the objectives collection by handle (BL-0176)', () => {
    const current = { objectives: [{ handle: 'expansion', name: 'Expansion' }, { handle: 'retention', name: 'Retention' }] };
    const next = { objectives: [{ handle: 'expansion', name: 'Seat expansion' }, { handle: 'trial_conversion', name: 'Trial conversion' }] };
    expect(diffExportedConfig(current, next).objectives).toEqual({
      added: ['trial_conversion'],
      changed: ['expansion'],
      removed: ['retention'],
    });
  });

  it('shows a changed objective reference on a placement (BL-0178)', () => {
    const pl = { id: 'nudge', name: 'Nudge', category: 'fixed', order: 0, trigger: { type: 'trial_ended' }, payloads: [] };
    const diff = diffExportedConfig({ placements: [pl] }, { placements: [{ ...pl, objective: 'expansion' }] });
    expect(diff.placements).toEqual({ added: [], changed: ['Nudge'], removed: [] });
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
