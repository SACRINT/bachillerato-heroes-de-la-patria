/**
 * 📝 API CRUD PARA INSCRIPCIONES A ACTIVIDADES - PostgreSQL
 * Gestión de solicitudes de inscripción a actividades extracurriculares
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// =====================================================
// POST /api/inscriptions/register - Crear nueva inscripción
// =====================================================
router.post('/register', [
    body('activityId').trim().notEmpty().withMessage('ID de actividad requerido'),
    body('activityName').trim().notEmpty().withMessage('Nombre de actividad requerido'),
    body('studentName').trim().notEmpty().withMessage('Nombre del estudiante requerido'),
    body('studentEmail').isEmail().withMessage('Email inválido'),
    body('studentId').optional().trim(),
    body('studentGroup').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('additionalInfo').optional().trim()
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const {
        activityId,
        activityName,
        studentId,
        studentName,
        studentEmail,
        studentGroup,
        emergencyContact,
        additionalInfo
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // Verificar si ya existe una inscripción para esta actividad
        const checkQuery = `
            SELECT id, status
            FROM inscripciones_actividades
            WHERE student_email = $1 AND activity_id = $2
        `;
        const existingResult = await pool.query(checkQuery, [studentEmail, activityId]);

        if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];

            if (existing.status === 'pending') {
                return res.json({
                    success: true,
                    message: 'Ya tienes una solicitud pendiente para esta actividad. Te notificaremos cuando sea revisada.',
                    data: { id: existing.id, already_pending: true }
                });
            }

            if (existing.status === 'approved') {
                return res.json({
                    success: true,
                    message: 'Ya estás inscrito en esta actividad.',
                    data: { id: existing.id, already_approved: true }
                });
            }

            // Si fue rechazada o cancelada, permitir nueva inscripción actualizando el registro
            if (existing.status === 'rejected' || existing.status === 'cancelled') {
                const updateQuery = `
                    UPDATE inscripciones_actividades
                    SET
                        student_name = $1,
                        student_id = $2,
                        student_group = $3,
                        emergency_contact = $4,
                        additional_info = $5,
                        status = 'pending',
                        fecha_solicitud = NOW(),
                        fecha_procesado = NULL,
                        processed_by = NULL,
                        admin_notes = NULL,
                        ip_address = $6,
                        user_agent = $7
                    WHERE id = $8
                    RETURNING *;
                `;

                const result = await pool.query(updateQuery, [
                    studentName,
                    studentId || 'Externo',
                    studentGroup || 'No especificado',
                    emergencyContact || 'No proporcionado',
                    additionalInfo || '',
                    ip_address,
                    user_agent,
                    existing.id
                ]);

                devLogger.log('✅ Inscripción actualizada (reintento):', result.rows[0].id);

                return res.json({
                    success: true,
                    message: 'Tu nueva solicitud de inscripción ha sido enviada. Recibirás un email cuando sea revisada.',
                    data: {
                        id: result.rows[0].id,
                        resubmitted: true
                    }
                });
            }
        }

        // Insertar nueva inscripción
        const insertQuery = `
            INSERT INTO inscripciones_actividades (
                activity_id, activity_name, student_id, student_name,
                student_email, student_group, emergency_contact,
                additional_info, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            activityId,
            activityName,
            studentId || 'Externo',
            studentName,
            studentEmail,
            studentGroup || 'No especificado',
            emergencyContact || 'No proporcionado',
            additionalInfo || '',
            ip_address,
            user_agent
        ]);

        devLogger.log('✅ Nueva inscripción creada:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: '¡Solicitud enviada exitosamente! Tu inscripción será revisada por un administrador. Recibirás un email cuando sea aprobada o rechazada.',
            data: {
                id: result.rows[0].id,
                activityName: result.rows[0].activity_name,
                fecha: result.rows[0].fecha_solicitud
            }
        });

    } catch (error) {
        devLogger.error('❌ Error al crear inscripción:', error);

        // Error de constraint (email + actividad duplicado)
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una solicitud para esta actividad con este email'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al procesar tu solicitud. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// POST /api/inscriptions/create - Alias para compatibilidad
// =====================================================
router.post('/create', async (req, res) => {
    devLogger.log('📝 Redirigiendo /create a /register');
    // Redirigir internamente a /register
    req.url = '/register';
    return router.handle(req, res);
});

// =====================================================
// GET /api/inscriptions - Listar todas las inscripciones (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    const { status, activity_id, student_email, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM inscripciones_actividades WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (activity_id) {
            paramCount++;
            query += ` AND activity_id = $${paramCount}`;
            params.push(activity_id);
        }

        if (student_email) {
            paramCount++;
            query += ` AND student_email ILIKE $${paramCount}`;
            params.push(`%${student_email}%`);
        }

        query += ` ORDER BY fecha_solicitud DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM inscripciones_actividades WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (activity_id) {
            countParamCount++;
            countQuery += ` AND activity_id = $${countParamCount}`;
            countParams.push(activity_id);
        }

        if (student_email) {
            countParamCount++;
            countQuery += ` AND student_email ILIKE $${countParamCount}`;
            countParams.push(`%${student_email}%`);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0]?.count || 0),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener inscripciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/inscriptions/list - Alias para compatibilidad
// =====================================================
router.get('/list', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM inscripciones_actividades
            ORDER BY fecha_solicitud DESC
        `);

        res.json({
            success: true,
            inscripciones: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        devLogger.error('❌ Error al listar inscripciones:', error);
        res.json({
            success: true,
            inscripciones: [],
            total: 0,
            message: 'Error al obtener inscripciones'
        });
    }
});

// =====================================================
// GET /api/inscriptions/stats - Estadísticas (ADMIN)
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
                COUNT(*) FILTER (WHERE status = 'approved') as aprobadas,
                COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas,
                COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas,
                COUNT(*) FILTER (WHERE DATE(fecha_solicitud) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_solicitud) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana
            FROM inscripciones_actividades;
        `;

        const result = await pool.query(query);

        // Estadísticas por actividad
        const activityQuery = `
            SELECT activity_name, COUNT(*) as cantidad, status
            FROM inscripciones_actividades
            GROUP BY activity_name, status
            ORDER BY cantidad DESC;
        `;

        const activityResult = await pool.query(activityQuery);

        const stats = {
            ...result.rows[0],
            byActivity: activityResult.rows
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/inscriptions/:id - Obtener una inscripción
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM inscripciones_actividades WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inscripción no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener inscripción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la inscripción'
        });
    }
});

// =====================================================
// PUT /api/inscriptions/:id - Actualizar inscripción (ADMIN)
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, processed_by } = req.body;

    try {
        const query = `
            UPDATE inscripciones_actividades
            SET
                status = COALESCE($1, status),
                admin_notes = COALESCE($2, admin_notes),
                processed_by = COALESCE($3, processed_by),
                fecha_procesado = CASE WHEN $1 IN ('approved', 'rejected') THEN NOW() ELSE fecha_procesado END
            WHERE id = $4
            RETURNING *;
        `;

        const result = await pool.query(query, [status, admin_notes, processed_by, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inscripción no encontrada'
            });
        }

        devLogger.log(`✅ Inscripción ${id} actualizada: ${status}`);

        res.json({
            success: true,
            message: 'Inscripción actualizada correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al actualizar inscripción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la inscripción'
        });
    }
});

// =====================================================
// DELETE /api/inscriptions/:id - Eliminar inscripción (ADMIN)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Marcar como cancelada en lugar de eliminar
        const result = await pool.query(`
            UPDATE inscripciones_actividades
            SET status = 'cancelled', fecha_procesado = NOW()
            WHERE id = $1
            RETURNING id, activity_name
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inscripción no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Inscripción cancelada correctamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al cancelar inscripción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cancelar la inscripción'
        });
    }
});

module.exports = router;
