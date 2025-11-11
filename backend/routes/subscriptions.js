/**
 * 📧 RUTAS DE SUSCRIPCIONES - POSTGRESQL
 * Sistema de suscriptores a newsletters usando PostgreSQL
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');
const subscriptionEmailService = require('../services/subscriptionEmailService');
const devLogger = require('../utils/devLogger'); // 🔐 Logging seguro (GDPR compliant)

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
    body('source').optional().trim(),
    body('tipo_interes').optional().trim()  // ✅ NUEVO: Soporte para tipo_interes de convocatorias
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { email, name, categories, source, tipo_interes, subject } = req.body;  // ✅ Aceptar subject también

        // Verificar si ya existe
        const existingQuery = `
            SELECT * FROM suscriptores_notificaciones WHERE email = $1 AND estado = 'activo' LIMIT 1
        `;
        const existingResult = await db.executeQuery(existingQuery, [email]);

        if (existingResult.length > 0) {
            return res.json({
                success: true,
                message: 'Ya estás suscrito',
                subscriber: {
                    id: existingResult[0].id,
                    email: existingResult[0].email,
                    nombre: existingResult[0].nombre,
                    notificaciones: {
                        convocatorias: existingResult[0].notif_convocatorias,
                        becas: existingResult[0].notif_becas,
                        eventos: existingResult[0].notif_eventos,
                        noticias: existingResult[0].notif_noticias,
                        todas: existingResult[0].notif_todas
                    }
                },
                existed: true
            });
        }

        // ✅ NUEVO: Manejar tipo_interes de convocatorias.html
        let categoriesArray = categories || ['all'];

        if (tipo_interes || subject) {
            // Si viene tipo_interes (de convocatorias), mapear a categorías
            const tipoInteres = tipo_interes || subject;

            if (tipoInteres === 'Todas las convocatorias') {
                categoriesArray = ['convocatorias'];
            } else if (tipoInteres.includes('becas')) {
                categoriesArray = ['becas'];
            } else if (tipoInteres.includes('concursos')) {
                categoriesArray = ['concursos'];
            } else {
                // Por defecto, convocatorias
                categoriesArray = ['convocatorias'];
            }
        }

        // Determinar preferencias de notificaciones
        const notifConvocatorias = categoriesArray.includes('all') || categoriesArray.includes('convocatorias');
        const notifBecas = categoriesArray.includes('all') || categoriesArray.includes('becas');
        const notifEventos = categoriesArray.includes('all') || categoriesArray.includes('eventos');
        const notifNoticias = categoriesArray.includes('all') || categoriesArray.includes('noticias');
        const notifTodas = categoriesArray.includes('all');

        // Generar token de verificación
        const verificationToken = crypto.randomBytes(32).toString('hex');

        let result;
        try {
            // Intentar insertar con token de verificación
            const insertQuery = `
                INSERT INTO suscriptores_notificaciones (
                    email, nombre, notif_convocatorias, notif_becas, notif_eventos,
                    notif_noticias, notif_todas, estado, verificado, fuente, token_verificacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            result = await db.executeQuery(insertQuery, [
                email,
                name || 'Suscriptor',
                notifConvocatorias,
                notifBecas,
                notifEventos,
                notifNoticias,
                notifTodas,
                'activo',
                false,  // No verificado inicialmente
                source || 'newsletter',
                verificationToken
            ]);
        } catch (tokenError) {
            // Si la columna token_verificacion no existe, insertar sin ella y marcar como verificado
            if (tokenError.code === '42703') { // Column does not exist
                devLog.warn('Columna token_verificacion no existe, insertando sin token y verificando automáticamente');
                const insertQueryWithoutToken = `
                    INSERT INTO suscriptores_notificaciones (
                        email, nombre, notif_convocatorias, notif_becas, notif_eventos,
                        notif_noticias, notif_todas, estado, verificado, fuente
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `;

                result = await db.executeQuery(insertQueryWithoutToken, [
                    email,
                    name || 'Suscriptor',
                    notifConvocatorias,
                    notifBecas,
                    notifEventos,
                    notifNoticias,
                    notifTodas,
                    'activo',
                    true,  // Verificado automáticamente si no hay sistema de tokens
                    source || 'newsletter'
                ]);
            } else {
                throw tokenError; // Re-throw si es otro tipo de error
            }
        }

        devLog.log('Nuevo suscriptor agregado exitosamente');

        // 📧 ENVIAR EMAIL DE VERIFICACIÓN
        const emailSent = await subscriptionEmailService.sendVerificationEmail(
            email,
            name || 'Suscriptor',
            verificationToken
        );

        if (emailSent) {
            devLogger.log('📧 Email de verificación enviado a ${email}');
        } else {
            devLogger.warn(`⚠️ No se pudo enviar email de verificación a ${email}`);
        }

        res.json({
            success: true,
            message: emailSent
                ? 'Suscripción exitosa. Por favor verifica tu email para completar el proceso.'
                : 'Suscripción registrada. El email de verificación se enviará próximamente.',
            subscriber: {
                id: result[0].id,
                email: result[0].email,
                nombre: result[0].nombre,
                notificaciones: {
                    convocatorias: result[0].notif_convocatorias,
                    becas: result[0].notif_becas,
                    eventos: result[0].notif_eventos,
                    noticias: result[0].notif_noticias,
                    todas: result[0].notif_todas
                }
            },
            emailSent: emailSent,
            existed: false
        });

    } catch (error) {
        devLogger.error('Error agregando suscriptor:');
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
        devLogger.error('Error listando suscriptores:');
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
        devLogger.error('Error obteniendo estadísticas:');
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

/**
 * ✅ GET /api/subscriptions/verify/:token
 * Verificar suscripción por email
 */
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const updateQuery = `
            UPDATE suscriptores_notificaciones
            SET verificado = true, fecha_verificacion = CURRENT_TIMESTAMP
            WHERE token_verificacion = $1 AND verificado = false
            RETURNING email, nombre
        `;

        const result = await db.executeQuery(updateQuery, [token]);

        if (result.length === 0) {
            return res.status(404).send(`
                <html>
                <head>
                    <title>Verificación de Suscripción</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 50px; text-align: center; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                        h1 { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Token Inválido</h1>
                        <p>El token de verificación no es válido o la suscripción ya fue verificada anteriormente.</p>
                        <p style="margin-top: 30px;"><a href="/">Volver al inicio</a></p>
                    </div>
                </body>
                </html>
            `);
        }

        devLogger.log('✅ Suscripción verificada: ${result[0].email}');

        // 📧 ENVIAR EMAIL DE BIENVENIDA
        const welcomeEmailSent = await subscriptionEmailService.sendWelcomeEmail(
            result[0].email,
            result[0].nombre,
            token
        );

        if (welcomeEmailSent) {
            devLogger.log('📧 Email de bienvenida enviado a ${result[0].email}');
        } else {
            devLogger.warn(`⚠️ No se pudo enviar email de bienvenida a ${result[0].email}`);
        }

        res.send(`
            <html>
            <head>
                <title>Suscripción Verificada</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 50px; text-align: center; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    h1 { color: #28a745; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✅</div>
                    <h1>¡Suscripción Confirmada!</h1>
                    <p>Gracias <strong>${result[0].nombre}</strong>, tu suscripción ha sido verificada exitosamente.</p>
                    <p>Ahora recibirás nuestras notificaciones en <strong>${result[0].email}</strong></p>
                    <p style="margin-top: 30px;">
                        <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Ir al sitio web
                        </a>
                    </p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        devLogger.error('Error verificando suscripción:');
        res.status(500).send(`
            <html>
            <head><title>Error</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1>❌ Error</h1>
                <p>Ocurrió un error al verificar la suscripción. Por favor intenta nuevamente.</p>
            </body>
            </html>
        `);
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
            UPDATE suscriptores_notificaciones
            SET estado = 'inactivo', fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE token_verificacion = $1 AND estado = 'activo'
            RETURNING email, nombre
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

        devLogger.log('🚫 Suscripción cancelada: ${result[0].email}');

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
        devLogger.error('Error cancelando suscripción:');
        res.status(500).send('Error al cancelar suscripción');
    }
});

module.exports = router;
