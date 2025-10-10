/**
 * 📊 SISTEMA DE EVALUACIONES BGE
 * Sistema completo de evaluaciones, calificaciones y seguimiento académico
 */

class BGEEvaluationSystem {
    constructor() {
        this.evaluations = new Map();
        this.studentGrades = new Map();
        this.rubrics = new Map();
        this.academicPeriods = new Map();
        this.notifications = [];

        this.currentPeriod = 'periodo-2025-1';
        this.gradeScale = {
            excellent: { min: 9.0, max: 10.0, label: 'Excelente', color: '#28a745' },
            good: { min: 8.0, max: 8.9, label: 'Bueno', color: '#17a2b8' },
            satisfactory: { min: 7.0, max: 7.9, label: 'Satisfactorio', color: '#ffc107' },
            needs_improvement: { min: 6.0, max: 6.9, label: 'Necesita Mejorar', color: '#fd7e14' },
            unsatisfactory: { min: 0, max: 5.9, label: 'No Satisfactorio', color: '#dc3545' }
        };

        this.init();
    }

    init() {
        BGELogger?.info('Evaluation System', '📊 Inicializando Sistema de Evaluaciones BGE');

        // Cargar datos existentes
        this.loadEvaluationData();

        // Configurar períodos académicos
        this.setupAcademicPeriods();

        // Inicializar rúbricas por materia
        this.initializeRubrics();

        // Configurar notificaciones automáticas
        this.setupNotifications();

        BGELogger?.info('Evaluation System', '✅ Sistema de Evaluaciones inicializado', {
            evaluations: this.evaluations.size,
            students: this.studentGrades.size,
            currentPeriod: this.currentPeriod
        });
    }

    // Configurar períodos académicos
    setupAcademicPeriods() {
        const periods = [
            {
                id: 'periodo-2025-1',
                name: 'Período Enero-Junio 2025',
                startDate: '2025-01-15',
                endDate: '2025-06-15',
                active: true,
                partials: [
                    { id: 'parcial-1', name: '1er Parcial', weight: 0.25, startDate: '2025-01-15', endDate: '2025-02-28' },
                    { id: 'parcial-2', name: '2do Parcial', weight: 0.25, startDate: '2025-03-01', endDate: '2025-04-15' },
                    { id: 'parcial-3', name: '3er Parcial', weight: 0.25, startDate: '2025-04-16', endDate: '2025-05-30' },
                    { id: 'final', name: 'Evaluación Final', weight: 0.25, startDate: '2025-06-01', endDate: '2025-06-15' }
                ]
            }
        ];

        periods.forEach(period => {
            this.academicPeriods.set(period.id, period);
        });

        BGELogger?.debug('Evaluation System', '📅 Períodos académicos configurados', {
            totalPeriods: periods.length,
            activePeriod: this.currentPeriod
        });
    }

    // Inicializar rúbricas por materia
    initializeRubrics() {
        const subjects = [
            'matematicas', 'ciencias', 'historia', 'literatura', 'ingles',
            'quimica', 'fisica', 'biologia', 'geografia', 'civica',
            'arte', 'educacion-fisica', 'computacion'
        ];

        subjects.forEach(subject => {
            this.rubrics.set(subject, {
                subject,
                criteria: [
                    {
                        id: 'conocimiento',
                        name: 'Conocimiento del Tema',
                        weight: 0.30,
                        description: 'Dominio y comprensión del contenido académico'
                    },
                    {
                        id: 'aplicacion',
                        name: 'Aplicación Práctica',
                        weight: 0.25,
                        description: 'Capacidad de aplicar conocimientos en situaciones reales'
                    },
                    {
                        id: 'participacion',
                        name: 'Participación y Colaboración',
                        weight: 0.20,
                        description: 'Involucramiento activo en clases y trabajos en equipo'
                    },
                    {
                        id: 'tareas',
                        name: 'Tareas y Proyectos',
                        weight: 0.15,
                        description: 'Completitud y calidad de asignaciones'
                    },
                    {
                        id: 'actitud',
                        name: 'Actitud y Valores',
                        weight: 0.10,
                        description: 'Responsabilidad, respeto y compromiso académico'
                    }
                ]
            });
        });

        BGELogger?.debug('Evaluation System', '📋 Rúbricas inicializadas', {
            subjects: subjects.length,
            criteriaPerSubject: 5
        });
    }

