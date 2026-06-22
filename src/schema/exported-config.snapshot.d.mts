// Type surface for the generated ExportedConfigSchema snapshot
// (exported-config.snapshot.mjs). The snapshot is a bundled Zod schema; the CLI
// only needs its `safeParse` surface, typed structurally here so no zod types
// leak into the public API. Regenerate the snapshot with
// `node scripts/generate-schema-snapshot.mjs`; this declaration is stable.
export const ExportedConfigSchema: {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };
};
