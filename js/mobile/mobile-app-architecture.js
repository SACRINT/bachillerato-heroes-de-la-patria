/**
 * 📱 BGE Mobile App Architecture
 * Arquitectura de Aplicación Móvil Híbrida
 *
 * Implementa una arquitectura robusta para la app móvil complementaria:
 * - Arquitectura híbrida React Native/PWA
 * - Bridge nativo para funcionalidades específicas
 * - Sincronización offline-first con la plataforma web
 * - Integración completa con sistemas de seguridad
 * - Performance nativo con flexibilidad web
 * - Compatibilidad iOS/Android optimizada
 *
 * @version 1.0.0
 * @since Phase E - Mobile Native Implementation
 */

class BGEMobileAppArchitecture {
    constructor() {
        this.architectureConfig = {
            platform: {
                type: 'HYBRID', // React Native + PWA Bridge
                targetPlatforms: ['iOS', 'Android', 'Web'],
                minVersions: {
                    ios: '13.0',
                    android: '7.0', // API 24
                    web: 'ES2020'
                }
            },
            components: {
                core: ['authentication', 'navigation', 'state-management', 'security'],
                educational: ['dashboard', 'assignments', 'evaluations', 'portfolio'],
                communication: ['chat', 'notifications', 'announcements', 'calendar'],
                offline: ['cache-manager', 'sync-engine', 'conflict-resolution'],
                native: ['biometrics', 'camera', 'file-system', 'push-notifications']
            },
            dataFlow: {
                architecture: 'FLUX', // Unidirectional data flow
                stateManager: 'Redux + RTK',
                persistence: 'Redux-Persist + Async Storage',
                networking: 'RTK Query + Offline Support'
            },
            security: {
                encryption: 'integrated', // Uses existing crypto system
                authentication: 'biometric + MFA',
                storage: 'encrypted-async-storage',
                communication: 'certificate-pinning'
            }
        };

        this.moduleRegistry = new Map();
        this.bridgeComponents = new Map();
        this.nativeModules = new Map();
        this.securityLayer = null;

        this.logger = window.BGELogger || console;
        this.initializeMobileArchitecture();
    }

    async initializeMobileArchitecture() {
        try {
            this.logger.info('MobileArchitecture', 'Inicializando arquitectura de aplicación móvil');

            // Detectar entorno de ejecución
            await this.detectExecutionEnvironment();

            // Inicializar bridge nativo-web
            await this.initializeNativeWebBridge();

            // Configurar gestión de estado móvil
            await this.setupMobileStateManagement();

            // Integrar sistemas de seguridad existentes
            await this.integrateSecuritySystems();

            // Configurar sistema de navegación
            this.setupMobileNavigation();

            // Inicializar módulos core
            await this.initializeCoreModules();

            // Configurar sincronización offline
            await this.setupOfflineSync();

            this.logger.info('MobileArchitecture', 'Arquitectura móvil inicializada correctamente');

        } catch (error) {
            this.logger.error('MobileArchitecture', 'Error al inicializar arquitectura móvil', error);
            throw error;
        }
    }

    async detectExecutionEnvironment() {
        // Detectar si estamos ejecutando en app nativa o PWA
        this.environment = {
            isNative: this.isRunningInNativeApp(),
            isPWA: this.isRunningAsPWA(),
            isWeb: this.isRunningInBrowser(),
            platform: this.getPlatformInfo(),
            capabilities: await this.detectCapabilities()
        };

        this.logger.info('MobileArchitecture', `Entorno detectado: ${JSON.stringify(this.environment.platform)}`);
    }

    isRunningInNativeApp() {
        // Detectar si estamos en React Native
        return typeof window !== 'undefined' &&
               (window.ReactNativeWebView ||
                window.__react_native__ ||
                navigator.product === 'ReactNative');
    }

    isRunningAsPWA() {
        // Detectar si estamos ejecutando como PWA
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    }

    isRunningInBrowser() {
        // Detectar si estamos en navegador web normal
        return !this.isRunningInNativeApp() && !this.isRunningAsPWA();
    }

    getPlatformInfo() {
        const userAgent = navigator.userAgent;

        return {
            os: this.detectOS(userAgent),
            browser: this.detectBrowser(userAgent),
            device: this.detectDevice(userAgent),
            version: this.detectVersion(userAgent),
            touchSupport: 'ontouchstart' in window,
            orientation: screen.orientation?.type || 'unknown'
        };
    }

