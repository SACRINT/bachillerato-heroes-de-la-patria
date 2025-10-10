/**
 * 📱 BGE PWA MODULE - Sistema PWA Completo
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Versión: 1.0.0
 * Fecha: 27 de Septiembre, 2025
 *
 * PROPÓSITO: Consolidar todas las funcionalidades PWA en un módulo unificado
 * CONSOLIDA:
 * - pwa-advanced.js (35,402 bytes) - PWA avanzado principal
 * - pwa-installer.js (28,252 bytes) - Sistema de instalación
 * - pwa-optimizer.js (30,732 bytes) - Optimizaciones PWA
 * - mobile-optimizer.js (20,813 bytes) - Optimizaciones móvil
 * - mobile-ux-manager.js (23,369 bytes) - UX móvil
 * - intelligent-cache-system.js (20,948 bytes) - Sistema de caché
 * - auto-update-system.js (21,933 bytes) - Actualizaciones automáticas
 * - push-notification-manager.js (50,819 bytes) - Notificaciones push
 * - real-time-notifications.js (25,371 bytes) - Notificaciones tiempo real
 */

class BGEPWAModule extends BGEModule {
    constructor(framework) {
        super(framework);
        this.name = 'pwa';

        // Core PWA components
        this.serviceWorker = null;
        this.installer = null;
        this.cacheManager = null;
        this.updateManager = null;
        this.notificationManager = null;
        this.mobileOptimizer = null;

        // PWA state
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.installation = {
            prompt: null,
            supported: false,
            installed: false
        };

        // Cache system
        this.cache = {
            version: 'bge-pwa-v1.0.0',
            strategies: new Map(),
            statistics: {
                hits: 0,
                misses: 0,
                size: 0
            }
        };

        // Notification system
        this.notifications = {
            permission: 'default',
            subscription: null,
            queue: [],
            settings: this.loadNotificationSettings()
        };

        // Mobile optimization
        this.mobile = {
            isDetected: this.detectMobile(),
            orientation: screen.orientation?.angle || 0,
            viewport: this.getViewportInfo(),
            performance: {
                memory: navigator.deviceMemory || 'unknown',
                connection: navigator.connection?.effectiveType || 'unknown'
            }
        };

        // Configuration
        this.config = {
            enableServiceWorker: true,
            enableInstallPrompt: true,
            enablePushNotifications: true,
            enableOfflineMode: true,
            enableAutoUpdate: true,
            enableMobileOptimization: true,
            cacheStrategy: 'cache-first',
            updateCheckInterval: 3600000, // 1 hour
            notificationBadging: true,
            backgroundSync: true
        };
    }

    async initialize() {
        await super.initialize();

        try {
            this.log('Inicializando sistema PWA completo...');

            // Initialize core PWA systems
            await this.initializeServiceWorker();
            await this.initializeCacheManager();
            await this.initializeInstaller();
            await this.initializeUpdateManager();
            await this.initializeNotificationManager();
            await this.initializeMobileOptimizer();

            // Setup PWA event handlers
            this.setupPWAEventHandlers();

            // Configure offline/online detection
            this.setupConnectivityMonitoring();

            // Initialize mobile-specific optimizations
            if (this.mobile.isDetected) {
                await this.initializeMobileFeatures();
            }

            // Start background services
            this.startBackgroundServices();

            this.log('Módulo PWA inicializado correctamente');

        } catch (error) {
            this.error('Error inicializando módulo PWA:', error);
            throw error;
        }
    }

    async initializeServiceWorker() {
        this.log('Inicializando Service Worker...');

        if (!('serviceWorker' in navigator)) {
            this.log('Service Worker no soportado');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw-offline-first.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            this.serviceWorker = {
                registration,
                active: registration.active,
                installing: registration.installing,
                waiting: registration.waiting
            };

            // Setup service worker event handlers
            registration.addEventListener('updatefound', () => {
                this.handleServiceWorkerUpdate(registration);
            });

            // Check for updates
            registration.update();

            this.log('Service Worker registrado correctamente');

        } catch (error) {
            this.error('Error registrando Service Worker:', error);
        }
    }

