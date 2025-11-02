/**
 * ANALYTICS SERVICE - Servicio para Sistema Avanzado de Analíticas BGE
 *
 * Maneja procesamiento de eventos, métricas, análisis predictivo y reportes
 */

const { executeQuery } = require('../config/database');
const EventEmitter = require('events');

class AnalyticsService extends EventEmitter {
    constructor() {
        super();
        this.eventBuffer = [];
        this.processingLock = false;
        this.batchSize = 100;
        this.flushInterval = 5000; // 5 segundos

        // Inicializar procesamiento en lotes
        this.initializeBatchProcessing();

        console.log('📊 [ANALYTICS-SERVICE] Servicio inicializado');
    }

    // =====================================================
    // PROCESAMIENTO DE EVENTOS
    // =====================================================

    async processEventBatch(events, user) {
        const processed = [];
        const failed = [];

        console.log(`📊 [ANALYTICS-SERVICE] Procesando lote de ${events.length} eventos`);

        for (const event of events) {
            try {
                // Validar evento
                if (!this.validateEvent(event)) {
                    failed.push({ event, reason: 'Invalid event structure' });
                    continue;
                }

                // Enriquecer evento con datos del usuario
                const enrichedEvent = this.enrichEvent(event, user);

                // Almacenar en buffer para procesamiento batch
                this.eventBuffer.push(enrichedEvent);

                processed.push(enrichedEvent.id);

                // Procesamiento en tiempo real para eventos críticos
                if (this.isCriticalEvent(event.type)) {
                    await this.processRealtimeEvent(enrichedEvent);
                }

            } catch (error) {
                console.error(`❌ [ANALYTICS-SERVICE] Error procesando evento ${event.id}:`, error);
                failed.push({ event, reason: error.message });
            }
        }

        // Forzar flush si el buffer está lleno
        if (this.eventBuffer.length >= this.batchSize) {
            await this.flushEventBuffer();
        }

        return { processed, failed };
    }

    validateEvent(event) {
        const required = ['id', 'type', 'data', 'timestamp'];
        return required.every(field => event.hasOwnProperty(field));
    }

    enrichEvent(event, user) {
        return {
            ...event,
            userId: user?.id,
            userRole: user?.role,
            userEmail: user?.email,
            enrichedAt: Date.now(),
            ipAddress: this.hashIP(event.ipAddress), // Hash para privacidad
            userAgent: this.parseUserAgent(event.userAgent),
            processed: false
        };
    }

    isCriticalEvent(eventType) {
        const criticalEvents = ['error', 'security_alert', 'system_failure', 'unauthorized_access'];
        return criticalEvents.includes(eventType);
    }

    async processRealtimeEvent(event) {
        try {
            // Almacenar inmediatamente eventos críticos
            await executeQuery(`
                INSERT INTO analytics_events_realtime (
                    event_id, event_type, event_data, user_id, timestamp, priority
                ) VALUES ($1, $2, $3, $4, $5, 'high')
            `, [event.id, event.type, JSON.stringify(event.data), event.userId, event.timestamp]);

            // Emitir evento para notificaciones en tiempo real
            this.emit('critical_event', event);

        } catch (error) {
            console.error('❌ [ANALYTICS-SERVICE] Error en procesamiento tiempo real:', error);
        }
    }

    initializeBatchProcessing() {
        setInterval(async () => {
            if (this.eventBuffer.length > 0 && !this.processingLock) {
                await this.flushEventBuffer();
            }
        }, this.flushInterval);
    }

    async flushEventBuffer() {
        if (this.processingLock || this.eventBuffer.length === 0) return;

        this.processingLock = true;
        const eventsToProcess = [...this.eventBuffer];
        this.eventBuffer = [];

        try {
            console.log(`🔄 [ANALYTICS-SERVICE] Procesando ${eventsToProcess.length} eventos en lote`);

            // Insertar eventos en batch
            await this.insertEventsBatch(eventsToProcess);

            // Actualizar métricas agregadas
            await this.updateAggregatedMetrics(eventsToProcess);

            // Procesar análisis específicos
            await this.processAnalytics(eventsToProcess);

            console.log(`✅ [ANALYTICS-SERVICE] Lote procesado exitosamente`);

        } catch (error) {
            console.error('❌ [ANALYTICS-SERVICE] Error procesando lote:', error);
            // Reencolar eventos fallidos
            this.eventBuffer.unshift(...eventsToProcess);
        } finally {
            this.processingLock = false;
        }
    }

