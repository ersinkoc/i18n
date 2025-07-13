import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '**/*.d.ts', '**/*.config.*'],
      thresholds: {
        global: {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98,
        },
      },
    },
  },
});