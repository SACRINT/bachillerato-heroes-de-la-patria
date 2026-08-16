"use strict";
/**
 * BACKEND API - SISTEMA DE RECOMENDACIONES ML BGE
 * Endpoints para el sistema de Machine Learning de recomendaciones educativas
 *
 * Versión: 3.0 - Fase 3 IA Avanzada
 * Fecha: 25 Septiembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require('../utils/debug-logger.js');
// @ts-ignore
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
const router = express_1.default.Router();
// Configuración del sistema ML
const ML_CONFIG = {
    algorithms: {
        collaborativeFiltering: {
            enabled: true,
            factors: 50,
            learningRate: 0.01,
            regularization: 0.1
        },
        contentBased: {
            enabled: true,
            features: ['subject', 'difficulty', 'type', 'prerequisites'],
            weights: {
                calificaciones: 0.4,
                tiempo_estudio: 0.2,
                participacion: 0.2,
                preferencias: 0.1,
                historial: 0.1
            }
        },
        hybrid: {
            enabled: true,
            collaborativeWeight: 0.6,
            contentBasedWeight: 0.4
        }
    },
    parameters: {
        minInteractions: 5,
        confidenceThreshold: 0.7,
        maxRecommendations: 10,
        cacheTimeout: 15 * 60 * 1000, // 15 minutos
        trainingInterval: 24 * 60 * 60 * 1000 // 24 horas
    }
};
// Sistema de cache en memoria
const cache = new Map();
const models = {
    userProfiles: new Map(),
    itemFeatures: new Map(),
    interactionMatrix: new Map(),
    trainedModels: {
        collaborative: null,
        contentBased: null,
        hybrid: null,
        lastTrained: null
    },
    isTraining: false
};
// Estadísticas del sistema
const systemStats = {
    totalRecommendations: 0,
    averageConfidence: 0,
    cacheHitRate: 0
};
/**
 * HEALTH CHECK - Verificar estado del sistema ML
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'operational',
            timestamp: new Date().toISOString(),
            systemInfo: {
                algorithmsEnabled: Object.keys(ML_CONFIG.algorithms).filter((alg) => ML_CONFIG.algorithms[alg].enabled),
                modelsLoaded: {
                    collaborative: !!models.trainedModels.collaborative,
                    contentBased: !!models.trainedModels.contentBased,
                    hybrid: !!models.trainedModels.hybrid
                },
                lastTrained: models.trainedModels.lastTrained
            },
            dataStatus: {
                userProfiles: models.userProfiles.size,
                itemFeatures: models.itemFeatures.size,
                interactions: models.interactionMatrix.size,
                cacheEntries: cache.size
            },
            performance: {
                totalRecommendations: systemStats.totalRecommendations,
                averageConfidence: systemStats.averageConfidence.toFixed(3),
                cacheHitRate: systemStats.cacheHitRate.toFixed(3)
            }
        };
        res.json(health);
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'ML Health check error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            status: 'error',
            message: 'ML system health check failed',
            error: error.message
        });
    }
});
/**
 * GENERAR RECOMENDACIONES PARA UN USUARIO
 */
