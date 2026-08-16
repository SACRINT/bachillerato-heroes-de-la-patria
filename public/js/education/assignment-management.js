/**
 * 📝 SISTEMA DE GESTIÓN DE TAREAS Y ASIGNACIONES BGE
 * Plataforma completa para creación, distribución y seguimiento de tareas académicas
 */

class BGEAssignmentManagement {
    constructor() {
        this.assignments = new Map();
        this.submissions = new Map();
        this.templates = new Map();
        this.rubrics = new Map();
        this.deadlines = new Map();
        this.notifications = [];

        this.assignmentTypes = {
            homework: 'Tarea para Casa',
            project: 'Proyecto',
            essay: 'Ensayo',
            presentation: 'Presentación',
            quiz: 'Examen Rápido',
            lab: 'Práctica de Laboratorio',
            research: 'Investigación',
            creative: 'Trabajo Creativo',
            collaborative: 'Trabajo Colaborativo'
        };

        this.statusTypes = {
            draft: 'Borrador',
            published: 'Publicada',
            in_progress: 'En Progreso',
            submitted: 'Entregada',
            late: 'Entrega Tardía',
            graded: 'Calificada',
            returned: 'Devuelta para Revisión'
        };

        this.difficultyLevels = {
            basic: { name: 'Básico', color: '#28a745', points: 1 },
            intermediate: { name: 'Intermedio', color: '#ffc107', points: 2 },
            advanced: { name: 'Avanzado', color: '#fd7e14', points: 3 },
            expert: { name: 'Experto', color: '#dc3545', points: 4 }
        };

        this.init();
    }

    init() {
        BGELogger?.info('Assignment Management', '📝 Inicializando Sistema de Gestión de Tareas');

        // Cargar datos existentes
        this.loadAssignmentData();

        // Configurar plantillas predeterminadas
        this.setupDefaultTemplates();

        // Inicializar sistema de recordatorios
        this.setupReminderSystem();

        // Configurar auto-guardado
        this.setupAutoSave();

        // Integrar con otros sistemas
        this.setupSystemIntegration();

        BGELogger?.info('Assignment Management', '✅ Sistema de Tareas inicializado', {
            assignments: this.assignments.size,
            templates: this.templates.size,
            submissions: this.submissions.size
        });
    }

    // Crear nueva asignación
    createAssignment(assignmentData) {
        const assignmentId = this.generateAssignmentId();

        const assignment = {
            id: assignmentId,
            title: assignmentData.title,
            description: assignmentData.description,
            instructions: assignmentData.instructions || '',
            type: assignmentData.type || 'homework',
            subject: assignmentData.subject,
            teacher: assignmentData.teacher,
            targetStudents: assignmentData.targetStudents || [],
            targetGroups: assignmentData.targetGroups || [],
            difficulty: assignmentData.difficulty || 'intermediate',
            estimatedTime: assignmentData.estimatedTime || 60, // minutos
            maxScore: assignmentData.maxScore || 10,
            weight: assignmentData.weight || 1.0,

            // Fechas y plazos
            createdAt: new Date().toISOString(),
            publishDate: assignmentData.publishDate || new Date().toISOString(),
            dueDate: assignmentData.dueDate,
            lateSubmissionAllowed: assignmentData.lateSubmissionAllowed !== false,
            latePenalty: assignmentData.latePenalty || 10, // porcentaje de penalización

            // Configuración de entrega
            submissionFormat: assignmentData.submissionFormat || 'text', // text, file, both
            allowedFileTypes: assignmentData.allowedFileTypes || ['.pdf', '.doc', '.docx', '.txt'],
            maxFileSize: assignmentData.maxFileSize || 10485760, // 10MB en bytes
            allowMultipleSubmissions: assignmentData.allowMultipleSubmissions !== false,
            requirePeerReview: assignmentData.requirePeerReview || false,

            // Recursos y materiales
            resources: assignmentData.resources || [],
            attachments: assignmentData.attachments || [],
            references: assignmentData.references || [],

            // Evaluación
            rubric: assignmentData.rubric || null,
            autoGrading: assignmentData.autoGrading || false,
            feedbackTemplate: assignmentData.feedbackTemplate || '',

            // Colaboración
            groupWork: assignmentData.groupWork || false,
            maxGroupSize: assignmentData.maxGroupSize || 1,
            groupSelectionMethod: assignmentData.groupSelectionMethod || 'student_choice',

            // Estado y configuración
            status: 'draft',
            visibility: assignmentData.visibility || 'students', // students, public, private
            submissions: [],
            analytics: {
                views: 0,
                downloads: 0,
                submissionRate: 0,
                averageScore: 0,
                completionTime: []
            },

            // Configuración especial
            adaptiveReleasing: assignmentData.adaptiveReleasing || false,
            prerequisites: assignmentData.prerequisites || [],
            tags: assignmentData.tags || [],
            learningObjectives: assignmentData.learningObjectives || []
        };

        this.assignments.set(assignmentId, assignment);

        // Crear recordatorios automáticos
        this.setupAssignmentReminders(assignmentId);

        BGELogger?.info('Assignment Management', '📄 Nueva asignación creada', {
            assignmentId,
            title: assignment.title,
            type: assignment.type,
            targetStudents: assignment.targetStudents.length
        });

        return assignmentId;
    }

