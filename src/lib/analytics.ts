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

export function getAnalyticsCatalog(baseUrl: string, headers: Record<string, string>, fetchImpl?: FetchLike) {
  return request(baseUrl, headers, '/api/analytics/catalog', {}, fetchImpl);
}

export function listAnalyticsTemplates(baseUrl: string, headers: Record<string, string>, fetchImpl?: FetchLike) {
  return request<{ items: unknown[] }>(baseUrl, headers, '/api/analytics/templates', {}, fetchImpl);
}

export function listAnalyticsViews(baseUrl: string, headers: Record<string, string>, fetchImpl?: FetchLike) {
  return request<{ items: unknown[] }>(baseUrl, headers, '/api/analytics/views', {}, fetchImpl);
}

export function getAnalyticsView(baseUrl: string, headers: Record<string, string>, viewId: string, fetchImpl?: FetchLike) {
  return request(baseUrl, headers, `/api/analytics/views/${encodeURIComponent(viewId)}`, {}, fetchImpl);
}

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

export function previewAnalyticsView(
  baseUrl: string,
  headers: Record<string, string>,
  body: { document: unknown; block_ids?: string[]; filter_state?: unknown[] },
  fetchImpl?: FetchLike,
) {
  return request(baseUrl, headers, '/api/analytics/preview', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}

export function queryAnalyticsView(
  baseUrl: string,
  headers: Record<string, string>,
  body: { view_id: string; revision?: number; block_ids?: string[]; filter_state?: unknown[] },
  fetchImpl?: FetchLike,
) {
  return request(baseUrl, headers, '/api/analytics/query', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}
