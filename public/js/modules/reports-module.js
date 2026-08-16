/**
 * REPORTS MODULE - Módulo de Reportes
 * Versión: 1.0.0 | SEMANA 1 - Refactorización
 */
class ReportsModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.reports = [];
        this.apiEndpoint = '/api/reports';
        console.log('[REPORTS-MODULE] 📈 Reports Module creado');
    }

    async init() {
        this.subscribeToEvents();
        console.log('[REPORTS-MODULE] ✅ Inicializado');
    }

    subscribeToEvents() {
        this.eventBus.on('reports.generate', async (e) => await this.generateReport(e.data));
        this.eventBus.on('reports.export', async (e) => await this.exportReport(e.data));
    }

    async generateReport(reportConfig) {
        try {
            console.log('[REPORTS-MODULE] 📊 Generando reporte:', reportConfig.type);
            const response = await fetch(`${this.apiEndpoint}/generate`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(reportConfig)
            });
            const report = await response.json();
            this.reports.push(report);
            this.eventBus.emit('reports.generated', { report });
            return report;
        } catch (error) {
            console.error('[REPORTS-MODULE] ❌ Error:', error);
            this.eventBus.emit('reports.error', { operation: 'generate', error: error.message });
            throw error;
        }
    }

    async exportReport(exportConfig) {
        try {
            console.log('[REPORTS-MODULE] 📥 Exportando reporte:', exportConfig.format);
            const response = await fetch(`${this.apiEndpoint}/export`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(exportConfig)
            });
            const blob = await response.blob();
            this.downloadBlob(blob, exportConfig.filename || 'reporte.pdf');
            this.eventBus.emit('reports.exported', { format: exportConfig.format });
        } catch (error) {
            console.error('[REPORTS-MODULE] ❌ Error:', error);
            this.eventBus.emit('reports.error', { operation: 'export', error: error.message });
            throw error;
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    destroy() { this.reports = []; console.log('[REPORTS-MODULE] ✅ Destruido'); }
}
window.ReportsModule = ReportsModule;
