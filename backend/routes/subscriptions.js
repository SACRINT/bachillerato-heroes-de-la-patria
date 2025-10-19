/**
 * 📧 RUTAS DE SUSCRIPCIONES - POSTGRESQL
 * Sistema de suscriptores a newsletters usando PostgreSQL
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');

/**
 * 🆔 Generar ID único para suscriptor
 */
function generateSubscriptionId(lastId) {
    const newId = lastId + 1;
    return `SUB-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

/**
 * 🔑 Generar token de cancelación
 */
function generateUnsubscribeToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * ➕ POST /api/subscriptions/subscribe
 * Agregar nuevo suscriptor
 */
router.post('/subscribe', [
    body('email').isEmail().withMessage('Email inválido'),
    body('name').optional().trim(),
    body('categories').optional().isArray(),
    body('source').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { email, name, categories, source } = req.body;

        // Verificar si ya existe
        const existingQuery = `
            SELECT * FROM suscriptores WHERE email = $1 AND active = true LIMIT 1
        `;
        const existingResult = await db.executeQuery(existingQuery, [email]);

        if (existingResult.length > 0) {
            return res.json({
                success: true,
                message: 'Ya estás suscrito',
                subscriber: {
                    id: existingResult[0].subscription_id,
                    email: existingResult[0].email,
                    categories: existingResult[0].categories
                },
                existed: true
            });
        }

        // Obtener último ID
        const lastIdQuery = `
            SELECT subscription_id FROM suscriptores
            ORDER BY id DESC LIMIT 1
        `;
        const lastIdResult = await db.executeQuery(lastIdQuery);

        let lastNumber = 0;
        if (lastIdResult.length > 0) {
            const lastId = lastIdResult[0].subscription_id;
            const match = lastId.match(/-(\d+)$/);
            if (match) lastNumber = parseInt(match[1]);
        }

        const newSubscriptionId = generateSubscriptionId(lastNumber);
        const unsubscribeToken = generateUnsubscribeToken();
        const categoriesArray = categories || ['all'];

        // Insertar nuevo suscriptor
        const insertQuery = `
            INSERT INTO suscriptores (
                subscription_id, email, nombre, categories, source,
                active, unsubscribe_token
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const result = await db.executeQuery(insertQuery, [
            newSubscriptionId,
            email,
            name || 'Suscriptor',
            JSON.stringify(categoriesArray),
            source || 'newsletter',
            true,
            unsubscribeToken
        ]);

        console.log(`✅ Nuevo suscriptor: ${email} (${newSubscriptionId})`);

        res.json({
            success: true,
            message: 'Suscripción exitosa',
            subscriber: {
                id: newSubscriptionId,
                email: result[0].email,
                categories: JSON.parse(result[0].categories)
            },
            existed: false
        });

    } catch (error) {
        console.error('Error agregando suscriptor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar suscripción',
            error: error.message
        });
    }
});

/**
 * 📋 GET /api/subscriptions/list
 * Listar todos los suscriptores
 */
router.get('/list', async (req, res) => {
    try {
        const query = `
            SELECT
                id, subscription_id AS id, email, nombre AS name,
                categories, source, active, emails_sent AS "emailsSent",
                last_email_sent AS "lastEmailSent",
                subscribed_at AS "subscribedAt"
            FROM suscriptores
            ORDER BY subscribed_at DESC
        `;

        const result = await db.executeQuery(query);

        const subscribers = result.map(sub => ({
            ...sub,
            categories: typeof sub.categories === 'string'
                ? JSON.parse(sub.categories)
                : sub.categories
        }));

        res.json({
            success: true,
            subscribers: subscribers,
            total: subscribers.length
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
 * 📊 GET /api/subscriptions/stats
 * Obtener estadísticas de suscriptores
 */
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE active = true) AS active_subscribers,
                COUNT(*) FILTER (WHERE active = false) AS inactive_subscribers,
                COALESCE((SELECT COUNT(*) FROM newsletters), 0) AS newsletters_sent,
                COALESCE(SUM(emails_sent), 0) AS total_emails_sent
            FROM suscriptores
        `;

        const result = await db.executeQuery(query);
        const stats = result[0];

        res.json({
            success: true,
            statistics: {
                activeSubscribers: parseInt(stats.active_subscribers),
                inactiveSubscribers: parseInt(stats.inactive_subscribers),
                newslettersSent: parseInt(stats.newsletters_sent),
                totalEmailsSent: parseInt(stats.total_emails_sent)
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

/**
 * 🚫 GET /api/subscriptions/unsubscribe/:token
 * Cancelar suscripción
 */
router.get('/unsubscribe/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const updateQuery = `
            UPDATE suscriptores
            SET active = false, unsubscribed_at = CURRENT_TIMESTAMP
            WHERE unsubscribe_token = $1 AND active = true
            RETURNING email
        `;

        const result = await db.executeQuery(updateQuery, [token]);

        if (result.length === 0) {
            return res.status(404).send(`
                <html>
                <head><title>Cancelación de Suscripción</title></head>
                <body style="font-family: Arial; padding: 50px; text-align: center;">
                    <h1>❌ Token inválido o ya cancelado</h1>
                    <p>La suscripción no se encontró o ya fue cancelada anteriormente.</p>
                </body>
                </html>
            `);
        }

        console.log(`🚫 Suscripción cancelada: ${result[0].email}`);

        res.send(`
            <html>
            <head><title>Cancelación Exitosa</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1>✅ Suscripción Cancelada</h1>
                <p>Tu suscripción ha sido cancelada exitosamente.</p>
                <p>Ya no recibirás emails de BGE Héroes de la Patria.</p>
                <p style="margin-top: 30px;"><a href="/">Volver al inicio</a></p>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error cancelando suscripción:', error);
        res.status(500).send('Error al cancelar suscripción');
    }
});

module.exports = router;
