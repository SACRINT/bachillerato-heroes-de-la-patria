/**
 * BGE Testing Utilities Library
 * Biblioteca completa de utilidades para testing
 * Target: 85%+ code coverage
 *
 * @version 1.0.0
 * @author Claude Code - Arquitecto IA
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ============================================
// TEST DATABASE UTILITIES
// ============================================

/**
 * Crea una conexión de pool de prueba
 */
function createTestPool() {
    return new Pool({
        connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 5
    });
}

/**
 * Limpia tablas de prueba
 */
async function cleanTestTables(pool, tables) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const table of tables) {
            await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Ejecuta seeds de prueba
 */
async function seedTestData(pool, seeds) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const seed of seeds) {
            const { table, data } = seed;
            const columns = Object.keys(data[0]);
            const values = data.map(row => Object.values(row));

            for (const value of values) {
                const placeholders = value.map((_, i) => `$${i + 1}`).join(', ');
                await client.query(
                    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
                    value
                );
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================
// MOCK FACTORIES
// ============================================

/**
 * Factory para crear usuarios de prueba
 */
const UserFactory = {
    async create(pool, overrides = {}) {
        const defaultUser = {
            uuid: `test-uuid-${Date.now()}`,
            email: `test-${Date.now()}@bge.edu.mx`,
            username: `testuser${Date.now()}`,
            password_hash: await bcrypt.hash('TestPassword123!', 10),
            role: 'estudiante',
            status: 'activo',
            nombre: 'Test',
            apellido_paterno: 'User',
            apellido_materno: 'BGE',
            created_at: new Date(),
            ...overrides
        };

        const result = await pool.query(`
            INSERT INTO usuarios (uuid, email, username, password_hash, role, status, nombre, apellido_paterno, apellido_materno, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            defaultUser.uuid, defaultUser.email, defaultUser.username,
            defaultUser.password_hash, defaultUser.role, defaultUser.status,
            defaultUser.nombre, defaultUser.apellido_paterno, defaultUser.apellido_materno,
            defaultUser.created_at
        ]);

        return result.rows[0];
    },

    createAdmin(pool, overrides = {}) {
        return this.create(pool, { role: 'admin', ...overrides });
    },

    createTeacher(pool, overrides = {}) {
        return this.create(pool, { role: 'docente', ...overrides });
    },

    createStudent(pool, overrides = {}) {
        return this.create(pool, { role: 'estudiante', ...overrides });
    },

    createParent(pool, overrides = {}) {
        return this.create(pool, { role: 'padre', ...overrides });
    }
};

/**
 * Factory para crear estudiantes de prueba
 */
const StudentFactory = {
    async create(pool, overrides = {}) {
        const defaultStudent = {
            matricula: `EST${Date.now()}`,
            nombre: 'Estudiante',
            apellido_paterno: 'Test',
            apellido_materno: 'BGE',
            email: `estudiante-${Date.now()}@bge.edu.mx`,
            grado: 1,
            grupo: 'A',
            semestre: 1,
            status: 'activo',
            promedio: 8.5,
            created_at: new Date(),
            ...overrides
        };

        const result = await pool.query(`
            INSERT INTO estudiantes (matricula, nombre, apellido_paterno, apellido_materno, email, grado, grupo, semestre, status, promedio, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            defaultStudent.matricula, defaultStudent.nombre, defaultStudent.apellido_paterno,
            defaultStudent.apellido_materno, defaultStudent.email, defaultStudent.grado,
            defaultStudent.grupo, defaultStudent.semestre, defaultStudent.status,
            defaultStudent.promedio, defaultStudent.created_at
        ]);

        return result.rows[0];
    }
};

/**
 * Factory para crear calificaciones de prueba
 */
const GradeFactory = {
    async create(pool, studentId, overrides = {}) {
        const defaultGrade = {
            estudiante_id: studentId,
            materia_id: 1,
            calificacion: 8.5,
            periodo: '2025-1',
            fecha_registro: new Date(),
            ...overrides
        };

        const result = await pool.query(`
            INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, periodo, fecha_registro)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            defaultGrade.estudiante_id, defaultGrade.materia_id,
            defaultGrade.calificacion, defaultGrade.periodo, defaultGrade.fecha_registro
        ]);

        return result.rows[0];
    }
};

/**
 * Factory para crear notificaciones de prueba
 */
const NotificationFactory = {
    async create(pool, userId, overrides = {}) {
        const defaultNotification = {
            usuario_id: userId,
            titulo: 'Test Notification',
            mensaje: 'This is a test notification message',
            tipo: 'info',
            leida: false,
            created_at: new Date(),
            ...overrides
        };

        const result = await pool.query(`
            INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            defaultNotification.usuario_id, defaultNotification.titulo,
            defaultNotification.mensaje, defaultNotification.tipo,
            defaultNotification.leida, defaultNotification.created_at
        ]);

        return result.rows[0];
    }
};

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Genera token JWT de prueba
 */
function generateTestToken(payload = {}, options = {}) {
    const defaultPayload = {
        id: 1,
        email: 'test@bge.edu.mx',
        role: 'admin',
        ...payload
    };

    const secret = process.env.JWT_SECRET || 'test-secret-key';
    const defaultOptions = {
        expiresIn: '1h',
        ...options
    };

    return jwt.sign(defaultPayload, secret, defaultOptions);
}

/**
 * Verifica token JWT de prueba
 */
function verifyTestToken(token) {
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    return jwt.verify(token, secret);
}

/**
 * Crea headers de autenticación
 */
function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// ============================================
// REQUEST/RESPONSE MOCKS
// ============================================

/**
 * Crea mock de request Express
 */
function createMockRequest(overrides = {}) {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
        ip: '127.0.0.1',
        method: 'GET',
        path: '/',
        get: function(header) {
            return this.headers[header.toLowerCase()];
        },
        ...overrides
    };
}

