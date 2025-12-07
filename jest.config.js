export default {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: ['**/*.test.js', '**/*.spec.js'],
    collectCoverageFrom: [
        'backend/**/*.js',
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
    testTimeout: 10000,
    transform: {}
};
