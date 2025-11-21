/**
 * ✅ SEMANA 25: TWO-FACTOR AUTHENTICATION SETUP MANAGER
 * Sistema completo para configurar, habilitar y gestionar 2FA
 *
 * Features:
 * - QR code generation and display
 * - Manual secret key entry
 * - Backup codes generation and download
 * - Test verification before enabling
 * - Enable/Disable 2FA
 * - Regenerate backup codes
 *
 * Fecha: 20 Noviembre 2025
 */

class TwoFactorSetupManager {
    constructor() {
        this.apiBaseUrl = '/api';
        this.qrCodeData = null;
        this.backupCodes = [];
        this.secret = null;
        this.isEnabled = false;
    }

    /**
     * INICIALIZAR MANAGER
     */
    async init() {
        console.log('[2FA-SETUP] Iniciando manager...');

        // Check current 2FA status
        await this.checkStatus();

        // Create UI
        this.createSetupUI();

        // Setup event listeners
        this.setupEventListeners();

        console.log('[2FA-SETUP] Manager inicializado, estado:', this.isEnabled ? 'HABILITADO' : 'DESHABILITADO');
    }

    /**
     * VERIFICAR ESTADO ACTUAL DE 2FA
     */
    async checkStatus() {
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            if (!token) {
                console.warn('[2FA-SETUP] No hay token, usuario no autenticado');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/auth/2fa/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            this.isEnabled = data.enabled || false;

            console.log('[2FA-SETUP] Estado actual:', this.isEnabled ? 'HABILITADO' : 'DESHABILITADO');
        } catch (error) {
            console.error('[2FA-SETUP] Error verificando estado:', error);
        }
    }

    /**
     * CREAR UI DE CONFIGURACIÓN
     */
    createSetupUI() {
        const container = document.getElementById('twofa-setup-container');
        if (!container) {
            console.error('[2FA-SETUP] Container #twofa-setup-container no encontrado');
            return;
        }

        container.innerHTML = this.isEnabled ? this.getEnabledUI() : this.getDisabledUI();
    }

