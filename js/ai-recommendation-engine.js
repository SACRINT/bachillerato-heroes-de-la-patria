/**
 * 🎯 AI RECOMMENDATION ENGINE - FASE 5
 * Sistema de recomendaciones personalizadas para estudiantes de BGE Héroes de la Patria
 * Análisis de patrones de aprendizaje y sugerencias inteligentes
 */

class AIRecommendationEngine {
    constructor() {
        this.userBehaviorData = new Map();
        this.learningPaths = new Map();
        this.contentLibrary = new Map();
        this.performanceMetrics = new Map();
        this.personalityTypes = new Map();

        this.algorithmWeights = {
            academicPerformance: 0.3,
            learningStyle: 0.25,
            interests: 0.2,
            timeSpent: 0.15,
            socialLearning: 0.1
        };

        this.init();
    }

    async init() {
        await this.initializeContentLibrary();
        this.setupLearningPaths();
        this.initializePersonalityTypes();
        this.loadUserData();

        console.log('🎯 AI Recommendation Engine inicializado');
    }

    async initializeContentLibrary() {
        // Biblioteca de contenido educativo categorizado
        this.contentLibrary.set('matematicas', {
            topics: [
                {
                    id: 'algebra_basica',
                    title: 'Álgebra Básica',
                    difficulty: 1,
                    duration: 45,
                    type: 'theory',
                    prerequisites: [],
                    skills: ['resolución_ecuaciones', 'factorización'],
                    tags: ['fundamental', 'base_matematica']
                },
                {
                    id: 'geometria_analitica',
                    title: 'Geometría Analítica',
                    difficulty: 3,
                    duration: 60,
                    type: 'practice',
                    prerequisites: ['algebra_basica'],
                    skills: ['coordenadas', 'graficas'],
                    tags: ['visual', 'aplicado']
                },
                {
                    id: 'trigonometria',
                    title: 'Trigonometría',
                    difficulty: 4,
                    duration: 90,
                    type: 'theory_practice',
                    prerequisites: ['algebra_basica', 'geometria_analitica'],
                    skills: ['funciones_trigonometricas', 'identidades'],
                    tags: ['avanzado', 'aplicaciones']
                }
            ],
            assessments: [
                {
                    id: 'eval_algebra',
                    title: 'Evaluación de Álgebra',
                    topics: ['algebra_basica'],
                    questions: 20,
                    timeLimit: 60
                }
            ]
        });

        this.contentLibrary.set('ciencias', {
            topics: [
                {
                    id: 'mecanica_basica',
                    title: 'Mecánica Básica',
                    difficulty: 2,
                    duration: 75,
                    type: 'theory_lab',
                    prerequisites: ['algebra_basica'],
                    skills: ['fuerzas', 'movimiento'],
                    tags: ['experimental', 'fundamental']
                },
                {
                    id: 'quimica_organica',
                    title: 'Química Orgánica',
                    difficulty: 4,
                    duration: 120,
                    type: 'theory_lab',
                    prerequisites: ['quimica_basica'],
                    skills: ['estructuras', 'reacciones'],
                    tags: ['complejo', 'memorización']
                },
                {
                    id: 'biologia_celular',
                    title: 'Biología Celular',
                    difficulty: 3,
                    duration: 90,
                    type: 'theory_visual',
                    prerequisites: [],
                    skills: ['estructuras_celulares', 'procesos'],
                    tags: ['visual', 'memoria']
                }
            ]
        });

        this.contentLibrary.set('humanidades', {
            topics: [
                {
                    id: 'historia_mexico',
                    title: 'Historia de México',
                    difficulty: 2,
                    duration: 60,
                    type: 'narrative',
                    prerequisites: [],
                    skills: ['cronologia', 'analisis_historico'],
                    tags: ['narrativo', 'cultural']
                },
                {
                    id: 'literatura_clasica',
                    title: 'Literatura Clásica',
                    difficulty: 3,
                    duration: 90,
                    type: 'reading_analysis',
                    prerequisites: [],
                    skills: ['comprension_lectora', 'analisis_literario'],
                    tags: ['lectura', 'critico']
                }
            ]
        });

        this.contentLibrary.set('habilidades_vida', {
            topics: [
                {
                    id: 'tecnicas_estudio',
                    title: 'Técnicas de Estudio',
                    difficulty: 1,
                    duration: 30,
                    type: 'practical',
                    prerequisites: [],
                    skills: ['organizacion', 'memoria'],
                    tags: ['esencial', 'productividad']
                },
                {
                    id: 'manejo_estres',
                    title: 'Manejo del Estrés Académico',
                    difficulty: 2,
                    duration: 45,
                    type: 'wellness',
                    prerequisites: [],
                    skills: ['autocontrol', 'bienestar'],
                    tags: ['salud_mental', 'equilibrio']
                }
            ]
        });
    }

