/**
 * BGE PWA ADVANCED SYSTEM - Sistema Avanzado PWA
 *
 * Sistema completo de Progressive Web App para BGE
 * Incluye modo offline, instalación nativa, sincronización y optimizaciones
 */

class BGEAdvancedPWA {
    constructor() {
        this.swRegistration = null;
        this.isOnline = navigator.onLine;
        this.isInstalled = false;
        this.installPrompt = null;
        this.syncQueue = [];
        this.offlineData = new Map();

        // Configuración PWA
        this.config = {
            cacheName: 'bge-cache-v2.0',
            offlinePage: '/offline.html',
            installable: true,
            syncEnabled: true,
            offlineFirst: true,
            maxCacheSize: 50 * 1024 * 1024, // 50MB
            cacheExpiration: 7 * 24 * 60 * 60 * 1000, // 7 días
            syncRetries: 3,
            syncInterval: 30000 // 30 segundos
        };

        // Recursos críticos para caché
        this.criticalResources = [
            '/',
            '/index.html',
            '/admin-dashboard.html',
            '/estudiantes.html',
            '/calificaciones.html',
            '/css/style.css',
            '/js/dashboard-manager-2025.js',
            '/js/bge-analytics-advanced-system.js',
            '/js/bge-push-notification-system.js',
            '/images/bge-logo.png',
            '/images/hero/fachada1.jpg'
        ];

        // URLs que siempre requieren red
        this.networkFirstUrls = [
            '/api/',
            '/auth/',
            '/realtime/',
            '/analytics/'
        ];

        this.init();
    }

    async init() {
        console.log('📱 [BGE-PWA] Inicializando sistema PWA avanzado');

        try {
            // Registrar Service Worker
            await this.registerServiceWorker();

            // Configurar eventos de conectividad
            this.setupConnectivityHandlers();

            // Configurar instalación de app
            this.setupInstallHandlers();

            // Inicializar sincronización offline
            this.initializeOfflineSync();

            // Configurar UI de PWA
            this.setupPWAUI();

            // Precargar recursos críticos
            await this.precacheResources();

            // Configurar actualizaciones automáticas
            this.setupAutoUpdate();

            console.log('✅ [BGE-PWA] Sistema PWA inicializado correctamente');

        } catch (error) {
            console.error('❌ [BGE-PWA] Error inicializando PWA:', error);
            this.handlePWAError(error);
        }
    }

    // =====================================================
    // SERVICE WORKER Y REGISTRO
    // =====================================================

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker no soportado');
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw-advanced.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            console.log('📄 [BGE-PWA] Service Worker registrado:', this.swRegistration.scope);

            // Configurar listeners del SW
            this.setupServiceWorkerListeners();

