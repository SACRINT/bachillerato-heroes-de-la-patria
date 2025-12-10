/**
 * 🤖 REMOTE CHATBOT IA ROUTER - TypeScript
 * Backend API para el sistema de IA educativa (OpenAI/Claude/Local)
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';
// @ts-ignore
import LocalIAProcessor from '../services/localIAProcessor';

const router: Router = express.Router();

// ============================================
// TYPES & INTERFACES
// ============================================

interface AIConfig {
    openai: {
        apiKey: string | null;
        model: string;
        endpoint: string;
    };
    claude: {
        apiKey: string | null;
        model: string;
        endpoint: string;
    };
    fallback: {
        enabled: boolean;
        useLocalIA: boolean;
    };
}

const AI_CONFIG: AIConfig = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || null,
        model: 'gpt-4',
        endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    claude: {
        apiKey: process.env.CLAUDE_API_KEY || null,
        model: 'claude-3-sonnet-20240229',
        endpoint: 'https://api.anthropic.com/v1/messages'
    },
    fallback: {
        enabled: true,
        useLocalIA: true
    }
};

interface ChatContext {
    userType?: string;
    currentPage?: string;
    sessionId?: string;
    timestamp?: number;
    requestId?: string;
    [key: string]: any;
}

interface ChatHistoryItem {
    user: string;
    assistant: string;
}

interface ProcessParams {
    message: string;
    context: ChatContext;
    conversationHistory: ChatHistoryItem[];
    systemPrompt: string;
    config: {
        maxTokens?: number;
        temperature?: number;
        model?: string;
    };
}

interface AIResponse {
    response: string;
    model?: string;
    usage?: any;
    finishReason?: string;
    stopReason?: string;
    confidence?: number;
    intent?: string;
    processingTime?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function logChatQuery(context: ChatContext, message: string): void {
    debugLog.log('CHATBOT_IA', `📝 [CHAT-IA] Query from ${context.userType || 'guest'}: "${message.substring(0, 50)}..."`);
}

function logChatResponse(context: ChatContext, response: AIResponse | null, responseTime: number, success: boolean, error: string | null = null): void {
    if (success) {
        debugLog.log('CHATBOT_IA', `✅ [CHAT-IA] Response sent (${responseTime}ms) - Model: ${response?.model || 'unknown'}`);
    } else {
        debugLog.log('CHATBOT_IA', `❌ [CHAT-IA] Response failed (${responseTime}ms) - Error: ${error}`);
    }
}

function getDefaultSystemPrompt(context: ChatContext): string {
    return `Eres un asistente educativo inteligente del Bachillerato General Estatal "Héroes de la Patria" en Puebla, México.
INFORMACIÓN INSTITUCIONAL:
- Institución de educación media superior fundada con valores de excelencia académica
- Enfoque en formación integral: académica, humana y cívica
- Población estudiantil diversa con aspiraciones universitarias
- Ubicación: Puebla, México
PERSIONALIDAD Y ESTILO:
- Amigable, profesional y motivacional
- Lenguaje claro y accesible para adolescentes y familias
- Enfoque pedagógico y orientativo
- Siempre positivo hacia el aprendizaje
CONTEXTO ACTUAL:
- Tipo de usuario: ${context.userType || 'visitante'}
- Página actual: ${context.currentPage || 'sitio web'}
- Sesión: ${context.sessionId || 'nueva'}`;
}

// ============================================
// PROVIDER HANDLERS
// ============================================

async function processWithOpenAI(params: ProcessParams): Promise<AIResponse> {
    const { message, context, conversationHistory, systemPrompt, config } = params;

    const messages: any[] = [
        { role: 'system', content: systemPrompt }
    ];

    conversationHistory.forEach(item => {
        messages.push(
            { role: 'user', content: item.user },
            { role: 'assistant', content: item.assistant }
        );
    });

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

async function processWithClaude(params: ProcessParams): Promise<AIResponse> {
    const { message, conversationHistory, systemPrompt, config } = params;

    const messages: any[] = [];

    conversationHistory.forEach(item => {
        messages.push(
            { role: 'user', content: item.user },
            { role: 'assistant', content: item.assistant }
        );
    });

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
            'x-api-key': AI_CONFIG.claude.apiKey || '',
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

async function processWithLocalIA(params: ProcessParams): Promise<AIResponse> {
    const { message, context, conversationHistory, systemPrompt } = params;

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

async function processWithAvailableIA(params: ProcessParams): Promise<AIResponse> {
    // OpenAI First
    if (AI_CONFIG.openai.apiKey) {
        try {
            const response = await processWithOpenAI(params);
            return { ...response, model: 'openai-' + AI_CONFIG.openai.model };
        } catch (error) {
            debugLog.log('CHATBOT_IA', 'OpenAI failed, trying Claude:', (error as Error).message);
        }
    }

    // Claude Second
    if (AI_CONFIG.claude.apiKey) {
        try {
            const response = await processWithClaude(params);
            return { ...response, model: 'claude-' + AI_CONFIG.claude.model };
        } catch (error) {
            debugLog.log('CHATBOT_IA', 'Claude failed, using local IA:', (error as Error).message);
        }
    }

    // Local Fallback
    const response = await processWithLocalIA(params);
    return { ...response, model: 'local-bge-ia' };
}

async function testOpenAI(): Promise<{ success: boolean; error?: string }> {
    if (!AI_CONFIG.openai.apiKey) return { success: false, error: 'API key not configured' };
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
        return response.ok ? { success: true } : { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

async function testClaude(): Promise<{ success: boolean; error?: string }> {
    if (!AI_CONFIG.claude.apiKey) return { success: false, error: 'API key not configured' };
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
        return response.ok ? { success: true } : { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/chatbot-ia/health
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        const healthStatus = {
            status: 'operational',
            timestamp: new Date().toISOString(),
            services: {
                openai: false,
                claude: false,
                localIA: true
            },
            availableModel: null as string | null,
            responseTime: Date.now()
        };

        if (AI_CONFIG.openai.apiKey) {
            const test = await testOpenAI();
            healthStatus.services.openai = test.success;
            if (test.success) healthStatus.availableModel = AI_CONFIG.openai.model;
        }

        if (AI_CONFIG.claude.apiKey && !healthStatus.availableModel) {
            const test = await testClaude();
            healthStatus.services.claude = test.success;
            if (test.success) healthStatus.availableModel = AI_CONFIG.claude.model;
        }

        if (!healthStatus.availableModel) {
            healthStatus.availableModel = 'local-bge-ia';
        }

        healthStatus.responseTime = Date.now() - healthStatus.responseTime;
        res.json(healthStatus);
    } catch (error) {
        debugLog.error('CHATBOT_IA', 'Health check error:', sanitizeError(error as Error, 'chatbot-ia'));
        res.status(500).json({ status: 'error', message: 'Health check failed', error: (error as Error).message });
    }
});

/**
 * POST /api/chatbot-ia/chat
 */