    setupLearningPaths() {
        // Rutas de aprendizaje predefinidas
        this.learningPaths.set('ciencias_exactas', {
            name: 'Ciencias Exactas',
            description: 'Especialización en matemáticas y ciencias',
            duration: '2 semestres',
            progression: [
                'algebra_basica',
                'geometria_analitica',
                'mecanica_basica',
                'trigonometria',
                'calculo_diferencial'
            ],
            careerAlignment: ['ingenieria', 'fisica', 'matematicas', 'actuaria'],
            difficulty: 'alto'
        });

        this.learningPaths.set('ciencias_biologicas', {
            name: 'Ciencias Biológicas y de la Salud',
            description: 'Enfoque en biología, química y salud',
            duration: '2 semestres',
            progression: [
                'biologia_celular',
                'quimica_basica',
                'anatomia',
                'quimica_organica',
                'genetica'
            ],
            careerAlignment: ['medicina', 'biologia', 'enfermeria', 'veterinaria'],
            difficulty: 'medio-alto'
        });

        this.learningPaths.set('humanidades_sociales', {
            name: 'Humanidades y Ciencias Sociales',
            description: 'Enfoque en historia, literatura y sociedad',
            duration: '2 semestres',
            progression: [
                'historia_mexico',
                'literatura_clasica',
                'filosofia',
                'sociologia',
                'psicologia'
            ],
            careerAlignment: ['derecho', 'psicologia', 'educacion', 'comunicacion'],
            difficulty: 'medio'
        });

        this.learningPaths.set('equilibrado', {
            name: 'Formación Integral',
            description: 'Balance entre todas las áreas del conocimiento',
            duration: '3 semestres',
            progression: [
                'algebra_basica',
                'biologia_celular',
                'historia_mexico',
                'tecnicas_estudio',
                'geometria_analitica',
                'quimica_basica'
            ],
            careerAlignment: ['administracion', 'mercadotecnia', 'turismo', 'diseno'],
            difficulty: 'medio'
        });
    }

    initializePersonalityTypes() {
        // Tipos de personalidad académica
        this.personalityTypes.set('analytical', {
            name: 'Analítico',
            characteristics: ['lógico', 'sistemático', 'detallista'],
            preferredContent: ['matematicas', 'ciencias'],
            learningStyle: 'paso_a_paso',
            recommendedActivities: ['problemas', 'demostraciones', 'laboratorios']
        });

        this.personalityTypes.set('creative', {
            name: 'Creativo',
            characteristics: ['imaginativo', 'flexible', 'innovador'],
            preferredContent: ['arte', 'literatura', 'proyectos'],
            learningStyle: 'exploración',
            recommendedActivities: ['proyectos', 'discusiones', 'presentaciones']
        });

        this.personalityTypes.set('social', {
            name: 'Social',
            characteristics: ['colaborativo', 'empático', 'comunicativo'],
            preferredContent: ['humanidades', 'ciencias_sociales'],
            learningStyle: 'grupal',
            recommendedActivities: ['debates', 'trabajo_equipo', 'presentaciones']
        });

        this.personalityTypes.set('practical', {
            name: 'Práctico',
            characteristics: ['aplicado', 'concreto', 'orientado_resultados'],
            preferredContent: ['ciencias_aplicadas', 'tecnologia'],
            learningStyle: 'experimental',
            recommendedActivities: ['laboratorios', 'proyectos', 'simulaciones']
        });
    }

    analyzeUserBehavior(userId, behaviorData) {
        // Analizar patrones de comportamiento del usuario
        const analysis = {
            timePatterns: this.analyzeTimePatterns(behaviorData),
            subjectPreferences: this.analyzeSubjectPreferences(behaviorData),
            difficultyPreference: this.analyzeDifficultyPreference(behaviorData),
            learningStyle: this.identifyLearningStyle(behaviorData),
            performancePatterns: this.analyzePerformancePatterns(behaviorData)
        };

        this.userBehaviorData.set(userId, analysis);
        return analysis;
    }