    // Publicar asignación
    publishAssignment(assignmentId) {
        const assignment = this.assignments.get(assignmentId);
        if (!assignment) {
            BGELogger?.error('Assignment Management', 'Asignación no encontrada', { assignmentId });
            return false;
        }

        assignment.status = 'published';
        assignment.publishDate = new Date().toISOString();

        // Notificar a estudiantes objetivo
        this.notifyStudentsAboutAssignment(assignment, 'assignment_published');

        // Integrar con calendario
        if (window.BGEInteractiveCalendar) {
            window.BGEInteractiveCalendar.addEvent({
                title: `📝 ${assignment.title}`,
                date: assignment.dueDate,
                type: 'assignment',
                description: assignment.description,
                assignmentId
            });
        }

        BGELogger?.info('Assignment Management', '📢 Asignación publicada', {
            assignmentId,
            title: assignment.title,
            dueDate: assignment.dueDate
        });

        return true;
    }

    // Crear plantilla de asignación
    createTemplate(templateData) {
        const templateId = this.generateTemplateId();

        const template = {
            id: templateId,
            name: templateData.name,
            description: templateData.description,
            category: templateData.category || 'general',
            subject: templateData.subject,
            type: templateData.type,
            difficulty: templateData.difficulty,
            estimatedTime: templateData.estimatedTime,
            structure: {
                title: templateData.structure?.title || '',
                description: templateData.structure?.description || '',
                instructions: templateData.structure?.instructions || '',
                objectives: templateData.structure?.objectives || [],
                deliverables: templateData.structure?.deliverables || [],
                criteria: templateData.structure?.criteria || []
            },
            defaultSettings: {
                maxScore: templateData.defaultSettings?.maxScore || 10,
                submissionFormat: templateData.defaultSettings?.submissionFormat || 'text',
                allowedFileTypes: templateData.defaultSettings?.allowedFileTypes || ['.pdf', '.doc'],
                estimatedTime: templateData.defaultSettings?.estimatedTime || 60
            },
            rubric: templateData.rubric || null,
            tags: templateData.tags || [],
            usageCount: 0,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            createdBy: templateData.createdBy
        };

        this.templates.set(templateId, template);

        BGELogger?.info('Assignment Management', '📋 Plantilla creada', {
            templateId,
            name: template.name,
            category: template.category
        });

        return templateId;
    }

    // Crear asignación desde plantilla
    createFromTemplate(templateId, customData = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            BGELogger?.error('Assignment Management', 'Plantilla no encontrada', { templateId });
            return null;
        }

        // Combinar datos de plantilla con personalizaciones
        const assignmentData = {
            title: customData.title || template.structure.title,
            description: customData.description || template.structure.description,
            instructions: customData.instructions || template.structure.instructions,
            type: template.type,
            difficulty: template.difficulty,
            estimatedTime: template.estimatedTime,
            maxScore: template.defaultSettings.maxScore,
            submissionFormat: template.defaultSettings.submissionFormat,
            allowedFileTypes: template.defaultSettings.allowedFileTypes,
            rubric: template.rubric,
            learningObjectives: template.structure.objectives,
            ...customData
        };

        // Actualizar estadísticas de plantilla
        template.usageCount++;
        template.lastUsed = new Date().toISOString();

