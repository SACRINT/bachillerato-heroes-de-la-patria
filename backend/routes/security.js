"use strict";
/**
 * Rutas de Seguridad
 * BGE Héroes de la Patria
 * FASE 4 - Semana 27-28
 *
 * Endpoints para gestión de seguridad, auditoría y rate limiting
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const auth_1 = require('../middleware/auth.js');
const SecurityService_1 = __importDefault(require('../services/SecurityService.js'));
const RateLimiterService_1 = __importDefault(require('../services/rate-limit.service'));
const SecurityAuditService_1 = __importDefault(require('../services/security-audit.service'));
const security_dao_1 = __importDefault(require('../data/security.dao.js'));
const router = express_1.default.Router();
// Middleware para verificar rol admin
const requireAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'administrativo')) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador.'
        });
    }
    next();
};
// ========================================
// ENDPOINTS DE AUDITORÍA
// ========================================
/**
 * GET /api/security/audit/logs
 * Obtener logs de auditoría
 */
router.get('/audit/logs', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { eventType, userId, ip, severity, success, startDate, endDate, resource, page = '1', limit = '50' } = req.query;
        const result = await SecurityAuditService_1.default.query({
            eventType,
            userId: userId ? parseInt(userId) : undefined,
            ip,
            severity: severity ? parseInt(severity) : undefined,
            success: success !== undefined ? success === 'true' : undefined,
            startDate,
            endDate,
            resource
        }, { page: parseInt(page), limit: parseInt(limit) });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logs de auditoría',
            error: error.message
        });
    }
});
/**
 * GET /api/security/audit/summary
 * Resumen de eventos de auditoría
 */
router.get('/audit/summary', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const startDate = req.query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = req.query.endDate || new Date().toISOString();
        const summary = await SecurityAuditService_1.default.getSummary(startDate, endDate);
        res.json({
            success: true,
            data: {
                period: { startDate, endDate },
                summary
            }
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: error.message
        });
    }
});
/**
 * GET /api/security/audit/suspicious
 * Actividad sospechosa reciente
 */
router.get('/audit/suspicious', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const hours = parseInt(req.query.hours || '24');
        const suspicious = await SecurityAuditService_1.default.getSuspiciousActivity(hours);
        res.json({
            success: true,
            data: {
                period: `${hours} hours`,
                threats: suspicious
            }
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo actividad sospechosa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener actividad sospechosa',
            error: error.message
        });
    }
});
/**
 * GET /api/security/audit/user/:userId
 * Timeline de eventos de un usuario
 */
router.get('/audit/user/:userId', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit || '100');
        const timeline = await SecurityAuditService_1.default.getUserTimeline(parseInt(userId), limit);
        res.json({
            success: true,
            data: {
                userId: parseInt(userId),
                events: timeline
            }
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo timeline:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener timeline',
            error: error.message
        });
    }
});
/**
 * POST /api/security/audit/export
 * Exportar logs de auditoría
 */
router.post('/audit/export', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { filters, format = 'json' } = req.body;
        const exported = await SecurityAuditService_1.default.exportLogs(filters, format);
        // Log la exportación
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'export_audit_logs', 'security_audit_logs', { filters, format });
        }
        if (format === 'csv') {
            res.set('Content-Type', 'text/csv');
            res.set('Content-Disposition', 'attachment; filename=audit_logs.csv');
            return res.send(exported);
        }
        res.json({
            success: true,
            data: exported
        });
    }
    catch (error) {
        console.error('[SECURITY] Error exportando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar logs',
            error: error.message
        });
    }
});
/**
 * POST /api/security/audit/cleanup
 * Limpiar logs antiguos
 */
router.post('/audit/cleanup', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const retentionDays = parseInt(req.body.retentionDays || '90');
        const deleted = await SecurityAuditService_1.default.cleanup(retentionDays);
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'cleanup_audit_logs', 'security_audit_logs', { retentionDays, deletedCount: deleted });
        }
        res.json({
            success: true,
            message: `Eliminados ${deleted} logs antiguos`,
            deletedCount: deleted
        });
    }
    catch (error) {
        console.error('[SECURITY] Error limpiando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar logs',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE RATE LIMITING
// ========================================
/**
 * GET /api/security/rate-limit/stats
 * Estadísticas de rate limiting
 */
router.get('/rate-limit/stats', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = RateLimiterService_1.default.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo stats rate limit:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});
/**
 * GET /api/security/rate-limit/top-consumers
 * Principales consumidores
 */
router.get('/rate-limit/top-consumers', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '10');
        const consumers = RateLimiterService_1.default.getTopConsumers(limit);
        res.json({
            success: true,
            data: consumers
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo top consumers:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener consumidores',
            error: error.message
        });
    }
});
/**
 * GET /api/security/rate-limit/config
 * Configuración actual de rate limiting
 */
router.get('/rate-limit/config', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const config = RateLimiterService_1.default.getConfig();
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo config:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración',
            error: error.message
        });
    }
});
/**
 * POST /api/security/rate-limit/block
 * Bloquear identificador
 */
