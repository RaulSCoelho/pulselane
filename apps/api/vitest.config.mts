import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.integration.spec.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    reporters: [['verbose', { summary: true }]]
  }
})
