import { describe, expect, it, vi } from 'vitest';
import {
  createAnalyticsView,
  getAnalyticsCatalog,
  getAnalyticsView,
  listAnalyticsTemplates,
  listAnalyticsViews,
  previewAnalyticsView,
  queryAnalyticsView,
} from '../src/lib/analytics';

type Call = { url: string; init?: RequestInit };
function stubFetch(calls: Call[]): typeof fetch {
  return vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return { ok: true, status: 200, json: async () => ({ items: [] }) };
  }) as unknown as typeof fetch;
}

const headers = { Authorization: 'Bearer token', 'x-tenant-id': 'tenant-1' };

describe('analytics HTTP contract', () => {
  it('uses the existing catalog, template, and saved-view endpoints', async () => {
    const calls: Call[] = [];
    const fetchImpl = stubFetch(calls);
    await getAnalyticsCatalog('https://example.test/app', headers, fetchImpl);
    await listAnalyticsTemplates('https://example.test/app', headers, fetchImpl);
    await listAnalyticsViews('https://example.test/app', headers, fetchImpl);
    await getAnalyticsView('https://example.test/app', headers, 'saved/a', fetchImpl);

    expect(calls.map((call) => call.url)).toEqual([
      'https://example.test/app/api/analytics/catalog',
      'https://example.test/app/api/analytics/templates',
      'https://example.test/app/api/analytics/views',
      'https://example.test/app/api/analytics/views/saved%2Fa',
    ]);
  });

  it('passes canonical documents through unchanged for create and preview', async () => {
    const calls: Call[] = [];
    const fetchImpl = stubFetch(calls);
    const document = { kind: 'revturbine.analytics-view', id: 'saved-1', custom_future_field: true };
    await createAnalyticsView('https://example.test/app', headers, {
      document,
      visibility: 'private',
      idempotency_key: 'cli:saved-1',
      base_template_id: 'revenue-overview',
      base_template_version: 3,
    }, fetchImpl);
    await previewAnalyticsView('https://example.test/app', headers, {
      document,
      block_ids: ['trend'],
      filter_state: [{ filter_id: 'period', value: { preset: '7d' } }],
    }, fetchImpl);

    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      document,
      visibility: 'private',
      idempotency_key: 'cli:saved-1',
      base_template_id: 'revenue-overview',
      base_template_version: 3,
    });
    expect(JSON.parse(String(calls[1].init?.body)).document).toBeTruthy();
  });

  it('queries saved views through the same view-id contract', async () => {
    const calls: Call[] = [];
    await queryAnalyticsView('https://example.test/app', headers, {
      view_id: 'saved-1', revision: 2, block_ids: ['trend'],
    }, stubFetch(calls));
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      view_id: 'saved-1', revision: 2, block_ids: ['trend'],
    });
  });
});
