/**
 * 📧 RUTAS DE SUSCRIPCIONES - TypeScript
 * Sistema de suscriptores a newsletters usando PostgreSQL
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import crypto from 'crypto';
import db from '../config/database';
import subscriptionEmailService from '../services/subscriptionEmailService';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Subscriber {
    id: number;
    subscription_id: string;
    email: string;
    nombre: string;
    categories: string[];
    source: string;
    active: boolean;
    emails_sent: number;
    last_email_sent: string | null;
    subscribed_at: string;
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
    verificado: boolean;
    token_verificacion?: string;
}

interface SubscriptionStats {
    active_subscribers: number;
    inactive_subscribers: number;
    newsletters_sent: number;
    total_emails_sent: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateSubscriptionId(lastId: number): string {
    const newId = lastId + 1;
    return `SUB-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

function generateUnsubscribeToken(): string {
    return crypto.randomBytes(32).toString('hex');
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
        const { email, name, categories, source, tipo_interes, subject } = req.body as {
            email: string; name?: string; categories?: string[]; source?: string;
            tipo_interes?: string; subject?: string;
        };

        // Verificar si ya existe
        const existingResult = await db.executeQuery(
            `SELECT * FROM suscriptores_notificaciones WHERE email = $1 AND estado = 'activo' LIMIT 1`,
            [email]
        ) as Subscriber[];

        if (existingResult.length > 0) {
            res.json({
                success: true, message: 'Ya estás suscrito',
                subscriber: { id: existingResult[0].id, email: existingResult[0].email, nombre: existingResult[0].nombre },
                existed: true
            });
            return;
        }

        // Manejar categorías
        let categoriesArray = categories || ['all'];
        if (tipo_interes || subject) {
            const tipoInteres = tipo_interes || subject;
            if (tipoInteres === 'Todas las convocatorias') categoriesArray = ['convocatorias'];
            else if (tipoInteres?.includes('becas')) categoriesArray = ['becas'];
            else if (tipoInteres?.includes('concursos')) categoriesArray = ['concursos'];
            else categoriesArray = ['convocatorias'];
        }

        const notifConvocatorias = categoriesArray.includes('all') || categoriesArray.includes('convocatorias');
        const notifBecas = categoriesArray.includes('all') || categoriesArray.includes('becas');
        const notifEventos = categoriesArray.includes('all') || categoriesArray.includes('eventos');
        const notifNoticias = categoriesArray.includes('all') || categoriesArray.includes('noticias');
        const notifTodas = categoriesArray.includes('all');

        const verificationToken = crypto.randomBytes(32).toString('hex');

        let result: Subscriber[];
        try {
            result = await db.executeQuery(
                `INSERT INTO suscriptores_notificaciones (email, nombre, notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, estado, verificado, fuente, token_verificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [email, name || 'Suscriptor', notifConvocatorias, notifBecas, notifEventos, notifNoticias, notifTodas, 'activo', false, source || 'newsletter', verificationToken]
            ) as Subscriber[];
        } catch (tokenError: unknown) {
            const err = tokenError as Error & { code?: string };
            if (err.code === '42703') {
                result = await db.executeQuery(
                    `INSERT INTO suscriptores_notificaciones (email, nombre, notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, estado, verificado, fuente) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                    [email, name || 'Suscriptor', notifConvocatorias, notifBecas, notifEventos, notifNoticias, notifTodas, 'activo', true, source || 'newsletter']
                ) as Subscriber[];
            } else {
                throw tokenError;
            }
        }

        debugLog.log('SUBSCRIPTIONS', 'Nuevo suscriptor agregado exitosamente');

        const emailSent = await subscriptionEmailService.sendVerificationEmail(email, name || 'Suscriptor', verificationToken);

        res.json({
            success: true,
            message: emailSent ? 'Suscripción exitosa. Por favor verifica tu email.' : 'Suscripción registrada.',
            subscriber: { id: result[0].id, email: result[0].email, nombre: result[0].nombre },
            emailSent, existed: false
        });

    } catch (error) {
        debugLog.error('SUBSCRIPTIONS', 'Error agregando suscriptor:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).json({ success: false, message: 'Error al procesar suscripción', error: (error as Error).message });
    }
});

/**
 * GET /api/subscriptions/list
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.executeQuery(`SELECT id, subscription_id AS id, email, nombre AS name, categories, source, active, emails_sent AS "emailsSent", last_email_sent AS "lastEmailSent", subscribed_at AS "subscribedAt" FROM suscriptores_notificaciones ORDER BY subscribed_at DESC`) as Subscriber[];

        const subscribers = result.map(sub => ({
            ...sub,
            categories: typeof sub.categories === 'string' ? JSON.parse(sub.categories as unknown as string) : sub.categories
        }));

        res.json({ success: true, subscribers, total: subscribers.length });
    } catch (error) {
        debugLog.error('SUBSCRIPTIONS', 'Error listando suscriptores:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).json({ success: false, message: 'Error al obtener suscriptores' });
    }
});

/**
 * GET /api/subscriptions/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.executeQuery(`SELECT COUNT(*) FILTER (WHERE active = true) AS active_subscribers, COUNT(*) FILTER (WHERE active = false) AS inactive_subscribers, COALESCE((SELECT COUNT(*) FROM newsletters), 0) AS newsletters_sent, COALESCE(SUM(emails_sent), 0) AS total_emails_sent FROM suscriptores_notificaciones`) as SubscriptionStats[];

        res.json({
            success: true,
            statistics: {
                activeSubscribers: parseInt(String(result[0].active_subscribers)),
                inactiveSubscribers: parseInt(String(result[0].inactive_subscribers)),
                newslettersSent: parseInt(String(result[0].newsletters_sent)),
                totalEmailsSent: parseInt(String(result[0].total_emails_sent))
            }
        });
    } catch (error) {
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
        const result = await db.executeQuery(
            `UPDATE suscriptores_notificaciones SET verificado = true, fecha_verificacion = CURRENT_TIMESTAMP WHERE token_verificacion = $1 AND verificado = false RETURNING email, nombre`,
            [token]
        ) as Array<{ email: string; nombre: string }>;

        if (result.length === 0) {
            res.status(404).send(`<html><head><title>Error</title></head><body style="font-family:Arial;text-align:center;padding:50px;"><h1>❌ Token Inválido</h1><p>El token no es válido o ya fue verificado.</p></body></html>`);
            return;
        }

        debugLog.log('SUBSCRIPTIONS', `✅ Suscripción verificada: ${result[0].email}`);
        await subscriptionEmailService.sendWelcomeEmail(result[0].email, result[0].nombre, token);

        res.send(`<html><head><title>Verificado</title></head><body style="font-family:Arial;text-align:center;padding:50px;"><h1 style="color:#28a745;">✅ ¡Suscripción Confirmada!</h1><p>Gracias ${result[0].nombre}, ya recibirás nuestras notificaciones.</p></body></html>`);
    } catch (error) {
        debugLog.error('SUBSCRIPTIONS', 'Error verificando:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).send('Error al verificar suscripción');
    }
});

/**
 * GET /api/subscriptions/unsubscribe/:token
 */
router.get('/unsubscribe/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const result = await db.executeQuery(
            `UPDATE suscriptores_notificaciones SET estado = 'inactivo', fecha_actualizacion = CURRENT_TIMESTAMP WHERE token_verificacion = $1 AND estado = 'activo' RETURNING email, nombre`,
            [token]
        ) as Array<{ email: string; nombre: string }>;

        if (result.length === 0) {
            res.status(404).send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h1>❌ Token inválido</h1></body></html>`);
            return;
        }

        debugLog.log('SUBSCRIPTIONS', `🚫 Suscripción cancelada: ${result[0].email}`);
        res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h1 style="color:#28a745;">✅ Suscripción Cancelada</h1><p>Ya no recibirás emails de BGE Héroes de la Patria.</p></body></html>`);
    } catch (error) {
        debugLog.error('SUBSCRIPTIONS', 'Error cancelando:', sanitizeError(error as Error, 'subscriptions'));
        res.status(500).send('Error al cancelar suscripción');
    }
});

export default router;
