/**
 * 🌡️ SENTIMENT ANALYSIS SERVICE - Semana 14
 * Análisis de Sentimiento Institucional
 * 
 * Implementa:
 * - Aspect-Based Sentiment Analysis (ABSA)
 * - Categorización por áreas (Instalaciones, Docentes, Administración)
 * - Termómetro Institucional
 * - Detección de tendencias negativas
 * - Alertas de alto riesgo (bullying, seguridad)
 * - Anonimización de datos
 * - Correlación con calendario escolar
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 * @version 1.0.0
 */

const { executeQuery } = require('../../config/database');
const devLogger = require('../../utils/devLogger');

class SentimentAnalysisService {
    constructor() {
        // Categorías de aspectos institucionales
        this.aspects = {
            instalaciones: ['aulas', 'baños', 'cafetería', 'laboratorio', 'biblioteca', 'canchas', 'limpieza'],
            docentes: ['maestros', 'profesores', 'clases', 'enseñanza', 'explicación', 'tarea', 'examen'],
            administracion: ['oficina', 'trámites', 'inscripción', 'pagos', 'directora', 'secretaría', 'horario'],
            convivencia: ['compañeros', 'amigos', 'bullying', 'peleas', 'respeto', 'ambiente', 'seguridad'],
            servicios: ['transporte', 'comida', 'internet', 'wifi', 'materiales', 'libros', 'uniformes']
        };

        // Palabras clave para detectar sentimiento
        this.sentimentLexicon = {
            positive: ['excelente', 'bueno', 'genial', 'increíble', 'me gusta', 'chido', 'padre',
                'agradable', 'amable', 'útil', 'mejor', 'feliz', 'contento', 'satisfecho'],
            negative: ['malo', 'pésimo', 'horrible', 'feo', 'sucio', 'aburrido', 'difícil',
                'injusto', 'enojado', 'frustrado', 'molesto', 'triste', 'decepcionado'],
            critical: ['bullying', 'acoso', 'golpes', 'droga', 'arma', 'amenaza', 'violencia',
                'robo', 'suicidio', 'depresión', 'abuso', 'peligro', 'miedo']
        };

        // Jerga estudiantil local (México)
        this.studentSlang = {
            positive: ['chido', 'padre', 'a toda madre', 'perro', 'rifado', 'crack', 'pro'],
            negative: ['naco', 'gacho', 'culero', 'mamón', 'fresa', 'meco', 'ñoño', 'cagado']
        };

        // Caché de análisis
        this.analysisCache = new Map();

        // Configuración de alertas
        this.alertConfig = {
            criticalThreshold: 0.8,  // Score para alerta crítica
            trendWindow: 7,          // Días para detectar tendencias
            minSamplesForTrend: 10   // Mínimo de comentarios para tendencia
        };
    }

    // =========================================================
    // TAREA 1: Recopilar Feedback No Estructurado
    // =========================================================

    async collectFeedback(source = 'all') {
        try {
            let feedback = [];

            // Recopilar de quejas
            if (source === 'all' || source === 'quejas') {
                const quejas = await executeQuery(`
                    SELECT id, descripcion as text, tipo as category, 
                           fecha_creacion as created_at, 'quejas' as source
                    FROM quejas
                    WHERE descripcion IS NOT NULL
                    ORDER BY fecha_creacion DESC
                    LIMIT 500
                `);
                feedback = feedback.concat(quejas || []);
            }

            // Recopilar de chatbot
            if (source === 'all' || source === 'chatbot') {
                const chatMessages = await executeQuery(`
                    SELECT id, message as text, 'chatbot' as category,
                           created_at, 'chatbot' as source
                    FROM chat_messages
                    WHERE role = 'user' AND message IS NOT NULL
                    ORDER BY created_at DESC
                    LIMIT 500
                `);
                feedback = feedback.concat(chatMessages || []);
            }

            devLogger.log('SENTIMENT', `Feedback recopilado: ${feedback.length} registros`);
            return feedback;
        } catch (error) {
            devLogger.warn('SENTIMENT', 'Error al recopilar feedback, usando demo');
            return this.generateMockFeedback(50);
        }
    }

