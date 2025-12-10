"use strict";
/**
 * 🤖 PREDICTIVE ANALYTICS SERVICE - TypeScript Version
 * Servicio de análisis predictivo y ML para BGE
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = exports.PredictiveAnalyticsService = void 0;
const predictive_analytics_dao_1 = __importDefault(require("../data/predictive-analytics.dao"));
const devLogger_1 = __importDefault(require("../utils/devLogger"));
// ==================== SERVICE ERROR ====================
class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}
exports.ServiceError = ServiceError;
// ==================== PREDICTIVE ANALYTICS SERVICE ====================
class PredictiveAnalyticsService {
    async predictAcademicRisk(options = {}) {
        const { threshold = 7.0, includeFactors = true } = options;
        devLogger_1.default.log('[PredictiveAnalytics] Calculando riesgo académico');
        try {
            const students = await predictive_analytics_dao_1.default.getStudentsWithMetrics();
            const predictions = [];
            for (const student of students) {
                const riskScore = this._calculateRiskScore(student);
                const riskLevel = this._getRiskLevel(riskScore);
                const factors = includeFactors ? this._getRiskFactors(student) : [];
                if (riskScore >= (100 - threshold * 10)) {
                    predictions.push({
                        estudiante: { id: student.id, matricula: student.matricula, nombre: `${student.nombre} ${student.apellido_paterno}`, semestre: student.semestre },
                        riesgo: { score: riskScore, nivel: riskLevel, probabilidadDesercion: (riskScore / 100).toFixed(2) },
                        factores: factors,
                        recomendaciones: this._getRecommendations(factors)
                    });
                }
            }
            predictions.sort((a, b) => b.riesgo.score - a.riesgo.score);
            return {
                success: true,
                data: {
                    predicciones: predictions,
                    resumen: {
                        total: predictions.length,
                        altoRiesgo: predictions.filter(p => p.riesgo.nivel === 'alto').length,
                        medioRiesgo: predictions.filter(p => p.riesgo.nivel === 'medio').length,
                        bajoRiesgo: predictions.filter(p => p.riesgo.nivel === 'bajo').length
                    }
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            devLogger_1.default.error('[PredictiveAnalytics] Error en predicción:', error.message);
            throw new ServiceError('Error al calcular predicciones de riesgo', 500);
        }
    }
    async analyzeTrends(options = {}) {
        const { periodo = 6, granularidad = 'mes' } = options;
        devLogger_1.default.log('[PredictiveAnalytics] Analizando tendencias');
        try {
            const promedios = await predictive_analytics_dao_1.default.getGradeTrends(granularidad, periodo);
            const asistencia = await predictive_analytics_dao_1.default.getAttendanceTrends(granularidad, periodo);
            return {
                success: true,
                data: {
                    promedios: promedios.map(r => ({
                        periodo: r.periodo instanceof Date ? r.periodo.toISOString() : String(r.periodo),
                        promedio: (r.promedio || 0).toFixed(2),
                        totalCalificaciones: r.total_calificaciones || 0
                    })),
                    asistencia: asistencia.map(r => ({
                        periodo: r.periodo instanceof Date ? r.periodo.toISOString() : String(r.periodo),
                        total: r.total || 0,
                        presentes: r.presentes || 0,
                        porcentaje: r.porcentaje || 0
                    })),
                    proyeccion: this._calculateProjection(promedios),
                    insights: this._generateInsights(promedios, asistencia)
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            devLogger_1.default.error('[PredictiveAnalytics] Error en tendencias:', error.message);
            throw new ServiceError('Error al analizar tendencias', 500);
        }
    }
    async getPersonalizedRecommendations(estudianteId) {
        devLogger_1.default.log(`[PredictiveAnalytics] Generando recomendaciones para estudiante ${estudianteId}`);
        try {
            const student = await predictive_analytics_dao_1.default.getStudentWithGrades(estudianteId);
            if (!student)
                throw new ServiceError('Estudiante no encontrado', 404);
            const weakSubjects = await predictive_analytics_dao_1.default.getWeakSubjects(estudianteId);
            const recommendations = [];
            if ((student.promedio_actual || 0) < 7) {
                recommendations.push({
                    tipo: 'academica', prioridad: 'alta', titulo: 'Mejora tu promedio general',
                    descripcion: 'Tu promedio está por debajo del mínimo requerido.',
                    acciones: ['Asistir a asesorías académicas', 'Formar grupos de estudio', 'Revisar material de apoyo']
                });
            }
            for (const subject of weakSubjects) {
                recommendations.push({
                    tipo: 'materia', prioridad: subject.promedio < 6 ? 'alta' : 'media',
                    titulo: `Refuerzo en ${subject.materia}`,
                    descripcion: `Tu promedio en ${subject.materia} es ${subject.promedio.toFixed(1)}`,
                    acciones: [`Agendar asesoría de ${subject.materia}`, 'Revisar ejercicios prácticos', 'Consultar videos educativos']
                });
            }
            recommendations.push({
                tipo: 'bienestar', prioridad: 'media', titulo: 'Mantén un balance saludable',
                descripcion: 'El éxito académico requiere bienestar físico y mental',
                acciones: ['Dormir 7-8 horas diarias', 'Hacer ejercicio regularmente', 'Participar en actividades extracurriculares']
            });
            return {
                success: true,
                data: {
                    estudiante: { id: student.id, nombre: `${student.nombre} ${student.apellido_paterno}`, promedioActual: (student.promedio_actual || 0).toFixed(2) },
                    materiasDebiles: weakSubjects.map(s => ({ materia: s.materia, promedio: s.promedio.toFixed(2) })),
                    recomendaciones: recommendations,
                    metasSugeridas: this._generateGoals(student)
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[PredictiveAnalytics] Error en recomendaciones:', error.message);
            throw new ServiceError('Error al generar recomendaciones', 500);
        }
    }
    async detectAnomalies(tipo = 'all') {
        devLogger_1.default.log(`[PredictiveAnalytics] Detectando anomalías: ${tipo}`);
        try {
            const anomalies = [];
            if (tipo === 'all' || tipo === 'calificaciones') {
                const gradeAnomalies = await predictive_analytics_dao_1.default.getGradeAnomalies();
                for (const row of gradeAnomalies) {
                    anomalies.push({
                        tipo: 'calificacion_extrema',
                        severidad: (row.calificacion || 0) < 3 ? 'alta' : 'baja',
                        descripcion: (row.calificacion || 0) < 3 ? `Calificación muy baja (${row.calificacion}) en ${row.materia}` : `Calificación perfecta (10) en ${row.materia}`,
                        estudiante: { id: row.id, matricula: row.matricula, nombre: row.nombre },
                        fecha: row.fecha_registro instanceof Date ? row.fecha_registro.toISOString() : undefined
                    });
                }
            }
            if (tipo === 'all' || tipo === 'asistencia') {
                const attendanceAnomalies = await predictive_analytics_dao_1.default.getAttendanceAnomalies();
                for (const row of attendanceAnomalies) {
                    anomalies.push({
                        tipo: 'faltas_consecutivas',
                        severidad: (row.faltas_consecutivas || 0) >= 5 ? 'alta' : 'media',
                        descripcion: `${row.faltas_consecutivas} faltas en los últimos 7 días`,
                        estudiante: { id: row.id, matricula: row.matricula, nombre: row.nombre }
                    });
                }
            }
            return {
                success: true,
                data: {
                    anomalias: anomalies,
                    resumen: { total: anomalies.length, alta: anomalies.filter(a => a.severidad === 'alta').length, media: anomalies.filter(a => a.severidad === 'media').length, baja: anomalies.filter(a => a.severidad === 'baja').length }
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            devLogger_1.default.error('[PredictiveAnalytics] Error en detección:', error.message);
            throw new ServiceError('Error al detectar anomalías', 500);
        }
    }
    async forecast(metrica = 'promedio', periodos = 3) {
        devLogger_1.default.log(`[PredictiveAnalytics] Forecasting ${metrica} para ${periodos} periodos`);
        try {
            let rawData;
            switch (metrica) {
                case 'promedio':
                    rawData = await predictive_analytics_dao_1.default.getGradeHistory();
                    break;
                case 'inscripciones':
                    rawData = await predictive_analytics_dao_1.default.getEnrollmentHistory();
                    break;
                default: throw new ServiceError('Métrica no soportada', 400);
            }
            const data = rawData.map(d => ({
                periodo: d.periodo instanceof Date ? d.periodo.toISOString() : String(d.periodo),
                valor: String(d.valor || d.promedio || 0)
            }));
            const forecast = this._linearRegression(data, periodos);
            return {
                success: true,
                data: { metrica, historico: data.map(d => ({ periodo: d.periodo, valor: parseFloat(d.valor).toFixed(2) })), proyeccion: forecast, confianza: this._calculateConfidence(data) },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[PredictiveAnalytics] Error en forecast:', error.message);
            throw new ServiceError('Error al generar forecast', 500);
        }
    }
    // ==================== MÉTODOS PRIVADOS ====================
    _calculateRiskScore(student) {
        let score = 0;
        const promedio = student.promedio || student.promedio_calculado || 0;
        if (promedio < 6)
            score += 40;
        else if (promedio < 7)
            score += 25;
        else if (promedio < 8)
            score += 10;
        const reprobadas = student.materias_reprobadas || 0;
        if (reprobadas >= 3)
            score += 30;
        else if (reprobadas >= 2)
            score += 20;
        else if (reprobadas >= 1)
            score += 10;
        const presentes = student.asistencias_presentes || 0;
        const total = student.total_asistencias || 1;
        const porcentajeAsistencia = (presentes / total) * 100;
        if (porcentajeAsistencia < 70)
            score += 30;
        else if (porcentajeAsistencia < 80)
            score += 20;
        else if (porcentajeAsistencia < 90)
            score += 10;
        return Math.min(score, 100);
    }
    _getRiskLevel(score) {
        return score >= 70 ? 'alto' : score >= 40 ? 'medio' : 'bajo';
    }
    _getRiskFactors(student) {
        const factors = [];
        const promedio = student.promedio || student.promedio_calculado || 0;
        if (promedio < 7)
            factors.push({ factor: 'Promedio bajo', valor: promedio.toFixed(2), impacto: 'alto' });
        const reprobadas = student.materias_reprobadas || 0;
        if (reprobadas > 0)
            factors.push({ factor: 'Materias reprobadas', valor: reprobadas, impacto: reprobadas >= 2 ? 'alto' : 'medio' });
        const presentes = student.asistencias_presentes || 0;
        const total = student.total_asistencias || 1;
        const porcentaje = (presentes / total) * 100;
        if (porcentaje < 80)
            factors.push({ factor: 'Asistencia baja', valor: `${porcentaje.toFixed(1)}%`, impacto: porcentaje < 70 ? 'alto' : 'medio' });
        return factors;
    }
    _getRecommendations(factors) {
        const recommendations = [];
        for (const factor of factors) {
            if (factor.factor === 'Promedio bajo') {
                recommendations.push('Agendar tutorías académicas', 'Revisar técnicas de estudio');
            }
            if (factor.factor === 'Materias reprobadas') {
                recommendations.push('Inscribir en curso de regularización', 'Asignar tutor par');
            }
            if (factor.factor === 'Asistencia baja') {
                recommendations.push('Contactar a padre/tutor', 'Evaluar situación personal');
            }
        }
        return [...new Set(recommendations)];
    }
    _calculateProjection(data) {
        if (data.length < 2)
            return null;
        const values = data.map(d => d.promedio || 0);
        const trend = (values[values.length - 1] - values[0]) / values.length;
        return { tendencia: trend > 0 ? 'ascendente' : trend < 0 ? 'descendente' : 'estable', cambioEstimado: trend.toFixed(2), proximoValor: (values[values.length - 1] + trend).toFixed(2) };
    }
    _generateInsights(promedios, asistencia) {
        const insights = [];
        if (promedios.length >= 2) {
            const first = promedios[0]?.promedio || 0;
            const last = promedios[promedios.length - 1]?.promedio || 0;
            const change = ((last - first) / (first || 1) * 100).toFixed(1);
            insights.push({ tipo: 'promedio', mensaje: parseFloat(change) > 0 ? `El promedio general ha mejorado ${change}%` : `El promedio general ha disminuido ${Math.abs(parseFloat(change))}%` });
        }
        if (asistencia.length >= 2) {
            const avgAttendance = asistencia.reduce((acc, a) => acc + (a.porcentaje || 0), 0) / asistencia.length;
            insights.push({ tipo: 'asistencia', mensaje: avgAttendance >= 90 ? `Excelente asistencia: ${avgAttendance.toFixed(1)}%` : `Asistencia ${avgAttendance.toFixed(1)}% necesita atención` });
        }
        return insights;
    }
    _generateGoals(student) {
        const goals = [];
        const promedio = student.promedio_actual || 0;
        if (promedio < 7)
            goals.push({ meta: 'Alcanzar promedio de 7.0', plazo: '1 mes', indicador: 'Promedio mensual' });
        if (promedio >= 7 && promedio < 8.5)
            goals.push({ meta: 'Mejorar promedio a 8.5', plazo: '2 meses', indicador: 'Promedio bimestral' });
        goals.push({ meta: 'Mantener asistencia >95%', plazo: 'Continuo', indicador: 'Asistencia semanal' });
        return goals;
    }
    _linearRegression(data, periodos) {
        if (data.length < 2)
            return [];
        const n = data.length;
        const values = data.map(d => parseFloat(d.valor));
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const projections = [];
        const lastDate = new Date(data[n - 1].periodo);
        for (let i = 1; i <= periodos; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + i);
            projections.push({ periodo: nextDate.toISOString(), valor: (intercept + slope * (n + i - 1)).toFixed(2) });
        }
        return projections;
    }
    _calculateConfidence(data) {
        if (data.length < 3)
            return '0.50';
        const values = data.map(d => parseFloat(d.valor));
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / (mean || 1);
        return Math.max(0.3, Math.min(0.95, 1 - cv)).toFixed(2);
    }
}
exports.PredictiveAnalyticsService = PredictiveAnalyticsService;
// ==================== EXPORTS ====================
const predictiveAnalyticsService = new PredictiveAnalyticsService();
exports.default = predictiveAnalyticsService;
//# sourceMappingURL=predictive-analytics.service.js.map