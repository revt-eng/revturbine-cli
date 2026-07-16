import { describe, expect, it } from 'vitest';

import {
  assertSupportedFormat,
  describePlaybookHeader,
  readPlaybookHeader,
  SUPPORTED_FORMAT_VERSIONS,
  UnsupportedFormatError,
} from '../src/lib/playbook-header';

const canonical = (over: Record<string, unknown> = {}) => ({
  artifact_type: 'playbook',
  format_version: '1.0.0',
  playbook_handle: 'default',
  playbook_version_id: 'pbv_1',
  tenant_id: 'tn_1',
  environment_id: 'production',
  ...over,
});

const legacy = (over: Record<string, unknown> = {}) => ({
  version: '0.9.0',
  change_set_id: 'cs_1',
  tenant_id: 'tn_1',
  ...over,
});

describe('playbook header (plan 118 TASK-23)', () => {
  it('pins the supported format versions to the scaffold PLAYBOOK_FORMAT_VERSION', () => {
    // Keep in sync with scaffold src/config/models/schema.ts PLAYBOOK_FORMAT_VERSION.
    expect([...SUPPORTED_FORMAT_VERSIONS]).toEqual(['1.0.0']);
  });

  it('reads the canonical header, normalizing provenance', () => {
    const h = readPlaybookHeader(canonical());
    expect(h.shape).toBe('canonical');
    expect(h.formatVersion).toBe('1.0.0');
    expect(h.playbookHandle).toBe('default');
    expect(h.playbookVersionId).toBe('pbv_1');
  });

  it('reads a legacy header, mapping version/change_set_id onto the normalized fields', () => {
    const h = readPlaybookHeader(legacy());
    expect(h.shape).toBe('legacy');
    expect(h.formatVersion).toBe('0.9.0');
    expect(h.playbookVersionId).toBe('cs_1');
  });

  it('allows a supported canonical Playbook', () => {
    expect(() => assertSupportedFormat(canonical())).not.toThrow();
  });

  it('rejects an unsupported future format_version before any network use', () => {
    expect(() => assertSupportedFormat(canonical({ format_version: '2.0.0' }))).toThrow(UnsupportedFormatError);
  });

  it('rejects a canonical Playbook with a missing format_version', () => {
    expect(() => assertSupportedFormat(canonical({ format_version: undefined }))).toThrow(UnsupportedFormatError);
  });

  it('allows the known legacy shape (server normalizes it)', () => {
    expect(() => assertSupportedFormat(legacy())).not.toThrow();
    expect(readPlaybookHeader(legacy()).shape).toBe('legacy');
  });

  it('rejects an unrecognized artifact_type', () => {
    expect(() => assertSupportedFormat({ artifact_type: 'bundle', format_version: '1.0.0' })).toThrow(
      UnsupportedFormatError,
    );
  });

  it('rejects a file that is neither canonical nor legacy', () => {
    expect(() => assertSupportedFormat({ plans: [] })).toThrow(UnsupportedFormatError);
  });

  it('describes canonical and legacy headers for diagnostics', () => {
    expect(describePlaybookHeader(readPlaybookHeader(canonical()))).toContain('format_version 1.0.0');
    expect(describePlaybookHeader(readPlaybookHeader(canonical()))).toContain('pbv_1');
    expect(describePlaybookHeader(readPlaybookHeader(legacy()))).toContain('legacy');
  });
});
