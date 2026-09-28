/**
 * CLI control-plane event emit (plan 112 TASK-6).
 *
 * Dogfoods the CLI's own activity as control-plane semantic events. POSTs to the
 * authed `/api/events` endpoint, which stamps `tenant_id` server-side (always
 * RevTurbine's own tenant) and attributes the operator + their tenant from the
 * device token — a caller never controls tenant attribution. Best effort:
 * failures never fail the command; callers may bound the request with a signal.
 */
import { getCredential, normalizeBaseUrl } from './credentials';
import { HEADERS_ENV, parseExtraHeaders, resolveAuth, TOKEN_ENV } from './env-auth';

/**
 * Commands that do NOT emit a `cli_command_executed` event: the auth commands
 * emit their own (`cli_signed_in`/`cli_signed_up`) or are local-only
 * (`logout`). Offline runs are already excluded by the `hasUrl` gate below.
 */
export const CLI_UNTRACKED_COMMANDS = new Set(['login', 'signup', 'logout']);

/**
 * Whether a completed command should emit `cli_command_executed`. Requires an
 * online connection (`hasUrl`) and a command that isn't auth/offline.
 */
export function shouldTrackCommandExecution(name: string, hasUrl: boolean): boolean {
  return hasUrl && !CLI_UNTRACKED_COMMANDS.has(name);
}

/**
 * Emit one control-plane event for the current CLI session. No-op (and never
 * throws) when the machine isn't logged in — there is nothing to attribute.
 *
 * @param rawUrl - The instance base URL the command targeted.
 * @param explicitTenantId - `--tenant-id` override, if any (else the token's tenant).
 * @param eventType - A canonical control-plane event type.
 * @param payload - Optional event properties (e.g. `{ command: 'deploy' }`).
 * @param signal - Optional request deadline; whoami bounds its telemetry tail.
 */
export async function trackEvent(
  // @revturbine-graph source:revturbine-cli:src/lib/track.ts#trackEvent
  rawUrl: string,
  explicitTenantId: string | undefined,
  eventType: string,
  payload?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const url = normalizeBaseUrl(rawUrl);
    // Same precedence as every command (plan 129 TASK-2): REVTURBINE_TOKEN over
    // the stored credential, extra headers on the request. Header values ride
    // only in request headers, never in the event payload.
    const auth = resolveAuth({ envToken: process.env[TOKEN_ENV], stored: getCredential(url), explicitTenantId });
    if (!auth.token) return;
    const extra = parseExtraHeaders(process.env[HEADERS_ENV]);
    await fetch(`${url}/api/events`, {
      method: 'POST',
      headers: {
        ...(extra.ok ? extra.headers : {}),
        'Content-Type': 'application/json',
        ...(auth.tenantId ? { 'x-tenant-id': auth.tenantId } : {}),
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ event_type: eventType, payload }),
      ...(signal ? { signal } : {}),
    });
  } catch {
    // Fire-and-forget: telemetry must never break the CLI.
  }
}
