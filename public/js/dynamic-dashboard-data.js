/**
 * 📊 DYNAMIC DASHBOARD DATA SYSTEM
 * Sistema dinámico para datos del dashboard con persistencia JSON
 */

class DynamicDashboardData {
    constructor() {
        this.dataPath = '../data/';
        this.dashboardStatsFile = 'dashboard-stats.json';
        this.cache = new Map();
        this.lastUpdate = null;
        this.updateInterval = 30000; // 30 segundos

        this.init();
    }

    async init() {
        console.log('📊 Inicializando Dynamic Dashboard Data System...');

        // Cargar datos iniciales
        await this.loadDashboardStats();

        // Actualizar contadores dinámicos
        await this.updateActivityCounts();

        // Configurar auto-actualización
        this.startAutoUpdate();

        console.log('✅ Dynamic Dashboard Data System inicializado');
    }

    /**
     * Carga las estadísticas del dashboard desde JSON
     */
    async loadDashboardStats() {
        try {
            const response = await fetch(`${this.dataPath}${this.dashboardStatsFile}`);
            if (response.ok) {
                const data = await response.json();
                this.cache.set('dashboardStats', data);
                console.log('📥 Estadísticas del dashboard cargadas:', data);
                return data;
            } else {
                console.warn('⚠️ No se pudo cargar dashboard-stats.json, usando datos por defecto');
                return this.getDefaultStats();
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas del dashboard:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Actualiza los contadores de actividad dinámicamente
     */
    async updateActivityCounts() {
        try {
            console.log('🔄 Actualizando contadores de actividad...');

            const counts = await Promise.all([
                this.countItemsInFile('noticias.json'),
                this.countItemsInFile('eventos.json'),
                this.countItemsInFile('avisos.json'),
                this.countItemsInFile('comunicados.json')
            ]);

            const [noticias, eventos, avisos, comunicados] = counts;

            // Actualizar datos en caché
            const stats = this.cache.get('dashboardStats') || this.getDefaultStats();
            stats.activityStats = {
                ...stats.activityStats,
                totalNoticias: noticias,
                totalEventos: eventos,
                totalAvisos: avisos,
                totalComunicados: comunicados
            };

            stats.metadata.lastUpdated = new Date().toISOString();
            this.cache.set('dashboardStats', stats);

            // Guardar en archivo
            await this.saveDashboardStats(stats);

            console.log('✅ Contadores actualizados:', {
                noticias, eventos, avisos, comunicados
            });

            return stats;
        } catch (error) {
            console.error('❌ Error actualizando contadores:', error);
        }
    }

    /**
     * Cuenta elementos en un archivo JSON específico
     */
    async countItemsInFile(filename) {
        try {
            const response = await fetch(`${this.dataPath}${filename}`);
            if (response.ok) {
                const data = await response.json();

                // Manejar diferentes estructuras de JSON
                if (Array.isArray(data)) {
                    return data.length;
                } else if (data.noticias) {
                    return data.noticias.length;
                } else if (data.eventos) {
                    return data.eventos.length;
                } else if (data.avisos) {
                    return data.avisos.length;
                } else if (data.comunicados) {
                    return data.comunicados.length;
                } else {
                    // Contar propiedades del objeto
                    return Object.keys(data).length;
                }
            }
            return 0;
        } catch (error) {
            console.warn(`⚠️ No se pudo contar elementos en ${filename}:`, error.message);
            return 0;
        }
    }

    /**
     * Guarda las estadísticas del dashboard
     */
    async saveDashboardStats(stats) {
        try {
            // En un entorno real, esto sería una llamada al servidor
            // Por ahora, actualizamos localStorage como respaldo
            localStorage.setItem('dashboard_stats_backup', JSON.stringify(stats));

            console.log('💾 Estadísticas guardadas en localStorage como respaldo');

            // También disparar evento para notificar a otros componentes
            window.dispatchEvent(new CustomEvent('dashboardStatsUpdated', {
                detail: stats
            }));

        } catch (error) {
            console.error('❌ Error guardando estadísticas:', error);
        }
    }

    /**
     * Obtiene estadísticas por defecto
     */
    getDefaultStats() {
        return {
            metadata: {
                lastUpdated: new Date().toISOString(),
                version: "1.0.0",
                source: "BGE Heroes Dashboard System"
            },
            academicStats: {
                totalStudents: 1247,
                totalTeachers: 68,
                totalSubjects: 42,
                generalAverage: 8.4,
                totalCourses: 156,
                graduationRate: 94.8
            },
            activityStats: {
                totalNoticias: 0,
                totalEventos: 0,
                totalAvisos: 0,
                totalComunicados: 0,
                activeRegistrations: 23
            },
            systemStats: {
                serverUptime: "99.7%",
                totalUsers: 1315,
                activeUsers: 892,
                pendingApprovals: 5
            },
            performance: {
                responseTime: "0.24s",
                bandwidth: "85.2 MB/s",
                storageUsed: "2.4 GB",
                storageTotal: "50 GB"
            }
        };
    }

    /**
     * Obtiene las estadísticas actuales
     */
    getStats() {
        return this.cache.get('dashboardStats') || this.getDefaultStats();
    }

    /**
     * Actualiza una estadística específica
     */
    async updateStat(category, key, value) {
        try {
            const stats = this.getStats();

            if (stats[category]) {
                stats[category][key] = value;
                stats.metadata.lastUpdated = new Date().toISOString();

                this.cache.set('dashboardStats', stats);
                await this.saveDashboardStats(stats);

                console.log(`✅ Estadística actualizada: ${category}.${key} = ${value}`);
                return true;
            } else {
                console.warn(`⚠️ Categoría no encontrada: ${category}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Error actualizando estadística:', error);
            return false;
        }
    }

    /**
     * Inicia la actualización automática
     */
    startAutoUpdate() {
        setInterval(async () => {
            await this.updateActivityCounts();
        }, this.updateInterval);

        console.log(`🔄 Auto-actualización configurada cada ${this.updateInterval/1000} segundos`);
    }

    /**
     * Actualiza los elementos del DOM con los datos dinámicos
     */
    updateDOMElements() {
        const stats = this.getStats();

        // Actualizar elementos estadísticos si existen
        const statElements = {
            'stat-students': stats.academicStats.totalStudents,
            'stat-teachers': stats.academicStats.totalTeachers,
            'stat-subjects': stats.academicStats.totalSubjects,
            'stat-average': stats.academicStats.generalAverage,
            'stat-noticias': stats.activityStats.totalNoticias,
            'stat-eventos': stats.activityStats.totalEventos,
            'stat-avisos': stats.activityStats.totalAvisos,
            'stat-comunicados': stats.activityStats.totalComunicados,
            'stat-uptime': stats.systemStats.serverUptime,
            'stat-active-users': stats.systemStats.activeUsers,
            'stat-pending': stats.systemStats.pendingApprovals
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`📊 Actualizado ${id}: ${value}`);
            }
        });

        // Actualizar timestamp de última actualización
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const updateTime = new Date(stats.metadata.lastUpdated).toLocaleString('es-ES');
            lastUpdateElement.textContent = `Última actualización: ${updateTime}`;
        }
    }

    /**
     * Método para uso externo - actualizar un contador manualmente
     */
    async incrementCounter(type) {
        const stats = this.getStats();
        const key = `total${type.charAt(0).toUpperCase() + type.slice(1)}`;

        if (stats.activityStats[key] !== undefined) {
            stats.activityStats[key]++;
            stats.metadata.lastUpdated = new Date().toISOString();

            this.cache.set('dashboardStats', stats);
            await this.saveDashboardStats(stats);
            this.updateDOMElements();

            console.log(`📈 Incrementado ${type}: ${stats.activityStats[key]}`);
        }
    }

    /**
     * Fuerza una actualización completa
     */
    async forceUpdate() {
        console.log('🔄 Forzando actualización completa...');
        await this.updateActivityCounts();
        this.updateDOMElements();
        console.log('✅ Actualización completa finalizada');
    }
}

// Inicializar el sistema cuando el DOM esté listo
let dynamicDashboardData = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dynamicDashboardData = new DynamicDashboardData();
    });
} else {
    dynamicDashboardData = new DynamicDashboardData();
}

// Exponer funciones globales para uso externo
window.updateDashboardStat = async (category, key, value) => {
    if (dynamicDashboardData) {
        return await dynamicDashboardData.updateStat(category, key, value);
    }
};

window.incrementDashboardCounter = async (type) => {
    if (dynamicDashboardData) {
        return await dynamicDashboardData.incrementCounter(type);
    }
};

window.forceDashboardUpdate = async () => {
    if (dynamicDashboardData) {
        return await dynamicDashboardData.forceUpdate();
    }
};

window.getDashboardStats = () => {
    if (dynamicDashboardData) {
        return dynamicDashboardData.getStats();
    }
    return null;
};

// Event listener para actualizar automáticamente cuando se detecten cambios
window.addEventListener('dashboardStatsUpdated', (event) => {
    if (dynamicDashboardData) {
        dynamicDashboardData.updateDOMElements();
    }
});

console.log('📊 Dynamic Dashboard Data System cargado');

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicDashboardData;
}