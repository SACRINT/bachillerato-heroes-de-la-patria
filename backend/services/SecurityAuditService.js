/**
 * Servicio de Auditoría de Seguridad
 * BGE Héroes de la Patria
 * FASE 4 - Semana 27-28
 *
 * Registro de eventos de seguridad para compliance y análisis
 */

const pool = require('../data/database-access').pool;

class SecurityAuditService {
    constructor() {
        // Eventos en memoria (buffer antes de persistir)
        this.eventBuffer = [];
        this.bufferMaxSize = 100;
        this.flushIntervalMs = 30000; // 30 segundos

        // Tipos de eventos
        this.eventTypes = {
            // Autenticación
            LOGIN_SUCCESS: 'login_success',
            LOGIN_FAILURE: 'login_failure',
            LOGOUT: 'logout',
            PASSWORD_CHANGE: 'password_change',
            PASSWORD_RESET_REQUEST: 'password_reset_request',
            PASSWORD_RESET_COMPLETE: 'password_reset_complete',
            SESSION_EXPIRED: 'session_expired',
            TOKEN_REFRESH: 'token_refresh',

            // Acceso
            ACCESS_DENIED: 'access_denied',
            PERMISSION_DENIED: 'permission_denied',
            INVALID_TOKEN: 'invalid_token',
            SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',

            // Datos
            DATA_ACCESS: 'data_access',
            DATA_EXPORT: 'data_export',
            DATA_MODIFY: 'data_modify',
            DATA_DELETE: 'data_delete',
            BULK_OPERATION: 'bulk_operation',

            // Seguridad
            ATTACK_DETECTED: 'attack_detected',
            RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
            IP_BLOCKED: 'ip_blocked',
            ACCOUNT_LOCKED: 'account_locked',
            SUSPICIOUS_ACTIVITY: 'suspicious_activity',

            // Admin
            ADMIN_ACTION: 'admin_action',
            CONFIG_CHANGE: 'config_change',
            USER_CREATE: 'user_create',
            USER_DELETE: 'user_delete',
            ROLE_CHANGE: 'role_change',
            PERMISSION_CHANGE: 'permission_change',

            // Sistema
            SYSTEM_ERROR: 'system_error',
            BACKUP_CREATED: 'backup_created',
            MAINTENANCE_MODE: 'maintenance_mode'
        };

        // Niveles de severidad
        this.severityLevels = {
            DEBUG: 0,
            INFO: 1,
            WARNING: 2,
            ERROR: 3,
            CRITICAL: 4
        };

        // Iniciar flush automático
        this.flushInterval = setInterval(() => {
            this.flush().catch(err => {
                console.error('[SECURITY-AUDIT] Error en flush automático:', err);
            });
        }, this.flushIntervalMs);

        console.log('[SECURITY-AUDIT] Servicio de auditoría inicializado');
    }

    /**
     * Registrar evento de auditoría
     */
    async log(eventType, data = {}) {
        const event = {
            id: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType,
            severity: this.determineSeverity(eventType),
            userId: data.userId || null,
            ip: data.ip || null,
            userAgent: data.userAgent || null,
            resource: data.resource || null,
            action: data.action || null,
            details: data.details || {},
            success: data.success !== undefined ? data.success : true,
            metadata: {
                sessionId: data.sessionId || null,
                requestId: data.requestId || null,
                duration: data.duration || null
            }
        };

        this.eventBuffer.push(event);

        // Flush si el buffer está lleno
        if (this.eventBuffer.length >= this.bufferMaxSize) {
            await this.flush();
        }

        // Log inmediato para eventos críticos
        if (event.severity >= this.severityLevels.ERROR) {
            console.warn(`[SECURITY-AUDIT] ${event.eventType}:`, JSON.stringify(event.details));
        }

        return event;
    }

    /**
     * Helpers para tipos comunes de eventos
     */
    async logLogin(userId, ip, success, details = {}) {
        return this.log(
            success ? this.eventTypes.LOGIN_SUCCESS : this.eventTypes.LOGIN_FAILURE,
            { userId, ip, success, details }
        );
    }

