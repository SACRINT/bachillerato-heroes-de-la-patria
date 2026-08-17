"use strict";
/**
 * 🧠 AI ORCHESTRATOR SERVICE
 * Centralized entry point for all AI interactions.
 * Routes high-level intents (TUTOR, ANALYTICS) to specific logic.
 * Created: Jan 2026
 */

const { getRealAIService } = require('../../services/realAIService');
const devLogger = require('../../utils/devLogger');
// const { getRealTimeCollaborationService } = require('../realtime-collaboration.service'); 
const aiTutorService = require('../ai-tutor.service');
const AIChatbotDAO = require('../../data/ai-chatbot.dao');

// const predictiveAnalyticsService = require('../../PredictiveAnalyticsService'); 
// const personalityProfilingService = require('../../services/personality-profiling.service'); 



const ragService = require('../rag.service.js');

class AIService {
    constructor() {
        this.aiProvider = getRealAIService();
        this.intents = {
            TUTOR_CHAT: 'TUTOR_CHAT',
            GENERAL_CHAT: 'GENERAL_CHAT',
            ANALYTICS_PREDICT: 'ANALYTICS_PREDICT',
            SENTIMENT_ANALYSIS: 'SENTIMENT_ANALYSIS',
            CONTENT_GENERATION: 'CONTENT_GENERATION',
            PERSONALITY: 'PERSONALITY'
        };
    }

    /**
     * Main entry point for AI processing
     * @param {string} intent - One of this.intents
     * @param {object} payload - Data required for the task
     * @param {object} context - User context (userId, role, etc.)
     */
    async processRequest(intent, payload, context) {
        devLogger.log('AI_ORCHESTRATOR', `Processing intent: ${intent} for user: ${context.userId}`);

        try {
            switch (intent) {
                case this.intents.TUTOR_CHAT:
                    return await this.handleTutorChat(payload, context);

                case this.intents.GENERAL_CHAT:
                    return await this.handleGeneralChat(payload, context);

                case this.intents.ANALYTICS_PREDICT:
                    return await this.handleAnalyticsPrediction(payload, context);

                case this.intents.SENTIMENT_ANALYSIS:
                    return await this.handleSentimentAnalysis(payload, context);

                case this.intents.PERSONALITY:
                    return await this.handlePersonalityProfiling(payload, context);

                case this.intents.CONTENT_GENERATION:
                    return await this.handleContentGeneration(payload, context);

                default:
                    throw new Error(`Unknown intent: ${intent}`);
            }
        } catch (error) {
            devLogger.error('AI_ORCHESTRATOR', `Error processing ${intent}`, error);
            throw error;
        }
    }

    /**
     * Handler for Tutor Chat
     * Delegates to AITutorService but centralizes the call here.
     */
    async handleTutorChat(payload, context) {
        const { message, sessionId, subject } = payload;

        const response = await this.aiProvider.processAIRequest({
            message: message,
            userProfile: {
                name: context.username || 'Student',
                type: context.role || 'student',
                level: 'intermediate'
            },
            context: `Subject: ${subject}. SessionID: ${sessionId}`,
            complexity: 'medium'
        });

        if (sessionId) {
            aiTutorService.addMessage(sessionId, 'user', message).catch(e => console.error(e));
            aiTutorService.addMessage(sessionId, 'ai', response.text).catch(e => console.error(e));
        }

        return {
            text: response.text,
            provider: response.provider,
            confidence: response.confidence
        };
    }

    /**
     * Handler for Analytics Prediction
     * Uses the specialized PredictiveAnalyticsService
     */
    async handleAnalyticsPrediction(payload, context) {
        devLogger.log('AI_ORCHESTRATOR', `Handling Analytics Prediction for user: ${context.userId}`);

        const studentId = payload.studentId || context.userId;
        const type = payload.type || 'risk';

        if (type === 'risk') {
            return await predictiveAnalyticsService.predictAcademicRisk({
                threshold: payload.threshold || 7.0,
                includeFactors: true
            });
        } else if (type === 'trends') {
            return await predictiveAnalyticsService.analyzeTrends(payload);
        } else if (type === 'recommendations') {
            return await predictiveAnalyticsService.getPersonalizedRecommendations(studentId);
        } else if (type === 'anomalies') {
            return await predictiveAnalyticsService.detectAnomalies(payload.category || 'all');
        }

        return {
            error: 'Unknown analytics type',
            supportedTypes: ['risk', 'trends', 'recommendations', 'anomalies']
        };
    }

