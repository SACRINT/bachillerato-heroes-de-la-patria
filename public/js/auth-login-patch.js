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

(function () {
    'use strict';

    

    // Esperar a que el objeto de autenticación global esté disponible
    const waitForAuthManager = (callback, maxAttempts = 50) => {
        let attempts = 0;
        const interval = setInterval(() => {
            // El código compilado crea: window.authManager o window.authInterface
            if (window.authManager || window.authInterface || window.UnifiedAuthSystem) {
                clearInterval(interval);
                
                callback();
            } else if (attempts++ > maxAttempts) {
                clearInterval(interval);
                
            }
        }, 100);
    };

    // Una vez que el auth manager esté listo, aplicar el parche
    waitForAuthManager(() => {
        

        // Interceptar el método de login para corregir validación
        if (window.authManager) {
            const originalLoginSuccess = window.authManager.loginSuccess?.bind(window.authManager);

            // Sobreescribir el método handleManualLogin para mejorar la validación
            if (window.authManager.handleManualLogin) {
                const originalHandleLogin = window.authManager.handleManualLogin.bind(window.authManager);

                window.authManager.handleManualLogin = async function () {
                    

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

                        

                        if (!response.ok) {
                            console.error('[AUTH-PATCH] ❌ HTTP Error:', response.status);
                            this.ui.showAlert('Error de autenticación', 'danger');
                            return;
                        }

                        const data = await response.json();
                        

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

                        

                        if (isSuccess) {
                            

                            // 1. Intentar usar el método nativo V2 (UnifiedAuthSystem)
                            if (this.processLogin) {
                                
                                await this.processLogin(data.user, data.tokens.accessToken, rememberMe?.checked || false);
                            }
                            // 2. Intentar usar método legacy
                            else if (this.loginSuccess) {
                                
                                await this.loginSuccess(data.user, data.tokens.accessToken, rememberMe?.checked || false);
                            }
                            // 3. Fallback manual (si no existen métodos)
                            else {
                                
                                this.state.currentUser = data.user;
                                this.state.token = data.tokens.accessToken;
                                this.state.isAuthenticated = true;
                                this.session.saveSession(data.user, data.tokens.accessToken, rememberMe?.checked || false);
                                this.ui.hideModal();
                                this.ui.updateAuthUI(); // Corregido: sin argumentos extra si no son necesarios
                                this.ui.showAlert(`¡Bienvenido, ${data.user.nombre}!`, 'success');
                                window.dispatchEvent(new CustomEvent('bge-user-logged-in', { detail: { user: data.user } }));

                                // ✅ REDIRECCIÓN ADMIN MANUAL (Critical Fix)
                                if (data.user.role === 'admin' || data.user.role === 'administrativo') {
                                    
                                    setTimeout(() => {
                                        window.location.href = 'admin-dashboard.html';
                                    }, 1000);
                                }
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

                
            }
        }

        
    });
})();
