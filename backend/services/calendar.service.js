"use strict";
/**
 * 🎯 CALENDAR SERVICE - TypeScript
 * Servicio de calendario interactivo para BGE
 * Gestión de eventos escolares con integración Google Calendar
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarService = getCalendarService;
const path_1 = __importDefault(require("path"));
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
const promises_1 = __importDefault(require("fs/promises"));
// =====================================================
// CALENDAR SERVICE CLASS
// =====================================================
class CalendarService {
    constructor() {
        this.dbAvailable = false;
        this.db = null;
        this.googleCalendar = null;
        this.jsonPath = path_1.default.join(__dirname, '../../data/eventos.json');
        this.initialize();
    }
    async initialize() {
        try {
            // Intentar conexión con DB
            this.db = require('../config/database.js');
            const isConnected = await this.db.testConnection?.();
            if (isConnected && typeof this.db.execute === 'function') {
                this.dbAvailable = true;
                devLogger_1.default.log('[CalendarService] ✅ MySQL disponible');
                await this.ensureTablesExist();
            }
            else {
                devLogger_1.default.log('[CalendarService] ⚠️ Fallback a JSON');
                this.dbAvailable = false;
                await this.ensureJsonStructure();
            }
        }
        catch (error) {
            devLogger_1.default.log(`[CalendarService] ⚠️ Fallback a JSON - ${error.message}`);
            this.dbAvailable = false;
            await this.ensureJsonStructure();
        }
        // Intentar inicializar Google Calendar
        try {
            await this.initializeGoogleCalendar();
        }
        catch (error) {
            devLogger_1.default.log(`[CalendarService] ⚠️ Google Calendar no disponible: ${error.message}`);
        }
    }
    // ============================================
    // INICIALIZACIÓN DE ESTRUCTURAS
    // ============================================
    async ensureTablesExist() {
        try {
            const createEventsTable = `
                CREATE TABLE IF NOT EXISTS calendar_events (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP,
                    all_day BOOLEAN DEFAULT FALSE,
                    location VARCHAR(255),
                    type VARCHAR(50) NOT NULL,
                    priority VARCHAR(20) DEFAULT 'media',
                    is_public BOOLEAN DEFAULT TRUE,
                    max_attendees INT,
                    current_attendees INT DEFAULT 0,
                    google_event_id VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'programado',
                    created_by INT NOT NULL,
                    updated_by INT,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            await this.db.execute(createEventsTable);
            devLogger_1.default.log('[CalendarService] ✅ Tabla calendar_events verificada');
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error creando tablas', error);
            throw error;
        }
    }
    async ensureJsonStructure() {
        try {
            const jsonDir = path_1.default.dirname(this.jsonPath);
            try {
                await promises_1.default.access(jsonDir);
            }
            catch {
                await promises_1.default.mkdir(jsonDir, { recursive: true });
            }
            try {
                await promises_1.default.access(this.jsonPath);
            }
            catch {
                const initialData = {
                    eventos: [],
                    lastUpdated: new Date().toISOString(),
                    version: '1.0'
                };
                await promises_1.default.writeFile(this.jsonPath, JSON.stringify(initialData, null, 2));
                devLogger_1.default.log('[CalendarService] ✅ Creado: eventos.json');
            }
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error inicializando JSON', error);
        }
    }
    async initializeGoogleCalendar() {
        devLogger_1.default.log('[CalendarService] 📅 Google Calendar: Configuración pendiente');
    }
    // ============================================
    // OPERACIONES CRUD DE EVENTOS
    // ============================================
    async getEvents(filters = {}) {
        if (this.dbAvailable) {
            return this.getEventsFromDB(filters);
        }
        else {
            return this.getEventsFromJSON(filters);
        }
    }
    async getEventsFromDB(filters) {
        try {
            let query = `
                SELECT
                    id, title, description, start_date, end_date,
                    all_day, location, type, priority, is_public,
                    max_attendees, current_attendees, status,
                    created_by, created_at, updated_at, metadata
                FROM calendar_events
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;
            if (filters.start_date) {
                query += ` AND start_date >= $${paramIndex++}`;
                params.push(filters.start_date);
            }
            if (filters.end_date) {
                query += ` AND start_date <= $${paramIndex++}`;
                params.push(filters.end_date);
            }
            if (filters.type) {
                query += ` AND type = $${paramIndex++}`;
                params.push(filters.type);
            }
            if (filters.include_private !== true) {
                query += ' AND is_public = TRUE';
            }
            query += " AND status != 'cancelado'";
            query += ' ORDER BY start_date ASC, created_at ASC';
            if (filters.limit) {
                query += ` LIMIT $${paramIndex++}`;
                params.push(filters.limit);
            }
            if (filters.offset) {
                query += ` OFFSET $${paramIndex++}`;
                params.push(filters.offset);
            }
            const [events] = await this.db.execute(query, params);
            // Count total
            let countQuery = 'SELECT COUNT(*) as total FROM calendar_events WHERE 1=1';
            const countParams = [];
            let countParamIndex = 1;
            if (filters.start_date) {
                countQuery += ` AND start_date >= $${countParamIndex++}`;
                countParams.push(filters.start_date);
            }
            if (filters.end_date) {
                countQuery += ` AND start_date <= $${countParamIndex++}`;
                countParams.push(filters.end_date);
            }
            if (filters.type) {
                countQuery += ` AND type = $${countParamIndex++}`;
                countParams.push(filters.type);
            }
            if (filters.include_private !== true) {
                countQuery += ' AND is_public = TRUE';
            }
            countQuery += " AND status != 'cancelado'";
            const [countResult] = await this.db.execute(countQuery, countParams);
            const total = parseInt(countResult[0]?.total || '0');
            return { events, total };
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error obteniendo eventos de DB', error);
            throw error;
        }
    }
    async getEventsFromJSON(filters) {
        try {
            const fileContent = await promises_1.default.readFile(this.jsonPath, 'utf-8');
            const data = JSON.parse(fileContent);
            let events = data.eventos || [];
            // Apply filters
            if (filters.start_date || filters.end_date) {
                const startFilter = filters.start_date ? new Date(filters.start_date) : new Date('1970-01-01');
                const endFilter = filters.end_date ? new Date(filters.end_date) : new Date('2099-12-31');
                events = events.filter((event) => {
                    const eventDate = new Date(event.fecha || event.start_date);
                    return eventDate >= startFilter && eventDate <= endFilter;
                });
            }
            if (filters.type) {
                events = events.filter((event) => event.type === filters.type || event.tipo === filters.type);
            }
            // Normalize format
            const processedEvents = events.map((event, index) => ({
                id: event.id || `event_${index}`,
                title: event.title || event.titulo,
                description: event.description || event.descripcion,
                start_date: event.start_date || event.fecha,
                end_date: event.end_date || event.fecha_fin,
                all_day: event.all_day || event.todo_el_dia || false,
                location: event.location || event.ubicacion,
                type: event.type || event.tipo || 'academico',
                priority: event.priority || event.prioridad || 'media',
                is_public: true,
                status: 'programado',
                created_by: event.created_by || 1,
                created_at: event.created_at || event.fecha || new Date().toISOString()
            }));
            // Sort by date
            processedEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
            // Pagination
            const total = processedEvents.length;
            const offset = filters.offset || 0;
            const limit = filters.limit || total;
            const paginatedEvents = processedEvents.slice(offset, offset + limit);
            return { events: paginatedEvents, total };
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error obteniendo eventos de JSON', error);
            throw error;
        }
    }
    async getEventById(id) {
        if (this.dbAvailable) {
            try {
                const query = `
                    SELECT
                        id, title, description, start_date, end_date,
                        all_day, location, type, priority, is_public,
                        max_attendees, current_attendees, status,
                        created_by, created_at, updated_at, metadata
                    FROM calendar_events
                    WHERE id = $1
                `;
                const [rows] = await this.db.execute(query, [id]);
                if (rows.length === 0)
                    return null;
                return rows[0];
            }
            catch (error) {
                devLogger_1.default.error('[CalendarService] Error obteniendo evento por ID', error);
                throw error;
            }
        }
        else {
            const result = await this.getEvents({});
            return result.events.find(event => event.id.toString() === id.toString()) || null;
        }
    }
    async createEvent(eventData) {
        if (this.dbAvailable) {
            return this.createEventInDB(eventData);
        }
        else {
            return this.createEventInJSON(eventData);
        }
    }
    async createEventInDB(eventData) {
        try {
            const query = `
                INSERT INTO calendar_events (
                    title, description, start_date, end_date, all_day,
                    location, type, priority, is_public, max_attendees,
                    created_by, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;
            const params = [
                eventData.title,
                eventData.description || null,
                eventData.start_date,
                eventData.end_date || null,
                eventData.all_day || false,
                eventData.location || null,
                eventData.type,
                eventData.priority || 'media',
                eventData.is_public !== false,
                eventData.max_attendees || null,
                eventData.created_by,
                eventData.metadata ? JSON.stringify(eventData.metadata) : null
            ];
            const [result] = await this.db.execute(query, params);
            return result[0];
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error creando evento en DB', error);
            throw error;
        }
    }
    async createEventInJSON(eventData) {
        try {
            const fileContent = await promises_1.default.readFile(this.jsonPath, 'utf-8');
            const data = JSON.parse(fileContent);
            const newId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newEvent = {
                id: newId,
                titulo: eventData.title,
                descripcion: eventData.description,
                fecha: eventData.start_date,
                fecha_fin: eventData.end_date,
                todo_el_dia: eventData.all_day,
                ubicacion: eventData.location,
                tipo: eventData.type,
                prioridad: eventData.priority || 'media',
                created_by: eventData.created_by,
                created_at: new Date().toISOString()
            };
            data.eventos.unshift(newEvent);
            data.lastUpdated = new Date().toISOString();
            await promises_1.default.writeFile(this.jsonPath, JSON.stringify(data, null, 2));
            return {
                id: newId,
                title: eventData.title,
                description: eventData.description,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                all_day: eventData.all_day || false,
                location: eventData.location,
                type: eventData.type,
                priority: (eventData.priority || 'media'),
                is_public: true,
                status: 'programado',
                created_by: eventData.created_by,
                created_at: new Date().toISOString()
            };
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error creando evento en JSON', error);
            throw error;
        }
    }
    async updateEvent(id, updateData) {
        if (this.dbAvailable) {
            return this.updateEventInDB(id, updateData);
        }
        else {
            devLogger_1.default.warn('[CalendarService] Actualización de eventos JSON no implementada completamente');
            return null;
        }
    }
    async updateEventInDB(id, updateData) {
        try {
            const fields = [];
            const params = [];
            let paramIndex = 1;
            const allowedFields = [
                'title', 'description', 'start_date', 'end_date', 'all_day',
                'location', 'type', 'priority', 'is_public', 'max_attendees',
                'status', 'metadata', 'updated_by'
            ];
            allowedFields.forEach(field => {
                if (updateData.hasOwnProperty(field)) {
                    fields.push(`${field} = $${paramIndex++}`);
                    params.push(updateData[field]);
                }
            });
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            fields.push('updated_at = NOW()');
            const query = `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
            params.push(id);
            const [result] = await this.db.execute(query, params);
            if (result.length === 0)
                return null;
            return result[0];
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error actualizando evento en DB', error);
            throw error;
        }
    }
    async deleteEvent(id, userId) {
        if (this.dbAvailable) {
            try {
                const query = `
                    UPDATE calendar_events
                    SET status = 'cancelado', updated_by = $1, updated_at = NOW()
                    WHERE id = $2
                `;
                const [result] = await this.db.execute(query, [userId, id]);
                return result.affectedRows > 0;
            }
            catch (error) {
                devLogger_1.default.error('[CalendarService] Error eliminando evento', error);
                throw error;
            }
        }
        else {
            return false;
        }
    }
    // ============================================
    // MÉTODOS ESPECIALES DE CALENDARIO
    // ============================================
    async getUpcomingEvents(options = {}) {
        const now = new Date();
        const filters = {
            start_date: now.toISOString(),
            limit: options.limit || 5,
            type: options.type,
            is_public: options.is_public !== false
        };
        const result = await this.getEvents(filters);
        return result.events;
    }
    async getTodayEvents() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const filters = {
            start_date: today.toISOString().split('T')[0] + 'T00:00:00',
            end_date: tomorrow.toISOString().split('T')[0] + 'T00:00:00'
        };
        const result = await this.getEvents(filters);
        return result.events;
    }
    async registerAttendance(eventId, userId) {
        if (!this.dbAvailable) {
            return { success: false, message: 'Base de datos no disponible' };
        }
        try {
            const event = await this.getEventById(eventId);
            if (!event) {
                return { success: false, message: 'Evento no encontrado' };
            }
            if (event.max_attendees && (event.current_attendees || 0) >= event.max_attendees) {
                return { success: false, message: 'Evento lleno' };
            }
            const insertQuery = `
                INSERT INTO event_attendees (event_id, user_id, status)
                VALUES ($1, $2, 'registrado')
                ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'registrado', updated_at = NOW()
            `;
            await this.db.execute(insertQuery, [eventId, userId]);
            const updateQuery = `
                UPDATE calendar_events
                SET current_attendees = (
                    SELECT COUNT(*) FROM event_attendees
                    WHERE event_id = $1 AND status != 'ausente'
                )
                WHERE id = $2
            `;
            await this.db.execute(updateQuery, [eventId, eventId]);
            return {
                success: true,
                attendance: {
                    event_id: eventId,
                    user_id: userId,
                    status: 'registrado',
                    registered_at: new Date().toISOString()
                }
            };
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Ya estás registrado en este evento' };
            }
            devLogger_1.default.error('[CalendarService] Error registrando asistencia', error);
            throw error;
        }
    }
    async getEventAttendees(eventId) {
        if (!this.dbAvailable) {
            return [];
        }
        try {
            const query = `
                SELECT user_id, status, registered_at, updated_at
                FROM event_attendees
                WHERE event_id = $1
                ORDER BY registered_at ASC
            `;
            const [attendees] = await this.db.execute(query, [eventId]);
            return attendees;
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error obteniendo asistentes', error);
            throw error;
        }
    }
    // ============================================
    // INTEGRACIÓN GOOGLE CALENDAR
    // ============================================
    async syncWithGoogleCalendar(event) {
        devLogger_1.default.log(`[CalendarService] 📅 Sincronización Google Calendar pendiente para evento: ${event.id}`);
        return { synced: false, message: 'Google Calendar no configurado' };
    }
    async syncAllWithGoogle() {
        devLogger_1.default.log('[CalendarService] 📅 Sincronización masiva Google Calendar pendiente');
        return { eventsSynced: 0, eventsCreated: 0, eventsUpdated: 0 };
    }
    getGoogleAuthUrl() {
        throw new Error('Google Calendar no configurado');
    }
    // ============================================
    // ESTADÍSTICAS Y EXPORTACIÓN
    // ============================================
    async getCalendarStats(period = 'month') {
        if (!this.dbAvailable) {
            return { period, message: 'Estadísticas no disponibles sin base de datos', last_updated: new Date().toISOString() };
        }
        try {
            const periodInterval = period === 'month' ? '1 month' : '1 week';
            const statsQuery = `
                SELECT type, status, COUNT(*) as count
                FROM calendar_events
                WHERE start_date >= NOW() - INTERVAL '${periodInterval}'
                GROUP BY type, status
                ORDER BY type, status
            `;
            const [stats] = await this.db.execute(statsQuery);
            const totalQuery = `
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'programado' THEN 1 END) as scheduled,
                    COUNT(CASE WHEN status = 'completado' THEN 1 END) as completed,
                    AVG(current_attendees) as avg_attendance
                FROM calendar_events
                WHERE start_date >= NOW() - INTERVAL '${periodInterval}'
            `;
            const [totals] = await this.db.execute(totalQuery);
            return {
                period,
                detailed: stats,
                summary: totals[0],
                last_updated: new Date().toISOString()
            };
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error obteniendo estadísticas', error);
            throw error;
        }
    }
    async exportToICS(options = {}) {
        const result = await this.getEvents(options);
        const events = result.events;
        let ics = 'BEGIN:VCALENDAR\r\n';
        ics += 'VERSION:2.0\r\n';
        ics += 'PRODID:-//BGE//BGE Calendar//ES\r\n';
        ics += 'CALSCALE:GREGORIAN\r\n';
        events.forEach(event => {
            ics += 'BEGIN:VEVENT\r\n';
            ics += `UID:${event.id}@bge.edu.mx\r\n`;
            ics += `DTSTART:${this.formatDateForICS(event.start_date)}\r\n`;
            if (event.end_date) {
                ics += `DTEND:${this.formatDateForICS(event.end_date)}\r\n`;
            }
            ics += `SUMMARY:${event.title}\r\n`;
            if (event.description) {
                ics += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\r\n`;
            }
            if (event.location) {
                ics += `LOCATION:${event.location}\r\n`;
            }
            ics += `DTSTAMP:${this.formatDateForICS(new Date())}\r\n`;
            ics += 'END:VEVENT\r\n';
        });
        ics += 'END:VCALENDAR\r\n';
        return ics;
    }
    formatDateForICS(date) {
        const d = new Date(date);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }
    async setEventReminders(eventId, reminders, userId) {
        if (!this.dbAvailable) {
            return null;
        }
        try {
            await this.db.execute('DELETE FROM event_reminders WHERE event_id = $1', [eventId]);
            for (const reminder of reminders) {
                const query = `
                    INSERT INTO event_reminders (event_id, type, minutes_before, created_by)
                    VALUES ($1, $2, $3, $4)
                `;
                await this.db.execute(query, [
                    eventId,
                    reminder.type,
                    reminder.minutes_before,
                    userId
                ]);
            }
            return { success: true, count: reminders.length };
        }
        catch (error) {
            devLogger_1.default.error('[CalendarService] Error configurando recordatorios', error);
            throw error;
        }
    }
}
// Singleton instance
let calendarServiceInstance = null;
function getCalendarService() {
    if (!calendarServiceInstance) {
        calendarServiceInstance = new CalendarService();
    }
    return calendarServiceInstance;
}
exports.default = getCalendarService();
module.exports = getCalendarService();
//# sourceMappingURL=calendar.service.js.map