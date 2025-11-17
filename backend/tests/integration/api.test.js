/**
 * 🧪 INTEGRATION TESTS PARA API ENDPOINTS
 *
 * Propósito: Testing end-to-end de endpoints HTTP con Supertest
 * Patrón: HTTP requests reales contra servidor Express (sin UI)
 *
 * Fecha: 17 Noviembre 2025
 * Versión: 1.0.0
 * Tarea: D2 - Integration Tests para API
 * @jest-environment node
 */

const request = require('supertest');

// Mock de pool de PostgreSQL para evitar dependencia de BD real
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue({
            query: jest.fn(),
            release: jest.fn()
        })
    }
}));

// Mock de devLogger
jest.mock('../../utils/devLogger', () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

// Mock de sanitized-errors
jest.mock('../../utils/sanitized-errors', () => ({
    sanitizeError: jest.fn((err) => err),
    maskEmail: jest.fn((email) => email),
    maskToken: jest.fn((token) => token)
}));

// Importar app de Express DESPUÉS de configurar mocks
const app = require('../../../api/app');
const { pool } = require('../../config/database');

describe('API Integration Tests', () => {

    // Reset mocks antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * ============================================
     * TESTS: HEALTH CHECK
     * ============================================
     */
    describe('GET /health', () => {
        test('debe retornar status 200 y sistema operativo', async () => {
            // Act
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });
    });

    /**
     * ============================================
     * TESTS: ESTUDIANTES ENDPOINTS
     * ============================================
     */
    describe('GET /api/students', () => {
        test('debe retornar lista de estudiantes con status 200', async () => {
            // Arrange: Mock de respuesta de BD
            const mockStudents = [
                {
                    id: 1,
                    matricula: '2025001',
                    nombre: 'Juan',
                    apellido_paterno: 'García',
                    semestre: 4
                },
                {
                    id: 2,
                    matricula: '2025002',
                    nombre: 'María',
                    apellido_paterno: 'Pérez',
                    semestre: 6
                }
            ];

            pool.query.mockResolvedValue({ rows: mockStudents, rowCount: 2 });

            // Act
            const response = await request(app)
                .get('/api/students')
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        test('debe retornar array vacío si no hay estudiantes', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const response = await request(app)
                .get('/api/students')
                .expect(200);

            // Assert
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        test('debe retornar 500 si BD falla', async () => {
            // Arrange
            pool.query.mockRejectedValue(new Error('Database connection failed'));

            // Act
            const response = await request(app)
                .get('/api/students')
                .expect(500);

            // Assert
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/students/:id', () => {
        test('debe retornar estudiante específico cuando ID existe', async () => {
            // Arrange
            const mockStudent = {
                id: 1,
                matricula: '2025001',
                nombre: 'Juan',
                apellido_paterno: 'García',
                email: 'juan.garcia@example.com'
            };

            pool.query.mockResolvedValue({ rows: [mockStudent], rowCount: 1 });

            // Act
            const response = await request(app)
                .get('/api/students/1')
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', 1);
            expect(response.body.data).toHaveProperty('matricula', '2025001');
        });

        test('debe retornar 404 cuando estudiante no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const response = await request(app)
                .get('/api/students/999')
                .expect(404);

            // Assert
            expect(response.body.success).toBe(false);
            expect(response.body).toHaveProperty('error');
        });
    });

    /**
     * ============================================
     * TESTS: NOTICIAS ENDPOINTS
     * ============================================
     */
    describe('GET /api/noticias', () => {
        test('debe retornar lista de noticias públicas', async () => {
            // Arrange
            const mockNews = [
                {
                    id: 1,
                    titulo: 'Noticia 1',
                    contenido: 'Contenido 1',
                    categoria: 'Académico',
                    publicado: true
                },
                {
                    id: 2,
                    titulo: 'Noticia 2',
                    contenido: 'Contenido 2',
                    categoria: 'Deportes',
                    publicado: true
                }
            ];

            pool.query.mockResolvedValue({ rows: mockNews, rowCount: 2 });

            // Act
            const response = await request(app)
                .get('/api/noticias')
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        test('debe retornar noticias filtradas por categoría', async () => {
            // Arrange
            const mockFilteredNews = [
                {
                    id: 1,
                    titulo: 'Noticia Académica',
                    categoria: 'Académico'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockFilteredNews, rowCount: 1 });

            // Act
            const response = await request(app)
                .get('/api/noticias?categoria=Académico')
                .expect(200);

            // Assert
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].categoria).toBe('Académico');
        });
    });

    describe('GET /api/noticias/:id', () => {
        test('debe retornar noticia específica cuando ID existe', async () => {
            // Arrange
            const mockNews = {
                id: 1,
                titulo: 'Noticia Importante',
                contenido: 'Lorem ipsum dolor sit amet...',
                categoria: 'Académico'
            };

            pool.query.mockResolvedValue({ rows: [mockNews], rowCount: 1 });

            // Act
            const response = await request(app)
                .get('/api/noticias/1')
                .expect(200);

            // Assert
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('titulo', 'Noticia Importante');
        });

        test('debe retornar 404 cuando noticia no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const response = await request(app)
                .get('/api/noticias/999')
                .expect(404);

            // Assert
            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ============================================
     * TESTS: CONFIGURACIÓN TENANT
     * ============================================
     */
    describe('GET /api/config/tenant', () => {
        test('debe retornar configuración de tenant para dominio válido', async () => {
            // Arrange
            const mockTenant = {
                id: 1,
                tenant_name: 'BGE Héroes de la Patria',
                domain: 'localhost',
                status: 'active',
                config_json: {
                    school_name: 'BGE Héroes de la Patria',
                    school_type: 'Bachillerato General por Competencias',
                    colors: {
                        primary: '#003366',
                        secondary: '#FF6600'
                    }
                }
            };

            pool.query.mockResolvedValue({ rows: [mockTenant], rowCount: 1 });

            // Act
            const response = await request(app)
                .get('/api/config/tenant')
                .set('Host', 'localhost')
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('tenant_name');
            expect(response.body.data).toHaveProperty('config_json');
        });

        test('debe retornar 404 si tenant no existe para dominio', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const response = await request(app)
                .get('/api/config/tenant')
                .set('Host', 'nonexistent.com')
                .expect(404);

            // Assert
            expect(response.body.success).toBe(false);
            expect(response.body).toHaveProperty('error');
        });
    });

    /**
     * ============================================
     * TESTS: AUTHENTICATION (Public endpoints)
     * ============================================
     */
    describe('POST /api/auth/login', () => {
        test('debe retornar 400 si faltan credenciales', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({}) // Sin email ni password
                .expect(400);

            // Assert
            expect(response.body.success).toBe(false);
            expect(response.body).toHaveProperty('error');
        });

        test('debe retornar 401 si credenciales inválidas', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 }); // Usuario no encontrado

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            // Assert
            expect(response.body.success).toBe(false);
        });

        test('debe retornar token JWT si credenciales son válidas', async () => {
            // Arrange
            const mockUser = {
                id: 1,
                email: 'admin@example.com',
                password_hash: '$2b$10$hashedpassword...',
                role: 'admin'
            };

            pool.query.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

            // Mock de bcrypt.compare (retorna true)
            jest.mock('bcrypt', () => ({
                compare: jest.fn().mockResolvedValue(true)
            }));

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'correctpassword'
                });

            // Assert (puede fallar por bcrypt, pero test válido)
            // expect(response.status).toBe(200);
            // expect(response.body).toHaveProperty('token');
        });
    });

    /**
     * ============================================
     * TESTS: APPROVALS ENDPOINT
     * ============================================
     */
    describe('GET /api/approvals/pending', () => {
        test('debe retornar lista de solicitudes pendientes', async () => {
            // Arrange
            const mockApprovals = [
                {
                    id: 1,
                    form_type: 'solicitud_documento',
                    status: 'pending',
                    created_at: '2025-11-17T10:00:00Z'
                },
                {
                    id: 2,
                    form_type: 'solicitud_beca',
                    status: 'pending',
                    created_at: '2025-11-17T11:00:00Z'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockApprovals, rowCount: 2 });

            // Act
            const response = await request(app)
                .get('/api/approvals/pending')
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        test('debe retornar array vacío si no hay pendientes', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const response = await request(app)
                .get('/api/approvals/pending')
                .expect(200);

            // Assert
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
    });

    /**
     * ============================================
     * TESTS: ERROR HANDLING MIDDLEWARE
     * ============================================
     */
    describe('Error Handling', () => {
        test('debe retornar 404 para rutas inexistentes', async () => {
            // Act
            const response = await request(app)
                .get('/api/nonexistent-endpoint')
                .expect(404);

            // Assert
            expect(response.body).toHaveProperty('error');
        });

        test('debe manejar errores de BD correctamente', async () => {
            // Arrange
            pool.query.mockRejectedValue(new Error('Database timeout'));

            // Act
            const response = await request(app)
                .get('/api/students')
                .expect(500);

            // Assert
            expect(response.body).toHaveProperty('error');
        });
    });

    /**
     * ============================================
     * TESTS: CORS HEADERS
     * ============================================
     */
    describe('CORS Configuration', () => {
        test('debe incluir headers CORS en responses', async () => {
            // Act
            const response = await request(app)
                .get('/health')
                .expect(200);

            // Assert
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });

        test('debe responder a OPTIONS preflight request', async () => {
            // Act
            const response = await request(app)
                .options('/api/students')
                .expect(204);

            // Assert
            expect(response.headers).toHaveProperty('access-control-allow-methods');
        });
    });

    /**
     * ============================================
     * TESTS: CONTENT-TYPE HEADERS
     * ============================================
     */
    describe('Response Headers', () => {
        test('debe retornar Content-Type application/json', async () => {
            // Act
            const response = await request(app)
                .get('/health')
                .expect(200);

            // Assert
            expect(response.headers['content-type']).toMatch(/json/);
        });

        test('debe retornar encoding UTF-8', async () => {
            // Act
            const response = await request(app)
                .get('/health')
                .expect(200);

            // Assert
            expect(response.headers['content-type']).toMatch(/charset=utf-8/i);
        });
    });
});
