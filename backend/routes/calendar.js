"use strict";
/**
 * 📅 CALENDAR ROUTES - TypeScript
 * Sistema de calendario y sincronización con Google Calendar
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const auth_1 = require("../middleware/auth");
// @ts-ignore
const calendarService_1 = __importDefault(require("../services/calendarService"));
const router = express_1.default.Router();
const requireAdmin = (0, auth_1.requireRole)(['admin', 'director', 'coordinador', 'docente']);
router.get('/events', async (req, res) => {
    try {
        const { start_date, end_date, type, view = 'month', limit = '50', offset = '0' } = req.query;
        const now = new Date();
        const defaultStartDate = start_date ? new Date(start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = end_date ? new Date(end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const filters = {
            start_date: defaultStartDate,
            end_date: defaultEndDate,
            type: type,
            view: view,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        const result = await calendarService_1.default.getEvents(filters);
        res.json({
            success: true,
            data: result.events,
            total: result.total,
            range: { start: defaultStartDate, end: defaultEndDate },
            view
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CALENDAR', 'Error obteniendo eventos:', (0, sanitized_errors_1.sanitizeError)(error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: error.message });
    }
});
router.post('/events', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, start_date, end_date, all_day = false, location, type, priority = 'media', is_public = true, max_attendees, metadata } = req.body;
        if (!title || !start_date || !type) {
            res.status(400).json({ error: 'Campos requeridos faltantes' });
            return;
        }
        const newEvent = await calendarService_1.default.createEvent({
            title, description, start_date: new Date(start_date), end_date: end_date ? new Date(end_date) : null,
            all_day, location, type, priority, is_public, max_attendees,
            created_by: req.user.id,
            metadata: metadata ? JSON.stringify(metadata) : null
        });
        res.status(201).json({ success: true, message: 'Evento creado', data: newEvent });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CALENDAR', 'Error creando evento:', (0, sanitized_errors_1.sanitizeError)(error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: error.message });
    }
});
router.put('/events/:id', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updated_by: req.user.id, updated_at: new Date() };
        if (updateData.metadata)
            updateData.metadata = JSON.stringify(updateData.metadata);
        const updatedEvent = await calendarService_1.default.updateEvent(id, updateData);
        if (!updatedEvent) {
            res.status(404).json({ error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Evento actualizado', data: updatedEvent });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CALENDAR', 'Error actualizando evento:', (0, sanitized_errors_1.sanitizeError)(error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: error.message });
    }
});
router.delete('/events/:id', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await calendarService_1.default.deleteEvent(id, req.user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Evento eliminado' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CALENDAR', 'Error eliminando evento:', (0, sanitized_errors_1.sanitizeError)(error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error interno', message: error.message });
    }
});
// Google Calendar Integration
router.post('/google/sync', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { calendar_id, sync_direction = 'both' } = req.body;
        const result = await calendarService_1.default.syncAllWithGoogle({
            calendar_id, sync_direction, user_id: req.user.id
        });
        res.json({ success: true, message: 'Sincronización completada', data: result });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CALENDAR', 'Error en sincronización:', (0, sanitized_errors_1.sanitizeError)(error, 'calendar'));
        res.status(500).json({ success: false, error: 'Error en sincronización', message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=calendar.js.map