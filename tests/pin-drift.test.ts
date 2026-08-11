/**
 * Plan 174 TASK-12 / REQ-16 (spec-check F-69c) — the repo pin-drift check
 * behind `--version`: `@revturbine/cli` must be EXACT (repo-pinned CLI /
 * delegation), `@revturbine/sdk` must be CARET (additive releases flow in).
 */
import { describe, expect, it } from 'vitest';
import { checkPinDrift } from '../src/lib/pin-drift';

describe('checkPinDrift', () => {
  it('is silent for a rule-following repo (cli exact, sdk caret)', () => {
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

  it('warns when the SDK pin is exact or tilde', () => {
    expect(checkPinDrift({ dependencies: { '@revturbine/sdk': '0.2.67' } })[0]).toContain('caret');
    expect(checkPinDrift({ dependencies: { '@revturbine/sdk': '~0.2.67' } })[0]).toContain('caret');
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