    analyzeTimePatterns(behaviorData) {
        // Analizar cuándo y cuánto tiempo estudia el usuario
        const sessions = behaviorData.studySessions || [];

        if (sessions.length === 0) {
            return { optimalTime: 'tarde', averageSession: 30, consistency: 'bajo' };
        }

        const timeDistribution = {};
        let totalTime = 0;

        sessions.forEach(session => {
            const hour = new Date(session.timestamp).getHours();
            const period = this.getTimePeriod(hour);
            timeDistribution[period] = (timeDistribution[period] || 0) + session.duration;
            totalTime += session.duration;
        });

        const optimalTime = Object.keys(timeDistribution).reduce((a, b) =>
            timeDistribution[a] > timeDistribution[b] ? a : b
        );

        const averageSession = Math.round(totalTime / sessions.length);
        const consistency = this.calculateConsistency(sessions);

        return { optimalTime, averageSession, consistency };
    }

    analyzeSubjectPreferences(behaviorData) {
        // Identificar preferencias por materia
        const interactions = behaviorData.interactions || [];
        const subjectTime = {};
        const subjectPerformance = {};

        interactions.forEach(interaction => {
            const subject = interaction.subject;
            subjectTime[subject] = (subjectTime[subject] || 0) + interaction.timeSpent;

            if (interaction.score !== undefined) {
                if (!subjectPerformance[subject]) {
                    subjectPerformance[subject] = [];
                }
                subjectPerformance[subject].push(interaction.score);
            }
        });

        // Calcular preferencias combinando tiempo y rendimiento
        const preferences = {};
        Object.keys(subjectTime).forEach(subject => {
            const timeScore = subjectTime[subject];
            const performanceScore = subjectPerformance[subject] ?
                subjectPerformance[subject].reduce((a, b) => a + b, 0) / subjectPerformance[subject].length : 0;

            preferences[subject] = (timeScore * 0.4) + (performanceScore * 0.6);
        });

        return preferences;
    }

    determineLearningStyle(behaviorData) {
        const interactions = behaviorData.interactions || [];

        if (interactions.length === 0) {
            return 'visual'; // Default
        }

        // Analizar patrones de interacción para determinar estilo de aprendizaje
        const styles = {
            visual: 0,
            auditivo: 0,
            kinestesico: 0,
            lectoEscritura: 0
        };

        interactions.forEach(interaction => {
            // Puntuación basada en tiempo dedicado y rendimiento
            const score = (interaction.timeSpent / 1000) * (interaction.score || 50) / 100;

            // Heurísticas simples para determinar estilo
            if (interaction.subject === 'Matemáticas' || interaction.subject === 'Física') {
                styles.visual += score;
                styles.kinestesico += score * 0.7;
            } else if (interaction.subject === 'Español' || interaction.subject === 'Literatura') {
                styles.lectoEscritura += score;
                styles.auditivo += score * 0.8;
            } else if (interaction.subject === 'Historia' || interaction.subject === 'Geografía') {
                styles.visual += score * 0.9;
                styles.lectoEscritura += score * 0.7;
            }
        });

        // Encontrar el estilo dominante
        const dominantStyle = Object.keys(styles).reduce((a, b) =>
            styles[a] > styles[b] ? a : b
        );

        return dominantStyle;
    }

