/**
 * 📊 BGE ANALYTICS MODULE - BACHILLERATO GENERAL ESTATAL "HÉROES DE LA PATRIA"
 * Módulo unificado de analytics avanzado con datos reales y métricas educativas
 *
 * CONSOLIDA:
 * - bge-advanced-analytics.js (Sistema de analytics avanzado)
 * - real-data-analytics.js (Analytics con datos reales)
 * - advanced-analytics.js (GoogleAnalytics, Facebook Pixel, Heatmaps, Dashboard)
 *
 * Versión: 1.0.0
 * Fecha: 27 de Septiembre, 2025
 * Reducción: 3 archivos → 1 módulo (-67% archivos)
 */

class BGEAnalyticsModule extends BGEModule {
    constructor(framework) {
        super(framework);
        this.version = '1.0.0';
        this.name = 'analytics';

        // Identificadores únicos
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();

        // Almacenes de datos
        this.events = [];
        this.realTimeMetrics = new Map();
        this.analyticsCache = new Map();
        this.userBehavior = {};
        this.educationalMetrics = {};
        this.performanceData = {};

        // Configuración del módulo
        this.config = {
            enableRealTimeAnalytics: true,
            enablePredictiveAnalytics: true,
            enableBehaviorTracking: true,
            enablePerformanceMetrics: true,
            enableEducationalTracking: true,
            enableHeatmaps: false, // Función avanzada
            trackUserBehavior: true,
            trackScrollDepth: true,
            trackTimeOnPage: true,
            trackClickPatterns: true,
            anonymizeData: true,
            sendInterval: 30000, // 30 segundos
            maxEvents: 100,
            cacheTimeout: 300000, // 5 minutos
            batchSize: 50,
            retryAttempts: 3
        };

        // Fuentes de datos reales
        this.dataSources = {
            mysql: {
                endpoint: '/api/database/query',
                status: 'disconnected',
                lastSync: null
            },
            googleClassroom: {
                endpoint: '/api/google-classroom/analytics',
                status: 'disconnected',
                lastSync: null
            },
            sep: {
                endpoint: '/api/sep/analytics',
                status: 'disconnected',
                lastSync: null
            },
            userInteractions: {
                endpoint: '/api/analytics/interactions',
                status: 'active',
                lastSync: null
            }
        };

        // Estado interno
        this.dataConnections = new Map();
        this.scrollDepth = 0;
        this.timeOnPage = 0;
        this.pageViewStart = Date.now();
        this.isReporting = false;
        this.reportingInterval = null;
    }

    async initialize() {
        await super.initialize();

        try {
            this.log('Inicializando BGE Analytics Module...');

            // 1. Cargar configuración personalizada
            await this.loadConfiguration();

            // 2. Verificar conexiones de datos reales
            await this.checkDataConnections();

            // 3. Configurar tracking de eventos
            this.setupEventTracking();

            // 4. Inicializar analytics en tiempo real
            this.setupRealTimeAnalytics();

            // 5. Configurar métricas educativas
            this.setupEducationalMetrics();

            // 6. Inicializar reportes automáticos
            this.setupAutomaticReporting();

            // 7. Configurar analytics predictivo
            this.setupPredictiveAnalytics();

            // 8. Configurar funcionalidades avanzadas migradas
            this.setupGoogleAnalytics();
            this.setupFacebookPixel();
            this.setupHeatmapAnalytics();
            this.createAdvancedDashboard();
            this.setupAdvancedReporting();

            this.log('✅ BGE Analytics Module inicializado correctamente');

            // Track inicial page view
            this.trackPageView();

            // Cargar datos iniciales después de 2 segundos
            setTimeout(() => this.loadInitialData(), 2000);

        } catch (error) {
            this.error('Error inicializando Analytics Module:', error);
        }
    }

    /**
     * 🔧 Cargar configuración personalizada
     */
    async loadConfiguration() {
        try {
            const stored = localStorage.getItem('bge_analytics_config');
            if (stored) {
                const customConfig = JSON.parse(stored);
                this.config = { ...this.config, ...customConfig };
                this.log('Configuración personalizada cargada');
            }
        } catch (error) {
            this.log('⚠️ Error cargando configuración, usando defaults');
        }
    }

