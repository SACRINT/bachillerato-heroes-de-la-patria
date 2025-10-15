/**
 * 📊 SERVICIO DE ANÁLISIS DE CALIFICACIONES - Sistema Avanzado
 * Proporciona análisis estadísticos y reportes académicos detallados
 */

const fs = require('fs').promises;
const path = require('path');

class GradesAnalyticsService {
    constructor() {
        this.dbAvailable = false;
        this.dataPath = path.join(__dirname, '../data');
        this.gradesFile = path.join(this.dataPath, 'grades.json');
        this.studentsFile = path.join(this.dataPath, 'students.json');
        this.analyticsFile = path.join(this.dataPath, 'grades_analytics.json');

        console.log('📊 [GRADES ANALYTICS] Inicializando servicio de análisis...');
        this.ensureDataDirectory();
        this.initializeAnalyticsData();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
        } catch (error) {
            console.error('❌ Error creando directorio de datos:', error);
        }
    }

    async initializeAnalyticsData() {
        console.log('📈 [GRADES ANALYTICS] Inicializando datos de análisis...');

        // Datos de análisis extendidos para demo
        const analyticsData = {
            academic_periods: [
                {
                    id: "2024-2025A",
                    name: "Semestre Agosto-Diciembre 2024",
                    start_date: "2024-08-26",
                    end_date: "2024-12-20",
                    status: "active"
                },
                {
                    id: "2023-2024B",
                    name: "Semestre Febrero-Julio 2024",
                    start_date: "2024-02-05",
                    end_date: "2024-07-15",
                    status: "completed"
                }
            ],
            subjects_metadata: [
                {
                    subject: "Matemáticas V",
                    category: "Ciencias Exactas",
                    difficulty_level: 4,
                    required_average: 6.0,
                    teacher: "Prof. García Hernández",
                    credits: 8
                },
                {
                    subject: "Programación Web",
                    category: "Tecnología",
                    difficulty_level: 3,
                    required_average: 7.0,
                    teacher: "Prof. López Martínez",
                    credits: 6
                },
                {
                    subject: "Inglés V",
                    category: "Idiomas",
                    difficulty_level: 2,
                    required_average: 6.0,
                    teacher: "Prof. Johnson Smith",
                    credits: 4
                },
                {
                    subject: "Historia de México",
                    category: "Humanidades",
                    difficulty_level: 2,
                    required_average: 6.0,
                    teacher: "Prof. Rodríguez Vega",
                    credits: 4
                },
                {
                    subject: "Física II",
                    category: "Ciencias Exactas",
                    difficulty_level: 5,
                    required_average: 6.0,
                    teacher: "Prof. Martínez Silva",
                    credits: 8
                }
            ],
            performance_metrics: {
                grade_scale: {
                    "A": { min: 9.0, max: 10.0, label: "Excelente" },
                    "B": { min: 8.0, max: 8.9, label: "Muy Bueno" },
                    "C": { min: 7.0, max: 7.9, label: "Bueno" },
                    "D": { min: 6.0, max: 6.9, label: "Suficiente" },
                    "F": { min: 0.0, max: 5.9, label: "Insuficiente" }
                },
                alert_thresholds: {
                    critical: 5.9,
                    warning: 6.9,
                    good: 8.0,
                    excellent: 9.0
                }
            }
        };

        try {
            await this.writeJsonFile(this.analyticsFile, analyticsData);
            console.log('✅ [GRADES ANALYTICS] Datos de análisis inicializados');
        } catch (error) {
            console.error('❌ Error inicializando datos de análisis:', error);
        }
    }

    async readJsonFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log(`📄 Archivo no encontrado: ${path.basename(filePath)}`);
            return null;
        }
    }

    async writeJsonFile(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`❌ Error escribiendo archivo ${filePath}:`, error);
            return false;
        }
    }

    // ============================================
    // ANÁLISIS ESTADÍSTICO
    // ============================================

    async getStudentAnalytics(studentId, filters = {}) {
        try {
            const [gradesData, analyticsData] = await Promise.all([
                this.readJsonFile(this.gradesFile),
                this.readJsonFile(this.analyticsFile)
            ]);

            if (!gradesData || !analyticsData) {
                throw new Error('Datos no disponibles');
            }

            const studentGrades = gradesData.grades.filter(g => g.student_id === studentId);

            if (filters.period) {
                studentGrades.filter(g => g.periodo === filters.period);
            }

            const analytics = this.calculateStudentAnalytics(studentGrades, analyticsData);

            return {
                student_id: studentId,
                total_subjects: studentGrades.length,
                overall_average: analytics.overallAverage,
                letter_grade: this.getLetterGrade(analytics.overallAverage, analyticsData),
                performance_trend: analytics.trend,
                subject_analysis: analytics.subjectAnalysis,
                recommendations: analytics.recommendations,
                alerts: analytics.alerts,
                progress_chart_data: analytics.progressData
            };

        } catch (error) {
            console.error('❌ Error en análisis de estudiante:', error);
            throw error;
        }
    }

    calculateStudentAnalytics(grades, analyticsData) {
        if (grades.length === 0) {
            return {
                overallAverage: 0,
                trend: 'stable',
                subjectAnalysis: [],
                recommendations: [],
                alerts: [],
                progressData: []
            };
        }

        // Calcular promedio general
        const overallAverage = grades.reduce((sum, g) => sum + g.promedio, 0) / grades.length;

        // Análisis por materia
        const subjectAnalysis = grades.map(grade => {
            const metadata = analyticsData.subjects_metadata.find(s => s.subject === grade.materia);
            const performance = this.analyzeSubjectPerformance(grade, metadata, analyticsData);

            return {
                subject: grade.materia,
                current_grade: grade.promedio,
                letter_grade: this.getLetterGrade(grade.promedio, analyticsData),
                units: [
                    { unit: 1, grade: grade.unidad_1 },
                    { unit: 2, grade: grade.unidad_2 },
                    { unit: 3, grade: grade.unidad_3 }
                ],
                trend: this.calculateTrend([grade.unidad_1, grade.unidad_2, grade.unidad_3]),
                difficulty_level: metadata?.difficulty_level || 1,
                category: metadata?.category || 'General',
                teacher: metadata?.teacher || 'No asignado',
                performance_status: performance.status,
                improvement_needed: performance.improvementNeeded
            };
        });

        // Detectar tendencias
        const trend = this.calculateOverallTrend(grades);

        // Generar recomendaciones
        const recommendations = this.generateRecommendations(subjectAnalysis, overallAverage);

        // Generar alertas
        const alerts = this.generateAlerts(subjectAnalysis, overallAverage, analyticsData);

        // Datos para gráficas
        const progressData = this.generateProgressData(grades);

        return {
            overallAverage,
            trend,
            subjectAnalysis,
            recommendations,
            alerts,
            progressData
        };
    }

    analyzeSubjectPerformance(grade, metadata, analyticsData) {
        const required = metadata?.required_average || 6.0;
        const current = grade.promedio;

        let status = 'good';
        let improvementNeeded = false;

        if (current < analyticsData.performance_metrics.alert_thresholds.critical) {
            status = 'critical';
            improvementNeeded = true;
        } else if (current < analyticsData.performance_metrics.alert_thresholds.warning) {
            status = 'warning';
            improvementNeeded = true;
        } else if (current >= analyticsData.performance_metrics.alert_thresholds.excellent) {
            status = 'excellent';
        }

        return { status, improvementNeeded };
    }

    calculateTrend(grades) {
        if (grades.length < 2) return 'stable';

        const firstHalf = grades.slice(0, Math.ceil(grades.length / 2));
        const secondHalf = grades.slice(Math.floor(grades.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const difference = secondAvg - firstAvg;

        if (difference > 0.3) return 'improving';
        if (difference < -0.3) return 'declining';
        return 'stable';
    }

    calculateOverallTrend(grades) {
        const allUnits = [];
        grades.forEach(grade => {
            allUnits.push(grade.unidad_1, grade.unidad_2, grade.unidad_3);
        });

        return this.calculateTrend(allUnits);
    }

    getLetterGrade(average, analyticsData) {
        const scale = analyticsData.performance_metrics.grade_scale;

        for (const [letter, range] of Object.entries(scale)) {
            if (average >= range.min && average <= range.max) {
                return {
                    letter,
                    label: range.label,
                    numeric: average
                };
            }
        }

        return { letter: 'N/A', label: 'No calificado', numeric: average };
    }

    generateRecommendations(subjectAnalysis, overallAverage) {
        const recommendations = [];

        // Recomendaciones por promedio general
        if (overallAverage < 6.0) {
            recommendations.push({
                type: 'critical',
                title: 'Atención Urgente Requerida',
                message: 'Tu promedio general está por debajo del mínimo. Contacta a tu tutor académico.',
                action: 'schedule_meeting'
            });
        } else if (overallAverage < 7.0) {
            recommendations.push({
                type: 'warning',
                title: 'Mejora tu Rendimiento',
                message: 'Considera dedicar más tiempo al estudio y solicitar apoyo en materias difíciles.',
                action: 'study_plan'
            });
        } else if (overallAverage >= 9.0) {
            recommendations.push({
                type: 'congratulations',
                title: '¡Excelente Trabajo!',
                message: 'Mantén tu nivel de excelencia académica.',
                action: 'maintain_level'
            });
        }

        // Recomendaciones por materia
        const criticalSubjects = subjectAnalysis.filter(s => s.performance_status === 'critical');
        if (criticalSubjects.length > 0) {
            recommendations.push({
                type: 'action',
                title: 'Materias que Requieren Atención',
                message: `Enfócate en: ${criticalSubjects.map(s => s.subject).join(', ')}`,
                action: 'subject_support'
            });
        }

        return recommendations;
    }

    generateAlerts(subjectAnalysis, overallAverage, analyticsData) {
        const alerts = [];
        const thresholds = analyticsData.performance_metrics.alert_thresholds;

        // Alerta por promedio general crítico
        if (overallAverage <= thresholds.critical) {
            alerts.push({
                level: 'critical',
                type: 'academic_risk',
                message: 'Riesgo académico: Promedio por debajo del mínimo requerido',
                requires_action: true,
                suggested_actions: ['Tutoría académica', 'Plan de recuperación', 'Apoyo psicopedagógico']
            });
        }

        // Alertas por materias específicas
        subjectAnalysis.forEach(subject => {
            if (subject.current_grade <= thresholds.critical) {
                alerts.push({
                    level: 'critical',
                    type: 'subject_failure',
                    subject: subject.subject,
                    message: `${subject.subject}: Calificación crítica (${subject.current_grade})`,
                    requires_action: true,
                    suggested_actions: ['Asesorías particulares', 'Examen extraordinario']
                });
            } else if (subject.trend === 'declining') {
                alerts.push({
                    level: 'warning',
                    type: 'declining_performance',
                    subject: subject.subject,
                    message: `${subject.subject}: Tendencia descendente detectada`,
                    requires_action: false,
                    suggested_actions: ['Revisar métodos de estudio', 'Solicitar apoyo del profesor']
                });
            }
        });

        return alerts;
    }

    generateProgressData(grades) {
        const progressData = [];

        grades.forEach(grade => {
            progressData.push({
                subject: grade.materia,
                data: [
                    { period: 'Unidad 1', grade: grade.unidad_1 },
                    { period: 'Unidad 2', grade: grade.unidad_2 },
                    { period: 'Unidad 3', grade: grade.unidad_3 },
                    { period: 'Promedio', grade: grade.promedio }
                ]
            });
        });

        return progressData;
    }

    // ============================================
    // REPORTES GRUPALES
    // ============================================

    async getGroupAnalytics(filters = {}) {
        try {
            const [gradesData, studentsData, analyticsData] = await Promise.all([
                this.readJsonFile(this.gradesFile),
                this.readJsonFile(this.studentsFile),
                this.readJsonFile(this.analyticsFile)
            ]);

            if (!gradesData || !studentsData || !analyticsData) {
                throw new Error('Datos no disponibles');
            }

            let grades = gradesData.grades;
            let students = studentsData.students;

            // Aplicar filtros
            if (filters.grupo) {
                const groupStudents = students.filter(s => s.grupo === filters.grupo).map(s => s.id);
                grades = grades.filter(g => groupStudents.includes(g.student_id));
            }

            if (filters.semestre) {
                grades = grades.filter(g => g.semestre === parseInt(filters.semestre));
            }

            if (filters.materia) {
                grades = grades.filter(g => g.materia === filters.materia);
            }

            return this.calculateGroupAnalytics(grades, students, analyticsData);

        } catch (error) {
            console.error('❌ Error en análisis grupal:', error);
            throw error;
        }
    }

    calculateGroupAnalytics(grades, students, analyticsData) {
        if (grades.length === 0) {
            return {
                total_students: 0,
                subjects_analyzed: 0,
                group_statistics: {},
                performance_distribution: {},
                subject_rankings: [],
                recommendations: []
            };
        }

        // Estadísticas generales
        const uniqueStudents = [...new Set(grades.map(g => g.student_id))];
        const uniqueSubjects = [...new Set(grades.map(g => g.materia))];

        const allAverages = grades.map(g => g.promedio);
        const groupAverage = allAverages.reduce((a, b) => a + b, 0) / allAverages.length;

        const groupStatistics = {
            average: groupAverage,
            median: this.calculateMedian(allAverages),
            min: Math.min(...allAverages),
            max: Math.max(...allAverages),
            std_deviation: this.calculateStandardDeviation(allAverages)
        };

        // Distribución de rendimiento
        const performanceDistribution = this.calculatePerformanceDistribution(allAverages, analyticsData);

        // Rankings por materia
        const subjectRankings = this.calculateSubjectRankings(grades, uniqueSubjects);

        // Recomendaciones grupales
        const recommendations = this.generateGroupRecommendations(groupStatistics, performanceDistribution);

        return {
            total_students: uniqueStudents.length,
            subjects_analyzed: uniqueSubjects.length,
            group_statistics: groupStatistics,
            performance_distribution: performanceDistribution,
            subject_rankings: subjectRankings,
            top_performers: this.getTopPerformers(grades, students, 5),
            struggling_students: this.getStrugglingStudents(grades, students, analyticsData),
            recommendations
        };
    }

    calculateMedian(numbers) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }

        return sorted[middle];
    }

    calculateStandardDeviation(numbers) {
        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;

        return Math.sqrt(avgSquareDiff);
    }

    calculatePerformanceDistribution(averages, analyticsData) {
        const scale = analyticsData.performance_metrics.grade_scale;
        const distribution = {};

        Object.keys(scale).forEach(letter => {
            distribution[letter] = {
                count: 0,
                percentage: 0,
                label: scale[letter].label
            };
        });

        averages.forEach(avg => {
            const letterGrade = this.getLetterGrade(avg, analyticsData);
            distribution[letterGrade.letter].count++;
        });

        const total = averages.length;
        Object.keys(distribution).forEach(letter => {
            distribution[letter].percentage = (distribution[letter].count / total) * 100;
        });

        return distribution;
    }

    calculateSubjectRankings(grades, subjects) {
        return subjects.map(subject => {
            const subjectGrades = grades.filter(g => g.materia === subject);
            const average = subjectGrades.reduce((sum, g) => sum + g.promedio, 0) / subjectGrades.length;

            return {
                subject,
                average,
                total_students: subjectGrades.length,
                highest_grade: Math.max(...subjectGrades.map(g => g.promedio)),
                lowest_grade: Math.min(...subjectGrades.map(g => g.promedio))
            };
        }).sort((a, b) => b.average - a.average);
    }

    getTopPerformers(grades, students, limit = 5) {
        const studentAverages = {};

        grades.forEach(grade => {
            if (!studentAverages[grade.student_id]) {
                studentAverages[grade.student_id] = [];
            }
            studentAverages[grade.student_id].push(grade.promedio);
        });

        const topPerformers = Object.entries(studentAverages)
            .map(([studentId, gradesList]) => {
                const average = gradesList.reduce((a, b) => a + b, 0) / gradesList.length;
                const student = students.find(s => s.id === studentId);

                return {
                    student_id: studentId,
                    name: student ? `${student.nombre} ${student.apellido_paterno}` : 'Desconocido',
                    average,
                    subjects_count: gradesList.length
                };
            })
            .sort((a, b) => b.average - a.average)
            .slice(0, limit);

        return topPerformers;
    }

    getStrugglingStudents(grades, students, analyticsData) {
        const threshold = analyticsData.performance_metrics.alert_thresholds.warning;
        const studentAverages = {};

        grades.forEach(grade => {
            if (!studentAverages[grade.student_id]) {
                studentAverages[grade.student_id] = [];
            }
            studentAverages[grade.student_id].push(grade.promedio);
        });

        const strugglingStudents = Object.entries(studentAverages)
            .map(([studentId, gradesList]) => {
                const average = gradesList.reduce((a, b) => a + b, 0) / gradesList.length;
                const student = students.find(s => s.id === studentId);

                return {
                    student_id: studentId,
                    name: student ? `${student.nombre} ${student.apellido_paterno}` : 'Desconocido',
                    average,
                    subjects_count: gradesList.length,
                    risk_level: average <= analyticsData.performance_metrics.alert_thresholds.critical ? 'high' : 'medium'
                };
            })
            .filter(student => student.average <= threshold)
            .sort((a, b) => a.average - b.average);

        return strugglingStudents;
    }

    generateGroupRecommendations(statistics, distribution) {
        const recommendations = [];

        // Recomendación por promedio grupal
        if (statistics.average < 7.0) {
            recommendations.push({
                type: 'group_intervention',
                priority: 'high',
                title: 'Intervención Grupal Necesaria',
                description: 'El promedio grupal está por debajo del estándar esperado',
                actions: ['Reforzamiento académico', 'Talleres de técnicas de estudio', 'Evaluación curricular']
            });
        }

        // Recomendación por distribución de calificaciones
        const failingPercentage = (distribution.F?.percentage || 0);
        if (failingPercentage > 20) {
            recommendations.push({
                type: 'curriculum_review',
                priority: 'high',
                title: 'Revisión Curricular Recomendada',
                description: `${failingPercentage.toFixed(1)}% de estudiantes con calificaciones insuficientes`,
                actions: ['Revisar metodología de enseñanza', 'Capacitación docente', 'Ajustar contenidos']
            });
        }

        // Recomendación por variabilidad
        if (statistics.std_deviation > 1.5) {
            recommendations.push({
                type: 'standardization',
                priority: 'medium',
                title: 'Alta Variabilidad en Calificaciones',
                description: 'Existe una gran dispersión en el rendimiento estudiantil',
                actions: ['Nivelación académica', 'Atención diferenciada', 'Tutoría peer-to-peer']
            });
        }

        return recommendations;
    }
}

// Singleton pattern
let gradesAnalyticsServiceInstance = null;

function getGradesAnalyticsService() {
    if (!gradesAnalyticsServiceInstance) {
        gradesAnalyticsServiceInstance = new GradesAnalyticsService();
    }
    return gradesAnalyticsServiceInstance;
}

module.exports = {
    GradesAnalyticsService,
    getGradesAnalyticsService
};