    analyzeStudyPatterns(behaviorData) {
        const studySessions = behaviorData.studySessions || [];

        if (studySessions.length === 0) {
            return {
                preferredTimeSlots: ['morning'],
                sessionDuration: 60,
                frequency: 'regular',
                consistency: 'low'
            };
        }

        // Analizar horarios preferidos
        const timeSlots = studySessions.map(session => {
            const date = new Date(session.date);
            const hour = date.getHours();

            if (hour >= 6 && hour < 12) return 'morning';
            if (hour >= 12 && hour < 18) return 'afternoon';
            if (hour >= 18 && hour < 22) return 'evening';
            return 'night';
        });

        const timeSlotCounts = timeSlots.reduce((acc, slot) => {
            acc[slot] = (acc[slot] || 0) + 1;
            return acc;
        }, {});

        const preferredTimeSlots = Object.keys(timeSlotCounts)
            .sort((a, b) => timeSlotCounts[b] - timeSlotCounts[a])
            .slice(0, 2);

        // Calcular duración promedio de sesión
        const totalDuration = studySessions.reduce((sum, session) => sum + session.duration, 0);
        const avgDuration = Math.round(totalDuration / studySessions.length / (1000 * 60)); // en minutos

        // Calcular frecuencia
        const daysBetweenSessions = studySessions.length > 1 ?
            (new Date(studySessions[studySessions.length - 1].date) - new Date(studySessions[0].date)) /
            (1000 * 60 * 60 * 24) / (studySessions.length - 1) : 1;

        const frequency = daysBetweenSessions <= 1 ? 'daily' :
                         daysBetweenSessions <= 3 ? 'frequent' :
                         daysBetweenSessions <= 7 ? 'regular' : 'irregular';

        // Calcular consistencia
        const variance = studySessions.reduce((acc, session) => {
            const diff = session.duration - (totalDuration / studySessions.length);
            return acc + (diff * diff);
        }, 0) / studySessions.length;

        const consistency = variance < 600000 ? 'high' : // menos de 10 min de varianza
                           variance < 1800000 ? 'medium' : 'low'; // menos de 30 min

        return {
            preferredTimeSlots,
            sessionDuration: avgDuration,
            frequency,
            consistency
        };
    }

    getUserBehaviorAnalysis(userId = 'default') {
        const behaviorData = this.userBehaviorData.get(userId) || this.generateSampleBehaviorData();

        return {
            learningStyle: this.determineLearningStyle(behaviorData),
            studyPatterns: this.analyzeStudyPatterns(behaviorData),
            subjectPreferences: this.analyzeSubjectPreferences(behaviorData),
            difficultyPreference: this.analyzeDifficultyPreference(behaviorData),
            recommendedPaths: this.getPersonalizedRecommendations(userId, 5),
            performanceMetrics: this.calculatePerformanceMetrics(behaviorData),
            lastAnalysis: new Date().toISOString()
        };
    }

    getPersonalizedRecommendations(userId = 'default', maxRecommendations = 5) {
        const behaviorData = this.userBehaviorData.get(userId) || this.generateSampleBehaviorData();
        const learningStyle = this.determineLearningStyle(behaviorData);
        const studyPatterns = this.analyzeStudyPatterns(behaviorData);

        // Generar recomendaciones basadas en el perfil del usuario
        const recommendations = [];

        // Recomendaciones basadas en estilo de aprendizaje
        if (learningStyle === 'visual') {
            recommendations.push({
                type: 'content',
                title: 'Videos educativos interactivos',
                description: 'Contenido visual adaptado a tu estilo de aprendizaje',
                priority: 'high',
                category: 'learning_style'
            });
        } else if (learningStyle === 'kinesthetic') {
            recommendations.push({
                type: 'activity',
                title: 'Laboratorios virtuales',
                description: 'Experimentos prácticos y simulaciones',
                priority: 'high',
                category: 'learning_style'
            });
        } else if (learningStyle === 'auditory') {
            recommendations.push({
                type: 'content',
                title: 'Podcasts educativos',
                description: 'Contenido auditivo para reforzar el aprendizaje',
                priority: 'high',
                category: 'learning_style'
            });
        }

        // Recomendaciones basadas en patrones de estudio
        if (studyPatterns.preferredTime === 'morning') {
            recommendations.push({
                type: 'schedule',
                title: 'Sesiones matutinas intensivas',
                description: 'Programar materias difíciles en horario matutino',
                priority: 'medium',
                category: 'study_schedule'
            });
        }

        // Recomendaciones generales basadas en rendimiento
        recommendations.push({
            type: 'practice',
            title: 'Ejercicios adaptativos',
            description: 'Práctica personalizada según tu nivel actual',
            priority: 'medium',
            category: 'skill_development'
        });

        recommendations.push({
            type: 'review',
            title: 'Repaso espaciado',
            description: 'Sistema de repaso optimizado para retención',
            priority: 'medium',
            category: 'retention'
        });

        // Limitar número de recomendaciones
        return recommendations.slice(0, maxRecommendations);
    }

