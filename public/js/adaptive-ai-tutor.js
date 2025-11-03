/**
 * 🧠 TUTOR IA PERSONALIZADO ADAPTATIVO
 * Portal BGE Héroes de la Patria
 * Sistema de tutoría inteligente que se adapta al estilo y ritmo de aprendizaje del estudiante
 */

class AdaptiveAITutor {
    constructor() {
        this.studentProfile = null;
        this.learningSession = null;
        this.adaptationEngine = null;
        this.knowledgeGraph = new Map();
        this.tutorialStrategies = new Map();
        this.assessmentEngine = null;
        this.emotionalState = 'neutral';
        this.difficultyLevel = 1;
        this.sessionHistory = [];
        this.personalityTraits = {};
        this.learningGoals = [];
        this.currentTopic = null;

        this.initializeAdaptiveTutor();
        this.setupTutorialStrategies();
        this.setupKnowledgeGraph();
        this.setupAssessmentEngine();
        this.loadStudentData();
    }

    initializeAdaptiveTutor() {
        this.adaptationEngine = {
            learningStyles: ['visual', 'auditivo', 'kinestesico', 'lectura'],
            difficultyAdaptation: {
                increment: 0.2,
                decrement: 0.3,
                maxLevel: 10,
                minLevel: 1
            },
            responsePatterns: new Map(),
            performanceMetrics: {
                accuracy: 0,
                speed: 0,
                engagement: 0,
                retention: 0
            }
        };

        this.startNewSession();
    }

    setupTutorialStrategies() {
        // Estrategias por estilo de aprendizaje
        this.tutorialStrategies.set('visual', {
            presentationMethods: ['diagramas', 'graficos', 'mapas_mentales', 'videos', 'infografias'],
            explanationStyle: 'descriptivo_visual',
            feedbackType: 'visual_progress',
            exerciseTypes: ['matching_visual', 'drag_drop', 'timeline', 'flowchart']
        });

        this.tutorialStrategies.set('auditivo', {
            presentationMethods: ['explicaciones_verbales', 'podcasts', 'musica_mnemonicos', 'discusiones'],
            explanationStyle: 'narrativo_verbal',
            feedbackType: 'audio_feedback',
            exerciseTypes: ['listening_comprehension', 'verbal_repetition', 'rhythm_patterns']
        });

        this.tutorialStrategies.set('kinestesico', {
            presentationMethods: ['experimentos', 'simulaciones', 'juegos_movimiento', 'laboratorios_virtuales'],
            explanationStyle: 'learning_by_doing',
            feedbackType: 'haptic_feedback',
            exerciseTypes: ['hands_on', 'simulation', 'role_playing', 'building_exercises']
        });

        this.tutorialStrategies.set('lectura', {
            presentationMethods: ['textos_estructurados', 'articulos', 'notas_detalladas', 'resumenes'],
            explanationStyle: 'texto_formal',
            feedbackType: 'written_detailed',
            exerciseTypes: ['essay_writing', 'text_analysis', 'research_tasks', 'note_taking']
        });

        // Estrategias por nivel de dificultad
        this.tutorialStrategies.set('difficulty_strategies', {
            beginner: {
                explanation_depth: 'simple',
                examples_count: 5,
                practice_repetition: 3,
                scaffolding_level: 'high'
            },
            intermediate: {
                explanation_depth: 'moderate',
                examples_count: 3,
                practice_repetition: 2,
                scaffolding_level: 'medium'
            },
            advanced: {
                explanation_depth: 'comprehensive',
                examples_count: 2,
                practice_repetition: 1,
                scaffolding_level: 'low'
            }
        });
    }

