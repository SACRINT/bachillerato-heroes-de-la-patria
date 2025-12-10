/**
 * 📧 RUTAS DE SUSCRIPCIONES - TypeScript
 * Sistema de suscriptores a newsletters usando PostgreSQL
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import crypto from 'crypto';
// @ts-ignore
import db from '../config/database';
// @ts-ignore
import subscriptionEmailService from '../services/subscriptionEmailService';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

const router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface SubscriberDB {
    id: number;
    email: string;
    nombre: string;
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
    estado: string;
    verificado: boolean;
    token_verificacion: string;
    fecha_verificacion?: Date;
    created_at?: Date;
    subscription_id?: string;
    categories?: string | string[];
    source?: string;
    emails_sent?: number;
    last_email_sent?: Date;
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/subscriptions/subscribe
 */
router.post('/subscribe', [
    body('email').isEmail().withMessage('Email inválido'),
    body('name').optional().trim(),
    body('source').optional().trim(),
    body('tipo_interes').optional().trim()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    try {
        const { email, name, categories, source, tipo_interes, subject } = req.body;

        const existingQuery = `
            SELECT * FROM suscriptores_notificaciones WHERE email = $1 AND estado = 'activo' LIMIT 1
        `;
        const existingResult = await db.executeQuery(existingQuery, [email]) as SubscriberDB[];

        if (existingResult.length > 0) {
            res.json({
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
            return;
        }

        let categoriesArray = categories || ['all'];

        if (tipo_interes || subject) {
            const tipoInteres = tipo_interes || subject;
            if (tipoInteres === 'Todas las convocatorias') {
                categoriesArray = ['convocatorias'];
            } else if (tipoInteres.includes('becas')) {
                categoriesArray = ['becas'];
            } else if (tipoInteres.includes('concursos')) {
                categoriesArray = ['concursos'];
            } else {
                categoriesArray = ['convocatorias'];
            }
        }

        const notifConvocatorias = categoriesArray.includes('all') || categoriesArray.includes('convocatorias');
        const notifBecas = categoriesArray.includes('all') || categoriesArray.includes('becas');
        const notifEventos = categoriesArray.includes('all') || categoriesArray.includes('eventos');
        const notifNoticias = categoriesArray.includes('all') || categoriesArray.includes('noticias');
        const notifTodas = categoriesArray.includes('all');

        const verificationToken = crypto.randomBytes(32).toString('hex');

        let result: SubscriberDB[];
        try {
            const insertQuery = `
                INSERT INTO suscriptores_notificaciones (
                    email, nombre, notif_convocatorias, notif_becas, notif_eventos,
                    notif_noticias, notif_todas, estado, verificado, fuente, token_verificacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            result = await db.executeQuery(insertQuery, [
                email, name || 'Suscriptor', notifConvocatorias, notifBecas, notifEventos,
                notifNoticias, notifTodas, 'activo', false, source || 'newsletter', verificationToken
            ]) as SubscriberDB[];
        } catch (tokenError: any) {
            if (tokenError.code === '42703') {
                debugLog.log('SUBSCRIPTIONS', 'Columna token_verificacion no existe, insertando sin token');
                const insertQueryWithoutToken = `
                    INSERT INTO suscriptores_notificaciones (
                        email, nombre, notif_convocatorias, notif_becas, notif_eventos,
                        notif_noticias, notif_todas, estado, verificado, fuente
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `;
                result = await db.executeQuery(insertQueryWithoutToken, [
                    email, name || 'Suscriptor', notifConvocatorias, notifBecas, notifEventos,
                    notifNoticias, notifTodas, 'activo', true, source || 'newsletter'
                ]) as SubscriberDB[];
            } else {
                throw tokenError;
            }
        }

        const emailSent = await subscriptionEmailService.sendVerificationEmail(
            email,
            name || 'Suscriptor',
            verificationToken
        );

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

    } catch (error: any) {
        debugLog.error('SUBSCRIPTIONS', 'Error agregando suscriptor:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).json({
            success: false,
            message: 'Error al procesar suscripción',
            error: error.message
        });
    }
});

/**
 * GET /api/subscriptions/list
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT
                id, subscription_id AS id, email, nombre AS name,
                categories, source, active, emails_sent AS "emailsSent",
                last_email_sent AS "lastEmailSent",
                subscribed_at AS "subscribedAt"
            FROM suscriptores_notificaciones
            ORDER BY subscribed_at DESC
        `;
        const result = await db.executeQuery(query) as SubscriberDB[];

        const subscribers = result.map(sub => ({
            ...sub,
            categories: typeof sub.categories === 'string'
                ? JSON.parse(sub.categories)
                : sub.categories
        }));

        res.json({ success: true, subscribers: subscribers, total: subscribers.length });

    } catch (error: any) {
        debugLog.error('SUBSCRIPTIONS', 'Error listando suscriptores:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).json({ success: false, message: 'Error al obtener suscriptores' });
    }
});

/**
 * GET /api/subscriptions/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE active = true) AS active_subscribers,
                COUNT(*) FILTER (WHERE active = false) AS inactive_subscribers,
                COALESCE((SELECT COUNT(*) FROM newsletters), 0) AS newsletters_sent,
                COALESCE(SUM(emails_sent), 0) AS total_emails_sent
            FROM suscriptores_notificaciones
        `;
        const result = await db.executeQuery(query) as Array<{
            active_subscribers: string;
            inactive_subscribers: string;
            newsletters_sent: string;
            total_emails_sent: string;
        }>;
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
    } catch (error: any) {
        debugLog.error('SUBSCRIPTIONS', 'Error obteniendo estadísticas:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/subscriptions/verify/:token
 */
router.get('/verify/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const updateQuery = `
            UPDATE suscriptores_notificaciones
            SET verificado = true, fecha_verificacion = CURRENT_TIMESTAMP
            WHERE token_verificacion = $1 AND verificado = false
            RETURNING email, nombre
        `;
        const result = await db.executeQuery(updateQuery, [token]) as SubscriberDB[];

        if (result.length === 0) {
            res.status(404).send(`
                <html><head><title>Error</title></head><body><h1>❌ Token Inválido</h1></body></html>
            `);
            return;
        }

        await subscriptionEmailService.sendWelcomeEmail(result[0].email, result[0].nombre, token);

        res.send(`
            <html><head><title>Verificado</title></head><body><h1>¡Suscripción Confirmada!</h1></body></html>
        `);
    } catch (error: any) {
        debugLog.error('SUBSCRIPTIONS', 'Error verificando suscripción:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).send('Error al verificar suscripción');
    }
});

/**
 * GET /api/subscriptions/unsubscribe/:token
 */
router.get('/unsubscribe/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const updateQuery = `
            UPDATE suscriptores_notificaciones
            SET estado = 'inactivo', fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE token_verificacion = $1 AND estado = 'activo'
            RETURNING email, nombre
        `;
        const result = await db.executeQuery(updateQuery, [token]) as SubscriberDB[];

        if (result.length === 0) {
            res.status(404).send('Token inválido o ya cancelado');
            return;
        }

        res.send('Suscripción cancelada exitosamente');
    } catch (error: any) {
        debugLog.error('SUBSCRIPTIONS', 'Error cancelando suscripción:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).send('Error al cancelar suscripción');
    }
});

// @ts-ignore
export = router;
