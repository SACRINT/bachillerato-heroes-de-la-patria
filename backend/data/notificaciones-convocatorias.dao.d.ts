/**
 * 🔔 NOTIFICACIONES CONVOCATORIAS DAO - TypeScript
 * Capa de acceso a datos para suscripciones a convocatorias.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface ConvocatoriaSubscription {
    id: number;
    nombre: string;
    email: string;
    tipo_interes: string;
    status: string;
    ip_address: string;
    user_agent: string;
    fecha_suscripcion: Date;
    fecha_baja?: Date;
    verificado?: boolean;
}
export interface CreateSubscriptionInput {
    nombre: string;
    email: string;
    tipo_interes: string;
    ip_address: string;
    user_agent: string;
}
export interface SubscriptionFilter {
    status?: string;
    limit?: number;
    offset?: number;
}
export interface SubscriptionListResult {
    data: ConvocatoriaSubscription[];
    total: number;
}
export interface SubscriptionStats {
    total: number;
    activos: number;
    inactivos: number;
    cancelados: number;
    hoy: number;
    esta_semana: number;
    verificados: number;
    byTipo: Record<string, number>;
}
declare class NotificacionesConvocatoriasDAO {
    static getByEmail(email: string): Promise<{
        id: number;
        status: string;
    } | null>;
    static reactivate(email: string, data: Partial<CreateSubscriptionInput>): Promise<ConvocatoriaSubscription>;
    static create(data: CreateSubscriptionInput): Promise<ConvocatoriaSubscription>;
    static getAll({ status, limit, offset }: SubscriptionFilter): Promise<SubscriptionListResult>;
    static getStats(): Promise<SubscriptionStats>;
    static getById(id: number): Promise<ConvocatoriaSubscription | null>;
    static update(id: number, data: Partial<ConvocatoriaSubscription>): Promise<ConvocatoriaSubscription | null>;
    static cancel(id: number): Promise<{
        id: number;
        email: string;
    } | null>;
    static unsubscribeByEmail(email: string): Promise<{
        id: number;
    } | null>;
}
export default NotificacionesConvocatoriasDAO;
//# sourceMappingURL=notificaciones-convocatorias.dao.d.ts.map