/**
 * 📊 ANALYTICS SERVICE - TypeScript Version
 * Sistema Avanzado de Analíticas BGE
 *
 * Maneja procesamiento de eventos, métricas, análisis predictivo y reportes
 * Refactorizado: 07 Diciembre 2025
 */
import { EventEmitter } from 'events';
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
    failed: Array<{
        event: AnalyticsEvent;
        reason: string;
    }>;
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
    topPages: Array<{
        url: string;
        visitors: number;
        uniqueVisitors: number;
    }>;
}
export interface DashboardOptions {
    period?: string;
    userId?: number;
    userRole?: string;
}
export interface ReportOptions {
    dateRange?: {
        start: Date;
        end: Date;
    };
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
declare class AnalyticsService extends EventEmitter {
    private eventBuffer;
    private processingLock;
    private batchSize;
    private flushInterval;
    constructor();
    processEventBatch(events: AnalyticsEvent[], user: AnalyticsUser): Promise<ProcessResult>;
    validateEvent(event: AnalyticsEvent): boolean;
    enrichEvent(event: AnalyticsEvent, user: AnalyticsUser): EnrichedEvent;
    isCriticalEvent(eventType: string): boolean;
    processRealtimeEvent(event: EnrichedEvent): Promise<void>;
    private initializeBatchProcessing;
    flushEventBuffer(): Promise<void>;
    insertEventsBatch(events: EnrichedEvent[]): Promise<void>;
    getMetrics(category: string, options?: MetricsOptions): Promise<any>;
    getRealtimeMetrics(timeframe: string): Promise<RealtimeMetrics>;
    getAcademicMetrics(timeframe: string, userRole?: string): Promise<any>;
    getEngagementMetrics(timeframe: string): Promise<any>;
    getPerformanceMetrics(timeframe: string): Promise<any>;
    getUserBehaviorMetrics(timeframe: string, userId?: number): Promise<any>;
    getDashboardData(dashboardType: string, options?: DashboardOptions): Promise<any>;
    getRealtimeDashboard(period: string): Promise<any>;
    getRealtimeData(options?: any): Promise<any>;
    generateReport(type: string, options?: ReportOptions): Promise<any>;
    analyzeFunnel(funnelId: string, options?: any): Promise<any>;
    analyzeCohorts(options?: any): Promise<any>;
    trackCustomEvent(eventData: any): Promise<{
        eventId: string;
    }>;
    getABTests(options?: any): Promise<any[]>;
    createABTest(testData: ABTestData): Promise<any>;
    getConfiguration(userRole: string): Promise<AnalyticsConfig>;
    updateConfiguration(configUpdates: Partial<AnalyticsConfig>): Promise<any>;
    exportData(options?: any): Promise<any>;
    deleteUserData(userId: number): Promise<{
        success: boolean;
    }>;
    healthCheck(): Promise<any>;
    private getTimeCondition;
    private hashIP;
    private parseUserAgent;
    private generateEventId;
    private generateSessionId;
    private generateTestId;
    updateAggregatedMetrics(events: EnrichedEvent[]): Promise<void>;
    processAnalytics(events: EnrichedEvent[]): Promise<void>;
}
declare const analyticsService: AnalyticsService;
export { AnalyticsService };
export default analyticsService;
//# sourceMappingURL=analytics.service.d.ts.map