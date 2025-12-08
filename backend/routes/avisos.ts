/**
 * 📰 API CRUD PARA AVISOS - TypeScript
 * Sistema de gestión de avisos del CMS
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

// ✅ FASE 3: DAO Layer
import AvisosDAO from '../data/avisos.dao';
import { softDelete } from '../data/soft-delete-helpers';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Aviso {
    id: number;
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria?: string;
    etiquetas?: string[];
    estado: 'borrador' | 'publicado' | 'archivado';
    autor: string;
    autor_id?: number;
    slug: string;
    meta_descripcion?: string;
    destacada: boolean;
    vistas: number;
    created_at: string;
    updated_at: string;
}

interface AvisoStats {
    total: number;
    publicadas: number;
    borradores: number;
    destacadas: number;
    vistas_totales: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateSlug(titulo: string): string {
    return titulo
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 300);
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/avisos - Crear nueva aviso
 */
router.post('/', [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('contenido').trim().notEmpty().withMessage('Contenido requerido'),
    body('autor').trim().notEmpty().withMessage('Autor requerido')
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, autor, autor_id, meta_descripcion, destacada } = req.body;
    const ip_address = req.ip || (req.connection as any).remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        let slug = generateSlug(titulo);
        const slugExists = await AvisosDAO.slugExists(slug);
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }

        const aviso = await AvisosDAO.create({
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        });

        debugLog.log('AVISOS', '✅ Nueva aviso creada:', aviso.id);
        res.status(201).json({ success: true, message: 'Aviso creada exitosamente', data: aviso });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al crear aviso:', sanitizeError(error as Error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al crear la aviso' });
    }
});

/**
 * GET /api/avisos - Listar todos
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { estado, categoria, destacada, limit = '50', offset = '0' } = req.query as Record<string, string>;

    try {
        const { avisos, total } = await AvisosDAO.getAll({ estado, categoria, destacada, limit, offset });
        res.json({ success: true, data: avisos, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener avisos:', sanitizeError(error as Error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al obtener avisos' });
    }
});

/**
 * GET /api/avisos/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await AvisosDAO.getStats() as AvisoStats;
        res.json({ success: true, data: stats });
    } catch (error: unknown) {
        const err = error as Error & { code?: string };
        debugLog.error('AVISOS', '❌ Error al obtener estadísticas:', sanitizeError(err, 'avisos'));

        if (err.code === '42P01') {
            res.json({ success: true, data: { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 } });
            return;
        }
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/avisos/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const aviso = await AvisosDAO.getById(id) as Aviso | null;
        if (!aviso) {
            res.status(404).json({ success: false, error: 'Aviso no encontrada' });
            return;
        }
        await AvisosDAO.incrementViews(id, 'id');
        res.json({ success: true, data: aviso });
    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener aviso:', sanitizeError(error as Error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al obtener la aviso' });
    }
});

/**
 * GET /api/avisos/slug/:slug
 */
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const aviso = await AvisosDAO.getBySlug(slug) as Aviso | null;
        if (!aviso) {
            res.status(404).json({ success: false, error: 'Aviso no encontrada' });
            return;
        }
        await AvisosDAO.incrementViews(slug, 'slug');
        res.json({ success: true, data: aviso });
    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener aviso:', sanitizeError(error as Error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al obtener la aviso' });
    }
});

/**
 * PUT /api/avisos/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = req.body;

    try {
        const aviso = await AvisosDAO.update(id, { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada });
        if (!aviso) {
            res.status(404).json({ success: false, error: 'Aviso no encontrada' });
            return;
        }
        debugLog.log('AVISOS', `✅ Aviso ${id} actualizada`);
        res.json({ success: true, message: 'Aviso actualizada correctamente', data: aviso });
    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al actualizar aviso:', sanitizeError(error as Error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al actualizar la aviso' });
    }
});

/**
 * DELETE /api/avisos/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const deleted = await softDelete('avisos', id);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Aviso no encontrado o ya eliminado' });
            return;
        }
        debugLog.log('AVISOS', `🗑️ Aviso ${id} eliminado (soft delete)`);
        res.json({ success: true, message: 'Aviso eliminado correctamente' });
    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al eliminar aviso:', sanitizeError(error as Error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al eliminar el aviso' });
    }
});

export default router;
