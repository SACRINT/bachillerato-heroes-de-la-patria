/**
 * 📊 ADMIN DASHBOARD - TABLE MANAGER (CSP-COMPLIANT)
 * Gestión centralizada de todas las operaciones CRUD en tablas del dashboard
 *
 * Propósito: Eliminar 15 inline handlers de gestión de tablas
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Funcionalidades:
 * - Cargar/recargar datos de tablas
 * - Mostrar/ocultar detalles de filas
 * - Eliminar registros
 * - Exportar datos
 * - Event delegation para botones dinámicos
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTableManager);
    } else {
        initializeTableManager();
    }

    function initializeTableManager() {
        registerTableReloadHandlers();
        registerTableCRUDHandlers();
        registerTableDynamicHandlers();
    }

    /**
     * Handlers para recargar datos de tablas
     * Mapea: reloadStudents(), reloadTeachers(), reloadParents(), loadEgresados(), etc.
     */
    function registerTableReloadHandlers() {
        // Botón Recargar Estudiantes
        const reloadStudentsBtn = document.querySelector('button[onclick*="reloadStudents"]');
        if (reloadStudentsBtn) {
            reloadStudentsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                reloadStudents();
            });
        }

        // Botón Recargar Docentes
        const reloadTeachersBtn = document.querySelector('button[onclick*="reloadTeachers"]');
        if (reloadTeachersBtn) {
            reloadTeachersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                reloadTeachers();
            });
        }

        // Botón Recargar Padres
        const reloadParentsBtn = document.querySelector('button[onclick*="reloadParents"]');
        if (reloadParentsBtn) {
            reloadParentsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                reloadParents();
            });
        }

        // Botón Cargar Egresados
        const loadEgresadosBtn = document.querySelector('button[onclick*="loadEgresados"]');
        if (loadEgresadosBtn) {
            loadEgresadosBtn.addEventListener('click', function(e) {
                e.preventDefault();
                loadEgresados();
            });
        }

        // Botón Cargar Bolsa de Trabajo
        const loadBolsaBtn = document.querySelector('button[onclick*="loadBolsaTrabajo"]');
        if (loadBolsaBtn) {
            loadBolsaBtn.addEventListener('click', function(e) {
                e.preventDefault();
                loadBolsaTrabajo();
            });
        }

        // Botón Cargar Suscriptores
        const loadSuscriptoresBtn = document.querySelector('button[onclick*="loadSuscriptores"]');
        if (loadSuscriptoresBtn) {
            loadSuscriptoresBtn.addEventListener('click', function(e) {
                e.preventDefault();
                loadSuscriptores();
            });
        }

        // Botón Recargar Citas
        const refreshCitasBtn = document.querySelector('button[onclick*="refreshCitas"]');
        if (refreshCitasBtn) {
            refreshCitasBtn.addEventListener('click', function(e) {
                e.preventDefault();
                refreshCitas();
            });
        }

        // Botón Recargar Aprobaciones
        const refreshApprovalsBtn = document.querySelector('button[onclick*="refreshApprovals"]');
        if (refreshApprovalsBtn) {
            refreshApprovalsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                refreshApprovals();
            });
        }
    }

    /**
     * Handlers para operaciones CRUD estáticas
     * Mapea: exportEgresados(), clearParentFilters(), etc.
     */
    function registerTableCRUDHandlers() {
        // Botón Exportar Egresados
        const exportEgresadosBtn = document.querySelector('button[onclick*="exportEgresados"]');
        if (exportEgresadosBtn) {
            exportEgresadosBtn.addEventListener('click', function(e) {
                e.preventDefault();
                exportEgresados();
            });
        }

        // Botón Limpiar Filtros Padres
        const clearParentFiltersBtn = document.querySelector('button[onclick*="clearParentFilters"]');
        if (clearParentFiltersBtn) {
            clearParentFiltersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearParentFilters();
            });
        }

        // Botón Limpiar Filtros Bolsa de Trabajo
        const clearBolsaFiltersBtn = document.querySelector('button[onclick*="clearFiltersBolsaTrabajo"]');
        if (clearBolsaFiltersBtn) {
            clearBolsaFiltersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearFiltersBolsaTrabajo();
            });
        }

        // Botón Exportar Bolsa de Trabajo
        const exportBolsaBtn = document.querySelector('button[onclick*="exportBolsaTrabajoCSV"]');
        if (exportBolsaBtn) {
            exportBolsaBtn.addEventListener('click', function(e) {
                e.preventDefault();
                exportBolsaTrabajoCSV();
            });
        }

        // Botón Limpiar Filtros Suscriptores
        const clearSuscriptoresFiltersBtn = document.querySelector('button[onclick*="clearFiltersSuscriptores"]');
        if (clearSuscriptoresFiltersBtn) {
            clearSuscriptoresFiltersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearFiltersSuscriptores();
            });
        }

        // Botón Exportar Suscriptores
        const exportSuscriptoresBtn = document.querySelector('button[onclick*="exportSuscriptoresCSV"]');
        if (exportSuscriptoresBtn) {
            exportSuscriptoresBtn.addEventListener('click', function(e) {
                e.preventDefault();
                exportSuscriptoresCSV();
            });
        }

        // Botón Limpiar Filtros Citas
        const clearCitasFiltersBtn = document.querySelector('button[onclick*="clearCitasFilters"]');
        if (clearCitasFiltersBtn) {
            clearCitasFiltersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearCitasFilters();
            });
        }

        // Botón Exportar Citas
        const exportCitasBtn = document.querySelector('button[onclick*="exportCitasToCSV"]');
        if (exportCitasBtn) {
            exportCitasBtn.addEventListener('click', function(e) {
                e.preventDefault();
                exportCitasToCSV();
            });
        }

        // Botón Imprimir Citas
        const printCitasBtn = document.querySelector('button[onclick*="printCitasReport"]');
        if (printCitasBtn) {
            printCitasBtn.addEventListener('click', function(e) {
                e.preventDefault();
                printCitasReport();
            });
        }
    }

    /**
     * Event delegation para handlers dinámicos (elementos generados en tiempo de ejecución)
     * ⚠️ IMPORTANTE: Estos handlers extraen IDs/parámetros del atributo onclick
     * y los pasan a funciones globales para sanitización
     */
    function registerTableDynamicHandlers() {
        // Delegación para botones dinámicos de detalle/eliminación
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[onclick]');
            if (!target) return;

            const onclick = target.getAttribute('onclick');
            if (!onclick) return;

            // Patrón 1: showDetail(${id})
            let match = onclick.match(/showDetail\('([^']+)'\)/);
            if (match) {
                e.preventDefault();
                const egresadoId = match[1];
                if (window.egresadosManager && typeof window.egresadosManager.showDetail === 'function') {
                    window.egresadosManager.showDetail(egresadoId);
                }
                return;
            }

            // Patrón 2: confirmDelete(${id})
            match = onclick.match(/confirmDelete\('([^']+)'\)/);
            if (match) {
                e.preventDefault();
                const egresadoId = match[1];
                if (window.egresadosManager && typeof window.egresadosManager.confirmDelete === 'function') {
                    window.egresadosManager.confirmDelete(egresadoId);
                }
                return;
            }

            // Patrón 3: editContent('${type}', '${id}')
            match = onclick.match(/editContent\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                e.preventDefault();
                const contentType = match[1];
                const contentId = match[2];
                if (window.adminDashboard && typeof window.adminDashboard.editContent === 'function') {
                    window.adminDashboard.editContent(contentType, contentId);
                }
                return;
            }
        });
    }

    // ============================================
    // FUNCIONES DE NEGOCIO - Delegación a window
    // ============================================

    function reloadStudents() {
        void 0;
        if (window.reloadStudents) {
            window.reloadStudents();
        }
    }

    function reloadTeachers() {
        void 0;
        if (window.reloadTeachers) {
            window.reloadTeachers();
        }
    }

    function reloadParents() {
        void 0;
        if (window.reloadParents) {
            window.reloadParents();
        }
    }

    function loadEgresados() {
        void 0;
        if (window.loadEgresados) {
            window.loadEgresados();
        }
    }

    function loadBolsaTrabajo() {
        void 0;
        if (window.loadBolsaTrabajo) {
            window.loadBolsaTrabajo();
        }
    }

    function loadSuscriptores() {
        void 0;
        if (window.loadSuscriptores) {
            window.loadSuscriptores();
        }
    }

    function refreshCitas() {
        void 0;
        if (window.refreshCitas) {
            window.refreshCitas();
        }
    }

    function refreshApprovals() {
        void 0;
        if (window.refreshApprovals) {
            window.refreshApprovals();
        }
    }

    function exportEgresados() {
        void 0;
        if (window.exportEgresados) {
            window.exportEgresados();
        }
    }

    function clearParentFilters() {
        void 0;
        if (window.clearParentFilters) {
            window.clearParentFilters();
        }
    }

    function clearFiltersBolsaTrabajo() {
        void 0;
        if (window.clearFiltersBolsaTrabajo) {
            window.clearFiltersBolsaTrabajo();
        }
    }

    function exportBolsaTrabajoCSV() {
        void 0;
        if (window.exportBolsaTrabajoCSV) {
            window.exportBolsaTrabajoCSV();
        }
    }

    function clearFiltersSuscriptores() {
        void 0;
        if (window.clearFiltersSuscriptores) {
            window.clearFiltersSuscriptores();
        }
    }

    function exportSuscriptoresCSV() {
        void 0;
        if (window.exportSuscriptoresCSV) {
            window.exportSuscriptoresCSV();
        }
    }

    function clearCitasFilters() {
        void 0;
        if (window.clearCitasFilters) {
            window.clearCitasFilters();
        }
    }

    function exportCitasToCSV() {
        void 0;
        if (window.exportCitasToCSV) {
            window.exportCitasToCSV();
        }
    }

    function printCitasReport() {
        void 0;
        if (window.printCitasReport) {
            window.printCitasReport();
        }
    }

    // Export para módulos
    window.adminTableManager = {
        reloadStudents,
        reloadTeachers,
        reloadParents,
        loadEgresados,
        loadBolsaTrabajo,
        loadSuscriptores,
        refreshCitas,
        refreshApprovals,
        exportEgresados,
        clearParentFilters,
        clearFiltersBolsaTrabajo,
        exportBolsaTrabajoCSV,
        clearFiltersSuscriptores,
        exportSuscriptoresCSV,
        clearCitasFilters,
        exportCitasToCSV,
        printCitasReport
    };

})();
