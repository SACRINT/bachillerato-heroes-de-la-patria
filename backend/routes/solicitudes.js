/**
 * 📄 API CRUD PARA SOLICITUDES DE DOCUMENTOS - PostgreSQL
 * Gestión de solicitudes de documentos oficiales
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// =====================================================
// POST /api/solicitudes - Crear nueva solicitud
// =====================================================
router.post('/', [
    body('nombre').optional().trim(),
    body('requesterName').optional().trim(),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('requesterEmail').optional().isEmail().withMessage('Email inválido'),
    body('tipo_usuario').optional().trim(),
    body('requesterType').optional().trim(),
    body('documento_solicitado').optional().trim(),
    body('documentName').optional().trim(),
    body('motivo').optional().trim(),
    body('requestReason').optional().trim(),
    body('nivel_urgencia').optional().isIn(['low', 'normal', 'high', 'urgent', 'Baja', 'Normal', 'Alta', 'Urgente']),
    body('urgencyLevel').optional().isIn(['low', 'normal', 'high', 'urgent', 'Baja', 'Normal', 'Alta', 'Urgente'])
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // Aceptar tanto nombres en español como en inglés (compatibilidad con formularios)
    const nombre = req.body.nombre || req.body.requesterName;
    const email = req.body.email || req.body.requesterEmail;
    const tipo_usuario = req.body.tipo_usuario || req.body.requesterType;
    const documento_solicitado = req.body.documento_solicitado || req.body.documentName;
    const motivo = req.body.motivo || req.body.requestReason || '';
    const nivel_urgencia = req.body.nivel_urgencia || req.body.urgencyLevel || 'normal';

    // Validación de campos requeridos
    if (!nombre || !email || !tipo_usuario || !documento_solicitado) {
        return res.status(400).json({
            success: false,
            error: 'Faltan campos requeridos: nombre, email, tipo_usuario, documento_solicitado'
        });
    }

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        const insertQuery = `
            INSERT INTO solicitudes_documentos (
                nombre, email, tipo_usuario, documento_solicitado,
                motivo, nivel_urgencia, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            nombre,
            email,
            tipo_usuario,
            documento_solicitado,
            motivo,
            nivel_urgencia,
            ip_address,
            user_agent
        ]);

        console.log('✅ Nueva solicitud de documento creada:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Tu solicitud ha sido enviada exitosamente. Te contactaremos pronto.',
            data: {
                id: result.rows[0].id,
                fecha: result.rows[0].fecha_solicitud
            }
        });

    } catch (error) {
        console.error('❌ Error al crear solicitud:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu solicitud. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/solicitudes - Listar todas las solicitudes
// =====================================================
router.get('/', async (req, res) => {
    const { status, tipo_usuario, nivel_urgencia, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM solicitudes_documentos WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (tipo_usuario) {
            paramCount++;
            query += ` AND tipo_usuario = $${paramCount}`;
            params.push(tipo_usuario);
        }

        if (nivel_urgencia) {
            paramCount++;
            query += ` AND nivel_urgencia = $${paramCount}`;
            params.push(nivel_urgencia);
        }

        query += ` ORDER BY fecha_solicitud DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM solicitudes_documentos WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (tipo_usuario) {
            countParamCount++;
            countQuery += ` AND tipo_usuario = $${countParamCount}`;
            countParams.push(tipo_usuario);
        }

        if (nivel_urgencia) {
            countParamCount++;
            countQuery += ` AND nivel_urgencia = $${countParamCount}`;
            countParams.push(nivel_urgencia);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error al obtener solicitudes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/solicitudes/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE status = 'en_proceso') as en_proceso,
                COUNT(*) FILTER (WHERE status = 'completado') as completados,
                COUNT(*) FILTER (WHERE status = 'rechazado') as rechazados,
                COUNT(*) FILTER (WHERE nivel_urgencia = 'urgent') as urgentes,
                COUNT(*) FILTER (WHERE nivel_urgencia = 'high') as alta_urgencia,
                COUNT(*) FILTER (WHERE DATE(fecha_solicitud) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_solicitud) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana
            FROM solicitudes_documentos;
        `;

        const result = await pool.query(query);

        // Estadísticas por tipo de usuario
        const tipoQuery = `
            SELECT tipo_usuario, COUNT(*) as cantidad
            FROM solicitudes_documentos
            GROUP BY tipo_usuario
            ORDER BY cantidad DESC;
        `;

        const tipoResult = await pool.query(tipoQuery);
        const byTipoUsuario = tipoResult.rows.reduce((acc, row) => {
            acc[row.tipo_usuario] = parseInt(row.cantidad);
            return acc;
        }, {});

        // Documentos más solicitados
        const docQuery = `
            SELECT documento_solicitado, COUNT(*) as cantidad
            FROM solicitudes_documentos
            GROUP BY documento_solicitado
            ORDER BY cantidad DESC
            LIMIT 10;
        `;

        const docResult = await pool.query(docQuery);
        const documentosMasSolicitados = docResult.rows.reduce((acc, row) => {
            acc[row.documento_solicitado] = parseInt(row.cantidad);
            return acc;
        }, {});

        const stats = {
            ...result.rows[0],
            byTipoUsuario,
            documentosMasSolicitados
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/solicitudes/:id - Obtener una solicitud
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM solicitudes_documentos WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener solicitud:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la solicitud'
        });
    }
});

// =====================================================
// PUT /api/solicitudes/:id - Actualizar solicitud (ADMIN)
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, notas_admin, procesado_por } = req.body;

    try {
        const query = `
            UPDATE solicitudes_documentos
            SET
                status = COALESCE($1, status),
                notas_admin = COALESCE($2, notas_admin),
                procesado_por = COALESCE($3, procesado_por),
                fecha_procesado = CASE WHEN $1 IN ('completado', 'rechazado') THEN NOW() ELSE fecha_procesado END
            WHERE id = $4
            RETURNING *;
        `;

        const result = await pool.query(query, [status, notas_admin, procesado_por, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Solicitud actualizada correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar solicitud:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la solicitud'
        });
    }
});

// =====================================================
// DELETE /api/solicitudes/:id - Eliminar solicitud (ADMIN)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM solicitudes_documentos WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Solicitud eliminada correctamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar solicitud:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la solicitud'
        });
    }
});

/**
 * PUT /api/solicitudes/:id/approve
 * Aprobar una solicitud pendiente
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_admin } = req.body;

        const result = await pool.query(
            `UPDATE solicitudes_documentos
             SET status = 'aprobada',
                 notas_admin = $1,
                 fecha_procesado = NOW()
             WHERE id = $2
             RETURNING *`,
            [notas_admin || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        console.log(`✅ Solicitud ${id} aprobada`);

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente',
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error aprobando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar solicitud',
            error: error.message
        });
    }
});

/**
 * PUT /api/solicitudes/:id/reject
 * Rechazar una solicitud pendiente
 */
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un motivo de rechazo'
            });
        }

        const result = await pool.query(
            `UPDATE solicitudes_documentos
             SET status = 'rechazada',
                 notas_admin = $1,
                 fecha_procesado = NOW()
             WHERE id = $2
             RETURNING *`,
            [motivo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        console.log(`❌ Solicitud ${id} rechazada`);

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente',
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error rechazando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar solicitud',
            error: error.message
        });
    }
});

module.exports = router;