    async insertEventsBatch(events) {
        const values = events.map(event => [
            event.id,
            event.type,
            JSON.stringify(event.data),
            event.userId,
            event.userRole,
            event.sessionId,
            event.page || event.data.page,
            event.timestamp,
            Date.now()
        ]);

        let paramIndex = 1;
        const placeholders = values.map(() => {
            const params = Array.from({length: 9}, (_, i) => `$${paramIndex++}`).join(', ');
            return `(${params})`;
        }).join(',');

        await executeQuery(`
            INSERT INTO analytics_events (
                event_id, event_type, event_data, user_id, user_role,
                session_id, page_url, event_timestamp, processed_at
            ) VALUES ${placeholders}
        `, values.flat());
    }

    // =====================================================
    // MÉTRICAS Y ANÁLISIS
    // =====================================================

    async getMetrics(category, options = {}) {
        const { timeframe = '24h', granularity = 'hour', userId, userRole } = options;

        console.log(`📈 [ANALYTICS-SERVICE] Obteniendo métricas: ${category} - ${timeframe}`);

        switch (category) {
            case 'realtime':
                return await this.getRealtimeMetrics(timeframe);
            case 'academic':
                return await this.getAcademicMetrics(timeframe, userRole);
            case 'engagement':
                return await this.getEngagementMetrics(timeframe);
            case 'performance':
                return await this.getPerformanceMetrics(timeframe);
            case 'user_behavior':
                return await this.getUserBehaviorMetrics(timeframe, userId);
            default:
                throw new Error(`Categoría de métricas no válida: ${category}`);
        }
    }

    async getRealtimeMetrics(timeframe) {
        const timeCondition = this.getTimeCondition(timeframe);

        const [
            activeUsers,
            pageViews,
            sessionData,
            eventData,
            topPages
        ] = await Promise.all([
            // Usuarios activos
            executeQuery(`
                SELECT COUNT(DISTINCT user_id) as count
                FROM analytics_events
                WHERE event_timestamp >= ${timeCondition}
                AND user_id IS NOT NULL
            `),

            // Páginas vistas
            executeQuery(`
                SELECT COUNT(*) as count
                FROM analytics_events
                WHERE event_type = 'page_view'
                AND event_timestamp >= ${timeCondition}
            `),

            // Datos de sesión
            executeQuery(`
                SELECT
                    COUNT(DISTINCT session_id) as total_sessions,
                    AVG(session_duration) as avg_session_duration
                FROM (
                    SELECT
                        session_id,
                        (MAX(event_timestamp) - MIN(event_timestamp)) / 1000 as session_duration
                    FROM analytics_events
                    WHERE event_timestamp >= ${timeCondition}
                    AND session_id IS NOT NULL
                    GROUP BY session_id
                    HAVING COUNT(*) > 1
                ) session_stats
            `),

            // Eventos por minuto
            executeQuery(`
                SELECT
                    COUNT(*) / (TIMESTAMPDIFF(MINUTE, MIN(FROM_UNIXTIME(event_timestamp/1000)), NOW()) + 1) as events_per_minute
                FROM analytics_events
                WHERE event_timestamp >= ${timeCondition}
            `),

            // Páginas más visitadas
            executeQuery(`
                SELECT
                    page_url,
                    COUNT(*) as visitors,
                    COUNT(DISTINCT user_id) as unique_visitors
                FROM analytics_events
                WHERE event_type = 'page_view'
                AND event_timestamp >= ${timeCondition}
                AND page_url IS NOT NULL
                GROUP BY page_url
                ORDER BY visitors DESC
                LIMIT 10
            `)
        ]);

        return {
            activeUsers: activeUsers[0]?.count || 0,
            pageViews: pageViews[0]?.count || 0,
            totalSessions: sessionData[0]?.total_sessions || 0,
            avgSessionDuration: Math.round(sessionData[0]?.avg_session_duration || 0),
            eventsPerMinute: Math.round(eventData[0]?.events_per_minute || 0),
            topPages: topPages.map(page => ({
                url: page.page_url,
                visitors: page.visitors,
                uniqueVisitors: page.unique_visitors
            }))
        };
    }

