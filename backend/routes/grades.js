/**
 * 📊 SISTEMA COMPLETO DE CALIFICACIONES - FASE B
 * API REST para captura, consulta y gestión de calificaciones
 * Completamente funcional con validaciones y reportes
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { body, query, param, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// ============================================
// CAPTURA DE CALIFICACIONES
// ============================================

/**
 * POST /api/grades - Capturar calificación individual
 */
router.post('/',
    authenticateToken,
    [
        body('estudiante_id').isInt({ min: 1 }).withMessage('ID de estudiante requerido'),
        body('materia_id').isInt({ min: 1 }).withMessage('ID de materia requerido'),
        body('parcial').isInt({ min: 1, max: 3 }).withMessage('Parcial debe ser 1, 2 o 3'),
        body('calificacion').isFloat({ min: 0, max: 10 }).withMessage('Calificación debe estar entre 0 y 10'),
        body('ciclo_escolar').matches(/^\d{4}-\d{4}$/).withMessage('Formato de ciclo: YYYY-YYYY'),
        body('observaciones').optional().isString().withMessage('Observaciones debe ser texto')
    ],
    async (req, res) => {
        try {
            // Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { estudiante_id, materia_id, parcial, calificacion, ciclo_escolar, observaciones } = req.body;
            const docente_id = req.user.rol === 'docente' ? req.user.id : null;

            // Verificar si ya existe la calificación
            const existingGrade = await executeQuery(`
                SELECT id FROM calificaciones
                WHERE estudiante_id = $1 AND materia_id = $2 AND parcial = $3 AND ciclo_escolar = $4
            `, [estudiante_id, materia_id, parcial, ciclo_escolar]);

            if (existingGrade.length > 0) {
                // Actualizar calificación existente
                await executeQuery(`
                    UPDATE calificaciones
                    SET calificacion = $1, observaciones = $2, docente_id = $3, fecha_captura = CURRENT_TIMESTAMP
                    WHERE estudiante_id = $4 AND materia_id = $5 AND parcial = $6 AND ciclo_escolar = $7
                `, [calificacion, observaciones, docente_id, estudiante_id, materia_id, parcial, ciclo_escolar]);

                res.json({
                    success: true,
                    message: 'Calificación actualizada correctamente',
                    action: 'updated'
                });
            } else {
                // Crear nueva calificación
                const result = await executeQuery(`
                    INSERT INTO calificaciones (estudiante_id, materia_id, parcial, calificacion, ciclo_escolar, docente_id, observaciones)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `, [estudiante_id, materia_id, parcial, calificacion, ciclo_escolar, docente_id, observaciones]);

                res.json({
                    success: true,
                    message: 'Calificación capturada correctamente',
                    action: 'created',
                    id: result[0].id
                });
            }

            // Actualizar promedio del estudiante
            await updateStudentAverage(estudiante_id, ciclo_escolar);

        } catch (error) {
            debugLog.error('GRADES', 'Error capturando calificación:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

/**
 * POST /api/grades/batch - Captura masiva de calificaciones
 */
router.post('/batch',
    authenticateToken,
    [
        body('calificaciones').isArray({ min: 1 }).withMessage('Se requiere array de calificaciones'),
        body('calificaciones.*.estudiante_id').isInt({ min: 1 }),
        body('calificaciones.*.materia_id').isInt({ min: 1 }),
        body('calificaciones.*.parcial').isInt({ min: 1, max: 3 }),
        body('calificaciones.*.calificacion').isFloat({ min: 0, max: 10 }),
        body('calificaciones.*.ciclo_escolar').matches(/^\d{4}-\d{4}$/)
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos en captura masiva',
                    errors: errors.array()
                });
            }

            const { calificaciones } = req.body;
            const docente_id = req.user.rol === 'docente' ? req.user.id : null;
            const results = [];

            // Procesar cada calificación
            for (const cal of calificaciones) {
                try {
                    // Verificar si existe
                    const existing = await executeQuery(`
                        SELECT id FROM calificaciones
                        WHERE estudiante_id = $1 AND materia_id = $2 AND parcial = $3 AND ciclo_escolar = $4
                    `, [cal.estudiante_id, cal.materia_id, cal.parcial, cal.ciclo_escolar]);

                    if (existing.length > 0) {
                        // Actualizar
                        await executeQuery(`
                            UPDATE calificaciones
                            SET calificacion = $1, observaciones = $2, docente_id = $3, fecha_captura = CURRENT_TIMESTAMP
                            WHERE estudiante_id = $4 AND materia_id = $5 AND parcial = $6 AND ciclo_escolar = $7
                        `, [cal.calificacion, cal.observaciones || '', docente_id,
                            cal.estudiante_id, cal.materia_id, cal.parcial, cal.ciclo_escolar]);

                        results.push({ ...cal, action: 'updated', success: true });
                    } else {
                        // Crear
                        const result = await executeQuery(`
                            INSERT INTO calificaciones (estudiante_id, materia_id, parcial, calificacion, ciclo_escolar, docente_id, observaciones)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            RETURNING id
                        `, [cal.estudiante_id, cal.materia_id, cal.parcial, cal.calificacion,
                            cal.ciclo_escolar, docente_id, cal.observaciones || '']);

                        results.push({ ...cal, action: 'created', success: true, id: result[0].id });
                    }

                    // Actualizar promedio del estudiante
                    await updateStudentAverage(cal.estudiante_id, cal.ciclo_escolar);

                } catch (error) {
                    debugLog.error('GRADES', `Error procesando calificación:`, error);
                    results.push({ ...cal, action: 'error', success: false, error: error.message });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const errorCount = results.length - successCount;

            res.json({
                success: true,
                message: `Captura masiva completada: ${successCount} exitosas, ${errorCount} errores`,
                results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    errors: errorCount
                }
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error en captura masiva:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno en captura masiva'
            });
        }
    }
);

// ============================================
// OPERACIONES CRUD INDIVIDUALES
// ============================================

/**
 * GET /api/grades/:id - Obtener una calificación específica por ID
 */
router.get('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('ID de calificación inválido')
    ],
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

            const { id } = req.params;

            const calificacion = await executeQuery(`
                SELECT
                    c.id,
                    c.estudiante_id,
                    c.materia_id,
                    c.docente_id,
                    c.parcial,
                    c.calificacion,
                    c.ciclo_escolar,
                    c.fecha_captura,
                    c.observaciones,
                    c.tipo_evaluacion,
                    c.is_final,
                    m.nombre as materia_nombre,
                    m.clave as materia_clave,
                    e.matricula as estudiante_matricula,
                    ue.nombre as estudiante_nombre,
                    ue.apellido_paterno as estudiante_apellido,
                    ud.nombre as docente_nombre,
                    ud.apellido_paterno as docente_apellido
                FROM calificaciones c
                JOIN materias m ON c.materia_id = m.id
                JOIN estudiantes e ON c.estudiante_id = e.id
                JOIN usuarios ue ON e.usuario_id = ue.id
                LEFT JOIN docentes d ON c.docente_id = d.id
                LEFT JOIN usuarios ud ON d.usuario_id = ud.id
                WHERE c.id = $1
            `, [id]);

            if (calificacion.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Calificación no encontrada'
                });
            }

            res.json({
                success: true,
                data: calificacion[0]
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error obteniendo calificación:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

/**
 * PUT /api/grades/:id - Actualizar una calificación específica
 */
router.put('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('ID de calificación inválido'),
        body('calificacion').optional().isFloat({ min: 0, max: 10 }).withMessage('Calificación debe estar entre 0 y 10'),
        body('observaciones').optional().isString(),
        body('tipo_evaluacion').optional().isIn(['ordinario', 'extraordinario', 'titulo_suficiencia']),
        body('is_final').optional().isBoolean()
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

            const { id } = req.params;
            const { calificacion, observaciones, tipo_evaluacion, is_final } = req.body;

            // Verificar que la calificación existe
            const existing = await executeQuery(`
                SELECT * FROM calificaciones WHERE id = $1
            `, [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Calificación no encontrada'
                });
            }

            const oldGrade = existing[0];

            // Construir query de actualización dinámico
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (calificacion !== undefined) {
                updates.push(`calificacion = $${paramIndex++}`);
                values.push(calificacion);
            }
            if (observaciones !== undefined) {
                updates.push(`observaciones = $${paramIndex++}`);
                values.push(observaciones);
            }
            if (tipo_evaluacion !== undefined) {
                updates.push(`tipo_evaluacion = $${paramIndex++}`);
                values.push(tipo_evaluacion);
            }
            if (is_final !== undefined) {
                updates.push(`is_final = $${paramIndex++}`);
                values.push(is_final);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay campos para actualizar'
                });
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);

            await executeQuery(`
                UPDATE calificaciones
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
            `, values);

            // Registrar en historial si cambió la calificación
            if (calificacion !== undefined && calificacion !== oldGrade.calificacion) {
                await executeQuery(`
                    INSERT INTO calificaciones_historial
                    (calificacion_id, calificacion_anterior, calificacion_nueva, modificado_por, motivo_cambio)
                    VALUES ($1, $2, $3, $4, $5)
                `, [id, oldGrade.calificacion, calificacion, req.user.id, 'Actualización vía API']);

                // Actualizar promedio del estudiante
                await updateStudentAverage(oldGrade.estudiante_id, oldGrade.ciclo_escolar);
            }

            res.json({
                success: true,
                message: 'Calificación actualizada correctamente'
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error actualizando calificación:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

/**
 * DELETE /api/grades/:id - Eliminar una calificación
 */
router.delete('/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('ID de calificación inválido')
    ],
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

            const { id } = req.params;

            // Verificar que existe y obtener datos para actualizar promedio
            const existing = await executeQuery(`
                SELECT estudiante_id, ciclo_escolar, calificacion FROM calificaciones WHERE id = $1
            `, [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Calificación no encontrada'
                });
            }

            const { estudiante_id, ciclo_escolar, calificacion } = existing[0];

            // Registrar eliminación en historial
            await executeQuery(`
                INSERT INTO calificaciones_historial
                (calificacion_id, calificacion_anterior, calificacion_nueva, modificado_por, motivo_cambio)
                VALUES ($1, $2, NULL, $3, 'Eliminación vía API')
            `, [id, calificacion, req.user.id]);

            // Eliminar la calificación
            await executeQuery(`
                DELETE FROM calificaciones WHERE id = $1
            `, [id]);

            // Actualizar promedio del estudiante
            await updateStudentAverage(estudiante_id, ciclo_escolar);

            res.json({
                success: true,
                message: 'Calificación eliminada correctamente'
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error eliminando calificación:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

// ============================================
// CONSULTA DE CALIFICACIONES
// ============================================

/**
 * GET /api/grades/student/:id - Obtener calificaciones de un estudiante
 */
router.get('/student/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('ID de estudiante inválido'),
        query('ciclo_escolar').optional().matches(/^\d{4}-\d{4}$/).withMessage('Formato de ciclo: YYYY-YYYY'),
        query('parcial').optional().isInt({ min: 1, max: 3 }).withMessage('Parcial debe ser 1, 2 o 3')
    ],
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

            const { id } = req.params;
            const { ciclo_escolar, parcial } = req.query;

            // Construir query dinámico
            let whereClause = 'WHERE c.estudiante_id = $1';
            let params = [id];

            if (ciclo_escolar) {
                whereClause += ' AND c.ciclo_escolar = $' + (params.length + 1);
                params.push(ciclo_escolar);
            }

            if (parcial) {
                whereClause += ' AND c.parcial = $' + (params.length + 1);
                params.push(parcial);
            }

            const calificaciones = await executeQuery(`
                SELECT
                    c.id,
                    c.parcial,
                    c.calificacion,
                    c.ciclo_escolar,
                    c.fecha_captura,
                    c.observaciones,
                    m.nombre as materia_nombre,
                    m.clave as materia_clave,
                    m.creditos,
                    u.nombre as docente_nombre,
                    u.apellido as docente_apellido
                FROM calificaciones c
                JOIN materias m ON c.materia_id = m.id
                LEFT JOIN docentes d ON c.docente_id = d.id
                LEFT JOIN usuarios u ON d.usuario_id = u.id
                ${whereClause}
                ORDER BY c.ciclo_escolar DESC, m.nombre, c.parcial
            `, params);

            // Obtener información del estudiante
            const estudiante = await executeQuery(`
                SELECT
                    e.id,
                    e.matricula,
                    u.nombre,
                    u.apellido,
                    e.grupo,
                    e.semestre,
                    e.promedio_general
                FROM estudiantes e
                JOIN usuarios u ON e.usuario_id = u.id
                WHERE e.id = $1
            `, [id]);

            if (estudiante.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }

            // Calcular estadísticas
            const stats = calculateGradeStats(calificaciones);

            res.json({
                success: true,
                data: {
                    estudiante: estudiante[0],
                    calificaciones,
                    estadisticas: stats,
                    total_calificaciones: calificaciones.length
                }
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error consultando calificaciones:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

/**
 * GET /api/grades/group/:grupo - Obtener calificaciones por grupo
 */
router.get('/group/:grupo',
    authenticateToken,
    [
        param('grupo').isString().withMessage('Grupo requerido'),
        query('materia_id').optional().isInt({ min: 1 }),
        query('parcial').optional().isInt({ min: 1, max: 3 }),
        query('ciclo_escolar').optional().matches(/^\d{4}-\d{4}$/)
    ],
    async (req, res) => {
        try {
            const { grupo } = req.params;
            const { materia_id, parcial, ciclo_escolar } = req.query;

            let whereClause = 'WHERE e.grupo = $1';
            let params = [grupo];

            if (materia_id) {
                whereClause += ' AND c.materia_id = $' + (params.length + 1);
                params.push(materia_id);
            }

            if (parcial) {
                whereClause += ' AND c.parcial = $' + (params.length + 1);
                params.push(parcial);
            }

            if (ciclo_escolar) {
                whereClause += ' AND c.ciclo_escolar = $' + (params.length + 1);
                params.push(ciclo_escolar);
            }

            const calificaciones = await executeQuery(`
                SELECT
                    e.matricula,
                    u.nombre as estudiante_nombre,
                    u.apellido as estudiante_apellido,
                    c.parcial,
                    c.calificacion,
                    c.ciclo_escolar,
                    m.nombre as materia_nombre,
                    m.clave as materia_clave
                FROM estudiantes e
                JOIN usuarios u ON e.usuario_id = u.id
                LEFT JOIN calificaciones c ON e.id = c.estudiante_id
                LEFT JOIN materias m ON c.materia_id = m.id
                ${whereClause}
                ORDER BY u.apellido, u.nombre, m.nombre, c.parcial
            `, params);

            // Estadísticas del grupo
            const groupStats = {
                total_estudiantes: new Set(calificaciones.map(c => c.matricula)).size,
                promedio_grupo: calificaciones.length > 0 ?
                    calificaciones.reduce((sum, c) => sum + (c.calificacion || 0), 0) / calificaciones.filter(c => c.calificacion).length : 0,
                calificaciones_capturadas: calificaciones.filter(c => c.calificacion).length
            };

            res.json({
                success: true,
                data: {
                    grupo,
                    calificaciones,
                    estadisticas: groupStats
                }
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error consultando calificaciones por grupo:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

// ============================================
// REPORTES DE CALIFICACIONES
// ============================================

/**
 * GET /api/grades/report/semester - Reporte semestral
 */
router.get('/report/semester',
    authenticateToken,
    [
        query('ciclo_escolar').isString().withMessage('Ciclo escolar requerido'),
        query('semestre').optional().isInt({ min: 1, max: 6 }),
        query('grupo').optional().isString()
    ],
    async (req, res) => {
        try {
            const { ciclo_escolar, semestre, grupo } = req.query;

            let whereClause = 'WHERE c.ciclo_escolar = $1';
            let params = [ciclo_escolar];

            if (semestre) {
                whereClause += ' AND e.semestre = $' + (params.length + 1);
                params.push(semestre);
            }

            if (grupo) {
                whereClause += ' AND e.grupo = $' + (params.length + 1);
                params.push(grupo);
            }

            const reporte = await executeQuery(`
                SELECT
                    e.matricula,
                    u.nombre as estudiante_nombre,
                    u.apellido as estudiante_apellido,
                    e.grupo,
                    e.semestre,
                    m.nombre as materia_nombre,
                    AVG(c.calificacion) as promedio_materia,
                    COUNT(c.id) as calificaciones_capturadas,
                    MIN(c.calificacion) as calificacion_minima,
                    MAX(c.calificacion) as calificacion_maxima
                FROM estudiantes e
                JOIN usuarios u ON e.usuario_id = u.id
                LEFT JOIN calificaciones c ON e.id = c.estudiante_id
                LEFT JOIN materias m ON c.materia_id = m.id
                ${whereClause}
                GROUP BY e.id, m.id
                ORDER BY e.grupo, u.apellido, u.nombre, m.nombre
            `, params);

            res.json({
                success: true,
                data: {
                    ciclo_escolar,
                    filtros: { semestre, grupo },
                    reporte,
                    total_registros: reporte.length
                }
            });

        } catch (error) {
            debugLog.error('GRADES', 'Error generando reporte semestral:', sanitizeError(error, 'grades'));
            res.status(500).json({
                success: false,
                message: 'Error generando reporte'
            });
        }
    }
);

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Actualizar promedio general del estudiante
 */
async function updateStudentAverage(estudiante_id, ciclo_escolar) {
    try {
        const promedio = await executeQuery(`
            SELECT AVG(calificacion) as promedio
            FROM calificaciones
            WHERE estudiante_id = $1 AND ciclo_escolar = $2
        `, [estudiante_id, ciclo_escolar]);

        if (promedio[0] && promedio[0].promedio) {
            await executeQuery(`
                UPDATE estudiantes
                SET promedio_general = $1
                WHERE id = $2
            `, [Math.round(promedio[0].promedio * 100) / 100, estudiante_id]);
        }
    } catch (error) {
        debugLog.error('GRADES', 'Error actualizando promedio:', sanitizeError(error, 'grades'));
    }
}

/**
 * Calcular estadísticas de calificaciones
 */
function calculateGradeStats(calificaciones) {
    if (!calificaciones || calificaciones.length === 0) {
        return {
            promedio: 0,
            total: 0,
            aprobadas: 0,
            reprobadas: 0,
            calificacion_maxima: 0,
            calificacion_minima: 0
        };
    }

    const valores = calificaciones.map(c => c.calificacion).filter(c => c !== null);
    const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
    const aprobadas = valores.filter(val => val >= 6).length;
    const reprobadas = valores.filter(val => val < 6).length;

    return {
        promedio: Math.round(promedio * 100) / 100,
        total: valores.length,
        aprobadas,
        reprobadas,
        calificacion_maxima: Math.max(...valores),
        calificacion_minima: Math.min(...valores),
        porcentaje_aprobacion: Math.round((aprobadas / valores.length) * 100)
    };
}

module.exports = router;