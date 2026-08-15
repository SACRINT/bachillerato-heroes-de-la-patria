module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: ['**/*.test.js', '**/*.spec.js', '**/*.test.ts', '**/*.spec.ts'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/backend/tests/',         // Viejos tests
        '<rootDir>/backend/services/__tests__/',  // Viejos tests de servicios
        '/dist/'                   // Ignorar builds compilados
    ],
    collectCoverageFrom: [
        'backend/**/*.js',
        'backend/**/*.ts',
        '!backend/config/**',
        '!backend/scripts/**'
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000
};