    generateSampleBehaviorData() {
        return {
            interactions: [
                { subject: 'Matemáticas', timeSpent: 3600000, score: 85, timestamp: Date.now() - 86400000 },
                { subject: 'Español', timeSpent: 2700000, score: 92, timestamp: Date.now() - 172800000 },
                { subject: 'Historia', timeSpent: 2400000, score: 78, timestamp: Date.now() - 259200000 }
            ],
            completedTasks: [
                { difficulty: 'medio', score: 85, timeSpent: 1800000 },
                { difficulty: 'alto', score: 70, timeSpent: 3600000 }
            ],
            studySessions: [
                { date: new Date(Date.now() - 86400000).toISOString(), duration: 7200000 },
                { date: new Date(Date.now() - 172800000).toISOString(), duration: 5400000 }
            ]
        };
    }

    calculatePerformanceMetrics(behaviorData) {
        const interactions = behaviorData.interactions || [];
        const scores = interactions.map(i => i.score).filter(s => s !== undefined);

        if (scores.length === 0) return { average: 0, trend: 'stable', consistency: 0 };

        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const consistency = 100 - (Math.sqrt(scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length));

        return {
            average: Math.round(average),
            trend: average > 80 ? 'improving' : average > 60 ? 'stable' : 'needs_attention',
            consistency: Math.round(consistency)
        };
    }

    analyzeDifficultyPreference(behaviorData) {
        // Analizar preferencia de dificultad
        const completedTasks = behaviorData.completedTasks || [];

        if (completedTasks.length === 0) {
            return 'medio'; // Default
        }

        const difficultyScores = {};
        completedTasks.forEach(task => {
            const difficulty = task.difficulty;
            if (!difficultyScores[difficulty]) {
                difficultyScores[difficulty] = { total: 0, count: 0, avgScore: 0 };
            }
            difficultyScores[difficulty].total += task.score || 0;
            difficultyScores[difficulty].count += 1;
        });

        // Calcular promedios
        Object.keys(difficultyScores).forEach(difficulty => {
            const data = difficultyScores[difficulty];
            data.avgScore = data.total / data.count;
        });

        // Encontrar la dificultad óptima (mejor rendimiento)
        let optimalDifficulty = 'medio';
        let bestScore = 0;

        Object.keys(difficultyScores).forEach(difficulty => {
            if (difficultyScores[difficulty].avgScore > bestScore) {
                bestScore = difficultyScores[difficulty].avgScore;
                optimalDifficulty = difficulty;
            }
        });

        return optimalDifficulty;
    }

    identifyLearningStyle(behaviorData) {
        // Identificar estilo de aprendizaje basado en comportamiento
        const preferences = behaviorData.contentTypePreferences || {};

        const styles = {
            visual: (preferences.videos || 0) + (preferences.diagramas || 0),
            auditivo: (preferences.audio || 0) + (preferences.lecturas || 0),
            kinestesico: (preferences.laboratorios || 0) + (preferences.simulaciones || 0),
            social: (preferences.debates || 0) + (preferences.grupal || 0)
        };

        return Object.keys(styles).reduce((a, b) => styles[a] > styles[b] ? a : b);
    }

