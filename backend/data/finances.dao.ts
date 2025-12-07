/**
 * 💰 FINANCES DAO - TypeScript
 * Capa de acceso a datos para módulo financiero
 * ✅ FASE 3 DAL - Refactorizado
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface Ingreso {
    id: number;
    concepto: string;
    categoria: string;
    monto: number;
    fecha: Date;
    estado: string;
    notas?: string;
    created_at: Date;
}

export interface Gasto {
    id: number;
    concepto: string;
    categoria: string;
    monto: number;
    fecha: Date;
    estado: string;
    proveedor?: string;
    notas?: string;
    created_at: Date;
}

export interface PagoPendiente {
    id: number;
    estudiante: string; // Likely name or ID depending on schema, keeping as string based on usage
    concepto: string;
    monto: number;
    fecha_vencimiento: Date;
    estado: string;
    notas?: string;
    created_at: Date;
}

export interface ResumenFinanciero {
    resumen: {
        ingresosMes: number;
        pagosPendientes: number;
        tasaCobro: number;
        gastosMes: number;
        utilidadMes: number;
    };
    ingresos: Ingreso[];
    gastos: Gasto[];
    pagosPendientes: PagoPendiente[];
    tablasDisponibles: string[];
}

// =====================================================
// FINANCES DAO CLASS
// =====================================================

class FinancesDAO {
    /**
     * Verificar qué tablas financieras existen
     */
    static async checkExistingTables(): Promise<string[]> {
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('ingresos', 'gastos', 'pagos_pendientes')
        `);
        return result.rows.map((r: any) => r.table_name);
    }

    /**
     * Obtener ingresos recientes
     */
    static async getIngresos(limit: number = 100): Promise<Ingreso[]> {
        const result = await pool.query(`
            SELECT
                id, concepto, categoria, monto, fecha, estado, notas, created_at
            FROM ingresos
            ORDER BY fecha DESC
            LIMIT $1
        `, [limit]);
        return result.rows.map((row: any) => ({
            ...row,
            monto: parseFloat(row.monto)
        }));
    }

    /**
     * Obtener suma de ingresos del mes actual
     */
    static async getIngresosMesActual(): Promise<number> {
        const result = await pool.query(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM ingresos
            WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
            AND estado = 'Recibido'
        `);
        return parseFloat(result.rows[0].total);
    }

    /**
     * Obtener gastos recientes
     */
    static async getGastos(limit: number = 100): Promise<Gasto[]> {
        const result = await pool.query(`
            SELECT
                id, concepto, categoria, monto, fecha, estado, proveedor, notas, created_at
            FROM gastos
            ORDER BY fecha DESC
            LIMIT $1
        `, [limit]);
        return result.rows.map((row: any) => ({
            ...row,
            monto: parseFloat(row.monto)
        }));
    }

    /**
     * Obtener suma de gastos del mes actual
     */
    static async getGastosMesActual(): Promise<number> {
        const result = await pool.query(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM gastos
            WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
            AND estado = 'Pagado'
        `);
        return parseFloat(result.rows[0].total);
    }

    /**
     * Obtener pagos pendientes
     */
    static async getPagosPendientes(limit: number = 100): Promise<PagoPendiente[]> {
        const result = await pool.query(`
            SELECT
                id, estudiante, concepto, monto, fecha_vencimiento, estado, notas, created_at
            FROM pagos_pendientes
            WHERE estado = 'Pendiente'
            ORDER BY fecha_vencimiento ASC
            LIMIT $1
        `, [limit]);
        return result.rows.map((row: any) => ({
            ...row,
            monto: parseFloat(row.monto)
        }));
    }

    /**
     * Obtener suma total de pagos pendientes
     */
    static async getTotalPagosPendientes(): Promise<number> {
        const result = await pool.query(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM pagos_pendientes
            WHERE estado = 'Pendiente'
        `);
        return parseFloat(result.rows[0].total);
    }

    /**
     * Obtener resumen financiero completo
     */
    static async getResumenCompleto(): Promise<ResumenFinanciero> {
        const existingTables = await this.checkExistingTables();

        let ingresos: Ingreso[] = [];
        let gastos: Gasto[] = [];
        let pagosPendientes: PagoPendiente[] = [];
        let resumen = {
            ingresosMes: 0,
            pagosPendientes: 0,
            tasaCobro: 0,
            gastosMes: 0,
            utilidadMes: 0
        };

        if (existingTables.includes('ingresos')) {
            ingresos = await this.getIngresos();
            resumen.ingresosMes = await this.getIngresosMesActual();
        }

        if (existingTables.includes('gastos')) {
            gastos = await this.getGastos();
            resumen.gastosMes = await this.getGastosMesActual();
        }

        if (existingTables.includes('pagos_pendientes')) {
            pagosPendientes = await this.getPagosPendientes();
            resumen.pagosPendientes = await this.getTotalPagosPendientes();
        }

        resumen.utilidadMes = resumen.ingresosMes - resumen.gastosMes;

        if (resumen.ingresosMes > 0 || resumen.pagosPendientes > 0) {
            resumen.tasaCobro = Math.round(
                (resumen.ingresosMes / (resumen.ingresosMes + resumen.pagosPendientes)) * 100
            );
        }

        return {
            resumen,
            ingresos,
            gastos,
            pagosPendientes,
            tablasDisponibles: existingTables
        };
    }
}

export default FinancesDAO;
module.exports = FinancesDAO;
