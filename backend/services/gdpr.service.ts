/**
 * 🛡️ GDPR COMPLIANCE SERVICE - TypeScript Version
 * Sistema de cumplimiento GDPR
 * Refactorizado: 07 Diciembre 2025
 */

const GDPRDAO = require('../data/gdpr.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export type ConsentType = 'essential' | 'marketing' | 'analytics' | 'third_party';

export interface ConsentRecord {
    id: number;
    user_id: number;
    essential: boolean;
    marketing: boolean;
    analytics: boolean;
    third_party: boolean;
    ip_address?: string;
    created_at: Date;
    updated_at: Date;
}

export interface ConsentData {
    essential?: boolean;
    marketing?: boolean;
    analytics?: boolean;
    third_party?: boolean;
    ip_address?: string;
}

export interface UserExportData {
    usuario?: Record<string, any>;
    estudiante?: Record<string, any>;
    calificaciones?: any[];
    asistencias?: any[];
    notificaciones?: any[];
    actividad?: any[];
}

export interface ExportResult {
    success: boolean;
    data: UserExportData;
    exportedAt: string;
    format: string;
}

export interface DeleteOptions {
    keepAuditLogs?: boolean;
}

export interface DeleteResult {
    success: boolean;
    message: string;
    deletedAt: string;
}

export interface GDPRRequest {
    id: number;
    user_id: number;
    type: string;
    status: string;
    details?: Record<string, any>;
    created_at: Date;
}

export interface RequestsQueryOptions {
    userId?: number;
    status?: string;
    page?: number;
    limit?: number;
}

export interface RetentionResult {
    success: boolean;
    deleted: number;
    appliedAt: string;
}

// ============================================
// GDPR SERVICE CLASS
// ============================================

class GDPRService {
    public consentTypes: ConsentType[];

    constructor() {
        this.consentTypes = ['essential', 'marketing', 'analytics', 'third_party'];
    }

    async recordConsent(userId: number, consents: ConsentData): Promise<{ success: boolean; consentId: number }> {
        const consentId = await GDPRDAO.recordConsent(userId, consents, consents.ip_address);
        devLogger.log(`[GDPR] Consentimiento registrado para usuario ${userId}`);
        return { success: true, consentId };
    }

    async getConsent(userId: number): Promise<{ success: boolean; consent: ConsentRecord | null }> {
        return { success: true, consent: await GDPRDAO.getConsent(userId) };
    }

    async exportUserData(userId: number): Promise<ExportResult> {
        devLogger.log(`[GDPR] Exportando datos del usuario ${userId}`);

        const data: UserExportData = {};

        data.usuario = await GDPRDAO.getUser(userId);
        data.estudiante = await GDPRDAO.getStudentData(userId);

        if (data.estudiante) {
            data.calificaciones = await GDPRDAO.getGrades(userId);
            data.asistencias = await GDPRDAO.getAttendance(userId);
        }

        data.notificaciones = await GDPRDAO.getNotifications(userId);
        data.actividad = await GDPRDAO.getActivity(userId);

        return {
            success: true,
            data,
            exportedAt: new Date().toISOString(),
            format: 'JSON'
        };
    }

    async deleteUserData(userId: number, options: DeleteOptions = {}): Promise<DeleteResult> {
        const { keepAuditLogs = true } = options;

        devLogger.log(`[GDPR] Eliminando datos del usuario ${userId}`);

        try {
            await GDPRDAO.deleteUserData(userId, keepAuditLogs);
            await this.logRequest(userId, 'delete', 'completed');

            return {
                success: true,
                message: 'Datos eliminados exitosamente',
                deletedAt: new Date().toISOString()
            };
        } catch (error: any) {
            devLogger.error('[GDPR] Error eliminando datos:', error.message);
            throw error;
        }
    }

    async logRequest(userId: number, type: string, status: string, details: Record<string, any> | null = null): Promise<void> {
        await GDPRDAO.logRequest(userId, type, status, details);
    }

    async getRequests(options: RequestsQueryOptions = {}): Promise<{ success: boolean; requests: GDPRRequest[] }> {
        const { userId, status, page = 1, limit = 50 } = options;
        const requests = await GDPRDAO.getRequests(userId, status, limit, (page - 1) * limit);
        return { success: true, requests };
    }

    async applyRetentionPolicy(daysToKeep: number = 365): Promise<RetentionResult> {
        devLogger.log(`[GDPR] Aplicando política de retención (${daysToKeep} días)`);
        const deleted = await GDPRDAO.applyRetentionPolicy(daysToKeep);
        return {
            success: true,
            deleted,
            appliedAt: new Date().toISOString()
        };
    }
}

// ============================================
// EXPORTS
// ============================================

const gdprService = new GDPRService();

export { GDPRService };
export default gdprService;

module.exports = gdprService;
module.exports.GDPRService = GDPRService;
