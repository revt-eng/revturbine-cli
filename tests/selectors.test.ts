import { describe, expect, it } from 'vitest';

import { collectSelectors, orderDiffSelectors, requireSelectors, SelectorError } from '../src/lib/selectors';

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

describe('orderDiffSelectors — launch-preview polarity (plan 171 TASK-11, F-46)', () => {
  it('reverses [file, --live] so the server side is current and the file is next', () => {
    expect(orderDiffSelectors([{ kind: 'file', path: 'local.json' }, { kind: 'live' }])).toEqual([
      { kind: 'live' },
      { kind: 'file', path: 'local.json' },
    ]);
  });

  it('reverses [file, --draft] and [file, --release] the same way', () => {
    expect(orderDiffSelectors([{ kind: 'file', path: 'a.json' }, { kind: 'draft' }])).toEqual([
      { kind: 'draft' },
      { kind: 'file', path: 'a.json' },
    ]);
    expect(orderDiffSelectors([{ kind: 'file', path: 'a.json' }, { kind: 'release', id: 'rel_1' }])).toEqual([
      { kind: 'release', id: 'rel_1' },
      { kind: 'file', path: 'a.json' },
    ]);
  });

  it('keeps two files in the stated first → second order', () => {
    expect(orderDiffSelectors([{ kind: 'file', path: 'a.json' }, { kind: 'file', path: 'b.json' }])).toEqual([
      { kind: 'file', path: 'a.json' },
      { kind: 'file', path: 'b.json' },
    ]);
  });

  it('keeps two server-side versions in the stated order', () => {
    expect(orderDiffSelectors([{ kind: 'draft' }, { kind: 'live' }])).toEqual([
      { kind: 'draft' },
      { kind: 'live' },
    ]);
  });

  it('is a no-op for anything other than an exact [file, server] pair', () => {
    expect(orderDiffSelectors([{ kind: 'live' }])).toEqual([{ kind: 'live' }]);
    expect(orderDiffSelectors([])).toEqual([]);
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
