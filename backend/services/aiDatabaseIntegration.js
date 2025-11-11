/**
 * 🤖🗄️ INTEGRACIÓN AI-DATABASE BGE HÉROES DE LA PATRIA
 * Servicio de integración entre sistemas AI y base de datos real
 *
 * Fase 3: IA Avanzada - Conectar AI con datos reales
 * Versión: 3.0
 * Fecha: 26 Septiembre 2025
 */

const devLogger = require('../utils/devLogger');
const { executeQuery } = require('../config/database');
const { getLocalIAProcessor } = require('./localIAProcessor');

class AIDatabaseIntegration {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutos
        this.localIA = getLocalIAProcessor();

        // Estadísticas del sistema
        this.stats = {
            totalQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageResponseTime: 0,
            lastUpdated: null
        };
    }

    /**
     * 🎓 Obtener datos de estudiantes para recomendaciones AI
     */
    async getStudentData(studentId = null) {
        const cacheKey = `student_data_${studentId || 'all'}`;

        // Verificar cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let query, params;

            if (studentId) {
                query = `
                    SELECT
                        e.id, e.nombre, e.apellido_paterno, e.apellido_materno,
                        e.grado, e.grupo, e.numero_control, e.email,
                        e.fecha_nacimiento, e.telefono, e.estatus,
                        c.calificacion, c.materia, c.periodo, c.fecha_captura,
                        a.fecha as fecha_asistencia, a.estado as asistencia_estado,
                        COUNT(c.id) as total_calificaciones,
                        AVG(c.calificacion) as promedio_general,
                        MAX(c.fecha_captura) as ultima_calificacion
                    FROM estudiantes e
                    LEFT JOIN calificaciones c ON e.id = c.estudiante_id
                    LEFT JOIN asistencias a ON e.id = a.estudiante_id
                    WHERE e.id = ?
                    GROUP BY e.id, c.id, a.id
                    ORDER BY c.fecha_captura DESC, a.fecha DESC
                `;
                params = [studentId];
            } else {
                query = `
                    SELECT
                        e.id, e.nombre, e.apellido_paterno, e.grado, e.grupo,
                        COUNT(c.id) as total_calificaciones,
                        AVG(c.calificacion) as promedio_general,
                        COUNT(CASE WHEN a.estado = 'presente' THEN 1 END) as asistencias_presente,
                        COUNT(a.id) as total_asistencias
                    FROM estudiantes e
                    LEFT JOIN calificaciones c ON e.id = c.estudiante_id
                    LEFT JOIN asistencias a ON e.id = a.estudiante_id
                    WHERE e.estatus = 'activo'
                    GROUP BY e.id
                    ORDER BY promedio_general DESC
                    LIMIT 100
                `;
                params = [];
            }

            const students = await executeQuery(query, params);
            this.stats.totalQueries++;

            // Enriquecer datos con análisis AI
            const enrichedData = await this.enrichWithAIAnalysis(students, 'student');

            this.setCache(cacheKey, enrichedData);
            return enrichedData;

        } catch (error) {
            devLogger.error('❌ Error obteniendo datos de estudiantes:', error);

            // Fallback a datos mock si la DB falla
            return this.getMockStudentData(studentId);
        }
    }

    /**
     * 📚 Obtener datos de materias y contenido académico
     */
    async getAcademicData(materia = null, grado = null) {
        const cacheKey = `academic_data_${materia || 'all'}_${grado || 'all'}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let query = `
                SELECT
                    m.id, m.nombre as materia, m.descripcion, m.grado,
                    m.horas_semanales, m.creditos, m.semestre,
                    t.nombre as tema, t.descripcion as tema_descripcion,
                    t.objetivo, t.duracion_horas,
                    AVG(c.calificacion) as promedio_materia,
                    COUNT(DISTINCT e.id) as total_estudiantes,
                    COUNT(c.id) as total_calificaciones
                FROM materias m
                LEFT JOIN temas t ON m.id = t.materia_id
                LEFT JOIN calificaciones c ON m.id = c.materia_id
                LEFT JOIN estudiantes e ON c.estudiante_id = e.id
                WHERE 1=1
            `;

            const params = [];

            if (materia) {
                query += ' AND m.nombre LIKE ?';
                params.push(`%${materia}%`);
            }

            if (grado) {
                query += ' AND m.grado = ?';
                params.push(grado);
            }

            query += ' GROUP BY m.id, t.id ORDER BY m.grado, m.nombre, t.orden';

            const academicData = await executeQuery(query, params);
            this.stats.totalQueries++;

            // Enriquecer con análisis AI
            const enrichedData = await this.enrichWithAIAnalysis(academicData, 'academic');

            this.setCache(cacheKey, enrichedData);
            return enrichedData;

        } catch (error) {
            devLogger.error('❌ Error obteniendo datos académicos:', error);
            return this.getMockAcademicData(materia, grado);
        }
    }

    /**
     * 👨‍🏫 Obtener datos de docentes para análisis AI
     */
    async getTeacherData(teacherId = null) {
        const cacheKey = `teacher_data_${teacherId || 'all'}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let query = `
                SELECT
                    d.id, d.nombre, d.apellido_paterno, d.apellido_materno,
                    d.especialidad, d.grado_academico, d.email, d.telefono,
                    m.nombre as materia_asignada,
                    g.grado, g.grupo,
                    COUNT(DISTINCT e.id) as total_estudiantes_asignados,
                    AVG(c.calificacion) as promedio_grupo
                FROM docentes d
                LEFT JOIN materias_docentes md ON d.id = md.docente_id
                LEFT JOIN materias m ON md.materia_id = m.id
                LEFT JOIN grupos g ON md.grupo_id = g.id
                LEFT JOIN estudiantes e ON g.id = e.grupo_id
                LEFT JOIN calificaciones c ON m.id = c.materia_id AND e.id = c.estudiante_id
                WHERE d.estatus = 'activo'
            `;

            const params = [];

            if (teacherId) {
                query += ' AND d.id = ?';
                params.push(teacherId);
            }

            query += ' GROUP BY d.id, m.id, g.id ORDER BY d.apellido_paterno, d.nombre';

            const teachers = await executeQuery(query, params);
            this.stats.totalQueries++;

            // Enriquecer con análisis AI
            const enrichedData = await this.enrichWithAIAnalysis(teachers, 'teacher');

            this.setCache(cacheKey, enrichedData);
            return enrichedData;

        } catch (error) {
            devLogger.error('❌ Error obteniendo datos de docentes:', error);
            return this.getMockTeacherData(teacherId);
        }
    }

    /**
     * 📊 Obtener datos de rendimiento para análisis predictivo
     */
    async getPerformanceData(filters = {}) {
        const cacheKey = `performance_data_${JSON.stringify(filters)}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let query = `
                SELECT
                    e.id as estudiante_id, e.nombre, e.apellido_paterno,
                    e.grado, e.grupo,
                    m.nombre as materia,
                    c.calificacion, c.periodo, c.fecha_captura,
                    a.estado as asistencia, a.fecha as fecha_asistencia,
                    CASE
                        WHEN c.calificacion >= 9 THEN 'Excelente'
                        WHEN c.calificacion >= 8 THEN 'Bueno'
                        WHEN c.calificacion >= 7 THEN 'Regular'
                        WHEN c.calificacion >= 6 THEN 'Suficiente'
                        ELSE 'Insuficiente'
                    END as nivel_rendimiento,
                    COUNT(*) OVER (PARTITION BY e.id) as total_calificaciones,
                    AVG(c.calificacion) OVER (PARTITION BY e.id) as promedio_estudiante,
                    ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY c.fecha_captura DESC) as orden_calificacion
                FROM estudiantes e
                JOIN calificaciones c ON e.id = c.estudiante_id
                JOIN materias m ON c.materia_id = m.id
                LEFT JOIN asistencias a ON e.id = a.estudiante_id
                    AND DATE(a.fecha) = DATE(c.fecha_captura)
                WHERE e.estatus = 'activo'
            `;

            const params = [];

            // Aplicar filtros
            if (filters.grado) {
                query += ' AND e.grado = ?';
                params.push(filters.grado);
            }

            if (filters.materia) {
                query += ' AND m.nombre LIKE ?';
                params.push(`%${filters.materia}%`);
            }

            if (filters.periodo) {
                query += ' AND c.periodo = ?';
                params.push(filters.periodo);
            }

            if (filters.fechaInicio) {
                query += ' AND c.fecha_captura >= ?';
                params.push(filters.fechaInicio);
            }

            if (filters.fechaFin) {
                query += ' AND c.fecha_captura <= ?';
                params.push(filters.fechaFin);
            }

            query += ' ORDER BY e.grado, e.grupo, e.apellido_paterno, c.fecha_captura DESC';

            const performanceData = await executeQuery(query, params);
            this.stats.totalQueries++;

            // Analizar patrones con AI
            const aiAnalysis = await this.analyzePerformancePatterns(performanceData);

            const result = {
                rawData: performanceData,
                analysis: aiAnalysis,
                summary: this.generatePerformanceSummary(performanceData),
                timestamp: new Date().toISOString()
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            devLogger.error('❌ Error obteniendo datos de rendimiento:', error);
            return this.getMockPerformanceData(filters);
        }
    }

    /**
     * 🧠 Enriquecer datos con análisis AI
     */
    async enrichWithAIAnalysis(data, type) {
        if (!data || data.length === 0) return data;

        try {
            const enrichedData = [];

            for (const item of data) {
                const prompt = this.generateAnalysisPrompt(item, type);

                // Usar IA local para análisis
                const aiInsight = await this.localIA.process({
                    message: prompt,
                    context: { type, item },
                    systemPrompt: `Eres un experto analista educativo. Analiza los datos y proporciona insights útiles en español.`
                });

                enrichedData.push({
                    ...item,
                    aiInsights: {
                        analysis: aiInsight.text,
                        confidence: aiInsight.confidence,
                        recommendations: this.generateRecommendations(item, type),
                        timestamp: new Date().toISOString()
                    }
                });
            }

            return enrichedData;

        } catch (error) {
            devLogger.error('❌ Error en análisis AI:', error);
            // Retornar datos sin enriquecimiento si falla
            return data;
        }
    }

    /**
     * 📈 Analizar patrones de rendimiento con IA
     */
    async analyzePerformancePatterns(performanceData) {
        try {
            const patterns = {
                trends: this.identifyTrends(performanceData),
                risks: this.identifyRisks(performanceData),
                opportunities: this.identifyOpportunities(performanceData)
            };

            const prompt = `
                Analiza los siguientes patrones de rendimiento académico:

                Tendencias detectadas: ${JSON.stringify(patterns.trends)}
                Riesgos identificados: ${JSON.stringify(patterns.risks)}
                Oportunidades encontradas: ${JSON.stringify(patterns.opportunities)}

                Proporciona un análisis integral y recomendaciones específicas.
            `;

            const aiAnalysis = await this.localIA.process({
                message: prompt,
                context: { patterns, dataCount: performanceData.length },
                systemPrompt: `Eres un especialista en análisis educativo predictivo. Proporciona insights accionables en español.`
            });

            return {
                ...patterns,
                aiAnalysis: aiAnalysis.text,
                confidence: aiAnalysis.confidence,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            devLogger.error('❌ Error analizando patrones:', error);
            return null;
        }
    }

    /**
     * 🎯 Generar prompt de análisis según tipo de datos
     */
    generateAnalysisPrompt(item, type) {
        switch (type) {
            case 'student':
                return `Analiza el perfil académico del estudiante: ${item.nombre} ${item.apellido_paterno}, Grado: ${item.grado}, Promedio: ${item.promedio_general}, Total calificaciones: ${item.total_calificaciones}. Identifica fortalezas, áreas de mejora y recomendaciones específicas.`;

            case 'academic':
                return `Analiza la materia: ${item.materia}, Grado: ${item.grado}, Promedio de la materia: ${item.promedio_materia}, Total estudiantes: ${item.total_estudiantes}. Evalúa el rendimiento general y sugiere estrategias de mejora.`;

            case 'teacher':
                return `Analiza el perfil docente: ${item.nombre} ${item.apellido_paterno}, Especialidad: ${item.especialidad}, Estudiantes asignados: ${item.total_estudiantes_asignados}, Promedio del grupo: ${item.promedio_grupo}. Evalúa efectividad y proporciona recomendaciones.`;

            default:
                return `Analiza los siguientes datos educativos: ${JSON.stringify(item)}`;
        }
    }

    /**
     * 💡 Generar recomendaciones específicas
     */
    generateRecommendations(item, type) {
        const recommendations = [];

        switch (type) {
            case 'student':
                if (item.promedio_general < 7) {
                    recommendations.push('Implementar plan de apoyo académico');
                    recommendations.push('Programar tutorías personalizadas');
                }
                if (item.total_calificaciones < 5) {
                    recommendations.push('Monitorear progreso académico más frecuentemente');
                }
                break;

            case 'academic':
                if (item.promedio_materia < 7.5) {
                    recommendations.push('Revisar metodología de enseñanza');
                    recommendations.push('Implementar recursos adicionales');
                }
                break;

            case 'teacher':
                if (item.promedio_grupo < 7.5) {
                    recommendations.push('Capacitación en nuevas metodologías');
                    recommendations.push('Reducir carga de estudiantes');
                }
                break;
        }

        return recommendations;
    }

    /**
     * 📊 Identificar tendencias en los datos
     */
    identifyTrends(data) {
        // Análisis básico de tendencias
        const trends = [];

        if (data.length > 0) {
            const avgGrade = data.reduce((sum, item) => sum + (item.calificacion || 0), 0) / data.length;

            if (avgGrade > 8.5) trends.push('Rendimiento general excelente');
            else if (avgGrade < 7) trends.push('Rendimiento general por debajo del promedio');

            // Análisis por materias
            const subjectStats = {};
            data.forEach(item => {
                if (!subjectStats[item.materia]) {
                    subjectStats[item.materia] = { sum: 0, count: 0 };
                }
                subjectStats[item.materia].sum += item.calificacion || 0;
                subjectStats[item.materia].count++;
            });

            Object.keys(subjectStats).forEach(subject => {
                const avg = subjectStats[subject].sum / subjectStats[subject].count;
                if (avg < 7) {
                    trends.push(`Materia con bajo rendimiento: ${subject}`);
                }
            });
        }

        return trends;
    }

    /**
     * ⚠️ Identificar riesgos académicos
     */
    identifyRisks(data) {
        const risks = [];

        data.forEach(item => {
            if (item.calificacion < 6) {
                risks.push(`Estudiante en riesgo: ${item.nombre} en ${item.materia}`);
            }

            if (item.asistencia === 'ausente' || item.asistencia === 'falta') {
                risks.push(`Problema de asistencia: ${item.nombre}`);
            }
        });

        return risks;
    }

    /**
     * 🌟 Identificar oportunidades de mejora
     */
    identifyOpportunities(data) {
        const opportunities = [];

        // Estudiantes con potencial alto
        const highPerformers = data.filter(item => item.calificacion >= 9);
        if (highPerformers.length > 0) {
            opportunities.push('Implementar programa de excelencia académica');
        }

        // Materias con buen rendimiento general
        const subjectPerformance = {};
        data.forEach(item => {
            if (!subjectPerformance[item.materia]) {
                subjectPerformance[item.materia] = [];
            }
            subjectPerformance[item.materia].push(item.calificacion);
        });

        Object.keys(subjectPerformance).forEach(subject => {
            const avg = subjectPerformance[subject].reduce((a, b) => a + b, 0) / subjectPerformance[subject].length;
            if (avg >= 8.5) {
                opportunities.push(`Replicar metodología exitosa de ${subject}`);
            }
        });

        return opportunities;
    }

    /**
     * 📋 Generar resumen de rendimiento
     */
    generatePerformanceSummary(data) {
        if (!data || data.length === 0) return null;

        const totalStudents = new Set(data.map(item => item.estudiante_id)).size;
        const totalGrades = data.length;
        const avgGrade = data.reduce((sum, item) => sum + (item.calificacion || 0), 0) / totalGrades;

        const gradeDistribution = {
            excelente: data.filter(item => item.calificacion >= 9).length,
            bueno: data.filter(item => item.calificacion >= 8 && item.calificacion < 9).length,
            regular: data.filter(item => item.calificacion >= 7 && item.calificacion < 8).length,
            suficiente: data.filter(item => item.calificacion >= 6 && item.calificacion < 7).length,
            insuficiente: data.filter(item => item.calificacion < 6).length
        };

        return {
            totalEstudiantes: totalStudents,
            totalCalificaciones: totalGrades,
            promedioGeneral: parseFloat(avgGrade.toFixed(2)),
            distribucionCalificaciones: gradeDistribution,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 💾 Manejo de cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        this.stats.cacheMisses++;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            this.stats.cacheHits++;
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    clearCache() {
        this.cache.clear();
        devLogger.log('🗑️ Cache de integración AI-Database limpiado');
    }

    /**
     * 📊 Obtener estadísticas del servicio
     */
    getStats() {
        const hitRate = this.stats.totalQueries > 0 ?
            (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0;

        return {
            ...this.stats,
            cacheHitRate: parseFloat(hitRate.toFixed(2)),
            cacheSize: this.cache.size,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 🔧 Datos mock para fallback
     */
    getMockStudentData(studentId) {
        devLogger.log('📝 Usando datos mock de estudiantes');

        const mockData = [
            {
                id: 1,
                nombre: 'Juan Carlos',
                apellido_paterno: 'García',
                grado: '1°',
                grupo: 'A',
                promedio_general: 8.5,
                total_calificaciones: 12,
                aiInsights: {
                    analysis: 'Estudiante con buen rendimiento, muestra consistencia en todas las materias.',
                    confidence: 0.8,
                    recommendations: ['Continuar con el ritmo actual', 'Considerar actividades de enriquecimiento'],
                    timestamp: new Date().toISOString()
                }
            }
        ];

        return studentId ? mockData.filter(s => s.id === studentId) : mockData;
    }

    getMockAcademicData(materia, grado) {
        devLogger.log('📝 Usando datos mock académicos');

        return [
            {
                id: 1,
                materia: 'Matemáticas',
                grado: '1°',
                promedio_materia: 8.2,
                total_estudiantes: 25,
                aiInsights: {
                    analysis: 'Materia con rendimiento promedio alto, metodología efectiva.',
                    confidence: 0.85,
                    recommendations: ['Mantener metodología actual', 'Implementar ejercicios avanzados'],
                    timestamp: new Date().toISOString()
                }
            }
        ];
    }

    getMockTeacherData(teacherId) {
        devLogger.log('📝 Usando datos mock de docentes');

        return [
            {
                id: 1,
                nombre: 'María Elena',
                apellido_paterno: 'Rodríguez',
                especialidad: 'Matemáticas',
                total_estudiantes_asignados: 75,
                promedio_grupo: 8.3,
                aiInsights: {
                    analysis: 'Docente con excelente desempeño, metodología efectiva y buena relación con estudiantes.',
                    confidence: 0.9,
                    recommendations: ['Compartir mejores prácticas', 'Considerar para mentoría de nuevos docentes'],
                    timestamp: new Date().toISOString()
                }
            }
        ];
    }

    getMockPerformanceData(filters) {
        devLogger.log('📝 Usando datos mock de rendimiento');

        return {
            rawData: [
                {
                    estudiante_id: 1,
                    nombre: 'Juan',
                    materia: 'Matemáticas',
                    calificacion: 8.5,
                    nivel_rendimiento: 'Bueno'
                }
            ],
            analysis: {
                trends: ['Rendimiento estable'],
                risks: [],
                opportunities: ['Programa de excelencia'],
                aiAnalysis: 'Análisis basado en datos simulados para desarrollo.',
                confidence: 0.7,
                timestamp: new Date().toISOString()
            },
            summary: {
                totalEstudiantes: 1,
                promedioGeneral: 8.5,
                timestamp: new Date().toISOString()
            }
        };
    }
}

// Singleton
let aiDatabaseIntegrationInstance = null;

function getAIDatabaseIntegration() {
    if (!aiDatabaseIntegrationInstance) {
        aiDatabaseIntegrationInstance = new AIDatabaseIntegration();
    }
    return aiDatabaseIntegrationInstance;
}

module.exports = {
    AIDatabaseIntegration,
    getAIDatabaseIntegration
};