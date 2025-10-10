/**
 * Sistema de Analytics Avanzado BGE
 * Versión: 1.0
 * Fecha: 21-09-2025
 */

class BGEAdvancedAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.events = [];
        this.config = this.loadConfig();
        this.performanceData = {};
        this.userBehavior = {};
        this.educationalMetrics = {};

        console.log('📊 [ADVANCED-ANALYTICS] Sistema iniciado - Sesión:', this.sessionId);
        this.init();
    }

    loadConfig() {
        const stored = localStorage.getItem('bge_analytics_config');
        const defaultConfig = {
            enableRealTimeAnalytics: true,
            trackUserBehavior: true,
            trackPerformance: true,
            trackEducationalProgress: true,
            trackEngagement: true,
            anonymizeData: true,
            sendInterval: 30000, // 30 segundos
            maxEvents: 100,
            enableHeatmaps: false, // Función avanzada
            trackScrollDepth: true,
            trackTimeOnPage: true,
            trackClickPatterns: true
        };

        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    generateSessionId() {
        return 'bge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('bge_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('bge_user_id', userId);
        }
        return userId;
    }

    init() {
        this.setupEventListeners();
        this.initializePerformanceTracking();
        this.initializeUserBehaviorTracking();
        this.initializeEducationalTracking();
        this.startPeriodicReporting();
        this.trackPageView();
    }

    setupEventListeners() {
        // Rastreo de clics
        document.addEventListener('click', (e) => {
            if (this.config.trackClickPatterns) {
                this.trackClick(e);
            }
        });

        // Rastreo de scroll
        if (this.config.trackScrollDepth) {
            this.setupScrollTracking();
        }

        // Rastreo de tiempo en página
        if (this.config.trackTimeOnPage) {
            this.setupTimeTracking();
        }

        // Rastreo de formularios
        this.setupFormTracking();

        // Rastreo de navegación
        this.setupNavigationTracking();

        // Rastreo de errores
        this.setupErrorTracking();
    }

    trackPageView() {
        const pageData = {
            type: 'pageview',
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: this.getConnectionInfo(),
            device: this.getDeviceInfo()
        };

        this.trackEvent('pageview', pageData);
        console.log('📄 [ADVANCED-ANALYTICS] Página vista registrada:', pageData.url);
    }

    trackClick(event) {
        const element = event.target;
        const clickData = {
            type: 'click',
            timestamp: Date.now(),
            element: {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                text: element.textContent?.substring(0, 100) || '',
                href: element.href || ''
            },
            position: {
                x: event.clientX,
                y: event.clientY,
                screenX: event.screenX,
                screenY: event.screenY
            },
            page: window.location.pathname
        };

        // Clasificar tipo de clic
        if (element.matches('a')) {
            clickData.clickType = 'link';
            clickData.linkType = this.classifyLinkType(element.href);
        } else if (element.matches('button, input[type="submit"]')) {
            clickData.clickType = 'button';
        } else if (element.matches('.nav-link, .navbar a')) {
            clickData.clickType = 'navigation';
        } else if (element.matches('img')) {
            clickData.clickType = 'image';
        } else {
            clickData.clickType = 'other';
        }

        this.trackEvent('click', clickData);
    }

    classifyLinkType(href) {
        if (!href) return 'unknown';

        if (href.startsWith('mailto:')) return 'email';
        if (href.startsWith('tel:')) return 'phone';
        if (href.startsWith('#')) return 'anchor';
        if (href.includes(window.location.hostname)) return 'internal';
        return 'external';
    }

    setupScrollTracking() {
        let maxScroll = 0;
        let scrollCheckpoints = [25, 50, 75, 90, 100];
        let reachedCheckpoints = [];

        const trackScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            maxScroll = Math.max(maxScroll, scrollPercent);

            // Verificar checkpoints
            scrollCheckpoints.forEach(checkpoint => {
                if (scrollPercent >= checkpoint && !reachedCheckpoints.includes(checkpoint)) {
                    reachedCheckpoints.push(checkpoint);

                    this.trackEvent('scroll_depth', {
                        type: 'scroll_depth',
                        timestamp: Date.now(),
                        checkpoint: checkpoint,
                        timeToReach: Date.now() - this.startTime,
                        page: window.location.pathname
                    });
                }
            });
        };

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScroll, 100);
        });

        // Guardar scroll máximo al salir
        window.addEventListener('beforeunload', () => {
            this.trackEvent('scroll_summary', {
                type: 'scroll_summary',
                timestamp: Date.now(),
                maxScroll: maxScroll,
                checkpointsReached: reachedCheckpoints,
                page: window.location.pathname
            });
        });
    }

    setupTimeTracking() {
        let startTime = Date.now();
        let isActive = true;
        let totalActiveTime = 0;
        let lastActiveTime = startTime;

        // Detectar si el usuario está activo
        const resetActiveTime = () => {
            if (!isActive) {
                totalActiveTime += Date.now() - lastActiveTime;
                lastActiveTime = Date.now();
                isActive = true;
            }
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetActiveTime, true);
        });

        // Detectar cuando el usuario se vuelve inactivo
        let inactivityTimer;
        const setInactive = () => {
            isActive = false;
        };

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(setInactive, 30000); // 30 segundos
        };

        document.addEventListener('mousemove', resetInactivityTimer);
        document.addEventListener('keypress', resetInactivityTimer);

        // Reportar tiempo al salir
        window.addEventListener('beforeunload', () => {
            const totalTime = Date.now() - startTime;
            const activeTime = isActive ? totalActiveTime + (Date.now() - lastActiveTime) : totalActiveTime;

            this.trackEvent('time_on_page', {
                type: 'time_on_page',
                timestamp: Date.now(),
                totalTime: totalTime,
                activeTime: activeTime,
                engagementRate: activeTime / totalTime,
                page: window.location.pathname
            });
        });
    }

    setupFormTracking() {
        // Rastrear interacciones con formularios
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.trackEvent('form_field_focus', {
                    type: 'form_field_focus',
                    timestamp: Date.now(),
                    fieldType: e.target.type || e.target.tagName.toLowerCase(),
                    fieldName: e.target.name || e.target.id,
                    formId: e.target.closest('form')?.id || 'unknown',
                    page: window.location.pathname
                });
            }
        });

        // Rastrear envíos de formularios
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formData = new FormData(form);
            const fields = {};

            for (let [key, value] of formData.entries()) {
                fields[key] = typeof value === 'string' ? value.length : 'file';
            }

            this.trackEvent('form_submit', {
                type: 'form_submit',
                timestamp: Date.now(),
                formId: form.id || 'unknown',
                formAction: form.action,
                fieldCount: Object.keys(fields).length,
                fields: this.config.anonymizeData ? Object.keys(fields) : fields,
                page: window.location.pathname
            });
        });
    }

    setupNavigationTracking() {
        // Rastrear navegación de historia
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            window.dispatchEvent(new Event('pushstate'));
        };

        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            window.dispatchEvent(new Event('replacestate'));
        };

        ['pushstate', 'replacestate', 'popstate'].forEach(eventType => {
            window.addEventListener(eventType, () => {
                setTimeout(() => {
                    this.trackPageView();
                }, 100);
            });
        });
    }

    setupErrorTracking() {
        // Errores JavaScript
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                type: 'javascript_error',
                timestamp: Date.now(),
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack?.substring(0, 500),
                page: window.location.pathname
            });
        });

        // Promesas rechazadas
        window.addEventListener('unhandledrejection', (e) => {
            this.trackEvent('promise_rejection', {
                type: 'promise_rejection',
                timestamp: Date.now(),
                reason: String(e.reason).substring(0, 500),
                page: window.location.pathname
            });
        });
    }

    initializePerformanceTracking() {
        if (!this.config.trackPerformance) return;

        // Métricas de rendimiento web
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];

                    this.performanceData = {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        firstPaint: this.getFirstPaint(),
                        firstContentfulPaint: this.getFirstContentfulPaint(),
                        largestContentfulPaint: this.getLargestContentfulPaint(),
                        totalBlockingTime: this.getTotalBlockingTime(),
                        cumulativeLayoutShift: this.getCumulativeLayoutShift()
                    };

                    this.trackEvent('performance_metrics', {
                        type: 'performance_metrics',
                        timestamp: Date.now(),
                        ...this.performanceData,
                        page: window.location.pathname
                    });
                }, 1000);
            });
        }
    }

    getFirstPaint() {
        try {
            const paint = performance.getEntriesByType('paint').find(p => p.name === 'first-paint');
            return paint ? paint.startTime : null;
        } catch (e) {
            return null;
        }
    }

    getFirstContentfulPaint() {
        try {
            const paint = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
            return paint ? paint.startTime : null;
        } catch (e) {
            return null;
        }
    }

    getLargestContentfulPaint() {
        return new Promise((resolve) => {
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry ? lastEntry.startTime : null);
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                setTimeout(() => resolve(null), 5000);
            } catch (e) {
                resolve(null);
            }
        });
    }

    getTotalBlockingTime() {
        return new Promise((resolve) => {
            try {
                let totalBlockingTime = 0;

                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            totalBlockingTime += entry.duration - 50;
                        }
                    }
                    resolve(totalBlockingTime);
                }).observe({ entryTypes: ['longtask'] });

                setTimeout(() => resolve(totalBlockingTime), 5000);
            } catch (e) {
                resolve(null);
            }
        });
    }

    getCumulativeLayoutShift() {
        return new Promise((resolve) => {
            try {
                let cumulativeLayoutShift = 0;

                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            cumulativeLayoutShift += entry.value;
                        }
                    }
                    resolve(cumulativeLayoutShift);
                }).observe({ entryTypes: ['layout-shift'] });

                setTimeout(() => resolve(cumulativeLayoutShift), 5000);
            } catch (e) {
                resolve(null);
            }
        });
    }

    initializeUserBehaviorTracking() {
        if (!this.config.trackUserBehavior) return;

        this.userBehavior = {
            sessionDuration: 0,
            pageViews: 0,
            bounceRate: 0,
            engagementScore: 0,
            navigationPattern: [],
            deviceUsagePattern: this.getDeviceUsagePattern()
        };
    }

    initializeEducationalTracking() {
        if (!this.config.trackEducationalProgress) return;

        this.educationalMetrics = {
            sectionsVisited: [],
            resourcesAccessed: [],
            timePerSection: {},
            completionRate: 0,
            learningPath: [],
            academicInteractions: []
        };

        this.setupEducationalEventListeners();
    }

    setupEducationalEventListeners() {
        // Rastrear acceso a secciones educativas
        const educationalSections = [
            'oferta-educativa', 'servicios', 'estudiantes', 'padres',
            'conocenos', 'contacto', 'admisiones'
        ];

        educationalSections.forEach(section => {
            if (window.location.pathname.includes(section)) {
                this.trackEducationalEvent('section_visit', {
                    section: section,
                    timestamp: Date.now()
                });
            }
        });

        // Rastrear interacciones con contenido educativo
        document.addEventListener('click', (e) => {
            const element = e.target;

            if (element.matches('.academic-program, .course-info, .admission-info')) {
                this.trackEducationalEvent('academic_content_interaction', {
                    contentType: element.className,
                    contentText: element.textContent?.substring(0, 100),
                    timestamp: Date.now()
                });
            }

            if (element.matches('.download-link, .pdf-link')) {
                this.trackEducationalEvent('resource_download', {
                    resourceType: this.getResourceType(element.href),
                    resourceUrl: element.href,
                    timestamp: Date.now()
                });
            }
        });
    }

    trackEducationalEvent(eventType, data) {
        this.educationalMetrics.academicInteractions.push({
            type: eventType,
            ...data
        });

        this.trackEvent('educational_' + eventType, {
            type: 'educational_' + eventType,
            timestamp: Date.now(),
            ...data,
            page: window.location.pathname
        });
    }

    getResourceType(url) {
        if (!url) return 'unknown';

        const extension = url.split('.').pop().toLowerCase();
        const resourceTypes = {
            'pdf': 'documento',
            'doc': 'documento',
            'docx': 'documento',
            'jpg': 'imagen',
            'png': 'imagen',
            'gif': 'imagen',
            'mp4': 'video',
            'mp3': 'audio'
        };

        return resourceTypes[extension] || 'archivo';
    }

    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            memory: navigator.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            maxTouchPoints: navigator.maxTouchPoints
        };
    }

    getDeviceUsagePattern() {
        const now = new Date();
        return {
            timeOfDay: now.getHours(),
            dayOfWeek: now.getDay(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isWeekend: now.getDay() === 0 || now.getDay() === 6
        };
    }

    trackEvent(type, data) {
        const event = {
            id: this.generateEventId(),
            sessionId: this.sessionId,
            userId: this.config.anonymizeData ? this.hashUserId(this.userId) : this.userId,
            type: type,
            timestamp: Date.now(),
            ...data
        };

        this.events.push(event);

        // Limitar número de eventos en memoria
        if (this.events.length > this.config.maxEvents) {
            this.events = this.events.slice(-this.config.maxEvents);
        }

        console.log(`📊 [ADVANCED-ANALYTICS] Evento registrado: ${type}`);
    }

    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hashUserId(userId) {
        // Hash simple para anonimizar
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return 'hashed_' + Math.abs(hash);
    }

    startPeriodicReporting() {
        if (!this.config.enableRealTimeAnalytics) return;

        setInterval(() => {
            this.sendAnalyticsData();
        }, this.config.sendInterval);

        // Enviar datos al salir de la página
        window.addEventListener('beforeunload', () => {
            this.sendAnalyticsData(true);
        });
    }

    sendAnalyticsData(isBeforeUnload = false) {
        if (this.events.length === 0) return;

        const analyticsPayload = {
            sessionId: this.sessionId,
            userId: this.config.anonymizeData ? this.hashUserId(this.userId) : this.userId,
            timestamp: Date.now(),
            events: [...this.events],
            sessionSummary: this.getSessionSummary(),
            performanceData: this.performanceData,
            userBehavior: this.userBehavior,
            educationalMetrics: this.educationalMetrics,
            meta: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            }
        };

        // En un entorno real, esto se enviaría a un servidor
        console.log('📤 [ADVANCED-ANALYTICS] Enviando datos de analytics:', analyticsPayload);

        // Simular envío (en producción sería una llamada a API)
        this.simulateAnalyticsSend(analyticsPayload, isBeforeUnload);

        // Limpiar eventos enviados
        this.events = [];
    }

    simulateAnalyticsSend(payload, isBeforeUnload) {
        // Guardar en localStorage para persistencia
        try {
            const stored = JSON.parse(localStorage.getItem('bge_analytics_data') || '[]');
            stored.push({
                timestamp: Date.now(),
                payload: payload
            });

            // Mantener solo los últimos 10 envíos
            const recent = stored.slice(-10);
            localStorage.setItem('bge_analytics_data', JSON.stringify(recent));

            console.log('💾 [ADVANCED-ANALYTICS] Datos guardados localmente');

            // En un entorno real, aquí se haría:
            // fetch('/api/analytics', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });

        } catch (error) {
            console.error('❌ [ADVANCED-ANALYTICS] Error guardando datos:', error);
        }
    }

    getSessionSummary() {
        const now = Date.now();
        return {
            sessionDuration: now - this.startTime,
            eventsCount: this.events.length,
            pagesVisited: [...new Set(this.events.filter(e => e.type === 'pageview').map(e => e.url))].length,
            clicksCount: this.events.filter(e => e.type === 'click').length,
            errorsCount: this.events.filter(e => e.type.includes('error')).length,
            formsSubmitted: this.events.filter(e => e.type === 'form_submit').length,
            educationalInteractions: this.educationalMetrics.academicInteractions.length
        };
    }

    // API pública
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('bge_analytics_config', JSON.stringify(this.config));
        console.log('⚙️ [ADVANCED-ANALYTICS] Configuración actualizada:', newConfig);
    }

    getAnalyticsData() {
        return {
            sessionSummary: this.getSessionSummary(),
            recentEvents: this.events.slice(-10),
            performanceData: this.performanceData,
            educationalMetrics: this.educationalMetrics,
            userBehavior: this.userBehavior
        };
    }

    exportAnalyticsData() {
        const data = this.getAnalyticsData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `bge_analytics_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📥 [ADVANCED-ANALYTICS] Datos exportados');
    }

    clearAnalyticsData() {
        this.events = [];
        localStorage.removeItem('bge_analytics_data');
        console.log('🗑️ [ADVANCED-ANALYTICS] Datos de analytics eliminados');
    }
}

// Inicializar sistema automáticamente
let bgeAdvancedAnalytics;

document.addEventListener('DOMContentLoaded', () => {
    bgeAdvancedAnalytics = new BGEAdvancedAnalytics();

    // Hacer disponible globalmente
    window.bgeAdvancedAnalytics = bgeAdvancedAnalytics;
});

console.log('✅ [COMPLETE] bge-advanced-analytics.js cargado - Sistema de analytics avanzado BGE v1.0');