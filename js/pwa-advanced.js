/**
 * 📱 PWA ADVANCED - Características Avanzadas de Progressive Web App
 * Bachillerato General Estatal "Héroes de la Patria"
 * Implementación completa de PWA con características nativas
 */

// Verificar si ya existe para evitar declaraciones duplicadas
if (typeof PWAAdvanced === 'undefined') {
class PWAAdvanced {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.offlineManager = new OfflineManager();
        this.backgroundSync = new BackgroundSyncManager();
        this.updateManager = new UpdateManager();
        this.installManager = new InstallManager();
        
        this.capabilities = {
            notifications: 'Notification' in window,
            serviceWorker: 'serviceWorker' in navigator,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            pushMessages: 'PushManager' in window,
            webShare: 'share' in navigator,
            contacts: 'contacts' in navigator,
            deviceMotion: 'DeviceMotionEvent' in window,
            geolocation: 'geolocation' in navigator,
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            fileSystemAccess: 'showOpenFilePicker' in window,
            clipboard: 'clipboard' in navigator,
            badging: 'setAppBadge' in navigator,
            shortcuts: 'getInstalledRelatedApps' in navigator
        };
        
        this.state = {
            isInstalled: false,
            isOnline: navigator.onLine,
            hasUpdate: false,
            notificationsEnabled: false,
            backgroundSyncEnabled: false
        };
        
        this.init();
    }

    async init() {
        //console.log('📱 Iniciando PWA Advanced...');
        
        // Detectar si la app está instalada
        await this.detectInstallation();
        
        // Inicializar managers
        await this.notificationManager.init();
        await this.offlineManager.init();
        await this.backgroundSync.init();
        await this.updateManager.init();
        await this.installManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Inicializar características avanzadas
        this.initAdvancedFeatures();
        
        //console.log('✅ PWA Advanced inicializado');
        //console.log('🔧 Capacidades:', this.capabilities);
    }

    async detectInstallation() {
        // Detectar si la PWA está instalada
        if ('getInstalledRelatedApps' in navigator) {
            try {
                const relatedApps = await navigator.getInstalledRelatedApps();
                this.state.isInstalled = relatedApps.length > 0;
            } catch (error) {
                // Fallback: detectar por display-mode
                this.state.isInstalled = window.matchMedia('(display-mode: standalone)').matches;
            }
        } else {
            this.state.isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        }

        // Aplicar clase CSS y ocultar elementos de instalación si ya está instalada
        if (this.state.isInstalled) {
            document.body.classList.add('pwa-installed');
            this.hideInstallElements();
            console.log('✅ PWA detectada como instalada - Elementos de instalación ocultados');
        } else {
            document.body.classList.remove('pwa-installed');
            console.log('📱 PWA no instalada - Elementos de instalación visibles');
        }
    }

    hideInstallElements() {
        // Ocultar banner flotante
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.style.display = 'none';

        // Ocultar sección principal de instalación
        const section = document.getElementById('instalar-app');
        if (section) section.style.display = 'none';

        // Ocultar botones de instalación
        const installBtns = document.querySelectorAll('.install-button, #main-pwa-install-btn');
        installBtns.forEach(btn => btn.style.display = 'none');
    }

    setupEventListeners() {
        // Online/Offline events
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.onConnectivityChange('online');
        });
        
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.onConnectivityChange('offline');
        });
        
        // App lifecycle events
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppBackground();
            } else {
                this.onAppForeground();
            }
        });
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.onOrientationChange(), 100);
        });
    }

    initAdvancedFeatures() {
        // Inicializar características específicas del dispositivo
        this.initWebShare();
        this.initClipboardAPI();
        this.initBadging();
        this.initShortcuts();
        this.initDeviceMotion();
        this.initFullscreen();
    }

    // ============================================
    // WEB SHARE API
    // ============================================

    initWebShare() {
        if (this.capabilities.webShare) {
            // Agregar botones de compartir automáticamente
            this.addShareButtons();
        }
    }

    addShareButtons() {
        const shareTargets = document.querySelectorAll('[data-share]');
        
        shareTargets.forEach(target => {
            const shareButton = document.createElement('button');
            shareButton.className = 'btn btn-outline-primary btn-sm ms-2';
            shareButton.innerHTML = '<i class="fas fa-share-alt"></i>';
            shareButton.title = 'Compartir';
            
            shareButton.addEventListener('click', () => {
                this.shareContent(target);
            });
            
            target.appendChild(shareButton);
        });
    }

    async shareContent(element) {
        const shareData = {
            title: element.dataset.shareTitle || document.title,
            text: element.dataset.shareText || document.querySelector('meta[name="description"]')?.content || '',
            url: element.dataset.shareUrl || window.location.href
        };
        
        try {
            await navigator.share(shareData);
            //console.log('✅ Contenido compartido exitosamente');
        } catch (error) {
            //console.log('ℹ️ Compartir cancelado o no soportado');
            // Fallback a clipboard
            this.copyToClipboard(shareData.url);
        }
    }

    // ============================================
    // CLIPBOARD API
    // ============================================

    initClipboardAPI() {
        if (this.capabilities.clipboard) {
            this.setupClipboardFeatures();
        }
    }

    setupClipboardFeatures() {
        // Agregar funcionalidad de copiar en elementos específicos
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-copy]')) {
                const textToCopy = e.target.dataset.copy || e.target.textContent;
                this.copyToClipboard(textToCopy);
            }
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('📋 Copiado al portapapeles', 'success');
        } catch (error) {
            // Fallback para navegadores sin soporte
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('📋 Copiado al portapapeles', 'success');
        } catch (error) {
            this.showToast('❌ Error al copiar', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // ============================================
    // BADGING API
    // ============================================

    initBadging() {
        if (this.capabilities.badging) {
            this.badgeManager = new BadgeManager();
        }
    }

    setBadge(count = 0) {
        if (this.capabilities.badging) {
            navigator.setAppBadge(count);
        }
    }

    clearBadge() {
        if (this.capabilities.badging) {
            navigator.clearAppBadge();
        }
    }

    // ============================================
    // SHORTCUTS API
    // ============================================

    initShortcuts() {
        // Los shortcuts se definen en el manifest.json
        // Aquí manejamos las acciones de los shortcuts
        navigator.serviceWorker?.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SHORTCUT_ACTION') {
                this.handleShortcutAction(event.data.action);
            }
        });
    }

    handleShortcutAction(action) {
        switch (action) {
            case 'calificaciones':
                window.location.href = '/calificaciones.html';
                break;
            case 'calendario':
                window.location.href = '/calendario.html';
                break;
            case 'pagos':
                window.location.href = '/pagos.html';
                break;
            case 'contacto':
                window.location.href = '/#contacto';
                break;
        }
    }

    // ============================================
    // DEVICE MOTION
    // ============================================

    initDeviceMotion() {
        if (this.capabilities.deviceMotion) {
            this.setupDeviceMotionFeatures();
        }
    }

    setupDeviceMotionFeatures() {
        // Implementar shake to refresh
        const shakeThreshold = 15;
        let lastUpdate = 0;
        let lastX = 0, lastY = 0, lastZ = 0;
        
        window.addEventListener('devicemotion', (event) => {
            const current = Date.now();
            if ((current - lastUpdate) > 100) {
                const diffTime = current - lastUpdate;
                lastUpdate = current;
                
                const x = event.accelerationIncludingGravity.x;
                const y = event.accelerationIncludingGravity.y;
                const z = event.accelerationIncludingGravity.z;
                
                const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
                
                if (speed > shakeThreshold) {
                    this.onShakeDetected();
                }
                
                lastX = x;
                lastY = y;
                lastZ = z;
            }
        });
    }

    onShakeDetected() {
        // Implementar acción de shake (ej. refresh, búsqueda, etc.)
        if (this.state.isOnline) {
            this.showToast('🔄 Actualizando...', 'info');
            window.location.reload();
        } else {
            this.showToast('📡 Sin conexión', 'warning');
        }
    }

    // ============================================
    // FULLSCREEN API
    // ============================================

    initFullscreen() {
        // Agregar funcionalidad de pantalla completa
        document.addEventListener('dblclick', (e) => {
            if (e.target.matches('[data-fullscreen]')) {
                this.toggleFullscreen(e.target);
            }
        });
    }

    async toggleFullscreen(element = document.documentElement) {
        try {
            if (!document.fullscreenElement) {
                await element.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.warn('Fullscreen no soportado:', error);
        }
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    onConnectivityChange(status) {
        if (status === 'online') {
            this.showToast('🌐 Conexión restaurada', 'success');
            this.backgroundSync.processPendingSync();
        } else {
            this.showToast('📡 Sin conexión - Modo offline', 'warning');
        }
        
        // Actualizar UI basado en conectividad
        document.body.classList.toggle('offline', status === 'offline');
        document.body.classList.toggle('online', status === 'online');
    }

    onAppBackground() {
        // La app va a background
        //console.log('📱 App en background');
        
        // Registrar tiempo en background
        this.backgroundStartTime = Date.now();
        
        // Pausar animaciones no críticas
        document.body.classList.add('app-background');
    }

    onAppForeground() {
        // La app vuelve a foreground
        //console.log('📱 App en foreground');
        
        document.body.classList.remove('app-background');
        
        // Verificar actualizaciones si estuvo mucho tiempo en background
        if (this.backgroundStartTime && (Date.now() - this.backgroundStartTime > 300000)) { // 5 minutos
            this.updateManager.checkForUpdates();
        }
        
        // Reanudar funcionalidades
        this.resumeFeatures();
    }

    onOrientationChange() {
        // Manejar cambio de orientación
        const orientation = screen.orientation?.type || 'unknown';
        //console.log('📱 Orientación:', orientation);
        
        // Ajustar layout si es necesario
        document.body.setAttribute('data-orientation', orientation);
        
        // Reajustar elementos de UI
        this.adjustUIForOrientation(orientation);
    }

    adjustUIForOrientation(orientation) {
        // Ajustar elementos específicos según orientación
        const isLandscape = orientation.includes('landscape');
        
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
    }

    resumeFeatures() {
        // Reanudar características que se pausaron en background
        // Esto es especialmente importante para PWAs en móviles
    }

    // ============================================
    // UI HELPERS
    // ============================================

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Estilos inline para asegurar visibilidad
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    // Obtener estado de la PWA
    getState() {
        return {
            ...this.state,
            capabilities: this.capabilities
        };
    }

    // Forzar verificación de actualizaciones
    checkUpdates() {
        return this.updateManager.checkForUpdates();
    }

    // Mostrar prompt de instalación
    showInstallPrompt() {
        return this.installManager.showInstallPrompt();
    }

    // Enviar notificación
    sendNotification(title, options = {}) {
        return this.notificationManager.sendNotification(title, options);
    }

    // Registrar para background sync
    registerBackgroundSync(tag, data) {
        return this.backgroundSync.register(tag, data);
    }
}

// ============================================
// NOTIFICATION MANAGER
// ============================================

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.subscription = null;
    }

    async init() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
            
            // Setup push subscription si está disponible
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                await this.setupPushSubscription();
            }
        }
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            return this.permission === 'granted';
        }
        return false;
    }

    async sendNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) return false;
        }

        const defaultOptions = {
            icon: '/images/logo-bachillerato-HDLP.webp',
            badge: '/images/logo-bachillerato-HDLP.webp',
            tag: 'bachillerato-notification',
            requireInteraction: false,
            ...options
        };

        // Enviar notificación
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Usar service worker para notificaciones persistentes
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                options: defaultOptions
            });
        } else {
            // Fallback a notificación directa
            new Notification(title, defaultOptions);
        }

        return true;
    }

    async setupPushSubscription() {
        // LITE MODE - Push notifications disabled (require valid VAPID keys)
        //console.log('📱 Push notifications skipped (requires VAPID key configuration)');
        return;
        
        /* FULL VERSION - Requires backend setup:
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Verificar si ya hay una suscripción
            this.subscription = await registration.pushManager.getSubscription();
            
            if (!this.subscription) {
                // Crear nueva suscripción
                const vapidPublicKey = 'TU_VAPID_PUBLIC_KEY_AQUI'; // Reemplazar con tu clave VAPID
                
                this.subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
                });
                
                // Enviar suscripción al servidor
                await this.sendSubscriptionToServer(this.subscription);
            }
        } catch (error) {
            console.warn('Error configurando push subscription:', error);
        }
        */
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.warn('Error enviando suscripción al servidor:', error);
        }
    }
}

