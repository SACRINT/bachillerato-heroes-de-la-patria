/**
 * 📝 AUDIT SERVICE - TypeScript Version
 * Sistema de auditoría y logging de acciones
 * Refactorizado: 07 Diciembre 2025
 */
import { Request, Response, NextFunction } from 'express';
export interface AuditActions {
    CREATE: 'create';
    READ: 'read';
    UPDATE: 'update';
    DELETE: 'delete';
    LOGIN: 'login';
    LOGOUT: 'logout';
    EXPORT: 'export';
    IMPORT: 'import';
}
export interface AuditLogParams {
    userId: number;
    action: string;
    entity: string;
    entityId?: number | string;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
export interface AuditRecord {
    id: number;
    user_id: number;
    action: string;
    entity: string;
    entity_id?: number;
    old_data?: Record<string, any>;
    new_data?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    created_at: Date;
}
export interface AuditQueryOptions {
    page?: number;
    limit?: number;
    action?: string;
    startDate?: Date | string;
    endDate?: Date | string;
}
export interface AuditStats {
    total_actions: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
    by_user: Record<number, number>;
}
export interface AuditResult {
    success: boolean;
    data?: AuditRecord[];
    pagination?: {
        page: number;
        limit: number;
    };
}
declare class AuditService {
    actions: AuditActions;
    constructor();
    log(params: AuditLogParams): Promise<AuditRecord | null>;
    getByUser(userId: number, options?: AuditQueryOptions): Promise<AuditResult>;
    getByEntity(entity: string, entityId: number | string, options?: AuditQueryOptions): Promise<AuditResult>;
    getStats(options?: Pick<AuditQueryOptions, 'startDate' | 'endDate'>): Promise<{
        success: boolean;
        data: AuditStats;
    }>;
    cleanup(daysToKeep?: number): Promise<number>;
    middleware(): (req: Request, res: Response, next: NextFunction) => void;
    getActionFromMethod(method: string): string;
    getEntityFromPath(path: string): string;
}
declare const auditService: AuditService;
export { AuditService };
export default auditService;
//# sourceMappingURL=audit.service.d.ts.map