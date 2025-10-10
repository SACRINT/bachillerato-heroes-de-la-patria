/**
 * 🤖 RUTAS DE INTELIGENCIA ARTIFICIAL
 * API endpoints para el sistema de prompts y recompensas IA
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const AIService = require('../services/aiService');

const router = express.Router();
const aiService = new AIService();

// Rate limiting específico para IA (más restrictivo)
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 30, // máximo 30 requests por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes de IA. Intenta en unos minutos.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiting más restrictivo para prompts premium
const premiumRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // máximo 10 prompts premium por hora
    message: {
        success: false,
        error: 'Límite de prompts premium alcanzado. Sube de nivel para más acceso.',
        retryAfter: 60
    }
});

/**
 * 🚀 POST /api/ai/execute-prompt
 * Ejecutar un prompt específico con IA
 */
router.post('/execute-prompt', aiRateLimit, async (req, res) => {
    try {
        const { promptId, userInput, userProfile } = req.body;

        // Validaciones básicas
        if (!promptId || !userInput || !userProfile) {
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos: promptId, userInput, userProfile'
            });
        }

        // Validar input del usuario
        const inputValidation = aiService.validateInput(userInput);
        if (!inputValidation.valid) {
            return res.status(400).json({
                success: false,
                error: inputValidation.error
            });
        }

        // Cargar datos del prompt desde la biblioteca
        const promptLibrary = req.app.get('promptLibrary');
        const promptData = promptLibrary[promptId];

        if (!promptData) {
            return res.status(404).json({
                success: false,
                error: 'Prompt no encontrado'
            });
        }

        // Verificar si el usuario tiene acceso al prompt
        if (!userProfile.unlockedPrompts.includes(promptId)) {
            return res.status(403).json({
                success: false,
                error: 'Prompt no desbloqueado. Sube de nivel para acceder.',
                requiredLevel: promptData.level
            });
        }

        // Verificar límites diarios del usuario
        const userLimits = aiService.getUserLimits(userProfile);
        const todayUsage = await getUserTodayUsage(userProfile.id);

        if (todayUsage.prompts >= userLimits.dailyPrompts) {
            return res.status(429).json({
                success: false,
                error: 'Límite diario de prompts alcanzado',
                limits: userLimits,
                usage: todayUsage
            });
        }

        // Ejecutar prompt con IA
        const startTime = Date.now();
        const aiResponse = await aiService.executePrompt(promptData, userInput, userProfile);
        const executionTime = Date.now() - startTime;

        // Registrar el uso del prompt
        await logPromptUsage({
            userId: userProfile.id,
            promptId: promptId,
            input: userInput.substring(0, 100), // Solo primeros 100 caracteres por privacidad
            responseLength: aiResponse.response.length,
            executionTime,
            tokensUsed: aiResponse.tokensUsed,
            timestamp: new Date()
        });

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                response: aiResponse.response,
                xpEarned: promptData.xpReward,
                tokensUsed: aiResponse.tokensUsed,
                model: aiResponse.model,
                executionTime,
                isSimulated: aiResponse.isSimulated || false
            },
            limits: {
                remaining: userLimits.dailyPrompts - (todayUsage.prompts + 1),
                resetTime: getTomorrowMidnight()
            }
        });

    } catch (error) {
        console.error('❌ Error ejecutando prompt:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo procesar la solicitud de IA'
        });
    }
});

/**
 * 📊 GET /api/ai/user-stats/:userId
 * Obtener estadísticas de uso de IA del usuario
 */
router.get('/user-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await getUserAIStats(userId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

/**
 * 🎯 GET /api/ai/available-prompts/:userLevel
 * Obtener prompts disponibles según el nivel del usuario
 */
router.get('/available-prompts/:userLevel', (req, res) => {
    try {
        const { userLevel } = req.params;
        const userType = req.query.type || 'student';

        const promptLibrary = req.app.get('promptLibrary');

        const availablePrompts = Object.entries(promptLibrary)
            .filter(([id, prompt]) => {
                return prompt.level <= parseInt(userLevel) &&
                       (prompt.userTypes?.includes(userType) || !prompt.userTypes);
            })
            .map(([id, prompt]) => ({
                id,
                name: prompt.name,
                description: prompt.description,
                level: prompt.level,
                xpReward: prompt.xpReward,
                category: prompt.category
            }));

        res.json({
            success: true,
            data: {
                prompts: availablePrompts,
                total: availablePrompts.length,
                userLevel: parseInt(userLevel),
                userType
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo prompts:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener prompts disponibles'
        });
    }
});

/**
 * 🔍 GET /api/ai/system-status
 * Estado del sistema de IA
 */
router.get('/system-status', async (req, res) => {
    try {
        const stats = await aiService.getUsageStats();

        res.json({
            success: true,
            data: {
                systemStatus: 'operational',
                aiMode: aiService.simulationMode ? 'simulation' : 'production',
                model: aiService.defaultModel,
                uptime: process.uptime(),
                stats
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener estado del sistema'
        });
    }
});

// ===== FUNCIONES AUXILIARES =====

/**
 * 📈 Obtener uso de hoy del usuario
 */
async function getUserTodayUsage(userId) {
    // Placeholder - en producción usar base de datos
    return {
        prompts: 5,
        tokens: 1234,
        lastUsed: new Date()
    };
}

/**
 * 📝 Registrar uso de prompt
 */
async function logPromptUsage(usageData) {
    try {
        // Placeholder para logging en base de datos
        console.log('📝 Prompt usado:', {
            user: usageData.userId,
            prompt: usageData.promptId,
            time: usageData.executionTime + 'ms',
            tokens: usageData.tokensUsed
        });

        // TODO: Implementar guardado real
        // await db.promptUsage.create(usageData);

    } catch (error) {
        console.error('Error logging prompt usage:', error);
    }
}

/**
 * 📊 Obtener estadísticas del usuario
 */
async function getUserAIStats(userId) {
    // Placeholder para estadísticas reales
    return {
        totalPrompts: 42,
        totalTokens: 8765,
        favoriteCategory: 'writing',
        level: 15,
        xpEarned: 650,
        streak: 7,
        lastActive: new Date().toISOString(),
        topPrompts: [
            { id: 'basic-summary', uses: 12 },
            { id: 'homework-helper', uses: 8 },
            { id: 'lesson-planner', uses: 5 }
        ]
    };
}

/**
 * 🕛 Obtener medianoche del siguiente día
 */
function getTomorrowMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
}

module.exports = router;