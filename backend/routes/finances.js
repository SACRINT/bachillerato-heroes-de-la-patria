/**
 * 💰 API DE FINANZAS - PostgreSQL
 * Gestión de ingresos, gastos y pagos pendientes
 * ✅ FASE 3 DAL - Refactorizado para usar DAO
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();

// ✅ FASE 3: Using DAO layer instead of direct pool access
const FinancesDAO = require('../data/finances.dao');

// =====================================================
// GET /api/finances - Obtener resumen financiero completo
// =====================================================
router.get('/', async (req, res) => {
    try {
        debugLog.log('FINANCES', '💰 [FINANCES] Obteniendo datos financieros...');

        // ✅ FASE 3: Using FinancesDAO
        const data = await FinancesDAO.getResumenCompleto();

        const response = {
            success: true,
            resumen: data.resumen,
            ingresos: data.ingresos,
            gastos: data.gastos,
            pagosPendientes: data.pagosPendientes,
            estadisticas: {
                totalIngresos: data.ingresos.length,
                totalGastos: data.gastos.length,
                totalPendientes: data.pagosPendientes.length
            },
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0",
                tablasDisponibles: data.tablasDisponibles
            }
        };

        debugLog.log('FINANCES', '✅ [FINANCES] Datos financieros obtenidos');

        res.json(response);

    } catch (error) {
        debugLog.error('FINANCES', '❌ [FINANCES] Error obteniendo datos financieros:', sanitizeError(error, 'finances'));

        // Devolver estructura vacía en caso de error
        res.json({
            success: true,
            resumen: {
                ingresosMes: 0,
                pagosPendientes: 0,
                tasaCobro: 0,
                gastosMes: 0,
                utilidadMes: 0
            },
            ingresos: [],
            gastos: [],
            pagosPendientes: [],
            estadisticas: {},
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0",
                error: error.message
            }
        });
    }
});

// =====================================================
// GET /api/finances/stats - Estadísticas financieras
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        debugLog.log('FINANCES', '📊 [FINANCES] Obteniendo estadísticas financieras...');

        // Por ahora devolver estadísticas vacías
        res.json({
            success: true,
            data: {
                ingresosTotales: 0,
                gastosTotales: 0,
                utilidadNeta: 0,
                pagosPendientes: 0
            }
        });

    } catch (error) {
        debugLog.error('FINANCES', '❌ [FINANCES] Error obteniendo estadísticas:', sanitizeError(error, 'finances'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas financieras'
        });
    }
});

module.exports = router;
