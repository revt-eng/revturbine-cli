/** Authentication evidence from the protected endpoint, independent of tenant configuration. */
export function classifyToken(hasToken: boolean, status: number | null, challenged = false): boolean | null {
  if (!hasToken || status === null) return null;
  if (status >= 200 && status < 300) return true;
  // A challenge or firewall answered before the key was checked: no evidence either way.
  if (challenged) return null;
  if (status === 401 || status === 403) return false;
  return null;
}

export function formatAuthentication(hasToken: boolean, tokenValid: boolean | null, refusal?: Refusal | null): string {
  if (!hasToken) return 'authentication: not logged in — run `revturbine login`';
  if (tokenValid === true) return 'authentication: credentials accepted for this instance and tenant';
  if (refusal?.challenged) return `authentication: unverified — ${formatRefusal(refusal)}`;
  if (tokenValid === false) {
    const body = refusal && refusal.detail.length > 0 ? ` Response body: ${refusal.detail}` : '';
    const status = refusal ? ` (HTTP ${refusal.status})` : '';
    return `authentication: credentials rejected for this instance or tenant${status} — check access or run \`revturbine login\`.${body}`;
  }
  return 'authentication: verification unavailable — credentials present; retry when the instance is reachable';
}

/** Error codes (or Vercel mitigation values) that mean a firewall or bot challenge answered, not the key check. */
const CHALLENGE_OR_BLOCK_CODE = /challenge|block|firewall|captcha|rate_?limit/i;

export interface RefusalEnvelope {
  code?: string;
  message?: string;
}

export interface Refusal {
  status: number;
  /** True when a firewall or bot challenge answered before the key was checked. */
  challenged: boolean;
  /** The response body as the integrator should read it (`code: message`, or the raw text, capped). */
  detail: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read the error envelope from a refusal body. Accepts `{ error: { code, message } }`,
 * `{ error: 'text' }` and a flat `{ code, message }`; anything else (an HTML
 * challenge page) yields no envelope. Mirrors the SDK's parseRefusalEnvelope (ST-1447).
 */
export function parseRefusalEnvelope(value: unknown): RefusalEnvelope | undefined {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!isRecord(parsed)) return undefined;
  const source = isRecord(parsed.error) ? parsed.error : parsed;
  const code = typeof source.code === 'string' ? source.code : undefined;
  const message = typeof source.message === 'string'
    ? source.message
    : typeof parsed.error === 'string' ? parsed.error : undefined;
  if (code === undefined && message === undefined) return undefined;
  return { ...(code !== undefined ? { code } : {}), ...(message !== undefined ? { message } : {}) };
}

/**
 * Classify a 401/403 from its body (text or already-parsed JSON) and the
 * `x-vercel-mitigated` header. Returns null for any other status.
 */
export function classifyRefusal(status: number, body: unknown, mitigated?: string | null): Refusal | null {
  if (status !== 401 && status !== 403) return null;
  const text = typeof body === 'string' ? body.trim() : body === undefined || body === null ? '' : JSON.stringify(body);
  const envelope = parseRefusalEnvelope(body);
  const challenged = (mitigated !== undefined && mitigated !== null && mitigated.length > 0)
    || (envelope?.code !== undefined && CHALLENGE_OR_BLOCK_CODE.test(envelope.code));
  const detail = envelope
    ? [envelope.code, envelope.message].filter((part): part is string => part !== undefined).join(': ')
    : text.slice(0, 200);
  return { status, challenged, detail };
}

/** One line for a refusal, worded as a challenge/block or a refused credential, with the body. */
export function formatRefusal(refusal: Refusal): string {
  const body = refusal.detail.length > 0 ? ` Response body: ${refusal.detail}` : '';
  return refusal.challenged
    ? `blocked by a challenge or firewall before the credentials were checked (HTTP ${refusal.status}); this is not a refused key — allow the request through the firewall or bot protection in front of the instance.${body}`
    : `credentials refused (HTTP ${refusal.status}).${body}`;
}
