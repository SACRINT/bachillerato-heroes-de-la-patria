/**
 * Jest Configuration
 * BGE Héroes de la Patria - Testing Configuration
 */

module.exports = {
  // Test environment (jsdom para soportar tests de frontend)
  testEnvironment: 'jsdom',

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds (empezando con 10%, objetivo final: 70%)
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'backend/services/**/*.js',
    'backend/middleware/**/*.js',
    'backend/utils/**/*.js',
    'js/form-validator.js',
    'js/api-client.js',
    '!backend/server.js',
    '!backend/config/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.bundle.js',
    '!**/*.min.js',
    '!**/external-integrations.js', // Tiene errores de sintaxis
  ],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Transform (si usamos ES modules en el futuro)
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Timeout for tests
  testTimeout: 10000, // 10 segundos

  // Maximum workers (para CI/CD)
  maxWorkers: '50%',
};
