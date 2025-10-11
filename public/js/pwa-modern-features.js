/**
 * 🚀 PWA MODERN FEATURES - FASE 3
 * Funcionalidades avanzadas: Web Share API, Install Prompts, Background Sync, Offline
 */

class PWAModernFeatures {
    constructor() {
        this.installPrompt = null;
        this.isInstalled = this.checkInstallStatus();
        this.isOnline = navigator.onLine;
        this.offlineQueue = this.loadOfflineQueue();
        
        this.features = {
            webShare: 'share' in navigator,
            installPrompt: false,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            periodicBackgroundSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
            webLocks: 'locks' in navigator,
            clipboard: 'clipboard' in navigator,
            contacts: 'contacts' in navigator,
            fileSystemAccess: 'showOpenFilePicker' in window
        };
        
        this.syncData = {
            lastSync: this.getLastSync(),
            pendingOperations: [],
            syncInterval: 30000 // 30 seconds
        };
        
        this.init();
    }

    init() {
        //console.log('🚀 Inicializando PWA Modern Features...');
        
        this.setupEventListeners();
        this.checkFeatureSupport();
        this.setupOfflineHandling();
        this.setupBackgroundSync();
        this.setupPeriodicSync();
        this.setupWebShareButtons();
        this.setupClipboardFeatures();
        
        //console.log('✅ PWA Modern Features inicializado');
        //console.log('🔧 Features soportadas:', this.features);
    }

    // === FEATURE DETECTION ===
    checkFeatureSupport() {
        // Update feature support status
        this.features.installPrompt = !!window.deferredPrompt;
        
        // Log available features
        Object.entries(this.features).forEach(([feature, supported]) => {
            //console.log(`${supported ? '✅' : '❌'} ${feature}: ${supported}`);
        });
    }

