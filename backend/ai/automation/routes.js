/**
 * 🤖 ADMINISTRATIVE AUTOMATION API ROUTES - Semana 16
 * 
 * Endpoints para el Sistema de Automatización (RPA + AI):
 * - Procesamiento OCR de documentos
 * - Clasificación de correos
 * - Validación de pagos
 * - Generación de constancias
 * - Validación de fotos
 * - Generación de horarios
 * - Métricas y monitoreo
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const automationService = require('./automation_service');
const devLogger = require('../../utils/devLogger');

// Middleware de logging
router.use((req, res, next) => {
    devLogger.log('AUTOMATION_API', `${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ai/automation/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
    try {
        const health = await automationService.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/automation/processes
 * Obtener lista de procesos automatizables
 */
router.get('/processes', (req, res) => {
    try {
        const processes = automationService.getAutomatableProcesses();
        res.json({ success: true, data: processes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/automation/metrics
 * Obtener métricas de automatización
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = automationService.getAutomationMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/ocr
 * Procesar documento con OCR
 */
router.post('/ocr', async (req, res) => {
    try {
        const { documentPath, documentType } = req.body;
        if (!documentType) {
            return res.status(400).json({ success: false, error: 'Se requiere documentType' });
        }
        const result = await automationService.processDocumentOCR(documentPath, documentType);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/extract-form
 * Extraer datos de formulario
 */
router.post('/extract-form', async (req, res) => {
    try {
        const { formImage } = req.body;
        const result = await automationService.extractFormData(formImage);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/classify-email
 * Clasificar correo electrónico
 */
router.post('/classify-email', async (req, res) => {
    try {
        const { subject, body } = req.body;
        if (!subject && !body) {
            return res.status(400).json({ success: false, error: 'Se requiere subject o body' });
        }
        const result = await automationService.classifyEmail(subject || '', body || '');
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/validate-payment
 * Validar pago
 */
router.post('/validate-payment', async (req, res) => {
    try {
        const paymentData = req.body;
        if (!paymentData.reference) {
            return res.status(400).json({ success: false, error: 'Se requiere reference' });
        }
        const result = await automationService.validatePayment(paymentData);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/generate-certificate
 * Generar constancia
 */
router.post('/generate-certificate', async (req, res) => {
    try {
        const { studentId, certificateType } = req.body;
        if (!studentId || !certificateType) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren studentId y certificateType'
            });
        }
        const result = await automationService.generateCertificate(studentId, certificateType);
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/validate-photo
 * Validar foto de perfil
 */
router.post('/validate-photo', async (req, res) => {
    try {
        const { photoData } = req.body;
        const result = await automationService.validateProfilePhoto(photoData);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/generate-schedule
 * Generar horario automático
 */
router.post('/generate-schedule', async (req, res) => {
    try {
        const parameters = req.body;
        const result = await automationService.generateSchedule(parameters);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/ai/automation/flag-review
 * Marcar tarea para revisión humana
 */
router.post('/flag-review', async (req, res) => {
    try {
        const { taskId, taskType, reason } = req.body;
        if (!taskId || !taskType || !reason) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren taskId, taskType y reason'
            });
        }
        const result = await automationService.flagForHumanReview(taskId, taskType, reason);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/ai/automation/pending-reviews
 * Obtener tareas pendientes de revisión
 */
router.get('/pending-reviews', async (req, res) => {
    try {
        const reviews = await automationService.getPendingReviews();
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
