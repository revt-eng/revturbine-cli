/**
 * BL-0123 — pure parsing of `evaluate`'s decision context. No filesystem, no
 * SDK: the ctx object and the raw flag strings in, a normalized context out.
 */
import { describe, expect, it } from 'vitest';
import { parseDecisionContext } from '../src/lib/evaluate-context';

function ok(result: ReturnType<typeof parseDecisionContext>) {
  if (!result.ok) throw new Error(`expected ok, got: ${result.errors.join('; ')}`);
  return result.context;
}

describe('parseDecisionContext', () => {
  it('returns an empty context for a ctx file carrying only identity', () => {
    expect(ok(parseDecisionContext({ ctx: { user_id: 'u1', plan_handle: 'pro' } }))).toEqual({});
  });

  it('normalizes a bare usage number into the SDK usage-entry shape', () => {
    expect(ok(parseDecisionContext({ ctx: { usage: { api_calls: 95 } } })).usage).toEqual({
      api_calls: { entitlement_handle: 'api_calls', unit: 'unit', amount: 95 },
    });
  });

  it('keeps an authored limit, unit and reset date', () => {
    const usage = ok(
      parseDecisionContext({
        ctx: { usage: { api_calls: { amount: 95, limit: 100, unit: 'calls', reset_date: '2026-10-01' } } },
      }),
    ).usage;
    expect(usage).toEqual({
      api_calls: { entitlement_handle: 'api_calls', unit: 'calls', amount: 95, limit: 100, reset_date: '2026-10-01' },
    });
  });

  it('rejects a negative or non-numeric usage amount', () => {
    expect(parseDecisionContext({ ctx: { usage: { api_calls: -1 } } })).toMatchObject({ ok: false });
    expect(parseDecisionContext({ ctx: { usage: { api_calls: { amount: 'lots' } } } })).toMatchObject({ ok: false });
  });

  it('requires in_trial on a trial status', () => {
    expect(parseDecisionContext({ ctx: { trial: { days_remaining: 3 } } })).toMatchObject({ ok: false });
    expect(ok(parseDecisionContext({ ctx: { trial: { in_trial: true, days_remaining: 3 } } })).trialStatus).toEqual({
      in_trial: true,
      days_remaining: 3,
    });
  });

  it('normalizes now_iso and rejects a timestamp that is not one', () => {
    expect(ok(parseDecisionContext({ ctx: { now_iso: '2026-09-21T00:00:00Z' } })).nowIso).toBe(
      '2026-09-21T00:00:00.000Z',
    );
    expect(parseDecisionContext({ ctx: { now_iso: 'yesterday' } })).toMatchObject({ ok: false });
  });

  it('lets --usage, --trial-status and --now override the ctx file', () => {
    const context = ok(
      parseDecisionContext({
        ctx: {
          usage: { api_calls: 1 },
          trial: { in_trial: false },
          now_iso: '2026-01-01T00:00:00Z',
        },
        usage: '{"api_calls":{"amount":95,"limit":100}}',
        trialStatus: '{"in_trial":true,"days_remaining":3}',
        now: '2026-09-21T00:00:00Z',
      }),
    );
    expect(context.usage?.api_calls).toMatchObject({ amount: 95, limit: 100 });
    expect(context.trialStatus).toMatchObject({ in_trial: true, days_remaining: 3 });
    expect(context.nowIso).toBe('2026-09-21T00:00:00.000Z');
  });

  it('reports malformed flag JSON rather than silently dropping the input', () => {
    const result = parseDecisionContext({ ctx: {}, usage: '{not json' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('--usage must be valid JSON');
  });

  it('carries trial_instances through as an array', () => {
    const context = ok(parseDecisionContext({ ctx: { trial_instances: [{ id: 'ti_1' }] } }));
    expect(context.trialInstances).toEqual([{ id: 'ti_1' }]);
    expect(parseDecisionContext({ ctx: { trial_instances: 'nope' } })).toMatchObject({ ok: false });
  });
});
