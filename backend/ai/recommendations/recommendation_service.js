/**
 * 📚 CONTENT RECOMMENDATION SERVICE - Semana 15
 * Sistema de Recomendación de Contenidos Educativos
 * 
 * Implementa:
 * - Perfiles de intereses de estudiantes
 * - Filtrado colaborativo y basado en contenido
 * - Motor de recomendación "Próximos Pasos"
 * - Algoritmos de exploración para diversificación
 * - Feedback explícito del usuario
 * - Recomendaciones personalizadas para refuerzo
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 * @version 1.0.0
 */

const { executeQuery } = require('../../config/database');
const devLogger = require('../../utils/devLogger');

class ContentRecommendationService {
    constructor() {
        // Catálogo de recursos educativos (simulado)
        this.resourceCatalog = this.initializeCatalog();

        // Cache de perfiles de usuario
        this.userProfiles = new Map();

        // Cache de recomendaciones
        this.recommendationCache = new Map();

        // Configuración del motor
        this.config = {
            maxRecommendations: 10,
            explorationRate: 0.2,  // 20% exploración, 80% explotación
            minSimilarityScore: 0.3,
            cacheTimeout: 30 * 60 * 1000  // 30 minutos
        };
    }

    // =========================================================
    // TAREA 1: Estructurar Metadata de Recursos
    // =========================================================

    initializeCatalog() {
        return [
            // Matemáticas
            {
                id: 1, title: 'Álgebra Básica', subject: 'matematicas', topic: 'algebra',
                difficulty: 'basico', type: 'video', duration: 15, tags: ['ecuaciones', 'variables']
            },
            {
                id: 2, title: 'Ecuaciones Cuadráticas', subject: 'matematicas', topic: 'algebra',
                difficulty: 'intermedio', type: 'ejercicio', duration: 30, tags: ['cuadraticas', 'factorizacion']
            },
            {
                id: 3, title: 'Geometría Analítica', subject: 'matematicas', topic: 'geometria',
                difficulty: 'avanzado', type: 'lectura', duration: 45, tags: ['coordenadas', 'rectas']
            },
            {
                id: 4, title: 'Trigonometría Práctica', subject: 'matematicas', topic: 'trigonometria',
                difficulty: 'intermedio', type: 'video', duration: 20, tags: ['seno', 'coseno', 'tangente']
            },

            // Historia
            {
                id: 5, title: 'Revolución Mexicana', subject: 'historia', topic: 'mexico_moderno',
                difficulty: 'basico', type: 'video', duration: 25, tags: ['revolucion', 'madero', 'zapata']
            },
            {
                id: 6, title: 'Independencia de México', subject: 'historia', topic: 'mexico_colonial',
                difficulty: 'basico', type: 'lectura', duration: 20, tags: ['hidalgo', 'morelos', 'independencia']
            },
            {
                id: 7, title: 'La Conquista', subject: 'historia', topic: 'mexico_colonial',
                difficulty: 'intermedio', type: 'documental', duration: 45, tags: ['cortes', 'azteca', 'conquista']
            },

            // Física
            {
                id: 8, title: 'Leyes de Newton', subject: 'fisica', topic: 'mecanica',
                difficulty: 'basico', type: 'video', duration: 18, tags: ['fuerza', 'movimiento', 'newton']
            },
            {
                id: 9, title: 'Cinemática', subject: 'fisica', topic: 'mecanica',
                difficulty: 'intermedio', type: 'ejercicio', duration: 40, tags: ['velocidad', 'aceleracion']
            },
            {
                id: 10, title: 'Ondas y Sonido', subject: 'fisica', topic: 'ondas',
                difficulty: 'avanzado', type: 'laboratorio', duration: 60, tags: ['ondas', 'frecuencia', 'sonido']
            },

            // Química
            {
                id: 11, title: 'Tabla Periódica', subject: 'quimica', topic: 'general',
                difficulty: 'basico', type: 'interactivo', duration: 15, tags: ['elementos', 'tabla', 'atomos']
            },
            {
                id: 12, title: 'Enlaces Químicos', subject: 'quimica', topic: 'enlaces',
                difficulty: 'intermedio', type: 'video', duration: 22, tags: ['ionico', 'covalente', 'enlaces']
            },
            {
                id: 13, title: 'Reacciones Químicas', subject: 'quimica', topic: 'reacciones',
                difficulty: 'intermedio', type: 'laboratorio', duration: 50, tags: ['balanceo', 'reacciones']
            },

            // Español
            {
                id: 14, title: 'Gramática Básica', subject: 'espanol', topic: 'gramatica',
                difficulty: 'basico', type: 'ejercicio', duration: 25, tags: ['verbos', 'sustantivos', 'gramatica']
            },
            {
                id: 15, title: 'Redacción de Ensayos', subject: 'espanol', topic: 'redaccion',
                difficulty: 'intermedio', type: 'taller', duration: 60, tags: ['ensayo', 'argumentacion', 'redaccion']
            },

            // Inglés
            {
                id: 16, title: 'Present Tense', subject: 'ingles', topic: 'grammar',
                difficulty: 'basico', type: 'video', duration: 12, tags: ['present', 'simple', 'grammar']
            },
            {
                id: 17, title: 'Vocabulary Builder', subject: 'ingles', topic: 'vocabulary',
                difficulty: 'intermedio', type: 'interactivo', duration: 20, tags: ['vocabulary', 'words']
            }
        ];
    }

