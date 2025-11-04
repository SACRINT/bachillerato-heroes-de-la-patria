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
 *
 * ⚠️ NOTA: Se removió el filtro email_confirmado para mostrar TODOS los registros
 * pendientes sin importar su estado de confirmación. Los registros deben aparecer
 * en el tab de aprobaciones para ser revisados por el administrador.
 */
router.get('/', async (req, res) => {
    try {
        const { tipo, estado, limit = 50, offset = 0, todos } = req.query;

        // Lógica de filtrado de estado:
        // - Si todos=true O todos=1, mostrar TODOS sin filtro de estado
        // - Si estado está especificado, usarlo
        // - Si nada se especifica, usar 'pendiente' como default
        let estadoFinal;
        if (todos === 'true' || todos === '1') {
            estadoFinal = null; // Sin filtro de estado
        } else if (estado) {
            estadoFinal = estado;
        } else {
            estadoFinal = 'pendiente'; // Default
        }

        let query = 'SELECT * FROM pendientes_aprobacion WHERE 1=1';
        const params = [];

        if (estadoFinal) {
            query += ' AND estado = $' + (params.length + 1);
            params.push(estadoFinal);
        }

        if (tipo) {
            query += ' AND tipo_solicitud = $' + (params.length + 1);
            params.push(tipo);
        }

        // ✅ REMOVIDO: Filtro email_confirmado para mostrar todos los registros pendientes

        // Paginación
        query += ' ORDER BY fecha_solicitud DESC';
        query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        console.log(`📋 Query para obtener pendientes: ${query}`);
        console.log(`   Parámetros: [${params.join(', ')}]`);
        console.log(`   Filtro estado: ${estadoFinal || 'NINGUNO (mostrando todos)'}`);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM pendientes_aprobacion WHERE 1=1';
        const countParams = [];

        if (estadoFinal) {
            countQuery += ' AND estado = $' + (countParams.length + 1);
            countParams.push(estadoFinal);
        }

        if (tipo) {
            countQuery += ' AND tipo_solicitud = $' + (countParams.length + 1);
            countParams.push(tipo);
        }

        const countResult = await pool.query(countQuery, countParams);

        const totalCount = parseInt(countResult.rows[0].count);
        console.log(`   Resultado: ${result.rows.length} registros encontrados, Total: ${totalCount}`);

        res.json({
            success: true,
            data: result.rows,
            total: totalCount,
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
 * Aprobar una solicitud pendiente (mover a tabla final y ELIMINAR de pendientes_aprobacion)
 *
 * ✅ IMPORTANTE: Después de insertar en tabla final, se ELIMINA de pendientes_aprobacion
 * Esto asegura que pendientes_aprobacion solo contiene registros con estado='pendiente'
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
                // Insertar en tabla egresados con estructura correcta (según setup-database-neon-postgres.sql)
                await client.query(`
                    INSERT INTO egresados (
                        nombre, email, telefono,
                        anio_egreso, carrera, generacion,
                        ocupacion_actual, ciudad,
                        verificado, fecha_registro, fecha_actualizacion
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
                    )
                    ON CONFLICT (email) DO NOTHING
                `, [
                    datos.nombre_completo || datos.name || datos.nombre || '',
                    datos.email,
                    datos.telefono || null,
                    datos.anio_egreso || null,
                    datos.carrera_tecnica || datos.carrera || null,
                    datos.generacion || null,
                    datos.experiencia_laboral || datos.trabajo || null,
                    datos.ciudad || null,
                    true  // verificado: marcado como verificado al aprobar desde admin
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

            // ✅ ELIMINAR de pendientes_aprobacion (no solo actualizar estado)
            // Esto asegura que la tabla solo contiene registros pendientes
            const deleteResult = await client.query(
                'DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id',
                [id]
            );

            if (deleteResult.rows.length === 0) {
                throw new Error(`No se pudo eliminar el registro ${id} de pendientes_aprobacion`);
            }

            await client.query('COMMIT');

            console.log(`✅ Solicitud ${id} aprobada y movida a tabla final, eliminada de pendientes_aprobacion`);

            res.json({
                success: true,
                message: 'Solicitud aprobada, movida a tabla final y eliminada de pendientes',
                data: { id, estado: 'aprobada', action: 'deleted_from_pending' }
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
 * Rechazar una solicitud pendiente - ELIMINA el registro de la BD
 */
router.post('/rechazar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_id, admin_notas } = req.body;

        // Verificar que la solicitud existe antes de eliminarla
        const verifyResult = await pool.query(
            'SELECT id, tipo_solicitud, email_usuario, datos_json FROM pendientes_aprobacion WHERE id = $1',
            [id]
        );

        if (verifyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        const solicitud = verifyResult.rows[0];

        // ⚠️ NOTA: Para mantener auditoría, primero guardamos en un log antes de eliminar
        // (Opcional: si se requiere auditoría completa)
        console.log(`❌ Rechazando solicitud ${id}: ${solicitud.tipo_solicitud} de ${solicitud.email_usuario}`);
        console.log(`   Notas del admin: ${admin_notas || 'Sin notas'}`);

        // ELIMINAR el registro de la base de datos
        const deleteResult = await pool.query(
            'DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id',
            [id]
        );

        res.json({
            success: true,
            message: 'Solicitud rechazada y eliminada de la base de datos',
            data: {
                id: deleteResult.rows[0].id,
                tipo_solicitud: solicitud.tipo_solicitud,
                email_usuario: solicitud.email_usuario,
                action: 'deleted',
                admin_notas: admin_notas || null
            }
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
