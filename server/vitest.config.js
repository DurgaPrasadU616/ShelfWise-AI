import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['../tests/server/**/*.{test,spec}.js'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../tests', import.meta.url)),
    },
  },
});
