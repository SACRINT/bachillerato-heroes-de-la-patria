/**
 * TESTS UNITARIOS: Tenant Onboarding Service
 * Semana 16 - Testing Integral
 */

// Mocks BEFORE imports
jest.mock('../../config/database');
jest.mock('../../utils/winston-logger');
jest.mock('../../services/emailService');
jest.mock('bcrypt');
jest.mock('crypto');

const tenantOnboardingService = require('../../services/tenant-onboarding-service');
const pool = require('../../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

describe('TenantOnboardingService', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock client de PostgreSQL
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect = jest.fn().mockResolvedValue(mockClient);
    // FIX: Unificar pool.query y client.query para que compartan los mocks
    pool.query = mockClient.query;

    // Mock UUID generation
    crypto.randomUUID = jest.fn()
      .mockReturnValueOnce('tenant-uuid-123')
      .mockReturnValueOnce('admin-uuid-456');

    // Mock bcrypt
    bcrypt.hash = jest.fn().mockResolvedValue('hashed-password-123');
  });

  describe('createTenant', () => {
    it('should create tenant with all required fields', async () => {
      // Mock: Validación de subdomain único (no existe)
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // subdomain no existe
        .mockResolvedValueOnce({ rows: [] }) // domain no existe
        .mockResolvedValueOnce({ rows: [] }) // email no existe
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ // INSERT tenant
          rows: [{
            id: 'tenant-uuid-123',
            name: 'Test School',
            subdomain: 'testschool',
            domain: 'testschool.bge.edu.mx',
            plan: 'starter',
            status: 'active',
            config_json: {},
          }]
        })
        .mockResolvedValueOnce({ // INSERT admin user
          rows: [{
            id: 'admin-uuid-456',
            email: 'admin@testschool.com',
            role: 'admin',
            tenant_id: 'tenant-uuid-123',
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // Seed data

      const result = await tenantOnboardingService.createTenant({
        name: 'Test School',
        subdomain: 'testschool',
        domain: 'testschool.bge.edu.mx',
        plan: 'starter',
        adminEmail: 'admin@testschool.com',
        adminPassword: 'password123',
        adminName: 'Admin User',
        sendWelcomeEmail: false,
      });

      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('admin');
      expect(result.tenant.id).toBe('tenant-uuid-123');
      expect(result.admin.email).toBe('admin@testschool.com');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject duplicate subdomain', async () => {
      // Mock: BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock: subdomain ya existe
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-tenant' }]
      });

      await expect(
        tenantOnboardingService.createTenant({
          name: 'Duplicate School',
          subdomain: 'duplicate',
          adminEmail: 'admin@duplicate.com',
          adminPassword: 'password123',
          adminName: 'Admin',
        })
      ).rejects.toThrow('El subdomain "duplicate" ya está en uso');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject duplicate email', async () => {
      // Mock: subdomain y domain OK, pero email existe
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // subdomain OK
        .mockResolvedValueOnce({ rows: [] }) // domain OK
        .mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] }); // email existe

      await expect(
        tenantOnboardingService.createTenant({
          name: 'Test School',
          subdomain: 'unique',
          adminEmail: 'existing@test.com',
          adminPassword: 'password123',
          adminName: 'Admin',
          domain: 'unique.com' // Explicit domain to ensure checkDomainExists is called
        })
      ).rejects.toThrow('El email "existing@test.com" ya está registrado');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should parse full name correctly', () => {
      // Test parseFullName helper
      expect(tenantOnboardingService.parseFullName('Juan')).toEqual(['Juan', '', '']);
      expect(tenantOnboardingService.parseFullName('Juan Pérez')).toEqual(['Juan', 'Pérez', '']);
      expect(tenantOnboardingService.parseFullName('Juan Pérez López')).toEqual(['Juan', 'Pérez', 'López']);
      expect(tenantOnboardingService.parseFullName('Juan Alberto Pérez López')).toEqual([
        'Juan',
        'Alberto',
        'Pérez López',
      ]);
    });
  });

  describe('deactivateTenant', () => {
    it('should deactivate tenant successfully', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 'tenant-123',
          status: 'inactive',
        }]
      });

      const result = await tenantOnboardingService.deactivateTenant('tenant-123');

      expect(result.status).toBe('inactive');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tenants'),
        expect.arrayContaining(['inactive', 'tenant-123'])
      );
    });

    it('should throw error if tenant not found', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      await expect(
        tenantOnboardingService.deactivateTenant('nonexistent')
      ).rejects.toThrow('Tenant no encontrado');
    });
  });

  describe('reactivateTenant', () => {
    it('should reactivate tenant successfully', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 'tenant-123',
          status: 'active',
        }]
      });

      const result = await tenantOnboardingService.reactivateTenant('tenant-123');

      expect(result.status).toBe('active');
    });
  });

  describe('updateTenantConfig', () => {
    it('should update tenant config with merge', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 'tenant-123',
          config_json: {
            school_name: 'Updated School',
            primary_color: '#FF0000',
          },
        }]
      });

      const result = await tenantOnboardingService.updateTenantConfig('tenant-123', {
        primary_color: '#FF0000',
      });

      expect(result.config_json).toHaveProperty('primary_color', '#FF0000');
    });
  });
});