    // Crear nueva evaluación
    createEvaluation(evaluationData) {
        const evaluationId = this.generateEvaluationId();

        const evaluation = {
            id: evaluationId,
            title: evaluationData.title,
            subject: evaluationData.subject,
            teacher: evaluationData.teacher,
            type: evaluationData.type || 'exam', // exam, project, homework, quiz
            period: evaluationData.period || this.currentPeriod,
            partial: evaluationData.partial,
            dueDate: evaluationData.dueDate,
            maxScore: evaluationData.maxScore || 10.0,
            instructions: evaluationData.instructions || '',
            rubric: this.rubrics.get(evaluationData.subject),
            students: evaluationData.students || [],
            status: 'active', // active, completed, graded
            createdAt: new Date().toISOString(),
            weight: evaluationData.weight || 1.0
        };

        this.evaluations.set(evaluationId, evaluation);

        // Notificar a estudiantes
        this.notifyStudents(evaluation, 'new_evaluation');

        BGELogger?.info('Evaluation System', '📝 Nueva evaluación creada', {
            id: evaluationId,
            title: evaluation.title,
            subject: evaluation.subject,
            students: evaluation.students.length
        });

        return evaluationId;
    }

    // Registrar calificación de estudiante
    recordGrade(studentId, evaluationId, gradeData) {
        const evaluation = this.evaluations.get(evaluationId);
        if (!evaluation) {
            BGELogger?.error('Evaluation System', 'Evaluación no encontrada', { evaluationId });
            return false;
        }

        // Crear estructura de calificación
        const grade = {
            studentId,
            evaluationId,
            score: gradeData.score,
            maxScore: evaluation.maxScore,
            percentage: (gradeData.score / evaluation.maxScore) * 100,
            letterGrade: this.calculateLetterGrade(gradeData.score),
            criteria: gradeData.criteria || {},
            feedback: gradeData.feedback || '',
            gradedBy: gradeData.teacher,
            gradedAt: new Date().toISOString(),
            status: 'final' // draft, final
        };

        // Almacenar calificación
        if (!this.studentGrades.has(studentId)) {
            this.studentGrades.set(studentId, new Map());
        }

        this.studentGrades.get(studentId).set(evaluationId, grade);

        // Actualizar estadísticas del estudiante
        this.updateStudentStatistics(studentId);

        // Notificar al estudiante
        this.notifyStudent(studentId, 'grade_received', {
            evaluation: evaluation.title,
            score: grade.score,
            letterGrade: grade.letterGrade
        });

        BGELogger?.info('Evaluation System', '✅ Calificación registrada', {
            student: studentId,
            evaluation: evaluation.title,
            score: grade.score,
            percentage: grade.percentage.toFixed(2)
        });

        return true;
    }

    // Calcular calificación en letras
    calculateLetterGrade(score) {
        for (const [level, range] of Object.entries(this.gradeScale)) {
            if (score >= range.min && score <= range.max) {
                return {
                    level,
                    label: range.label,
                    color: range.color,
                    score
                };
            }
        }
        return {
            level: 'unsatisfactory',
            label: 'No Satisfactorio',
            color: '#dc3545',
            score
        };
    }

    // Actualizar estadísticas del estudiante
    updateStudentStatistics(studentId) {
        const studentGrades = this.studentGrades.get(studentId);
        if (!studentGrades) return;

        const stats = {
            totalEvaluations: studentGrades.size,
            averageScore: 0,
            subjectAverages: new Map(),
            periodAverages: new Map(),
            trends: {
                improving: false,
                stable: false,
                declining: false
            },
            lastUpdated: new Date().toISOString()
        };

        // Calcular promedio general
        let totalPoints = 0;
        let totalMaxPoints = 0;
        const subjectScores = new Map();

        studentGrades.forEach((grade, evaluationId) => {
            const evaluation = this.evaluations.get(evaluationId);
            if (!evaluation) return;

            totalPoints += grade.score * evaluation.weight;
            totalMaxPoints += evaluation.maxScore * evaluation.weight;

            // Agrupar por materia
            if (!subjectScores.has(evaluation.subject)) {
                subjectScores.set(evaluation.subject, { points: 0, maxPoints: 0, count: 0 });
            }

            const subjectData = subjectScores.get(evaluation.subject);
            subjectData.points += grade.score * evaluation.weight;
            subjectData.maxPoints += evaluation.maxScore * evaluation.weight;
            subjectData.count++;
        });

        stats.averageScore = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 10 : 0;

        // Calcular promedios por materia
        subjectScores.forEach((data, subject) => {
            const average = data.maxPoints > 0 ? (data.points / data.maxPoints) * 10 : 0;
            stats.subjectAverages.set(subject, {
                average: average,
                evaluations: data.count,
                letterGrade: this.calculateLetterGrade(average)
            });
        });

        // Almacenar estadísticas
        const studentData = {
            studentId,
            statistics: stats,
            lastUpdated: new Date().toISOString()
        };

        // Aquí se guardaría en localStorage o base de datos
        localStorage.setItem(`student_stats_${studentId}`, JSON.stringify(studentData));

        BGELogger?.debug('Evaluation System', '📊 Estadísticas actualizadas', {
            student: studentId,
            average: stats.averageScore.toFixed(2),
            subjects: stats.subjectAverages.size
        });
    }