    checkInstallStatus() {
        // Check if running as installed PWA
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.matchMedia('(display-mode: fullscreen)').matches ||
               window.navigator.standalone === true;
    }

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.features.installPrompt = true;
            this.showInstallBanner();
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallBanner();
            this.trackInstallation();
            //console.log('🎉 PWA instalada exitosamente');
        });

        // Network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });

        // Visibility change for background sync
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handleVisibilityChange();
            }
        });
    }

    // === WEB SHARE API ===
    async shareContent(data) {
        if (!this.features.webShare) {
            this.fallbackShare(data);
            return;
        }

        try {
            await navigator.share({
                title: data.title || document.title,
                text: data.text || 'Bachillerato General Estatal Héroes de la Patria',
                url: data.url || window.location.href
            });
            
            //console.log('✅ Contenido compartido exitosamente');
            this.trackShare('native', data);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Error sharing:', error);
                this.fallbackShare(data);
            }
        }
    }

    fallbackShare(data) {
        const shareData = {
            title: data.title || document.title,
            text: data.text || 'Bachillerato General Estatal Héroes de la Patria',
            url: data.url || window.location.href
        };

        // Show share modal
        this.showShareModal(shareData);
        this.trackShare('fallback', data);
    }

    showShareModal(data) {
        const modal = document.createElement('div');
        modal.className = 'pwa-share-modal';
        modal.innerHTML = `
            <div class="pwa-share-overlay" onclick="this.parentElement.remove()"></div>
            <div class="pwa-share-content">
                <div class="pwa-share-header">
                    <h3>Compartir</h3>
                    <button class="pwa-share-close" onclick="this.closest('.pwa-share-modal').remove()">×</button>
                </div>
                <div class="pwa-share-options">
                    <button onclick="pwaModernFeatures.shareToSocial('facebook', '${data.url}')" class="pwa-share-btn facebook">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </button>
                    <button onclick="pwaModernFeatures.shareToSocial('twitter', '${data.url}', '${data.text}')" class="pwa-share-btn twitter">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button onclick="pwaModernFeatures.shareToSocial('whatsapp', '${data.url}', '${data.text}')" class="pwa-share-btn whatsapp">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button onclick="pwaModernFeatures.copyToClipboard('${data.url}')" class="pwa-share-btn copy">
                        <i class="fas fa-copy"></i> Copiar enlace
                    </button>
                </div>
            </div>
        `;

        this.injectShareStyles();
        document.body.appendChild(modal);
    }

    shareToSocial(platform, url, text = '') {
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text);
        
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
            whatsapp: `https://wa.me/?text=${encodedText} ${encodedUrl}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }

        // Close modal
        document.querySelector('.pwa-share-modal')?.remove();
    }

    setupWebShareButtons() {
        // Add share buttons to existing content
        const shareButtons = document.querySelectorAll('[data-share]');
        
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const shareData = {
                    title: button.dataset.shareTitle,
                    text: button.dataset.shareText,
                    url: button.dataset.shareUrl || window.location.href
                };
                this.shareContent(shareData);
            });
        });

        // Add global share button if none exists
        this.addGlobalShareButton();
    }

    addGlobalShareButton() {
        if (document.querySelector('.pwa-global-share')) return;

        const shareButton = document.createElement('button');
        shareButton.className = 'pwa-global-share';
        shareButton.innerHTML = '<i class="fas fa-share-alt"></i>';
        shareButton.title = 'Compartir página';
        shareButton.addEventListener('click', () => {
            this.shareContent({
                title: document.title,
                url: window.location.href
            });
        });

        // Add to page
        document.body.appendChild(shareButton);
    }

    // === INSTALL FEATURES ===
    async promptInstall() {
        if (!this.installPrompt) {
            console.warn('Install prompt not available');
            return false;
        }

        try {
            this.installPrompt.prompt();
            const result = await this.installPrompt.userChoice;
            
            //console.log('Install prompt result:', result.outcome);
            this.trackInstallPrompt(result.outcome);
            
            this.installPrompt = null;
            return result.outcome === 'accepted';
        } catch (error) {
            console.error('Error showing install prompt:', error);
            return false;
        }
    }

    showInstallBanner() {
        if (this.isInstalled || document.querySelector('.pwa-install-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-icon">
                    <img src="./images/app_icons/icon-192x192.webp" alt="App Icon" width="48" height="48">
                </div>
                <div class="pwa-install-text">
                    <strong>Instalar Héroes de la Patria</strong>
                    <p>Accede más rápido desde tu dispositivo</p>
                </div>
                <div class="pwa-install-actions">
                    <button class="pwa-install-btn primary" onclick="pwaModernFeatures.promptInstall()">
                        Instalar
                    </button>
                    <button class="pwa-install-btn" onclick="this.closest('.pwa-install-banner').remove()">
                        Más tarde
                    </button>
                </div>
            </div>
        `;

        this.injectInstallStyles();
        document.body.appendChild(banner);

        // Auto-hide after 30 seconds
        setTimeout(() => {
            banner.remove();
        }, 30000);
    }

    hideInstallBanner() {
        document.querySelector('.pwa-install-banner')?.remove();
    }

    // === OFFLINE FUNCTIONALITY ===
    setupOfflineHandling() {
        this.createOfflineIndicator();
        
        if (!this.isOnline) {
            this.handleOffline();
        }
    }

    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pwa-offline-indicator';
        indicator.innerHTML = `
            <div class="pwa-offline-content">
                <i class="fas fa-wifi"></i>
                <span>Sin conexión - Modo offline activo</span>
            </div>
        `;
        document.body.appendChild(indicator);
    }

    handleOffline() {
        //console.log('📵 Modo offline activado');
        
        document.body.classList.add('pwa-offline');
        document.querySelector('.pwa-offline-indicator')?.classList.add('show');
        
        // Show offline message
        this.showOfflineNotification();
        
        // Queue network requests
        this.interceptNetworkRequests();
    }

    handleOnline() {
        //console.log('🌐 Conexión restaurada');
        
        document.body.classList.remove('pwa-offline');
        document.querySelector('.pwa-offline-indicator')?.classList.remove('show');
        
        // Process offline queue
        this.processOfflineQueue();
        
        // Sync data
        this.syncAppData();
    }

    showOfflineNotification() {
        if (window.pwaNotifications && !document.querySelector('.pwa-offline-notification')) {
            const notification = document.createElement('div');
            notification.className = 'pwa-offline-notification';
            notification.innerHTML = `
                <div class="pwa-offline-notification-content">
                    <i class="fas fa-info-circle"></i>
                    <span>Estás navegando sin conexión. Algunas funciones pueden no estar disponibles.</span>
                    <button onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 10000);
        }
    }

    interceptNetworkRequests() {
        // This would typically be handled by the service worker
        // Here we can queue important operations
        this.setupRequestInterception();
    }

    setupRequestInterception() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            if (!this.isOnline) {
                // Queue request for later
                this.queueOfflineRequest(args);
                throw new Error('Network unavailable - queued for sync');
            }
            
            return originalFetch(...args);
        };
    }

    queueOfflineRequest(requestArgs) {
        const queueItem = {
            id: Date.now() + Math.random(),
            args: requestArgs,
            timestamp: Date.now(),
            retries: 0
        };
        
        this.offlineQueue.push(queueItem);
        this.saveOfflineQueue();
        
        //console.log('📋 Request queued for offline sync:', queueItem.id);
    }

    async processOfflineQueue() {
        //console.log(`📤 Processing ${this.offlineQueue.length} queued requests...`);
        
        const processed = [];
        
        for (const item of this.offlineQueue) {
            try {
                await fetch(...item.args);
                processed.push(item);
                //console.log('✅ Processed queued request:', item.id);
            } catch (error) {
                item.retries++;
                if (item.retries >= 3) {
                    processed.push(item); // Remove after 3 failed attempts
                    console.warn('❌ Failed to process request after 3 attempts:', item.id);
                }
            }
        }
        
        // Remove processed items
        this.offlineQueue = this.offlineQueue.filter(item => !processed.includes(item));
        this.saveOfflineQueue();
    }

    // === BACKGROUND SYNC ===
    setupBackgroundSync() {
        if (!this.features.backgroundSync) {
            console.warn('Background Sync not supported');
            return;
        }

        // Register for background sync
        navigator.serviceWorker?.ready.then(registration => {
            registration.sync.register('background-sync');
        });
    }

    setupPeriodicSync() {
        if (!this.features.periodicBackgroundSync) {
            console.warn('Periodic Background Sync not supported');
            return;
        }

        navigator.serviceWorker?.ready.then(async (registration) => {
            try {
                await registration.periodicSync.register('periodic-background-sync', {
                    minInterval: 24 * 60 * 60 * 1000, // 24 hours
                });
                //console.log('✅ Periodic Background Sync registered');
            } catch (error) {
                console.warn('Error registering Periodic Background Sync:', error);
            }
        });
    }

    async syncAppData() {
        //console.log('🔄 Syncing data...');
        
        try {
            // Sync critical data
            await this.syncCriticalData();
            
            // Update last sync time
            this.syncData.lastSync = Date.now();
            localStorage.setItem('pwa-last-sync', this.syncData.lastSync.toString());
            
            //console.log('✅ Data sync completed');
        } catch (error) {
            console.error('❌ Data sync failed:', error);
        }
    }

    async syncCriticalData() {
        // Sync user preferences
        await this.syncUserPreferences();
        
        // Sync cached data
        await this.syncCachedData();
        
        // Sync analytics
        await this.syncAnalytics();
    }

    // === CLIPBOARD FEATURES ===
    setupClipboardFeatures() {
        if (!this.features.clipboard) {
            console.warn('Clipboard API not supported');
            return;
        }

        // Add copy buttons to relevant elements
        this.addCopyButtons();
    }

    async copyToClipboard(text, showFeedback = true) {
        try {
            await navigator.clipboard.writeText(text);
            
            if (showFeedback) {
                this.showCopyFeedback();
            }
            
            //console.log('✅ Text copied to clipboard');
            return true;
        } catch (error) {
            console.warn('Error copying to clipboard:', error);
            return this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const success = document.execCommand('copy');
            if (success) this.showCopyFeedback();
            return success;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }

    showCopyFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'pwa-copy-feedback';
        feedback.textContent = '✅ Copiado al portapapeles';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    addCopyButtons() {
        const copyTargets = document.querySelectorAll('[data-copy]');
        
        copyTargets.forEach(element => {
            const copyButton = document.createElement('button');
            copyButton.className = 'pwa-copy-btn';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copiar';
            
            copyButton.addEventListener('click', () => {
                const textToCopy = element.dataset.copy || element.textContent;
                this.copyToClipboard(textToCopy);
            });
            
            element.appendChild(copyButton);
        });
    }

    // === STORAGE AND PERSISTENCE ===
    loadOfflineQueue() {
        try {
            const stored = localStorage.getItem('pwa-offline-queue');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveOfflineQueue() {
        localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
    }

    getLastSync() {
        try {
            return parseInt(localStorage.getItem('pwa-last-sync') || '0');
        } catch {
            return 0;
        }
    }

    // === ANALYTICS ===
    trackShare(method, data) {
        //console.log('📊 Share tracked:', method, data);
        // Send to analytics service
    }

    trackInstallPrompt(outcome) {
        //console.log('📊 Install prompt tracked:', outcome);
        // Send to analytics service
    }

    trackInstallation() {
        //console.log('📊 Installation tracked');
        // Send to analytics service
    }

    // === EVENT HANDLERS ===
    handleVisibilityChange() {
        if (this.isOnline) {
            this.syncAppData();
        }
    }

    // === UTILITY FUNCTIONS ===
    async syncUserPreferences() {
        // Placeholder for syncing user preferences
        //console.log('🔄 Syncing user preferences...');
    }

    async syncCachedData() {
        // Placeholder for syncing cached data
        //console.log('🔄 Syncing cached data...');
    }

    async syncAnalytics() {
        // Placeholder for syncing analytics
        //console.log('🔄 Syncing analytics...');
    }

    // === STYLES ===
    injectShareStyles() {
        if (document.querySelector('#pwa-share-styles')) return;

        const style = document.createElement('style');
        style.id = 'pwa-share-styles';
        style.textContent = `
            .pwa-share-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .pwa-share-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
            }
            
            .pwa-share-content {
                background: white;
                border-radius: 12px;
                padding: 0;
                max-width: 400px;
                width: 90vw;
                position: relative;
                overflow: hidden;
            }
            
            .pwa-share-header {
                background: #f8f9fa;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #dee2e6;
            }
            
            .pwa-share-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6c757d;
            }
            
            .pwa-share-options {
                padding: 20px;
                display: grid;
                gap: 10px;
            }
            
            .pwa-share-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                border: 1px solid #dee2e6;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
                color: #333;
            }
            
            .pwa-share-btn:hover {
                background: #f8f9fa;
            }
            
            .pwa-share-btn.facebook { color: #1877f2; }
            .pwa-share-btn.twitter { color: #1da1f2; }
            .pwa-share-btn.whatsapp { color: #25d366; }
            .pwa-share-btn.copy { color: #6c757d; }
            
            .pwa-global-share {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 56px;
                height: 56px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s;
                z-index: 1000;
            }
            
            .pwa-global-share:hover {
                background: #0056b3;
                transform: scale(1.1);
            }
        `;
        
        document.head.appendChild(style);
    }

    injectInstallStyles() {
        if (document.querySelector('#pwa-install-styles')) return;

        const style = document.createElement('style');
        style.id = 'pwa-install-styles';
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-top: 1px solid #dee2e6;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
                z-index: 9999;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            
            .pwa-install-content {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 20px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .pwa-install-icon img {
                border-radius: 12px;
            }
            
            .pwa-install-text {
                flex: 1;
            }
            
            .pwa-install-text p {
                margin: 0;
                color: #6c757d;
                font-size: 14px;
            }
            
            .pwa-install-actions {
                display: flex;
                gap: 10px;
            }
            
            .pwa-install-btn {
                padding: 8px 16px;
                border: 1px solid #dee2e6;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .pwa-install-btn.primary {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            
            .pwa-install-btn:hover {
                background: #f8f9fa;
            }
            
            .pwa-install-btn.primary:hover {
                background: #0056b3;
            }
            
            .pwa-offline-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ffc107;
                color: #212529;
                padding: 8px;
                text-align: center;
                transform: translateY(-100%);
                transition: transform 0.3s ease;
                z-index: 10000;
                font-size: 14px;
            }
            
            .pwa-offline-indicator.show {
                transform: translateY(0);
            }
            
            .pwa-copy-feedback {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #28a745;
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 10000;
            }
            
            .pwa-copy-feedback.show {
                opacity: 1;
            }
        `;
        
        document.head.appendChild(style);
    }

    // === PUBLIC API ===
    getStatus() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            features: this.features,
            offlineQueueSize: this.offlineQueue.length,
            lastSync: this.syncData.lastSync,
            installPromptAvailable: !!this.installPrompt
        };
    }
}

// Initialize
let pwaModernFeatures;

document.addEventListener('DOMContentLoaded', () => {
    pwaModernFeatures = new PWAModernFeatures();
    
    // Make globally accessible
    window.pwaModernFeatures = pwaModernFeatures;
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAModernFeatures;
}