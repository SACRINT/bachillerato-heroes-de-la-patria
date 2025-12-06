/**
 * 🗃️ DATABASE MOCK
 * Mock del pool de PostgreSQL para tests unitarios
 * Permite tests sin conexión real a BD
 */

// Mock responses storage
const mockResponses = new Map();
let lastQuery = null;
let queryHistory = [];

/**
 * Función mock para query - devuelve Promise que resuelve con estructura {rows, rowCount}
 */
const mockQueryFn = jest.fn().mockImplementation(async (query, params = []) => {
    lastQuery = { query, params };
    queryHistory.push({ query, params, timestamp: new Date() });

    // Check for specific mock response
    const key = query.substring(0, 50);
    if (mockResponses.has(key)) {
        return mockResponses.get(key);
    }

    // Default response based on query type
    const queryUpper = query.toUpperCase().trim();

    if (queryUpper.startsWith('SELECT')) {
        return { rows: [], rowCount: 0 };
    }

    if (queryUpper.startsWith('INSERT')) {
        return {
            rows: [{ id: 1, created_at: new Date() }],
            rowCount: 1
        };
    }

    if (queryUpper.startsWith('UPDATE')) {
        return { rows: [], rowCount: 1 };
    }

    if (queryUpper.startsWith('DELETE')) {
        return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
});

/**
 * Simula el objeto pool de PostgreSQL
 */
const pool = {
    query: mockQueryFn,

    connect: jest.fn().mockImplementation(async () => ({
        query: mockQueryFn,
        release: jest.fn()
    })),

    end: jest.fn().mockResolvedValue(undefined),

    on: jest.fn()
};

/**
 * Utilidades para configurar mocks en tests
 */
const mockUtils = {
    /**
     * Configura respuesta exitosa con datos
     */
    setMockRows(queryPrefix, rows) {
        mockResponses.set(queryPrefix.substring(0, 50), {
            rows,
            rowCount: rows.length
        });
    },

    /**
     * Limpia todos los mocks
     */
    clearMocks() {
        mockResponses.clear();
        lastQuery = null;
        queryHistory = [];
        mockQueryFn.mockClear();
    },

    /**
     * Obtiene el último query ejecutado
     */
    getLastQuery() {
        return lastQuery;
    },

    /**
     * Obtiene historial de queries
     */
    getQueryHistory() {
        return [...queryHistory];
    }
};

// Export con estructura idéntica a database.js
module.exports = {
    pool,
    mockPool: pool,
    mockUtils,
    query: mockQueryFn
};
