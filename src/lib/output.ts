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

/** Diagnostics — always stderr, never part of a machine-readable result. */
export function diag(message: string): void {
  console.error(`${LOG} ${message}`);
}

/** Raw diagnostic line (no prefix) — stderr. */
export function diagRaw(message: string): void {
  console.error(message);
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
  console.error(`${LOG} ✗ ${message}`);
  process.exit(cls);
}
