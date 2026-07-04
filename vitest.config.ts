import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/desktop/src/main/**/*.test.ts'],
    environment: 'node',
    // Generators are deterministic (seeded RNG); tests must not be flaky.
    retry: 0,
  },
});