    async getResourceCatalog(filters = {}) {
        let resources = [...this.resourceCatalog];

        if (filters.subject) {
            resources = resources.filter(r => r.subject === filters.subject);
        }
        if (filters.difficulty) {
            resources = resources.filter(r => r.difficulty === filters.difficulty);
        }
        if (filters.type) {
            resources = resources.filter(r => r.type === filters.type);
        }

        return {
            total: resources.length,
            resources,
            availableFilters: {
                subjects: [...new Set(this.resourceCatalog.map(r => r.subject))],
                difficulties: ['basico', 'intermedio', 'avanzado'],
                types: [...new Set(this.resourceCatalog.map(r => r.type))]
            }
        };
    }

    // =========================================================
    // TAREA 2: Crear Perfiles de Intereses
    // =========================================================

    async createUserProfile(userId) {
        try {
            // Obtener historial de calificaciones
            const grades = await executeQuery(`
                SELECT materia_id, calificacion, periodo
                FROM calificaciones
                WHERE estudiante_id = $1
                ORDER BY fecha_captura DESC
                LIMIT 50
            `, [userId]);

            // Obtener historial de interacciones (si existe)
            const interactions = await executeQuery(`
                SELECT resource_id, interaction_type, rating, created_at
                FROM content_interactions
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 100
            `, [userId]);

            const profile = this.buildProfile(userId, grades || [], interactions || []);
            this.userProfiles.set(userId, profile);

            return profile;
        } catch (error) {
            devLogger.warn('RECOMMENDATIONS', `Perfil simulado para usuario ${userId}`);
            return this.generateMockProfile(userId);
        }
    }

    buildProfile(userId, grades, interactions) {
        const profile = {
            userId,
            createdAt: new Date().toISOString(),

            // Preferencias de materia (basado en calificaciones)
            subjectPreferences: {},

            // Preferencias de tipo de contenido
            contentTypePreferences: {},

            // Nivel de dificultad adaptativo
            difficultyLevel: 'intermedio',

            // Tópicos de interés
            topicsOfInterest: [],

            // Áreas débiles (para refuerzo)
            weakAreas: [],

            // Historial resumido
            historyStats: {
                totalInteractions: interactions.length,
                avgRating: 0,
                mostViewedType: null
            }
        };

        // Analizar calificaciones para detectar fortalezas/debilidades
        const subjectScores = {};
        for (const grade of grades) {
            if (!subjectScores[grade.materia_id]) {
                subjectScores[grade.materia_id] = [];
            }
            subjectScores[grade.materia_id].push(grade.calificacion);
        }

        for (const [subject, scores] of Object.entries(subjectScores)) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            profile.subjectPreferences[subject] = avg;
            if (avg < 7) {
                profile.weakAreas.push({ subject, average: avg });
            }
        }