    async logAccessDenied(userId, ip, resource, reason) {
        return this.log(this.eventTypes.ACCESS_DENIED, {
            userId,
            ip,
            resource,
            success: false,
            details: { reason }
        });
    }

    async logDataAccess(userId, resource, action, details = {}) {
        return this.log(this.eventTypes.DATA_ACCESS, {
            userId,
            resource,
            action,
            details
        });
    }

    async logAdminAction(userId, action, targetResource, details = {}) {
        return this.log(this.eventTypes.ADMIN_ACTION, {
            userId,
            action,
            resource: targetResource,
            details
        });
    }

    async logSecurityThreat(ip, threatType, details = {}) {
        return this.log(this.eventTypes.ATTACK_DETECTED, {
            ip,
            success: false,
            details: { threatType, ...details }
        });
    }

    /**
     * Determinar severidad según tipo de evento
     */
    determineSeverity(eventType) {
        const criticalEvents = [
            this.eventTypes.ATTACK_DETECTED,
            this.eventTypes.SESSION_HIJACK_ATTEMPT,
            this.eventTypes.SYSTEM_ERROR
        ];

        const errorEvents = [
            this.eventTypes.LOGIN_FAILURE,
            this.eventTypes.ACCESS_DENIED,
            this.eventTypes.PERMISSION_DENIED,
            this.eventTypes.INVALID_TOKEN,
            this.eventTypes.ACCOUNT_LOCKED,
            this.eventTypes.IP_BLOCKED
        ];

        const warningEvents = [
            this.eventTypes.RATE_LIMIT_EXCEEDED,
            this.eventTypes.SUSPICIOUS_ACTIVITY,
            this.eventTypes.PASSWORD_RESET_REQUEST
        ];

        if (criticalEvents.includes(eventType)) return this.severityLevels.CRITICAL;
        if (errorEvents.includes(eventType)) return this.severityLevels.ERROR;
        if (warningEvents.includes(eventType)) return this.severityLevels.WARNING;
        return this.severityLevels.INFO;
    }

