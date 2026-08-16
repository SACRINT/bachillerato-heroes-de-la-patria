let integratedCalendarInstance = null;

        // Inicializar cuando se cargue la página
        document.addEventListener('DOMContentLoaded', function () {
            // Verificar si el usuario está autenticado (mock)
            const userData = localStorage.getItem('userData');
            const authToken = localStorage.getItem('authToken');

            if (userData && authToken) {
                // Usuario autenticado - mostrar sistema avanzado
                initIntegratedCalendar();
            } else {
                // Usuario no autenticado - mantener calendario básico
                console.log('Usuario no autenticado - usando calendario básico');
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

                    console.log('✅ Sistema integrado de calendario inicializado');
                } else {
                    console.warn('âŒ IntegratedCalendarManager no disponible');
                }
            } catch (error) {
                console.error('Error inicializando calendario integrado:', error);
            }
        }

        // Función para alternar entre vistas (llamada desde botones)
        function showIntegratedCalendar() {
            initIntegratedCalendar();
        }
