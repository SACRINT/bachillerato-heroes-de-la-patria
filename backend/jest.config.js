/**
 * Jest Configuration
 * Excluye archivos helper que no contienen tests
 */
module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/tests/**/*.test.js'
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
    detectOpenHandles: false
};