// ============================================
// OFFLINE MANAGER
// ============================================

class OfflineManager {
    constructor() {
        this.cache = null;
        this.offlineQueue = [];
    }

    async init() {
        if ('caches' in window) {
            this.cache = await caches.open('bachillerato-offline-v1');
            this.setupOfflineHandling();
        }
    }

    setupOfflineHandling() {
        // Interceptar formularios para queue offline
        document.addEventListener('submit', (e) => {
            if (!navigator.onLine && e.target.matches('form[data-offline-queue]')) {
                e.preventDefault();
                this.queueFormSubmission(e.target);
            }
        });
    }

    queueFormSubmission(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        this.offlineQueue.push({
            type: 'form_submission',
            url: form.action,
            method: form.method,
            data: data,
            timestamp: Date.now()
        });
        
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        
        // Mostrar feedback al usuario
        window.pwaAdvanced?.showToast('📤 Datos guardados para envío posterior', 'info');
    }

    async processOfflineQueue() {
        if (!navigator.onLine || this.offlineQueue.length === 0) return;
        
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const item of queue) {
            try {
                await this.processQueueItem(item);
            } catch (error) {
                console.warn('Error procesando item de cola offline:', error);
                // Re-agregar a la cola si falla
                this.offlineQueue.push(item);
            }
        }
        
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    }

    async processQueueItem(item) {
        switch (item.type) {
            case 'form_submission':
                await fetch(item.url, {
                    method: item.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(item.data)
                });
                break;
        }
    }
}

