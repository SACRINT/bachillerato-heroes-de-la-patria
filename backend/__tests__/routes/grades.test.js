/**
 * 🧪 Tests para Grades API
 * SEMANA 1 - Tarea 1.2: Testing Suite
 */

const request = require('supertest');

// Mock de GradesService para aislar la capa de rutas
jest.mock('../../services/grades.service', () => ({
    getStudentReportCard: jest.fn(),
    getAllPeriods: jest.fn(),
    captureGrade: jest.fn(),
    getTeacherSubjects: jest.fn(),
    getSubjectStudents: jest.fn()
}));

// Mock del middleware de autenticación
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, email: 'docente@bge.edu.mx', role: 'docente' };
        next();
    },
    requireRole: (roles) => (req, res, next) => next()
}));

const GradesService = require('../../services/grades.service');

// Importar el router después de los mocks
const express = require('express');
const gradesRoutesRaw = require('../../routes/grades');
const gradesRoutes = gradesRoutesRaw.default || gradesRoutesRaw;

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/grades', gradesRoutes);

describe('Grades API', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    // =====================================
    // GET /api/grades/student/:id
    // =====================================
    describe('GET /student/:id', () => {
        it('debería retornar boleta de estudiante', async () => {
            const mockReportCard = {
                student: { id: 1, nombre: 'Juan' },
                grades: [
                    { materia: 'Matemáticas', calificacion: 9.5 }
                ],
                promedio: 9.5
            };

            GradesService.getStudentReportCard.mockResolvedValue(mockReportCard);

            const res = await request(app)
                .get('/api/grades/student/1?cicloEscolar=2024-2025')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockReportCard);
        });

        it('debería requerir ciclo escolar', async () => {
            const res = await request(app)
                .get('/api/grades/student/1')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Ciclo escolar requerido');
        });
    });

    // =====================================
    // GET /api/grades/periods
    // =====================================
    describe('GET /periods', () => {
        it('debería retornar lista de periodos', async () => {
            const mockPeriods = [{ id: 1, nombre: 'Periodo 1', activo: true }];
            GradesService.getAllPeriods.mockResolvedValue(mockPeriods);

            const res = await request(app)
                .get('/api/grades/periods')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].nombre).toBe('Periodo 1');
        });
    });

    // =====================================
    // POST /api/grades (Capture)
    // =====================================
    describe('POST /', () => {
        it('debería capturar validación correctamente', async () => {
            const mockResponse = { insertId: 100, message: 'Saved' };
            GradesService.captureGrade.mockResolvedValue(mockResponse);

            const res = await request(app)
                .post('/api/grades')
                .send({
                    estudianteId: 1,
                    materiaId: 1,
                    periodoEvaluacionId: 1,
                    calificacion: 9.5
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockResponse);
        });

        it('debería validar datos faltantes', async () => {
            const res = await request(app)
                .post('/api/grades')
                .send({
                    calificacion: 11 // Invalid and missing fields
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });
    });
});
