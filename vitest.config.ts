import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.ts'],
      exclude: ['scripts/**/*.test.ts', 'scripts/**/types.ts'],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './scripts/shared'),
      '@vitemonkey-built': path.resolve(__dirname, './scripts/vitemonkey-built'),
      '@just-written': path.resolve(__dirname, './scripts/just-written'),
    },
  },
});
