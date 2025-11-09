/**
 * 🚀 SERVICIO DE IA REAL - FASE 4 BGE
 * Integración completa con OpenAI GPT-4 y Claude (Anthropic)
 * Sistema de respaldo inteligente entre proveedores de IA
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { getLocalIAProcessor } = require('./localIAProcessor');
// ✅ FIX (9 NOV 2025): Agregar importación de logger para evitar ReferenceError
const console_log = console.log;  // Usar console.log nativo en lugar de devLog

class RealAIService {
    constructor() {
        this.isInitialized = false;
        this.providers = {
            openai: null,
            anthropic: null,
            local: null
        };

        this.providerStatus = {
            openai: false,
            anthropic: false,
            local: true
        };

        this.usage = {
            openai: { requests: 0, tokens: 0, errors: 0 },
            anthropic: { requests: 0, tokens: 0, errors: 0 },
            local: { requests: 0, tokens: 0, errors: 0 }
        };

        this.rateLimits = {
            openai: { requestsPerMinute: 50, tokensPerMinute: 90000 },
            anthropic: { requestsPerMinute: 60, tokensPerMinute: 100000 }
        };

        this.initialize();
    }

    /**
     * 🔧 Inicializar proveedores de IA
     */
    async initialize() {
        console.log('🚀 Inicializando servicio de IA real...');

        // Configurar OpenAI
        if (process.env.OPENAI_API_KEY) {
            try {
                this.providers.openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                    timeout: 30000
                });

                // Test de conectividad
                await this.testOpenAIConnection();
                this.providerStatus.openai = true;
                console.log('✅ OpenAI GPT-4 configurado correctamente');
            } catch (error) {
                console.warn('⚠️ Error configurando OpenAI:', error.message);
                this.providerStatus.openai = false;
            }
        } else {
            console.warn('⚠️ OPENAI_API_KEY no configurada');
        }

        // Configurar Anthropic Claude
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                this.providers.anthropic = new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY,
                    timeout: 30000
                });

                // Test de conectividad
                await this.testAnthropicConnection();
                this.providerStatus.anthropic = true;
                console.log('✅ Anthropic Claude configurado correctamente');
            } catch (error) {
                console.warn('⚠️ Error configurando Anthropic:', error.message);
                this.providerStatus.anthropic = false;
            }
        } else {
            console.warn('⚠️ ANTHROPIC_API_KEY no configurada');
        }

        // Configurar procesador local como respaldo
        try {
            this.providers.local = getLocalIAProcessor();
            this.providerStatus.local = true;
            console.log('✅ Procesador local IA configurado como respaldo');
        } catch (error) {
            console.error('❌ Error configurando procesador local:', error);
            this.providerStatus.local = false;
        }

        this.isInitialized = true;
        console.log('🎯 Servicio de IA real inicializado:', this.getProviderSummary());
    }

    /**
     * 🧪 Test de conexión OpenAI
     */
    async testOpenAIConnection() {
        const response = await this.providers.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
        });
        return response.choices[0].message.content;
    }

    /**
     * 🧪 Test de conexión Anthropic
     */
    async testAnthropicConnection() {
        const response = await this.providers.anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Test' }]
        });
        return response.content[0].text;
    }

    /**
     * 🎯 Procesar solicitud de IA con estrategia inteligente
     */
    async processAIRequest(requestData) {
        const { message, context, userProfile, systemPrompt, preferredProvider } = requestData;

        // Validar entrada
        const validation = this.validateInput(message);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Determinar mejor proveedor disponible
        const provider = this.selectBestProvider(requestData, preferredProvider);

        console.log(`🤖 Procesando con proveedor: ${provider.toUpperCase()}`);

        try {
            let response;

            switch (provider) {
                case 'openai':
                    response = await this.processWithOpenAI(requestData);
                    break;
                case 'anthropic':
                    response = await this.processWithAnthropic(requestData);
                    break;
                case 'local':
                    response = await this.processWithLocal(requestData);
                    break;
                default:
                    throw new Error('No hay proveedores disponibles');
            }

            // Registrar uso exitoso
            this.usage[provider].requests++;
            this.usage[provider].tokens += response.tokensUsed || 0;

            return {
                ...response,
                provider: provider,
                timestamp: new Date().toISOString(),
                status: 'success'
            };

        } catch (error) {
            // Registrar error
            this.usage[provider].errors++;

            console.error(`❌ Error con proveedor ${provider}:`, error.message);

            // Intentar con proveedor de respaldo
            return await this.processWithFallback(requestData, provider);
        }
    }

    /**
     * 🔄 Seleccionar mejor proveedor disponible
     */
    selectBestProvider(requestData, preferredProvider) {
        const { complexity, userProfile, requiresRealtime } = requestData;

        // Si se especifica un proveedor preferido y está disponible
        if (preferredProvider && this.providerStatus[preferredProvider]) {
            return preferredProvider;
        }

        // Estrategia inteligente basada en contexto
        if (complexity === 'high' && this.providerStatus.anthropic) {
            return 'anthropic'; // Claude es excelente para análisis complejos
        }

        if (complexity === 'medium' && this.providerStatus.openai) {
            return 'openai'; // GPT-4 para tareas generales
        }

        // Prioridad por disponibilidad
        if (this.providerStatus.openai) return 'openai';
        if (this.providerStatus.anthropic) return 'anthropic';
        if (this.providerStatus.local) return 'local';

        throw new Error('No hay proveedores de IA disponibles');
    }

    /**
     * 🤖 Procesar con OpenAI GPT-4
     */
    async processWithOpenAI(requestData) {
        const { message, context, userProfile, systemPrompt } = requestData;

        const messages = [
            {
                role: 'system',
                content: systemPrompt || this.getSystemPrompt(userProfile.type)
            },
            {
                role: 'system',
                content: `Contexto del usuario: ${userProfile.name} (${userProfile.type})
                Nivel académico: ${userProfile.level || 'No especificado'}
                Contexto adicional: ${context || 'Ninguno'}`
            },
            {
                role: 'user',
                content: message
            }
        ];

        const response = await this.providers.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: messages,
            max_tokens: this.getMaxTokens(userProfile.type),
            temperature: this.getTemperature(userProfile.type),
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
        });

        return {
            text: response.choices[0].message.content,
            tokensUsed: response.usage.total_tokens,
            model: 'gpt-4-turbo-preview',
            confidence: 0.95
        };
    }

    /**
     * 🧠 Procesar con Anthropic Claude
     */
    async processWithAnthropic(requestData) {
        const { message, context, userProfile, systemPrompt } = requestData;

        const systemMessage = systemPrompt || this.getSystemPrompt(userProfile.type);
        const contextMessage = `Contexto: Usuario ${userProfile.name} (${userProfile.type}), nivel ${userProfile.level}. ${context || ''}`;

        const response = await this.providers.anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: this.getMaxTokens(userProfile.type),
            temperature: this.getTemperature(userProfile.type),
            system: `${systemMessage}\n\n${contextMessage}`,
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ]
        });

        return {
            text: response.content[0].text,
            tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
            model: 'claude-3-sonnet',
            confidence: 0.92
        };
    }

    /**
     * 💻 Procesar con IA local (respaldo)
     */
    async processWithLocal(requestData) {
        const { message, context, userProfile, systemPrompt } = requestData;

        const response = await this.providers.local.process({
            message: message,
            context: context,
            conversationHistory: [],
            systemPrompt: systemPrompt || this.getSystemPrompt(userProfile.type)
        });

        return {
            text: response.text,
            tokensUsed: 0,
            model: 'local-nlp',
            confidence: response.confidence || 0.7,
            isLocal: true
        };
    }

    /**
     * 🔄 Procesamiento con respaldo
     */
    async processWithFallback(requestData, failedProvider) {
        console.log(`🔄 Activando respaldo después de falla en ${failedProvider}`);

        const availableProviders = Object.keys(this.providerStatus)
            .filter(p => p !== failedProvider && this.providerStatus[p]);

        if (availableProviders.length === 0) {
            throw new Error('Todos los proveedores de IA están fallando');
        }

        // Intentar con el siguiente mejor proveedor
        const fallbackProvider = availableProviders[0];

        try {
            const response = await this.processAIRequest({
                ...requestData,
                preferredProvider: fallbackProvider
            });

            return {
                ...response,
                fallbackUsed: true,
                originalProvider: failedProvider
            };
        } catch (error) {
            console.error('❌ Error en proveedor de respaldo:', error);
            throw new Error('Falla en todos los proveedores de IA');
        }
    }

    /**
     * 📋 Obtener prompts del sistema por tipo de usuario
     */
    getSystemPrompt(userType) {
        const prompts = {
            student: `Eres un tutor educativo experto para estudiantes de bachillerato mexicano.
            Responde de manera clara, didáctica y motivadora. Usa ejemplos relevantes para México.
            Adapta tu lenguaje al nivel de bachillerato y mantén un tono amigable pero profesional.`,

            teacher: `Eres un asistente pedagógico especializado para docentes de bachillerato.
            Proporciona estrategias didácticas, recursos educativos y orientación pedagógica.
            Considera el contexto del sistema educativo mexicano y las mejores prácticas docentes.`,

            parent: `Eres un consejero familiar especializado en educación de adolescentes.
            Responde con empatía y proporciona consejos prácticos para padres de familia.
            Enfócate en la comunicación efectiva y el apoyo académico desde casa.`,

            admin: `Eres un consultor educativo especializado en gestión institucional.
            Proporciona análisis estratégicos, métricas educativas y recomendaciones administrativas.
            Mantén un enfoque profesional basado en datos y mejores prácticas educativas.`
        };

        return prompts[userType] || prompts.student;
    }

    /**
     * 🎛️ Configuración por tipo de usuario
     */
    getMaxTokens(userType) {
        const limits = {
            student: 800,
            teacher: 1200,
            parent: 600,
            admin: 1500
        };
        return limits[userType] || 800;
    }

    getTemperature(userType) {
        const temps = {
            student: 0.7,
            teacher: 0.6,
            parent: 0.8,
            admin: 0.5
        };
        return temps[userType] || 0.7;
    }

    /**
     * 🔍 Validar entrada
     */
    validateInput(input) {
        if (!input || typeof input !== 'string') {
            return { valid: false, error: 'Entrada no válida' };
        }

        if (input.length > 4000) {
            return { valid: false, error: 'Mensaje demasiado largo (máximo 4000 caracteres)' };
        }

        if (input.trim().length < 2) {
            return { valid: false, error: 'Mensaje demasiado corto' };
        }

        return { valid: true };
    }

    /**
     * 📊 Obtener estadísticas del servicio
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            providers: this.providerStatus,
            usage: this.usage,
            uptime: process.uptime(),
            availableProviders: Object.keys(this.providerStatus).filter(p => this.providerStatus[p]),
            totalRequests: Object.values(this.usage).reduce((sum, p) => sum + p.requests, 0),
            totalTokens: Object.values(this.usage).reduce((sum, p) => sum + p.tokens, 0),
            totalErrors: Object.values(this.usage).reduce((sum, p) => sum + p.errors, 0)
        };
    }

    /**
     * 📋 Resumen de proveedores
     */
    getProviderSummary() {
        const active = Object.keys(this.providerStatus).filter(p => this.providerStatus[p]);
        return {
            active: active,
            count: active.length,
            primary: active[0] || 'ninguno',
            fallback: active.slice(1)
        };
    }

    /**
     * 🔄 Recargar configuración
     */
    async reload() {
        console.log('🔄 Recargando configuración de IA real...');
        this.isInitialized = false;
        await this.initialize();
        return this.getStats();
    }

    /**
     * 🧹 Limpiar estadísticas
     */
    clearStats() {
        Object.keys(this.usage).forEach(provider => {
            this.usage[provider] = { requests: 0, tokens: 0, errors: 0 };
        });
        console.log('📊 Estadísticas de uso limpiadas');
    }
}

// Singleton
let realAIServiceInstance = null;

function getRealAIService() {
    if (!realAIServiceInstance) {
        realAIServiceInstance = new RealAIService();
    }
    return realAIServiceInstance;
}

module.exports = {
    RealAIService,
    getRealAIService
};