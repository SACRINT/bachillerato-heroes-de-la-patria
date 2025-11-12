/**
 * BGE ANALYTICS ADVANCED SYSTEM - Sistema Avanzado de Analíticas
 *
 * Sistema integral de análisis de datos educativo para BGE
 * Incluye métricas en tiempo real, análisis predictivo y dashboards interactivos
 */

class BGEAdvancedAnalytics {
    constructor() {
        this.apiBase = '/api/analytics';
        this.eventQueue = [];
        this.metricsCache = new Map();
        this.realtimeUpdates = null;
        this.analyticsConfig = {
            trackingEnabled: true,
            realtimeInterval: 5000, // 5 segundos
            batchSize: 100,
            retryAttempts: 3,
            privacyMode: false
        };

        this.eventTypes = {
            USER_ACTION: 'user_action',
            PAGE_VIEW: 'page_view',
            PERFORMANCE: 'performance',
            EDUCATIONAL: 'educational',
            ENGAGEMENT: 'engagement',
            ERROR: 'error'
        };

        this.init();
    }

    async init() {
        console.log('🚀 [BGE-ANALYTICS] Inicializando sistema avanzado de analíticas');

        // Cargar configuración
        await this.loadConfiguration();

        // Inicializar tracking automático
        this.initializeAutoTracking();

        // Configurar dashboards
        this.initializeDashboards();

        // Iniciar actualizaciones en tiempo real
        if (this.analyticsConfig.trackingEnabled) {
            this.startRealtimeUpdates();
        }

        console.log('✅ [BGE-ANALYTICS] Sistema inicializado correctamente');
    }

    async loadConfiguration() {
        try {
            const config = await this.fetchWithRetry('/config');
            if (config.success) {
                Object.assign(this.analyticsConfig, config.data);
            }
        } catch (error) {
            console.warn('⚠️ [BGE-ANALYTICS] Usando configuración por defecto:', error);
        }
    }

    // =====================================================
    // SISTEMA DE TRACKING AUTOMÁTICO
    // =====================================================

    initializeAutoTracking() {
        // Tracking de navegación
        this.trackPageViews();

        // Tracking de interacciones
        this.trackUserInteractions();

        // Tracking de rendimiento
        this.trackPerformance();

        // Tracking educativo específico
        this.trackEducationalEvents();

        // Tracking de errores
        this.trackErrors();
    }

    trackPageViews() {
        // Registrar página actual
        this.trackEvent(this.eventTypes.PAGE_VIEW, {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });

        // Tracking de cambios de página (SPA)
        window.addEventListener('popstate', () => {
            this.trackEvent(this.eventTypes.PAGE_VIEW, {
                page: window.location.pathname,
                type: 'navigation',
                timestamp: Date.now()
            });
        });

        // Tracking de tiempo en página
        this.trackTimeOnPage();
    }

