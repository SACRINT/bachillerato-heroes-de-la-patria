/**
 * 🔒 DASHBOARD AUTH CHECK - Verificación de autenticación unificada
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function() {
    'use strict';
    console.log('🔒 [DASHBOARD AUTH] Verificación unificada de autenticación...');

    function isAuthenticated() {
        // Verificar sistema JWT (primary)
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.role === 'admin') {
                    console.log('✅ [DASHBOARD AUTH] Sistema JWT válido');
                    return true;
                }
            } catch (e) {
                console.warn('⚠️ [DASHBOARD AUTH] Error en JWT:', e);
            }
        }

        // Verificar sistema secure_admin_session (secondary)
        const secureSession = localStorage.getItem('secure_admin_session');
        if (secureSession) {
            try {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.isAuthenticated && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    console.log('✅ [DASHBOARD AUTH] Sistema secure_admin_session válido');
                    return true;
                }
            } catch (e) {
                console.warn('⚠️ [DASHBOARD AUTH] Error en secure session:', e);
            }
        }

        return false;
    }

    // Verificación inmediata pero NO intrusiva
    if (!isAuthenticated()) {
        console.log('❌ [DASHBOARD AUTH] No autenticado - Redirigiendo...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
        return;
    }

    console.log('✅ [DASHBOARD AUTH] Autenticación confirmada - Cargando dashboard');
})();
