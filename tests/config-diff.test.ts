import { describe, expect, it } from 'vitest';

import { diffExportedConfig, formatDiff } from '../src/lib/config-diff';

const base = {
  version: '1.0.0',
  plans: [{ id: 'plan_free', unique_handle: 'free', name: 'Free' }],
  entitlements: [{ id: 'ent_a', unique_handle: 'a', name: 'A', type: 'feature' }],
};

describe('diffExportedConfig', () => {
  it('reports added / changed / removed per collection by id', () => {
    const next = {
      version: '1.0.0',
      plans: [
        { id: 'plan_free', unique_handle: 'free', name: 'Free Plan' }, // changed (name)
        { id: 'plan_pro', unique_handle: 'pro', name: 'Pro' }, // added
      ],
      entitlements: [], // ent_a removed
    };
    const diff = diffExportedConfig(base, next);
    expect(diff.plans).toEqual({ added: ['plan_pro'], changed: ['plan_free'], removed: [] });
    expect(diff.entitlements).toEqual({ added: [], changed: [], removed: ['ent_a'] });
  });

  it('is empty when the configs match', () => {
    expect(diffExportedConfig(base, base)).toEqual({});
    expect(formatDiff({})).toContain('no changes');
  });

  it('treats a missing current (empty tenant) as all-added', () => {
    const diff = diffExportedConfig({}, base);
    expect(diff.plans.added).toEqual(['plan_free']);
    expect(diff.entitlements.added).toEqual(['ent_a']);
  });

  it('formats a readable summary', () => {
    const out = formatDiff(diffExportedConfig({}, base));
    expect(out).toContain('plans: +1 added');
    expect(out).toContain('+ plan_free');
  });
});
