/**
 * CLI device-authorization client (RFC 8628), plan 64.
 *
 * Drives the browser-login flow against revturbine-web:
 *   1. POST /api/cli/device/code  → device_code + user_code + verification URL
 *   2. show the user_code, open the browser to the verification URL
 *   3. poll POST /api/cli/device/token until approved (honouring interval /
 *      slow_down / expiry), then persist the returned token.
 *
 * The network/state-machine pieces take injectable `fetch`/`sleep` so they can
 * be unit-tested deterministically.
 */
import { spawn } from 'node:child_process';
import os from 'node:os';

import { redactToken, saveCredential } from './credentials';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

export type DeviceToken = {
  access_token: string;
  token_type: string;
  tenant_id: string | null;
};

function trimUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export async function startDeviceAuth(
  baseUrl: string,
  label: string | null,
  fetchImpl: FetchLike,
): Promise<DeviceCodeResponse> {
  const res = await fetchImpl(`${trimUrl(baseUrl)}/api/cli/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(label ? { label } : {}),
  });
  if (!res.ok) {
    throw new Error(`Could not start device login (${res.status}). Is ${baseUrl} reachable?`);
  }
  return (await res.json()) as DeviceCodeResponse;
}

/**
 * Poll the token endpoint until the grant is approved. Honours `slow_down`
 * (back off by 5s), `authorization_pending` (keep waiting), and gives up on
 * `access_denied` / `expired_token` / the overall expiry deadline.
 */
export async function pollForToken(opts: {
  baseUrl: string;
  deviceCode: string;
  intervalSeconds: number;
  expiresInSeconds: number;
  fetchImpl: FetchLike;
  sleep: (ms: number) => Promise<void>;
  now?: () => number;
  onPending?: () => void;
}): Promise<DeviceToken> {
  const now = opts.now ?? (() => Date.now());
  const startedAt = now();
  let interval = opts.intervalSeconds;

  for (;;) {
    if (now() - startedAt > opts.expiresInSeconds * 1000) {
      throw new Error('Device code expired before authorization. Run --login again.');
    }
    await opts.sleep(interval * 1000);

    const res = await opts.fetchImpl(`${trimUrl(opts.baseUrl)}/api/cli/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: opts.deviceCode }),
    });

    if (res.ok) {
      return (await res.json()) as DeviceToken;
    }

    const body = (await res.json().catch(() => ({}))) as { error?: string };
    switch (body.error) {
      case 'authorization_pending':
        opts.onPending?.();
        continue;
      case 'slow_down':
        interval += 5;
        continue;
      case 'access_denied':
        throw new Error('Authorization was denied in the browser.');
      case 'expired_token':
        throw new Error('Device code expired. Run --login again.');
      default:
        throw new Error(`Authorization failed: ${body.error ?? `HTTP ${res.status}`}`);
    }
  }
}

/** Best-effort cross-platform "open this URL in the default browser". */
export function openBrowser(url: string): void {
  try {
    const cmd =
      process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    // A missing opener (e.g. xdg-open in a headless Codespace / CI) surfaces
    // as an asynchronous 'error' event on the child, NOT a synchronous throw —
    // so the surrounding try/catch can't catch it, and an unhandled 'error'
    // event crashes the process. Swallow it: the user can open the printed URL.
    child.on('error', () => {});
    child.unref();
  } catch {
    // Headless / no browser — the user can open the printed URL manually.
  }
}

/** Full --login orchestration: start → prompt → open browser → poll → persist. */
export async function deviceLogin(
  baseUrl: string,
  log: (msg: string) => void = console.log,
): Promise<DeviceToken> {
  const start = await startDeviceAuth(baseUrl, os.hostname(), fetch as unknown as FetchLike);

  log('');
  log(`To authorize this device, visit:\n    ${start.verification_uri}`);
  log(`and enter the code:  ${start.user_code}`);
  log('\nOpening your browser… (waiting for approval)');
  openBrowser(start.verification_uri_complete);

  const token = await pollForToken({
    baseUrl,
    deviceCode: start.device_code,
    intervalSeconds: start.interval,
    expiresInSeconds: start.expires_in,
    fetchImpl: fetch as unknown as FetchLike,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    onPending: () => process.stdout.write('.'),
  });

  saveCredential(baseUrl, {
    token: token.access_token,
    tenant_id: token.tenant_id ?? null,
    created_at: new Date().toISOString(),
  });

  log(`\n✓ Logged in. Token stored for ${baseUrl} (${redactToken(token.access_token)}).`);
  return token;
}