/**
 * Crea mock de response Express
 */
function createMockResponse() {
    const res = {
        statusCode: 200,
        _data: null,
        _headers: {},

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this._data = data;
            return this;
        },

        send(data) {
            this._data = data;
            return this;
        },

        setHeader(key, value) {
            this._headers[key] = value;
            return this;
        },

        getHeader(key) {
            return this._headers[key];
        },

        getData() {
            return this._data;
        },

        getStatusCode() {
            return this.statusCode;
        }
    };

    return res;
}

/**
 * Crea mock de next function
 */
function createMockNext() {
    const next = jest.fn();
    return next;
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Verifica estructura de respuesta API estándar
 */
function expectApiResponse(response, options = {}) {
    const { success = true, hasData = true, hasMeta = false } = options;

    expect(response).toBeDefined();
    expect(response.success).toBe(success);

    if (hasData) {
        expect(response.data).toBeDefined();
    }

    if (hasMeta) {
        expect(response.meta).toBeDefined();
    }
}

/**
 * Verifica estructura de error API
 */
function expectApiError(response, expectedCode) {
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();

    if (expectedCode) {
        expect(response.error.code).toBe(expectedCode);
    }
}

/**
 * Verifica paginación
 */
function expectPagination(meta, options = {}) {
    const { page = 1, limit = 20 } = options;

    expect(meta).toBeDefined();
    expect(meta.page).toBe(page);
    expect(meta.limit).toBe(limit);
    expect(meta.total).toBeDefined();
    expect(meta.totalPages).toBeDefined();
}

/**
 * Verifica que un objeto tenga las propiedades esperadas
 */
function expectProperties(obj, properties) {
    for (const prop of properties) {
        expect(obj).toHaveProperty(prop);
    }
}

/**
 * Verifica que una fecha sea válida
 */
function expectValidDate(dateString) {
    const date = new Date(dateString);
    expect(date.toString()).not.toBe('Invalid Date');
}

// ============================================
// TIMING UTILITIES
// ============================================

/**
 * Espera un tiempo determinado
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Espera a que una condición sea verdadera
 */
async function waitFor(condition, options = {}) {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return true;
        }
        await wait(interval);
    }

    throw new Error('Timeout waiting for condition');
}

/**
 * Mide el tiempo de ejecución
 */
async function measureTime(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    return {
        result,
        duration: end - start
    };
}

// ============================================
// DATA GENERATORS
// ============================================

/**
 * Genera email aleatorio
 */
function randomEmail(domain = 'bge.edu.mx') {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${domain}`;
}

/**
 * Genera string aleatorio
 */
function randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Genera número aleatorio en rango
 */
function randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera fecha aleatoria
 */
function randomDate(start = new Date(2020, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Genera calificación aleatoria (0-10)
 */
function randomGrade() {
    return Math.round((Math.random() * 10) * 10) / 10;
}

// ============================================
// TEST SETUP/TEARDOWN
// ============================================

/**
 * Configura entorno de prueba
 */
function setupTestEnvironment() {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';

    // Silenciar logs en tests
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
}

/**
 * Restaura entorno después de pruebas
 */
function teardownTestEnvironment() {
    jest.restoreAllMocks();
}

/**
 * Crea contexto de prueba completo
 */
async function createTestContext() {
    const pool = createTestPool();

    return {
        pool,
        factories: {
            user: UserFactory,
            student: StudentFactory,
            grade: GradeFactory,
            notification: NotificationFactory
        },
        auth: {
            generateToken: generateTestToken,
            verifyToken: verifyTestToken,
            headers: authHeaders
        },
        cleanup: async () => {
            await pool.end();
        }
    };
}

// ============================================
// SNAPSHOT HELPERS
// ============================================

/**
 * Prepara objeto para snapshot (remueve campos dinámicos)
 */
function prepareForSnapshot(obj, fieldsToRemove = ['id', 'created_at', 'updated_at']) {
    const cleaned = { ...obj };

    for (const field of fieldsToRemove) {
        delete cleaned[field];
    }

    return cleaned;
}

// ============================================
// ERROR TESTING
// ============================================

/**
 * Espera que una función async lance un error
 */
async function expectAsyncError(fn, expectedError) {
    let thrownError = null;

    try {
        await fn();
    } catch (error) {
        thrownError = error;
    }

    expect(thrownError).not.toBeNull();

    if (expectedError) {
        if (typeof expectedError === 'string') {
            expect(thrownError.message).toContain(expectedError);
        } else if (expectedError instanceof RegExp) {
            expect(thrownError.message).toMatch(expectedError);
        } else {
            expect(thrownError).toMatchObject(expectedError);
        }
    }

    return thrownError;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Database
    createTestPool,
    cleanTestTables,
    seedTestData,

    // Factories
    UserFactory,
    StudentFactory,
    GradeFactory,
    NotificationFactory,

    // Authentication
    generateTestToken,
    verifyTestToken,
    authHeaders,

    // Mocks
    createMockRequest,
    createMockResponse,
    createMockNext,

    // Assertions
    expectApiResponse,
    expectApiError,
    expectPagination,
    expectProperties,
    expectValidDate,

    // Timing
    wait,
    waitFor,
    measureTime,

    // Data Generators
    randomEmail,
    randomString,
    randomNumber,
    randomDate,
    randomGrade,

    // Setup/Teardown
    setupTestEnvironment,
    teardownTestEnvironment,
    createTestContext,

    // Snapshots
    prepareForSnapshot,

    // Error Testing
    expectAsyncError
};
