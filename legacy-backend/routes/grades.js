/**
 * 📊 SISTEMA COMPLETO DE CALIFICACIONES - FASE B
 * API REST para captura, consulta y gestión de calificaciones
 * Completamente funcional con validaciones y reportes
 */

const express = require('express');
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
                WHERE estudiante_id = ? AND materia_id = ? AND parcial = ? AND ciclo_escolar = ?
            `, [estudiante_id, materia_id, parcial, ciclo_escolar]);

            if (existingGrade.length > 0) {
                // Actualizar calificación existente
                await executeQuery(`
                    UPDATE calificaciones
                    SET calificacion = ?, observaciones = ?, docente_id = ?, fecha_captura = NOW()
                    WHERE estudiante_id = ? AND materia_id = ? AND parcial = ? AND ciclo_escolar = ?
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
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [estudiante_id, materia_id, parcial, calificacion, ciclo_escolar, docente_id, observaciones]);

                res.json({
                    success: true,
                    message: 'Calificación capturada correctamente',
                    action: 'created',
                    id: result.insertId
                });
            }

            // Actualizar promedio del estudiante
            await updateStudentAverage(estudiante_id, ciclo_escolar);

        } catch (error) {
            console.error('Error capturando calificación:', error);
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
                        WHERE estudiante_id = ? AND materia_id = ? AND parcial = ? AND ciclo_escolar = ?
                    `, [cal.estudiante_id, cal.materia_id, cal.parcial, cal.ciclo_escolar]);

                    if (existing.length > 0) {
                        // Actualizar
                        await executeQuery(`
                            UPDATE calificaciones
                            SET calificacion = ?, observaciones = ?, docente_id = ?, fecha_captura = NOW()
                            WHERE estudiante_id = ? AND materia_id = ? AND parcial = ? AND ciclo_escolar = ?
                        `, [cal.calificacion, cal.observaciones || '', docente_id,
                            cal.estudiante_id, cal.materia_id, cal.parcial, cal.ciclo_escolar]);

                        results.push({ ...cal, action: 'updated', success: true });
                    } else {
                        // Crear
                        const result = await executeQuery(`
                            INSERT INTO calificaciones (estudiante_id, materia_id, parcial, calificacion, ciclo_escolar, docente_id, observaciones)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [cal.estudiante_id, cal.materia_id, cal.parcial, cal.calificacion,
                            cal.ciclo_escolar, docente_id, cal.observaciones || '']);

                        results.push({ ...cal, action: 'created', success: true, id: result.insertId });
                    }

                    // Actualizar promedio del estudiante
                    await updateStudentAverage(cal.estudiante_id, cal.ciclo_escolar);

                } catch (error) {
                    console.error(`Error procesando calificación:`, error);
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
            console.error('Error en captura masiva:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno en captura masiva'
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
            let whereClause = 'WHERE c.estudiante_id = ?';
            let params = [id];

            if (ciclo_escolar) {
                whereClause += ' AND c.ciclo_escolar = ?';
                params.push(ciclo_escolar);
            }

            if (parcial) {
                whereClause += ' AND c.parcial = ?';
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
                WHERE e.id = ?
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
            console.error('Error consultando calificaciones:', error);
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

            let whereClause = 'WHERE e.grupo = ?';
            let params = [grupo];

            if (materia_id) {
                whereClause += ' AND c.materia_id = ?';
                params.push(materia_id);
            }

            if (parcial) {
                whereClause += ' AND c.parcial = ?';
                params.push(parcial);
            }

            if (ciclo_escolar) {
                whereClause += ' AND c.ciclo_escolar = ?';
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
            console.error('Error consultando calificaciones por grupo:', error);
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

            let whereClause = 'WHERE c.ciclo_escolar = ?';
            let params = [ciclo_escolar];

            if (semestre) {
                whereClause += ' AND e.semestre = ?';
                params.push(semestre);
            }

            if (grupo) {
                whereClause += ' AND e.grupo = ?';
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
            console.error('Error generando reporte semestral:', error);
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
            WHERE estudiante_id = ? AND ciclo_escolar = ?
        `, [estudiante_id, ciclo_escolar]);

        if (promedio[0] && promedio[0].promedio) {
            await executeQuery(`
                UPDATE estudiantes
                SET promedio_general = ?
                WHERE id = ?
            `, [Math.round(promedio[0].promedio * 100) / 100, estudiante_id]);
        }
    } catch (error) {
        console.error('Error actualizando promedio:', error);
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