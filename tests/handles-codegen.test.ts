import { describe, expect, it } from 'vitest';

import {
  extractEntitlementHandles,
  generateHandleTypes,
  renderHandlesModule,
  UNTYPED_GROUP,
} from '../src/lib/handles-codegen';
import { STARTER_PLAYBOOK } from '../src/lib/starter-playbook';

const OPTS = { source: 'test', regenerate: 'revturbine generate types ./config.json' };

const cfg = (entitlements: unknown) => ({ entitlements });

describe('extractEntitlementHandles', () => {
  it('groups by type, sorted and deduped', () => {
    const byType = extractEntitlementHandles(
      cfg([
        { unique_handle: 'seats', type: 'seat' },
        { unique_handle: 'advanced_targeting', type: 'feature' },
        { unique_handle: 'ai_credits', type: 'credits' },
        { unique_handle: 'advanced_targeting', type: 'feature' },
        { unique_handle: 'audit_logs', type: 'feature' },
      ]),
    );
    expect(Object.keys(byType)).toEqual(['credits', 'feature', 'seat']);
    expect(byType.feature).toEqual(['advanced_targeting', 'audit_logs']);
  });

  it('falls back to `handle` and groups blank types under the untyped bucket', () => {
    const byType = extractEntitlementHandles(
      cfg([
        { handle: 'legacy_thing', type: '' },
        { unique_handle: 'x', type: 'feature' },
      ]),
    );
    expect(byType[UNTYPED_GROUP]).toEqual(['legacy_thing']);
  });

  it('skips malformed entries and tolerates non-config input', () => {
    expect(extractEntitlementHandles(cfg([null, 42, { type: 'feature' }, { unique_handle: '' }]))).toEqual({});
    expect(extractEntitlementHandles(null)).toEqual({});
    expect(extractEntitlementHandles({ entitlements: 'nope' })).toEqual({});
  });
});

describe('renderHandlesModule', () => {
  it('emits const namespaces, a flat union, and the regenerate header', () => {
    const ts = renderHandlesModule(
      { feature: ['advanced_targeting', 'theme_editor'], usage_limit: ['events_ingested'] },
      OPTS,
    );
    expect(ts).toContain('// Regenerate (rerun after any `launch` that changes entitlements):');
    expect(ts).toContain('//   revturbine generate types ./config.json');
    expect(ts).toContain("    advanced_targeting: 'advanced_targeting',");
    expect(ts).toContain('  usage_limit: {');
    expect(ts).toContain("  | 'theme_editor';");
    expect(ts).toContain('export type EntitlementTypeName = keyof typeof Entitlements;');
  });

  it('quotes handle keys that are not valid identifiers (dots)', () => {
    const ts = renderHandlesModule({ seat: ['seat.admin'] }, OPTS);
    expect(ts).toContain("    'seat.admin': 'seat.admin',");
  });

  it('renders the empty config as never', () => {
    const ts = renderHandlesModule({}, OPTS);
    expect(ts).toContain('export const Entitlements = {} as const;');
    expect(ts).toContain('export type EntitlementHandle = never;');
  });

  it('is deterministic — same input, byte-identical output', () => {
    const byType = { feature: ['b', 'a'].sort() };
    expect(renderHandlesModule(byType, OPTS)).toBe(renderHandlesModule(byType, OPTS));
  });
});

describe('generateHandleTypes', () => {
  it('generates from the bundled starter Playbook', () => {
    const result = generateHandleTypes(STARTER_PLAYBOOK, OPTS);
    expect(result.handles).toContain('advanced_export');
    expect(result.byType.feature).toContain('advanced_export');
    expect(result.ts).toContain("advanced_export: 'advanced_export',");
  });
});
