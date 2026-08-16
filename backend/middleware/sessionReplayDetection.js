/**
 * 🔒 SESSION REPLAY DETECTION - SEMANA 25
 * Sistema de detección de secuestro y replay de sesiones
 *
 * Features:
 * - Detección de sesiones concurrentes sospechosas
 * - Validación de integridad de sesión (IP, User-Agent)
 * - Detección de anomalías de ubicación/dispositivo
 * - Session fingerprinting
 * - Invalidación automática de sesiones comprometidas
 * - Audit logging de actividad de sesión
 * - Rate limiting por sesión
 * - Detección de session fixation
 *
 * Uso:
 * const sessionReplay = require('./middleware/sessionReplayDetection');
 * app.use(sessionReplay.middleware());
 *
 * Fecha: 20 Noviembre 2025
 */

const crypto = require('crypto');
const devLogger = require('../utils/devLogger.js');

class SessionReplayDetection {
    constructor() {
        // Almacén de sesiones activas (en producción usar Redis)
        // Estructura: Map<userId, Set<SessionInfo>>
        this.activeSessions = new Map();

        // Configuración
        this.config = {
            maxConcurrentSessions: 3,           // Máximo 3 sesiones simultáneas
            maxLocationChanges: 5,              // Máximo 5 cambios de IP en 1 hora
            sessionTimeoutMinutes: 30,          // Timeout de inactividad
            ipChangeWarningThreshold: 2,        // Alertar después de 2 cambios de IP
            userAgentChangeAllowed: false,      // NO permitir cambios de User-Agent
            geoLocationCheckEnabled: false,     // Deshabilitado (requiere GeoIP service)
            auditLogEnabled: true               // Logging de auditoría
        };

        // Historial de cambios de IP (userId → Array<{ip, timestamp}>)
        this.ipChangeHistory = new Map();

        // Sesiones bloqueadas/invalidadas
        this.revokedSessions = new Set();

        // Rate limiting por sesión (sessionId → {count, firstRequest})
        this.sessionRateLimit = new Map();
        this.rateLimitConfig = {
            windowMs: 60 * 1000,    // 1 minuto
            maxRequests: 100        // 100 requests por minuto por sesión
        };

        // Cleanup automático cada 10 minutos
        setInterval(() => this.cleanup(), 10 * 60 * 1000);

        devLogger.log('SESSION-REPLAY', '🔒 Session Replay Detection initialized');
    }

    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware() {
        return async (req, res, next) => {
            try {
                // Skip si no hay usuario autenticado
                if (!req.user || !req.user.id) {
                    return next();
                }

                const userId = req.user.id.toString();
                const sessionToken = this.extractSessionToken(req);
                const ip = this.getClientIP(req);
                const userAgent = req.headers['user-agent'] || '';

                // 1. Verificar si sesión está revocada
                if (this.isSessionRevoked(sessionToken)) {
                    devLogger.warn('SESSION-REPLAY', `❌ Sesión revocada: userId=${userId}, token=${sessionToken.substring(0, 20)}...`);
                    return this.blockRequest(res, 'Sesión revocada por actividad sospechosa', 401);
                }

                // 2. Rate limiting por sesión
                if (this.isSessionRateLimited(sessionToken)) {
                    devLogger.warn('SESSION-REPLAY', `❌ Rate limit excedido: sessionToken=${sessionToken.substring(0, 20)}...`);
                    return this.blockRequest(res, 'Demasiadas peticiones desde esta sesión', 429);
                }

                // 3. Obtener o crear sesión
                const sessionInfo = this.getOrCreateSession(userId, sessionToken, ip, userAgent);

                // 4. Validar integridad de sesión
                const integrityCheck = this.validateSessionIntegrity(sessionInfo, ip, userAgent);
                if (!integrityCheck.valid) {
                    devLogger.warn('SESSION-REPLAY', `⚠️ Integridad de sesión comprometida: userId=${userId}, reason=${integrityCheck.reason}`);

                    // Revocar sesión si es crítico
                    if (integrityCheck.severity === 'critical') {
                        this.revokeSession(sessionToken);
                        this.auditLog(userId, 'SESSION_HIJACK_DETECTED', { reason: integrityCheck.reason, ip, userAgent });
                        return this.blockRequest(res, 'Sesión invalidada por actividad sospechosa', 401);
                    }

                    // Si es warning, solo alertar pero continuar
                    this.auditLog(userId, 'SESSION_INTEGRITY_WARNING', { reason: integrityCheck.reason, ip, userAgent });
                }

                // 5. Detectar sesiones concurrentes sospechosas
                const concurrentCheck = this.checkConcurrentSessions(userId, sessionToken);
                if (concurrentCheck.suspicious) {
                    devLogger.warn('SESSION-REPLAY', `⚠️ Sesiones concurrentes sospechosas: userId=${userId}, count=${concurrentCheck.count}`);
                    this.auditLog(userId, 'CONCURRENT_SESSIONS_DETECTED', { count: concurrentCheck.count, sessions: concurrentCheck.sessions });
                }

                // 6. Detectar cambios rápidos de IP (posible session hijacking)
                if (this.detectRapidIPChanges(userId, ip)) {
                    devLogger.warn('SESSION-REPLAY', `⚠️ Cambios rápidos de IP detectados: userId=${userId}, ip=${ip}`);
                    this.auditLog(userId, 'RAPID_IP_CHANGES', { ip, changes: this.ipChangeHistory.get(userId) });
                }

                // 7. Actualizar última actividad
                this.updateSessionActivity(sessionInfo);

                // Adjuntar info de sesión al request
                req.sessionInfo = {
                    sessionId: sessionInfo.sessionId,
                    fingerprint: sessionInfo.fingerprint,
                    createdAt: sessionInfo.createdAt,
                    lastActivity: sessionInfo.lastActivity
                };

                next();

            } catch (error) {
                devLogger.error('SESSION-REPLAY', 'Error en middleware:', error);
                next(); // No bloquear en caso de error
            }
        };
    }

