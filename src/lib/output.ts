/**
 * Machine contract (plan 131 TASK-2, cli.md §Robustness / §Design principles):
 * stable exit-code classes, results→stdout / diagnostics→stderr, and the
 * `--json` emission helper. Commands never invent their own exit codes.
 */

export const EXIT = {
  OK: 0,
  /** Unexpected error (catch-all). */
  UNEXPECTED: 1,
  /** Bad usage — unknown command, flag, argument, or missing version selector. */
  USAGE: 2,
  /** Authentication or permission denied. */
  AUTH: 3,
  /** Validation blocked (schema failure, blocking findings, rejected config, unknown id). */
  VALIDATION: 4,
  /** Conflict or stale state (open draft exists, base moved). */
  CONFLICT: 5,
  /** Network or transient failure. */
  NETWORK: 6,
  /** Server error. */
  SERVER: 7,
} as const;

export type ExitClass = (typeof EXIT)[keyof typeof EXIT];

/** Map an HTTP status to its exit-code class. */
export function classFromStatus(status: number): ExitClass {
  if (status === 401 || status === 403) return EXIT.AUTH;
  if (status === 409) return EXIT.CONFLICT;
  if (status === 400 || status === 404 || status === 422) return EXIT.VALIDATION;
  if (status >= 500) return EXIT.SERVER;
  return EXIT.UNEXPECTED;
}

/** A thrown fetch/undici error (no HTTP response at all) is a network failure. */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof Error && /fetch failed|ECONN|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(err.message));
}

const LOG = '[revturbine]';

/**
 * Secrets in use this run (the bearer token, REVTURBINE_HTTP_HEADERS values —
 * plan 129 TASK-2). Every stderr line passes through `redact()`, so a server
 * error body or network error that echoes one back is never printed.
 */
const secrets = new Set<string>();

/** Register values that must never appear on stderr. Values under 4 chars are ignored. */
export function registerSecrets(values: Iterable<string>): void {
  for (const v of values) if (v.length >= 4) secrets.add(v);
}

/** Replace every registered secret in `message` with `<redacted>`. */
export function redact(message: string): string {
  if (secrets.size === 0) return message;
  let out = message;
  // Longest first, so a secret containing another is scrubbed whole.
  for (const s of [...secrets].sort((a, b) => b.length - a.length)) out = out.split(s).join('<redacted>');
  return out;
}

/** Diagnostics — always stderr, never part of a machine-readable result. */
export function diag(message: string): void {
  console.error(redact(`${LOG} ${message}`));
}

/** Raw diagnostic line (no prefix) — stderr. */
export function diagRaw(message: string): void {
  console.error(redact(message));
}

/** Result payload — stdout. In `--json` mode emits stable, pretty-printed JSON. */
export function emit(data: unknown, json: boolean, humanText?: string): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  } else {
    process.stdout.write(`${humanText ?? JSON.stringify(data, null, 2)}\n`);
  }
}

/** Print the failure to stderr and exit with its class. */
export function fail(cls: ExitClass, message: string): never {
  console.error(redact(`${LOG} ✗ ${message}`));
  process.exit(cls);
}

/**
 * `diff --exit-code` (plan 129 TASK-2, git-diff style): 0 = no differences,
 * 1 = differences. Every failure keeps its class (2–7); an unexpected internal
 * error, normally class 1, exits 70 (EX_SOFTWARE) instead so a 1 always means
 * "differences" and a CI no-op check can never mistake a crash for a change.
 */
export const DIFF_EXIT = { NO_DIFFERENCES: 0, DIFFERENCES: 1, UNEXPECTED: 70 } as const;

/** The `diff --exit-code` status for a computed diff. */
export function diffExitCode(diff: Record<string, unknown>): number {
  return Object.keys(diff).length === 0 ? DIFF_EXIT.NO_DIFFERENCES : DIFF_EXIT.DIFFERENCES;
}
