/**
 * 🔒 TENANT ISOLATION TESTS
 * Tests para verificar aislamiento de datos entre tenants
 * Semana 5 - Multi-tenancy Avanzado - Tarea 4
 *
 * Casos de prueba:
 * 1. Verificar que tenant A no puede ver datos de tenant B
 * 2. Verificar que RLS policies están aplicadas
 * 3. Verificar que cache está correctamente aislado
 * 4. Verificar que middleware detecta tenant correctamente
 */

const pool = require('../config/database');
const tenantConfigService = require('../services/tenant-config-service');
const { detectTenantId, getTenantConfig } = require('../middleware/tenant-context');

describe('🏢 Tenant Isolation Tests', () => {
    let tenant1Id, tenant2Id;
    let student1Id, student2Id;

    // Setup: Crear 2 tenants de prueba antes de todos los tests
    beforeAll(async () => {
        try {
            // Crear tenant 1
            const tenant1 = await tenantConfigService.createTenant({
                id: 'test-tenant-1',
                nombre: 'Escuela Test 1',
                subdomain: 'test1',
                dominio: 'test1.localhost',
                config: {
                    school_name: 'Escuela Test 1',
                    school_short_name: 'ET1'
                }
            });
            tenant1Id = tenant1.id;

            // Crear tenant 2
            const tenant2 = await tenantConfigService.createTenant({
                id: 'test-tenant-2',
                nombre: 'Escuela Test 2',
                subdomain: 'test2',
                dominio: 'test2.localhost',
                config: {
                    school_name: 'Escuela Test 2',
                    school_short_name: 'ET2'
                }
            });
            tenant2Id = tenant2.id;

            // Configurar tenant 1 en contexto y crear estudiante
            await pool.query(`SET app.current_tenant_id = $1`, [tenant1Id]);

            const student1 = await pool.query(
                `INSERT INTO estudiantes (nombre, apellido_paterno, email, tenant_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                ['Juan', 'Pérez', 'juan.tenant1@test.com', tenant1Id]
            );
            student1Id = student1.rows[0].id;

            // Configurar tenant 2 en contexto y crear estudiante
            await pool.query(`SET app.current_tenant_id = $1`, [tenant2Id]);

            const student2 = await pool.query(
                `INSERT INTO estudiantes (nombre, apellido_paterno, email, tenant_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                ['María', 'González', 'maria.tenant2@test.com', tenant2Id]
            );
            student2Id = student2.rows[0].id;

            console.log(`[TEST-SETUP] Tenants creados: ${tenant1Id}, ${tenant2Id}`);
            console.log(`[TEST-SETUP] Estudiantes creados: ${student1Id}, ${student2Id}`);

        } catch (error) {
            console.error('[TEST-SETUP] Error en setup:', error.message);
            throw error;
        }
    });

    // Cleanup: Eliminar datos de prueba después de todos los tests
    afterAll(async () => {
        try {
            // Deshabilitar temporalmente RLS para cleanup
            await pool.query('ALTER TABLE estudiantes DISABLE ROW LEVEL SECURITY');
            await pool.query('ALTER TABLE tenants DISABLE ROW LEVEL SECURITY');

            // Eliminar estudiantes de prueba
            await pool.query(
                `DELETE FROM estudiantes WHERE tenant_id IN ($1, $2)`,
                [tenant1Id, tenant2Id]
            );

            // Eliminar tenants de prueba
            await pool.query(
                `DELETE FROM tenants WHERE id IN ($1, $2)`,
                [tenant1Id, tenant2Id]
            );

            // Re-habilitar RLS
            await pool.query('ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY');
            await pool.query('ALTER TABLE tenants ENABLE ROW LEVEL SECURITY');

            // Cerrar pool
            await pool.end();

            console.log('[TEST-CLEANUP] Datos de prueba eliminados');

        } catch (error) {
            console.error('[TEST-CLEANUP] Error en cleanup:', error.message);
        }
    });

    // ==========================================
    // TEST 1: RLS - Aislamiento de datos
    // ==========================================
    describe('TEST 1: Row-Level Security Isolation', () => {
        test('Tenant 1 solo debe ver sus propios estudiantes', async () => {
            // Configurar contexto de tenant 1
            await pool.query(`SET app.current_tenant_id = $1`, [tenant1Id]);

            // Query estudiantes
            const result = await pool.query(
                `SELECT id, nombre, tenant_id FROM estudiantes WHERE id IN ($1, $2)`,
                [student1Id, student2Id]
            );

            // Verificar que solo vemos estudiante de tenant 1
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].id).toBe(student1Id);
            expect(result.rows[0].tenant_id).toBe(tenant1Id);
        });

        test('Tenant 2 solo debe ver sus propios estudiantes', async () => {
            // Configurar contexto de tenant 2
            await pool.query(`SET app.current_tenant_id = $1`, [tenant2Id]);

            // Query estudiantes
            const result = await pool.query(
                `SELECT id, nombre, tenant_id FROM estudiantes WHERE id IN ($1, $2)`,
                [student1Id, student2Id]
            );

            // Verificar que solo vemos estudiante de tenant 2
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].id).toBe(student2Id);
            expect(result.rows[0].tenant_id).toBe(tenant2Id);
        });

        test('Sin contexto de tenant, no debe ver ningún estudiante', async () => {
            // Resetear contexto (sin tenant)
            await pool.query(`RESET app.current_tenant_id`);

            // Query estudiantes
            const result = await pool.query(
                `SELECT id, nombre, tenant_id FROM estudiantes WHERE id IN ($1, $2)`,
                [student1Id, student2Id]
            );

            // Con current_tenant_id vacío, la función retorna 'default'
            // y no debe ver estudiantes de test-tenant-1 o test-tenant-2
            const testTenantStudents = result.rows.filter(
                row => row.tenant_id === tenant1Id || row.tenant_id === tenant2Id
            );

            expect(testTenantStudents.length).toBe(0);
        });
    });

    // ==========================================
    // TEST 2: Tenant Config Service
    // ==========================================
    describe('TEST 2: Tenant Config Service', () => {
        test('Debe obtener config de tenant 1 correctamente', async () => {
            const config = await tenantConfigService.getConfig(tenant1Id);

            expect(config).toHaveProperty('id', tenant1Id);
            expect(config).toHaveProperty('nombre', 'Escuela Test 1');
            expect(config).toHaveProperty('subdomain', 'test1');
            expect(config.config_json).toHaveProperty('school_name', 'Escuela Test 1');
        });

        test('Debe obtener config de tenant 2 correctamente', async () => {
            const config = await tenantConfigService.getConfig(tenant2Id);

            expect(config).toHaveProperty('id', tenant2Id);
            expect(config).toHaveProperty('nombre', 'Escuela Test 2');
            expect(config).toHaveProperty('subdomain', 'test2');
            expect(config.config_json).toHaveProperty('school_name', 'Escuela Test 2');
        });

        test('Debe actualizar config de tenant sin afectar otros tenants', async () => {
            // Actualizar config de tenant 1
            await tenantConfigService.updateConfigValue(tenant1Id, 'colors.primary', '#ff0000');

            // Verificar que tenant 1 tiene nuevo color
            const config1 = await tenantConfigService.getConfigJSON(tenant1Id);
            expect(config1.colors.primary).toBe('#ff0000');

            // Verificar que tenant 2 NO cambió
            const config2 = await tenantConfigService.getConfigJSON(tenant2Id);
            expect(config2.colors.primary).not.toBe('#ff0000');
        });

        test('Debe listar solo tenants activos', async () => {
            const tenants = await tenantConfigService.listTenants({ status: 'activo' });

            // Debe incluir al menos los 2 tenants de prueba
            const testTenants = tenants.filter(
                t => t.id === tenant1Id || t.id === tenant2Id
            );

            expect(testTenants.length).toBe(2);
        });

        test('Debe obtener estadísticas correctas por tenant', async () => {
            const stats1 = await tenantConfigService.getTenantStats(tenant1Id);
            const stats2 = await tenantConfigService.getTenantStats(tenant2Id);

            // Tenant 1 debe tener 1 estudiante
            expect(stats1.total_students).toBeGreaterThanOrEqual(1);

            // Tenant 2 debe tener 1 estudiante
            expect(stats2.total_students).toBeGreaterThanOrEqual(1);

            // Verificar que las stats son del tenant correcto
            expect(stats1.tenant_id).toBe(tenant1Id);
            expect(stats2.tenant_id).toBe(tenant2Id);
        });
    });

    // ==========================================
    // TEST 3: Tenant Context Middleware
    // ==========================================
    describe('TEST 3: Tenant Detection', () => {
        test('Debe detectar tenant desde header X-Tenant-ID', () => {
            const mockReq = {
                headers: { 'x-tenant-id': 'test-header-tenant' },
                hostname: 'localhost',
                query: {},
                user: null
            };

            const tenantId = detectTenantId(mockReq);

            expect(tenantId).toBe('test-header-tenant');
        });

        test('Debe detectar tenant desde subdomain', () => {
            const mockReq = {
                headers: {},
                hostname: 'tenant123.bge.edu.mx',
                query: {},
                user: null,
                get: () => 'tenant123.bge.edu.mx'
            };

            const tenantId = detectTenantId(mockReq);

            expect(tenantId).toBe('tenant123');
        });

        test('Debe detectar tenant desde JWT payload', () => {
            const mockReq = {
                headers: {},
                hostname: 'localhost',
                query: {},
                user: { tenant_id: 'jwt-tenant' }
            };

            const tenantId = detectTenantId(mockReq);

            expect(tenantId).toBe('jwt-tenant');
        });

        test('Debe retornar "default" si no detecta tenant', () => {
            const mockReq = {
                headers: {},
                hostname: 'localhost',
                query: {},
                user: null
            };

            const tenantId = detectTenantId(mockReq);

            expect(tenantId).toBe('default');
        });

        test('No debe usar subdomains reservados como tenants', () => {
            const reservedSubdomains = ['www', 'api', 'admin', 'dev', 'staging'];

            reservedSubdomains.forEach(subdomain => {
                const mockReq = {
                    headers: {},
                    hostname: `${subdomain}.bge.edu.mx`,
                    query: {},
                    user: null,
                    get: () => `${subdomain}.bge.edu.mx`
                };

                const tenantId = detectTenantId(mockReq);

                // No debe retornar el subdomain reservado
                expect(tenantId).not.toBe(subdomain);
                expect(tenantId).toBe('default'); // Debe retornar default
            });
        });
    });

    // ==========================================
    // TEST 4: Cross-Tenant Security
    // ==========================================
    describe('TEST 4: Cross-Tenant Security', () => {
        test('Tenant 1 NO debe poder actualizar estudiante de tenant 2', async () => {
            // Configurar contexto de tenant 1
            await pool.query(`SET app.current_tenant_id = $1`, [tenant1Id]);

            // Intentar actualizar estudiante de tenant 2
            const result = await pool.query(
                `UPDATE estudiantes
                 SET nombre = 'HACKED'
                 WHERE id = $1
                 RETURNING id`,
                [student2Id] // Estudiante de tenant 2
            );

            // No debe actualizarse ningún registro debido a RLS
            expect(result.rowCount).toBe(0);
        });

        test('Tenant 2 NO debe poder eliminar estudiante de tenant 1', async () => {
            // Configurar contexto de tenant 2
            await pool.query(`SET app.current_tenant_id = $1`, [tenant2Id]);

            // Intentar eliminar estudiante de tenant 1
            const result = await pool.query(
                `DELETE FROM estudiantes
                 WHERE id = $1
                 RETURNING id`,
                [student1Id] // Estudiante de tenant 1
            );

            // No debe eliminarse ningún registro debido a RLS
            expect(result.rowCount).toBe(0);
        });

        test('Tenant 1 NO debe poder insertar estudiante con tenant_id de tenant 2', async () => {
            // Configurar contexto de tenant 1
            await pool.query(`SET app.current_tenant_id = $1`, [tenant1Id]);

            // Intentar insertar estudiante con tenant_id incorrecto
            await expect(
                pool.query(
                    `INSERT INTO estudiantes (nombre, apellido_paterno, email, tenant_id)
                     VALUES ($1, $2, $3, $4)`,
                    ['Intruso', 'Malicioso', 'intruso@test.com', tenant2Id] // tenant_id de tenant 2
                )
            ).rejects.toThrow(); // RLS debe rechazar el INSERT
        });
    });

    // ==========================================
    // TEST 5: Cache Isolation
    // ==========================================
    describe('TEST 5: Cache Isolation', () => {
        test('Cache de tenant 1 no debe afectar cache de tenant 2', async () => {
            // Invalidar cache de tenant 1
            await tenantConfigService.invalidateCache(tenant1Id);

            // Obtener config de tenant 1 (debe ir a BD)
            const config1Before = await tenantConfigService.getConfig(tenant1Id);

            // Obtener config de tenant 2 (debe estar en cache si se obtuvo antes)
            const config2 = await tenantConfigService.getConfig(tenant2Id);

            // Verificar que son diferentes
            expect(config1Before.id).not.toBe(config2.id);
            expect(config1Before.nombre).not.toBe(config2.nombre);

            // Actualizar config de tenant 1
            await tenantConfigService.updateConfigValue(tenant1Id, 'school_short_name', 'UPDATED');

            // Obtener nuevamente ambos configs
            const config1After = await tenantConfigService.getConfigJSON(tenant1Id);
            const config2After = await tenantConfigService.getConfigJSON(tenant2Id);

            // Verificar que solo tenant 1 cambió
            expect(config1After.school_short_name).toBe('UPDATED');
            expect(config2After.school_short_name).not.toBe('UPDATED');
        });
    });
});
