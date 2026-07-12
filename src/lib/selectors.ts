/**
 * Explicit version selectors (plan 131 TASK-2, cli.md "Explicit about which
 * version"): commands that read a config name the version — `<file>` /
 * `--file <path>` / `--draft` / `--live` / `--release <id>` — and never guess.
 * A command run without its required selector fails STATE_REQUIRED (exit
 * class 2, bad usage).
 */

export type VersionSelector =
  | { kind: 'file'; path: string }
  | { kind: 'draft' }
  | { kind: 'live' }
  | { kind: 'release'; id: string };

export class SelectorError extends Error {
  readonly code = 'STATE_REQUIRED';
  constructor(message: string) {
    super(message);
  }
}

export interface SelectorOpts {
  file?: string;
  draft?: boolean;
  live?: boolean;
  release?: string;
}

/**
 * Collect every selector present, in the documented order: positional files
 * first, then `--file`, `--draft`, `--live`, `--release`. The order matters
 * for `diff <a> <b>` (direction is first → second).
 */
export function collectSelectors(opts: SelectorOpts, positionalFiles: string[] = []): VersionSelector[] {
  const found: VersionSelector[] = positionalFiles.map((path) => ({ kind: 'file', path }));
  if (opts.file) found.push({ kind: 'file', path: opts.file });
  if (opts.draft) found.push({ kind: 'draft' });
  if (opts.live) found.push({ kind: 'live' });
  if (opts.release) found.push({ kind: 'release', id: opts.release });
  return found;
}

/** Human name for a selector, for messages. */
export function describeSelector(sel: VersionSelector): string {
  switch (sel.kind) {
    case 'file':
      return sel.path;
    case 'draft':
      return '--draft';
    case 'live':
      return '--live';
    case 'release':
      return `--release ${sel.id}`;
  }
}

/**
 * Exactly `count` selectors from `allowed`, else SelectorError (STATE_REQUIRED
 * when none were given; bad usage when the wrong number or a disallowed kind).
 */
export function requireSelectors(
  opts: SelectorOpts,
  positionalFiles: string[],
  {
    count,
    allowed,
    command,
  }: { count: number; allowed: Array<VersionSelector['kind']>; command: string },
): VersionSelector[] {
  const found = collectSelectors(opts, positionalFiles);
  const choices = allowed
    .map((k) => (k === 'file' ? '<file>' : k === 'release' ? '--release <id>' : `--${k}`))
    .join(' / ');
  const disallowed = found.find((s) => !allowed.includes(s.kind));
  if (disallowed) {
    throw new SelectorError(`${command} does not accept ${describeSelector(disallowed)} — use ${choices}.`);
  }
  if (found.length === 0) {
    throw new SelectorError(
      `STATE_REQUIRED — ${command} needs ${count === 1 ? 'a version' : `${count} versions`}: ${choices}. There is no default.`,
    );
  }
  if (found.length !== count) {
    throw new SelectorError(`${command} takes exactly ${count} version${count === 1 ? '' : 's'} (${choices}); got ${found.length}.`);
  }
  return found;
}
