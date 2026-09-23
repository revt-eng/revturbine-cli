#!/usr/bin/env node
/**
 * Generate the vendored, version-stamped ExportedConfigSchema snapshot.
 *
 * The public `revturbine-cli` repo MUST validate configs with zero access to
 * the private `@revt-eng/schema` package or the `revturbine-scaffold` source.
 * This script bundles scaffold's canonical Zod entry (`src/core/zod/index.ts`,
 * published as `@revt-eng/schema/zod`) into a single self-contained ESM file
 * checked into the repo at `src/schema/exported-config.snapshot.mjs`, plus a
 * `SCHEMA_VERSION` stamp recording the scaffold package version it came from.
 *
 * `zod` is left external — it is a normal runtime dependency of the CLI, pinned
 * to the same version scaffold uses (4.4.3). The snapshot therefore imports
 * from 'zod' and contributes no private dependency to the published artifact.
 *
 * Run this in the umbrella workspace (where the scaffold sibling exists). CI's
 * schema-drift job re-runs it and fails if the checked-in snapshot is stale.
 *
 *   node scripts/generate-schema-snapshot.mjs [--scaffold-dir <path>]
 */
import { build } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const scaffoldDir = path.resolve(
  arg('--scaffold-dir', path.resolve(repoRoot, '..', 'revturbine-scaffold')),
);
const zodEntry = path.join(scaffoldDir, 'src', 'core', 'zod', 'index.ts');
const pkgPath = path.join(scaffoldDir, 'package.json');

if (!existsSync(zodEntry)) {
  console.error(`[generate-schema] scaffold zod entry not found: ${zodEntry}`);
  console.error('  Pass --scaffold-dir <path-to-revturbine-scaffold>.');
  process.exit(1);
}

const scaffoldPkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = scaffoldPkg.version;
const outFile = path.join(repoRoot, 'src', 'schema', 'exported-config.snapshot.mjs');
const versionFile = path.join(repoRoot, 'src', 'schema', 'SCHEMA_VERSION');
const versionModule = path.join(repoRoot, 'src', 'schema', 'version.ts');

/**
 * Graph annotations belong to the repository that owns the construct.
 *
 * esbuild carries scaffold's `@revturbine-graph` comments into this vendored
 * bundle verbatim, which made 141 of them show up here claiming this
 * repository binds scaffold's nodes. They are meaningless in a copy: nothing
 * here owns those constructs, and devkit's binding check counted them as
 * handles with no index behind them (plan 253).
 *
 * Only a whole-line marker comment is removed, so a string or regex that
 * merely mentions the marker survives untouched.
 */
const MARKER_LINE = /^[\t ]*(?:\/\/|#|--|%%|\*) @revturbine-graph [^\n]*\r?\n/gm;

function stripVendoredAnnotations(file) {
  const text = readFileSync(file, 'utf8');
  const cleaned = text.replace(MARKER_LINE, '');
  if (cleaned === text) return 0;
  writeFileSync(file, cleaned, 'utf8');
  return text.split('\n').length - cleaned.split('\n').length;
}

/**
 * esbuild prefixes every bundled module with a `// <path>` boundary comment,
 * and that path is written RELATIVE TO THE PROCESS'S CURRENT WORKING
 * DIRECTORY at build time — i.e. it bakes in wherever the generating
 * machine happened to invoke this script from and however many `../`
 * segments that cwd was from the scaffold checkout. Two correct
 * invocations from different cwds (or against a `--scaffold-dir` pointed
 * at a differently-named/nested checkout) produce marker-only diffs with
 * zero semantic content (cli #78: 76 lines changed, 0 semantic — BL-0143).
 * Rewrite each marker that resolves inside the scaffold source tree to a
 * stable, root-relative form (`// scaffold/<path-from-scaffold-src-root>`)
 * so the vendored bytes are identical regardless of cwd or checkout layout.
 */
const MODULE_PATH_MARKER = /^\/\/ ([^\r\n]+\.(?:ts|tsx|mts|cts))$/gm;

function normalizeSourceMarkers(file, sourceRoot, rootLabel) {
  const text = readFileSync(file, 'utf8');
  let count = 0;
  const rewritten = text.replace(MODULE_PATH_MARKER, (line, relPath) => {
    const abs = path.resolve(process.cwd(), relPath);
    const rel = path.relative(sourceRoot, abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return line;
    count += 1;
    return `// ${rootLabel}/${rel.split(path.sep).join('/')}`;
  });
  if (count === 0) return 0;
  writeFileSync(file, rewritten, 'utf8');
  return count;
}

const banner = `// GENERATED — do not edit by hand.
// Vendored ExportedConfigSchema snapshot bundled from @revt-eng/schema@${version}
// (revturbine-scaffold/src/core/zod/index.ts). Regenerate with:
//   node scripts/generate-schema-snapshot.mjs
`;

await build({
  entryPoints: [zodEntry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['zod'],
  outfile: outFile,
  banner: { js: banner },
  logLevel: 'info',
});

// The shared validation engine (plan 131 TASK-8): pure evaluate(graph) over
// the same portable config — offline semantic rules for `validate <file>`.
const validationEntry = path.join(scaffoldDir, 'src', 'core', 'validation', 'index.ts');
const validatorsOut = path.join(repoRoot, 'src', 'schema', 'validators.snapshot.mjs');
await build({
  entryPoints: [validationEntry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['zod'],
  outfile: validatorsOut,
  banner: {
    js: `// GENERATED — do not edit by hand.\n// Vendored validation engine bundled from @revt-eng/schema@${version}\n// (revturbine-scaffold/src/core/validation/index.ts). Regenerate with:\n//   node scripts/generate-schema-snapshot.mjs\n`,
  },
  logLevel: 'info',
});
console.log(`[generate-schema] wrote ${path.relative(repoRoot, validatorsOut)} (validators ${version})`);

const strippedSchema = stripVendoredAnnotations(outFile);
const strippedValidators = stripVendoredAnnotations(validatorsOut);
if (strippedSchema || strippedValidators) {
  console.log(`[generate-schema] stripped ${strippedSchema + strippedValidators} vendored graph annotation(s)`);
}

const normalizedSchema = normalizeSourceMarkers(outFile, scaffoldDir, 'scaffold');
const normalizedValidators = normalizeSourceMarkers(validatorsOut, scaffoldDir, 'scaffold');
if (normalizedSchema || normalizedValidators) {
  console.log(
    `[generate-schema] normalized ${normalizedSchema + normalizedValidators} source marker(s) to a layout-independent form`,
  );
}

writeFileSync(versionFile, `${version}\n`, 'utf8');
writeFileSync(
  versionModule,
  `// GENERATED — do not edit. Schema version this snapshot was bundled from.\n` +
    `// Regenerate with: node scripts/generate-schema-snapshot.mjs\n` +
    `export const SCHEMA_VERSION = '${version}';\n`,
  'utf8',
);
console.log(`[generate-schema] wrote ${path.relative(repoRoot, outFile)} (schema ${version})`);
console.log(`[generate-schema] wrote ${path.relative(repoRoot, versionFile)}`);
console.log(`[generate-schema] wrote ${path.relative(repoRoot, versionModule)}`);
