import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { domInclude, resolveAlias, sharedTestOptions } from './vitest.shared.js';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const localStorageFile = path.resolve(repoRoot, '.vitest-localstorage');
const nodeLocalStorageArgv = [`--localstorage-file=${localStorageFile}`];

const domEnvironmentGlobs = domInclude.map((pattern) => [pattern, 'happy-dom'] as [string, string]);

/** Shipped TRAC feature slices — measured in coverage HTML (dialogs excluded). */
const featureCoverageGlobs = [
  'src/features/assignments/**/*.{ts,tsx}',
  'src/features/contacts/**/*.{ts,tsx}',
  'src/features/costs/**/*.{ts,tsx}',
  'src/features/dashboard/**/*.{ts,tsx}',
  'src/features/itinerary/**/*.{ts,tsx}',
  'src/features/master-plan/**/*.{ts,tsx}',
  'src/features/planning/**/*.{ts,tsx}',
  'src/features/risks/**/*.{ts,tsx}',
];

export default defineConfig({
  plugins: [react()],
  test: {
    ...sharedTestOptions,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    environment: 'node',
    environmentMatchGlobs: domEnvironmentGlobs,
    setupFiles: ['./src/test-setup.ts'],
    poolOptions: {
      threads: {
        execArgv: nodeLocalStorageArgv,
      },
      forks: {
        execArgv: nodeLocalStorageArgv,
      },
    },
    coverage: {
      provider: 'v8',
      /** Only instrument files loaded during tests — faster validate/CI runs with broad include globs. */
      all: false,
      reporter: ['text', 'html'],
      include: [
        'src/app-config.ts',
        'src/app/navigation/**/*.ts',
        'src/app/pages/**/*.tsx',
        'src/app/shell/**/*.tsx',
        'src/app/routes/**/*.ts',
        'src/hooks/journal/**/*.ts',
        'src/components/journal/**/*.tsx',
        'src/utils/journal-*.ts',
        ...featureCoverageGlobs,
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.integration.test.ts',
        '**/*.integration.test.tsx',
        '**/types.ts',
        '**/index.ts',
        'src/features/**/components/**',
        'src/features/costs/CurrencyRatesContent.tsx',
        '**/dist/**',
        '**/coverage/**',
        '**/node_modules/**',
      ],
      thresholds: {
        'src/app-config.ts': { statements: 100, lines: 100 },
        'src/app/navigation/**/*.ts': { statements: 85, lines: 85 },
        'src/app/pages/**/*.tsx': { statements: 70, lines: 70 },
        'src/hooks/journal/**/*.ts': { statements: 70, lines: 70 },
        'src/components/journal/**/*.tsx': { statements: 70, lines: 70 },
        'src/utils/journal-*.ts': { statements: 85, lines: 85 },
        'src/app/shell/**/*.tsx': { statements: 70, lines: 70 },
        'src/app/routes/**/*.ts': { statements: 85, lines: 85 },
        'src/features/contacts/**/*.{ts,tsx}': { statements: 70, lines: 70 },
        'src/features/itinerary/**/*.{ts,tsx}': { statements: 70, lines: 70 },
        'src/features/risks/**/*.{ts,tsx}': { statements: 70, lines: 70 },
      },
    },
  },
  resolve: {
    alias: {
      ...resolveAlias,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
});
