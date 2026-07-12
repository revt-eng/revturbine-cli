import { describe, expect, it } from 'vitest';

import { collectSelectors, requireSelectors, SelectorError } from '../src/lib/selectors';

describe('collectSelectors', () => {
  it('orders positionals first, then --file, --draft, --live, --release', () => {
    const found = collectSelectors({ draft: true, release: 'rel_1', file: 'b.json' }, ['a.json']);
    expect(found).toEqual([
      { kind: 'file', path: 'a.json' },
      { kind: 'file', path: 'b.json' },
      { kind: 'draft' },
      { kind: 'release', id: 'rel_1' },
    ]);
  });
});

describe('requireSelectors', () => {
  const allowedAll = ['file', 'draft', 'live', 'release'] as const;

  it('fails STATE_REQUIRED when no selector is given (no default)', () => {
    expect(() =>
      requireSelectors({}, [], { count: 1, allowed: [...allowedAll], command: 'download' }),
    ).toThrowError(/STATE_REQUIRED/);
  });

  it('returns exactly one selector when one is given', () => {
    const [sel] = requireSelectors({ live: true }, [], { count: 1, allowed: [...allowedAll], command: 'download' });
    expect(sel).toEqual({ kind: 'live' });
  });

  it('accepts two selectors for diff, preserving direction', () => {
    const sels = requireSelectors({ live: true }, ['local.json'], {
      count: 2,
      allowed: [...allowedAll],
      command: 'diff',
    });
    expect(sels).toEqual([{ kind: 'file', path: 'local.json' }, { kind: 'live' }]);
  });

  it('rejects the wrong number of selectors', () => {
    expect(() =>
      requireSelectors({ live: true, draft: true }, [], { count: 1, allowed: [...allowedAll], command: 'download' }),
    ).toThrowError(/exactly 1/);
  });

  it('rejects a disallowed selector kind', () => {
    expect(() =>
      requireSelectors({}, ['a.json'], { count: 1, allowed: ['draft', 'live', 'release'], command: 'download' }),
    ).toThrowError(SelectorError);
  });
});
