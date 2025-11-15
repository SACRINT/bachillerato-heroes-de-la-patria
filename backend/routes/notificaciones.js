/**
 * 🔔 API CRUD PARA NOTIFICACIONES DE CONVOCATORIAS - PostgreSQL
 * Gestión de suscripciones a notificaciones
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// =====================================================
// POST /api/notificaciones - Crear nueva suscripción
// =====================================================
router.post('/', [
    body('email').isEmail().withMessage('Email inválido'),
    body('nombre').optional().trim(),
    body('tipo_interes').optional().trim()
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // Aceptar tanto 'subject' como 'tipo_interes' (compatibilidad con formularios)
    const { nombre, name, email, tipo_interes, subject } = req.body;
    const finalNombre = nombre || name || 'Usuario';
    const finalTipoInteres = tipo_interes || subject || 'Todas las convocatorias';

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // Verificar si el email ya existe
        const checkQuery = 'SELECT id, status FROM notificaciones_convocatorias WHERE email = $1';
        const existingResult = await pool.query(checkQuery, [email]);

        if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];

            // Si ya está activo
            if (existing.status === 'activo') {
                return res.json({
                    success: true,
                    message: 'Ya estás suscrito a las notificaciones de convocatorias',
                    data: { id: existing.id, already_subscribed: true }
                });
            }

            // Reactivar suscripción inactiva
            const updateQuery = `
                UPDATE notificaciones_convocatorias
                SET
                    nombre = COALESCE($1, nombre),
                    tipo_interes = COALESCE($2, tipo_interes),
                    status = 'activo',
                    fecha_suscripcion = NOW(),
                    fecha_baja = NULL,
                    ip_address = $3,
                    user_agent = $4
                WHERE email = $5
                RETURNING *;
            `;

            const result = await pool.query(updateQuery, [
                finalNombre,
                finalTipoInteres,
                ip_address,
                user_agent,
                email
            ]);

            debugLog.log('NOTIFICACIONES', '✅ Suscripción reactivada:', result.rows[0].id);

            return res.json({
                success: true,
                message: 'Tu suscripción ha sido reactivada exitosamente. Recibirás notificaciones de convocatorias.',
                data: {
                    id: result.rows[0].id,
                    reactivated: true
                }
            });
        }

        // Insertar nueva suscripción
        const insertQuery = `
            INSERT INTO notificaciones_convocatorias (
                nombre, email, tipo_interes, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            finalNombre,
            email,
            finalTipoInteres,
            ip_address,
            user_agent
        ]);

        debugLog.log('NOTIFICACIONES', '✅ Nueva suscripción creada:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Te has suscrito exitosamente. Recibirás notificaciones sobre nuevas convocatorias.',
            data: {
                id: result.rows[0].id,
                fecha: result.rows[0].fecha_suscripcion
            }
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al crear suscripción:', sanitizeError(error, 'notificaciones'));

        // Error de constraint (email duplicado)
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                error: 'Este email ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al procesar tu suscripción. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/notificaciones - Listar todas las suscripciones
// =====================================================
router.get('/', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM notificaciones_convocatorias';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_suscripcion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = status ?
            'SELECT COUNT(*) FROM notificaciones_convocatorias WHERE status = $1' :
            'SELECT COUNT(*) FROM notificaciones_convocatorias';
        const countParams = status ? [status] : [];
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al obtener suscripciones:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/notificaciones/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'activo') as activos,
                COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos,
                COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
                COUNT(*) FILTER (WHERE DATE(fecha_suscripcion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_suscripcion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana,
                COUNT(*) FILTER (WHERE verificado = true) as verificados
            FROM notificaciones_convocatorias;
        `;

        const result = await pool.query(query);

        // Estadísticas por tipo de interés
        const tipoQuery = `
            SELECT tipo_interes, COUNT(*) as cantidad
            FROM notificaciones_convocatorias
            WHERE tipo_interes IS NOT NULL AND status = 'activo'
            GROUP BY tipo_interes
            ORDER BY cantidad DESC;
        `;

        const tipoResult = await pool.query(tipoQuery);
        const byTipo = tipoResult.rows.reduce((acc, row) => {
            acc[row.tipo_interes] = parseInt(row.cantidad);
            return acc;
        }, {});

        const stats = {
            ...result.rows[0],
            byTipo
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al obtener estadísticas:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/notificaciones/:id - Obtener una suscripción
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM notificaciones_convocatorias WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al obtener suscripción:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la suscripción'
        });
    }
});

// =====================================================
// PUT /api/notificaciones/:id - Actualizar suscripción
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo_interes, status } = req.body;

    try {
        const query = `
            UPDATE notificaciones_convocatorias
            SET
                nombre = COALESCE($1, nombre),
                tipo_interes = COALESCE($2, tipo_interes),
                status = COALESCE($3, status),
                fecha_baja = CASE WHEN $3 IN ('inactivo', 'cancelado') THEN NOW() ELSE fecha_baja END
            WHERE id = $4
            RETURNING *;
        `;

        const result = await pool.query(query, [nombre, tipo_interes, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Suscripción actualizada correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al actualizar suscripción:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la suscripción'
        });
    }
});

// =====================================================
// DELETE /api/notificaciones/:id - Cancelar suscripción
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Marcar como cancelado en lugar de eliminar
        const result = await pool.query(`
            UPDATE notificaciones_convocatorias
            SET status = 'cancelado', fecha_baja = NOW()
            WHERE id = $1
            RETURNING id, email
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Suscripción cancelada correctamente'
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al cancelar suscripción:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al cancelar la suscripción'
        });
    }
});

// =====================================================
// POST /api/notificaciones/unsubscribe - Darse de baja por email
// =====================================================
router.post('/unsubscribe', [
    body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email } = req.body;

    try {
        const result = await pool.query(`
            UPDATE notificaciones_convocatorias
            SET status = 'cancelado', fecha_baja = NOW()
            WHERE email = $1 AND status = 'activo'
            RETURNING id
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontró una suscripción activa con este email'
            });
        }

        res.json({
            success: true,
            message: 'Te has dado de baja exitosamente. Ya no recibirás notificaciones.'
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al dar de baja:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud'
        });
    }
});

module.exports = router;
