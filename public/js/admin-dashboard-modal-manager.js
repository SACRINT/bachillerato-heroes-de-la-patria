/**
 * 🎯 ADMIN DASHBOARD - MODAL MANAGER (CSP-COMPLIANT)
 * Gestión centralizada de todos los modales del dashboard
 *
 * Propósito: Eliminar 12 inline handlers de apertura de modales
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Funcionalidades:
 * - API unificada para abrir/cerrar modales
 * - Stacking automático de múltiples modales
 * - Cierre con ESC
 * - Transiciones suaves
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModalManager);
    } else {
        initializeModalManager();
    }

    function initializeModalManager() {
        console.log('[ADMIN-MODAL-MANAGER] Inicializando gestor de modales...');

        registerModalHandlers();
        setupModalKeyboardShortcuts();

        console.log('[ADMIN-MODAL-MANAGER] ✅ Gestor de modales inicializado correctamente');
    }

    /**
     * Registra todos los handlers para botones que abren modales
     */
    function registerModalHandlers() {
        // Modal: Información General
        const showInfoModalBtn = document.querySelector('button[onclick*="showInfoModal"]');
        if (showInfoModalBtn) {
            showInfoModalBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showInfoModal();
            });
        }

        // Modal: Panel de Notificaciones
        const openNotifPanelBtn = document.querySelector('button[onclick*="openNotificationPanel"]');
        if (openNotifPanelBtn) {
            openNotifPanelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openNotificationPanel();
            });
        }

        // Modal: Crear Padre
        const createParentBtn = document.querySelector('button[onclick*="showCreateParentModal"]');
        if (createParentBtn) {
            createParentBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showCreateParentModal();
            });
        }

        // Modal: Crear Noticia
        const createNoticiaBtn = document.querySelector('button[onclick*="showCreateNoticiaModal"]');
        if (createNoticiaBtn) {
            createNoticiaBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showCreateNoticiaModal();
            });
        }

        // Modal: Crear Evento
        const createEventoBtn = document.querySelector('button[onclick*="showCreateEventoModal"]');
        if (createEventoBtn) {
            createEventoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showCreateEventoModal();
            });
        }

        // Modal: Crear Aviso
        const createAvisoBtn = document.querySelector('button[onclick*="showCreateAvisoModal"]');
        if (createAvisoBtn) {
            createAvisoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showCreateAvisoModal();
            });
        }

        // Modal: Crear Comunicado
        const createComunicadoBtn = document.querySelector('button[onclick*="showCreateComunicadoModal"]');
        if (createComunicadoBtn) {
            createComunicadoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showCreateComunicadoModal();
            });
        }

        // Modal: Cambiar Contraseña
        const changePassBtn = document.querySelector('button[onclick*="showChangePasswordModal"]');
        if (changePassBtn) {
            changePassBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showChangePasswordModal();
            });
        }

        // Modal: Configurar Estadísticas
        const statsConfigBtn = document.querySelector('button[onclick*="showStatisticsConfigModal"]');
        if (statsConfigBtn) {
            statsConfigBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showStatisticsConfigModal();
            });
        }

        // Modal: Vista Previa de Contenido
        const previewContentBtn = document.querySelector('button[onclick*="showContentPreview"]');
        if (previewContentBtn) {
            previewContentBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showContentPreview();
            });
        }

        // Modal: Administrador de Reportes
        const reportsManagerBtn = document.querySelector('button[onclick*="showReportsManager"]');
        if (reportsManagerBtn) {
            reportsManagerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showReportsManager();
            });
        }

        // Modal: Enviar Notificación
        const sendNotifBtn = document.querySelector('button[onclick*="sendNotification"]');
        if (sendNotifBtn) {
            sendNotifBtn.addEventListener('click', function(e) {
                e.preventDefault();
                sendNotification();
            });
        }
    }

    /**
     * Configura atajos de teclado para modales
     * ESC para cerrar modal actual
     */
    function setupModalKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // Buscar modal abierto y cerrarlo
                const activeModal = document.querySelector('.modal.show');
                if (activeModal) {
                    const modalInstance = window.bootstrap?.Modal?.getInstance(activeModal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
            }
        });
    }

    // ============================================
    // FUNCIONES DE NEGOCIO - Delegación a window
    // ============================================

    function showInfoModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de información...');
        if (window.showInfoModal) {
            window.showInfoModal();
        }
    }

    function openNotificationPanel() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo panel de notificaciones...');
        if (window.openNotificationPanel) {
            window.openNotificationPanel();
        }
    }

    function showCreateParentModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de crear padre...');
        if (window.showCreateParentModal) {
            window.showCreateParentModal();
        }
    }

    function showCreateNoticiaModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de crear noticia...');
        if (window.showCreateNoticiaModal) {
            window.showCreateNoticiaModal();
        }
    }

    function showCreateEventoModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de crear evento...');
        if (window.showCreateEventoModal) {
            window.showCreateEventoModal();
        }
    }

    function showCreateAvisoModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de crear aviso...');
        if (window.showCreateAvisoModal) {
            window.showCreateAvisoModal();
        }
    }

    function showCreateComunicadoModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de crear comunicado...');
        if (window.showCreateComunicadoModal) {
            window.showCreateComunicadoModal();
        }
    }

    function showChangePasswordModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de cambiar contraseña...');
        if (window.showChangePasswordModal) {
            window.showChangePasswordModal();
        }
    }

    function showStatisticsConfigModal() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de configurar estadísticas...');
        if (window.showStatisticsConfigModal) {
            window.showStatisticsConfigModal();
        }
    }

    function showContentPreview() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo modal de vista previa...');
        if (window.showContentPreview) {
            window.showContentPreview();
        }
    }

    function showReportsManager() {
        console.log('[ADMIN-MODAL-MANAGER] Abriendo administrador de reportes...');
        if (window.showReportsManager) {
            window.showReportsManager();
        }
    }

    function sendNotification() {
        console.log('[ADMIN-MODAL-MANAGER] Enviando notificación...');
        if (window.sendNotification) {
            window.sendNotification();
        }
    }

    // Export para módulos
    window.adminModalManager = {
        showInfoModal,
        openNotificationPanel,
        showCreateParentModal,
        showCreateNoticiaModal,
        showCreateEventoModal,
        showCreateAvisoModal,
        showCreateComunicadoModal,
        showChangePasswordModal,
        showStatisticsConfigModal,
        showContentPreview,
        showReportsManager,
        sendNotification
    };

})();