    /**
     * Handler for Sentiment Analysis
     */
    async handleSentimentAnalysis(payload, context) {
        const { text } = payload;
        const useLocal = text.length < 100;

        return await this.aiProvider.processAIRequest({
            message: `Analyze sentiment: "${text}"`,
            userProfile: { type: 'admin' },
            preferredProvider: useLocal ? 'local' : 'openai',
            complexity: 'low',
            systemPrompt: 'Return JSON: { score: number, label: "positive"|"negative"|"neutral" }'
        });
    }

    /**
     * Handler for Personality Profiling (VAK, etc.)
     */
    async handlePersonalityProfiling(payload, context) {
        const { action, responses } = payload;
        const userId = context.userId;

        if (action === 'get_profile') {
            return await personalityProfilingService.getProfile(userId);
        } else if (action === 'assess') {
            return await personalityProfilingService.processVAKAssessment(userId, responses);
        }

        throw new Error(`Unknown personality action: ${action}`);
    }

    /**
     * Handler for Content Generation
     */
    async handleContentGeneration(payload, context) {
        const { promptId, userInput, systemPrompt } = payload;

        return await this.aiProvider.processAIRequest({
            message: userInput || `Generate content for ${promptId}`,
            userProfile: { type: context.role || 'student' },
            context: `Prompt ID: ${promptId}`,
            complexity: 'medium',
            systemPrompt: systemPrompt || 'You are an helpful AI assistant.'
        });
    }

    /**
     * Handler for General Chat (RAG Institucional + FAQ + Context Aware)
     */
    async handleGeneralChat(payload, context) {
        const { message, language = 'es', includeContext = true } = payload;
        const userId = context.userId;

        devLogger.log('AI_ORCHESTRATOR', `Handling General Chat with RAG for user: ${userId || 'anonymous'}`);

        // 1. Ejecutar búsqueda RAG en Base de Conocimiento Institucional
        const relevantDocs = ragService.search(message, 2);
        const ragContext = ragService.buildAugmentedPrompt(message, relevantDocs);

        // 2. Obtener Historial de Conversación
        const history = userId ? await AIChatbotDAO.getChatHistory(userId, 5) : [];
        const formattedHistory = history.reverse().flatMap(row => [
            { role: 'user', content: row.user_message },
            { role: 'assistant', content: row.assistant_message }
        ]);

        // 3. Buscar FAQs complementarias si no hay documentos RAG directos
        let faqContext = '';
        if (includeContext && relevantDocs.length === 0) {
            const faqs = await AIChatbotDAO.searchRelevantFAQs(message, 2);
            if (faqs && faqs.length > 0) {
                faqContext = faqs.map((f, i) => `[FAQ ${i + 1}] Q: ${f.pregunta}\nA: ${f.respuesta}`).join('\n\n');
            }
        }

        const fullSystemPrompt = `${ragContext.systemPrompt}
        ${faqContext ? `\nINFORMACIÓN ADICIONAL DE FAQS:\n${faqContext}` : ''}`;

        try {
            const response = await this.aiProvider.processAIRequest({
                message: message,
                userProfile: {
                    name: context.username || 'Usuario',
                    type: context.role || 'guest'
                },
                systemPrompt: fullSystemPrompt,
                context: conversationHistoryToString(formattedHistory),
                complexity: 'medium'
            });

            let finalResponseText = response.text;

            // Asegurar que si hay documento oficial y la respuesta no incluye la cita, se añada explícitamente
            if (relevantDocs.length > 0 && !finalResponseText.includes('[Fuente:')) {
                finalResponseText += `\n\n[Fuente: ${relevantDocs[0].source}]`;
            }

            // 4. Guardar Historial en Base de Datos
            if (userId && finalResponseText) {
                AIChatbotDAO.saveChatMessage(userId, message, finalResponseText, response.tokensUsed || 0).catch(e => console.error(e));
            }

            return {
                success: true,
                response: finalResponseText,
                sources: ragContext.sources,
                metadata: {
                    model: response.model,
                    provider: response.provider,
                    tokens: response.tokensUsed,
                    rag_matches: relevantDocs.length
                }
            };
        } catch (error) {
            devLogger.error("AI_ORCHESTRATOR", "General Chat Error", error);
            throw error;
        }
    }
}

// Helper
function conversationHistoryToString(history) {
    return history.map(m => `${m.role}: ${m.content}`).join('\n');
}

// Singleton export
const aiService = new AIService();
module.exports = { aiService };
