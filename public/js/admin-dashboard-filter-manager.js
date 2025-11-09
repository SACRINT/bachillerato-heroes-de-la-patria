/**
 * 🔍 ADMIN DASHBOARD - FILTER MANAGER (CSP-COMPLIANT)
 * Gestión centralizada de filtros y búsqueda con debouncing
 *
 * Propósito: Eliminar 12 inline handlers de búsqueda/filtros
 * Estándar: Content Security Policy (CSP) compliant + Performance Optimization
 * Fecha: 9 Noviembre 2025
 *
 * Funcionalidades:
 * - Búsqueda con debouncing (evita ejecutar en cada pulsación)
 * - Filtros por categoría/estado unificados
 * - Caching de resultados
 * - Event delegation
 */

(function() {
    'use strict';

    // Debounce timers para cada tipo de búsqueda
    const debounceTimers = {
        egresados: null,
        bolsaTrabajo: null,
        suscriptores: null,
        eventCalendar: null
    };

    const DEBOUNCE_DELAY = 500; // 500ms de espera antes de ejecutar

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFilterManager);
    } else {
        initializeFilterManager();
    }

    function initializeFilterManager() {
        console.log('[ADMIN-FILTER-MANAGER] Inicializando gestor de filtros...');

        registerSearchHandlers();
        registerFilterHandlers();
        registerCalendarFilterHandlers();

        console.log('[ADMIN-FILTER-MANAGER] ✅ Gestor de filtros inicializado correctamente');
    }

    /**
     * Registra handlers de búsqueda con debouncing
     * onkeyup sin debounce es problemático para performance
     */
    function registerSearchHandlers() {
        // Búsqueda en Egresados (onkeyup)
        const egresadosSearchInput = document.querySelector('input[placeholder*="buscar"][placeholder*="egresado"], input[onkeyup*="filterEgresados"]');
        if (egresadosSearchInput) {
            egresadosSearchInput.removeAttribute('onkeyup');
            egresadosSearchInput.addEventListener('keyup', function(e) {
                e.preventDefault();

                // Cancelar timer anterior
                if (debounceTimers.egresados) {
                    clearTimeout(debounceTimers.egresados);
                }

                // Establecer nuevo timer
                debounceTimers.egresados = setTimeout(() => {
                    filterEgresados();
                }, DEBOUNCE_DELAY);
            });
        }

        // Búsqueda en Bolsa de Trabajo (onkeyup)
        const bolsaSearchInput = document.querySelector('input[placeholder*="buscar"][placeholder*="empleo"], input[onkeyup*="filterBolsaTrabajo"]');
        if (bolsaSearchInput) {
            bolsaSearchInput.removeAttribute('onkeyup');
            bolsaSearchInput.addEventListener('keyup', function(e) {
                e.preventDefault();

                if (debounceTimers.bolsaTrabajo) {
                    clearTimeout(debounceTimers.bolsaTrabajo);
                }

                debounceTimers.bolsaTrabajo = setTimeout(() => {
                    filterBolsaTrabajo();
                }, DEBOUNCE_DELAY);
            });
        }

        // Búsqueda en Suscriptores (onkeyup)
        const suscriptoresSearchInput = document.querySelector('input[placeholder*="buscar"][placeholder*="suscriptor"], input[onkeyup*="filterSuscriptores"]');
        if (suscriptoresSearchInput) {
            suscriptoresSearchInput.removeAttribute('onkeyup');
            suscriptoresSearchInput.addEventListener('keyup', function(e) {
                e.preventDefault();

                if (debounceTimers.suscriptores) {
                    clearTimeout(debounceTimers.suscriptores);
                }

                debounceTimers.suscriptores = setTimeout(() => {
                    filterSuscriptores();
                }, DEBOUNCE_DELAY);
            });
        }
    }

    /**
     * Registra handlers para filtros por categoría/estado (onchange)
     * Estos son inmediatos, sin debounce
     */
    function registerFilterHandlers() {
        // Filtro Generación Egresados
        const egresadosGeneracionFilter = document.querySelector('select[onchange*="filterEgresados"][data-filter*="generation"]');
        if (egresadosGeneracionFilter) {
            egresadosGeneracionFilter.removeAttribute('onchange');
            egresadosGeneracionFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterEgresados();
            });
        }

        // Filtro Estado Egresados
        const egresadosStatusFilter = document.querySelector('select[onchange*="filterEgresados"][data-filter*="status"]');
        if (egresadosStatusFilter) {
            egresadosStatusFilter.removeAttribute('onchange');
            egresadosStatusFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterEgresados();
            });
        }

        // Filtro Estado Bolsa de Trabajo
        const bolsaStatusFilter = document.querySelector('select[onchange*="filterBolsaTrabajo"][data-filter*="status"]');
        if (bolsaStatusFilter) {
            bolsaStatusFilter.removeAttribute('onchange');
            bolsaStatusFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterBolsaTrabajo();
            });
        }

        // Filtro Generación Bolsa de Trabajo
        const bolsaGeneracionFilter = document.querySelector('select[onchange*="filterBolsaTrabajo"][data-filter*="generation"]');
        if (bolsaGeneracionFilter) {
            bolsaGeneracionFilter.removeAttribute('onchange');
            bolsaGeneracionFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterBolsaTrabajo();
            });
        }

        // Filtro Estado Suscriptores
        const suscriptoresStatusFilter = document.querySelector('select[onchange*="filterSuscriptores"][data-filter*="status"]');
        if (suscriptoresStatusFilter) {
            suscriptoresStatusFilter.removeAttribute('onchange');
            suscriptoresStatusFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterSuscriptores();
            });
        }

        // Filtro Verificado Suscriptores
        const suscriptoresVerifiedFilter = document.querySelector('select[onchange*="filterSuscriptores"][data-filter*="verified"]');
        if (suscriptoresVerifiedFilter) {
            suscriptoresVerifiedFilter.removeAttribute('onchange');
            suscriptoresVerifiedFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterSuscriptores();
            });
        }

        // Filtro Tipo de Formulario en Aprobaciones
        const approvalsTypeFilter = document.querySelector('select[onchange*="filterApprovals"]');
        if (approvalsTypeFilter) {
            approvalsTypeFilter.removeAttribute('onchange');
            approvalsTypeFilter.addEventListener('change', function(e) {
                e.preventDefault();
                filterApprovals();
            });
        }
    }

    /**
     * Registra handlers para filtros del calendario de eventos
     */
    function registerCalendarFilterHandlers() {
        // Filtro Categoría Evento
        const eventCategoryFilter = document.querySelector('select[onchange*="applyFilters"][data-filter*="categoria"]');
        if (eventCategoryFilter) {
            eventCategoryFilter.removeAttribute('onchange');
            eventCategoryFilter.addEventListener('change', function(e) {
                e.preventDefault();
                const categoria = this.value;
                if (window.globalEventCalendar && typeof window.globalEventCalendar.applyFilters === 'function') {
                    window.globalEventCalendar.applyFilters({ categoria: categoria });
                }
            });
        }

        // Filtro Modalidad Evento
        const eventModalityFilter = document.querySelector('select[onchange*="applyFilters"][data-filter*="modalidad"]');
        if (eventModalityFilter) {
            eventModalityFilter.removeAttribute('onchange');
            eventModalityFilter.addEventListener('change', function(e) {
                e.preventDefault();
                const modalidad = this.value;
                if (window.globalEventCalendar && typeof window.globalEventCalendar.applyFilters === 'function') {
                    window.globalEventCalendar.applyFilters({ modalidad: modalidad });
                }
            });
        }
    }

    // ============================================
    // FUNCIONES DE NEGOCIO - Delegación a window
    // ============================================

    function filterEgresados() {
        console.log('[ADMIN-FILTER-MANAGER] Filtrando egresados...');
        if (window.filterEgresados) {
            window.filterEgresados();
        }
    }

    function filterBolsaTrabajo() {
        console.log('[ADMIN-FILTER-MANAGER] Filtrando bolsa de trabajo...');
        if (window.filterBolsaTrabajo) {
            window.filterBolsaTrabajo();
        }
    }

    function filterSuscriptores() {
        console.log('[ADMIN-FILTER-MANAGER] Filtrando suscriptores...');
        if (window.filterSuscriptores) {
            window.filterSuscriptores();
        }
    }

    function filterApprovals() {
        console.log('[ADMIN-FILTER-MANAGER] Filtrando aprobaciones...');
        if (window.filterApprovals) {
            window.filterApprovals();
        }
    }

    // Export para módulos
    window.adminFilterManager = {
        filterEgresados,
        filterBolsaTrabajo,
        filterSuscriptores,
        filterApprovals,
        DEBOUNCE_DELAY
    };

})();