router.post('/recommendations', async (req, res) => {
    const startTime = Date.now();
    try {
        const { userId, userProfile = null, options = {} } = req.body;
        // Validación
        if (!userId) {
            return res.status(400).json({
                error: 'userId is required',
                code: 'INVALID_USER_ID'
            });
        }
        // Verificar cache primero
        const cacheKey = `recommendations_${userId}_${JSON.stringify(options)}`;
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
            debug_logger_1.debugLog.log('RECOMENDACIONES_ML', `🎯 [ML-API] Cache hit para usuario ${userId}`);
            return res.json({
                ...cachedResult,
                fromCache: true,
                cacheTimestamp: new Date().toISOString()
            });
        }
        debug_logger_1.debugLog.log('RECOMENDACIONES_ML', `🤖 [ML-API] Generando recomendaciones para usuario ${userId}`);
        // Obtener o crear perfil del usuario
        const profile = userProfile || await getUserProfile(userId);
        if (!profile) {
            return res.status(404).json({
                error: 'User profile not found',
                code: 'USER_PROFILE_NOT_FOUND'
            });
        }
        // Generar recomendaciones
        const recommendations = await generateRecommendations(profile, options);
        const processingTime = Date.now() - startTime;
        const result = {
            userId: userId,
            recommendations: recommendations.items,
            metadata: {
                algorithm: recommendations.algorithm,
                confidence: recommendations.overallConfidence,
                processingTime: processingTime,
                modelVersion: getModelVersion(),
                timestamp: new Date().toISOString(),
                parameters: {
                    maxRecommendations: options.limit || ML_CONFIG.parameters.maxRecommendations,
                    confidenceThreshold: ML_CONFIG.parameters.confidenceThreshold,
                    enabledAlgorithms: recommendations.enabledAlgorithms
                }
            },
            analytics: {
                totalRecommendations: recommendations.items.length,
                highConfidenceCount: recommendations.items.filter((r) => r.confidence > 0.8).length,
                categoryBreakdown: categorizeRecommendations(recommendations.items),
                averageConfidence: calculateAverageConfidence(recommendations.items)
            }
        };
        // Guardar en cache
        setCachedResult(cacheKey, result);
        // Actualizar estadísticas
        updateSystemStats(result);
        // Log de éxito
        logRecommendationGenerated(userId, result);
        res.json(result);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'ML Recommendations error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            error: 'Error generating recommendations',
            code: 'ML_PROCESSING_ERROR',
            message: error.message,
            processingTime: processingTime
        });
    }
});
/**
 * ACTUALIZAR PERFIL DE USUARIO
 */
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const profileData = req.body;
        // Validar datos del perfil
        const validatedProfile = validateUserProfile(profileData);
        // Actualizar perfil
        const updatedProfile = await updateUserProfile(userId, validatedProfile);
        // Limpiar cache relacionado
        clearUserCache(userId);
        res.json({
            success: true,
            userId: userId,
            profile: updatedProfile,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Profile update error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            error: 'Error updating user profile',
            message: error.message
        });
    }
});
/**
 * REGISTRAR INTERACCIÓN DEL USUARIO
 */
router.post('/interaction', async (req, res) => {
    try {
        const { userId, itemId, interactionType, // 'view', 'like', 'bookmark', 'complete', 'rate'
        rating = null, metadata = {} } = req.body;
        // Validación
        if (!userId || !itemId || !interactionType) {
            return res.status(400).json({
                error: 'userId, itemId, and interactionType are required',
                code: 'INVALID_INTERACTION_DATA'
            });
        }
        // Registrar interacción
        const interaction = await recordUserInteraction({
            userId,
            itemId,
            interactionType,
            rating,
            metadata,
            timestamp: new Date().toISOString()
        });
        // Actualizar matriz de interacciones
        updateInteractionMatrix(userId, itemId, interaction);
        // Limpiar cache del usuario
        clearUserCache(userId);
        // Log de la interacción
        debug_logger_1.debugLog.log('RECOMENDACIONES_ML', `📝 [ML-API] Interacción registrada: ${userId} -> ${itemId} (${interactionType})`);
        res.json({
            success: true,
            interaction: interaction,
            message: 'Interaction recorded successfully'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Interaction recording error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            error: 'Error recording interaction',
            message: error.message
        });
    }
});
/**
 * ENTRENAR MODELOS ML
 */
router.post('/train', async (req, res) => {
    try {
        const { forceRetrain = false } = req.body;
        // Verificar si ya hay entrenamiento en progreso
        if (models.isTraining && !forceRetrain) {
            return res.status(409).json({
                error: 'Training already in progress',
                code: 'TRAINING_IN_PROGRESS'
            });
        }
        debug_logger_1.debugLog.log('RECOMENDACIONES_ML', '🎓 [ML-API] Iniciando entrenamiento de modelos ML');
        const trainingResult = await trainModels();
        res.json({
            success: true,
            trainingResult: trainingResult,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Model training error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            error: 'Error training models',
            message: error.message
        });
    }
});
/**
 * OBTENER ESTADÍSTICAS DEL SISTEMA
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getSystemStatistics();
        res.json(stats);
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Stats retrieval error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            error: 'Error retrieving system statistics',
            message: error.message
        });
    }
});
/**
 * OBTENER RECOMENDACIONES POR CATEGORÍA
 */
