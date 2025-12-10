/**
 * 🤖 PREDICTIVE ANALYTICS SERVICE - TypeScript Version
 * Servicio de análisis predictivo y ML para BGE
 * Migrado: 07 Diciembre 2025
 */
declare class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
interface RiskFactor {
    factor: string;
    valor: string | number;
    impacto: 'alto' | 'medio' | 'bajo';
}
interface RiskPrediction {
    estudiante: {
        id: number;
        matricula: string;
        nombre: string;
        semestre: number;
    };
    riesgo: {
        score: number;
        nivel: 'alto' | 'medio' | 'bajo';
        probabilidadDesercion: string;
    };
    factores: RiskFactor[];
    recomendaciones: string[];
}
interface Recommendation {
    tipo: string;
    prioridad: 'alta' | 'media' | 'baja';
    titulo: string;
    descripcion: string;
    acciones: string[];
}
interface Anomaly {
    tipo: string;
    severidad: 'alta' | 'media' | 'baja';
    descripcion: string;
    estudiante: {
        id: number;
        matricula: string;
        nombre: string;
    };
    fecha?: string;
}
interface ServiceResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
}
declare class PredictiveAnalyticsService {
    predictAcademicRisk(options?: {
        threshold?: number;
        includeFactors?: boolean;
    }): Promise<ServiceResponse<{
        predicciones: RiskPrediction[];
        resumen: {
            total: number;
            altoRiesgo: number;
            medioRiesgo: number;
            bajoRiesgo: number;
        };
    }>>;
    analyzeTrends(options?: {
        periodo?: number;
        granularidad?: string;
    }): Promise<ServiceResponse<any>>;
    getPersonalizedRecommendations(estudianteId: number): Promise<ServiceResponse<any>>;
    detectAnomalies(tipo?: string): Promise<ServiceResponse<{
        anomalias: Anomaly[];
        resumen: any;
    }>>;
    forecast(metrica?: string, periodos?: number): Promise<ServiceResponse<any>>;
    private _calculateRiskScore;
    private _getRiskLevel;
    private _getRiskFactors;
    private _getRecommendations;
    private _calculateProjection;
    private _generateInsights;
    private _generateGoals;
    private _linearRegression;
    private _calculateConfidence;
}
declare const predictiveAnalyticsService: PredictiveAnalyticsService;
export default predictiveAnalyticsService;
export { PredictiveAnalyticsService, ServiceError, RiskPrediction, Recommendation, Anomaly };
//# sourceMappingURL=predictive-analytics.service.d.ts.map