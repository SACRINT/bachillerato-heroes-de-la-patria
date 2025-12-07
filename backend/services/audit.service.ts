/**
 * 📝 AUDIT SERVICE - TypeScript Version
 * Sistema de auditoría y logging de acciones
 * Refactorizado: 07 Diciembre 2025
 */

import { Request, Response, NextFunction } from 'express';
const AuditDAO = require('../data/audit.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// AUDIT SERVICE CLASS
// ============================================

class AuditService {
    public actions: AuditActions;

    constructor() {
        this.actions = {
            CREATE: 'create',
            READ: 'read',
            UPDATE: 'update',
            DELETE: 'delete',
            LOGIN: 'login',
            LOGOUT: 'logout',
            EXPORT: 'export',
            IMPORT: 'import'
        };
    }

    async log(params: AuditLogParams): Promise<AuditRecord | null> {
        const { userId, action, entity, entityId, oldData, newData, ipAddress, userAgent, metadata } = params;
        try {
            return await AuditDAO.log(userId, action, entity, entityId, oldData, newData, ipAddress, userAgent, metadata);
        } catch (error: any) {
            devLogger.error('[Audit] Error al registrar:', error.message);
            return null;
        }
    }

    async getByUser(userId: number, options: AuditQueryOptions = {}): Promise<AuditResult> {
        const { page = 1, limit = 50, action, startDate, endDate } = options;
        const data = await AuditDAO.getByUser(userId, action, startDate, endDate, limit, (page - 1) * limit);
        return { success: true, data, pagination: { page, limit } };
    }

    async getByEntity(entity: string, entityId: number | string, options: AuditQueryOptions = {}): Promise<AuditResult> {
        const { page = 1, limit = 50 } = options;
        const data = await AuditDAO.getByEntity(entity, entityId, limit, (page - 1) * limit);
        return { success: true, data };
    }

    async getStats(options: Pick<AuditQueryOptions, 'startDate' | 'endDate'> = {}): Promise<{ success: boolean; data: AuditStats }> {
        const { startDate, endDate } = options;
        const data = await AuditDAO.getStats(startDate, endDate);
        return { success: true, data };
    }

    async cleanup(daysToKeep: number = 90): Promise<number> {
        const count = await AuditDAO.cleanup(daysToKeep);
        devLogger.log(`[Audit] Limpiados ${count} registros antiguos`);
        return count;
    }

    middleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const originalJson = res.json.bind(res);
            res.json = (data: any) => {
                if (data && data.success && (req as any).user) {
                    this.log({
                        userId: (req as any).user.id,
                        action: this.getActionFromMethod(req.method),
                        entity: this.getEntityFromPath(req.path),
                        entityId: req.params.id,
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent')
                    });
                }
                return originalJson(data);
            };
            next();
        };
    }

    getActionFromMethod(method: string): string {
        const map: Record<string, string> = {
            GET: this.actions.READ,
            POST: this.actions.CREATE,
            PUT: this.actions.UPDATE,
            PATCH: this.actions.UPDATE,
            DELETE: this.actions.DELETE
        };
        return map[method] || 'unknown';
    }

    getEntityFromPath(path: string): string {
        const parts = path.split('/').filter(Boolean);
        return parts[1] || 'unknown';
    }
}

// ============================================
// EXPORTS
// ============================================

const auditService = new AuditService();

export { AuditService };
export default auditService;

module.exports = auditService;
module.exports.AuditService = AuditService;