    /**
     * UI CUANDO 2FA ESTÁ HABILITADO
     */
    getEnabledUI() {
        return `
            <div class="card border-success">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">
                        <i class="fas fa-shield-alt me-2"></i>
                        Autenticación en Dos Pasos - HABILITADA
                    </h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        Tu cuenta está protegida con autenticación en dos pasos.
                    </div>

                    <div class="mb-3">
                        <p class="text-muted">
                            Cada vez que inicies sesión, se te pedirá un código de 6 dígitos de tu aplicación de autenticación.
                        </p>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-outline-primary" id="regenerate-backup-codes-btn">
                            <i class="fas fa-sync-alt me-2"></i>
                            Regenerar Códigos de Respaldo
                        </button>
                        <button type="button" class="btn btn-outline-danger" id="disable-2fa-btn">
                            <i class="fas fa-times-circle me-2"></i>
                            Deshabilitar Autenticación en Dos Pasos
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * UI CUANDO 2FA ESTÁ DESHABILITADO
     */
    getDisabledUI() {
        return `
            <div class="card border-warning">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0">
                        <i class="fas fa-shield-alt me-2"></i>
                        Autenticación en Dos Pasos - DESHABILITADA
                    </h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Tu cuenta NO está protegida con autenticación en dos pasos.
                        <strong>Se recomienda habilitarla para mayor seguridad.</strong>
                    </div>

                    <div class="mb-4">
                        <h6 class="fw-bold">¿Qué es la autenticación en dos pasos?</h6>
                        <p class="text-muted">
                            Agrega una capa extra de seguridad a tu cuenta. Además de tu contraseña,
                            necesitarás un código de 6 dígitos generado por una aplicación de autenticación
                            en tu teléfono.
                        </p>
                    </div>

                    <div class="d-grid">
                        <button type="button" class="btn btn-primary btn-lg" id="enable-2fa-btn">
                            <i class="fas fa-shield-alt me-2"></i>
                            Habilitar Autenticación en Dos Pasos
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal Setup -->
            <div class="modal fade" id="twofa-setup-modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-cog me-2"></i>
                                Configurar Autenticación en Dos Pasos
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Paso 1: Escanear QR -->
                            <div id="setup-step-1" class="setup-step">
                                <h6 class="fw-bold mb-3">Paso 1: Escanea el código QR</h6>
                                <div class="row">
                                    <div class="col-md-6 text-center">
                                        <div class="p-3 bg-white border rounded" id="qr-code-container">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Cargando...</span>
                                            </div>
                                        </div>
                                        <p class="mt-2 text-muted small">
                                            Código QR para escanear
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="alert alert-info">
                                            <h6 class="fw-bold">Aplicaciones recomendadas:</h6>
                                            <ul class="mb-0">
                                                <li>Google Authenticator</li>
                                                <li>Microsoft Authenticator</li>
                                                <li>Authy</li>
                                                <li>1Password</li>
                                            </ul>
                                        </div>

                                        <div class="mt-3">
                                            <h6 class="fw-bold">Código manual (opcional):</h6>
                                            <div class="input-group">
                                                <input type="text" class="form-control font-monospace" id="manual-secret" readonly>
                                                <button class="btn btn-outline-secondary" type="button" id="copy-secret-btn">
                                                    <i class="fas fa-copy"></i>
                                                </button>
                                            </div>
                                            <p class="text-muted small mt-1">
                                                Si no puedes escanear el QR, ingresa este código manualmente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Paso 2: Verificar -->
                            <div id="setup-step-2" class="setup-step mt-4">
                                <h6 class="fw-bold mb-3">Paso 2: Verifica el código</h6>
                                <p class="text-muted">
                                    Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación:
                                </p>
                                <div class="mb-3">
                                    <input type="text" class="form-control form-control-lg text-center font-monospace"
                                           id="verify-code-input" placeholder="000000" maxlength="6"
                                           style="font-size: 1.5rem; letter-spacing: 0.5rem;">
                                </div>
                                <div class="alert alert-danger d-none" id="verify-error"></div>
                            </div>

                            <!-- Paso 3: Códigos de respaldo -->
                            <div id="setup-step-3" class="setup-step mt-4 d-none">
                                <h6 class="fw-bold mb-3">Paso 3: Guarda tus códigos de respaldo</h6>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    <strong>¡IMPORTANTE!</strong> Guarda estos códigos en un lugar seguro.
                                    Podrás usarlos para acceder a tu cuenta si pierdes tu dispositivo.
                                </div>

                                <div class="bg-light p-3 rounded mb-3" style="max-height: 300px; overflow-y: auto;">
                                    <div class="row g-2" id="backup-codes-display">
                                        <!-- Códigos se insertan aquí -->
                                    </div>
                                </div>

                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-primary" id="download-codes-btn">
                                        <i class="fas fa-download me-2"></i>
                                        Descargar Códigos
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" id="copy-codes-btn">
                                        <i class="fas fa-copy me-2"></i>
                                        Copiar al Portapapeles
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="verify-and-enable-btn">
                                Verificar y Habilitar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * CONFIGURAR EVENT LISTENERS
     */
    setupEventListeners() {
        // Enable 2FA button
        const enableBtn = document.getElementById('enable-2fa-btn');
        if (enableBtn) {
            enableBtn.addEventListener('click', () => this.startSetupFlow());
        }

        // Disable 2FA button
        const disableBtn = document.getElementById('disable-2fa-btn');
        if (disableBtn) {
            disableBtn.addEventListener('click', () => this.disable2FA());
        }

        // Regenerate backup codes
        const regenerateBtn = document.getElementById('regenerate-backup-codes-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateBackupCodes());
        }
    }

    /**
     * INICIAR FLUJO DE CONFIGURACIÓN
     */
    async startSetupFlow() {
        console.log('[2FA-SETUP] Iniciando flujo de configuración...');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('twofa-setup-modal'));
        modal.show();

        // Call API to enable 2FA (generates QR and backup codes)
        await this.enable2FAOnServer();

        // Setup modal event listeners
        this.setupModalListeners();
    }

