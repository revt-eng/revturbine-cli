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
