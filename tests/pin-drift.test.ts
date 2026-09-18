/**
 * Plan 174 TASK-12 / REQ-16 (spec-check F-69c) — the repo pin-drift check
 * behind `--version`: `@revturbine/cli` must be EXACT (repo-pinned CLI /
 * delegation). SDK latest-version guidance is separate (plan 254 TASK-12).
 */
import { describe, expect, it } from 'vitest';
import { checkPinDrift } from '../src/lib/pin-drift';

describe('checkPinDrift', () => {
  it('is silent for an exact CLI pin regardless of the SDK range', () => {
    expect(
      checkPinDrift({
        devDependencies: { '@revturbine/cli': '0.14.0' },
        dependencies: { '@revturbine/sdk': '^0.2.67' },
      }),
    ).toEqual([]);
  });

  it('warns when the CLI pin carries a range', () => {
    const warnings = checkPinDrift({ devDependencies: { '@revturbine/cli': '^0.14.0' } });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('@revturbine/cli');
    expect(warnings[0]).toContain('EXACT');
  });

  it('does not prescribe SDK range syntax', () => {
    expect(checkPinDrift({ dependencies: { '@revturbine/sdk': '0.2.67' } })).toEqual([]);
    expect(checkPinDrift({ dependencies: { '@revturbine/sdk': '~0.2.67' } })).toEqual([]);
  });

  it('accepts an exact CLI pin with a prerelease suffix', () => {
    expect(checkPinDrift({ devDependencies: { '@revturbine/cli': '0.15.0-rc.1' } })).toEqual([]);
  });

  it('is silent for repos with no RevTurbine pins, non-objects, and missing dep blocks', () => {
    expect(checkPinDrift({ dependencies: { react: '^19.0.0' } })).toEqual([]);
    expect(checkPinDrift(null)).toEqual([]);
    expect(checkPinDrift('not a package.json')).toEqual([]);
    expect(checkPinDrift({})).toEqual([]);
  });

  it('reads pins from dependencies when devDependencies has none', () => {
    expect(checkPinDrift({ dependencies: { '@revturbine/cli': '~0.14.0' } })).toHaveLength(1);
  });
});
