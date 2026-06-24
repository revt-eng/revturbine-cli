import { describe, expect, it, vi } from 'vitest';

import { startSignup, verifyOtp, mintSignupToken, signup } from '../src/lib/signup';
import { type FetchLike } from '../src/lib/device-auth';
import { type StoredCredential } from '../src/lib/credentials';

const BASE = 'https://x.test/app';

function resp(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** Route by URL suffix; a queued array is consumed in order (for retries). */
function router(map: Record<string, Response | Response[]>): FetchLike {
  return (async (input: string) => {
    const key = Object.keys(map).find((k) => (input as string).endsWith(k));
    if (!key) throw new Error(`no mock for ${input}`);
    const v = map[key];
    if (Array.isArray(v)) {
      const r = v.shift();
      if (!r) throw new Error(`queue empty for ${key}`);
      return r;
    }
    return v;
  }) as unknown as FetchLike;
}

describe('startSignup', () => {
  it('returns the verification_required outcome', async () => {
    const f = router({ '/api/cli/signup': resp(200, { outcome: 'verification_required', email: 'a@b.com' }) });
    const out = await startSignup(BASE, { name: 'A', email: 'a@b.com', password: 'pw' }, f);
    expect(out.outcome).toBe('verification_required');
  });

  it('returns the awaiting_invitation outcome', async () => {
    const f = router({ '/api/cli/signup': resp(200, { outcome: 'awaiting_invitation', message: 'invited soon' }) });
    const out = await startSignup(BASE, { name: 'A', email: 'a@b.com', password: 'pw' }, f);
    expect(out.outcome).toBe('awaiting_invitation');
  });

  it('throws the server message on failure', async () => {
    const f = router({ '/api/cli/signup': resp(422, { error: 'signup_failed', detail: 'User already exists' }) });
    await expect(startSignup(BASE, { name: 'A', email: 'a@b.com', password: 'pw' }, f)).rejects.toThrow(
      'User already exists',
    );
  });
});

describe('verifyOtp', () => {
  it('resolves on success', async () => {
    const f = router({ '/api/cli/signup/verify': resp(200, { verified: true }) });
    await expect(verifyOtp(BASE, 'a@b.com', '123456', f)).resolves.toBeUndefined();
  });

  it('throws on an invalid code', async () => {
    const f = router({ '/api/cli/signup/verify': resp(400, { error: 'invalid_or_expired_otp', message: 'bad code' }) });
    await expect(verifyOtp(BASE, 'a@b.com', '000000', f)).rejects.toThrow('bad code');
  });
});

describe('mintSignupToken', () => {
  it('returns the token on success', async () => {
    const f = router({
      '/api/cli/signup/token': resp(200, { access_token: 'rtk_secret', token_type: 'Bearer', tenant_id: 'tn_1' }),
    });
    const t = await mintSignupToken(BASE, 'a@b.com', 'pw', 'laptop', f);
    expect(t.access_token).toBe('rtk_secret');
    expect(t.tenant_id).toBe('tn_1');
  });

  it('throws not_verified', async () => {
    const f = router({ '/api/cli/signup/token': resp(403, { error: 'not_verified', message: 'verify first' }) });
    await expect(mintSignupToken(BASE, 'a@b.com', 'pw', null, f)).rejects.toThrow('verify first');
  });
});

describe('signup (orchestrator)', () => {
  it('signs up, verifies, mints, and persists — without leaking the token', async () => {
    const saved: StoredCredential[] = [];
    const logs: string[] = [];
    const f = router({
      '/api/cli/signup': resp(200, { outcome: 'verification_required', email: 'a@b.com' }),
      '/api/cli/signup/verify': resp(200, { verified: true }),
      '/api/cli/signup/token': resp(200, { access_token: 'rtk_supersecret', token_type: 'Bearer', tenant_id: 'tn_1' }),
    });
    const result = await signup({
      baseUrl: BASE,
      name: 'Ada',
      email: 'a@b.com',
      password: 'hunter2hunter2',
      promptOtp: async () => '123456',
      fetchImpl: f,
      saveCredentialImpl: (_b, c) => saved.push(c),
      log: (m) => logs.push(m),
    });
    expect(result.status).toBe('signed_in');
    expect(saved).toHaveLength(1);
    expect(saved[0]!.token).toBe('rtk_supersecret');
    // AC-5: the raw secret is never written to the user-facing log.
    expect(logs.join('\n')).not.toContain('rtk_supersecret');
  });

  it('stops at awaiting_invitation without prompting or persisting', async () => {
    const saved: StoredCredential[] = [];
    const promptOtp = vi.fn(async () => '000000');
    const f = router({ '/api/cli/signup': resp(200, { outcome: 'awaiting_invitation' }) });
    const result = await signup({
      baseUrl: BASE,
      name: 'Ada',
      email: 'a@corp.com',
      password: 'hunter2hunter2',
      promptOtp,
      fetchImpl: f,
      saveCredentialImpl: (_b, c) => saved.push(c),
      log: () => {},
    });
    expect(result.status).toBe('awaiting_invitation');
    expect(promptOtp).not.toHaveBeenCalled();
    expect(saved).toHaveLength(0);
  });

  it('retries the OTP on an invalid code, then succeeds', async () => {
    const promptOtp = vi.fn(async () => '111111');
    const f = router({
      '/api/cli/signup': resp(200, { outcome: 'verification_required', email: 'a@b.com' }),
      '/api/cli/signup/verify': [resp(400, { error: 'invalid_or_expired_otp', message: 'bad' }), resp(200, { verified: true })],
      '/api/cli/signup/token': resp(200, { access_token: 'rtk_x', token_type: 'Bearer', tenant_id: 'tn_1' }),
    });
    const result = await signup({
      baseUrl: BASE,
      name: 'Ada',
      email: 'a@b.com',
      password: 'hunter2hunter2',
      promptOtp,
      fetchImpl: f,
      saveCredentialImpl: () => {},
      log: () => {},
    });
    expect(result.status).toBe('signed_in');
    expect(promptOtp).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxOtpAttempts invalid codes', async () => {
    const f = router({
      '/api/cli/signup': resp(200, { outcome: 'verification_required', email: 'a@b.com' }),
      '/api/cli/signup/verify': [
        resp(400, { error: 'invalid_or_expired_otp', message: 'bad' }),
        resp(400, { error: 'invalid_or_expired_otp', message: 'bad' }),
      ],
    });
    await expect(
      signup({
        baseUrl: BASE,
        name: 'Ada',
        email: 'a@b.com',
        password: 'hunter2hunter2',
        promptOtp: async () => '111111',
        fetchImpl: f,
        saveCredentialImpl: () => {},
        log: () => {},
        maxOtpAttempts: 2,
      }),
    ).rejects.toThrow('bad');
  });
});