    async getAcademicMetrics(timeframe, userRole) {
        const timeCondition = this.getTimeCondition(timeframe);

        // Métricas específicas educativas
        const [
            courseActivity,
            assignmentActivity,
            gradeDistribution,
            studentEngagement
        ] = await Promise.all([
            // Actividad en cursos
            executeQuery(`
                SELECT
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.courseId')) as course_id,
                    COUNT(*) as interactions,
                    COUNT(DISTINCT user_id) as unique_students
                FROM analytics_events
                WHERE event_type = 'educational'
                AND event_timestamp >= ${timeCondition}
                AND JSON_EXTRACT(event_data, '$.courseId') IS NOT NULL
                GROUP BY course_id
                ORDER BY interactions DESC
                LIMIT 10
            `),

            // Actividad en tareas
            executeQuery(`
                SELECT
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.assignmentId')) as assignment_id,
                    COUNT(*) as submissions,
                    COUNT(DISTINCT user_id) as unique_students
                FROM analytics_events
                WHERE event_type = 'educational'
                AND JSON_EXTRACT(event_data, '$.action') = 'assignment_completed'
                AND event_timestamp >= ${timeCondition}
                GROUP BY assignment_id
                ORDER BY submissions DESC
                LIMIT 10
            `),

            // Distribución de calificaciones (mock data por ahora)
            executeQuery(`
                SELECT
                    'A' as grade, 25 as count UNION ALL
                SELECT 'B' as grade, 35 as count UNION ALL
                SELECT 'C' as grade, 28 as count UNION ALL
                SELECT 'D' as grade, 12 as count
            `),

            // Engagement de estudiantes
            executeQuery(`
                SELECT
                    user_id,
                    COUNT(*) as total_events,
                    COUNT(DISTINCT DATE(FROM_UNIXTIME(event_timestamp/1000))) as active_days
                FROM analytics_events
                WHERE event_type IN ('educational', 'user_action')
                AND event_timestamp >= ${timeCondition}
                AND user_id IS NOT NULL
                GROUP BY user_id
                ORDER BY total_events DESC
                LIMIT 20
            `)
        ]);

        return {
            courseActivity,
            assignmentActivity,
            gradeDistribution,
            topStudents: studentEngagement.slice(0, 10),
            totalEducationalEvents: courseActivity.reduce((sum, course) => sum + course.interactions, 0)
        };
    }

    async getEngagementMetrics(timeframe) {
        const timeCondition = this.getTimeCondition(timeframe);

        const [
            scrollDepth,
            clickHeatmap,
            sessionQuality,
            contentInteraction
        ] = await Promise.all([
            // Profundidad de scroll
            executeQuery(`
                SELECT
                    AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.scrollPercent')) AS UNSIGNED)) as avg_scroll_depth,
                    COUNT(*) as scroll_events
                FROM analytics_events
                WHERE event_type = 'engagement'
                AND JSON_EXTRACT(event_data, '$.action') = 'scroll'
                AND event_timestamp >= ${timeCondition}
            `),

            // Mapa de calor de clicks
            executeQuery(`
                SELECT
                    page_url,
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.element')) as element,
                    COUNT(*) as click_count
                FROM analytics_events
                WHERE event_type = 'user_action'
                AND JSON_EXTRACT(event_data, '$.action') = 'click'
                AND event_timestamp >= ${timeCondition}
                GROUP BY page_url, element
                ORDER BY click_count DESC
                LIMIT 20
            `),

            // Calidad de sesiones
            executeQuery(`
                SELECT
                    AVG(events_per_session) as avg_events_per_session,
                    AVG(session_duration) as avg_session_duration_seconds
                FROM (
                    SELECT
                        session_id,
                        COUNT(*) as events_per_session,
                        (MAX(event_timestamp) - MIN(event_timestamp)) / 1000 as session_duration
                    FROM analytics_events
                    WHERE event_timestamp >= ${timeCondition}
                    AND session_id IS NOT NULL
                    GROUP BY session_id
                ) session_stats
            `),

            // Interacción con contenido
            executeQuery(`
                SELECT
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.action')) as action_type,
                    COUNT(*) as action_count
                FROM analytics_events
                WHERE event_type IN ('user_action', 'engagement')
                AND event_timestamp >= ${timeCondition}
                GROUP BY action_type
                ORDER BY action_count DESC
            `)
        ]);

        return {
            avgScrollDepth: Math.round(scrollDepth[0]?.avg_scroll_depth || 0),
            scrollEvents: scrollDepth[0]?.scroll_events || 0,
            clickHeatmap,
            sessionQuality: {
                avgEventsPerSession: Math.round(sessionQuality[0]?.avg_events_per_session || 0),
                avgDurationMinutes: Math.round((sessionQuality[0]?.avg_session_duration_seconds || 0) / 60)
            },
            contentInteractions: contentInteraction
        };
    }

