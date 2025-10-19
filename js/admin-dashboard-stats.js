/**
 * ADMIN DASHBOARD STATS LOADER
 * Carga estadísticas reales de las APIs y actualiza la UI del dashboard
 * Fecha: 18 de Octubre, 2025
 */

class AdminDashboardStats {
    constructor() {
        this.apiBase = '/api/';
        this.refreshInterval = 30000; // 30 segundos
        this.autoRefresh = false;
    }

    async init() {
        console.log('📊 [STATS] Inicializando carga de estadísticas...');
        await this.loadAllStats();

        // Auto-refresh opcional
        if (this.autoRefresh) {
            setInterval(() => this.loadAllStats(), this.refreshInterval);
        }
    }

    async fetchAPI(endpoint) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`❌ [STATS] Error en ${endpoint}:`, error);
            return null;
        }
    }

    async loadAllStats() {
        console.log('🔄 [STATS] Cargando estadísticas del dashboard...');

        // Cargar en paralelo
        await Promise.all([
            this.loadCMSStats(),
            this.loadEgresadosStats(),
            this.loadBolsaTrabajoStats(),
            this.loadSuscriptoresStats()
        ]);

        console.log('✅ [STATS] Estadísticas cargadas');
    }

    async loadCMSStats() {
        try {
            // Cargar estadísticas del CMS
            const [noticias, eventos, avisos, comunicados] = await Promise.all([
                this.fetchAPI('noticias/stats'),
                this.fetchAPI('eventos/stats'),
                this.fetchAPI('avisos/stats'),
                this.fetchAPI('comunicados/stats')
            ]);

            // Actualizar contadores en la UI si existen
            if (noticias?.data) {
                this.updateElement('stats-noticias-total', noticias.data.total || 0);
                this.updateElement('stats-noticias-publicadas', noticias.data.publicadas || 0);
            }

            if (eventos?.data) {
                this.updateElement('stats-eventos-total', eventos.data.total || 0);
                this.updateElement('stats-eventos-publicados', eventos.data.publicadas || 0);
            }

            if (avisos?.data) {
                this.updateElement('stats-avisos-total', avisos.data.total || 0);
            }

            if (comunicados?.data) {
                this.updateElement('stats-comunicados-total', comunicados.data.total || 0);
            }

            console.log('📰 [STATS] Estadísticas CMS actualizadas');
        } catch (error) {
            console.error('❌ [STATS] Error cargando CMS stats:', error);
        }
    }

    async loadEgresadosStats() {
        try {
            const result = await this.fetchAPI('egresados/stats');

            if (result?.data) {
                const stats = result.data;
                this.updateElement('stats-total', stats.total || 0);
                this.updateElement('stats-titulados', stats.titulados || 0);
                this.updateElement('stats-estudiando', stats.estudiando || 0);
                this.updateElement('stats-historias', stats.historias_publicables || 0);

                // Calcular porcentajes
                if (stats.total > 0) {
                    this.updateElement('porcentaje-titulados', `${((stats.titulados / stats.total) * 100).toFixed(1)}%`);
                    this.updateElement('porcentaje-estudiando', `${((stats.estudiando / stats.total) * 100).toFixed(1)}%`);
                    this.updateElement('porcentaje-historias', `${((stats.historias_publicables / stats.total) * 100).toFixed(1)}%`);
                }

                console.log('🎓 [STATS] Estadísticas Egresados actualizadas');
            }
        } catch (error) {
            console.error('❌ [STATS] Error cargando Egresados stats:', error);
        }
    }

    async loadBolsaTrabajoStats() {
        try {
            const result = await this.fetchAPI('bolsa-trabajo/stats');

            if (result?.data) {
                const stats = result.data;
                this.updateElement('stats-total-bolsa', stats.total || 0);
                this.updateElement('stats-nuevos-bolsa', stats.nuevos_7dias || 0);
                this.updateElement('stats-revisados-bolsa', stats.revisados || 0);
                this.updateElement('stats-contratados-bolsa', stats.contratados || 0);

                // Calcular porcentajes
                if (stats.total > 0) {
                    this.updateElement('porcentaje-nuevos-bolsa', `${((stats.nuevos_7dias / stats.total) * 100).toFixed(1)}%`);
                    this.updateElement('porcentaje-revisados-bolsa', `${((stats.revisados / stats.total) * 100).toFixed(1)}%`);
                    this.updateElement('porcentaje-contratados-bolsa', `${((stats.contratados / stats.total) * 100).toFixed(1)}%`);
                }

                console.log('💼 [STATS] Estadísticas Bolsa de Trabajo actualizadas');
            }
        } catch (error) {
            console.error('❌ [STATS] Error cargando Bolsa de Trabajo stats:', error);
        }
    }

    async loadSuscriptoresStats() {
        try {
            const result = await this.fetchAPI('subscriptions/stats');

            if (result?.data) {
                const stats = result.data;
                this.updateElement('stats-total-suscriptores', stats.total || 0);
                this.updateElement('stats-activos-suscriptores', stats.activos || 0);
                this.updateElement('stats-verificados-suscriptores', stats.verificados || 0);
                this.updateElement('stats-nuevos-suscriptores', stats.nuevos_30dias || 0);

                // Calcular porcentajes
                if (stats.total > 0) {
                    this.updateElement('porcentaje-activos-suscriptores', `${((stats.activos / stats.total) * 100).toFixed(1)}%`);
                    this.updateElement('porcentaje-verificados-suscriptores', `${((stats.verificados / stats.total) * 100).toFixed(1)}%`);
                    this.updateElement('porcentaje-nuevos-suscriptores', `${((stats.nuevos_30dias / stats.total) * 100).toFixed(1)}%`);
                }

                console.log('📧 [STATS] Estadísticas Suscriptores actualizadas');
            }
        } catch (error) {
            console.error('❌ [STATS] Error cargando Suscriptores stats:', error);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Método para refrescar manualmente
    async refresh() {
        await this.loadAllStats();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminDashboardStats = new AdminDashboardStats();
        window.adminDashboardStats.init();
    });
} else {
    window.adminDashboardStats = new AdminDashboardStats();
    window.adminDashboardStats.init();
}
