
// Force env vars for test
process.env.DB_SSL = 'false';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');

// MOCK DATABASE CONFIG MODULE
jest.mock('../../backend/config/database', () => {
    const mockFn = jest.fn();
    const mPool = {
        query: mockFn,
        connect: jest.fn().mockResolvedValue({
            query: mockFn,
            release: jest.fn()
        }),
        on: jest.fn(),
        end: jest.fn(),
        totalCount: 0
    };

    return {
        pool: mPool,
        query: async (sql, params) => {
            const res = await mockFn(sql, params);
            return [res.rows, res.fields];
        }
    };
});

// Access the spy from the required module
const { pool } = require('../../backend/config/database');
const mockQuery = pool.query;

// Mock bcrypt (Explicit Factory with Unique Path)
jest.mock('bcrypt', () => require('../../test-utils/bcrypt-mock'));

// Import App AFTER Mocks
const app = require('../../backend/server');

describe('Parent Portal Integration Flow (Mocked DB)', () => {
    let parentToken;
    const parentId = 1;
    const studentId = 101;

    const testParent = {
        email: 'padre@ejemplo.com',
        password: 'demo123'
    };

    beforeEach(() => {
        if (mockQuery && mockQuery.mockReset) {
            mockQuery.mockReset();

            // SMART MOCK LOGIC
            mockQuery.mockImplementation(async (query, params) => {
                let qStr = '';
                if (typeof query === 'string') {
                    qStr = query;
                } else if (query && typeof query.text === 'string') {
                    qStr = query.text;
                }
                // console.log(`⚡ MOCK: ${qStr.substring(0, 80).replace(/\s+/g, ' ')}...`);

                // 1. Health/Startup
                if (qStr.match(/SELECT NOW\(\)|version\(\)|current_setting/i)) {
                    return {
                        rows: [{
                            current_time: new Date().toISOString(),
                            pg_version: 'PostgreSQL 17.0 (mocked)'
                        }],
                        rowCount: 1
                    };
                }

                // 2. Tenant Context
                if (qStr.match(/FROM tenants|set_config/i)) {
                    return { rows: [], rowCount: 0 };
                }

                // 3. User Lookup (Login) - Match password_hash column
                if (qStr.match(/password_hash/i)) {
                    console.log('✅ MATCHED: User Lookup Query');
                    return {
                        rows: [{
                            id: parentId,
                            nombre_completo: 'Juan Perez',
                            email: testParent.email,
                            password_hash: '$2b$10$mockhashedpassword',
                            activo: true,
                            email_verified: true
                        }],
                        rowCount: 1
                    };
                }

                // 4. Auth Profile / Update last_login
                if (qStr.match(/FROM parents WHERE id|UPDATE parents SET last_login/i)) {
                    return { rows: [{ id: parentId, activo: true }], rowCount: 1 };
                }

                // 5. Students
                if (qStr.match(/FROM estudiantes|student_parents|parents_students/i)) {
                    if (qStr.includes('student_parents') || qStr.includes('parents_students')) {
                        return { rows: [{ student_id: studentId, ver_calificaciones: true }], rowCount: 1 };
                    }
                    return {
                        rows: [{
                            id: studentId,
                            matricula: 'M001',
                            nombre_completo: 'Hijo Perez',
                            grado: 3,
                            grupo: '3A',
                            turno: 'Matutino',
                            especialidad: 'General',
                            tipo_relacion: 'padre'
                        }],
                        rowCount: 1
                    };
                }

                // 6. Notifications/Messages/Payments
                if (qStr.match(/parent_notifications|parent_messages|payments/i)) {
                    return { rows: [{ count: '0', total: '0' }], rowCount: 1 };
                }

                // 7. Grades
                if (qStr.match(/FROM grades/i)) {
                    return {
                        rows: [
                            { materia: 'Matematicas', calificacion: 9.5, periodo: 'P1' },
                            { materia: 'Historia', calificacion: 8.0, periodo: 'P1' }
                        ],
                        rowCount: 2
                    };
                }

                // 8. Averages
                if (qStr.match(/AVG\(calificacion\)/i)) {
                    return { rows: [{ promedio_general: 8.75, total_materias: 2 }], rowCount: 1 };
                }

                return { rows: [], rowCount: 0 };
            });
        }
    });

    test('GET /api/health - Should be reachable', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
    });

    test('POST /api/parents/auth/login - Should return JWT token', async () => {
        const response = await request(app)
            .post('/api/parents/auth/login')
            .send(testParent)
            .set('Content-Type', 'application/json');

        if (response.status !== 200) {
            console.error('Login Failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');

        parentToken = response.body.data.token;
    });

    test('GET /api/parents/dashboard - Should return student data', async () => {
        expect(parentToken).toBeDefined();

        const response = await request(app)
            .get('/api/parents/dashboard')
            .set('Authorization', `Bearer ${parentToken}`);

        if (response.status !== 200) console.error('Dashboard Error:', response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.students).toHaveLength(1);
    });

    test('GET /api/parents/students/:id/grades - Should return grades', async () => {
        expect(parentToken).toBeDefined();

        const response = await request(app)
            .get(`/api/parents/students/${studentId}/grades`)
            .set('Authorization', `Bearer ${parentToken}`);

        if (response.status !== 200) console.error('Grades Error:', response.body);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('grades');
        expect(response.body.data.grades).toHaveLength(2);
    });
});
