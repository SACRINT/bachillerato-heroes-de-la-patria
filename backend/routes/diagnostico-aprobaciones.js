/**
 * 🔍 DIAGNÓSTICO REAL DE APROBACIONES
 * ✅ FASE 3 DAL - Refactorizado para usar AprobacionesDAO
 * Endpoint para ver EXACTAMENTE qué hay en la BD
 * Sin filtros, sin mentiras, información real
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();

// ✅ FASE 3: Using DAO layer
const AprobacionesDAO = require('../data/aprobaciones.dao');

/**
 * GET /api/diagnostico-aprobaciones/todos-registros
 * Ver TODOS los registros de la tabla sin filtros
 */
router.get('/todos-registros', async (req, res) => {
    debugLog.log('DIAGNOSTICO_APROBACIONES', '\n🔍 [DIAGNÓSTICO] Consultando TODOS los registros sin filtros...\n');

    try {
        // ✅ FASE 3: Using AprobacionesDAO
        const stats = await AprobacionesDAO.getResumenCompleto();

        debugLog.log('DIAGNOSTICO_APROBACIONES', '📊 [DIAGNÓSTICO] Estadísticas generales:');
        debugLog.log('DIAGNOSTICO_APROBACIONES', `   - Total registros: ${stats.total_registros}`);
        debugLog.log('DIAGNOSTICO_APROBACIONES', `   - Estado pendiente: ${stats.pendiente_count}`);
        debugLog.log('DIAGNOSTICO_APROBACIONES', `   - Estado aprobada: ${stats.aprobada_count}`);
        debugLog.log('DIAGNOSTICO_APROBACIONES', `   - Estado rechazada: ${stats.rechazada_count}`);
        debugLog.log('DIAGNOSTICO_APROBACIONES', `   - Email confirmados: ${stats.confirmados_count}`);
        debugLog.log('DIAGNOSTICO_APROBACIONES', `   - Email NO confirmados: ${stats.no_confirmados_count}`);

        const porEstado = await AprobacionesDAO.getDesglosePorEstado();

        debugLog.log('DIAGNOSTICO_APROBACIONES', '\n📋 [DIAGNÓSTICO] Desglose por estado:');
        porEstado.forEach(row => {
            debugLog.log('DIAGNOSTICO_APROBACIONES', `   - ${row.estado}: ${row.cantidad}`);
        });

        const todos = await AprobacionesDAO.listarTodos();

        debugLog.log('DIAGNOSTICO_APROBACIONES', `\n📋 [DIAGNÓSTICO] LISTADO COMPLETO (${todos.length} registros):`);
        todos.forEach((row, idx) => {
            debugLog.log('DIAGNOSTICO_APROBACIONES', `   ${idx + 1}. ID ${row.id}: ${row.tipo_solicitud} | ${row.estado} | ${row.email_usuario}`);
        });

        res.json({
            success: true,
            resumen: stats,
            por_estado: porEstado,
            todos_registros: todos,
            total: todos.length
        });

        debugLog.log('DIAGNOSTICO_APROBACIONES', '\n✅ [DIAGNÓSTICO] Completado\n');

    } catch (error) {
        debugLog.error('DIAGNOSTICO_APROBACIONES', '❌ [DIAGNÓSTICO] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/diagnostico-aprobaciones/pendientes-solo
 * Ver SOLO registros con estado='pendiente' (lo que debería mostrar el dashboard)
 */
router.get('/pendientes-solo', async (req, res) => {
    debugLog.log('DIAGNOSTICO_APROBACIONES', '\n🔍 [DIAGNÓSTICO] Consultando SOLO registros pendientes...\n');

    try {
        // ✅ FASE 3: Using AprobacionesDAO
        const pendientes = await AprobacionesDAO.listarPendientes(100);

        debugLog.log('DIAGNOSTICO_APROBACIONES', `📊 [DIAGNÓSTICO] Registros pendientes: ${pendientes.length}`);
        pendientes.forEach((row, idx) => {
            debugLog.log('DIAGNOSTICO_APROBACIONES', `   ${idx + 1}. ID ${row.id}: ${row.tipo_solicitud} | ${row.email_usuario} | Confirmado: ${row.email_confirmado}`);
        });

        res.json({
            success: true,
            pendientes: pendientes,
            total: pendientes.length
        });

        debugLog.log('DIAGNOSTICO_APROBACIONES', '\n✅ [DIAGNÓSTICO] Completado\n');

    } catch (error) {
        debugLog.error('DIAGNOSTICO_APROBACIONES', '❌ [DIAGNÓSTICO] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/diagnostico-aprobaciones/comparar
 * Comparar lo que la BD tiene vs lo que el endpoint normal retorna
 */
router.get('/comparar', async (req, res) => {
    debugLog.log('DIAGNOSTICO_APROBACIONES', '\n🔍 [DIAGNÓSTICO] Comparando BD vs endpoint GET...\n');

    try {
        // ✅ FASE 3: Using AprobacionesDAO
        const bdRealTotal = await AprobacionesDAO.contarPendientes();
        const endpointNormal = await AprobacionesDAO.listarPendientesParaEndpoint(100);

        debugLog.log('DIAGNOSTICO_APROBACIONES', `📊 [DIAGNÓSTICO] BD real: ${bdRealTotal} pendientes`);
        debugLog.log('DIAGNOSTICO_APROBACIONES', `📊 [DIAGNÓSTICO] Endpoint retorna: ${endpointNormal.length} registros`);

        res.json({
            success: true,
            bd_real_total: bdRealTotal,
            endpoint_retorna: endpointNormal.length,
            registros: endpointNormal,
            corresponden: bdRealTotal === endpointNormal.length
        });

        debugLog.log('DIAGNOSTICO_APROBACIONES', '\n✅ [DIAGNÓSTICO] Completado\n');

    } catch (error) {
        debugLog.error('DIAGNOSTICO_APROBACIONES', '❌ [DIAGNÓSTICO] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
