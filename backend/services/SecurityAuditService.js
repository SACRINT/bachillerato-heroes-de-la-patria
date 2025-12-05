/**
 * 🔒 SECURITY AUDIT SERVICE - v2.0.0
 * Servicio de Auditoría de Seguridad BGE
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar SecurityAuditDAO
 * - Sin SQL directo en el servicio
 */

const SecurityAuditDAO = require('../data/security-audit.dao');

class SecurityAuditService {
    constructor() {
        this.eventBuffer = [];
        this.bufferMaxSize = 100;
        this.flushIntervalMs = 30000;
        this.eventTypes = {
            LOGIN_SUCCESS: 'login_success', LOGIN_FAILURE: 'login_failure', LOGOUT: 'logout',
            PASSWORD_CHANGE: 'password_change', PASSWORD_RESET_REQUEST: 'password_reset_request',
            PASSWORD_RESET_COMPLETE: 'password_reset_complete', SESSION_EXPIRED: 'session_expired', TOKEN_REFRESH: 'token_refresh',
            ACCESS_DENIED: 'access_denied', PERMISSION_DENIED: 'permission_denied', INVALID_TOKEN: 'invalid_token', SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',
            DATA_ACCESS: 'data_access', DATA_EXPORT: 'data_export', DATA_MODIFY: 'data_modify', DATA_DELETE: 'data_delete', BULK_OPERATION: 'bulk_operation',
            ATTACK_DETECTED: 'attack_detected', RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded', IP_BLOCKED: 'ip_blocked', ACCOUNT_LOCKED: 'account_locked', SUSPICIOUS_ACTIVITY: 'suspicious_activity',
            ADMIN_ACTION: 'admin_action', CONFIG_CHANGE: 'config_change', USER_CREATE: 'user_create', USER_DELETE: 'user_delete', ROLE_CHANGE: 'role_change', PERMISSION_CHANGE: 'permission_change',
            SYSTEM_ERROR: 'system_error', BACKUP_CREATED: 'backup_created', MAINTENANCE_MODE: 'maintenance_mode'
        };
        this.severityLevels = { DEBUG: 0, INFO: 1, WARNING: 2, ERROR: 3, CRITICAL: 4 };
        this.flushInterval = setInterval(() => { this.flush().catch(err => console.error('[SECURITY-AUDIT] Error en flush:', err)); }, this.flushIntervalMs);
        console.log('[SECURITY-AUDIT] Servicio de auditoría inicializado');
    }

    async log(eventType, data = {}) {
        const event = {
            id: this.generateEventId(), timestamp: new Date().toISOString(), eventType,
            severity: this.determineSeverity(eventType), userId: data.userId || null, ip: data.ip || null,
            userAgent: data.userAgent || null, resource: data.resource || null, action: data.action || null,
            details: data.details || {}, success: data.success !== undefined ? data.success : true,
            metadata: { sessionId: data.sessionId || null, requestId: data.requestId || null, duration: data.duration || null }
        };
        this.eventBuffer.push(event);
        if (this.eventBuffer.length >= this.bufferMaxSize) await this.flush();
        if (event.severity >= this.severityLevels.ERROR) console.warn(`[SECURITY-AUDIT] ${event.eventType}:`, JSON.stringify(event.details));
        return event;
    }

    async logLogin(userId, ip, success, details = {}) { return this.log(success ? this.eventTypes.LOGIN_SUCCESS : this.eventTypes.LOGIN_FAILURE, { userId, ip, success, details }); }
    async logAccessDenied(userId, ip, resource, reason) { return this.log(this.eventTypes.ACCESS_DENIED, { userId, ip, resource, success: false, details: { reason } }); }
    async logDataAccess(userId, resource, action, details = {}) { return this.log(this.eventTypes.DATA_ACCESS, { userId, resource, action, details }); }
    async logAdminAction(userId, action, targetResource, details = {}) { return this.log(this.eventTypes.ADMIN_ACTION, { userId, action, resource: targetResource, details }); }
    async logSecurityThreat(ip, threatType, details = {}) { return this.log(this.eventTypes.ATTACK_DETECTED, { ip, success: false, details: { threatType, ...details } }); }

