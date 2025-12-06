/**
 * 🧪 JEST SETUP
 * Configuración global para tests
 * Semana 7 - Testing Integral
 */

// Set test environment variables FIRST
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/bge_test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';

// ============================================================
// MOCK GLOBAL DE BASE DE DATOS
// Este mock se aplica ANTES de que cualquier módulo importe database
// ============================================================

// Mock responses storage
const mockResponses = new Map();
let lastQuery = null;
let queryHistory = [];

// Mock query function
const mockQueryFn = jest.fn().mockImplementation(async (query, params = []) => {
  if (typeof query === 'string') {
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
  }

  return { rows: [], rowCount: 0 };
});

// Mock pool object
const mockPool = {
  query: mockQueryFn,
  connect: jest.fn().mockImplementation(async () => ({
    query: mockQueryFn,
    release: jest.fn()
  })),
  end: jest.fn().mockResolvedValue(undefined),
  on: jest.fn()
};

// Mock utilities for tests
const mockUtils = {
  setMockRows(queryPrefix, rows) {
    mockResponses.set(queryPrefix.substring(0, 50), {
      rows,
      rowCount: rows.length
    });
  },
  setMockResponse(queryPrefix, response) {
    mockResponses.set(queryPrefix.substring(0, 50), response);
  },
  clearMocks() {
    mockResponses.clear();
    lastQuery = null;
    queryHistory = [];
    mockQueryFn.mockClear();
  },
  getLastQuery() {
    return lastQuery;
  },
  getQueryHistory() {
    return [...queryHistory];
  }
};

// Apply mock to database module BEFORE any imports
jest.mock('../config/database', () => ({
  pool: mockPool,
  query: mockQueryFn
}));

// Export utilities for use in individual tests
global.dbMockUtils = mockUtils;
global.mockPool = mockPool;

// Global test timeout
jest.setTimeout(15000);

// Suppress console logs during tests (optional - reduce noise)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error visible for debugging
  error: originalConsole.error
};

// Global beforeEach to clear mocks
beforeEach(() => {
  mockUtils.clearMocks();
});

// Global beforeAll
beforeAll(() => {
  originalConsole.log('🧪 Starting test suite...');
});

// Global afterAll
afterAll(() => {
  originalConsole.log('✅ Test suite completed');
});
