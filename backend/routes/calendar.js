/**
 * 🎯 FASE 2A - CALENDAR ROUTES
 * Sistema de calendario interactivo para BGE
 * Gestión de eventos escolares y sincronización con Google Calendar
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// Servicios
const calendarService = require('../services/calendarService');
// const notificationService = require('../services/notificationService'); // TODO: Crear servicio

// ============================================
// MIDDLEWARE DE CALENDARIO
// ============================================

const requireAdmin = requireRole(['admin', 'director', 'coordinador', 'docente']);

// ============================================
// RUTAS DE EVENTOS - CRUD COMPLETO
// ============================================

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Obtener eventos del calendario
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del rango
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del rango
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [academico, administrativo, cultural, deportivo, social, emergencia]
 *         description: Filtrar por tipo de evento
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [month, week, day, agenda]
 *           default: month
 *         description: Tipo de vista del calendario
 *     responses:
 *       200:
 *         description: Eventos obtenidos exitosamente
 */
router.get('/events', async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            type,
            view = 'month',
            limit = 50,
            offset = 0
        } = req.query;

        // Si no se proporciona rango, usar el mes actual
        const now = new Date();
        const defaultStartDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const filters = {
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
            range: {
                start: defaultStartDate,
                end: defaultEndDate
            },
            view: view
        });
    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events/{id}:
 *   get:
 *     summary: Obtener evento específico
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const event = await calendarService.getEventById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Error obteniendo evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events:
 *   post:
 *     summary: Crear nuevo evento
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - start_date
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               all_day:
 *                 type: boolean
 *                 default: false
 *               location:
 *                 type: string
 *                 maxLength: 255
 *               type:
 *                 type: string
 *                 enum: [academico, administrativo, cultural, deportivo, social, emergencia]
 *               priority:
 *                 type: string
 *                 enum: [baja, media, alta, urgente]
 *                 default: media
 *               is_public:
 *                 type: boolean
 *                 default: true
 *               max_attendees:
 *                 type: integer
 *               send_notifications:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Evento creado exitosamente
 */
