/**
 * Sistema de Actualizaciones Automáticas BGE
 * Versión: 1.0
 * Fecha: 21-09-2025
 */

class BGEAutoUpdateSystem {
    constructor() {
        this.updateCheckInterval = 5 * 60 * 1000; // 5 minutos
        this.currentVersion = this.getCurrentVersion();
        this.updateInProgress = false;
        this.serviceWorker = null;
        this.updateAvailable = false;

        // Detectar entorno de desarrollo
        this.isDevelopment = this.detectDevelopmentEnvironment();
        this.devToolsOpen = this.detectDevTools();

        console.log('🔄 [AUTO-UPDATE] Sistema iniciado', {
            version: this.currentVersion,
            isDevelopment: this.isDevelopment,
            devToolsOpen: this.devToolsOpen
        });

        this.init();
    }

    init() {
        // ✅ [PRODUCCIÓN] Sistema de auto-actualización habilitado
        console.log('🚀 [AUTO-UPDATE] Sistema HABILITADO para producción');

        // Solo deshabilitar si está explícitamente en localhost para desarrollo
        if (this.isDevelopment && window.location.hostname === 'localhost') {
            console.log('🚫 [AUTO-UPDATE] Deshabilitado solo en localhost de desarrollo');
            return;
        }

        this.registerServiceWorker();
        this.startPeriodicChecks();
        this.setupEventListeners();
        this.showUpdateStatus();
    }

    getCurrentVersion() {
        // Obtener versión del localStorage o generar una nueva
        let version = localStorage.getItem('bge_app_version');
        if (!version) {
            version = new Date().toISOString().split('T')[0].replace(/-/g, '.');
            localStorage.setItem('bge_app_version', version);
        }
        return version;
    }

    detectDevelopmentEnvironment() {
        // Detección específica y robusta de entorno de desarrollo
        const isDev = (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '' ||
            window.location.port === '3000' ||
            window.location.port === '8080' ||
            window.location.protocol === 'file:' ||
            (window.location.href.includes('localhost')) ||
            (document.documentElement.hasAttribute('data-development'))
        );

        // Logging detallado para debugging
        if (isDev) {
            console.log('🔍 [AUTO-UPDATE] Entorno de desarrollo detectado:', {
                hostname: window.location.hostname,
                port: window.location.port,
                protocol: window.location.protocol,
                href: window.location.href
            });
        }

        return isDev;
    }

    detectDevTools() {
        // Detectar si DevTools está abierto
        let devtools = false;
        const threshold = 160;

        if (
            window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold
        ) {
            devtools = true;
        }

        // También verificar console.clear override
        const originalClear = console.clear;
        console.clear = function() {
            devtools = true;
            return originalClear.apply(console, arguments);
        };

        return devtools;
    }

    shouldSkipAutoUpdate() {
        // Saltar auto-actualización en desarrollo o con DevTools abierto
        if (this.isDevelopment) {
            console.log('ℹ️ [AUTO-UPDATE] Saltando auto-actualización - Entorno de desarrollo');
            return true;
        }

        if (this.devToolsOpen) {
            console.log('ℹ️ [AUTO-UPDATE] Saltando auto-actualización - DevTools detectado');
            return true;
        }

        // Verificar si "Update on reload" está activo
        if (this.detectUpdateOnReload()) {
            console.log('ℹ️ [AUTO-UPDATE] Saltando auto-actualización - Update on reload activo');
            return true;
        }

        return false;
    }