router.post('/chat', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        const {
            message,
            context = {},
            conversationHistory = [],
            systemPrompt = '',
            config = {}
        } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required', code: 'INVALID_MESSAGE' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 characters)', code: 'MESSAGE_TOO_LONG' });
        }

        const fullContext: ChatContext = {
            ...context,
            timestamp: Date.now(),
            requestId: generateRequestId()
        };

        logChatQuery(fullContext, message);

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

        res.json({
            response: response,
            metadata: {
                model: response.model || 'unknown',
                responseTime: responseTime,
                requestId: fullContext.requestId,
                timestamp: Date.now()
            }
        });

        logChatResponse(fullContext, response, responseTime, true);

    } catch (error) {
        const responseTime = Date.now() - startTime;
        debugLog.error('CHATBOT_IA', 'Chat endpoint error:', sanitizeError(error as Error, 'chatbot-ia'));

        logChatResponse(
            { requestId: generateRequestId() },
            null,
            responseTime,
            false,
            (error as Error).message
        );

        res.status(500).json({
            error: 'Internal server error processing chat request',
            code: 'CHAT_PROCESSING_ERROR',
            message: (error as Error).message,
            responseTime: responseTime
        });
    }
});

/**
 * GET /api/chatbot-ia/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
    res.json({
        totalQueries: 0,
        successRate: 100,
        averageResponseTime: 500,
        lastUpdate: new Date().toISOString()
    });
});

/**
 * POST /api/chatbot-ia/config
 */
router.post('/config', async (req: Request, res: Response) => {
    const { openaiKey, claudeKey } = req.body;
    if (openaiKey) AI_CONFIG.openai.apiKey = openaiKey;
    if (claudeKey) AI_CONFIG.claude.apiKey = claudeKey;

    res.json({ message: 'Configuration updated successfully', timestamp: new Date().toISOString() });
});

export default router;
