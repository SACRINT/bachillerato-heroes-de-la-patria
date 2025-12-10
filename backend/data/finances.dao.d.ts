/**
 * 💰 FINANCES DAO - TypeScript
 * Capa de acceso a datos para módulo financiero
 * ✅ FASE 3 DAL - Refactorizado
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
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
    estudiante: string;
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
declare class FinancesDAO {
    /**
     * Verificar qué tablas financieras existen
     */
    static checkExistingTables(): Promise<string[]>;
    /**
     * Obtener ingresos recientes
     */
    static getIngresos(limit?: number): Promise<Ingreso[]>;
    /**
     * Obtener suma de ingresos del mes actual
     */
    static getIngresosMesActual(): Promise<number>;
    /**
     * Obtener gastos recientes
     */
    static getGastos(limit?: number): Promise<Gasto[]>;
    /**
     * Obtener suma de gastos del mes actual
     */
    static getGastosMesActual(): Promise<number>;
    /**
     * Obtener pagos pendientes
     */
    static getPagosPendientes(limit?: number): Promise<PagoPendiente[]>;
    /**
     * Obtener suma total de pagos pendientes
     */
    static getTotalPagosPendientes(): Promise<number>;
    /**
     * Obtener resumen financiero completo
     */
    static getResumenCompleto(): Promise<ResumenFinanciero>;
}
export default FinancesDAO;
//# sourceMappingURL=finances.dao.d.ts.map