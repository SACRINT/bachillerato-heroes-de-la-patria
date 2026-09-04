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

    const ADMIN_ROLES = [
        'admin', 'administrativo', 'directivo', 'administrator',
        'director', 'subdirector', 'coordinador', 'superadmin'
    ];

    const ALL_AUTH_STORAGE_KEYS = [
        'adminSession', 'secure_admin_session', 'admin_session',
        'bge_auth_token', 'authToken', 'auth_token', 'token', 'admin_token',
        'student_auth_token', 'teachers_auth_token', 'parent_auth_token',
        'bge_refresh_token', 'refreshToken',
        'bge_auth_user', 'bge_user_data', 'userData', 'auth_user', 'currentUser',
        'current_student', 'current_parent', 'current_teacher',
        'bge_auth_session', 'auth_expires', 'bge_auth_expiry',
        'redirect_after_login', 'adminAuth_attempts', 'adminAuth_lockout'
    ];

    function purgeAllAuthStorage() {
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
    }

    function validateAdminJwt(token) {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        try {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            let jsonPayload;
            try {
                jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            } catch (e) {
                jsonPayload = atob(base64);
            }
            const payload = JSON.parse(jsonPayload);
            if (payload.exp && (payload.exp * 1000) < Date.now()) return null;
            const role = (payload.role || payload.tipo_usuario || '').toLowerCase();
            if (ADMIN_ROLES.includes(role)) return { valid: true, payload: payload, role: role };
            return null;
        } catch (e) {
            return null;
        }
    }

    function checkActiveAdminSession() {
        if (typeof window.checkAdminSession === 'function') {
            return window.checkAdminSession();
        }
        const tokenCandidates = [
            sessionStorage.getItem('bge_auth_token'),
            localStorage.getItem('bge_auth_token'),
            sessionStorage.getItem('authToken'),
            localStorage.getItem('authToken'),
            sessionStorage.getItem('token'),
            localStorage.getItem('token')
        ];
        const adminSessionStr = sessionStorage.getItem('adminSession') || localStorage.getItem('adminSession');
        if (adminSessionStr) {
            try {
                const parsed = JSON.parse(adminSessionStr);
                if (parsed && parsed.token) tokenCandidates.unshift(parsed.token);
            } catch (e) {}
        }
        for (let i = 0; i < tokenCandidates.length; i++) {
            const candidate = tokenCandidates[i];
            if (candidate && validateAdminJwt(candidate)) {
                return true;
            }
        }
        // Si no tiene JWT administrativo válido, purgar residuo admin
        try {
            localStorage.removeItem('adminSession');
            sessionStorage.removeItem('adminSession');
            localStorage.removeItem('secure_admin_session');
            sessionStorage.removeItem('secure_admin_session');
            localStorage.removeItem('admin_session');
        } catch (e) {}
        return false;
    }

    // Función global unificada de logout administrativo
    window.logoutAdminPanel = function() {
        // Ejecutar siempre limpieza total de storages
        purgeAllAuthStorage();

        if (window.unifiedLogin && typeof window.unifiedLogin.logout === 'function') {
            try { window.unifiedLogin.logout(); } catch (e) {}
        }
        if (window.unifiedAuthManager && typeof window.unifiedAuthManager.logout === 'function') {
            try { window.unifiedAuthManager.logout(); } catch (e) {}
        }
        if (window.SimpleAuth && typeof window.SimpleAuth.logout === 'function') {
            try { window.SimpleAuth.logout(); } catch (e) {}
        }

        window.location.href = 'index.html';
    };
    window.logoutAdmin = window.logoutAdminPanel;

    // Helper para abrir login de forma segura sin alertas falsas
    function openLoginSafe() {
        // 1. Si ya existe una instancia activa con showModal o sus managers
        if (window.unifiedLogin) {
            if (typeof window.unifiedLogin.showModal === 'function') {
                window.unifiedLogin.showModal();
                return;
            }
            if (window.unifiedLogin.managers?.ui && typeof window.unifiedLogin.managers.ui.showModal === 'function') {
                window.unifiedLogin.managers.ui.showModal();
                return;
            }
            if (window.unifiedLogin.managers?.manual && typeof window.unifiedLogin.managers.manual.openModalSafe === 'function') {
                window.unifiedLogin.managers.manual.openModalSafe();
                return;
            }
        }

        // 2. Si UnifiedAuthSystem es una clase constructora
        if (typeof window.UnifiedAuthSystem === 'function') {
            try {
                window.unifiedLogin = new window.UnifiedAuthSystem();
                if (window.unifiedLogin && typeof window.unifiedLogin.showModal === 'function') {
                    window.unifiedLogin.showModal();
                    return;
                }
            } catch (e) {
                console.warn('[UNIFIED-LOGIN-HANDLER] Error instanciando UnifiedAuthSystem:', e);
            }
        }

        // 3. Si UnifiedAuthSystem ya es una instancia (ej. exportada por main.js)
        if (window.UnifiedAuthSystem && typeof window.UnifiedAuthSystem.showModal === 'function') {
            window.unifiedLogin = window.UnifiedAuthSystem;
            window.UnifiedAuthSystem.showModal();
            return;
        }
        if (window.UnifiedAuthSystem && window.UnifiedAuthSystem.ui && typeof window.UnifiedAuthSystem.ui.showModal === 'function') {
            window.UnifiedAuthSystem.ui.showModal();
            return;
        }

        // 4. Si authInterface o authManager existen (main.js)
        if (window.authInterface && typeof window.authInterface.showLoginModal === 'function') {
            window.authInterface.showLoginModal();
            return;
        }
        if (window.authManager && window.authManager.ui && typeof window.authManager.ui.showModal === 'function') {
            window.authManager.ui.showModal();
            return;
        }

        // 5. Fallback a Bootstrap Modal directo
        const modalEl = document.getElementById('unified-auth-modal') || document.getElementById('loginModal');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
            return;
        }

        // 6. Fallback elegante a la página de login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Manejador global para asegurar sincronización y redirección cuando un admin inicia sesión
    window.addEventListener('bge-user-logged-in', function(e) {
        const user = e.detail?.user;
        if (!user) return;

        const role = (user.role || user.tipo_usuario || '').toLowerCase();
        if (role === 'admin' || role === 'administrativo' || role === 'directivo' || role === 'administrator') {
            const token = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token') ||
                          localStorage.getItem('authToken') || sessionStorage.getItem('authToken') ||
                          localStorage.getItem('token') || sessionStorage.getItem('token') || '';

            const adminSessionData = {
                username: user.username || user.email,
                role: role,
                name: user.nombre ? `${user.nombre} ${user.apellido_paterno || ''}`.trim() : (user.username || 'Administrador'),
                token: token,
                isAuthenticated: true,
                loginTime: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000)
            };

            const adminStr = JSON.stringify(adminSessionData);
            const userStr = JSON.stringify(user);

            try {
                localStorage.setItem('adminSession', adminStr);
                sessionStorage.setItem('adminSession', adminStr);
                localStorage.setItem('secure_admin_session', adminStr);
                sessionStorage.setItem('secure_admin_session', adminStr);
                localStorage.setItem('bge_auth_user', userStr);
                sessionStorage.setItem('bge_auth_user', userStr);
                localStorage.setItem('bge_user_data', userStr);
                sessionStorage.setItem('bge_user_data', userStr);
                if (token) {
                    localStorage.setItem('bge_auth_token', token);
                    sessionStorage.setItem('bge_auth_token', token);
                    localStorage.setItem('authToken', token);
                    sessionStorage.setItem('authToken', token);
                    localStorage.setItem('token', token);
                    sessionStorage.setItem('token', token);
                }
            } catch (err) {
                console.warn('[UNIFIED-LOGIN-HANDLER] Error guardando adminSession:', err);
            }

            // Ocultar modales y backdrop
            const modalEls = document.querySelectorAll('#unified-auth-modal, #loginModal');
            modalEls.forEach(m => {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const inst = bootstrap.Modal.getInstance(m);
                    if (inst) inst.hide();
                }
                m.classList.remove('show');
                m.style.display = 'none';
            });
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // Si no estamos en admin-dashboard.html ni en docentes.html, redirigir al admin dashboard
            if (!window.location.pathname.includes('admin-dashboard.html') &&
                !window.location.pathname.includes('docentes.html')) {
                setTimeout(function() {
                    window.location.href = 'admin-dashboard.html';
                }, 600);
            }
        }
    });

    // Esperar a que el documento esté listo
    function setupHandler() {
        // Event delegation global para acciones de auth
        document.addEventListener('click', function(e) {
            const openLoginBtn = e.target.closest('[data-action="open-unified-login"]');
            if (openLoginBtn) {
                e.preventDefault();
                // Comprobación estricta de sesión administrativa real mediante JWT
                const isAlreadyAdmin = checkActiveAdminSession();

                if (isAlreadyAdmin) {
                    if (!window.location.pathname.includes('admin-dashboard.html')) {
                        window.location.href = 'admin-dashboard.html';
                    }
                    return;
                }

                // Si NO hay sesión de administrador real y activa, abrir modal de credenciales
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