router.get('/recommendations/:userId/:category', async (req, res) => {
    try {
        const { userId, category } = req.params;
        const { limit = '5' } = req.query;
        const recommendations = await getRecommendationsByCategory(userId, category, parseInt(limit));
        res.json({
            userId: userId,
            category: category,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Category recommendations error:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        res.status(500).json({
            error: 'Error getting category recommendations',
            message: error.message
        });
    }
});
/**
 * ============================================================================
 * FUNCIONES AUXILIARES DEL SISTEMA ML
 * ============================================================================
 */
/**
 * GENERAR RECOMENDACIONES PRINCIPALES
 */
async function generateRecommendations(userProfile, options) {
    const enabledAlgorithms = [];
    let recommendations = [];
    try {
        // 1. Filtrado Colaborativo
        if (ML_CONFIG.algorithms.collaborativeFiltering.enabled) {
            const collabRecs = await generateCollaborativeRecommendations(userProfile, options);
            recommendations.push(...collabRecs.map((r) => ({ ...r, algorithm: 'collaborative' })));
            enabledAlgorithms.push('collaborative');
        }
        // 2. Filtrado Basado en Contenido
        if (ML_CONFIG.algorithms.contentBased.enabled) {
            const contentRecs = await generateContentBasedRecommendations(userProfile, options);
            recommendations.push(...contentRecs.map((r) => ({ ...r, algorithm: 'content-based' })));
            enabledAlgorithms.push('content-based');
        }
        // 3. Modelo Híbrido
        if (ML_CONFIG.algorithms.hybrid.enabled && recommendations.length > 0) {
            recommendations = await applyHybridModel(recommendations, userProfile);
            enabledAlgorithms.push('hybrid');
        }
        // 4. Filtrar y rankear
        const filteredRecs = applyRecommendationFilters(recommendations, options);
        const rankedRecs = rankRecommendations(filteredRecs, userProfile);
        // 5. Limitar resultados
        const maxRecs = options.limit || ML_CONFIG.parameters.maxRecommendations;
        const finalRecs = rankedRecs.slice(0, maxRecs);
        // 6. Enriquecer con metadatos
        const enrichedRecs = await enrichRecommendations(finalRecs);
        return {
            items: enrichedRecs,
            algorithm: enabledAlgorithms.length > 1 ? 'hybrid' : enabledAlgorithms[0] || 'fallback',
            overallConfidence: calculateAverageConfidence(enrichedRecs),
            enabledAlgorithms: enabledAlgorithms
        };
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Error generando recomendaciones:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        return generateFallbackRecommendations(userProfile, options);
    }
}
/**
 * FILTRADO COLABORATIVO
 */
async function generateCollaborativeRecommendations(userProfile, options) {
    try {
        const recommendations = [];
        // Encontrar usuarios similares
        const similarUsers = await findSimilarUsers(userProfile.userId);
        if (similarUsers.length === 0) {
            return [];
        }
        // Obtener items de usuarios similares
        for (const similarUser of similarUsers.slice(0, 10)) {
            const userInteractions = getUserInteractions(similarUser.userId);
            for (const interaction of userInteractions) {
                if (!userHasInteracted(userProfile.userId, interaction.itemId) &&
                    (interaction.rating || 3) >= 3) {
                    recommendations.push({
                        itemId: interaction.itemId,
                        confidence: calculateCollaborativeConfidence(interaction, similarUser),
                        reason: `Usuarios similares también encontraron esto útil`,
                        score: interaction.rating || 3,
                        similarity: similarUser.similarity
                    });
                }
            }
        }
        // Agrupar por item y promediar scores
        const groupedRecs = groupAndAverageRecommendations(recommendations);
        return groupedRecs
            .filter((rec) => rec.confidence > ML_CONFIG.parameters.confidenceThreshold)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 20);
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Error en filtrado colaborativo:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        return [];
    }
}
/**
 * FILTRADO BASADO EN CONTENIDO
 */
async function generateContentBasedRecommendations(userProfile, options) {
    try {
        const recommendations = [];
        const userPreferences = analyzeUserPreferences(userProfile);
        // Obtener todos los items disponibles
        const allItems = await getAllAcademicItems();
        for (const item of allItems) {
            if (!userHasInteracted(userProfile.userId, item.id)) {
                const similarity = calculateContentSimilarity(userPreferences, item);
                if (similarity > ML_CONFIG.parameters.confidenceThreshold) {
                    recommendations.push({
                        itemId: item.id,
                        confidence: similarity,
                        reason: generateContentReason(userPreferences, item),
                        score: similarity * 5, // Normalizar a 1-5
                        itemType: item.category
                    });
                }
            }
        }
        return recommendations
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 20);
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', 'Error en filtrado basado en contenido:', (0, sanitized_errors_1.sanitizeError)(error, 'recomendaciones-ml'));
        return [];
    }
}
/**
 * OBTENER PERFIL DE USUARIO
 */