    setupKnowledgeGraph() {
        // Grafo de conocimiento por materia
        this.knowledgeGraph.set('mathematics', {
            topics: {
                algebra: {
                    prerequisites: ['operaciones_basicas'],
                    subtopics: ['ecuaciones_lineales', 'sistemas_ecuaciones', 'funciones'],
                    difficulty: 3,
                    estimatedTime: 45
                },
                geometria: {
                    prerequisites: ['algebra'],
                    subtopics: ['triangulos', 'circulos', 'areas_volumenes'],
                    difficulty: 4,
                    estimatedTime: 60
                },
                calculo: {
                    prerequisites: ['algebra', 'geometria'],
                    subtopics: ['limites', 'derivadas', 'integrales'],
                    difficulty: 8,
                    estimatedTime: 90
                }
            },
            connections: new Map(),
            masteryLevels: new Map()
        });

        this.knowledgeGraph.set('physics', {
            topics: {
                mecanica: {
                    prerequisites: ['matematicas_basicas'],
                    subtopics: ['cinematica', 'dinamica', 'energia'],
                    difficulty: 5,
                    estimatedTime: 50
                },
                termodinamica: {
                    prerequisites: ['mecanica'],
                    subtopics: ['calor', 'temperatura', 'entropia'],
                    difficulty: 6,
                    estimatedTime: 55
                },
                electromagnetismo: {
                    prerequisites: ['mecanica', 'calculo'],
                    subtopics: ['campos_electricos', 'campos_magneticos', 'ondas'],
                    difficulty: 7,
                    estimatedTime: 70
                }
            },
            connections: new Map(),
            masteryLevels: new Map()
        });

        this.knowledgeGraph.set('chemistry', {
            topics: {
                estructura_atomica: {
                    prerequisites: [],
                    subtopics: ['atomos', 'enlaces', 'moleculas'],
                    difficulty: 3,
                    estimatedTime: 40
                },
                reacciones_quimicas: {
                    prerequisites: ['estructura_atomica'],
                    subtopics: ['balanceo', 'estequiometria', 'cinetica'],
                    difficulty: 5,
                    estimatedTime: 60
                },
                quimica_organica: {
                    prerequisites: ['estructura_atomica', 'reacciones_quimicas'],
                    subtopics: ['hidrocarburos', 'grupos_funcionales', 'polimeros'],
                    difficulty: 7,
                    estimatedTime: 80
                }
            },
            connections: new Map(),
            masteryLevels: new Map()
        });
    }

    setupAssessmentEngine() {
        this.assessmentEngine = {
            questionTypes: ['multiple_choice', 'open_ended', 'problem_solving', 'conceptual'],
            adaptiveScoring: {
                correct_fast: 1.2,
                correct_normal: 1.0,
                correct_slow: 0.8,
                incorrect: -0.5,
                partially_correct: 0.6
            },
            diagnosticTests: new Map(),
            masteryThreshold: 0.8,
            retentionTestInterval: 7 * 24 * 60 * 60 * 1000, // 7 días
            forgettingCurve: {
                immediate: 1.0,
                day1: 0.75,
                day7: 0.35,
                day30: 0.21
            }
        };
    }