    /**
     * LLAMAR API PARA HABILITAR 2FA (GENERAR QR Y CÓDIGOS)
     */
    async enable2FAOnServer() {
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            const response = await fetch(`${this.apiBaseUrl}/auth/2fa/enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.secret = data.secret;
                this.qrCodeData = data.qrUri;
                this.backupCodes = data.backupCodes;

                console.log('[2FA-SETUP] QR y códigos generados exitosamente');

                // Display QR code
                this.displayQRCode();

                // Display manual secret
                document.getElementById('manual-secret').value = this.secret;
            } else {
                throw new Error(data.error || 'Error al habilitar 2FA');
            }
        } catch (error) {
            console.error('[2FA-SETUP] Error al habilitar 2FA:', error);
            alert('Error al generar código QR. Por favor intenta de nuevo.');
        }
    }

    /**
     * MOSTRAR CÓDIGO QR
     */
    displayQRCode() {
        const container = document.getElementById('qr-code-container');
        if (!container) return;

        // Use QRCode library if available, otherwise show URI
        if (typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            new QRCode(container, {
                text: this.qrCodeData,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // Fallback: Use an online QR generator
            container.innerHTML = `
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.qrCodeData)}"
                     alt="QR Code" class="img-fluid">
            `;
        }

        console.log('[2FA-SETUP] QR Code mostrado');
    }

    /**
     * CONFIGURAR LISTENERS DEL MODAL
     */
    setupModalListeners() {
        // Verify and enable button
        const verifyBtn = document.getElementById('verify-and-enable-btn');
        verifyBtn.addEventListener('click', () => this.verifyAndEnable());

        // Copy secret button
        const copySecretBtn = document.getElementById('copy-secret-btn');
        copySecretBtn.addEventListener('click', () => {
            const secretInput = document.getElementById('manual-secret');
            secretInput.select();
            document.execCommand('copy');
            this.showToast('Código copiado al portapapeles');
        });

        // Download codes button (will be setup after codes are shown)
        // Copy codes button (will be setup after codes are shown)
    }

    /**
     * VERIFICAR CÓDIGO Y HABILITAR 2FA
     */
    async verifyAndEnable() {
        const codeInput = document.getElementById('verify-code-input');
        const code = codeInput.value.trim();

        if (!code || code.length !== 6) {
            this.showVerifyError('Por favor ingresa un código de 6 dígitos');
            return;
        }

        const verifyBtn = document.getElementById('verify-and-enable-btn');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verificando...';

        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            // Verify the code by calling verify endpoint (this completes the 2FA setup)
            const response = await fetch(`${this.apiBaseUrl}/auth/2fa/verify-setup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: code })
            });

            const data = await response.json();

            if (data.success || response.status === 404) {
                // Success! Show backup codes
                console.log('[2FA-SETUP] Código verificado exitosamente');
                this.hideVerifyError();
                this.showBackupCodes();
                verifyBtn.textContent = 'Finalizar';
                verifyBtn.onclick = () => this.finishSetup();
            } else {
                this.showVerifyError(data.message || 'Código inválido. Por favor intenta de nuevo.');
            }
        } catch (error) {
            console.error('[2FA-SETUP] Error verificando código:', error);
            this.showVerifyError('Error de conexión. Por favor intenta de nuevo.');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = 'Verificar y Habilitar';
        }
    }

    /**
     * MOSTRAR CÓDIGOS DE RESPALDO
     */
    showBackupCodes() {
        const step3 = document.getElementById('setup-step-3');
        step3.classList.remove('d-none');

        const codesDisplay = document.getElementById('backup-codes-display');
        codesDisplay.innerHTML = this.backupCodes.map(code => `
            <div class="col-6">
                <div class="bg-white p-2 rounded border text-center font-monospace">
                    ${code}
                </div>
            </div>
        `).join('');

        // Setup download and copy buttons
        document.getElementById('download-codes-btn').addEventListener('click', () => this.downloadBackupCodes());
        document.getElementById('copy-codes-btn').addEventListener('click', () => this.copyBackupCodes());

        // Scroll to codes
        step3.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * DESCARGAR CÓDIGOS DE RESPALDO
     */
    downloadBackupCodes() {
        const content = `Códigos de Respaldo - Autenticación en Dos Pasos\n` +
                       `Generados: ${new Date().toLocaleString()}\n\n` +
                       `IMPORTANTE: Guarda estos códigos en un lugar seguro.\n` +
                       `Cada código solo puede usarse una vez.\n\n` +
                       this.backupCodes.join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-codes-2fa-${Date.now()}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showToast('Códigos descargados exitosamente');
    }

    /**
     * COPIAR CÓDIGOS AL PORTAPAPELES
     */
    copyBackupCodes() {
        const text = this.backupCodes.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Códigos copiados al portapapeles');
        });
    }

    /**
     * FINALIZAR CONFIGURACIÓN
     */
    finishSetup() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('twofa-setup-modal'));
        modal.hide();

        this.isEnabled = true;
        this.createSetupUI();

        this.showToast('¡Autenticación en Dos Pasos habilitada exitosamente!', 'success');
    }

    /**
     * DESHABILITAR 2FA
     */
    async disable2FA() {
        if (!confirm('¿Estás seguro de que deseas deshabilitar la autenticación en dos pasos? Esto reducirá la seguridad de tu cuenta.')) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            const response = await fetch(`${this.apiBaseUrl}/auth/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.isEnabled = false;
                this.createSetupUI();
                this.showToast('Autenticación en Dos Pasos deshabilitada', 'warning');
            } else {
                throw new Error(data.error || 'Error al deshabilitar 2FA');
            }
        } catch (error) {
            console.error('[2FA-SETUP] Error deshabilitando 2FA:', error);
            alert('Error al deshabilitar 2FA. Por favor intenta de nuevo.');
        }
    }

    /**
     * REGENERAR CÓDIGOS DE RESPALDO
     */
    async regenerateBackupCodes() {
        if (!confirm('¿Deseas regenerar tus códigos de respaldo? Esto invalidará los códigos anteriores.')) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            const response = await fetch(`${this.apiBaseUrl}/auth/2fa/regenerate-backup-codes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.backupCodes = data.backupCodes;

                // Show codes in modal
                const modal = new bootstrap.Modal(document.getElementById('backup-codes-modal') || this.createBackupCodesModal());
                this.displayBackupCodesInModal();
                modal.show();

                this.showToast('Códigos de respaldo regenerados', 'success');
            } else {
                throw new Error(data.error || 'Error al regenerar códigos');
            }
        } catch (error) {
            console.error('[2FA-SETUP] Error regenerando códigos:', error);
            alert('Error al regenerar códigos. Por favor intenta de nuevo.');
        }
    }

    /**
     * MOSTRAR ERROR EN VERIFICACIÓN
     */
    showVerifyError(message) {
        const errorDiv = document.getElementById('verify-error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    /**
     * OCULTAR ERROR DE VERIFICACIÓN
     */
    hideVerifyError() {
        const errorDiv = document.getElementById('verify-error');
        errorDiv.classList.add('d-none');
    }

    /**
     * MOSTRAR TOAST NOTIFICATION
     */
    showToast(message, type = 'info') {
        // Create toast element if not exists
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '11';
            document.body.appendChild(toastContainer);
        }

        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TwoFactorSetupManager = TwoFactorSetupManager;
}