    detectOS(userAgent) {
        if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
        if (/Android/.test(userAgent)) return 'Android';
        if (/Windows Phone/.test(userAgent)) return 'Windows Phone';
        if (/Windows/.test(userAgent)) return 'Windows';
        if (/Mac OS X/.test(userAgent)) return 'macOS';
        if (/Linux/.test(userAgent)) return 'Linux';
        return 'Unknown';
    }

    detectBrowser(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    detectDevice(userAgent) {
        if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
        if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
        return 'Desktop';
    }

    detectVersion(userAgent) {
        // Extraer versión del OS para funcionalidades específicas
        const osVersion = userAgent.match(/OS (\d+_\d+)/);
        return osVersion ? osVersion[1].replace('_', '.') : 'Unknown';
    }

    async detectCapabilities() {
        const capabilities = {
            // Capacidades web básicas
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            indexedDB: typeof indexedDB !== 'undefined',
            webWorkers: typeof Worker !== 'undefined',
            serviceWorkers: 'serviceWorker' in navigator,

            // APIs modernas
            pushNotifications: 'Notification' in window && 'PushManager' in window,
            geolocation: 'geolocation' in navigator,
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            accelerometer: 'DeviceMotionEvent' in window,
            gyroscope: 'DeviceOrientationEvent' in window,

            // Seguridad y autenticación
            webAuthn: 'credentials' in navigator && 'create' in navigator.credentials,
            biometrics: await this.checkBiometricSupport(),
            secureContext: window.isSecureContext,

            // Almacenamiento
            fileSystem: 'showOpenFilePicker' in window,
            clipboard: 'clipboard' in navigator,
            share: 'share' in navigator,

            // Red y conectividad
            offlineSupport: 'onLine' in navigator,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            webRTC: 'RTCPeerConnection' in window
        };

        return capabilities;
    }

    async checkBiometricSupport() {
        try {
            if ('credentials' in navigator) {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                return available;
            }
            return false;
        } catch {
            return false;
        }
    }

    async initializeNativeWebBridge() {
        // Bridge para comunicación nativo-web
        this.nativeBridge = {
            isAvailable: this.environment.isNative,

            // Métodos de comunicación
            postMessage: (message) => {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(message));
                }
            },

            addEventListener: (eventType, handler) => {
                if (this.environment.isNative) {
                    document.addEventListener(eventType, handler);
                }
            },

            // APIs nativas expuestas
            nativeAPIs: {
                biometrics: this.createBiometricsAPI(),
                camera: this.createCameraAPI(),
                fileSystem: this.createFileSystemAPI(),
                notifications: this.createNotificationsAPI(),
                contacts: this.createContactsAPI(),
                calendar: this.createCalendarAPI()
            }
        };

