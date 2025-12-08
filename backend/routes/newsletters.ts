/**
 * 📨 SISTEMA DE NEWSLETTERS - TypeScript
 * Crear y enviar newsletters a suscriptores
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { promises as fs } from 'fs';
import path from 'path';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail, maskToken } from '../utils/sanitized-errors';
import verificationService from '../services/verificationService';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Subscriber {
    email: string;
    active: boolean;
    categories: string[];
    unsubscribeToken: string;
    emailsSent?: number;
    lastEmailSent?: string;
}

interface SubscribersData {
    subscribers: Subscriber[];
    lastId: number;
}

interface Newsletter {
    id: string;
    subject: string;
    content: string;
    targetCategory: string;
    sentTo: number;
    sentAt: string;
    successCount: number;
    failureCount: number;
    subscribers: Array<{ email: string; status: string; sentAt?: string; error?: string }>;
}

interface NewslettersData {
    newsletters: Newsletter[];
    lastId: number;
}

// ============================================
// FILE PATHS
// ============================================

const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');
const NEWSLETTERS_FILE = path.join(__dirname, '../data/newsletters.json');

// ============================================
// HELPER FUNCTIONS
// ============================================

async function readSubscribers(): Promise<SubscribersData> {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { subscribers: [], lastId: 0 };
    }
}

async function saveSubscribers(data: SubscribersData): Promise<void> {
    await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
}

async function readNewsletters(): Promise<NewslettersData> {
    try {
        const data = await fs.readFile(NEWSLETTERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { newsletters: [], lastId: 0 };
    }
}

async function saveNewsletters(data: NewslettersData): Promise<void> {
    await fs.writeFile(NEWSLETTERS_FILE, JSON.stringify(data, null, 2));
}

function generateNewsletterId(lastId: number): string {
    const newId = lastId + 1;
    return `NEWS-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

function generateNewsletterHTML(content: string, unsubscribeToken: string): string {
    const unsubscribeLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/subscriptions/unsubscribe/${unsubscribeToken}`;
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Newsletter - BGE Héroes de la Patria</title></head><body><div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">${content}<p style="font-size:11px;color:#999;">¿No deseas recibir más correos? <a href="${unsubscribeLink}">Cancelar suscripción</a></p></div></body></html>`;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/newsletters/send
 */
router.post('/send', [
    body('subject').trim().notEmpty().withMessage('Se requiere asunto'),
    body('content').trim().notEmpty().withMessage('Se requiere contenido'),
    body('targetCategory').optional().trim()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    try {
        const { subject, content, targetCategory } = req.body as { subject: string; content: string; targetCategory?: string };

        const subscribersData = await readSubscribers();
        const newslettersData = await readNewsletters();

        let targetSubscribers = subscribersData.subscribers.filter(sub => sub.active);
        if (targetCategory && targetCategory !== 'all') {
            targetSubscribers = targetSubscribers.filter(sub => sub.categories.includes(targetCategory) || sub.categories.includes('all'));
        }

        if (targetSubscribers.length === 0) {
            res.status(400).json({ success: false, message: 'No hay suscriptores activos para esta categoría' });
            return;
        }

        const newsletterId = generateNewsletterId(newslettersData.lastId);
        const newsletter: Newsletter = {
            id: newsletterId,
            subject,
            content,
            targetCategory: targetCategory || 'all',
            sentTo: targetSubscribers.length,
            sentAt: new Date().toISOString(),
            successCount: 0,
            failureCount: 0,
            subscribers: []
        };

        debugLog.log('NEWSLETTERS', `📨 Iniciando envío de newsletter: ${newsletterId}`);

        let successCount = 0;
        let failureCount = 0;

        for (const subscriber of targetSubscribers) {
            try {
                const htmlContent = generateNewsletterHTML(content, subscriber.unsubscribeToken);
                await verificationService.transporter.sendMail({
                    from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                    to: subscriber.email,
                    subject,
                    html: htmlContent
                });

                subscriber.emailsSent = (subscriber.emailsSent || 0) + 1;
                subscriber.lastEmailSent = new Date().toISOString();
                newsletter.subscribers.push({ email: subscriber.email, status: 'sent', sentAt: new Date().toISOString() });
                successCount++;
                await sleep(1000);
            } catch (error) {
                newsletter.subscribers.push({ email: subscriber.email, status: 'failed', error: (error as Error).message });
                failureCount++;
            }
        }

        newsletter.successCount = successCount;
        newsletter.failureCount = failureCount;
        newslettersData.newsletters.push(newsletter);
        newslettersData.lastId += 1;

        await saveNewsletters(newslettersData);
        await saveSubscribers(subscribersData);

        res.json({ success: true, message: 'Newsletter enviada exitosamente', newsletter: { id: newsletterId, subject, sentTo: targetSubscribers.length, successCount, failureCount, sentAt: newsletter.sentAt } });
    } catch (error) {
        debugLog.error('NEWSLETTERS', 'Error enviando newsletter', sanitizeError(error as Error, 'newsletters'));
        res.status(500).json({ success: false, message: 'Error al enviar newsletter', error: (error as Error).message });
    }
});

/**
 * GET /api/newsletters/list
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
    try {
        const newslettersData = await readNewsletters();
        const newsletters = newslettersData.newsletters.map(news => ({
            id: news.id, subject: news.subject, targetCategory: news.targetCategory, sentTo: news.sentTo, successCount: news.successCount, failureCount: news.failureCount, sentAt: news.sentAt
        }));
        res.json({ success: true, newsletters, total: newsletters.length });
    } catch (error) {
        debugLog.error('NEWSLETTERS', 'Error listando newsletters', sanitizeError(error as Error, 'newsletters'));
        res.status(500).json({ success: false, message: 'Error al obtener newsletters' });
    }
});

/**
 * GET /api/newsletters/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const newslettersData = await readNewsletters();
        const newsletter = newslettersData.newsletters.find(news => news.id === id);

        if (!newsletter) {
            res.status(404).json({ success: false, message: 'Newsletter no encontrada' });
            return;
        }

        res.json({ success: true, newsletter });
    } catch (error) {
        debugLog.error('NEWSLETTERS', 'Error obteniendo newsletter', sanitizeError(error as Error, 'newsletters'));
        res.status(500).json({ success: false, message: 'Error al obtener newsletter' });
    }
});

export default router;
