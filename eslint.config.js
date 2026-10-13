import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Architecture guard rails (see docs/adr/0001-feature-architecture.md):
 *   app → routes → features → shared        (one-way dependency flow)
 *   features talk to each other only through their public `index.ts`
 *   app code never imports from `src/mocks` (mocks live behind the network)
 */
export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      'lighthouse/reports',
      'public/mockServiceWorker.js',
      'src/app/routeTree.gen.ts',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      boundaries,
    },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', partialMatch: false },
        { type: 'routes', pattern: 'src/routes/**', partialMatch: false },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['sharedModule'] },
        { type: 'mocks', pattern: 'src/mocks/**', partialMatch: false },
      ],
      'boundaries/files': [{ category: 'test', pattern: '**/*.test.{ts,tsx}' }],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],

      'boundaries/dependencies': [
        2,
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: { anyOf: ['app', 'routes', 'feature', 'shared'] } } } },
            },
            {
              from: { element: { type: 'routes' } },
              allow: { to: { element: { types: { anyOf: ['app', 'routes', 'feature', 'shared'] } } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { types: { anyOf: ['feature', 'shared'] } } } },
            },
            { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
            {
              from: { element: { type: 'mocks' } },
              allow: { to: { element: { types: { anyOf: ['mocks', 'shared'] } } } },
            },
            // Production code never reaches into test files.
            { disallow: { to: { file: { categories: 'test' } } } },
          ],
        },
      ],

      // Cross-feature imports must go through the feature's public API (index.ts),
      // and inside a feature imports are relative.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '@/features/*/**'],
              message: 'Importe a feature pela API pública: "@/features/<nome>".',
            },
            {
              group: ['@/mocks', '@/mocks/*', '**/mocks/**'],
              message: 'Código da aplicação não importa mocks: eles ficam na camada de rede (MSW).',
            },
          ],
        },
      ],
    },
  },
  {
    // The entry point is the only place allowed to lazily boot the mock worker.
    files: ['src/main.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Route modules export `Route`; shadcn files co-export their cva variants.
    files: ['src/routes/**/*.tsx', 'src/shared/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // The simulated backend works on fixtures it fully controls.
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    // Pure domain layer: no React, no HTTP, no cache library.
    files: ['src/features/*/model/**/*.ts', 'src/shared/money/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'axios',
                '@tanstack/*',
                'socket.io-client',
                '@/shared/http',
                '@/shared/http/*',
              ],
              message: 'A camada model/ é pura: sem React, HTTP ou cache.',
            },
            { group: ['@/features/*/*', '@/features/*/**'], message: 'Importe a feature pela API pública.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['e2e/**/*.ts', 'scripts/**/*.{ts,js,mjs}', '*.config.{ts,js}', 'lighthouse/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
)
