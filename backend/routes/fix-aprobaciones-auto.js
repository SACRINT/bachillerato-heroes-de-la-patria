/**
 * 🔧 ENDPOINT DE FIX AUTOMÁTICO - APROBACIONES
 * Propósito: Sincronizar BD automáticamente sin intervención manual
 * Fecha: 3 Noviembre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * POST /api/fix-aprobaciones/sincronizar
 * Fix automático: Asegura que todos los registros pendientes sean visibles
 */
router.post('/sincronizar', async (req, res) => {
    debugLog.log('FIX_APROBACIONES_AUTO', '🔧 [FIX AUTO] Iniciando sincronización de aprobaciones...');

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
        debugLog.log('FIX_APROBACIONES_AUTO', '📊 [FIX AUTO] Estado ANTES:', antes);

        // PASO 2: FORZAR email_confirmado=true para TODOS los pendientes
        const updateResult = await pool.query(`
            UPDATE pendientes_aprobacion
            SET email_confirmado = true, updated_at = NOW()
            WHERE estado = 'pendiente' AND email_confirmado = false
            RETURNING id
        `);

        debugLog.log('FIX_APROBACIONES_AUTO', `🔄 [FIX AUTO] Actualizados ${updateResult.rows.length} registros`);

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
        debugLog.log('FIX_APROBACIONES_AUTO', '📊 [FIX AUTO] Estado DESPUÉS:', despues);

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

        debugLog.log('FIX_APROBACIONES_AUTO', '✅ [FIX AUTO] Sincronización completada exitosamente');

    } catch (error) {
        debugLog.error('FIX_APROBACIONES_AUTO', '❌ [FIX AUTO] Error durante sincronización:', sanitizeError(error, 'fix-aprobaciones-auto'));
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
        debugLog.error('FIX_APROBACIONES_AUTO', '❌ Error al obtener estado:', sanitizeError(error, 'fix-aprobaciones-auto'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estado'
        });
    }
});

module.exports = router;