    async getPerformanceMetrics(timeframe) {
        const timeCondition = this.getTimeCondition(timeframe);

        const [
            pageLoadTimes,
            errorRates,
            resourceMetrics,
            memoryUsage
        ] = await Promise.all([
            // Tiempos de carga
            executeQuery(`
                SELECT
                    page_url,
                    AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.loadTime')) AS UNSIGNED)) as avg_load_time,
                    COUNT(*) as page_loads
                FROM analytics_events
                WHERE event_type = 'performance'
                AND JSON_EXTRACT(event_data, '$.loadTime') IS NOT NULL
                AND event_timestamp >= ${timeCondition}
                GROUP BY page_url
                ORDER BY page_loads DESC
                LIMIT 10
            `),

            // Tasas de error
            executeQuery(`
                SELECT
                    COUNT(*) as total_errors,
                    COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type')) = 'javascript_error' THEN 1 END) as js_errors,
                    COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type')) = 'network_error' THEN 1 END) as network_errors
                FROM analytics_events
                WHERE event_type = 'error'
                AND event_timestamp >= ${timeCondition}
            `),

            // Métricas de recursos
            executeQuery(`
                SELECT
                    AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.resourceCount')) AS UNSIGNED)) as avg_resources,
                    AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.domContentLoaded')) AS UNSIGNED)) as avg_dom_ready
                FROM analytics_events
                WHERE event_type = 'performance'
                AND JSON_EXTRACT(event_data, '$.resourceCount') IS NOT NULL
                AND event_timestamp >= ${timeCondition}
            `),

            // Uso de memoria
            executeQuery(`
                SELECT
                    AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.memoryUsed')) AS UNSIGNED)) as avg_memory_used,
                    MAX(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.memoryUsed')) AS UNSIGNED)) as max_memory_used
                FROM analytics_events
                WHERE event_type = 'performance'
                AND JSON_EXTRACT(event_data, '$.memoryUsed') IS NOT NULL
                AND event_timestamp >= ${timeCondition}
            `)
        ]);

        return {
            pageLoadTimes,
            errorSummary: errorRates[0] || { total_errors: 0, js_errors: 0, network_errors: 0 },
            resourceMetrics: resourceMetrics[0] || { avg_resources: 0, avg_dom_ready: 0 },
            memoryUsage: memoryUsage[0] || { avg_memory_used: 0, max_memory_used: 0 }
        };
    }

