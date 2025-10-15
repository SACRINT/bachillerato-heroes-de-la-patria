import { body, validationResult } from 'express-validator';
import fs from 'fs'.promises;
import path from 'path';
import crypto from 'crypto';
import { URL } from 'url';

// Archivo de base de datos JSON (ajustado para Vercel)
const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data/subscribers.json');
const NEWSLETTERS_FILE = path.join(process.cwd(), 'data/newsletters.json');

// ============================================
// HELPERS (Adaptados para Serverless)
// ============================================

async function readSubscribers() {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error leyendo subscribers.json:', error);
        return { subscribers: [], lastId: 0 };
    }
}

async function saveSubscribers(data) {
    // ⚠️ ADVERTENCIA: En Serverless, escribir en el sistema de archivos NO es persistente.
    // Los cambios se perderán entre invocaciones. Esto debería ir a una base de datos.
    console.warn('⚠️ Intentando guardar suscriptores en archivo JSON. Esto NO persistirá en Serverless.');
    try {
        await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error guardando suscriptores en JSON:', error);
        return false;
    }
}

async function readNewsletters() {
    try {
        const data = await fs.readFile(NEWSLETTERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error leyendo newsletters.json:', error);
        return { newsletters: [], lastId: 0 };
    }
}

async function saveNewsletters(data) {
    // ⚠️ ADVERTENCIA: En Serverless, escribir en el sistema de archivos NO es persistente.
    // Los cambios se perderán entre invocaciones. Esto debería ir a una base de datos.
    console.warn('⚠️ Intentando guardar newsletters en archivo JSON. Esto NO persistirá en Serverless.');
    try {
        await fs.writeFile(NEWSLETTERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error guardando newsletters en JSON:', error);
        return false;
    }
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// HANDLER PRINCIPAL PARA /api/newsletters
// ============================================

export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/newsletters', '');

    try {
        // Validar variables de entorno para email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
            console.warn('⚠️ Variables de entorno EMAIL_USER, EMAIL_PASS o EMAIL_TO no configuradas. El envío de emails podría fallar.');
            // No se hace return 500 aquí para permitir que otras rutas funcionen
        }

        switch (path) {
            case '/send':
                if (req.method === 'POST') {
                    await Promise.all(sendValidation.map(validation => validation.run(req)));
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ success: false, errors: errors.array() });
                    }

                    const { subject, content, targetCategory } = req.body;

                    const subscribersData = await readSubscribers();
                    const newslettersData = await readNewsletters();

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

                    let successCount = 0;
                    let failureCount = 0;

                    for (const subscriber of targetSubscribers) {
                        try {
                            const htmlContent = generateNewsletterHTML(content, subscriber.unsubscribeToken);

                            const verificationService = await import('../server/services/verificationService.js');
                            await verificationService.default.transporter.sendMail({
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
                            console.log(`✅ Enviado a: ${subscriber.email} (${successCount}/${targetSubscribers.length})`);

                            await sleep(1000); // Rate limiting: 1 email por segundo

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

                    newsletter.successCount = successCount;
                    newsletter.failureCount = failureCount;

                    await saveNewsletters(newslettersData); // ⚠️ NO PERSISTENTE EN SERVERLESS
                    await saveSubscribers(subscribersData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                    console.log(`✅ Newsletter enviada: ${newsletterId}`);
                    console.log(`📊 Éxitos: ${successCount}, Fallos: ${failureCount}`);

                    return res.status(200).json({
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
                break;

            case '/list':
                if (req.method === 'GET') {
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

                    return res.status(200).json({
                        success: true,
                        newsletters: newsletters,
                        total: newsletters.length
                    });
                }
                break;

            case '/detail': // Adaptación para /api/newsletters?id=... o /api/newsletters/:id
                if (req.method === 'GET') {
                    const id = req.query.id || path.split('/').pop();

                    if (!id) {
                        return res.status(400).json({ success: false, message: 'ID de newsletter requerido' });
                    }

                    const newslettersData = await readNewsletters();
                    const newsletter = newslettersData.newsletters.find(news => news.id === id);

                    if (!newsletter) {
                        return res.status(404).json({ success: false, message: 'Newsletter no encontrada' });
                    }

                    return res.status(200).json({
                        success: true,
                        newsletter: newsletter
                    });
                }
                break;

            default:
                res.status(404).json({ error: 'Endpoint no encontrado', path: url.pathname });
                break;
        }
    } catch (error) {
        console.error('❌ Error en la función newsletters:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
}

// Validaciones para envío de newsletter
const sendValidation = [
    body('subject').trim().notEmpty().withMessage('Se requiere asunto'),
    body('content').trim().notEmpty().withMessage('Se requiere contenido'),
    body('targetCategory').optional().trim()
];