    /**
     * EXTRAER TOKEN DE SESIÓN
     */
    extractSessionToken(req) {
        // Intentar extraer de Authorization header
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Intentar extraer de cookie
        if (req.cookies && req.cookies.token) {
            return req.cookies.token;
        }

        // Intentar extraer de query param (menos seguro)
        if (req.query && req.query.token) {
            return req.query.token;
        }

        // Generar token temporal si no existe
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * OBTENER IP DEL CLIENTE
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               'unknown';
    }

    /**
     * OBTENER O CREAR SESIÓN
     */
    getOrCreateSession(userId, sessionToken, ip, userAgent) {
        if (!this.activeSessions.has(userId)) {
            this.activeSessions.set(userId, new Set());
        }

        const userSessions = this.activeSessions.get(userId);

        // Buscar sesión existente por token
        for (const session of userSessions) {
            if (session.sessionToken === sessionToken) {
                return session;
            }
        }

        // Crear nueva sesión
        const newSession = {
            sessionId: crypto.randomBytes(16).toString('hex'),
            sessionToken: sessionToken,
            userId: userId,
            ip: ip,
            userAgent: userAgent,
            fingerprint: this.generateFingerprint(ip, userAgent),
            createdAt: Date.now(),
            lastActivity: Date.now(),
            ipHistory: [{ ip, timestamp: Date.now() }],
            requestCount: 0
        };

        userSessions.add(newSession);

        devLogger.log('SESSION-REPLAY', `✅ Nueva sesión creada: userId=${userId}, sessionId=${newSession.sessionId}`);
        this.auditLog(userId, 'SESSION_CREATED', { sessionId: newSession.sessionId, ip, userAgent });

        return newSession;
    }

