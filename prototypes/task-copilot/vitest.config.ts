import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM APIs (needed for React components)
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],

    // Include test files - prefer .vitest.ts naming for converted tests
    include: ['**/*.vitest.{ts,tsx}', 'lib/storage.test.ts'],

    // Exclude node_modules and old custom test files
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'lib/priority.test.ts',      // Old custom runner format
      'lib/queue-reorder.test.ts', // Old custom runner format
    ],

    // Global test APIs (describe, it, expect) without imports
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/*.test.ts', 'lib/**/*.spec.ts'],
    },

    // Timeout for async tests
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
