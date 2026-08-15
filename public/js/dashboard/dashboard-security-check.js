/**
 * 🔒 DASHBOARD SECURITY CHECK - Verificación adicional de autenticación al cargar DOM
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

// Verificación adicional cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔒 [DASHBOARD SECURITY] Verificación adicional de autenticación...');
    console.log('🔍 [DASHBOARD SECURITY DEBUG] DOMReady Storage Check:');
    console.log('   - LS bge_auth_token:', localStorage.getItem('bge_auth_token') ? 'PRESENT' : 'MISSING');
    console.log('   - SS bge_auth_token:', sessionStorage.getItem('bge_auth_token') ? 'PRESENT' : 'MISSING');


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

        // Verificar authentication moderna y compatible
        if (!isAuthenticated) {
            const token = localStorage.getItem('bge_auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken') || sessionStorage.getItem('bge_auth_token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('authToken');
            const userData = localStorage.getItem('bge_auth_user') || localStorage.getItem('auth_user') || localStorage.getItem('userData') || localStorage.getItem('currentUser') || sessionStorage.getItem('bge_auth_user') || sessionStorage.getItem('auth_user') || sessionStorage.getItem('userData') || sessionStorage.getItem('currentUser');

            if (token && userData) {
                try {
                    const user = JSON.parse(userData);
                    const role = user.role || (user.user && user.user.role);

                    if (role === 'admin' || role === 'administrativo' || role === 'directivo') {
                        isAuthenticated = true;
                        console.log('✅ [DASHBOARD SECURITY] Sesión válida - Rol:', role);
                    }
                } catch (e) {
                    console.warn('⚠️ [DASHBOARD SECURITY] Error parsing auth data:', e);
                }
            }
        }

        // Verificar localStorage como respaldo (Legacy)
        if (!isAuthenticated) {
            try {
                const session = localStorage.getItem('secure_admin_session');
                if (session) {
                    const sessionData = JSON.parse(session);
                    if (sessionData.token && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                        isAuthenticated = true;
                        console.log('✅ [DASHBOARD SECURITY] Sesión válida en localStorage (Legacy)');
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
            // window.location.href = 'index.html';
            console.error('🚫 [DASHBOARD SECURITY] Acceso denegado - Usuario no autenticado (REDIRECCION DESACTIVADA POR DEBUG)');

            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'position:fixed;top:50px;right:0;width:400px;background:rgba(255,0,0,0.9);color:white;z-index:99999;padding:1rem;font-family:monospace;';
            errorMsg.innerHTML = `
                <h5>⛔ SECURITY CHECK FAILED</h5>
                <p>El script <code>dashboard-security-check.js</code> intentó redirigir.</p>
                <p>Verifica 'secure_admin_session' en Application > Local Storage.</p>
                <button onclick="window.location.href='index.html'">Ir a Inicio</button>
            `;
            document.body.appendChild(errorMsg);
        } else {
            console.log('✅ [DASHBOARD SECURITY] Acceso confirmado - Usuario autenticado');
        }
    }, 100); // Verificación más rápida ya que el contenido ya fue validado
});
