/**
 * 🔒 AI SECURITY API ROUTES - Semana 24
 * 
 * Endpoints para Seguridad de IA:
 * - Prompt Injection Detection
 * - PII Protection
 * - Red Teaming
 * - Dependency Audit
 * - Encryption
 * - Access Control
 * - Rate Limiting
 * - Abuse Detection
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const securityService = require('./ai_security_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('AI_SECURITY_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/security/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await securityService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Prompt Injection ============

/**
 * POST /api/ai/security/prompt-injection/detect
 * Detectar prompt injection
 */
router.post('/prompt-injection/detect', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await securityService.detectPromptInjection(text);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/security/prompt-injection/sanitize
 * Sanitizar prompt
 */
router.post('/prompt-injection/sanitize', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await securityService.sanitizePrompt(text);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ PII Protection ============

/**
 * POST /api/ai/security/pii/detect
 * Detectar PII en texto
 */
router.post('/pii/detect', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await securityService.detectPII(text);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/security/pii/redact
 * Redactar PII en texto
 */
router.post('/pii/redact', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Se requiere text' });
        }
        const result = await securityService.redactPII(text);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Red Teaming ============

/**
 * POST /api/ai/security/red-team
 * Ejecutar tests de Red Team
 */
router.post('/red-team', async (req, res) => {
    try {
        const { targetEndpoint, testType } = req.body;
        const results = await securityService.runRedTeamTest(targetEndpoint || '/api/ai/tutor', testType);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Dependencies ============

/**
 * GET /api/ai/security/dependencies/audit
 * Auditar dependencias ML
 */
router.get('/dependencies/audit', async (req, res) => {
    try {
        const audit = await securityService.auditMLDependencies();
        res.json({ success: true, data: audit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Encryption ============

/**
 * GET /api/ai/security/encryption/status
 * Estado de encriptación
 */
router.get('/encryption/status', async (req, res) => {
    try {
        const status = await securityService.getEncryptionStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/security/encryption/encrypt-vector
 * Encriptar vector
 */
router.post('/encryption/encrypt-vector', async (req, res) => {
    try {
        const { vector } = req.body;
        if (!vector) {
            return res.status(400).json({ success: false, error: 'Se requiere vector' });
        }
        const result = await securityService.encryptVector(vector);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Access Control ============

/**
 * POST /api/ai/security/access/check
 * Verificar acceso
 */
router.post('/access/check', async (req, res) => {
    try {
        const { userId, feature, role, hasMFA } = req.body;
        const result = await securityService.checkAccess(userId, feature, role, hasMFA);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/security/access/policy
 * Obtener política de acceso
 */
router.get('/access/policy', async (req, res) => {
    try {
        const policy = await securityService.getAccessControlPolicy();
        res.json({ success: true, data: policy });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Rate Limiting ============

/**
 * POST /api/ai/security/rate-limit/check
 * Verificar rate limit
 */
router.post('/rate-limit/check', async (req, res) => {
    try {
        const { userId, endpoint } = req.body;
        const result = await securityService.checkRateLimit(userId, endpoint);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/security/rate-limit/stats/:userId
 * Stats de rate limit por usuario
 */
router.get('/rate-limit/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await securityService.getRateLimitStats(userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Abuse Detection ============

/**
 * GET /api/ai/security/abuse/detect/:userId
 * Detectar patrones de abuso
 */
router.get('/abuse/detect/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await securityService.detectAbusePatterns(userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Alerts ============

/**
 * GET /api/ai/security/alerts/config
 * Configuración de alertas
 */
router.get('/alerts/config', async (req, res) => {
    try {
        const config = await securityService.configureSecurityAlerts();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/security/alerts/active
 * Alertas activas
 */
router.get('/alerts/active', async (req, res) => {
    try {
        const alerts = await securityService.getActiveAlerts();
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Pentesting ============

/**
 * POST /api/ai/security/scan
 * Ejecutar security scan
 */
router.post('/scan', async (req, res) => {
    try {
        const { targetEndpoint } = req.body;
        const result = await securityService.runSecurityScan(targetEndpoint || '/api/ai');
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