    async getUserBehaviorMetrics(timeframe, userId) {
        const timeCondition = this.getTimeCondition(timeframe);
        const userCondition = userId ? `AND user_id = '${userId}'` : '';

        const [
            userJourney,
            deviceInfo,
            timePatterns,
            featureUsage
        ] = await Promise.all([
            // Flujo de navegación del usuario
            executeQuery(`
                SELECT
                    page_url,
                    COUNT(*) as visits,
                    AVG(TIMESTAMPDIFF(SECOND,
                        LAG(FROM_UNIXTIME(event_timestamp/1000)) OVER (PARTITION BY session_id ORDER BY event_timestamp),
                        FROM_UNIXTIME(event_timestamp/1000)
                    )) as avg_time_on_page
                FROM analytics_events
                WHERE event_type = 'page_view'
                AND event_timestamp >= ${timeCondition}
                ${userCondition}
                GROUP BY page_url
                ORDER BY visits DESC
                LIMIT 15
            `),

            // Información de dispositivos
            executeQuery(`
                SELECT
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.viewport.width')) as screen_width,
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.viewport.height')) as screen_height,
                    COUNT(*) as usage_count
                FROM analytics_events
                WHERE event_type = 'page_view'
                AND event_timestamp >= ${timeCondition}
                ${userCondition}
                AND JSON_EXTRACT(event_data, '$.viewport') IS NOT NULL
                GROUP BY screen_width, screen_height
                ORDER BY usage_count DESC
                LIMIT 10
            `),

            // Patrones temporales
            executeQuery(`
                SELECT
                    HOUR(FROM_UNIXTIME(event_timestamp/1000)) as hour_of_day,
                    COUNT(*) as event_count,
                    COUNT(DISTINCT user_id) as unique_users
                FROM analytics_events
                WHERE event_timestamp >= ${timeCondition}
                ${userCondition}
                GROUP BY hour_of_day
                ORDER BY hour_of_day
            `),

            // Uso de características
            executeQuery(`
                SELECT
                    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.element.tag')) as element_type,
                    COUNT(*) as interaction_count
                FROM analytics_events
                WHERE event_type = 'user_action'
                AND JSON_EXTRACT(event_data, '$.action') = 'click'
                AND event_timestamp >= ${timeCondition}
                ${userCondition}
                GROUP BY element_type
                ORDER BY interaction_count DESC
                LIMIT 10
            `)
        ]);

        return {
            userJourney,
            popularDevices: deviceInfo,
            timePatterns,
            featureUsage
        };
    }

    // =====================================================
    // DASHBOARDS Y REPORTES
    // =====================================================

    async getDashboardData(dashboardType, options = {}) {
        const { period = 'today', userId, userRole } = options;

        console.log(`🎛️ [ANALYTICS-SERVICE] Cargando dashboard: ${dashboardType} - ${period}`);

        switch (dashboardType) {
            case 'realtime':
                return await this.getRealtimeDashboard(period);
            case 'academic':
                return await this.getAcademicDashboard(period, userRole);
            case 'engagement':
                return await this.getEngagementDashboard(period);
            case 'performance':
                return await this.getPerformanceDashboard(period);
            default:
                throw new Error(`Tipo de dashboard no válido: ${dashboardType}`);
        }
    }

    async getRealtimeDashboard(period) {
        const metrics = await this.getRealtimeMetrics('1h');

        // Datos adicionales específicos para dashboard en tiempo real
        const liveData = await executeQuery(`
            SELECT
                COUNT(*) as events_last_minute,
                COUNT(DISTINCT user_id) as users_last_minute
            FROM analytics_events
            WHERE event_timestamp >= ${Date.now() - 60000}
        `);

        return {
            ...metrics,
            live: liveData[0] || { events_last_minute: 0, users_last_minute: 0 },
            lastUpdated: Date.now()
        };
    }

    async getRealtimeData(options = {}) {
        return await this.getRealtimeDashboard('live');
    }

    async generateReport(type, options = {}) {
        const { dateRange, filters, userId, userRole } = options;

        console.log(`📋 [ANALYTICS-SERVICE] Generando reporte: ${type}`);

        switch (type) {
            case 'executive_summary':
                return await this.generateExecutiveSummary(dateRange, filters);
            case 'user_behavior':
                return await this.generateUserBehaviorReport(dateRange, filters);
            case 'academic_performance':
                return await this.generateAcademicReport(dateRange, filters);
            case 'technical_performance':
                return await this.generateTechnicalReport(dateRange, filters);
            default:
                throw new Error(`Tipo de reporte no válido: ${type}`);
        }
    }