    detectUpdateOnReload() {
        // Detectar si se está forzando update en DevTools
        // Esto se puede inferir por la frecuencia de updates del SW
        const now = Date.now();
        const lastUpdate = localStorage.getItem('last_sw_update');

        if (lastUpdate) {
            const timeDiff = now - parseInt(lastUpdate);
            // Si el SW se actualizó hace menos de 5 segundos, probablemente es DevTools
            if (timeDiff < 5000) {
                return true;
            }
        }

        localStorage.setItem('last_sw_update', now.toString());
        return false;
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw-offline-first.js');
                this.serviceWorker = registration;

                registration.addEventListener('updatefound', () => {
                    console.log('🔄 [AUTO-UPDATE] Nueva versión detectada');
                    this.handleUpdateFound(registration);
                });

                // Verificar si hay un service worker en espera
                if (registration.waiting) {
                    this.showUpdateNotification();
                }

                console.log('✅ [AUTO-UPDATE] Service Worker registrado');
            } catch (error) {
                console.error('❌ [AUTO-UPDATE] Error registrando Service Worker:', error);
            }
        }
    }

    handleUpdateFound(registration) {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // Nueva versión disponible
                    this.updateAvailable = true;
                    this.showUpdateNotification();
                } else {
                    // Primera instalación
                    console.log('✅ [AUTO-UPDATE] Primera instalación completada');
                }
            }
        });
    }

    async checkForUpdates() {
        if (this.updateInProgress) return;

        // Verificar si debemos saltar la auto-actualización
        if (this.shouldSkipAutoUpdate()) {
            return;
        }

        try {
            console.log('🔍 [AUTO-UPDATE] Verificando actualizaciones...');

            // Verificar versión del manifiesto
            const manifestResponse = await fetch('/manifest.json?' + Date.now());
            const manifest = await manifestResponse.json();

            // Verificar versión del service worker
            await this.safeUpdateServiceWorker();

            // Verificar cambios en archivos críticos
            await this.checkCriticalFiles();

            this.updateLastCheck();

        } catch (error) {
            console.error('❌ [AUTO-UPDATE] Error verificando actualizaciones:', error);
        }
    }

    async safeUpdateServiceWorker() {
        try {
            if (!navigator.serviceWorker || !this.serviceWorker) {
                console.log('ℹ️ [AUTO-UPDATE] Service Worker no disponible');
                return;
            }

            // Verificar estado del service worker
            if (this.serviceWorker.state === 'redundant') {
                console.log('⚠️ [AUTO-UPDATE] Service Worker obsoleto, re-registrando...');
                await this.registerServiceWorker();
                return;
            }

            // Solo actualizar si está en estado válido
            if (this.serviceWorker.state === 'activated' || this.serviceWorker.state === 'installed') {
                await this.serviceWorker.update();
                console.log('✅ [AUTO-UPDATE] Service Worker actualizado exitosamente');
            } else {
                console.log(`ℹ️ [AUTO-UPDATE] Service Worker en estado ${this.serviceWorker.state}, saltando actualización`);
            }

        } catch (error) {
            console.warn('⚠️ [AUTO-UPDATE] Error actualizando Service Worker:', error.message);
            // Intentar re-registro si falla la actualización
            try {
                await this.registerServiceWorker();
            } catch (reRegisterError) {
                console.error('❌ [AUTO-UPDATE] Error re-registrando Service Worker:', reRegisterError);
            }
        }
    }

    async checkCriticalFiles() {
        const criticalFiles = [
            '/js/dashboard-manager-2025.js',
            '/css/style.css',
            '/js/pwa-advanced.js',
            '/js/chatbot.js'
        ];

        for (const file of criticalFiles) {
            try {
                // Usar GET con range header en lugar de HEAD para evitar errores de cache
                const response = await fetch(file + '?' + Date.now(), {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Range': 'bytes=0-0' // Solo solicitar el primer byte
                    }
                });

                if (response.ok) {
                    const lastModified = response.headers.get('last-modified');
                    const storedModified = localStorage.getItem(`file_modified_${file}`);

                    if (storedModified && lastModified !== storedModified) {
                        console.log(`🔄 [AUTO-UPDATE] Archivo actualizado: ${file}`);
                        this.triggerUpdate();
                    }

                    localStorage.setItem(`file_modified_${file}`, lastModified || '');
                }
            } catch (error) {
                console.warn(`⚠️ [AUTO-UPDATE] No se pudo verificar: ${file}`);
            }
        }
    }

    showUpdateNotification() {
        // Remover notificación existente
        const existingNotification = document.getElementById('update-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.className = 'update-notification';
        notification.innerHTML = sanitizeHTML(`
            <div class="update-content">
                <div class="update-icon">
                    <i class="fas fa-download"></i>
                </div>
                <div class="update-text">
                    <strong>Nueva versión disponible</strong>
                    <p>Hay una actualización del sistema BGE lista para instalar</p>
                </div>
                <div class="update-actions">
                    <button class="btn btn-primary btn-sm" onclick="bgeAutoUpdate.applyUpdate()">
                        <i class="fas fa-sync-alt me-1"></i>Actualizar
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="bgeAutoUpdate.dismissUpdate()">
                        Ahora no
                    </button>
                </div>
            </div>
        `);

        document.body.appendChild(notification);

        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                this.dismissUpdate();
            }
        }, 10000);
    }

    async applyUpdate() {
        this.updateInProgress = true;

        try {
            console.log('🔄 [AUTO-UPDATE] Aplicando actualización...');

            // Mostrar loader
            this.showUpdateLoader();

            // Forzar actualización del service worker
            if (this.serviceWorker && this.serviceWorker.waiting) {
                this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Limpiar cache
            await this.clearOldCaches();

            // Actualizar versión
            const newVersion = new Date().toISOString().split('T')[0].replace(/-/g, '.');
            localStorage.setItem('bge_app_version', newVersion);
            this.currentVersion = newVersion;

            // Recargar página después de un breve delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('❌ [AUTO-UPDATE] Error aplicando actualización:', error);
            this.hideUpdateLoader();
            this.updateInProgress = false;
        }
    }

    async clearOldCaches() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();

            for (const cacheName of cacheNames) {
                if (cacheName.includes('bge-') && !cacheName.includes(this.currentVersion)) {
                    console.log(`🗑️ [AUTO-UPDATE] Eliminando cache antiguo: ${cacheName}`);
                    await caches.delete(cacheName);
                }
            }
        }
    }

    dismissUpdate() {
        const notification = document.getElementById('update-notification');
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
        this.updateAvailable = false;
    }

    showUpdateLoader() {
        const loader = document.createElement('div');
        loader.id = 'update-loader';
        loader.className = 'update-loader';
        loader.innerHTML = sanitizeHTML(`
            <div class="update-loader-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Actualizando...</span>
                </div>
                <p class="mt-3 mb-0">Aplicando actualización...</p>
                <small class="text-muted">Por favor espera un momento</small>
            </div>
        `);

        document.body.appendChild(loader);
        setTimeout(() => loader.classList.add('show'), 100);
    }

    hideUpdateLoader() {
        const loader = document.getElementById('update-loader');
        if (loader) {
            loader.classList.remove('show');
            setTimeout(() => loader.remove(), 300);
        }
    }

    showUpdateStatus() {
        console.log(`📊 [AUTO-UPDATE] Estado del sistema:
        - Versión actual: ${this.currentVersion}
        - Verificaciones automáticas: ${this.updateCheckInterval / 1000 / 60} min
        - Service Worker: ${this.serviceWorker ? 'Registrado' : 'No disponible'}
        - Última verificación: ${localStorage.getItem('last_update_check') || 'Nunca'}`);
    }

    startPeriodicChecks() {
        // Verificación inicial después de 30 segundos
        setTimeout(() => {
            this.checkForUpdates();
        }, 30000);

        // Verificaciones periódicas
        setInterval(() => {
            this.checkForUpdates();
        }, this.updateCheckInterval);

        console.log(`⏰ [AUTO-UPDATE] Verificaciones cada ${this.updateCheckInterval / 1000 / 60} minutos`);
    }

    setupEventListeners() {
        // Detectar cuando la ventana vuelve a tener foco
        window.addEventListener('focus', () => {
            const lastCheck = localStorage.getItem('last_update_check');
            const now = Date.now();

            // Si han pasado más de 30 minutos desde la última verificación
            if (!lastCheck || (now - parseInt(lastCheck)) > 30 * 60 * 1000) {
                setTimeout(() => {
                    this.checkForUpdates();
                }, 5000);
            }
        });

        // Detectar cambios en la conectividad
        window.addEventListener('online', () => {
            console.log('🌐 [AUTO-UPDATE] Conexión restaurada, verificando actualizaciones...');
            setTimeout(() => {
                this.checkForUpdates();
            }, 3000);
        });
    }

    updateLastCheck() {
        localStorage.setItem('last_update_check', Date.now().toString());
    }

    triggerUpdate() {
        console.log('🔄 [AUTO-UPDATE] Actualizaciones disponibles detectadas');
        this.updateAvailable = true;
        this.showUpdateNotification();
    }

    // Método público para verificación manual
    async manualCheck() {
        console.log('🔍 [AUTO-UPDATE] Verificación manual iniciada');
        await this.checkForUpdates();

        if (!this.updateAvailable) {
            // Mostrar mensaje de que no hay actualizaciones
            this.showNoUpdatesMessage();
        }
    }

    showNoUpdatesMessage() {
        const toast = document.createElement('div');
        toast.className = 'toast show position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = sanitizeHTML(`
            <div class="toast-header">
                <i class="fas fa-check-circle text-success me-2"></i>
                <strong class="me-auto">Sistema actualizado</strong>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">
                Estás usando la versión más reciente del sistema BGE.
            </div>
        `);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

// CSS para las notificaciones de actualización
const updateStyles = `
    .update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        padding: 20px;
        max-width: 400px;
        z-index: 10000;
        transform: translateX(420px);
        transition: transform 0.3s ease;
        border-left: 4px solid #0d6efd;
    }

    .update-notification.show {
        transform: translateX(0);
    }

    .update-content {
        display: flex;
        align-items: flex-start;
        gap: 15px;
    }

    .update-icon {
        background: #0d6efd;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .update-text {
        flex: 1;
        margin-right: 10px;
    }

    .update-text strong {
        color: #2c3e50;
        font-size: 16px;
        display: block;
        margin-bottom: 5px;
    }

    .update-text p {
        color: #6c757d;
        font-size: 14px;
        margin: 0;
        line-height: 1.4;
    }

    .update-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 10px;
    }

    .update-actions .btn {
        font-size: 12px;
        padding: 6px 12px;
        white-space: nowrap;
    }

    .update-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .update-loader.show {
        opacity: 1;
    }

    .update-loader-content {
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        max-width: 300px;
    }

    @media (max-width: 768px) {
        .update-notification {
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
            top: 10px;
        }

        .update-notification.show {
            transform: translateY(0);
        }

        .update-content {
            flex-direction: column;
            gap: 10px;
        }

        .update-actions {
            flex-direction: row;
            justify-content: center;
        }
    }
