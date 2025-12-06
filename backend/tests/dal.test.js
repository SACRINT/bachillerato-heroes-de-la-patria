/**
 * 🧪 UNIT TESTS PARA DAL (Data Access Layer)
 *
 * Propósito: Validar funciones de acceso a datos sin depender de BD real
 * Patrón: Mocking de pool.query() con Jest
 *
 * Fecha: 17 Noviembre 2025
 * Versión: 1.0.0
 * Tarea: D1 - Unit Tests para DAL
 */

// Mock del pool de PostgreSQL ANTES de importar DAL
jest.mock('../config/database', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

// Mock de devLogger para evitar spam de logs en tests
jest.mock('../utils/devLogger', () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

// Mock de sanitized-errors
jest.mock('../utils/sanitized-errors', () => ({
    sanitizeError: jest.fn((err) => err),
    maskEmail: jest.fn((email) => email),
    maskToken: jest.fn((token) => token)
}));

const { pool } = require('../config/database');
const dal = require('../data/database-access');

describe('DAL - Data Access Layer Tests', () => {

    // Reset mocks antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * ============================================
     * TESTS: ESTUDIANTES (Students)
     * ============================================
     */
    describe('getAllStudents', () => {
        test('debe retornar array de estudiantes ordenados alfabéticamente', async () => {
            // Arrange: Mock de respuesta de BD
            const mockStudents = [
                {
                    id: 1,
                    matricula: '2025001',
                    nombre: 'Juan',
                    apellido_paterno: 'García',
                    apellido_materno: 'López',
                    especialidad: 'Informática',
                    semestre: 4,
                    promedio: 9.5,
                    status_academico: 'Regular'
                },
                {
                    id: 2,
                    matricula: '2025002',
                    nombre: 'María',
                    apellido_paterno: 'Pérez',
                    apellido_materno: 'Sánchez',
                    especialidad: 'Contabilidad',
                    semestre: 6,
                    promedio: 9.8,
                    status_academico: 'Regular'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockStudents, rowCount: 2 });

            // Act: Llamar función del DAL
            const result = await dal.getAllStudents();

            // Assert: Verificar resultado y llamada correcta
            expect(result).toEqual(mockStudents);
            expect(result).toHaveLength(2);
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query.mock.calls[0][0]).toContain('SELECT');
            expect(pool.query.mock.calls[0][0]).toContain('FROM estudiantes');
            expect(pool.query.mock.calls[0][0]).toContain('ORDER BY apellido_paterno');
        });

        test('debe retornar array vacío si no hay estudiantes', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getAllStudents();

            // Assert
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        test('debe lanzar error si query falla', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            pool.query.mockRejectedValue(mockError);

            // Act & Assert
            await expect(dal.getAllStudents()).rejects.toThrow('Database connection failed');
            expect(pool.query).toHaveBeenCalledTimes(1);
        });
    });

    describe('getStudentById', () => {
        test('debe retornar estudiante cuando ID existe', async () => {
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
            const result = await dal.getStudentById(1);

            // Assert
            expect(result).toEqual(mockStudent);
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM estudiantes WHERE id = $1',
                [1]
            );
        });

        test('debe retornar null cuando ID no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getStudentById(999);

            // Assert
            expect(result).toBeNull();
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM estudiantes WHERE id = $1',
                [999]
            );
        });

        test('debe lanzar error si query falla', async () => {
            // Arrange
            pool.query.mockRejectedValue(new Error('Query timeout'));

            // Act & Assert
            await expect(dal.getStudentById(1)).rejects.toThrow('Query timeout');
        });
    });

    describe('createStudent', () => {
        test('debe crear estudiante y retornar objeto creado', async () => {
            // Arrange
            const newStudentData = {
                nombre: 'Ana',
                apellido_paterno: 'Martínez',
                apellido_materno: 'Rodríguez',
                email: 'ana.martinez@example.com',
                numero_telefono: '5551234567',
                grado: '4°',
                seccion: 'A'
            };

            const mockCreatedStudent = {
                id: 3,
                ...newStudentData,
                created_at: '2025-11-17T12:00:00Z'
            };

            pool.query.mockResolvedValue({ rows: [mockCreatedStudent], rowCount: 1 });

            // Act
            const result = await dal.createStudent(newStudentData);

            // Assert
            expect(result).toEqual(mockCreatedStudent);
            expect(pool.query).toHaveBeenCalledTimes(1);

            // Verificar que se llamó con INSERT
            const [query, params] = pool.query.mock.calls[0];
            expect(query).toContain('INSERT INTO estudiantes');
            expect(query).toContain('RETURNING *');
            expect(params).toEqual([
                newStudentData.nombre,
                newStudentData.apellido_paterno,
                newStudentData.apellido_materno,
                newStudentData.email,
                newStudentData.numero_telefono,
                newStudentData.grado,
                newStudentData.seccion
            ]);
        });

        test('debe lanzar error si matrícula duplicada', async () => {
            // Arrange
            const duplicateError = new Error('duplicate key value violates unique constraint');
            duplicateError.code = '23505'; // PostgreSQL error code para unique violation
            pool.query.mockRejectedValue(duplicateError);

            // Act & Assert
            await expect(dal.createStudent({ matricula: '2025001' }))
                .rejects
                .toThrow('duplicate key value');
        });
    });

    describe('updateStudent', () => {
        test('debe actualizar estudiante y retornar objeto actualizado', async () => {
            // Arrange
            const updateData = {
                semestre: 5,
                promedio: 9.3,
                status_academico: 'Regular'
            };

            const mockUpdatedStudent = {
                id: 1,
                matricula: '2025001',
                nombre: 'Juan',
                ...updateData
            };

            pool.query.mockResolvedValue({ rows: [mockUpdatedStudent], rowCount: 1 });

            // Act
            const result = await dal.updateStudent(1, updateData);

            // Assert
            expect(result).toEqual(mockUpdatedStudent);
            expect(pool.query).toHaveBeenCalledTimes(1);

            const [query, params] = pool.query.mock.calls[0];
            expect(query).toContain('UPDATE estudiantes');
            expect(query).toContain('SET');
            expect(query).toContain('WHERE id =');
        });

        test('debe retornar null si estudiante no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.updateStudent(999, { semestre: 5 });

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('deleteStudent', () => {
        test('debe eliminar estudiante exitosamente', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

            // Act
            const result = await dal.deleteStudent(1);

            // Assert
            expect(result).toBe(true);
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(
                'DELETE FROM estudiantes WHERE id = $1 RETURNING id',
                [1]
            );
        });

        test('debe retornar false si estudiante no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.deleteStudent(999);

            // Assert
            expect(result).toBe(false);
        });
    });

    /**
     * ============================================
     * TESTS: DOCENTES (Teachers)
     * ============================================
     */
    describe('getAllTeachers', () => {
        test('debe retornar array de docentes', async () => {
            // Arrange
            const mockTeachers = [
                {
                    id: 1,
                    nombre: 'Carlos',
                    apellido_paterno: 'Ramírez',
                    email: 'carlos.ramirez@example.com',
                    especialidad: 'Matemáticas'
                },
                {
                    id: 2,
                    nombre: 'Laura',
                    apellido_paterno: 'Gómez',
                    email: 'laura.gomez@example.com',
                    especialidad: 'Inglés'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockTeachers, rowCount: 2 });

            // Act
            const result = await dal.getAllTeachers();

            // Assert
            expect(result).toEqual(mockTeachers);
            expect(result).toHaveLength(2);
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        test('debe retornar array vacío si no hay docentes', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getAllTeachers();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getTeacherById', () => {
        test('debe retornar docente cuando ID existe', async () => {
            // Arrange
            const mockTeacher = {
                id: 1,
                nombre: 'Carlos',
                apellido_paterno: 'Ramírez',
                email: 'carlos.ramirez@example.com'
            };

            pool.query.mockResolvedValue({ rows: [mockTeacher], rowCount: 1 });

            // Act
            const result = await dal.getTeacherById(1);

            // Assert
            expect(result).toEqual(mockTeacher);
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM docentes WHERE id = $1',
                [1]
            );
        });

        test('debe retornar null cuando ID no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getTeacherById(999);

            // Assert
            expect(result).toBeNull();
        });
    });

    /**
     * ============================================
     * TESTS: NOTICIAS (News)
     * ============================================
     */
    describe('getAllNews', () => {
        test('debe retornar noticias con filtros aplicados', async () => {
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
            const result = await dal.getAllNews({ categoria: 'Académico' });

            // Assert
            expect(result).toEqual(mockNews);
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        test('debe retornar array vacío si no hay noticias', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getAllNews();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getNewsById', () => {
        test('debe retornar noticia cuando ID existe', async () => {
            // Arrange
            const mockNews = {
                id: 1,
                titulo: 'Noticia Importante',
                contenido: 'Lorem ipsum...',
                categoria: 'Académico'
            };

            pool.query.mockResolvedValue({ rows: [mockNews], rowCount: 1 });

            // Act
            const result = await dal.getNewsById(1);

            // Assert
            expect(result).toEqual(mockNews);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('FROM noticias'),
                [1]
            );
        });

        test('debe retornar null cuando ID no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getNewsById(999);

            // Assert
            expect(result).toBeNull();
        });
    });

    /**
     * ============================================
     * TESTS: TENANT CONFIGURATION
     * ============================================
     */
    describe('getTenantByDomain', () => {
        test('debe retornar tenant cuando dominio existe', async () => {
            // Arrange
            const mockTenant = {
                id: 1,
                tenant_name: 'BGE Héroes de la Patria',
                domain: 'bge-heroes.edu.mx',
                status: 'active',
                config_json: {
                    school_name: 'BGE Héroes de la Patria',
                    colors: { primary: '#003366', secondary: '#FF6600' }
                }
            };

            pool.query.mockResolvedValue({ rows: [mockTenant], rowCount: 1 });

            // Act
            const result = await dal.getTenantByDomain('bge-heroes.edu.mx');

            // Assert
            expect(result).toEqual(mockTenant);
            expect(pool.query).toHaveBeenCalledTimes(1);

            // Verificar que se llamó con objeto {text, values}
            const callArg = pool.query.mock.calls[0][0];
            expect(callArg.text).toContain('FROM tenants');
            expect(callArg.text).toContain('WHERE domain = $1');
            expect(callArg.values).toEqual(['bge-heroes.edu.mx', 'active', 'activo']);
        });

        test('debe retornar null cuando dominio no existe', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getTenantByDomain('nonexistent.com');

            // Assert
            expect(result).toBeNull();
        });

        test('debe retornar null si dominio es null o undefined', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const resultNull = await dal.getTenantByDomain(null);
            const resultUndefined = await dal.getTenantByDomain(undefined);

            // Assert
            expect(resultNull).toBeNull();
            expect(resultUndefined).toBeNull();
        });
    });

    /**
     * ============================================
     * TESTS: PENDING APPROVALS
     * ============================================
     */
    describe('getPendingApprovals', () => {
        test('debe retornar solicitudes pendientes de aprobación', async () => {
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
            const result = await dal.getPendingApprovals();

            // Assert
            expect(result).toEqual(mockApprovals);
            expect(result).toHaveLength(2);
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        test('debe retornar array vacío si no hay solicitudes pendientes', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

            // Act
            const result = await dal.getPendingApprovals();

            // Assert
            expect(result).toEqual([]);
        });
    });

    /**
     * ============================================
     * TESTS: ERROR HANDLING
     * ============================================
     */
    describe('Error Handling', () => {
        test('debe manejar errores de timeout de BD', async () => {
            // Arrange
            const timeoutError = new Error('Query timeout');
            timeoutError.code = 'ETIMEDOUT';
            pool.query.mockRejectedValue(timeoutError);

            // Act & Assert
            await expect(dal.getAllStudents()).rejects.toThrow('Query timeout');
        });

        test('debe manejar errores de conexión perdida', async () => {
            // Arrange
            const connectionError = new Error('Connection terminated');
            connectionError.code = 'ECONNRESET';
            pool.query.mockRejectedValue(connectionError);

            // Act & Assert
            await expect(dal.getAllTeachers()).rejects.toThrow('Connection terminated');
        });

        test('debe manejar errores de sintaxis SQL', async () => {
            // Arrange
            const syntaxError = new Error('syntax error at or near "SELECT"');
            syntaxError.code = '42601'; // PostgreSQL syntax error
            pool.query.mockRejectedValue(syntaxError);

            // Act & Assert
            await expect(dal.getAllNews()).rejects.toThrow('syntax error');
        });
    });

    /**
     * ============================================
     * TESTS: EDGE CASES
     * ============================================
     */
    describe('Edge Cases', () => {
        test('getAllStudents debe manejar resultado con rows undefined', async () => {
            // Arrange
            pool.query.mockResolvedValue({ rowCount: 0 });

            // Act
            const result = await dal.getAllStudents();

            // Assert
            expect(result).toEqual([]);
        });

        test('getStudentById debe manejar ID como string', async () => {
            // Arrange
            const mockStudent = { id: 1, nombre: 'Test' };
            pool.query.mockResolvedValue({ rows: [mockStudent], rowCount: 1 });

            // Act
            const result = await dal.getStudentById('1');

            // Assert
            expect(result).toEqual(mockStudent);
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                ['1']
            );
        });

        test('createStudent debe manejar datos con caracteres especiales', async () => {
            // Arrange
            const specialData = {
                nombre: "José María O'Brien",
                apellido_paterno: "García-López",
                email: "jose.maria@example.com"
            };

            pool.query.mockResolvedValue({
                rows: [{ id: 1, ...specialData }],
                rowCount: 1
            });

            // Act
            const result = await dal.createStudent(specialData);

            // Assert
            expect(result.nombre).toBe("José María O'Brien");
        });
    });
});
