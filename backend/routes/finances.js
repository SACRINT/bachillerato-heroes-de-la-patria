"use strict";
/**
 * 💰 API DE FINANZAS - TypeScript
 * Gestión de ingresos, gastos y pagos pendientes
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const finances_dao_1 = __importDefault(require("../data/finances.dao"));
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const router = express_1.default.Router();
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/finances
 */
router.get('/', async (req, res) => {
    try {
        debug_logger_1.debugLog.log('FINANCES', '💰 Obteniendo datos financieros...');
        const data = await finances_dao_1.default.getResumenCompleto();
        res.json({
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
        });
        debug_logger_1.debugLog.log('FINANCES', '✅ Datos financieros obtenidos');
    }
    catch (error) {
        debug_logger_1.debugLog.error('FINANCES', '❌ Error obteniendo datos financieros:', (0, sanitized_errors_1.sanitizeError)(error, 'finances'));
        res.json({
            success: true,
            resumen: { ingresosMes: 0, pagosPendientes: 0, tasaCobro: 0, gastosMes: 0, utilidadMes: 0 },
            ingresos: [],
            gastos: [],
            pagosPendientes: [],
            estadisticas: {},
            configuracion: { ultimaActualizacion: new Date().toISOString(), version: "1.0", error: error.message }
        });
    }
});
/**
 * GET /api/finances/stats
 */
router.get('/stats', async (req, res) => {
    try {
        debug_logger_1.debugLog.log('FINANCES', '📊 Obteniendo estadísticas financieras...');
        res.json({
            success: true,
            data: { ingresosTotales: 0, gastosTotales: 0, utilidadNeta: 0, pagosPendientes: 0 }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('FINANCES', '❌ Error obteniendo estadísticas:', (0, sanitized_errors_1.sanitizeError)(error, 'finances'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas financieras' });
    }
});
exports.default = router;
//# sourceMappingURL=finances.js.map