async function getUserProfile(userId) {
    try {
        // Intentar obtener del cache local primero
        if (models.userProfiles.has(userId)) {
            return models.userProfiles.get(userId);
        }
        // En implementación real, obtener de la base de datos
        const mockProfile = await generateMockUserProfile(userId);
        // Guardar en cache local
        models.userProfiles.set(userId, mockProfile);
        return mockProfile;
    }
    catch (error) {
        debug_logger_1.debugLog.error('RECOMENDACIONES_ML', `Error obteniendo perfil de ${userId}:`, error);
        return null;
    }
}
/**
 * GENERAR PERFIL MOCK PARA TESTING
 */
async function generateMockUserProfile(userId) {
    const materias = ['Matemáticas', 'Física', 'Química', 'Biología', 'Historia', 'Literatura', 'Inglés', 'Filosofía'];
    const randomIndex = parseInt(userId.replace('student_', '') || '1');
    return {
        userId: userId,
        nombre: `Estudiante ${randomIndex}`,
        grado: (randomIndex % 3) + 1,
        grupo: String.fromCharCode(65 + (randomIndex % 3)),
        grades: Object.fromEntries(materias.map(materia => [materia, 7 + ((randomIndex + materia.length) % 4)])),
        studyTime: Object.fromEntries(materias.map(materia => [materia, 1 + ((randomIndex + materia.charCodeAt(0)) % 10)])),
        participation: Object.fromEntries(materias.map(materia => [materia, 1 + ((randomIndex * materia.length) % 5)])),
        preferences: {
            tipoAprendizaje: ['visual', 'auditivo', 'kinestésico'][randomIndex % 3],
            materiasPreferidas: materias.slice(0, 3),
            metodoEstudioPreferido: ['individual', 'grupal', 'mixto'][randomIndex % 3]
        },
        historial: {
            promedioGeneral: 7 + (randomIndex % 3),
            tendenciaRendimiento: ['mejorando', 'estable'][randomIndex % 2]
        },
        lastUpdate: new Date().toISOString()
    };
}
/**
 * OBTENER TODOS LOS ITEMS ACADÉMICOS
 */
async function getAllAcademicItems() {
    const items = [
        { id: 'math_advanced', category: 'materia', name: 'Matemáticas Avanzadas', difficulty: 'alto', subjects: ['algebra', 'calculus'], effectiveness: 0.9, benefits: ['academic_boost'] },
        { id: 'physics_modern', category: 'materia', name: 'Física Moderna', difficulty: 'alto', subjects: ['mechanics', 'thermodynamics'], effectiveness: 0.85, benefits: ['advanced_physics'] },
        { id: 'chemistry_organic', category: 'materia', name: 'Química Orgánica', difficulty: 'medio', subjects: ['reactions', 'compounds'], effectiveness: 0.8, benefits: ['chemistry_labs'] },
        { id: 'study_pomodoro', category: 'metodo', name: 'Técnica Pomodoro', difficulty: 'bajo', effectiveness: 0.8, subjects: [], benefits: ['focus'] },
        { id: 'study_mindmaps', category: 'metodo', name: 'Mapas Mentales', difficulty: 'medio', effectiveness: 0.9, subjects: [], benefits: ['memory'] },
        { id: 'resource_khan', category: 'recurso', name: 'Khan Academy', difficulty: 'bajo', subjects: ['math', 'science'], effectiveness: 0.95, benefits: ['comprehensive_learning'] },
        { id: 'activity_science_club', category: 'actividad', name: 'Club de Ciencias', difficulty: 'medio', benefits: ['practice', 'social'], effectiveness: 0.85, subjects: ['science'] }
    ];
    return items;
}
/**
 * FUNCIONES AUXILIARES DE CACHE
 */
