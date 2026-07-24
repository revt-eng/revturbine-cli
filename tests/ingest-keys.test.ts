import { describe, expect, it, vi } from 'vitest';

import {
  createIngestKey,
  listIngestKeys,
  revokeIngestKey,
  formatIngestKeyLine,
} from '../src/lib/ingest-keys';

type Call = { url: string; init?: RequestInit };

function stubFetch(status: number, body: unknown, calls?: Call[]): typeof fetch {
  return vi.fn(async (url: string, init?: RequestInit) => {
    calls?.push({ url: String(url), init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  }) as unknown as typeof fetch;
}

const headers = { 'x-tenant-id': 't1', Authorization: 'Bearer rtk_client' };

describe('createIngestKey', () => {
  it('POSTs the origin/ip allowlist and returns the once-only token on 201', async () => {
    const calls: Call[] = [];
    const result = await createIngestKey(
      'http://stub',
      headers,
      { originAllowlist: ['https://app.example.com'], ipAllowlist: ['10.0.0.0/8'] },
      stubFetch(
        201,
        {
          id: 'apitok_1',
          token: 'rtk_secret_full',
          tokenPreview: 'rtk_abc...wxyz',
          originAllowlist: ['https://app.example.com'],
          ipAllowlist: ['10.0.0.0/8'],
          createdAt: '2026-07-24',
        },
        calls,
      ),
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);
    expect(result.key?.token).toBe('rtk_secret_full');
    expect(result.key?.id).toBe('apitok_1');
    expect(result.key?.originAllowlist).toEqual(['https://app.example.com']);
    // Correct endpoint, method, and wire body shape.
    expect(calls[0].url).toBe('http://stub/api/developer/ingest-keys');
    expect(calls[0].init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      origin_allowlist: ['https://app.example.com'],
      ip_allowlist: ['10.0.0.0/8'],
    });
  });

  it('defaults ip_allowlist to [] when omitted', async () => {
    const calls: Call[] = [];
    await createIngestKey('http://stub', headers, { originAllowlist: ['https://a.com'] }, stubFetch(201, {}, calls));
    expect(JSON.parse(String(calls[0].init?.body)).ip_allowlist).toEqual([]);
  });

  it('surfaces a non-OK status (e.g. 403 for a non-client token) without throwing', async () => {
    const result = await createIngestKey(
      'http://stub',
      headers,
      { originAllowlist: ['https://a.com'] },
      stubFetch(403, { error: 'This operation requires a user session or a CLI client token' }),
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.key).toBeNull();
    expect(result.error.error).toContain('client token');
  });
});

describe('listIngestKeys', () => {
  it('GETs and returns key summaries (never a full token)', async () => {
    const calls: Call[] = [];
    const result = await listIngestKeys(
      'http://stub',
      headers,
      stubFetch(
        200,
        {
          keys: [
            {
              id: 'apitok_1',
              tokenPreview: 'rtk_abc...wxyz',
              originAllowlist: ['https://app.example.com'],
              ipAllowlist: [],
              createdAt: '2026-07-24',
              lastUsedAt: null,
            },
          ],
        },
        calls,
      ),
    );
    expect(result.ok).toBe(true);
    expect(result.keys).toHaveLength(1);
    expect(result.keys[0].id).toBe('apitok_1');
    expect(result.keys[0]).not.toHaveProperty('token');
    expect(calls[0].url).toBe('http://stub/api/developer/ingest-keys');
    expect(calls[0].init?.method).toBeUndefined(); // GET
  });

  it('returns an empty list on a non-OK status', async () => {
    const result = await listIngestKeys('http://stub', headers, stubFetch(401, {}));
    expect(result.ok).toBe(false);
    expect(result.keys).toEqual([]);
  });
});

describe('revokeIngestKey', () => {
  it('DELETEs the id-scoped path and reports ok on 200', async () => {
    const calls: Call[] = [];
    const result = await revokeIngestKey('http://stub', headers, 'apitok_1', stubFetch(200, { revoked: true }, calls));
    expect(result.ok).toBe(true);
    expect(calls[0].url).toBe('http://stub/api/developer/ingest-keys/apitok_1');
    expect(calls[0].init?.method).toBe('DELETE');
  });

  it('reports not-ok on 404 without throwing', async () => {
    const result = await revokeIngestKey('http://stub', headers, 'missing', stubFetch(404, {}));
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it('url-encodes the id', async () => {
    const calls: Call[] = [];
    await revokeIngestKey('http://stub', headers, 'a/b', stubFetch(200, {}, calls));
    expect(calls[0].url).toBe('http://stub/api/developer/ingest-keys/a%2Fb');
  });
});

describe('formatIngestKeyLine', () => {
  it('renders id, preview, and origins; never a full token', () => {
    const line = formatIngestKeyLine({
      id: 'apitok_1',
      tokenPreview: 'rtk_abc...wxyz',
      originAllowlist: ['https://app.example.com'],
      ipAllowlist: [],
      lastUsedAt: null,
    });
    expect(line).toContain('apitok_1');
    expect(line).toContain('rtk_abc...wxyz');
    expect(line).toContain('https://app.example.com');
  });
});
