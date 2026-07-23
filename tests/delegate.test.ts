import { describe, expect, it } from 'vitest';

import {
  commandFromArgv,
  DELEGATION_ENV,
  NO_LOCAL_FLAG,
  planDelegation,
  samePath,
  SETUP_COMMANDS,
  skewNotice,
} from '../src/lib/delegate';

const GLOBAL = '/usr/lib/node_modules/@revturbine/cli/dist/cli.js';
const LOCAL = '/repo/node_modules/@revturbine/cli/dist/cli.js';

const base = {
  ownEntry: GLOBAL,
  ownVersion: '0.9.0',
  local: { entry: LOCAL, version: '0.7.1' },
  env: {} as Record<string, string | undefined>,
  argv: ['node', 'revturbine', 'status'],
};

describe('planDelegation', () => {
  it('delegates to the repo-pinned CLI', () => {
    const d = planDelegation(base);
    expect(d.delegate).toBe(true);
    if (d.delegate) expect(d.target).toBe(LOCAL);
  });

  it('reports skew only when the versions actually differ', () => {
    const differs = planDelegation(base);
    expect(differs.skew).toEqual({ local: '0.7.1', global: '0.9.0' });

    const same = planDelegation({ ...base, local: { entry: LOCAL, version: '0.9.0' } });
    expect(same.delegate).toBe(true);
    // A diagnostic on every invocation is noise, and noise gets filtered out
    // along with the signal.
    expect(same.skew).toBeUndefined();
  });

  it('never re-delegates once delegated — the fork-bomb guard', () => {
    const d = planDelegation({ ...base, env: { [DELEGATION_ENV]: '1' } });
    expect(d.delegate).toBe(false);
    if (!d.delegate) expect(d.reason).toBe('already delegated');
  });

  it('does not delegate to itself when the repo pins this very build', () => {
    // The other fork-bomb path: global IS the pinned one.
    const d = planDelegation({ ...base, local: { entry: GLOBAL, version: '0.9.0' } });
    expect(d.delegate).toBe(false);
    if (!d.delegate) expect(d.reason).toBe('already running the repo-pinned CLI');
  });

  it(`honours ${NO_LOCAL_FLAG}`, () => {
    const d = planDelegation({ ...base, argv: [...base.argv, NO_LOCAL_FLAG] });
    expect(d.delegate).toBe(false);
    if (!d.delegate) expect(d.reason).toContain(NO_LOCAL_FLAG);
  });

  it('runs itself when there is no repo-pinned CLI', () => {
    const d = planDelegation({ ...base, local: null });
    expect(d.delegate).toBe(false);
    if (!d.delegate) expect(d.reason).toBe('no repo-pinned CLI found');
  });

  it('checks the recursion guard before anything else', () => {
    // Guard must win even when every other condition argues for delegating.
    const d = planDelegation({ ...base, env: { [DELEGATION_ENV]: 'true' } });
    expect(d.delegate).toBe(false);
  });

  it.each(SETUP_COMMANDS)('never delegates `%s` — setup establishes the pin', (command) => {
    // Even with a pinned CLI present and every other signal favouring delegation,
    // init/create must run the invoked CLI. This is the fix for a stray ancestor
    // pin turning `npx revturbine create` into "unknown command 'create'".
    const d = planDelegation({ ...base, argv: ['node', 'revturbine', command, '--dir', 'app'] });
    expect(d.delegate).toBe(false);
    if (!d.delegate) expect(d.reason).toContain('establishes the repo pin');
  });

  it('the setup bypass wins even when --no-local is also present', () => {
    // Both argue for not delegating; the setup reason is the more informative one.
    const d = planDelegation({ ...base, argv: ['node', 'revturbine', '--no-local', 'init'] });
    expect(d.delegate).toBe(false);
    if (!d.delegate) expect(d.reason).toContain('establishes the repo pin');
  });

  it('still delegates ordinary commands that consume the pin', () => {
    // Guard against an over-broad bypass: only setup commands are exempt.
    const d = planDelegation({ ...base, argv: ['node', 'revturbine', 'validate', './c.json'] });
    expect(d.delegate).toBe(true);
  });
});

describe('commandFromArgv', () => {
  it('returns the first non-option token as the command', () => {
    expect(commandFromArgv(['node', 'revturbine', 'init', '--dir', 'app'])).toBe('init');
  });

  it('skips leading global flags to find the subcommand', () => {
    expect(commandFromArgv(['node', 'revturbine', '--no-local', 'status'])).toBe('status');
  });

  it('is null when only options are present', () => {
    expect(commandFromArgv(['node', 'revturbine', '--help'])).toBeNull();
  });

  it('is null for a bare invocation', () => {
    expect(commandFromArgv(['node', 'revturbine'])).toBeNull();
  });
});

describe('samePath', () => {
  it('treats mixed separators as the same file', () => {
    // A separator mismatch here silently becomes infinite delegation.
    expect(samePath('C:\\repo\\node_modules\\.bin\\x.js', 'C:/repo/node_modules/.bin/x.js')).toBe(true);
  });

  it('ignores a trailing separator', () => {
    expect(samePath('/a/b/', '/a/b')).toBe(true);
  });

  it('still distinguishes genuinely different paths', () => {
    expect(samePath(GLOBAL, LOCAL)).toBe(false);
  });

  it('is case-insensitive only on Windows', () => {
    const mixed = samePath('/A/B', '/a/b');
    expect(mixed).toBe(process.platform === 'win32');
  });
});

describe('skewNotice', () => {
  it('names both versions and the escape hatch', () => {
    const msg = skewNotice({ local: '0.7.1', global: '0.9.0' });
    expect(msg).toContain('0.7.1');
    expect(msg).toContain('0.9.0');
    expect(msg).toContain(NO_LOCAL_FLAG);
  });
});
