import { describe, expect, it } from 'vitest';
import { classifyRefusal, classifyToken, formatAuthentication } from '../src/lib/whoami';

describe('authentication evidence', () => {
  it('never treats tenant configuration or a status without credentials as authentication', () => {
    expect(classifyToken(false, null)).toBeNull();
    expect(classifyToken(false, 200)).toBeNull();
  });

  it.each([200, 204, 299])('accepts successful HTTP %s without requiring an active draft', (status) => {
    expect(classifyToken(true, status)).toBe(true);
  });

  it.each([401, 403])('recognizes HTTP %s as rejection for the selected instance/tenant', (status) => {
    expect(classifyToken(true, status)).toBe(false);
  });

  it.each([null, 0, 199, 300, 302, 400, 404, 408, 429, 500, 503])('keeps HTTP %s inconclusive', (status) => {
    expect(classifyToken(true, status)).toBeNull();
  });
});

describe('refusal bodies (ST-1447, BUG-1184)', () => {
  const challengeBody = JSON.stringify({ error: { code: 'challenge', message: 'Verifying your browser' } });

  it('reports a challenge body as a challenge, not a refused key', () => {
    const refusal = classifyRefusal(403, challengeBody);
    expect(refusal).toMatchObject({ status: 403, challenged: true, detail: 'challenge: Verifying your browser' });
    expect(classifyToken(true, 403, true)).toBeNull();
    const line = formatAuthentication(true, null, refusal);
    expect(line).toContain('challenge or firewall');
    expect(line).toContain('not a refused key');
    expect(line).toContain('challenge: Verifying your browser');
  });

  it('treats x-vercel-mitigated as a challenge even with an HTML body', () => {
    expect(classifyRefusal(403, '<html>Checking</html>', 'challenge')?.challenged).toBe(true);
  });

  it('keeps a key refusal as rejected and prints the status and body', () => {
    const refusal = classifyRefusal(401, JSON.stringify({ error: { code: 'invalid_token', message: 'Token expired' } }));
    expect(refusal?.challenged).toBe(false);
    const line = formatAuthentication(true, false, refusal);
    expect(line).toContain('rejected');
    expect(line).toContain('HTTP 401');
    expect(line).toContain('invalid_token: Token expired');
  });

  it('accepts string and flat envelopes and caps a raw body', () => {
    expect(classifyRefusal(403, JSON.stringify({ error: 'nope' }))?.detail).toBe('nope');
    expect(classifyRefusal(403, JSON.stringify({ code: 'x', message: 'y' }))?.detail).toBe('x: y');
    expect(classifyRefusal(403, 'z'.repeat(500))?.detail).toHaveLength(200);
  });

  it('classifies only 401 and 403', () => {
    expect(classifyRefusal(500, challengeBody)).toBeNull();
  });

  it('keeps the original wording when no body is available', () => {
    expect(formatAuthentication(true, false)).toContain('credentials rejected for this instance or tenant');
  });
});
