/**
 * Plan 129 TASK-2 — non-interactive CI mode: env-token precedence, extra
 * request headers, secret redaction, and the `diff --exit-code` contract.
 * Every token/header value here is a FAKE string.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_TENANT_ID,
  parseExtraHeaders,
  resolveAuth,
  withExtraHeaders,
} from '../src/lib/env-auth';
import { DIFF_EXIT, diffExitCode, EXIT, redact, registerSecrets } from '../src/lib/output';
import { diffExportedConfig } from '../src/lib/config-diff';

const stored = { token: 'rtk_fake_stored_token_0001', tenant_id: 'tn_stored' };

describe('resolveAuth — token and tenant precedence', () => {
  it('REVTURBINE_TOKEN wins over the stored credential and sends no tenant header', () => {
    const auth = resolveAuth({ envToken: 'rtk_fake_env_token_0002', stored });
    expect(auth).toMatchObject({ token: 'rtk_fake_env_token_0002', tokenSource: 'env', tenantId: null });
    expect(auth.tenantSource).toMatch(/REVTURBINE_TOKEN/);
  });

  it('with the env token, an explicit -t is still sent', () => {
    const auth = resolveAuth({ envToken: 'rtk_fake_env_token_0002', stored, explicitTenantId: 'tn_explicit' });
    expect(auth).toMatchObject({ tokenSource: 'env', tenantId: 'tn_explicit', tenantSource: '--tenant-id' });
  });

  it('a blank env token is ignored (falls back to the stored credential)', () => {
    const auth = resolveAuth({ envToken: '   ', stored });
    expect(auth).toMatchObject({ token: stored.token, tokenSource: 'stored', tenantId: 'tn_stored', tenantSource: 'stored token' });
  });

  it('trims the env token', () => {
    expect(resolveAuth({ envToken: ' rtk_fake_env_token_0002\n', stored: null }).token).toBe('rtk_fake_env_token_0002');
  });

  it('without the env token keeps the pre-existing behavior', () => {
    expect(resolveAuth({ envToken: undefined, stored, explicitTenantId: 'tn_x' })).toMatchObject({ tenantId: 'tn_x', tenantSource: '--tenant-id' });
    expect(resolveAuth({ envToken: undefined, stored: { token: 't_fake', tenant_id: null } })).toMatchObject({ tenantId: DEFAULT_TENANT_ID, tenantSource: 'default' });
    expect(resolveAuth({ envToken: undefined, stored: null })).toMatchObject({ token: null, tokenSource: 'none', tenantId: DEFAULT_TENANT_ID });
  });
});

describe('parseExtraHeaders — REVTURBINE_HTTP_HEADERS', () => {
  const SECRET = 'fake-bypass-secret-value-XYZ123';

  it('unset or blank means no headers', () => {
    expect(parseExtraHeaders(undefined)).toEqual({ ok: true, headers: {} });
    expect(parseExtraHeaders('  ')).toEqual({ ok: true, headers: {} });
  });

  it('parses a JSON object of string values', () => {
    expect(parseExtraHeaders(JSON.stringify({ 'x-vercel-protection-bypass': SECRET, 'x-extra': 'b' }))).toEqual({
      ok: true,
      headers: { 'x-vercel-protection-bypass': SECRET, 'x-extra': 'b' },
    });
  });

  const bad: Array<[string, string]> = [
    ['not JSON', `{x-vercel-protection-bypass: ${SECRET}}`],
    ['an array', JSON.stringify([SECRET])],
    ['a string', JSON.stringify(SECRET)],
    ['a non-string value', JSON.stringify({ 'x-a': { nested: SECRET } })],
    ['a control character', JSON.stringify({ 'x-a': `${SECRET}\r\nx-injected: 1` })],
    ['an invalid name', JSON.stringify({ 'bad name': SECRET })],
    ['Authorization', JSON.stringify({ Authorization: `Bearer ${SECRET}` })],
    ['x-tenant-id', JSON.stringify({ 'X-Tenant-Id': SECRET })],
    ['x-rt-tenant-id', JSON.stringify({ 'x-rt-tenant-id': SECRET })],
    ['content-type', JSON.stringify({ 'content-type': SECRET })],
  ];
  for (const [what, raw] of bad) {
    it(`rejects ${what} without echoing the value`, () => {
      const result = parseExtraHeaders(raw);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/REVTURBINE_HTTP_HEADERS/);
      expect(result.error).not.toContain(SECRET);
    });
  }
});

describe('withExtraHeaders', () => {
  it('adds the extra headers to every request without overriding the caller', async () => {
    const inner = vi.fn(async () => new Response('{}'));
    const wrapped = withExtraHeaders(inner, { 'x-vercel-protection-bypass': 'fake-bypass', 'x-a': 'extra' });
    await wrapped('https://example.test/api/cli/device/code', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-a': 'caller' } });
    const [, init] = inner.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('x-vercel-protection-bypass')).toBe('fake-bypass');
    expect(headers.get('x-a')).toBe('caller');
    expect(headers.get('content-type')).toBe('application/json');
    expect(init.method).toBe('POST');
  });

  it('is the identity when there are no extra headers', () => {
    const inner = vi.fn(async () => new Response('{}'));
    expect(withExtraHeaders(inner, {})).toBe(inner);
  });
});

describe('stderr redaction', () => {
  it('replaces every registered secret, longest first, and ignores tiny values', () => {
    registerSecrets(['rtk_fake_redact_token_AAAA', 'rtk_fake_redact_token_AAAA_longer', 'ab']);
    expect(redact('bearer rtk_fake_redact_token_AAAA_longer and rtk_fake_redact_token_AAAA; ab stays')).toBe(
      'bearer <redacted> and <redacted>; ab stays',
    );
  });
});

describe('diff --exit-code', () => {
  it('0 = no differences, 1 = differences, and the unexpected class is not 1', () => {
    const a = { plans: [{ unique_handle: 'free', name: 'Free' }] };
    expect(diffExitCode(diffExportedConfig(a, structuredClone(a)))).toBe(DIFF_EXIT.NO_DIFFERENCES);
    expect(DIFF_EXIT.NO_DIFFERENCES).toBe(0);
    expect(diffExitCode(diffExportedConfig(a, { plans: [{ unique_handle: 'free', name: 'Free!' }] }))).toBe(DIFF_EXIT.DIFFERENCES);
    expect(DIFF_EXIT.DIFFERENCES).toBe(1);
    expect(DIFF_EXIT.UNEXPECTED).not.toBe(1);
    expect(Object.values(EXIT)).not.toContain(DIFF_EXIT.UNEXPECTED);
  });

  it('sees differences in every top-level collection, not only the named ones', () => {
    for (const coll of ['addons', 'addon_variations', 'plan_variations', 'seat_types', 'placement_settings', 'meter_bindings']) {
      const diff = diffExportedConfig({ [coll]: [{ handle: 'x', v: 1 }] }, { [coll]: [{ handle: 'x', v: 2 }] });
      expect(diffExitCode(diff), coll).toBe(DIFF_EXIT.DIFFERENCES);
    }
  });
});