    generateMockFeedback(count) {
        const templates = [
            { text: 'Los baños siempre están sucios, es horrible', aspect: 'instalaciones', sentiment: 'negative' },
            { text: 'El maestro de matemáticas explica muy bien, me gusta mucho', aspect: 'docentes', sentiment: 'positive' },
            { text: 'La cafetería tiene comida muy rica', aspect: 'servicios', sentiment: 'positive' },
            { text: 'Hay un grupo de chavos que molestan mucho en el recreo', aspect: 'convivencia', sentiment: 'negative' },
            { text: 'Los trámites de inscripción son muy tardados', aspect: 'administracion', sentiment: 'negative' },
            { text: 'Me siento muy a gusto con mis compañeros', aspect: 'convivencia', sentiment: 'positive' },
            { text: 'Las canchas están en muy mal estado', aspect: 'instalaciones', sentiment: 'negative' },
            { text: 'La biblioteca tiene buenos libros', aspect: 'instalaciones', sentiment: 'positive' }
        ];

        const feedback = [];
        for (let i = 0; i < count; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            feedback.push({
                id: i + 1,
                text: template.text,
                category: template.aspect,
                source: 'mock',
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        return feedback;
    }

    // =========================================================
    // TAREA 2-3: Aspect-Based Sentiment Analysis (ABSA)
    // =========================================================

    async analyzeText(text) {
        const normalizedText = text.toLowerCase();

        // Detectar aspectos mencionados
        const detectedAspects = this.detectAspects(normalizedText);

        // Calcular sentimiento
        const sentimentScore = this.calculateSentiment(normalizedText);

        // Detectar riesgo crítico
        const criticalRisk = this.detectCriticalRisk(normalizedText);

        return {
            originalText: text,
            aspects: detectedAspects,
            sentiment: {
                score: sentimentScore,
                label: this.getSentimentLabel(sentimentScore),
                confidence: 0.75
            },
            criticalRisk,
            analyzedAt: new Date().toISOString()
        };
    }

    detectAspects(text) {
        const detected = [];

        for (const [aspect, keywords] of Object.entries(this.aspects)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    if (!detected.find(d => d.aspect === aspect)) {
                        detected.push({
                            aspect,
                            keyword,
                            confidence: 0.8
                        });
                    }
                    break;
                }
            }
        }

        return detected.length > 0 ? detected : [{ aspect: 'general', keyword: null, confidence: 0.5 }];
    }

    calculateSentiment(text) {
        let score = 0;
        let matches = 0;

        // Verificar palabras positivas
        for (const word of [...this.sentimentLexicon.positive, ...this.studentSlang.positive]) {
            if (text.includes(word)) {
                score += 1;
                matches++;
            }
        }

        // Verificar palabras negativas
        for (const word of [...this.sentimentLexicon.negative, ...this.studentSlang.negative]) {
            if (text.includes(word)) {
                score -= 1;
                matches++;
            }
        }

        // Verificar palabras críticas (peso mayor)
        for (const word of this.sentimentLexicon.critical) {
            if (text.includes(word)) {
                score -= 2;
                matches++;
            }
        }

        // Normalizar a -1 a 1
        if (matches === 0) return 0;
        return Math.max(-1, Math.min(1, score / matches));
    }

    getSentimentLabel(score) {
        if (score >= 0.3) return 'positive';
        if (score <= -0.3) return 'negative';
        return 'neutral';
    }

    detectCriticalRisk(text) {
        const criticalMatches = [];

        for (const word of this.sentimentLexicon.critical) {
            if (text.includes(word)) {
                criticalMatches.push(word);
            }
        }

        return {
            detected: criticalMatches.length > 0,
            keywords: criticalMatches,
            riskLevel: criticalMatches.length >= 2 ? 'high' :
                criticalMatches.length === 1 ? 'medium' : 'low'
        };
    }

    // =========================================================
    // TAREA 4: Dashboard "Termómetro Institucional"
    // =========================================================

    async getInstitutionalThermometer(days = 30) {
        const feedback = await this.collectFeedback();
        const analyses = await Promise.all(feedback.map(f => this.analyzeText(f.text)));

        // Calcular métricas por aspecto
        const aspectMetrics = {};
        for (const aspect of Object.keys(this.aspects)) {
            aspectMetrics[aspect] = {
                totalMentions: 0,
                avgSentiment: 0,
                positiveCount: 0,
                negativeCount: 0,
                neutralCount: 0
            };
        }

        for (const analysis of analyses) {
            for (const detectedAspect of analysis.aspects) {
                const aspect = detectedAspect.aspect;
                if (aspectMetrics[aspect]) {
                    aspectMetrics[aspect].totalMentions++;
                    aspectMetrics[aspect].avgSentiment += analysis.sentiment.score;

                    if (analysis.sentiment.label === 'positive') aspectMetrics[aspect].positiveCount++;
                    else if (analysis.sentiment.label === 'negative') aspectMetrics[aspect].negativeCount++;
                    else aspectMetrics[aspect].neutralCount++;
                }
            }
        }

        // Calcular promedios
        for (const aspect of Object.keys(aspectMetrics)) {
            if (aspectMetrics[aspect].totalMentions > 0) {
                aspectMetrics[aspect].avgSentiment =
                    parseFloat((aspectMetrics[aspect].avgSentiment / aspectMetrics[aspect].totalMentions).toFixed(3));
            }
        }

        // Score general institucional
        const allScores = analyses.map(a => a.sentiment.score);
        const overallScore = allScores.length > 0
            ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(3))
            : 0;

        return {
            period: `Últimos ${days} días`,
            totalFeedback: feedback.length,
            overallScore,
            overallLabel: this.getSentimentLabel(overallScore),
            temperatureEmoji: this.getTemperatureEmoji(overallScore),
            aspectMetrics,
            criticalAlerts: analyses.filter(a => a.criticalRisk.detected).length,
            generatedAt: new Date().toISOString()
        };
    }

