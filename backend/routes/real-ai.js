"use strict";
/**
 * 🚀 RUTAS API PARA IA REAL - FASE 4 BGE - TypeScript
 * Endpoints para OpenAI GPT-4 y Claude (Anthropic)
 * Sistema inteligente de selección de proveedores
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require('../utils/debug-logger.js');
// @ts-ignore
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
// @ts-ignore
const realAIService_1 = require('../services/realAIService.js');
// @ts-ignore
const auth_1 = require('../middleware/auth.js');
const router = express_1.default.Router();
// Obtener instancia del servicio
const realAIService = (0, realAIService_1.getRealAIService)();
// ============================================
// ENDPOINTS
// ============================================
/**
 * GET /api/real-ai/health
 * Health check del servicio de IA real
 */
router.get('/health', async (req, res) => {
    try {
        const stats = realAIService.getStats();
        const summary = realAIService.getProviderSummary();
        res.json({
            status: stats.initialized ? 'operational' : 'initializing',
            service: 'Real AI Service',
            timestamp: new Date().toISOString(),
            version: '4.0',
            providers: {
                available: summary.active,
                primary: summary.primary,
                fallback: summary.fallback,
                status: stats.providers
            },
            statistics: {
                totalRequests: stats.totalRequests,
                totalTokens: stats.totalTokens,
                totalErrors: stats.totalErrors,
                uptime: Math.floor(stats.uptime / 60) + ' minutos'
            },
            features: [
                'OpenAI GPT-4 Integration',
                'Anthropic Claude Integration',
                'Local AI Fallback',
                'Intelligent Provider Selection',
                'Real-time Error Recovery',
                'Usage Analytics'
            ]
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error en health check Real AI:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});
/**
 * POST /api/real-ai/process
 * Procesar mensaje con IA real
 */
router.post('/process', auth_1.authenticateToken, async (req, res) => {
    try {
        const { message, context, systemPrompt, preferredProvider, complexity = 'medium' } = req.body;
        // Validaciones
        if (!message || typeof message !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Mensaje requerido',
                message: 'Debe proporcionar un mensaje válido para procesar'
            });
            return;
        }
        const user = req.user;
        debug_logger_1.debugLog.log('REAL_AI', `🤖 Procesando solicitud de IA para usuario: ${user.email}`);
        // Preparar datos de la solicitud
        const requestData = {
            message: message.trim(),
            context: context || '',
            userProfile: {
                id: user.userId,
                name: user.username || user.email,
                email: user.email,
                type: user.role || 'student',
                level: user.level || 1
            },
            systemPrompt: systemPrompt,
            preferredProvider: preferredProvider,
            complexity: complexity,
            requiresRealtime: false
        };
        // Procesar con IA real
        const result = await realAIService.processAIRequest(requestData);
        res.json({
            success: true,
            message: 'Solicitud procesada exitosamente',
            data: {
                response: result.text,
                provider: result.provider,
                model: result.model,
                confidence: result.confidence,
                tokensUsed: result.tokensUsed,
                isLocal: result.isLocal || false,
                fallbackUsed: result.fallbackUsed || false
            },
            metadata: {
                timestamp: result.timestamp,
                processingTime: result.processingTime,
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error procesando con IA real:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            success: false,
            error: 'Error procesando solicitud de IA',
            message: error.message,
            fallback: 'Puede intentar nuevamente o usar el modo local'
        });
    }
});
/**
 * POST /api/real-ai/chat
 * Chat conversacional con IA
 */
router.post('/chat', auth_1.authenticateToken, async (req, res) => {
    try {
        const { message, conversationId, conversationHistory = [], provider } = req.body;
        if (!message) {
            res.status(400).json({
                success: false,
                error: 'Mensaje requerido para chat'
            });
            return;
        }
        const user = req.user;
        debug_logger_1.debugLog.log('REAL_AI', `💬 Chat IA para usuario: ${user.email}`);
        // Construir contexto de conversación
        let context = '';
        if (conversationHistory && conversationHistory.length > 0) {
            context = conversationHistory
                .slice(-5) // Últimos 5 mensajes
                .map((msg) => `${msg.role}: ${msg.content}`)
                .join('\n');
        }
        const requestData = {
            message: message,
            context: context,
            userProfile: {
                id: user.userId,
                name: user.username || user.email,
                email: user.email,
                type: user.role || 'student',
                level: user.level || 1
            },
            systemPrompt: `Eres un asistente educativo especializado. Mantén una conversación natural y educativa.
            Este es un chat conversacional, así que mantén continuidad con mensajes anteriores cuando sea relevante.`,
            preferredProvider: provider,
            complexity: 'medium'
        };
        const result = await realAIService.processAIRequest(requestData);
        // Preparar respuesta del chat
        const chatResponse = {
            id: `msg_${Date.now()}`,
            content: result.text,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            provider: result.provider,
            model: result.model,
            confidence: result.confidence
        };
        res.json({
            success: true,
            message: 'Respuesta de chat generada',
            data: chatResponse,
            conversationId: conversationId || `conv_${Date.now()}`,
            metadata: {
                tokensUsed: result.tokensUsed,
                isLocal: result.isLocal || false,
                fallbackUsed: result.fallbackUsed || false
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error en chat IA:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            success: false,
            error: 'Error en chat con IA',
            message: error.message
        });
    }
});
/**
 * POST /api/real-ai/analyze
 * Análisis de contenido educativo con IA
 */
router.post('/analyze', auth_1.authenticateToken, async (req, res) => {
    try {
        const { content, analysisType = 'general', subject, grade } = req.body;
        if (!content) {
            res.status(400).json({
                success: false,
                error: 'Contenido requerido para análisis'
            });
            return;
        }
        const user = req.user;
        debug_logger_1.debugLog.log('REAL_AI', `📊 Análisis IA para usuario: ${user.email}, tipo: ${analysisType}`);
        // Prompts especializados por tipo de análisis
        const analysisPrompts = {
            general: `Analiza el siguiente contenido educativo de manera general. Proporciona insights sobre su calidad, claridad y valor educativo.`,
            pedagogical: `Como experto pedagógico, analiza este contenido educativo. Evalúa su efectividad didáctica, nivel de dificultad apropiado, y sugiere mejoras metodológicas.`,
            assessment: `Analiza este contenido desde la perspectiva de evaluación educativa. Identifica objetivos de aprendizaje, criterios de evaluación y sugiere métodos de assessment.`,
            accessibility: `Evalúa la accesibilidad educativa de este contenido. Considera diferentes estilos de aprendizaje, necesidades especiales y adaptaciones posibles.`,
            curriculum: `Analiza cómo este contenido se alinea con el currículo de bachillerato mexicano. Evalúa su relevancia curricular y conexiones interdisciplinarias.`
        };
        const systemPrompt = analysisPrompts[analysisType] || analysisPrompts.general;
        const contextStr = `Materia: ${subject || 'No especificada'}, Grado: ${grade || 'No especificado'}`;
        const requestData = {
            message: `${systemPrompt}\n\nContenido a analizar:\n${content}`,
            context: contextStr,
            userProfile: {
                id: user.userId,
                name: user.username || user.email,
                email: user.email,
                type: user.role || 'teacher',
                level: user.level || 1
            },
            complexity: 'high',
            preferredProvider: 'anthropic' // Claude es excelente para análisis
        };
        const result = await realAIService.processAIRequest(requestData);
        res.json({
            success: true,
            message: 'Análisis completado exitosamente',
            data: {
                analysis: result.text,
                analysisType: analysisType,
                subject: subject,
                grade: grade,
                confidence: result.confidence,
                provider: result.provider,
                model: result.model
            },
            metadata: {
                timestamp: result.timestamp,
                tokensUsed: result.tokensUsed,
                contentLength: content.length
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error en análisis IA:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            success: false,
            error: 'Error en análisis con IA',
            message: error.message
        });
    }
});
/**
 * GET /api/real-ai/providers
 * Información sobre proveedores disponibles
 */
router.get('/providers', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = realAIService.getStats();
        const summary = realAIService.getProviderSummary();
        res.json({
            success: true,
            message: 'Información de proveedores de IA',
            data: {
                available: summary.active,
                primary: summary.primary,
                fallback: summary.fallback,
                status: stats.providers,
                usage: stats.usage,
                recommendations: {
                    forComplexAnalysis: 'anthropic',
                    forGeneralTasks: 'openai',
                    forOfflineMode: 'local'
                }
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error obteniendo info de proveedores:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            success: false,
            error: 'Error obteniendo información de proveedores',
            message: error.message
        });
    }
});
/**
 * POST /api/real-ai/reload
 * Recargar configuración de proveedores (solo admin)
 */
router.post('/reload', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // Verificar permisos de admin
        if (user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Solo administradores pueden recargar la configuración'
            });
            return;
        }
        debug_logger_1.debugLog.log('REAL_AI', `🔄 Recargando configuración IA por: ${user.email}`);
        const stats = await realAIService.reload();
        res.json({
            success: true,
            message: 'Configuración de IA recargada exitosamente',
            data: stats,
            timestamp: new Date().toISOString(),
            reloadedBy: user.email
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error recargando configuración IA:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            success: false,
            error: 'Error recargando configuración',
            message: error.message
        });
    }
});
/**
 * GET /api/real-ai/stats
 * Estadísticas detalladas del servicio
 */
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = realAIService.getStats();
        const user = req.user;
        // Solo admin puede ver estadísticas detalladas
        if (user.role !== 'admin') {
            res.json({
                success: true,
                message: 'Estadísticas básicas de IA',
                data: {
                    availableProviders: stats.availableProviders,
                    totalRequests: stats.totalRequests,
                    uptime: Math.floor(stats.uptime / 60) + ' minutos'
                }
            });
            return;
        }
        res.json({
            success: true,
            message: 'Estadísticas completas de IA',
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('REAL_AI', '❌ Error obteniendo estadísticas IA:', (0, sanitized_errors_1.sanitizeError)(error, 'real-ai'));
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas',
            message: error.message
        });
    }
});
module.exports = router;
//# sourceMappingURL=real-ai.js.map