    /**
     * 🔍 Verificar conexiones de datos reales
     */
    async checkDataConnections() {
        this.log('Verificando conexiones de datos reales...');

        for (const [source, config] of Object.entries(this.dataSources)) {
            try {
                // Intentar conexión con timeout
                const response = await Promise.race([
                    fetch(`${config.endpoint}/ping`, { method: 'GET' }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('timeout')), 5000)
                    )
                ]);

                if (response && response.ok) {
                    config.status = 'connected';
                    config.lastSync = new Date().toISOString();
                    this.log(`✅ ${source}: Conectado`);
                    this.dataConnections.set(source, true);
                } else {
                    config.status = 'error';
                    this.log(`⚠️ ${source}: Error de conexión`);
                    this.dataConnections.set(source, false);
                }
            } catch (error) {
                config.status = 'offline';
                this.dataConnections.set(source, false);
                this.log(`❌ ${source}: Offline - ${error.message}`);
            }
        }
    }

    /**
     * 📊 Configurar tracking de eventos
     */
    setupEventTracking() {
        // Tracking de clics
        document.addEventListener('click', (e) => {
            if (this.config.trackClickPatterns) {
                this.trackClick(e);
            }
        });

        // Tracking de scroll
        if (this.config.trackScrollDepth) {
            this.setupScrollTracking();
        }

        // Tracking de tiempo en página
        if (this.config.trackTimeOnPage) {
            this.setupTimeTracking();
        }

        // Tracking de formularios
        this.setupFormTracking();

        // Tracking de navegación
        this.setupNavigationTracking();

        // Tracking de errores
        this.setupErrorTracking();

        // Tracking de performance
        if (this.config.enablePerformanceMetrics) {
            this.setupPerformanceTracking();
        }
    }

    /**
     * 🖱️ Track click events
     */
    trackClick(event) {
        const element = event.target;
        const clickData = {
            type: 'click',
            timestamp: Date.now(),
            elementTag: element.tagName.toLowerCase(),
            elementId: element.id || null,
            elementClass: element.className || null,
            elementText: element.textContent?.substring(0, 100) || null,
            coordinates: {
                x: event.clientX,
                y: event.clientY
            },
            url: window.location.href,
            sessionId: this.sessionId
        };

        this.recordEvent(clickData);
    }

    /**
     * 📜 Configurar tracking de scroll
     */
    setupScrollTracking() {
        let scrollTimer = null;
        let maxScroll = 0;

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.scrollDepth = maxScroll;
            }

            // Debounce scroll tracking
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.recordEvent({
                    type: 'scroll',
                    timestamp: Date.now(),
                    scrollDepth: scrollPercent,
                    maxScrollDepth: maxScroll,
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            }, 250);
        });
    }

    /**
     * ⏱️ Configurar tracking de tiempo
     */
    setupTimeTracking() {
        // Track tiempo en página cada 30 segundos
        setInterval(() => {
            this.timeOnPage = Date.now() - this.pageViewStart;

            this.recordEvent({
                type: 'time_tracking',
                timestamp: Date.now(),
                timeOnPage: this.timeOnPage,
                url: window.location.href,
                sessionId: this.sessionId
            });
        }, 30000);

        // Track cuando el usuario sale de la página
        window.addEventListener('beforeunload', () => {
            this.trackPageExit();
        });

        // Track visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackPageHidden();
            } else {
                this.trackPageVisible();
            }
        });
    }

    /**
     * 📋 Configurar tracking de formularios
     */
    setupFormTracking() {
        document.querySelectorAll('form').forEach(form => {
            // Track form start
            form.addEventListener('focusin', () => {
                this.recordEvent({
                    type: 'form_start',
                    timestamp: Date.now(),
                    formId: form.id || null,
                    formAction: form.action || null,
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            });

            // Track form submission
            form.addEventListener('submit', (e) => {
                this.recordEvent({
                    type: 'form_submit',
                    timestamp: Date.now(),
                    formId: form.id || null,
                    formAction: form.action || null,
                    success: true, // Asumimos éxito por ahora
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            });
        });
    }

    /**
     * 🧭 Configurar tracking de navegación
     */
    setupNavigationTracking() {
        // Track cambios de URL (para SPAs)
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                this.trackPageView();
                currentUrl = window.location.href;
            }
        }, 1000);
    }

    /**
     * 🚨 Configurar tracking de errores
     */
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.recordEvent({
                type: 'javascript_error',
                timestamp: Date.now(),
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                url: window.location.href,
                sessionId: this.sessionId,
                severity: 'error'
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordEvent({
                type: 'promise_rejection',
                timestamp: Date.now(),
                reason: event.reason?.toString() || 'Unknown',
                url: window.location.href,
                sessionId: this.sessionId,
                severity: 'warning'
            });
        });
    }

    /**
     * 📈 Configurar tracking de performance
     */
    setupPerformanceTracking() {
        // Obtener métricas del BGE Performance Module si está disponible
        if (this.framework.modules.has('performance')) {
            const perfModule = this.framework.modules.get('performance');

            // Escuchar eventos de performance
            this.framework.addEventListener('metricUpdated', (data) => {
                this.recordPerformanceMetric(data);
            });

            this.framework.addEventListener('performanceReport', (report) => {
                this.recordPerformanceReport(report);
            });
        }

        // Track Resource Timing
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.recordResourceTiming(entry);
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    /**
     * 📊 Configurar analytics en tiempo real
     */
    setupRealTimeAnalytics() {
        // Actualizar métricas en tiempo real cada minuto
        setInterval(() => {
            this.updateRealTimeMetrics();
        }, 60000);

        // Configurar dashboard en tiempo real si está disponible
        this.setupRealTimeDashboard();
    }

    /**
     * 🎓 Configurar métricas educativas
     */
    setupEducationalMetrics() {
        // Track tiempo en secciones educativas
        this.trackEducationalSections();

        // Track interacciones con contenido educativo
        this.trackEducationalInteractions();

        // Track uso de recursos educativos
        this.trackEducationalResources();

        // Track progreso académico (si está disponible)
        this.trackAcademicProgress();
    }

    /**
     * 📚 Track secciones educativas
     */
    trackEducationalSections() {
        const educationalSections = [
            '.oferta-educativa',
            '.plan-estudios',
            '.calendario-escolar',
            '.recursos-educativos',
            '.calificaciones',
            '.tareas'
        ];

        educationalSections.forEach(selector => {
            const element = document.querySelector(selector);
            if (element && 'IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.recordEvent({
                                type: 'educational_section_view',
                                timestamp: Date.now(),
                                section: selector,
                                url: window.location.href,
                                sessionId: this.sessionId
                            });
                        }
                    });
                });
                observer.observe(element);
            }
        });
    }

    /**
     * 🤝 Track interacciones educativas
     */
    trackEducationalInteractions() {
        // Track descargas de documentos
        document.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').forEach(link => {
            link.addEventListener('click', () => {
                this.recordEvent({
                    type: 'educational_document_download',
                    timestamp: Date.now(),
                    documentUrl: link.href,
                    documentName: link.textContent.trim(),
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            });
        });

        // Track uso de calendario
        document.querySelectorAll('.calendar-event, .event-item').forEach(event => {
            event.addEventListener('click', () => {
                this.recordEvent({
                    type: 'calendar_event_click',
                    timestamp: Date.now(),
                    eventTitle: event.textContent.trim(),
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            });
        });
    }

    /**
     * 📖 Track recursos educativos
     */
    trackEducationalResources() {
        // Track uso del chatbot educativo
        if (window.chatbot) {
            // Hook into chatbot events
            const originalSendMessage = window.chatbot.sendMessage;
            if (originalSendMessage) {
                window.chatbot.sendMessage = (...args) => {
                    this.recordEvent({
                        type: 'chatbot_interaction',
                        timestamp: Date.now(),
                        query: args[0]?.substring(0, 100) || 'unknown',
                        url: window.location.href,
                        sessionId: this.sessionId
                    });
                    return originalSendMessage.apply(window.chatbot, args);
                };
            }
        }

        // Track búsquedas
        document.querySelectorAll('input[type="search"], .search-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    this.recordEvent({
                        type: 'search_query',
                        timestamp: Date.now(),
                        query: input.value.trim(),
                        url: window.location.href,
                        sessionId: this.sessionId
                    });
                }
            });
        });
    }

    /**
     * 🎯 Track progreso académico
     */
    trackAcademicProgress() {
        // Track acceso a calificaciones
        document.querySelectorAll('.grade, .calificacion, .nota').forEach(grade => {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.recordEvent({
                                type: 'grade_view',
                                timestamp: Date.now(),
                                url: window.location.href,
                                sessionId: this.sessionId
                            });
                        }
                    });
                });
                observer.observe(grade);
            }
        });
    }

    /**
     * 📊 Configurar analytics predictivo
     */
    setupPredictiveAnalytics() {
        // Analizar patrones de comportamiento cada 5 minutos
        setInterval(() => {
            this.analyzeBehaviorPatterns();
        }, 300000);

        // Predecir abandono de página
        this.setupAbandonmentPrediction();

        // Predecir intenciones del usuario
        this.setupIntentPrediction();
    }

    /**
     * 🧠 Analizar patrones de comportamiento
     */
    analyzeBehaviorPatterns() {
        const recentEvents = this.events.filter(event =>
            Date.now() - event.timestamp < 300000 // últimos 5 minutos
        );

        const patterns = {
            clickFrequency: this.calculateClickFrequency(recentEvents),
            scrollBehavior: this.analyzeScrollBehavior(recentEvents),
            timePatterns: this.analyzeTimePatterns(recentEvents),
            engagementLevel: this.calculateEngagementLevel(recentEvents)
        };

        this.userBehavior.patterns = patterns;
        this.log('🧠 Patrones de comportamiento actualizados:', patterns);
    }

    /**
     * ⚠️ Configurar predicción de abandono
     */
    setupAbandonmentPrediction() {
        let inactivityTimer = null;
        const inactivityThreshold = 30000; // 30 segundos

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.recordEvent({
                    type: 'inactivity_detected',
                    timestamp: Date.now(),
                    duration: inactivityThreshold,
                    url: window.location.href,
                    sessionId: this.sessionId,
                    riskLevel: 'high'
                });
            }, inactivityThreshold);
        };

        // Reset timer on user activity
        document.addEventListener('mousemove', resetTimer);
        document.addEventListener('keypress', resetTimer);
        document.addEventListener('scroll', resetTimer);
        document.addEventListener('click', resetTimer);

        resetTimer(); // Initial timer
    }

    /**
     * 🎯 Configurar predicción de intenciones
     */
    setupIntentPrediction() {
        // Analizar intenciones basado en navegación
        this.analyzeNavigationIntent();

        // Analizar intenciones basado en búsquedas
        this.analyzeSearchIntent();

        // Analizar intenciones basado en tiempo en secciones
        this.analyzeSectionTimeIntent();
    }

    /**
     * 📋 Configurar reportes automáticos
     */
    setupAutomaticReporting() {
        // Reporte cada 30 segundos
        this.reportingInterval = setInterval(() => {
            this.sendAnalyticsData();
        }, this.config.sendInterval);

        // Reporte al salir de la página
        window.addEventListener('beforeunload', () => {
            this.sendAnalyticsData(true); // Envío inmediato
        });
    }

    /**
     * 📊 Track page view
     */
    trackPageView() {
        const pageData = {
            type: 'pageview',
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            sessionId: this.sessionId,
            userId: this.userId
        };

        this.recordEvent(pageData);
        this.pageViewStart = Date.now();
    }

    /**
     * 🚪 Track page exit
     */
    trackPageExit() {
        const exitData = {
            type: 'page_exit',
            timestamp: Date.now(),
            timeOnPage: Date.now() - this.pageViewStart,
            scrollDepth: this.scrollDepth,
            interactions: this.events.filter(e => e.type === 'click').length,
            url: window.location.href,
            sessionId: this.sessionId
        };

        this.recordEvent(exitData);
        this.sendAnalyticsData(true); // Envío inmediato
    }

    /**
     * 👁️ Track page hidden/visible
     */
    trackPageHidden() {
        this.recordEvent({
            type: 'page_hidden',
            timestamp: Date.now(),
            url: window.location.href,
            sessionId: this.sessionId
        });
    }

    trackPageVisible() {
        this.recordEvent({
            type: 'page_visible',
            timestamp: Date.now(),
            url: window.location.href,
            sessionId: this.sessionId
        });
    }

    /**
     * 📝 Registrar evento
     */
    recordEvent(eventData) {
        // Agregar metadatos comunes
        eventData.timestamp = eventData.timestamp || Date.now();
        eventData.sessionId = eventData.sessionId || this.sessionId;
        eventData.userId = eventData.userId || this.userId;

        // Anonimizar datos si está habilitado
        if (this.config.anonymizeData) {
            eventData = this.anonymizeEventData(eventData);
        }

        // Agregar a la cola de eventos
        this.events.push(eventData);

        // Mantener solo los últimos N eventos
        if (this.events.length > this.config.maxEvents) {
            this.events = this.events.slice(-this.config.maxEvents);
        }

        // Notificar al framework
        this.framework.dispatchEvent('analyticsEvent', eventData);

        if (this.framework.config.debug) {
            this.log('📊 Evento registrado:', eventData.type, eventData);
        }
    }

    /**
     * 📊 Registrar métrica de performance
     */
    recordPerformanceMetric(metricData) {
        this.recordEvent({
            type: 'performance_metric',
            timestamp: Date.now(),
            metric: metricData.metric,
            value: metricData.value,
            url: window.location.href,
            sessionId: this.sessionId
        });
    }

    /**
     * 📈 Registrar reporte de performance
     */
    recordPerformanceReport(report) {
        this.performanceData.latestReport = report;

        this.recordEvent({
            type: 'performance_report',
            timestamp: Date.now(),
            scores: report.scores,
            metrics: report.metrics,
            url: window.location.href,
            sessionId: this.sessionId
        });
    }

    /**
     * 🌐 Registrar timing de recursos
     */
    recordResourceTiming(entry) {
        // Solo registrar recursos importantes
        if (entry.duration > 100) { // Solo recursos que tardaron >100ms
            this.recordEvent({
                type: 'resource_timing',
                timestamp: Date.now(),
                resourceName: entry.name,
                duration: Math.round(entry.duration),
                size: entry.transferSize || 0,
                type: entry.initiatorType,
                url: window.location.href,
                sessionId: this.sessionId
            });
        }
    }

    /**
     * 📊 Actualizar métricas en tiempo real
     */
    updateRealTimeMetrics() {
        const now = Date.now();
        const sessionDuration = now - this.startTime;

        const realTimeData = {
            sessionDuration: sessionDuration,
            totalEvents: this.events.length,
            pageViews: this.events.filter(e => e.type === 'pageview').length,
            interactions: this.events.filter(e => e.type === 'click').length,
            scrollDepth: this.scrollDepth,
            timeOnCurrentPage: now - this.pageViewStart,
            timestamp: now
        };

        this.realTimeMetrics.set('current', realTimeData);

        // Notificar al framework
        this.framework.dispatchEvent('realTimeAnalytics', realTimeData);
    }

    /**
     * 📡 Enviar datos de analytics
     */
    async sendAnalyticsData(immediate = false) {
        if (this.isReporting && !immediate) return;
        if (this.events.length === 0) return;

        this.isReporting = true;

        try {
            // Preparar datos para envío
            const payload = {
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                events: [...this.events],
                metadata: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    screenResolution: `${screen.width}x${screen.height}`,
                    windowSize: `${window.innerWidth}x${window.innerHeight}`
                }
            };

            // Enviar a endpoints disponibles
            const promises = [];

            if (this.dataConnections.get('userInteractions')) {
                promises.push(this.sendToEndpoint('userInteractions', payload));
            }

            if (this.dataConnections.get('mysql')) {
                promises.push(this.sendToEndpoint('mysql', payload));
            }

            // Esperar al menos una respuesta exitosa
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;

            if (successful > 0) {
                this.log(`📡 Analytics enviado exitosamente (${successful}/${promises.length} endpoints)`);
                this.events = []; // Limpiar eventos enviados
            } else {
                this.log('⚠️ No se pudo enviar analytics a ningún endpoint');
            }

        } catch (error) {
            this.error('Error enviando analytics:', error);
        } finally {
            this.isReporting = false;
        }
    }

    /**
     * 📡 Enviar a endpoint específico
     */
    async sendToEndpoint(sourceName, payload) {
        const config = this.dataSources[sourceName];

        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': this.sessionId
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * 🔒 Anonimizar datos del evento
     */
    anonymizeEventData(eventData) {
        const anonymized = { ...eventData };

        // Remover/anonimizar datos sensibles
        if (anonymized.userAgent) {
            anonymized.userAgent = this.anonymizeUserAgent(anonymized.userAgent);
        }

        if (anonymized.url) {
            anonymized.url = this.anonymizeUrl(anonymized.url);
        }

        if (anonymized.elementText && anonymized.elementText.length > 50) {
            anonymized.elementText = anonymized.elementText.substring(0, 50) + '...';
        }

        return anonymized;
    }

    /**
     * 🔒 Anonimizar User Agent
     */
    anonymizeUserAgent(userAgent) {
        // Mantener solo información del navegador, no versiones específicas
        const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/);
        const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);

        return `${browserMatch?.[1] || 'Unknown'}_${osMatch?.[1] || 'Unknown'}`;
    }

    /**
     * 🔒 Anonimizar URL
     */
    anonymizeUrl(url) {
        try {
            const urlObj = new URL(url);
            // Mantener solo path, remover query params que puedan tener datos sensibles
            return urlObj.origin + urlObj.pathname;
        } catch {
            return 'invalid_url';
        }
    }

    /**
     * 📊 Configurar dashboard en tiempo real
     */
    setupRealTimeDashboard() {
        // Si hay un dashboard disponible, conectarse
        if (document.querySelector('#analytics-dashboard')) {
            this.setupDashboardUpdates();
        }
    }

    /**
     * 📊 Configurar actualizaciones del dashboard
     */
    setupDashboardUpdates() {
        // Actualizar dashboard cada 30 segundos
        setInterval(() => {
            const dashboardData = this.generateDashboardData();
            this.updateDashboard(dashboardData);
        }, 30000);
    }

    /**
     * 📊 Generar datos para dashboard
     */
    generateDashboardData() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        const recentEvents = this.events.filter(e => e.timestamp > last24h);

        return {
            totalEvents: recentEvents.length,
            pageViews: recentEvents.filter(e => e.type === 'pageview').length,
            uniqueUsers: new Set(recentEvents.map(e => e.userId)).size,
            avgSessionDuration: this.calculateAvgSessionDuration(recentEvents),
            topPages: this.getTopPages(recentEvents),
            deviceBreakdown: this.getDeviceBreakdown(recentEvents),
            hourlyActivity: this.getHourlyActivity(recentEvents),
            realTimeUsers: 1, // Usuario actual
            bounceRate: this.calculateBounceRate(recentEvents)
        };
    }

    /**
     * 🔧 Funciones auxiliares para cálculos
     */
    calculateClickFrequency(events) {
        const clicks = events.filter(e => e.type === 'click');
        return clicks.length / Math.max(1, (Date.now() - this.startTime) / 60000); // clicks por minuto
    }

    analyzeScrollBehavior(events) {
        const scrollEvents = events.filter(e => e.type === 'scroll');
        return {
            maxDepth: Math.max(...scrollEvents.map(e => e.scrollDepth), 0),
            frequency: scrollEvents.length
        };
    }

    analyzeTimePatterns(events) {
        return {
            totalTime: Date.now() - this.startTime,
            timeOnCurrentPage: Date.now() - this.pageViewStart,
            eventFrequency: events.length / Math.max(1, (Date.now() - this.startTime) / 60000)
        };
    }

    calculateEngagementLevel(events) {
        const interactionEvents = events.filter(e =>
            ['click', 'scroll', 'form_start', 'search_query'].includes(e.type)
        );

        const timeSpent = Date.now() - this.startTime;
        const engagementScore = (interactionEvents.length * 10) / Math.max(1, timeSpent / 60000);

        if (engagementScore > 50) return 'high';
        if (engagementScore > 20) return 'medium';
        return 'low';
    }

    /**
     * 🔧 Utilidades
     */
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

    /**
     * 📊 API pública del módulo
     */
    getAnalyticsData() {
        return {
            events: [...this.events],
            realTimeMetrics: Object.fromEntries(this.realTimeMetrics),
            userBehavior: this.userBehavior,
            educationalMetrics: this.educationalMetrics,
            performanceData: this.performanceData
        };
    }

    getSessionSummary() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: this.startTime,
            duration: Date.now() - this.startTime,
            totalEvents: this.events.length,
            scrollDepth: this.scrollDepth,
            timeOnPage: this.timeOnPage
        };
    }

    async exportAnalytics(format = 'json') {
        const data = this.getAnalyticsData();

        if (format === 'csv') {
            return this.convertToCSV(data.events);
        }

        return JSON.stringify(data, null, 2);
    }

    convertToCSV(events) {
        if (events.length === 0) return '';

        const headers = Object.keys(events[0]);
        const csvContent = [
            headers.join(','),
            ...events.map(event =>
                headers.map(header =>
                    JSON.stringify(event[header] || '')
                ).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    clearAnalytics() {
        this.events = [];
        this.realTimeMetrics.clear();
        this.analyticsCache.clear();
        this.userBehavior = {};
        this.educationalMetrics = {};
        this.performanceData = {};
    }

    // ===================================================================
    // FUNCIONALIDADES AVANZADAS MIGRADAS DE advanced-analytics.js
    // ===================================================================

    /**
     * 🎯 Configurar Google Analytics si está disponible
     */
    setupGoogleAnalytics() {
        // Solo configurar si GA está disponible globalmente
        if (typeof gtag !== 'undefined') {
            this.googleAnalytics = {
                enabled: true,
                track: (event, data) => {
                    gtag('event', event, data);
                }
            };
            this.log('✅ Google Analytics conectado');
        }
    }

    /**
     * 📘 Configurar Facebook Pixel si está disponible
     */
    setupFacebookPixel() {
        // Solo configurar si Facebook Pixel está disponible
        if (typeof fbq !== 'undefined') {
            this.facebookPixel = {
                enabled: true,
                track: (event, data) => {
                    fbq('track', event, data);
                }
            };
            this.log('✅ Facebook Pixel conectado');
        }
    }

    /**
     * 🔥 Configurar sistema de mapas de calor
     */
    setupHeatmapAnalytics() {
        if (!this.config.enableHeatmaps) return;

        this.heatmapData = {
            clicks: [],
            movements: [],
            scrolls: []
        };

        // Track mouse movements (muestreado para performance)
        let lastMouseMove = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseMove > 100) { // Solo cada 100ms
                this.heatmapData.movements.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: now,
                    url: window.location.pathname
                });
                lastMouseMove = now;

                // Mantener solo los últimos 1000 movimientos
                if (this.heatmapData.movements.length > 1000) {
                    this.heatmapData.movements = this.heatmapData.movements.slice(-1000);
                }
            }
        });

        // Track clicks para heatmap
        document.addEventListener('click', (e) => {
            this.heatmapData.clicks.push({
                x: e.clientX,
                y: e.clientY,
                element: e.target.tagName.toLowerCase(),
                timestamp: Date.now(),
                url: window.location.pathname
            });

            // Mantener solo los últimos 500 clicks
            if (this.heatmapData.clicks.length > 500) {
                this.heatmapData.clicks = this.heatmapData.clicks.slice(-500);
            }
        });

        this.log('🔥 Sistema de mapas de calor activado');
    }

    /**
     * 📊 Crear dashboard visual avanzado
     */
    createAdvancedDashboard() {
        // Solo crear dashboard si el usuario es admin
        if (!this.isAdmin()) return;

        const dashboardButton = document.createElement('div');
        dashboardButton.className = 'bge-analytics-dashboard-toggle position-fixed';
        dashboardButton.style.cssText = `
            bottom: 20px; right: 20px; z-index: 1050;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white; padding: 12px; border-radius: 50%;
            cursor: pointer; box-shadow: 0 4px 20px rgba(0, 123, 255, 0.4);
            width: 56px; height: 56px; display: flex;
            align-items: center; justify-content: center;
            transition: all 0.3s ease; font-size: 18px;
        `;
        dashboardButton.innerHTML = '📊';
        dashboardButton.title = 'BGE Analytics Dashboard';

        // Efectos hover
        dashboardButton.addEventListener('mouseenter', () => {
            dashboardButton.style.transform = 'scale(1.1)';
            dashboardButton.style.boxShadow = '0 6px 25px rgba(0, 123, 255, 0.6)';
        });

        dashboardButton.addEventListener('mouseleave', () => {
            dashboardButton.style.transform = 'scale(1)';
            dashboardButton.style.boxShadow = '0 4px 20px rgba(0, 123, 255, 0.4)';
        });

        dashboardButton.addEventListener('click', () => {
            this.toggleAdvancedDashboard();
        });

        document.body.appendChild(dashboardButton);
        this.log('📊 Dashboard button creado');
    }

    /**
     * 🔧 Verificar si usuario es admin
     */
    isAdmin() {
        return localStorage.getItem('userRole') === 'admin' ||
               window.location.search.includes('admin=true') ||
               window.location.search.includes('debug=true');
    }

    /**
     * 📊 Toggle del dashboard avanzado
     */
    toggleAdvancedDashboard() {
        const existingDashboard = document.getElementById('bge-analytics-dashboard');

        if (existingDashboard) {
            existingDashboard.style.transform = 'translateX(100%)';
            setTimeout(() => existingDashboard.remove(), 300);
        } else {
            this.createDashboardPanel();
        }
    }

    /**
     * 📊 Crear panel del dashboard
     */
    createDashboardPanel() {
        const dashboard = document.createElement('div');
        dashboard.id = 'bge-analytics-dashboard';
        dashboard.className = 'position-fixed top-0 end-0 h-100 bg-white shadow-lg border-start';
        dashboard.style.cssText = `
            width: 420px; z-index: 1060; overflow-y: auto;
            transform: translateX(100%); transition: transform 0.3s ease;
        `;

        const dashboardHTML = `
            <div class="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">📊 BGE Analytics</h5>
                <button class="btn btn-sm btn-outline-light" onclick="this.closest('#bge-analytics-dashboard').style.transform='translateX(100%)'; setTimeout(() => this.closest('#bge-analytics-dashboard').remove(), 300)">
                    ✕
                </button>
            </div>
            <div class="p-3">
                <div class="row g-3">
                    <!-- Métricas principales -->
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">📈 Métricas de Sesión</h6>
                                <div class="row text-center">
                                    <div class="col-6">
                                        <div class="fs-4 fw-bold text-primary" id="dashboard-events">${this.events.length}</div>
                                        <small class="text-muted">Eventos</small>
                                    </div>
                                    <div class="col-6">
                                        <div class="fs-4 fw-bold text-success" id="dashboard-time">${Math.round((Date.now() - this.startTime) / 1000)}s</div>
                                        <small class="text-muted">Tiempo</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Performance -->
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">⚡ Performance</h6>
                                <div id="performance-metrics">
                                    ${this.generatePerformanceHTML()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Eventos recientes -->
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">📋 Eventos Recientes</h6>
                                <div class="list-group list-group-flush" id="recent-events" style="max-height: 200px; overflow-y: auto;">
                                    ${this.generateRecentEventsHTML()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Heatmap (si está habilitado) -->
                    ${this.config.enableHeatmaps ? `
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">🔥 Mapa de Calor</h6>
                                <canvas id="heatmap-canvas" width="300" height="200" style="max-width: 100%; border: 1px solid #ddd;"></canvas>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Controles -->
                    <div class="col-12">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" onclick="window.BGE?.analytics?.exportAnalytics?.('json')">
                                📥 Exportar JSON
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="window.BGE?.analytics?.clearAnalytics?.()">
                                🗑️ Limpiar Datos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        dashboard.innerHTML = dashboardHTML;
        document.body.appendChild(dashboard);

        // Animar entrada
        setTimeout(() => {
            dashboard.style.transform = 'translateX(0)';
        }, 10);

        // Configurar actualizaciones en tiempo real
        this.setupDashboardUpdates(dashboard);

        // Generar heatmap si está habilitado
        if (this.config.enableHeatmaps) {
            setTimeout(() => this.drawHeatmap(), 500);
        }
    }

    /**
     * 📊 Generar HTML de métricas de performance
     */
    generatePerformanceHTML() {
        if (!this.framework.modules.has('performance')) {
            return '<small class="text-muted">Performance module no disponible</small>';
        }

        const perfModule = this.framework.modules.get('performance');
        const metrics = perfModule.getMetrics();

        let html = '<div class="row g-2 text-center">';

        Object.entries(metrics).forEach(([key, value]) => {
            if (value !== null) {
                html += `
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <div class="fw-bold ${this.getMetricColorClass(key, value)}">${Math.round(value)}</div>
                            <small class="text-muted">${key.toUpperCase()}</small>
                        </div>
                    </div>
                `;
            }
        });

        html += '</div>';
        return html;
    }

    /**
     * 🎨 Obtener clase de color para métrica
     */
    getMetricColorClass(metric, value) {
        const thresholds = this.thresholds[metric];
        if (!thresholds) return 'text-primary';

        if (value <= thresholds.good) return 'text-success';
        if (value <= thresholds.poor) return 'text-warning';
        return 'text-danger';
    }

    /**
     * 📋 Generar HTML de eventos recientes
     */
    generateRecentEventsHTML() {
        const recentEvents = this.events.slice(-10).reverse();

        if (recentEvents.length === 0) {
            return '<div class="text-muted text-center py-3">No hay eventos aún</div>';
        }

        return recentEvents.map(event => `
            <div class="list-group-item list-group-item-action py-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${this.getEventIcon(event.type)} ${event.type}</strong>
                        <div class="small text-muted">${this.formatEventDescription(event)}</div>
                    </div>
                    <small class="text-muted">${this.formatTime(event.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }

    /**
     * 🎯 Obtener icono para tipo de evento
     */
    getEventIcon(eventType) {
        const icons = {
            pageview: '📄',
            click: '🖱️',
            scroll: '📜',
            form_submit: '📝',
            search_query: '🔍',
            educational_section_view: '🎓',
            performance_metric: '⚡',
            error: '🚨'
        };
        return icons[eventType] || '📊';
    }

    /**
     * 📝 Formatear descripción del evento
     */
    formatEventDescription(event) {
        switch (event.type) {
            case 'click':
                return `${event.elementTag || 'elemento'} ${event.elementClass ? '.' + event.elementClass : ''}`;
            case 'pageview':
                return new URL(event.url || window.location.href).pathname;
            case 'scroll':
                return `Profundidad: ${event.scrollDepth || 0}%`;
            case 'performance_metric':
                return `${event.metric}: ${Math.round(event.value || 0)}ms`;
            default:
                return event.url ? new URL(event.url).pathname : '';
        }
    }

    /**
     * ⏰ Formatear timestamp
     */
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return `${Math.round(diff / 1000)}s`;
        if (diff < 3600000) return `${Math.round(diff / 60000)}m`;
        return `${Math.round(diff / 3600000)}h`;
    }

    /**
     * 🔄 Configurar actualizaciones del dashboard
     */
    setupDashboardUpdates(dashboard) {
        const updateInterval = setInterval(() => {
            if (!document.contains(dashboard)) {
                clearInterval(updateInterval);
                return;
            }

            // Actualizar métricas básicas
            const eventsEl = dashboard.querySelector('#dashboard-events');
            const timeEl = dashboard.querySelector('#dashboard-time');
            if (eventsEl) eventsEl.textContent = this.events.length;
            if (timeEl) timeEl.textContent = Math.round((Date.now() - this.startTime) / 1000) + 's';

            // Actualizar eventos recientes
            const recentEventsEl = dashboard.querySelector('#recent-events');
            if (recentEventsEl) {
                recentEventsEl.innerHTML = this.generateRecentEventsHTML();
            }

            // Actualizar performance si está disponible
            const performanceEl = dashboard.querySelector('#performance-metrics');
            if (performanceEl) {
                performanceEl.innerHTML = this.generatePerformanceHTML();
            }
        }, 2000);
    }

    /**
     * 🔥 Dibujar mapa de calor
     */
    drawHeatmap() {
        const canvas = document.getElementById('heatmap-canvas');
        if (!canvas || !this.heatmapData) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar puntos de click
        this.heatmapData.clicks.forEach(click => {
            const x = (click.x / window.innerWidth) * canvas.width;
            const y = (click.y / window.innerHeight) * canvas.height;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * 📊 Enviar a múltiples proveedores
     */
    sendToAllProviders(event, data) {
        const providers = [];

        // Google Analytics
        if (this.googleAnalytics?.enabled) {
            providers.push(this.googleAnalytics.track(event, data));
        }

        // Facebook Pixel
        if (this.facebookPixel?.enabled) {
            providers.push(this.facebookPixel.track(event, data));
        }

        // BGE Custom Analytics (siempre disponible)
        providers.push(this.recordEvent({
            type: event,
            ...data,
            timestamp: Date.now()
        }));

        return Promise.allSettled(providers);
    }

    /**
     * 📈 Configurar reportes automáticos avanzados
     */
    setupAdvancedReporting() {
        // Reporte diario
        setInterval(() => {
            this.generateDailyReport();
        }, 24 * 60 * 60 * 1000);

        // Reporte de sesión al cerrar
        window.addEventListener('beforeunload', () => {
            this.generateSessionReport();
        });
    }

    /**
     * 📊 Generar reporte diario
     */
    generateDailyReport() {
        const report = {
            date: new Date().toISOString().split('T')[0],
            totalEvents: this.events.length,
            uniquePages: new Set(this.events.map(e => e.url)).size,
            topEvents: this.getTopEventTypes(),
            averageSessionTime: this.calculateAverageSessionTime(),
            educationalInteractions: this.events.filter(e =>
                e.type.includes('educational') || e.type.includes('academic')
            ).length
        };

        this.log('📊 Reporte diario generado:', report);
        return report;
    }

    /**
     * 📋 Generar reporte de sesión
     */
    generateSessionReport() {
        const report = {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            totalEvents: this.events.length,
            interactions: this.events.filter(e => ['click', 'scroll', 'form_submit'].includes(e.type)).length,
            maxScrollDepth: this.scrollDepth,
            errors: this.events.filter(e => e.type.includes('error')).length
        };

        // Enviar reporte final
        this.sendToEndpoint('userInteractions', {
            type: 'session_report',
            report: report,
            timestamp: Date.now()
        }).catch(() => {
            // Guardar en localStorage si falla el envío
            localStorage.setItem('bge_last_session_report', JSON.stringify(report));
        });

        return report;
    }

    /**
     * 📊 Obtener tipos de eventos más frecuentes
     */
    getTopEventTypes() {
        const eventCounts = {};
        this.events.forEach(event => {
            eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        });

        return Object.entries(eventCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    /**
     * ⏱️ Calcular tiempo promedio de sesión
     */
    calculateAverageSessionTime() {
        // Simplificado: tiempo actual de sesión
        return Date.now() - this.startTime;
    }

    /**
     * 📚 Cargar datos iniciales
     */
    async loadInitialData() {
        this.log('Cargando datos iniciales...');

        // Cargar configuración adicional si está disponible
        if (this.dataConnections.get('mysql')) {
            try {
                await this.loadConfigurationFromDatabase();
            } catch (error) {
                this.log('⚠️ No se pudo cargar configuración de base de datos');
            }
        }

        // Cargar métricas históricas básicas
        this.loadHistoricalMetrics();
    }

    async loadConfigurationFromDatabase() {
        const response = await fetch('/api/analytics/config');
        if (response.ok) {
            const config = await response.json();
            this.config = { ...this.config, ...config };
            this.log('✅ Configuración cargada desde base de datos');
        }
    }

    loadHistoricalMetrics() {
        // Cargar métricas básicas del localStorage
        try {
            const stored = localStorage.getItem('bge_analytics_history');
            if (stored) {
                const history = JSON.parse(stored);
                this.analyticsCache.set('history', history);
                this.log('✅ Métricas históricas cargadas');
            }
        } catch (error) {
            this.log('⚠️ Error cargando métricas históricas');
        }
    }
}

// Registro global para compatibilidad
window.BGEAnalyticsModule = BGEAnalyticsModule;

// Auto-instanciación si no hay framework
if (typeof window !== 'undefined' && !window.BGE) {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.bgeAnalyticsModule) {
            window.bgeAnalyticsModule = new BGEAnalyticsModule({
                config: { debug: true },
                dispatchEvent: (event, data) => console.log(`Event: ${event}`, data),
                modules: new Map()
            });
        }
    });
}