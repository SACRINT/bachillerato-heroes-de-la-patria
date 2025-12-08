/**
 * 💰 API DE FINANZAS - TypeScript
 * Gestión de ingresos, gastos y pagos pendientes
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import FinancesDAO from '../data/finances.dao';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface FinanceResumen {
    ingresosMes: number;
    pagosPendientes: number;
    tasaCobro: number;
    gastosMes: number;
    utilidadMes: number;
}

interface Ingreso {
    id: number;
    concepto: string;
    monto: number;
    fecha: string;
}

interface Gasto {
    id: number;
    concepto: string;
    monto: number;
    fecha: string;
}

interface PagoPendiente {
    id: number;
    descripcion: string;
    monto: number;
    fecha_vencimiento: string;
}

interface FinanceData {
    resumen: FinanceResumen;
    ingresos: Ingreso[];
    gastos: Gasto[];
    pagosPendientes: PagoPendiente[];
    tablasDisponibles: string[];
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/finances
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        debugLog.log('FINANCES', '💰 Obteniendo datos financieros...');
        const data = await FinancesDAO.getResumenCompleto() as FinanceData;

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

        debugLog.log('FINANCES', '✅ Datos financieros obtenidos');
    } catch (error) {
        debugLog.error('FINANCES', '❌ Error obteniendo datos financieros:', sanitizeError(error as Error, 'finances'));
        res.json({
            success: true,
            resumen: { ingresosMes: 0, pagosPendientes: 0, tasaCobro: 0, gastosMes: 0, utilidadMes: 0 },
            ingresos: [],
            gastos: [],
            pagosPendientes: [],
            estadisticas: {},
            configuracion: { ultimaActualizacion: new Date().toISOString(), version: "1.0", error: (error as Error).message }
        });
    }
});

/**
 * GET /api/finances/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        debugLog.log('FINANCES', '📊 Obteniendo estadísticas financieras...');
        res.json({
            success: true,
            data: { ingresosTotales: 0, gastosTotales: 0, utilidadNeta: 0, pagosPendientes: 0 }
        });
    } catch (error) {
        debugLog.error('FINANCES', '❌ Error obteniendo estadísticas:', sanitizeError(error as Error, 'finances'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas financieras' });
    }
});

export default router;
