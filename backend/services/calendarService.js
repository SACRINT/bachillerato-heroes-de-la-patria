/**
 * 🎯 FASE 2A - CALENDAR SERVICE
 * Servicio de calendario interactivo para BGE
 * Gestión de eventos escolares con integración Google Calendar
 */

const path = require('path');
const fs = require('fs').promises;

class CalendarService {
    constructor() {
        this.dbAvailable = false;
        this.db = null;
        this.jsonPath = path.join(__dirname, '../../data/eventos.json');
        this.googleCalendar = null;
        this.initialize();
    }

    async initialize() {
        try {
            // Intentar conexión con MySQL
            this.db = require('../config/database');
            const isConnected = await this.db.testConnection();

            if (isConnected && typeof this.db.execute === 'function') {
                this.dbAvailable = true;
                console.log('✅ Calendar Service: MySQL disponible');
                await this.ensureTablesExist();
            } else {
                console.log('⚠️ Calendar Service: Fallback a JSON');
                this.dbAvailable = false;
                await this.ensureJsonStructure();
            }
        } catch (error) {
            console.log('⚠️ Calendar Service: Fallback a JSON -', error.message);
            this.dbAvailable = false;
            await this.ensureJsonStructure();
        }

        // Intentar inicializar Google Calendar
        try {
            await this.initializeGoogleCalendar();
        } catch (error) {
            console.log('⚠️ Google Calendar no disponible:', error.message);
        }
    }

    // ============================================
    // INICIALIZACIÓN DE ESTRUCTURAS
    // ============================================

    async ensureTablesExist() {
        try {
            const createEventsTable = `
                CREATE TABLE IF NOT EXISTS calendar_events (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_date DATETIME NOT NULL,
                    end_date DATETIME,
                    all_day BOOLEAN DEFAULT FALSE,
                    location VARCHAR(255),
                    type ENUM('academico', 'administrativo', 'cultural', 'deportivo', 'social', 'emergencia') NOT NULL,
                    priority ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
                    is_public BOOLEAN DEFAULT TRUE,
                    max_attendees INT,
                    current_attendees INT DEFAULT 0,
                    google_event_id VARCHAR(255),
                    status ENUM('programado', 'en_curso', 'completado', 'cancelado') DEFAULT 'programado',
                    created_by INT NOT NULL,
                    updated_by INT,
                    metadata JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    INDEX idx_start_date (start_date),
                    INDEX idx_type (type),
                    INDEX idx_status (status),
                    INDEX idx_is_public (is_public),
                    INDEX idx_created_by (created_by)
                )
            `;

            await this.db.execute(createEventsTable);
            console.log('✅ Calendar Service: Tabla calendar_events verificada');

            // Crear tabla de asistentes
            const createAttendeesTable = `
                CREATE TABLE IF NOT EXISTS event_attendees (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    event_id INT NOT NULL,
                    user_id INT NOT NULL,
                    status ENUM('registrado', 'confirmado', 'presente', 'ausente') DEFAULT 'registrado',
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_attendance (event_id, user_id),
                    INDEX idx_event_id (event_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_status (status)
                )
            `;

            await this.db.execute(createAttendeesTable);
            console.log('✅ Calendar Service: Tabla event_attendees verificada');

            // Crear tabla de recordatorios
            const createRemindersTable = `
                CREATE TABLE IF NOT EXISTS event_reminders (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    event_id INT NOT NULL,
                    type ENUM('email', 'push', 'sms') NOT NULL,
                    minutes_before INT NOT NULL,
                    status ENUM('pendiente', 'enviado', 'error') DEFAULT 'pendiente',
                    sent_at TIMESTAMP NULL,
                    created_by INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
                    INDEX idx_event_id (event_id),
                    INDEX idx_status (status),
                    INDEX idx_minutes_before (minutes_before)
                )
            `;

            await this.db.execute(createRemindersTable);
            console.log('✅ Calendar Service: Tabla event_reminders verificada');

        } catch (error) {
            console.error('Error creando tablas Calendar:', error);
            throw error;
        }
    }

