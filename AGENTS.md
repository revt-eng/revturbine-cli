@../../revturbine-devkit/AGENTS.md

# AGENTS.md — revturbine-cli

**Never create agent-specific instruction files** (e.g. `CLAUDE.md`, `copilot-instructions.md`, `.cursor/rules`). `AGENTS.md` is the single source of truth for all AI tools in this repo.

This repo is the public `@revturbine/cli` package (command: `revturbine`). It is
**public and MIT** — assume everything here ships to customers.

## npm, not pnpm

The rest of the workspace is pnpm. **This repo is npm** (`package-lock.json`,
`packageManager: npm@11.18.0`). Running `pnpm install` here will produce a
second, conflicting lockfile.

```bash
npm run verify    # typecheck && lint && test — run after every change
npm run build     # tsup → dist/cli.js (single bundled ESM binary)
npm test          # vitest run
```

There is no `pnpm verify` in this repo.

## Product specs

Specs live in the `revturbine-devkit` repo at `docs/specs/cli/`:

- [`cli.md`](../../revturbine-devkit/docs/specs/cli/cli.md) — the command surface, the Playbook file → Draft → Release model, design principles.
- [`installable-skills.md`](../../revturbine-devkit/docs/specs/cli/installable-skills.md) — the skills catalog. **§6 is superseded**; skill distribution is `npx skills`, not a `revturbine skills` command group.

Read the relevant spec before implementing. Note affected specs in the PR.

## Key rules

1. **Exit codes come from `src/lib/output.ts`.** Commands never invent their own. Use `fail(EXIT.X, msg)`; the classes are 0 ok · 1 unexpected · 2 usage · 3 auth · 4 validation · 5 conflict · 6 network · 7 server.
2. **Results → stdout, diagnostics → stderr.** `emit()` writes results (and honors `--json`); `diag()`/`diagRaw()` write diagnostics. Never `console.log` a result.
3. **Keep `src/lib/*.ts` pure.** Detection, parsing, and decision logic take their inputs as arguments and are unit-tested without a filesystem or child process. `cli.ts` owns the IO. This is why the suite runs in seconds without spawning the binary.
4. **`src/schema/` is generated — never hand-edit.** `exported-config.snapshot.mjs`, `validators.snapshot.mjs`, `SCHEMA_VERSION`, and `version.ts` come from `npm run generate:schema`. The snapshot is what makes validation fully offline. All four record the scaffold version they came from and `check:schema` fails if they disagree — a mismatch always means a hand-edit or a partial regeneration, so fix it by regenerating, never by editing the stamp.
5. **Commands that read a config require an explicit version selector** — `<file>` / `--draft` / `--live` / `--release <id>`. There are no defaults; ambiguity is a usage error.
6. **Every command is documented in three places** that must stay in sync: its commander `.description()`, the `HELP_AFTER` block in `cli.ts`, and `README.md`.

## Directory map

```
src/cli.ts            ← commander wiring + all IO (the only place that spawns/fetches)
src/lib/              ← pure, unit-tested logic (one concern per file)
  output.ts           ← exit classes, diag/emit/fail — the machine contract
  credentials.ts      ← ~/.revturbine/credentials.json (0600)
  device-auth.ts      ← RFC 8628 device flow
  playbook-header.ts  ← format_version gate (rejects unknown Playbook formats)
  selectors.ts        ← version-selector resolution
src/schema/           ← GENERATED vendored snapshot (DO NOT EDIT)
tests/                ← vitest; no config file, defaults apply
```

## Gotchas

- **`DEFAULT_URL` is the bare apex `https://revturbine.com/app`.** Never `www` — `www` 308-redirects to the apex, and that cross-origin redirect strips the `Authorization` header, which 401s every authenticated command.
- **Schema drift is one-directional.** `warnIfSchemaBehind()` only fires when the *server's* schema is newer than the bundled snapshot; the remedy is updating the CLI. There is no "CLI is newer than the playbook" check.
- **The published bundle has no runtime dependencies.** tsup bundles `commander` and `zod` into `dist/cli.js`. Adding a dependency that must resolve at runtime breaks that guarantee.
- **Node ≥ 22.13**, build target `node22`. CI additionally runs a packed-CLI smoke on both 22.13 and 24.

## CI

`verify` (typecheck + lint + **check:schema** + test) and `Packed CLI smoke` on Node 22.13 and 24. All must pass; never bypass.

There is deliberately **no cross-repo drift check here.** This repo is public and scaffold is private, so such a check needed a credential it never had — it skipped every step while reporting green, and the snapshot silently fell 26 versions behind. Keeping the snapshot *current* is now scaffold's job: its release opens a PR here with the regenerated files (plan 143). This side runs only the part that needs no credential — `check:schema`, which proves the four generated artifacts agree with each other.

## Publishing

**Releasing = merging a version bump to `main`.** `publish-on-main.yml` sees the changed `package.json`, publishes to public npm directly (`npm publish --access public --provenance`, repo-level `NPM_TOKEN`), then pushes the matching `v<version>` tag with the default `GITHUB_TOKEN` as a **record**. Publish-then-tag is deliberate: nothing downstream is tag-triggered anymore, so no cross-workflow PAT is needed — this repo is public, and the org `REVTURBINE_GIT_TOKEN` is withheld from public repos by design (the old tag-first flow "skipped cleanly" on the missing secret and silently stranded 0.15.0–0.16.2 unpublished until hand-tagged, 2026-08-11). The publish step is idempotent against the registry: re-runs and unrelated `package.json` edits publish nothing and only self-heal a missing tag.

**Never hand-publish** — the CI automation token bypasses npm 2FA, which a local `npm publish` does not. `release.yml` (tag-triggered) remains the manual escape hatch: hand-push a `v<version>` tag at the version-bump commit to publish a version missing from npm.

## Memory

<!-- Claude: update this section with learnings about how to build, test, and run this project. -->
