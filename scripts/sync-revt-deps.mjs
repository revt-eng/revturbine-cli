#!/usr/bin/env node
// GENERATED — vendored from revturbine-devkit/scripts/sync-revt-deps.mjs.
// Do NOT edit here; edit the devkit canonical and run
// `npm run sync:revt-sync` (drift-gated by `sync:revt-sync:check`).


/**
 * Cross-repo `@revt-eng/*` exact-pin sync — the shared, config-driven
 * generalization of revturbine-web's original `scripts/sync-revt-deps.mjs`
 * prototype. Devkit owns the canonical copy; it is vendored into each
 * consumer repo and invoked from that repo's pre-push hook (plan #35 / H6,
 * closes audit failure F10).
 *
 * Why this exists (the F10 root cause, preserved from the prototype's
 * PR #63 note): consumers used to pin `@revt-eng/*` with caret ranges or
 * `latest`. Generators ran locally against whatever the pnpm workspace
 * symlink resolved (often an unpublished scaffold version ahead of the
 * registry); CI had no sibling checkout, re-resolved the floating range
 * from the registry to a *different* version, regenerated, and the bytes
 * differed → drift. Exact pins remove the floating target; this hook
 * keeps the pin moving with scaffold so the artifacts a developer commits
 * were generated against the exact version CI will install.
 *
 * Flow (per consumer, keyed by `CONSUMERS` below):
 *   1. Resolve the authoritative reference version (Q-5): scaffold's own
 *      `package.json` version for scaffold-produced packages, the
 *      revturbine-sdk-internal web-sdk version for `@revt-eng/sdk` (different
 *      release cadence), each with a registry `latest` fallback when the
 *      producer sibling isn't checked out.
 *   2. For every managed package in every configured manifest, rewrite a
 *      loose / stale / tag specifier to the EXACT reference version.
 *      `workspace:*` / `file:` / `link:` specifiers are never rewritten
 *      (e.g. packages that intentionally do not consume a published pin).
 *      An exact pin already AHEAD of the reference is left alone (no
 *      auto-downgrade) — it still satisfies the no-`^`/`~`/`latest` rule.
 *   3. `pnpm install` to reconcile the lockfile, run the consumer's regen
 *      command (schema bumps regenerate openapi/types), then `git add`
 *      the configured paths so the in-flight push carries the result.
 *
 * Preserved from the prototype:
 *   - CI-skip: auto-bumping in CI would race the push that triggered the
 *     build and produce inconsistent commits. CI detection-only is
 *     intentional (plan #35 REQ-5); the existing reusable-drift-check is
 *     the CI-side F10 signal.
 *   - `SKIP_REVT_SYNC=1` / `git push --no-verify` escape hatch.
 *   - `gh auth token` fallback so workstations need no manual PAT.
 *
 * Usage (from a consumer repo root, normally via .githooks/pre-push):
 *   node scripts/sync-revt-deps.mjs
 *
 * Pure decision functions are exported for the devkit vitest suite; the
 * side-effecting `main()` only runs when invoked as a CLI.
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Dep blocks scanned for managed packages, in resolution order. */
export const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

/**
 * Packages produced by revturbine-scaffold and versioned together with
 * it. Their authoritative reference is scaffold's own package.json
 * version. `@revt-eng/sdk` is deliberately NOT here — it is produced by
 * revturbine-sdk-internal on a separate cadence (see `referenceVersionFor`).
 */
export const SCAFFOLD_PACKAGES = [
  '@revt-eng/schema',
  '@revt-eng/core',
  '@revt-eng/schema-drizzle',
  '@revt-eng/schema-external',
];

