"use strict";
/**
 * 🛡️ GDPR COMPLIANCE SERVICE - TypeScript Version
 * Sistema de cumplimiento GDPR
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDPRService = void 0;
const GDPRDAO = require('../data/gdpr.dao.js');
const devLogger = require('../utils/devLogger.js');
// ============================================
// GDPR SERVICE CLASS
// ============================================
class GDPRService {
    constructor() {
        this.consentTypes = ['essential', 'marketing', 'analytics', 'third_party'];
    }
    async recordConsent(userId, consents) {
        const consentId = await GDPRDAO.recordConsent(userId, consents, consents.ip_address);
        devLogger.log(`[GDPR] Consentimiento registrado para usuario ${userId}`);
        return { success: true, consentId };
    }
    async getConsent(userId) {
        return { success: true, consent: await GDPRDAO.getConsent(userId) };
    }
    async exportUserData(userId) {
        devLogger.log(`[GDPR] Exportando datos del usuario ${userId}`);
        const data = {};
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
    async deleteUserData(userId, options = {}) {
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
        }
        catch (error) {
            devLogger.error('[GDPR] Error eliminando datos:', error.message);
            throw error;
        }
    }
    async logRequest(userId, type, status, details = null) {
        await GDPRDAO.logRequest(userId, type, status, details);
    }
    async getRequests(options = {}) {
        const { userId, status, page = 1, limit = 50 } = options;
        const requests = await GDPRDAO.getRequests(userId, status, limit, (page - 1) * limit);
        return { success: true, requests };
    }
    async applyRetentionPolicy(daysToKeep = 365) {
        devLogger.log(`[GDPR] Aplicando política de retención (${daysToKeep} días)`);
        const deleted = await GDPRDAO.applyRetentionPolicy(daysToKeep);
        return {
            success: true,
            deleted,
            appliedAt: new Date().toISOString()
        };
    }
}
exports.GDPRService = GDPRService;
// ============================================
// EXPORTS
// ============================================
const gdprService = new GDPRService();
exports.default = gdprService;
module.exports = gdprService;
module.exports.GDPRService = GDPRService;
//# sourceMappingURL=gdpr.service.js.map