        this.logger.info('MobileArchitecture', 'Bridge nativo-web inicializado');
    }

    createBiometricsAPI() {
        return {
            isAvailable: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Biometrics.isAvailable');
                }
                return this.environment.capabilities.biometrics;
            },

            authenticate: async (reason) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Biometrics.authenticate', { reason });
                }
                // Fallback a WebAuthn para PWA
                return await this.authenticateWithWebAuthn();
            },

            getSupportedTypes: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Biometrics.getSupportedTypes');
                }
                return ['platform']; // WebAuthn platform authenticator
            }
        };
    }

    createCameraAPI() {
        return {
            takePicture: async (options = {}) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Camera.takePicture', options);
                }
                // Fallback a MediaDevices API
                return await this.takePictureWeb(options);
            },

            requestPermissions: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Camera.requestPermissions');
                }
                // Solicitar permisos web
                return await this.requestCameraPermissionWeb();
            }
        };
    }

    createFileSystemAPI() {
        return {
            readFile: async (path) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('FileSystem.readFile', { path });
                }
                // Usar File System Access API o fallback
                return await this.readFileWeb(path);
            },

            writeFile: async (path, data) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('FileSystem.writeFile', { path, data });
                }
                return await this.writeFileWeb(path, data);
            },

            downloadFile: async (url, destination) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('FileSystem.downloadFile', { url, destination });
                }
                return await this.downloadFileWeb(url, destination);
            }
        };
    }

    createNotificationsAPI() {
        return {
            scheduleLocal: async (notification) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Notifications.scheduleLocal', notification);
                }
                return await this.scheduleLocalNotificationWeb(notification);
            },

            requestPermissions: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Notifications.requestPermissions');
                }
                return await this.requestNotificationPermissionWeb();
            },

            getBadgeCount: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Notifications.getBadgeCount');
                }
                return 0; // No soportado en web
            },

            setBadgeCount: async (count) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Notifications.setBadgeCount', { count });
                }
                // Usar Badging API si está disponible
                if ('setAppBadge' in navigator) {
                    return await navigator.setAppBadge(count);
                }
            }
        };
    }

    createContactsAPI() {
        return {
            getContacts: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Contacts.getContacts');
                }
                // Usar Contact Picker API si está disponible
                if ('contacts' in navigator && 'ContactsManager' in window) {
                    return await this.getContactsWeb();
                }
                return [];
            },

            requestPermissions: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Contacts.requestPermissions');
                }
                return true; // Permisos manejados por Contact Picker API
            }
        };
    }

    createCalendarAPI() {
        return {
            addEvent: async (event) => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Calendar.addEvent', event);
                }
                // Generar archivo .ics para descarga
                return await this.addEventWeb(event);
            },

            requestPermissions: async () => {
                if (this.environment.isNative) {
                    return await this.callNativeMethod('Calendar.requestPermissions');
                }
                return true; // No requiere permisos en web
            }
        };
    }

    async callNativeMethod(method, params = {}) {
        return new Promise((resolve, reject) => {
            const messageId = this.generateMessageId();
            const message = {
                id: messageId,
                method: method,
                params: params,
                timestamp: Date.now()
            };

            // Listener para respuesta
            const responseHandler = (event) => {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                    document.removeEventListener('nativeResponse', responseHandler);
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            };

            document.addEventListener('nativeResponse', responseHandler);

            // Enviar mensaje al lado nativo
            this.nativeBridge.postMessage(message);

            // Timeout después de 10 segundos
            setTimeout(() => {
                document.removeEventListener('nativeResponse', responseHandler);
                reject(new Error('Native method call timeout'));
            }, 10000);
        });
    }

    async setupMobileStateManagement() {
        // Configuración de Redux para móvil con persistencia
        this.stateConfig = {
            // Reducers principales
            reducers: {
                auth: 'authReducer',
                education: 'educationReducer',
                communication: 'communicationReducer',
                offline: 'offlineReducer',
                settings: 'settingsReducer'
            },

            // Middleware
            middleware: [
                'redux-thunk',           // Para acciones asíncronas
                'redux-persist',         // Para persistencia
                'redux-offline',         // Para soporte offline
                'redux-logger'           // Para debugging (solo desarrollo)
            ],

            // Configuración de persistencia
            persistence: {
                key: 'bge-mobile-state',
                storage: 'AsyncStorage', // React Native AsyncStorage
                whitelist: ['auth', 'settings', 'offline'], // Estados a persistir
                transforms: [
                    'encryptTransform' // Encriptar datos sensibles
                ]
            },

            // Configuración offline
            offline: {
                detectNetwork: () => navigator.onLine,
                persist: (store, options) => {
                    // Lógica de persistencia offline
                },
                retry: (action, retries) => {
                    // Lógica de reintentos
                }
            }
        };

        this.logger.info('MobileArchitecture', 'Gestión de estado móvil configurada');
    }

    async integrateSecuritySystems() {
        // Integrar con sistemas de seguridad existentes
        if (window.BGESecurityCoordinator) {
            this.securityLayer = new window.BGESecurityCoordinator();

            // Configurar políticas específicas para móvil
            await this.setupMobileSecurityPolicies();

            // Integrar autenticación biométrica
            await this.integrateBiometricAuth();

            // Configurar encriptación de almacenamiento móvil
            await this.setupMobileEncryption();
        }

        this.logger.info('MobileArchitecture', 'Sistemas de seguridad integrados');
    }

    async setupMobileSecurityPolicies() {
        const mobilePolicies = {
            session: {
                timeout: 4 * 60 * 60 * 1000, // 4 horas (menor que web)
                backgroundTimeout: 5 * 60 * 1000, // 5 minutos en background
                requireReauth: true
            },

            storage: {
                encryption: 'AES-256-GCM',
                keyRotation: 7 * 24 * 60 * 60 * 1000, // 7 días
                clearOnUninstall: true
            },

            network: {
                certificatePinning: true,
                allowUntrustedCerts: false,
                requireHTTPS: true
            },

            biometrics: {
                fallbackToPassword: true,
                maxAttempts: 3,
                lockoutTime: 5 * 60 * 1000 // 5 minutos
            }
        };

        this.mobilePolicies = mobilePolicies;
    }

    async integrateBiometricAuth() {
        this.biometricAuth = {
            isEnabled: await this.nativeBridge.nativeAPIs.biometrics.isAvailable(),

            authenticate: async (reason = 'Autenticación requerida') => {
                try {
                    const result = await this.nativeBridge.nativeAPIs.biometrics.authenticate(reason);
                    return { success: true, method: 'biometric', result };
                } catch (error) {
                    this.logger.warn('MobileArchitecture', 'Fallo en autenticación biométrica', error);
                    return { success: false, error: error.message };
                }
            },

            getSupportedTypes: async () => {
                return await this.nativeBridge.nativeAPIs.biometrics.getSupportedTypes();
            }
        };
    }

    async setupMobileEncryption() {
        // Configurar encriptación específica para móvil
        this.mobileEncryption = {
            keystore: this.environment.isNative ? 'native-keystore' : 'web-crypto',

            encryptStorage: async (key, data) => {
                if (this.securityLayer) {
                    return await this.securityLayer.encryptData(data, 'mobile_storage', key);
                }
                // Fallback básico
                return this.basicEncrypt(data);
            },

            decryptStorage: async (key, encryptedData) => {
                if (this.securityLayer) {
                    return await this.securityLayer.decryptData(encryptedData, 'mobile_storage', key);
                }
                return this.basicDecrypt(encryptedData);
            }
        };
    }

    setupMobileNavigation() {
        // Configuración de navegación móvil
        this.navigationConfig = {
            type: this.environment.isNative ? 'stack' : 'browser',

            screens: {
                // Pantallas principales
                'Auth': { component: 'AuthScreen', options: { headerShown: false } },
                'Dashboard': { component: 'DashboardScreen', options: { title: 'Inicio' } },
                'Profile': { component: 'ProfileScreen', options: { title: 'Perfil' } },

                // Pantallas educativas
                'Assignments': { component: 'AssignmentsScreen', options: { title: 'Tareas' } },
                'Evaluations': { component: 'EvaluationsScreen', options: { title: 'Evaluaciones' } },
                'Portfolio': { component: 'PortfolioScreen', options: { title: 'Portafolio' } },
                'Calendar': { component: 'CalendarScreen', options: { title: 'Calendario' } },

                // Pantallas de comunicación
                'Chat': { component: 'ChatScreen', options: { title: 'Mensajes' } },
                'Notifications': { component: 'NotificationsScreen', options: { title: 'Notificaciones' } },
                'Announcements': { component: 'AnnouncementsScreen', options: { title: 'Avisos' } },

                // Pantallas de configuración
                'Settings': { component: 'SettingsScreen', options: { title: 'Configuración' } },
                'Security': { component: 'SecurityScreen', options: { title: 'Seguridad' } },
                'About': { component: 'AboutScreen', options: { title: 'Acerca de' } }
            },

            tabs: {
                'Dashboard': { icon: 'home', label: 'Inicio' },
                'Assignments': { icon: 'assignment', label: 'Tareas' },
                'Calendar': { icon: 'calendar', label: 'Calendario' },
                'Chat': { icon: 'chat', label: 'Mensajes' },
                'Profile': { icon: 'person', label: 'Perfil' }
            },

            gestures: {
                swipeBack: true,
                pullToRefresh: true,
                infiniteScroll: true
            }
        };

        this.logger.info('MobileArchitecture', 'Navegación móvil configurada');
    }

    async initializeCoreModules() {
        // Inicializar módulos core de la aplicación móvil
        const coreModules = [
            { name: 'authentication', class: 'MobileAuthModule' },
            { name: 'synchronization', class: 'MobileSyncModule' },
            { name: 'notifications', class: 'MobileNotificationModule' },
            { name: 'storage', class: 'MobileStorageModule' },
            { name: 'networking', class: 'MobileNetworkModule' }
        ];

        for (const module of coreModules) {
            try {
                const moduleInstance = await this.loadModule(module.name, module.class);
                this.moduleRegistry.set(module.name, moduleInstance);
                this.logger.info('MobileArchitecture', `Módulo ${module.name} inicializado`);
            } catch (error) {
                this.logger.error('MobileArchitecture', `Error al inicializar módulo ${module.name}`, error);
            }
        }
    }

    async setupOfflineSync() {
        // Configurar sincronización offline avanzada
        this.offlineSync = {
            strategy: 'offline-first', // offline-first, online-first, cache-first

            syncPolicies: {
                'user_data': { priority: 'high', frequency: 'immediate' },
                'assignments': { priority: 'high', frequency: 'every-5min' },
                'evaluations': { priority: 'medium', frequency: 'every-15min' },
                'messages': { priority: 'high', frequency: 'immediate' },
                'announcements': { priority: 'medium', frequency: 'every-30min' },
                'resources': { priority: 'low', frequency: 'daily' }
            },

            conflictResolution: {
                strategy: 'last-write-wins', // last-write-wins, client-wins, server-wins, merge
                backupConflicts: true,
                userPrompt: true // Para conflictos críticos
            },

            storage: {
                maxSize: '500MB',
                cleanup: {
                    strategy: 'lru', // lru, fifo, size-based
                    threshold: 0.8 // 80% de capacidad
                }
            }
        };

        this.logger.info('MobileArchitecture', 'Sincronización offline configurada');
    }

    /**
     * API pública para componentes móviles
     */

    async loadModule(name, className) {
        // Carga dinámica de módulos móviles
        try {
            // En entorno nativo, los módulos están pre-empaquetados
            if (this.environment.isNative) {
                const ModuleClass = await import(`./modules/${className}.js`);
                return new ModuleClass.default();
            } else {
                // En web, carga dinámica
                const moduleUrl = `/js/mobile/modules/${className}.js`;
                const module = await import(moduleUrl);
                return new module.default();
            }
        } catch (error) {
            this.logger.error('MobileArchitecture', `Error al cargar módulo ${name}`, error);
            throw error;
        }
    }

    getModule(name) {
        return this.moduleRegistry.get(name);
    }

    async navigateTo(screenName, params = {}) {
        if (this.environment.isNative) {
            // Navegación nativa
            return await this.callNativeMethod('Navigation.navigate', { screen: screenName, params });
        } else {
            // Navegación web
            const route = this.navigationConfig.screens[screenName];
            if (route) {
                window.history.pushState(params, route.options.title, `/${screenName.toLowerCase()}`);
                return true;
            }
            return false;
        }
    }

    async showAlert(title, message, options = {}) {
        if (this.environment.isNative) {
            return await this.callNativeMethod('UI.showAlert', { title, message, options });
        } else {
            // Fallback a alert web o modal personalizado
            if (options.confirm) {
                return confirm(`${title}\n\n${message}`);
            } else {
                alert(`${title}\n\n${message}`);
                return true;
            }
        }
    }

    async requestPermissions(permissionType) {
        switch (permissionType) {
            case 'camera':
                return await this.nativeBridge.nativeAPIs.camera.requestPermissions();
            case 'notifications':
                return await this.nativeBridge.nativeAPIs.notifications.requestPermissions();
            case 'contacts':
                return await this.nativeBridge.nativeAPIs.contacts.requestPermissions();
            case 'calendar':
                return await this.nativeBridge.nativeAPIs.calendar.requestPermissions();
            default:
                throw new Error(`Tipo de permiso no soportado: ${permissionType}`);
        }
    }

    getEnvironmentInfo() {
        return {
            environment: this.environment,
            capabilities: this.environment.capabilities,
            nativeBridge: {
                available: this.nativeBridge.isAvailable,
                apis: Object.keys(this.nativeBridge.nativeAPIs)
            },
            modules: Array.from(this.moduleRegistry.keys()),
            security: {
                integrated: !!this.securityLayer,
                biometrics: this.biometricAuth?.isEnabled || false,
                encryption: !!this.mobileEncryption
            }
        };
    }

    // Métodos auxiliares
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    basicEncrypt(data) {
        // Encriptación básica para fallback (NO usar en producción)
        return btoa(JSON.stringify(data));
    }

    basicDecrypt(encryptedData) {
        // Desencriptación básica para fallback
        try {
            return JSON.parse(atob(encryptedData));
        } catch {
            return null;
        }
    }

    // Implementaciones web de APIs nativas
    async authenticateWithWebAuthn() {
        // Implementación WebAuthn para PWA
        try {
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    allowCredentials: [],
                    userVerification: 'required',
                    timeout: 30000
                }
            });
            return !!credential;
        } catch {
            return false;
        }
    }

    async takePictureWeb(options) {
        // Implementación web de cámara
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: options.facing || 'environment' }
            });
            // Aquí iría la lógica para capturar foto
            stream.getTracks().forEach(track => track.stop());
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async requestCameraPermissionWeb() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return { granted: true };
        } catch {
            return { granted: false };
        }
    }

    async scheduleLocalNotificationWeb(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon,
                tag: notification.id
            });
            return true;
        }
        return false;
    }

    async requestNotificationPermissionWeb() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return { granted: permission === 'granted' };
        }
        return { granted: false };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEMobileAppArchitecture;
} else if (typeof window !== 'undefined') {
    window.BGEMobileAppArchitecture = BGEMobileAppArchitecture;
}