    determineSeverity(eventType) {
        const critical = [this.eventTypes.ATTACK_DETECTED, this.eventTypes.SESSION_HIJACK_ATTEMPT, this.eventTypes.SYSTEM_ERROR];
        const error = [this.eventTypes.LOGIN_FAILURE, this.eventTypes.ACCESS_DENIED, this.eventTypes.PERMISSION_DENIED, this.eventTypes.INVALID_TOKEN, this.eventTypes.ACCOUNT_LOCKED, this.eventTypes.IP_BLOCKED];
        const warning = [this.eventTypes.RATE_LIMIT_EXCEEDED, this.eventTypes.SUSPICIOUS_ACTIVITY, this.eventTypes.PASSWORD_RESET_REQUEST];
        if (critical.includes(eventType)) return this.severityLevels.CRITICAL;
        if (error.includes(eventType)) return this.severityLevels.ERROR;
        if (warning.includes(eventType)) return this.severityLevels.WARNING;
        return this.severityLevels.INFO;
    }

    generateEventId() { return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`; }

    async flush() {
        if (this.eventBuffer.length === 0) return 0;
        const events = [...this.eventBuffer]; this.eventBuffer = [];
        try { return await SecurityAuditDAO.insertEventsBatch(events); }
        catch (error) { console.error('[SECURITY-AUDIT] Error persistiendo:', error); this.eventBuffer.unshift(...events); throw error; }
    }

    async query(filters = {}, options = {}) {
        const { eventType, userId, ip, severity, success, startDate, endDate, resource } = filters;
        const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = 'DESC' } = options;
        let query = 'SELECT * FROM security_audit_logs WHERE 1=1'; const params = []; let idx = 1;
        if (eventType) { query += ` AND event_type = $${idx++}`; params.push(eventType); }
        if (userId) { query += ` AND user_id = $${idx++}`; params.push(userId); }
        if (ip) { query += ` AND ip_address = $${idx++}`; params.push(ip); }
        if (severity !== undefined) { query += ` AND severity >= $${idx++}`; params.push(severity); }
        if (success !== undefined) { query += ` AND success = $${idx++}`; params.push(success); }
        if (startDate) { query += ` AND timestamp >= $${idx++}`; params.push(startDate); }
        if (endDate) { query += ` AND timestamp <= $${idx++}`; params.push(endDate); }
        if (resource) { query += ` AND resource LIKE $${idx++}`; params.push(`%${resource}%`); }
        const validSort = ['timestamp', 'severity', 'event_type'];
        query += ` ORDER BY ${validSort.includes(sortBy) ? sortBy : 'timestamp'} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
        query += ` LIMIT $${idx++} OFFSET $${idx++}`; params.push(limit, (page - 1) * limit);
        const logs = await SecurityAuditDAO.query(query, params);
        const countQuery = query.replace(/SELECT \*/, 'SELECT COUNT(*)').split('ORDER BY')[0];
        const total = await SecurityAuditDAO.count(countQuery, params.slice(0, -2));
        return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async getSummary(startDate, endDate) { return SecurityAuditDAO.getSummary(startDate, endDate); }
    async getSuspiciousActivity(hours = 24) { return SecurityAuditDAO.getSuspiciousActivity(new Date(Date.now() - hours * 3600000).toISOString()); }
    async getUserTimeline(userId, limit = 100) { return SecurityAuditDAO.getUserTimeline(userId, limit); }

    async exportLogs(filters, format = 'json') {
        const result = await this.query(filters, { limit: 10000 });
        if (format === 'csv') {
            const headers = 'event_id,timestamp,event_type,severity,user_id,ip_address,resource,action,success';
            const rows = result.logs.map(l => [l.event_id, l.timestamp, l.event_type, l.severity, l.user_id || '', l.ip_address || '', l.resource || '', l.action || '', l.success].join(','));
            return headers + '\n' + rows.join('\n');
        }
        return result.logs;
    }

    async cleanup(retentionDays = 90) {
        const deleted = await SecurityAuditDAO.cleanup(new Date(Date.now() - retentionDays * 86400000).toISOString());
        console.log(`[SECURITY-AUDIT] Eliminados ${deleted} logs antiguos`);
        return deleted;
    }

    getStats() { return { bufferSize: this.eventBuffer.length, bufferMaxSize: this.bufferMaxSize, flushIntervalMs: this.flushIntervalMs, eventTypes: Object.keys(this.eventTypes).length, severityLevels: Object.keys(this.severityLevels) }; }
    async stop() { clearInterval(this.flushInterval); await this.flush(); console.log('[SECURITY-AUDIT] Servicio detenido'); }
}

module.exports = new SecurityAuditService();
