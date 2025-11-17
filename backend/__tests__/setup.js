/**
 * 🧪 JEST SETUP
 * Configuración global para tests
 * Semana 7 - Testing Integral
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/bge_test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global beforeAll
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Global afterAll
afterAll(() => {
  console.log('✅ Test suite completed');
});
