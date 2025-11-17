/**
 * 🧪 TENANT CONFIG SERVICE TESTS
 * Unit tests para tenant configuration service
 * Semana 7 - Testing Integral
 */

const tenantConfigService = require('../../services/tenant-config-service');
const pool = require('../../config/database');

// Mock pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

// Mock redis
jest.mock('../../middleware/redis-cache', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

describe('TenantConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create a new tenant successfully', async () => {
      const mockTenant = {
        id: 'test-tenant',
        nombre: 'Test School',
        subdomain: 'test',
        dominio: 'test.bge.edu.mx',
        status: 'activo',
        config_json: {
          school_name: 'Test School',
          school_short_name: 'TS'
        }
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing
        .mockResolvedValueOnce({ rows: [mockTenant] }); // Insert

      const result = await tenantConfigService.createTenant({
        id: 'test-tenant',
        nombre: 'Test School',
        subdomain: 'test'
      });

      expect(result).toHaveProperty('id', 'test-tenant');
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error if tenant already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      await expect(
        tenantConfigService.createTenant({
          id: 'existing',
          nombre: 'Existing',
          subdomain: 'existing'
        })
      ).rejects.toThrow('Tenant ya existe');
    });

    it('should throw error if missing required fields', async () => {
      await expect(
        tenantConfigService.createTenant({})
      ).rejects.toThrow('Faltan campos requeridos');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const validConfig = {
        school_name: 'Test School',
        school_short_name: 'TS',
        colors: {
          primary: '#1e40af',
          secondary: '#dc2626'
        }
      };

      expect(() => {
        tenantConfigService.validateConfig(validConfig);
      }).not.toThrow();
    });

    it('should throw error for missing school_name', () => {
      const invalidConfig = {
        school_short_name: 'TS'
      };

      expect(() => {
        tenantConfigService.validateConfig(invalidConfig);
      }).toThrow('Campo requerido faltante');
    });

    it('should throw error for invalid color format', () => {
      const invalidConfig = {
        school_name: 'Test',
        school_short_name: 'TS',
        colors: {
          primary: 'invalid-color'
        }
      };

      expect(() => {
        tenantConfigService.validateConfig(invalidConfig);
      }).toThrow('Color primary inválido');
    });
  });
});
