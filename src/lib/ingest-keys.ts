/**
 * Ingest-key management (plan 152). The `revturbine ingest-keys` commands call
 * the web `/api/developer/ingest-keys` endpoints, which now authorize the CLI's
 * user-scoped `client` token (not just a browser session) — so a public ingest
 * key (the embeddable SDK telemetry credential) can be minted from the CLI.
 *
 * Pure request/response shaping with an injectable `fetchImpl`, so the suite
 * exercises every branch without a network (mirrors `drafts.ts`). `cli.ts` owns
 * the connection, tenant resolution, and output.
 */

export interface IngestKeySummary {
  id: string;
  tokenPreview: string;
  originAllowlist: string[];
  ipAllowlist: string[];
  createdAt?: string;
  lastUsedAt?: string | null;
}

/** A freshly minted key — carries the full `token`, returned ONCE and never again. */
export interface MintedIngestKey extends IngestKeySummary {
  token: string;
}

export interface CreateIngestKeyInput {
  originAllowlist: string[];
  ipAllowlist?: string[];
}

type JsonBag = Record<string, unknown>;

async function readJson(res: Response): Promise<JsonBag> {
  return (await res.json().catch(() => ({}))) as JsonBag;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** POST a new public ingest key. On success `key` carries the once-only token. */
export async function createIngestKey(
  baseUrl: string,
  headers: Record<string, string>,
  input: CreateIngestKeyInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number; key: MintedIngestKey | null; error: JsonBag }> {
  const res = await fetchImpl(`${baseUrl}/api/developer/ingest-keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      origin_allowlist: input.originAllowlist,
      ip_allowlist: input.ipAllowlist ?? [],
    }),
  });
  const json = await readJson(res);
  if (!res.ok) return { ok: false, status: res.status, key: null, error: json };
  return {
    ok: true,
    status: res.status,
    key: {
      id: typeof json.id === 'string' ? json.id : '',
      token: typeof json.token === 'string' ? json.token : '',
      tokenPreview: typeof json.tokenPreview === 'string' ? json.tokenPreview : '',
      originAllowlist: asStringArray(json.originAllowlist),
      ipAllowlist: asStringArray(json.ipAllowlist),
      createdAt: typeof json.createdAt === 'string' ? json.createdAt : undefined,
    },
    error: {},
  };
}

/** GET the caller's active public ingest keys (previews only — never full tokens). */
export async function listIngestKeys(
  baseUrl: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number; keys: IngestKeySummary[] }> {
  const res = await fetchImpl(`${baseUrl}/api/developer/ingest-keys`, { headers });
  const json = await readJson(res);
  const rawKeys = Array.isArray(json.keys) ? json.keys : [];
  const keys: IngestKeySummary[] = rawKeys.map((k) => {
    const row = (k ?? {}) as JsonBag;
    return {
      id: typeof row.id === 'string' ? row.id : '',
      tokenPreview: typeof row.tokenPreview === 'string' ? row.tokenPreview : '',
      originAllowlist: asStringArray(row.originAllowlist),
      ipAllowlist: asStringArray(row.ipAllowlist),
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
      lastUsedAt: typeof row.lastUsedAt === 'string' ? row.lastUsedAt : null,
    };
  });
  return { ok: res.ok, status: res.status, keys: res.ok ? keys : [] };
}

/** DELETE (revoke) a public ingest key by id (owner-only, server-enforced). */
export async function revokeIngestKey(
  baseUrl: string,
  headers: Record<string, string>,
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetchImpl(`${baseUrl}/api/developer/ingest-keys/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  return { ok: res.ok, status: res.status };
}

/** One-line human summary of a listed key (never includes a full token). */
export function formatIngestKeyLine(key: IngestKeySummary): string {
  const origins = key.originAllowlist.length ? key.originAllowlist.join(', ') : '(none)';
  const ips = key.ipAllowlist.length ? `  ips: ${key.ipAllowlist.join(', ')}` : '';
  const last = key.lastUsedAt ? `  last used ${key.lastUsedAt}` : '';
  return `${key.id}  ${key.tokenPreview}  origins: ${origins}${ips}${last}`;
}
