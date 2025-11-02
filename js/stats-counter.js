/**
 * CONTADOR DE ESTADÍSTICAS DINÁMICO
 * Cuenta el contenido real desde archivos JSON
 */

// Prevenir carga múltiple
if (typeof window.StatsCounter !== 'undefined') {
    console.log('📊 [STATS] Ya está cargado, evitando duplicación');
} else {

class StatsCounter {
    constructor() {
        console.log('📊 [STATS] Inicializando contador de estadísticas...');
        this.apiBase = '/api/';
        this.init();
    }

    async init() {
        try {
            // Esperar un poco para que el DOM esté completamente cargado
            setTimeout(async () => {
                await this.updateAllStats();
                console.log('✅ [STATS] Estadísticas actualizadas correctamente');
            }, 1000);
        } catch (error) {
            console.error('❌ [STATS] Error inicializando estadísticas:', error);
        }
    }

    async fetchStats(endpoint) {
        try {
            console.log(`📥 [STATS] Cargando estadísticas de ${endpoint}...`);
            const response = await fetch(`${this.apiBase}${endpoint}/stats`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            console.log(`✅ [STATS] ${endpoint} stats cargado:`, result);
            return result.success ? result.data : null;
        } catch (error) {
            console.error(`❌ [STATS] Error cargando ${endpoint}:`, error);
            return null;
        }
    }

    async countNoticias() {
        const stats = await this.fetchStats('noticias');
        const publicadas = stats ? parseInt(stats.publicadas || 0) : 0;
        console.log(`📰 [STATS] Noticias publicadas: ${publicadas}`);
        return publicadas;
    }

    async countEventos() {
        const stats = await this.fetchStats('eventos');
        const publicados = stats ? parseInt(stats.publicadas || 0) : 0;
        console.log(`📅 [STATS] Eventos publicados: ${publicados}`);
        return publicados;
    }

    async countAvisos() {
        const stats = await this.fetchStats('avisos');
        const publicados = stats ? parseInt(stats.publicadas || 0) : 0;
        console.log(`⚠️ [STATS] Avisos publicados: ${publicados}`);
        return publicados;
    }

    async countComunicados() {
        const stats = await this.fetchStats('comunicados');
        const publicados = stats ? parseInt(stats.publicadas || 0) : 0;
        console.log(`📋 [STATS] Comunicados publicados: ${publicados}`);
        return publicados;
    }

    async updateAllStats() {
        console.log('🔄 [STATS] Actualizando todas las estadísticas...');

        // Obtener contadores
        const [noticiasCount, eventosCount, avisosCount, comunicadosCount] = await Promise.all([
            this.countNoticias(),
            this.countEventos(),
            this.countAvisos(),
            this.countComunicados()
        ]);

        // Los elementos stat-* no existen en el dashboard principal, solo en modal

        // Actualizar en modal de estadísticas
        this.updateElement('modal-stat-noticias', noticiasCount);
        this.updateElement('modal-stat-eventos', eventosCount);
        this.updateElement('modal-stat-avisos', avisosCount);
        this.updateElement('modal-stat-comunicados', comunicadosCount);

        // Calcular total
        const totalContenido = noticiasCount + eventosCount + avisosCount + comunicadosCount;
        console.log(`📊 [STATS] Total de contenido activo: ${totalContenido}`);

        // Actualizar información del sistema
        this.updateSystemInfo({
            noticias: noticiasCount,
            eventos: eventosCount,
            avisos: avisosCount,
            comunicados: comunicadosCount,
            total: totalContenido
        });

        return {
            noticias: noticiasCount,
            eventos: eventosCount,
            avisos: avisosCount,
            comunicados: comunicadosCount,
            total: totalContenido
        };
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animar el cambio de número
            this.animateNumber(element, value);
            console.log(`✅ [STATS] Actualizado ${elementId}: ${value}`);
        } else {
            console.warn(`⚠️ [STATS] Elemento ${elementId} no encontrado`);
        }
    }

    animateNumber(element, targetValue) {
        // ✅ VALIDACIÓN: Asegurar que targetValue es un número válido y positivo
        targetValue = parseInt(targetValue) || 0;
        if (targetValue < 0 || isNaN(targetValue)) {
            console.warn(`⚠️ [STATS] Valor inválido detectado: ${targetValue}, usando 0`);
            targetValue = 0;
        }

        // ✅ PROTECCIÓN CRÍTICA: Cancelar cualquier animación previa PRIMERO
        if (element.animationTimer) {
            clearInterval(element.animationTimer);
            element.animationTimer = null;
        }

        // ✅ FIX CRÍTICO: Validar currentValue y resetear si es inválido
        let currentValue = parseInt(element.textContent);
        if (isNaN(currentValue) || currentValue < 0 || currentValue > 1000000) {
            console.warn(`⚠️ [STATS] Valor actual corrupto: ${currentValue}, reseteando a 0`);
            currentValue = 0;
            element.textContent = '0';
        }

        // Si los valores son iguales, no hacer nada
        if (currentValue === targetValue) {
            return;
        }

        // ✅ OPTIMIZACIÓN: Si el cambio es muy grande, actualizar directamente sin animar
        const diff = Math.abs(targetValue - currentValue);
        if (diff > 100) {
            element.textContent = targetValue;
            console.log(`✅ [STATS] Actualización directa (diff=${diff})`);
            return;
        }

        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 500; // 500ms
        const steps = Math.abs(targetValue - currentValue);

        // ✅ PROTECCIÓN: Asegurar que stepDuration nunca sea menor a 10ms
        const stepDuration = steps > 0 ? Math.max(10, duration / steps) : 0;

        let current = currentValue;

        element.animationTimer = setInterval(() => {
            current += increment;
            element.textContent = current;

            if (current === targetValue) {
                clearInterval(element.animationTimer);
                element.animationTimer = null;
            }
        }, stepDuration);
    }

    updateSystemInfo(stats) {
        // Actualizar última actualización
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = now.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Actualizar administrador activo
        const currentAdminElement = document.getElementById('current-admin');
        if (currentAdminElement) {
            currentAdminElement.textContent = 'Sistema CMS BGE';
        }

        // Actualizar tiempo de sesión
        const sessionTimeElement = document.getElementById('session-time');
        if (sessionTimeElement) {
            const sessionStart = localStorage.getItem('dashboard_session_start') || Date.now();
            const sessionDuration = Date.now() - parseInt(sessionStart);
            const minutes = Math.floor(sessionDuration / (1000 * 60));
            sessionTimeElement.textContent = `${minutes} minutos`;
        }

        console.log('ℹ️ [STATS] Información del sistema actualizada');
    }

    // Función pública para actualizar desde otros scripts
    async refresh() {
        console.log('🔄 [STATS] Refrescando estadísticas...');
        return await this.updateAllStats();
    }
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Guardar tiempo de inicio de sesión
    if (!localStorage.getItem('dashboard_session_start')) {
        localStorage.setItem('dashboard_session_start', Date.now());
    }

    // Inicializar contador de estadísticas
    window.statsCounter = new StatsCounter();
});

// Función global para refrescar estadísticas
function refreshStats() {
    if (window.statsCounter) {
        window.statsCounter.refresh();
    }
}

console.log('📊 [STATS] stats-counter.js cargado exitosamente');

} // Fin del bloque de protección contra carga múltiple