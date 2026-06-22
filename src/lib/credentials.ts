/**
 * Local credential store for the CLI device-auth flow (plan 64).
 *
 * Tokens are persisted to ~/.revturbine/credentials.json (mode 0600), keyed by
 * the target web base URL's origin, so `--upload` can authenticate without a
 * re-login. The token secret is never logged — use redactToken() for display.
 *
 * The credentials directory is resolved per worktree (plan 86): a `.revturbine/`
 * found by walking up from cwd wins over the global `~/.revturbine`, so each
 * customer worktree can hold its own login. REVTURBINE_CONFIG_DIR overrides both.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type StoredCredential = {
  token: string;
  tenant_id: string | null;
  created_at: string;
};

type CredentialsFile = { version: 1; credentials: Record<string, StoredCredential> };

/** How the active credentials directory was resolved. */
export type ConfigDirSource = 'env' | 'worktree' | 'global';

/**
 * Resolve the credentials directory, in precedence order:
 *   1. `REVTURBINE_CONFIG_DIR` - explicit override (tests, power users)
 *   2. the nearest `.revturbine/` walking up from `cwd` - worktree-scoped, like
 *      git discovering `.git`; lets each customer worktree hold its own login
 *   3. `~/.revturbine` - global fallback
 */
export function resolveConfigDir(cwd: string = process.cwd()): { dir: string; source: ConfigDirSource } {
  const override = process.env.REVTURBINE_CONFIG_DIR;
  if (override) return { dir: path.resolve(override), source: 'env' };
  const scoped = findWorktreeConfigDir(cwd);
  if (scoped) return { dir: scoped, source: 'worktree' };
  return { dir: path.join(os.homedir(), '.revturbine'), source: 'global' };
}

/** Walk up from `start` for a `.revturbine/` directory; null if none up to root. */
function findWorktreeConfigDir(start: string): string | null {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, '.revturbine');
    if (existsSync(candidate) && statSync(candidate).isDirectory()) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function configDir(): string {
  return resolveConfigDir().dir;
}

function configFile(): string {
  return path.join(configDir(), 'credentials.json');
}

/**
 * Accept a scheme-less host (e.g. `revturbine-web.vercel.app`) and turn it into
 * a usable base URL: default to https, except localhost/loopback which default
 * to http. Strips any trailing slash.
 */
export function normalizeBaseUrl(input: string): string {
  const s = input.trim();
  if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, '');
  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(s);
  return `${isLocal ? 'http' : 'https'}://${s}`.replace(/\/+$/, '');
}

/** Stable key for a base URL — its origin, without a trailing slash. */
export function urlKey(baseUrl: string): string {
  try {
    return new URL(normalizeBaseUrl(baseUrl)).origin;
  } catch {
    return baseUrl.replace(/\/+$/, '');
  }
}

function read(): CredentialsFile {
  const file = configFile();
  if (!existsSync(file)) return { version: 1, credentials: {} };
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<CredentialsFile>;
    if (parsed && typeof parsed === 'object' && parsed.credentials) {
      return { version: 1, credentials: parsed.credentials };
    }
  } catch {
    // Corrupt file — treat as empty rather than crash.
  }
  return { version: 1, credentials: {} };
}

function write(data: CredentialsFile): void {
  const dir = configDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(configFile(), `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  try {
    chmodSync(configFile(), 0o600);
  } catch {
    // chmod is a no-op / may throw on some platforms (e.g. Windows) — best effort.
  }
}

export function saveCredential(baseUrl: string, cred: StoredCredential): void {
  const data = read();
  data.credentials[urlKey(baseUrl)] = cred;
  write(data);
}

export function getCredential(baseUrl: string): StoredCredential | null {
  return read().credentials[urlKey(baseUrl)] ?? null;
}

export function removeCredential(baseUrl: string): boolean {
  const data = read();
  const key = urlKey(baseUrl);
  if (!(key in data.credentials)) return false;
  delete data.credentials[key];
  write(data);
  return true;
}

export function credentialsFilePath(): string {
  return configFile();
}

/** A log-safe preview of a token — never print the secret itself. */
export function redactToken(token: string): string {
  if (token.length <= 8) return 'rtk_…';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
