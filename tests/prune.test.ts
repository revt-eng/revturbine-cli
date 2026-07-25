import { describe, expect, it } from 'vitest';
import { pruneQuery } from '../src/lib/prune';

describe('pruneQuery (plan 155 convergent-import flags)', () => {
  it('no flag → guarded convergent default (empty query)', () => {
    expect(pruneQuery(undefined)).toBe('');
  });

  it('--prune → forces past the mass-deletion guard', () => {
    expect(pruneQuery(true)).toBe('?prune=force');
  });

  it('--no-prune → additive (keep entities absent from the file)', () => {
    expect(pruneQuery(false)).toBe('?prune=false');
  });
});
