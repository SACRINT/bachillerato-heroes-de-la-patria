/**
 * ATTENDANCE MODULE - Módulo de Asistencia
 * Versión: 1.0.0 | SEMANA 1 - Refactorización
 */
class AttendanceModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.attendance = [];
        this.apiEndpoint = '/api/attendance';
        console.log('[ATTENDANCE-MODULE] 📅 Attendance Module creado');
    }

    async init() {
        this.subscribeToEvents();
        await this.loadAttendance();
        console.log('[ATTENDANCE-MODULE] ✅ Inicializado');
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
            console.log(`[ATTENDANCE-MODULE] ✅ ${this.attendance.length} registros cargados`);
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
        try {
            const session = JSON.parse(localStorage.getItem('secure_admin_session') || '{}');
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
        } catch (e) {}
        return headers;
    }

    destroy() { this.attendance = []; console.log('[ATTENDANCE-MODULE] ✅ Destruido'); }
}
window.AttendanceModule = AttendanceModule;
