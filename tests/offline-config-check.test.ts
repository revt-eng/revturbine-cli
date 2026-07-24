/**
 * plan 147 TASK-10 (Workstream C) — the CLI is warn-only on unknown / deprecated
 * fields and posts the config RAW.
 *
 *   AC-4  a legacy config uploaded via the CLI reaches the server with ALL
 *         fields — `checkOfflineConfig(...).body` is the raw config, never a
 *         schema-stripped copy.
 *   OQ-1  unknown fields WARN, they never reject: the advisories are `warning`
 *         severity, so `hasBlockingFindings` stays false and the CLI exits 0.
 *   AC-6  deprecated fields (theme / slot_configs / content_overrides) surface a
 *         deprecation `warning`, matching the server/web behaviour (TASK-9).
 */
import { describe, expect, it } from 'vitest';

import { checkOfflineConfig, offlineAdvisories } from '../src/lib/offline-config-check';
import { hasBlockingFindings } from '../src/lib/config-validate';

const LEGACY_CLEAN = {
  version: '1.0.0',
  plans: [],
  entitlements: [],
  entitlement_rules: [],
  segments: [],
  content_ui_paths: [],
};

const CANONICAL_CLEAN = {
  artifact_type: 'playbook',
  format_version: '1.0.0',
  playbook_handle: 'default',
  playbook_version_id: null,
  tenant_id: 'local',
  environment_id: 'local',
  plans: [],
  entitlements: [],
  entitlement_rules: [],
  segments: [],
  content_ui_paths: [],
  surface_templates: [],
  placements: [],
};

describe('checkOfflineConfig — post RAW, warn, never strip (AC-4, OQ-1)', () => {
  it('a legacy config with an unknown extra field: ok, retains the field RAW, and warns (does not block)', () => {
    const config = { ...LEGACY_CLEAN, marketing_blurb: 'launch sale!', nested_extra: { a: 1 } };
    const check = checkOfflineConfig(config);

    // Cleared the offline pre-check — an unknown field is not a structural failure.
    expect(check.ok).toBe(true);

    // AC-4: the body posted is the raw config with EVERY field intact (not stripped).
    expect(check.body).toEqual(config);
    expect((check.body as Record<string, unknown>).marketing_blurb).toBe('launch sale!');
    expect((check.body as Record<string, unknown>).nested_extra).toEqual({ a: 1 });

    // OQ-1: unknown fields surface as `warning` findings, never blocking → exit 0.
    const unknownWarnings = check.advisories.filter(
      (f) => f.severity === 'warning' && f.targetRef?.field === 'marketing_blurb',
    );
    expect(unknownWarnings).toHaveLength(1);
    expect(check.advisories.some((f) => f.targetRef?.field === 'nested_extra')).toBe(true);
    expect(hasBlockingFindings(check.advisories)).toBe(false);
  });

  it('a config carrying ONLY unknown fields still passes (never blocks)', () => {
    const check = checkOfflineConfig({ ...LEGACY_CLEAN, whatever: true });
    expect(check.ok).toBe(true);
    expect(hasBlockingFindings(check.advisories)).toBe(false);
    expect(check.advisories.some((f) => f.targetRef?.field === 'whatever')).toBe(true);
  });

  it('a clean legacy config produces no advisories (legacy `version` header is NOT flagged as unknown)', () => {
    const check = checkOfflineConfig(LEGACY_CLEAN);
    expect(check.ok).toBe(true);
    expect(check.body).toEqual(LEGACY_CLEAN);
    expect(check.advisories).toEqual([]);
  });

  it('a clean canonical Playbook produces no advisories and posts raw', () => {
    const check = checkOfflineConfig(CANONICAL_CLEAN);
    expect(check.ok).toBe(true);
    expect(check.shape).toBe('canonical');
    expect(check.body).toBe(CANONICAL_CLEAN);
    expect(check.advisories).toEqual([]);
  });

  it('a genuinely malformed legacy config still fails the structural pre-check', () => {
    // A wrong-typed required field is a real structural error — this must block,
    // unlike an unknown field. `plans` must be an array of objects.
    const check = checkOfflineConfig({ version: '1.0.0', plans: 'not-an-array' });
    expect(check.ok).toBe(false);
    expect(check.problems.length).toBeGreaterThan(0);
    // Even on failure the body is the raw config (nothing is stripped).
    expect(check.body).toEqual({ version: '1.0.0', plans: 'not-an-array' });
  });
});

describe('offlineAdvisories — deprecation warnings (AC-6, matches TASK-9)', () => {
  it('a legacy config with a deprecated `theme` field surfaces a deprecation warning', () => {
    const advisories = offlineAdvisories({ ...LEGACY_CLEAN, theme: { primary: '#fff' } });
    const theme = advisories.find((f) => f.targetRef?.field === 'theme');
    expect(theme).toBeDefined();
    expect(theme?.severity).toBe('warning');
    // The code comes from the shared snapshot catalog (VAL-DEP-01), not minted here.
    expect(theme?.code).toBe('VAL-DEP-01');
    expect(hasBlockingFindings(advisories)).toBe(false);
  });

  it('a canonical Playbook with deprecated slot_configs / content_overrides warns for each', () => {
    const advisories = offlineAdvisories({
      ...CANONICAL_CLEAN,
      slot_configs: [{ id: 's1' }],
      content_overrides: { hero: 'x' },
    });
    const fields = advisories.filter((f) => f.code === 'VAL-DEP-01').map((f) => f.targetRef?.field);
    expect(fields).toContain('slot_configs');
    expect(fields).toContain('content_overrides');
    expect(hasBlockingFindings(advisories)).toBe(false);
  });

  it('a deprecated field AND an unknown field both warn, side by side', () => {
    const advisories = offlineAdvisories({ ...LEGACY_CLEAN, theme: {}, made_up: 1 });
    expect(advisories.some((f) => f.code === 'VAL-DEP-01' && f.targetRef?.field === 'theme')).toBe(true);
    expect(advisories.some((f) => f.severity === 'warning' && f.targetRef?.field === 'made_up')).toBe(true);
    expect(hasBlockingFindings(advisories)).toBe(false);
  });

  it('a clean config produces no advisories', () => {
    expect(offlineAdvisories(CANONICAL_CLEAN)).toEqual([]);
    expect(offlineAdvisories(LEGACY_CLEAN)).toEqual([]);
  });

  it('non-object input yields no advisories (no crash)', () => {
    expect(offlineAdvisories(null)).toEqual([]);
    expect(offlineAdvisories('nope')).toEqual([]);
    expect(offlineAdvisories(42)).toEqual([]);
  });
});
