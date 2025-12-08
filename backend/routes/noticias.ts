/**
 * 📰 API CRUD PARA NOTICIAS - TypeScript
 * Sistema de gestión de noticias del CMS
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

// ✅ FASE 3: DAO Layer
import NoticiasDAO from '../data/noticias.dao';
import { softDelete } from '../data/soft-delete-helpers';
import { cacheMiddleware, TTL_CONFIG } from '../middleware/cache';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Noticia {
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

interface NoticiaStats {
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
 * POST /api/noticias - Crear nueva noticia
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
        const slugExists = await NoticiasDAO.slugExists(slug);
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }

        const noticia = await NoticiasDAO.create({
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        });

        debugLog.log('NOTICIAS', '✅ Nueva noticia creada:', noticia.id);
        res.status(201).json({ success: true, message: 'Noticia creada exitosamente', data: noticia });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al crear noticia:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al crear la noticia' });
    }
});

/**
 * GET /api/noticias - Listar todos
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { estado, categoria, destacada, limit = '50', offset = '0' } = req.query as Record<string, string>;

    try {
        const { noticias, total } = await NoticiasDAO.getAll({ estado, categoria, destacada, limit, offset });
        res.json({ success: true, data: noticias, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener noticias:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener noticias' });
    }
});

/**
 * GET /api/noticias/stats
 */
router.get('/stats', cacheMiddleware({ ttl: TTL_CONFIG.stats }), async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await NoticiasDAO.getStats() as NoticiaStats;
        res.json({ success: true, data: stats });
    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener estadísticas:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/noticias/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const noticia = await NoticiasDAO.getById(id) as Noticia | null;
        if (!noticia) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada' });
            return;
        }
        await NoticiasDAO.incrementViews(id, 'id');
        res.json({ success: true, data: noticia });
    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener noticia:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener la noticia' });
    }
});

/**
 * GET /api/noticias/slug/:slug
 */
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const noticia = await NoticiasDAO.getBySlug(slug) as Noticia | null;
        if (!noticia) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada' });
            return;
        }
        await NoticiasDAO.incrementViews(slug, 'slug');
        res.json({ success: true, data: noticia });
    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener noticia:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener la noticia' });
    }
});

/**
 * PUT /api/noticias/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = req.body;

    try {
        const noticia = await NoticiasDAO.update(id, { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada });
        if (!noticia) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada' });
            return;
        }
        debugLog.log('NOTICIAS', `✅ Noticia ${id} actualizada`);
        res.json({ success: true, message: 'Noticia actualizada correctamente', data: noticia });
    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al actualizar noticia:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al actualizar la noticia' });
    }
});

/**
 * DELETE /api/noticias/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const deleted = await softDelete('noticias', id);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada o ya eliminada' });
            return;
        }
        debugLog.log('NOTICIAS', `🗑️ Noticia ${id} eliminada (soft delete)`);
        res.json({ success: true, message: 'Noticia eliminada correctamente' });
    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al eliminar noticia:', sanitizeError(error as Error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al eliminar la noticia' });
    }
});

export default router;
