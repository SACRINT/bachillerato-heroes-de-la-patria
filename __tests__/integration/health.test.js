/**
 * Tests de Integración para Health Endpoint
 * BGE Héroes de la Patria
 */

const request = require('supertest');
const app = require('../../backend/server');

describe('Health Endpoint Integration Tests', () => {
  describe('GET /api/health', () => {
    test('debería devolver status 200 y datos de salud del sistema', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('OK');
    });

    test('debería incluir información del entorno', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('environment');
      expect(response.body.environment).toBeDefined();
    });

    test('debería responder rápidamente (< 500ms)', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/health')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('GET /api/health/db', () => {
    test('debería verificar la conexión a la base de datos', async () => {
      const response = await request(app)
        .get('/api/health/db')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toBeDefined();
    });
  });
});
