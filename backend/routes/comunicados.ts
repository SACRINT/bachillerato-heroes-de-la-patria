/**
 * 📰 API CRUD PARA COMUNICADOS - TypeScript
 * Sistema de gestión de comunicados del CMS
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

// ✅ FASE 3: DAO Layer
import ComunicadosDAO from '../data/comunicados.dao';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Comunicado {
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

interface ComunicadoStats {
    total: number;
    publicados: number;
    borradores: number;
    archivados: number;
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
 * POST /api/comunicados
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
        const slugExists = await ComunicadosDAO.slugExists(slug);
        if (slugExists) slug = `${slug}-${Date.now()}`;

        const comunicado = await ComunicadosDAO.create({
            titulo, contenido, resumen, imagen_url, categoria, etiquetas,
            estado, autor, autor_id, slug, meta_descripcion, destacada,
            ip_address, user_agent
        });

        debugLog.log('COMUNICADOS', '✅ Nueva comunicado creada:', comunicado.id);
        res.status(201).json({ success: true, message: 'Comunicado creada exitosamente', data: comunicado });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al crear comunicado:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al crear la comunicado' });
    }
});

/**
 * GET /api/comunicados
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { estado, categoria, destacada, limit = '50', offset = '0' } = req.query as Record<string, string>;
    try {
        const { comunicados, total } = await ComunicadosDAO.getAll({ estado, categoria, destacada, limit, offset });
        res.json({ success: true, data: comunicados, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener comunicados:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener comunicados' });
    }
});

/**
 * GET /api/comunicados/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await ComunicadosDAO.getStats() as ComunicadoStats;
        res.json({ success: true, data: stats });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener estadísticas:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/comunicados/slug/:slug
 */
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const comunicado = await ComunicadosDAO.getBySlug(slug) as Comunicado | null;
        if (!comunicado) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        await ComunicadosDAO.incrementViews(slug, 'slug');
        res.json({ success: true, data: comunicado });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener comunicado:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener la comunicado' });
    }
});

/**
 * GET /api/comunicados/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const comunicado = await ComunicadosDAO.getById(id) as Comunicado | null;
        if (!comunicado) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        await ComunicadosDAO.incrementViews(id, 'id');
        res.json({ success: true, data: comunicado });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener comunicado:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener la comunicado' });
    }
});

/**
 * PUT /api/comunicados/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = req.body;

    try {
        const comunicado = await ComunicadosDAO.update(id, {
            titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada
        });

        if (!comunicado) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }

        debugLog.log('COMUNICADOS', `✅ Comunicado ${id} actualizada`);
        res.json({ success: true, message: 'Comunicado actualizada correctamente', data: comunicado });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al actualizar comunicado:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al actualizar la comunicado' });
    }
});

/**
 * DELETE /api/comunicados/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await ComunicadosDAO.archive(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Comunicado archivada correctamente' });
    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al archivar comunicado:', sanitizeError(error as Error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al archivar la comunicado' });
    }
});

export default router;
