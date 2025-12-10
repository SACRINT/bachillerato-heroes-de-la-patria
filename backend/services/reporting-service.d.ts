declare const _exports: ReportingService;
export = _exports;
declare class ReportingService {
    generateStudentsReport(filters?: {}): Promise<{
        success: boolean;
        type: string;
        data: any;
        count: any;
        generatedAt: string;
    }>;
    generateFinancialReport(dateRange?: {}): Promise<{
        success: boolean;
        type: string;
        data: any;
        summary: {
            totalIngresos: any;
            periodos: any;
        };
        generatedAt: string;
    }>;
    generateApprovalsReport(): Promise<{
        success: boolean;
        type: string;
        data: any;
        summary: {
            totalPending: any;
            categories: any;
        };
        generatedAt: string;
    }>;
    generateAttendanceReport(filters?: {}): Promise<{
        success: boolean;
        type: string;
        data: any;
        count: any;
        generatedAt: string;
    }>;
    predictTrend(metric: any): Promise<{
        success: boolean;
        metric: any;
        trend: string;
        data: any;
        changePercent?: undefined;
        recent?: undefined;
        previous?: undefined;
    } | {
        success: boolean;
        metric: any;
        trend: string;
        changePercent: string;
        recent: string;
        previous: string;
        data: any;
    }>;
    scheduleReport(schedule: any): Promise<{
        success: boolean;
        schedule: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        schedule?: undefined;
    }>;
}
//# sourceMappingURL=reporting-service.d.ts.map