/**
 * BUG-1195 — the day-12 reverse-trial case, on the current build.
 *
 * The original run (Huddle, CLI 0.21.0 / schema 0.1.503, 2026-10-23) reported
 * `in_trial: true` but denied the trial grants and returned no trial
 * placement, while the SDK on the same draft granted them. The Huddle Playbook
 * and user-context file were not preserved, so this reproduces the shape from
 * its description: a free base plan, an active reverse-trial instance on day 12
 * of 14, and a rule whose premium plan grants the entitlements. It runs through
 * the same shipped SDK the CLI bundles.
 *
 * Verdict on the current build before the fix (recorded on BUG-1195): DIVERGENT.
 * The status derived from the trial instances read in_trial with no
 * `plan_handle`, and the SDK needs the base plan to match the reverse-trial rule,
 * so `task_history` was denied (no_matching_entitlement_rule) and `members`
 * stayed at the free limit of 3. The CLI never passed the user's plan as the
 * SDK's `basePlanHandle`; evaluate-local.ts now does.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { evaluateLocal } from '../src/lib/evaluate-local';

const playbook = {
  artifact_type: 'playbook',
  format_version: '1.0.0',
  playbook_handle: 'default',
  plans: [
    { id: 'plan_free', unique_handle: 'free', name: 'Free', tier_position: 0, sort_order: 0 },
    { id: 'plan_team', unique_handle: 'team', name: 'Team', tier_position: 1, sort_order: 1 },
  ],
  entitlements: [
    { id: 'ent_task_history', unique_handle: 'task_history', name: 'Task history', type: 'feature' },
    { id: 'ent_members', unique_handle: 'members', name: 'Members', type: 'usage_limit', unit: 'members' },
  ],
  entitlement_rules: [
    { id: 'er_hist_team', entitlement_id: 'task_history', targets: [{ kind: 'plan', id: 'team' }], segment_ids: [], kind: 'feature', enabled: true },
    { id: 'er_mem_free', entitlement_id: 'members', targets: [{ kind: 'plan', id: 'free' }], segment_ids: [], kind: 'usage_limit', unit: 'members', enabled: true, limit_value: 3, current_usage: 0 },
    { id: 'er_mem_team', entitlement_id: 'members', targets: [{ kind: 'plan', id: 'team' }], segment_ids: [], kind: 'usage_limit', unit: 'members', enabled: true, limit_value: 25, current_usage: 0 },
  ],
  reverse_trial_rules: [
    {
      id: 'rtr_team',
      name: 'Team reverse trial',
      handle: 'team_reverse_trial',
      premium_plan_id: 'team',
      fallback_plan_id: 'free',
      trial_limit_type: 'time',
      duration_days: 14,
      start_policy: 'signup',
      entitlements_during_trial: ['task_history', 'members'],
      is_active: true,
    },
  ],
  segments: [],
  content_ui_paths: [],
  surface_templates: [],
  placements: [],
};

const instance = {
  id: 'ti_day12',
  tenant_id: 'local',
  customer_id: 'cust_1',
  rule_id: 'rtr_team',
  rule_type: 'reverse_trial',
  plan_id: 'plan_team',
  status: 'active',
  started_at: '2026-10-11T00:00:00.000Z',
  expires_at: '2026-10-25T00:00:00.000Z',
  trial_limit_type: 'time',
  created_at: '2026-10-11T00:00:00.000Z',
  updated_at: '2026-10-11T00:00:00.000Z',
};

const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = (async () => new Response('{}', { status: 404 })) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('BUG-1195 day-12 reverse trial (evaluate-local)', () => {
  it('grants the trial entitlements from a free base plan, as the SDK does in an app', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'free',
      trialInstances: [instance],
      nowIso: '2026-10-23T00:00:00.000Z',
      entitlementHandles: ['task_history', 'members'],
    });
    expect(result.trialStatus).toMatchObject({ in_trial: true, state: 'running_out', days_remaining: 2, plan_handle: 'free' });
    expect(result.entitlements.task_history).toMatchObject({ allowed: true });
    expect(result.entitlements.members).toMatchObject({ allowed: true, limit: 25 });
  });

  it('keeps the free limits once the trial is no longer active', async () => {
    const result = await evaluateLocal(playbook, {
      userId: 'u1',
      planHandle: 'free',
      trialInstances: [{ ...instance, status: 'expired' }],
      nowIso: '2026-10-30T00:00:00.000Z',
      entitlementHandles: ['task_history', 'members'],
    });
    expect(result.entitlements.task_history).toMatchObject({ allowed: false });
    expect(result.entitlements.members).toMatchObject({ limit: 3 });
  });
});