    async initializeCacheManager() {
        this.log('Inicializando sistema de caché...');

        this.cacheManager = {
            strategies: this.createCacheStrategies(),
            cleaner: this.createCacheCleaner(),
            monitor: this.createCacheMonitor(),
            preloader: this.createCachePreloader()
        };

        // Setup cache strategies
        await this.setupCacheStrategies();

        // Monitor cache usage
        this.monitorCacheUsage();
    }

    async initializeInstaller() {
        this.log('Inicializando sistema de instalación...');

        this.installer = {
            prompt: this.createInstallPrompt(),
            detector: this.createInstallDetector(),
            ui: this.createInstallUI(),
            analytics: this.createInstallAnalytics()
        };

        // Detect installation support
        this.detectInstallationSupport();

        // Setup install prompt handling
        this.setupInstallPromptHandling();
    }

    async initializeUpdateManager() {
        this.log('Inicializando gestor de actualizaciones...');

        this.updateManager = {
            checker: this.createUpdateChecker(),
            installer: this.createUpdateInstaller(),
            notifier: this.createUpdateNotifier(),
            scheduler: this.createUpdateScheduler()
        };

        // Schedule periodic update checks
        this.scheduleUpdateChecks();
    }

    async initializeNotificationManager() {
        this.log('Inicializando gestor de notificaciones...');

        this.notificationManager = {
            permission: await this.requestNotificationPermission(),
            subscription: await this.getNotificationSubscription(),
            sender: this.createNotificationSender(),
            processor: this.createNotificationProcessor(),
            badging: this.createBadgingSystem()
        };

        // Setup push notifications if supported
        if ('PushManager' in window) {
            await this.setupPushNotifications();
        }

        // Setup notification event handlers
        this.setupNotificationEventHandlers();
    }

    async initializeMobileOptimizer() {
        this.log('Inicializando optimizador móvil...');

        this.mobileOptimizer = {
            ux: this.createMobileUXOptimizer(),
            performance: this.createMobilePerformanceOptimizer(),
            gestures: this.createGestureHandler(),
            orientation: this.createOrientationHandler(),
            viewport: this.createViewportOptimizer()
        };

        if (this.mobile.isDetected) {
            await this.applyMobileOptimizations();
        }
    }

    // Cache Strategy Implementation
    createCacheStrategies() {
        return {
            'cache-first': async (request) => {
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    this.cache.statistics.hits++;
                    return cachedResponse;
                }

                try {
                    const networkResponse = await fetch(request);
                    this.cache.statistics.misses++;

                    if (networkResponse.ok) {
                        const cache = await caches.open(this.cache.version);
                        cache.put(request, networkResponse.clone());
                    }

                    return networkResponse;
                } catch (error) {
                    this.error('Cache-first strategy failed:', error);
                    throw error;
                }
            },

            'network-first': async (request) => {
                try {
                    const networkResponse = await fetch(request);

                    if (networkResponse.ok) {
                        const cache = await caches.open(this.cache.version);
                        cache.put(request, networkResponse.clone());
                    }

                    return networkResponse;
                } catch (error) {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        this.cache.statistics.hits++;
                        return cachedResponse;
                    }
                    throw error;
                }
            },

            'stale-while-revalidate': async (request) => {
                const cachedResponse = await caches.match(request);

                const fetchPromise = fetch(request).then(networkResponse => {
                    if (networkResponse.ok) {
                        const cache = caches.open(this.cache.version);
                        cache.then(c => c.put(request, networkResponse.clone()));
                    }
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchPromise;
            }
        };
    }

