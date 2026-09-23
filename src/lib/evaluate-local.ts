/**
 * Local evaluation core (plan 192): evaluation is a pure function of
 * (UserContext, Playbook). The CLI fetches a config version (web acting as
 * playbook host) and evaluates IN-PROCESS through the public SDK's headless
 * engine — the same engine every customer SDK embeds. There is no server
 * decision endpoint.
 *
 * Clean-room semantics: in-memory state only — no suppression or cap
 * history — so evaluations are deterministic for version comparisons (what
 * `--draft` always documented; now true for every selector).
 *
 * Decision context (BL-0123): the engine decides on more than plan + traits.
 * Usage, trial state and the clock are passed through under the SDK's own
 * names — `user.usage`, `localRuntime.initialData.trialStatus`, and
 * `setTrialInstances(…, { nowIso })` — so a usage-threshold or trial placement
 * decides here exactly as it does in a customer's app. Candidate construction
 * and payload selection stay entirely inside the shipped resolver; this module
 * never builds a candidate of its own (the multi-payload candidacy fix,
 * BL-0122, lives in `@revt-eng/core` and reaches us through the published SDK).
 *
 * Note: local_only init makes one tolerated network call (a theme-override
 * probe); a failed/404 response is ignored by the SDK and never affects
 * decisions. Nothing here posts a user context to any server.
 */
import { initRevTurbine } from '@revturbine/sdk/headless';
import type { UsageEntryInput } from './evaluate-context';

type SessionOptions = Parameters<typeof initRevTurbine>[0];
type Session = Awaited<ReturnType<typeof initRevTurbine>>;
type PlacementRequest = Parameters<Session['getPlacement']>[0];
type TrialInstances = Parameters<Session['sdk']['setTrialInstances']>[0];

export interface EvaluateLocalInput {
  userId: string;
  /** Plan `unique_handle` the user is evaluated as (from ctx or --plan-handle). */
  planHandle?: string;
  /** Free-form traits — passed under the customer-owned `custom` namespace. */
  traits?: Record<string, string | number | boolean>;
  /** Usage entries keyed by entitlement handle → the SDK's `user.usage`. */
  usage?: Record<string, UsageEntryInput>;
  /** Trial status → the SDK's `localRuntime.initialData.trialStatus`. */
  trialStatus?: Record<string, unknown>;
  /** Trial instances the SDK derives a status from at {@link nowIso}. */
  trialInstances?: Record<string, unknown>[];
  /** Clock pin (ISO-8601) → the SDK's `nowIso`. */
  nowIso?: string;
  /** Entitlement handles to check (checkEntitlement each). */
  entitlementHandles?: string[];
  /** Placement ids/names to decide (one decision each). */
  placementIds?: string[];
  /** Slot-keyed resolution: the winning placement for a slot/component type. */
  slot?: { slotId?: string; componentType?: string; surfaceType?: string };
}

export interface EvaluateLocalResult {
  decisions: unknown[];
  /**
   * The payload the resolver chose, keyed by the placement id/name asked for —
   * `null` when the placement produced no visible payload. The SDK's decision
   * identifies a placement by its anchor hash, so without this the operator
   * cannot tell which authored payload won (the whole point of a multi-payload
   * placement).
   */
  payloadIds: Record<string, string | null>;
  entitlements: Record<string, unknown>;
  placement: unknown;
  /** The SDK's own personalization-token map for this context. */
  personalizationTokens: Record<string, unknown>;
  /**
   * The trial status the SDK is deciding with — the explicit one passed in, or
   * the one it derived from `trialInstances` at `nowIso`. Reported because trial
   * placements are otherwise undebuggable: the resolver's decision content
   * still carries `{{trial_days_remaining}}` verbatim (the shipped resolver
   * interpolates usage tokens into content but not trial ones), so this is
   * where the operator reads the number the gate used.
   */
  trialStatus?: unknown;
}

/**
 * Resolve the component type at the sole `surfaceType` compatibility boundary.
 * The canonical name wins when both names are supplied.
 */
export function resolvePlacementComponentType(
  input: { componentType?: string; surfaceType?: string },
): string | undefined {
  return input.componentType ?? input.surfaceType;
}