    analyzePerformancePatterns(behaviorData) {
        // Analizar patrones de rendimiento
        const assessments = behaviorData.assessments || [];

        if (assessments.length === 0) {
            return { trend: 'estable', consistency: 'medio', strongAreas: [], weakAreas: [] };
        }

        // Calcular tendencia
        const scores = assessments.map(a => a.score).slice(-10); // Últimas 10 evaluaciones
        const trend = this.calculateTrend(scores);

        // Calcular consistencia
        const consistency = this.calculateScoreConsistency(scores);

        // Identificar áreas fuertes y débiles
        const subjectScores = {};
        assessments.forEach(assessment => {
            const subject = assessment.subject;
            if (!subjectScores[subject]) {
                subjectScores[subject] = [];
            }
            subjectScores[subject].push(assessment.score);
        });

        const subjectAverages = {};
        Object.keys(subjectScores).forEach(subject => {
            const scores = subjectScores[subject];
            subjectAverages[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        const sortedSubjects = Object.keys(subjectAverages).sort(
            (a, b) => subjectAverages[b] - subjectAverages[a]
        );

        const strongAreas = sortedSubjects.slice(0, 2);
        const weakAreas = sortedSubjects.slice(-2);

        return { trend, consistency, strongAreas, weakAreas };
    }

    generateRecommendations(userId, options = {}) {
        const userBehavior = this.userBehaviorData.get(userId);

        if (!userBehavior) {
            return this.generateDefaultRecommendations();
        }

        const recommendations = {
            immediate: [], // Para hoy/esta semana
            shortTerm: [], // Próximo mes
            longTerm: [], // Semestre/año
            personalizedTips: []
        };

        // Recomendaciones inmediatas basadas en patrones
        recommendations.immediate = this.generateImmediateRecommendations(userBehavior);

        // Recomendaciones a corto plazo
        recommendations.shortTerm = this.generateShortTermRecommendations(userBehavior);

        // Recomendaciones a largo plazo
        recommendations.longTerm = this.generateLongTermRecommendations(userBehavior);

        // Tips personalizados
        recommendations.personalizedTips = this.generatePersonalizedTips(userBehavior);

        return recommendations;
    }

    generateImmediateRecommendations(userBehavior) {
        const recommendations = [];

        // Basado en tiempo óptimo de estudio
        const optimalTime = userBehavior.timePatterns.optimalTime;
        recommendations.push({
            type: 'study_time',
            priority: 'high',
            title: `Estudia en la ${optimalTime}`,
            description: `Tus datos muestran que rindes mejor en la ${optimalTime}. Programa tus sesiones más importantes en este horario.`,
            actionable: true,
            timeframe: 'today'
        });

        // Basado en áreas débiles
        if (userBehavior.performancePatterns.weakAreas.length > 0) {
            const weakestArea = userBehavior.performancePatterns.weakAreas[0];
            const content = this.findContentForSubject(weakestArea, 'basic');

            recommendations.push({
                type: 'weak_area_focus',
                priority: 'high',
                title: `Refuerza ${weakestArea}`,
                description: `Te recomiendo dedicar 30 minutos extra a ${weakestArea} esta semana.`,
                suggestedContent: content,
                actionable: true,
                timeframe: 'this_week'
            });
        }

        // Basado en estilo de aprendizaje
        const learningStyle = userBehavior.learningStyle;
        const styleRecommendation = this.getStyleSpecificRecommendation(learningStyle);
        recommendations.push(styleRecommendation);

        return recommendations;
    }

    generateShortTermRecommendations(userBehavior) {
        const recommendations = [];

        // Ruta de aprendizaje sugerida
        const suggestedPath = this.suggestLearningPath(userBehavior);
        recommendations.push({
            type: 'learning_path',
            priority: 'medium',
            title: `Considera la ruta: ${suggestedPath.name}`,
            description: suggestedPath.description,
            path: suggestedPath,
            timeframe: 'next_month'
        });

        // Mejora de consistencia
        if (userBehavior.timePatterns.consistency === 'bajo') {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                title: 'Mejora tu consistencia de estudio',
                description: 'Intenta estudiar a la misma hora todos los días, aunque sea por 15 minutos.',
                tips: [
                    'Establece una alarma diaria',
                    'Prepara tu espacio de estudio',
                    'Comienza con sesiones cortas'
                ],
                timeframe: 'next_month'
            });
        }

        return recommendations;
    }

    generateLongTermRecommendations(userBehavior) {
        const recommendations = [];

        // Orientación vocacional basada en fortalezas
        const strongAreas = userBehavior.performancePatterns.strongAreas;
        if (strongAreas.length > 0) {
            const careerSuggestions = this.getCareerSuggestions(strongAreas);
            recommendations.push({
                type: 'career_guidance',
                priority: 'low',
                title: 'Carreras que podrían interesarte',
                description: 'Basado en tus fortalezas académicas, estas carreras podrían ser una buena opción.',
                careers: careerSuggestions,
                timeframe: 'long_term'
            });
        }

        // Desarrollo de habilidades complementarias
        const complementarySkills = this.identifyComplementarySkills(userBehavior);
        recommendations.push({
            type: 'skill_development',
            priority: 'medium',
            title: 'Desarrolla habilidades complementarias',
            description: 'Estas habilidades mejorarán tu perfil académico integral.',
            skills: complementarySkills,
            timeframe: 'semester'
        });

        return recommendations;
    }

    generatePersonalizedTips(userBehavior) {
        const tips = [];

        // Tips basados en estilo de aprendizaje
        const learningStyle = userBehavior.learningStyle;
        tips.push(...this.getLearningStyleTips(learningStyle));

        // Tips basados en rendimiento
        const performancePattern = userBehavior.performancePatterns.trend;
        if (performancePattern === 'declinante') {
            tips.push({
                category: 'performance',
                tip: 'Considera tomar descansos más frecuentes. El cansancio puede afectar tu rendimiento.',
                priority: 'high'
            });
        }

        // Tips basados en tiempo de estudio
        const avgSession = userBehavior.timePatterns.averageSession;
        if (avgSession > 90) {
            tips.push({
                category: 'time_management',
                tip: 'Tus sesiones son muy largas. Divide el estudio en bloques de 45-60 minutos con descansos.',
                priority: 'medium'
            });
        }

        return tips;
    }

    // Métodos auxiliares
    getTimePeriod(hour) {
        if (hour >= 6 && hour < 12) return 'mañana';
        if (hour >= 12 && hour < 18) return 'tarde';
        return 'noche';
    }

    calculateConsistency(sessions) {
        // Calcular consistencia basada en regularidad de sesiones
        if (sessions.length < 7) return 'bajo';

        const daysWithSessions = new Set(
            sessions.map(s => new Date(s.timestamp).toDateString())
        ).size;

        const totalDays = Math.ceil(
            (new Date() - new Date(sessions[0].timestamp)) / (1000 * 60 * 60 * 24)
        );

        const consistency = daysWithSessions / Math.min(totalDays, 30); // Últimos 30 días

        if (consistency >= 0.7) return 'alto';
        if (consistency >= 0.4) return 'medio';
        return 'bajo';
    }

    calculateTrend(scores) {
        if (scores.length < 3) return 'estable';

        const recentAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const previousAvg = scores.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;

        if (recentAvg > previousAvg + 5) return 'ascendente';
        if (recentAvg < previousAvg - 5) return 'declinante';
        return 'estable';
    }

    calculateScoreConsistency(scores) {
        if (scores.length < 3) return 'medio';

        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);

        if (standardDeviation < 10) return 'alto';
        if (standardDeviation < 20) return 'medio';
        return 'bajo';
    }

