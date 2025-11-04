/**
 * 📋 RUTAS PARA PENDIENTES DE APROBACIÓN
 * Sistema de 2 pasos: Formulario → Temporal (pendientes_aprobacion) → Aprobado/Rechazado
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/pendientes-aprobacion
 * Listar todas las solicitudes pendientes de aprobación
 * Query params: tipo (egresado|bolsa_trabajo), estado (pendiente|aprobada|rechazada), limit, offset
 */
router.get('/', async (req, res) => {
    try {
        const { tipo, estado = 'pendiente', email_confirmado, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM pendientes_aprobacion WHERE 1=1';
        const params = [];

        if (estado) {
            query += ' AND estado = $' + (params.length + 1);
            params.push(estado);
        }

        if (tipo) {
            query += ' AND tipo_solicitud = $' + (params.length + 1);
            params.push(tipo);
        }

        // Filtrar por email_confirmado si se proporciona
        if (email_confirmado !== undefined) {
            const confirmedValue = email_confirmado === 'true' || email_confirmado === true;
            query += ' AND email_confirmado = $' + (params.length + 1);
            params.push(confirmedValue);
        }

        // Paginación
        query += ' ORDER BY fecha_solicitud DESC';
        query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM pendientes_aprobacion WHERE 1=1';
        const countParams = [];

        if (estado) {
            countQuery += ' AND estado = $' + (countParams.length + 1);
            countParams.push(estado);
        }

        if (tipo) {
            countQuery += ' AND tipo_solicitud = $' + (countParams.length + 1);
            countParams.push(tipo);
        }

        // Filtrar por email_confirmado si se proporciona
        if (email_confirmado !== undefined) {
            const confirmedValue = email_confirmado === 'true' || email_confirmado === true;
            countQuery += ' AND email_confirmado = $' + (countParams.length + 1);
            countParams.push(confirmedValue);
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
        console.error('❌ Error al obtener pendientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener solicitudes pendientes'
        });
    }
});

/**
 * GET /api/pendientes-aprobacion/:id
 * Obtener detalle de una solicitud pendiente
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM pendientes_aprobacion WHERE id = $1',
            [id]
        );

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
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener solicitud'
        });
    }
});

/**
 * POST /api/pendientes-aprobacion/aprobar/:id
 * Aprobar una solicitud pendiente (mover a tabla final)
 */
router.post('/aprobar/:id', async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { admin_id, admin_notas } = req.body;

        // Obtener la solicitud pendiente
        const pendienteResult = await client.query(
            'SELECT * FROM pendientes_aprobacion WHERE id = $1',
            [id]
        );

        if (pendienteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        const solicitud = pendienteResult.rows[0];
        const datos = solicitud.datos_json;

        await client.query('BEGIN');

        try {
            // Insertar en la tabla final según el tipo de solicitud
            if (solicitud.tipo_solicitud === 'egresado') {
                // Insertar en tabla egresados con estructura correcta
                const egresadoId = `EGR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

                await client.query(`
                    INSERT INTO egresados (
                        egresado_id, nombre_completo, email, telefono,
                        fecha_nacimiento, anio_egreso, carrera_tecnica, generacion,
                        experiencia_laboral, habilidades, idiomas, disponibilidad,
                        ciudad, estado, linkedin_url, portafolio_url, referencias,
                        estado_perfil, confirmado, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
                    )
                    ON CONFLICT (email) DO NOTHING
                `, [
                    egresadoId,
                    datos.nombre_completo || datos.name || datos.nombre || '',
                    datos.email,
                    datos.telefono || null,
                    datos.fecha_nacimiento || null,
                    datos.anio_egreso || null,
                    datos.carrera_tecnica || datos.carrera || null,
                    datos.generacion || null,
                    datos.experiencia_laboral || datos.trabajo || null,
                    typeof datos.habilidades === 'string' ? datos.habilidades : JSON.stringify(datos.habilidades || []),
                    typeof datos.idiomas === 'string' ? datos.idiomas : JSON.stringify(datos.idiomas || []),
                    datos.disponibilidad || 'inmediata',
                    datos.ciudad || null,
                    datos.estado || null,
                    datos.linkedin_url || null,
                    datos.portafolio_url || null,
                    typeof datos.referencias === 'string' ? datos.referencias : JSON.stringify(datos.referencias || []),
                    'aprobado',  // estado_perfil: aprobado automáticamente al aprobar desde admin
                    true,        // confirmado: marcado como confirmado
                ]);

            } else if (solicitud.tipo_solicitud === 'bolsa_trabajo') {
                // Insertar en tabla bolsa_trabajo
                await client.query(`
                    INSERT INTO bolsa_trabajo (
                        nombre_completo, email, telefono, generacion,
                        experiencia, habilidades
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6
                    )
                    ON CONFLICT (email) DO NOTHING
                `, [
                    datos.name || datos.nombre_completo || '',
                    datos.email,
                    datos.phone || datos.telefono || null,
                    datos.graduationYear || datos.generacion || null,
                    datos.message || datos.experiencia || null,
                    datos.skills || datos.habilidades || null
                ]);
            }

            // Actualizar estado en pendientes_aprobacion
            await client.query(`
                UPDATE pendientes_aprobacion
                SET
                    estado = 'aprobada',
                    admin_id = $1,
                    admin_notas = $2,
                    fecha_procesado = NOW(),
                    updated_at = NOW()
                WHERE id = $3
            `, [admin_id || null, admin_notas || null, id]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Solicitud aprobada y movida a tabla final',
                data: { id, estado: 'aprobada' }
            });

        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        }

    } catch (error) {
        console.error('❌ Error al aprobar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar solicitud',
            message: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/pendientes-aprobacion/rechazar/:id
 * Rechazar una solicitud pendiente
 */
router.post('/rechazar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_id, admin_notas } = req.body;

        const result = await pool.query(`
            UPDATE pendientes_aprobacion
            SET
                estado = 'rechazada',
                admin_id = $1,
                admin_notas = $2,
                fecha_procesado = NOW(),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [admin_id || null, admin_notas || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Solicitud rechazada',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al rechazar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al rechazar solicitud'
        });
    }
});

/**
 * DELETE /api/pendientes-aprobacion/:id
 * Eliminar una solicitud pendiente
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Solicitud eliminada'
        });

    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar solicitud'
        });
    }
});

/**
 * GET /api/pendientes-aprobacion/stats/general
 * Estadísticas de solicitudes pendientes
 */
router.get('/stats/general', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
                COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado') as egresados,
                COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo') as bolsa_trabajo,
                COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado' AND estado = 'pendiente') as egresados_pendientes,
                COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo' AND estado = 'pendiente') as bolsa_trabajo_pendientes,
                COUNT(*) as total
            FROM pendientes_aprobacion
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;
