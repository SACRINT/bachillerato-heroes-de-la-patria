/**
 * 🔧 ENDPOINT DE FIX AUTOMÁTICO - APROBACIONES
 * Propósito: Sincronizar BD automáticamente sin intervención manual
 * Fecha: 3 Noviembre 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * POST /api/fix-aprobaciones/sincronizar
 * Fix automático: Asegura que todos los registros pendientes sean visibles
 */
router.post('/sincronizar', async (req, res) => {
    console.log('🔧 [FIX AUTO] Iniciando sincronización de aprobaciones...');

    try {
        // PASO 1: Ver estado actual
        const estadoActual = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as confirmados,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as no_confirmados
            FROM pendientes_aprobacion
        `);

        const antes = estadoActual.rows[0];
        console.log('📊 [FIX AUTO] Estado ANTES:', antes);

        // PASO 2: FORZAR email_confirmado=true para TODOS los pendientes
        const updateResult = await pool.query(`
            UPDATE pendientes_aprobacion
            SET email_confirmado = true, updated_at = NOW()
            WHERE estado = 'pendiente' AND email_confirmado = false
            RETURNING id
        `);

        console.log(`🔄 [FIX AUTO] Actualizados ${updateResult.rows.length} registros`);

        // PASO 3: Verificar estado después
        const estadoFinal = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as confirmados,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as no_confirmados
            FROM pendientes_aprobacion
        `);

        const despues = estadoFinal.rows[0];
        console.log('📊 [FIX AUTO] Estado DESPUÉS:', despues);

        // PASO 4: Listar registros actualizados
        const listado = await pool.query(`
            SELECT
                id,
                tipo_solicitud,
                email_usuario,
                estado,
                email_confirmado,
                fecha_solicitud
            FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
            ORDER BY fecha_solicitud DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            message: '✅ Sincronización completada',
            actualizados: updateResult.rows.length,
            antes: antes,
            despues: despues,
            registros_pendientes: listado.rows
        });

        console.log('✅ [FIX AUTO] Sincronización completada exitosamente');

    } catch (error) {
        console.error('❌ [FIX AUTO] Error durante sincronización:', error);
        res.status(500).json({
            success: false,
            error: 'Error al sincronizar aprobaciones',
            message: error.message
        });
    }
});

/**
 * GET /api/fix-aprobaciones/estado
 * Ver estado actual de la BD sin hacer cambios
 */
router.get('/estado', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as confirmados,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as no_confirmados,
                COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas
            FROM pendientes_aprobacion
        `);

        res.json({
            success: true,
            estadisticas: resultado.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estado'
        });
    }
});

module.exports = router;