    findContentForSubject(subject, difficulty = 'basic') {
        for (const [category, content] of this.contentLibrary) {
            const topic = content.topics.find(t =>
                t.tags.includes(subject) || t.id.includes(subject)
            );
            if (topic) return topic;
        }
        return null;
    }

    suggestLearningPath(userBehavior) {
        const strongAreas = userBehavior.performancePatterns.strongAreas;

        if (strongAreas.includes('matematicas') || strongAreas.includes('fisica')) {
            return this.learningPaths.get('ciencias_exactas');
        } else if (strongAreas.includes('biologia') || strongAreas.includes('quimica')) {
            return this.learningPaths.get('ciencias_biologicas');
        } else if (strongAreas.includes('historia') || strongAreas.includes('literatura')) {
            return this.learningPaths.get('humanidades_sociales');
        }

        return this.learningPaths.get('equilibrado');
    }

    getCareerSuggestions(strongAreas) {
        const careerMap = {
            'matematicas': ['Ingeniería', 'Actuaría', 'Economía', 'Sistemas Computacionales'],
            'fisica': ['Ingeniería Física', 'Astronomía', 'Ingeniería Mecánica'],
            'quimica': ['Ingeniería Química', 'Medicina', 'Farmacia'],
            'biologia': ['Medicina', 'Biología', 'Veterinaria', 'Enfermería'],
            'historia': ['Derecho', 'Relaciones Internacionales', 'Arqueología'],
            'literatura': ['Comunicación', 'Periodismo', 'Educación', 'Psicología']
        };

        const suggestions = new Set();
        strongAreas.forEach(area => {
            if (careerMap[area]) {
                careerMap[area].forEach(career => suggestions.add(career));
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }

    identifyComplementarySkills(userBehavior) {
        const currentSkills = userBehavior.performancePatterns.strongAreas;
        const allSkills = ['matematicas', 'ciencias', 'comunicacion', 'creatividad', 'liderazgo', 'tecnologia'];

        return allSkills.filter(skill => !currentSkills.includes(skill)).slice(0, 3);
    }

    getLearningStyleTips(style) {
        const tipMap = {
            'visual': [
                { category: 'study_method', tip: 'Usa mapas mentales y diagramas para estudiar', priority: 'high' },
                { category: 'study_method', tip: 'Organiza tu información con colores y símbolos', priority: 'medium' }
            ],
            'auditivo': [
                { category: 'study_method', tip: 'Lee en voz alta o graba tus notas', priority: 'high' },
                { category: 'study_method', tip: 'Busca podcasts educativos sobre tus materias', priority: 'medium' }
            ],
            'kinestesico': [
                { category: 'study_method', tip: 'Camina mientras estudias o usa objetos manipulables', priority: 'high' },
                { category: 'study_method', tip: 'Haz experimentos prácticos siempre que sea posible', priority: 'medium' }
            ],
            'social': [
                { category: 'study_method', tip: 'Forma grupos de estudio con compañeros', priority: 'high' },
                { category: 'study_method', tip: 'Explica conceptos a otros para reforzar tu aprendizaje', priority: 'medium' }
            ]
        };

        return tipMap[style] || [];
    }

    getStyleSpecificRecommendation(style) {
        const recommendations = {
            'visual': {
                type: 'learning_method',
                priority: 'medium',
                title: 'Aprovecha tu estilo visual',
                description: 'Crea mapas mentales y usa diagramas para tus próximas sesiones de estudio.',
                actionable: true,
                timeframe: 'this_week'
            },
            'auditivo': {
                type: 'learning_method',
                priority: 'medium',
                title: 'Maximiza tu aprendizaje auditivo',
                description: 'Lee tus notas en voz alta o busca explicaciones en audio.',
                actionable: true,
                timeframe: 'this_week'
            },
            'kinestesico': {
                type: 'learning_method',
                priority: 'medium',
                title: 'Estudia en movimiento',
                description: 'Camina mientras repasas o usa objetos para representar conceptos.',
                actionable: true,
                timeframe: 'this_week'
            },
            'social': {
                type: 'learning_method',
                priority: 'medium',
                title: 'Aprovecha el aprendizaje social',
                description: 'Organiza sesiones de estudio grupales esta semana.',
                actionable: true,
                timeframe: 'this_week'
            }
        };

        return recommendations[style] || recommendations['visual'];
    }

    generateDefaultRecommendations() {
        return {
            immediate: [
                {
                    type: 'getting_started',
                    priority: 'high',
                    title: 'Comienza con técnicas de estudio',
                    description: 'Aprende métodos efectivos para optimizar tu tiempo de estudio.',
                    actionable: true,
                    timeframe: 'today'
                }
            ],
            shortTerm: [
                {
                    type: 'assessment',
                    priority: 'medium',
                    title: 'Realiza una evaluación diagnóstica',
                    description: 'Identifica tus fortalezas y áreas de oportunidad.',
                    timeframe: 'this_week'
                }
            ],
            longTerm: [
                {
                    type: 'exploration',
                    priority: 'low',
                    title: 'Explora diferentes áreas del conocimiento',
                    description: 'Descubre qué materias te interesan más.',
                    timeframe: 'semester'
                }
            ],
            personalizedTips: [
                {
                    category: 'general',
                    tip: 'Establece una rutina de estudio diaria, aunque sea de 15 minutos.',
                    priority: 'high'
                }
            ]
        };
    }

    // Métodos para persistencia de datos
    loadUserData() {
        try {
            const saved = localStorage.getItem('aiRecommendationData');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.userBehaviorData) {
                    this.userBehaviorData = new Map(data.userBehaviorData);
                }
                if (data.performanceMetrics) {
                    this.performanceMetrics = new Map(data.performanceMetrics);
                }
            }
        } catch (error) {
            console.warn('Error cargando datos de recomendación:', error);
        }
    }

    saveUserData() {
        try {
            const data = {
                userBehaviorData: Array.from(this.userBehaviorData.entries()),
                performanceMetrics: Array.from(this.performanceMetrics.entries()),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('aiRecommendationData', JSON.stringify(data));
        } catch (error) {
            console.warn('Error guardando datos de recomendación:', error);
        }
    }

    // API pública
    updateUserBehavior(userId, behaviorData) {
        this.analyzeUserBehavior(userId, behaviorData);
        this.saveUserData();
    }

    getRecommendations(userId, options = {}) {
        return this.generateRecommendations(userId, options);
    }

    getAvailablePaths() {
        return Array.from(this.learningPaths.entries()).map(([key, path]) => ({
            id: key,
            ...path
        }));
    }

    updatePerformanceMetric(userId, metric, value) {
        if (!this.performanceMetrics.has(userId)) {
            this.performanceMetrics.set(userId, {});
        }
        this.performanceMetrics.get(userId)[metric] = value;
        this.saveUserData();
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.aiRecommendationEngine = new AIRecommendationEngine();
});

// Exponer globalmente
window.AIRecommendationEngine = AIRecommendationEngine;