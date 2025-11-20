/**
 * 📊 RUTAS DE CALIFICACIONES v2 - Service Layer Pattern
 * SEMANA 2 - Plan 24 Semanas
 *
 * Esta versión usa GradesService para separar lógica de negocio de las rutas.
 * Patrón: Rutas delegan a Servicios, Servicios delegan a DAL.
 *
 * Fecha: 20 Noviembre 2025
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken, requireTeacher, requireAdmin } = require('../middleware/auth');
const devLogger = require('../utils/devLogger');
const GradesService = require('../services/GradesService');

const router = express.Router();

// ============================================
// RUTAS QUE USAN SERVICE LAYER
// ============================================

/**
 * GET /api/grades-v2
 * Obtener calificaciones con filtros y paginación
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      estudianteId,
      docenteId,
      materia,
      parcial,
      ciclo,
      page = 1,
      limit = 50
    } = req.query;

    const result = await GradesService.getAll({
      estudianteId: estudianteId ? parseInt(estudianteId) : undefined,
      docenteId: docenteId ? parseInt(docenteId) : undefined,
      materia,
      parcial: parcial ? parseInt(parcial) : undefined,
      ciclo,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (error) {
    devLogger.error('[grades-v2] Error en GET /:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener calificaciones'
    });
  }
});

/**
 * GET /api/grades-v2/stats
 * Obtener estadísticas de calificaciones
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { ciclo, materia } = req.query;

    const result = await GradesService.getStats({ ciclo, materia });

    res.json(result);
  } catch (error) {
    devLogger.error('[grades-v2] Error en GET /stats:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas'
    });
  }
});

/**
 * GET /api/grades-v2/:id
 * Obtener calificación por ID
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

      const result = await GradesService.getById(parseInt(req.params.id));

      res.json(result);
    } catch (error) {
      devLogger.error('[grades-v2] Error en GET /:id:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener calificación'
      });
    }
  }
);

/**
 * GET /api/grades-v2/student/:estudianteId
 * Obtener calificaciones de un estudiante con promedios
 */
router.get('/student/:estudianteId',
  authenticateToken,
  [param('estudianteId').isInt({ min: 1 }).withMessage('ID de estudiante inválido')],
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

      const result = await GradesService.getByStudent(parseInt(req.params.estudianteId));

      res.json(result);
    } catch (error) {
      devLogger.error('[grades-v2] Error en GET /student/:id:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener calificaciones del estudiante'
      });
    }
  }
);

/**
 * POST /api/grades-v2
 * Crear nueva calificación
 */
router.post('/',
  authenticateToken,
  requireTeacher,
  [
    body('estudiante_id').isInt({ min: 1 }).withMessage('ID de estudiante requerido'),
    body('materia').notEmpty().withMessage('Materia requerida'),
    body('calificacion').isFloat({ min: 0, max: 10 }).withMessage('Calificación entre 0 y 10'),
    body('parcial').optional().isInt({ min: 1, max: 3 }),
    body('observaciones').optional().isString(),
    body('ciclo').optional().isString()
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

      const data = {
        estudiante_id: req.body.estudiante_id,
        docente_id: req.user.id,
        materia: req.body.materia,
        parcial: req.body.parcial,
        calificacion: req.body.calificacion,
        observaciones: req.body.observaciones,
        ciclo: req.body.ciclo
      };

      const result = await GradesService.create(data);

      res.status(201).json(result);
    } catch (error) {
      devLogger.error('[grades-v2] Error en POST /:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al crear calificación'
      });
    }
  }
);

/**
 * PUT /api/grades-v2/:id
 * Actualizar calificación
 */
router.put('/:id',
  authenticateToken,
  requireTeacher,
  [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('calificacion').optional().isFloat({ min: 0, max: 10 }),
    body('observaciones').optional().isString(),
    body('materia').optional().isString(),
    body('parcial').optional().isInt({ min: 1, max: 3 })
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

      const result = await GradesService.update(parseInt(req.params.id), req.body);

      res.json(result);
    } catch (error) {
      devLogger.error('[grades-v2] Error en PUT /:id:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar calificación'
      });
    }
  }
);

/**
 * DELETE /api/grades-v2/:id
 * Eliminar calificación
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

      const result = await GradesService.delete(parseInt(req.params.id));

      res.json(result);
    } catch (error) {
      devLogger.error('[grades-v2] Error en DELETE /:id:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar calificación'
      });
    }
  }
);

/**
 * POST /api/grades-v2/bulk
 * Crear calificaciones en lote
 */
router.post('/bulk',
  authenticateToken,
  requireTeacher,
  [
    body('calificaciones').isArray({ min: 1 }).withMessage('Array de calificaciones requerido'),
    body('calificaciones.*.estudiante_id').isInt({ min: 1 }),
    body('calificaciones.*.materia').notEmpty(),
    body('calificaciones.*.calificacion').isFloat({ min: 0, max: 10 })
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

      // Agregar docente_id a cada calificación
      const gradesWithDocente = req.body.calificaciones.map(g => ({
        ...g,
        docente_id: req.user.id
      }));

      const result = await GradesService.bulkCreate(gradesWithDocente);

      res.json(result);
    } catch (error) {
      devLogger.error('[grades-v2] Error en POST /bulk:', error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error en captura masiva'
      });
    }
  }
);

module.exports = router;