    trackTimeOnPage() {
        let startTime = Date.now();
        let isActive = true;

        // Detectar cuando el usuario abandona/retorna
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Usuario abandona la página
                this.trackEvent(this.eventTypes.ENGAGEMENT, {
                    action: 'page_leave',
                    timeSpent: Date.now() - startTime,
                    page: window.location.pathname
                });
                isActive = false;
            } else {
                // Usuario retorna a la página
                startTime = Date.now();
                isActive = true;
                this.trackEvent(this.eventTypes.ENGAGEMENT, {
                    action: 'page_return',
                    page: window.location.pathname
                });
            }
        });

        // Tracking al cerrar/recargar página
        window.addEventListener('beforeunload', () => {
            if (isActive) {
                this.trackEvent(this.eventTypes.ENGAGEMENT, {
                    action: 'page_exit',
                    timeSpent: Date.now() - startTime,
                    page: window.location.pathname
                });
            }
        });
    }

    trackUserInteractions() {
        // Clicks en elementos importantes
        document.addEventListener('click', (event) => {
            const element = event.target;
            const trackableElements = ['button', 'a', '[data-track]', '.btn', '.nav-link'];

            if (trackableElements.some(selector => element.matches(selector))) {
                this.trackEvent(this.eventTypes.USER_ACTION, {
                    action: 'click',
                    element: this.getElementIdentifier(element),
                    position: { x: event.clientX, y: event.clientY },
                    timestamp: Date.now()
                });
            }
        });

        // Scroll tracking
        let lastScrollTime = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 1000) { // Throttle a 1 segundo
                const scrollPercent = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );

                this.trackEvent(this.eventTypes.ENGAGEMENT, {
                    action: 'scroll',
                    scrollPercent,
                    page: window.location.pathname,
                    timestamp: now
                });

                lastScrollTime = now;
            }
        });

        // Form interactions
        this.trackFormInteractions();
    }

    trackFormInteractions() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                this.trackEvent(this.eventTypes.USER_ACTION, {
                    action: 'form_submit',
                    formId: form.id || 'unnamed',
                    formAction: form.action,
                    fieldCount: form.elements.length,
                    timestamp: Date.now()
                });
            }
        });

        // Focus en campos de formulario
        document.addEventListener('focus', (event) => {
            if (['input', 'textarea', 'select'].includes(event.target.tagName.toLowerCase())) {
                this.trackEvent(this.eventTypes.USER_ACTION, {
                    action: 'field_focus',
                    fieldType: event.target.type,
                    fieldName: event.target.name,
                    timestamp: Date.now()
                });
            }
        }, true);
    }

    trackPerformance() {
        // Métricas de rendimiento de la página
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.trackEvent(this.eventTypes.PERFORMANCE, {
                        loadTime: perfData.loadEventEnd - perfData.fetchStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                        firstPaint: this.getFirstPaintTime(),
                        resourceCount: performance.getEntriesByType('resource').length,
                        page: window.location.pathname,
                        timestamp: Date.now()
                    });
                }
            }, 1000);
        });

        // Monitoreo de memoria (si está disponible)
        if ('memory' in performance) {
            setInterval(() => {
                this.trackEvent(this.eventTypes.PERFORMANCE, {
                    memoryUsed: performance.memory.usedJSHeapSize,
                    memoryTotal: performance.memory.totalJSHeapSize,
                    timestamp: Date.now()
                });
            }, 30000); // Cada 30 segundos
        }
    }

    trackEducationalEvents() {
        // Tracking específico para eventos educativos
        const educationalSelectors = [
            '[data-course-id]',
            '[data-lesson-id]',
            '[data-assignment-id]',
            '.grade-item',
            '.calendar-event',
            '.notification-item'
        ];

        educationalSelectors.forEach(selector => {
            document.addEventListener('click', (event) => {
                if (event.target.matches(selector)) {
                    this.trackEvent(this.eventTypes.EDUCATIONAL, {
                        action: 'educational_interaction',
                        elementType: selector,
                        elementData: this.extractEducationalData(event.target),
                        timestamp: Date.now()
                    });
                }
            });
        });

        // Tracking de progreso en cursos
        this.trackCourseProgress();
    }

    trackCourseProgress() {
        // Detectar completado de lecciones, tareas, etc.
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-completed') {
                    const element = mutation.target;
                    this.trackEvent(this.eventTypes.EDUCATIONAL, {
                        action: 'lesson_completed',
                        lessonId: element.dataset.lessonId,
                        courseId: element.dataset.courseId,
                        completionTime: Date.now()
                    });
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['data-completed', 'data-progress']
        });
    }

    trackErrors() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.trackEvent(this.eventTypes.ERROR, {
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });

        // Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent(this.eventTypes.ERROR, {
                type: 'unhandled_rejection',
                reason: event.reason,
                timestamp: Date.now()
            });
        });

        // Network errors
        this.trackNetworkErrors();
    }

    // =====================================================
    // SISTEMA DE EVENTOS Y MÉTRICAS
    // =====================================================

    trackEvent(type, data) {
        if (!this.analyticsConfig.trackingEnabled) return;

        const event = {
            id: this.generateEventId(),
            type,
            data,
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            timestamp: Date.now(),
            page: window.location.pathname,
            userAgent: navigator.userAgent
        };

        // Aplicar privacidad si está habilitada
        if (this.analyticsConfig.privacyMode) {
            event.data = this.anonymizeData(event.data);
        }

        this.eventQueue.push(event);

        // Enviar eventos en lotes
        if (this.eventQueue.length >= this.analyticsConfig.batchSize) {
            this.sendEvents();
        }

        // Trigger eventos personalizados para dashboards
        this.triggerAnalyticsEvent(type, event);
    }

    async sendEvents() {
        if (this.eventQueue.length === 0) return;

        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            await this.fetchWithRetry('/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: eventsToSend })
            });

            console.log(`📊 [BGE-ANALYTICS] Enviados ${eventsToSend.length} eventos`);
        } catch (error) {
            console.error('❌ [BGE-ANALYTICS] Error enviando eventos:', error);
            // Reencolar eventos fallidos
            this.eventQueue.unshift(...eventsToSend);
        }
    }

    // =====================================================
    // DASHBOARDS Y VISUALIZACIONES
    // =====================================================

    initializeDashboards() {
        this.dashboards = {
            realtime: new RealtimeDashboard(this),
            academic: new AcademicDashboard(this),
            engagement: new EngagementDashboard(this),
            performance: new PerformanceDashboard(this)
        };

        // Crear contenedores de dashboard si no existen
        this.createDashboardContainers();
    }

    createDashboardContainers() {
        if (document.querySelector('.analytics-dashboard-container')) return;

        const dashboardContainer = document.createElement('div');
        dashboardContainer.className = 'analytics-dashboard-container';
        dashboardContainer.innerHTML = sanitizeHTML(`
            <div class="analytics-tabs">
                <button class="analytics-tab active" data-dashboard="realtime">
                    📊 Tiempo Real
                </button>
                <button class="analytics-tab" data-dashboard="academic">
                    🎓 Académico
                </button>
                <button class="analytics-tab" data-dashboard="engagement">
                    👥 Participación
                </button>
                <button class="analytics-tab" data-dashboard="performance">
                    ⚡ Rendimiento
                </button>
            </div>
            <div class="analytics-content">
                <div id="realtime-dashboard" class="analytics-panel active"></div>
                <div id="academic-dashboard" class="analytics-panel"></div>
                <div id="engagement-dashboard" class="analytics-panel"></div>
                <div id="performance-dashboard" class="analytics-panel"></div>
            </div>
        `);

        // Insertar en dashboard admin si existe
        const adminDashboard = document.querySelector('#admin-dashboard-content');
        if (adminDashboard) {
            adminDashboard.appendChild(dashboardContainer);
            this.initializeDashboardTabs();
        }
    }

    initializeDashboardTabs() {
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const dashboardType = e.target.dataset.dashboard;
                this.switchDashboard(dashboardType);
            });
        });
    }

    switchDashboard(type) {
        // Actualizar tabs
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.dashboard === type);
        });

        // Actualizar paneles
        document.querySelectorAll('.analytics-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${type}-dashboard`);
        });

        // Cargar dashboard específico
        if (this.dashboards[type]) {
            this.dashboards[type].render();
        }
    }

    // =====================================================
    // MÉTRICAS Y REPORTES
    // =====================================================

    async generateReport(type, dateRange = { start: null, end: null }) {
        console.log(`📈 [BGE-ANALYTICS] Generando reporte: ${type}`);

        try {
            const reportData = await this.fetchWithRetry(`/reports/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dateRange)
            });

            if (reportData.success) {
                return new AnalyticsReport(type, reportData.data);
            }
        } catch (error) {
            console.error('❌ [BGE-ANALYTICS] Error generando reporte:', error);
            throw error;
        }
    }

    async getMetrics(category, timeframe = '24h') {
        const cacheKey = `${category}_${timeframe}`;

        // Verificar caché
        if (this.metricsCache.has(cacheKey)) {
            const cached = this.metricsCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutos
                return cached.data;
            }
        }

        try {
            const metrics = await this.fetchWithRetry(`/metrics/${category}?timeframe=${timeframe}`);

            if (metrics.success) {
                // Actualizar caché
                this.metricsCache.set(cacheKey, {
                    data: metrics.data,
                    timestamp: Date.now()
                });

                return metrics.data;
            }
        } catch (error) {
            console.error('❌ [BGE-ANALYTICS] Error obteniendo métricas:', error);
            return null;
        }
    }

    // =====================================================
    // ACTUALIZACIONES EN TIEMPO REAL
    // =====================================================

    startRealtimeUpdates() {
        if (this.realtimeUpdates) return;

        console.log('🔄 [BGE-ANALYTICS] Iniciando actualizaciones en tiempo real');

        this.realtimeUpdates = setInterval(() => {
            this.updateRealtimeMetrics();
        }, this.analyticsConfig.realtimeInterval);

        // WebSocket para actualizaciones instantáneas si está disponible
        this.initializeWebSocket();
    }

    stopRealtimeUpdates() {
        if (this.realtimeUpdates) {
            clearInterval(this.realtimeUpdates);
            this.realtimeUpdates = null;
        }
    }

    async updateRealtimeMetrics() {
        try {
            const realtimeData = await this.fetchWithRetry('/realtime');

            if (realtimeData.success) {
                this.triggerAnalyticsEvent('realtime_update', realtimeData.data);

                // Actualizar dashboards activos
                if (this.dashboards.realtime && document.querySelector('#realtime-dashboard.active')) {
                    this.dashboards.realtime.update(realtimeData.data);
                }
            }
        } catch (error) {
            console.warn('⚠️ [BGE-ANALYTICS] Error en actualización en tiempo real:', error);
        }
    }

    initializeWebSocket() {
        if (!window.WebSocket) return;

        try {
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/analytics`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeMessage(data);
            };

            this.ws.onclose = () => {
                console.log('🔌 [BGE-ANALYTICS] WebSocket desconectado, reintentando...');
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
        } catch (error) {
            console.warn('⚠️ [BGE-ANALYTICS] WebSocket no disponible:', error);
        }
    }

    // =====================================================
    // UTILIDADES Y HELPERS
    // =====================================================

    async fetchWithRetry(endpoint, options = {}, retries = this.analyticsConfig.retryAttempts) {
        const url = `${this.apiBase}${endpoint}`;

        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`,
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                if (i === retries) throw error;

                // Backoff exponencial
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    getElementIdentifier(element) {
        return {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            classes: Array.from(element.classList),
            text: element.textContent?.trim().substring(0, 50) || null,
            attributes: this.getRelevantAttributes(element)
        };
    }

    getRelevantAttributes(element) {
        const relevantAttrs = ['data-track', 'data-course-id', 'data-lesson-id', 'href', 'name'];
        const attrs = {};

        relevantAttrs.forEach(attr => {
            if (element.hasAttribute(attr)) {
                attrs[attr] = element.getAttribute(attr);
            }
        });

        return attrs;
    }

    extractEducationalData(element) {
        return {
            courseId: element.dataset.courseId,
            lessonId: element.dataset.lessonId,
            assignmentId: element.dataset.assignmentId,
            studentId: element.dataset.studentId,
            gradeId: element.dataset.gradeId
        };
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('bge_analytics_session');
        if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('bge_analytics_session', sessionId);
        }
        return sessionId;
    }

    getUserId() {
        // Obtener desde sistema de autenticación
        return localStorage.getItem('bge_user_id') || 'anonymous';
    }

    getAuthToken() {
        return localStorage.getItem('bge_auth_token') || '';
    }

    getFirstPaintTime() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    anonymizeData(data) {
        // Remover datos sensibles en modo privacidad
        const anonymized = { ...data };

        // Lista de campos a anonimizar
        const sensitiveFields = ['userId', 'email', 'name', 'ip', 'userAgent'];

        sensitiveFields.forEach(field => {
            if (anonymized[field]) {
                anonymized[field] = this.hashValue(anonymized[field]);
            }
        });

        return anonymized;
    }

    hashValue(value) {
        // Hash simple para anonimización
        return btoa(value).replace(/[+/=]/g, '').substring(0, 8);
    }

    triggerAnalyticsEvent(type, data) {
        const event = new CustomEvent('bge-analytics', {
            detail: { type, data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    trackNetworkErrors() {
        // Interceptar fetch errors
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            return originalFetch.apply(this, args)
                .catch(error => {
                    this.trackEvent(this.eventTypes.ERROR, {
                        type: 'network_error',
                        url: args[0],
                        error: error.message,
                        timestamp: Date.now()
                    });
                    throw error;
                });
        };
    }

    // =====================================================
    // API PÚBLICA
    // =====================================================

    // Método para tracking manual desde otras partes de la aplicación
    track(eventType, eventData) {
        this.trackEvent(eventType, eventData);
    }

    // Obtener configuración actual
    getConfiguration() {
        return { ...this.analyticsConfig };
    }

    // Actualizar configuración
    updateConfiguration(newConfig) {
        Object.assign(this.analyticsConfig, newConfig);
        console.log('⚙️ [BGE-ANALYTICS] Configuración actualizada:', this.analyticsConfig);
    }

    // Exportar datos
    async exportData(format = 'json', dateRange = {}) {
        console.log(`💾 [BGE-ANALYTICS] Exportando datos en formato: ${format}`);

        try {
            const exportData = await this.fetchWithRetry('/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format, dateRange })
            });

            if (exportData.success) {
                this.downloadFile(exportData.data, `analytics_export_${Date.now()}.${format}`);
                return exportData.data;
            }
        } catch (error) {
            console.error('❌ [BGE-ANALYTICS] Error exportando datos:', error);
            throw error;
        }
    }

    downloadFile(data, filename) {
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Limpiar datos
    clearData() {
        this.eventQueue = [];
        this.metricsCache.clear();
        sessionStorage.removeItem('bge_analytics_session');
        console.log('🧹 [BGE-ANALYTICS] Datos limpiados');
    }

    // Destructor
    destroy() {
        this.stopRealtimeUpdates();
        if (this.ws) {
            this.ws.close();
        }
        this.clearData();
        console.log('💀 [BGE-ANALYTICS] Sistema destruido');
    }
}

// =====================================================
// CLASSES DE DASHBOARDS ESPECIALIZADOS
// =====================================================

class RealtimeDashboard {
    constructor(analytics) {
        this.analytics = analytics;
        this.container = null;
    }

    render() {
        this.container = document.getElementById('realtime-dashboard');
        if (!this.container) return;

        this.container.innerHTML = sanitizeHTML(`
            <div class="realtime-metrics">
                <div class="metric-card">
                    <h3>👥 Usuarios Activos</h3>
                    <div class="metric-value" id="active-users">--</div>
                </div>
                <div class="metric-card">
                    <h3>📄 Páginas Vistas</h3>
                    <div class="metric-value" id="page-views">--</div>
                </div>
                <div class="metric-card">
                    <h3>⏱️ Sesión Promedio</h3>
                    <div class="metric-value" id="avg-session">--</div>
                </div>
                <div class="metric-card">
                    <h3>📊 Eventos/min</h3>
                    <div class="metric-value" id="events-per-minute">--</div>
                </div>
            </div>
            <div class="realtime-chart">
                <canvas id="realtime-chart"></canvas>
            </div>
            <div class="active-pages-list">
                <h4>📄 Páginas Más Visitadas</h4>
                <ul id="active-pages"></ul>
            </div>
        `);

        this.loadRealtimeData();
        this.initChart();
    }

    async loadRealtimeData() {
        try {
            const data = await this.analytics.getMetrics('realtime', '1h');
            this.updateMetrics(data);
        } catch (error) {
            console.error('Error cargando datos en tiempo real:', error);
        }
    }

    updateMetrics(data) {
        if (!data) return;

        document.getElementById('active-users').textContent = data.activeUsers || 0;
        document.getElementById('page-views').textContent = data.pageViews || 0;
        document.getElementById('avg-session').textContent = `${data.avgSessionDuration || 0}m`;
        document.getElementById('events-per-minute').textContent = data.eventsPerMinute || 0;

        this.updateActivePages(data.topPages || []);
    }

    updateActivePages(pages) {
        const list = document.getElementById('active-pages');
        if (!list) return;

        list.innerHTML = sanitizeHTML(pages.map(page => `
            <li>
                <span class="page-url">${page.url}</span>
                <span class="page-visitors">${page.visitors} usuarios</span>
            </li>
        `).join(''));
    }

    initChart() {
        // Implementar gráfico de tiempo real con Chart.js o similar
        // Por ahora, placeholder
        const canvas = document.getElementById('realtime-chart');
        if (canvas && window.Chart) {
            // Configurar Chart.js aquí
        }
    }

    update(data) {
        this.updateMetrics(data);
    }
}

class AcademicDashboard {
    constructor(analytics) {
        this.analytics = analytics;
    }

    render() {
        const container = document.getElementById('academic-dashboard');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="academic-overview">
                <h3>📚 Resumen Académico</h3>
                <!-- Academic metrics here -->
            </div>
        `);
    }
}

