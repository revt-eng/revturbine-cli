import { describe, expect, it, vi } from 'vitest';

import { resolveActiveDraft } from '../src/lib/drafts';

function stubFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe('resolveActiveDraft', () => {
  const headers = { 'x-tenant-id': 't1' };

  it('returns the open draft', async () => {
    const result = await resolveActiveDraft('http://stub', headers, stubFetch(200, { active: { id: 'cs_1', name: 'D' } }));
    expect(result.ok).toBe(true);
    expect(result.draft).toEqual({ id: 'cs_1', name: 'D' });
  });

  it('returns null when no draft is open', async () => {
    const result = await resolveActiveDraft('http://stub', headers, stubFetch(200, { active: null }));
    expect(result.ok).toBe(true);
    expect(result.draft).toBeNull();
  });

  it('surfaces a non-OK status without throwing', async () => {
    const result = await resolveActiveDraft('http://stub', headers, stubFetch(401, {}));
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.draft).toBeNull();
  });
});
