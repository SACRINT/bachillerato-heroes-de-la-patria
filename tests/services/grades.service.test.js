// MOCKS FIRST - Mover mocks al inicio para asegurar que se apliquen antes de los requires
// Esto es necesario porque 'transform: {}' en jest.config.js deshabilita el hoisting automático.

// Mock dependencies con factory explícito y PATH ABSOLUTO
jest.mock('../../backend/data/grade.dao', () => ({
    get: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getByStudent: jest.fn(),
    list: jest.fn(),
    getAverage: jest.fn()
}));

jest.mock('../../backend/data/periodos-evaluacion.dao', () => ({
    get: jest.fn(),
    getByCodigo: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
}));

jest.mock('../../backend/utils/devLogger', () => ({
    log: jest.fn(),
    error: jest.fn()
}));

// REQUIRES DESPUÉS DE MOCKS
const GradesService = require('../../backend/services/grades.service');
const GradeDAO = require('../../backend/data/grade.dao');
const PeriodosEvaluacionDAO = require('../../backend/data/periodos-evaluacion.dao');

describe('GradesService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('captureGrade', () => {
        const mockData = {
            estudianteId: 1,
            materiaId: 101,
            periodoEvaluacionId: 1,
            calificacion: 8.5,
            observaciones: 'Buen trabajo',
            faltas: 0
        };

        const mockUser = { id: 99, role: 'docente' };

        test('should throw error if score is out of range (< 0)', async () => {
            await expect(GradesService.captureGrade({ ...mockData, calificacion: -1 }, mockUser))
                .rejects.toThrow('La calificación debe estar entre 0 y 10');
        });

        test('should throw error if score is out of range (> 10)', async () => {
            await expect(GradesService.captureGrade({ ...mockData, calificacion: 11 }, mockUser))
                .rejects.toThrow('La calificación debe estar entre 0 y 10');
        });

        test('should throw error if period not found', async () => {
            // Asegurar que estamos accediendo al MOCK y no al real
            const mockDao = require('../../backend/data/periodos-evaluacion.dao');
            mockDao.get.mockResolvedValue(null);

            await expect(GradesService.captureGrade(mockData, mockUser))
                .rejects.toThrow('Periodo de evaluación no encontrado');
        });

        test('should throw error if period is closed (and user is not admin)', async () => {
            const mockDao = require('../../backend/data/periodos-evaluacion.dao');
            mockDao.get.mockResolvedValue({
                id: 1, estado: 'cerrado', fecha_fin_captura: new Date(Date.now() - 100000)
            });
            await expect(GradesService.captureGrade(mockData, mockUser))
                .rejects.toThrow('El periodo de evaluación no está abierto');
        });

        test('should allow admin to capture even if period is closed', async () => {
            const mockDao = require('../../backend/data/periodos-evaluacion.dao');
            mockDao.get.mockResolvedValue({
                id: 1, estado: 'cerrado'
            });
            GradeDAO.exists.mockResolvedValue(null);
            GradeDAO.create.mockResolvedValue({ id: 500, ...mockData });

            const result = await GradesService.captureGrade(mockData, { ...mockUser, role: 'admin' });
            expect(result).toBeDefined();
            expect(GradeDAO.create).toHaveBeenCalled();
        });

        test('should create new grade if it does not exist', async () => {
            const mockDao = require('../../backend/data/periodos-evaluacion.dao');
            mockDao.get.mockResolvedValue({
                id: 1, estado: 'activo', fecha_inicio_captura: new Date(Date.now() - 10000), fecha_fin_captura: new Date(Date.now() + 10000)
            });
            GradeDAO.exists.mockResolvedValue(null);
            GradeDAO.create.mockResolvedValue({ id: 500, ...mockData });

            const result = await GradesService.captureGrade(mockData, mockUser);
            expect(GradeDAO.create).toHaveBeenCalledWith(expect.objectContaining({
                calificacion: 8.5,
                captured_by: 99
            }));
            expect(result).toBeDefined();
        });

        test('should update existing grade if it exists', async () => {
            const mockDao = require('../../backend/data/periodos-evaluacion.dao');
            mockDao.get.mockResolvedValue({
                id: 1, estado: 'activo', fecha_inicio_captura: new Date(Date.now() - 10000), fecha_fin_captura: new Date(Date.now() + 10000)
            });
            GradeDAO.exists.mockResolvedValue({ id: 500 });
            GradeDAO.update.mockResolvedValue({ id: 500, ...mockData, calificacion: 9.0 });

            const result = await GradesService.captureGrade({ ...mockData, calificacion: 9.0 }, mockUser);
            expect(GradeDAO.update).toHaveBeenCalledWith(500, expect.objectContaining({
                calificacion: 9.0,
                captured_by: 99
            }));
            expect(result.calificacion).toBe(9.0);
        });
    });

    describe('getStudentReportCard', () => {
        test('should group grades by subject correctly', async () => {
            const mockGrades = [
                {
                    materia_id: 101, materia_nombre: 'Matemáticas I', materia_clave: 'MAT1', semestre: 1, creditos: 8,
                    periodo_codigo: 'P1', calificacion: 8.0
                },
                {
                    materia_id: 101, materia_nombre: 'Matemáticas I', materia_clave: 'MAT1', semestre: 1, creditos: 8,
                    periodo_codigo: 'P2', calificacion: 9.0
                },
                {
                    materia_id: 102, materia_nombre: 'Historia I', materia_clave: 'HIS1', semestre: 1, creditos: 6,
                    periodo_codigo: 'P1', calificacion: 10.0
                }
            ];

            GradeDAO.getByStudent.mockResolvedValue(mockGrades);

            const report = await GradesService.getStudentReportCard(1, '2025-2026');

            expect(report.estudianteId).toBe(1);
            expect(report.materias).toHaveLength(2);

            // Verificar Matemáticas (2 parciales)
            const mates = report.materias.find(m => m.materia === 'Matemáticas I');
            expect(mates.parciales['P1']).toBe(8.0);
            expect(mates.parciales['P2']).toBe(9.0);
            expect(mates.promedio_final).toBe('8.5'); // (8+9)/2

            // Verificar Historia (1 parcial)
            const historia = report.materias.find(m => m.materia === 'Historia I');
            expect(historia.parciales['P1']).toBe(10.0);
            expect(historia.promedio_final).toBe('10.0');
        });
    });

});
