/**
 * 📅 CALENDARIO INITIALIZATION - BGE HEROES DE LA PATRIA
 * Inicialización del sistema integrado de calendario
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: calendario.html
 */

let integratedCalendarInstance = null;

// Inicializar cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado (mock)
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');

    if (userData && authToken) {
        // Usuario autenticado - mostrar sistema avanzado
        initIntegratedCalendar();
    } else {
        // Usuario no autenticado - mantener calendario básico
        void 0;
    }
});

function initIntegratedCalendar() {
    try {
        if (typeof IntegratedCalendarManager !== 'undefined') {
            integratedCalendarInstance = new IntegratedCalendarManager();

            // Ocultar calendario básico si existe
            const basicCalendar = document.getElementById('calendar-container');
            if (basicCalendar) {
                basicCalendar.style.display = 'none';
            }

            // Mostrar sistema avanzado
            const advancedContainer = document.getElementById('integrated-calendar-container');
            if (advancedContainer) {
                advancedContainer.classList.remove('d-none');
            }

            void 0;
        } else {
            void 0;
        }
    } catch (error) {
        console.error('[CALENDARIO] Error inicializando calendario integrado:', error);
    }
}
