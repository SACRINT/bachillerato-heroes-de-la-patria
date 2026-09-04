/**
 * 🔒 DASHBOARD SECURITY CHECK - Verificación complementaria de autenticación
 * Integrado con el sistema universal de sesión administrativa
 */

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        if (typeof window.checkAdminSession === 'function') {
            const hasAuth = window.checkAdminSession();
            if (!hasAuth) {
                console.warn('[DASHBOARD-SECURITY] No se detectó sesión administrativa activa.');
            }
            return;
        }

        // Fallback manual si window.checkAdminSession no estuviera disponible
        const token = localStorage.getItem('bge_auth_token') || localStorage.getItem('authToken') ||
                      localStorage.getItem('token') || localStorage.getItem('adminSession') ||
                      localStorage.getItem('secure_admin_session');

        if (!token) {
            console.warn('[DASHBOARD-SECURITY] Sesión no detectada.');
        }
    }, 500);
});
