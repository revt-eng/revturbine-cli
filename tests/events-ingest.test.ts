/**
 * `revturbine events track` — batch parsing, chunking, and result shaping
 * (plan 231 TASK-5 / REQ-6).
 *
 * All pure: parsing takes text, posting takes an injectable fetch. No
 * filesystem, no network, no spawned binary.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  MAX_EVENTS_PER_BATCH,
  chunkEvents,
  formatSummary,
  parseEventBatch,
  postBatch,
  summarize,
  type TrackEventInput,
} from '../src/lib/events-ingest';

const ev = (over: Partial<TrackEventInput> = {}): TrackEventInput => ({
  environment_id: 'production',
  user_id: 'u-1',
  account_id: 'a-1',
  event_name: 'product_used',
  event_ts: '2026-09-10T00:00:00.000Z',
  ...over,
});

describe('parseEventBatch — accepted shapes', () => {
  it('reads an { events: [...] } envelope', () => {
    const r = parseEventBatch(JSON.stringify({ events: [ev(), ev({ user_id: 'u-2' })] }));
    expect(r.errors).toEqual([]);
    expect(r.events).toHaveLength(2);
  });

  it('reads a bare array', () => {
    const r = parseEventBatch(JSON.stringify([ev()]));
    expect(r.errors).toEqual([]);
    expect(r.events).toHaveLength(1);
  });

  it('reads a single object', () => {
    const r = parseEventBatch(JSON.stringify(ev()));
    expect(r.errors).toEqual([]);
    expect(r.events).toHaveLength(1);
  });

  it('reads NDJSON', () => {
    const r = parseEventBatch([JSON.stringify(ev()), JSON.stringify(ev({ user_id: 'u-2' }))].join('\n'));
    expect(r.errors).toEqual([]);
    expect(r.events).toHaveLength(2);
  });

  it('ignores blank lines so a trailing newline is not an error', () => {
    const r = parseEventBatch(`${JSON.stringify(ev())}\n\n`);
    expect(r.errors).toEqual([]);
    expect(r.events).toHaveLength(1);
  });

  it('preserves caller-supplied extra fields', () => {
    const r = parseEventBatch(JSON.stringify([ev({ properties: '{"a":1}', test: true })]));
    expect(r.events[0].properties).toBe('{"a":1}');
    expect(r.events[0].test).toBe(true);
  });
});

describe('parseEventBatch — rejection', () => {
  it('rejects empty input', () => {
    expect(parseEventBatch('   ').errors).toEqual(['input is empty']);
  });

  it('names every missing required field on one event', () => {
    const r = parseEventBatch(JSON.stringify([{ environment_id: 'production' }]));
    expect(r.events).toHaveLength(0);
    expect(r.errors[0]).toContain('user_id');
    expect(r.errors[0]).toContain('account_id');
    expect(r.errors[0]).toContain('event_name');
    expect(r.errors[0]).toContain('event_ts');
  });

  it('reports EVERY bad event at once, not just the first', () => {
    // Fixing a hand-written batch one rejected line per run is a bad loop.
    const r = parseEventBatch([JSON.stringify({}), JSON.stringify(ev()), JSON.stringify({})].join('\n'));
    expect(r.errors).toHaveLength(2);
  });

  it('treats an empty-string required field as missing', () => {
    const r = parseEventBatch(JSON.stringify([ev({ user_id: '  ' })]));
    expect(r.events).toHaveLength(0);
    expect(r.errors[0]).toContain('user_id');
  });

  it('rejects a non-object event', () => {
    const r = parseEventBatch(JSON.stringify(['nope']));
    expect(r.errors[0]).toContain('not a JSON object');
  });

  it('reports the line number for malformed NDJSON', () => {
    const r = parseEventBatch([JSON.stringify(ev()), '{ broken'].join('\n'));
    expect(r.errors[0]).toContain('line 2');
  });

  it('falls back to NDJSON when a multi-line file is not one JSON value', () => {
    // A file of newline-delimited objects also starts with `{`.
    const r = parseEventBatch([JSON.stringify(ev()), JSON.stringify(ev())].join('\n'));
    expect(r.errors).toEqual([]);
    expect(r.events).toHaveLength(2);
  });
});

describe('chunkEvents', () => {
  it('leaves a batch at the ceiling as one chunk', () => {
    expect(chunkEvents(Array.from({ length: MAX_EVENTS_PER_BATCH }, () => ev()))).toHaveLength(1);
  });

  it('splits one over the ceiling', () => {
    const chunks = chunkEvents(Array.from({ length: MAX_EVENTS_PER_BATCH + 1 }, () => ev()));
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(MAX_EVENTS_PER_BATCH);
    expect(chunks[1]).toHaveLength(1);
  });

  it('never exceeds the server ceiling even when asked to', () => {
    const chunks = chunkEvents(Array.from({ length: 600 }, () => ev()), 10_000);
    expect(chunks[0].length).toBeLessThanOrEqual(MAX_EVENTS_PER_BATCH);
  });

  it('returns nothing for an empty batch', () => {
    expect(chunkEvents([])).toEqual([]);
  });
});

describe('postBatch', () => {
  const headers = { 'Content-Type': 'application/json' };

  it('posts to /api/track and reads the counters', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ accepted: 2, quarantined: 0, dropped_unscoped: 0, rejected: [], request_id: 'req-1' }), { status: 202 }),
    );
    const r = await postBatch('https://x.test', headers, [ev(), ev()], fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).toHaveBeenCalledWith('https://x.test/api/track', expect.objectContaining({ method: 'POST' }));
    expect(r.ok).toBe(true);
    expect(r.result).toMatchObject({ accepted: 2, request_id: 'req-1' });
  });

  it('returns a non-2xx rather than throwing', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: 'ingest_scope_required' }), { status: 403 }));
    const r = await postBatch('https://x.test', headers, [ev()], fetchImpl as unknown as typeof fetch);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
    expect(r.error).toMatchObject({ error: 'ingest_scope_required' });
  });

  it('survives a body that is not JSON', async () => {
    const fetchImpl = vi.fn(async () => new Response('gateway timeout', { status: 504 }));
    const r = await postBatch('https://x.test', headers, [ev()], fetchImpl as unknown as typeof fetch);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(504);
  });

  it('defaults absent counters to 0 rather than NaN', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ accepted: 1 }), { status: 202 }));
    const r = await postBatch('https://x.test', headers, [ev()], fetchImpl as unknown as typeof fetch);
    expect(r.result).toMatchObject({ accepted: 1, quarantined: 0, dropped_unscoped: 0, rejected: [] });
  });
});

describe('summarize + formatSummary', () => {
  const result = (over: Partial<ReturnType<typeof summarize>['results'][number]> = {}) => ({
    accepted: 1,
    quarantined: 0,
    dropped_unscoped: 0,
    rejected: [] as Array<{ index: number; issues: unknown }>,
    request_id: 'r',
    ...over,
  });

  it('folds counters across batches', () => {
    const s = summarize([result({ accepted: 2 }), result({ accepted: 3, quarantined: 1 })], 6);
    expect(s).toMatchObject({ batches: 2, events: 6, accepted: 5, quarantined: 1 });
  });

  it('reports only the accepted line when everything landed', () => {
    expect(formatSummary(summarize([result({ accepted: 2 })], 2))).toBe(
      'ingested 2/2 event(s) in 1 batch(es)',
    );
  });

  it('never folds a quarantine, rejection or drop into accepted', () => {
    // A load is not "clean" because it returned 202.
    const text = formatSummary(
      summarize([result({ accepted: 1, quarantined: 2, dropped_unscoped: 3, rejected: [{ index: 0, issues: {} }] })], 7),
    );
    expect(text).toContain('quarantined: 2');
    expect(text).toContain('rejected: 1');
    expect(text).toContain('dropped (unscoped): 3');
  });
});
