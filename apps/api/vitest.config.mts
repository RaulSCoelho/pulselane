import { defineConfig } from 'vitest/config'

const criticalCoverageInclude = [
  'src/modules/auth/**/*.ts',
  'src/modules/billing/**/*.ts',
  'src/modules/clients/**/*.ts',
  'src/modules/comments/**/*.ts',
  'src/modules/invitations/**/*.ts',
  'src/modules/membership/**/*.ts',
  'src/modules/organization/**/*.ts',
  'src/modules/projects/**/*.ts',
  'src/modules/tasks/**/*.ts',
  'src/modules/audit-logs/**/*.ts',
  'src/infra/observability/**/*.ts'
]

const coverageExclude = [
  'src/**/*.module.ts',
  'src/**/*.dto.ts',
  'src/**/*.types.ts',
  'src/**/*.interface.ts',
  'src/**/*.enum.ts',
  'src/**/*.constants.ts',
  'src/**/*.spec.ts',
  'src/**/index.ts',
  'src/main.ts',
  'test/**/*.ts'
]

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
    reporters: [['verbose', { summary: true }]],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: criticalCoverageInclude,
      exclude: coverageExclude,
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,

        'src/modules/auth/**/*.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80
        },
        'src/modules/billing/**/*.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 75
        },
        'src/modules/membership/**/*.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 75
        },
        'src/modules/organization/**/*.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 75
        },
        'src/modules/projects/**/*.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 75
        },
        'src/modules/tasks/**/*.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80
        },
        'src/modules/audit-logs/**/*.ts': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70
        },
        'src/infra/observability/**/*.ts': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70
        }
      }
    }
  }
})