function getCachedResult(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ML_CONFIG.parameters.cacheTimeout) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}
function setCachedResult(key, data) {
    cache.set(key, {
        data: data,
        timestamp: Date.now()
    });
}
function clearUserCache(userId) {
    for (const [key] of cache.entries()) {
        if (key.includes(userId)) {
            cache.delete(key);
        }
    }
}
/**
 * FUNCIONES AUXILIARES DE ESTADÍSTICAS
 */
function updateSystemStats(result) {
    systemStats.totalRecommendations++;
    systemStats.averageConfidence =
        (systemStats.averageConfidence * (systemStats.totalRecommendations - 1) +
            result.metadata.confidence) / systemStats.totalRecommendations;
}
function calculateAverageConfidence(recommendations) {
    if (recommendations.length === 0)
        return 0;
    const sum = recommendations.reduce((acc, rec) => acc + (rec.confidence || 0), 0);
    return sum / recommendations.length;
}
function categorizeRecommendations(recommendations) {
    const categories = {};
    recommendations.forEach(rec => {
        const category = rec.itemType || rec.algorithm || 'unknown';
        categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
}
function logRecommendationGenerated(userId, result) {
    debug_logger_1.debugLog.log('RECOMENDACIONES_ML', `✅ [ML-API] Recomendación generada para ${userId}: ` +
        `${result.recommendations.length} items, ` +
        `confianza promedio: ${(result.metadata.confidence * 100).toFixed(1)}%, ` +
        `tiempo: ${result.metadata.processingTime}ms`);
}
/**
 * FUNCIONES AUXILIARES ADICIONALES
 */
function userHasInteracted(userId, itemId) {
    const key = `${userId}_${itemId}`;
    return models.interactionMatrix.has(key);
}
function findSimilarUsers(userId) {
    // Implementación simplificada - en producción usar algoritmos más sofisticados
    const similarUsers = [];
    const maxSimilar = 5;
    let count = 0;
    for (const [otherUserId, profile] of models.userProfiles.entries()) {
        if (otherUserId !== userId && count < maxSimilar) {
            similarUsers.push({
                userId: otherUserId,
                similarity: 0.7 + Math.random() * 0.3, // Simulado
                profile: profile
            });
            count++;
        }
    }
    return similarUsers.sort((a, b) => b.similarity - a.similarity);
}
function getUserInteractions(userId) {
    // Retornar interacciones simuladas
    return [
        { itemId: 'math_advanced', rating: 4, type: 'completed' },
        { itemId: 'study_pomodoro', rating: 5, type: 'liked' },
        { itemId: 'resource_khan', rating: 4, type: 'bookmarked' }
    ];
}
function analyzeUserPreferences(userProfile) {
    return {
        strongSubjects: Object.entries(userProfile.grades || {})
            .filter(([_, grade]) => grade >= 8)
            .map(([subject]) => subject),
        preferredLearningStyle: userProfile.preferences?.tipoAprendizaje || 'visual',
        studyPatterns: userProfile.preferences?.metodoEstudioPreferido || 'individual'
    };
}
function calculateContentSimilarity(userPreferences, item) {
    // Implementación simplificada de similitud de contenido
    let similarity = 0.5; // Base
    if (userPreferences.strongSubjects.some((subject) => item.subjects?.includes(subject.toLowerCase()))) {
        similarity += 0.3;
    }
    if (item.difficulty === 'medio') {
        similarity += 0.1;
    }
    return Math.min(1, similarity);
}
function generateContentReason(userPreferences, item) {
    return `Recomendado basado en tu rendimiento en ${userPreferences.strongSubjects.join(', ')}`;
}
async function getSystemStatistics() {
    return {
        system: {
            totalUsers: models.userProfiles.size,
            totalItems: (await getAllAcademicItems()).length,
            totalRecommendations: systemStats.totalRecommendations,
            cacheSize: cache.size
        },
        performance: {
            averageConfidence: systemStats.averageConfidence,
            cacheHitRate: systemStats.cacheHitRate,
            lastModelUpdate: models.trainedModels.lastTrained
        },
        algorithms: ML_CONFIG.algorithms
    };
}
// Funciones placeholder para completar la implementación
async function trainModels() {
    return { success: true, message: 'Models trained successfully' };
}
function getModelVersion() {
    return '1.0.0';
}
function validateUserProfile(profileData) {
    return profileData; // Simplificado
}
async function updateUserProfile(userId, profileData) {
    models.userProfiles.set(userId, profileData);
    return profileData;
}
async function recordUserInteraction(interactionData) {
    const key = `${interactionData.userId}_${interactionData.itemId}`;
    models.interactionMatrix.set(key, interactionData);
    return interactionData;
}
function updateInteractionMatrix(userId, itemId, interaction) {
    const key = `${userId}_${itemId}`;
    models.interactionMatrix.set(key, interaction);
}
function applyRecommendationFilters(recommendations, options) {
    return recommendations.filter(rec => rec.confidence > ML_CONFIG.parameters.confidenceThreshold);
}
function rankRecommendations(recommendations, userProfile) {
    return recommendations.sort((a, b) => b.confidence - a.confidence);
}
async function enrichRecommendations(recommendations) {
    const allItems = await getAllAcademicItems();
    return recommendations.map(rec => {
        const item = allItems.find(i => i.id === rec.itemId);
        return {
            ...rec,
            title: item?.name || 'Item desconocido',
            description: `${item?.category || 'Recurso'} - Dificultad: ${item?.difficulty || 'media'}`,
            itemData: item
        };
    });
}
function calculateCollaborativeConfidence(interaction, similarUser) {
    return (interaction.rating / 5) * similarUser.similarity * 0.8;
}
function groupAndAverageRecommendations(recommendations) {
    const grouped = new Map();
    recommendations.forEach(rec => {
        const existing = grouped.get(rec.itemId);
        if (existing) {
            existing.confidence = (existing.confidence + rec.confidence) / 2;
            existing.count = (existing.count || 1) + 1;
        }
        else {
            grouped.set(rec.itemId, { ...rec, count: 1 });
        }
    });
    return Array.from(grouped.values());
}
async function applyHybridModel(recommendations, userProfile) {
    // Aplicar pesos del modelo híbrido
    const collaborativeWeight = ML_CONFIG.algorithms.hybrid.collaborativeWeight;
    const contentWeight = ML_CONFIG.algorithms.hybrid.contentBasedWeight;
    return recommendations.map(rec => ({
        ...rec,
        confidence: rec.algorithm === 'collaborative' ?
            rec.confidence * collaborativeWeight :
            rec.confidence * contentWeight
    }));
}
function generateFallbackRecommendations(userProfile, options) {
    return {
        items: [
            {
                itemId: 'study_pomodoro',
                title: 'Técnica Pomodoro',
                description: 'Método de estudio para mejorar la concentración',
                confidence: 0.6,
                reason: 'Recomendación general para todos los estudiantes'
            }
        ],
        algorithm: 'fallback',
        overallConfidence: 0.6,
        enabledAlgorithms: ['fallback']
    };
}
async function getRecommendationsByCategory(userId, category, limit) {
    const userProfile = await getUserProfile(userId);
    const allItems = await getAllAcademicItems();
    const categoryItems = allItems
        .filter(item => item.category === category)
        .slice(0, limit)
        .map(item => ({
        itemId: item.id,
        title: item.name,
        description: `${item.category} - ${item.difficulty}`,
        confidence: 0.7,
        reason: `Recomendado en categoría ${category}`
    }));
    return categoryItems;
}
exports.default = router;
//# sourceMappingURL=recomendaciones-ml.js.map