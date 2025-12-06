/**
 * 🧪 Tests para Grades API
 * SEMANA 1 - Tarea 1.2: Testing Suite
 */

const request = require('supertest');

// Mock de la base de datos (config/database es lo que realmente usa grades.js)
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn(),
    getPool: jest.fn()
}));

// Mock del middleware de autenticación
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, email: 'docente@bge.edu.mx', role: 'docente' };
        next();
    }
}));

const { executeQuery } = require('../../config/database');

// Importar el router después de los mocks
const express = require('express');
const gradesRoutes = require('../../routes/grades');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/grades', gradesRoutes);

describe('Grades API', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        executeQuery.mockImplementation((sql, params) => {
            return Promise.resolve([]);
        });
    });

    // =====================================
    // GET /api/grades/:id
    // =====================================
    describe('GET /:id', () => {
        it('debería retornar calificación específica con detalles', async () => {
            const mockGrade = [{
                id: 1,
                estudiante_id: 1,
                materia_id: 1,
                calificacion: 9.5,
                parcial: 1,
                ciclo_escolar: '2024-2025',
                materia_nombre: 'Matemáticas I',
                estudiante_nombre: 'Juan',
                estudiante_apellido: 'Pérez',
                docente_nombre: 'Prof. García'
            }];

            executeQuery.mockResolvedValueOnce(mockGrade);

            const res = await request(app)
                .get('/api/grades/1')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.calificacion).toBe(9.5);
            expect(res.body.data.materia_nombre).toBe('Matemáticas I');
        });

        it('debería retornar 404 si calificación no existe', async () => {
            executeQuery.mockResolvedValueOnce([]);

            const res = await request(app)
                .get('/api/grades/999')
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it('debería validar ID numérico', async () => {
            const res = await request(app)
                .get('/api/grades/invalid')
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // =====================================
    // PUT /api/grades/:id
    // =====================================
    describe('PUT /:id', () => {
        it('debería actualizar calificación existente', async () => {
            const mockExisting = [{
                id: 1,
                calificacion: 8.0,
                estudiante_id: 1
            }];
            const mockUpdated = [{
                id: 1,
                calificacion: 9.0,
                estudiante_id: 1
            }];

            executeQuery
                .mockResolvedValueOnce(mockExisting) // Check exists
                .mockResolvedValueOnce(mockUpdated) // Update
                .mockResolvedValueOnce([]) // Record history
                .mockResolvedValueOnce([]); // Update average

            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    calificacion: 9.0,
                    observaciones: 'Corrección de calificación'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        it('debería validar rango de calificación (0-10)', async () => {
            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    calificacion: 11 // Fuera de rango
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('debería validar tipo de evaluación', async () => {
            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    tipo_evaluacion: 'invalido'
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('debería aceptar tipos válidos de evaluación', async () => {
            const mockExisting = [{ id: 1, calificacion: 8.0, estudiante_id: 1 }];
            const mockUpdated = [{ id: 1, calificacion: 8.0, tipo_evaluacion: 'extraordinario' }];

            executeQuery
                .mockResolvedValueOnce(mockExisting)
                .mockResolvedValueOnce(mockUpdated)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    tipo_evaluacion: 'extraordinario'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });

    // =====================================
    // DELETE /api/grades/:id
    // =====================================
    describe('DELETE /:id', () => {
        it('debería eliminar calificación y registrar en historial', async () => {
            const mockExisting = [{
                id: 1,
                calificacion: 8.0,
                estudiante_id: 1,
                materia_id: 1
            }];

            executeQuery
                .mockResolvedValueOnce(mockExisting) // Check exists
                .mockResolvedValueOnce([]) // Record history
                .mockResolvedValueOnce([]) // Delete
                .mockResolvedValueOnce([]); // Update average

            const res = await request(app)
                .delete('/api/grades/1')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('eliminada');
        });

        it('debería retornar 404 si calificación no existe', async () => {
            executeQuery.mockResolvedValueOnce([]);

            const res = await request(app)
                .delete('/api/grades/999')
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it('debería validar ID numérico', async () => {
            const res = await request(app)
                .delete('/api/grades/abc')
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // =====================================
    // Tests de validación general
    // =====================================
    describe('Validaciones generales', () => {
        it('debería rechazar calificación negativa', async () => {
            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    calificacion: -1
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('debería aceptar calificación decimal', async () => {
            const mockExisting = [{ id: 1, calificacion: 8.0, estudiante_id: 1 }];
            const mockUpdated = [{ id: 1, calificacion: 8.5 }];

            executeQuery
                .mockResolvedValueOnce(mockExisting)
                .mockResolvedValueOnce(mockUpdated)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    calificacion: 8.5
                })
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        it('debería aceptar campo is_final booleano', async () => {
            const mockExisting = [{ id: 1, calificacion: 8.0, estudiante_id: 1 }];
            const mockUpdated = [{ id: 1, is_final: true }];

            executeQuery
                .mockResolvedValueOnce(mockExisting)
                .mockResolvedValueOnce(mockUpdated)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const res = await request(app)
                .put('/api/grades/1')
                .send({
                    is_final: true
                })
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });

    // =====================================
    // Tests de manejo de errores
    // =====================================
    describe('Manejo de errores', () => {
        it('debería manejar errores de base de datos en GET', async () => {
            executeQuery.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .get('/api/grades/1')
                .expect(500);

            expect(res.body.success).toBe(false);
        });

        it('debería manejar errores de base de datos en PUT', async () => {
            executeQuery.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .put('/api/grades/1')
                .send({ calificacion: 9.0 })
                .expect(500);

            expect(res.body.success).toBe(false);
        });

        it('debería manejar errores de base de datos en DELETE', async () => {
            executeQuery.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .delete('/api/grades/1')
                .expect(500);

            expect(res.body.success).toBe(false);
        });
    });
});
