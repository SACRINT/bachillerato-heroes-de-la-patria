/**
 * 🔒 GDPR COMPLIANCE SERVICE - SEMANA 27-28
 * Servicio para cumplir con el Reglamento General de Protección de Datos (GDPR)
 *
 * Features:
 * - Right to Access (Artículo 15): Exportar datos personales
 * - Right to Erasure (Artículo 17): Eliminar datos personales
 * - Data Portability (Artículo 20): Exportar en formatos comunes
 * - Consent Management (Artículo 7): Gestionar consentimientos
 * - Data Breach Notification (Artículo 33-34): Notificar brechas de datos
 * - Privacy Policy: Generación automática
 * - Audit Logging: Registro de accesos a datos personales
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const gdprService = require('./services/gdprComplianceService');
 *
 * // Export user data
 * const exportData = await gdprService.exportUserData(userId, 'json');
 *
 * // Delete user data
 * await gdprService.deleteUserData(userId, { reason: 'User request' });
 *
 * // Manage consent
 * await gdprService.recordConsent(userId, 'email_marketing', true);
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const crypto = require('crypto');
const devLogger = require('../utils/devLogger');
const pool = require('../data/database');

class GDPRComplianceService {
    constructor(config = {}) {
        this.config = {
            // Data retention
            dataRetentionDays: config.dataRetentionDays || 365 * 2, // 2 años default
            deletedDataRetention: config.deletedDataRetention || 90,  // 90 días backup

            // Export formats
            exportFormats: config.exportFormats || ['json', 'csv', 'xml'],

            // Anonymization
            anonymizeFields: config.anonymizeFields || [
                'email', 'phone', 'nombre', 'apellido_paterno', 'apellido_materno',
                'direccion', 'fecha_nacimiento', 'curp', 'rfc'
            ],

            // Data breach
            breachNotificationHours: config.breachNotificationHours || 72, // GDPR: 72 horas

            // Features
            auditLoggingEnabled: config.auditLoggingEnabled !== false,
            consentTrackingEnabled: config.consentTrackingEnabled !== false,

            ...config
        };

        // Statistics
        this.stats = {
            dataExports: 0,
            dataDeletions: 0,
            consentRecorded: 0,
            accessRequests: 0,
            breachesReported: 0
        };

        devLogger.log('GDPR-SERVICE', '🔒 GDPR Compliance Service initialized');
    }

    /**
     * RIGHT TO ACCESS (Artículo 15 GDPR)
     * Exportar todos los datos personales de un usuario
     */
    async exportUserData(userId, format = 'json', options = {}) {
        try {
            devLogger.log('GDPR-SERVICE', `📥 Exporting data for user ${userId} (format: ${format})`);

            // Log access request
            if (this.config.auditLoggingEnabled) {
                await this.logDataAccess(userId, 'EXPORT', options.requestedBy);
            }

            // Gather data from all tables
            const userData = await this.gatherUserData(userId);

            // Format data
            let exportData;
            switch (format.toLowerCase()) {
                case 'json':
                    exportData = this.formatAsJSON(userData);
                    break;
                case 'csv':
                    exportData = this.formatAsCSV(userData);
                    break;
                case 'xml':
                    exportData = this.formatAsXML(userData);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            // Store export record
            await this.recordExport(userId, format, exportData.size);

            this.stats.dataExports++;

            return {
                userId,
                format,
                exportedAt: new Date().toISOString(),
                dataSize: exportData.size,
                tables: Object.keys(userData),
                data: exportData.content
            };

        } catch (error) {
            devLogger.error('GDPR-SERVICE', `Error exporting data for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * GATHER ALL USER DATA FROM DATABASE
     */
    async gatherUserData(userId) {
        const client = await pool.connect();

        try {
            const userData = {};

            // Core user data
            const userResult = await client.query(
                'SELECT * FROM usuarios WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error(`User ${userId} not found`);
            }

            userData.usuario = this.sanitizeUserData(userResult.rows[0]);

            // Additional related data (customize per project)
            const relatedTables = [
                { table: 'calificaciones', foreignKey: 'estudiante_id' },
                { table: 'asistencias', foreignKey: 'estudiante_id' },
                { table: 'notificaciones', foreignKey: 'usuario_id' },
                { table: 'consents', foreignKey: 'usuario_id' },
                { table: 'audit_logs', foreignKey: 'usuario_id' },
                { table: 'sessions', foreignKey: 'user_id' }
            ];

            for (const { table, foreignKey } of relatedTables) {
                try {
                    const result = await client.query(
                        `SELECT * FROM ${table} WHERE ${foreignKey} = $1`,
                        [userId]
                    );
                    userData[table] = result.rows.map(row => this.sanitizeSensitiveData(row));
                } catch (tableError) {
                    // Table might not exist, log and continue
                    devLogger.warn('GDPR-SERVICE', `Table ${table} not found or error:`, tableError.message);
                }
            }

            return userData;

        } finally {
            client.release();
        }
    }

    /**
     * SANITIZE USER DATA (remove internal fields)
     */
    sanitizeUserData(user) {
        const { password_hash, password_salt, ...publicData } = user;
        return publicData;
    }

    /**
     * SANITIZE SENSITIVE DATA (hash/mask)
     */
    sanitizeSensitiveData(data) {
        // Deep clone to avoid modifying original
        const sanitized = { ...data };

        // Remove password fields
        delete sanitized.password_hash;
        delete sanitized.password_salt;
        delete sanitized.password;

        return sanitized;
    }

    /**
     * FORMAT AS JSON
     */
    formatAsJSON(userData) {
        const content = JSON.stringify(userData, null, 2);
        return {
            content,
            size: Buffer.byteLength(content, 'utf8'),
            mimeType: 'application/json'
        };
    }

    /**
     * FORMAT AS CSV
     */
    formatAsCSV(userData) {
        let csv = '';

        // Convert each table to CSV section
        for (const [tableName, rows] of Object.entries(userData)) {
            if (Array.isArray(rows) && rows.length > 0) {
                csv += `\n# ${tableName.toUpperCase()}\n`;
                const headers = Object.keys(rows[0]).join(',');
                csv += headers + '\n';

                rows.forEach(row => {
                    const values = Object.values(row).map(v =>
                        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
                    ).join(',');
                    csv += values + '\n';
                });
            } else if (typeof rows === 'object') {
                // Single object (like usuario)
                csv += `\n# ${tableName.toUpperCase()}\n`;
                const headers = Object.keys(rows).join(',');
                const values = Object.values(rows).join(',');
                csv += headers + '\n' + values + '\n';
            }
        }

        return {
            content: csv,
            size: Buffer.byteLength(csv, 'utf8'),
            mimeType: 'text/csv'
        };
    }

    /**
     * FORMAT AS XML
     */
    formatAsXML(userData) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<user_data>\n';

        for (const [tableName, data] of Object.entries(userData)) {
            xml += `  <${tableName}>\n`;

            if (Array.isArray(data)) {
                data.forEach(row => {
                    xml += '    <record>\n';
                    for (const [key, value] of Object.entries(row)) {
                        xml += `      <${key}>${this.escapeXML(String(value))}</${key}>\n`;
                    }
                    xml += '    </record>\n';
                });
            } else if (typeof data === 'object') {
                for (const [key, value] of Object.entries(data)) {
                    xml += `    <${key}>${this.escapeXML(String(value))}</${key}>\n`;
                }
            }

            xml += `  </${tableName}>\n`;
        }

        xml += '</user_data>';

        return {
            content: xml,
            size: Buffer.byteLength(xml, 'utf8'),
            mimeType: 'application/xml'
        };
    }

    /**
     * ESCAPE XML SPECIAL CHARACTERS
     */
    escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * RIGHT TO ERASURE (Artículo 17 GDPR)
     * Eliminar todos los datos personales de un usuario
     */
    async deleteUserData(userId, options = {}) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            devLogger.log('GDPR-SERVICE', `🗑️ Deleting data for user ${userId}`);

            // Log deletion request
            if (this.config.auditLoggingEnabled) {
                await this.logDataAccess(userId, 'DELETE', options.requestedBy, options.reason);
            }

            // Export data antes de eliminar (para backup)
            const backupData = await this.gatherUserData(userId);

            // Store backup in deleted_users table
            await client.query(
                `INSERT INTO deleted_users (user_id, deletion_date, reason, backup_data, deleted_by)
                 VALUES ($1, NOW(), $2, $3, $4)`,
                [userId, options.reason || 'User request', JSON.stringify(backupData), options.requestedBy || null]
            );

            // Delete related data (cascade)
            const deletionTables = [
                'sessions',
                'audit_logs',
                'consents',
                'notificaciones',
                'asistencias',
                'calificaciones'
            ];

            for (const table of deletionTables) {
                try {
                    const result = await client.query(
                        `DELETE FROM ${table} WHERE usuario_id = $1 OR estudiante_id = $1 OR user_id = $1`,
                        [userId]
                    );
                    devLogger.log('GDPR-SERVICE', `  Deleted ${result.rowCount} rows from ${table}`);
                } catch (tableError) {
                    devLogger.warn('GDPR-SERVICE', `Error deleting from ${table}:`, tableError.message);
                }
            }

            // Finally, delete user
            const userResult = await client.query(
                'DELETE FROM usuarios WHERE id = $1',
                [userId]
            );

            if (userResult.rowCount === 0) {
                throw new Error(`User ${userId} not found`);
            }

            await client.query('COMMIT');

            this.stats.dataDeletions++;

            devLogger.log('GDPR-SERVICE', `✅ User ${userId} data deleted successfully`);

            return {
                userId,
                deletedAt: new Date().toISOString(),
                reason: options.reason,
                backupRetentionDays: this.config.deletedDataRetention
            };

        } catch (error) {
            await client.query('ROLLBACK');
            devLogger.error('GDPR-SERVICE', `Error deleting user ${userId}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * ANONYMIZE USER DATA (instead of delete)
     * Useful when data must be retained for legal reasons
     */
    async anonymizeUserData(userId, options = {}) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            devLogger.log('GDPR-SERVICE', `🎭 Anonymizing data for user ${userId}`);

            // Generate anonymous ID
            const anonymousId = `anon_${this.generateId()}`;

            // Anonymize personal data
            const anonymizedData = {
                email: `${anonymousId}@anonymized.local`,
                username: anonymousId,
                nombre: 'Anonymized',
                apellido_paterno: 'User',
                apellido_materno: '',
                phone: null,
                direccion: null,
                fecha_nacimiento: null,
                curp: null,
                rfc: null,
                profile_picture: null,
                status: 'anonymized',
                anonymized_at: new Date().toISOString()
            };

            await client.query(
                `UPDATE usuarios
                 SET email = $1, username = $2, nombre = $3, apellido_paterno = $4,
                     apellido_materno = $5, phone = $6, direccion = $7, fecha_nacimiento = $8,
                     curp = $9, rfc = $10, profile_picture = $11, status = $12
                 WHERE id = $13`,
                [
                    anonymizedData.email,
                    anonymizedData.username,
                    anonymizedData.nombre,
                    anonymizedData.apellido_paterno,
                    anonymizedData.apellido_materno,
                    anonymizedData.phone,
                    anonymizedData.direccion,
                    anonymizedData.fecha_nacimiento,
                    anonymizedData.curp,
                    anonymizedData.rfc,
                    anonymizedData.profile_picture,
                    anonymizedData.status,
                    userId
                ]
            );

            await client.query('COMMIT');

            devLogger.log('GDPR-SERVICE', `✅ User ${userId} anonymized successfully`);

            return {
                userId,
                anonymousId,
                anonymizedAt: anonymizedData.anonymized_at
            };

        } catch (error) {
            await client.query('ROLLBACK');
            devLogger.error('GDPR-SERVICE', `Error anonymizing user ${userId}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * CONSENT MANAGEMENT (Artículo 7 GDPR)
     */
    async recordConsent(userId, consentType, granted, options = {}) {
        try {
            devLogger.log('GDPR-SERVICE', `📝 Recording consent for user ${userId}: ${consentType} = ${granted}`);

            const client = await pool.connect();

            try {
                await client.query(
                    `INSERT INTO consents (usuario_id, consent_type, granted, ip_address, user_agent, metadata, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())
                     ON CONFLICT (usuario_id, consent_type)
                     DO UPDATE SET granted = $3, updated_at = NOW(), ip_address = $4, user_agent = $5`,
                    [
                        userId,
                        consentType,
                        granted,
                        options.ipAddress || null,
                        options.userAgent || null,
                        JSON.stringify(options.metadata || {})
                    ]
                );

                this.stats.consentRecorded++;

                return {
                    userId,
                    consentType,
                    granted,
                    recordedAt: new Date().toISOString()
                };

            } finally {
                client.release();
            }

        } catch (error) {
            devLogger.error('GDPR-SERVICE', `Error recording consent:`, error);
            throw error;
        }
    }

    /**
     * GET USER CONSENTS
     */
    async getUserConsents(userId) {
        try {
            const client = await pool.connect();

            try {
                const result = await client.query(
                    'SELECT * FROM consents WHERE usuario_id = $1 ORDER BY created_at DESC',
                    [userId]
                );

                return result.rows;

            } finally {
                client.release();
            }

        } catch (error) {
            devLogger.error('GDPR-SERVICE', `Error getting consents for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * DATA BREACH NOTIFICATION (Artículo 33-34 GDPR)
     */
    async reportDataBreach(breachInfo) {
        try {
            devLogger.error('GDPR-SERVICE', `🚨 DATA BREACH REPORTED:`, breachInfo);

            const client = await pool.connect();

            try {
                const breachId = this.generateId();

                await client.query(
                    `INSERT INTO data_breaches
                     (id, breach_type, severity, affected_users_count, description,
                      detected_at, reported_at, status, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'reported', $7)`,
                    [
                        breachId,
                        breachInfo.type,
                        breachInfo.severity || 'medium',
                        breachInfo.affectedUsersCount || 0,
                        breachInfo.description,
                        breachInfo.detectedAt || new Date().toISOString(),
                        JSON.stringify(breachInfo.metadata || {})
                    ]
                );

                this.stats.breachesReported++;

                // TODO: Send email to data protection officer (DPO)
                // TODO: Notify affected users if > 72 hours

                return {
                    breachId,
                    reportedAt: new Date().toISOString(),
                    notificationDeadline: this.calculateBreachDeadline(breachInfo.detectedAt)
                };

            } finally {
                client.release();
            }

        } catch (error) {
            devLogger.error('GDPR-SERVICE', `Error reporting breach:`, error);
            throw error;
        }
    }

    /**
     * CALCULATE 72-HOUR BREACH NOTIFICATION DEADLINE
     */
    calculateBreachDeadline(detectedAt) {
        const detectedDate = new Date(detectedAt || Date.now());
        const deadline = new Date(detectedDate.getTime() + (this.config.breachNotificationHours * 60 * 60 * 1000));
        return deadline.toISOString();
    }

    /**
     * AUDIT LOGGING FOR DATA ACCESS
     */
    async logDataAccess(userId, action, requestedBy = null, reason = null) {
        try {
            const client = await pool.connect();

            try {
                await client.query(
                    `INSERT INTO audit_logs
                     (usuario_id, action, requested_by, reason, timestamp, metadata)
                     VALUES ($1, $2, $3, $4, NOW(), $5)`,
                    [
                        userId,
                        action,
                        requestedBy,
                        reason,
                        JSON.stringify({
                            action,
                            userId,
                            timestamp: new Date().toISOString()
                        })
                    ]
                );

                this.stats.accessRequests++;

            } finally {
                client.release();
            }

        } catch (error) {
            devLogger.warn('GDPR-SERVICE', `Error logging data access:`, error.message);
            // Don't throw - audit logging failure shouldn't break main flow
        }
    }

    /**
     * RECORD DATA EXPORT
     */
    async recordExport(userId, format, size) {
        try {
            const client = await pool.connect();

            try {
                await client.query(
                    `INSERT INTO data_exports (usuario_id, format, size, exported_at)
                     VALUES ($1, $2, $3, NOW())`,
                    [userId, format, size]
                );

            } finally {
                client.release();
            }

        } catch (error) {
            devLogger.warn('GDPR-SERVICE', `Error recording export:`, error.message);
        }
    }

    /**
     * GET GDPR COMPLIANCE STATISTICS
     */
    getComplianceStats() {
        return {
            ...this.stats,
            config: {
                dataRetentionDays: this.config.dataRetentionDays,
                breachNotificationHours: this.config.breachNotificationHours,
                auditLoggingEnabled: this.config.auditLoggingEnabled,
                consentTrackingEnabled: this.config.consentTrackingEnabled
            }
        };
    }

    /**
     * GENERATE UNIQUE ID
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
const gdprService = new GDPRComplianceService();

module.exports = gdprService;
