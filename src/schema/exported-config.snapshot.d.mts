// Type surface for the generated RevTurbineConfigSchema snapshot
// (exported-config.snapshot.mjs). The snapshot is a bundled Zod schema; the CLI
// only needs its `safeParse` surface, typed structurally here so no zod types
// leak into the public API. Regenerate the snapshot with
// `node scripts/generate-schema-snapshot.mjs`; this declaration is stable.
type ParseSurface = {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };
};

/**
 * The canonical Playbook — `PlaybookHeaderSchema.extend(PlaybookBodySchema.shape)`,
 * a superset of the legacy body. This is the shape new artifacts use.
 */
export const PlaybookSchema: ParseSurface;
/** @deprecated the legacy `RevTurbineConfig` wire shape; new artifacts use PlaybookSchema. */
export const RevTurbineConfigSchema: ParseSurface;
/** @deprecated legacy alias of RevTurbineConfigSchema (plan 104). */
export const ExportedConfigSchema: ParseSurface;
