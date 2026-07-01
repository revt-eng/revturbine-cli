/**
 * Plan 112 TASK-6 — CLI control-plane event emit.
 *
 * Pins that online commands emit and offline/auth commands are excluded
 * (AC-5), and that `trackEvent` POSTs to /api/events with the device token,
 * no-ops when logged out, and never throws.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCredentialMock } = vi.hoisted(() => ({ getCredentialMock: vi.fn() }));

vi.mock('./credentials', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, getCredential: getCredentialMock };
});

import { trackEvent, shouldTrackCommandExecution, CLI_UNTRACKED_COMMANDS } from './track';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getCredentialMock.mockReset();
  fetchMock = vi.fn(async () => new Response('{}', { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shouldTrackCommandExecution', () => {
  it('tracks online product commands', () => {
    expect(shouldTrackCommandExecution('deploy', true)).toBe(true);
    expect(shouldTrackCommandExecution('upload', true)).toBe(true);
  });

  it('never tracks auth or offline commands', () => {
    for (const name of CLI_UNTRACKED_COMMANDS) {
      expect(shouldTrackCommandExecution(name, true)).toBe(false);
    }
    // Offline: no connection (verify) — nothing to emit even if not excluded.
    expect(shouldTrackCommandExecution('deploy', false)).toBe(false);
  });
});

describe('trackEvent', () => {
  it('POSTs to /api/events with the device token when logged in', async () => {
    getCredentialMock.mockReturnValue({ token: 'tok_abc', tenant_id: 'tn_acme' });
    await trackEvent('https://app.revturbine.com', undefined, 'cli_command_executed', { command: 'deploy' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [urlArg, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(urlArg).toBe('https://app.revturbine.com/api/events');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok_abc');
    expect(headers['x-tenant-id']).toBe('tn_acme');
    expect(JSON.parse(String(init.body))).toEqual({
      event_type: 'cli_command_executed',
      payload: { command: 'deploy' },
    });
  });

  it('honors an explicit --tenant-id override for the header', async () => {
    getCredentialMock.mockReturnValue({ token: 'tok_abc', tenant_id: 'tn_acme' });
    await trackEvent('https://app.revturbine.com', 'tn_override', 'cli_signed_in');
    const init = (fetchMock.mock.calls[0] as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)['x-tenant-id']).toBe('tn_override');
  });

  it('no-ops when not logged in (no credential)', async () => {
    getCredentialMock.mockReturnValue(undefined);
    await trackEvent('https://app.revturbine.com', undefined, 'cli_command_executed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws when the request fails', async () => {
    getCredentialMock.mockReturnValue({ token: 'tok_abc', tenant_id: 'tn_acme' });
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    await expect(
      trackEvent('https://app.revturbine.com', undefined, 'cli_command_executed'),
    ).resolves.toBeUndefined();
  });
});
