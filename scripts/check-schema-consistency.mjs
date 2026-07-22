#!/usr/bin/env node

/**
 * Assert the vendored schema snapshot is internally consistent (plan 143 REQ-6).
 *
 * Four artifacts are written by a single `generate:schema` run and all record
 * the scaffold version they came from:
 *
 *   src/schema/SCHEMA_VERSION                  the bare stamp
 *   src/schema/version.ts                      the exported constant
 *   src/schema/exported-config.snapshot.mjs    banner comment
 *   src/schema/validators.snapshot.mjs         banner comment
 *
 * Because one run writes all four, disagreement is ALWAYS a defect: a
 * hand-edited stamp, a half-applied merge, or a partial regeneration. It cannot
 * legitimately happen.
 *
 * This replaces `schema-drift.yml`, which compared the snapshot against live
 * scaffold source and therefore needed a credential the public repo could not
 * have. That check skipped silently for its entire life — 20/20 green while the
 * snapshot fell 26 versions behind. Cross-repo currency is now scaffold's job:
 * its release opens a PR here with the regenerated snapshot (plan 143 TASK-2).
 * What remains for this side is the part that needs no credential — proving the
 * committed artifact is coherent with itself.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = path.join(repoRoot, 'src', 'schema');

const SEMVER = /\d+\.\d+\.\d+/;

/** Each source, with how to pull the version out of it. */
const SOURCES = [
  {
    file: 'SCHEMA_VERSION',
    extract: (text) => text.trim().match(SEMVER)?.[0],
    describe: 'the bare version stamp',
  },
  {
    file: 'version.ts',
    extract: (text) => text.match(/SCHEMA_VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/)?.[1],
    describe: 'the exported SCHEMA_VERSION constant',
  },
  {
    file: 'exported-config.snapshot.mjs',
    extract: (text) => text.match(/@revt-eng\/schema@(\d+\.\d+\.\d+)/)?.[1],
    describe: "the schema bundle's generated banner",
  },
  {
    file: 'validators.snapshot.mjs',
    extract: (text) => text.match(/@revt-eng\/schema@(\d+\.\d+\.\d+)/)?.[1],
    describe: "the validation engine's generated banner",
  },
];

const found = [];
const unreadable = [];

for (const source of SOURCES) {
  const full = path.join(SCHEMA_DIR, source.file);
  let version;
  try {
    version = source.extract(readFileSync(full, 'utf8'));
  } catch (err) {
    unreadable.push(`${source.file} — ${err?.message ?? err}`);
    continue;
  }
  if (!version) {
    unreadable.push(`${source.file} — no version found in ${source.describe}`);
    continue;
  }
  found.push({ ...source, version });
}

if (unreadable.length > 0) {
  console.error('[schema-consistency] cannot read a version from:');
  for (const problem of unreadable) console.error(`    ${problem}`);
  console.error('  Regenerate with: npm run generate:schema -- --scaffold-dir <path-to-revturbine-scaffold>');
  process.exit(1);
}

const versions = [...new Set(found.map((f) => f.version))];

if (versions.length > 1) {
  console.error(
    `[schema-consistency] the vendored snapshot disagrees with itself — ${versions.length} different versions across 4 files:`,
  );
  for (const f of found) console.error(`    ${f.version}  ${f.file}  (${f.describe})`);
  console.error('');
  console.error('  All four are written by ONE `generate:schema` run, so this is always a defect —');
  console.error('  a hand-edited stamp, a half-applied merge, or a partial regeneration.');
  console.error('  Fix by regenerating rather than editing:');
  console.error('    npm run generate:schema -- --scaffold-dir <path-to-revturbine-scaffold>');
  process.exit(1);
}

console.log(`[schema-consistency] vendored snapshot is internally consistent at ${versions[0]} (4/4 files agree).`);