    // =====================================================
    // FUNCIONES DE ANÁLISIS AVANZADO
    // =====================================================

    async analyzeFunnel(funnelId, options = {}) {
        const { timeframe } = options;

        // Análisis de embudo básico
        const funnelSteps = await executeQuery(`
            SELECT
                funnel_step,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(*) as total_events
            FROM analytics_events
            WHERE JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.funnelId')) = $1
            AND event_timestamp >= ${this.getTimeCondition(timeframe)}
            GROUP BY funnel_step
            ORDER BY funnel_step
        `, [funnelId]);

        // Calcular tasas de conversión
        const conversion = this.calculateConversionRates(funnelSteps);

        return {
            funnelId,
            steps: funnelSteps,
            conversion,
            dropOffPoints: this.identifyDropOffPoints(funnelSteps)
        };
    }

    async analyzeCohorts(options = {}) {
        const { metric = 'retention', period = 'weekly' } = options;

        // Análisis de cohortes básico
        const cohortData = await executeQuery(`
            SELECT
                DATE_FORMAT(first_event, '%Y-%m') as cohort_month,
                TIMESTAMPDIFF(DAY, first_event, event_date) as day_number,
                COUNT(DISTINCT user_id) as active_users
            FROM (
                SELECT
                    user_id,
                    DATE(FROM_UNIXTIME(MIN(event_timestamp)/1000)) as first_event,
                    DATE(FROM_UNIXTIME(event_timestamp/1000)) as event_date
                FROM analytics_events
                WHERE user_id IS NOT NULL
                GROUP BY user_id, DATE(FROM_UNIXTIME(event_timestamp/1000))
            ) user_activity
            GROUP BY cohort_month, day_number
            ORDER BY cohort_month, day_number
        `);

        return this.formatCohortAnalysis(cohortData);
    }

    async trackCustomEvent(eventData) {
        const { eventName, properties, userId, triggeredBy, timestamp } = eventData;

        const customEvent = {
            id: this.generateEventId(),
            type: 'custom_event',
            data: {
                eventName,
                properties,
                triggeredBy
            },
            userId,
            timestamp,
            sessionId: this.generateSessionId(),
            processed: false
        };

        // Agregar al buffer para procesamiento
        this.eventBuffer.push(customEvent);

        return { eventId: customEvent.id };
    }

    // =====================================================
    // PRUEBAS A/B
    // =====================================================

    async getABTests(options = {}) {
        const { userId, userRole } = options;

        const abTests = await executeQuery(`
            SELECT
                test_id,
                test_name,
                variants,
                status,
                created_at,
                target_metric
            FROM ab_tests
            WHERE status IN ('active', 'completed')
            ORDER BY created_at DESC
        `);

        return abTests;
    }

    async createABTest(testData) {
        const { name, variants, trafficSplit, targetMetric, createdBy } = testData;

        const testId = this.generateTestId();

        await executeQuery(`
            INSERT INTO ab_tests (
                test_id, test_name, variants, traffic_split,
                target_metric, created_by, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
        `, [
            testId,
            name,
            JSON.stringify(variants),
            JSON.stringify(trafficSplit),
            targetMetric,
            createdBy
        ]);

        return { testId, ...testData, status: 'active' };
    }

    // =====================================================
    // CONFIGURACIÓN Y ADMINISTRACIÓN
    // =====================================================

    async getConfiguration(userRole) {
        // Configuración base
        const baseConfig = {
            trackingEnabled: true,
            realtimeInterval: 5000,
            batchSize: 100,
            retryAttempts: 3,
            privacyMode: false
        };

        // Configuraciones adicionales para admins
        if (userRole === 'admin') {
            const dbConfig = await executeQuery(`
                SELECT config_key, config_value
                FROM analytics_config
                WHERE active = TRUE
            `);

            const customConfig = {};
            dbConfig.forEach(({ config_key, config_value }) => {
                customConfig[config_key] = JSON.parse(config_value);
            });

            return { ...baseConfig, ...customConfig };
        }

        return baseConfig;
    }