`;

// Inyectar estilos
const autoUpdateStyleSheet = document.createElement('style');
autoUpdateStyleSheet.textContent = updateStyles;
document.head.appendChild(autoUpdateStyleSheet);

// Inicialización condicional para evitar problemas en desarrollo
let bgeAutoUpdate;

function initAutoUpdateSystem() {
    // ✅ [PRODUCCIÓN] Inicialización habilitada para producción
    console.log('🚀 [AUTO-UPDATE] Inicializando sistema para producción');

    // Solo bloquear en localhost de desarrollo
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
        console.log('🚫 [AUTO-UPDATE] Bloqueado solo en localhost:3000 de desarrollo');
        console.log('💡 [AUTO-UPDATE] Para testing manual: window.bgeAutoUpdate = new BGEAutoUpdateSystem()');
        return;
    }

    bgeAutoUpdate = new BGEAutoUpdateSystem();
    window.bgeAutoUpdate = bgeAutoUpdate;
}

document.addEventListener('DOMContentLoaded', () => {
    // Usar Context Manager si está disponible, sino verificación directa
    if (window.BGEContext) {
        window.BGEContext.registerScript('AutoUpdateSystem', initAutoUpdateSystem, {
            exclude: ['development'],
            critical: false
        });
    } else {
        initAutoUpdateSystem();
    }
});

console.log('✅ [COMPLETE] auto-update-system.js cargado - Sistema de actualizaciones automáticas BGE v1.0');