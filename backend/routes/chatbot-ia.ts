/**
 * BACKEND API - CHATBOT IA AVANZADO BGE - TypeScript
 * Rutas y lógica del servidor para el sistema de IA educativa
 * Migrado: 08 Diciembre 2025
 *
 * Versión: 3.0 - Fase 3 IA Avanzada
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError } from '../utils/sanitized-errors';

const router = express.Router();

// ============================================
// CONFIG Y TIPOS
// ============================================

const AI_CONFIG = {
    // OpenAI Configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY || null,
        model: 'gpt-4',
        endpoint: 'https://api.openai.com/v1/chat/completions'
    },

    // Claude Configuration (Anthropic)
    claude: {
        apiKey: process.env.CLAUDE_API_KEY || null,
        model: 'claude-3-sonnet-20240229',
        endpoint: 'https://api.anthropic.com/v1/messages'
    },

    // Fallback settings
    fallback: {
        enabled: true,
        useLocalIA: true
    }
};

interface ChatRequest {
    message: string;
    context?: any;
    conversationHistory?: Array<{ user: string; assistant: string }>;
    systemPrompt?: string;
    config?: {
        maxTokens?: number;
        temperature?: number;
        model?: string;
    };
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * HEALTH CHECK - Verificar estado del sistema IA
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
        const healthStatus: any = {
            status: 'operational',
            timestamp: new Date().toISOString(),
            services: {
                openai: false,
                claude: false,
                localIA: true
            },
            availableModel: null,
            responseTime: Date.now()
        };

        // Verificar OpenAI
        if (AI_CONFIG.openai.apiKey) {
            try {
                const testResponse = await testOpenAI();
                healthStatus.services.openai = testResponse.success;
                if (testResponse.success) {
                    healthStatus.availableModel = AI_CONFIG.openai.model;
                }
            } catch (error: any) {
                debugLog.log('CHATBOT_IA', 'OpenAI health check failed:', error.message);
            }
        }

        // Verificar Claude
        if (AI_CONFIG.claude.apiKey && !healthStatus.availableModel) {
            try {
                const testResponse = await testClaude();
                healthStatus.services.claude = testResponse.success;
                if (testResponse.success) {
                    healthStatus.availableModel = AI_CONFIG.claude.model;
                }
            } catch (error: any) {
                debugLog.log('CHATBOT_IA', 'Claude health check failed:', error.message);
            }
        }

        // Si no hay modelos externos, usar IA local
        if (!healthStatus.availableModel) {
            healthStatus.availableModel = 'local-bge-ia';
        }

        healthStatus.responseTime = Date.now() - healthStatus.responseTime;

        res.json(healthStatus);

    } catch (error: any) {
        debugLog.error('CHATBOT_IA', 'Health check error:', sanitizeError(error, 'chatbot-ia'));
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// ============================================
// CHAT ENDPOINT PRINCIPAL
// ============================================

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
        const {
            message,
            context = {},
            conversationHistory = [],
            systemPrompt = '',
            config = {}
        } = req.body as ChatRequest;

        // Validación de entrada
        if (!message || message.trim().length === 0) {
            res.status(400).json({
                error: 'Message is required',
                code: 'INVALID_MESSAGE'
            });
            return;
        }

        if (message.length > 2000) {
            res.status(400).json({
                error: 'Message too long (max 2000 characters)',
                code: 'MESSAGE_TOO_LONG'
            });
            return;
        }

        // Preparar el contexto completo
        const fullContext = {
            ...context,
            timestamp: Date.now(),
            requestId: generateRequestId()
        };

        // Log de la consulta (para analytics)
        logChatQuery(fullContext, message);

        // Procesar con IA disponible
        const response: any = await processWithAvailableIA({
            message,
            context: fullContext,
            conversationHistory,
            systemPrompt: systemPrompt || getDefaultSystemPrompt(context),
            config: {
                maxTokens: config.maxTokens || 1500,
                temperature: config.temperature || 0.7,
                model: config.model || null
            }
        });

        const responseTime = Date.now() - startTime;

        // Respuesta exitosa
        res.json({
            response: response,
            metadata: {
                model: response.model || 'unknown',
                responseTime: responseTime,
                requestId: fullContext.requestId,
                timestamp: Date.now()
            }
        });

        // Log de respuesta exitosa
        logChatResponse(fullContext, response, responseTime, true);

    } catch (error: any) {
        const responseTime = Date.now() - startTime;

        debugLog.error('CHATBOT_IA', 'Chat endpoint error:', sanitizeError(error, 'chatbot-ia'));

        // Log de error
        logChatResponse(
            { requestId: generateRequestId() },
            null,
            responseTime,
            false,
            error.message
        );

        // Respuesta de error
        res.status(500).json({
            error: 'Internal server error processing chat request',
            code: 'CHAT_PROCESSING_ERROR',
            message: error.message,
            responseTime: responseTime
        });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function processWithAvailableIA(params: any): Promise<any> {
    const { message, context, conversationHistory, systemPrompt, config } = params;

    // Intentar con OpenAI primero
    if (AI_CONFIG.openai.apiKey) {
        try {
            const response = await processWithOpenAI({
                message,
                context,
                conversationHistory,
                systemPrompt,
                config
            });

            return {
                ...response,
                model: 'openai-' + AI_CONFIG.openai.model
            };

        } catch (error: any) {
            debugLog.log('CHATBOT_IA', 'OpenAI failed, trying Claude:', error.message);
        }
    }

    // Intentar con Claude
    if (AI_CONFIG.claude.apiKey) {
        try {
            const response = await processWithClaude({
                message,
                context,
                conversationHistory,
                systemPrompt,
                config
            });

            return {
                ...response,
                model: 'claude-' + AI_CONFIG.claude.model
            };

        } catch (error: any) {
            debugLog.log('CHATBOT_IA', 'Claude failed, using local IA:', error.message);
        }
    }

    // Fallback a IA local
    const response = await processWithLocalIA({
        message,
        context,
        conversationHistory,
        systemPrompt,
        config
    });

    return {
        ...response,
        model: 'local-bge-ia'
    };
}

async function processWithOpenAI(params: any) {
    const { message, context, conversationHistory, systemPrompt, config } = params;

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        }
    ];

    // Agregar historial de conversación
    conversationHistory.forEach((item: any) => {
        messages.push(
            { role: 'user', content: item.user },
            { role: 'assistant', content: item.assistant }
        );
    });

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message });

    const requestBody = {
        model: config.model || AI_CONFIG.openai.model,
        messages: messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        user: context.sessionId || 'anonymous'
    };

    const response = await fetch(AI_CONFIG.openai.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: any = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
    }

    return {
        response: data.choices[0].message.content,
        usage: data.usage,
        finishReason: data.choices[0].finish_reason
    };
}

async function processWithClaude(params: any) {
    const { message, context, conversationHistory, systemPrompt, config } = params;

    // Preparar mensajes para Claude
    const messages = [];

    // Agregar historial de conversación
    conversationHistory.forEach((item: any) => {
        messages.push(
            { role: 'user', content: item.user },
            { role: 'assistant', content: item.assistant }
        );
    });

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message });

    const requestBody = {
        model: config.model || AI_CONFIG.claude.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        messages: messages
    };

    const response = await fetch(AI_CONFIG.claude.endpoint, {
        method: 'POST',
        headers: {
            'x-api-key': AI_CONFIG.claude.apiKey!,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: any = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response from Claude API');
    }

    return {
        response: data.content[0].text,
        usage: data.usage,
        stopReason: data.stop_reason
    };
}

async function processWithLocalIA(params: any) {
    const { message, context, conversationHistory, systemPrompt } = params;

    // Importar el sistema local de IA
    // @ts-ignore
    const LocalIAProcessor = require('../services/localIAProcessor');
    const processor = new LocalIAProcessor();

    const response = await processor.process({
        message,
        context,
        conversationHistory,
        systemPrompt
    });

    return {
        response: response.text,
        confidence: response.confidence,
        intent: response.intent,
        processingTime: response.processingTime
    };
}

function getDefaultSystemPrompt(context: any) {
    const basePrompt = `Eres un asistente educativo inteligente del Bachillerato General Estatal "Héroes de la Patria" en Puebla, México.

INFORMACIÓN INSTITUCIONAL:
- Institución de educación media superior fundada con valores de excelencia académica
- Enfoque en formación integral: académica, humana y cívica
- Población estudiantil diversa con aspiraciones universitarias
- Ubicación: Puebla, México

PERSONALIDAD Y ESTILO:
- Amigable, profesional y motivacional
- Lenguaje claro y accesible para adolescentes y familias
- Enfoque pedagógico y orientativo
- Siempre positivo hacia el aprendizaje

CAPACIDADES:
- Información sobre admisiones, requisitos y procesos
- Orientación académica sobre materias y plan de estudios
- Información sobre instalaciones y servicios
- Actividades extracurriculares y eventos
- Contacto e información práctica

INSTRUCCIONES:
- Responde SIEMPRE en español mexicano
- Mantén un tono educativo y motivador
- Si no sabes algo específico, admítelo y ofrece alternativas
- Incluye llamadas a la acción apropiadas
- Evita información médica, legal o financiera específica
- Fomenta los valores educativos y el crecimiento personal

CONTEXTO ACTUAL:
- Tipo de usuario: ${context.userType || 'visitante'}
- Página actual: ${context.currentPage || 'sitio web'}
- Sesión: ${context.sessionId || 'nueva'}`;

    return basePrompt;
}

// ============================================
// TESTING FUNCTIONS
// ============================================

async function testOpenAI(): Promise<{ success: boolean; error?: string }> {
    if (!AI_CONFIG.openai.apiKey) {
        return { success: false, error: 'API key not configured' };
    }

    try {
        const response = await fetch(AI_CONFIG.openai.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_CONFIG.openai.model,
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 5
            })
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: `HTTP ${response.status}` };
        }

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function testClaude(): Promise<{ success: boolean; error?: string }> {
    if (!AI_CONFIG.claude.apiKey) {
        return { success: false, error: 'API key not configured' };
    }

    try {
        const response = await fetch(AI_CONFIG.claude.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': AI_CONFIG.claude.apiKey!,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: AI_CONFIG.claude.model,
                max_tokens: 5,
                messages: [{ role: 'user', content: 'Test' }]
            })
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: `HTTP ${response.status}` };
        }

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ============================================
// UTILS
// ============================================

function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function logChatQuery(context: any, message: string) {
    debugLog.log('CHATBOT_IA', `📝 [CHAT-IA] Query from ${context.userType || 'guest'}: "${message.substring(0, 50)}..."`);
}

function logChatResponse(context: any, response: any, responseTime: number, success: boolean, error: string | null = null) {
    if (success) {
        debugLog.log('CHATBOT_IA', `✅ [CHAT-IA] Response sent (${responseTime}ms) - Model: ${response?.model || 'unknown'}`);
    } else {
        debugLog.log('CHATBOT_IA', `❌ [CHAT-IA] Response failed (${responseTime}ms) - Error: ${error}`);
    }
}

// ============================================
// OTHER ROUTES
// ============================================

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = {
            totalQueries: 0,
            successRate: 100,
            averageResponseTime: 500,
            modelUsage: {
                openai: 0,
                claude: 0,
                local: 0
            },
            userTypes: {
                guest: 0,
                student: 0,
                teacher: 0,
                admin: 0
            },
            lastUpdate: new Date().toISOString()
        };

        res.json(stats);

    } catch (error: any) {
        debugLog.error('CHATBOT_IA', 'Stats endpoint error:', sanitizeError(error, 'chatbot-ia'));
        res.status(500).json({
            error: 'Error retrieving stats',
            message: error.message
        });
    }
});

router.post('/config', async (req: Request, res: Response): Promise<void> => {
    try {
        const { openaiKey, claudeKey, defaultModel } = req.body;

        if (openaiKey) AI_CONFIG.openai.apiKey = openaiKey;
        if (claudeKey) AI_CONFIG.claude.apiKey = claudeKey;

        res.json({
            message: 'Configuration updated successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        debugLog.error('CHATBOT_IA', 'Config endpoint error:', sanitizeError(error, 'chatbot-ia'));
        res.status(500).json({
            error: 'Error updating configuration',
            message: error.message
        });
    }
});

// @ts-ignore
export = router;
