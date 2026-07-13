import { describe, expect, it } from 'vitest';

import { resolveUploadTarget } from '../src/lib/target';

describe('resolveUploadTarget (tenant-mismatch guard)', () => {
  it('uses the session tenant for untargeted (hand-authored) configs', () => {
    expect(resolveUploadTarget({ session: 't1' })).toEqual({ ok: true, tenantId: 't1' });
  });

  it('passes silently when the embedded tenant matches the session', () => {
    expect(resolveUploadTarget({ embedded: 't1', session: 't1' })).toEqual({ ok: true, tenantId: 't1' });
  });

  it('refuses an embedded tenant that contradicts the session with no explicit choice', () => {
    const r = resolveUploadTarget({ embedded: 't-other', session: 't1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('t-other');
  });

  it('an explicit -t retargets deliberately, noting the divergence', () => {
    const r = resolveUploadTarget({ embedded: 't-other', explicit: 't1', session: 't1' });
    expect(r).toMatchObject({ ok: true, tenantId: 't1' });
    if (r.ok) expect(r.note).toContain('t-other');
  });

  it('an explicit -t matching the embedded tenant carries no note', () => {
    const r = resolveUploadTarget({ embedded: 't1', explicit: 't1', session: 't2' });
    expect(r).toEqual({ ok: true, tenantId: 't1' });
  });
});
