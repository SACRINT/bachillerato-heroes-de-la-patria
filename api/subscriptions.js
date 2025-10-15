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

// ⚠️ ADVERTENCIA: initializeDataFiles NO persistirá en Serverless.
// Los archivos JSON deben existir en el build de Vercel.
async function initializeDataFiles() {
    // En Vercel, el sistema de archivos es de solo lectura para el código desplegado.
    // No se pueden crear directorios o escribir archivos en tiempo de ejecución.
    // Esta función es principalmente para desarrollo local.
    const dataDir = path.join(process.cwd(), 'data');
    try {
        await fs.access(dataDir);
    } catch {
        // console.warn('⚠️ Directorio de datos no encontrado en Serverless. No se creará.');
    }

    // Inicializar subscribers.json
    try {
        await fs.access(SUBSCRIBERS_FILE);
    } catch {
        // console.warn('⚠️ Archivo subscribers.json no encontrado en Serverless. No se creará.');
    }

    // Inicializar newsletters.json
    try {
        await fs.access(NEWSLETTERS_FILE);
    } catch {
        // console.warn('⚠️ Archivo newsletters.json no encontrado en Serverless. No se creará.');
    }
}

// initializeDataFiles(); // No llamar aquí, ya que no es persistente en Serverless

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

function generateSubscriberId(lastId) {
    const newId = lastId + 1;
    return `SUB-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

function generateUnsubscribeToken() {
    return crypto.randomBytes(32).toString('hex');
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

// ============================================
// HANDLER PRINCIPAL PARA /api/subscriptions
// ============================================

export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/subscriptions', '');

    try {
        // Validar variables de entorno para email (si se usan)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
            console.warn('⚠️ Variables de entorno EMAIL_USER, EMAIL_PASS o EMAIL_TO no configuradas. El envío de emails podría fallar.');
            // No se hace return 500 aquí para permitir que otras rutas funcionen
        }

        switch (path) {
            case '/subscribe':
                if (req.method === 'POST') {
                    await Promise.all(subscribeValidation.map(validation => validation.run(req)));
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ success: false, errors: errors.array() });
                    }

                    const { email, name, categories, source } = req.body;
                    const subscribersData = await readSubscribers();

                    const activeSubscriber = subscribersData.subscribers.find(
                        sub => sub.email === email && sub.active
                    );

                    if (activeSubscriber) {
                        return res.status(200).json({
                            success: true,
                            message: 'Ya estás suscrito',
                            subscriber: activeSubscriber,
                            existed: true
                        });
                    }

                    const inactiveSubscriber = subscribersData.subscribers.find(
                        sub => sub.email === email && !sub.active
                    );

                    if (inactiveSubscriber) {
                        inactiveSubscriber.active = true;
                        inactiveSubscriber.resubscribedAt = new Date().toISOString();
                        inactiveSubscriber.name = name || inactiveSubscriber.name;
                        inactiveSubscriber.categories = categories || inactiveSubscriber.categories;
                        inactiveSubscriber.source = source || inactiveSubscriber.source;
                        delete inactiveSubscriber.unsubscribedAt;

                        await saveSubscribers(subscribersData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                        return res.status(200).json({
                            success: true,
                            message: 'Suscripción reactivada exitosamente',
                            subscriber: {
                                id: inactiveSubscriber.id,
                                email: email,
                                categories: inactiveSubscriber.categories
                            },
                            existed: false,
                            reactivated: true
                        });
                    }

                    const subscriberId = generateSubscriberId(subscribersData.lastId);
                    const unsubscribeToken = generateUnsubscribeToken();

                    const newSubscriber = {
                        id: subscriberId,
                        email: email,
                        name: name || 'Suscriptor',
                        categories: categories || ['all'],
                        source: source || 'newsletter',
                        subscribedAt: new Date().toISOString(),
                        active: true,
                        unsubscribeToken: unsubscribeToken,
                        emailsSent: 0,
                        lastEmailSent: null
                    };

                    subscribersData.subscribers.push(newSubscriber);
                    subscribersData.lastId++;

                    await saveSubscribers(subscribersData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                    return res.status(200).json({
                        success: true,
                        message: 'Suscripción exitosa',
                        subscriber: {
                            id: subscriberId,
                            email: email,
                            categories: newSubscriber.categories
                        },
                        existed: false,
                        reactivated: false
                    });
                }
                break;

            case '/list':
                if (req.method === 'GET') {
                    const subscribersData = await readSubscribers();
                    const activeSubscribers = subscribersData.subscribers.filter(
                        sub => sub.active
                    );

                    return res.status(200).json({
                        success: true,
                        subscribers: activeSubscribers,
                        total: activeSubscribers.length,
                        statistics: {
                            total: subscribersData.subscribers.length,
                            active: activeSubscribers.length,
                            inactive: subscribersData.subscribers.length - activeSubscribers.length
                        }
                    });
                }
                break;

            case '/unsubscribe':
                if (req.method === 'GET') {
                    const token = params.token || url.pathname.split('/').pop();

                    if (!token) {
                        return res.status(400).send(`...`); // HTML omitido
                    }

                    const subscribersData = await readSubscribers();
                    const subscriber = subscribersData.subscribers.find(
                        sub => sub.unsubscribeToken === token
                    );

                    if (!subscriber) {
                        return res.status(404).send(`...`); // HTML omitido
                    }

                    subscriber.active = false;
                    subscriber.unsubscribedAt = new Date().toISOString();

                    await saveSubscribers(subscribersData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                    return res.status(200).send(`...`); // HTML omitido
                }
                break;

            case '/stats':
                if (req.method === 'GET') {
                    const subscribersData = await readSubscribers();
                    const newslettersData = await readNewsletters();

                    const activeSubscribers = subscribersData.subscribers.filter(sub => sub.active);

                    const statsByCategory = {};
                    activeSubscribers.forEach(sub => {
                        sub.categories.forEach(cat => {
                            statsByCategory[cat] = (statsByCategory[cat] || 0) + 1;
                        });
                    });

                    return res.status(200).json({
                        success: true,
                        statistics: {
                            totalSubscribers: subscribersData.subscribers.length,
                            activeSubscribers: activeSubscribers.length,
                            inactiveSubscribers: subscribersData.subscribers.length - activeSubscribers.length,
                            byCategory: statsByCategory,
                            newslettersSent: newslettersData.newsletters.length,
                            lastNewsletter: newslettersData.newsletters[newslettersData.newsletters.length - 1] || null
                        }
                    });
                }
                break;

            default:
                res.status(404).json({ error: 'Endpoint no encontrado', path: url.pathname });
                break;
        }
    } catch (error) {
        console.error('❌ Error en la función subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
}

// Validaciones para suscripción
const subscribeValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('name').optional().trim(),
    body('categories').optional().isArray(),
    body('source').optional().trim()
];