/**
 * Headless CLI signup flow (plan 101). Mirrors device-auth.ts: pure functions
 * take a `FetchLike` so the flow is unit-testable, and the orchestrator wires
 * them to real fetch + the credential store.
 *
 * Flow: create account → (OTP emailed) → prompt + verify OTP → mint a token
 * from the verified email+password → persist it (same store as `login`). No
 * browser. A domain-claimed business email returns `awaiting_invitation` and
 * exits without a token (an admin must invite the user).
 */
import os from 'node:os';

import { type FetchLike } from './device-auth';
import { saveCredential, redactToken, type StoredCredential } from './credentials';

function trimUrl(u: string): string {
  return u.replace(/\/+$/, '');
}

export type SignupOutcome =
  | { outcome: 'verification_required'; email: string; message?: string }
  | { outcome: 'awaiting_invitation'; message?: string };

export type SignupToken = { access_token: string; token_type: string; tenant_id: string | null };

/** Read a JSON error body's message, falling back to the status. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: unknown; message?: string };
  const detail = Array.isArray(body.detail) ? body.detail.join('; ') : typeof body.detail === 'string' ? body.detail : undefined;
  return body.message ?? detail ?? body.error ?? `${fallback} (${res.status})`;
}

/** POST /api/cli/signup — create the account; returns the server's outcome. */
export async function startSignup(
  baseUrl: string,
  body: { name: string; email: string; password: string },
  fetchImpl: FetchLike,
): Promise<SignupOutcome> {
  const res = await fetchImpl(`${trimUrl(baseUrl)}/api/cli/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Signup failed'));
  return (await res.json()) as SignupOutcome;
}

/** POST /api/cli/signup/verify — submit the emailed OTP. Throws on an invalid code. */
export async function verifyOtp(
  baseUrl: string,
  email: string,
  otp: string,
  fetchImpl: FetchLike,
): Promise<void> {
  const res = await fetchImpl(`${trimUrl(baseUrl)}/api/cli/signup/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Verification failed'));
}

/** POST /api/cli/signup/token — mint a client token for the verified account. */
export async function mintSignupToken(
  baseUrl: string,
  email: string,
  password: string,
  label: string | null,
  fetchImpl: FetchLike,
): Promise<SignupToken> {
  const res = await fetchImpl(`${trimUrl(baseUrl)}/api/cli/signup/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(label ? { email, password, label } : { email, password }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Token request failed'));
  return (await res.json()) as SignupToken;
}

/**
 * Orchestrate the full signup. Returns `signed_in` with the token (persisted),
 * or `awaiting_invitation` for a domain-claimed account. `promptOtp` is injected
 * so the CLI can read it interactively and tests can supply codes; it is called
 * with the attempt number (1-based) and may be retried on an invalid code.
 */
export async function signup(opts: {
  baseUrl: string;
  name: string;
  email: string;
  password: string;
  promptOtp: (attempt: number) => Promise<string>;
  log?: (msg: string) => void;
  fetchImpl?: FetchLike;
  saveCredentialImpl?: (baseUrl: string, cred: StoredCredential) => void;
  maxOtpAttempts?: number;
}): Promise<{ status: 'signed_in'; token: SignupToken } | { status: 'awaiting_invitation' }> {
  const log = opts.log ?? console.log;
  const fetchImpl = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  const save = opts.saveCredentialImpl ?? saveCredential;
  const maxAttempts = opts.maxOtpAttempts ?? 3;

  const outcome = await startSignup(
    opts.baseUrl,
    { name: opts.name, email: opts.email, password: opts.password },
    fetchImpl,
  );

  if (outcome.outcome === 'awaiting_invitation') {
    log(
      outcome.message ??
        'Your email domain belongs to an existing workspace — an admin must invite you. Check your email.',
    );
    return { status: 'awaiting_invitation' };
  }

  log(`\nAccount created. Enter the verification code emailed to ${opts.email}.`);

  // Retry the OTP a few times on an invalid/expired code (within the server's
  // per-email rate limit) for a fat-fingered entry.
  for (let attempt = 1; ; attempt++) {
    const otp = (await opts.promptOtp(attempt)).trim();
    try {
      await verifyOtp(opts.baseUrl, opts.email, otp, fetchImpl);
      break;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      log(`  ${(err as Error).message} — try again (${attempt}/${maxAttempts}).`);
    }
  }

  const token = await mintSignupToken(
    opts.baseUrl,
    opts.email,
    opts.password,
    os.hostname(),
    fetchImpl,
  );

  save(opts.baseUrl, {
    token: token.access_token,
    tenant_id: token.tenant_id ?? null,
    created_at: new Date().toISOString(),
  });

  log(`\n✓ Signed up and logged in. Token stored for ${opts.baseUrl} (${redactToken(token.access_token)}).`);
  return { status: 'signed_in', token };
}