    async ensureJsonStructure() {
        try {
            const jsonDir = path.dirname(this.jsonPath);
            await fs.access(jsonDir);
        } catch {
            await fs.mkdir(jsonDir, { recursive: true });
        }

        try {
            await fs.access(this.jsonPath);
        } catch {
            const initialData = {
                eventos: [],
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };
            await fs.writeFile(this.jsonPath, JSON.stringify(initialData, null, 2));
            console.log('✅ Creado: eventos.json');
        }
    }

    async initializeGoogleCalendar() {
        // Placeholder para integración Google Calendar
        // En implementación real, aquí iría la configuración de Google Calendar API
        console.log('📅 Google Calendar: Configuración pendiente');
    }

    // ============================================
    // OPERACIONES CRUD DE EVENTOS
    // ============================================

    async getEvents(filters = {}) {
        if (this.dbAvailable) {
            return this.getEventsFromDB(filters);
        } else {
            return this.getEventsFromJSON(filters);
        }
    }

    async getEventsFromDB(filters) {
        try {
            let query = `
                SELECT
                    e.id, e.title, e.description, e.start_date, e.end_date,
                    e.all_day, e.location, e.type, e.priority, e.is_public,
                    e.max_attendees, e.current_attendees, e.status,
                    e.created_by, e.created_at, e.updated_at, e.metadata
                FROM calendar_events e
                WHERE 1=1
            `;
            const params = [];

            // Filtro por rango de fechas
            if (filters.start_date) {
                query += ' AND e.start_date >= ?';
                params.push(filters.start_date);
            }

            if (filters.end_date) {
                query += ' AND e.start_date <= ?';
                params.push(filters.end_date);
            }

            // Filtro por tipo
            if (filters.type) {
                query += ' AND e.type = ?';
                params.push(filters.type);
            }

            // Solo eventos públicos por defecto
            if (filters.include_private !== true) {
                query += ' AND e.is_public = TRUE';
            }

            // Solo eventos activos
            query += ' AND e.status != "cancelado"';

            // Ordenar por fecha de inicio
            query += ' ORDER BY e.start_date ASC, e.created_at ASC';

            // Paginación
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(filters.offset);
            }

            const [events] = await this.db.execute(query, params);

            // Contar total
            let countQuery = 'SELECT COUNT(*) as total FROM calendar_events e WHERE 1=1';
            const countParams = [];

            if (filters.start_date) {
                countQuery += ' AND e.start_date >= ?';
                countParams.push(filters.start_date);
            }

            if (filters.end_date) {
                countQuery += ' AND e.start_date <= ?';
                countParams.push(filters.end_date);
            }

            if (filters.type) {
                countQuery += ' AND e.type = ?';
                countParams.push(filters.type);
            }

            if (filters.include_private !== true) {
                countQuery += ' AND e.is_public = TRUE';
            }

            countQuery += ' AND e.status != "cancelado"';

            const [countResult] = await this.db.execute(countQuery, countParams);
            const total = countResult[0].total;

            // Procesar metadata JSON
            const processedEvents = events.map(event => ({
                ...event,
                metadata: event.metadata ? JSON.parse(event.metadata) : null
            }));

            return { events: processedEvents, total };

        } catch (error) {
            console.error('Error obteniendo eventos de DB:', error);
            throw error;
        }
    }

    async getEventsFromJSON(filters) {
        try {
            const fileContent = await fs.readFile(this.jsonPath, 'utf-8');
            const data = JSON.parse(fileContent);
            let events = data.eventos || [];

            // Aplicar filtros
            if (filters.start_date || filters.end_date) {
                const startFilter = filters.start_date ? new Date(filters.start_date) : new Date('1970-01-01');
                const endFilter = filters.end_date ? new Date(filters.end_date) : new Date('2099-12-31');

                events = events.filter(event => {
                    const eventDate = new Date(event.fecha || event.start_date);
                    return eventDate >= startFilter && eventDate <= endFilter;
                });
            }

            if (filters.type) {
                events = events.filter(event => event.type === filters.type || event.tipo === filters.type);
            }

            // Normalizar formato
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
                created_at: event.created_at || event.fecha || new Date().toISOString()
            }));

            // Ordenar por fecha
            processedEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            // Paginación
            const total = processedEvents.length;
            const offset = filters.offset || 0;
            const limit = filters.limit || total;

            const paginatedEvents = processedEvents.slice(offset, offset + limit);

            return { events: paginatedEvents, total };

        } catch (error) {
            console.error('Error obteniendo eventos de JSON:', error);
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
                    WHERE id = ?
                `;

                const [rows] = await this.db.execute(query, [id]);

                if (rows.length === 0) return null;

                const event = rows[0];
                event.metadata = event.metadata ? JSON.parse(event.metadata) : null;

                return event;

            } catch (error) {
                console.error('Error obteniendo evento por ID:', error);
                throw error;
            }
        } else {
            const result = await this.getEvents({});
            return result.events.find(event => event.id.toString() === id.toString());
        }
    }

    async createEvent(eventData) {
        if (this.dbAvailable) {
            return this.createEventInDB(eventData);
        } else {
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                eventData.metadata || null
            ];

            const [result] = await this.db.execute(query, params);

            return this.getEventById(result.insertId);

        } catch (error) {
            console.error('Error creando evento en DB:', error);
            throw error;
        }
    }

    async createEventInJSON(eventData) {
        try {
            const fileContent = await fs.readFile(this.jsonPath, 'utf-8');
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

            await fs.writeFile(this.jsonPath, JSON.stringify(data, null, 2));

            // Retornar en formato estándar
            return {
                id: newId,
                title: eventData.title,
                description: eventData.description,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                all_day: eventData.all_day || false,
                location: eventData.location,
                type: eventData.type,
                priority: eventData.priority || 'media',
                is_public: true,
                status: 'programado',
                created_by: eventData.created_by,
                created_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error creando evento en JSON:', error);
            throw error;
        }
    }

    async updateEvent(id, updateData) {
        if (this.dbAvailable) {
            return this.updateEventInDB(id, updateData);
        } else {
            return this.updateEventInJSON(id, updateData);
        }
    }

    async updateEventInDB(id, updateData) {
        try {
            const fields = [];
            const params = [];

            const allowedFields = [
                'title', 'description', 'start_date', 'end_date', 'all_day',
                'location', 'type', 'priority', 'is_public', 'max_attendees',
                'status', 'metadata', 'updated_by'
            ];

            allowedFields.forEach(field => {
                if (updateData.hasOwnProperty(field)) {
                    fields.push(`${field} = ?`);
                    params.push(updateData[field]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            fields.push('updated_at = NOW()');

            const query = `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`;
            params.push(id);

            const [result] = await this.db.execute(query, params);

            if (result.affectedRows === 0) {
                return null;
            }

            return this.getEventById(id);

        } catch (error) {
            console.error('Error actualizando evento en DB:', error);
            throw error;
        }
    }

    async updateEventInJSON(id, updateData) {
        console.warn('Actualización de eventos JSON no implementada completamente');
        return null;
    }

    async deleteEvent(id, userId) {
        if (this.dbAvailable) {
            try {
                // Soft delete - marcar como cancelado
                const query = `
                    UPDATE calendar_events
                    SET status = 'cancelado', updated_by = ?, updated_at = NOW()
                    WHERE id = ?
                `;

                const [result] = await this.db.execute(query, [userId, id]);
                return result.affectedRows > 0;

            } catch (error) {
                console.error('Error eliminando evento:', error);
                throw error;
            }
        } else {
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
            // Verificar que el evento existe y permite asistentes
            const event = await this.getEventById(eventId);
            if (!event) {
                return { success: false, message: 'Evento no encontrado' };
            }

            if (event.max_attendees && event.current_attendees >= event.max_attendees) {
                return { success: false, message: 'Evento lleno' };
            }

            // Registrar asistencia
            const insertQuery = `
                INSERT INTO event_attendees (event_id, user_id, status)
                VALUES (?, ?, 'registrado')
                ON DUPLICATE KEY UPDATE status = 'registrado', updated_at = NOW()
            `;

            await this.db.execute(insertQuery, [eventId, userId]);

            // Actualizar contador de asistentes
            const updateQuery = `
                UPDATE calendar_events
                SET current_attendees = (
                    SELECT COUNT(*) FROM event_attendees
                    WHERE event_id = ? AND status != 'ausente'
                )
                WHERE id = ?
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

        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Ya estás registrado en este evento' };
            }
            console.error('Error registrando asistencia:', error);
            throw error;
        }
    }

    async getEventAttendees(eventId) {
        if (!this.dbAvailable) {
            return [];
        }

        try {
            const query = `
                SELECT
                    ea.user_id, ea.status, ea.registered_at, ea.updated_at
                FROM event_attendees ea
                WHERE ea.event_id = ?
                ORDER BY ea.registered_at ASC
            `;

            const [attendees] = await this.db.execute(query, [eventId]);
            return attendees;

        } catch (error) {
            console.error('Error obteniendo asistentes:', error);
            throw error;
        }
    }

    // ============================================
    // INTEGRACIÓN GOOGLE CALENDAR
    // ============================================

    async syncWithGoogleCalendar(event) {
        // Placeholder para sincronización con Google Calendar
        console.log('📅 Sincronización Google Calendar pendiente para evento:', event.id);
        return { synced: false, message: 'Google Calendar no configurado' };
    }

    async syncAllWithGoogle(options = {}) {
        console.log('📅 Sincronización masiva Google Calendar pendiente');
        return {
            eventsSynced: 0,
            eventsCreated: 0,
            eventsUpdated: 0
        };
    }

    async getGoogleAuthUrl() {
        throw new Error('Google Calendar no configurado');
    }

    // ============================================
    // ESTADÍSTICAS Y EXPORTACIÓN
    // ============================================

    async getCalendarStats(period = 'month') {
        if (!this.dbAvailable) {
            return { message: 'Estadísticas no disponibles sin base de datos' };
        }

        try {
            const periodQuery = period === 'month' ? 'MONTH' : 'WEEK';

            const statsQuery = `
                SELECT
                    type,
                    status,
                    COUNT(*) as count
                FROM calendar_events
                WHERE start_date >= DATE_SUB(NOW(), INTERVAL 1 ${periodQuery})
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
                WHERE start_date >= DATE_SUB(NOW(), INTERVAL 1 ${periodQuery})
            `;

            const [totals] = await this.db.execute(totalQuery);

            return {
                period: period,
                detailed: stats,
                summary: totals[0],
                last_updated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
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
            // Eliminar recordatorios existentes
            await this.db.execute('DELETE FROM event_reminders WHERE event_id = ?', [eventId]);

            // Insertar nuevos recordatorios
            for (const reminder of reminders) {
                const query = `
                    INSERT INTO event_reminders (event_id, type, minutes_before, created_by)
                    VALUES (?, ?, ?, ?)
                `;

                await this.db.execute(query, [
                    eventId,
                    reminder.type,
                    reminder.minutes_before,
                    userId
                ]);
            }

            return { success: true, count: reminders.length };

        } catch (error) {
            console.error('Error configurando recordatorios:', error);
            throw error;
        }
    }
}

// Singleton instance
let calendarServiceInstance = null;

const getCalendarService = () => {
    if (!calendarServiceInstance) {
        calendarServiceInstance = new CalendarService();
    }
    return calendarServiceInstance;
};

module.exports = getCalendarService();