    startNewSession() {
        this.learningSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            currentTopic: null,
            completedActivities: [],
            currentDifficulty: this.difficultyLevel,
            responseTime: [],
            accuracyRate: 0,
            engagementLevel: 0,
            stressLevel: 0,
            adaptationsMade: [],
            learningPath: [],
            goals: [],
            achievements: []
        };
    }

    async analyzeStudent(studentData) {
        // Análisis inicial del estudiante
        this.studentProfile = {
            id: studentData.id,
            learningStyle: await this.determineLearningStyle(studentData),
            cognitiveLoad: this.assessCognitiveLoad(studentData),
            priorKnowledge: await this.assessPriorKnowledge(studentData),
            motivationLevel: this.assessMotivation(studentData),
            preferredPace: this.determinePace(studentData),
            strengthAreas: [],
            improvementAreas: [],
            personalityProfile: await this.analyzePersonality(studentData)
        };

        this.adaptTutoringStrategy();
        return this.studentProfile;
    }

    async determineLearningStyle(studentData) {
        // Algoritmo de determinación de estilo de aprendizaje
        const responses = studentData.learningStyleQuiz || {};
        const behaviorData = studentData.behaviorHistory || [];

        const scores = {
            visual: 0,
            auditivo: 0,
            kinestesico: 0,
            lectura: 0
        };

        // Análisis de respuestas del cuestionario
        Object.entries(responses).forEach(([question, answer]) => {
            const weights = this.getLearningStyleWeights(question, answer);
            Object.entries(weights).forEach(([style, weight]) => {
                scores[style] += weight;
            });
        });

        // Análisis de comportamiento histórico
        behaviorData.forEach(activity => {
            const styleIndicators = this.extractStyleIndicators(activity);
            Object.entries(styleIndicators).forEach(([style, score]) => {
                scores[style] += score;
            });
        });

        // Determinar estilo dominante
        const dominantStyle = Object.entries(scores).reduce((a, b) =>
            scores[a[0]] > scores[b[0]] ? a : b
        )[0];

        return {
            primary: dominantStyle,
            scores: scores,
            confidence: this.calculateConfidence(scores)
        };
    }

    async presentContent(topic, content) {
        const strategy = this.getCurrentStrategy();
        const adaptedContent = await this.adaptContent(content, strategy);

        const presentation = {
            topic: topic,
            content: adaptedContent,
            method: strategy.presentationMethods[0],
            difficulty: this.learningSession.currentDifficulty,
            estimatedTime: this.estimateCompletionTime(content),
            interactiveElements: this.generateInteractiveElements(content, strategy),
            assessmentPoints: this.identifyAssessmentPoints(content)
        };

        this.trackPresentationStart(presentation);
        return presentation;
    }

    async adaptContent(rawContent, strategy) {
        const adaptedContent = {
            text: this.adaptTextComplexity(rawContent.text),
            examples: this.selectOptimalExamples(rawContent.examples, strategy),
            exercises: this.generateAdaptiveExercises(rawContent.topic, strategy),
            multimedia: this.selectMultimediaContent(rawContent.multimedia, strategy),
            scaffolding: this.generateScaffolding(rawContent, strategy)
        };

        // Personalización adicional basada en el perfil del estudiante
        if (this.studentProfile.learningStyle.primary === 'visual') {
            adaptedContent.visualAids = this.generateVisualAids(rawContent);
        } else if (this.studentProfile.learningStyle.primary === 'auditivo') {
            adaptedContent.audioNarration = this.generateAudioNarration(rawContent);
        }

        return adaptedContent;
    }

    async processStudentResponse(response) {
        const analysis = {
            correctness: this.assessCorrectness(response),
            responseTime: Date.now() - response.startTime,
            confidence: response.confidence || 0.5,
            reasoning: response.reasoning || '',
            engagement: this.assessEngagement(response)
        };

        // Actualizar métricas de rendimiento
        this.updatePerformanceMetrics(analysis);

        // Determinar si es necesario adaptar
        const adaptationNeeded = this.shouldAdapt(analysis);

        if (adaptationNeeded) {
            await this.makeAdaptations(analysis);
        }

        // Proporcionar feedback personalizado
        const feedback = await this.generatePersonalizedFeedback(analysis);

        // Actualizar estado emocional estimado
        this.updateEmotionalState(analysis);

        this.learningSession.responseTime.push(analysis.responseTime);
        this.learningSession.accuracyRate = this.calculateAccuracyRate();

        return {
            analysis: analysis,
            feedback: feedback,
            nextAction: this.determineNextAction(analysis),
            adaptationsMade: this.learningSession.adaptationsMade
        };
    }

    shouldAdapt(analysis) {
        const criteria = {
            accuracyTooLow: analysis.correctness < 0.6,
            accuracyTooHigh: analysis.correctness > 0.9,
            responseTooSlow: analysis.responseTime > this.getExpectedResponseTime() * 1.5,
            responseTooFast: analysis.responseTime < this.getExpectedResponseTime() * 0.5,
            lowEngagement: analysis.engagement < 0.4,
            lowConfidence: analysis.confidence < 0.3
        };

        return Object.values(criteria).some(criterion => criterion);
    }

    async makeAdaptations(analysis) {
        const adaptations = [];

        // Adaptar dificultad
        if (analysis.correctness < 0.6) {
            this.decreaseDifficulty();
            adaptations.push('difficulty_decreased');
        } else if (analysis.correctness > 0.9) {
            this.increaseDifficulty();
            adaptations.push('difficulty_increased');
        }

        // Adaptar estrategia de presentación
        if (analysis.engagement < 0.4) {
            this.changeStrategyMode();
            adaptations.push('strategy_changed');
        }

        // Adaptar ritmo
        if (analysis.responseTime > this.getExpectedResponseTime() * 1.5) {
            this.adjustPacing('slower');
            adaptations.push('pace_slowed');
        } else if (analysis.responseTime < this.getExpectedResponseTime() * 0.5) {
            this.adjustPacing('faster');
            adaptations.push('pace_increased');
        }

        // Proporcionar apoyo adicional
        if (analysis.confidence < 0.3) {
            this.increaseScaffolding();
            adaptations.push('scaffolding_increased');
        }

        this.learningSession.adaptationsMade.push({
            timestamp: Date.now(),
            trigger: analysis,
            adaptations: adaptations
        });

        return adaptations;
    }

    async generatePersonalizedFeedback(analysis) {
        const feedbackStyle = this.studentProfile.learningStyle.primary;
        const emotionalTone = this.getEmotionalTone();

        let feedback = {
            type: this.determineFeedbackType(analysis),
            message: '',
            encouragement: '',
            suggestions: [],
            resources: []
        };

        if (analysis.correctness >= 0.8) {
            feedback.message = this.generatePositiveFeedback(analysis, feedbackStyle);
            feedback.encouragement = this.generateEncouragement('success');
        } else if (analysis.correctness >= 0.5) {
            feedback.message = this.generateConstructiveFeedback(analysis, feedbackStyle);
            feedback.suggestions = this.generateImprovementSuggestions(analysis);
        } else {
            feedback.message = this.generateSupportiveFeedback(analysis, feedbackStyle);
            feedback.resources = this.recommendAdditionalResources(analysis);
        }

        // Personalizar tono según perfil emocional
        feedback = this.adjustFeedbackTone(feedback, emotionalTone);

        return feedback;
    }

    generateLearningPath(goal, currentKnowledge) {
        const subject = goal.subject;
        const targetTopic = goal.topic;
        const knowledgeGraph = this.knowledgeGraph.get(subject);

        if (!knowledgeGraph) {
            return { error: 'Materia no soportada' };
        }

        const path = this.findOptimalPath(
            currentKnowledge,
            targetTopic,
            knowledgeGraph
        );

        const detailedPath = path.map(topic => ({
            topic: topic,
            estimatedTime: knowledgeGraph.topics[topic].estimatedTime,
            difficulty: knowledgeGraph.topics[topic].difficulty,
            prerequisites: knowledgeGraph.topics[topic].prerequisites,
            activities: this.generateActivitiesForTopic(topic),
            checkpoints: this.generateCheckpoints(topic)
        }));

        return {
            totalEstimatedTime: detailedPath.reduce((sum, step) => sum + step.estimatedTime, 0),
            difficulty: Math.max(...detailedPath.map(step => step.difficulty)),
            path: detailedPath,
            milestones: this.generateMilestones(detailedPath)
        };
    }

    async conductFormativeAssessment(topic) {
        const questions = this.generateAdaptiveQuestions(topic, this.difficultyLevel);
        const assessment = {
            id: this.generateAssessmentId(),
            topic: topic,
            questions: questions,
            startTime: Date.now(),
            adaptiveScoring: true,
            diagnosticMode: false
        };

        return assessment;
    }

    async conductSummativeAssessment(topics) {
        const comprehensiveQuestions = [];

        topics.forEach(topic => {
            const topicQuestions = this.generateSummativeQuestions(topic);
            comprehensiveQuestions.push(...topicQuestions);
        });

        // Balancear tipos de preguntas
        const balancedQuestions = this.balanceQuestionTypes(comprehensiveQuestions);

        const assessment = {
            id: this.generateAssessmentId(),
            topics: topics,
            questions: balancedQuestions,
            startTime: Date.now(),
            adaptiveScoring: false,
            diagnosticMode: false,
            comprehensiveMode: true
        };

        return assessment;
    }

    trackProgress() {
        const currentProgress = {
            session: this.learningSession,
            overallProgress: this.calculateOverallProgress(),
            masteryLevels: this.calculateMasteryLevels(),
            learningVelocity: this.calculateLearningVelocity(),
            retentionRate: this.calculateRetentionRate(),
            engagementTrend: this.calculateEngagementTrend(),
            predictions: this.makeLearningPredictions()
        };

        // Guardar progreso
        this.saveProgressToStorage(currentProgress);

        return currentProgress;
    }

    makeLearningPredictions() {
        const historicalData = this.getHistoricalPerformance();

        return {
            timeToMastery: this.predictTimeToMastery(),
            nextStruggleAreas: this.predictStruggleAreas(),
            optimalStudySchedule: this.generateOptimalSchedule(),
            retentionForecast: this.predictRetentionDecay(),
            recommendedReviewDates: this.calculateOptimalReviewDates()
        };
    }

    generateOptimalSchedule() {
        const userPreferences = this.studentProfile.preferredPace;
        const cognitiveLoad = this.studentProfile.cognitiveLoad;
        const availableTime = this.getAvailableStudyTime();

        const schedule = {
            dailySessions: [],
            weeklyGoals: [],
            optimalSessionLength: this.calculateOptimalSessionLength(),
            recommendedBreaks: this.calculateOptimalBreaks(),
            reviewSchedule: this.generateSpacedRepetitionSchedule()
        };

        return schedule;
    }

    // Métodos de utilidad y helpers
    getCurrentStrategy() {
        const primaryStyle = this.studentProfile.learningStyle.primary;
        return this.tutorialStrategies.get(primaryStyle);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAssessmentId() {
        return 'assessment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    increaseDifficulty() {
        this.difficultyLevel = Math.min(
            this.difficultyLevel + this.adaptationEngine.difficultyAdaptation.increment,
            this.adaptationEngine.difficultyAdaptation.maxLevel
        );
        this.learningSession.currentDifficulty = this.difficultyLevel;
    }

    decreaseDifficulty() {
        this.difficultyLevel = Math.max(
            this.difficultyLevel - this.adaptationEngine.difficultyAdaptation.decrement,
            this.adaptationEngine.difficultyAdaptation.minLevel
        );
        this.learningSession.currentDifficulty = this.difficultyLevel;
    }

    updateEmotionalState(analysis) {
        if (analysis.correctness >= 0.8) {
            this.emotionalState = 'confident';
        } else if (analysis.correctness >= 0.5) {
            this.emotionalState = 'neutral';
        } else {
            this.emotionalState = 'frustrated';
        }
    }

    saveProgressToStorage(progress) {
        const studentId = this.studentProfile?.id || 'anonymous';
        const storageKey = `adaptive_tutor_progress_${studentId}`;
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    loadStudentData() {
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
            const session = JSON.parse(userSession);
            const studentId = session.email || 'anonymous';
            const progressKey = `adaptive_tutor_progress_${studentId}`;
            const savedProgress = localStorage.getItem(progressKey);

            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                this.difficultyLevel = progress.session?.currentDifficulty || 1;
                this.sessionHistory = progress.sessionHistory || [];
            }
        }
    }

    // API pública
    async startTutoring(topic, studentData) {
        await this.analyzeStudent(studentData);
        this.currentTopic = topic;

        const learningPath = this.generateLearningPath(
            { subject: topic.subject, topic: topic.name },
            studentData.currentKnowledge || {}
        );

        const initialContent = await this.presentContent(topic, topic.content);

        return {
            studentProfile: this.studentProfile,
            learningPath: learningPath,
            initialContent: initialContent,
            session: this.learningSession
        };
    }

    async submitResponse(response) {
        return await this.processStudentResponse(response);
    }

    async requestHint(difficulty = 'medium') {
        const hint = this.generateContextualHint(this.currentTopic, difficulty);
        this.trackHintRequest(hint);
        return hint;
    }

    async requestExplanation(concept) {
        const explanation = this.generatePersonalizedExplanation(concept);
        this.trackExplanationRequest(explanation);
        return explanation;
    }

    getProgressReport() {
        return this.trackProgress();
    }

    endSession() {
        this.learningSession.endTime = Date.now();
        this.learningSession.duration = this.learningSession.endTime - this.learningSession.startTime;

        const sessionSummary = this.generateSessionSummary();
        this.sessionHistory.push(this.learningSession);

        return sessionSummary;
    }
}

// Inicializar y exponer globalmente
window.adaptiveAITutor = new AdaptiveAITutor();

// Integración con sistema de logros
document.addEventListener('DOMContentLoaded', function() {
    // Conectar con el sistema de achievements
    document.addEventListener('tutorProgress', function(event) {
        if (window.achievementSystem) {
            const progress = event.detail;

            // Otorgar XP por progreso en tutoría
            const xpEarned = Math.floor(progress.masteryLevels * 10);
            window.achievementSystem.addXP(xpEarned);

            // Verificar logros relacionados con aprendizaje
            if (progress.masteryLevels >= 0.8) {
                window.achievementSystem.checkAchievement('master_scholar');
            }
        }
    });
});

console.log('🧠 Tutor IA Personalizado Adaptativo cargado correctamente');