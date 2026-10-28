import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Collections dont les dates sont calculées à la lecture (src/lib/content.ts)
const DATED = ['evenements', 'materiel', 'reservations', 'actualites'];

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Interdit de lire directement une collection datée : ses dates seraient brutes
    files: ['src/**/*.{ts,astro}'],
    ignores: ['src/lib/content.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...DATED.map((name) => ({
          selector: `CallExpression[callee.name=/^get(Collection|Entry)$/][arguments.0.value='${name}']`,
          message: `Utilisez src/lib/content.ts pour lire « ${name} » (dates calculées à la lecture).`,
        })),
      ],
    },
  },
];
