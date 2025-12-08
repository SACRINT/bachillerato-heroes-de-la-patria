/**
 * 🎯 CALENDAR ROUTES - Sistema de calendario v2.0 - TypeScript
 * Gestión de eventos escolares y sincronización (Google Cal opcional)
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
// @ts-ignore
import calendarService from '../services/calendarService';
// @ts-ignore
import notificationService from '../services/notificationService'; // Opcional
import { authenticateToken, requireRole } from '../middleware/auth';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

const router: Router = express.Router();

// ============================================
// MIDDLEWARE & TIPOS
// ============================================

const requireAdmin = requireRole(['admin', 'director', 'coordinador', 'docente']);

interface CalendarFilters {
    start_date: Date;
    end_date: Date;
    type?: string;
    view: string;
    limit: number;
    offset: number;
}

interface EventBody {
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    all_day?: boolean;
    location?: string;
    type: string;
    priority?: string;
    is_public?: boolean;
    max_attendees?: number;
    send_notifications?: boolean;
    metadata?: any;
    created_by?: number;
    updated_by?: number;
    updated_at?: Date;
}

interface RequestWithUser extends Request {
    user?: { id: number; role: string; email: string };
}

// ============================================
// RUTAS DE EVENTOS
// ============================================

/**
 * GET /api/calendar/events
 */
router.get('/events', async (req: Request, res: Response): Promise<void> => {
    try {
        const { start_date, end_date, type, view = 'month', limit = 50, offset = 0 } = req.query as any;

        const now = new Date();
        const defaultStartDate = start_date ? new Date(start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = end_date ? new Date(end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const filters: CalendarFilters = {
            start_date: defaultStartDate,
            end_date: defaultEndDate,
            type,
            view,
            limit: parseInt(limit),
            offset: parseInt(offset)
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
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/calendar/events/:id
 */
router.get('/events/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const event = await calendarService.getEventById(id);

        if (!event) { res.status(404).json({ success: false, error: 'Evento no encontrado' }); return; }

        res.json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/calendar/events
 */
router.post('/events', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const {
            title, description, start_date, end_date, all_day = false,
            location, type, priority = 'media', is_public = true,
            max_attendees, send_notifications = true, metadata
        } = req.body as EventBody;

        if (!title || !start_date || !type) {
            res.status(400).json({ success: false, error: 'Campos requeridos faltantes', required: ['title', 'start_date', 'type'] });
            return;
        }

        const validTypes = ['academico', 'administrativo', 'cultural', 'deportivo', 'social', 'emergencia'];
        if (!validTypes.includes(type)) {
            res.status(400).json({ success: false, error: 'Tipo de evento inválido', validTypes });
            return;
        }

        const startDateTime = new Date(start_date);
        const endDateTime = end_date ? new Date(end_date) : null;

        if (endDateTime && endDateTime <= startDateTime) {
            res.status(400).json({ success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
            return;
        }

        const eventData = {
            title: title.trim(),
            description: description?.trim(),
            start_date: startDateTime,
            end_date: endDateTime,
            all_day,
            location: location?.trim(),
            type,
            priority,
            is_public,
            max_attendees,
            created_by: req.user!.id,
            metadata: metadata ? JSON.stringify(metadata) : null
        };

        const newEvent = await calendarService.createEvent(eventData);

        // Intento de sync con Google Calendar (fail-safe)
        try {
            await calendarService.syncWithGoogleCalendar(newEvent);
        } catch (syncError) {
            debugLog.warn('CALENDAR', 'Fallo sync Google Calendar', (syncError as Error).message);
        }

        res.status(201).json({ success: true, message: 'Evento creado exitosamente', data: newEvent });

    } catch (error) {
        debugLog.error('CALENDAR', 'Error creando evento:', sanitizeError(error as Error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/calendar/events/:id
 */
router.put('/events/:id', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        updateData.updated_by = req.user!.id;
        updateData.updated_at = new Date();

        if (updateData.metadata) {
            updateData.metadata = JSON.stringify(updateData.metadata);
        }

        const updatedEvent = await calendarService.updateEvent(id, updateData);

        if (!updatedEvent) { res.status(404).json({ success: false, error: 'Evento no encontrado' }); return; }

        res.json({ success: true, message: 'Evento actualizado exitosamente', data: updatedEvent });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/calendar/events/:id
 */
router.delete('/events/:id', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await calendarService.deleteEvent(id, req.user!.id);

        if (!deleted) { res.status(404).json({ success: false, error: 'Evento no encontrado' }); return; }

        res.json({ success: true, message: 'Evento eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS ESPECIALES
// ============================================

/**
 * GET /api/calendar/events/upcoming
 */
router.get('/events/upcoming', async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 5, type } = req.query as any;
        const upcomingEvents = await calendarService.getUpcomingEvents({
            limit: parseInt(limit),
            type,
            is_public: true
        });
        res.json({ success: true, data: upcomingEvents });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo eventos próximos' });
    }
});

/**
 * GET /api/calendar/events/today
 */
router.get('/events/today', async (req: Request, res: Response): Promise<void> => {
    try {
        const todayEvents = await calendarService.getTodayEvents();
        res.json({ success: true, data: todayEvents, count: todayEvents.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo eventos de hoy' });
    }
});

/**
 * POST /api/calendar/events/:id/attend
 */
router.post('/events/:id/attend', authenticateToken, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const result = await calendarService.registerAttendance(id, userId);

        if (!result.success) { res.status(400).json({ success: false, error: result.message }); return; }

        res.json({ success: true, message: 'Asistencia registrada', data: result.attendance });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error registrando asistencia' });
    }
});

/**
 * GET /api/calendar/events/:id/attendees
 */
router.get('/events/:id/attendees', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const attendees = await calendarService.getEventAttendees(id);
        res.json({ success: true, data: attendees, count: attendees.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo asistentes' });
    }
});

// ============================================
// GOOGLE CALENDAR SYNC
// ============================================

router.post('/google/sync', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { calendar_id, sync_direction = 'both' } = req.body;
        const result = await calendarService.syncAllWithGoogle({
            calendar_id,
            sync_direction,
            user_id: req.user!.id
        });
        res.json({
            success: true,
            message: 'Sincronización completada',
            data: {
                events_synced: result.eventsSynced,
                events_created: result.eventsCreated,
                events_updated: result.eventsUpdated
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error en sincronización' });
    }
});

router.get('/google/auth', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const authUrl = await calendarService.getGoogleAuthUrl();
        res.json({ success: true, data: { auth_url: authUrl } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error de autorización' });
    }
});

// ============================================
// EXPORT & STATS
// ============================================

router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = 'month' } = req.query;
        const stats = await calendarService.getCalendarStats(period);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }
});

router.get('/export', async (req: Request, res: Response): Promise<void> => {
    try {
        const { start_date, end_date, type } = req.query;
        const icsData = await calendarService.exportToICS({ start_date, end_date, type });

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="calendario-bge.ics"');
        res.send(icsData);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error exportando calendario' });
    }
});

router.post('/reminders/:id', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reminders } = req.body;
        const result = await calendarService.setEventReminders(id, reminders, req.user!.id);

        if (!result) { res.status(404).json({ success: false, error: 'Evento no encontrado' }); return; }

        res.json({ success: true, message: 'Recordatorios configurados', data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error configurando recordatorios' });
    }
});

export default router;
