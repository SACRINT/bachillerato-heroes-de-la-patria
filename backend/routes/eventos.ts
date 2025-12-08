/**
 * 📅 API CRUD PARA EVENTOS - TypeScript
 * Sistema de gestión de eventos del CMS
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

// ✅ FASE 3: DAO Layer
import EventosDAO from '../data/eventos.dao';
import { softDelete } from '../data/soft-delete-helpers';
import { cacheMiddleware, TTL_CONFIG } from '../middleware/cache';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Evento {
    id: number;
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    ubicacion?: string;
    modalidad: 'presencial' | 'virtual' | 'hibrido';
    link_virtual?: string;
    categoria?: string;
    tipo?: string;
    etiquetas?: string[];
    estado: 'activo' | 'cancelado' | 'pospuesto' | 'finalizado';
    organizador: string;
    organizador_id?: number;
    contacto_email?: string;
    contacto_telefono?: string;
    capacidad_maxima?: number;
    inscripciones_abiertas: boolean;
    requiere_inscripcion: boolean;
    destacado: boolean;
    slug: string;
    created_at: string;
    updated_at: string;
}

interface EventoStats {
    total: number;
    activos: number;
    finalizados: number;
    cancelados: number;
    destacados: number;
}

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    descripcion?: string;
    categoria?: string;
    modalidad?: string;
    ubicacion?: string;
    cupo_maximo?: number;
    inscripciones_actuales?: number;
    destacado?: boolean;
    slug?: string;
    color_hex?: string;
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
 * POST /api/eventos - Crear nuevo evento
 */
router.post('/', [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('fecha_inicio').trim().notEmpty().withMessage('Fecha de inicio requerida')
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    const {
        titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion,
        modalidad, link_virtual, categoria, tipo, etiquetas, estado,
        organizador, organizador_id, contacto_email, contacto_telefono,
        capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, destacado
    } = req.body;

    const ip_address = req.ip || (req.connection as any).remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        let slug = generateSlug(titulo);
        const slugExists = await EventosDAO.slugExists(slug);
        if (slugExists) slug = `${slug}-${Date.now()}`;

        const evento = await EventosDAO.create({
            titulo, descripcion, imagen_url, fecha_inicio, fecha_fin,
            ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado,
            organizador, organizador_id, contacto_email, contacto_telefono,
            capacidad_maxima, inscripciones_abiertas, requiere_inscripcion,
            slug, destacado, ip_address, user_agent
        });

        debugLog.log('EVENTOS', '✅ Nuevo evento creado:', evento.id);
        res.status(201).json({ success: true, message: 'Evento creado exitosamente', data: evento });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al crear evento:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al crear el evento' });
    }
});

/**
 * GET /api/eventos - Listar todos
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { estado, categoria, modalidad, destacado, limit = '50', offset = '0' } = req.query as Record<string, string>;

    try {
        const { eventos, total } = await EventosDAO.getAll({ estado, categoria, modalidad, destacado, limit, offset });
        res.json({ success: true, data: eventos, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener eventos:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener eventos' });
    }
});

/**
 * GET /api/eventos/stats
 */
router.get('/stats', cacheMiddleware({ ttl: TTL_CONFIG.stats }), async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await EventosDAO.getStats() as EventoStats;
        res.json({ success: true, data: stats });
    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener estadísticas:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/eventos/calendar - Formato FullCalendar
 */
router.get('/calendar', async (req: Request, res: Response): Promise<void> => {
    try {
        const { start, end, categoria, modalidad } = req.query as Record<string, string>;
        const rows = await EventosDAO.getCalendarEvents({ start, end, categoria, modalidad }) as CalendarEvent[];

        const events = rows.map(evento => ({
            id: evento.id,
            title: evento.title,
            start: evento.start,
            end: evento.end,
            description: evento.descripcion,
            extendedProps: {
                categoria: evento.categoria,
                modalidad: evento.modalidad,
                ubicacion: evento.ubicacion,
                cupoMaximo: evento.cupo_maximo,
                inscripciones: evento.inscripciones_actuales,
                destacado: evento.destacado,
                slug: evento.slug
            },
            backgroundColor: evento.color_hex || '#3788d8',
            borderColor: evento.color_hex || '#3788d8',
            textColor: '#ffffff'
        }));

        res.json({ success: true, events });
    } catch (error) {
        debugLog.error('EVENTOS', 'Error en /calendar:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener eventos para calendario' });
    }
});

/**
 * GET /api/eventos/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const evento = await EventosDAO.getById(id) as Evento | null;
        if (!evento) {
            res.status(404).json({ success: false, error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, data: evento });
    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener evento:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener el evento' });
    }
});

/**
 * GET /api/eventos/slug/:slug
 */
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const evento = await EventosDAO.getBySlug(slug) as Evento | null;
        if (!evento) {
            res.status(404).json({ success: false, error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, data: evento });
    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener evento:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener el evento' });
    }
});

/**
 * PUT /api/eventos/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion,
        modalidad, link_virtual, categoria, tipo, etiquetas, estado,
        organizador, contacto_email, contacto_telefono, capacidad_maxima,
        inscripciones_abiertas, requiere_inscripcion, destacado
    } = req.body;

    try {
        const evento = await EventosDAO.update(id, {
            titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion,
            modalidad, link_virtual, categoria, tipo, etiquetas, estado,
            organizador, contacto_email, contacto_telefono, capacidad_maxima,
            inscripciones_abiertas, requiere_inscripcion, destacado
        });

        if (!evento) {
            res.status(404).json({ success: false, error: 'Evento no encontrado' });
            return;
        }

        debugLog.log('EVENTOS', `✅ Evento ${id} actualizado`);
        res.json({ success: true, message: 'Evento actualizado correctamente', data: evento });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al actualizar evento:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al actualizar el evento' });
    }
});

/**
 * DELETE /api/eventos/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const deleted = await softDelete('eventos', id);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Evento no encontrado o ya eliminado' });
            return;
        }
        debugLog.log('EVENTOS', `🗑️ Evento ${id} eliminado (soft delete)`);
        res.json({ success: true, message: 'Evento eliminado correctamente' });
    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al eliminar evento:', sanitizeError(error as Error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al eliminar el evento' });
    }
});

export default router;