router.post('/rate-limit/block', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { identifier, durationMinutes = 60, reason } = req.body;
        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el identificador'
            });
        }
        RateLimiterService_1.default.block(identifier, durationMinutes * 60 * 1000, reason);
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'block_identifier', 'rate_limiter', { identifier, durationMinutes, reason });
        }
        res.json({
            success: true,
            message: `${identifier} bloqueado por ${durationMinutes} minutos`
        });
    }
    catch (error) {
        console.error('[SECURITY] Error bloqueando:', error);
        res.status(500).json({
            success: false,
            message: 'Error al bloquear',
            error: error.message
        });
    }
});
/**
 * POST /api/security/rate-limit/unblock
 * Desbloquear identificador
 */
router.post('/rate-limit/unblock', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el identificador'
            });
        }
        RateLimiterService_1.default.unblock(identifier);
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'unblock_identifier', 'rate_limiter', { identifier });
        }
        res.json({
            success: true,
            message: `${identifier} desbloqueado`
        });
    }
    catch (error) {
        console.error('[SECURITY] Error desbloqueando:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desbloquear',
            error: error.message
        });
    }
});
/**
 * POST /api/security/rate-limit/whitelist
 * Agregar IP a whitelist
 */
router.post('/rate-limit/whitelist', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ip } = req.body;
        if (!ip) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere la IP'
            });
        }
        RateLimiterService_1.default.addToWhitelist(ip);
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'add_to_whitelist', 'rate_limiter', { ip });
        }
        res.json({
            success: true,
            message: `${ip} agregada a whitelist`
        });
    }
    catch (error) {
        console.error('[SECURITY] Error agregando a whitelist:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar a whitelist',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE SEGURIDAD GENERAL
// ========================================
/**
 * GET /api/security/stats
 * Estadísticas generales de seguridad
 */
router.get('/stats', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = {
            security: SecurityService_1.default.getStats(),
            rateLimiter: RateLimiterService_1.default.getStats(),
            audit: SecurityAuditService_1.default.getStats()
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});
/**
 * POST /api/security/validate-password
 * Validar fortaleza de contraseña
 */
router.post('/validate-password', (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere la contraseña'
            });
        }
        const result = SecurityService_1.default.validatePasswordStrength(password);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[SECURITY] Error validando contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar contraseña',
            error: error.message
        });
    }
});
/**
 * POST /api/security/detect-threats
 * Detectar patrones de ataque en input
 */
router.post('/detect-threats', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const { input } = req.body;
        if (!input) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el input a analizar'
            });
        }
        const threats = SecurityService_1.default.detectAttackPatterns(input);
        res.json({
            success: true,
            data: {
                input: input.substring(0, 100),
                threats,
                threatCount: threats.length
            }
        });
    }
    catch (error) {
        console.error('[SECURITY] Error detectando amenazas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al detectar amenazas',
            error: error.message
        });
    }
});
/**
 * POST /api/security/generate-token
 * Generar token seguro
 */
router.post('/generate-token', auth_1.authenticateToken, requireAdmin, (req, res) => {
    try {
        const { type = 'token', length = 32 } = req.body;
        let token;
        if (type === 'otp') {
            token = SecurityService_1.default.generateOTP(Math.min(length, 8));
        }
        else {
            token = SecurityService_1.default.generateSecureToken(Math.min(length, 64));
        }
        res.json({
            success: true,
            data: { token, type, length: token.length }
        });
    }
    catch (error) {
        console.error('[SECURITY] Error generando token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar token',
            error: error.message
        });
    }
});
/**
 * POST /api/security/generate-password
 * Generar contraseña aleatoria
 */
router.post('/generate-password', auth_1.authenticateToken, (req, res) => {
    try {
        const { length = 16 } = req.body;
        const password = SecurityService_1.default.generateRandomPassword(Math.min(length, 32));
        res.json({
            success: true,
            data: { password, length: password.length }
        });
    }
    catch (error) {
        console.error('[SECURITY] Error generando contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar contraseña',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE ALERTAS
// ========================================
/**
 * GET /api/security/alerts
 * Obtener alertas de seguridad
 */
router.get('/alerts', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, severity, page = '1', limit = '20' } = req.query;
        // ✅ FASE 3: Using SecurityDAO
        const alerts = await security_dao_1.default.getAlerts({
            status: status,
            severity: severity ? parseInt(severity) : undefined,
            limit: parseInt(limit),
            page: parseInt(page)
        });
        res.json({
            success: true,
            data: alerts
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alertas',
            error: error.message
        });
    }
});
/**
 * PUT /api/security/alerts/:id/acknowledge
 * Reconocer alerta
 */
router.put('/alerts/:id/acknowledge', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user) {
            // ✅ FASE 3: Using SecurityDAO
            const alert = await security_dao_1.default.acknowledgeAlert(parseInt(id), req.user.id);
            if (!alert) {
                return res.status(404).json({
                    success: false,
                    message: 'Alerta no encontrada'
                });
            }
            res.json({
                success: true,
                data: alert
            });
        }
    }
    catch (error) {
        console.error('[SECURITY] Error reconociendo alerta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reconocer alerta',
            error: error.message
        });
    }
});
/**
 * PUT /api/security/alerts/:id/resolve
 * Resolver alerta
 */
