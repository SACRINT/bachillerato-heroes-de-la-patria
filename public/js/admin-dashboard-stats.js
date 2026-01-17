/**
 * ADMIN DASHBOARD STATS LOADER (OPTIMIZED)
 * Carga estadísticas consolidadas en una sola petición para evitar 429 Errors y sobrecarga del servidor.
 * Reemplaza a stats-counter.js y múltiples llamadas individuales.
 * 
 * Fecha: 12 de Enero, 2026
 * Autor: Agente AI (Optimización Arquitectura)
 */

class AdminDashboardStats {
    constructor() {
        this.apiEndpoint = '/api/admin/dashboard-summary';
        this.refreshInterval = 60000; // 60 segundos (reducido de 30s)
        this.autoRefresh = true;

        // Elementos UI mapeados (ID del DOM -> Ruta en el JSON de respuesta)
        this.elements = {
            // CMS - Noticias
            'stats-noticias-total': 'cms.noticias.total',
            'stats-noticias-publicadas': 'cms.noticias.publicadas',

            // CMS - Eventos
            'stats-eventos-total': 'cms.eventos.total',
            'stats-eventos-publicados': 'cms.eventos.publicadas',

            // CMS - Avisos
            'stats-avisos-total': 'cms.avisos.total',

            // CMS - Comunicados
            'stats-comunicados-total': 'cms.comunicados.total',

            // Egresados
            'stats-total': 'egresados.total', // ID ambiguo en HTML legacy, verificar
            'stats-egr-total': 'egresados.total', // ID tentativo alternativo
            'stats-titulados': 'egresados.titulados',
            'stats-estudiando': 'egresados.estudiando',
            'stats-historias': 'egresados.historias_publicables',

            // Bolsa Trabajo (si el HTML lo soporta)
            'stats-bolsa-total': 'bolsaTrabajo.total',

            // Suscriptores
            'stats-suscriptores-total': 'suscriptores.total'
        };
    }

    async init() {
        console.log('🚀 [STATS-HYPER] Inicializando cargador optimizado de estadísticas...');
        await this.loadStats();

        if (this.autoRefresh) {
            setInterval(() => this.loadStats(), this.refreshInterval);
        }
    }

    async loadStats() {
        try {
            // Obtener token (Soporte dual: legacy y nuevo auth)
            const token = localStorage.getItem('authToken') || localStorage.getItem('admin_token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(this.apiEndpoint, { headers });

            if (!response.ok) {
                if (response.status === 401) console.warn('⚠️ [STATS] No autorizado - Sesión expirada?');
                if (response.status === 429) console.warn('⚠️ [STATS] Rate limit excedido - Esperando...');
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.updateUI(result.data);
            }

        } catch (error) {
            console.error('❌ [STATS] Error cargando dashboard summary:', error);
        }
    }

    updateUI(data) {
        // Actualizar valores mapeados
        for (const [elementId, dataPath] of Object.entries(this.elements)) {
            const value = this.getValueByPath(data, dataPath);
            this.updateElement(elementId, value);
        }

        // Actualizar porcentajes complejos (Egresados)
        // Requiere lógica especial más allá del mapeo directo
        if (data.egresados?.total > 0) {
            const { total, titulados, estudiando, historias_publicables } = data.egresados;
            this.updateElement('porcentaje-titulados', this.calcPercent(titulados, total));
            this.updateElement('porcentaje-estudiando', this.calcPercent(estudiando, total));
            this.updateElement('porcentaje-historias', this.calcPercent(historias_publicables, total));
        }

        // Log discreto
        // console.log('✨ [STATS] UI actualizada');
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? 0;
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
            // Opcional: Remover clase 'placeholder' o skeleton loading si existiera
            el.classList.remove('loading-skeleton');
        }
    }

    calcPercent(val, total) {
        if (!total) return '0.0%';
        return `${((val / total) * 100).toFixed(1)}%`;
    }
}

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Evitar doble inicialización si se carga dinámicamente
    if (!window.adminStatsOptimized) {
        window.adminStatsOptimized = new AdminDashboardStats();
        window.adminStatsOptimized.init();
    }
});