// ============================================
// BACKGROUND SYNC MANAGER
// ============================================

class BackgroundSyncManager {
    constructor() {
        this.registration = null;
    }

    async init() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            this.registration = await navigator.serviceWorker.ready;
        }
    }

    async register(tag, data = {}) {
        if (!this.registration) return false;
        
        try {
            // Guardar datos para el sync
            localStorage.setItem(`sync_${tag}`, JSON.stringify(data));
            
            // Registrar background sync
            await this.registration.sync.register(tag);
            
            return true;
        } catch (error) {
            console.warn('Error registrando background sync:', error);
            return false;
        }
    }

    async processPendingSync() {
        // Procesar syncs pendientes cuando vuelve la conexión
        const syncKeys = Object.keys(localStorage).filter(key => key.startsWith('sync_'));
        
        for (const key of syncKeys) {
            const tag = key.replace('sync_', '');
            const data = JSON.parse(localStorage.getItem(key));
            
            try {
                await this.processSync(tag, data);
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Error procesando sync ${tag}:`, error);
            }
        }
    }

    async processSync(tag, data) {
        // Procesar diferentes tipos de sync
        switch (tag) {
            case 'form-data':
                await this.syncFormData(data);
                break;
            case 'analytics':
                await this.syncAnalytics(data);
                break;
        }
    }

    async syncFormData(data) {
        await fetch('/api/sync/form-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    async syncAnalytics(data) {
        await fetch('/api/sync/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }
}

// ============================================
// UPDATE MANAGER
// ============================================

class UpdateManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
    }

    async init() {
        if ('serviceWorker' in navigator) {
            this.registration = await navigator.serviceWorker.ready;
            this.setupUpdateHandling();
        }
    }

    setupUpdateHandling() {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
        
        this.registration?.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    this.onUpdateAvailable();
                }
            });
        });
    }

    onUpdateAvailable() {
        this.updateAvailable = true;

        // Verificar si ya existe un banner de actualización para evitar duplicados
        const existingBanner = document.querySelector('.update-banner');
        if (existingBanner) {
            console.log('🔄 Banner de actualización ya existe, evitando duplicado');
            return;
        }

        // Verificar si acabamos de mostrar un banner recientemente (throttling)
        const now = Date.now();
        const lastBannerTime = localStorage.getItem('lastUpdateBannerTime');
        if (lastBannerTime && (now - parseInt(lastBannerTime)) < 10000) { // 10 segundos mínimo
            console.log('🔄 Banner de actualización mostrado recientemente, esperando...');
            return;
        }

        // Guardar timestamp del banner actual
        localStorage.setItem('lastUpdateBannerTime', now.toString());

        // Mostrar notificación de actualización con mejores controles
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>🚀 Nueva versión disponible</span>
                <button onclick="window.pwaAdvanced.updateManager.applyUpdate()" class="btn btn-primary btn-sm">Actualizar</button>
                <button onclick="window.pwaAdvanced.updateManager.dismissBanner()" class="btn btn-outline-secondary btn-sm">Después</button>
            </div>
        `;

        updateBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #007bff;
            color: white;
            padding: 12px;
            text-align: center;
            z-index: 10001;
            transform: translateY(-100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(updateBanner);

        setTimeout(() => {
            updateBanner.style.transform = 'translateY(0)';
        }, 100);

        // Auto-remover después de 30 segundos si no se interactúa
        setTimeout(() => {
            if (updateBanner.parentNode) {
                this.dismissBanner();
            }
        }, 30000);
    }

    dismissBanner() {
        const banner = document.querySelector('.update-banner');
        if (banner) {
            banner.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.remove();
                }
            }, 300);
        }
        // Extender el throttling cuando se descarta manualmente
        localStorage.setItem('lastUpdateBannerTime', (Date.now() + 30000).toString());
    }

    async applyUpdate() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    async checkForUpdates() {
        if (this.registration) {
            await this.registration.update();
        }
    }
}

