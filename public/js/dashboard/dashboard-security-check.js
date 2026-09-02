/**
 * 🔒 DASHBOARD SECURITY CHECK - Verificación adicional de autenticación al cargar DOM
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

// Verificación adicional cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        let isAuthenticated = false;

        const token = localStorage.getItem('bge_auth_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('bge_auth_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
        const rawUser = localStorage.getItem('bge_auth_user') || localStorage.getItem('auth_user') || sessionStorage.getItem('bge_auth_user');
        const authSession = localStorage.getItem('bge_auth_session') || sessionStorage.getItem('bge_auth_session');

        if (authSession) {
            try {
                const sessionData = JSON.parse(authSession);
                const role = sessionData.role || (sessionData.user && sessionData.user.role);
                if (!role || ['admin', 'administrativo', 'directivo', 'administrator'].includes(role.toLowerCase())) {
                    isAuthenticated = true;
                }
            } catch (e) {
                isAuthenticated = true;
            }
        }

        if (!isAuthenticated && token && rawUser) {
            try {
                const user = JSON.parse(rawUser);
                const role = user.role || (user.user && user.user.role);
                if (role === 'admin' || role === 'administrativo' || role === 'directivo') {
                    isAuthenticated = true;
                }
            } catch (e) {}
        }

        if (!isAuthenticated && window.secureAdminAuth && typeof window.secureAdminAuth.isUserAuthenticated === 'function') {
            isAuthenticated = window.secureAdminAuth.isUserAuthenticated();
        }

        if (!isAuthenticated) {
            const session = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    if (sessionData.isAuthenticated || (sessionData.expiresAt && Date.now() < sessionData.expiresAt)) {
                        isAuthenticated = true;
                    }
                } catch (e) {}
            }
        }

        if (!isAuthenticated) {
            window.location.href = 'index.html';
        }
    }, 200);
});
