/**
 * BL-0123 — `evaluate` passes the whole decision context, not just plan + traits.
 *
 * Four cases the CLI could not decide before this change:
 *   (a) a usage-threshold placement at/over its threshold;
 *   (b) a `trial_ending` placement with a trial status;
 *   (c) a clock pin moving a time-gated trial decision;
 *   (d) a placement whose SECOND payload matches the user's segment.
 *
 * All four go through the shipped `@revturbine/sdk` resolver — the CLI builds
 * no candidate of its own, so (d) is a statement about which SDK the CLI
 * depends on (the multi-payload candidacy fix, BL-0122) as much as about
 * context plumbing.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateLocal } from '../src/lib/evaluate-local';

const playbook = JSON.parse(
  readFileSync(new URL('./fixtures/evaluate-context-playbook.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

/** The user's trial: started 2026-09-10, 14 days, so it ends 2026-09-24. */
const trialInstances = [
  {
    id: 'ti_1',
    tenant_id: 'local',
    customer_id: 'cust_1',
    rule_id: 'ftr_pro',
    rule_type: 'free_trial',
    plan_id: 'plan_pro',
    status: 'active',
    started_at: '2026-09-10T00:00:00.000Z',
    expires_at: '2026-09-24T00:00:00.000Z',
    trial_limit_type: 'time',
    created_at: '2026-09-10T00:00:00.000Z',
    updated_at: '2026-09-10T00:00:00.000Z',
  },
];

const realFetch = globalThis.fetch;

beforeEach(() => {
  // The SDK's 404-safe theme-override probe is the only tolerated call.
  globalThis.fetch = (async () => new Response('{}', { status: 404 })) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

function decisionOf(result: { decisions: unknown[] }, index = 0) {
  return result.decisions[index] as {
    visible?: boolean;
    reasonCodes?: string[];
    content?: { body?: string };
  };
}

describe('evaluate decision context (BL-0123)', () => {
  it('(a) shows a usage-threshold placement once usage crosses the threshold', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      usage: { api_calls: { entitlement_handle: 'api_calls', unit: 'calls', amount: 95, limit: 100 } },
      placementIds: ['pl_usage_warn'],
    });

    expect(decisionOf(result).visible).toBe(true);
    expect(decisionOf(result).reasonCodes).toEqual([]);
    expect(result.payloadIds.pl_usage_warn).toBe('pl_usage_warn_p0');
    // Usage tokens interpolate from the same context.
    expect(decisionOf(result).content?.body).toBe('95 of 100 calls used.');
  });

  it('(a2) keeps it hidden below the threshold — the gate is real, not bypassed', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      usage: { api_calls: { entitlement_handle: 'api_calls', unit: 'calls', amount: 10, limit: 100 } },
      placementIds: ['pl_usage_warn'],
    });

    expect(decisionOf(result).visible).toBe(false);
    expect(decisionOf(result).reasonCodes).toContain('threshold_trigger_unmet');
    expect(result.payloadIds.pl_usage_warn).toBeNull();
  });

  it('(a3) takes the limit from the Playbook when the ctx gives only an amount', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      usage: { api_calls: { entitlement_handle: 'api_calls', unit: 'calls', amount: 95 } },
      placementIds: ['pl_usage_warn'],
    });

    expect(decisionOf(result).visible).toBe(true);
    expect(decisionOf(result).content?.body).toBe('95 of 100 calls used.');
  });

  it('(b) shows a trial_ending placement for a trial status inside the window', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      trialStatus: {
        in_trial: true,
        state: 'running_out',
        trial_limit_type: 'time',
        days_remaining: 3,
        day_number: 11,
        progress_percent: 78,
      },
      placementIds: ['pl_trial_ending'],
    });

    expect(decisionOf(result).visible).toBe(true);
    expect(result.payloadIds.pl_trial_ending).toBe('pl_trial_ending_p0');
    // The number the gate used is reported, because the shipped resolver
    // interpolates usage tokens into decision content but not trial ones —
    // `{{trial_days_remaining}}` survives verbatim. Reported upstream; the CLI
    // does not interpolate on the engine's behalf.
    expect(result.trialStatus).toMatchObject({ in_trial: true, days_remaining: 3 });
    expect(decisionOf(result).content?.body).toBe('Only {{trial_days_remaining}} days left.');
  });

  it('(b2) leaves it hidden with no trial context at all', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      placementIds: ['pl_trial_ending'],
    });

    expect(decisionOf(result).visible).toBe(false);
    expect(decisionOf(result).reasonCodes).toContain('trial_trigger_unmet');
  });

  it('(c) honours the clock pin — 3 days out fires, 12 days out does not', async () => {
    const inWindow = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      trialInstances,
      nowIso: '2026-09-21T00:00:00.000Z',
      placementIds: ['pl_trial_ending'],
    });
    expect(inWindow.trialStatus).toMatchObject({ in_trial: true, days_remaining: 3 });
    expect(decisionOf(inWindow).visible).toBe(true);

    const outOfWindow = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      trialInstances,
      nowIso: '2026-09-12T00:00:00.000Z',
      placementIds: ['pl_trial_ending'],
    });
    expect(outOfWindow.trialStatus).toMatchObject({ in_trial: true, days_remaining: 12 });
    expect(decisionOf(outOfWindow).visible).toBe(false);
    expect(decisionOf(outOfWindow).reasonCodes).toContain('trial_trigger_unmet');
  });

  it('(d) picks the SECOND payload when that is the one the user\'s segment matches', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      traits: { tier: 'smb' },
      placementIds: ['pl_segmented_banner'],
    });

    expect(decisionOf(result).visible).toBe(true);
    expect(result.payloadIds.pl_segmented_banner).toBe('pl_segmented_banner_smb');
    expect(decisionOf(result).content?.body).toBe('SMB copy.');
  });

  it('(d2) picks the first payload for a user the first payload targets', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      traits: { tier: 'enterprise' },
      placementIds: ['pl_segmented_banner'],
    });

    expect(result.payloadIds.pl_segmented_banner).toBe('pl_segmented_banner_enterprise');
    expect(decisionOf(result).content?.body).toBe('Enterprise copy.');
  });

  it('never calls a server decision endpoint, context or not', async () => {
    const calls: string[] = [];
    globalThis.fetch = (async (input: unknown) => {
      calls.push(String(input));
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      traits: { tier: 'smb' },
      usage: { api_calls: { entitlement_handle: 'api_calls', unit: 'calls', amount: 95, limit: 100 } },
      trialInstances,
      nowIso: '2026-09-21T00:00:00.000Z',
      entitlementHandles: ['api_calls'],
      placementIds: ['pl_usage_warn', 'pl_trial_ending', 'pl_segmented_banner'],
    });

    expect(calls.filter((u) => !u.includes('/api/sdk/theme'))).toEqual([]);
  });
});
