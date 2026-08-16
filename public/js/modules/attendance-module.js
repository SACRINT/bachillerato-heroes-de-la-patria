/**
 * ATTENDANCE MODULE - Módulo de Asistencia
 * Versión: 1.0.0 | SEMANA 1 - Refactorización
 */
class AttendanceModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.attendance = [];
        this.apiEndpoint = '/api/attendance';
        void 0;
    }

    async init() {
        this.subscribeToEvents();
        await this.loadAttendance();
        void 0;
    }

    subscribeToEvents() {
        this.eventBus.on('dashboard.initialized', () => this.loadAttendance());
        this.eventBus.on('attendance.load', () => this.loadAttendance());
        this.eventBus.on('attendance.record', async (e) => await this.recordAttendance(e.data));
    }

    async loadAttendance() {
        try {
            const response = await fetch(this.apiEndpoint, { headers: this.getAuthHeaders() });
            const data = await response.json();
            this.attendance = data.attendance || data || [];
            this.eventBus.emit('attendance.loaded', { attendance: this.attendance });
            void 0;
        } catch (error) {
            console.error('[ATTENDANCE-MODULE] ❌ Error:', error);
            this.eventBus.emit('attendance.error', { operation: 'load', error: error.message });
        }
    }

    async recordAttendance(attendanceData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(attendanceData)
            });
            const record = await response.json();
            this.attendance.push(record);
            this.eventBus.emit('attendance.recorded', { record });
            return record;
        } catch (error) {
            this.eventBus.emit('attendance.error', { operation: 'record', error: error.message });
            throw error;
        }
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('bge_auth_token') || 
                      sessionStorage.getItem('bge_auth_token') || 
                      localStorage.getItem('authToken') || 
                      sessionStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            return headers;
        }
        try {
            const session = JSON.parse(localStorage.getItem('secure_admin_session') || '{}');
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
        } catch (e) {}
        return headers;
    }

    destroy() { this.attendance = []; void 0; }
}
window.AttendanceModule = AttendanceModule;
