/**
 * 🎯 EVENT DELEGATION - Sistema centralizado de manejo de eventos
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha extracción: 19 Nov 2025
 * Líneas originales: 6230-6375 (145 líneas)
 */

(function() {
    'use strict';
    console.log('🎯 [EVENT LISTENERS] Inicializando delegación de eventos...');

    // Mapeo de funciones disponibles globales
    const functionMap = {
        // Navigation
        'scrollToSection': (el) => {
            const targetId = el.dataset.action.replace('scrollToSection', '');
            if (window.scrollToSection) {
                window.scrollToSection(targetId || 'adminPanel');
            }
        },
        'showInfoModal': (el) => { if (window.showInfoModal) window.showInfoModal(); },

        // Notifications
        'openNotificationPanel': (el) => { if (window.openNotificationPanel) window.openNotificationPanel(); },

        // Metrics & Charts
        'advancedMetricsUpdate': (el) => {
            if (window.advancedMetrics?.updateRealTimeMetrics) {
                window.advancedMetrics.updateRealTimeMetrics();
            }
        },
        'advancedMetricsExport': (el) => {
            if (window.advancedMetrics?.exportWidget) {
                window.advancedMetrics.exportWidget('all');
            }
        },
        'dashboardChartsRefresh': (el) => {
            if (window.dashboardCharts?.refreshAll) {
                window.dashboardCharts.refreshAll();
            }
        },

        // Calendar
        'calendarRefetch': (el) => {
            if (window.globalEventCalendar?.refetch) {
                window.globalEventCalendar.refetch();
            }
        },
        'calendarToday': (el) => {
            if (window.globalEventCalendar?.goToToday) {
                window.globalEventCalendar.goToToday();
            }
        },

        // Authentication
        'loginAdmin': (el) => { if (window.loginAdmin) window.loginAdmin(); },
        'updatePassword': (el) => { if (window.updatePassword) window.updatePassword(); },
        'showChangePasswordModal': (el) => { if (window.showChangePasswordModal) window.showChangePasswordModal(); },
        'refreshDashboard': (el) => { if (window.refreshDashboard) window.refreshDashboard(); },
        'logoutAdmin': (el) => { if (window.logoutAdmin) window.logoutAdmin(); },

        // Statistics
        'saveStatisticsConfig': (el) => { if (window.saveStatisticsConfig) window.saveStatisticsConfig(); },
        'showStatisticsConfigModal': (el) => { if (window.showStatisticsConfigModal) window.showStatisticsConfigModal(); },

        // Students
        'reloadStudents': (el) => { if (window.reloadStudents) window.reloadStudents(); },

        // Teachers
        'reloadTeachers': (el) => { if (window.reloadTeachers) window.reloadTeachers(); },

        // Parents
        'showCreateParentModal': (el) => { if (window.showCreateParentModal) window.showCreateParentModal(); },
        'reloadParents': (el) => { if (window.reloadParents) window.reloadParents(); },
        'clearParentFilters': (el) => { if (window.clearParentFilters) window.clearParentFilters(); },

        // Egresados (Alumni)
        'filterEgresados': (el) => { if (window.filterEgresados) window.filterEgresados(); },
        'exportEgresados': (el) => { if (window.exportEgresados) window.exportEgresados(); },
        'loadEgresados': (el) => { if (window.loadEgresados) window.loadEgresados(); },

        // Bolsa Trabajo (Job Board)
        'filterBolsaTrabajo': (el) => { if (window.filterBolsaTrabajo) window.filterBolsaTrabajo(); },
        'clearFiltersBolsaTrabajo': (el) => { if (window.clearFiltersBolsaTrabajo) window.clearFiltersBolsaTrabajo(); },
        'exportBolsaTrabajoCSV': (el) => { if (window.exportBolsaTrabajoCSV) window.exportBolsaTrabajoCSV(); },
        'loadBolsaTrabajo': (el) => { if (window.loadBolsaTrabajo) window.loadBolsaTrabajo(); },

        // Suscriptores (Subscribers)
        'filterSuscriptores': (el) => { if (window.filterSuscriptores) window.filterSuscriptores(); },
        'clearFiltersSuscriptores': (el) => { if (window.clearFiltersSuscriptores) window.clearFiltersSuscriptores(); },
        'exportSuscriptoresCSV': (el) => { if (window.exportSuscriptoresCSV) window.exportSuscriptoresCSV(); },
        'loadSuscriptores': (el) => { if (window.loadSuscriptores) window.loadSuscriptores(); }
    };

    // Manejo de onclick handlers
    document.addEventListener('click', function(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const actionName = target.dataset.action;
        console.log('🎯 [EVENT] Click detectado:', actionName);

        // Ejecutar función mapeada o evaluar directamente
        if (functionMap[actionName]) {
            try {
                functionMap[actionName](target);
            } catch (err) {
                console.error('❌ [EVENT] Error ejecutando acción:', actionName, err);
            }
        } else {
            // Fallback: evaluar si existe en window
            try {
                eval(actionName + '()');
            } catch (err) {
                console.warn('⚠️ [EVENT] Función no encontrada:', actionName);
            }
        }
    });

    // Manejo de onchange handlers
    document.addEventListener('change', function(event) {
        const target = event.target;
        if (!target.dataset.changeHandler) return;

        const handlerCode = target.dataset.changeHandler;
        console.log('🎯 [EVENT] Change detectado:', handlerCode);

        try {
            eval(handlerCode);
        } catch (err) {
            console.error('❌ [EVENT] Error ejecutando handler:', handlerCode, err);
        }
    });

    // Manejo de onkeyup handlers
    document.addEventListener('keyup', function(event) {
        const target = event.target;
        if (!target.dataset.keyupHandler) return;

        const handlerCode = target.dataset.keyupHandler;
        console.log('🎯 [EVENT] Keyup detectado:', handlerCode);

        try {
            eval(handlerCode);
        } catch (err) {
            console.error('❌ [EVENT] Error ejecutando handler:', handlerCode, err);
        }
    });

    console.log('✅ [EVENT LISTENERS] Inicialización completada');
})();
