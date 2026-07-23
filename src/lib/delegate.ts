/**
 * Self-delegation: a globally-installed `revturbine` runs the version the REPO
 * pins (plan 142 REQ-14, the Nx/Angular pattern).
 *
 * The CLI bundles a version-stamped schema snapshot, so CLI↔config
 * compatibility is a property of the repo, not the machine. A global binary
 * silently validating against a different snapshot than the repo pins is the
 * failure this prevents.
 *
 * Deliberately NOT a second package. A separate launcher exposing the
 * `revturbine` bin would collide with `@revturbine/cli`'s own bin and force a
 * one-way-door name migration, since `npm i -g @revturbine/cli` installs the
 * real CLI under that name today. Folding it into this bin avoids that.
 *
 * The decision is pure and the filesystem probe is injected, so every branch —
 * including the ones that would fork-bomb if wrong — is unit-testable without
 * spawning anything.
 */

export type LocalInstall = {
  /** Absolute path to the repo-pinned CLI entry. */
  entry: string;
  version: string;
};

export type DelegationDecision =
  | { delegate: false; reason: string; skew?: undefined }
  | { delegate: true; target: string; skew?: { local: string; global: string } };

/** Set on the child so the delegate never re-delegates to itself. */
export const DELEGATION_ENV = 'REVTURBINE_DELEGATED';

/** Opt out for a single invocation. */
export const NO_LOCAL_FLAG = '--no-local';

/**
 * Commands whose job is to ESTABLISH the repo pin. They must run the CLI the
 * user actually invoked, never a version resolved from an ancestor directory —
 * delegating them is wrong twice over: writing a pin by first honouring a
 * different one is incoherent, and an older ancestor CLI may not even have these
 * commands. That is exactly how a stray `~/node_modules/@revturbine/cli` turned
 * `npx revturbine create` into "unknown command 'create'".
 */
export const SETUP_COMMANDS: readonly string[] = ['init', 'create'];

/**
 * The subcommand token from a full argv: the first argument after `[node, entry]`
 * that isn't an option. Every global option that precedes a subcommand is a
 * boolean (`--no-local`, `-V`, `-h`), so none consumes the token that follows —
 * a plain "first non-dash wins" scan is sufficient and stays correct.
 */
export function commandFromArgv(argv: readonly string[]): string | null {
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith('-')) return arg;
  }
  return null;
}

export function planDelegation(params: {
  /** Absolute, symlink-resolved path of the currently-running entry. */
  ownEntry: string;
  ownVersion: string;
  /** The repo-pinned install, or null when there isn't one. */
  local: LocalInstall | null;
  env: Record<string, string | undefined>;
  argv: readonly string[];
}): DelegationDecision {
  // Recursion guard FIRST. Without it a global bin that resolves to itself —
  // via a symlink chain, or a repo that pins the very build being run — spawns
  // children forever.
  if (params.env[DELEGATION_ENV]) {
    return { delegate: false, reason: 'already delegated' };
  }
  // `init`/`create` establish the pin — never delegate them, whatever the tree
  // above holds. This sits right after the recursion guard so it wins over pin
  // discovery and the skew path: those only make sense for commands that consume
  // an existing pin.
  const command = commandFromArgv(params.argv);
  if (command && SETUP_COMMANDS.includes(command)) {
    return { delegate: false, reason: `${command} establishes the repo pin — never delegated` };
  }
  if (params.argv.includes(NO_LOCAL_FLAG)) {
    return { delegate: false, reason: `${NO_LOCAL_FLAG} requested` };
  }
  if (!params.local) {
    return { delegate: false, reason: 'no repo-pinned CLI found' };
  }
  // Same file → we ARE the pinned one. Running it again would be a fork bomb
  // wearing a delegation costume.
  if (samePath(params.local.entry, params.ownEntry)) {
    return { delegate: false, reason: 'already running the repo-pinned CLI' };
  }
  return {
    delegate: true,
    target: params.local.entry,
    // Only surface skew when it exists: a diagnostic on every invocation is
    // noise, and noise gets filtered out along with the signal.
    skew:
      params.local.version === params.ownVersion
        ? undefined
        : { local: params.local.version, global: params.ownVersion },
  };
}

/**
 * Path comparison that survives Windows: case-insensitive there, and tolerant
 * of separator mixing, which is how a "same file" check silently fails and
 * turns into infinite delegation.
 */
export function samePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    const unified = p.replace(/\\/g, '/').replace(/\/+$/, '');
    return process.platform === 'win32' ? unified.toLowerCase() : unified;
  };
  return norm(a) === norm(b);
}

/** The stderr line shown when the repo pins a different version than the global. */
export function skewNotice(skew: { local: string; global: string }): string {
  return (
    `using the repo-pinned CLI ${skew.local} (this global is ${skew.global}) — ` +
    `the repo's pin wins because the schema snapshot is pinned with it. ` +
    `Run with ${NO_LOCAL_FLAG} to use the global instead.`
  );
}