/**
 * Per-consumer configuration. `manifests` are package.json paths relative
 * to the consumer root (a repo may pin in sub-package manifests, e.g.
 * revturbine-sdk-internal/web-sdk). `regen` is the consumer-declared command that
 * refreshes generated artifacts after a bump (skipped, with a notice, if
 * the script is absent — validated per-repo when TASK-2/3/4 wire each
 * hook). `stagePaths` are git-add'd so the push carries the upgrade.
 *
 * `stagePaths` are repo-tracked paths git-add'd so the push carries the
 * upgrade. Consumers with a repo-local lockfile include it here so the
 * manifest pin and deterministic resolution land atomically. Absent paths
 * are skipped individually (a bump need not touch every artifact).
 *
 * `postUpdateSubInstalls` (optional) is a list of subdirs that own a
 * **standalone `pnpm-lock.yaml`** (not covered by the consumer-root
 * `pnpm install`, e.g. revturbine-sdk-internal's `pages-build`, which CI installs
 * with `pnpm install --frozen-lockfile`). The top-level install does NOT
 * touch these subdirs' locks, so they lag a manifest bump and the frozen
 * CI install later fails with version-mismatch. For each entry, revt-sync
 * runs `pnpm install --no-frozen-lockfile` inside that sub-workspace after the
 * manifest rewrite so the standalone lock picks up the new pinned version
 * + transitive tree alongside.
 */
export const CONSUMERS = {
  'revturbine-web': {
    packages: ['@revt-eng/core', '@revt-eng/schema', '@revt-eng/schema-drizzle'],
    manifests: ['package.json'],
    regen: 'pnpm run regen',
    stagePaths: [
      'package.json',
      'public',
      'src/lib/api/generated',
      'src/lib/db/generated-schema.ts',
      'src/lib/crud/generated-registry.ts',
    ],
  },
  'revturbine-sdk': {
    repoDir: 'revturbine-sdk-internal',
    packages: ['@revt-eng/core', '@revt-eng/schema', '@revt-eng/schema-external'],
    manifests: [
      'package.json',
      'web-sdk/package.json',
      'server-node/package.json',
      'pages-build/package.json',
    ],
    regen: 'pnpm run generate:api-client',
    stagePaths: [
      'package.json',
      'pnpm-lock.yaml',
      'web-sdk/package.json',
      'server-node/package.json',
      'web-sdk/generated',
      'pages-build/package.json',
      'pages-build/pnpm-lock.yaml',
    ],
    // pages-build owns a standalone pnpm-lock.yaml (CI installs it with
    // `pnpm install --frozen-lockfile`) and is not reconciled by the
    // sdk-root install. Without this step, manifest bumps land but the
    // lockfile stays stale and the docs-preview/deploy frozen install
    // fails with "X@old not found / version mismatch". See plan #46
    // (gap that blocked sdk#70) and plan 48 (npm→pnpm migration).
    postUpdateSubInstalls: ['pages-build'],
  },
  // `revturbine-external` was here. Removed 2026-08-15: the repo is ARCHIVED
  // and read-only — GitHub refuses a push with
  // "This repository was archived so it is read-only" (403). Keeping it listed
  // meant every vendor/sync run targeted a repo that can never accept the
  // result, and its vendored copy could never be brought back in step. Do not
  // re-add it unless the repo is unarchived.
  // Regen-only consumer (plan 143). The CLI depends on NO @revt-eng package —
  // it vendors a bundled snapshot of scaffold's schema + validation engine so
  // it can validate offline with zero private access (plan 100). Its "pin" is
  // therefore that vendored artifact, refreshed by regen rather than by
  // rewriting a version string, hence empty `packages`/`manifests`.
  //
  // This is the LOCAL/manual refresh path. Routine delivery is automatic:
  // scaffold's release regenerates the snapshot and opens a PR against the CLI
  // (plan 143 TASK-2, `auto-publish.yml` → `deliver-cli-snapshot`). Use this for
  // catch-up, testing, or an out-of-band refresh — and note it regenerates from
  // whatever the scaffold SIBLING currently is, which is why
  // assertScaffoldReleasable() below refuses anything but a clean tree parked on
  // its release tag.
  //
  // NOTE: this repo is **npm**, not pnpm. The install step below is skipped for
  // regen-only consumers, which matters — a `pnpm install` here would create a
  // second, conflicting lockfile (revturbine-cli/AGENTS.md).
  '@revturbine/cli': {
    repoDir: 'revturbine-cli',
    packages: [],
    manifests: [],
    // `generate:schema` defaults --scaffold-dir to ../revturbine-scaffold,
    // which resolves correctly inside the umbrella workspace.
    regen: 'npm run generate:schema',
    stagePaths: ['src/schema'],
  },
};

/** Look up the config for a consumer by its package.json `name`. */
export function consumerConfigFor(repoName) {
  if (!repoName || !Object.prototype.hasOwnProperty.call(CONSUMERS, repoName)) {
    return null;
  }
  return CONSUMERS[repoName];
}

