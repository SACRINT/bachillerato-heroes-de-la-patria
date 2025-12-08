/**
 * 📝 API CRUD PARA QUEJAS Y SUGERENCIAS - TypeScript
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

// ✅ FASE 3: DAO Layer
import QuejasDAO from '../data/quejas.dao';
import emailService from '../services/emailService';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Queja {
    id: number;
    nombre: string;
    email: string;
    subject: 'queja' | 'sugerencia' | 'felicitacion' | 'otro';
    message: string;
    form_type?: string;
    status: 'pendiente' | 'en_revision' | 'respondida' | 'cerrada';
    respuesta?: string;
    respondido_por?: string;
    fecha_creacion: string;
    fecha_respuesta?: string;
}

interface QuejaStats {
    total: number;
    pendientes: number;
    respondidas: number;
    por_tipo: Record<string, number>;
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/quejas
 */
router.post('/', [
    body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('subject').isIn(['queja', 'sugerencia', 'felicitacion', 'otro']).withMessage('Tipo inválido'),
    body('message').trim().notEmpty().withMessage('Mensaje es requerido')
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    const { nombre, email, subject, message, form_type } = req.body;
    const ip_address = req.ip || (req.connection as any).remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        const queja = await QuejasDAO.create({ nombre, email, subject, message, form_type, ip_address, user_agent }) as Queja;
        debugLog.log('QUEJAS', '✅ Queja/sugerencia guardada:', queja.id);

        try {
            if (email) {
                await emailService.sendEmail({
                    to: email,
                    subject: 'Hemos recibido tu mensaje - Bachillerato Héroes de la Patria',
                    template: 'contact-confirmation',
                    data: { nombre: nombre || 'Usuario', subject, fecha: new Date() }
                });
            }
        } catch (emailError) {
            console.error('[Quejas] Error al enviar correo:', emailError);
        }

        res.status(201).json({ success: true, message: 'Tu mensaje ha sido recibido.', data: { id: queja.id, fecha: queja.fecha_creacion } });
    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al guardar queja:', sanitizeError(error as Error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al procesar tu mensaje.' });
    }
});

/**
 * GET /api/quejas
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { status, limit = '50', offset = '0' } = req.query as Record<string, string>;
    try {
        const data = await QuejasDAO.getAll({ status, limit, offset }) as Queja[];
        res.json({ success: true, data, total: data.length });
    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al obtener quejas:', sanitizeError(error as Error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al obtener los datos' });
    }
});

/**
 * GET /api/quejas/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await QuejasDAO.getStats() as QuejaStats;
        res.json({ success: true, data: stats });
    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al obtener estadísticas:', sanitizeError(error as Error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/quejas/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const queja = await QuejasDAO.getById(id) as Queja | null;
        if (!queja) {
            res.status(404).json({ success: false, error: 'Queja no encontrada' });
            return;
        }
        res.json({ success: true, data: queja });
    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al obtener queja:', sanitizeError(error as Error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al obtener la queja' });
    }
});

/**
 * PUT /api/quejas/:id
 */
router.put('/:id', [
    body('status').optional().isIn(['pendiente', 'en_revision', 'respondida', 'cerrada']),
    body('respuesta').optional().trim(),
    body('respondido_por').optional().trim()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, respuesta, respondido_por } = req.body as { status?: string; respuesta?: string; respondido_por?: string };

    try {
        const result = await QuejasDAO.update(id, { status, respuesta, respondido_por });
        if (!result) {
            res.status(404).json({ success: false, error: 'Queja no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Queja actualizada correctamente', data: result });
    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al actualizar queja:', sanitizeError(error as Error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al actualizar la queja' });
    }
});

/**
 * DELETE /api/quejas/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await QuejasDAO.delete(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Queja no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Queja eliminada correctamente' });
    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al eliminar queja:', sanitizeError(error as Error, 'quejas'));
        res.status(500).json({ success: false, error: 'Error al eliminar la queja' });
    }
});

export default router;
