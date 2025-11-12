/**
 * 📊 DYNAMIC STATS LOADER - BGE HEROES DE LA PATRIA
 * Sistema de carga dinámica de estadísticas desde JSON
 */

class DynamicStatsLoader {
    constructor() {
        this.statsFile = '/data/estadisticas.json';
        this.stats = {};
        console.log('📊 Dynamic Stats Loader inicializado');
    }

    /**
     * Cargar estadísticas desde JSON
     */
    async loadStats() {
        try {
            console.log('📡 Cargando estadísticas desde:', this.statsFile);
            const response = await fetch(this.statsFile);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.stats = await response.json();
            console.log('✅ Estadísticas cargadas:', this.stats);

            // Actualizar la interfaz
            this.updateDashboardStats();
            this.updateModalStats();

            return this.stats;
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);

            // Cargar datos por defecto desde localStorage o valores fijos
            this.loadDefaultStats();
            return this.stats;
        }
    }

    /**
     * Cargar estadísticas por defecto
     */
    loadDefaultStats() {
        console.log('📋 Cargando estadísticas por defecto...');

        this.stats = {
            estudiantes: {
                total: parseInt(localStorage.getItem('realData_totalStudents')) || 1247,
                descripcion: "Estudiantes"
            },
            docentes: {
                total: parseInt(localStorage.getItem('realData_totalTeachers')) || 68,
                descripcion: "Docentes"
            },
            materias: {
                total: parseInt(localStorage.getItem('realData_totalSubjects')) || 42,
                descripcion: "Materias"
            },
            promedio: {
                valor: parseFloat(localStorage.getItem('realData_generalAverage')) || 8.4,
                descripcion: "Promedio General"
            }
        };

        this.updateDashboardStats();
        this.updateModalStats();
    }

    /**
     * Actualizar estadísticas en el dashboard principal
     */
    updateDashboardStats() {
        try {
            console.log('🔄 Actualizando dashboard principal...');

            // Elementos del dashboard principal
            const elements = {
                totalStudents: document.getElementById('totalStudents'),
                totalTeachers: document.getElementById('totalTeachers'),
                totalSubjects: document.getElementById('totalSubjects'),
                generalAverage: document.getElementById('generalAverage')
            };

            if (elements.totalStudents) {
                elements.totalStudents.textContent = this.formatNumber(this.stats.estudiantes?.total || 0);
            }

            if (elements.totalTeachers) {
                elements.totalTeachers.textContent = this.formatNumber(this.stats.docentes?.total || 0);
            }

            if (elements.totalSubjects) {
                elements.totalSubjects.textContent = this.formatNumber(this.stats.materias?.total || 0);
            }

            if (elements.generalAverage) {
                elements.generalAverage.textContent = this.stats.promedio?.valor || '0.0';
            }

            console.log('✅ Dashboard principal actualizado');
        } catch (error) {
            console.error('❌ Error actualizando dashboard:', error);
        }
    }

    /**
     * Actualizar estadísticas en el modal
     */
    updateModalStats() {
        try {
            console.log('🔄 Actualizando estadísticas del modal...');

            // Elementos del modal
            const modalElements = {
                modalTotalStudents: document.getElementById('modalTotalStudents'),
                modalTotalTeachers: document.getElementById('modalTotalTeachers'),
                modalTotalSubjects: document.getElementById('modalTotalSubjects'),
                modalGeneralAverage: document.getElementById('modalGeneralAverage')
            };

            if (modalElements.modalTotalStudents) {
                modalElements.modalTotalStudents.textContent = this.formatNumber(this.stats.estudiantes?.total || 0);
            }

            if (modalElements.modalTotalTeachers) {
                modalElements.modalTotalTeachers.textContent = this.formatNumber(this.stats.docentes?.total || 0);
            }

            if (modalElements.modalTotalSubjects) {
                modalElements.modalTotalSubjects.textContent = this.formatNumber(this.stats.materias?.total || 0);
            }

            if (modalElements.modalGeneralAverage) {
                modalElements.modalGeneralAverage.textContent = this.stats.promedio?.valor || '0.0';
            }

            console.log('✅ Modal actualizado');
        } catch (error) {
            console.error('❌ Error actualizando modal:', error);
        }
    }

    /**
     * Guardar estadísticas en JSON y localStorage
     */
    async saveStats(newStats) {
        try {
            console.log('💾 Guardando estadísticas:', newStats);

            // Actualizar el objeto interno
            this.stats = {
                estudiantes: {
                    total: parseInt(newStats.totalStudents) || 0,
                    descripcion: "Estudiantes"
                },
                docentes: {
                    total: parseInt(newStats.totalTeachers) || 0,
                    descripcion: "Docentes"
                },
                materias: {
                    total: parseInt(newStats.totalSubjects) || 0,
                    descripcion: "Materias"
                },
                promedio: {
                    valor: parseFloat(newStats.generalAverage) || 0.0,
                    descripcion: "Promedio General"
                },
                configuracion: {
                    totalEstudiantes: parseInt(newStats.totalStudents) || 0,
                    totalDocentes: parseInt(newStats.totalTeachers) || 0,
                    totalMaterias: parseInt(newStats.totalSubjects) || 0,
                    promedioGeneral: parseFloat(newStats.generalAverage) || 0.0,
                    descripcionEstudiantes: "Número total de estudiantes matriculados",
                    descripcionDocentes: "Personal docente activo",
                    descripcionMaterias: "Materias ofrecidas en el plantel",
                    descripcionPromedio: "Promedio institucional actual"
                },
                fechaActualizacion: new Date().toISOString()
            };

            // Guardar en localStorage (como backup)
            localStorage.setItem('realData_totalStudents', newStats.totalStudents);
            localStorage.setItem('realData_totalTeachers', newStats.totalTeachers);
            localStorage.setItem('realData_totalSubjects', newStats.totalSubjects);
            localStorage.setItem('realData_generalAverage', newStats.generalAverage);
            localStorage.setItem('statsData', JSON.stringify(this.stats));

            // Intentar guardar en el servidor (simulado)
            try {
                const response = await fetch('/api/save-stats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.stats)
                });

                if (response.ok) {
                    console.log('✅ Estadísticas guardadas en servidor');
                } else {
                    console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
                }
            } catch (serverError) {
                console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
            }

            // Actualizar la interfaz
            this.updateDashboardStats();
            this.updateModalStats();

            console.log('✅ Estadísticas guardadas exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error guardando estadísticas:', error);
            return false;
        }
    }

    /**
     * Formatear números con comas
     */
    formatNumber(num) {
        return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
    }

    /**
     * Inicializar el sistema
     */
    async init() {
        console.log('🚀 Inicializando Dynamic Stats Loader...');

        // Cargar estadísticas al inicio
        await this.loadStats();

        // Configurar eventos para el modal de configuración
        this.setupConfigEvents();

        // Configurar recarga automática cuando se abre la página
        this.setupPageReloadHandler();

        console.log('✅ Dynamic Stats Loader inicializado correctamente');
    }

    /**
     * Configurar manejador de recarga de página
     */
    setupPageReloadHandler() {
        // Recargar estadísticas cada 30 segundos
        setInterval(async () => {
            console.log('🔄 Recarga automática de estadísticas...');
            await this.loadStats();
        }, 30000);

        // También recargar cuando la ventana gana el foco
        window.addEventListener('focus', async () => {
            console.log('🔄 Página enfocada, recargando estadísticas...');
            await this.loadStats();
        });
    }

    /**
     * Configurar eventos del modal de configuración
     */
    setupConfigEvents() {
        // Buscar el botón de guardar configuración
        const saveButton = document.querySelector('#statisticsConfigForm button[type="submit"], button[onclick*="saveInstitutionalStats"], #saveStatsBtn');

        if (saveButton) {
            console.log('🔧 Configurando evento de guardar estadísticas');

            saveButton.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('💾 Botón guardar presionado');

                // Obtener valores del formulario
                const newStats = {
                    totalStudents: document.getElementById('configTotalStudents')?.value || '0',
                    totalTeachers: document.getElementById('configTotalTeachers')?.value || '0',
                    totalSubjects: document.getElementById('configTotalSubjects')?.value || '0',
                    generalAverage: document.getElementById('configGeneralAverage')?.value || '0.0'
                };

                console.log('📊 Nuevas estadísticas:', newStats);

                // Guardar las estadísticas
                const success = await this.saveStats(newStats);

                if (success) {
                    // Mostrar mensaje de éxito
                    this.showSuccessMessage();

                    // Cerrar modal si existe
                    const modal = document.getElementById('statisticsConfigModal');
                    if (modal) {
                        const modalInstance = bootstrap.Modal.getInstance(modal);
                        if (modalInstance) {
                            modalInstance.hide();
                        }
                    }
                } else {
                    this.showErrorMessage();
                }
            });
        } else {
            console.log('⚠️ Botón de guardar no encontrado, configurando evento alternativo...');

            // Configurar evento en el documento para capturar cualquier clic en guardar
            document.addEventListener('click', async (e) => {
                if (e.target.textContent?.includes('Guardar') ||
                    e.target.id === 'saveStatsBtn' ||
                    e.target.closest('button')?.textContent?.includes('Guardar')) {

                    console.log('💾 Evento guardar detectado');

                    const newStats = {
                        totalStudents: document.getElementById('configTotalStudents')?.value || '0',
                        totalTeachers: document.getElementById('configTotalTeachers')?.value || '0',
                        totalSubjects: document.getElementById('configTotalSubjects')?.value || '0',
                        generalAverage: document.getElementById('configGeneralAverage')?.value || '0.0'
                    };

                    if (newStats.totalStudents !== '0' || newStats.totalTeachers !== '0') {
                        await this.saveStats(newStats);
                        this.showSuccessMessage();
                    }
                }
            });
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccessMessage() {
        console.log('✅ Mostrando mensaje de éxito');

        // Crear toast o alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        alertDiv.innerHTML = sanitizeHTML(`
            <i class="fas fa-check-circle me-2"></i>
            <strong>¡Éxito!</strong> Estadísticas actualizadas correctamente.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(alertDiv);

        // Auto-remove después de 3 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * Mostrar mensaje de error
     */
    showErrorMessage() {
        console.log('❌ Mostrando mensaje de error');

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        alertDiv.innerHTML = sanitizeHTML(`
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Error</strong> No se pudieron guardar las estadísticas.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM cargado, inicializando Dynamic Stats Loader...');

    // Crear instancia global
    window.dynamicStatsLoader = new DynamicStatsLoader();

    // Inicializar después de un breve delay para asegurar que todos los elementos estén disponibles
    setTimeout(async () => {
        await window.dynamicStatsLoader.init();
    }, 500);
});

// Función global para recargar estadísticas
window.reloadStats = async () => {
    if (window.dynamicStatsLoader) {
        await window.dynamicStatsLoader.loadStats();
    }
};

console.log('📊 dynamic-stats-loader.js cargado correctamente');