// ============================================
// INSTALL MANAGER
// ============================================

class InstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
    }

    async init() {
        this.detectInstallation();
        this.setupInstallPrompt();
    }

    detectInstallation() {
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        
        if (this.isInstalled) {
            document.body.classList.add('pwa-installed');
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        window.addEventListener('appinstalled', () => {
            this.onAppInstalled();
        });
    }

    showInstallButton() {
        const installButton = document.createElement('button');
        installButton.className = 'install-button btn btn-primary';
        installButton.innerHTML = '📱 Instalar App';
        installButton.onclick = () => this.showInstallPrompt();
        
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 80px;
            z-index: 1000;
            border-radius: 25px;
            padding: 10px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(installButton);
    }

    async showInstallPrompt() {
        if (!this.deferredPrompt) return false;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            //console.log('✅ PWA instalada');
        }
        
        this.deferredPrompt = null;
        
        // Remover botón de instalación
        const installButton = document.querySelector('.install-button');
        if (installButton) {
            installButton.remove();
        }
        
        return outcome === 'accepted';
    }

    onAppInstalled() {
        this.isInstalled = true;
        document.body.classList.add('pwa-installed');

        // Ocultar elementos de instalación inmediatamente después de instalar
        this.hideInstallElements();

        window.pwaAdvanced?.showToast('🎉 App instalada exitosamente', 'success');
    }

    hideInstallElements() {
        // Ocultar banner flotante
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.style.display = 'none';

        // Ocultar sección principal de instalación
        const section = document.getElementById('instalar-app');
        if (section) section.style.display = 'none';

        // Ocultar botones de instalación
        const installBtns = document.querySelectorAll('.install-button, #main-pwa-install-btn');
        installBtns.forEach(btn => btn.style.display = 'none');

        // Remover el botón de instalación creado dinámicamente
        const dynamicInstallBtn = document.querySelector('.install-button');
        if (dynamicInstallBtn) dynamicInstallBtn.remove();
    }
}

