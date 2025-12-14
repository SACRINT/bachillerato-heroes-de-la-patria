/**
 * 🔒 DASHBOARD SECURITY CHECK - Verificación adicional de autenticación al cargar DOM
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

// Verificación adicional cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔒 [DASHBOARD SECURITY] Verificación adicional de autenticación...');

    // Verificar nuevamente el estado de autenticación
    setTimeout(() => {
        let isAuthenticated = false;

        // Verificar con el sistema de autenticación si está disponible
        if (window.secureAdminAuth && typeof window.secureAdminAuth.isUserAuthenticated === 'function') {
            isAuthenticated = window.secureAdminAuth.isUserAuthenticated();
            console.log('🔍 [DASHBOARD SECURITY] Verificación con secureAdminAuth:', isAuthenticated);
        } else {
            console.warn('⚠️ [DASHBOARD SECURITY] window.secureAdminAuth no disponible, estado:', window.secureAdminAuth);
            // Si secureAdminAuth no está disponible, intentar inicializarlo
            if (window.initSecureAuthSystem && typeof window.initSecureAuthSystem === 'function') {
                console.log('🔄 [DASHBOARD SECURITY] Inicializando sistema de autenticación...');
                window.initSecureAuthSystem();
                if (window.secureAdminAuth && typeof window.secureAdminAuth.isUserAuthenticated === 'function') {
                    isAuthenticated = window.secureAdminAuth.isUserAuthenticated();
                    console.log('🔍 [DASHBOARD SECURITY] Verificación tras inicialización:', isAuthenticated);
                }
            }
        }

        // Verificar localStorage como respaldo
        if (!isAuthenticated) {
            try {
                const session = localStorage.getItem('secure_admin_session');
                if (session) {
                    const sessionData = JSON.parse(session);
                    if (sessionData.token && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                        isAuthenticated = true;
                        console.log('✅ [DASHBOARD SECURITY] Sesión válida en localStorage');
                    } else {
                        console.log('⏰ [DASHBOARD SECURITY] Sesión expirada en localStorage');
                        localStorage.removeItem('secure_admin_session');
                    }
                }
            } catch (error) {
                console.warn('❌ [DASHBOARD SECURITY] Error verificando localStorage:', error);
            }
        }

        if (!isAuthenticated) {
            console.log('🚫 [DASHBOARD SECURITY] Acceso denegado - Usuario no autenticado');
            window.location.href = 'index.html';
        } else {
            console.log('✅ [DASHBOARD SECURITY] Acceso confirmado - Usuario autenticado');
        }
    }, 100); // Verificación más rápida ya que el contenido ya fue validado
});
