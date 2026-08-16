"use strict";
/**
 * 🎓 RUTAS API DE CALIFICACIONES - TypeScript
 * Endpoints para gestión de calificaciones y boletas
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const grades_service_1 = __importDefault(require('../services/grades.service.js'));
const auth_1 = require('../middleware/auth.js');
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
const pdfGenerator_1 = require('../utils/pdfGenerator.js');
const student_dao_1 = __importDefault(require('../data/student.dao.js'));
const router = express_1.default.Router();
// ============================================
// VALIDATION MIDDLEWARE
// ============================================
const validateCapture = [
    (0, express_validator_1.body)('estudianteId').isInt().withMessage('ID de estudiante inválido'),
    (0, express_validator_1.body)('materiaId').isInt().withMessage('ID de materia inválido'),
    (0, express_validator_1.body)('periodoEvaluacionId').isInt().withMessage('ID de periodo inválido'),
    (0, express_validator_1.body)('calificacion').isFloat({ min: 0, max: 10 }).withMessage('Calificación debe ser entre 0 y 10')
];
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/grades
 */
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { cicloEscolar = '2024-2025' } = req.query;
        res.json({
            success: true,
            grades: [],
            data: [],
            cicloEscolar
        });
    } catch (error) {
        devLogger_1.default.error('API: Error al listar calificaciones', error);
        res.json({ success: true, grades: [], data: [] });
    }
});

/**
 * POST /api/grades
 */
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'docente']), validateCapture, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const result = await grades_service_1.default.captureGrade(req.body, req.user);
        res.json({ success: true, message: 'Calificación guardada exitosamente', data: result });
    }
    catch (error) {
        devLogger_1.default.error('API: Error al capturar calificación', error);
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * GET /api/grades/student/:id
 */
router.get('/student/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const estudianteId = parseInt(req.params.id);
        const cicloEscolar = req.query.cicloEscolar || '2024-2025';
        const reportCard = await grades_service_1.default.getStudentReportCard(estudianteId, cicloEscolar);
        res.json({ success: true, data: reportCard });
    }
    catch (error) {
        devLogger_1.default.error('API: Error obteniendo boleta', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener calificaciones' });
    }
});
/**
 * GET /api/grades/periods
 */
router.get('/periods', auth_1.authenticateToken, async (req, res) => {
    try {
        const periods = await grades_service_1.default.getAllPeriods();
        res.json({ success: true, data: periods });
    }
    catch (error) {
        devLogger_1.default.error('API: Error al obtener periodos', error);
        res.status(500).json({ success: false, message: 'Error al obtener periodos' });
    }
});
/**
 * GET /api/grades/teacher/subjects
 */
router.get('/teacher/subjects', auth_1.authenticateToken, (0, auth_1.requireRole)(['docente', 'admin']), async (req, res) => {
    try {
        const TeacherDAO = require('../data/teacher.dao.js');
        const teacher = await TeacherDAO.getByEmail(req.user?.email);
        if (!teacher && req.user?.role !== 'admin') {
            res.status(404).json({ success: false, message: 'Perfil de docente no encontrado' });
            return;
        }
        const subjects = await grades_service_1.default.getTeacherSubjects(teacher ? teacher.id : 0);
        res.json({ success: true, data: subjects });
    }
    catch (error) {
        devLogger_1.default.error('API: Error al obtener materias del docente', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});
/**
 * GET /api/grades/subject/:id/students
 */
router.get('/subject/:id/students', auth_1.authenticateToken, (0, auth_1.requireRole)(['docente', 'admin']), async (req, res) => {
    try {
        const materiaId = parseInt(req.params.id);
        const students = await grades_service_1.default.getSubjectStudents(materiaId);
        res.json({ success: true, data: students });
    }
    catch (error) {
        devLogger_1.default.error('API: Error al obtener estudiantes de la materia', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});
/**
 * GET /api/grades/batch
 */
router.get('/batch', auth_1.authenticateToken, (0, auth_1.requireRole)(['docente', 'admin']), async (req, res) => {
    try {
        const { materiaId, periodoId } = req.query;
        if (!materiaId || !periodoId) {
            res.status(400).json({ success: false, message: 'Se requieren materiaId y periodoId' });
            return;
        }
        const grades = await grades_service_1.default.getGradesByGroup(parseInt(materiaId), parseInt(periodoId));
        res.json({ success: true, data: grades });
    }
    catch (error) {
        devLogger_1.default.error('API: Error al obtener calificaciones en lote', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener calificaciones' });
    }
});
/**
 * GET /api/grades/student/:id/pdf
 * Generar boleta en PDF
 */
router.get('/student/:id/pdf', auth_1.authenticateToken, async (req, res) => {
    try {
        const estudianteId = parseInt(req.params.id);
        const cicloEscolar = req.query.cicloEscolar || '2024-2025';
        // 1. Obtener datos de calificaciones
        const reportCard = await grades_service_1.default.getStudentReportCard(estudianteId, cicloEscolar);
        // 2. Obtener datos personales del estudiante
        const student = await student_dao_1.default.get(estudianteId);
        if (!student) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado.' });
            return;
        }
        // 3. Formatear datos para el generador de PDF
        const gradesForPdf = reportCard.materias.map((m) => ({
            materia: m.materia,
            profesor: m.docente || 'Sin Asignar',
            parcial1: m.parciales['1'] || '-',
            parcial2: m.parciales['2'] || '-',
            parcial3: m.parciales['3'] || '-',
            promedioFinal: m.promedio_final || '-',
            faltas: 0
        }));
        // Calcular Promedio General
        const validGrades = gradesForPdf.filter((g) => !isNaN(parseFloat(g.promedioFinal)));
        const generalAverage = validGrades.length > 0
            ? (validGrades.reduce((sum, g) => sum + parseFloat(g.promedioFinal), 0) / validGrades.length).toFixed(1)
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
        (0, pdfGenerator_1.generateReportCardPDF)(pdfData, res);
    }
    catch (error) {
        devLogger_1.default.error('API: Error generando PDF de boleta', error);
        res.status(500).json({ success: false, message: 'Error al generar el PDF de la boleta.' });
    }
});
exports.default = router;
//# sourceMappingURL=grades.js.map