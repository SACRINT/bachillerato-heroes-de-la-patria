/**
 * 🎯 CALENDAR SERVICE - TypeScript
 * Servicio de calendario interactivo para BGE
 * Gestión de eventos escolares con integración Google Calendar
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface CalendarEvent {
    id: number | string;
    title: string;
    description?: string;
    start_date: Date | string;
    end_date?: Date | string;
    all_day: boolean;
    location?: string;
    type: 'academico' | 'administrativo' | 'cultural' | 'deportivo' | 'social' | 'emergencia';
    priority: 'baja' | 'media' | 'alta' | 'urgente';
    is_public: boolean;
    max_attendees?: number;
    current_attendees?: number;
    google_event_id?: string;
    status: 'programado' | 'en_curso' | 'completado' | 'cancelado';
    created_by: number;
    updated_by?: number;
    metadata?: any;
    created_at: Date | string;
    updated_at?: Date | string;
}
export interface EventFilters {
    start_date?: Date | string;
    end_date?: Date | string;
    type?: string;
    include_private?: boolean;
    limit?: number;
    offset?: number;
    is_public?: boolean;
}
export interface EventCreateData {
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
    created_by: number;
    metadata?: any;
}
export interface EventUpdateData {
    title?: string;
    description?: string;
    start_date?: Date | string;
    end_date?: Date | string;
    all_day?: boolean;
    location?: string;
    type?: string;
    priority?: string;
    is_public?: boolean;
    max_attendees?: number;
    status?: string;
    metadata?: any;
    updated_by?: number;
}
export interface EventsResult {
    events: CalendarEvent[];
    total: number;
}
export interface AttendanceRegistration {
    success: boolean;
    message?: string;
    attendance?: {
        event_id: number | string;
        user_id: number;
        status: string;
        registered_at: string;
    };
}
export interface Attendee {
    user_id: number;
    status: string;
    registered_at: Date | string;
    updated_at?: Date | string;
}
export interface Reminder {
    type: 'email' | 'push' | 'sms';
    minutes_before: number;
}
export interface CalendarStats {
    period: string;
    detailed?: any[];
    summary?: any;
    last_updated: string;
    message?: string;
}
declare class CalendarService {
    private dbAvailable;
    private db;
    private jsonPath;
    private googleCalendar;
    constructor();
    initialize(): Promise<void>;
    private ensureTablesExist;
    private ensureJsonStructure;
    private initializeGoogleCalendar;
    getEvents(filters?: EventFilters): Promise<EventsResult>;
    private getEventsFromDB;
    private getEventsFromJSON;
    getEventById(id: number | string): Promise<CalendarEvent | null>;
    createEvent(eventData: EventCreateData): Promise<CalendarEvent>;
    private createEventInDB;
    private createEventInJSON;
    updateEvent(id: number | string, updateData: EventUpdateData): Promise<CalendarEvent | null>;
    private updateEventInDB;
    deleteEvent(id: number | string, userId: number): Promise<boolean>;
    getUpcomingEvents(options?: {
        limit?: number;
        type?: string;
        is_public?: boolean;
    }): Promise<CalendarEvent[]>;
    getTodayEvents(): Promise<CalendarEvent[]>;
    registerAttendance(eventId: number | string, userId: number): Promise<AttendanceRegistration>;
    getEventAttendees(eventId: number | string): Promise<Attendee[]>;
    syncWithGoogleCalendar(event: CalendarEvent): Promise<{
        synced: boolean;
        message: string;
    }>;
    syncAllWithGoogle(): Promise<{
        eventsSynced: number;
        eventsCreated: number;
        eventsUpdated: number;
    }>;
    getGoogleAuthUrl(): never;
    getCalendarStats(period?: string): Promise<CalendarStats>;
    exportToICS(options?: EventFilters): Promise<string>;
    private formatDateForICS;
    setEventReminders(eventId: number | string, reminders: Reminder[], userId: number): Promise<{
        success: boolean;
        count: number;
    } | null>;
}
export declare function getCalendarService(): CalendarService;
declare const _default: CalendarService;
export default _default;
//# sourceMappingURL=calendar.service.d.ts.map