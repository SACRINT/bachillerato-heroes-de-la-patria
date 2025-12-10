"use strict";
/**
 * 📅 CALENDAR DAO - TypeScript
 * Capa de acceso a datos para Eventos del Calendario.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// CALENDAR DAO CLASS
// =====================================================
class CalendarDAO {
    static async get(id) {
        const query = `SELECT * FROM calendar_events WHERE id = $1`;
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0] || null;
    }
    static async list(filters = {}) {
        let query = `SELECT * FROM calendar_events WHERE 1=1`;
        const params = [];
        if (filters.start_date) {
            params.push(filters.start_date);
            query += ` AND start_date >= $${params.length}`;
        }
        if (filters.end_date) {
            params.push(filters.end_date);
            query += ` AND start_date <= $${params.length}`;
        }
        if (filters.type) {
            params.push(filters.type);
            query += ` AND type = $${params.length}`;
        }
        if (filters.status) {
            params.push(filters.status);
            query += ` AND status = $${params.length}`;
        }
        if (filters.is_public !== undefined) {
            params.push(filters.is_public);
            query += ` AND is_public = $${params.length}`;
        }
        query += ` ORDER BY start_date ASC`;
        if (filters.limit) {
            params.push(filters.limit);
            query += ` LIMIT $${params.length}`;
        }
        const result = await (0, database_1.executeQuery)(query, params);
        return result;
    }
    static async create(data) {
        const query = `
            INSERT INTO calendar_events (
                title, description, start_date, end_date, all_day, 
                location, type, priority, is_public, max_attendees, 
                google_event_id, status, created_by, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        const params = [
            data.title,
            data.description || null,
            data.start_date,
            data.end_date || null,
            data.all_day || false,
            data.location || null,
            data.type,
            data.priority || 'media',
            data.is_public !== undefined ? data.is_public : true,
            data.max_attendees || null,
            data.google_event_id || null,
            data.status || 'programado',
            data.created_by,
            JSON.stringify(data.metadata || {})
        ];
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        const allowedFields = [
            'title', 'description', 'start_date', 'end_date', 'all_day',
            'location', 'type', 'priority', 'is_public', 'max_attendees',
            'status', 'google_event_id', 'metadata', 'updated_by'
        ];
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramCount++}`);
                values.push(field === 'metadata' ? JSON.stringify(data[field]) : data[field]);
            }
        });
        if (fields.length === 0)
            return null;
        values.push(id);
        const query = `
            UPDATE calendar_events
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, values);
        return result[0];
    }
    static async delete(id) {
        const query = `DELETE FROM calendar_events WHERE id = $1`;
        await (0, database_1.executeQuery)(query, [id]);
        return true;
    }
    static async getMonthEvents(year, month) {
        const query = `
            SELECT * FROM calendar_events
            WHERE EXTRACT(YEAR FROM start_date) = $1
              AND EXTRACT(MONTH FROM start_date) = $2
            ORDER BY start_date ASC
        `;
        const result = await (0, database_1.executeQuery)(query, [year, month]);
        return result;
    }
    static async getUpcomingEvents(days = 7, limit = 10) {
        const query = `
            SELECT * FROM calendar_events
            WHERE start_date >= CURRENT_TIMESTAMP
              AND start_date <= CURRENT_TIMESTAMP + INTERVAL '${days} days'
              AND status = 'programado'
            ORDER BY start_date ASC
            LIMIT $1
        `;
        const result = await (0, database_1.executeQuery)(query, [limit]);
        return result;
    }
    static async addAttendee(eventId, userId, status = 'registrado') {
        const query = `
            INSERT INTO event_attendees (event_id, user_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (event_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [eventId, userId, status]);
        return result[0];
    }
    static async getAttendees(eventId) {
        const query = `
            SELECT ea.*, u.nombre, u.apellido_paterno, u.email
            FROM event_attendees ea
            JOIN usuarios u ON ea.user_id = u.id
            WHERE ea.event_id = $1
            ORDER BY ea.registered_at DESC
        `;
        const result = await (0, database_1.executeQuery)(query, [eventId]);
        return result;
    }
    static async updateAttendeeCount(eventId) {
        const query = `
            UPDATE calendar_events
            SET current_attendees = (
                SELECT COUNT(*) FROM event_attendees 
                WHERE event_id = $1
            )
            WHERE id = $1
        `;
        await (0, database_1.executeQuery)(query, [eventId]);
    }
    static async removeAttendee(eventId, userId) {
        const query = `DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`;
        await (0, database_1.executeQuery)(query, [eventId, userId]);
    }
    static async createReminder(data) {
        const query = `
            INSERT INTO event_reminders (event_id, type, minutes_before, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [
            data.event_id,
            data.type,
            data.minutes_before,
            data.created_by
        ]);
        return result[0];
    }
    static async getPendingReminders() {
        const query = `
            SELECT r.*, e.title, e.start_date
            FROM event_reminders r
            JOIN calendar_events e ON r.event_id = e.id
            WHERE r.status = 'pendiente'
              AND e.start_date - INTERVAL '1 minute' * r.minutes_before <= CURRENT_TIMESTAMP
              AND e.start_date >= CURRENT_TIMESTAMP
            ORDER BY e.start_date ASC
        `;
        const result = await (0, database_1.executeQuery)(query);
        return result;
    }
    static async markReminderSent(id) {
        const query = `
            UPDATE event_reminders
            SET status = 'enviado', sent_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        await (0, database_1.executeQuery)(query, [id]);
    }
}
exports.default = CalendarDAO;
module.exports = CalendarDAO;
//# sourceMappingURL=calendar.dao.js.map