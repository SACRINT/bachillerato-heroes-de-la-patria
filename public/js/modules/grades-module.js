/**
 * GRADES MODULE - Módulo de Calificaciones
 * Versión: 1.0.0 | SEMANA 1 - Refactorización
 */
class GradesModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.grades = [];
        this.apiEndpoint = '/api/grades';
        console.log('[GRADES-MODULE] 📊 Grades Module creado');
    }

    async init() {
        this.subscribeToEvents();
        await this.loadGrades();
        console.log('[GRADES-MODULE] ✅ Inicializado');
    }

    subscribeToEvents() {
        this.eventBus.on('dashboard.initialized', () => this.loadGrades());
        this.eventBus.on('grades.load', () => this.loadGrades());
        this.eventBus.on('grades.create', async (e) => await this.createGrade(e.data));
        this.eventBus.on('grades.update', async (e) => await this.updateGrade(e.data.id, e.data.updates));
        this.eventBus.on('grades.delete', async (e) => await this.deleteGrade(e.data.id));
    }

    async loadGrades() {
        try {
            const response = await fetch(this.apiEndpoint, { headers: this.getAuthHeaders() });
            const data = await response.json();
            this.grades = data.grades || data || [];
            this.eventBus.emit('grades.loaded', { grades: this.grades, count: this.grades.length });
            console.log(`[GRADES-MODULE] ✅ ${this.grades.length} calificaciones cargadas`);
        } catch (error) {
            console.error('[GRADES-MODULE] ❌ Error:', error);
            this.eventBus.emit('grades.error', { operation: 'load', error: error.message });
        }
    }

    async createGrade(gradeData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(gradeData)
            });
            const newGrade = await response.json();
            this.grades.push(newGrade);
            this.eventBus.emit('grades.created', { grade: newGrade });
            return newGrade;
        } catch (error) {
            this.eventBus.emit('grades.error', { operation: 'create', error: error.message });
            throw error;
        }
    }

    async updateGrade(id, updates) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            const updated = await response.json();
            const index = this.grades.findIndex(g => g.id === id);
            if (index !== -1) this.grades[index] = updated;
            this.eventBus.emit('grades.updated', { grade: updated });
            return updated;
        } catch (error) {
            this.eventBus.emit('grades.error', { operation: 'update', error: error.message });
            throw error;
        }
    }

    async deleteGrade(id) {
        try {
            await fetch(`${this.apiEndpoint}/${id}`, { method: 'DELETE', headers: this.getAuthHeaders() });
            this.grades = this.grades.filter(g => g.id !== id);
            this.eventBus.emit('grades.deleted', { id });
        } catch (error) {
            this.eventBus.emit('grades.error', { operation: 'delete', error: error.message });
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

    destroy() { this.grades = []; console.log('[GRADES-MODULE] ✅ Destruido'); }
}
window.GradesModule = GradesModule;
