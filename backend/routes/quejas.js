const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// =====================================================
// POST /api/quejas - Crear nueva queja/sugerencia
// =====================================================
router.post('/', [
    body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('subject').isIn(['queja', 'sugerencia', 'felicitacion', 'otro']).withMessage('Tipo inválido'),
    body('message').trim().notEmpty().withMessage('Mensaje es requerido')
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { nombre, email, subject, message, form_type } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        const query = `
            INSERT INTO quejas (nombre, email, subject, message, form_type, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const result = await pool.query(query, [
            nombre,
            email,
            subject,
            message,
            form_type || 'quejas',
            ip_address,
            user_agent
        ]);

        devLogger.log('✅ Queja/sugerencia guardada:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Tu mensaje ha sido recibido. Te responderemos pronto.',
            data: {
                id: result.rows[0].id,
                fecha: result.rows[0].fecha_creacion
            }
        });

    } catch (error) {
        devLogger.error('❌ Error al guardar queja:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu mensaje. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/quejas - Listar todas (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM quejas';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ' ORDER BY fecha_creacion DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener quejas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/quejas/stats - Estadísticas (ADMIN)
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE status = 'en_revision') as en_revision,
                COUNT(*) FILTER (WHERE status = 'respondida') as respondidas,
                COUNT(*) FILTER (WHERE subject = 'queja') as quejas,
                COUNT(*) FILTER (WHERE subject = 'sugerencia') as sugerencias,
                COUNT(*) FILTER (WHERE subject = 'felicitacion') as felicitaciones,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana
            FROM quejas;
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0]
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
// GET /api/quejas/:id - Obtener una queja específica
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM quejas WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Queja no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener queja:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la queja'
        });
    }
});

// =====================================================
// PUT /api/quejas/:id - Actualizar queja (ADMIN)
// =====================================================
router.put('/:id', [
    body('status').optional().isIn(['pendiente', 'en_revision', 'respondida', 'cerrada']),
    body('respuesta').optional().trim(),
    body('respondido_por').optional().trim()
], async (req, res) => {
    const { id } = req.params;
    const { status, respuesta, respondido_por } = req.body;

    try {
        const query = `
            UPDATE quejas
            SET
                status = COALESCE($1, status),
                respuesta = COALESCE($2, respuesta),
                respondido_por = COALESCE($3, respondido_por),
                fecha_respuesta = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE fecha_respuesta END,
                fecha_actualizacion = NOW()
            WHERE id = $4
            RETURNING *;
        `;

        const result = await pool.query(query, [status, respuesta, respondido_por, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Queja no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Queja actualizada correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al actualizar queja:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la queja'
        });
    }
});

// =====================================================
// DELETE /api/quejas/:id - Eliminar queja (ADMIN)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM quejas WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Queja no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Queja eliminada correctamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al eliminar queja:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la queja'
        });
    }
});

module.exports = router;
