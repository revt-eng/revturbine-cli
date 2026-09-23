import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * BL-0143 — "regenerate and diff" must be a clean reproducibility check
 * regardless of the generating machine's workspace layout.
 *
 * `scripts/generate-schema-snapshot.mjs` bundles scaffold's Zod entry with
 * esbuild, which prefixes every bundled module with a `// <path>` boundary
 * comment written RELATIVE TO THE PROCESS CWD at build time. Before this
 * fix, that meant two equally-correct invocations — different cwd, or a
 * `--scaffold-dir` pointed at a differently-nested checkout — produced
 * marker-only diffs (cli #78: 76 lines changed, 0 semantic; `../scaffold`
 * vs `../../revt-eng/revturbine-scaffold`). The generator now rewrites any
 * marker resolving inside the scaffold source tree to a stable,
 * root-relative `// scaffold/<path>` form.
 *
 * This test regenerates the vendored bundles TWICE from the real scaffold
 * checkout — once from this repo's own directory and once from an
 * unrelated, differently-nested temp copy — and asserts the two runs (and
 * the currently committed snapshot) are byte-identical. It is NOT the
 * cross-repo drift/currency gate that reference-cli-schema-drift-gate-noop
 * warns against re-adding (that check compared the snapshot's CONTENT
 * against a possibly-newer scaffold and needed a credential the public CI
 * runner doesn't have); this only asks whether regenerating is
 * deterministic with respect to *where* scaffold happens to sit, which
 * needs nothing scaffold doesn't already provide locally. It therefore
 * skips cleanly wherever no scaffold checkout is present — including this
 * repo's own CI, exactly like `check:schema` already does.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatorScript = path.join(repoRoot, 'scripts', 'generate-schema-snapshot.mjs');

const scaffoldDir = process.env.SCAFFOLD_DIR
  ? path.resolve(process.env.SCAFFOLD_DIR)
  : path.resolve(repoRoot, '..', 'revturbine-scaffold');

const hasScaffold = existsSync(path.join(scaffoldDir, 'src', 'core', 'zod', 'index.ts'));

const SNAPSHOT_FILES = ['exported-config.snapshot.mjs', 'validators.snapshot.mjs'];

// node_modules junctions created per temp repo copy — unlinked explicitly
// (never via a recursive rm of an ancestor) before tmpRoot cleanup. A
// recursive delete that walks through a Windows junction can destroy the
// REAL target directory instead of just the link (this bit devkit for real
// on 2026-09-17/18 — see reference-never-rm-rf-a-worktree-dir-windows).
const nodeModulesLinks: string[] = [];

function makeRepoCopy(root: string) {
  mkdirSync(path.join(root, 'scripts'), { recursive: true });
  mkdirSync(path.join(root, 'src', 'schema'), { recursive: true });
  cpSync(generatorScript, path.join(root, 'scripts', 'generate-schema-snapshot.mjs'));
  // The generator imports 'esbuild' by bare specifier; give this isolated
  // copy access to this repo's already-installed node_modules rather than
  // reinstalling (or copying) the whole dependency tree per temp repo.
  const nodeModulesLink = path.join(root, 'node_modules');
  symlinkSync(path.join(repoRoot, 'node_modules'), nodeModulesLink, 'junction');
  nodeModulesLinks.push(nodeModulesLink);
  return root;
}

function runGenerator(repoCopyRoot: string, scaffoldArg: string) {
  execFileSync(
    process.execPath,
    [path.join(repoCopyRoot, 'scripts', 'generate-schema-snapshot.mjs'), '--scaffold-dir', scaffoldArg],
    { stdio: 'pipe' },
  );
}

describe.runIf(hasScaffold)('vendored schema snapshot reproducibility (BL-0143)', () => {
  let tmpRoot: string;

  beforeAll(() => {
    tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'cli-schema-repro-'));
  }, 60_000);

  afterAll(() => {
    // Unlink every node_modules junction FIRST so the recursive cleanup
    // below never has to traverse one.
    for (const link of nodeModulesLinks) {
      try {
        unlinkSync(link);
      } catch {
        // already gone or never created — fine.
      }
    }
    if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('produces byte-identical bundles from repo copies at different relative depths from scaffold', () => {
    // Two "repo" copies of just the generator script, nested at different
    // depths under the temp root, both pointed at the SAME scaffold
    // checkout. Their relative distance to scaffold differs (one `../`
    // level vs. several), mirroring the real-world `../scaffold` vs.
    // `../../revt-eng/revturbine-scaffold` divergence from cli #78.
    const shallowRepo = makeRepoCopy(path.join(tmpRoot, 'shallow-cli'));
    const deepRepo = makeRepoCopy(path.join(tmpRoot, 'deeply', 'nested', 'elsewhere', 'cli-copy'));

    runGenerator(shallowRepo, scaffoldDir);
    runGenerator(deepRepo, scaffoldDir);

    for (const name of SNAPSHOT_FILES) {
      const shallowBytes = readFileSync(path.join(shallowRepo, 'src', 'schema', name), 'utf8');
      const deepBytes = readFileSync(path.join(deepRepo, 'src', 'schema', name), 'utf8');
      expect(deepBytes, `${name} differs between two layouts at different depths from scaffold`).toBe(shallowBytes);
    }
  }, 60_000);

  it('matches the committed snapshot byte-for-byte when regenerated from the real scaffold checkout', () => {
    const repoCopy = makeRepoCopy(path.join(tmpRoot, 'committed-check-cli'));
    runGenerator(repoCopy, scaffoldDir);

    for (const name of SNAPSHOT_FILES) {
      const regenerated = readFileSync(path.join(repoCopy, 'src', 'schema', name), 'utf8');
      const committed = readFileSync(path.join(repoRoot, 'src', 'schema', name), 'utf8');
      expect(regenerated, `${name} is not byte-identical to the committed snapshot`).toBe(committed);
    }
  }, 60_000);
});