router.post('/events', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            start_date,
            end_date,
            all_day = false,
            location,
            type,
            priority = 'media',
            is_public = true,
            max_attendees,
            send_notifications = true,
            metadata
        } = req.body;

        // Validaciones
        if (!title || !start_date || !type) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos faltantes',
                required: ['title', 'start_date', 'type']
            });
        }

        const validTypes = ['academico', 'administrativo', 'cultural', 'deportivo', 'social', 'emergencia'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de evento inválido',
                validTypes
            });
        }

        // Validar fechas
        const startDateTime = new Date(start_date);
        const endDateTime = end_date ? new Date(end_date) : null;

        if (endDateTime && endDateTime <= startDateTime) {
            return res.status(400).json({
                success: false,
                error: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
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
            created_by: req.user.id,
            metadata: metadata ? JSON.stringify(metadata) : null
        };

        const newEvent = await calendarService.createEvent(eventData);

        // Enviar notificaciones si se solicita
        // if (send_notifications && is_public) {
        //     await notificationService.notifyNewEvent(newEvent, req.user.id);
        // }

        // Intentar sincronizar con Google Calendar (si está configurado)
        try {
            await calendarService.syncWithGoogleCalendar(newEvent);
        } catch (syncError) {
            console.warn('No se pudo sincronizar con Google Calendar:', syncError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            data: newEvent
        });
    } catch (error) {
        console.error('Error creando evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events/{id}:
 *   put:
 *     summary: Actualizar evento existente
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.put('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Agregar información del editor
        updateData.updated_by = req.user.id;
        updateData.updated_at = new Date();

        if (updateData.metadata) {
            updateData.metadata = JSON.stringify(updateData.metadata);
        }

        const updatedEvent = await calendarService.updateEvent(id, updateData);

        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        // Notificar cambios si es necesario
        // if (updateData.send_notifications !== false && updatedEvent.is_public) {
        //     await notificationService.notifyEventUpdate(updatedEvent, req.user.id);
        // }

        res.json({
            success: true,
            message: 'Evento actualizado exitosamente',
            data: updatedEvent
        });
    } catch (error) {
        console.error('Error actualizando evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events/{id}:
 *   delete:
 *     summary: Eliminar evento
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await calendarService.deleteEvent(id, req.user.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Evento eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ============================================
// RUTAS ESPECIALES DE CALENDARIO
// ============================================

/**
 * @swagger
 * /api/calendar/events/upcoming:
 *   get:
 *     summary: Obtener próximos eventos
 *     tags: [Calendar]
 */
router.get('/events/upcoming', async (req, res) => {
    try {
        const { limit = 5, type } = req.query;

        const upcomingEvents = await calendarService.getUpcomingEvents({
            limit: parseInt(limit),
            type,
            is_public: true
        });

        res.json({
            success: true,
            data: upcomingEvents
        });
    } catch (error) {
        console.error('Error obteniendo eventos próximos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events/today:
 *   get:
 *     summary: Obtener eventos de hoy
 *     tags: [Calendar]
 */
router.get('/events/today', async (req, res) => {
    try {
        const todayEvents = await calendarService.getTodayEvents();

        res.json({
            success: true,
            data: todayEvents,
            count: todayEvents.length
        });
    } catch (error) {
        console.error('Error obteniendo eventos de hoy:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events/{id}/attend:
 *   post:
 *     summary: Registrar asistencia a evento
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.post('/events/:id/attend', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await calendarService.registerAttendance(id, userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.message
            });
        }

        res.json({
            success: true,
            message: 'Asistencia registrada exitosamente',
            data: result.attendance
        });
    } catch (error) {
        console.error('Error registrando asistencia:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/events/{id}/attendees:
 *   get:
 *     summary: Obtener lista de asistentes
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.get('/events/:id/attendees', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const attendees = await calendarService.getEventAttendees(id);

        res.json({
            success: true,
            data: attendees,
            count: attendees.length
        });
    } catch (error) {
        console.error('Error obteniendo asistentes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ============================================
// INTEGRACIÓN CON GOOGLE CALENDAR
// ============================================

/**
 * @swagger
 * /api/calendar/google/sync:
 *   post:
 *     summary: Sincronizar con Google Calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.post('/google/sync', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { calendar_id, sync_direction = 'both' } = req.body;

        const result = await calendarService.syncAllWithGoogle({
            calendar_id,
            sync_direction,
            user_id: req.user.id
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
        console.error('Error en sincronización:', error);
        res.status(500).json({
            success: false,
            error: 'Error en sincronización',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/google/auth:
 *   get:
 *     summary: Obtener URL de autorización de Google
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.get('/google/auth', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const authUrl = await calendarService.getGoogleAuthUrl();

        res.json({
            success: true,
            data: {
                auth_url: authUrl
            }
        });
    } catch (error) {
        console.error('Error obteniendo URL de autorización:', error);
        res.status(500).json({
            success: false,
            error: 'Error de autorización',
            message: error.message
        });
    }
});

// ============================================
// ESTADÍSTICAS Y REPORTES
// ============================================

/**
 * @swagger
 * /api/calendar/stats:
 *   get:
 *     summary: Obtener estadísticas del calendario
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        const stats = await calendarService.getCalendarStats(period);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/calendar/export:
 *   get:
 *     summary: Exportar calendario en formato ICS
 *     tags: [Calendar]
 */
router.get('/export', async (req, res) => {
    try {
        const { start_date, end_date, type } = req.query;

        const icsData = await calendarService.exportToICS({
            start_date,
            end_date,
            type
        });

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="calendario-bge.ics"');
        res.send(icsData);
    } catch (error) {
        console.error('Error exportando calendario:', error);
        res.status(500).json({
            success: false,
            error: 'Error exportando calendario',
            message: error.message
        });
    }
});

// ============================================
// RECORDATORIOS AUTOMÁTICOS
// ============================================

/**
 * @swagger
 * /api/calendar/reminders/{id}:
 *   post:
 *     summary: Configurar recordatorios para evento
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.post('/reminders/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reminders } = req.body;

        // reminders = [{type: 'email', minutes_before: 1440}, {type: 'push', minutes_before: 60}]

        const result = await calendarService.setEventReminders(id, reminders, req.user.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Recordatorios configurados exitosamente',
            data: result
        });
    } catch (error) {
        console.error('Error configurando recordatorios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

module.exports = router;