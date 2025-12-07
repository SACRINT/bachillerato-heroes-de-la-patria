/**
 * 📊 ANALYTICS SERVICE - TypeScript Version
 * Sistema Avanzado de Analíticas BGE
 * 
 * Maneja procesamiento de eventos, métricas, análisis predictivo y reportes
 * Refactorizado: 07 Diciembre 2025
 */

import { EventEmitter } from 'events';
const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface AnalyticsUser {
    id?: number;
    role?: string;
    email?: string;
}

export interface AnalyticsEvent {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: number;
    sessionId?: string;
    page?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface EnrichedEvent extends AnalyticsEvent {
    userId?: number;
    userRole?: string;
    userEmail?: string;
    enrichedAt: number;
    processed: boolean;
}

export interface ProcessResult {
    processed: string[];
    failed: Array<{ event: AnalyticsEvent; reason: string }>;
}

export interface MetricsOptions {
    timeframe?: string;
    granularity?: string;
    userId?: number;
    userRole?: string;
}

export interface RealtimeMetrics {
    activeUsers: number;
    pageViews: number;
    totalSessions: number;
    avgSessionDuration: number;
    eventsPerMinute: number;
    topPages: Array<{ url: string; visitors: number; uniqueVisitors: number }>;
}

export interface DashboardOptions {
    period?: string;
    userId?: number;
    userRole?: string;
}

export interface ReportOptions {
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
    userId?: number;
    userRole?: string;
}

export interface ABTestData {
    name: string;
    variants: string[];
    trafficSplit: Record<string, number>;
    targetMetric: string;
    createdBy: string;
}

export interface AnalyticsConfig {
    trackingEnabled: boolean;
    realtimeInterval: number;
    batchSize: number;
    retryAttempts: number;
    privacyMode: boolean;
    [key: string]: any;
}

// ============================================
// ANALYTICS SERVICE CLASS
// ============================================

class AnalyticsService extends EventEmitter {
    private eventBuffer: EnrichedEvent[];
    private processingLock: boolean;
    private batchSize: number;
    private flushInterval: number;

    constructor() {
        super();
        this.eventBuffer = [];
        this.processingLock = false;
        this.batchSize = 100;
        this.flushInterval = 5000;

        this.initializeBatchProcessing();
        devLogger.log('📊 [ANALYTICS-SERVICE] Servicio inicializado');
    }

    // =====================================================
    // PROCESAMIENTO DE EVENTOS
    // =====================================================

    async processEventBatch(events: AnalyticsEvent[], user: AnalyticsUser): Promise<ProcessResult> {
        const processed: string[] = [];
        const failed: Array<{ event: AnalyticsEvent; reason: string }> = [];

        devLogger.log(`📊 [ANALYTICS-SERVICE] Procesando lote de ${events.length} eventos`);

        for (const event of events) {
            try {
                if (!this.validateEvent(event)) {
                    failed.push({ event, reason: 'Invalid event structure' });
                    continue;
                }

                const enrichedEvent = this.enrichEvent(event, user);
                this.eventBuffer.push(enrichedEvent);
                processed.push(enrichedEvent.id);

                if (this.isCriticalEvent(event.type)) {
                    await this.processRealtimeEvent(enrichedEvent);
                }
            } catch (error: any) {
                devLogger.error(`❌ [ANALYTICS-SERVICE] Error procesando evento ${event.id}:`, error);
                failed.push({ event, reason: error.message });
            }
        }

        if (this.eventBuffer.length >= this.batchSize) {
            await this.flushEventBuffer();
        }

        return { processed, failed };
    }

    validateEvent(event: AnalyticsEvent): boolean {
        const required: (keyof AnalyticsEvent)[] = ['id', 'type', 'data', 'timestamp'];
        return required.every(field => event.hasOwnProperty(field));
    }

    enrichEvent(event: AnalyticsEvent, user: AnalyticsUser): EnrichedEvent {
        return {
            ...event,
            userId: user?.id,
            userRole: user?.role,
            userEmail: user?.email,
            enrichedAt: Date.now(),
            ipAddress: this.hashIP(event.ipAddress),
            userAgent: this.parseUserAgent(event.userAgent),
            processed: false
        };
    }

    isCriticalEvent(eventType: string): boolean {
        const criticalEvents = ['error', 'security_alert', 'system_failure', 'unauthorized_access'];
        return criticalEvents.includes(eventType);
    }

    async processRealtimeEvent(event: EnrichedEvent): Promise<void> {
        try {
            await executeQuery(`
                INSERT INTO analytics_events_realtime (
                    event_id, event_type, event_data, user_id, timestamp, priority
                ) VALUES ($1, $2, $3, $4, $5, 'high')
            `, [event.id, event.type, JSON.stringify(event.data), event.userId, event.timestamp]);

            this.emit('critical_event', event);
        } catch (error: any) {
            devLogger.error('❌ [ANALYTICS-SERVICE] Error en procesamiento tiempo real:', error);
        }
    }

    private initializeBatchProcessing(): void {
        setInterval(async () => {
            if (this.eventBuffer.length > 0 && !this.processingLock) {
                await this.flushEventBuffer();
            }
        }, this.flushInterval);
    }

