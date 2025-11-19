/**
 * 🧪 TEST UTILITIES - v1.0.0
 * Utilidades para testing
 *
 * SEMANA 8 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Mock factories
 * - Test data generators
 * - Database helpers
 * - Auth helpers
 * - Assertion helpers
 */

const jwt = require('jsonwebtoken');

/**
 * Generadores de datos de prueba
 */
const generators = {
  /**
   * Generar estudiante de prueba
   * @param {Object} overrides - Campos a sobrescribir
   * @returns {Object} Estudiante
   */
  student(overrides = {}) {
    const id = Math.floor(Math.random() * 10000);
    return {
      id,
      matricula: `TEST${id.toString().padStart(4, '0')}`,
      nombre: `Test${id}`,
      apellido_paterno: 'Apellido',
      apellido_materno: 'Materno',
      email: `test${id}@example.com`,
      grado: '1',
      seccion: 'A',
      semestre: 1,
      promedio: 8.5,
      status_academico: 'activo',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  },

  /**
   * Generar usuario de prueba
   * @param {Object} overrides - Campos a sobrescribir
   * @returns {Object} Usuario
   */
  user(overrides = {}) {
    const id = Math.floor(Math.random() * 10000);
    return {
      id,
      uuid: `uuid-${id}`,
      email: `user${id}@example.com`,
      username: `user${id}`,
      role: 'estudiante',
      status: 'activo',
      nombre: `User${id}`,
      apellido_paterno: 'Test',
      created_at: new Date(),
      ...overrides
    };
  },

  /**
   * Generar calificación de prueba
   * @param {Object} overrides - Campos a sobrescribir
   * @returns {Object} Calificación
   */
  grade(overrides = {}) {
    return {
      id: Math.floor(Math.random() * 10000),
      estudiante_id: 1,
      docente_id: 1,
      materia: 'Matemáticas',
      parcial: 1,
      calificacion: 8.5,
      observaciones: '',
      ciclo: 'actual',
      created_at: new Date(),
      ...overrides
    };
  },

  /**
   * Generar notificación de prueba
   * @param {Object} overrides - Campos a sobrescribir
   * @returns {Object} Notificación
   */
  notification(overrides = {}) {
    return {
      id: Math.floor(Math.random() * 10000),
      usuario_id: 1,
      tipo: 'info',
      titulo: 'Test Notification',
      mensaje: 'Este es un mensaje de prueba',
      leida: false,
      created_at: new Date(),
      ...overrides
    };
  },

  /**
   * Generar array de items
   * @param {Function} generator - Función generadora
   * @param {number} count - Cantidad
   * @param {Object} overrides - Campos a sobrescribir
   * @returns {Array} Items generados
   */
  many(generator, count = 5, overrides = {}) {
    return Array.from({ length: count }, () => generator(overrides));
  }
};

/**
 * Helpers de autenticación
 */
const authHelpers = {
  /**
   * Generar token JWT de prueba
   * @param {Object} payload - Payload del token
   * @param {Object} options - Opciones
   * @returns {string} Token
   */
  generateToken(payload = {}, options = {}) {
    const defaultPayload = {
      id: 1,
      email: 'test@example.com',
      role: 'estudiante',
      ...payload
    };

    return jwt.sign(
      defaultPayload,
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: options.expiresIn || '1h' }
    );
  },

  /**
   * Generar header de autorización
   * @param {Object} payload - Payload del token
   * @returns {Object} Headers
   */
  authHeader(payload = {}) {
    const token = this.generateToken(payload);
    return {
      Authorization: `Bearer ${token}`
    };
  },

  /**
   * Generar usuario admin
   * @returns {Object} Usuario y token
   */
  adminUser() {
    const user = generators.user({ role: 'admin' });
    const token = this.generateToken(user);
    return { user, token, headers: { Authorization: `Bearer ${token}` } };
  },

  /**
   * Generar usuario estudiante
   * @returns {Object} Usuario y token
   */
  studentUser() {
    const user = generators.user({ role: 'estudiante' });
    const token = this.generateToken(user);
    return { user, token, headers: { Authorization: `Bearer ${token}` } };
  }
};

/**
 * Mock del pool de base de datos
 */
const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn()
  })
};

/**
 * Configurar mock de pool
 * @param {*} result - Resultado a retornar
 */
function setupPoolMock(result) {
  mockPool.query.mockResolvedValue({ rows: result });
  return mockPool;
}

/**
 * Resetear todos los mocks
 */
function resetMocks() {
  jest.clearAllMocks();
  mockPool.query.mockReset();
}

/**
 * Helpers de respuesta de API
 */
const responseHelpers = {
  /**
   * Verificar respuesta exitosa
   * @param {Object} response - Response de supertest
   */
  expectSuccess(response) {
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('data');
  },

  /**
   * Verificar respuesta de error
   * @param {Object} response - Response de supertest
   * @param {number} statusCode - Código esperado
   */
  expectError(response, statusCode = 400) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  },

  /**
   * Verificar paginación
   * @param {Object} response - Response de supertest
   */
  expectPaginated(response) {
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
  }
};

/**
 * Helper para esperar
 * @param {number} ms - Milisegundos
 * @returns {Promise}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper para tests async con timeout
 * @param {Function} fn - Función async
 * @param {number} timeout - Timeout en ms
 */
async function withTimeout(fn, timeout = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Test timeout')), timeout);
  });

  return Promise.race([fn(), timeoutPromise]);
}

module.exports = {
  generators,
  authHelpers,
  mockPool,
  setupPoolMock,
  resetMocks,
  responseHelpers,
  wait,
  withTimeout
};