/**
 * Classify a dependency specifier.
 *   'protected' — workspace:/file:/link:/portal: — never rewrite.
 *   'exact'     — bare `1.2.3` (optionally with prerelease/build tag).
 *   'range'     — ^, ~, x-ranges, comparators — a floating target.
 *   'tag'       — `latest` or any dist-tag word — a floating target.
 *   'invalid'   — not a string.
 */
export function classifySpecifier(spec) {
  if (typeof spec !== 'string') return 'invalid';
  const s = spec.trim();
  if (/^(workspace|file|link|portal):/.test(s)) return 'protected';
  if (/^\d+\.\d+\.\d+(?:[-+][\w.]+)?$/.test(s)) return 'exact';
  // A dist-tag is a plain identifier starting with a letter (latest,
  // next, beta, rc, …). Bare `x`/`X` is a wildcard range, not a tag.
  if (/^[a-zA-Z][\w.-]*$/.test(s) && !/^[xX]$/.test(s)) return 'tag';
  // Everything else — ^, ~, comparators, x-ranges (1.x), `*`, `a - b` —
  // is a floating range we re-pin to the exact reference.
  return 'range';
}

/** Parse a bare `major.minor.patch` to a numeric tuple, else null. */
export function parseVersion(v) {
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+][\w.]+)?$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Compare two version tuples. Negative if a<b, 0 if equal, positive if a>b. */
export function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Decide what to do with one specifier against the reference version.
 * Returns one of:
 *   { action: 'skip', reason }            — no reference version known
 *   { action: 'skip-protected' }          — workspace:/file:/link:
 *   { action: 'skip-ahead', reason }      — exact pin already ahead; no downgrade
 *   { action: 'up-to-date' }              — already the exact reference
 *   { action: 'repin', from, to }         — rewrite to the exact reference
 */
export function planRepin(currentSpec, targetVersion) {
  if (!targetVersion) return { action: 'skip', reason: 'no-reference-version' };
  const kind = classifySpecifier(currentSpec);
  if (kind === 'protected') return { action: 'skip-protected' };
  if (kind === 'invalid') return { action: 'skip', reason: 'non-string-spec' };

  if (kind === 'exact') {
    if (currentSpec.trim() === targetVersion) return { action: 'up-to-date' };
    const cur = parseVersion(currentSpec);
    const tgt = parseVersion(targetVersion);
    if (cur && tgt && compareVersions(cur, tgt) > 0) {
      return {
        action: 'skip-ahead',
        reason: `pinned ${currentSpec} is ahead of reference ${targetVersion}; not downgrading`,
      };
    }
  }
  // range / tag / older-or-different exact → pin to the exact reference.
  return { action: 'repin', from: currentSpec, to: targetVersion };
}

/**
 * Resolve the authoritative reference version for a package.
 * Scaffold-produced packages track scaffold's version; `@revt-eng/sdk`
 * tracks the revturbine-sdk-internal web-sdk version (separate cadence). Each
 * falls back to the registry `latest` map when the producer sibling
 * isn't checked out.
 */
export function referenceVersionFor(pkg, { scaffoldVersion, sdkVersion, registryLatest = {} }) {
  if (SCAFFOLD_PACKAGES.includes(pkg)) {
    return scaffoldVersion || registryLatest[pkg] || null;
  }
  if (pkg === '@revt-eng/sdk') {
    return sdkVersion || registryLatest[pkg] || null;
  }
  return registryLatest[pkg] || null;
}

/**
 * Plan repins for one parsed package.json object. Pure: `referenceFor`
 * maps a package name to its target version (inject a stub in tests).
 * Returns [{ pkg, field, from, to }].
 */
export function planRepinsForManifest(pkgObj, packages, referenceFor) {
  const repins = [];
  for (const field of DEP_FIELDS) {
    const block = pkgObj && pkgObj[field];
    if (!block || typeof block !== 'object') continue;
    for (const pkg of packages) {
      if (!Object.prototype.hasOwnProperty.call(block, pkg)) continue;
      const decision = planRepin(block[pkg], referenceFor(pkg));
      if (decision.action === 'repin') {
        repins.push({ pkg, field, from: decision.from, to: decision.to });
      }
    }
  }
  return repins;
}

