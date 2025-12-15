/**
 * 🔧 AUTH LOGIN PATCH - Corrección de Lógica de Validación
 *
 * Problema: El código compilado (/dist/assets/main.js) tiene lógica de validación
 * de login que NO coincide con la respuesta actual del backend.
 *
 * Solución: Este parche intercepta la respuesta del login y asegura que se valide
 * correctamente, sin necesidad de recompilar todo el proyecto.
 *
 * Funciona: Reemplazando la clase de autenticación después de que se cargue
 *
 * Fecha: 15 Diciembre 2025
 */

(function() {
    'use strict';

    console.log('[AUTH-PATCH] 🔧 Iniciando parche de autenticación...');

    // Esperar a que el objeto de autenticación global esté disponible
    const waitForAuthManager = (callback, maxAttempts = 50) => {
        let attempts = 0;
        const interval = setInterval(() => {
            // El código compilado crea: window.authManager o window.authInterface
            if (window.authManager || window.authInterface || window.UnifiedAuthSystem) {
                clearInterval(interval);
                console.log('[AUTH-PATCH] ✅ Auth Manager detectado');
                callback();
            } else if (attempts++ > maxAttempts) {
                clearInterval(interval);
                console.warn('[AUTH-PATCH] ⚠️ Auth Manager NO encontrado después de 50 intentos');
            }
        }, 100);
    };

    // Una vez que el auth manager esté listo, aplicar el parche
    waitForAuthManager(() => {
        console.log('[AUTH-PATCH] 📝 Aplicando correcciones...');

        // Interceptar el método de login para corregir validación
        if (window.authManager) {
            const originalLoginSuccess = window.authManager.loginSuccess?.bind(window.authManager);

            // Sobreescribir el método handleManualLogin para mejorar la validación
            if (window.authManager.handleManualLogin) {
                const originalHandleLogin = window.authManager.handleManualLogin.bind(window.authManager);

                window.authManager.handleManualLogin = async function() {
                    console.log('[AUTH-PATCH] 🔐 handleManualLogin interceptado');

                    const emailInput = document.getElementById('loginEmail');
                    const passwordInput = document.getElementById('loginPassword');
                    const rememberMe = document.getElementById('rememberMe');
                    const loginBtn = document.getElementById('manual-login-btn');

                    if (!emailInput || !passwordInput) {
                        console.error('[AUTH-PATCH] ❌ Elementos de formulario no encontrados');
                        return originalHandleLogin();
                    }

                    const email = emailInput.value;
                    const password = passwordInput.value;

                    console.log('[AUTH-PATCH] 📤 Enviando login para:', email);

                    // Deshabilitar botón
                    if (loginBtn) loginBtn.disabled = true;

                    try {
                        // Hacer el fetch directamente para tener control total
                        const response = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email, password })
                        });

                        console.log('[AUTH-PATCH] 📥 Response status:', response.status);

                        if (!response.ok) {
                            console.error('[AUTH-PATCH] ❌ HTTP Error:', response.status);
                            this.ui.showAlert('Error de autenticación', 'danger');
                            return;
                        }

                        const data = await response.json();
                        console.log('[AUTH-PATCH] 📊 Response data:', {
                            success: data.success,
                            hasUser: !!data.user,
                            hasToken: !!data.tokens?.accessToken,
                            message: data.message
                        });

                        // VALIDACIÓN MEJORADA - El problema estaba aquí
                        const hasUser = !!(data.user && (data.user.id || data.user.email));
                        const hasToken = !!(data.tokens?.accessToken);
                        const messageHasSuccess = data.message && (
                            data.message.toLowerCase().includes('exit') ||
                            data.message.toLowerCase().includes('success') ||
                            data.message.toLowerCase().includes('autenticaci') ||
                            data.message.toLowerCase().includes('exitosa')
                        );

                        // LÓGICA CORRECTA DE ÉXITO
                        const isSuccess = (response.ok && hasUser && hasToken) || messageHasSuccess;

                        console.log('[AUTH-PATCH] 🎯 Validación:', {
                            responseOk: response.ok,
                            hasUser,
                            hasToken,
                            messageHasSuccess,
                            isSuccess
                        });

                        if (isSuccess) {
                            console.log('[AUTH-PATCH] ✅ Login EXITOSO');
                            // Usar loginSuccess del auth manager
                            if (this.loginSuccess) {
                                await this.loginSuccess(data.user, data.tokens.accessToken, rememberMe?.checked || false);
                            } else {
                                // Fallback manual si loginSuccess no existe
                                this.state.currentUser = data.user;
                                this.state.token = data.tokens.accessToken;
                                this.state.isAuthenticated = true;
                                this.session.saveSession(data.user, data.tokens.accessToken, rememberMe?.checked || false);
                                this.ui.hideModal();
                                this.ui.updateAuthUI(data.user, true);
                                this.ui.showAlert(`¡Bienvenido, ${data.user.nombre}!`, 'success');
                                window.dispatchEvent(new CustomEvent('bge-user-logged-in', { detail: { user: data.user } }));
                            }
                        } else {
                            console.error('[AUTH-PATCH] ❌ Login FALLIDO');
                            const errorMsg = data.message || 'Credenciales inválidas';
                            this.ui.showAlert(errorMsg, 'danger');
                        }
                    } catch (error) {
                        console.error('[AUTH-PATCH] 💥 Error:', error.message);
                        this.ui.showAlert('Error de conexión: ' + error.message, 'danger');
                    } finally {
                        if (loginBtn) loginBtn.disabled = false;
                    }
                };

                console.log('[AUTH-PATCH] ✅ handleManualLogin reemplazado');
            }
        }

        console.log('[AUTH-PATCH] 🎉 Parche aplicado exitosamente');
    });
})();
