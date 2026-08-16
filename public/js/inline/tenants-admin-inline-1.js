(function () {
            'use strict';
            console.log('ðŸ”’ [TENANTS-ADMIN AUTH] Verificación de acceso SuperAdmin...');

            function isSuperAdmin() {
                const token = localStorage.getItem('authToken');
                const userData = localStorage.getItem('userData');

                if (token && userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user && (user.role === 'superadmin' || user.role === 'admin')) {
                            console.log('✅ [TENANTS-ADMIN AUTH] Acceso concedido:', user.role);
                            return true;
                        }
                    } catch (e) {
                        console.warn('âš ï¸ [TENANTS-ADMIN AUTH] Error:', e);
                    }
                }

                return false;
            }

            if (!isSuperAdmin()) {
                console.log('âŒ [TENANTS-ADMIN AUTH] No autorizado - Redirigiendo...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 100);
                return;
            }
        })();
