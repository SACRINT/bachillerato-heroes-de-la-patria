/**
 * 🎯 CONTEXT MANAGER - SISTEMA DE CONTEXTO BGE
 * Gestor centralizado de contexto de aplicación
 */

class BGEContextManager {
    constructor() {
        this.context = {
            user: null,
            environment: this.detectEnvironment(),
            features: new Map(),
            modules: new Map(),
            performance: {
                startTime: performance.now(),
                loadTimes: new Map()
            },
            debug: this.isDebugMode()
        };

        this.init();
    }

    init() {
        BGELogger?.info('Context Manager', '🎯 Inicializando gestor de contexto...');

        // Detectar capacidades del dispositivo
        this.detectDeviceCapabilities();

        // Configurar feature flags
        this.setupFeatureFlags();

        // Inicializar métricas
        this.initializeMetrics();

        BGELogger?.info('Context Manager', '✅ Context Manager inicializado', {
            environment: this.context.environment,
            debug: this.context.debug,
            features: Array.from(this.context.features.keys())
        });
    }

    // Detectar ambiente
    detectEnvironment() {
        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }

        if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
            return 'staging';
        }

        return 'production';
    }

    // Detectar modo debug
    isDebugMode() {
        return this.context?.environment === 'development' ||
               new URLSearchParams(window.location.search).has('debug') ||
               localStorage.getItem('bge-debug') === 'true';
    }

    // Detectar capacidades del dispositivo
    detectDeviceCapabilities() {
        const features = this.context.features;

        // Capacidades Web API
        features.set('serviceWorker', 'serviceWorker' in navigator);
        features.set('pushNotifications', 'PushManager' in window);
        features.set('webGL', !!window.WebGLRenderingContext);
        features.set('webRTC', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
        features.set('bluetooth', 'bluetooth' in navigator);
        features.set('geolocation', 'geolocation' in navigator);

        // Capacidades AR/VR
        features.set('webXR', 'xr' in navigator);
        features.set('deviceOrientation', 'DeviceOrientationEvent' in window);

        // Capacidades de audio/video
        features.set('webAudio', !!(window.AudioContext || window.webkitAudioContext));
        features.set('speechRecognition', !!(window.SpeechRecognition || window.webkitSpeechRecognition));

        // Capacidades de red
        features.set('onlineStatus', 'onLine' in navigator);
        features.set('networkInformation', 'connection' in navigator);

        BGELogger?.debug('Context Manager', '📱 Capacidades detectadas', {
            total: features.size,
            enabled: Array.from(features.entries()).filter(([, enabled]) => enabled).length
        });
    }

    // Configurar feature flags
    setupFeatureFlags() {
        const flags = {
            // Features por ambiente
            'ai-advanced': this.context.environment === 'production',
            'ar-enabled': this.hasFeature('webXR') || this.hasFeature('deviceOrientation'),
            'push-notifications': this.hasFeature('pushNotifications'),
            'offline-sync': this.hasFeature('serviceWorker'),

            // Features experimentales
            'voice-recognition': this.hasFeature('speechRecognition') && this.context.debug,
            'bluetooth-integration': this.hasFeature('bluetooth') && this.context.debug,
            'webrtc-communication': this.hasFeature('webRTC'),

            // Features de optimización
            'lazy-loading': true,
            'bundle-optimization': true,
            'performance-monitoring': true
        };

        Object.entries(flags).forEach(([flag, enabled]) => {
            this.context.features.set(flag, enabled);
        });
    }

    // Inicializar métricas
    initializeMetrics() {
        this.context.performance.navigation = performance.getEntriesByType('navigation')[0];

        // Métricas de Core Web Vitals
        this.measureCoreWebVitals();

        // Monitorear performance continua
        this.startPerformanceMonitoring();
    }

    // Medir Core Web Vitals
    measureCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const lcpEntry = entryList.getEntries().pop();
                this.context.performance.lcp = lcpEntry.startTime;
                BGELogger?.debug('Context Manager', `📊 LCP: ${lcpEntry.startTime.toFixed(2)}ms`);
            });

            try {
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                BGELogger?.warn('Context Manager', 'LCP no soportado');
            }

            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((entryList) => {
                const fidEntry = entryList.getEntries()[0];
                this.context.performance.fid = fidEntry.processingStart - fidEntry.startTime;
                BGELogger?.debug('Context Manager', `📊 FID: ${this.context.performance.fid.toFixed(2)}ms`);
            });

            try {
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                BGELogger?.warn('Context Manager', 'FID no soportado');
            }
        }
    }

    // Monitorear performance continua
    startPerformanceMonitoring() {
        // Monitorear memoria
        if ('memory' in performance) {
            setInterval(() => {
                this.context.performance.memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }, 30000); // Cada 30 segundos
        }

        // Monitorear conexión de red
        if ('connection' in navigator) {
            this.context.network = {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };

            navigator.connection.addEventListener('change', () => {
                this.context.network = {
                    type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                };

                BGELogger?.info('Context Manager', '📶 Conexión de red cambió', this.context.network);
            });
        }
    }

    // Verificar si tiene feature
    hasFeature(featureName) {
        return this.context.features.get(featureName) === true;
    }

    // Registrar módulo
    registerModule(name, moduleInstance, dependencies = []) {
        this.context.modules.set(name, {
            instance: moduleInstance,
            dependencies,
            loadTime: performance.now() - this.context.performance.startTime,
            status: 'loaded'
        });

        BGELogger?.debug('Context Manager', `📦 Módulo registrado: ${name}`, {
            loadTime: this.context.modules.get(name).loadTime,
            dependencies
        });
    }

    // Obtener módulo
    getModule(name) {
        return this.context.modules.get(name)?.instance;
    }

    // Configurar usuario
    setUser(userData) {
        this.context.user = {
            ...userData,
            sessionStart: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };

        BGELogger?.info('Context Manager', '👤 Usuario configurado', {
            userId: userData.id,
            sessionId: this.context.user.sessionId
        });
    }

    // Generar session ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Obtener contexto completo
    getContext() {
        return { ...this.context };
    }

    // Obtener configuración para módulo específico
    getModuleConfig(moduleName) {
        const baseConfig = {
            debug: this.context.debug,
            environment: this.context.environment,
            user: this.context.user,
            sessionId: this.context.user?.sessionId
        };

        // Configuraciones específicas por módulo
        const moduleConfigs = {
            'ai-system': {
                enabled: this.hasFeature('ai-advanced'),
                voiceRecognition: this.hasFeature('voice-recognition'),
                adaptiveMode: this.context.environment === 'production'
            },
            'ar-system': {
                enabled: this.hasFeature('ar-enabled'),
                webXR: this.hasFeature('webXR'),
                fallbackMode: !this.hasFeature('webXR')
            },
            'notification-system': {
                enabled: this.hasFeature('push-notifications'),
                browserSupport: this.hasFeature('serviceWorker')
            },
            'performance-system': {
                monitoring: this.hasFeature('performance-monitoring'),
                realTime: this.context.debug,
                metrics: ['lcp', 'fid', 'cls']
            }
        };

        return {
            ...baseConfig,
            ...moduleConfigs[moduleName]
        };
    }

    // Reporte de estado
    generateStatusReport() {
        const report = {
            environment: this.context.environment,
            uptime: performance.now() - this.context.performance.startTime,
            modules: {
                total: this.context.modules.size,
                loaded: Array.from(this.context.modules.values()).filter(m => m.status === 'loaded').length
            },
            features: {
                total: this.context.features.size,
                enabled: Array.from(this.context.features.values()).filter(Boolean).length
            },
            performance: this.context.performance,
            network: this.context.network,
            user: this.context.user ? {
                authenticated: true,
                sessionDuration: new Date() - new Date(this.context.user.sessionStart)
            } : { authenticated: false }
        };

        BGELogger?.info('Context Manager', '📋 REPORTE DE ESTADO BGE', report);
        return report;
    }
}

// Inicialización global
window.BGEContext = new BGEContextManager();

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEContextManager;
}

console.log('✅ BGE Context Manager cargado exitosamente');