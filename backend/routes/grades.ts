/**
 * 🎓 RUTAS API DE CALIFICACIONES - TypeScript
 * Endpoints para gestión de calificaciones y boletas
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import GradesService from '../services/grades.service';
import { authenticateToken, requireRole } from '../middleware/auth';
import devLogger from '../utils/devLogger';
import { generateReportCardPDF } from '../utils/pdfGenerator';
import StudentDAO from '../data/student.dao';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string; email: string; userId?: number };
}

interface GradeData {
    estudianteId: number;
    materiaId: number;
    periodoEvaluacionId: number;
    calificacion: number;
}

interface Period {
    id: number;
    nombre: string;
    activo: boolean;
    fecha_inicio: string;
    fecha_fin: string;
}

interface Subject {
    id: number;
    nombre: string;
    codigo: string;
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const validateCapture: ValidationChain[] = [
    body('estudianteId').isInt().withMessage('ID de estudiante inválido'),
    body('materiaId').isInt().withMessage('ID de materia inválido'),
    body('periodoEvaluacionId').isInt().withMessage('ID de periodo inválido'),
    body('calificacion').isFloat({ min: 0, max: 10 }).withMessage('Calificación debe ser entre 0 y 10')
];

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/grades
 */
router.post('/', authenticateToken, requireRole(['admin', 'docente']), validateCapture, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const result = await GradesService.captureGrade(req.body as GradeData, req.user);
        res.json({ success: true, message: 'Calificación guardada exitosamente', data: result });
    } catch (error) {
        devLogger.error('API: Error al capturar calificación', error);
        res.status(400).json({ success: false, message: (error as Error).message });
    }
});

/**
 * GET /api/grades/student/:id
 */
router.get('/student/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const estudianteId = parseInt(req.params.id);
        const { cicloEscolar = '2024-2025' } = req.query as { cicloEscolar?: string };

        const reportCard = await GradesService.getStudentReportCard(estudianteId, cicloEscolar);
        res.json({ success: true, data: reportCard });
    } catch (error) {
        devLogger.error('API: Error obteniendo boleta', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener calificaciones' });
    }
});

/**
 * GET /api/grades/periods
 */
router.get('/periods', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const periods = await GradesService.getAllPeriods() as Period[];
        res.json({ success: true, data: periods });
    } catch (error) {
        devLogger.error('API: Error al obtener periodos', error);
        res.status(500).json({ success: false, message: 'Error al obtener periodos' });
    }
});

/**
 * GET /api/grades/teacher/subjects
 */
router.get('/teacher/subjects', authenticateToken, requireRole(['docente', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const TeacherDAO = require('../data/teacher.dao');
        const teacher = await TeacherDAO.getByEmail(req.user?.email);

        if (!teacher && req.user?.role !== 'admin') {
            res.status(404).json({ success: false, message: 'Perfil de docente no encontrado' });
            return;
        }

        const subjects = await GradesService.getTeacherSubjects(teacher ? teacher.id : 0) as Subject[];
        res.json({ success: true, data: subjects });
    } catch (error) {
        devLogger.error('API: Error al obtener materias del docente', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});

/**
 * GET /api/grades/subject/:id/students
 */
router.get('/subject/:id/students', authenticateToken, requireRole(['docente', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const materiaId = parseInt(req.params.id);
        const students = await GradesService.getSubjectStudents(materiaId);
        res.json({ success: true, data: students });
    } catch (error) {
        devLogger.error('API: Error al obtener estudiantes de la materia', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});

/**
 * GET /api/grades/batch
 */
router.get('/batch', authenticateToken, requireRole(['docente', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { materiaId, periodoId } = req.query as { materiaId: string; periodoId: string };

        if (!materiaId || !periodoId) {
            res.status(400).json({ success: false, message: 'Se requieren materiaId y periodoId' });
            return;
        }

        const grades = await GradesService.getGradesByGroup(parseInt(materiaId), parseInt(periodoId));
        res.json({ success: true, data: grades });
    } catch (error) {
        devLogger.error('API: Error al obtener calificaciones en lote', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener calificaciones' });
    }
});

/**
 * GET /api/grades/student/:id/pdf
 * Generar boleta en PDF
 */
router.get('/student/:id/pdf', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const estudianteId = parseInt(req.params.id);
        const { cicloEscolar = '2024-2025' } = req.query as { cicloEscolar?: string };

        // 1. Obtener datos de calificaciones
        const reportCard = await GradesService.getStudentReportCard(estudianteId, cicloEscolar);

        // 2. Obtener datos personales del estudiante
        const student = await StudentDAO.get(estudianteId);

        if (!student) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado.' });
            return;
        }

        // 3. Formatear datos para el generador de PDF
        const gradesForPdf = reportCard.materias.map((m: any) => ({
            materia: m.materia,
            profesor: m.docente || 'Sin Asignar',
            parcial1: m.parciales['1'] || '-',
            parcial2: m.parciales['2'] || '-',
            parcial3: m.parciales['3'] || '-',
            promedioFinal: m.promedio_final || '-',
            faltas: 0
        }));

        // Calcular Promedio General
        const validGrades = gradesForPdf.filter((g: any) => !isNaN(parseFloat(g.promedioFinal as string)));
        const generalAverage = validGrades.length > 0
            ? (validGrades.reduce((sum: number, g: any) => sum + parseFloat(g.promedioFinal as string), 0) / validGrades.length).toFixed(1)
            : '-';

        const pdfData = {
            studentName: `${student.nombre} ${student.apellido_paterno} ${student.apellido_materno || ''}`.trim(),
            matricula: student.curp || 'S/M',
            grupo: student.grupo || 'Sin Grupo',
            cicloEscolar: cicloEscolar,
            promedioGeneral: generalAverage,
            grades: gradesForPdf
        };

        // 4. Generar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=boleta_${estudianteId}.pdf`);

        generateReportCardPDF(pdfData, res);

    } catch (error) {
        devLogger.error('API: Error generando PDF de boleta', error);
        res.status(500).json({ success: false, message: 'Error al generar el PDF de la boleta.' });
    }
});

export default router;