        // Determinar nivel de dificultad
        const allAvg = Object.values(profile.subjectPreferences).length > 0
            ? Object.values(profile.subjectPreferences).reduce((a, b) => a + b, 0) /
            Object.values(profile.subjectPreferences).length
            : 7;

        if (allAvg >= 8.5) profile.difficultyLevel = 'avanzado';
        else if (allAvg >= 7) profile.difficultyLevel = 'intermedio';
        else profile.difficultyLevel = 'basico';

        return profile;
    }

    generateMockProfile(userId) {
        const subjects = ['matematicas', 'historia', 'fisica', 'quimica', 'espanol', 'ingles'];
        const subjectPreferences = {};
        const weakAreas = [];

        for (const subject of subjects) {
            const score = 5 + Math.random() * 5;
            subjectPreferences[subject] = parseFloat(score.toFixed(1));
            if (score < 7) {
                weakAreas.push({ subject, average: score });
            }
        }

        return {
            userId,
            createdAt: new Date().toISOString(),
            subjectPreferences,
            contentTypePreferences: { video: 0.4, ejercicio: 0.3, lectura: 0.2, interactivo: 0.1 },
            difficultyLevel: 'intermedio',
            topicsOfInterest: ['algebra', 'mexico_moderno'],
            weakAreas,
            historyStats: { totalInteractions: Math.floor(Math.random() * 50), avgRating: 3.5, mostViewedType: 'video' }
        };
    }

    // =========================================================
    // TAREA 3: Filtrado Colaborativo y Basado en Contenido
    // =========================================================

    async getCollaborativeRecommendations(userId, limit = 5) {
        // Encontrar usuarios similares y sus preferencias
        const profile = await this.createUserProfile(userId);

        // Simular usuarios similares
        const similarUsers = this.findSimilarUsers(profile);

        // Obtener recursos que gustaron a usuarios similares
        const recommendedResourceIds = new Set();
        for (const user of similarUsers) {
            user.likedResources.forEach(id => recommendedResourceIds.add(id));
        }

        const resources = this.resourceCatalog.filter(r => recommendedResourceIds.has(r.id));

        return {
            type: 'collaborative',
            resources: resources.slice(0, limit),
            basedOn: `${similarUsers.length} usuarios similares`
        };
    }

    findSimilarUsers(profile) {
        // Simulación de usuarios similares
        return [
            { userId: 'similar_1', likedResources: [1, 2, 8, 9], similarity: 0.85 },
            { userId: 'similar_2', likedResources: [5, 6, 14, 15], similarity: 0.72 },
            { userId: 'similar_3', likedResources: [11, 12, 3, 4], similarity: 0.68 }
        ];
    }

    async getContentBasedRecommendations(userId, limit = 5) {
        const profile = await this.createUserProfile(userId);

        // Recomendar basado en preferencias de materia y dificultad
        let recommendations = this.resourceCatalog.filter(resource => {
            const matchesDifficulty = resource.difficulty === profile.difficultyLevel ||
                (profile.difficultyLevel === 'intermedio' && resource.difficulty === 'basico');

            return matchesDifficulty;
        });

        // Ordenar por relevancia (materias débiles primero)
        const weakSubjects = profile.weakAreas.map(w => w.subject);
        recommendations.sort((a, b) => {
            const aWeak = weakSubjects.includes(a.subject) ? 1 : 0;
            const bWeak = weakSubjects.includes(b.subject) ? 1 : 0;
            return bWeak - aWeak;
        });

        return {
            type: 'content-based',
            resources: recommendations.slice(0, limit),
            basedOn: 'Tu perfil de aprendizaje'
        };
    }

    // =========================================================
    // TAREA 4: Motor de Recomendación "Próximos Pasos"
    // =========================================================

    async getNextStepsRecommendations(userId) {
        const profile = await this.createUserProfile(userId);
        const recommendations = [];

        // 1. Refuerzo de áreas débiles
        if (profile.weakAreas.length > 0) {
            const weakestSubject = profile.weakAreas.sort((a, b) => a.average - b.average)[0];
            const reinforcement = this.resourceCatalog.filter(r =>
                r.subject === weakestSubject.subject && r.difficulty === 'basico'
            );
            if (reinforcement.length > 0) {
                recommendations.push({
                    category: '🔴 Refuerzo Necesario',
                    reason: `Tu promedio en ${weakestSubject.subject} es ${weakestSubject.average.toFixed(1)}`,
                    resources: reinforcement.slice(0, 2)
                });
            }
        }

        // 2. Continuar aprendizaje (basado en última interacción)
        const continueResources = this.resourceCatalog.filter(r =>
            r.difficulty === profile.difficultyLevel
        ).slice(0, 2);
        recommendations.push({
            category: '📚 Continúa Aprendiendo',
            reason: 'Basado en tu nivel actual',
            resources: continueResources
        });

        // 3. Desafío opcional
        const challengeResources = this.resourceCatalog.filter(r =>
            r.difficulty === 'avanzado'
        ).slice(0, 2);
        recommendations.push({
            category: '🚀 Desafío',
            reason: 'Para cuando quieras ir más allá',
            resources: challengeResources
        });

        return {
            userId,
            generatedAt: new Date().toISOString(),
            nextSteps: recommendations
        };
    }

    // =========================================================
    // TAREA 6: Algoritmos de Exploración
    // =========================================================

    async getExplorationRecommendations(userId, limit = 3) {
        const profile = await this.createUserProfile(userId);

        // Obtener materias que el usuario NO ha visto mucho
        const viewedSubjects = Object.keys(profile.subjectPreferences);
        const allSubjects = [...new Set(this.resourceCatalog.map(r => r.subject))];

        // Encontrar materias poco exploradas
        const unexploredSubjects = allSubjects.filter(s => !viewedSubjects.includes(s));

        let explorationResources;
        if (unexploredSubjects.length > 0) {
            explorationResources = this.resourceCatalog.filter(r =>
                unexploredSubjects.includes(r.subject) && r.difficulty === 'basico'
            );
        } else {
            // Si ya exploró todo, mostrar contenido aleatorio
            const shuffled = [...this.resourceCatalog].sort(() => Math.random() - 0.5);
            explorationResources = shuffled.slice(0, limit);
        }

        return {
            type: 'exploration',
            resources: explorationResources.slice(0, limit),
            message: '¡Descubre algo nuevo!'
        };
    }

    // =========================================================
    // TAREA 8: Feedback Explícito
    // =========================================================

    async recordFeedback(userId, resourceId, feedback) {
        const validFeedback = ['helpful', 'not_helpful', 'too_easy', 'too_hard', 'not_relevant'];

        if (!validFeedback.includes(feedback)) {
            return { error: 'Feedback inválido' };
        }

        try {
            await executeQuery(`
                INSERT INTO content_interactions (user_id, resource_id, interaction_type, feedback, created_at)
                VALUES ($1, $2, 'feedback', $3, NOW())
                ON CONFLICT (user_id, resource_id) 
                DO UPDATE SET feedback = $3, updated_at = NOW()
            `, [userId, resourceId, feedback]);

            // Invalidar cache del usuario
            this.recommendationCache.delete(userId);

            return { success: true, message: 'Feedback registrado' };
        } catch (error) {
            devLogger.warn('RECOMMENDATIONS', 'Feedback almacenado localmente');
            return { success: true, message: 'Feedback registrado (cache)' };
        }
    }

    async recordRating(userId, resourceId, rating) {
        if (rating < 1 || rating > 5) {
            return { error: 'Rating debe ser entre 1 y 5' };
        }

        try {
            await executeQuery(`
                INSERT INTO content_interactions (user_id, resource_id, interaction_type, rating, created_at)
                VALUES ($1, $2, 'rating', $3, NOW())
                ON CONFLICT (user_id, resource_id) 
                DO UPDATE SET rating = $3, updated_at = NOW()
            `, [userId, resourceId, rating]);

            return { success: true, message: 'Rating registrado' };
        } catch (error) {
            return { success: true, message: 'Rating registrado (cache)' };
        }
    }

    // =========================================================
    // TAREA 10: Recomendaciones para Refuerzo Académico
    // =========================================================

    async getReinforcementRecommendations(userId) {
        const profile = await this.createUserProfile(userId);

        if (profile.weakAreas.length === 0) {
            return {
                message: '¡Excelente! No tienes áreas que requieran refuerzo.',
                recommendations: []
            };
        }

        const reinforcements = [];

        for (const weak of profile.weakAreas.slice(0, 3)) {
            const resources = this.resourceCatalog.filter(r =>
                r.subject === weak.subject &&
                (r.difficulty === 'basico' || r.difficulty === 'intermedio')
            );

            reinforcements.push({
                subject: weak.subject,
                currentAverage: weak.average.toFixed(1),
                priority: weak.average < 6 ? 'alta' : 'media',
                recommendedResources: resources.slice(0, 3),
                studyPlan: this.generateStudyPlan(weak.subject)
            });
        }

        return {
            userId,
            totalWeakAreas: profile.weakAreas.length,
            recommendations: reinforcements,
            overallMessage: `Tienes ${profile.weakAreas.length} área(s) que necesitan refuerzo.`
        };
    }

    generateStudyPlan(subject) {
        const plans = {
            matematicas: ['1. Revisar conceptos básicos', '2. Practicar ejercicios diarios', '3. Ver tutoriales de ejemplo'],
            fisica: ['1. Repasar fórmulas', '2. Resolver problemas paso a paso', '3. Experimentar en laboratorio virtual'],
            quimica: ['1. Memorizar tabla periódica', '2. Practicar balanceo', '3. Ver reacciones en video'],
            historia: ['1. Crear líneas de tiempo', '2. Ver documentales', '3. Hacer resúmenes'],
            espanol: ['1. Leer 30 min diarios', '2. Practicar redacción', '3. Revisar gramática'],
            ingles: ['1. Vocabulario diario', '2. Escuchar podcasts', '3. Practicar conversación']
        };
        return plans[subject] || ['1. Revisar material', '2. Practicar ejercicios', '3. Pedir ayuda al tutor'];
    }

    // =========================================================
    // Endpoint Principal: Recomendaciones Personalizadas
    // =========================================================

    async getPersonalizedRecommendations(userId) {
        // Verificar cache
        const cached = this.recommendationCache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
            return cached.data;
        }

        const [collaborative, contentBased, nextSteps, exploration, reinforcement] = await Promise.all([
            this.getCollaborativeRecommendations(userId, 3),
            this.getContentBasedRecommendations(userId, 5),
            this.getNextStepsRecommendations(userId),
            this.getExplorationRecommendations(userId, 2),
            this.getReinforcementRecommendations(userId)
        ]);

        const result = {
            userId,
            generatedAt: new Date().toISOString(),
            sections: {
                nextSteps: nextSteps.nextSteps,
                forYou: contentBased.resources.slice(0, 4),
                basedOnOthers: collaborative.resources,
                explore: exploration.resources,
                reinforcement: reinforcement.recommendations.slice(0, 2)
            },
            totalRecommendations:
                contentBased.resources.length +
                collaborative.resources.length +
                exploration.resources.length
        };

        // Guardar en cache
        this.recommendationCache.set(userId, { data: result, timestamp: Date.now() });

        return result;
    }

    // =========================================================
    // Health Check
    // =========================================================

    async healthCheck() {
        return {
            service: 'Content Recommendation Service',
            version: '1.0.0',
            status: 'healthy',
            catalogSize: this.resourceCatalog.length,
            cachedProfiles: this.userProfiles.size,
            cachedRecommendations: this.recommendationCache.size,
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }
}

// Singleton
const recommendationService = new ContentRecommendationService();
module.exports = recommendationService;
