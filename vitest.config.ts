import { defineConfig } from 'vitest/config';

// Unit tests for the plugin's framework-agnostic TypeScript logic. The
// suites here exercise pure functions (no OpenLayers, DOM, or Redmine
// runtime), so the lightweight Node environment is enough; tests are
// co-located with the modules they cover as *.test.ts.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
});
