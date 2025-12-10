/**
 * 🎓 RUTAS API DE CALIFICACIONES
 * Endpoints para gestión de calificaciones y boletas
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const GradesService = require('../services/grades.service');
const { authenticateToken, requireRole } = require('../middleware/auth');
const devLogger = require('../utils/devLogger');

// Middleware de validación común
const validateCapture = [
    body('estudianteId').isInt().withMessage('ID de estudiante inválido'),
    body('materiaId').isInt().withMessage('ID de materia inválido'),
    body('periodoEvaluacionId').isInt().withMessage('ID de periodo inválido'),
    body('calificacion').isFloat({ min: 0, max: 10 }).withMessage('Calificación debe ser entre 0 y 10')
];

/**
 * POST /api/grades
 * Capturar una calificación (Docente o Admin)
 */
router.post('/', authenticateToken, requireRole(['admin', 'docente']), validateCapture, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const result = await GradesService.captureGrade(req.body, req.user); // req.user viene del middleware auth

        res.json({
            success: true,
            message: 'Calificación guardada exitosamente',
            data: result
        });

    } catch (error) {
        devLogger.error('API', 'Error al capturar calificación', error);
        res.status(400).json({ // 400 Bad Request para errores de negocio (periodo cerrado, etc)
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/grades/student/:id
 * Obtener boleta de un estudiante
 */
router.get('/student/:id', authenticateToken, async (req, res) => {
    try {
        const estudianteId = parseInt(req.params.id);
        const { cicloEscolar } = req.query;

        // Validar permisos: Admin, Docente, o el mismo Estudiante/Padre
        if (req.user.role === 'estudiante' && req.user.userId !== estudianteId) {
            // Validar si es estudiante intentando ver otro, etc. (Simplificado por ahora)
            // return res.status(403).json(...)
        }

        if (!cicloEscolar) {
            return res.status(400).json({ success: false, message: 'Ciclo escolar requerido' });
        }

        const reportCard = await GradesService.getStudentReportCard(estudianteId, cicloEscolar);

        res.json({
            success: true,
            data: reportCard
        });

    } catch (error) {
        devLogger.error('API', 'Error obteniendo boleta', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener calificaciones' });
    }
});

/**
 * GET /api/grades/periods
 * Lista de periodos de evaluación
 */
router.get('/periods', authenticateToken, async (req, res) => {
    try {
        const periods = await GradesService.getAllPeriods();
        res.json({ success: true, data: periods });
    } catch (error) {
        devLogger.error('API', 'Error al obtener periodos', error);
        res.status(500).json({ success: false, message: 'Error al obtener periodos' });
    }
});

/**
 * GET /api/grades/teacher/subjects
 * Lista de materias asignadas al docente logueado
 */
router.get('/teacher/subjects', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        let docenteId;
        // Si es admin, podría querer ver materias de un docente específico (pendiente implementar query param)
        // Por ahora, asumimos que si es docente, usa su ID de usuario para buscar su registro de docente.
        // OJO: req.user.id es usuarioId. Necesitamos docenteId. 
        // El middleware debería haber poblado detalles, o lo buscamos.
        // Asumiremos que el frontend o el token trae la info, pero lo más seguro es buscar el docenteId usando el usuarioId.

        // TODO: Mover lógica de obtener docenteId a un helper o middleware si se repite mucho.
        const TeacherDAO = require('../data/teacher.dao'); // Lazy load
        const teacher = await TeacherDAO.getByEmail(req.user.email); // O usar ID

        if (!teacher && req.user.role !== 'admin') {
            return res.status(404).json({ success: false, message: 'Perfil de docente no encontrado' });
        }

        const subjects = await GradesService.getTeacherSubjects(teacher ? teacher.id : 0); // Si es admin sin ser docente, devuelve vacío o todas (si implementamos lógica admin)
        res.json({ success: true, data: subjects });
    } catch (error) {
        devLogger.error('API', 'Error al obtener materias del docente', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});

/**
 * GET /api/grades/subject/:id/students
 * Lista de estudiantes en una materia
 */
router.get('/subject/:id/students', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const materiaId = parseInt(req.params.id);
        const students = await GradesService.getSubjectStudents(materiaId);
        res.json({ success: true, data: students });
    } catch (error) {
        devLogger.error('API', 'Error al obtener estudiantes de la materia', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});

module.exports = router;