// @revturbine-graph gref:554c493d35a413c8cd06
/**
 * Authenticated event ingest (plan 231 TASK-5 / REQ-6).
 *
 * `revturbine events track` posts analytics events to the web app's
 * `/api/track` using the machine's device-auth `client` token. That route used
 * to accept only the embeddable `public` browser key, whose origin allowlist is
 * fail-closed — a CLI sends no `Origin` at all, so it could never ingest. Plan
 * 231 REQ-5 added the authenticated lane this command speaks to.
 *
 * Not to be confused with `track.ts`, which emits the CLI's OWN control-plane
 * telemetry (`cli_command_executed`) to `/api/events`. This module carries the
 * caller's product events into the analytics pipeline.
 *
 * Pure request/response shaping with an injectable `fetchImpl`, so the suite
 * exercises every branch without a network (mirrors `ingest-keys.ts`).
 * `cli.ts` owns file reading, the connection, and output.
 */

/**
 * The server's batch ceiling, mirrored from `MAX_TRACK_EVENTS_PER_BATCH` in
 * `@revt-eng/schema`. A batch above this is a hard 400 with nothing partial to
 * accept, so the client chunks rather than discovering the bound by rejection.
 */
export const MAX_EVENTS_PER_BATCH = 500;

/** The subset of the wire event this command requires the caller to supply. */
export interface TrackEventInput {
  environment_id: string;
  user_id: string;
  account_id: string;
  event_name: string;
  event_ts: string;
  [key: string]: unknown;
}

/** Per-batch outcome, as the route reports it. */
export interface BatchResult {
  accepted: number;
  quarantined: number;
  dropped_unscoped: number;
  rejected: Array<{ index: number; issues: unknown }>;
  request_id: string | null;
}

/** Totals across every chunk, plus the per-chunk detail. */
export interface IngestSummary {
  batches: number;
  events: number;
  accepted: number;
  quarantined: number;
  dropped_unscoped: number;
  rejected: number;
  results: BatchResult[];
}

const REQUIRED_FIELDS = [
  'environment_id',
  'user_id',
  'account_id',
  'event_name',
  'event_ts',
] as const;

/**
 * Parse a batch from JSON or NDJSON text.
 *
 * Accepts three shapes so a caller can pipe whatever they already have: an
 * `{ events: [...] }` envelope (what the route itself takes), a bare array, or
 * newline-delimited objects. Blank lines are skipped so a trailing newline is
 * not an error.
 *
 * Returns errors rather than throwing, and reports EVERY malformed line at once
 * — fixing a hand-written batch one rejected line per run is a bad loop.
 */
export function parseEventBatch(text: string): { events: TrackEventInput[]; errors: string[] } {
  const trimmed = text.trim();
  if (trimmed === '') return { events: [], errors: ['input is empty'] };

  const errors: string[] = [];
  let raw: unknown[];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // Not a single JSON value — fall back to NDJSON, since a file of
      // newline-delimited objects also starts with `{`.
      return parseNdjson(trimmed);
    }
    if (Array.isArray(parsed)) {
      raw = parsed;
    } else if (parsed !== null && typeof parsed === 'object' && Array.isArray((parsed as { events?: unknown }).events)) {
      raw = (parsed as { events: unknown[] }).events;
    } else if (parsed !== null && typeof parsed === 'object') {
      raw = [parsed];
    } else {
      return { events: [], errors: ['input must be an object, an array, or an { events: [...] } envelope'] };
    }
  } else {
    return parseNdjson(trimmed);
  }

  const events = validateAll(raw, errors);
  return { events, errors };
}

function parseNdjson(text: string): { events: TrackEventInput[]; errors: string[] } {
  const errors: string[] = [];
  const raw: unknown[] = [];
  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t === '') return;
    try {
      raw.push(JSON.parse(t));
    } catch {
      errors.push(`line ${i + 1}: not valid JSON`);
    }
  });
  const events = validateAll(raw, errors);
  return { events, errors };
}

function validateAll(raw: unknown[], errors: string[]): TrackEventInput[] {
  const events: TrackEventInput[] = [];
  raw.forEach((item, i) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`event ${i}: not a JSON object`);
      return;
    }
    const bag = item as Record<string, unknown>;
    const missing = REQUIRED_FIELDS.filter(
      (f) => typeof bag[f] !== 'string' || (bag[f] as string).trim() === '',
    );
    if (missing.length > 0) {
      errors.push(`event ${i}: missing or empty ${missing.join(', ')}`);
      return;
    }
    events.push(bag as unknown as TrackEventInput);
  });
  return events;
}

/** Split a batch into server-acceptable chunks. */
export function chunkEvents(
  events: TrackEventInput[],
  size: number = MAX_EVENTS_PER_BATCH,
): TrackEventInput[][] {
  const limit = Math.max(1, Math.min(size, MAX_EVENTS_PER_BATCH));
  const out: TrackEventInput[][] = [];
  for (let i = 0; i < events.length; i += limit) out.push(events.slice(i, i + limit));
  return out;
}

function readResult(json: Record<string, unknown>): BatchResult {
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    accepted: num(json.accepted),
    quarantined: num(json.quarantined),
    dropped_unscoped: num(json.dropped_unscoped),
    rejected: Array.isArray(json.rejected)
      ? (json.rejected as Array<{ index: number; issues: unknown }>)
      : [],
    request_id: typeof json.request_id === 'string' ? json.request_id : null,
  };
}

/** POST one chunk. Non-2xx is returned, never thrown, so the caller maps it. */
export async function postBatch(
  baseUrl: string,
  headers: Record<string, string>,
  events: TrackEventInput[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number; result: BatchResult | null; error: Record<string, unknown> }> {
  const res = await fetchImpl(`${baseUrl}/api/track`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ events }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { ok: false, status: res.status, result: null, error: json };
  return { ok: true, status: res.status, result: readResult(json), error: {} };
}

/** Fold per-batch results into the totals the command reports. */
export function summarize(results: BatchResult[], eventCount: number): IngestSummary {
  return {
    batches: results.length,
    // @revturbine-graph gref:3f4d51af0a0af98edea0
    events: eventCount,
    accepted: results.reduce((n, r) => n + r.accepted, 0),
    quarantined: results.reduce((n, r) => n + r.quarantined, 0),
    dropped_unscoped: results.reduce((n, r) => n + r.dropped_unscoped, 0),
    rejected: results.reduce((n, r) => n + r.rejected.length, 0),
    results,
  };
}

/**
 * Human-readable summary.
 *
 * Quarantined, rejected, and dropped counts are always shown when non-zero,
 * never folded into "accepted" — a load that silently reports success while
 * dropping rows is the failure this whole lane is instrumented against.
 */
export function formatSummary(summary: IngestSummary): string {
  const lines = [
    `ingested ${summary.accepted}/${summary.events} event(s) in ${summary.batches} batch(es)`,
  ];
  if (summary.quarantined > 0) {
    lines.push(`  quarantined: ${summary.quarantined} (payload failed its platform contract)`);
  }
  if (summary.rejected > 0) {
    lines.push(`  rejected: ${summary.rejected} (malformed on the wire)`);
  }
  if (summary.dropped_unscoped > 0) {
    lines.push(`  dropped (unscoped): ${summary.dropped_unscoped} (simulation rows without a dataset id)`);
  }
  return lines.join('\n');
}