    /**
     * Generar ID único para evento
     */
    generateEventId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `evt_${timestamp}_${random}`;
    }

    /**
     * Persistir eventos en BD
     */
    async flush() {
        if (this.eventBuffer.length === 0) return 0;

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        try {
            // Insertar en lote
            const values = events.map(e => [
                e.id,
                e.timestamp,
                e.eventType,
                e.severity,
                e.userId,
                e.ip,
                e.userAgent,
                e.resource,
                e.action,
                JSON.stringify(e.details),
                e.success,
                JSON.stringify(e.metadata)
            ]);

            const placeholders = values.map((_, i) => {
                const offset = i * 12;
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
            }).join(', ');

            const flatValues = values.flat();

            await pool.query(`
                INSERT INTO security_audit_logs (
                    event_id, timestamp, event_type, severity, user_id, ip_address,
                    user_agent, resource, action, details, success, metadata
                ) VALUES ${placeholders}
            `, flatValues);

            return events.length;
        } catch (error) {
            // En caso de error, volver a agregar al buffer
            console.error('[SECURITY-AUDIT] Error persistiendo eventos:', error);
            this.eventBuffer.unshift(...events);
            throw error;
        }
    }

    /**
     * Consultar logs de auditoría
     */
    async query(filters = {}, options = {}) {
        const {
            eventType,
            userId,
            ip,
            severity,
            success,
            startDate,
            endDate,
            resource
        } = filters;

        const {
            page = 1,
            limit = 50,
            sortBy = 'timestamp',
            sortOrder = 'DESC'
        } = options;

        let query = 'SELECT * FROM security_audit_logs WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (eventType) {
            query += ` AND event_type = $${paramIndex++}`;
            params.push(eventType);
        }

        if (userId) {
            query += ` AND user_id = $${paramIndex++}`;
            params.push(userId);
        }

        if (ip) {
            query += ` AND ip_address = $${paramIndex++}`;
            params.push(ip);
        }

        if (severity !== undefined) {
            query += ` AND severity >= $${paramIndex++}`;
            params.push(severity);
        }

        if (success !== undefined) {
            query += ` AND success = $${paramIndex++}`;
            params.push(success);
        }

        if (startDate) {
            query += ` AND timestamp >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND timestamp <= $${paramIndex++}`;
            params.push(endDate);
        }

        if (resource) {
            query += ` AND resource LIKE $${paramIndex++}`;
            params.push(`%${resource}%`);
        }

        // Ordenamiento
        const validSortFields = ['timestamp', 'severity', 'event_type'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'timestamp';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField} ${order}`;

        // Paginación
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = query.replace(/SELECT \*/, 'SELECT COUNT(*)').split('ORDER BY')[0];
        const countResult = await pool.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].count);

        return {
            logs: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener resumen de eventos por período
     */
    async getSummary(startDate, endDate) {
        const result = await pool.query(`
            SELECT
                event_type,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE success = false) as failures,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT ip_address) as unique_ips
            FROM security_audit_logs
            WHERE timestamp >= $1 AND timestamp <= $2
            GROUP BY event_type
            ORDER BY count DESC
        `, [startDate, endDate]);

        return result.rows;
    }

    /**
     * Obtener eventos sospechosos recientes
     */
    async getSuspiciousActivity(hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const result = await pool.query(`
            SELECT
                ip_address,
                COUNT(*) as total_events,
                COUNT(*) FILTER (WHERE success = false) as failures,
                COUNT(*) FILTER (WHERE event_type = 'login_failure') as login_failures,
                COUNT(*) FILTER (WHERE severity >= 3) as high_severity,
                array_agg(DISTINCT event_type) as event_types
            FROM security_audit_logs
            WHERE timestamp >= $1
            GROUP BY ip_address
            HAVING COUNT(*) FILTER (WHERE success = false) > 5
                OR COUNT(*) FILTER (WHERE event_type = 'login_failure') > 3
            ORDER BY failures DESC
        `, [since]);

        return result.rows;
    }

    /**
     * Obtener timeline de eventos de un usuario
     */
    async getUserTimeline(userId, limit = 100) {
        const result = await pool.query(`
            SELECT *
            FROM security_audit_logs
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2
        `, [userId, limit]);

        return result.rows;
    }

    /**
     * Exportar logs (para compliance)
     */
    async exportLogs(filters, format = 'json') {
        const result = await this.query(filters, { limit: 10000 });

        if (format === 'csv') {
            const headers = [
                'event_id', 'timestamp', 'event_type', 'severity',
                'user_id', 'ip_address', 'resource', 'action', 'success'
            ].join(',');

            const rows = result.logs.map(log =>
                [
                    log.event_id,
                    log.timestamp,
                    log.event_type,
                    log.severity,
                    log.user_id || '',
                    log.ip_address || '',
                    log.resource || '',
                    log.action || '',
                    log.success
                ].join(',')
            );

            return headers + '\n' + rows.join('\n');
        }

        return result.logs;
    }

    /**
     * Limpiar logs antiguos
     */
    async cleanup(retentionDays = 90) {
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

        const result = await pool.query(`
            DELETE FROM security_audit_logs
            WHERE timestamp < $1
            RETURNING event_id
        `, [cutoffDate]);

        console.log(`[SECURITY-AUDIT] Eliminados ${result.rowCount} logs antiguos`);
        return result.rowCount;
    }

    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            bufferSize: this.eventBuffer.length,
            bufferMaxSize: this.bufferMaxSize,
            flushIntervalMs: this.flushIntervalMs,
            eventTypes: Object.keys(this.eventTypes).length,
            severityLevels: Object.keys(this.severityLevels)
        };
    }

    /**
     * Detener servicio
     */
    async stop() {
        clearInterval(this.flushInterval);
        await this.flush();
        console.log('[SECURITY-AUDIT] Servicio detenido');
    }
}

module.exports = new SecurityAuditService();