    // Installation System
    createInstallPrompt() {
        return {
            show: async () => {
                if (!this.installation.prompt) {
                    this.log('No hay prompt de instalación disponible');
                    return false;
                }

                try {
                    const result = await this.installation.prompt.prompt();
                    this.trackInstallChoice(result.outcome);

                    if (result.outcome === 'accepted') {
                        this.installation.installed = true;
                        this.showInstallationSuccess();
                    }

                    this.installation.prompt = null;
                    return result.outcome === 'accepted';

                } catch (error) {
                    this.error('Error mostrando prompt de instalación:', error);
                    return false;
                }
            },

            isAvailable: () => !!this.installation.prompt,

            createUI: () => {
                if (!this.installation.prompt || this.installation.installed) {
                    return null;
                }

                const installBanner = document.createElement('div');
                installBanner.className = 'bge-install-banner';
                installBanner.innerHTML = `
                    <div class="install-content">
                        <div class="install-icon">📱</div>
                        <div class="install-text">
                            <h4>Instalar BGE Héroes</h4>
                            <p>Accede rápidamente desde tu pantalla de inicio</p>
                        </div>
                        <div class="install-actions">
                            <button class="btn btn-primary install-btn">Instalar</button>
                            <button class="btn btn-outline-secondary dismiss-btn">Ahora no</button>
                        </div>
                    </div>
                `;

                installBanner.querySelector('.install-btn').addEventListener('click', () => {
                    this.installer.prompt.show();
                    installBanner.remove();
                });

                installBanner.querySelector('.dismiss-btn').addEventListener('click', () => {
                    installBanner.remove();
                    this.trackInstallChoice('dismissed');
                });

                return installBanner;
            }
        };
    }

