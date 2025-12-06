/**
 * Rutas de Seguridad
 * BGE Héroes de la Patria
 * FASE 4 - Semana 27-28
 *
 * Endpoints para gestión de seguridad, auditoría y rate limiting
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const securityService = require('../services/SecurityService');
const rateLimiter = require('../services/RateLimiterService');
const auditService = require('../services/SecurityAuditService');

// ✅ FASE 3: Using DAO layer instead of direct pool access
const SecurityDAO = require('../data/security.dao');

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
router.get('/audit/logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            eventType,
            userId,
            ip,
            severity,
            success,
            startDate,
            endDate,
            resource,
            page = 1,
            limit = 50
        } = req.query;

        const result = await auditService.query(
            {
                eventType,
                userId: userId ? parseInt(userId) : undefined,
                ip,
                severity: severity ? parseInt(severity) : undefined,
                success: success !== undefined ? success === 'true' : undefined,
                startDate,
                endDate,
                resource
            },
            { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
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
router.get('/audit/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate = new Date().toISOString()
        } = req.query;

        const summary = await auditService.getSummary(startDate, endDate);

        res.json({
            success: true,
            data: {
                period: { startDate, endDate },
                summary
            }
        });
    } catch (error) {
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
router.get('/audit/suspicious', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { hours = 24 } = req.query;
        const suspicious = await auditService.getSuspiciousActivity(parseInt(hours));

        res.json({
            success: true,
            data: {
                period: `${hours} hours`,
                threats: suspicious
            }
        });
    } catch (error) {
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
router.get('/audit/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 100 } = req.query;

        const timeline = await auditService.getUserTimeline(parseInt(userId), parseInt(limit));

        res.json({
            success: true,
            data: {
                userId: parseInt(userId),
                events: timeline
            }
        });
    } catch (error) {
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
router.post('/audit/export', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { filters, format = 'json' } = req.body;

        const exported = await auditService.exportLogs(filters, format);

        // Log la exportación
        await auditService.logAdminAction(
            req.user.id,
            'export_audit_logs',
            'security_audit_logs',
            { filters, format }
        );

        if (format === 'csv') {
            res.set('Content-Type', 'text/csv');
            res.set('Content-Disposition', 'attachment; filename=audit_logs.csv');
            return res.send(exported);
        }

        res.json({
            success: true,
            data: exported
        });
    } catch (error) {
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
router.post('/audit/cleanup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { retentionDays = 90 } = req.body;

        const deleted = await auditService.cleanup(parseInt(retentionDays));

        await auditService.logAdminAction(
            req.user.id,
            'cleanup_audit_logs',
            'security_audit_logs',
            { retentionDays, deletedCount: deleted }
        );

        res.json({
            success: true,
            message: `Eliminados ${deleted} logs antiguos`,
            deletedCount: deleted
        });
    } catch (error) {
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
router.get('/rate-limit/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = rateLimiter.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
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
router.get('/rate-limit/top-consumers', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const consumers = rateLimiter.getTopConsumers(parseInt(limit));

        res.json({
            success: true,
            data: consumers
        });
    } catch (error) {
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
router.get('/rate-limit/config', authenticateToken, requireAdmin, (req, res) => {
    try {
        const config = rateLimiter.getConfig();

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
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
router.post('/rate-limit/block', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { identifier, durationMinutes = 60, reason } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el identificador'
            });
        }

        rateLimiter.block(identifier, durationMinutes * 60 * 1000, reason);

        await auditService.logAdminAction(
            req.user.id,
            'block_identifier',
            'rate_limiter',
            { identifier, durationMinutes, reason }
        );

        res.json({
            success: true,
            message: `${identifier} bloqueado por ${durationMinutes} minutos`
        });
    } catch (error) {
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
router.post('/rate-limit/unblock', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el identificador'
            });
        }

        rateLimiter.unblock(identifier);

        await auditService.logAdminAction(
            req.user.id,
            'unblock_identifier',
            'rate_limiter',
            { identifier }
        );

        res.json({
            success: true,
            message: `${identifier} desbloqueado`
        });
    } catch (error) {
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
router.post('/rate-limit/whitelist', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ip } = req.body;

        if (!ip) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere la IP'
            });
        }

        rateLimiter.addToWhitelist(ip);

        await auditService.logAdminAction(
            req.user.id,
            'add_to_whitelist',
            'rate_limiter',
            { ip }
        );

        res.json({
            success: true,
            message: `${ip} agregada a whitelist`
        });
    } catch (error) {
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
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const stats = {
            security: securityService.getStats(),
            rateLimiter: rateLimiter.getStats(),
            audit: auditService.getStats()
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
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

        const result = securityService.validatePasswordStrength(password);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
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
router.post('/detect-threats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { input } = req.body;

        if (!input) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el input a analizar'
            });
        }

        const threats = securityService.detectAttackPatterns(input);

        res.json({
            success: true,
            data: {
                input: input.substring(0, 100),
                threats,
                threatCount: threats.length
            }
        });
    } catch (error) {
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
router.post('/generate-token', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { type = 'token', length = 32 } = req.body;

        let token;
        if (type === 'otp') {
            token = securityService.generateOTP(Math.min(length, 8));
        } else {
            token = securityService.generateSecureToken(Math.min(length, 64));
        }

        res.json({
            success: true,
            data: { token, type, length: token.length }
        });
    } catch (error) {
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
router.post('/generate-password', authenticateToken, (req, res) => {
    try {
        const { length = 16 } = req.body;
        const password = securityService.generateRandomPassword(Math.min(length, 32));

        res.json({
            success: true,
            data: { password, length: password.length }
        });
    } catch (error) {
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
router.get('/alerts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, severity, page = 1, limit = 20 } = req.query;

        // ✅ FASE 3: Using SecurityDAO
        const alerts = await SecurityDAO.getAlerts({ status, severity, limit: parseInt(limit), page: parseInt(page) });

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
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
router.put('/alerts/:id/acknowledge', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ FASE 3: Using SecurityDAO
        const alert = await SecurityDAO.acknowledgeAlert(id, req.user.id);

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
    } catch (error) {
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
router.put('/alerts/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        // ✅ FASE 3: Using SecurityDAO
        const alert = await SecurityDAO.resolveAlert(id, req.user.id, notes);

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
    } catch (error) {
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
router.get('/blocked-ips', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // ✅ FASE 3: Using SecurityDAO
        const blockedIPs = await SecurityDAO.getBlockedIPs();

        res.json({
            success: true,
            data: blockedIPs
        });
    } catch (error) {
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
router.post('/blocked-ips', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ip, reason, isPermanent = false, durationMinutes } = req.body;

        if (!ip) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere la IP'
            });
        }

        const blockedUntil = isPermanent
            ? null
            : new Date(Date.now() + (durationMinutes || 60) * 60 * 1000).toISOString();

        // ✅ FASE 3: Using SecurityDAO
        const blockedIP = await SecurityDAO.blockIP(ip, reason, req.user.id, isPermanent, blockedUntil);

        await auditService.logAdminAction(
            req.user.id,
            'block_ip',
            'blocked_ips',
            { ip, reason, isPermanent, durationMinutes }
        );

        res.json({
            success: true,
            data: blockedIP
        });
    } catch (error) {
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
router.delete('/blocked-ips/:ip', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ip } = req.params;

        // ✅ FASE 3: Using SecurityDAO
        const unblocked = await SecurityDAO.unblockIP(ip);

        if (!unblocked) {
            return res.status(404).json({
                success: false,
                message: 'IP no encontrada en lista de bloqueados'
            });
        }

        await auditService.logAdminAction(
            req.user.id,
            'unblock_ip',
            'blocked_ips',
            { ip }
        );

        res.json({
            success: true,
            message: `IP ${ip} desbloqueada`
        });
    } catch (error) {
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
router.get('/sessions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, active } = req.query;

        // ✅ FASE 3: Using SecurityDAO
        const sessions = await SecurityDAO.getSessions({ userId, active });

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
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
router.delete('/sessions/:sessionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // ✅ FASE 3: Using SecurityDAO
        const session = await SecurityDAO.terminateSession(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }

        await auditService.logAdminAction(
            req.user.id,
            'terminate_session',
            'active_sessions',
            { sessionId }
        );

        res.json({
            success: true,
            message: 'Sesión terminada'
        });
    } catch (error) {
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
router.post('/sessions/cleanup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // ✅ FASE 3: Using SecurityDAO
        const deleted = await SecurityDAO.cleanupExpiredSessions();

        res.json({
            success: true,
            message: `Eliminadas ${deleted} sesiones expiradas`
        });
    } catch (error) {
        console.error('[SECURITY] Error limpiando sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar sesiones',
            error: error.message
        });
    }
});

console.log('[SECURITY-ROUTES] Rutas de seguridad cargadas');

module.exports = router;