    async updateConfiguration(configUpdates) {
        const allowedConfigs = [
            'trackingEnabled', 'realtimeInterval',
            'privacyMode', 'batchSize'
        ];

        for (const [key, value] of Object.entries(configUpdates)) {
            if (allowedConfigs.includes(key)) {
                await executeQuery(`
                    INSERT INTO analytics_config (config_key, config_value, updated_at)
                    VALUES ($1, $2, NOW())
                    ON CONFLICT (config_key) DO UPDATE SET
                    config_value = $3, updated_at = NOW()
                `, [key, JSON.stringify(value), JSON.stringify(value)]);
            }
        }

        return await this.getConfiguration('admin');
    }

    async exportData(options = {}) {
        const { format, dateRange, includeFields, userId, userRole } = options;

        console.log(`💾 [ANALYTICS-SERVICE] Exportando datos: ${format}`);

        const timeCondition = dateRange?.start ?
            `event_timestamp >= ${new Date(dateRange.start).getTime()} AND event_timestamp <= ${new Date(dateRange.end).getTime()}` :
            `event_timestamp >= ${Date.now() - (7 * 24 * 60 * 60 * 1000)}`; // Última semana por defecto

        const fieldsToSelect = includeFields?.join(', ') || '*';

        const data = await executeQuery(`
            SELECT ${fieldsToSelect}
            FROM analytics_events
            WHERE ${timeCondition}
            ORDER BY event_timestamp DESC
            LIMIT 10000
        `);

        switch (format) {
            case 'csv':
                return this.convertToCSV(data);
            case 'xlsx':
                return this.convertToExcel(data);
            default:
                return data;
        }
    }

    async deleteUserData(userId) {
        console.log(`🗑️ [ANALYTICS-SERVICE] Eliminando datos de usuario: ${userId}`);

        const result = await executeQuery(`
            DELETE FROM analytics_events
            WHERE user_id = $1
        `, [userId]);

        return { deletedCount: result.affectedRows };
    }

    async healthCheck() {
        try {
            // Verificar conexión a base de datos
            await executeQuery('SELECT 1');

            // Verificar estado del buffer
            const bufferStatus = {
                bufferSize: this.eventBuffer.length,
                maxBufferSize: this.batchSize,
                isProcessing: this.processingLock
            };

            // Verificar eventos recientes
            const recentEvents = await executeQuery(`
                SELECT COUNT(*) as count
                FROM analytics_events
                WHERE processed_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            `);

            return {
                healthy: true,
                database: 'connected',
                buffer: bufferStatus,
                recentActivity: recentEvents[0]?.count || 0,
                timestamp: Date.now()
            };

        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // =====================================================
    // UTILIDADES Y HELPERS
    // =====================================================

    getTimeCondition(timeframe) {
        const now = Date.now();
        const timeframes = {
            '1h': now - (60 * 60 * 1000),
            '24h': now - (24 * 60 * 60 * 1000),
            '7d': now - (7 * 24 * 60 * 60 * 1000),
            '30d': now - (30 * 24 * 60 * 60 * 1000),
            '90d': now - (90 * 24 * 60 * 60 * 1000)
        };

        return timeframes[timeframe] || timeframes['24h'];
    }

    hashIP(ip) {
        if (!ip) return null;
        // Hash simple para anonimizar IPs
        return require('crypto').createHash('md5').update(ip).digest('hex').substring(0, 8);
    }

    parseUserAgent(userAgent) {
        if (!userAgent) return {};

        // Parser básico de user agent
        const mobile = /Mobile|Android|iPhone/.test(userAgent);
        const browser = userAgent.includes('Chrome') ? 'Chrome' :
                       userAgent.includes('Firefox') ? 'Firefox' :
                       userAgent.includes('Safari') ? 'Safari' : 'Other';

        return { mobile, browser };
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTestId() {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    calculateConversionRates(funnelSteps) {
        const rates = [];
        for (let i = 1; i < funnelSteps.length; i++) {
            const previousStep = funnelSteps[i - 1];
            const currentStep = funnelSteps[i];
            const rate = (currentStep.unique_users / previousStep.unique_users) * 100;
            rates.push({
                fromStep: previousStep.funnel_step,
                toStep: currentStep.funnel_step,
                conversionRate: Math.round(rate * 100) / 100
            });
        }
        return rates;
    }

    identifyDropOffPoints(funnelSteps) {
        const dropOffs = [];
        for (let i = 1; i < funnelSteps.length; i++) {
            const previousStep = funnelSteps[i - 1];
            const currentStep = funnelSteps[i];
            const dropOff = previousStep.unique_users - currentStep.unique_users;
            const dropOffRate = (dropOff / previousStep.unique_users) * 100;

            if (dropOffRate > 20) { // Más del 20% de abandono
                dropOffs.push({
                    step: previousStep.funnel_step,
                    dropOffCount: dropOff,
                    dropOffRate: Math.round(dropOffRate * 100) / 100
                });
            }
        }
        return dropOffs;
    }

    formatCohortAnalysis(cohortData) {
        // Formatear datos de cohorte para visualización
        const cohorts = {};

        cohortData.forEach(row => {
            if (!cohorts[row.cohort_month]) {
                cohorts[row.cohort_month] = {};
            }
            cohorts[row.cohort_month][row.day_number] = row.active_users;
        });

        return cohorts;
    }

    convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header =>
                JSON.stringify(row[header] || '')
            ).join(','))
        ].join('\n');

        return csvContent;
    }