    // Notification System
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.log('Notificaciones no soportadas');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.notifications.permission = permission;
            return permission;
        }

        return Notification.permission;
    }

    async setupPushNotifications() {
        if (!this.serviceWorker?.registration) {
            this.log('Service Worker requerido para push notifications');
            return;
        }

        try {
            const subscription = await this.serviceWorker.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.getVAPIDKey()
            });

            this.notifications.subscription = subscription;
            await this.sendSubscriptionToServer(subscription);

            this.log('Push notifications configuradas');

        } catch (error) {
            this.error('Error configurando push notifications:', error);
        }
    }

    createNotificationSender() {
        return {
            show: (title, options = {}) => {
                if (this.notifications.permission !== 'granted') {
                    this.log('Sin permisos para mostrar notificaciones');
                    return null;
                }

                const notification = new Notification(title, {
                    icon: '/images/icons/icon-192x192.png',
                    badge: '/images/icons/badge-72x72.png',
                    tag: 'bge-notification',
                    requireInteraction: false,
                    ...options
                });

                this.trackNotification('shown', title);
                return notification;
            },

            showPersistent: async (title, options = {}) => {
                if (!this.serviceWorker?.registration) {
                    return this.notificationManager.sender.show(title, options);
                }

                await this.serviceWorker.registration.showNotification(title, {
                    icon: '/images/icons/icon-192x192.png',
                    badge: '/images/icons/badge-72x72.png',
                    tag: 'bge-persistent',
                    requireInteraction: true,
                    ...options
                });

                this.trackNotification('persistent', title);
            }
        };
    }

    // Mobile Optimization
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'portrait-primary'
        };
    }

    async applyMobileOptimizations() {
        this.log('Aplicando optimizaciones móviles...');

        // Optimize viewport
        this.optimizeViewport();

        // Setup touch optimizations
        this.setupTouchOptimizations();

        // Optimize images for mobile
        this.optimizeImagesForMobile();

        // Setup orientation handling
        this.setupOrientationHandling();

        // Optimize scrolling performance
        this.optimizeScrolling();
    }

    optimizeViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover';
        }

        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
        });
    }

    setupTouchOptimizations() {
        // Add touch-friendly classes
        document.body.classList.add('touch-device');

        // Optimize button sizes
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            if (!button.style.minHeight) {
                button.style.minHeight = '44px';
                button.style.minWidth = '44px';
            }
        });

        // Add touch feedback
        this.addTouchFeedback();
    }

    // Event Handlers and Background Services
    setupPWAEventHandlers() {
        // Install prompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installation.prompt = e;
            this.installation.supported = true;
            this.showInstallBanner();
        });

        // App installed event
        window.addEventListener('appinstalled', () => {
            this.installation.installed = true;
            this.hideInstallBanner();
            this.trackInstallChoice('accepted');
        });

        // Visibility change for background sync
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncWhenVisible();
            }
        });
    }

    setupConnectivityMonitoring() {
        const updateOnlineStatus = () => {
            const wasOnline = this.isOnline;
            this.isOnline = navigator.onLine;

            if (wasOnline !== this.isOnline) {
                this.handleConnectivityChange(this.isOnline);
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }

    handleConnectivityChange(isOnline) {
        if (isOnline) {
            this.log('Conexión restaurada');
            this.showConnectivityNotification('Conexión restaurada', 'success');
            this.syncPendingData();
        } else {
            this.log('Sin conexión - modo offline activado');
            this.showConnectivityNotification('Sin conexión', 'warning');
        }

        // Update UI to reflect connectivity state
        document.body.classList.toggle('offline', !isOnline);
        document.body.classList.toggle('online', isOnline);
    }

    // Public API methods
    async installApp() {
        return this.installer.prompt.show();
    }

    async showNotification(title, options = {}) {
        return this.notificationManager.sender.show(title, options);
    }

    async checkForUpdates() {
        return this.updateManager.checker.check();
    }

    getCacheStatistics() {
        return {
            ...this.cache.statistics,
            version: this.cache.version,
            strategies: Array.from(this.cache.strategies.keys())
        };
    }

    getInstallationStatus() {
        return {
            supported: this.installation.supported,
            installed: this.installation.installed,
            available: this.installer.prompt.isAvailable()
        };
    }

    getPWAStatus() {
        return {
            serviceWorker: !!this.serviceWorker?.active,
            notifications: this.notifications.permission,
            installation: this.getInstallationStatus(),
            online: this.isOnline,
            mobile: this.mobile.isDetected,
            cache: this.getCacheStatistics()
        };
    }

    // Utility methods
    getVAPIDKey() {
        // Return VAPID public key for push notifications
        return 'YOUR_VAPID_PUBLIC_KEY';
    }

    loadNotificationSettings() {
        const stored = localStorage.getItem('bge_notification_settings');
        return stored ? JSON.parse(stored) : {
            enabled: true,
            types: ['general', 'academic', 'events'],
            quiet_hours: { start: '22:00', end: '07:00' }
        };
    }

    trackInstallChoice(outcome) {
        if (this.framework.modules.has('analytics')) {
            this.framework.modules.get('analytics').track('pwa_install', { outcome });
        }
    }

    trackNotification(type, title) {
        if (this.framework.modules.has('analytics')) {
            this.framework.modules.get('analytics').track('notification', { type, title });
        }
    }

    showInstallBanner() {
        if (this.installation.installed) return;

        const banner = this.installer.prompt.createUI();
        if (banner) {
            document.body.appendChild(banner);
        }
    }

    hideInstallBanner() {
        const banner = document.querySelector('.bge-install-banner');
        if (banner) {
            banner.remove();
        }
    }

    showConnectivityNotification(message, type) {
        if (this.notificationManager.sender) {
            this.notificationManager.sender.show('BGE Héroes', {
                body: message,
                tag: 'connectivity',
                icon: `/images/icons/icon-${type === 'success' ? 'online' : 'offline'}.png`
            });
        }
    }

    async syncPendingData() {
        // Sync any pending data when connection is restored
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'BACKGROUND_SYNC',
                tag: 'pending-data'
            });
        }
    }

    startBackgroundServices() {
        // Start periodic update checks
        if (this.config.enableAutoUpdate) {
            setInterval(() => {
                this.updateManager.checker.check();
            }, this.config.updateCheckInterval);
        }

        // Start cache monitoring
        setInterval(() => {
            this.monitorCacheUsage();
        }, 300000); // Every 5 minutes
    }

    async monitorCacheUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            this.cache.statistics.size = estimate.usage || 0;

            // Log cache usage if debug is enabled
            if (this.framework.config.debug) {
                this.log(`Cache usage: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB`);
            }
        }
    }
}

// Export for BGE Framework
window.BGEPWAModule = BGEPWAModule;

// Standalone initialization (if not using framework)
if (typeof window !== 'undefined' && !window.BGE) {
    window.addEventListener('DOMContentLoaded', () => {
        window.bgePWA = new BGEPWAModule(null);
    });
}