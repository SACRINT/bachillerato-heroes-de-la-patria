/**
 * 🔒 DASHBOARD SECURITY CHECK - Verificación complementaria de autenticación
 * Integrado con el sistema universal de sesión administrativa
 */

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const hasAuth = typeof window.checkAdminSession === 'function' ? window.checkAdminSession() : false;
        if (!hasAuth) {
            console.warn('[DASHBOARD-SECURITY] No se detectó sesión administrativa activa. Redirigiendo a login...');
            if (document.documentElement) {
                document.documentElement.style.display = 'none';
            }
            try {
                sessionStorage.setItem('redirect_after_login', 'admin-dashboard.html');
            } catch (e) {}
            window.location.replace('login.html?redirect=admin-dashboard.html');
        }
    }, 500);
});
