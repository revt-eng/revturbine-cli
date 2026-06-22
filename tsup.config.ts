import { defineConfig } from 'tsup';

// Bundle the CLI into a single self-contained Node ESM binary. The vendored
// schema snapshot (src/schema/exported-config.snapshot.mjs) is bundled in;
// `commander` and `zod` are bundled too so the published package needs no
// transitive install to run. The shebang makes `dist/cli.js` directly
// executable as the `revt-config` bin.
export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  bundle: true,
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  outDir: 'dist',
});