/**
 * Rewrite manifest TEXT (not a parsed object, so indentation / trailing
 * commas / key order are preserved byte-for-byte) so each repinned
 * package's specifier becomes the exact target. Only the targeted
 * `"<pkg>": "<spec>"` entries change. Pure → unit-testable.
 */
/**
 * The `latest` version from an npm PACKUMENT body, or null.
 *
 * Separated out (and exported) because the endpoint choice is the whole defect:
 * GitHub Packages 405s on `/<pkg>/latest` but serves `GET /<pkg>`, so the
 * portable read is `dist-tags.latest` off the packument. Tolerates a
 * `{ version }` body too, so a registry that only serves the dist-tag document
 * still resolves. Pure → unit-testable without a network.
 */
export function latestFromPackument(body) {
  if (!body || typeof body !== 'object') return null;
  const tagged = body['dist-tags']?.latest;
  if (typeof tagged === 'string' && tagged) return tagged;
  // `/<pkg>/latest` (npmjs) returns the manifest for that tag directly.
  if (typeof body.version === 'string' && body.version) return body.version;
  return null;
}

export function repinManifestText(pkgJsonText, repins) {
  let out = pkgJsonText;
  for (const { pkg, to } of repins) {
    const escaped = pkg.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    const re = new RegExp(`("${escaped}"\\s*:\\s*")[^"]*(")`, 'g');
    out = out.replace(re, `$1${to}$2`);
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// Side-effecting CLI below. Nothing above this line touches the FS, the
// network, git, or process.env beyond pure helpers.
// ───────────────────────────────────────────────────────────────────────

function readJsonVersion(pkgJsonPath) {
  try {
    return JSON.parse(readFileSync(pkgJsonPath, 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

/**
 * Committed build OUTPUT in scaffold that regenerates on any local build, so it
 * is dirty in the ordinary course of work. These paths cannot influence what
 * `generate:schema` produces: the snapshot is bundled by esbuild from
 * `src/core/zod/index.ts` and `src/core/validation/index.ts` — TypeScript
 * SOURCE — and never reads `dist/`.
 *
 * Refusing on them would fire the guard in a routine state, which is how guards
 * get disabled. Real source edits are still caught, and the release-tag check
 * backstops the residual risk that something under `src/` ever imports `dist/`.
 */
const NON_BUNDLE_DIRTY_PREFIXES = ['src/core/dist/'];

/**
 * Porcelain lines reduced to the paths that could actually change the bundle.
 * Parsed in JS rather than via a `:(exclude)` pathspec — cmd.exe mangles the
 * parentheses, the same class of bug as `^{commit}`.
 */
function dirtyPathsAffectingBundle(porcelain) {
  return porcelain
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // `XY <path>`, or `R  <old> -> <new>` for renames — the destination is
      // what exists on disk now.
      const p = line.slice(3).trim().replace(/^"|"$/g, '');
      return p.includes(' -> ') ? p.split(' -> ')[1].replace(/^"|"$/g, '') : p;
    })
    .filter((p) => !NON_BUNDLE_DIRTY_PREFIXES.some((prefix) => p.startsWith(prefix)));
}

/**
 * `trim: false` is required for `status --porcelain`: its format is
 * `XY <path>`, where an unstaged modification renders as a LEADING SPACE
 * (` M path`). Trimming eats that space, shifting every field left by one so a
 * fixed-width parse slices into the path itself. Learned the hard way — it made
 * ` M src/core/dist/x` parse as `rc/core/dist/x` and slip past the ignore list.
 */
function gitOut(args, cwd, { trim = true } = {}) {
  try {
    const out = execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return trim ? out.trim() : out;
  } catch {
    return null;
  }
}

/**
 * Refuse to sync from a scaffold sibling that is not a clean, released tree
 * (plan 143).
 *
 * This script reads the SIBLING WORKING TREE — both for the reference version
 * that drives pins and, for regen-only consumers, as the actual source the
 * snapshot is bundled from. So whatever is checked out locally is what lands in
 * a consumer's commit. Observed 2026-07-22: a `revt:sync` run against scaffold
 * sitting on a feature branch with uncommitted schema edits staged 86 lines of
 * unreleased schema into the public CLI's vendored snapshot.
 *
 * That is the same defect plan 140 fixed for the SDK ("resolves from live
 * scaffold main — locally the scaffold sibling working tree"). Pinning to a
 * published artifact is the stronger cure; this guard is the credential-free
 * equivalent: only a clean tree parked exactly on its own release tag may be a
 * sync source.
 *
 * Escape hatch: REVT_ALLOW_UNRELEASED_SCAFFOLD=1 for deliberate local testing.
 */
function assertScaffoldReleasable(scaffoldDir) {
  if (!existsSync(scaffoldDir)) return; // absent sibling → registry fallback, nothing to guard
  if (
    process.env.REVT_ALLOW_UNRELEASED_SCAFFOLD === '1' ||
    process.env.REVT_ALLOW_UNRELEASED_SCAFFOLD === 'true'
  ) {
    console.warn(
      '[revt-sync] REVT_ALLOW_UNRELEASED_SCAFFOLD set — syncing from an unreleased scaffold tree. ' +
        'Do NOT commit the result.',
    );
    return;
  }

  const dirty = gitOut('status --porcelain', scaffoldDir, { trim: false });
  if (dirty === null) return; // not a git checkout (e.g. installed copy) → nothing to assert
  const relevant = dirtyPathsAffectingBundle(dirty);
  if (relevant.length > 0) {
    const shown = relevant.slice(0, 5).join('\n    ');
    const more = relevant.length > 5 ? `\n    …and ${relevant.length - 5} more` : '';
    console.error(
      `[revt-sync] refusing to sync: revturbine-scaffold has ${relevant.length} uncommitted ` +
        `change(s) that can affect the bundle:\n    ${shown}${more}\n` +
        '  Whatever is in that working tree becomes the consumer\'s committed artifact.\n' +
        '  Commit/stash scaffold and check out its release tag, or set ' +
        'REVT_ALLOW_UNRELEASED_SCAFFOLD=1 to override.',
    );
    process.exit(1);
  }

  const version = readJsonVersion(path.join(scaffoldDir, 'package.json'));
  const head = gitOut('rev-parse HEAD', scaffoldDir);
  // `rev-list -n 1 <tag>` rather than `rev-parse <tag>^{commit}`: it dereferences
  // annotated tags just the same, and avoids `^` — which cmd.exe treats as its
  // escape character, silently mangling the revision on Windows.
  const tagged = version ? gitOut(`rev-list -n 1 v${version}`, scaffoldDir) : null;
  if (!version || !tagged) {
    console.error(
      `[revt-sync] refusing to sync: cannot resolve scaffold release tag v${version ?? '?'}.\n` +
        '  Fetch tags (`git fetch --tags`) or set REVT_ALLOW_UNRELEASED_SCAFFOLD=1 to override.',
    );
    process.exit(1);
  }
  if (tagged !== head) {
    console.error(
      `[revt-sync] refusing to sync: scaffold HEAD is not the v${version} release commit.\n` +
        `  HEAD ${head?.slice(0, 8)} vs v${version} ${tagged.slice(0, 8)} — the tree contains ` +
        'commits that were never released.\n' +
        `  Check out v${version}, or set REVT_ALLOW_UNRELEASED_SCAFFOLD=1 to override.`,
    );
    process.exit(1);
  }
  console.log(`[revt-sync] scaffold sibling is clean at v${version} ✓`);
}

function makeRegistryFetcher() {
  const registry = process.env.REVT_NPM_REGISTRY ?? 'https://npm.pkg.github.com';
  if (!process.env.NODE_AUTH_TOKEN && !process.env.GITHUB_TOKEN) {
    const gh = spawnSync('gh', ['auth', 'token'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const token = gh.stdout?.trim();
    if (gh.status === 0 && token) {
      process.env.NODE_AUTH_TOKEN = token;
      console.log('[revt-sync] NODE_AUTH_TOKEN unset; using `gh auth token` fallback.');
    }
  }
  const token = process.env.NODE_AUTH_TOKEN || process.env.GITHUB_TOKEN;
  const canFetch = token || !registry.includes('pkg.github.com');
  return async function fetchLatest(pkg) {
    if (!canFetch) return null;
    // Read the PACKUMENT and take `dist-tags.latest` — not `/<pkg>/latest`.
    //
    // GitHub Packages does not implement the dist-tag endpoint: it answers
    // `405 Method Not Allowed`, while `GET /<pkg>` returns 200 with the full
    // packument. npmjs serves both, so the packument is the portable form.
    //
    // The `/latest` form made this fallback dead code against the registry we
    // actually publish to. Every call warned "registry 405 — skipping" and
    // returned null, so whenever the producer sibling was absent (CI, a
    // worktree, a fresh clone) the pin silently never advanced — which is how
    // revturbine-web sat 31 versions behind @revt-eng/sdk until 2026-08-14.
    const url = `${registry}/${pkg.replace('/', '%2F')}`;
    try {
      const res = await fetch(url, token ? { headers: { authorization: `Bearer ${token}` } } : {});
      if (!res.ok) {
        console.warn(`[revt-sync] ${pkg}: registry ${res.status} — skipping`);
        return null;
      }
      const latest = latestFromPackument(await res.json());
      if (!latest) {
        console.warn(`[revt-sync] ${pkg}: packument carries no dist-tags.latest — skipping`);
        return null;
      }
      return latest;
    } catch (err) {
      console.warn(`[revt-sync] ${pkg}: fetch failed — ${err?.message ?? err}`);
      return null;
    }
  };
}

function run(cmd, args, cwd) {
  console.log(`[revt-sync] $ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: true });
  if (r.status !== 0) {
    console.error(`[revt-sync] step failed: ${cmd} ${args.join(' ')}`);
    process.exit(1);
  }
}

async function main() {
  if (process.env.SKIP_REVT_SYNC === '1' || process.env.SKIP_REVT_SYNC === 'true') {
    console.log('[revt-sync] SKIP_REVT_SYNC set — skipping');
    return;
  }
  if (process.env.CI === 'true' || process.env.CI === '1') {
    // Detection-only in CI (plan #35 REQ-5): auto-bumping here would race
    // the triggering push and produce inconsistent commits. The reusable
    // drift-check is the CI-side F10 signal.
    console.log('[revt-sync] CI detected — skipping (drift-check is the CI signal)');
    return;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const consumerRoot = path.resolve(scriptDir, '..');
  const ownPkgPath = path.join(consumerRoot, 'package.json');
  if (!existsSync(ownPkgPath)) {
    console.log(`[revt-sync] no package.json at ${consumerRoot} — nothing to do`);
    return;
  }
  const ownName = (() => {
    try {
      return JSON.parse(readFileSync(ownPkgPath, 'utf8')).name ?? null;
    } catch {
      return null;
    }
  })();
  const config = consumerConfigFor(ownName);
  if (!config) {
    console.log(`[revt-sync] ${ownName ?? consumerRoot} is not a managed @revt-eng consumer — skipping`);
    return;
  }

  const revtEngDir = process.env.REVT_ENG_DIR
    ? path.resolve(process.env.REVT_ENG_DIR)
    : path.resolve(consumerRoot, '..');

  // Guard BEFORE anything reads the sibling: the tree we are about to treat as
  // the source of truth must be a clean, released one (plan 143).
  assertScaffoldReleasable(path.join(revtEngDir, 'revturbine-scaffold'));

  const fetchLatest = makeRegistryFetcher();
  const scaffoldVersion =
    readJsonVersion(path.join(revtEngDir, 'revturbine-scaffold', 'package.json')) ??
    (await fetchLatest('@revt-eng/schema'));
  const sdkVersion =
    readJsonVersion(path.join(revtEngDir, 'revturbine-sdk-internal', 'web-sdk', 'package.json')) ??
    (await fetchLatest('@revt-eng/sdk'));

  const referenceFor = (pkg) =>
    referenceVersionFor(pkg, { scaffoldVersion, sdkVersion });

  // A reference version that resolved from NEITHER the producer sibling nor the
  // registry means this run cannot verify anything — every pin it leaves alone
  // is unverified, not confirmed. Reporting that as "already exact-pinned" is
  // what let the @revt-eng/sdk pin sit 31 versions stale while every run looked
  // clean, so the no-op path below says so explicitly.
  const unresolved = [
    scaffoldVersion ? null : 'scaffold-produced packages (@revt-eng/core, /schema, /schema-drizzle)',
    sdkVersion ? null : '@revt-eng/sdk',
  ].filter(Boolean);

  const touchedManifests = [];
  for (const manifest of config.manifests) {
    const manifestPath = path.join(consumerRoot, manifest);
    if (!existsSync(manifestPath)) {
      console.warn(`[revt-sync] manifest absent, skipping: ${manifest}`);
      continue;
    }
    const text = readFileSync(manifestPath, 'utf8');
    let pkgObj;
    try {
      pkgObj = JSON.parse(text);
    } catch (err) {
      console.error(`[revt-sync] ${manifest}: parse error — ${err?.message ?? err}`);
      process.exit(1);
    }
    const repins = planRepinsForManifest(pkgObj, config.packages, referenceFor);
    if (repins.length === 0) continue;
    for (const r of repins) {
      console.log(`[revt-sync]   ${manifest}: ${r.pkg} ${r.from} → ${r.to} (${r.field})`);
    }
    writeFileSync(manifestPath, repinManifestText(text, repins), 'utf8');
    touchedManifests.push(manifest);
  }

  // A regen-only consumer (no manifests — e.g. @revturbine/cli) has no pins to
  // compare, so "nothing repinned" is its steady state and must NOT short-
  // circuit the regen. Pinned consumers keep their existing early-out.
  const regenOnly = config.manifests.length === 0;
  if (touchedManifests.length === 0 && !regenOnly) {
    if (unresolved.length > 0) {
      console.warn(
        `[revt-sync] NOTHING VERIFIED — no reference version resolved for: ${unresolved.join('; ')}. `
          + 'Pins were left untouched and may be stale. See the registry warnings above '
          + '(GitHub Packages needs NODE_AUTH_TOKEN/GITHUB_TOKEN), or check out the producer sibling.',
      );
      return;
    }
    console.log('[revt-sync] all @revt-eng/* specifiers already exact-pinned to reference');
    return;
  }

  // Reconcile the consumer's repo-local lockfile and node_modules — only when a
  // manifest actually changed. Nothing was repinned means nothing to reconcile,
  // and a regen-only consumer may not even be pnpm-based: revturbine-cli is
  // npm, where a pnpm install would create a second, conflicting lockfile.
  if (touchedManifests.length > 0) {
    run('pnpm', ['install', '--no-frozen-lockfile'], consumerRoot);

    // Reconcile subdirs with their own standalone pnpm-lock.yaml (installed
    // with `pnpm install --frozen-lockfile` in CI). The consumer-root pass
    // above doesn't touch them, so without this step their locks lag the
    // manifest bump and the frozen CI install fails on the version mismatch.
    // Each subdir has its own pnpm-workspace.yaml boundary, so invoking pnpm
    // there updates its committed lock without inheriting an outer workspace.
    for (const subdir of config.postUpdateSubInstalls ?? []) {
      const subdirAbs = path.join(consumerRoot, subdir);
      if (!existsSync(path.join(subdirAbs, 'package.json'))) {
        console.warn(`[revt-sync] postUpdateSubInstalls: ${subdir}/package.json absent, skipping`);
        continue;
      }
      run('pnpm', ['install', '--no-frozen-lockfile'], subdirAbs);
    }
  }

  if (config.regen) {
    const scripts = JSON.parse(readFileSync(ownPkgPath, 'utf8')).scripts ?? {};
    const scriptName = config.regen.replace(/^pnpm run\s+/, '').replace(/^npm run\s+/, '');
    if (scripts[scriptName]) {
      run(config.regen.split(' ')[0], config.regen.split(' ').slice(1), consumerRoot);
    } else {
      console.warn(`[revt-sync] regen script "${scriptName}" not found in ${ownName} — skipping regen`);
    }
  }

  // Stage only paths that exist — `git add a b missing` aborts the whole
  // invocation on the first non-matching pathspec (staging nothing), so a
  // single absent artifact must not defeat the auto-stage.
  const present = config.stagePaths.filter((p) =>
    existsSync(path.join(consumerRoot, p)),
  );
  if (present.length > 0) {
    try {
      execSync(`git add -- ${present.join(' ')}`, {
        stdio: 'inherit',
        cwd: consumerRoot,
      });
    } catch (err) {
      console.warn(`[revt-sync] git add warning: ${err?.message ?? err}`);
    }
  }
  console.log('[revt-sync] upgraded and staged. Remaining pre-push gates validate the new state.');
}

const invokedAsCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  main().catch((err) => {
    console.error(`[revt-sync] unexpected failure: ${err?.stack ?? err}`);
    process.exit(1);
  });
}
