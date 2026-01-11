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

        // 1. Get User Profile & History (Delegate to existing service logic)
        // Ideally, we refactor AITutorService to be 'dumber' and put control here,
        // but for migration we wrap it.

        // Using RealAIService directly for the chat response for now, 
        // effectively bypassing some of the old spaghetti code in routes.

        const response = await this.aiProvider.processAIRequest({
            message: message,
            userProfile: {
                name: context.username || 'Student',
                type: context.role || 'student',
                level: 'intermediate' // TODO: Fetch real level
            },
            context: `Subject: ${subject}. SessionID: ${sessionId}`,
            complexity: 'medium'
        });

        // 2. Async: Log to session history (Fire & Forget)
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

        // Extract studentId from payload or context
        const studentId = payload.studentId || context.userId;
        const type = payload.type || 'risk'; // risk, trends, etc.

        if (type === 'risk') {
            // Using the new Service Layer DAO-based logic
            // We might need to adapt the response to match what frontend expects
            // But for now, we return the robust service response
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
     * Uses Local Logic or Lightweight model
     */
    async handleSentimentAnalysis(payload, context) {
        const { text } = payload;
        // Verify text length to decide provider
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
     * Handler for Content Generation (Intelligent Login, etc.)
     */
    async handleContentGeneration(payload, context) {
        // e.g. payload: { promptId: 'basic-summary', userInput: '...', userProfile: {} }
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
     * Handler for General Chat (FAQ + Context Aware)
     */
    async handleGeneralChat(payload, context) {
        const { message, language = 'es', includeContext = true } = payload;
        const userId = context.userId;

        devLogger.log('AI_ORCHESTRATOR', `Handling General Chat for user: ${userId}`);

        // 1. Get History
        const history = userId ? await AIChatbotDAO.getChatHistory(userId, 5) : [];
        const formattedHistory = history.reverse().flatMap(row => [
            { role: 'user', content: row.user_message },
            { role: 'assistant', content: row.assistant_message }
        ]);

        // 2. Search FAQs
        let faqContext = '';
        if (includeContext) {
            const faqs = await AIChatbotDAO.searchRelevantFAQs(message, 3);
            if (faqs && faqs.length > 0) {
                faqContext = faqs.map((f, i) => `[FAQ ${i + 1}] Q: ${f.pregunta}\nA: ${f.respuesta}`).join('\n\n');
            }
        }

        // 3. Call AI
        const systemPrompt = `Eres un asistente virtual académico del Bachillerato General Estatal por Competencias "Héroes de la Patria".
        Tu objetivo es ayudar con información académica y administrativa.
        Responde de manera amigable, profesional y concisa. Siempre en español.

        INFORMACIÓN INSTITUCIONAL CLAVE:
        - Institución: Bachillerato General Estatal "Héroes de la Patria"
        - Director: Ing. Samuel Cruz Interial (Director General, con +23 años de experiencia)
        - Ubicación: C. Manuel Ávila Camacho #7, Col. Centro, Coronel Tito Hernández, Venustiano Carranza, Puebla. C.P. 73030.
        - Horarios: Lunes a Viernes de 8:00 AM a 1:30 PM.
        - CCT: 21EBH0200X.

        ${faqContext ? `\nUsa la siguiente información de la base de conocimiento si es relevante:\n${faqContext}` : ''}`;

        try {
            const response = await this.aiProvider.processAIRequest({
                message: message,
                userProfile: {
                    name: context.username || 'Usuario',
                    type: context.role || 'guest'
                },
                systemPrompt: systemPrompt,
                context: conversationHistoryToString(formattedHistory),
                complexity: 'medium'
            });

            // 4. Save History (Async)
            if (userId && response.text) {
                AIChatbotDAO.saveChatMessage(userId, message, response.text, response.tokensUsed || 0).catch(e => console.error(e));
            }

            return {
                success: true,
                response: response.text,
                metadata: {
                    model: response.model,
                    tokens: response.tokensUsed
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
