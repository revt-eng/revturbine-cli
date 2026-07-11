import { describe, expect, it } from 'vitest';

import { classFromStatus, EXIT, isNetworkError } from '../src/lib/output';

describe('classFromStatus (cli.md exit-code classes)', () => {
  it('maps auth statuses to class 3', () => {
    expect(classFromStatus(401)).toBe(EXIT.AUTH);
    expect(classFromStatus(403)).toBe(EXIT.AUTH);
  });

  it('maps conflict to class 5', () => {
    expect(classFromStatus(409)).toBe(EXIT.CONFLICT);
  });

  it('maps validation/rejection statuses to class 4', () => {
    expect(classFromStatus(400)).toBe(EXIT.VALIDATION);
    expect(classFromStatus(404)).toBe(EXIT.VALIDATION);
    expect(classFromStatus(422)).toBe(EXIT.VALIDATION);
  });

  it('maps 5xx to class 7 and anything else to class 1', () => {
    expect(classFromStatus(500)).toBe(EXIT.SERVER);
    expect(classFromStatus(503)).toBe(EXIT.SERVER);
    expect(classFromStatus(418)).toBe(EXIT.UNEXPECTED);
  });
});

describe('isNetworkError', () => {
  it('recognizes undici fetch failures', () => {
    expect(isNetworkError(new TypeError('fetch failed'))).toBe(true);
    expect(isNetworkError(new Error('connect ECONNREFUSED 127.0.0.1:3000'))).toBe(true);
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});