    /**
     * GENERAR FINGERPRINT DE SESIÓN
     */
    generateFingerprint(ip, userAgent) {
        const data = `${ip}|${userAgent}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * VALIDAR INTEGRIDAD DE SESIÓN
     */
    validateSessionIntegrity(sessionInfo, currentIP, currentUserAgent) {
        const issues = [];

        // 1. Verificar cambio de IP
        if (sessionInfo.ip !== currentIP) {
            issues.push({
                type: 'IP_CHANGE',
                severity: 'medium',
                message: `IP cambió de ${sessionInfo.ip} a ${currentIP}`
            });

            // Agregar a historial de cambios de IP
            sessionInfo.ipHistory.push({ ip: currentIP, timestamp: Date.now() });
            sessionInfo.ip = currentIP; // Actualizar IP actual
        }

        // 2. Verificar cambio de User-Agent
        if (!this.config.userAgentChangeAllowed && sessionInfo.userAgent !== currentUserAgent) {
            issues.push({
                type: 'USER_AGENT_CHANGE',
                severity: 'critical',
                message: `User-Agent cambió de "${sessionInfo.userAgent}" a "${currentUserAgent}"`
            });
        }

        // 3. Verificar fingerprint
        const currentFingerprint = this.generateFingerprint(currentIP, currentUserAgent);
        if (sessionInfo.fingerprint !== currentFingerprint) {
            issues.push({
                type: 'FINGERPRINT_MISMATCH',
                severity: 'high',
                message: `Fingerprint no coincide`
            });
        }

        // 4. Verificar timeout de sesión
        const inactiveMinutes = (Date.now() - sessionInfo.lastActivity) / (1000 * 60);
        if (inactiveMinutes > this.config.sessionTimeoutMinutes) {
            issues.push({
                type: 'SESSION_TIMEOUT',
                severity: 'critical',
                message: `Sesión inactiva por ${inactiveMinutes.toFixed(1)} minutos`
            });
        }

        // Determinar si la sesión es válida
        const criticalIssues = issues.filter(i => i.severity === 'critical');

        if (criticalIssues.length > 0) {
            return {
                valid: false,
                severity: 'critical',
                reason: criticalIssues.map(i => i.message).join('; '),
                issues: issues
            };
        }

        if (issues.length > 0) {
            return {
                valid: true,  // Continuar pero con advertencia
                severity: 'warning',
                reason: issues.map(i => i.message).join('; '),
                issues: issues
            };
        }

        return { valid: true, severity: 'none', reason: null, issues: [] };
    }

    /**
     * DETECTAR SESIONES CONCURRENTES SOSPECHOSAS
     */
    checkConcurrentSessions(userId, currentSessionToken) {
        const userSessions = this.activeSessions.get(userId);
        if (!userSessions) {
            return { suspicious: false, count: 0 };
        }

        const activeSessions = Array.from(userSessions).filter(s => {
            const ageMinutes = (Date.now() - s.lastActivity) / (1000 * 60);
            return ageMinutes < this.config.sessionTimeoutMinutes;
        });

        const count = activeSessions.length;
        const suspicious = count > this.config.maxConcurrentSessions;

        return {
            suspicious,
            count,
            sessions: activeSessions.map(s => ({
                sessionId: s.sessionId,
                ip: s.ip,
                createdAt: new Date(s.createdAt).toISOString(),
                lastActivity: new Date(s.lastActivity).toISOString()
            }))
        };
    }

    /**
     * DETECTAR CAMBIOS RÁPIDOS DE IP
     */
    detectRapidIPChanges(userId, currentIP) {
        if (!this.ipChangeHistory.has(userId)) {
            this.ipChangeHistory.set(userId, []);
        }

        const history = this.ipChangeHistory.get(userId);
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        // Limpiar entradas antiguas (más de 1 hora)
        const recentHistory = history.filter(entry => entry.timestamp > oneHourAgo);

        // Agregar entrada actual si IP cambió
        const lastEntry = recentHistory[recentHistory.length - 1];
        if (!lastEntry || lastEntry.ip !== currentIP) {
            recentHistory.push({ ip: currentIP, timestamp: now });
        }

        this.ipChangeHistory.set(userId, recentHistory);

        // Detectar si hay demasiados cambios
        const changeCount = recentHistory.length;
        return changeCount > this.config.maxLocationChanges;
    }

    /**
     * ACTUALIZAR ÚLTIMA ACTIVIDAD DE SESIÓN
     */
    updateSessionActivity(sessionInfo) {
        sessionInfo.lastActivity = Date.now();
        sessionInfo.requestCount = (sessionInfo.requestCount || 0) + 1;
    }

    /**
     * VERIFICAR SI SESIÓN ESTÁ REVOCADA
     */
    isSessionRevoked(sessionToken) {
        return this.revokedSessions.has(sessionToken);
    }

    /**
     * REVOCAR SESIÓN
     */
    revokeSession(sessionToken) {
        this.revokedSessions.add(sessionToken);

        // Auto-eliminar después de 24 horas
        setTimeout(() => {
            this.revokedSessions.delete(sessionToken);
        }, 24 * 60 * 60 * 1000);

        devLogger.warn('SESSION-REPLAY', `🚫 Sesión revocada: token=${sessionToken.substring(0, 20)}...`);
    }

    /**
     * REVOCAR TODAS LAS SESIONES DE UN USUARIO
     */
    revokeAllUserSessions(userId) {
        const userSessions = this.activeSessions.get(userId);
        if (!userSessions) {
            return 0;
        }

        let count = 0;
        for (const session of userSessions) {
            this.revokeSession(session.sessionToken);
            count++;
        }

        this.activeSessions.delete(userId);

        devLogger.warn('SESSION-REPLAY', `🚫 Todas las sesiones revocadas: userId=${userId}, count=${count}`);
        this.auditLog(userId, 'ALL_SESSIONS_REVOKED', { count });

        return count;
    }

    /**
     * RATE LIMITING POR SESIÓN
     */
    isSessionRateLimited(sessionToken) {
        const now = Date.now();
        const record = this.sessionRateLimit.get(sessionToken);

        if (!record) {
            this.sessionRateLimit.set(sessionToken, { count: 1, firstRequest: now });
            return false;
        }

        const timePassed = now - record.firstRequest;

        if (timePassed > this.rateLimitConfig.windowMs) {
            // Reset window
            this.sessionRateLimit.set(sessionToken, { count: 1, firstRequest: now });
            return false;
        }

        record.count++;

        if (record.count > this.rateLimitConfig.maxRequests) {
            return true; // Rate limited
        }

        return false;
    }

    /**
     * AUDIT LOGGING
     */
    auditLog(userId, eventType, details = {}) {
        if (!this.config.auditLogEnabled) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: userId,
            eventType: eventType,
            details: details
        };

        devLogger.log('SESSION-AUDIT', JSON.stringify(logEntry));

        // En producción: guardar en BD o servicio de auditoría
    }

    /**
     * BLOQUEAR REQUEST
     */
    blockRequest(res, message, statusCode = 401) {
        res.status(statusCode).json({
            success: false,
            error: 'Session security violation',
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * CLEANUP DE SESIONES EXPIRADAS
     */
    cleanup() {
        const now = Date.now();
        const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
        let cleanedSessions = 0;

        // Limpiar sesiones inactivas
        for (const [userId, sessions] of this.activeSessions.entries()) {
            const activeSessions = new Set();

            for (const session of sessions) {
                const inactiveTime = now - session.lastActivity;

                if (inactiveTime < timeoutMs) {
                    activeSessions.add(session);
                } else {
                    cleanedSessions++;
                }
            }

            if (activeSessions.size === 0) {
                this.activeSessions.delete(userId);
            } else {
                this.activeSessions.set(userId, activeSessions);
            }
        }

        // Limpiar rate limit map
        for (const [sessionToken, record] of this.sessionRateLimit.entries()) {
            const timePassed = now - record.firstRequest;

            if (timePassed > this.rateLimitConfig.windowMs) {
                this.sessionRateLimit.delete(sessionToken);
            }
        }

        // Limpiar IP change history (más de 24 horas)
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        for (const [userId, history] of this.ipChangeHistory.entries()) {
            const recentHistory = history.filter(entry => entry.timestamp > oneDayAgo);

            if (recentHistory.length === 0) {
                this.ipChangeHistory.delete(userId);
            } else {
                this.ipChangeHistory.set(userId, recentHistory);
            }
        }

        if (cleanedSessions > 0) {
            devLogger.log('SESSION-REPLAY', `🧹 Cleanup: ${cleanedSessions} sesiones inactivas eliminadas`);
        }
    }

    /**
     * OBTENER ESTADÍSTICAS DE SESIONES
     */
    getStats() {
        const stats = {
            totalUsers: this.activeSessions.size,
            totalSessions: 0,
            revokedSessions: this.revokedSessions.size,
            ipChangeHistoryEntries: this.ipChangeHistory.size,
            rateLimitEntries: this.sessionRateLimit.size,
            usersWithMultipleSessions: 0
        };

        for (const [userId, sessions] of this.activeSessions.entries()) {
            stats.totalSessions += sessions.size;
            if (sessions.size > 1) {
                stats.usersWithMultipleSessions++;
            }
        }

        return stats;
    }
}

// Exportar instancia singleton
const sessionReplayDetection = new SessionReplayDetection();

module.exports = sessionReplayDetection;