        const assignmentId = this.createAssignment(assignmentData);

        BGELogger?.info('Assignment Management', '📄 Asignación creada desde plantilla', {
            templateId,
            assignmentId,
            templateName: template.name
        });

        return assignmentId;
    }

    // Enviar tarea (por estudiante)
    submitAssignment(submissionData) {
        const submissionId = this.generateSubmissionId();
        const assignment = this.assignments.get(submissionData.assignmentId);

        if (!assignment) {
            BGELogger?.error('Assignment Management', 'Asignación no encontrada');
            return false;
        }

        // Verificar si la entrega está dentro del plazo
        const isLate = new Date() > new Date(assignment.dueDate);
        const canSubmitLate = assignment.lateSubmissionAllowed;

        if (isLate && !canSubmitLate) {
            BGELogger?.warn('Assignment Management', 'Entrega fuera de plazo no permitida');
            return { success: false, reason: 'late_submission_not_allowed' };
        }

        const submission = {
            id: submissionId,
            assignmentId: submissionData.assignmentId,
            studentId: submissionData.studentId,
            studentName: submissionData.studentName,
            submissionType: submissionData.submissionType || 'individual', // individual, group
            groupMembers: submissionData.groupMembers || [],

            // Contenido de la entrega
            content: {
                text: submissionData.text || '',
                files: submissionData.files || [],
                links: submissionData.links || [],
                multimedia: submissionData.multimedia || []
            },

            // Metadatos
            submittedAt: new Date().toISOString(),
            isLate: isLate,
            attempt: this.getSubmissionAttempt(submissionData.assignmentId, submissionData.studentId),
            timeSpent: submissionData.timeSpent || null,

            // Estado y evaluación
            status: isLate ? 'late' : 'submitted',
            grade: null,
            feedback: '',
            rubricScores: {},
            gradedAt: null,
            gradedBy: null,

            // Revisión por pares
            peerReviews: [],
            peerReviewsRequired: assignment.requirePeerReview ? 3 : 0,
            peerReviewsCompleted: 0,

            // Analytics
            metadata: {
                browser: submissionData.browser || 'unknown',
                device: submissionData.device || 'unknown',
                ipAddress: submissionData.ipAddress || 'unknown',
                wordCount: this.calculateWordCount(submissionData.text || ''),
                characterCount: (submissionData.text || '').length
            }
        };

        this.submissions.set(submissionId, submission);

        // Actualizar lista de entregas en la asignación
        assignment.submissions.push(submissionId);

        // Aplicar penalización por entrega tardía
        if (isLate && assignment.latePenalty > 0) {
            submission.latePenalty = assignment.latePenalty;
        }

        // Notificar al profesor
        this.notifyTeacher(assignment.teacher, 'assignment_submitted', {
            assignmentTitle: assignment.title,
            studentName: submission.studentName,
            submissionId,
            isLate
        });

        // Actualizar analytics
        this.updateAssignmentAnalytics(submissionData.assignmentId);

        BGELogger?.info('Assignment Management', '📤 Tarea entregada', {
            submissionId,
            assignmentId: submissionData.assignmentId,
            student: submission.studentName,
            isLate,
            attempt: submission.attempt
        });

        return { success: true, submissionId };
    }

    // Calificar entrega
    gradeSubmission(submissionId, gradingData) {
        const submission = this.submissions.get(submissionId);
        if (!submission) {
            BGELogger?.error('Assignment Management', 'Entrega no encontrada', { submissionId });
            return false;
        }

        const assignment = this.assignments.get(submission.assignmentId);
        if (!assignment) {
            BGELogger?.error('Assignment Management', 'Asignación no encontrada');
            return false;
        }

        // Calcular calificación final
        let finalScore = gradingData.score || 0;

        // Aplicar penalización por entrega tardía
        if (submission.isLate && submission.latePenalty) {
            const penalty = (finalScore * submission.latePenalty) / 100;
            finalScore = Math.max(0, finalScore - penalty);
        }

        // Actualizar entrega
        submission.grade = finalScore;
        submission.feedback = gradingData.feedback || '';
        submission.rubricScores = gradingData.rubricScores || {};
        submission.gradedAt = new Date().toISOString();
        submission.gradedBy = gradingData.gradedBy;
        submission.status = 'graded';

        // Notificar al estudiante
        this.notifyStudent(submission.studentId, 'assignment_graded', {
            assignmentTitle: assignment.title,
            grade: finalScore,
            maxScore: assignment.maxScore,
            feedback: submission.feedback
        });

        // Integrar con sistema de evaluaciones si está disponible
        if (window.BGEEvaluationSystem) {
            window.BGEEvaluationSystem.recordGrade(submission.studentId, submission.assignmentId, {
                score: finalScore,
                feedback: submission.feedback,
                teacher: gradingData.gradedBy
            });
        }

        // Actualizar portfolio del estudiante si está disponible
        if (window.BGEStudentPortfolio) {
            window.BGEStudentPortfolio.updateCompetencyProgress(
                submission.studentId,
                'academic',
                assignment.subject,
                {
                    newLevel: this.calculateCompetencyLevel(finalScore),
                    evidence: assignment.title,
                    assessor: gradingData.gradedBy
                }
            );
        }

        BGELogger?.info('Assignment Management', '✅ Entrega calificada', {
            submissionId,
            student: submission.studentName,
            grade: finalScore,
            maxScore: assignment.maxScore
        });

        return true;
    }

    // Calcular nivel de competencia basado en calificación
    calculateCompetencyLevel(score) {
        if (score >= 9.0) return 4; // Experto
        if (score >= 8.0) return 3; // Avanzado
        if (score >= 7.0) return 2; // Intermedio
        if (score >= 6.0) return 1; // Básico
        return 0; // Novato
    }

    // Obtener entregas de una asignación
    getAssignmentSubmissions(assignmentId, filters = {}) {
        const assignment = this.assignments.get(assignmentId);
        if (!assignment) return [];

        let submissions = assignment.submissions.map(id => this.submissions.get(id))
            .filter(submission => submission);

        // Aplicar filtros
        if (filters.status) {
            submissions = submissions.filter(s => s.status === filters.status);
        }

        if (filters.isLate !== undefined) {
            submissions = submissions.filter(s => s.isLate === filters.isLate);
        }

        if (filters.graded !== undefined) {
            submissions = submissions.filter(s => (s.grade !== null) === filters.graded);
        }

        // Ordenar por fecha de entrega
        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        return submissions;
    }

    // Generar reporte de asignación
    generateAssignmentReport(assignmentId) {
        const assignment = this.assignments.get(assignmentId);
        if (!assignment) return null;

        const submissions = this.getAssignmentSubmissions(assignmentId);
        const totalStudents = assignment.targetStudents.length;
        const submittedCount = submissions.length;
        const gradedCount = submissions.filter(s => s.grade !== null).length;
        const lateCount = submissions.filter(s => s.isLate).length;

        const scores = submissions.filter(s => s.grade !== null).map(s => s.grade);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        const report = {
            assignmentId,
            assignmentTitle: assignment.title,
            subject: assignment.subject,
            teacher: assignment.teacher,
            createdAt: assignment.createdAt,
            dueDate: assignment.dueDate,

            statistics: {
                totalStudents,
                submissionRate: totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0,
                submittedCount,
                gradedCount,
                lateCount,
                pendingGrades: submittedCount - gradedCount,

                scores: {
                    average: averageScore,
                    highest: scores.length > 0 ? Math.max(...scores) : 0,
                    lowest: scores.length > 0 ? Math.min(...scores) : 0,
                    distribution: this.calculateScoreDistribution(scores, assignment.maxScore)
                },

                timing: {
                    averageTimeSpent: this.calculateAverageTimeSpent(submissions),
                    submissionPattern: this.analyzeSubmissionPattern(submissions, assignment.dueDate)
                }
            },

            submissions: submissions.map(s => ({
                studentId: s.studentId,
                studentName: s.studentName,
                submittedAt: s.submittedAt,
                isLate: s.isLate,
                grade: s.grade,
                status: s.status,
                attempt: s.attempt
            })),

            recommendations: this.generateAssignmentRecommendations(assignment, submissions),
            generatedAt: new Date().toISOString()
        };

        BGELogger?.info('Assignment Management', '📊 Reporte de asignación generado', {
            assignmentId,
            submissionRate: report.statistics.submissionRate.toFixed(2),
            averageScore: report.statistics.scores.average.toFixed(2)
        });

        return report;
    }

    // Calcular distribución de calificaciones
    calculateScoreDistribution(scores, maxScore) {
        const ranges = {
            'Excelente (9-10)': 0,
            'Bueno (8-8.9)': 0,
            'Satisfactorio (7-7.9)': 0,
            'Necesita Mejorar (6-6.9)': 0,
            'No Satisfactorio (0-5.9)': 0
        };

        scores.forEach(score => {
            const percentage = (score / maxScore) * 10;
            if (percentage >= 9) ranges['Excelente (9-10)']++;
            else if (percentage >= 8) ranges['Bueno (8-8.9)']++;
            else if (percentage >= 7) ranges['Satisfactorio (7-7.9)']++;
            else if (percentage >= 6) ranges['Necesita Mejorar (6-6.9)']++;
            else ranges['No Satisfactorio (0-5.9)']++;
        });

        return ranges;
    }

    // Analizar patrón de entregas
    analyzeSubmissionPattern(submissions, dueDate) {
        const dueDateObj = new Date(dueDate);
        const patterns = {
            early: 0, // Más de 24h antes
            onTime: 0, // Dentro de las últimas 24h
            late: 0
        };

        submissions.forEach(submission => {
            const submissionDate = new Date(submission.submittedAt);
            const hoursDifference = (dueDateObj - submissionDate) / (1000 * 60 * 60);

            if (submission.isLate) {
                patterns.late++;
            } else if (hoursDifference > 24) {
                patterns.early++;
            } else {
                patterns.onTime++;
            }
        });

        return patterns;
    }

    // Generar recomendaciones para asignación
    generateAssignmentRecommendations(assignment, submissions) {
        const recommendations = [];
        const submissionRate = submissions.length / assignment.targetStudents.length;
        const averageScore = submissions.filter(s => s.grade !== null)
            .reduce((acc, s) => acc + s.grade, 0) / submissions.filter(s => s.grade !== null).length;

        // Recomendaciones basadas en tasa de entrega
        if (submissionRate < 0.7) {
            recommendations.push({
                type: 'submission_rate',
                priority: 'high',
                title: 'Baja Tasa de Entrega',
                description: `Solo ${(submissionRate * 100).toFixed(1)}% de los estudiantes han entregado`,
                actions: [
                    'Enviar recordatorios a estudiantes faltantes',
                    'Revisar si las instrucciones son claras',
                    'Considerar extender la fecha límite'
                ]
            });
        }

        // Recomendaciones basadas en calificaciones
        if (averageScore < 7.0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Promedio Bajo de Calificaciones',
                description: `El promedio actual es ${averageScore.toFixed(1)}`,
                actions: [
                    'Revisar si la dificultad es apropiada',
                    'Proporcionar recursos adicionales',
                    'Considerar sesiones de refuerzo'
                ]
            });
        }

        return recommendations;
    }

    // Configurar recordatorios de asignación
    setupAssignmentReminders(assignmentId) {
        const assignment = this.assignments.get(assignmentId);
        if (!assignment || !assignment.dueDate) return;

        const dueDate = new Date(assignment.dueDate);
        const now = new Date();

        // Recordatorio 3 días antes
        const reminder3Days = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        if (reminder3Days > now) {
            this.scheduleReminder(assignmentId, reminder3Days, '3 días');
        }

        // Recordatorio 1 día antes
        const reminder1Day = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
        if (reminder1Day > now) {
            this.scheduleReminder(assignmentId, reminder1Day, '1 día');
        }

        // Recordatorio 2 horas antes
        const reminder2Hours = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000);
        if (reminder2Hours > now) {
            this.scheduleReminder(assignmentId, reminder2Hours, '2 horas');
        }
    }

    // Programar recordatorio
    scheduleReminder(assignmentId, reminderDate, timeText) {
        const timeUntilReminder = reminderDate.getTime() - Date.now();

        if (timeUntilReminder > 0) {
            setTimeout(() => {
                this.sendAssignmentReminder(assignmentId, timeText);
            }, timeUntilReminder);
        }
    }

    // Enviar recordatorio de asignación
    sendAssignmentReminder(assignmentId, timeText) {
        const assignment = this.assignments.get(assignmentId);
        if (!assignment) return;

        // Encontrar estudiantes que no han entregado
        const submittedStudents = new Set();
        assignment.submissions.forEach(submissionId => {
            const submission = this.submissions.get(submissionId);
            if (submission) {
                submittedStudents.add(submission.studentId);
            }
        });

        const pendingStudents = assignment.targetStudents.filter(
            studentId => !submittedStudents.has(studentId)
        );

        // Enviar recordatorios
        pendingStudents.forEach(studentId => {
            this.notifyStudent(studentId, 'assignment_reminder', {
                assignmentTitle: assignment.title,
                timeRemaining: timeText,
                dueDate: assignment.dueDate
            });
        });

        BGELogger?.info('Assignment Management', '⏰ Recordatorios enviados', {
            assignmentId,
            assignmentTitle: assignment.title,
            pendingStudents: pendingStudents.length,
            timeRemaining: timeText
        });
    }

    // Métodos de notificación
    notifyStudentsAboutAssignment(assignment, type) {
        assignment.targetStudents.forEach(studentId => {
            this.notifyStudent(studentId, type, {
                assignmentTitle: assignment.title,
                dueDate: assignment.dueDate,
                subject: assignment.subject
            });
        });
    }

    notifyStudent(studentId, type, data) {
        const notification = {
            id: this.generateNotificationId(),
            userId: studentId,
            type,
            title: this.getNotificationTitle(type),
            content: this.getNotificationContent(type, data),
            data,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.notifications.push(notification);

        // Integración con sistema de notificaciones
        if (window.BGENotificationManager) {
            window.BGENotificationManager.addNotification(notification);
        }

        BGELogger?.debug('Assignment Management', '🔔 Notificación enviada', {
            studentId,
            type,
            title: notification.title
        });
    }

    notifyTeacher(teacherId, type, data) {
        // Similar a notifyStudent pero para profesores
        this.notifyStudent(teacherId, type, data);
    }

    // Métodos auxiliares
    getSubmissionAttempt(assignmentId, studentId) {
        const submissions = Array.from(this.submissions.values())
            .filter(s => s.assignmentId === assignmentId && s.studentId === studentId);
        return submissions.length + 1;
    }

    calculateWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    calculateAverageTimeSpent(submissions) {
        const timeSpentValues = submissions
            .map(s => s.timeSpent)
            .filter(time => time !== null && time > 0);

        return timeSpentValues.length > 0 ?
            timeSpentValues.reduce((a, b) => a + b, 0) / timeSpentValues.length : 0;
    }

    updateAssignmentAnalytics(assignmentId) {
        const assignment = this.assignments.get(assignmentId);
        if (!assignment) return;

        const submissions = this.getAssignmentSubmissions(assignmentId);
        const gradedSubmissions = submissions.filter(s => s.grade !== null);

        assignment.analytics.submissionRate = assignment.targetStudents.length > 0 ?
            (submissions.length / assignment.targetStudents.length) * 100 : 0;

        assignment.analytics.averageScore = gradedSubmissions.length > 0 ?
            gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length : 0;

        assignment.analytics.completionTime = submissions
            .map(s => s.timeSpent)
            .filter(time => time !== null);
    }

    // Configurar plantillas predeterminadas
    setupDefaultTemplates() {
        const defaultTemplates = [
            {
                name: 'Ensayo Académico',
                description: 'Plantilla para ensayos y trabajos escritos',
                category: 'writing',
                type: 'essay',
                difficulty: 'intermediate',
                estimatedTime: 120,
                structure: {
                    title: 'Ensayo sobre [Tema]',
                    description: 'Redacta un ensayo argumentativo sobre el tema asignado',
                    instructions: '1. Introduce el tema\n2. Desarrolla argumentos\n3. Incluye conclusiones',
                    objectives: ['Desarrollar pensamiento crítico', 'Mejorar redacción', 'Investigar fuentes'],
                    deliverables: ['Ensayo de 1000-1500 palabras', 'Bibliografía mínima de 3 fuentes']
                }
            },
            {
                name: 'Proyecto de Investigación',
                description: 'Plantilla para proyectos de investigación',
                category: 'research',
                type: 'research',
                difficulty: 'advanced',
                estimatedTime: 300,
                structure: {
                    title: 'Proyecto de Investigación en [Materia]',
                    description: 'Desarrolla una investigación sobre un tema específico',
                    instructions: '1. Selecciona tema\n2. Investiga fuentes\n3. Analiza datos\n4. Presenta resultados',
                    objectives: ['Desarrollar habilidades de investigación', 'Análisis crítico', 'Presentación de resultados']
                }
            }
        ];

        defaultTemplates.forEach(templateData => {
            this.createTemplate(templateData);
        });
    }

    // Configurar sistema de recordatorios
    setupReminderSystem() {
        // Verificar recordatorios cada hora
        setInterval(() => {
            this.checkPendingReminders();
        }, 60 * 60 * 1000);
    }

    checkPendingReminders() {
        // Lógica para verificar recordatorios pendientes
        BGELogger?.debug('Assignment Management', '⏰ Verificando recordatorios pendientes');
    }

    // Configurar integración con otros sistemas
    setupSystemIntegration() {
        // Registrar eventos para integración con calendario, evaluaciones, etc.
        BGELogger?.debug('Assignment Management', '🔗 Integración con otros sistemas configurada');
    }

    // Obtener títulos y contenidos de notificaciones
    getNotificationTitle(type) {
        const titles = {
            'assignment_published': '📝 Nueva Tarea Disponible',
            'assignment_submitted': '📤 Tarea Entregada',
            'assignment_graded': '✅ Tarea Calificada',
            'assignment_reminder': '⏰ Recordatorio de Tarea',
            'assignment_overdue': '🚨 Tarea Vencida'
        };
        return titles[type] || 'Notificación de Tarea';
    }

    getNotificationContent(type, data) {
        switch (type) {
            case 'assignment_published':
                return `Nueva tarea "${data.assignmentTitle}" disponible. Fecha límite: ${new Date(data.dueDate).toLocaleDateString()}`;
            case 'assignment_graded':
                return `Tu tarea "${data.assignmentTitle}" ha sido calificada: ${data.grade}/${data.maxScore}`;
            case 'assignment_reminder':
                return `Recordatorio: "${data.assignmentTitle}" vence en ${data.timeRemaining}`;
            default:
                return 'Nueva actividad en el sistema de tareas';
        }
    }

    // Persistencia de datos
    loadAssignmentData() {
        try {
            const assignmentsData = localStorage.getItem('bge_assignments');
            const submissionsData = localStorage.getItem('bge_submissions');
            const templatesData = localStorage.getItem('bge_assignment_templates');

            if (assignmentsData) {
                const assignments = JSON.parse(assignmentsData);
                assignments.forEach(assignment => this.assignments.set(assignment.id, assignment));
            }

            if (submissionsData) {
                const submissions = JSON.parse(submissionsData);
                submissions.forEach(submission => this.submissions.set(submission.id, submission));
            }

            if (templatesData) {
                const templates = JSON.parse(templatesData);
                templates.forEach(template => this.templates.set(template.id, template));
            }

            BGELogger?.debug('Assignment Management', '💾 Datos de tareas cargados');
        } catch (error) {
            BGELogger?.error('Assignment Management', 'Error cargando datos', error);
        }
    }

    saveAssignmentData() {
        try {
            localStorage.setItem('bge_assignments', JSON.stringify(Array.from(this.assignments.values())));
            localStorage.setItem('bge_submissions', JSON.stringify(Array.from(this.submissions.values())));
            localStorage.setItem('bge_assignment_templates', JSON.stringify(Array.from(this.templates.values())));

            BGELogger?.debug('Assignment Management', '💾 Datos de tareas guardados');
        } catch (error) {
            BGELogger?.error('Assignment Management', 'Error guardando datos', error);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveAssignmentData();
        }, 3 * 60 * 1000); // Cada 3 minutos
    }

    // Generadores de ID
    generateAssignmentId() {
        return `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSubmissionId() {
        return `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTemplateId() {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // API pública
    getSystemStatistics() {
        return {
            totalAssignments: this.assignments.size,
            totalSubmissions: this.submissions.size,
            totalTemplates: this.templates.size,
            pendingGrades: Array.from(this.submissions.values()).filter(s => s.grade === null).length,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Inicialización global
window.BGEAssignmentManagement = new BGEAssignmentManagement();

// Registrar en el contexto
if (window.BGEContext) {
    window.BGEContext.registerModule('assignment-management', window.BGEAssignmentManagement, ['logger']);
}

void 0;