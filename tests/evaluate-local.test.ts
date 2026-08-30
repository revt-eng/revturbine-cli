/**
 * Plan 192 TASK-2 — `evaluate` runs locally: a pure function of
 * (UserContext, Playbook) through the public SDK's headless engine. No server
 * decision endpoint exists to call (web PR #485 removed it), and these cases
 * pin that the local path never tries: the only network traffic tolerated is
 * the SDK's theme-override probe, which is 404-safe and decision-inert.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateLocal, resolvePlacementComponentType } from '../src/lib/evaluate-local';

const playbook = JSON.parse(
  readFileSync(new URL('./fixtures/evaluate-playbook.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

const fetchCalls: string[] = [];
const realFetch = globalThis.fetch;

beforeEach(() => {
  fetchCalls.length = 0;
  globalThis.fetch = (async (input: unknown) => {
    fetchCalls.push(String(input));
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('evaluateLocal', () => {
  it('uses componentType canonically and keeps surfaceType as an alias', () => {
    expect(resolvePlacementComponentType({ componentType: 'modal' })).toBe('modal');
    expect(resolvePlacementComponentType({ surfaceType: 'banner' })).toBe('banner');
    expect(
      resolvePlacementComponentType({ componentType: 'modal', surfaceType: 'banner' }),
    ).toBe('modal');
  });

  it('resolves an entitlement from the playbook — pro plan is allowed', async () => {
    const { entitlements } = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      entitlementHandles: ['advanced_export'],
    });
    expect(entitlements.advanced_export).toMatchObject({ allowed: true });
  });

  it('resolves the same entitlement as denied on the free plan', async () => {
    const { entitlements } = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'free',
      entitlementHandles: ['advanced_export'],
    });
    expect(entitlements.advanced_export).toMatchObject({ allowed: false });
  });

  it('fails closed on an unknown entitlement handle', async () => {
    const { entitlements } = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      entitlementHandles: ['does_not_exist'],
    });
    expect(entitlements.does_not_exist).toMatchObject({ status: 'denied', allowed: false });
  });

  it('returns a typed non-visible decision for an unknown placement id', async () => {
    const { decisions } = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      placementIds: ['pl_nope'],
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      visible: false,
      reasonCodes: ['placement_not_found'],
    });
  });

  it('resolves a slot request to null when the playbook has no slots', async () => {
    const { placement } = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      slot: { slotId: 'slot_nope' },
    });
    expect(placement).toBeNull();
  });

  it('never calls a server decision endpoint — evaluation is in-process', async () => {
    await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'pro',
      entitlementHandles: ['advanced_export'],
      placementIds: ['pl_nope'],
      slot: { slotId: 'slot_nope' },
    });
    expect(fetchCalls.filter((u) => u.includes('/api/sdk/evaluate'))).toEqual([]);
    expect(fetchCalls.filter((u) => u.includes('/api/config/export'))).toEqual([]);
    // The one tolerated call: the SDK's 404-safe theme-override probe.
    const unexpected = fetchCalls.filter((u) => !u.includes('/api/sdk/theme'));
    expect(unexpected).toEqual([]);
  });
});
