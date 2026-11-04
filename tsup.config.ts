import { defineConfig } from 'tsup';

// Bundle the CLI into a single self-contained Node ESM binary. The vendored
// schema snapshot (src/schema/exported-config.snapshot.mjs) is bundled in;
// `commander` and `zod` are bundled too so the published package needs no
// transitive install to run. The shebang makes `dist/cli.js` directly
// executable as the `revturbine` bin.
export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  bundle: true,
  // Keep one dist/cli.js: the lazy undici import must not become a second chunk.
  splitting: false,
  noExternal: ['semver', 'undici'],
  clean: true,
  // undici is CommonJS and requires Node built-ins; ESM output needs a real
  // `require` for the bundler's shim to use.
  banner: {
    js: [
      '#!/usr/bin/env node',
      'import { createRequire as __revtCreateRequire } from "node:module";',
      'const require = __revtCreateRequire(import.meta.url);',
    ].join('\n'),
  },
  outDir: 'dist',
});