class EngagementDashboard {
    constructor(analytics) {
        this.analytics = analytics;
    }

    render() {
        const container = document.getElementById('engagement-dashboard');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="engagement-overview">
                <h3>👥 Análisis de Participación</h3>
                <!-- Engagement metrics here -->
            </div>
        `);
    }
}

class PerformanceDashboard {
    constructor(analytics) {
        this.analytics = analytics;
    }

    render() {
        const container = document.getElementById('performance-dashboard');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="performance-overview">
                <h3>⚡ Métricas de Rendimiento</h3>
                <!-- Performance metrics here -->
            </div>
        `);
    }
}

class AnalyticsReport {
    constructor(type, data) {
        this.type = type;
        this.data = data;
        this.generatedAt = new Date();
    }

    export(format = 'json') {
        switch (format) {
            case 'csv':
                return this.toCSV();
            case 'pdf':
                return this.toPDF();
            default:
                return JSON.stringify(this.data, null, 2);
        }
    }

    toCSV() {
        // Implementar conversión a CSV
        return 'CSV data here';
    }

    toPDF() {
        // Implementar conversión a PDF
        return 'PDF data here';
    }
}

// =====================================================
// INICIALIZACIÓN GLOBAL
// =====================================================

// Auto-inicializar el sistema cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    if (!window.bgeAnalytics) {
        window.bgeAnalytics = new BGEAdvancedAnalytics();

        // Hacer disponible globalmente para otras partes de la aplicación
        window.trackEvent = (type, data) => window.bgeAnalytics.track(type, data);

        console.log('🚀 [BGE-ANALYTICS] Sistema disponible globalmente');
    }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.bgeAnalytics) {
        window.bgeAnalytics.sendEvents(); // Enviar eventos pendientes
    }
});

export default BGEAdvancedAnalytics;