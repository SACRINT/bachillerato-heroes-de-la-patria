/**
 * 📊 ANALYTICS DAO - TypeScript
 * Data Access Object para estadísticas, ML y análisis predictivo
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface PopularItem {
    id: number;
    title: string;
    descripcion?: string;
    popularity_score: number;
    categoria?: string;
    score?: number;
    item_id?: number;
    nombre?: string;
}
export interface RecommendationStats {
    total_interactions: number;
    by_type: Array<{
        interaction_type: string;
        count: number;
    }>;
    top_items: Array<{
        item_type: string;
        item_id: number;
        interactions: number;
    }>;
    top_users: Array<{
        user_id: number;
        interactions: number;
    }>;
}
export interface InteractionAnalytics extends RecommendationStats {
    interactions_by_type: Array<{
        interaction_type: string;
        count: number;
    }>;
}
export interface RecommendationHealth {
    tables_found: string[];
}
export interface SimilarItem {
    id?: number;
    item_id?: number;
    title?: string;
    nombre?: string;
    descripcion?: string;
    categoria?: string;
}
export interface TimeSeriesPoint {
    date: Date | string;
    value: number;
    ds?: Date | string;
    y?: number;
}
export interface PredictiveSummary {
    total_students_with_grades: number;
}
export interface StudentFeatures {
    uuid: string;
    student_id?: string;
    nombre?: string;
    apellido_paterno?: string;
    avg_grade: number;
    attendance_rate: number;
    age: number;
    is_male?: number;
    gender_male?: number;
    gender_female?: number;
    enrolled_courses?: number;
    min_grade?: number;
    max_grade?: number;
    grade_stddev?: number;
    login_count?: number;
    assignments_submitted?: number;
}
export interface ActiveStudent {
    uuid: string;
    nombre: string;
    apellido_paterno: string;
    email: string;
}
export interface TableStats {
    table_name: string;
    row_count: number;
    dead_rows?: number;
    last_vacuum?: Date;
    last_autovacuum?: Date;
    last_analyze?: Date;
    last_autoanalyze?: Date;
}
export interface IndexUsage {
    schemaname: string;
    table_name: string;
    index_name: string;
    times_used: number;
    rows_read: number;
    rows_fetched: number;
    index_size: string;
}
export interface SystemHealth {
    top_tables: Array<{
        table_name: string;
        row_count: number;
    }>;
    unused_indexes_count: number;
}
declare class AnalyticsDAO {
    static getPopularItems(type: string, limit?: number): Promise<PopularItem[]>;
    static recordInteraction(userId: number, type: string, itemId: number, interactionType: string, rating?: number | null): Promise<void>;
    static getSimilarItems(type: string, itemId: number, limit?: number): Promise<SimilarItem[]>;
    static getRecommendationStats(): Promise<RecommendationStats>;
    static getRecommendationsHealth(): Promise<RecommendationHealth>;
    static getPopularItemsAlt(type: string, limit?: number): Promise<PopularItem[]>;
    static getSimilarItemsAlt(type: string, itemId: number, limit?: number): Promise<SimilarItem[]>;
    static getInteractionAnalytics(filters?: {
        dateFrom?: string | Date;
        dateTo?: string | Date;
    }): Promise<InteractionAnalytics>;
    static getHistoricalGrades(studentId: string): Promise<TimeSeriesPoint[]>;
    static getHistoricalEnrollments(): Promise<TimeSeriesPoint[]>;
    static getHistoricalDropout(): Promise<TimeSeriesPoint[]>;
    static getGradesTrend(startDate?: string | Date, endDate?: string | Date): Promise<TimeSeriesPoint[]>;
    static getPredictiveSummary(): Promise<PredictiveSummary>;
    static getStudentFeatures(studentId: string): Promise<StudentFeatures | null>;
    static getActiveStudents(limit?: number): Promise<ActiveStudent[]>;
    static getTableStats(tableName?: string | null): Promise<TableStats[]>;
    static getIndexUsage(tableName?: string | null, unusedOnly?: boolean): Promise<IndexUsage[]>;
    static getSystemHealth(): Promise<SystemHealth>;
    static tableExists(tableName: string): Promise<boolean>;
    static executeMaintenanceCommand(command: string): Promise<void>;
}
export default AnalyticsDAO;
//# sourceMappingURL=analytics.dao.d.ts.map