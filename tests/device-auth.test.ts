import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn: spawnMock }));

import { openBrowser, pollForToken, startDeviceAuth, type FetchLike } from '../src/lib/device-auth';

function resp(ok: boolean, body: unknown, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

/** A FetchLike that returns the given responses in order (repeats the last). */
function seq(responses: Response[]): FetchLike {
  let i = 0;
  return async () => responses[Math.min(i++, responses.length - 1)];
}

const noopSleep = async () => {};

const TOKEN = { access_token: 'rtk_secret', token_type: 'Bearer', tenant_id: 'tenant_1' };

describe('openBrowser', () => {
  it('swallows an async spawn error event (headless — no xdg-open) instead of crashing', () => {
    // A missing opener emits an async 'error' on the child; an EventEmitter
    // with no 'error' listener re-throws it (Node special-case). The fix
    // attaches an 'error' listener, so emitting must not throw.
    const child = new EventEmitter() as EventEmitter & { unref: () => void };
    child.unref = () => {};
    spawnMock.mockReturnValue(child);

    expect(() => openBrowser('https://app/cli/device')).not.toThrow();
    expect(() => child.emit('error', new Error('spawn xdg-open ENOENT'))).not.toThrow();
  });
});

describe('startDeviceAuth', () => {
  it('returns the device-code payload on success', async () => {
    const payload = {
      device_code: 'dc',
      user_code: 'WDJB-MJHT',
      verification_uri: 'https://app/cli/device',
      verification_uri_complete: 'https://app/cli/device?user_code=WDJB-MJHT',
      expires_in: 600,
      interval: 5,
    };
    const out = await startDeviceAuth('https://app', 'host', seq([resp(true, payload)]));
    expect(out).toEqual(payload);
  });

  it('throws when the start request fails', async () => {
    await expect(startDeviceAuth('https://app', null, seq([resp(false, {}, 500)]))).rejects.toThrow(
      /could not start device login/i,
    );
  });
});

describe('pollForToken', () => {
  const base = {
    baseUrl: 'https://app',
    deviceCode: 'dc',
    intervalSeconds: 5,
    expiresInSeconds: 600,
    sleep: noopSleep,
  };

  it('keeps polling while authorization_pending, then returns the token', async () => {
    const fetchImpl = seq([resp(false, { error: 'authorization_pending' }), resp(true, TOKEN)]);
    const token = await pollForToken({ ...base, fetchImpl });
    expect(token.access_token).toBe('rtk_secret');
  });

  it('backs off by 5s on slow_down', async () => {
    const sleeps: number[] = [];
    const fetchImpl = seq([resp(false, { error: 'slow_down' }), resp(true, TOKEN)]);
    await pollForToken({ ...base, fetchImpl, sleep: async (ms: number) => void sleeps.push(ms) });
    expect(sleeps[0]).toBe(5000);
    expect(sleeps[1]).toBe(10000); // interval increased by 5s
  });

  it('throws on access_denied', async () => {
    const fetchImpl = seq([resp(false, { error: 'access_denied' })]);
    await expect(pollForToken({ ...base, fetchImpl })).rejects.toThrow(/denied/i);
  });

  it('throws on expired_token', async () => {
    const fetchImpl = seq([resp(false, { error: 'expired_token' })]);
    await expect(pollForToken({ ...base, fetchImpl })).rejects.toThrow(/expired/i);
  });

  it('gives up when the overall deadline passes', async () => {
    let call = 0;
    const now = () => (call++ === 0 ? 0 : 9_999_999_999);
    const fetchImpl = seq([resp(true, TOKEN)]);
    await expect(pollForToken({ ...base, fetchImpl, now })).rejects.toThrow(
      /expired before authorization/i,
    );
  });
});