    convertToExcel(data) {
        // Placeholder para conversión a Excel
        // Requeriría librería como xlsx
        return { message: 'Excel export not implemented yet', data };
    }

    async updateAggregatedMetrics(events) {
        // Actualizar métricas agregadas en tiempo real
        const pageViews = events.filter(e => e.type === 'page_view').length;
        const userActions = events.filter(e => e.type === 'user_action').length;

        if (pageViews > 0 || userActions > 0) {
            await executeQuery(`
                INSERT INTO analytics_metrics_hourly (
                    hour_timestamp, page_views, user_actions, updated_at
                ) VALUES (
                    DATE_TRUNC('hour', NOW()), $1, $2, NOW()
                ) ON CONFLICT (hour_timestamp) DO UPDATE SET
                page_views = analytics_metrics_hourly.page_views + $3,
                user_actions = analytics_metrics_hourly.user_actions + $4,
                updated_at = NOW()
            `, [pageViews, userActions, pageViews, userActions]);
        }
    }

    async processAnalytics(events) {
        // Procesar análisis específicos en batch
        const educationalEvents = events.filter(e => e.type === 'educational');
        const errorEvents = events.filter(e => e.type === 'error');

        if (educationalEvents.length > 0) {
            await this.processEducationalAnalytics(educationalEvents);
        }

        if (errorEvents.length > 0) {
            await this.processErrorAnalytics(errorEvents);
        }
    }

    async processEducationalAnalytics(events) {
        // Análisis específico de eventos educativos
        const courseEngagement = {};

        events.forEach(event => {
            const courseId = event.data.courseId;
            if (courseId) {
                courseEngagement[courseId] = (courseEngagement[courseId] || 0) + 1;
            }
        });

        // Actualizar métricas de engagement por curso
        for (const [courseId, count] of Object.entries(courseEngagement)) {
            await executeQuery(`
                INSERT INTO course_engagement_metrics (
                    course_id, event_count, last_updated
                ) VALUES ($1, $2, NOW())
                ON CONFLICT (course_id) DO UPDATE SET
                event_count = course_engagement_metrics.event_count + $3,
                last_updated = NOW()
            `, [courseId, count, count]);
        }
    }

    async processErrorAnalytics(events) {
        // Análisis de errores para alertas
        const criticalErrors = events.filter(e =>
            e.data.type === 'javascript_error' &&
            e.data.message.includes('critical')
        );

        if (criticalErrors.length > 5) {
            // Emitir alerta de errores críticos
            this.emit('critical_errors_threshold', {
                count: criticalErrors.length,
                timeframe: '5min',
                errors: criticalErrors
            });
        }
    }
}

module.exports = new AnalyticsService();