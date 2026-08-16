/**
 * 🔧 ENDPOINT DE FIX AUTOMÁTICO - APROBACIONES
 * ✅ FASE 3 DAL - Refactorizado para usar AprobacionesDAO
 * Propósito: Sincronizar BD automáticamente sin intervención manual
 * Fecha: 3 Noviembre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger.js');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors.js');
const router = express.Router();

// ✅ FASE 3: Using DAO layer
const AprobacionesDAO = require('../data/aprobaciones.dao.js');

/**
 * POST /api/fix-aprobaciones/sincronizar
 * Fix automático: Asegura que todos los registros pendientes sean visibles
 */
router.post('/sincronizar', async (req, res) => {
    debugLog.log('FIX_APROBACIONES_AUTO', '🔧 [FIX AUTO] Iniciando sincronización de aprobaciones...');

    try {
        // ✅ FASE 3: Using AprobacionesDAO
        // PASO 1: Ver estado actual
        const antes = await AprobacionesDAO.getEstadisticas();
        debugLog.log('FIX_APROBACIONES_AUTO', '📊 [FIX AUTO] Estado ANTES:', antes);

        // PASO 2: FORZAR email_confirmado=true para TODOS los pendientes
        const actualizados = await AprobacionesDAO.sincronizarPendientes();
        debugLog.log('FIX_APROBACIONES_AUTO', `🔄 [FIX AUTO] Actualizados ${actualizados.length} registros`);

        // PASO 3: Verificar estado después
        const despues = await AprobacionesDAO.getEstadisticas();
        debugLog.log('FIX_APROBACIONES_AUTO', '📊 [FIX AUTO] Estado DESPUÉS:', despues);

        // PASO 4: Listar registros actualizados
        const listado = await AprobacionesDAO.listarPendientes(10);

        res.json({
            success: true,
            message: '✅ Sincronización completada',
            actualizados: actualizados.length,
            antes: antes,
            despues: despues,
            registros_pendientes: listado
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
        // ✅ FASE 3: Using AprobacionesDAO
        const estadisticas = await AprobacionesDAO.getEstadisticas();

        res.json({
            success: true,
            estadisticas
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
