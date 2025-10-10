/**
 * PWA INSTALLER - Sistema de Instalación Nativo
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión: 2.0.0 - Optimizado para comunicación padres-docentes
 */

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isStandalone = false;
        this.installButton = null;
        this.installModal = null;
        this.dismissCount = 0;
        this.maxDismissals = 3;

        this.init();
    }

    init() {
        this.detectInstallationState();
        this.setupInstallPrompt();
        this.createInstallUI();
        this.setupEventListeners();
        this.checkShowInstallPrompt();

        console.log('📱 [PWA-INSTALLER] Sistema inicializado');
    }

    detectInstallationState() {
        // Detectar si está ejecutándose como PWA instalada
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');

        // Verificar si está instalada usando localStorage
        this.isInstalled = localStorage.getItem('pwa-installed') === 'true' || this.isStandalone;

        console.log('📱 [PWA-INSTALLER] Estado:', {
            isStandalone: this.isStandalone,
            isInstalled: this.isInstalled
        });
    }

    setupInstallPrompt() {
        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('📱 [PWA-INSTALLER] beforeinstallprompt disparado');

            // Prevenir que se muestre automáticamente
            event.preventDefault();

            // Guardar el evento para uso posterior
            this.deferredPrompt = event;

            // Mostrar botón de instalación personalizado
            this.showInstallButton();
        });

        // Escuchar evento de instalación exitosa
        window.addEventListener('appinstalled', (event) => {
            console.log('✅ [PWA-INSTALLER] App instalada exitosamente');

            this.isInstalled = true;
            localStorage.setItem('pwa-installed', 'true');
            localStorage.setItem('pwa-install-date', new Date().toISOString());

            this.hideInstallButton();
            this.showInstallSuccessMessage();

            // Analytics
            this.trackInstallation('success');
        });
    }

    createInstallUI() {
        this.createInstallButton();
        this.createInstallModal();
        this.createInstallBanner();
    }

    createInstallButton() {
        // Crear botón flotante de instalación
        this.installButton = document.createElement('button');
        this.installButton.id = 'pwa-install-button';
        this.installButton.className = 'pwa-install-btn hidden';
        this.installButton.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Instalar App</span>
        `;

        // Estilos del botón
        this.installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 1001;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            transform: translateX(-100%);
            opacity: 0;
        `;

        document.body.appendChild(this.installButton);
    }

    createInstallModal() {
        this.installModal = document.createElement('div');
        this.installModal.id = 'pwa-install-modal';
        this.installModal.className = 'pwa-modal hidden';

        this.installModal.innerHTML = `
            <div class="pwa-modal-backdrop" onclick="pwaInstaller.hideInstallModal()"></div>
            <div class="pwa-modal-content">
                <div class="pwa-modal-header">
                    <div class="pwa-app-icon">
                        <img src="/images/app_icons/icon-192x192.png" alt="BGE App" />
                    </div>
                    <div class="pwa-app-info">
                        <h3>Héroes de la Patria</h3>
                        <p>Bachillerato General Estatal</p>
                    </div>
                    <button class="pwa-modal-close" onclick="pwaInstaller.hideInstallModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="pwa-modal-body">
                    <h4>📱 Instalar aplicación</h4>
                    <div class="pwa-benefits">
                        <div class="pwa-benefit">
                            <i class="fas fa-bolt text-warning"></i>
                            <div>
                                <strong>Acceso rápido</strong>
                                <span>Abrir directamente desde tu pantalla de inicio</span>
                            </div>
                        </div>
                        <div class="pwa-benefit">
                            <i class="fas fa-wifi text-info"></i>
                            <div>
                                <strong>Funciona offline</strong>
                                <span>Accede al contenido sin conexión a internet</span>
                            </div>
                        </div>
                        <div class="pwa-benefit">
                            <i class="fas fa-bell text-success"></i>
                            <div>
                                <strong>Notificaciones push</strong>
                                <span>Recibe avisos importantes en tiempo real</span>
                            </div>
                        </div>
                        <div class="pwa-benefit">
                            <i class="fas fa-comments text-primary"></i>
                            <div>
                                <strong>Chat padres-docentes</strong>
                                <span>Comunicación directa siempre disponible</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pwa-modal-footer">
                    <button class="pwa-btn-secondary" onclick="pwaInstaller.dismissInstallPrompt()">
                        Ahora no
                    </button>
                    <button class="pwa-btn-primary" onclick="pwaInstaller.installApp()">
                        <i class="fas fa-download"></i> Instalar
                    </button>
                </div>
            </div>
        `;

        // Estilos del modal
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            .pwa-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            }

            .pwa-modal.hidden {
                display: none;
            }

            .pwa-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }

            .pwa-modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                max-width: 420px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                animation: modalSlideUp 0.3s ease-out;
            }

            @keyframes modalSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .pwa-modal-header {
                display: flex;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
                position: relative;
            }

            .pwa-app-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                overflow: hidden;
                margin-right: 15px;
            }

            .pwa-app-icon img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .pwa-app-info h3 {
                margin: 0 0 5px 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }

            .pwa-app-info p {
                margin: 0;
                font-size: 14px;
                color: #666;
            }

            .pwa-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: #f8f9fa;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                color: #666;
                transition: all 0.2s ease;
            }

            .pwa-modal-close:hover {
                background: #e9ecef;
                color: #333;
            }

            .pwa-modal-body {
                padding: 20px;
            }

            .pwa-modal-body h4 {
                margin: 0 0 20px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .pwa-benefits {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .pwa-benefit {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }

            .pwa-benefit i {
                font-size: 18px;
                margin-top: 2px;
            }

            .pwa-benefit strong {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
            }

            .pwa-benefit span {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
            }

            .pwa-modal-footer {
                display: flex;
                gap: 10px;
                padding: 20px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
            }

            .pwa-btn-secondary, .pwa-btn-primary {
                flex: 1;
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .pwa-btn-secondary {
                background: #e9ecef;
                color: #666;
            }

            .pwa-btn-secondary:hover {
                background: #dee2e6;
                color: #495057;
            }

            .pwa-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .pwa-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .pwa-install-btn {
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .pwa-install-btn.show {
                transform: translateX(0);
                opacity: 1;
            }

            .pwa-install-btn:hover {
                transform: translateX(0) translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }

            @media (max-width: 480px) {
                .pwa-modal-content {
                    margin: 0;
                    border-radius: 16px 16px 0 0;
                    max-height: 90vh;
                    align-self: flex-end;
                }
            }
        `;

        document.head.appendChild(modalStyles);
        document.body.appendChild(this.installModal);
    }

    createInstallBanner() {
        // Banner sutil en la parte superior para promover instalación
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-banner hidden';

        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="pwa-banner-text">
                    <strong>¿Sabías que puedes instalar esta app?</strong>
                    <span>Acceso rápido desde tu pantalla de inicio</span>
                </div>
                <button class="pwa-banner-btn" onclick="pwaInstaller.showInstallModal()">
                    Instalar
                </button>
                <button class="pwa-banner-close" onclick="pwaInstaller.dismissBanner()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const bannerStyles = document.createElement('style');
        bannerStyles.textContent = `
            .pwa-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                z-index: 1500;
                transform: translateY(-100%);
                transition: transform 0.3s ease;
            }

            .pwa-banner.show {
                transform: translateY(0);
            }

            .pwa-banner-content {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                max-width: 1200px;
                margin: 0 auto;
                gap: 15px;
            }

            .pwa-banner-icon {
                font-size: 20px;
                opacity: 0.9;
            }

            .pwa-banner-text {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .pwa-banner-text strong {
                font-size: 14px;
                font-weight: 600;
            }

            .pwa-banner-text span {
                font-size: 12px;
                opacity: 0.9;
            }

            .pwa-banner-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }

            .pwa-banner-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .pwa-banner-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 8px;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            .pwa-banner-close:hover {
                opacity: 1;
            }

            @media (max-width: 768px) {
                .pwa-banner-text span {
                    display: none;
                }

                .pwa-banner-content {
                    padding: 10px 15px;
                    gap: 10px;
                }
            }
        `;

        document.head.appendChild(bannerStyles);
        document.body.appendChild(banner);
    }

    setupEventListeners() {
        // Click en botón de instalación
        this.installButton?.addEventListener('click', () => {
            this.showInstallModal();
        });

        // Detectar cambios en display-mode
        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            if (e.matches) {
                this.isStandalone = true;
                this.isInstalled = true;
                localStorage.setItem('pwa-installed', 'true');
                this.hideInstallButton();
            }
        });

        // Evento personalizado para mostrar instalación
        window.addEventListener('show-pwa-install', () => {
            this.showInstallModal();
        });
    }

    checkShowInstallPrompt() {
        if (this.isInstalled) {
            console.log('📱 [PWA-INSTALLER] App ya instalada');
            return;
        }

        // Obtener contador de descartes
        this.dismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0');

        if (this.dismissCount >= this.maxDismissals) {
            console.log('📱 [PWA-INSTALLER] Máximo de descartes alcanzado');
            return;
        }

        // Mostrar banner después de 10 segundos si no está instalada
        setTimeout(() => {
            if (!this.isInstalled && this.deferredPrompt) {
                this.showInstallBanner();
            }
        }, 10000);

        // Mostrar modal automáticamente después de 30 segundos de actividad
        setTimeout(() => {
            if (!this.isInstalled && this.shouldShowAutoPrompt()) {
                this.showInstallModal();
            }
        }, 30000);
    }

    shouldShowAutoPrompt() {
        const lastDismiss = localStorage.getItem('pwa-last-dismiss');
        if (!lastDismiss) return true;

        // Solo mostrar si han pasado más de 24 horas desde el último descarte
        const daysSinceLastDismiss = (Date.now() - new Date(lastDismiss).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastDismiss > 1;
    }

    showInstallButton() {
        if (this.isInstalled) return;

        this.installButton?.classList.remove('hidden');
        setTimeout(() => {
            this.installButton?.classList.add('show');
        }, 100);
    }

    hideInstallButton() {
        this.installButton?.classList.remove('show');
        setTimeout(() => {
            this.installButton?.classList.add('hidden');
        }, 300);
    }

    showInstallModal() {
        if (!this.deferredPrompt || this.isInstalled) {
            this.showFallbackInstructions();
            return;
        }

        this.installModal?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Analytics
        this.trackInstallation('modal_shown');
    }

    hideInstallModal() {
        this.installModal?.classList.add('hidden');
        document.body.style.overflow = '';
    }

    showInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner && !this.isInstalled) {
            banner.classList.remove('hidden');
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);
        }
    }

    dismissBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 300);
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('📱 [PWA-INSTALLER] No hay prompt disponible');
            this.showFallbackInstructions();
            return;
        }

        try {
            // Mostrar el prompt nativo
            this.deferredPrompt.prompt();

            // Esperar la respuesta del usuario
            const { outcome } = await this.deferredPrompt.userChoice;

            console.log('📱 [PWA-INSTALLER] Resultado de instalación:', outcome);

            if (outcome === 'accepted') {
                console.log('✅ [PWA-INSTALLER] Usuario aceptó la instalación');
                this.trackInstallation('accepted');
            } else {
                console.log('❌ [PWA-INSTALLER] Usuario rechazó la instalación');
                this.trackInstallation('rejected');
            }

            // Limpiar el prompt
            this.deferredPrompt = null;
            this.hideInstallModal();

        } catch (error) {
            console.error('❌ [PWA-INSTALLER] Error en instalación:', error);
            this.showFallbackInstructions();
        }
    }

    dismissInstallPrompt() {
        this.dismissCount++;
        localStorage.setItem('pwa-dismiss-count', this.dismissCount.toString());
        localStorage.setItem('pwa-last-dismiss', new Date().toISOString());

        this.hideInstallModal();
        this.dismissBanner();

        this.trackInstallation('dismissed');

        console.log('📱 [PWA-INSTALLER] Prompt descartado, contador:', this.dismissCount);
    }

    showFallbackInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        let instructions = '';

        if (isIOS) {
            instructions = `
                <div class="pwa-instructions">
                    <h4>📱 Instalar en iOS</h4>
                    <ol>
                        <li>Toca el botón de compartir <i class="fas fa-share"></i></li>
                        <li>Selecciona "Añadir a la pantalla de inicio"</li>
                        <li>Toca "Añadir" para confirmar</li>
                    </ol>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="pwa-instructions">
                    <h4>📱 Instalar en Android</h4>
                    <ol>
                        <li>Toca el menú del navegador ⋮</li>
                        <li>Selecciona "Añadir a la pantalla de inicio"</li>
                        <li>Toca "Añadir" para confirmar</li>
                    </ol>
                </div>
            `;
        } else {
            instructions = `
                <div class="pwa-instructions">
                    <h4>💻 Instalar en escritorio</h4>
                    <p>Busca el ícono de instalación <i class="fas fa-plus"></i> en la barra de direcciones del navegador.</p>
                </div>
            `;
        }

        // Mostrar modal con instrucciones
        const modal = this.installModal;
        if (modal) {
            modal.querySelector('.pwa-modal-body').innerHTML = instructions;
            modal.querySelector('.pwa-btn-primary').style.display = 'none';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    showInstallSuccessMessage() {
        const toast = document.createElement('div');
        toast.className = 'pwa-success-toast';
        toast.innerHTML = `
            <div class="pwa-toast-content">
                <i class="fas fa-check-circle text-success"></i>
                <span>¡App instalada exitosamente!</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const toastStyles = document.createElement('style');
        toastStyles.textContent = `
            .pwa-success-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 2001;
                animation: toastSlideIn 0.3s ease-out;
            }

            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .pwa-toast-content {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                gap: 10px;
            }

            .pwa-toast-content i:first-child {
                font-size: 18px;
            }

            .pwa-toast-content span {
                flex: 1;
                font-weight: 600;
                color: #333;
            }

            .pwa-toast-content button {
                background: none;
                border: none;
                cursor: pointer;
                opacity: 0.6;
                padding: 4px;
            }
        `;

        document.head.appendChild(toastStyles);
        document.body.appendChild(toast);

        // Auto-remove después de 5 segundos
        setTimeout(() => {
            toast?.remove();
            toastStyles?.remove();
        }, 5000);
    }

    trackInstallation(action) {
        // Enviar evento a analytics si está disponible
        if (window.gtag) {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: action,
                value: 1
            });
        }

        // Log local
        const installData = {
            action,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            standalone: this.isStandalone
        };

        console.log('📊 [PWA-INSTALLER] Analytics:', installData);

        // Guardar en localStorage para debugging
        const logs = JSON.parse(localStorage.getItem('pwa-install-logs') || '[]');
        logs.push(installData);
        localStorage.setItem('pwa-install-logs', JSON.stringify(logs.slice(-10))); // Mantener solo los últimos 10
    }

    // API pública
    static getInstance() {
        if (!window.pwaInstallerInstance) {
            window.pwaInstallerInstance = new PWAInstaller();
        }
        return window.pwaInstallerInstance;
    }

    static show() {
        const instance = PWAInstaller.getInstance();
        instance.showInstallModal();
    }

    static hide() {
        const instance = PWAInstaller.getInstance();
        instance.hideInstallModal();
    }
}

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstaller = PWAInstaller.getInstance();
    });
} else {
    window.pwaInstaller = PWAInstaller.getInstance();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAInstaller;
}

console.log('📱 [PWA-INSTALLER] Módulo cargado exitosamente');