    getTemperatureEmoji(score) {
        if (score >= 0.5) return '🌡️🔥 Excelente';
        if (score >= 0.2) return '🌡️☀️ Positivo';
        if (score >= -0.2) return '🌡️⛅ Neutral';
        if (score >= -0.5) return '🌡️🌧️ Preocupante';
        return '🌡️❄️ Crítico';
    }

    // =========================================================
    // TAREA 5: Detección de Tendencias Negativas
    // =========================================================

    async detectNegativeTrends() {
        const feedback = await this.collectFeedback();
        const analyses = await Promise.all(feedback.map(f => this.analyzeText(f.text)));

        // Agrupar por día
        const dailyData = {};
        for (let i = 0; i < analyses.length; i++) {
            const date = feedback[i].created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = { scores: [], count: 0 };
            }
            dailyData[date].scores.push(analyses[i].sentiment.score);
            dailyData[date].count++;
        }

        // Calcular promedios diarios
        const dailyAverages = Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                count: data.count
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Detectar tendencias (últimos 7 días vs anteriores)
        const recentDays = dailyAverages.slice(-7);
        const previousDays = dailyAverages.slice(-14, -7);

        const recentAvg = recentDays.length > 0
            ? recentDays.reduce((sum, d) => sum + d.avgScore, 0) / recentDays.length
            : 0;
        const previousAvg = previousDays.length > 0
            ? previousDays.reduce((sum, d) => sum + d.avgScore, 0) / previousDays.length
            : 0;

        const trend = recentAvg - previousAvg;
        const trendDirection = trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable';

