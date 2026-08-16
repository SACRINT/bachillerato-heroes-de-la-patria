"use strict";
/**
 * 📨 SISTEMA DE NEWSLETTERS - TypeScript
 * Crear y enviar newsletters a suscriptores
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// @ts-ignore
const debug_logger_1 = require('../utils/debug-logger.js');
// @ts-ignore
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
// @ts-ignore
const verificationService_1 = __importDefault(require('../services/verificationService.js'));
const router = express_1.default.Router();
const SUBSCRIBERS_FILE = path_1.default.join(__dirname, '../data/subscribers.json');
const NEWSLETTERS_FILE = path_1.default.join(__dirname, '../data/newsletters.json');
// ============================================
// HELPER FUNCTIONS
// ============================================
async function readSubscribers() {
    try {
        const data = await promises_1.default.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        return { subscribers: [], lastId: 0 };
    }
}
async function saveSubscribers(data) {
    await promises_1.default.writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
}
async function readNewsletters() {
    try {
        const data = await promises_1.default.readFile(NEWSLETTERS_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        return { newsletters: [], lastId: 0 };
    }
}
async function saveNewsletters(data) {
    await promises_1.default.writeFile(NEWSLETTERS_FILE, JSON.stringify(data, null, 2));
}
function generateNewsletterId(lastId) {
    const newId = lastId + 1;
    return `NEWS-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}
function generateNewsletterHTML(content, unsubscribeToken) {
    const unsubscribeLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/subscriptions/unsubscribe/${unsubscribeToken}`;
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter - BGE Héroes de la Patria</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { color: #333; line-height: 1.8; }
        .content h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
        .unsubscribe { color: #999; font-size: 11px; }
        .unsubscribe a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 BGE Héroes de la Patria</h1>
            <p style="margin: 10px 0 0 0;">Newsletter Institucional</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Bachillerato General Estatal "Héroes de la Patria"</strong></p>
            <p>Puebla, México</p>
            <p>📧 contacto.heroesdelapatria.sep@gmail.com</p>
            <p>🌐 <a href="http://tudominio.com">www.bgepuebla.edu.mx</a></p>
            <p class="unsubscribe">
                ¿No deseas recibir más correos?
                <a href="${unsubscribeLink}">Cancelar suscripción</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/newsletters/send
 */
router.post('/send', [
    (0, express_validator_1.body)('subject').trim().notEmpty().withMessage('Se requiere asunto'),
    (0, express_validator_1.body)('content').trim().notEmpty().withMessage('Se requiere contenido'),
    (0, express_validator_1.body)('targetCategory').optional().trim()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    try {
        const { subject, content, targetCategory } = req.body;
        const subscribersData = await readSubscribers();
        const newslettersData = await readNewsletters();
        let targetSubscribers = subscribersData.subscribers.filter(sub => sub.active);
        if (targetCategory && targetCategory !== 'all') {
            targetSubscribers = targetSubscribers.filter(sub => sub.categories.includes(targetCategory) || sub.categories.includes('all'));
        }
        if (targetSubscribers.length === 0) {
            res.status(400).json({
                success: false,
                message: 'No hay suscriptores activos para esta categoría'
            });
            return;
        }
        const newsletterId = generateNewsletterId(newslettersData.lastId);
        const newsletter = {
            id: newsletterId,
            subject: subject,
            content: content,
            targetCategory: targetCategory || 'all',
            sentTo: targetSubscribers.length,
            sentAt: new Date().toISOString(),
            successCount: 0,
            failureCount: 0,
            subscribers: []
        };
        debug_logger_1.debugLog.log('NEWSLETTERS', `📨 Iniciando envío de newsletter: ${newsletterId}`);
        let successCount = 0;
        let failureCount = 0;
        for (const subscriber of targetSubscribers) {
            try {
                const htmlContent = generateNewsletterHTML(content, subscriber.unsubscribeToken);
                await verificationService_1.default.transporter.sendMail({
                    from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                    to: subscriber.email,
                    subject: subject,
                    html: htmlContent
                });
                subscriber.emailsSent = (subscriber.emailsSent || 0) + 1;
                subscriber.lastEmailSent = new Date().toISOString();
                newsletter.subscribers.push({
                    email: subscriber.email,
                    status: 'sent',
                    sentAt: new Date().toISOString()
                });
                successCount++;
                debug_logger_1.debugLog.log('NEWSLETTERS', `✅ Enviado a: ${(0, sanitized_errors_1.maskEmail)(subscriber.email)} (${successCount}/${targetSubscribers.length})`);
                await sleep(1000);
            }
            catch (error) {
                debug_logger_1.debugLog.error('NEWSLETTERS', `❌ Error enviando a ${(0, sanitized_errors_1.maskEmail)(subscriber.email)}`, (0, sanitized_errors_1.sanitizeError)(error, 'newsletters'));
                newsletter.subscribers.push({
                    email: subscriber.email,
                    status: 'failed',
                    error: error.message
                });
                failureCount++;
            }
        }
        newsletter.successCount = successCount;
        newsletter.failureCount = failureCount;
        newslettersData.newsletters.push(newsletter);
        newslettersData.lastId += 1;
        await saveNewsletters(newslettersData);
        await saveSubscribers(subscribersData);
        debug_logger_1.debugLog.log('NEWSLETTERS', `✅ Newsletter enviada: ${newsletterId}`);
        res.json({
            success: true,
            message: 'Newsletter enviada exitosamente',
            newsletter: {
                id: newsletterId,
                subject: subject,
                sentTo: targetSubscribers.length,
                successCount: successCount,
                failureCount: failureCount,
                sentAt: newsletter.sentAt
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NEWSLETTERS', 'Error enviando newsletter', (0, sanitized_errors_1.sanitizeError)(error, 'newsletters'));
        res.status(500).json({
            success: false,
            message: 'Error al enviar newsletter',
            error: error.message
        });
    }
});
/**
 * GET /api/newsletters/list
 */
router.get('/list', async (req, res) => {
    try {
        const newslettersData = await readNewsletters();
        const newsletters = newslettersData.newsletters.map(news => ({
            id: news.id,
            subject: news.subject,
            targetCategory: news.targetCategory,
            sentTo: news.sentTo,
            successCount: news.successCount,
            failureCount: news.failureCount,
            sentAt: news.sentAt
        }));
        res.json({
            success: true,
            newsletters: newsletters,
            total: newsletters.length
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NEWSLETTERS', 'Error listando newsletters', (0, sanitized_errors_1.sanitizeError)(error, 'newsletters'));
        res.status(500).json({ success: false, message: 'Error al obtener newsletters' });
    }
});
/**
 * GET /api/newsletters/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const newslettersData = await readNewsletters();
        const newsletter = newslettersData.newsletters.find(news => news.id === id);
        if (!newsletter) {
            res.status(404).json({ success: false, message: 'Newsletter no encontrada' });
            return;
        }
        res.json({ success: true, newsletter: newsletter });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NEWSLETTERS', 'Error obteniendo newsletter', (0, sanitized_errors_1.sanitizeError)(error, 'newsletters'));
        res.status(500).json({ success: false, message: 'Error al obtener newsletter' });
    }
});
module.exports = router;
//# sourceMappingURL=newsletters.js.map