            // Verificar actualización inmediata
            if (this.swRegistration.waiting) {
                this.handleServiceWorkerUpdate();
            }

        } catch (error) {
            console.error('❌ [BGE-PWA] Error registrando Service Worker:', error);
            throw error;
        }
    }

    setupServiceWorkerListeners() {
        // Listener para actualizaciones del SW
        this.swRegistration.addEventListener('updatefound', () => {
            console.log('🔄 [BGE-PWA] Actualización del Service Worker encontrada');
            this.handleServiceWorkerUpdate();
        });

        // Listener para mensajes del SW
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });

        // Listener para cambios en el estado del SW
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 [BGE-PWA] Service Worker actualizado');
            window.location.reload();
        });
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'CACHE_UPDATED':
                this.showUpdateNotification();
                break;
            case 'OFFLINE_READY':
                this.showOfflineReady();
                break;
            case 'SYNC_COMPLETE':
                this.handleSyncComplete(data);
                break;
            case 'BACKGROUND_SYNC':
                this.handleBackgroundSync(data);
                break;
            default:
                console.log('📨 [BGE-PWA] Mensaje del SW:', type, data);
        }
    }

    // =====================================================
    // GESTIÓN DE CONECTIVIDAD
    // =====================================================

    setupConnectivityHandlers() {
        // Eventos de conexión
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Verificación periódica de conectividad
        this.startConnectivityCheck();
    }

    handleOnline() {
        console.log('🌐 [BGE-PWA] Conexión restaurada');
        this.isOnline = true;

        // Ocultar indicador offline
        this.hideOfflineIndicator();

        // Sincronizar datos pendientes
        this.syncPendingData();

        // Mostrar notificación de reconexión
        this.showToast('Conexión restaurada - Sincronizando datos...', 'success');

        // Actualizar UI
        this.updateConnectivityUI(true);
    }

    handleOffline() {
        console.log('📡 [BGE-PWA] Sin conexión - Modo offline activado');
        this.isOnline = false;

        // Mostrar indicador offline
        this.showOfflineIndicator();

        // Mostrar notificación offline
        this.showToast('Sin conexión - Trabajando en modo offline', 'warning');

        // Actualizar UI
        this.updateConnectivityUI(false);
    }

    startConnectivityCheck() {
        setInterval(() => {
            this.checkRealConnectivity();
        }, 30000); // Verificar cada 30 segundos
    }

    async checkRealConnectivity() {
        if (!navigator.onLine) return;

        try {
            // Intentar fetch a un recurso pequeño
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache'
            });

            if (response.ok && !this.isOnline) {
                this.handleOnline();
            }
        } catch (error) {
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    // =====================================================
    // INSTALACIÓN DE APP
    // =====================================================

    setupInstallHandlers() {
        // Capturar prompt de instalación
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.installPrompt = event;
            this.showInstallPrompt();
            console.log('📲 [BGE-PWA] App puede ser instalada');
        });

        // Detectar instalación exitosa
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.installPrompt = null;
            this.hideInstallPrompt();
            this.showToast('¡App instalada exitosamente!', 'success');
            console.log('✅ [BGE-PWA] App instalada');

            // Analytics
            this.trackInstallation();
        });
    }

    async installApp() {
        if (!this.installPrompt) {
            console.warn('⚠️ [BGE-PWA] No hay prompt de instalación disponible');
            return false;
        }

        try {
            // Mostrar prompt de instalación
            this.installPrompt.prompt();

            // Esperar respuesta del usuario
            const result = await this.installPrompt.userChoice;

            if (result.outcome === 'accepted') {
                console.log('✅ [BGE-PWA] Usuario aceptó instalación');
                return true;
            } else {
                console.log('❌ [BGE-PWA] Usuario rechazó instalación');
                return false;
            }
        } catch (error) {
            console.error('❌ [BGE-PWA] Error en instalación:', error);
            return false;
        } finally {
            this.installPrompt = null;
        }
    }

    checkInstallationStatus() {
        // Detectar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 [BGE-PWA] App ejecutándose en modo instalado');
        }
    }

    // =====================================================
    // SINCRONIZACIÓN OFFLINE
    // =====================================================

    initializeOfflineSync() {
        // Interceptar formularios para queue offline
        this.interceptForms();

        // Interceptar fetch para datos críticos
        this.interceptFetch();

        // Iniciar sincronización periódica
        this.startPeriodicSync();

        console.log('🔄 [BGE-PWA] Sincronización offline inicializada');
    }

    interceptForms() {
        document.addEventListener('submit', (event) => {
            const form = event.target;

            if (form.tagName === 'FORM' && !this.isOnline) {
                event.preventDefault();
                this.queueFormData(form);
                this.showToast('Datos guardados - Se enviarán cuando haya conexión', 'info');
            }
        });
    }

    queueFormData(form) {
        const formData = new FormData(form);
        const data = {
            id: this.generateId(),
            type: 'form_submission',
            url: form.action || window.location.href,
            method: form.method || 'POST',
            data: Object.fromEntries(formData),
            timestamp: Date.now(),
            retries: 0
        };

        this.syncQueue.push(data);
        this.saveOfflineData();

        console.log('💾 [BGE-PWA] Datos de formulario guardados para sync:', data);
    }

    async syncPendingData() {
        if (this.syncQueue.length === 0) return;

        console.log(`🔄 [BGE-PWA] Sincronizando ${this.syncQueue.length} elementos pendientes`);

        const processed = [];
        const failed = [];

        for (const item of this.syncQueue) {
            try {
                await this.syncItem(item);
                processed.push(item);
                console.log('✅ [BGE-PWA] Item sincronizado:', item.id);
            } catch (error) {
                item.retries = (item.retries || 0) + 1;

                if (item.retries >= this.config.syncRetries) {
                    failed.push(item);
                    console.error('❌ [BGE-PWA] Item falló definitivamente:', item.id, error);
                } else {
                    console.warn(`⚠️ [BGE-PWA] Reintentando item (${item.retries}/${this.config.syncRetries}):`, item.id);
                }
            }
        }

        // Remover items procesados exitosamente
        this.syncQueue = this.syncQueue.filter(item => !processed.includes(item));

        // Remover items que fallaron definitivamente
        this.syncQueue = this.syncQueue.filter(item => !failed.includes(item));

        this.saveOfflineData();

        if (processed.length > 0) {
            this.showToast(`${processed.length} elementos sincronizados exitosamente`, 'success');
        }

        if (failed.length > 0) {
            this.showToast(`${failed.length} elementos fallaron en sincronización`, 'error');
        }
    }

    async syncItem(item) {
        const { type, url, method, data } = item;

        switch (type) {
            case 'form_submission':
                return await this.syncFormSubmission(url, method, data);
            case 'api_call':
                return await this.syncApiCall(url, method, data);
            default:
                throw new Error(`Tipo de sync no soportado: ${type}`);
        }
    }

    async syncFormSubmission(url, method, data) {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    async syncApiCall(url, method, data) {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    startPeriodicSync() {
        setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.syncPendingData();
            }
        }, this.config.syncInterval);
    }

    // =====================================================
    // PRECARGA Y CACHÉ
    // =====================================================

    async precacheResources() {
        if (!this.swRegistration) return;

        console.log('📦 [BGE-PWA] Precargando recursos críticos');

        try {
            // Enviar lista de recursos críticos al SW
            if (this.swRegistration.active) {
                this.swRegistration.active.postMessage({
                    type: 'PRECACHE_RESOURCES',
                    resources: this.criticalResources
                });
            }

            // Precargar en paralelo algunos recursos críticos
            await this.preloadCriticalResources();

            console.log('✅ [BGE-PWA] Recursos críticos precargados');

        } catch (error) {
            console.error('❌ [BGE-PWA] Error precargando recursos:', error);
        }
    }

    async preloadCriticalResources() {
        const preloadPromises = this.criticalResources
            .filter(url => url.endsWith('.css') || url.endsWith('.js'))
            .map(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = url;
                link.as = url.endsWith('.css') ? 'style' : 'script';
                document.head.appendChild(link);

                return new Promise(resolve => {
                    link.onload = resolve;
                    link.onerror = resolve; // No fallar si uno no carga
                });
            });

        await Promise.all(preloadPromises);
    }

    // =====================================================
    // INTERFAZ DE USUARIO PWA
    // =====================================================

    setupPWAUI() {
        this.createPWAControls();
        this.updateConnectivityUI(this.isOnline);
        this.checkInstallationStatus();
    }

    createPWAControls() {
        // Crear panel de control PWA
        const pwaPanelHTML = `
            <div id="pwa-controls" class="pwa-controls">
                <div class="pwa-status">
                    <div id="connectivity-status" class="status-indicator">
                        <span class="status-dot"></span>
                        <span class="status-text">Conectado</span>
                    </div>
                </div>

                <div class="pwa-actions" style="display: none;">
                    <button id="install-app-btn" class="pwa-btn install-btn" title="Instalar App">
                        📲 Instalar App
                    </button>
                    <button id="update-app-btn" class="pwa-btn update-btn" title="Actualizar" style="display: none;">
                        🔄 Actualizar
                    </button>
                    <button id="sync-data-btn" class="pwa-btn sync-btn" title="Sincronizar">
                        📡 Sincronizar
                    </button>
                </div>
            </div>
        `;

        // Insertar en el header o footer
        const targetElement = document.querySelector('header') || document.querySelector('.header') || document.body;
        targetElement.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(pwaPanelHTML)));

        this.initializePWAControls();
    }

    initializePWAControls() {
        // Botón de instalación
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.installApp();
            });
        }

        // Botón de actualización
        const updateBtn = document.getElementById('update-app-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                this.updateApp();
            });
        }

        // Botón de sincronización manual
        const syncBtn = document.getElementById('sync-data-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.forceSyncData();
            });
        }

        // Toggle de panel PWA
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'P') {
                this.togglePWAPanel();
            }
        });
    }

    showInstallPrompt() {
        const installBtn = document.getElementById('install-app-btn');
        const pwaActions = document.querySelector('.pwa-actions');

        if (installBtn && pwaActions) {
            pwaActions.style.display = 'block';
            installBtn.style.display = 'inline-block';

            // Mostrar toast informativo
            setTimeout(() => {
                this.showToast('¡Instala la app BGE para una mejor experiencia! Haz clic en 📲', 'info', 8000);
            }, 3000);
        }
    }

    hideInstallPrompt() {
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    updateConnectivityUI(isOnline) {
        const statusIndicator = document.getElementById('connectivity-status');
        if (!statusIndicator) return;

        const dot = statusIndicator.querySelector('.status-dot');
        const text = statusIndicator.querySelector('.status-text');

        if (isOnline) {
            statusIndicator.className = 'status-indicator online';
            text.textContent = 'Conectado';
            dot.title = 'Conexión activa';
        } else {
            statusIndicator.className = 'status-indicator offline';
            text.textContent = 'Sin conexión';
            dot.title = 'Modo offline';
        }
    }

    showOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = sanitizeHTML(`
                <div class="offline-content">
                    <span class="offline-icon">📡</span>
                    <span class="offline-text">Modo Offline</span>
                    <span class="offline-queue" id="offline-queue-count"></span>
                </div>
            `);
            document.body.appendChild(indicator);
        }

        indicator.classList.add('show');
        this.updateOfflineQueueCount();
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    updateOfflineQueueCount() {
        const queueCount = document.getElementById('offline-queue-count');
        if (queueCount && this.syncQueue.length > 0) {
            queueCount.textContent = `(${this.syncQueue.length} pendiente${this.syncQueue.length > 1 ? 's' : ''})`;
            queueCount.style.display = 'inline';
        } else if (queueCount) {
            queueCount.style.display = 'none';
        }
    }

    // =====================================================
    // ACTUALIZACIONES AUTOMÁTICAS
    // =====================================================

    setupAutoUpdate() {
        // Verificar actualizaciones cada hora
        setInterval(() => {
            this.checkForUpdates();
        }, 60 * 60 * 1000);

        // Verificar al hacer visible la ventana
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    async checkForUpdates() {
        if (!this.swRegistration) return;

        try {
            await this.swRegistration.update();
        } catch (error) {
            console.error('❌ [BGE-PWA] Error verificando actualizaciones:', error);
        }
    }

    handleServiceWorkerUpdate() {
        const updateBtn = document.getElementById('update-app-btn');
        if (updateBtn) {
            updateBtn.style.display = 'inline-block';
        }

        this.showUpdateNotification();
    }

    showUpdateNotification() {
        const updateHTML = `
            <div id="update-notification" class="update-notification">
                <div class="update-content">
                    <div class="update-icon">🚀</div>
                    <div class="update-message">
                        <h4>Nueva versión disponible</h4>
                        <p>Hay una actualización lista para instalar</p>
                    </div>
                    <div class="update-actions">
                        <button id="update-now-btn" class="btn-primary">Actualizar</button>
                        <button id="update-later-btn" class="btn-secondary">Más tarde</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(updateHTML)));

        // Configurar botones
        document.getElementById('update-now-btn').addEventListener('click', () => {
            this.updateApp();
        });

        document.getElementById('update-later-btn').addEventListener('click', () => {
            document.getElementById('update-notification').remove();
        });

        // Auto-ocultar después de 30 segundos
        setTimeout(() => {
            const notification = document.getElementById('update-notification');
            if (notification) {
                notification.remove();
            }
        }, 30000);
    }

    async updateApp() {
        if (!this.swRegistration || !this.swRegistration.waiting) return;

        console.log('🔄 [BGE-PWA] Aplicando actualización...');

        // Enviar mensaje al SW para skipWaiting
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Ocultar notificación de actualización
        const updateNotification = document.getElementById('update-notification');
        if (updateNotification) {
            updateNotification.remove();
        }

        // La página se recargará automáticamente cuando el nuevo SW tome control
        this.showToast('Aplicando actualización...', 'info');
    }

    // =====================================================
    // UTILIDADES Y HELPERS
    // =====================================================

    saveOfflineData() {
        try {
            localStorage.setItem('bge_sync_queue', JSON.stringify(this.syncQueue));
            localStorage.setItem('bge_offline_data', JSON.stringify(Array.from(this.offlineData.entries())));
        } catch (error) {
            console.error('❌ [BGE-PWA] Error guardando datos offline:', error);
        }
    }

    loadOfflineData() {
        try {
            const syncQueue = localStorage.getItem('bge_sync_queue');
            if (syncQueue) {
                this.syncQueue = JSON.parse(syncQueue);
            }

            const offlineData = localStorage.getItem('bge_offline_data');
            if (offlineData) {
                this.offlineData = new Map(JSON.parse(offlineData));
            }
        } catch (error) {
            console.error('❌ [BGE-PWA] Error cargando datos offline:', error);
        }
    }

    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getAuthToken() {
        return localStorage.getItem('bge_auth_token') || '';
    }

    async forceSyncData() {
        this.showToast('Iniciando sincronización manual...', 'info');

        try {
            await this.syncPendingData();
            this.showToast('Sincronización completada', 'success');
        } catch (error) {
            this.showToast('Error en sincronización: ' + error.message, 'error');
        }
    }

    togglePWAPanel() {
        const pwaPanelActions = document.querySelector('.pwa-actions');
        if (pwaPanelActions) {
            const isHidden = pwaPanelActions.style.display === 'none';
            pwaPanelActions.style.display = isHidden ? 'block' : 'none';
        }
    }

    showOfflineReady() {
        this.showToast('Modo offline listo - Puedes seguir trabajando sin conexión', 'success');
    }

    handleSyncComplete(data) {
        console.log('✅ [BGE-PWA] Sincronización completada:', data);
        this.updateOfflineQueueCount();
    }

    handleBackgroundSync(data) {
        console.log('🔄 [BGE-PWA] Sincronización en background:', data);
    }

    trackInstallation() {
        // Enviar evento a analytics si está disponible
        if (window.bgeAnalytics) {
            window.bgeAnalytics.track('pwa_installed', {
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            });
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = sanitizeHTML(`
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    handlePWAError(error) {
        console.error('💥 [BGE-PWA] Error crítico en PWA:', error);
        this.showToast('Error en funciones PWA - Algunas características pueden no estar disponibles', 'error');
    }

    // =====================================================
    // API PÚBLICA
    // =====================================================

    // Obtener estado de la PWA
    getStatus() {
        return {
            isOnline: this.isOnline,
            isInstalled: this.isInstalled,
            syncQueueLength: this.syncQueue.length,
            swRegistered: !!this.swRegistration,
            installPromptAvailable: !!this.installPrompt
        };
    }

    // Forzar instalación (si está disponible)
    async requestInstall() {
        return await this.installApp();
    }

    // Agregar datos a cola de sincronización
    queueForSync(type, url, method, data) {
        const item = {
            id: this.generateId(),
            type,
            url,
            method,
            data,
            timestamp: Date.now(),
            retries: 0
        };

        this.syncQueue.push(item);
        this.saveOfflineData();
        this.updateOfflineQueueCount();

        console.log('💾 [BGE-PWA] Item agregado a cola de sync:', item.id);
        return item.id;
    }

    // Obtener datos offline guardados
    getOfflineData(key) {
        return this.offlineData.get(key);
    }

    // Guardar datos para modo offline
    setOfflineData(key, data) {
        this.offlineData.set(key, {
            data,
            timestamp: Date.now()
        });
        this.saveOfflineData();
    }

    // Limpiar datos antiguos
    cleanupOfflineData(maxAge = this.config.cacheExpiration) {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.offlineData.entries()) {
            if (now - value.timestamp > maxAge) {
                this.offlineData.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.saveOfflineData();
            console.log(`🧹 [BGE-PWA] Limpiados ${cleaned} elementos offline antiguos`);
        }
    }

    // Obtener métricas de uso
    getMetrics() {
        return {
            syncQueueSize: this.syncQueue.length,
            offlineDataSize: this.offlineData.size,
            isOnline: this.isOnline,
            isInstalled: this.isInstalled,
            lastSync: localStorage.getItem('bge_last_sync'),
            cacheSize: this.estimateCacheSize()
        };
    }

    estimateCacheSize() {
        try {
            const syncData = localStorage.getItem('bge_sync_queue') || '';
            const offlineData = localStorage.getItem('bge_offline_data') || '';
            return syncData.length + offlineData.length;
        } catch {
            return 0;
        }
    }
}

// =====================================================
// INICIALIZACIÓN GLOBAL
// =====================================================

// Auto-inicializar PWA cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    if (!window.bgePWA) {
        window.bgePWA = new BGEAdvancedPWA();

        // Hacer disponible globalmente
        window.installBGEApp = () => window.bgePWA.requestInstall();

        console.log('📱 [BGE-PWA] Sistema PWA disponible globalmente');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEAdvancedPWA;
}
if (typeof window !== 'undefined') {
    window.BGEAdvancedPWA = BGEAdvancedPWA;
}