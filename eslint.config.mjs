import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Generated / vendored / build output — never linted. Both `*.snapshot.mjs`
    // files (the schema bundle and the validation engine) are emitted by one
    // `npm run generate:schema` run and carry unused intermediate bindings from
    // esbuild's tree — lint them and every regeneration would go red.
    ignores: ['dist/**', 'src/schema/*.snapshot.mjs', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        // Node globals used by the CLI without importing them.
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
