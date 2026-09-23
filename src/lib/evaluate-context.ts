/**
 * Decision-context parsing for `evaluate` (BL-0123).
 *
 * `evaluate` is only as faithful as the context it hands the engine. Before
 * this module the CLI passed `plan_handle` and `traits` and nothing else: no
 * usage, no trial state, and `now_iso` was read purely to print
 * "now_iso is ignored". Usage-threshold and trial placements are therefore
 * undecidable from the CLI even though the spec has always listed
 * "usage/credits, now_iso" among the ctx file's inputs
 * (docs/specs/cli/cli.md §Inspect → `evaluate`).
 *
 * The names here are the SDK's, deliberately, so the CLI is a faithful driver
 * rather than a second dialect:
 *
 * | ctx / flag                | SDK input                                  |
 * |---------------------------|--------------------------------------------|
 * | `usage` / `--usage`       | `user.usage` (`RevTurbineUserContext`)      |
 * | `trial` / `--trial-status`| `localRuntime.initialData.trialStatus`     |
 * | `trial_instances`         | `sdk.setTrialInstances(instances, …)`       |
 * | `now_iso` / `--now`       | that call's `nowIso` clock pin              |
 *
 * Pure: takes the parsed ctx object plus raw flag strings and returns either a
 * normalized context or a list of human-readable errors. `cli.ts` owns IO and
 * turns the errors into `fail(EXIT.VALIDATION, …)`.
 */

/** A usage entry as the SDK's `UserUsageEntry` shape requires it. */
export interface UsageEntryInput {
  entitlement_handle: string;
  unit: string;
  amount: number;
  limit?: number;
  reset_date?: string;
}

/** The decision context `evaluate` hands the local runtime. */
export interface DecisionContext {
  /** Usage entries keyed by entitlement handle. */
  usage?: Record<string, UsageEntryInput>;
  /** Explicit trial status (the SDK's `UserTrialStatus`). */
  trialStatus?: Record<string, unknown>;
  /** Trial instance records the SDK derives a status from. */
  trialInstances?: Record<string, unknown>[];
  /** Clock pin, ISO-8601. */
  nowIso?: string;
}

/** Either a parsed context or the reasons it could not be parsed. */
export type DecisionContextResult =
  | { ok: true; context: DecisionContext }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Default unit when a usage entry gives only an amount. */
const DEFAULT_USAGE_UNIT = 'unit';

/**
 * Normalize one `usage` map entry.
 *
 * Two authoring forms, both spec-legal ("usage/credits"):
 * - a bare number — the amount consumed;
 * - an object with `amount` and optionally `limit` / `unit` / `reset_date`.
 *
 * `limit` is what a `usage_threshold` / `credit_threshold` trigger compares
 * against, so when it is absent the caller completes it from the Playbook's own
 * entitlement rule via the SDK — never by guessing here.
 */
function normalizeUsageEntry(
  handle: string,
  value: unknown,
  errors: string[],
): UsageEntryInput | undefined {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`usage.${handle} must be a finite number ≥ 0`);
      return undefined;
    }
    return { entitlement_handle: handle, unit: DEFAULT_USAGE_UNIT, amount: value };
  }

  if (!isRecord(value)) {
    errors.push(`usage.${handle} must be a number or an object with "amount"`);
    return undefined;
  }

  const amount = value.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    errors.push(`usage.${handle}.amount must be a finite number ≥ 0`);
    return undefined;
  }

  const entry: UsageEntryInput = {
    entitlement_handle: typeof value.entitlement_handle === 'string' ? value.entitlement_handle : handle,
    unit: typeof value.unit === 'string' && value.unit.length > 0 ? value.unit : DEFAULT_USAGE_UNIT,
    amount,
  };

  if (value.limit !== undefined) {
    if (typeof value.limit !== 'number' || !Number.isFinite(value.limit) || value.limit < 0) {
      errors.push(`usage.${handle}.limit must be a finite number ≥ 0`);
    } else {
      entry.limit = value.limit;
    }
  }
  if (value.reset_date !== undefined) {
    if (typeof value.reset_date !== 'string') {
      errors.push(`usage.${handle}.reset_date must be a string`);
    } else {
      entry.reset_date = value.reset_date;
    }
  }

  return entry;
}

/** Normalize a whole `usage` map. Returns undefined when there is nothing to pass. */
export function normalizeUsage(value: unknown, errors: string[]): Record<string, UsageEntryInput> | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    errors.push('usage must be an object keyed by entitlement handle');
    return undefined;
  }
  const out: Record<string, UsageEntryInput> = {};
  for (const [handle, raw] of Object.entries(value)) {
    const entry = normalizeUsageEntry(handle, raw, errors);
    if (entry) out[handle] = entry;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Validate a trial status object at the shape the SDK's `UserTrialStatus`
 * requires — `in_trial` is the one mandatory field; everything else is
 * forwarded untouched so the SDK, not the CLI, owns the semantics.
 */
export function normalizeTrialStatus(value: unknown, errors: string[]): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    errors.push('trial status must be an object (the SDK\'s UserTrialStatus)');
    return undefined;
  }
  if (typeof value.in_trial !== 'boolean') {
    errors.push('trial status must carry a boolean "in_trial"');
    return undefined;
  }
  return value;
}

/** Validate `trial_instances`. */
function normalizeTrialInstances(value: unknown, errors: string[]): Record<string, unknown>[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    errors.push('trial_instances must be an array of TrialInstance objects');
    return undefined;
  }
  return value.length > 0 ? (value as Record<string, unknown>[]) : undefined;
}

/**
 * Accept an ISO-8601 instant. Deliberately strict: a clock pin that silently
 * parses to `Invalid Date` would make `--now` look honoured while the engine
 * fell back to the real clock — the exact failure this work exists to remove.
 */
export function normalizeNowIso(value: unknown, source: string, errors: string[]): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${source} must be an ISO-8601 timestamp (e.g. 2026-09-21T00:00:00Z)`);
    return undefined;
  }
  return new Date(value).toISOString();
}

/** Parse an inline JSON flag value. */
function parseJsonFlag(raw: string, flag: string, errors: string[]): unknown {
  try {
    return JSON.parse(raw);
  } catch (err) {
    errors.push(`${flag} must be valid JSON: ${(err as Error).message}`);
    return undefined;
  }
}

/**
 * Build the decision context from the ctx file and the CLI overrides.
 *
 * Flags win over the ctx file for the same input, matching every other
 * `evaluate` override (`--plan-handle` over `ctx.plan_handle`).
 */
export function parseDecisionContext(input: {
  ctx: Record<string, unknown>;
  usage?: string;
  trialStatus?: string;
  now?: string;
}): DecisionContextResult {
  const errors: string[] = [];

  const usageSource = input.usage !== undefined
    ? parseJsonFlag(input.usage, '--usage', errors)
    : input.ctx.usage;
  const usage = normalizeUsage(usageSource, errors);

  const trialSource = input.trialStatus !== undefined
    ? parseJsonFlag(input.trialStatus, '--trial-status', errors)
    : input.ctx.trial;
  const trialStatus = normalizeTrialStatus(trialSource, errors);

  const trialInstances = normalizeTrialInstances(input.ctx.trial_instances, errors);

  const nowIso = input.now !== undefined
    ? normalizeNowIso(input.now, '--now', errors)
    : normalizeNowIso(input.ctx.now_iso, 'now_iso', errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    context: {
      ...(usage ? { usage } : {}),
      ...(trialStatus ? { trialStatus } : {}),
      ...(trialInstances ? { trialInstances } : {}),
      ...(nowIso ? { nowIso } : {}),
    },
  };
}
