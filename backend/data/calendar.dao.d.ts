/**
 * 📅 CALENDAR DAO - TypeScript
 * Capa de acceso a datos para Eventos del Calendario.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
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
declare class CalendarDAO {
    static get(id: number): Promise<CalendarEventRow | null>;
    static list(filters?: CalendarEventFilters): Promise<CalendarEventRow[]>;
    static create(data: CalendarEventCreateData): Promise<CalendarEventRow>;
    static update(id: number, data: Partial<CalendarEventCreateData> & {
        updated_by?: number;
    }): Promise<CalendarEventRow | null>;
    static delete(id: number): Promise<boolean>;
    static getMonthEvents(year: number, month: number): Promise<CalendarEventRow[]>;
    static getUpcomingEvents(days?: number, limit?: number): Promise<CalendarEventRow[]>;
    static addAttendee(eventId: number, userId: number, status?: string): Promise<EventAttendee>;
    static getAttendees(eventId: number): Promise<EventAttendee[]>;
    static updateAttendeeCount(eventId: number): Promise<void>;
    static removeAttendee(eventId: number, userId: number): Promise<void>;
    static createReminder(data: {
        event_id: number;
        type: string;
        minutes_before: number;
        created_by: number;
    }): Promise<EventReminder>;
    static getPendingReminders(): Promise<EventReminder[]>;
    static markReminderSent(id: number): Promise<void>;
}
export default CalendarDAO;
//# sourceMappingURL=calendar.dao.d.ts.map