export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export declare function predictAcademicRisk(options?: {}): Promise<{
    success: boolean;
    data: {
        predicciones: {
            estudiante: {
                id: any;
                matricula: any;
                nombre: string;
                semestre: any;
            };
            riesgo: {
                score: number;
                nivel: string;
                probabilidadDesercion: string;
            };
            factores: ({
                factor: string;
                valor: string;
                impacto: string;
            } | {
                factor: string;
                valor: number;
                impacto: string;
            })[];
            recomendaciones: string[];
        }[];
        resumen: {
            total: number;
            altoRiesgo: number;
            medioRiesgo: number;
            bajoRiesgo: number;
        };
    };
    timestamp: string;
}>;
export declare function analyzeTrends(options?: {}): Promise<{
    success: boolean;
    data: {
        promedios: any;
        asistencia: any;
        proyeccion: {
            tendencia: string;
            cambioEstimado: string;
            proximoValor: any;
        };
        insights: {
            tipo: string;
            mensaje: string;
        }[];
    };
    timestamp: string;
}>;
export declare function getPersonalizedRecommendations(estudianteId: any): Promise<{
    success: boolean;
    data: {
        estudiante: {
            id: any;
            nombre: string;
            promedioActual: string;
        };
        materiasDebiles: any;
        recomendaciones: {
            tipo: string;
            prioridad: string;
            titulo: string;
            descripcion: string;
            acciones: string[];
        }[];
        metasSugeridas: {
            meta: string;
            plazo: string;
            indicador: string;
        }[];
    };
    timestamp: string;
}>;
export declare function detectAnomalies(tipo?: string): Promise<{
    success: boolean;
    data: {
        anomalias: ({
            tipo: string;
            severidad: string;
            descripcion: string;
            estudiante: {
                id: any;
                matricula: any;
                nombre: any;
            };
            fecha: any;
        } | {
            tipo: string;
            severidad: string;
            descripcion: string;
            estudiante: {
                id: any;
                matricula: any;
                nombre: any;
            };
            fecha?: undefined;
        })[];
        resumen: {
            total: number;
            alta: number;
            media: number;
            baja: number;
        };
    };
    timestamp: string;
}>;
export declare function forecast(metrica?: string, periodos?: number): Promise<{
    success: boolean;
    data: {
        metrica: "inscripciones" | "promedio";
        historico: any;
        proyeccion: {
            periodo: string;
            valor: string;
        }[];
        confianza: string | number;
    };
    timestamp: string;
}>;
export declare function _calculateRiskScore(student: any): number;
export declare function _getRiskLevel(score: any): "alto" | "medio" | "bajo";
export declare function _getRiskFactors(student: any): ({
    factor: string;
    valor: string;
    impacto: string;
} | {
    factor: string;
    valor: number;
    impacto: string;
})[];
export declare function _getRecommendations(factors: any): string[];
export declare function _calculateProjection(data: any): {
    tendencia: string;
    cambioEstimado: string;
    proximoValor: any;
};
export declare function _generateInsights(promedios: any, asistencia: any): {
    tipo: string;
    mensaje: string;
}[];
export declare function _generateGoals(student: any): {
    meta: string;
    plazo: string;
    indicador: string;
}[];
export declare function _linearRegression(data: any, periodos: any): {
    periodo: string;
    valor: string;
}[];
export declare function _calculateConfidence(data: any): string | 0.5;
//# sourceMappingURL=PredictiveAnalyticsService.d.ts.map