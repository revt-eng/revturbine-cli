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
  target: 'node20',
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
  target: 'node20',
  external: ['zod'],
  outfile: validatorsOut,
  banner: {
    js: `// GENERATED — do not edit by hand.\n// Vendored validation engine bundled from @revt-eng/schema@${version}\n// (revturbine-scaffold/src/core/validation/index.ts). Regenerate with:\n//   node scripts/generate-schema-snapshot.mjs\n`,
  },
  logLevel: 'info',
});
console.log(`[generate-schema] wrote ${path.relative(repoRoot, validatorsOut)} (validators ${version})`);

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