/** Read the payload id off an SDK placement decision, when one was chosen. */
function payloadIdOf(decision: unknown): string | null {
  if (typeof decision !== 'object' || decision === null) return null;
  const output = (decision as { output?: unknown }).output;
  if (typeof output !== 'object' || output === null) return null;
  const id = (output as { output_id?: unknown }).output_id;
  return typeof id === 'string' ? id : null;
}

/**
 * Complete usage entries the operator gave without a `limit`.
 *
 * A `usage_threshold` trigger compares consumption against the entitlement's
 * limit, and that limit is authored in the Playbook, not in the ctx file. So
 * ask the SDK for it (`checkEntitlement`) rather than reading the Playbook
 * here — the engine stays the single interpreter of its own rules.
 */
async function completeUsageLimits(
  session: Session,
  usage: Record<string, UsageEntryInput>,
): Promise<void> {
  let completed = false;
  const filled: Record<string, UsageEntryInput> = {};
  for (const [handle, entry] of Object.entries(usage)) {
    if (entry.limit !== undefined) {
      filled[handle] = entry;
      continue;
    }
    const result = (await session.checkEntitlement(entry.entitlement_handle)) as { limit?: unknown };
    if (typeof result?.limit === 'number' && Number.isFinite(result.limit)) {
      filled[handle] = { ...entry, limit: result.limit };
      completed = true;
    } else {
      filled[handle] = entry;
    }
  }
  if (completed) session.setUserContext({ usage: filled } as Parameters<Session['setUserContext']>[0]);
}

/** Evaluate a user context against a Playbook, entirely in-process. */
export async function evaluateLocal(
  config: unknown,
  input: EvaluateLocalInput,
): Promise<EvaluateLocalResult> {
  const user: Record<string, unknown> = { id: input.userId };
  if (input.planHandle) user.plan_handle = input.planHandle;
  if (input.traits && Object.keys(input.traits).length > 0) user.custom = input.traits;
  if (input.usage) user.usage = input.usage;

  // The config is operator-supplied JSON already validated server-side at
  // export; the SDK re-validates/normalizes it at the localRuntime boundary.
  const session = await initRevTurbine({
    user,
    localRuntime: {
      playbook: config,
      ...(input.trialStatus ? { initialData: { trialStatus: input.trialStatus } } : {}),
    },
  } as SessionOptions);

  // Trial derivation from instance records is the one decision the clock
  // actually moves: the SDK resolves the tenant's free/reverse trial rules
  // against the instances at `nowIso` and pushes the resulting status into the
  // context that gates trial_progress / trial_ending / trial_ended.
  if (input.trialInstances) {
    await session.sdk.setTrialInstances(
      input.trialInstances as unknown as TrialInstances,
      input.nowIso ? { nowIso: input.nowIso } : undefined,
    );
  }
  const trialAsked = Boolean(input.trialInstances || input.trialStatus);
  const trialStatus = trialAsked ? await session.getTrialStatus() : undefined;

  if (input.usage) await completeUsageLimits(session, input.usage);

  const entitlements: Record<string, unknown> = {};
  for (const handle of input.entitlementHandles ?? []) {
    entitlements[handle] = await session.checkEntitlement(handle);
  }

  const decisions: unknown[] = [];
  const payloadIds: Record<string, string | null> = {};
  for (const placementId of input.placementIds ?? []) {
    const controller = session.placement({ placement: { name: placementId } });
    await controller.load();
    const decision = controller.state.decision;
    decisions.push(decision);
    payloadIds[placementId] = payloadIdOf(decision);
  }

  const componentType = input.slot ? resolvePlacementComponentType(input.slot) : undefined;
  const placement =
    input.slot && (input.slot.slotId || componentType)
      ? await session.getPlacement({
          ...(input.slot.slotId ? { slotId: input.slot.slotId } : {}),
          ...(componentType ? { componentType } : {}),
          ...(input.planHandle ? { planHandle: input.planHandle } : {}),
        } as PlacementRequest)
      : null;

  return {
    decisions,
    payloadIds,
    entitlements,
    placement,
    personalizationTokens: session.sdk.getPersonalizationTokens(),
    ...(trialStatus !== undefined ? { trialStatus } : {}),
  };
}
