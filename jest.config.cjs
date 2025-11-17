/**
 * 🧪 JEST CONFIGURATION
 * Testing setup para BGE
 * Semana 7 - Testing Integral
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/__tests__/**',
    '!backend/scripts/**',
    '!backend/seeds/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'backend'],

  // Timeouts
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
