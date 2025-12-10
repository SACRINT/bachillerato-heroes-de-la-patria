/**
 * Jest Configuration
 * Excluye archivos helper que no contienen tests
 */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/__tests__/**/*.test.ts', // Added TS support
        '**/tests/**/*.test.js',
        '**/tests/**/*.test.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/helpers/',
        '/__tests__/setup.js',
        '/tests/fixtures/'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/__tests__/helpers/',
        '<rootDir>/__tests__/setup.js'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/',
        '/tests/'
    ],
    verbose: true,
    testTimeout: 30000,
    forceExit: true,
    detectOpenHandles: false,
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    }
};
