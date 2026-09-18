import { describe, expect, it } from 'vitest';
import { classifyToken } from '../src/lib/whoami';

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
