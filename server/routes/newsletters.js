/**
 * 📨 SISTEMA DE NEWSLETTERS
 * Crear y enviar newsletters a suscriptores
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const verificationService = require('../services/verificationService');

const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');
const NEWSLETTERS_FILE = path.join(__dirname, '../data/newsletters.json');

/**
 * 📖 Leer suscriptores
 */
async function readSubscribers() {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { subscribers: [], lastId: 0 };
    }
}

/**
 * 💾 Guardar suscriptores
 */
async function saveSubscribers(data) {
    await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
}

/**
 * 📖 Leer newsletters
 */
async function readNewsletters() {
    try {
        const data = await fs.readFile(NEWSLETTERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { newsletters: [], lastId: 0 };
    }
}

/**
 * 💾 Guardar newsletters
 */
async function saveNewsletters(data) {
    await fs.writeFile(NEWSLETTERS_FILE, JSON.stringify(data, null, 2));
}

/**
 * 🆔 Generar ID para newsletter
 */
function generateNewsletterId(lastId) {
    const newId = lastId + 1;
    return `NEWS-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

/**
 * 🎨 Generar HTML profesional para newsletter
 */
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
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            color: #333;
            line-height: 1.8;
        }
        .content h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .content h3 {
            color: #764ba2;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
        .unsubscribe {
            color: #999;
            font-size: 11px;
        }
        .unsubscribe a {
            color: #667eea;
            text-decoration: none;
        }
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

/**
 * ⏱️ Sleep function para rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 📨 POST /api/newsletters/send
 * Enviar newsletter a suscriptores
 */
router.post('/send', [
    body('subject').trim().notEmpty().withMessage('Se requiere asunto'),
    body('content').trim().notEmpty().withMessage('Se requiere contenido'),
    body('targetCategory').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { subject, content, targetCategory } = req.body;

        const subscribersData = await readSubscribers();
        const newslettersData = await readNewsletters();

        // Filtrar suscriptores activos según categoría
        let targetSubscribers = subscribersData.subscribers.filter(sub => sub.active);

        if (targetCategory && targetCategory !== 'all') {
            targetSubscribers = targetSubscribers.filter(sub =>
                sub.categories.includes(targetCategory) || sub.categories.includes('all')
            );
        }

        if (targetSubscribers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay suscriptores activos para esta categoría'
            });
        }

        // Crear registro de newsletter
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

        console.log(`📨 Iniciando envío de newsletter: ${newsletterId}`);
        console.log(`📊 Destinatarios: ${targetSubscribers.length}`);

        // Enviar a cada suscriptor (con rate limiting)
        let successCount = 0;
        let failureCount = 0;

        for (const subscriber of targetSubscribers) {
            try {
                const htmlContent = generateNewsletterHTML(content, subscriber.unsubscribeToken);

                await verificationService.transporter.sendMail({
                    from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                    to: subscriber.email,
                    subject: subject,
                    html: htmlContent
                });

                // Actualizar estadísticas del suscriptor
                subscriber.emailsSent = (subscriber.emailsSent || 0) + 1;
                subscriber.lastEmailSent = new Date().toISOString();

                newsletter.subscribers.push({
                    email: subscriber.email,
                    status: 'sent',
                    sentAt: new Date().toISOString()
                });

                successCount++;
                console.log(`✅ Enviado a: ${subscriber.email} (${successCount}/${targetSubscribers.length})`);

                // Rate limiting: 1 email por segundo
                await sleep(1000);

            } catch (error) {
                console.error(`❌ Error enviando a ${subscriber.email}:`, error.message);

                newsletter.subscribers.push({
                    email: subscriber.email,
                    status: 'failed',
                    error: error.message
                });

                failureCount++;
            }
        }

        // Actualizar estadísticas finales
        newsletter.successCount = successCount;
        newsletter.failureCount = failureCount;

        // Guardar newsletter y suscriptores actualizados
        newslettersData.newsletters.push(newsletter);
        newslettersData.lastId += 1;

        await saveNewsletters(newslettersData);
        await saveSubscribers(subscribersData);

        console.log(`✅ Newsletter enviada: ${newsletterId}`);
        console.log(`📊 Éxitos: ${successCount}, Fallos: ${failureCount}`);

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

    } catch (error) {
        console.error('Error enviando newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar newsletter',
            error: error.message
        });
    }
});

/**
 * 📋 GET /api/newsletters/list
 * Listar newsletters enviadas
 */
router.get('/list', async (req, res) => {
    try {
        const newslettersData = await readNewsletters();

        // Retornar sin datos de suscriptores individuales (solo estadísticas)
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

    } catch (error) {
        console.error('Error listando newsletters:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener newsletters'
        });
    }
});

/**
 * 📄 GET /api/newsletters/:id
 * Obtener detalle de una newsletter
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const newslettersData = await readNewsletters();

        const newsletter = newslettersData.newsletters.find(news => news.id === id);

        if (!newsletter) {
            return res.status(404).json({
                success: false,
                message: 'Newsletter no encontrada'
            });
        }

        res.json({
            success: true,
            newsletter: newsletter
        });

    } catch (error) {
        console.error('Error obteniendo newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener newsletter'
        });
    }
});

module.exports = router;