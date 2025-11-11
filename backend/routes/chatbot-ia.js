/**
 * BACKEND API - CHATBOT IA AVANZADO BGE
 * Rutas y lógica del servidor para el sistema de IA educativa
 *
 * Versión: 3.0 - Fase 3 IA Avanzada
 * Fecha: 25 Septiembre 2025
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();

// Configuración de IA (se configurará con variables de entorno)
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

/**
 * HEALTH CHECK - Verificar estado del sistema IA
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = {
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
            } catch (error) {
                devLogger.warn('OpenAI health check failed:', error.message);
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
            } catch (error) {
                devLogger.warn('Claude health check failed:', error.message);
            }
        }

        // Si no hay modelos externos, usar IA local
        if (!healthStatus.availableModel) {
            healthStatus.availableModel = 'local-bge-ia';
        }

        healthStatus.responseTime = Date.now() - healthStatus.responseTime;

        res.json(healthStatus);

    } catch (error) {
        devLogger.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

/**
 * CHAT ENDPOINT PRINCIPAL
 */
router.post('/chat', async (req, res) => {
    const startTime = Date.now();

    try {
        const {
            message,
            context = {},
            conversationHistory = [],
            systemPrompt = '',
            config = {}
        } = req.body;

        // Validación de entrada
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Message is required',
                code: 'INVALID_MESSAGE'
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                error: 'Message too long (max 2000 characters)',
                code: 'MESSAGE_TOO_LONG'
            });
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
        const response = await processWithAvailableIA({
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

    } catch (error) {
        const responseTime = Date.now() - startTime;

        devLogger.error('Chat endpoint error:', error);

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

/**
 * PROCESAR CON IA DISPONIBLE
 */
async function processWithAvailableIA(params) {
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

        } catch (error) {
            devLogger.warn('OpenAI failed, trying Claude:', error.message);
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

        } catch (error) {
            devLogger.warn('Claude failed, using local IA:', error.message);
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

/**
 * PROCESAMIENTO CON OPENAI
 */
async function processWithOpenAI(params) {
    const { message, context, conversationHistory, systemPrompt, config } = params;

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        }
    ];

    // Agregar historial de conversación
    conversationHistory.forEach(item => {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
    }

    return {
        response: data.choices[0].message.content,
        usage: data.usage,
        finishReason: data.choices[0].finish_reason
    };
}

/**
 * PROCESAMIENTO CON CLAUDE
 */
async function processWithClaude(params) {
    const { message, context, conversationHistory, systemPrompt, config } = params;

    // Preparar mensajes para Claude
    const messages = [];

    // Agregar historial de conversación
    conversationHistory.forEach(item => {
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
            'x-api-key': AI_CONFIG.claude.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response from Claude API');
    }

    return {
        response: data.content[0].text,
        usage: data.usage,
        stopReason: data.stop_reason
    };
}

/**
 * PROCESAMIENTO CON IA LOCAL (FALLBACK)
 */
async function processWithLocalIA(params) {
    const { message, context, conversationHistory, systemPrompt } = params;

    // Importar el sistema local de IA
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

/**
 * OBTENER PROMPT DEL SISTEMA POR DEFECTO
 */
function getDefaultSystemPrompt(context) {
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

/**
 * FUNCIONES DE TESTING
 */
async function testOpenAI() {
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

    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testClaude() {
    if (!AI_CONFIG.claude.apiKey) {
        return { success: false, error: 'API key not configured' };
    }

    try {
        const response = await fetch(AI_CONFIG.claude.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': AI_CONFIG.claude.apiKey,
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

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * UTILIDADES
 */
function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function logChatQuery(context, message) {
    devLogger.log(`📝 [CHAT-IA] Query from ${context.userType || 'guest'}: "${message.substring(0, 50)}..."`);
}

function logChatResponse(context, response, responseTime, success, error = null) {
    if (success) {
        devLogger.log(`✅ [CHAT-IA] Response sent (${responseTime}ms) - Model: ${response?.model || 'unknown'}`);
    } else {
        devLogger.log(`❌ [CHAT-IA] Response failed (${responseTime}ms) - Error: ${error}`);
    }
}

/**
 * ESTADÍSTICAS Y MÉTRICAS
 */
router.get('/stats', async (req, res) => {
    try {
        // Aquí podrías implementar estadísticas reales
        // Por ahora retornamos datos de ejemplo
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

    } catch (error) {
        devLogger.error('Stats endpoint error:', error);
        res.status(500).json({
            error: 'Error retrieving stats',
            message: error.message
        });
    }
});

/**
 * CONFIGURACIÓN ENDPOINT (solo para admins)
 */
router.post('/config', async (req, res) => {
    try {
        // Aquí implementarías autenticación de admin
        // const isAdmin = await checkAdminAuth(req);
        // if (!isAdmin) {
        //     return res.status(403).json({ error: 'Admin access required' });
        // }

        const { openaiKey, claudeKey, defaultModel } = req.body;

        // Actualizar configuración (en producción usar variables de entorno)
        if (openaiKey) AI_CONFIG.openai.apiKey = openaiKey;
        if (claudeKey) AI_CONFIG.claude.apiKey = claudeKey;

        res.json({
            message: 'Configuration updated successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        devLogger.error('Config endpoint error:', error);
        res.status(500).json({
            error: 'Error updating configuration',
            message: error.message
        });
    }
});

module.exports = router;