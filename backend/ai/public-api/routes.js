/**
 * 🌐 PUBLIC API ROUTES - Semana 25
 * 
 * Endpoints para API Pública:
 * - Documentación
 * - API Keys
 * - OAuth2
 * - Webhooks
 * - Integraciones
 * - Sandbox
 * - Analytics
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const publicAPIService = require('./public_api_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('PUBLIC_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/public/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await publicAPIService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Documentation ============

/**
 * GET /api/public/docs
 * Documentación de API
 */
router.get('/docs', async (req, res) => {
    try {
        const docs = await publicAPIService.getAPIDocumentation();
        res.json({ success: true, data: docs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/public/sdk/examples
 * Ejemplos de SDK
 */
router.get('/sdk/examples', async (req, res) => {
    try {
        const examples = await publicAPIService.getSDKExamples();
        res.json({ success: true, data: examples });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ API Keys ============

/**
 * POST /api/public/keys/generate
 * Generar API Key
 */
router.post('/keys/generate', async (req, res) => {
    try {
        const { organizationId, plan } = req.body;
        if (!organizationId) {
            return res.status(400).json({ success: false, error: 'Se requiere organizationId' });
        }
        const result = await publicAPIService.generateAPIKey(organizationId, plan);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/public/keys/validate
 * Validar API Key
 */
router.post('/keys/validate', async (req, res) => {
    try {
        const { apiKey } = req.body;
        const result = await publicAPIService.validateAPIKey(apiKey);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/public/keys/:keyPrefix
 * Revocar API Key
 */
router.delete('/keys/:keyPrefix', async (req, res) => {
    try {
        const { keyPrefix } = req.params;
        const result = await publicAPIService.revokeAPIKey(keyPrefix);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ OAuth2 ============

/**
 * POST /api/public/oauth2/authorize
 * Iniciar flujo OAuth2
 */
router.post('/oauth2/authorize', async (req, res) => {
    try {
        const { clientId, redirectUri, scope } = req.body;
        const result = await publicAPIService.initiateOAuth2Flow(clientId, redirectUri, scope);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/public/oauth2/token
 * Intercambiar código por token
 */
router.post('/oauth2/token', async (req, res) => {
    try {
        const { code, clientId, clientSecret } = req.body;
        const tokens = await publicAPIService.exchangeCodeForToken(code, clientId, clientSecret);
        res.json({ success: true, data: tokens });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Quotas ============

/**
 * GET /api/public/usage/:organizationId
 * Ver uso de API
 */
router.get('/usage/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const stats = await publicAPIService.getUsageStats(organizationId);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/public/quota/check
 * Verificar cuota
 */
router.post('/quota/check', async (req, res) => {
    try {
        const { organizationId, endpoint } = req.body;
        const result = await publicAPIService.checkQuota(organizationId, endpoint);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Webhooks ============

/**
 * POST /api/public/webhooks
 * Registrar webhook
 */
router.post('/webhooks', async (req, res) => {
    try {
        const { organizationId, url, events } = req.body;
        const webhook = await publicAPIService.registerWebhook(organizationId, { url, events });
        res.json({ success: true, data: webhook });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/public/webhooks/:organizationId
 * Listar webhooks
 */
router.get('/webhooks/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const webhooks = await publicAPIService.listWebhooks(organizationId);
        res.json({ success: true, data: webhooks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/public/webhooks/:webhookId
 * Eliminar webhook
 */
router.delete('/webhooks/:webhookId', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const result = await publicAPIService.deleteWebhook(webhookId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Integrations ============

/**
 * GET /api/public/integrations/lms
 * Integraciones LMS
 */
router.get('/integrations/lms', async (req, res) => {
    try {
        const integrations = await publicAPIService.getLMSIntegrations();
        res.json({ success: true, data: integrations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/public/integrations/lti/configure
 * Configurar LTI
 */
router.post('/integrations/lti/configure', async (req, res) => {
    try {
        const { platform, config } = req.body;
        const result = await publicAPIService.configureLTI(platform, config);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/public/integrations/third-party
 * Integraciones de terceros
 */
router.get('/integrations/third-party', async (req, res) => {
    try {
        const integrations = await publicAPIService.getThirdPartyIntegrations();
        res.json({ success: true, data: integrations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/public/integrations/connect
 * Conectar integración
 */
router.post('/integrations/connect', async (req, res) => {
    try {
        const { platform, credentials } = req.body;
        const result = await publicAPIService.connectIntegration(platform, credentials);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Sandbox ============

/**
 * POST /api/public/sandbox/create
 * Crear sandbox de pruebas
 */
router.post('/sandbox/create', async (req, res) => {
    try {
        const { organizationId } = req.body;
        const sandbox = await publicAPIService.createSandbox(organizationId);
        res.json({ success: true, data: sandbox });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/public/sandbox/:sandboxId/status
 * Estado del sandbox
 */
router.get('/sandbox/:sandboxId/status', async (req, res) => {
    try {
        const { sandboxId } = req.params;
        const status = await publicAPIService.getSandboxStatus(sandboxId);
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ Analytics ============

/**
 * GET /api/public/analytics/:organizationId
 * Analytics de uso de API
 */
router.get('/analytics/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { period } = req.query;
        const analytics = await publicAPIService.getAPIAnalytics(organizationId, period);
        res.json({ success: true, data: analytics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
