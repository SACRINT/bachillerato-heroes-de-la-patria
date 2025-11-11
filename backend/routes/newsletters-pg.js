/**
 * 📨 SISTEMA DE NEWSLETTERS - POSTGRESQL
 * Crear y enviar newsletters a suscriptores usando PostgreSQL
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const verificationService = require('../services/verificationService');

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

        // Obtener suscriptores activos según categoría
        let subscribersQuery = `
            SELECT id, email, nombre AS name, categories, unsubscribe_token
            FROM suscriptores
            WHERE active = true
        `;

        let params = [];
        if (targetCategory && targetCategory !== 'all') {
            // PostgreSQL: Buscar en array JSON
            subscribersQuery += ` AND categories::jsonb @> $1::jsonb`;
            params.push(JSON.stringify([targetCategory]));
        }

        const targetSubscribers = await db.executeQuery(subscribersQuery, params);

        if (targetSubscribers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay suscriptores activos para esta categoría'
            });
        }

        // Obtener último ID de newsletter
        const lastIdQuery = `
            SELECT newsletter_id FROM newsletters
            ORDER BY id DESC LIMIT 1
        `;
        const lastIdResult = await db.executeQuery(lastIdQuery);

        let lastNumber = 0;
        if (lastIdResult.length > 0) {
            const lastId = lastIdResult[0].newsletter_id;
            const match = lastId.match(/-(\d+)$/);
            if (match) lastNumber = parseInt(match[1]);
        }

        const newsletterId = generateNewsletterId(lastNumber);

        // Crear registro de newsletter
        const insertNewsletterQuery = `
            INSERT INTO newsletters (
                newsletter_id, subject, content, target_category,
                sent_to, success_count, failure_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const newsletterResult = await db.executeQuery(insertNewsletterQuery, [
            newsletterId,
            subject,
            content,
            targetCategory || 'all',
            targetSubscribers.length,
            0,
            0
        ]);

        const newsletterDbId = newsletterResult[0].id;

        devLogger.log(`📨 Iniciando envío de newsletter: ${newsletterId}`);
        devLogger.log(`📊 Destinatarios: ${targetSubscribers.length}`);

        // Enviar a cada suscriptor (con rate limiting)
        let successCount = 0;
        let failureCount = 0;

        for (const subscriber of targetSubscribers) {
            try {
                const htmlContent = generateNewsletterHTML(content, subscriber.unsubscribe_token);

                await verificationService.transporter.sendMail({
                    from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                    to: subscriber.email,
                    subject: subject,
                    html: htmlContent
                });

                // Registrar envío exitoso
                await db.executeQuery(`
                    INSERT INTO newsletter_envios (
                        newsletter_id, subscriber_id, email, status
                    ) VALUES ($1, $2, $3, $4)
                `, [newsletterDbId, subscriber.id, subscriber.email, 'sent']);

                successCount++;
                devLogger.log(`✅ Enviado a: ${subscriber.email} (${successCount}/${targetSubscribers.length})`);

                // Rate limiting: 1 email por segundo
                await sleep(1000);

            } catch (error) {
                devLogger.error(`❌ Error enviando a ${subscriber.email}:`, error.message);

                // Registrar envío fallido
                await db.executeQuery(`
                    INSERT INTO newsletter_envios (
                        newsletter_id, subscriber_id, email, status, error_message
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [newsletterDbId, subscriber.id, subscriber.email, 'failed', error.message]);

                failureCount++;
            }
        }

        // Actualizar estadísticas finales
        await db.executeQuery(`
            UPDATE newsletters
            SET success_count = $1, failure_count = $2
            WHERE id = $3
        `, [successCount, failureCount, newsletterDbId]);

        devLogger.log(`✅ Newsletter enviada: ${newsletterId}`);
        devLogger.log(`📊 Éxitos: ${successCount}, Fallos: ${failureCount}`);

        res.json({
            success: true,
            message: 'Newsletter enviada exitosamente',
            newsletter: {
                id: newsletterId,
                subject: subject,
                sentTo: targetSubscribers.length,
                successCount: successCount,
                failureCount: failureCount,
                sentAt: new Date().toISOString()
            }
        });

    } catch (error) {
        devLogger.error('Error enviando newsletter:', error);
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
        const query = `
            SELECT
                id, newsletter_id AS id, subject, target_category AS "targetCategory",
                sent_to AS "sentTo", success_count AS "successCount",
                failure_count AS "failureCount", sent_at AS "sentAt"
            FROM newsletters
            ORDER BY sent_at DESC
        `;

        const result = await db.executeQuery(query);

        res.json({
            success: true,
            newsletters: result,
            total: result.length
        });

    } catch (error) {
        devLogger.error('Error listando newsletters:', error);
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

        const newsletterQuery = `
            SELECT * FROM newsletters WHERE newsletter_id = $1 LIMIT 1
        `;
        const newsletterResult = await db.executeQuery(newsletterQuery, [id]);

        if (newsletterResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Newsletter no encontrada'
            });
        }

        const newsletter = newsletterResult[0];

        // Obtener detalle de envíos
        const enviosQuery = `
            SELECT email, status, error_message, sent_at
            FROM newsletter_envios
            WHERE newsletter_id = $1
            ORDER BY sent_at DESC
        `;
        const enviosResult = await db.executeQuery(enviosQuery, [newsletter.id]);

        res.json({
            success: true,
            newsletter: {
                id: newsletter.newsletter_id,
                subject: newsletter.subject,
                content: newsletter.content,
                targetCategory: newsletter.target_category,
                sentTo: newsletter.sent_to,
                successCount: newsletter.success_count,
                failureCount: newsletter.failure_count,
                sentAt: newsletter.sent_at,
                subscribers: enviosResult.map(e => ({
                    email: e.email,
                    status: e.status,
                    sentAt: e.sent_at,
                    error: e.error_message
                }))
            }
        });

    } catch (error) {
        devLogger.error('Error obteniendo newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener newsletter'
        });
    }
});

module.exports = router;
