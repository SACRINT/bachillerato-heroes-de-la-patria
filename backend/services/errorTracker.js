/**
 * 🔴 ERROR TRACKER - SEMANA 26
 * Sistema centralizado de error tracking y aggregation
 *
 * Features:
 * - Error aggregation y deduplicación
 * - Stack trace capture y parsing
 * - Error rate monitoring
 * - Error grouping por tipo/mensaje
 * - Alerting en errores críticos
 * - Historical error data
 * - Error fingerprinting para deduplicación
 * - Integration con performance monitor
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const errorTracker = require('./services/errorTracker.js');
 *
 * // Track error
 * errorTracker.trackError(error, {
 *   context: 'api/users',
 *   userId: 123,
 *   severity: 'high'
 * });
 *
 * // Get error statistics
 * const stats = errorTracker.getErrorStats();
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const crypto = require('crypto');
const devLogger = require('../utils/devLogger.js');

class ErrorTracker {
    constructor(config = {}) {
        this.config = {
            // Alerting
            alertThreshold: config.alertThreshold || 10,              // Alertar después de 10 errores del mismo tipo
            criticalErrorPatterns: config.criticalErrorPatterns || [
                'ECONNREFUSED',
                'ETIMEDOUT',
                'Database',
                'Authentication failed'
            ],

            // Retention
            errorRetention: config.errorRetention || 24 * 60 * 60 * 1000, // 24 horas
            maxErrors: config.maxErrors || 1000,                      // Máximo 1000 errores en memoria

            // Deduplication
            deduplicationWindow: config.deduplicationWindow || 5 * 60 * 1000, // 5 minutos

            // Features
            alertingEnabled: config.alertingEnabled !== false,
            stackTraceEnabled: config.stackTraceEnabled !== false,

            ...config
        };

        // Error storage
        this.errors = [];
        this.errorGroups = new Map(); // fingerprint → { count, firstSeen, lastSeen, errors[] }

        // Statistics
        this.stats = {
            totalErrors: 0,
            errorsByType: new Map(),
            errorsBySeverity: new Map(),
            errorsByContext: new Map(),
            recentErrors: []
        };

        // Cleanup cada 1 hora
        setInterval(() => this.cleanup(), 60 * 60 * 1000);

        devLogger.log('ERROR-TRACKER', '🔴 Error Tracker initialized');
    }

    /**
     * TRACK ERROR
     */
    trackError(error, options = {}) {
        try {
            const now = Date.now();

            // Parse error
            const errorInfo = {
                id: this.generateId(),
                timestamp: now,
                message: error.message || String(error),
                name: error.name || 'Error',
                stack: this.config.stackTraceEnabled ? error.stack : null,
                code: error.code || null,

                // Context
                context: options.context || 'unknown',
                userId: options.userId || null,
                requestId: options.requestId || null,
                endpoint: options.endpoint || null,
                method: options.method || null,

                // Metadata
                severity: options.severity || this.determineSeverity(error),
                fingerprint: this.generateFingerprint(error),

                // Additional data
                metadata: options.metadata || {}
            };

            // Store error
            this.errors.push(errorInfo);
            this.stats.totalErrors++;

            // Track by type
            const typeCount = this.stats.errorsByType.get(errorInfo.name) || 0;
            this.stats.errorsByType.set(errorInfo.name, typeCount + 1);

            // Track by severity
            const severityCount = this.stats.errorsBySeverity.get(errorInfo.severity) || 0;
            this.stats.errorsBySeverity.set(errorInfo.severity, severityCount + 1);

            // Track by context
            const contextCount = this.stats.errorsByContext.get(errorInfo.context) || 0;
            this.stats.errorsByContext.set(errorInfo.context, contextCount + 1);

            // Add to recent errors
            this.stats.recentErrors.push(errorInfo);
            if (this.stats.recentErrors.length > 50) {
                this.stats.recentErrors.shift(); // Keep last 50
            }

            // Group errors by fingerprint
            this.groupError(errorInfo);

            // Check for alerts
            if (this.config.alertingEnabled) {
                this.checkAlerts(errorInfo);
            }

            // Log error
            this.logError(errorInfo);

            return errorInfo;

        } catch (trackingError) {
            devLogger.error('ERROR-TRACKER', 'Error tracking error:', trackingError);
        }
    }

    /**
     * GROUP ERRORS BY FINGERPRINT
     */
    groupError(errorInfo) {
        const fingerprint = errorInfo.fingerprint;

        if (!this.errorGroups.has(fingerprint)) {
            this.errorGroups.set(fingerprint, {
                fingerprint,
                message: errorInfo.message,
                name: errorInfo.name,
                count: 0,
                firstSeen: errorInfo.timestamp,
                lastSeen: errorInfo.timestamp,
                errors: []
            });
        }

        const group = this.errorGroups.get(fingerprint);
        group.count++;
        group.lastSeen = errorInfo.timestamp;

        // Store only last 10 occurrences per group
        group.errors.push(errorInfo);
        if (group.errors.length > 10) {
            group.errors.shift();
        }
    }

    /**
     * GENERATE ERROR FINGERPRINT (para deduplicación)
     */
    generateFingerprint(error) {
        // Fingerprint basado en: nombre + mensaje + primeras líneas de stack
        const parts = [
            error.name || 'Error',
            error.message || String(error)
        ];

        // Agregar primeras 2 líneas de stack trace (normalizado)
        if (error.stack) {
            const stackLines = error.stack.split('\n')
                .slice(0, 3)
                .map(line => line.trim())
                .filter(line => line.length > 0);

            parts.push(...stackLines);
        }

        const data = parts.join('|');
        return crypto.createHash('md5').update(data).digest('hex').substring(0, 12);
    }

    /**
     * DETERMINE ERROR SEVERITY
     */
    determineSeverity(error) {
        const message = error.message || String(error);

        // Critical patterns
        for (const pattern of this.config.criticalErrorPatterns) {
            if (message.includes(pattern)) {
                return 'critical';
            }
        }

        // High severity
        if (error.name === 'TypeError' || error.name === 'ReferenceError') {
            return 'high';
        }

        // Medium severity
        if (error.name === 'ValidationError' || error.code === 'ENOENT') {
            return 'medium';
        }

        // Default to low
        return 'low';
    }

    /**
     * CHECK ALERTS
     */
    checkAlerts(errorInfo) {
        const group = this.errorGroups.get(errorInfo.fingerprint);

        // Alert on critical errors
        if (errorInfo.severity === 'critical') {
            devLogger.error('ERROR-TRACKER', `🚨 CRITICAL ERROR: ${errorInfo.message}`);
            // TODO: Send email/slack alert
        }

        // Alert on repeated errors
        if (group && group.count >= this.config.alertThreshold) {
            const timeSinceFirst = errorInfo.timestamp - group.firstSeen;
            const minutes = Math.floor(timeSinceFirst / 60000);

            devLogger.error('ERROR-TRACKER', `🚨 REPEATED ERROR: "${group.message}" occurred ${group.count} times in ${minutes} minutes`);
            // TODO: Send email/slack alert
        }
    }

    /**
     * LOG ERROR
     */
    logError(errorInfo) {
        const logMessage = {
            level: this.severityToLogLevel(errorInfo.severity),
            timestamp: new Date(errorInfo.timestamp).toISOString(),
            error: {
                id: errorInfo.id,
                name: errorInfo.name,
                message: errorInfo.message,
                fingerprint: errorInfo.fingerprint,
                severity: errorInfo.severity
            },
            context: {
                context: errorInfo.context,
                userId: errorInfo.userId,
                endpoint: errorInfo.endpoint,
                method: errorInfo.method
            },
            stack: errorInfo.stack
        };

        // Use devLogger
        if (errorInfo.severity === 'critical' || errorInfo.severity === 'high') {
            devLogger.error('ERROR-TRACKER', JSON.stringify(logMessage, null, 2));
        } else {
            devLogger.warn('ERROR-TRACKER', JSON.stringify(logMessage, null, 2));
        }
    }

    /**
     * SEVERITY TO LOG LEVEL
     */
    severityToLogLevel(severity) {
        const mapping = {
            'critical': 'ERROR',
            'high': 'ERROR',
            'medium': 'WARN',
            'low': 'INFO'
        };

        return mapping[severity] || 'INFO';
    }

    /**
     * GET ERROR STATISTICS
     */
    getErrorStats() {
        const now = Date.now();

        // Calculate error rate (last hour)
        const oneHourAgo = now - (60 * 60 * 1000);
        const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
        const errorRate = recentErrors.length;

        // Top error groups
        const topGroups = Array.from(this.errorGroups.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(group => ({
                fingerprint: group.fingerprint,
                message: group.message.substring(0, 100),
                name: group.name,
                count: group.count,
                firstSeen: new Date(group.firstSeen).toISOString(),
                lastSeen: new Date(group.lastSeen).toISOString()
            }));

        return {
            // Overall stats
            totalErrors: this.stats.totalErrors,
            uniqueErrorTypes: this.errorGroups.size,
            errorRate: `${errorRate} errors/hour`,

            // By category
            byType: Object.fromEntries(this.stats.errorsByType),
            bySeverity: Object.fromEntries(this.stats.errorsBySeverity),
            byContext: Object.fromEntries(this.stats.errorsByContext),

            // Top groups
            topErrorGroups: topGroups,

            // Recent errors (last 10)
            recentErrors: this.stats.recentErrors.slice(-10).map(e => ({
                id: e.id,
                timestamp: new Date(e.timestamp).toISOString(),
                message: e.message.substring(0, 100),
                severity: e.severity,
                context: e.context,
                fingerprint: e.fingerprint
            }))
        };
    }

    /**
     * GET ERROR GROUP DETAILS
     */
    getErrorGroup(fingerprint) {
        const group = this.errorGroups.get(fingerprint);

        if (!group) {
            return null;
        }

        return {
            fingerprint: group.fingerprint,
            message: group.message,
            name: group.name,
            count: group.count,
            firstSeen: new Date(group.firstSeen).toISOString(),
            lastSeen: new Date(group.lastSeen).toISOString(),
            errors: group.errors.map(e => ({
                id: e.id,
                timestamp: new Date(e.timestamp).toISOString(),
                severity: e.severity,
                context: e.context,
                userId: e.userId,
                endpoint: e.endpoint,
                stack: e.stack
            }))
        };
    }

    /**
     * CLEANUP OLD ERRORS
     */
    cleanup() {
        const now = Date.now();
        const cutoffTime = now - this.config.errorRetention;
        let cleanedCount = 0;

        // Cleanup errors array
        this.errors = this.errors.filter(e => e.timestamp > cutoffTime);

        // Cleanup error groups
        for (const [fingerprint, group] of this.errorGroups.entries()) {
            if (group.lastSeen < cutoffTime) {
                this.errorGroups.delete(fingerprint);
                cleanedCount++;
            }
        }

        // Limit max errors in memory
        if (this.errors.length > this.config.maxErrors) {
            const excess = this.errors.length - this.config.maxErrors;
            this.errors = this.errors.slice(excess);
        }

        if (cleanedCount > 0) {
            devLogger.log('ERROR-TRACKER', `🧹 Cleaned ${cleanedCount} old error groups`);
        }
    }

    /**
     * GENERATE UNIQUE ID
     */
    generateId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * RESET STATISTICS
     */
    reset() {
        this.errors = [];
        this.errorGroups.clear();
        this.stats = {
            totalErrors: 0,
            errorsByType: new Map(),
            errorsBySeverity: new Map(),
            errorsByContext: new Map(),
            recentErrors: []
        };

        devLogger.log('ERROR-TRACKER', '🔄 Error statistics reset');
    }
}

// Export singleton instance
const errorTracker = new ErrorTracker();

module.exports = errorTracker;