    async flushEventBuffer(): Promise<void> {
        if (this.processingLock || this.eventBuffer.length === 0) return;

        this.processingLock = true;
        const eventsToProcess = [...this.eventBuffer];
        this.eventBuffer = [];

        try {
            devLogger.log(`🔄 [ANALYTICS-SERVICE] Procesando ${eventsToProcess.length} eventos en lote`);
            await this.insertEventsBatch(eventsToProcess);
            await this.updateAggregatedMetrics(eventsToProcess);
            await this.processAnalytics(eventsToProcess);
            devLogger.log(`✅ [ANALYTICS-SERVICE] Lote procesado exitosamente`);
        } catch (error: any) {
            devLogger.error('❌ [ANALYTICS-SERVICE] Error procesando lote:', error);
            this.eventBuffer.unshift(...eventsToProcess);
        } finally {
            this.processingLock = false;
        }
    }

    async insertEventsBatch(events: EnrichedEvent[]): Promise<void> {
        const values = events.map(event => [
            event.id,
            event.type,
            JSON.stringify(event.data),
            event.userId,
            event.userRole,
            event.sessionId,
            event.page || (event.data as any).page,
            event.timestamp,
            Date.now()
        ]);

        let paramIndex = 1;
        const placeholders = values.map(() => {
            const params = Array.from({ length: 9 }, () => `$${paramIndex++}`).join(', ');
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

    async getMetrics(category: string, options: MetricsOptions = {}): Promise<any> {
        const { timeframe = '24h', userRole, userId } = options;

        devLogger.log(`📈 [ANALYTICS-SERVICE] Obteniendo métricas: ${category} - ${timeframe}`);

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

    async getRealtimeMetrics(timeframe: string): Promise<RealtimeMetrics> {
        const timeCondition = this.getTimeCondition(timeframe);

        const [activeUsers, pageViews, sessionData, eventData, topPages] = await Promise.all([
            executeQuery(`SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE event_timestamp >= ${timeCondition} AND user_id IS NOT NULL`),
            executeQuery(`SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view' AND event_timestamp >= ${timeCondition}`),
            executeQuery(`SELECT COUNT(DISTINCT session_id) as total_sessions, AVG(session_duration) as avg_session_duration FROM (SELECT session_id, (MAX(event_timestamp) - MIN(event_timestamp)) / 1000 as session_duration FROM analytics_events WHERE event_timestamp >= ${timeCondition} AND session_id IS NOT NULL GROUP BY session_id HAVING COUNT(*) > 1) session_stats`),
            executeQuery(`SELECT COUNT(*) / (TIMESTAMPDIFF(MINUTE, MIN(FROM_UNIXTIME(event_timestamp/1000)), NOW()) + 1) as events_per_minute FROM analytics_events WHERE event_timestamp >= ${timeCondition}`),
            executeQuery(`SELECT page_url, COUNT(*) as visitors, COUNT(DISTINCT user_id) as unique_visitors FROM analytics_events WHERE event_type = 'page_view' AND event_timestamp >= ${timeCondition} AND page_url IS NOT NULL GROUP BY page_url ORDER BY visitors DESC LIMIT 10`)
        ]);

        return {
            activeUsers: activeUsers[0]?.count || 0,
            pageViews: pageViews[0]?.count || 0,
            totalSessions: sessionData[0]?.total_sessions || 0,
            avgSessionDuration: Math.round(sessionData[0]?.avg_session_duration || 0),
            eventsPerMinute: Math.round(eventData[0]?.events_per_minute || 0),
            topPages: topPages.map((page: any) => ({
                url: page.page_url,
                visitors: page.visitors,
                uniqueVisitors: page.unique_visitors
            }))
        };
    }

    async getAcademicMetrics(timeframe: string, userRole?: string): Promise<any> {
        const timeCondition = this.getTimeCondition(timeframe);
        const [courseActivity, assignmentActivity] = await Promise.all([
            executeQuery(`SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.courseId')) as course_id, COUNT(*) as interactions FROM analytics_events WHERE event_type = 'educational' AND event_timestamp >= ${timeCondition} GROUP BY course_id ORDER BY interactions DESC LIMIT 10`),
            executeQuery(`SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.assignmentId')) as assignment_id, COUNT(*) as submissions FROM analytics_events WHERE event_type = 'educational' AND event_timestamp >= ${timeCondition} GROUP BY assignment_id LIMIT 10`)
        ]);
        return { courseActivity, assignmentActivity };
    }

    async getEngagementMetrics(timeframe: string): Promise<any> {
        const timeCondition = this.getTimeCondition(timeframe);
        const [scrollDepth] = await Promise.all([
            executeQuery(`SELECT AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.scrollPercent')) AS UNSIGNED)) as avg_scroll_depth FROM analytics_events WHERE event_type = 'engagement' AND event_timestamp >= ${timeCondition}`)
        ]);
        return { avgScrollDepth: Math.round(scrollDepth[0]?.avg_scroll_depth || 0) };
    }

    async getPerformanceMetrics(timeframe: string): Promise<any> {
        const timeCondition = this.getTimeCondition(timeframe);
        const [errorRates] = await Promise.all([
            executeQuery(`SELECT COUNT(*) as total_errors FROM analytics_events WHERE event_type = 'error' AND event_timestamp >= ${timeCondition}`)
        ]);
        return { totalErrors: errorRates[0]?.total_errors || 0 };
    }

    async getUserBehaviorMetrics(timeframe: string, userId?: number): Promise<any> {
        return { userId, message: 'User behavior metrics' };
    }

    // =====================================================
    // DASHBOARDS Y REPORTES
    // =====================================================

    async getDashboardData(dashboardType: string, options: DashboardOptions = {}): Promise<any> {
        const { period = 'today' } = options;
        devLogger.log(`🎛️ [ANALYTICS-SERVICE] Cargando dashboard: ${dashboardType} - ${period}`);

        switch (dashboardType) {
            case 'realtime':
                return await this.getRealtimeDashboard(period);
            default:
                throw new Error(`Tipo de dashboard no válido: ${dashboardType}`);
        }
    }

    async getRealtimeDashboard(period: string): Promise<any> {
        const metrics = await this.getRealtimeMetrics('1h');
        return { ...metrics, lastUpdated: Date.now() };
    }

    async getRealtimeData(options: any = {}): Promise<any> {
        return await this.getRealtimeDashboard('live');
    }

    async generateReport(type: string, options: ReportOptions = {}): Promise<any> {
        devLogger.log(`📋 [ANALYTICS-SERVICE] Generando reporte: ${type}`);
        return { type, generatedAt: new Date().toISOString() };
    }

    // =====================================================
    // FUNCIONES DE ANÁLISIS AVANZADO
    // =====================================================

    async analyzeFunnel(funnelId: string, options: any = {}): Promise<any> {
        return { funnelId, steps: [], conversion: {} };
    }

    async analyzeCohorts(options: any = {}): Promise<any> {
        return { cohorts: [] };
    }

    async trackCustomEvent(eventData: any): Promise<{ eventId: string }> {
        const customEvent: EnrichedEvent = {
            id: this.generateEventId(),
            type: 'custom_event',
            data: eventData,
            timestamp: Date.now(),
            enrichedAt: Date.now(),
            processed: false
        };
        this.eventBuffer.push(customEvent);
        return { eventId: customEvent.id };
    }

    // =====================================================
    // PRUEBAS A/B
    // =====================================================

    async getABTests(options: any = {}): Promise<any[]> {
        return await executeQuery(`SELECT test_id, test_name, variants, status FROM ab_tests WHERE status IN ('active', 'completed') ORDER BY created_at DESC`);
    }

    async createABTest(testData: ABTestData): Promise<any> {
        const testId = this.generateTestId();
        await executeQuery(`INSERT INTO ab_tests (test_id, test_name, variants, traffic_split, target_metric, created_by, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())`,
            [testId, testData.name, JSON.stringify(testData.variants), JSON.stringify(testData.trafficSplit), testData.targetMetric, testData.createdBy]);
        return { testId, ...testData, status: 'active' };
    }

    // =====================================================
    // CONFIGURACIÓN Y ADMINISTRACIÓN
    // =====================================================

    async getConfiguration(userRole: string): Promise<AnalyticsConfig> {
        return {
            trackingEnabled: true,
            realtimeInterval: 5000,
            batchSize: 100,
            retryAttempts: 3,
            privacyMode: false
        };
    }

    async updateConfiguration(configUpdates: Partial<AnalyticsConfig>): Promise<any> {
        return { success: true, updated: configUpdates };
    }

    async exportData(options: any = {}): Promise<any> {
        return { format: options.format || 'json', data: [] };
    }

    async deleteUserData(userId: number): Promise<{ success: boolean }> {
        await executeQuery(`DELETE FROM analytics_events WHERE user_id = $1`, [userId]);
        return { success: true };
    }

    async healthCheck(): Promise<any> {
        return {
            status: 'healthy',
            bufferSize: this.eventBuffer.length,
            processingLock: this.processingLock,
            timestamp: Date.now()
        };
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private getTimeCondition(timeframe: string): number {
        const now = Date.now();
        const multipliers: Record<string, number> = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        return now - (multipliers[timeframe] || multipliers['24h']);
    }

    private hashIP(ip?: string): string {
        if (!ip) return 'unknown';
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
    }

    private parseUserAgent(userAgent?: string): string {
        if (!userAgent) return 'unknown';
        return userAgent.substring(0, 100);
    }

    private generateEventId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateSessionId(): string {
        return `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateTestId(): string {
        return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Stub methods for compatibility
    async updateAggregatedMetrics(events: EnrichedEvent[]): Promise<void> { }
    async processAnalytics(events: EnrichedEvent[]): Promise<void> { }
}

// ============================================
// EXPORTS
// ============================================

const analyticsService = new AnalyticsService();

export { AnalyticsService };
export default analyticsService;

module.exports = analyticsService;
module.exports.AnalyticsService = AnalyticsService;
