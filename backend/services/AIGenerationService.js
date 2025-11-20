/**
 * 🤖 AI Generation Service
 * Servicio unificado para generación con múltiples proveedores de IA
 * FASE 1 - Semana 3-4
 */

const { executeQuery } = require('../data/database-access');

class AIGenerationService {
    constructor() {
        // Configuración de proveedores
        this.providers = {
            openai: {
                name: 'OpenAI',
                models: {
                    'gpt-4': { costPerRequest: 30, maxTokens: 8000 },
                    'gpt-4-turbo': { costPerRequest: 20, maxTokens: 128000 },
                    'gpt-3.5-turbo': { costPerRequest: 5, maxTokens: 4000 }
                },
                baseUrl: 'https://api.openai.com/v1'
            },
            anthropic: {
                name: 'Anthropic',
                models: {
                    'claude-3-opus': { costPerRequest: 40, maxTokens: 200000 },
                    'claude-3-sonnet': { costPerRequest: 15, maxTokens: 200000 },
                    'claude-3-haiku': { costPerRequest: 5, maxTokens: 200000 }
                },
                baseUrl: 'https://api.anthropic.com/v1'
            },
            gemini: {
                name: 'Google Gemini',
                models: {
                    'gemini-pro': { costPerRequest: 10, maxTokens: 32000 },
                    'gemini-pro-vision': { costPerRequest: 15, maxTokens: 32000 }
                },
                baseUrl: 'https://generativelanguage.googleapis.com/v1'
            }
        };

        // Tipos de generación disponibles
        this.generationTypes = {
            text: { name: 'Texto', description: 'Generación de texto general' },
            essay: { name: 'Ensayo', description: 'Ensayos académicos' },
            summary: { name: 'Resumen', description: 'Resúmenes de textos' },
            code: { name: 'Código', description: 'Generación de código' },
            explanation: { name: 'Explicación', description: 'Explicaciones educativas' },
            quiz: { name: 'Quiz', description: 'Preguntas de evaluación' },
            translation: { name: 'Traducción', description: 'Traducción de textos' }
        };
    }

    /**
     * Generar contenido con IA
     */
    async generate(userId, options) {
        const {
            provider = 'openai',
            model = 'gpt-3.5-turbo',
            prompt,
            systemPrompt = '',
            generationType = 'text',
            maxTokens = 1000,
            temperature = 0.7
        } = options;

        // Validar proveedor y modelo
        if (!this.providers[provider]) {
            throw new Error(`Proveedor no soportado: ${provider}`);
        }

        const providerConfig = this.providers[provider];
        if (!providerConfig.models[model]) {
            throw new Error(`Modelo no soportado: ${model}`);
        }

        const modelConfig = providerConfig.models[model];

        // Verificar balance de IACoins
        const balance = await this.getUserBalance(userId);
        if (balance < modelConfig.costPerRequest) {
            throw new Error(`Saldo insuficiente. Necesitas ${modelConfig.costPerRequest} IACoins, tienes ${balance}`);
        }

        // Registrar inicio de generación
        const generationId = await this.createGenerationRecord(userId, {
            provider,
            model,
            generationType,
            prompt: prompt.substring(0, 500), // Guardar solo los primeros 500 chars
            status: 'processing'
        });

        try {
            // Llamar al proveedor de IA
            let result;
            switch (provider) {
                case 'openai':
                    result = await this.callOpenAI(model, prompt, systemPrompt, maxTokens, temperature);
                    break;
                case 'anthropic':
                    result = await this.callAnthropic(model, prompt, systemPrompt, maxTokens, temperature);
                    break;
                case 'gemini':
                    result = await this.callGemini(model, prompt, maxTokens, temperature);
                    break;
                default:
                    throw new Error(`Proveedor no implementado: ${provider}`);
            }

            // Cobrar IACoins
            await this.chargeUser(userId, modelConfig.costPerRequest, {
                description: `Generación ${generationType} con ${providerConfig.name} ${model}`,
                referenceType: 'ai_generation',
                referenceId: generationId
            });

            // Actualizar registro de generación
            await this.updateGenerationRecord(generationId, {
                status: 'completed',
                tokensUsed: result.tokensUsed || 0,
                coinsCost: modelConfig.costPerRequest,
                responseLength: result.content.length
            });

            return {
                success: true,
                content: result.content,
                tokensUsed: result.tokensUsed,
                coinsCost: modelConfig.costPerRequest,
                generationId,
                provider: providerConfig.name,
                model
            };

        } catch (error) {
            // Actualizar registro con error
            await this.updateGenerationRecord(generationId, {
                status: 'failed',
                errorMessage: error.message
            });

            throw error;
        }
    }

