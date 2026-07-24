/**
 * Pick the offline structural schema for a config by its wire shape
 * (plan 142 TASK-4).
 *
 * `validate <file>` previously ran every file through the legacy
 * `RevTurbineConfigSchema`, so a canonical Playbook — the shape new artifacts
 * use — failed with "version is required". Plan 147 collapsed both shapes into
 * one lenient config schema (`ExportedConfig` === `RevTurbineConfig` ===
 * `Playbook`) that normalizes a legacy header on parse, so either wire shape
 * validates; the detected `shape` is retained only to label diagnostics.
 */

import { PlaybookSchema, RevTurbineConfigSchema } from '../schema/exported-config.snapshot.mjs';
import { readPlaybookHeader } from './playbook-header';

export type ParseSurface = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };
};

export type SchemaChoice = {
  schema: ParseSurface;
  /** Which wire shape was detected — used to label diagnostics. */
  shape: 'canonical' | 'legacy';
};

/**
 * A config carrying `artifact_type: 'playbook'` validates as a canonical
 * Playbook; anything else falls back to the legacy schema, which also produces
 * the right "this isn't a config at all" errors for junk input.
 */
export function schemaForConfig(raw: unknown): SchemaChoice {
  const header = readPlaybookHeader(raw);
  return header.shape === 'canonical'
    ? { schema: PlaybookSchema as ParseSurface, shape: 'canonical' }
    : { schema: RevTurbineConfigSchema as ParseSurface, shape: 'legacy' };
}
