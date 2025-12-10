/**
 * 📧 API CRUD PARA SUSCRIPTORES - TypeScript
 * Gestión completa de suscriptores
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError } from '../utils/sanitized-errors';
// @ts-ignore
import SuscriptoresDAO from '../data/suscriptores.dao';
import crypto from 'crypto';

const router = express.Router();

// ============================================
// GET - Listar todos los suscriptores
// ============================================
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        debugLog.log('SUSCRIPTORES', '📧 [SUSCRIPTORES] Obteniendo lista de suscriptores...');
        const suscriptores = await SuscriptoresDAO.getAll();
        debugLog.log('SUSCRIPTORES', `✅ [SUSCRIPTORES] ${suscriptores.length} suscriptores encontrados`);

        res.json({
            success: true,
            total: suscriptores.length,
            data: suscriptores
        });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error al obtener suscriptores:', sanitizeError(error as Error, 'suscriptores'));
        if (error.code === '42P01' || error.code === '42703') {
            res.json({ success: true, total: 0, data: [] });
            return;
        }
        res.status(500).json({ success: false, error: 'Error al obtener lista', message: error.message });
    }
});

// ============================================
// GET - Filtrar suscriptores por estado
// ============================================
router.get('/estado/:estado', async (req: Request, res: Response): Promise<void> => {
    try {
        const { estado } = req.params;
        const suscriptores = await SuscriptoresDAO.getByEstado(estado);
        res.json({ success: true, estado, total: suscriptores.length, suscriptores });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error al filtrar por estado:', sanitizeError(error as Error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al filtrar suscriptores' });
    }
});

// ============================================
// GET - Suscriptores activos para envío masivo
// ============================================
router.get('/activos/email', async (req: Request, res: Response): Promise<void> => {
    try {
        const { tipo } = req.query;
        const suscriptores = await SuscriptoresDAO.getActivosForEmail(tipo);
        res.json({
            success: true,
            tipo: tipo || 'todas',
            total: suscriptores.length,
            emails: suscriptores.map((s: any) => s.email),
            suscriptores
        });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error al obtener emails activos:', sanitizeError(error as Error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al obtener emails activos' });
    }
});

// ============================================
// GET - Estadísticas generales
// ============================================
router.get('/stats/general', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await SuscriptoresDAO.getStats();
        res.json({ success: true, data: stats });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error estadísticas:', sanitizeError(error as Error, 'suscriptores'));
        if (error.code === '42P01' || error.code === '42703') {
            res.json({ success: true, data: { total: 0, porEstado: [], porTipo: {} } });
            return;
        }
        res.status(500).json({ success: false, error: 'Error estadísticas' });
    }
});

// ============================================
// GET - Obtener suscriptor por ID
// ============================================
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const suscriptor = await SuscriptoresDAO.getById(id);
        if (!suscriptor) {
            res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
            return;
        }
        res.json({ success: true, suscriptor });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error obtener suscriptor:', sanitizeError(error as Error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error obtener suscriptor' });
    }
});

// ============================================
// POST - Crear nuevo suscriptor
// ============================================
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, nombre, notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, ip_registro, user_agent, fuente } = req.body;

        if (!email) { res.status(400).json({ success: false, error: 'Email obligatorio' }); return; }

        const existing = await SuscriptoresDAO.getByEmail(email);
        if (existing) {
            if (existing.estado === 'cancelado') {
                await SuscriptoresDAO.reactivate(email, { notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas });
                res.json({ success: true, message: 'Reactivado', id: existing.id, reactivated: true });
            } else {
                await SuscriptoresDAO.updatePreferences(email, { notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas });
                res.json({ success: true, message: 'Actualizado', id: existing.id, updated: true });
            }
            return;
        }

        const token_verificacion = crypto.randomBytes(32).toString('hex');
        const result = await SuscriptoresDAO.create({
            email, nombre, notif_convocatorias, notif_becas, notif_eventos,
            notif_noticias, notif_todas, token_verificacion, ip_registro, user_agent, fuente
        });

        res.status(201).json({ success: true, message: 'Registrado', id: result.id, token_verificacion });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error crear:', sanitizeError(error as Error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al registrar' });
    }
});

// ============================================
// PUT - Actualizar suscriptor
// ============================================
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await SuscriptoresDAO.update(id, req.body);
        if (!result || result.length === 0) {
            res.status(404).json({ success: false, error: 'No encontrado' });
            return;
        }
        res.json({ success: true, message: 'Actualizado exitosamente' });
    } catch (error: any) {
        debugLog.error('SUSCRIPTORES', '❌ Error actualizar:', sanitizeError(error as Error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
});

// @ts-ignore
export = router;
