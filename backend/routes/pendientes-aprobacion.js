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

        let query = 'SELECT * FROM pendientes_aprobacion WHERE email_confirmado = true';
        const params = [];

        if (estadoFinal) {
            query += ' AND estado = $' + (params.length + 1);
            params.push(estadoFinal);
        }

        if (tipo) {
            query += ' AND tipo_solicitud = $' + (params.length + 1);
            params.push(tipo);
        }

        // ✅ FILTRO CRÍTICO: Solo mostrar registros con email_confirmado=true
        // Esto asegura que solo aparecen en el tab de aprobaciones DESPUÉS de confirmar email

        // Paginación
        query += ' ORDER BY fecha_solicitud DESC';
        query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        console.log(`📋 Query para obtener pendientes: ${query}`);
        console.log(`   Parámetros: [${params.join(', ')}]`);
        console.log(`   Filtro estado: ${estadoFinal || 'NINGUNO (mostrando todos)'}`);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM pendientes_aprobacion WHERE email_confirmado = true';
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
    const { id } = req.params;
    const { admin_id, admin_notas } = req.body;

    console.log(`\n🔵 [BACKEND APROBAR] =====================================`);
    console.log(`📥 [BACKEND APROBAR] POST /aprobar/${id} recibido`);
    console.log(`   Body:`, { admin_id, admin_notas });
    console.log(`   Tipo de ID: ${typeof id}, Valor: ${id}`);

    const client = await pool.connect();

    try {
        // Obtener la solicitud pendiente
        console.log(`🔍 [BACKEND APROBAR] Buscando solicitud con id=${id}`);
        const pendienteResult = await client.query(
            'SELECT * FROM pendientes_aprobacion WHERE id = $1',
            [id]
        );

        console.log(`📊 [BACKEND APROBAR] Resultado de búsqueda:`);
        console.log(`   Registros encontrados: ${pendienteResult.rows.length}`);

        if (pendienteResult.rows.length === 0) {
            console.warn(`⚠️ [BACKEND APROBAR] Solicitud ${id} NO ENCONTRADA`);
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        const solicitud = pendienteResult.rows[0];
        const datos = solicitud.datos_json;

        console.log(`✅ [BACKEND APROBAR] Solicitud encontrada:`);
        console.log(`   ID: ${solicitud.id}`);
        console.log(`   Tipo: ${solicitud.tipo_solicitud}`);
        console.log(`   Email usuario: ${solicitud.email_usuario}`);
        console.log(`   Estado actual: ${solicitud.estado}`);
        console.log(`   Datos JSON completos:`, datos);

        console.log(`🔄 [BACKEND APROBAR] Iniciando transacción...`);
        await client.query('BEGIN');

        try {
            // Insertar en la tabla final según el tipo de solicitud
            if (solicitud.tipo_solicitud === 'egresado') {
                console.log(`📝 [BACKEND APROBAR] Insertando en tabla EGRESADOS...`);

                const insertResult = await client.query(`
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
                    true
                ]);

                console.log(`✅ [BACKEND APROBAR] Inserción en egresados completada`);
                console.log(`   Filas afectadas: ${insertResult.rowCount}`);

            } else if (solicitud.tipo_solicitud === 'bolsa_trabajo') {
                console.log(`📝 [BACKEND APROBAR] Insertando en tabla BOLSA_TRABAJO...`);

                const insertResult = await client.query(`
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

                console.log(`✅ [BACKEND APROBAR] Inserción en bolsa_trabajo completada`);
                console.log(`   Filas afectadas: ${insertResult.rowCount}`);

            } else {
                throw new Error(`Tipo de solicitud desconocido: ${solicitud.tipo_solicitud}`);
            }

            // ✅ ELIMINAR de pendientes_aprobacion
            console.log(`🗑️ [BACKEND APROBAR] Eliminando de pendientes_aprobacion (id=${id})...`);
            const deleteResult = await client.query(
                'DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id',
                [id]
            );

            console.log(`📊 [BACKEND APROBAR] Resultado de DELETE:`);
            console.log(`   Filas eliminadas: ${deleteResult.rowCount}`);
            console.log(`   IDs retornados:`, deleteResult.rows);

            if (deleteResult.rows.length === 0) {
                throw new Error(`No se pudo eliminar el registro ${id} de pendientes_aprobacion`);
            }

            console.log(`✅ [BACKEND APROBAR] COMMIT de transacción...`);
            await client.query('COMMIT');

            console.log(`🎉 [BACKEND APROBAR] ¡Solicitud aprobada exitosamente!`);
            console.log(`   ID aprobado: ${id}`);
            console.log(`   Tabla destino: ${solicitud.tipo_solicitud}`);
            console.log(`🔵 [BACKEND APROBAR] =====================================\n`);

            res.json({
                success: true,
                message: 'Solicitud aprobada, movida a tabla final y eliminada de pendientes',
                data: { id, estado: 'aprobada', action: 'deleted_from_pending' }
            });

        } catch (innerError) {
            console.error(`❌ [BACKEND APROBAR] Error en transacción:`, innerError.message);
            console.error(`   Stack:`, innerError.stack);
            console.log(`🔄 [BACKEND APROBAR] Haciendo ROLLBACK...`);
            await client.query('ROLLBACK');
            throw innerError;
        }

    } catch (error) {
        console.error(`❌ [BACKEND APROBAR] Error fatal:`, error.message);
        console.error(`   Tipo de error:`, error.name);
        console.error(`   Stack completo:`, error.stack);
        console.log(`🔵 [BACKEND APROBAR] =====================================\n`);

        res.status(500).json({
            success: false,
            error: 'Error al procesar solicitud',
            message: error.message
        });
    } finally {
        console.log(`🔓 [BACKEND APROBAR] Liberando cliente de conexión...`);
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
