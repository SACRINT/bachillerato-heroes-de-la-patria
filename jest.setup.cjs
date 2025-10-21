/**
 * Jest Setup File
 * Configuración global para todos los tests
 */

// Configurar timeout global
jest.setTimeout(10000);

// Mock de variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.SESSION_SECRET = 'test-session-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';

// Console spy (opcional - para tests que verifican logs)
global.console = {
  ...console,
  // Desactivar logs innecesarios durante tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Mantener errores y warnings visibles
  error: console.error,
  warn: console.warn,
};

// Helper global para tests
global.testHelper = {
  /**
   * Esperar un tiempo determinado
   * @param {number} ms - Milisegundos a esperar
   */
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Generar email de prueba
   * @returns {string} Email de prueba único
   */
  generateTestEmail: () => `test-${Date.now()}@test.com`,

  /**
   * Generar string aleatorio
   * @param {number} length - Longitud del string
   * @returns {string} String aleatorio
   */
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
};

// Mock de uuid para evitar problemas con ES modules
jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
  v1: () => '00000000-0000-0000-0000-000000000001',
  v3: () => '00000000-0000-0000-0000-000000000003',
  v5: () => '00000000-0000-0000-0000-000000000005',
}));

// Cleanup después de todos los tests
afterAll(() => {
  // Cerrar conexiones, limpiar recursos, etc.
});
