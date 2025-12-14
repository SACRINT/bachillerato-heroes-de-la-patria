/**
 * SETTINGS MODULE - Módulo de Configuración
 * Versión: 1.0.0 | SEMANA 1 - Refactorización
 */
class SettingsModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.settings = {};
        this.apiEndpoint = '/api/settings';
        console.log('[SETTINGS-MODULE] ⚙️  Settings Module creado');
    }

    async init() {
        this.subscribeToEvents();
        await this.loadSettings();
        console.log('[SETTINGS-MODULE] ✅ Inicializado');
    }

    subscribeToEvents() {
        this.eventBus.on('dashboard.initialized', () => this.loadSettings());
        this.eventBus.on('settings.load', () => this.loadSettings());
        this.eventBus.on('settings.update', async (e) => await this.updateSettings(e.data));
    }

    async loadSettings() {
        try {
            const response = await fetch(this.apiEndpoint, { headers: this.getAuthHeaders() });
            const data = await response.json();
            this.settings = data.settings || data || {};
            this.eventBus.emit('settings.loaded', { settings: this.settings });
            console.log('[SETTINGS-MODULE] ✅ Configuración cargada');
        } catch (error) {
            console.error('[SETTINGS-MODULE] ❌ Error:', error);
            this.eventBus.emit('settings.error', { operation: 'load', error: error.message });
        }
    }

    async updateSettings(updates) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            const updated = await response.json();
            this.settings = { ...this.settings, ...updated };
            this.eventBus.emit('settings.updated', { settings: this.settings });
            console.log('[SETTINGS-MODULE] ✅ Configuración actualizada');
            return this.settings;
        } catch (error) {
            console.error('[SETTINGS-MODULE] ❌ Error:', error);
            this.eventBus.emit('settings.error', { operation: 'update', error: error.message });
            throw error;
        }
    }

    getSetting(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        try {
            const session = JSON.parse(localStorage.getItem('secure_admin_session') || '{}');
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
        } catch (e) {}
        return headers;
    }

    destroy() { this.settings = {}; console.log('[SETTINGS-MODULE] ✅ Destruido'); }
}
window.SettingsModule = SettingsModule;
