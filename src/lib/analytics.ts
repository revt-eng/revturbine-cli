// @revturbine-graph gref:abf7287461a14132bbab
export interface AnalyticsHttpResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

type FetchLike = typeof fetch;

async function request<T>(
  baseUrl: string,
  headers: Record<string, string>,
  path: string,
  init: RequestInit = {},
  fetchImpl: FetchLike = fetch,
): Promise<AnalyticsHttpResult<T>> {
  const response = await fetchImpl(`${baseUrl}${path}`, { headers, ...init });
  const data = await response.json().catch(() => ({})) as T;
  return { ok: response.ok, status: response.status, data };
}

// @revturbine-graph gref:3cc3cbe185515c5f15af
export function getAnalyticsCatalog(baseUrl: string, headers: Record<string, string>, fetchImpl?: FetchLike) {
  return request(baseUrl, headers, '/api/analytics/catalog', {}, fetchImpl);
}

// @revturbine-graph gref:26ee3568d269c2d9a250
export function listAnalyticsTemplates(baseUrl: string, headers: Record<string, string>, fetchImpl?: FetchLike) {
  return request<{ items: unknown[] }>(baseUrl, headers, '/api/analytics/templates', {}, fetchImpl);
}

// @revturbine-graph gref:5e4d2b7a855eb609e585
export function listAnalyticsViews(baseUrl: string, headers: Record<string, string>, fetchImpl?: FetchLike) {
  return request<{ items: unknown[] }>(baseUrl, headers, '/api/analytics/views', {}, fetchImpl);
}

// @revturbine-graph gref:41b89947bed65b421ed3
export function getAnalyticsView(baseUrl: string, headers: Record<string, string>, viewId: string, fetchImpl?: FetchLike) {
  return request(baseUrl, headers, `/api/analytics/views/${encodeURIComponent(viewId)}`, {}, fetchImpl);
}

// @revturbine-graph gref:dd1cc2d251bf37df636b
export function createAnalyticsView(
  baseUrl: string,
  headers: Record<string, string>,
  body: {
    document: unknown;
    name?: string;
    visibility: 'private' | 'team' | 'tenant';
    idempotency_key: string;
    base_template_id?: string;
    base_template_version?: number;
  },
  fetchImpl?: FetchLike,
) {
  return request(baseUrl, headers, '/api/analytics/views', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}

// @revturbine-graph gref:6cba19c8de8faa0daece
export function previewAnalyticsView(
  baseUrl: string,
  headers: Record<string, string>,
  body: { document: unknown; block_ids?: string[]; filter_state?: unknown[] },
  fetchImpl?: FetchLike,
) {
  return request(baseUrl, headers, '/api/analytics/preview', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}

// @revturbine-graph gref:91925e74c991fdaaeae8
export function queryAnalyticsView(
  baseUrl: string,
  headers: Record<string, string>,
  body: { view_id: string; revision?: number; block_ids?: string[]; filter_state?: unknown[] },
  fetchImpl?: FetchLike,
) {
  return request(baseUrl, headers, '/api/analytics/query', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}
