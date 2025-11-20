/**
 * 🎓 RUTAS DE ESTUDIANTES v2 - Service Layer Pattern
 * SEMANA 2 - Plan 24 Semanas
 *
 * Esta versión usa studentService para separar lógica de negocio de las rutas.
 * Patrón: Rutas delegan a Servicios, Servicios delegan a DAL.
 *
 * Fecha: 20 Noviembre 2025
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken, requireTeacher, requireAdmin } = require('../middleware/auth');
const devLogger = require('../utils/devLogger');
const StudentService = require('../services/studentService');

const router = express.Router();

// ============================================
// RUTAS QUE USAN SERVICE LAYER
// ============================================

/**
 * GET /api/students-v2
 * Obtener estudiantes con filtros y paginación
 */
router.get('/', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const {
      search,
      grado,
      status,
      page = 1,
      limit = 50,
      sortBy = 'apellido_paterno',
      sortOrder = 'ASC'
    } = req.query;

    const result = await StudentService.getAll({
      search,
      grado,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.json(result);
  } catch (error) {
    devLogger.error('[students-v2] Error en GET /:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener estudiantes'
    });
  }
});

/**
 * GET /api/students-v2/stats
 * Obtener estadísticas de estudiantes
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await StudentService.getStats();

    res.json(result);
  } catch (error) {
    devLogger.error('[students-v2] Error en GET /stats:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas'
    });
  }
});

/**
 * GET /api/students-v2/search
 * Búsqueda avanzada de estudiantes
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    const result = await StudentService.search(q);

    res.json(result);
  } catch (error) {
    devLogger.error('[students-v2] Error en GET /search:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error en búsqueda'
    });
  }
});

/**
 * GET /api/students-v2/export
 * Exportar estudiantes a CSV o JSON
 */
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const result = await StudentService.export(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
      res.send(result.data);
    } else {
      res.json(result);
    }
  } catch (error) {
    devLogger.error('[students-v2] Error en GET /export:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al exportar'
    });
  }
});

/**
 * GET /api/students-v2/:id
 * Obtener estudiante por ID
 */
router.get('/:id',
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('ID inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const student = await StudentService.getStudentById(parseInt(req.params.id));

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      devLogger.error('[students-v2] Error en GET /:id:', error.message);
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener estudiante'
      });
    }
  }
);

/**
 * GET /api/students-v2/:id/grades
 * Obtener calificaciones de un estudiante
 */
router.get('/:id/grades',
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('ID inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const grades = await StudentService.getStudentGrades(parseInt(req.params.id));

      res.json({
        success: true,
        data: grades
      });
    } catch (error) {
      devLogger.error('[students-v2] Error en GET /:id/grades:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener calificaciones'
      });
    }
  }
);

/**
 * GET /api/students-v2/:id/attendance
 * Obtener asistencias de un estudiante
 */
router.get('/:id/attendance',
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('ID inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const attendance = await StudentService.getStudentAttendance(parseInt(req.params.id));

      res.json({
        success: true,
        data: attendance
      });
    } catch (error) {
      devLogger.error('[students-v2] Error en GET /:id/attendance:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener asistencias'
      });
    }
  }
);

/**
 * POST /api/students-v2
 * Crear nuevo estudiante
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('nombre').isLength({ min: 2 }).withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email válido requerido'),
    body('matricula').optional().isString(),
    body('especialidad').optional().isString(),
    body('semestre').optional().isInt({ min: 1, max: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const student = await StudentService.createStudent(req.body);

      res.status(201).json({
        success: true,
        data: student,
        message: 'Estudiante creado exitosamente'
      });
    } catch (error) {
      devLogger.error('[students-v2] Error en POST /:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al crear estudiante'
      });
    }
  }
);

/**
 * PUT /api/students-v2/:id
 * Actualizar estudiante
 */
router.put('/:id',
  authenticateToken,
  requireAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('nombre').optional().isLength({ min: 2 }),
    body('email').optional().isEmail(),
    body('especialidad').optional().isString(),
    body('semestre').optional().isInt({ min: 1, max: 6 }),
    body('status_academico').optional().isIn(['activo', 'baja', 'egresado'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const student = await StudentService.updateStudent(parseInt(req.params.id), req.body);

      res.json({
        success: true,
        data: student,
        message: 'Estudiante actualizado exitosamente'
      });
    } catch (error) {
      devLogger.error('[students-v2] Error en PUT /:id:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar estudiante'
      });
    }
  }
);

/**
 * DELETE /api/students-v2/:id
 * Eliminar estudiante (soft delete)
 */
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  [param('id').isInt({ min: 1 }).withMessage('ID inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      await StudentService.deleteStudent(parseInt(req.params.id));

      res.json({
        success: true,
        message: 'Estudiante eliminado exitosamente'
      });
    } catch (error) {
      devLogger.error('[students-v2] Error en DELETE /:id:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar estudiante'
      });
    }
  }
);

module.exports = router;
