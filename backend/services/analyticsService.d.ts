declare const _exports: AnalyticsService;
export = _exports;
declare class AnalyticsService extends EventEmitter<[never]> {
    constructor();
    eventBuffer: any[];
    processingLock: boolean;
    batchSize: number;
    flushInterval: number;
    processEventBatch(events: any, user: any): Promise<{
        processed: any[];
        failed: {
            event: any;
            reason: any;
        }[];
    }>;
    validateEvent(event: any): boolean;
    enrichEvent(event: any, user: any): any;
    isCriticalEvent(eventType: any): boolean;
    processRealtimeEvent(event: any): Promise<void>;
    initializeBatchProcessing(): void;
    flushEventBuffer(): Promise<void>;
    insertEventsBatch(events: any): Promise<void>;
    getMetrics(category: any, options?: {}): Promise<{
        activeUsers: any;
        pageViews: any;
        totalSessions: any;
        avgSessionDuration: number;
        eventsPerMinute: number;
        topPages: {
            url: any;
            visitors: any;
            uniqueVisitors: any;
        }[];
    } | {
        courseActivity: any[];
        assignmentActivity: any[];
        gradeDistribution: any[];
        topStudents: any[];
        totalEducationalEvents: any;
    } | {
        avgScrollDepth: number;
        scrollEvents: any;
        clickHeatmap: any[];
        sessionQuality: {
            avgEventsPerSession: number;
            avgDurationMinutes: number;
        };
        contentInteractions: any[];
    } | {
        pageLoadTimes: any[];
        errorSummary: any;
        resourceMetrics: any;
        memoryUsage: any;
    } | {
        userJourney: any[];
        popularDevices: any[];
        timePatterns: any[];
        featureUsage: any[];
    }>;
    getRealtimeMetrics(timeframe: any): Promise<{
        activeUsers: any;
        pageViews: any;
        totalSessions: any;
        avgSessionDuration: number;
        eventsPerMinute: number;
        topPages: {
            url: any;
            visitors: any;
            uniqueVisitors: any;
        }[];
    }>;
    getAcademicMetrics(timeframe: any, userRole: any): Promise<{
        courseActivity: any[];
        assignmentActivity: any[];
        gradeDistribution: any[];
        topStudents: any[];
        totalEducationalEvents: any;
    }>;
    getEngagementMetrics(timeframe: any): Promise<{
        avgScrollDepth: number;
        scrollEvents: any;
        clickHeatmap: any[];
        sessionQuality: {
            avgEventsPerSession: number;
            avgDurationMinutes: number;
        };
        contentInteractions: any[];
    }>;
    getPerformanceMetrics(timeframe: any): Promise<{
        pageLoadTimes: any[];
        errorSummary: any;
        resourceMetrics: any;
        memoryUsage: any;
    }>;
    getUserBehaviorMetrics(timeframe: any, userId: any): Promise<{
        userJourney: any[];
        popularDevices: any[];
        timePatterns: any[];
        featureUsage: any[];
    }>;
    getDashboardData(dashboardType: any, options?: {}): Promise<any>;
    getRealtimeDashboard(period: any): Promise<{
        live: any;
        lastUpdated: number;
        activeUsers: any;
        pageViews: any;
        totalSessions: any;
        avgSessionDuration: number;
        eventsPerMinute: number;
        topPages: {
            url: any;
            visitors: any;
            uniqueVisitors: any;
        }[];
    }>;
    getRealtimeData(options?: {}): Promise<{
        live: any;
        lastUpdated: number;
        activeUsers: any;
        pageViews: any;
        totalSessions: any;
        avgSessionDuration: number;
        eventsPerMinute: number;
        topPages: {
            url: any;
            visitors: any;
            uniqueVisitors: any;
        }[];
    }>;
    generateReport(type: any, options?: {}): Promise<any>;
    analyzeFunnel(funnelId: any, options?: {}): Promise<{
        funnelId: any;
        steps: any[];
        conversion: {
            fromStep: any;
            toStep: any;
            conversionRate: number;
        }[];
        dropOffPoints: {
            step: any;
            dropOffCount: number;
            dropOffRate: number;
        }[];
    }>;
    analyzeCohorts(options?: {}): Promise<{}>;
    trackCustomEvent(eventData: any): Promise<{
        eventId: string;
    }>;
    getABTests(options?: {}): Promise<any[]>;
    createABTest(testData: any): Promise<any>;
    getConfiguration(userRole: any): Promise<{
        trackingEnabled: boolean;
        realtimeInterval: number;
        batchSize: number;
        retryAttempts: number;
        privacyMode: boolean;
    }>;
    updateConfiguration(configUpdates: any): Promise<{
        trackingEnabled: boolean;
        realtimeInterval: number;
        batchSize: number;
        retryAttempts: number;
        privacyMode: boolean;
    }>;
    exportData(options?: {}): Promise<string | any[] | {
        message: string;
        data: any;
    }>;
    deleteUserData(userId: any): Promise<{
        deletedCount: any;
    }>;
    healthCheck(): Promise<{
        healthy: boolean;
        database: string;
        buffer: {
            bufferSize: number;
            maxBufferSize: number;
            isProcessing: boolean;
        };
        recentActivity: any;
        timestamp: number;
        error?: undefined;
    } | {
        healthy: boolean;
        error: any;
        timestamp: number;
        database?: undefined;
        buffer?: undefined;
        recentActivity?: undefined;
    }>;
    getTimeCondition(timeframe: any): any;
    hashIP(ip: any): string;
    parseUserAgent(userAgent: any): {
        mobile?: undefined;
        browser?: undefined;
    } | {
        mobile: boolean;
        browser: string;
    };
    generateEventId(): string;
    generateSessionId(): string;
    generateTestId(): string;
    calculateConversionRates(funnelSteps: any): {
        fromStep: any;
        toStep: any;
        conversionRate: number;
    }[];
    identifyDropOffPoints(funnelSteps: any): {
        step: any;
        dropOffCount: number;
        dropOffRate: number;
    }[];
    formatCohortAnalysis(cohortData: any): {};
    convertToCSV(data: any): string;
    convertToExcel(data: any): {
        message: string;
        data: any;
    };
    updateAggregatedMetrics(events: any): Promise<void>;
    processAnalytics(events: any): Promise<void>;
    processEducationalAnalytics(events: any): Promise<void>;
    processErrorAnalytics(events: any): Promise<void>;
}
import EventEmitter = require("events");
//# sourceMappingURL=analyticsService.d.ts.map