// ============================================
// BADGE MANAGER
// ============================================

class BadgeManager {
    constructor() {
        this.currentBadge = 0;
    }

    setBadge(count) {
        if ('setAppBadge' in navigator) {
            navigator.setAppBadge(count);
            this.currentBadge = count;
        }
    }

    clearBadge() {
        if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge();
            this.currentBadge = 0;
        }
    }

    incrementBadge() {
        this.setBadge(this.currentBadge + 1);
    }
}

// Auto-inicialización
let pwaAdvanced;

document.addEventListener('DOMContentLoaded', () => {
    pwaAdvanced = new PWAAdvanced();
    
    // Hacer disponible globalmente
    window.pwaAdvanced = pwaAdvanced;
});

// Agregar estilos para PWA
const pwaStyles = document.createElement('style');
pwaStyles.textContent = `
    /* PWA Styles */
    .app-background * {
        animation-play-state: paused !important;
    }
    
    .offline .online-only {
        display: none !important;
    }
    
    .online .offline-only {
        display: none !important;
    }
    
    .landscape .portrait-only {
        display: none !important;
    }
    
    .portrait .landscape-only {
        display: none !important;
    }
    
    .pwa-installed .install-button {
        display: none !important;
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .toast-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .update-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    @media (max-width: 768px) {
        .update-content {
            flex-direction: column;
            gap: 8px;
        }
    }
`;

document.head.appendChild(pwaStyles);

// Exponer la clase
window.PWAAdvanced = PWAAdvanced;

//console.log('📱 PWA Advanced cargado. Usa window.pwaAdvanced para acceso directo.');
}