/**
 * Non-interactive CI mode (plan 129 TASK-2): an env-supplied bearer token and
 * extra request headers, resolved here as pure functions so the precedence and
 * the redaction rules are unit-tested without a filesystem or network.
 *
 * - `REVTURBINE_TOKEN` supplies the bearer and wins over the stored credential.
 *   With it set and no `-t/--tenant-id`, NO `x-tenant-id` is sent: the server
 *   resolves the token user's own tenant (D-27), and any header would have to
 *   equal it anyway.
 * - `REVTURBINE_HTTP_HEADERS` is a JSON object of extra headers added to every
 *   request to the RevTurbine instance (e.g. Vercel's
 *   `x-vercel-protection-bypass` on a protection-gated staging deployment).
 *   Header VALUES are secrets: they are never logged, echoed in an error, or
 *   written to telemetry. Only header NAMES are ever displayed.
 */

export const TOKEN_ENV = 'REVTURBINE_TOKEN';
export const HEADERS_ENV = 'REVTURBINE_HTTP_HEADERS';

/** The tenant header sent when nothing else names a tenant (non-env sessions). */
export const DEFAULT_TENANT_ID = 'dev-tenant-001';

export type TokenSource = 'env' | 'stored' | 'none';

export type ResolvedAuth = {
  /** Bearer token, or null when there is none. */
  token: string | null;
  tokenSource: TokenSource;
  /** The `x-tenant-id` to send, or null to send none (server resolves it). */
  tenantId: string | null;
  /** Human label for where the tenant came from. */
  tenantSource: string;
};

/**
 * Resolve the bearer + tenant header, in precedence order:
 *   token:  `REVTURBINE_TOKEN` > stored credential > none
 *   tenant: `-t/--tenant-id` > (env token: none — server-resolved)
 *           > stored token's tenant > the dev default
 */
export function resolveAuth(params: {
  envToken: string | undefined;
  stored: { token: string; tenant_id: string | null } | null;
  explicitTenantId?: string;
}): ResolvedAuth {
  const envToken = params.envToken?.trim();
  const explicit = params.explicitTenantId;
  if (envToken) {
    return {
      token: envToken,
      tokenSource: 'env',
      tenantId: explicit ?? null,
      tenantSource: explicit ? '--tenant-id' : `${TOKEN_ENV}; resolved server-side`,
    };
  }
  const stored = params.stored;
  return {
    token: stored?.token ?? null,
    tokenSource: stored ? 'stored' : 'none',
    tenantId: explicit ?? stored?.tenant_id ?? DEFAULT_TENANT_ID,
    tenantSource: explicit ? '--tenant-id' : stored?.tenant_id ? 'stored token' : 'default',
  };
}

/** Headers the env var may not set — they have dedicated, audited sources. */
const RESERVED = new Map<string, string>([
  ['authorization', `use ${TOKEN_ENV}`],
  ['x-tenant-id', 'use -t/--tenant-id'],
  ['x-rt-tenant-id', 'use -t/--tenant-id'],
  ['content-type', 'set by the CLI'],
]);

// RFC 9110 field-name token characters.
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export type ExtraHeadersResult =
  | { ok: true; headers: Record<string, string> }
  | { ok: false; error: string };

/**
 * Parse `REVTURBINE_HTTP_HEADERS`. Unset/blank → no headers. Error messages name
 * at most a header NAME, never a value (and never the raw env string, which a
 * JSON parser error would otherwise quote).
 */
export function parseExtraHeaders(raw: string | undefined): ExtraHeadersResult {
  if (raw === undefined || raw.trim() === '') return { ok: true, headers: {} };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: `${HEADERS_ENV} is not valid JSON (expected an object of header name → string value)` };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: `${HEADERS_ENV} must be a JSON object of header name → string value` };
  }
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!HEADER_NAME.test(name)) {
      return { ok: false, error: `${HEADERS_ENV} has an invalid header name (${JSON.stringify(name.slice(0, 64))})` };
    }
    const reserved = RESERVED.get(name.toLowerCase());
    if (reserved) {
      return { ok: false, error: `${HEADERS_ENV} may not set ${name} (${reserved})` };
    }
    if (typeof value !== 'string') {
      return { ok: false, error: `${HEADERS_ENV} header ${name} must have a string value` };
    }
    if (/[\r\n\0]/.test(value)) {
      return { ok: false, error: `${HEADERS_ENV} header ${name} has a value with a control character` };
    }
    headers[name] = value;
  }
  return { ok: true, headers };
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Wrap a fetch so every call carries the extra headers — for flows (login,
 * signup) that build their own requests. A header the caller sets explicitly
 * wins; reserved names never reach `extra` (see parseExtraHeaders).
 */
export function withExtraHeaders(fetchImpl: FetchFn, extra: Record<string, string>): FetchFn {
  if (Object.keys(extra).length === 0) return fetchImpl;
  return (input, init) => {
    const headers = new Headers(init?.headers);
    for (const [name, value] of Object.entries(extra)) {
      if (!headers.has(name)) headers.set(name, value);
    }
    return fetchImpl(input, { ...init, headers });
  };
}