    /**
     * Llamar a OpenAI API
     */
    async callOpenAI(model, prompt, systemPrompt, maxTokens, temperature) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            // Modo demo si no hay API key
            return this.generateDemoResponse('openai', prompt);
        }

        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    /**
     * Llamar a Anthropic API
     */
    async callAnthropic(model, prompt, systemPrompt, maxTokens, temperature) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return this.generateDemoResponse('anthropic', prompt);
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                system: systemPrompt || undefined,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Anthropic Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0
        };
    }

    /**
     * Llamar a Google Gemini API
     */
    async callGemini(model, prompt, maxTokens, temperature) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return this.generateDemoResponse('gemini', prompt);
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Gemini Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
            tokensUsed: data.usageMetadata?.totalTokenCount || 0
        };
    }

    /**
     * Generar respuesta demo (sin API key)
     */
    generateDemoResponse(provider, prompt) {
        const demoResponses = {
            openai: `[Demo OpenAI] Esta es una respuesta de demostración para tu prompt: "${prompt.substring(0, 50)}..."

En un entorno de producción, aquí recibirías una respuesta real de GPT-4 o GPT-3.5-turbo.

Para activar las respuestas reales, configura OPENAI_API_KEY en las variables de entorno.`,

            anthropic: `[Demo Anthropic Claude] Respuesta de demostración para: "${prompt.substring(0, 50)}..."

Claude proporcionaría aquí un análisis detallado y bien estructurado.

Configura ANTHROPIC_API_KEY para respuestas reales.`,

            gemini: `[Demo Google Gemini] Respuesta para: "${prompt.substring(0, 50)}..."

Gemini ofrecería aquí capacidades multimodales avanzadas.

Configura GEMINI_API_KEY para respuestas reales.`
        };

        return {
            content: demoResponses[provider] || 'Respuesta de demo',
            tokensUsed: 100
        };
    }

    /**
     * Obtener balance del usuario
     */
    async getUserBalance(userId) {
        const result = await executeQuery(`
            SELECT balance FROM iacoins_balances WHERE user_id = $1
        `, [userId]);

        return result[0]?.balance || 0;
    }

    /**
     * Cobrar IACoins al usuario
     */
    async chargeUser(userId, amount, metadata) {
        // Obtener balance actual
        const currentBalance = await this.getUserBalance(userId);
        const newBalance = currentBalance - amount;

        // Actualizar balance
        await executeQuery(`
            UPDATE iacoins_balances
            SET balance = balance - $1,
                total_spent = total_spent + $1,
                updated_at = NOW()
            WHERE user_id = $2
        `, [amount, userId]);

        // Crear transacción
        await executeQuery(`
            INSERT INTO iacoins_transactions
            (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
            VALUES ($1, 'spend', $2, $3, $4, $5, $6, $7)
        `, [
            userId,
            amount,
            currentBalance,
            newBalance,
            metadata.description,
            metadata.referenceType,
            metadata.referenceId
        ]);

        return newBalance;
    }

    /**
     * Crear registro de generación
     */
    async createGenerationRecord(userId, data) {
        const result = await executeQuery(`
            INSERT INTO ai_generations
            (user_id, provider, model, generation_type, prompt_preview, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `, [
            userId,
            data.provider,
            data.model,
            data.generationType,
            data.prompt,
            data.status
        ]);

        return result[0].id;
    }

    /**
     * Actualizar registro de generación
     */
    async updateGenerationRecord(generationId, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (data.status) {
            updates.push(`status = $${paramIndex++}`);
            values.push(data.status);
        }
        if (data.tokensUsed !== undefined) {
            updates.push(`tokens_used = $${paramIndex++}`);
            values.push(data.tokensUsed);
        }
        if (data.coinsCost !== undefined) {
            updates.push(`coins_cost = $${paramIndex++}`);
            values.push(data.coinsCost);
        }
        if (data.responseLength !== undefined) {
            updates.push(`response_length = $${paramIndex++}`);
            values.push(data.responseLength);
        }
        if (data.errorMessage) {
            updates.push(`error_message = $${paramIndex++}`);
            values.push(data.errorMessage);
        }

        updates.push(`completed_at = NOW()`);
        values.push(generationId);

        await executeQuery(`
            UPDATE ai_generations
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
        `, values);
    }

    /**
     * Obtener historial de generaciones del usuario
     */
    async getUserGenerations(userId, limit = 20, offset = 0) {
        const generations = await executeQuery(`
            SELECT * FROM ai_generations
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        const countResult = await executeQuery(`
            SELECT COUNT(*) as total FROM ai_generations WHERE user_id = $1
        `, [userId]);

        return {
            generations,
            total: parseInt(countResult[0].total),
            limit,
            offset
        };
    }

    /**
     * Obtener precios de modelos
     */
    getPricing() {
        const pricing = [];

        for (const [providerId, provider] of Object.entries(this.providers)) {
            for (const [modelId, model] of Object.entries(provider.models)) {
                pricing.push({
                    provider: providerId,
                    providerName: provider.name,
                    model: modelId,
                    costPerRequest: model.costPerRequest,
                    maxTokens: model.maxTokens
                });
            }
        }

        return pricing;
    }

    /**
     * Obtener tipos de generación
     */
    getGenerationTypes() {
        return this.generationTypes;
    }
}

module.exports = new AIGenerationService();
