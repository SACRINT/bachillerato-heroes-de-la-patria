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
        console.log('[ADMIN-TABLE-MANAGER] Recargando estudiantes...');
        if (window.reloadStudents) {
            window.reloadStudents();
        }
    }

    function reloadTeachers() {
        console.log('[ADMIN-TABLE-MANAGER] Recargando docentes...');
        if (window.reloadTeachers) {
            window.reloadTeachers();
        }
    }

    function reloadParents() {
        console.log('[ADMIN-TABLE-MANAGER] Recargando padres...');
        if (window.reloadParents) {
            window.reloadParents();
        }
    }

    function loadEgresados() {
        console.log('[ADMIN-TABLE-MANAGER] Cargando egresados...');
        if (window.loadEgresados) {
            window.loadEgresados();
        }
    }

    function loadBolsaTrabajo() {
        console.log('[ADMIN-TABLE-MANAGER] Cargando bolsa de trabajo...');
        if (window.loadBolsaTrabajo) {
            window.loadBolsaTrabajo();
        }
    }

    function loadSuscriptores() {
        console.log('[ADMIN-TABLE-MANAGER] Cargando suscriptores...');
        if (window.loadSuscriptores) {
            window.loadSuscriptores();
        }
    }

    function refreshCitas() {
        console.log('[ADMIN-TABLE-MANAGER] Refrescando citas...');
        if (window.refreshCitas) {
            window.refreshCitas();
        }
    }

    function refreshApprovals() {
        console.log('[ADMIN-TABLE-MANAGER] Refrescando aprobaciones...');
        if (window.refreshApprovals) {
            window.refreshApprovals();
        }
    }

    function exportEgresados() {
        console.log('[ADMIN-TABLE-MANAGER] Exportando egresados...');
        if (window.exportEgresados) {
            window.exportEgresados();
        }
    }

    function clearParentFilters() {
        console.log('[ADMIN-TABLE-MANAGER] Limpiando filtros de padres...');
        if (window.clearParentFilters) {
            window.clearParentFilters();
        }
    }

    function clearFiltersBolsaTrabajo() {
        console.log('[ADMIN-TABLE-MANAGER] Limpiando filtros de bolsa de trabajo...');
        if (window.clearFiltersBolsaTrabajo) {
            window.clearFiltersBolsaTrabajo();
        }
    }

    function exportBolsaTrabajoCSV() {
        console.log('[ADMIN-TABLE-MANAGER] Exportando bolsa de trabajo...');
        if (window.exportBolsaTrabajoCSV) {
            window.exportBolsaTrabajoCSV();
        }
    }

    function clearFiltersSuscriptores() {
        console.log('[ADMIN-TABLE-MANAGER] Limpiando filtros de suscriptores...');
        if (window.clearFiltersSuscriptores) {
            window.clearFiltersSuscriptores();
        }
    }

    function exportSuscriptoresCSV() {
        console.log('[ADMIN-TABLE-MANAGER] Exportando suscriptores...');
        if (window.exportSuscriptoresCSV) {
            window.exportSuscriptoresCSV();
        }
    }

    function clearCitasFilters() {
        console.log('[ADMIN-TABLE-MANAGER] Limpiando filtros de citas...');
        if (window.clearCitasFilters) {
            window.clearCitasFilters();
        }
    }

    function exportCitasToCSV() {
        console.log('[ADMIN-TABLE-MANAGER] Exportando citas...');
        if (window.exportCitasToCSV) {
            window.exportCitasToCSV();
        }
    }

    function printCitasReport() {
        console.log('[ADMIN-TABLE-MANAGER] Imprimiendo reporte de citas...');
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