router.put('/alerts/:id/resolve', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        if (req.user) {
            // ✅ FASE 3: Using SecurityDAO
            const alert = await security_dao_1.default.resolveAlert(parseInt(id), req.user.id, notes);
            if (!alert) {
                return res.status(404).json({
                    success: false,
                    message: 'Alerta no encontrada'
                });
            }
            res.json({
                success: true,
                data: alert
            });
        }
    }
    catch (error) {
        console.error('[SECURITY] Error resolviendo alerta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resolver alerta',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE IPs BLOQUEADAS
// ========================================
/**
 * GET /api/security/blocked-ips
 * Obtener IPs bloqueadas
 */
router.get('/blocked-ips', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        // ✅ FASE 3: Using SecurityDAO
        const blockedIPs = await security_dao_1.default.getBlockedIPs();
        res.json({
            success: true,
            data: blockedIPs
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo IPs bloqueadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener IPs bloqueadas',
            error: error.message
        });
    }
});
/**
 * POST /api/security/blocked-ips
 * Bloquear IP
 */
router.post('/blocked-ips', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ip, reason, isPermanent = false, durationMinutes } = req.body;
        if (!ip) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere la IP'
            });
        }
        const blockedUntil = isPermanent
            ? undefined
            : new Date(Date.now() + (durationMinutes || 60) * 60 * 1000);
        if (req.user) {
            // ✅ FASE 3: Using SecurityDAO
            const blockedIP = await security_dao_1.default.blockIP(ip, reason, req.user.id, isPermanent, blockedUntil);
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'block_ip', 'blocked_ips', { ip, reason, isPermanent, durationMinutes });
            res.json({
                success: true,
                data: blockedIP
            });
        }
    }
    catch (error) {
        console.error('[SECURITY] Error bloqueando IP:', error);
        res.status(500).json({
            success: false,
            message: 'Error al bloquear IP',
            error: error.message
        });
    }
});
/**
 * DELETE /api/security/blocked-ips/:ip
 * Desbloquear IP
 */
router.delete('/blocked-ips/:ip', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ip } = req.params;
        // ✅ FASE 3: Using SecurityDAO
        const unblocked = await security_dao_1.default.unblockIP(ip);
        if (!unblocked) {
            return res.status(404).json({
                success: false,
                message: 'IP no encontrada en lista de bloqueados'
            });
        }
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'unblock_ip', 'blocked_ips', { ip });
        }
        res.json({
            success: true,
            message: `IP ${ip} desbloqueada`
        });
    }
    catch (error) {
        console.error('[SECURITY] Error desbloqueando IP:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desbloquear IP',
            error: error.message
        });
    }
});
// ========================================
// ENDPOINTS DE SESIONES
// ========================================
/**
 * GET /api/security/sessions
 * Obtener sesiones activas
 */
router.get('/sessions', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, active } = req.query;
        // ✅ FASE 3: Using SecurityDAO
        const sessions = await security_dao_1.default.getSessions({
            userId: userId ? parseInt(userId) : undefined,
            active: active ? active === 'true' : undefined
        });
        res.json({
            success: true,
            data: sessions
        });
    }
    catch (error) {
        console.error('[SECURITY] Error obteniendo sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesiones',
            error: error.message
        });
    }
});
/**
 * DELETE /api/security/sessions/:sessionId
 * Terminar sesión específica
 */
router.delete('/sessions/:sessionId', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { sessionId } = req.params;
        // ✅ FASE 3: Using SecurityDAO
        const session = await security_dao_1.default.terminateSession(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }
        if (req.user) {
            await SecurityAuditService_1.default.logAdminAction(req.user.id, 'terminate_session', 'active_sessions', { sessionId });
        }
        res.json({
            success: true,
            message: 'Sesión terminada'
        });
    }
    catch (error) {
        console.error('[SECURITY] Error terminando sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al terminar sesión',
            error: error.message
        });
    }
});
/**
 * POST /api/security/sessions/cleanup
 * Limpiar sesiones expiradas
 */
router.post('/sessions/cleanup', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        // ✅ FASE 3: Using SecurityDAO
        const deleted = await security_dao_1.default.cleanupExpiredSessions();
        res.json({
            success: true,
            message: `Eliminadas ${deleted} sesiones expiradas`
        });
    }
    catch (error) {
        console.error('[SECURITY] Error limpiando sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar sesiones',
            error: error.message
        });
    }
});
console.log('[SECURITY-ROUTES] Rutas de seguridad cargadas');
exports.default = router;
//# sourceMappingURL=security.js.map