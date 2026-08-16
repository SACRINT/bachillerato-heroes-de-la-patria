/**
 * 🔐 UNIFIED LOGIN HANDLER
 *
 * Maneja clicks en elementos que deben abrir el modal unificado de login
 * o cerrar sesión desde cualquier punto de la interfaz.
 * Reemplaza el antiguo admin-auth.js modal system
 *
 * Uso: 
 * - data-action="open-unified-login" para abrir modal de login
 * - data-action="logout-admin-panel" para cerrar sesión administrativa
 */

(function() {
    'use strict';

    // Función global unificada de logout administrativo
    window.logoutAdminPanel = function() {
        if (window.unifiedLogin && typeof window.unifiedLogin.logout === 'function') {
            window.unifiedLogin.logout();
        } else if (window.unifiedAuthManager && typeof window.unifiedAuthManager.logout === 'function') {
            window.unifiedAuthManager.logout();
        } else if (window.SimpleAuth && typeof window.SimpleAuth.logout === 'function') {
            window.SimpleAuth.logout();
        } else {
            // Limpieza exhaustiva de emergencia
            const ALL_AUTH_STORAGE_KEYS = [
                'bge_auth_token', 'authToken', 'auth_token', 'token', 'admin_token',
                'student_auth_token', 'teachers_auth_token', 'parent_auth_token',
                'bge_refresh_token', 'refreshToken',
                'bge_auth_user', 'bge_user_data', 'userData', 'auth_user', 'currentUser',
                'current_student', 'current_parent', 'current_teacher',
                'bge_auth_session', 'secure_admin_session', 'auth_expires', 'bge_auth_expiry',
                'redirect_after_login'
            ];
            ALL_AUTH_STORAGE_KEYS.forEach(k => {
                try {
                    localStorage.removeItem(k);
                    sessionStorage.removeItem(k);
                } catch (e) {}
            });
            try {
                document.cookie.split(";").forEach(function (c) {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            } catch (e) {}
            window.location.href = 'index.html';
        }
    };
    window.logoutAdmin = window.logoutAdminPanel;

    // Helper para abrir login de forma segura sin alertas falsas
    function openLoginSafe() {
        if (window.unifiedLogin && typeof window.unifiedLogin.showModal === 'function') {
            window.unifiedLogin.showModal();
            return;
        }

        if (window.UnifiedAuthSystem) {
            try {
                window.unifiedLogin = new window.UnifiedAuthSystem();
                window.unifiedLogin.showModal();
                return;
            } catch (e) {
                console.error('[UNIFIED-LOGIN-HANDLER] Error instanciando UnifiedAuthSystem:', e);
            }
        }

        const modalEl = document.getElementById('unified-auth-modal');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
            return;
        }

        // Fallback elegante a la página de login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Esperar a que el documento esté listo
    function setupHandler() {
        // Event delegation global para acciones de auth
        document.addEventListener('click', function(e) {
            const openLoginBtn = e.target.closest('[data-action="open-unified-login"]');
            if (openLoginBtn) {
                e.preventDefault();
                openLoginSafe();
                return;
            }

            const logoutAdminBtn = e.target.closest('[data-action="logout-admin-panel"]') || e.target.closest('#logoutBtn');
            if (logoutAdminBtn) {
                e.preventDefault();
                window.logoutAdminPanel();
                return;
            }
        }, false);
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupHandler);
    } else {
        setupHandler();
    }
})();
