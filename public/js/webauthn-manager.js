/**
 * 🔐 WEBAUTHN MANAGER - SEMANA 25
 * Sistema completo de autenticación biométrica (FIDO2/WebAuthn)
 *
 * Features:
 * - Registro de dispositivos biométricos (Touch ID, Face ID, Windows Hello, YubiKey)
 * - Autenticación passwordless con biometría
 * - Gestión de múltiples dispositivos
 * - UI modales profesionales
 * - Compatible con @simplewebauthn/browser
 *
 * Uso:
 * ```javascript
 * const webauthnManager = new WebAuthnManager({ apiBaseUrl: '/api' });
 * await webauthnManager.init();
 *
 * // Registrar nuevo dispositivo
 * await webauthnManager.registerDevice('Mi iPhone - Touch ID');
 *
 * // Autenticar con biometría
 * const result = await webauthnManager.authenticate();
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

class WebAuthnManager {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || '/api',
            onSuccess: config.onSuccess || null,
            onError: config.onError || null,
            ...config
        };

        this.isAvailable = false;
        this.credentials = [];
    }

    /**
     * INICIALIZAR MANAGER
     */
    async init() {
        this.isAvailable = this.checkSupport();
        if (!this.isAvailable) {
            return;
        }
        await this.loadSimpleWebAuthn();
    }

    /**
     * VERIFICAR SOPORTE DE WEBAUTHN
     */
    checkSupport() {
        if (!window.PublicKeyCredential) {
            return false;
        }
        return true;
    }

    /**
     * CARGAR LIBRERÍA @simplewebauthn/browser
     */
    async loadSimpleWebAuthn() {
        if (window.SimpleWebAuthnBrowser) {
            this.SimpleWebAuthnBrowser = window.SimpleWebAuthnBrowser;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@simplewebauthn/browser@9.0.1/dist/bundle/index.umd.min.js';
            script.onload = () => {
                this.SimpleWebAuthnBrowser = window.SimpleWebAuthnBrowser;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load SimpleWebAuthnBrowser'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * REGISTRAR NUEVO DISPOSITIVO BIOMÉTRICO
     */
    async registerDevice(deviceName = 'Dispositivo Biométrico') {
        try {
            console.log('[WEBAUTHN] Iniciando registro de dispositivo:', deviceName);

            if (!this.isAvailable) {
                throw new Error('WebAuthn no está disponible en este navegador');
            }

            // Step 1: Get registration options from server
            const optionsResponse = await this.fetchWithAuth('/auth/webauthn/register/options', {
                method: 'POST'
            });

            if (!optionsResponse.success) {
                throw new Error(optionsResponse.error || 'Error al obtener opciones de registro');
            }

            const options = optionsResponse.options;

            console.log('[WEBAUTHN] Opciones de registro recibidas');

            // Step 2: Trigger WebAuthn registration ceremony
            const attestationResponse = await this.SimpleWebAuthnBrowser.startRegistration(options);

            console.log('[WEBAUTHN] Usuario completó registro biométrico');

            // Step 3: Send response to server for verification
            const verificationResponse = await this.fetchWithAuth('/auth/webauthn/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: attestationResponse,
                    deviceName
                })
            });

            if (!verificationResponse.success) {
                throw new Error(verificationResponse.error || 'Error al verificar registro');
            }

            console.log('[WEBAUTHN] ✅ Dispositivo registrado exitosamente');

            if (this.config.onSuccess) {
                this.config.onSuccess({ type: 'registration', deviceName });
            }

            return {
                success: true,
                message: 'Dispositivo biométrico registrado exitosamente',
                credentialId: verificationResponse.credentialId
            };

        } catch (error) {
            console.error('[WEBAUTHN] Error en registro:', error);

            if (this.config.onError) {
                this.config.onError({ type: 'registration', error });
            }

            throw error;
        }
    }

    /**
     * AUTENTICAR CON BIOMETRÍA
     */
    async authenticate(userId = null, rememberMe = false) {
        try {
            console.log('[WEBAUTHN] Iniciando autenticación biométrica');

            if (!this.isAvailable) {
                throw new Error('WebAuthn no está disponible en este navegador');
            }

            // Step 1: Get authentication options from server
            const optionsResponse = await fetch(`${this.config.apiBaseUrl}/auth/webauthn/authenticate/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const optionsData = await optionsResponse.json();

            if (!optionsData.success) {
                throw new Error(optionsData.error || 'Error al obtener opciones de autenticación');
            }

            const options = optionsData.options;

            console.log('[WEBAUTHN] Opciones de autenticación recibidas');

            // Step 2: Trigger WebAuthn authentication ceremony
            const assertionResponse = await this.SimpleWebAuthnBrowser.startAuthentication(options);

            console.log('[WEBAUTHN] Usuario completó autenticación biométrica');

            // Step 3: Send response to server for verification and token generation
            const verificationResponse = await fetch(`${this.config.apiBaseUrl}/auth/webauthn/authenticate/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: assertionResponse,
                    userId,
                    rememberMe
                })
            });

            const verificationData = await verificationResponse.json();

            if (!verificationData.success) {
                throw new Error(verificationData.error || 'Error al verificar autenticación');
            }

            console.log('[WEBAUTHN] ✅ Autenticación biométrica exitosa');

            if (this.config.onSuccess) {
                this.config.onSuccess({ type: 'authentication', user: verificationData.user });
            }

            return {
                success: true,
                user: verificationData.user,
                tokens: verificationData.tokens,
                sessionInfo: verificationData.sessionInfo
            };

        } catch (error) {
            console.error('[WEBAUTHN] Error en autenticación:', error);

            if (this.config.onError) {
                this.config.onError({ type: 'authentication', error });
            }

            throw error;
        }
    }

    /**
     * LISTAR DISPOSITIVOS REGISTRADOS
     */
    async listDevices() {
        try {
            const response = await this.fetchWithAuth('/auth/webauthn/credentials');

            if (!response.success) {
                throw new Error(response.error || 'Error al listar dispositivos');
            }

            this.credentials = response.credentials;

            return {
                success: true,
                credentials: response.credentials,
                count: response.count
            };

        } catch (error) {
            console.error('[WEBAUTHN] Error listando dispositivos:', error);
            throw error;
        }
    }

    /**
     * ELIMINAR DISPOSITIVO
     */
    async deleteDevice(credentialId) {
        try {
            const response = await this.fetchWithAuth(`/auth/webauthn/credentials/${credentialId}`, {
                method: 'DELETE'
            });

            if (!response.success) {
                throw new Error(response.error || 'Error al eliminar dispositivo');
            }

            // Remove from local cache
            this.credentials = this.credentials.filter(cred => cred.id !== credentialId);

            return {
                success: true,
                message: 'Dispositivo eliminado exitosamente'
            };

        } catch (error) {
            console.error('[WEBAUTHN] Error eliminando dispositivo:', error);
            throw error;
        }
    }

    /**
     * MOSTRAR MODAL DE REGISTRO
     */
    showRegistrationModal() {
        let modal = document.getElementById('webauthn-register-modal');

        if (!modal) {
            modal = this.createRegistrationModal();
            document.body.appendChild(modal);
        }

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Setup event listeners
        this.setupRegistrationModalListeners(bsModal);
    }

    /**
     * CREAR MODAL DE REGISTRO
     */
    createRegistrationModal() {
        const modal = document.createElement('div');
        modal.id = 'webauthn-register-modal';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 15px;">
                    <div class="modal-header bg-gradient text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <h5 class="modal-title">
                            <i class="fas fa-fingerprint me-2"></i>
                            Registrar Dispositivo Biométrico
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="webauthn-reg-alert" class="alert d-none" role="alert"></div>

                        <div class="text-center mb-4">
                            <i class="fas fa-mobile-screen-button" style="font-size: 4rem; color: #667eea;"></i>
                            <p class="mt-3">
                                Registra tu dispositivo para iniciar sesión de forma rápida y segura
                                usando tu huella digital, Face ID, Touch ID o Windows Hello.
                            </p>
                        </div>

                        <form id="webauthn-register-form">
                            <div class="mb-3">
                                <label for="device-name" class="form-label fw-bold">Nombre del Dispositivo</label>
                                <input type="text" class="form-control" id="device-name"
                                       placeholder="Ej: iPhone 14 - Touch ID"
                                       value="${this.getDefaultDeviceName()}"
                                       required>
                                <div class="form-text">Dale un nombre descriptivo para identificarlo</div>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Al hacer clic en "Registrar", se abrirá una ventana solicitando tu autenticación biométrica.
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2" id="start-registration-btn">
                                <i class="fas fa-fingerprint me-2"></i>
                                Registrar Dispositivo
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * CONFIGURAR LISTENERS DEL MODAL DE REGISTRO
     */
    setupRegistrationModalListeners(bsModal) {
        const form = document.getElementById('webauthn-register-form');
        const button = document.getElementById('start-registration-btn');
        const deviceNameInput = document.getElementById('device-name');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const deviceName = deviceNameInput.value.trim();

            if (!deviceName) {
                this.showRegAlert('Por favor ingresa un nombre para el dispositivo', 'warning');
                return;
            }

            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Registrando...';

            try {
                await this.registerDevice(deviceName);

                this.showRegAlert('¡Dispositivo registrado exitosamente!', 'success');

                setTimeout(() => {
                    bsModal.hide();
                }, 2000);

            } catch (error) {
                this.showRegAlert(error.message || 'Error al registrar dispositivo. Por favor intenta de nuevo.', 'danger');
            } finally {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-fingerprint me-2"></i> Registrar Dispositivo';
            }
        });
    }

    /**
     * MOSTRAR ALERT EN MODAL DE REGISTRO
     */
    showRegAlert(message, type) {
        const alert = document.getElementById('webauthn-reg-alert');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.classList.remove('d-none');

        setTimeout(() => alert.classList.add('d-none'), 5000);
    }

    /**
     * OBTENER NOMBRE POR DEFECTO DEL DISPOSITIVO
     */
    getDefaultDeviceName() {
        const ua = navigator.userAgent;

        if (/iPhone/.test(ua)) return 'iPhone - Touch ID';
        if (/iPad/.test(ua)) return 'iPad - Face ID';
        if (/Macintosh/.test(ua)) return 'MacBook - Touch ID';
        if (/Windows NT/.test(ua)) return 'PC - Windows Hello';
        if (/Android/.test(ua)) return 'Android - Fingerprint';

        return 'Dispositivo Biométrico';
    }

    /**
     * FETCH CON AUTENTICACIÓN
     */
    async fetchWithAuth(endpoint, options = {}) {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');

        if (!token) {
            throw new Error('Usuario no autenticado');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
            ...options,
            headers
        });

        return response.json();
    }

    /**
     * VERIFICAR SI HAY CREDENCIALES DISPONIBLES
     */
    async hasCredentials() {
        try {
            const result = await this.listDevices();
            return result.count > 0;
        } catch {
            return false;
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.WebAuthnManager = WebAuthnManager;
}
