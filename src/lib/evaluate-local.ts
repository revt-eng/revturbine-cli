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
 * Note: local_only init makes one tolerated network call (a theme-override
 * probe); a failed/404 response is ignored by the SDK and never affects
 * decisions. Nothing here posts a user context to any server.
 */
import { initRevTurbine } from '@revturbine/sdk/headless';

type SessionOptions = Parameters<typeof initRevTurbine>[0];
type Session = Awaited<ReturnType<typeof initRevTurbine>>;
type PlacementRequest = Parameters<Session['getPlacement']>[0];

export interface EvaluateLocalInput {
  userId: string;
  /** Plan `unique_handle` the user is evaluated as (from ctx or --plan-handle). */
  planHandle?: string;
  /** Free-form traits — passed under the customer-owned `custom` namespace. */
  traits?: Record<string, string | number | boolean>;
  /** Entitlement handles to check (checkEntitlement each). */
  entitlementHandles?: string[];
  /** Placement ids/names to decide (one decision each). */
  placementIds?: string[];
  /** Surface-keyed resolution: the winning placement for a slot/surface type. */
  slot?: { slotId?: string; surfaceType?: string };
}

export interface EvaluateLocalResult {
  decisions: unknown[];
  entitlements: Record<string, unknown>;
  placement: unknown;
}

/** Evaluate a user context against a Playbook, entirely in-process. */
export async function evaluateLocal(
  config: unknown,
  input: EvaluateLocalInput,
): Promise<EvaluateLocalResult> {
  const user: Record<string, unknown> = { id: input.userId };
  if (input.planHandle) user.plan_handle = input.planHandle;
  if (input.traits && Object.keys(input.traits).length > 0) user.custom = input.traits;

  // The config is operator-supplied JSON already validated server-side at
  // export; the SDK re-validates/normalizes it at the localRuntime boundary.
  const session = await initRevTurbine({
    user,
    localRuntime: { playbook: config },
  } as SessionOptions);

  const entitlements: Record<string, unknown> = {};
  for (const handle of input.entitlementHandles ?? []) {
    entitlements[handle] = await session.checkEntitlement(handle);
  }

  const decisions: unknown[] = [];
  for (const placementId of input.placementIds ?? []) {
    const controller = session.placement({ placement: { name: placementId } });
    await controller.load();
    decisions.push(controller.state.decision);
  }

  const placement =
    input.slot && (input.slot.slotId || input.slot.surfaceType)
      ? await session.getPlacement({
          ...(input.slot.slotId ? { slotId: input.slot.slotId } : {}),
          ...(input.slot.surfaceType ? { surfaceType: input.slot.surfaceType } : {}),
          ...(input.planHandle ? { planHandle: input.planHandle } : {}),
        } as PlacementRequest)
      : null;

  return { decisions, entitlements, placement };
}
