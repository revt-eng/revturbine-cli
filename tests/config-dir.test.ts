import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveConfigDir } from '../src/lib/credentials';

// The global-fallback cases require that no `.revturbine/` dir exists anywhere
// up-tree from os.tmpdir(). That holds on Linux/CI (tmpdir is /tmp, not under
// $HOME) but NOT on Windows, where tmpdir lives under the user profile and the
// real ~/.revturbine is an ancestor — so the walk-up correctly returns
// 'worktree'. Detect that contamination and skip the two affected cases; this
// is a no-op on the authoritative CI runner.
function ancestorHasConfigDir(start: string): boolean {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, '.revturbine');
    if (existsSync(candidate) && statSync(candidate).isDirectory()) return true;
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}
const tmpdirContaminated = ancestorHasConfigDir(os.tmpdir());

let tmpRoot: string;
let savedEnv: string | undefined;

beforeEach(() => {
  // resolveConfigDir() reads REVTURBINE_CONFIG_DIR; clear it so worktree/global
  // discovery is exercised, and restore it afterwards.
  savedEnv = process.env.REVTURBINE_CONFIG_DIR;
  delete process.env.REVTURBINE_CONFIG_DIR;
  tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'revt-cfgdir-'));
});

afterEach(() => {
  if (savedEnv === undefined) delete process.env.REVTURBINE_CONFIG_DIR;
  else process.env.REVTURBINE_CONFIG_DIR = savedEnv;
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe('resolveConfigDir', () => {
  it('REVTURBINE_CONFIG_DIR overrides everything (source: env)', () => {
    process.env.REVTURBINE_CONFIG_DIR = tmpRoot;
    // Even with a .revturbine/ in cwd, the env override wins.
    mkdirSync(path.join(tmpRoot, '.revturbine'));
    const { dir, source } = resolveConfigDir(tmpRoot);
    expect(source).toBe('env');
    expect(dir).toBe(path.resolve(tmpRoot));
  });

  it('discovers a .revturbine/ in the current dir (source: worktree)', () => {
    const wt = path.join(tmpRoot, 'colossyan');
    mkdirSync(path.join(wt, '.revturbine'), { recursive: true });
    const { dir, source } = resolveConfigDir(wt);
    expect(source).toBe('worktree');
    expect(dir).toBe(path.join(wt, '.revturbine'));
  });

  it('walks up to find a .revturbine/ in an ancestor (source: worktree)', () => {
    const wt = path.join(tmpRoot, 'colossyan');
    mkdirSync(path.join(wt, '.revturbine'), { recursive: true });
    const deep = path.join(wt, 'customers', 'colossyan');
    mkdirSync(deep, { recursive: true });
    const { dir, source } = resolveConfigDir(deep);
    expect(source).toBe('worktree');
    expect(dir).toBe(path.join(wt, '.revturbine'));
  });

  it('picks the NEAREST .revturbine/ when several are up-tree', () => {
    mkdirSync(path.join(tmpRoot, '.revturbine'));
    const inner = path.join(tmpRoot, 'inner');
    mkdirSync(path.join(inner, '.revturbine'), { recursive: true });
    const { dir } = resolveConfigDir(path.join(inner, 'sub'));
    expect(dir).toBe(path.join(inner, '.revturbine'));
  });

  it.skipIf(tmpdirContaminated)('falls back to ~/.revturbine when no .revturbine/ is up-tree (source: global)', () => {
    // tmpRoot has no .revturbine/ anywhere up to the OS tmp root.
    const { dir, source } = resolveConfigDir(tmpRoot);
    expect(source).toBe('global');
    expect(dir).toBe(path.join(os.homedir(), '.revturbine'));
  });

  it.skipIf(tmpdirContaminated)('ignores a .revturbine FILE (only a directory counts)', () => {
    // A regular file named .revturbine must not be treated as the config dir.
    const wt = path.join(tmpRoot, 'wt');
    mkdirSync(wt, { recursive: true });
    // Create a file (not dir) named .revturbine.
    writeFileSync(path.join(wt, '.revturbine'), 'x');
    const { source } = resolveConfigDir(wt);
    expect(source).toBe('global');
  });
});
