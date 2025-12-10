/**
 * 📅 CALENDAR ROUTES - TypeScript
 * Sistema de calendario y sincronización con Google Calendar
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';
import { authenticateToken, requireRole } from '../middleware/auth';
// @ts-ignore
import calendarService from '../services/calendarService';

const router: Router = express.Router();

const requireAdmin = requireRole(['admin', 'director', 'coordinador', 'docente']);

interface CalendarFilters {
    start_date: Date;
    end_date: Date;
    type?: string;
    view?: string;
    limit: number;
    offset: number;
}

router.get('/events', async (req: Request, res: Response) => {
    try {
        const {
            start_date, end_date, type,
            view = 'month', limit = '50', offset = '0'
        } = req.query;

        const now = new Date();
        const defaultStartDate = start_date ? new Date(start_date as string) : new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = end_date ? new Date(end_date as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const filters: CalendarFilters = {
            start_date: defaultStartDate,
            end_date: defaultEndDate,
            type: type as string,
            view: view as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        };

        const result = await calendarService.getEvents(filters);

        res.json({
            success: true,
            data: result.events,
            total: result.total,
            range: { start: defaultStartDate, end: defaultEndDate },
            view
        });
    } catch (error) {
        debugLog.error('CALENDAR', 'Error obteniendo eventos:', sanitizeError(error as Error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: (error as Error).message });
    }
});

router.post('/events', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const {
            title, description, start_date, end_date,
            all_day = false, location, type, priority = 'media',
            is_public = true, max_attendees, metadata
        } = req.body;

        if (!title || !start_date || !type) {
            res.status(400).json({ error: 'Campos requeridos faltantes' });
            return;
        }

        const newEvent = await calendarService.createEvent({
            title, description, start_date: new Date(start_date), end_date: end_date ? new Date(end_date) : null,
            all_day, location, type, priority, is_public, max_attendees,
            created_by: (req as any).user.id,
            metadata: metadata ? JSON.stringify(metadata) : null
        });

        res.status(201).json({ success: true, message: 'Evento creado', data: newEvent });
    } catch (error) {
        debugLog.error('CALENDAR', 'Error creando evento:', sanitizeError(error as Error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: (error as Error).message });
    }
});

router.put('/events/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updated_by: (req as any).user.id, updated_at: new Date() };
        if (updateData.metadata) updateData.metadata = JSON.stringify(updateData.metadata);

        const updatedEvent = await calendarService.updateEvent(id, updateData);
        if (!updatedEvent) {
            res.status(404).json({ error: 'Evento no encontrado' });
            return;
        }

        res.json({ success: true, message: 'Evento actualizado', data: updatedEvent });
    } catch (error) {
        debugLog.error('CALENDAR', 'Error actualizando evento:', sanitizeError(error as Error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: (error as Error).message });
    }
});

router.delete('/events/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await calendarService.deleteEvent(id, (req as any).user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
        debugLog.error('CALENDAR', 'Error eliminando evento:', sanitizeError(error as Error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: (error as Error).message });
    }
});

// Google Calendar Integration
router.post('/google/sync', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { calendar_id, sync_direction = 'both' } = req.body;
        const result = await calendarService.syncAllWithGoogle({
            calendar_id, sync_direction, user_id: (req as any).user.id
        });
        res.json({ success: true, message: 'Sincronización completada', data: result });
    } catch (error) {
        debugLog.error('CALENDAR', 'Error en sincronización:', sanitizeError(error as Error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error en sincronización', message: (error as Error).message });
    }
});

export default router;
