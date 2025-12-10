export class GradesAnalyticsService {
    dbAvailable: boolean;
    dataPath: string;
    gradesFile: string;
    studentsFile: string;
    analyticsFile: string;
    ensureDataDirectory(): Promise<void>;
    initializeAnalyticsData(): Promise<void>;
    readJsonFile(filePath: any): Promise<any>;
    writeJsonFile(filePath: any, data: any): Promise<boolean>;
    getStudentAnalytics(studentId: any, filters?: {}): Promise<{
        student_id: any;
        total_subjects: any;
        overall_average: number;
        letter_grade: {
            letter: string;
            label: any;
            numeric: any;
        };
        performance_trend: string;
        subject_analysis: any;
        recommendations: {
            type: string;
            title: string;
            message: string;
            action: string;
        }[];
        alerts: {
            level: string;
            type: string;
            message: string;
            requires_action: boolean;
            suggested_actions: string[];
        }[];
        progress_chart_data: any[];
    }>;
    calculateStudentAnalytics(grades: any, analyticsData: any): {
        overallAverage: number;
        trend: string;
        subjectAnalysis: any;
        recommendations: {
            type: string;
            title: string;
            message: string;
            action: string;
        }[];
        alerts: {
            level: string;
            type: string;
            message: string;
            requires_action: boolean;
            suggested_actions: string[];
        }[];
        progressData: any[];
    };
    analyzeSubjectPerformance(grade: any, metadata: any, analyticsData: any): {
        status: string;
        improvementNeeded: boolean;
    };
    calculateTrend(grades: any): "stable" | "improving" | "declining";
    calculateOverallTrend(grades: any): "stable" | "improving" | "declining";
    getLetterGrade(average: any, analyticsData: any): {
        letter: string;
        label: any;
        numeric: any;
    };
    generateRecommendations(subjectAnalysis: any, overallAverage: any): {
        type: string;
        title: string;
        message: string;
        action: string;
    }[];
    generateAlerts(subjectAnalysis: any, overallAverage: any, analyticsData: any): {
        level: string;
        type: string;
        message: string;
        requires_action: boolean;
        suggested_actions: string[];
    }[];
    generateProgressData(grades: any): any[];
    getGroupAnalytics(filters?: {}): Promise<{
        total_students: number;
        subjects_analyzed: number;
        group_statistics: {};
        performance_distribution: {};
        subject_rankings: any[];
        recommendations: any[];
        top_performers?: undefined;
        struggling_students?: undefined;
    } | {
        total_students: number;
        subjects_analyzed: number;
        group_statistics: {
            average: number;
            median: any;
            min: number;
            max: number;
            std_deviation: number;
        };
        performance_distribution: {};
        subject_rankings: any;
        top_performers: {
            student_id: string;
            name: string;
            average: number;
            subjects_count: any;
        }[];
        struggling_students: {
            student_id: string;
            name: string;
            average: number;
            subjects_count: any;
            risk_level: string;
        }[];
        recommendations: {
            type: string;
            priority: string;
            title: string;
            description: string;
            actions: string[];
        }[];
    }>;
    calculateGroupAnalytics(grades: any, students: any, analyticsData: any): {
        total_students: number;
        subjects_analyzed: number;
        group_statistics: {};
        performance_distribution: {};
        subject_rankings: any[];
        recommendations: any[];
        top_performers?: undefined;
        struggling_students?: undefined;
    } | {
        total_students: number;
        subjects_analyzed: number;
        group_statistics: {
            average: number;
            median: any;
            min: number;
            max: number;
            std_deviation: number;
        };
        performance_distribution: {};
        subject_rankings: any;
        top_performers: {
            student_id: string;
            name: string;
            average: number;
            subjects_count: any;
        }[];
        struggling_students: {
            student_id: string;
            name: string;
            average: number;
            subjects_count: any;
            risk_level: string;
        }[];
        recommendations: {
            type: string;
            priority: string;
            title: string;
            description: string;
            actions: string[];
        }[];
    };
    calculateMedian(numbers: any): any;
    calculateStandardDeviation(numbers: any): number;
    calculatePerformanceDistribution(averages: any, analyticsData: any): {};
    calculateSubjectRankings(grades: any, subjects: any): any;
    getTopPerformers(grades: any, students: any, limit?: number): {
        student_id: string;
        name: string;
        average: number;
        subjects_count: any;
    }[];
    getStrugglingStudents(grades: any, students: any, analyticsData: any): {
        student_id: string;
        name: string;
        average: number;
        subjects_count: any;
        risk_level: string;
    }[];
    generateGroupRecommendations(statistics: any, distribution: any): {
        type: string;
        priority: string;
        title: string;
        description: string;
        actions: string[];
    }[];
}
export function getGradesAnalyticsService(): any;
//# sourceMappingURL=gradesAnalyticsService.d.ts.map