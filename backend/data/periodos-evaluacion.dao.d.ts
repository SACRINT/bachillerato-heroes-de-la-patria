/**
 * 📅 PERIODOS EVALUACION DAO - TypeScript
 * Acceso a datos para los periodos de evaluación (Parciales)
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface PeriodoEvaluacion {
    id: number;
    nombre: string;
    codigo: string;
    ciclo_escolar: string;
    fecha_inicio_captura?: Date;
    fecha_fin_captura?: Date;
    estado: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreatePeriodoInput {
    nombre: string;
    codigo: string;
    ciclo_escolar: string;
    fecha_inicio_captura?: Date;
    fecha_fin_captura?: Date;
    estado?: string;
}
export interface PeriodoFilter {
    cicloEscolar?: string;
    estado?: string;
}
declare class PeriodosEvaluacionDAO {
    /**
     * Obtener periodo por ID
     */
    static get(id: number): Promise<PeriodoEvaluacion | null>;
    /**
     * Obtener periodo por código y ciclo (e.g., 'P1', '2025-2026')
     */
    static getByCodigo(codigo: string, cicloEscolar: string): Promise<PeriodoEvaluacion | null>;
    /**
     * Listar todos los periodos (ordenado por fecha)
     */
    static list(filters?: PeriodoFilter): Promise<PeriodoEvaluacion[]>;
    /**
     * Crear nuevo periodo
     */
    static create(data: CreatePeriodoInput): Promise<PeriodoEvaluacion>;
    /**
     * Actualizar periodo
     */
    static update(id: number, data: Partial<PeriodoEvaluacion>): Promise<PeriodoEvaluacion>;
}
export default PeriodosEvaluacionDAO;
//# sourceMappingURL=periodos-evaluacion.dao.d.ts.map