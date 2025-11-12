/**
 * 🎯 ADMIN DASHBOARD - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onchange/etc a addEventListener
 *
 * Propósito: Eliminar 601 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de admin-dashboard.html
 */

(function() {
    'use strict';

    // ============================================
    // INICIALIZACIÓN - Esperar DOM Listo
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        // DOM ya está listo
        initializeEventHandlers();
    }

    // ============================================
    // FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================

    function initializeEventHandlers() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Inicializando event handlers...');

        // Registrar todos los handlers
        registerNavigationHandlers();
        registerButtonHandlers();
        registerFormHandlers();
        registerSelectHandlers();
        registerCardHandlers();
        registerModalHandlers();

        console.log('[ADMIN-DASHBOARD-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    // ============================================
    // NAVIGATION & SECTION SCROLLING
    // ============================================

    function registerNavigationHandlers() {
        // onclick="scrollToSection('adminPanel')"
        const adminPanelCard = document.querySelector('[data-scroll-target="adminPanel"]');
        if (adminPanelCard) {
            adminPanelCard.addEventListener('click', () => scrollToSection('adminPanel'));
        }

        // onclick="scrollToSection('modulos-admin')"
        const modulosCard = document.querySelector('[data-scroll-target="modulos-admin"]');
        if (modulosCard) {
            modulosCard.addEventListener('click', () => scrollToSection('modulos-admin'));
        }

        // onclick="scrollToSection('seguridad')"
        const seguridadCard = document.querySelector('[data-scroll-target="seguridad"]');
        if (seguridadCard) {
            seguridadCard.addEventListener('click', () => scrollToSection('seguridad'));
        }
    }

    // ============================================
    // MODAL & INFO HANDLERS
    // ============================================

    function registerModalHandlers() {
        // data-action="show-info-modal"
        const infoModalTrigger = document.querySelector('[data-action="showInfoModal"]');
        if (infoModalTrigger) {
            infoModalTrigger.addEventListener('click', showInfoModal);
        }

        // data-action="show-change-password-modal"
        const changePasswordBtn = document.querySelector('[data-action="showChangePasswordModal"]');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', showChangePasswordModal);
        }

        // data-action="show-statistics-config-modal"
        const statsConfigBtn = document.querySelector('[data-action="showStatisticsConfigModal"]');
        if (statsConfigBtn) {
            statsConfigBtn.addEventListener('click', showStatisticsConfigModal);
        }
    }

    // ============================================
    // BUTTON HANDLERS
    // ============================================

    function registerButtonHandlers() {
        // data-action="login-admin"
        const loginBtn = document.querySelector('[data-action="loginAdmin"]');
        if (loginBtn) {
            loginBtn.addEventListener('click', loginAdmin);
        }

        // data-action="logout-admin"
        const logoutBtn = document.querySelector('[data-action="logoutAdmin"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutAdmin);
        }

        // data-action="update-password"
        const updatePwdBtn = document.querySelector('[data-action="updatePassword"]');
        if (updatePwdBtn) {
            updatePwdBtn.addEventListener('click', updatePassword);
        }

        // data-action="refresh-dashboard"
        const refreshBtn = document.querySelector('[data-action="refreshDashboard"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshDashboard);
        }

        // data-action="open-notification-panel"
        // ⚠️ DESHABILITADO (11 NOV 2025): El evento delegado en admin-dashboard.html línea 6327-6349
        // ya está manejando openNotificationPanel. Agregar listener aquí causa duplicación (modal abierto 2 veces)
        // const notifPanelBtn = document.querySelector('[data-action="openNotificationPanel"]');
        // if (notifPanelBtn) {
        //     notifPanelBtn.addEventListener('click', openNotificationPanel);
        // }

        // data-action="reload-students"
        const reloadStudentsBtn = document.querySelector('[data-action="reloadStudents"]');
        if (reloadStudentsBtn) {
            reloadStudentsBtn.addEventListener('click', reloadStudents);
        }

        // onclick="dashboardCharts.refreshAll()"
        const refreshChartsBtn = document.querySelector('[data-action="refreshCharts"]');
        if (refreshChartsBtn) {
            refreshChartsBtn.addEventListener('click', () => {
                if (window.dashboardCharts) {
                    window.dashboardCharts.refreshAll();
                }
            });
        }

        // onclick="advancedMetrics?.updateRealTimeMetrics()"
        const updateMetricsBtn = document.querySelector('[data-action="updateRealTimeMetrics"]');
        if (updateMetricsBtn) {
            updateMetricsBtn.addEventListener('click', () => {
                if (window.advancedMetrics) {
                    window.advancedMetrics.updateRealTimeMetrics();
                }
            });
        }

        // onclick="advancedMetrics?.exportWidget('all')"
        const exportWidgetBtn = document.querySelector('[data-action="exportWidget"]');
        if (exportWidgetBtn) {
            exportWidgetBtn.addEventListener('click', () => {
                if (window.advancedMetrics) {
                    window.advancedMetrics.exportWidget('all');
                }
            });
        }
    }

    // ============================================
    // FORM HANDLERS
    // ============================================

    function registerFormHandlers() {
        // data-action="save-statistics-config"
        const saveStatsBtn = document.querySelector('[data-action="saveStatisticsConfig"]');
        if (saveStatsBtn) {
            saveStatsBtn.addEventListener('click', saveStatisticsConfig);
        }
    }

    // ============================================
    // SELECT/DROPDOWN HANDLERS
    // ============================================

    function registerSelectHandlers() {
        // onchange="globalEventCalendar?.applyFilters({categoria: this.value})"
        const categoriaFilter = document.getElementById('calendarCategoriaFilter');
        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', function() {
                if (window.globalEventCalendar) {
                    window.globalEventCalendar.applyFilters({ categoria: this.value });
                }
            });
        }

        // onchange="globalEventCalendar?.applyFilters({modalidad: this.value})"
        const modalidadFilter = document.getElementById('calendarModalidadFilter');
        if (modalidadFilter) {
            modalidadFilter.addEventListener('change', function() {
                if (window.globalEventCalendar) {
                    window.globalEventCalendar.applyFilters({ modalidad: this.value });
                }
            });
        }
    }

    // ============================================
    // CARD HOVER EFFECTS (Mouse Events)
    // ============================================

    function registerCardHandlers() {
        // Registrar hover effects en cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseover', function() {
                this.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseout', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // ============================================
    // FUNCTIONS THAT GET CALLED BY EVENT HANDLERS
    // ============================================

    /**
     * Scroll a una sección específica del dashboard
     */
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            console.log('[ADMIN-DASHBOARD-EVENTS] Scrolling a sección:', sectionId);
        }
    }

    /**
     * Mostrar modal de información
     */
    function showInfoModal() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Mostrando modal de información');
        // Implementar según necesidad del proyecto
        if (window.showInfoModal) {
            window.showInfoModal();
        }
    }

    /**
     * Mostrar modal de cambio de contraseña
     */
    function showChangePasswordModal() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Mostrando modal de cambio de contraseña');
        if (window.showChangePasswordModal) {
            window.showChangePasswordModal();
        }
    }

    /**
     * Mostrar modal de configuración de estadísticas
     */
    function showStatisticsConfigModal() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Mostrando modal de configuración de estadísticas');
        if (window.showStatisticsConfigModal) {
            window.showStatisticsConfigModal();
        }
    }

    /**
     * Login de admin
     */
    function loginAdmin() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Iniciando sesión de admin');
        if (window.loginAdmin) {
            window.loginAdmin();
        }
    }

    /**
     * Logout de admin
     */
    function logoutAdmin() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Cerrando sesión de admin');
        if (window.logoutAdmin) {
            window.logoutAdmin();
        }
    }

    /**
     * Actualizar contraseña
     */
    function updatePassword() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Actualizando contraseña');
        if (window.updatePassword) {
            window.updatePassword();
        }
    }

    /**
     * Refrescar dashboard
     */
    function refreshDashboard() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Refrescando dashboard');
        if (window.refreshDashboard) {
            window.refreshDashboard();
        }
    }

    /**
     * Abrir panel de notificaciones
     */
    function openNotificationPanel() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Abriendo panel de notificaciones');
        if (window.openNotificationPanel) {
            window.openNotificationPanel();
        }
    }

    /**
     * Recargar lista de estudiantes
     */
    function reloadStudents() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Recargando estudiantes');
        if (window.reloadStudents) {
            window.reloadStudents();
        }
    }

    /**
     * Guardar configuración de estadísticas
     */
    function saveStatisticsConfig() {
        console.log('[ADMIN-DASHBOARD-EVENTS] Guardando configuración de estadísticas');
        if (window.saveStatisticsConfig) {
            window.saveStatisticsConfig();
        }
    }

    // ============================================
    // EXPORT (if needed by other modules)
    // ============================================

    // Hacer disponible globalmente si es necesario
    window.adminDashboardEvents = {
        scrollToSection,
        showInfoModal,
        showChangePasswordModal,
        showStatisticsConfigModal,
        loginAdmin,
        logoutAdmin,
        updatePassword,
        refreshDashboard,
        openNotificationPanel,
        reloadStudents,
        saveStatisticsConfig
    };

})();
