#!/usr/bin/env node
// Whether one exact version of a package is on the public npm registry (snapshot-patch-release.yml, ST-11618).
//
// "Not published" is a decision, so it needs proof: only npm's own E404 means it. A network error, a rate
// limit, a 5xx or an answer that cannot be read says nothing about the version, and fails the job instead.
//
// Usage: node scripts/npm-published.mjs <name> <version>
// Prints `true` or `false`. Exit code: 0 when the registry answered, 1 on anything else.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const REGISTRY = 'https://registry.npmjs.org/';
const NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function npm(args) {
  // npm is a .cmd shim on Windows; the arguments are fixed flags and validated values.
  return spawnSync('npm', args, { encoding: 'utf8', shell: process.platform === 'win32' });
}

/** true: the registry has exactly this version. false: it answered E404. Throws on anything else. */
export function isOnNpm(name, version, run = npm) {
  if (!NAME.test(name ?? '')) throw new Error(`not a package name: ${JSON.stringify(name)}`);
  if (!VERSION.test(version ?? '')) throw new Error(`not an exact version: ${JSON.stringify(version)}`);
  const spec = `${name}@${version}`;
  const result = run(['view', spec, 'version', '--json', '--registry', REGISTRY]);
  if (result.error) throw new Error(`npm view ${spec} did not run: ${result.error.message}`);
  const out = String(result.stdout ?? '').trim();
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch {
    parsed = undefined;
  }
  if (result.status === 0 && parsed === version) return true;
  // npm prints { "error": { "code": ... } } on stdout and exits 1.
  if (result.status === 1 && parsed?.error?.code === 'E404') return false;
  const why = parsed?.error?.code ?? (String(result.stderr ?? '').trim() || out || 'no output');
  throw new Error(`npm view ${spec} gave no usable answer (exit ${result.status ?? result.signal}): ${String(why).slice(0, 500)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [name, version, ...rest] = process.argv.slice(2);
    if (rest.length) throw new Error('usage: node scripts/npm-published.mjs <name> <version>');
    console.log(String(isOnNpm(name, version)));
  } catch (error) {
    console.error(process.env.GITHUB_ACTIONS === 'true' ? `::error::${error.message.replace(/\r?\n/g, ' ')}` : error.message);
    process.exit(1);
  }
}
