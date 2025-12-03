module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },

    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        'backend/**/*.{js,ts}',
        '!backend/node_modules/**',
        '!backend/__tests__/**',
        '!backend/scripts/**',
        '!backend/seeds/**',
        '!**/node_modules/**',
        '!**/dist/**'
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

    // Setup files
    // setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.js'], // Commented out until setup.js is verified/migrated

    // Timeouts
    testTimeout: 10000,

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
