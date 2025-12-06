module.exports = {
    // Ambiente de pruebas
    testEnvironment: 'node',

    // Patrones de búsqueda de tests (JS y TS)
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/__tests__/**/*.test.ts',
        '**/tests/**/*.test.js',
        '**/tests/**/*.test.ts'
    ],

    // Extensiones soportadas
    moduleFileExtensions: ['js', 'ts', 'json', 'node'],

    // Transformaciones
    transform: {
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.js$': 'babel-jest'
    },

    // Ignorar transformaciones en node_modules
    transformIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],

    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        // Solo archivos de código activo
        'backend/data/**/*.js',
        'backend/services/**/*.js',
        'backend/routes/**/*.js',
        'backend/middleware/**/*.js',
        'backend/utils/**/*.js',
        // Exclusiones
        '!backend/**/node_modules/**',
        '!backend/__tests__/**',
        '!backend/tests/**',
        '!backend/test-utils/**',
        '!backend/scripts/**',
        '!backend/seeds/**',
        '!backend/backups/**',
        '!backend/load-tests/**',
        '!backend/migrations/**',
        '!backend/**/archived/**',
        '!**/node_modules/**',
        '!**/dist/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],

    // Threshold reducido temporalmente - Semana 7 del plan de 60 semanas
    // Se incrementará gradualmente conforme se escriban más tests
    coverageThreshold: {
        global: {
            branches: 5,
            functions: 5,
            lines: 5,
            statements: 5
        }
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.js'],

    // Timeouts
    testTimeout: 15000,

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Módulos a ignorar
    modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/']
};