    // Obtener reporte de calificaciones
    getGradeReport(studentId, options = {}) {
        const studentGrades = this.studentGrades.get(studentId);
        if (!studentGrades) {
            return {
                studentId,
                message: 'No hay calificaciones registradas',
                grades: [],
                statistics: null
            };
        }

        const grades = [];
        studentGrades.forEach((grade, evaluationId) => {
            const evaluation = this.evaluations.get(evaluationId);
            if (evaluation && this.matchesFilters(evaluation, options)) {
                grades.push({
                    ...grade,
                    evaluationTitle: evaluation.title,
                    subject: evaluation.subject,
                    type: evaluation.type,
                    dueDate: evaluation.dueDate
                });
            }
        });

        // Ordenar por fecha
        grades.sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt));

        // Obtener estadísticas
        const statsData = localStorage.getItem(`student_stats_${studentId}`);
        const statistics = statsData ? JSON.parse(statsData).statistics : null;

        return {
            studentId,
            grades,
            statistics,
            generatedAt: new Date().toISOString()
        };
    }

    // Verificar filtros para reportes
    matchesFilters(evaluation, filters) {
        if (filters.subject && evaluation.subject !== filters.subject) return false;
        if (filters.period && evaluation.period !== filters.period) return false;
        if (filters.partial && evaluation.partial !== filters.partial) return false;
        if (filters.type && evaluation.type !== filters.type) return false;

        return true;
    }

    // Generar reporte académico completo
    generateAcademicReport(studentId, periodId = null) {
        const period = periodId || this.currentPeriod;
        const report = this.getGradeReport(studentId, { period });

        // Calcular promedios por parcial
        const partialAverages = new Map();
        const subjectProgress = new Map();

        report.grades.forEach(grade => {
            const evaluation = this.evaluations.get(grade.evaluationId);
            if (!evaluation) return;

            // Promedio por parcial
            if (!partialAverages.has(evaluation.partial)) {
                partialAverages.set(evaluation.partial, { total: 0, count: 0, weights: 0 });
            }
            const partialData = partialAverages.get(evaluation.partial);
            partialData.total += grade.score * evaluation.weight;
            partialData.weights += evaluation.weight;
            partialData.count++;

            // Progreso por materia
            if (!subjectProgress.has(evaluation.subject)) {
                subjectProgress.set(evaluation.subject, []);
            }
            subjectProgress.get(evaluation.subject).push({
                partial: evaluation.partial,
                score: grade.score,
                date: grade.gradedAt
            });
        });

        // Calcular promedios finales
        const finalAverages = new Map();
        partialAverages.forEach((data, partial) => {
            const average = data.weights > 0 ? data.total / data.weights : 0;
            finalAverages.set(partial, average);
        });

        const academicReport = {
            studentId,
            period,
            partialAverages: Object.fromEntries(finalAverages),
            subjectProgress: Object.fromEntries(subjectProgress),
            overallAverage: report.statistics?.averageScore || 0,
            totalEvaluations: report.grades.length,
            generatedAt: new Date().toISOString(),
            recommendations: this.generateRecommendations(report)
        };

        BGELogger?.info('Evaluation System', '📋 Reporte académico generado', {
            student: studentId,
            period,
            evaluations: academicReport.totalEvaluations,
            average: academicReport.overallAverage.toFixed(2)
        });

        return academicReport;
    }

    // Generar recomendaciones académicas
    generateRecommendations(gradeReport) {
        const recommendations = [];
        const stats = gradeReport.statistics;

        if (!stats) return recommendations;

        // Recomendaciones basadas en promedio general
        if (stats.averageScore < 7.0) {
            recommendations.push({
                type: 'academic_support',
                priority: 'high',
                title: 'Apoyo Académico Requerido',
                description: 'El promedio general indica necesidad de refuerzo académico',
                actions: [
                    'Programar sesiones de tutoría',
                    'Revisar métodos de estudio',
                    'Comunicación con padres de familia'
                ]
            });
        }

        // Recomendaciones por materia
        stats.subjectAverages?.forEach((subjectData, subject) => {
            if (subjectData.average < 6.0) {
                recommendations.push({
                    type: 'subject_improvement',
                    priority: 'high',
                    title: `Refuerzo en ${subject}`,
                    description: `Promedio bajo en ${subject}: ${subjectData.average.toFixed(2)}`,
                    actions: [
                        'Ejercicios adicionales',
                        'Explicación personalizada',
                        'Recursos de apoyo extra'
                    ]
                });
            }
        });

        return recommendations;
    }

    // Sistema de notificaciones
    notifyStudents(evaluation, type) {
        evaluation.students.forEach(studentId => {
            this.notifyStudent(studentId, type, evaluation);
        });
    }

    notifyStudent(studentId, type, data) {
        const notification = {
            id: Date.now() + Math.random(),
            studentId,
            type,
            title: this.getNotificationTitle(type),
            message: this.getNotificationMessage(type, data),
            data,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.notifications.push(notification);

        // Integración con sistema de notificaciones
        if (window.BGENotificationManager) {
            window.BGENotificationManager.addNotification(notification);
        }

        BGELogger?.debug('Evaluation System', '🔔 Notificación enviada', {
            student: studentId,
            type,
            title: notification.title
        });
    }

    getNotificationTitle(type) {
        const titles = {
            'new_evaluation': '📝 Nueva Evaluación Disponible',
            'grade_received': '📊 Calificación Recibida',
            'deadline_reminder': '⏰ Recordatorio de Entrega',
            'academic_alert': '⚠️ Alerta Académica'
        };
        return titles[type] || 'Notificación Académica';
    }

    getNotificationMessage(type, data) {
        switch (type) {
            case 'new_evaluation':
                return `Nueva evaluación "${data.title}" en ${data.subject}`;
            case 'grade_received':
                return `Calificación: ${data.score} en "${data.evaluation}"`;
            case 'deadline_reminder':
                return `Recordatorio: Entrega pendiente para "${data.title}"`;
            default:
                return 'Tienes una nueva notificación académica';
        }
    }

    // Cargar datos existentes
    loadEvaluationData() {
        try {
            const evaluationsData = localStorage.getItem('bge_evaluations');
            const gradesData = localStorage.getItem('bge_student_grades');

            if (evaluationsData) {
                const evaluations = JSON.parse(evaluationsData);
                evaluations.forEach(evaluation => {
                    this.evaluations.set(evaluation.id, evaluation);
                });
            }

            if (gradesData) {
                const grades = JSON.parse(gradesData);
                Object.entries(grades).forEach(([studentId, studentGrades]) => {
                    const gradeMap = new Map();
                    Object.entries(studentGrades).forEach(([evalId, grade]) => {
                        gradeMap.set(evalId, grade);
                    });
                    this.studentGrades.set(studentId, gradeMap);
                });
            }

            BGELogger?.debug('Evaluation System', '💾 Datos cargados desde localStorage');
        } catch (error) {
            BGELogger?.error('Evaluation System', 'Error cargando datos', error);
        }
    }

    // Guardar datos
    saveEvaluationData() {
        try {
            // Guardar evaluaciones
            const evaluationsArray = Array.from(this.evaluations.values());
            localStorage.setItem('bge_evaluations', JSON.stringify(evaluationsArray));

            // Guardar calificaciones
            const gradesObject = {};
            this.studentGrades.forEach((studentGrades, studentId) => {
                gradesObject[studentId] = Object.fromEntries(studentGrades);
            });
            localStorage.setItem('bge_student_grades', JSON.stringify(gradesObject));

            BGELogger?.debug('Evaluation System', '💾 Datos guardados en localStorage');
        } catch (error) {
            BGELogger?.error('Evaluation System', 'Error guardando datos', error);
        }
    }

    // Generar ID único para evaluación
    generateEvaluationId() {
        return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Configurar notificaciones automáticas
    setupNotifications() {
        // Auto-guardar cada 5 minutos
        setInterval(() => {
            this.saveEvaluationData();
        }, 5 * 60 * 1000);

        BGELogger?.debug('Evaluation System', '🔔 Sistema de notificaciones configurado');
    }

    // API pública para obtener estadísticas
    getSystemStatistics() {
        return {
            totalEvaluations: this.evaluations.size,
            totalStudents: this.studentGrades.size,
            totalSubjects: this.rubrics.size,
            activePeriod: this.currentPeriod,
            averageGrades: this.calculateSystemAverages(),
            lastUpdated: new Date().toISOString()
        };
    }

    // Calcular promedios del sistema
    calculateSystemAverages() {
        let totalScore = 0;
        let totalEvaluations = 0;

        this.studentGrades.forEach(studentGrades => {
            studentGrades.forEach(grade => {
                totalScore += grade.percentage;
                totalEvaluations++;
            });
        });

        return totalEvaluations > 0 ? totalScore / totalEvaluations : 0;
    }
}

// Inicialización global
window.BGEEvaluationSystem = new BGEEvaluationSystem();

// Registrar en el contexto
if (window.BGEContext) {
    window.BGEContext.registerModule('evaluation-system', window.BGEEvaluationSystem, ['logger']);
}

console.log('✅ BGE Evaluation System cargado exitosamente');