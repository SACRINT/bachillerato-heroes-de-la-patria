/**
 * 📅 CALENDAR DAO - TypeScript
 * Capa de acceso a datos para Eventos del Calendario.
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface CalendarEventRow {
    id: number;
    title: string;
    description?: string;
    start_date: Date;
    end_date?: Date;
    all_day: boolean;
    location?: string;
    type: string;
    priority: string;
    is_public: boolean;
    max_attendees?: number;
    current_attendees?: number;
    google_event_id?: string;
    status: 'programado' | 'en_curso' | 'completado' | 'cancelado';
    created_by: number;
    updated_by?: number;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at?: Date;
}

export interface CalendarEventCreateData {
    title: string;
    description?: string;
    start_date: Date | string;
    end_date?: Date | string;
    all_day?: boolean;
    location?: string;
    type: string;
    priority?: string;
    is_public?: boolean;
    max_attendees?: number;
    google_event_id?: string;
    status?: string;
    created_by: number;
    metadata?: Record<string, any>;
}

export interface CalendarEventFilters {
    start_date?: Date | string;
    end_date?: Date | string;
    type?: string;
    status?: string;
    is_public?: boolean;
    limit?: number;
}

export interface EventAttendee {
    id: number;
    event_id: number;
    user_id: number;
    status: string;
    nombre?: string;
    apellido_paterno?: string;
    email?: string;
    registered_at: Date;
    updated_at?: Date;
}

export interface EventReminder {
    id: number;
    event_id: number;
    type: string;
    minutes_before: number;
    status: 'pendiente' | 'enviado';
    created_by: number;
    sent_at?: Date;
    title?: string;
    start_date?: Date;
}

// =====================================================
// CALENDAR DAO CLASS
// =====================================================

class CalendarDAO {

    static async get(id: number): Promise<CalendarEventRow | null> {
        const query = `SELECT * FROM calendar_events WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    static async list(filters: CalendarEventFilters = {}): Promise<CalendarEventRow[]> {
        let query = `SELECT * FROM calendar_events WHERE 1=1`;
        const params: (string | number | boolean | Date)[] = [];

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

        const result = await executeQuery(query, params);
        return result;
    }

    static async create(data: CalendarEventCreateData): Promise<CalendarEventRow> {
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
        const result = await executeQuery(query, params);
        return result[0];
    }

    static async update(id: number, data: Partial<CalendarEventCreateData> & { updated_by?: number }): Promise<CalendarEventRow | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        const allowedFields = [
            'title', 'description', 'start_date', 'end_date', 'all_day',
            'location', 'type', 'priority', 'is_public', 'max_attendees',
            'status', 'google_event_id', 'metadata', 'updated_by'
        ];

        allowedFields.forEach(field => {
            if ((data as any)[field] !== undefined) {
                fields.push(`${field} = $${paramCount++}`);
                values.push(field === 'metadata' ? JSON.stringify((data as any)[field]) : (data as any)[field]);
            }
        });

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE calendar_events
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await executeQuery(query, values);
        return result[0];
    }

    static async delete(id: number): Promise<boolean> {
        const query = `DELETE FROM calendar_events WHERE id = $1`;
        await executeQuery(query, [id]);
        return true;
    }

    static async getMonthEvents(year: number, month: number): Promise<CalendarEventRow[]> {
        const query = `
            SELECT * FROM calendar_events
            WHERE EXTRACT(YEAR FROM start_date) = $1
              AND EXTRACT(MONTH FROM start_date) = $2
            ORDER BY start_date ASC
        `;
        const result = await executeQuery(query, [year, month]);
        return result;
    }

    static async getUpcomingEvents(days: number = 7, limit: number = 10): Promise<CalendarEventRow[]> {
        const query = `
            SELECT * FROM calendar_events
            WHERE start_date >= CURRENT_TIMESTAMP
              AND start_date <= CURRENT_TIMESTAMP + INTERVAL '${days} days'
              AND status = 'programado'
            ORDER BY start_date ASC
            LIMIT $1
        `;
        const result = await executeQuery(query, [limit]);
        return result;
    }

    static async addAttendee(eventId: number, userId: number, status: string = 'registrado'): Promise<EventAttendee> {
        const query = `
            INSERT INTO event_attendees (event_id, user_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (event_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await executeQuery(query, [eventId, userId, status]);
        return result[0];
    }

    static async getAttendees(eventId: number): Promise<EventAttendee[]> {
        const query = `
            SELECT ea.*, u.nombre, u.apellido_paterno, u.email
            FROM event_attendees ea
            JOIN usuarios u ON ea.user_id = u.id
            WHERE ea.event_id = $1
            ORDER BY ea.registered_at DESC
        `;
        const result = await executeQuery(query, [eventId]);
        return result;
    }

    static async updateAttendeeCount(eventId: number): Promise<void> {
        const query = `
            UPDATE calendar_events
            SET current_attendees = (
                SELECT COUNT(*) FROM event_attendees 
                WHERE event_id = $1
            )
            WHERE id = $1
        `;
        await executeQuery(query, [eventId]);
    }

    static async removeAttendee(eventId: number, userId: number): Promise<void> {
        const query = `DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`;
        await executeQuery(query, [eventId, userId]);
    }

    static async createReminder(data: { event_id: number; type: string; minutes_before: number; created_by: number }): Promise<EventReminder> {
        const query = `
            INSERT INTO event_reminders (event_id, type, minutes_before, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await executeQuery(query, [
            data.event_id,
            data.type,
            data.minutes_before,
            data.created_by
        ]);
        return result[0];
    }

    static async getPendingReminders(): Promise<EventReminder[]> {
        const query = `
            SELECT r.*, e.title, e.start_date
            FROM event_reminders r
            JOIN calendar_events e ON r.event_id = e.id
            WHERE r.status = 'pendiente'
              AND e.start_date - INTERVAL '1 minute' * r.minutes_before <= CURRENT_TIMESTAMP
              AND e.start_date >= CURRENT_TIMESTAMP
            ORDER BY e.start_date ASC
        `;
        const result = await executeQuery(query);
        return result;
    }

    static async markReminderSent(id: number): Promise<void> {
        const query = `
            UPDATE event_reminders
            SET status = 'enviado', sent_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        await executeQuery(query, [id]);
    }
}

export default CalendarDAO;
module.exports = CalendarDAO;
