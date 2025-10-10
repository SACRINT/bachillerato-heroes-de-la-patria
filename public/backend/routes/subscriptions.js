/**
 * 📧 SISTEMA DE SUSCRIPCIONES Y NEWSLETTERS
 * Gestiona suscriptores y envío de newsletters
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const verificationService = require('../services/verificationService');

// Archivo de base de datos JSON
const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');
const NEWSLETTERS_FILE = path.join(__dirname, '../data/newsletters.json');

/**
 * 🔧 Inicializar archivos de datos
 */
async function initializeDataFiles() {
    try {
        // Crear directorio data si no existe
        const dataDir = path.join(__dirname, '../data');
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }

        // Inicializar subscribers.json
        try {
            await fs.access(SUBSCRIBERS_FILE);
        } catch {
            const initialData = {
                subscribers: [],
                lastId: 0
            };
            await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(initialData, null, 2));
            console.log('✅ Archivo subscribers.json creado');
        }

        // Inicializar newsletters.json
        try {
            await fs.access(NEWSLETTERS_FILE);
        } catch {
            const initialData = {
                newsletters: [],
                lastId: 0
            };
            await fs.writeFile(NEWSLETTERS_FILE, JSON.stringify(initialData, null, 2));
            console.log('✅ Archivo newsletters.json creado');
        }
    } catch (error) {
        console.error('❌ Error inicializando archivos:', error);
    }
}

// Inicializar al cargar el módulo
initializeDataFiles();

/**
 * 📖 Leer suscriptores
 */
async function readSubscribers() {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo suscriptores:', error);
        return { subscribers: [], lastId: 0 };
    }
}

/**
 * 💾 Guardar suscriptores
 */
async function saveSubscribers(data) {
    try {
        await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando suscriptores:', error);
        return false;
    }
}

/**
 * 📖 Leer newsletters
 */
async function readNewsletters() {
    try {
        const data = await fs.readFile(NEWSLETTERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo newsletters:', error);
        return { newsletters: [], lastId: 0 };
    }
}

/**
 * 💾 Guardar newsletters
 */
async function saveNewsletters(data) {
    try {
        await fs.writeFile(NEWSLETTERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando newsletters:', error);
        return false;
    }
}

/**
 * 🆔 Generar ID único para suscriptor
 */
function generateSubscriberId(lastId) {
    const newId = lastId + 1;
    return `SUB-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

/**
 * 🔑 Generar token de cancelación
 */
function generateUnsubscribeToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

/**
 * ➕ POST /api/subscriptions/subscribe
 * Agregar nuevo suscriptor
 */
router.post('/subscribe', [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('name').optional().trim(),
    body('categories').optional().isArray(),
    body('source').optional().trim() // 'newsletter' o 'notifications'
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { email, name, categories, source } = req.body;

        const subscribersData = await readSubscribers();

        // Verificar si ya existe
        const existingSubscriber = subscribersData.subscribers.find(
            sub => sub.email === email && sub.active
        );

        if (existingSubscriber) {
            return res.json({
                success: true,
                message: 'Ya estás suscrito',
                subscriber: existingSubscriber
            });
        }

        // Crear nuevo suscriptor
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
        subscribersData.lastId += 1;

        await saveSubscribers(subscribersData);

        console.log(`✅ Nuevo suscriptor: ${email} (${subscriberId})`);

        res.json({
            success: true,
            message: 'Suscripción exitosa',
            subscriber: {
                id: subscriberId,
                email: email,
                categories: newSubscriber.categories
            }
        });

    } catch (error) {
        console.error('Error en suscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar suscripción'
        });
    }
});

/**
 * 📋 GET /api/subscriptions/list
 * Listar todos los suscriptores (requiere admin)
 */
router.get('/list', async (req, res) => {
    try {
        const subscribersData = await readSubscribers();

        const activeSubscribers = subscribersData.subscribers.filter(
            sub => sub.active
        );

        res.json({
            success: true,
            subscribers: activeSubscribers,
            total: activeSubscribers.length,
            statistics: {
                total: subscribersData.subscribers.length,
                active: activeSubscribers.length,
                inactive: subscribersData.subscribers.length - activeSubscribers.length
            }
        });

    } catch (error) {
        console.error('Error listando suscriptores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener suscriptores'
        });
    }
});

/**
 * ❌ GET /api/subscriptions/unsubscribe/:token
 * Cancelar suscripción
 */
router.get('/unsubscribe/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const subscribersData = await readSubscribers();

        const subscriber = subscribersData.subscribers.find(
            sub => sub.unsubscribeToken === token
        );

        if (!subscriber) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Token Inválido</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .container { max-width: 600px; margin: 0 auto; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="error">❌ Token Inválido</h1>
                        <p>El enlace de cancelación no es válido o ha expirado.</p>
                        <p><a href="/">Volver al inicio</a></p>
                    </div>
                </body>
                </html>
            `);
        }

        // Desactivar suscripción
        subscriber.active = false;
        subscriber.unsubscribedAt = new Date().toISOString();

        await saveSubscribers(subscribersData);

        console.log(`❌ Suscriptor dado de baja: ${subscriber.email}`);

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Suscripción Cancelada</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        color: #333;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    }
                    h1 { color: #28a745; }
                    .btn {
                        display: inline-block;
                        padding: 12px 30px;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .btn:hover { background: #764ba2; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Suscripción Cancelada</h1>
                    <p>Tu suscripción ha sido cancelada exitosamente.</p>
                    <p>Ya no recibirás más correos de nuestra parte.</p>
                    <p><strong>Email:</strong> ${subscriber.email}</p>
                    <p>Lamentamos verte partir. Si cambias de opinión, puedes suscribirte nuevamente en cualquier momento.</p>
                    <a href="/" class="btn">Volver al sitio</a>
                </div>
                <script>
                    setTimeout(() => {
                        window.close();
                    }, 5000);
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error cancelando suscripción:', error);
        res.status(500).send('Error al procesar la cancelación');
    }
});

/**
 * 📊 GET /api/subscriptions/stats
 * Estadísticas de suscriptores
 */
router.get('/stats', async (req, res) => {
    try {
        const subscribersData = await readSubscribers();
        const newslettersData = await readNewsletters();

        const activeSubscribers = subscribersData.subscribers.filter(sub => sub.active);

        const statsByCategory = {};
        activeSubscribers.forEach(sub => {
            sub.categories.forEach(cat => {
                statsByCategory[cat] = (statsByCategory[cat] || 0) + 1;
            });
        });

        res.json({
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

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;