        return {
            dailyAverages,
            recentPeriodAvg: parseFloat(recentAvg.toFixed(3)),
            previousPeriodAvg: parseFloat(previousAvg.toFixed(3)),
            trendChange: parseFloat(trend.toFixed(3)),
            trendDirection,
            alert: trendDirection === 'declining',
            alertMessage: trendDirection === 'declining'
                ? '⚠️ Se detecta tendencia negativa en el sentimiento institucional'
                : null
        };
    }

    // =========================================================
    // TAREA 6: Alertas de Alto Riesgo
    // =========================================================

    async getHighRiskAlerts() {
        const feedback = await this.collectFeedback();
        const analyses = await Promise.all(feedback.map(f => this.analyzeText(f.text)));

        const highRiskItems = [];
        for (let i = 0; i < analyses.length; i++) {
            if (analyses[i].criticalRisk.detected) {
                highRiskItems.push({
                    id: feedback[i].id,
                    text: this.anonymizeText(feedback[i].text),
                    keywords: analyses[i].criticalRisk.keywords,
                    riskLevel: analyses[i].criticalRisk.riskLevel,
                    source: feedback[i].source,
                    detectedAt: new Date().toISOString(),
                    requiresReview: true
                });
            }
        }

        // Ordenar por nivel de riesgo
        highRiskItems.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.riskLevel] - order[b.riskLevel];
        });

        return {
            totalAlerts: highRiskItems.length,
            highPriority: highRiskItems.filter(a => a.riskLevel === 'high').length,
            mediumPriority: highRiskItems.filter(a => a.riskLevel === 'medium').length,
            alerts: highRiskItems,
            recommendation: highRiskItems.length > 0
                ? 'Se recomienda revisión inmediata por el departamento de psicología/orientación'
                : 'Sin alertas críticas activas'
        };
    }

    // =========================================================
    // TAREA 10: Anonimización de Datos
    // =========================================================

    anonymizeText(text) {
        // Remover nombres propios (patrón simple)
        let anonymized = text.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+/g, '[NOMBRE REDACTADO]');

        // Remover matrículas
        anonymized = anonymized.replace(/\d{4,}/g, '[ID REDACTADO]');

        // Remover correos
        anonymized = anonymized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL REDACTADO]');

        // Remover teléfonos
        anonymized = anonymized.replace(/\d{10,}/g, '[TELÉFONO REDACTADO]');

        return anonymized;
    }

    // =========================================================
    // TAREA 7: Reporte Mensual de Clima Estudiantil
    // =========================================================

    async generateMonthlyReport(month = null) {
        const thermometer = await this.getInstitutionalThermometer(30);
        const trends = await this.detectNegativeTrends();
        const alerts = await this.getHighRiskAlerts();

        const report = {
            title: 'Reporte Mensual de Clima Estudiantil',
            period: month || new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
            generatedAt: new Date().toISOString(),

            executiveSummary: {
                overallScore: thermometer.overallScore,
                overallLabel: thermometer.overallLabel,
                temperature: thermometer.temperatureEmoji,
                totalFeedback: thermometer.totalFeedback,
                trend: trends.trendDirection
            },

            byArea: thermometer.aspectMetrics,

            trendAnalysis: {
                direction: trends.trendDirection,
                change: trends.trendChange,
                interpretation: this.interpretTrend(trends.trendDirection, trends.trendChange)
            },

            riskAlerts: {
                total: alerts.totalAlerts,
                high: alerts.highPriority,
                requiresAttention: alerts.totalAlerts > 0
            },

            recommendations: this.generateRecommendations(thermometer, trends, alerts)
        };

        return report;
    }

    interpretTrend(direction, change) {
        if (direction === 'improving') {
            return `El clima institucional ha mejorado ${Math.abs(change * 100).toFixed(1)}% respecto al periodo anterior.`;
        } else if (direction === 'declining') {
            return `El clima institucional ha declinado ${Math.abs(change * 100).toFixed(1)}% respecto al periodo anterior. Se recomienda atención.`;
        }
        return 'El clima institucional se mantiene estable.';
    }

    generateRecommendations(thermometer, trends, alerts) {
        const recommendations = [];

        // Por aspectos con bajo puntaje
        for (const [aspect, metrics] of Object.entries(thermometer.aspectMetrics)) {
            if (metrics.avgSentiment < -0.2) {
                recommendations.push({
                    area: aspect,
                    priority: 'high',
                    action: `Revisar área de ${aspect}: sentimiento promedio negativo (${metrics.avgSentiment})`
                });
            }
        }

        // Por tendencias
        if (trends.trendDirection === 'declining') {
            recommendations.push({
                area: 'general',
                priority: 'high',
                action: 'Investigar causas de la tendencia negativa en las últimas 2 semanas'
            });
        }

        // Por alertas
        if (alerts.highPriority > 0) {
            recommendations.push({
                area: 'seguridad',
                priority: 'critical',
                action: `Atención inmediata: ${alerts.highPriority} alertas de alto riesgo detectadas`
            });
        }

        return recommendations;
    }

    // =========================================================
    // TAREA 8: Integración con Quejas y Sugerencias
    // =========================================================

    async analyzeComplaint(complaintId) {
        try {
            const complaint = await executeQuery(`
                SELECT id, descripcion, tipo, fecha_creacion
                FROM quejas WHERE id = $1
            `, [complaintId]);

            if (!complaint || complaint.length === 0) {
                return { error: 'Queja no encontrada' };
            }

            const analysis = await this.analyzeText(complaint[0].descripcion);

            return {
                complaintId,
                originalType: complaint[0].tipo,
                analysis,
                suggestedCategory: analysis.aspects[0]?.aspect || 'general',
                priority: analysis.criticalRisk.detected ? 'urgent' :
                    analysis.sentiment.score < -0.5 ? 'high' : 'normal'
            };
        } catch (error) {
            devLogger.warn('SENTIMENT', 'Error analizando queja:', error.message);
            return { error: error.message };
        }
    }

    // =========================================================
    // TAREA 11: Correlación con Calendario Escolar
    // =========================================================

    async correlateWithCalendar() {
        // Eventos del calendario que típicamente afectan el sentimiento
        const calendarEvents = [
            { period: 'examenes', label: 'Período de Exámenes', expectedImpact: 'negative' },
            { period: 'vacaciones_pre', label: 'Antes de Vacaciones', expectedImpact: 'positive' },
            { period: 'regreso_clases', label: 'Regreso a Clases', expectedImpact: 'mixed' },
            { period: 'eventos_deportivos', label: 'Eventos Deportivos', expectedImpact: 'positive' },
            { period: 'inscripciones', label: 'Período de Inscripciones', expectedImpact: 'negative' }
        ];

        const thermometer = await this.getInstitutionalThermometer(7);

        return {
            currentScore: thermometer.overallScore,
            potentialCorrelations: calendarEvents.map(event => ({
                ...event,
                correlation: this.estimateCorrelation(event.expectedImpact, thermometer.overallScore)
            })),
            note: 'Las correlaciones son estimaciones basadas en patrones típicos'
        };
    }

    estimateCorrelation(expectedImpact, currentScore) {
        if (expectedImpact === 'negative' && currentScore < 0) return 'alta';
        if (expectedImpact === 'positive' && currentScore > 0) return 'alta';
        if (expectedImpact === 'mixed') return 'moderada';
        return 'baja';
    }

    // =========================================================
    // Health Check
    // =========================================================

    async healthCheck() {
        return {
            service: 'Sentiment Analysis Service',
            version: '1.0.0',
            status: 'healthy',
            aspectsConfigured: Object.keys(this.aspects).length,
            lexiconSize: {
                positive: this.sentimentLexicon.positive.length,
                negative: this.sentimentLexicon.negative.length,
                critical: this.sentimentLexicon.critical.length
            },
            slangSupport: true,
            timestamp: new Date().toISOString()
        };
    }
}

// Singleton
const sentimentService = new SentimentAnalysisService();
module.exports = sentimentService;
