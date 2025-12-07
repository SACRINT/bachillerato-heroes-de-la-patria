/**
 * 🤖 AI GENERATION SERVICE - TypeScript Version
 * Generación con múltiples proveedores de IA
 * Refactorizado: 07 Diciembre 2025
 */

const { executeQuery } = require('../data/database-access');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface AIProvider {
    name: string;
    models: Record<string, AIModel>;
    available: boolean;
}

export interface AIModel {
    name: string;
    costPer1K: number;
    maxTokens: number;
    capabilities: string[];
}

export interface GenerationOptions {
    provider: string;
    model?: string;
    type: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface GenerationResult {
    id: string;
    content: string;
    provider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    createdAt: Date;
}

export interface UserBalance {
    userId: number;
    iaCoins: number;
    freeCreditsRemaining: number;
}

// ============================================
// AI GENERATION SERVICE CLASS
// ============================================

class AIGenerationService {
    private providers: Record<string, AIProvider>;
    private defaultProvider: string;

    constructor() {
        this.providers = {
            openai: {
                name: 'OpenAI',
                models: {
                    'gpt-4': { name: 'GPT-4', costPer1K: 30, maxTokens: 8192, capabilities: ['text', 'code', 'reasoning'] },
                    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', costPer1K: 2, maxTokens: 4096, capabilities: ['text', 'code'] }
                },
                available: !!process.env.OPENAI_API_KEY
            },
            anthropic: {
                name: 'Anthropic',
                models: {
                    'claude-3-opus': { name: 'Claude 3 Opus', costPer1K: 50, maxTokens: 100000, capabilities: ['text', 'code', 'reasoning', 'analysis'] },
                    'claude-3-sonnet': { name: 'Claude 3 Sonnet', costPer1K: 15, maxTokens: 100000, capabilities: ['text', 'code'] }
                },
                available: !!process.env.ANTHROPIC_API_KEY
            },
            gemini: {
                name: 'Google Gemini',
                models: {
                    'gemini-pro': { name: 'Gemini Pro', costPer1K: 10, maxTokens: 32000, capabilities: ['text', 'code', 'multimodal'] }
                },
                available: !!process.env.GEMINI_API_KEY
            }
        };

        this.defaultProvider = 'openai';
        devLogger.log('[AI-GENERATION] Service initialized');
    }

    async generate(userId: number, options: GenerationOptions): Promise<GenerationResult> {
        const { provider = this.defaultProvider, type, prompt, systemPrompt, maxTokens = 1000, temperature = 0.7 } = options;
        const model = options.model || Object.keys(this.providers[provider].models)[0];

        // Check user balance
        const balance = await this.getUserBalance(userId);
        const modelInfo = this.providers[provider].models[model];
        const estimatedCost = Math.ceil((maxTokens / 1000) * modelInfo.costPer1K);

        if (balance.iaCoins < estimatedCost && balance.freeCreditsRemaining <= 0) {
            throw new Error('Saldo insuficiente de IACoins');
        }

        // Create generation record
        const generationId = await this.createGenerationRecord(userId, {
            provider, model, type, prompt, status: 'processing'
        });

        try {
            let content: string;

            if (!this.providers[provider].available) {
                content = await this.generateDemoResponse(provider, prompt);
            } else {
                switch (provider) {
                    case 'openai':
                        content = await this.callOpenAI(model, prompt, systemPrompt, maxTokens, temperature);
                        break;
                    case 'anthropic':
                        content = await this.callAnthropic(model, prompt, systemPrompt, maxTokens, temperature);
                        break;
                    case 'gemini':
                        content = await this.callGemini(model, prompt, maxTokens, temperature);
                        break;
                    default:
                        throw new Error(`Proveedor no soportado: ${provider}`);
                }
            }

            const tokensUsed = Math.ceil(content.length / 4);
            const cost = Math.ceil((tokensUsed / 1000) * modelInfo.costPer1K);

            await this.chargeUser(userId, cost, { generationId, provider, model });
            await this.updateGenerationRecord(generationId, { content, tokensUsed, status: 'completed' });

            return {
                id: generationId,
                content,
                provider,
                model,
                tokensUsed,
                cost,
                createdAt: new Date()
            };
        } catch (error: any) {
            await this.updateGenerationRecord(generationId, { status: 'failed', error: error.message });
            throw error;
        }
    }

    private async callOpenAI(model: string, prompt: string, systemPrompt?: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ],
                max_tokens: maxTokens,
                temperature
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    private async callAnthropic(model: string, prompt: string, systemPrompt?: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature
            })
        });

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }

    private async callGemini(model: string, prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: maxTokens, temperature }
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    private async generateDemoResponse(provider: string, prompt: string): Promise<string> {
        return `[Demo ${provider}] Respuesta simulada para: "${prompt.substring(0, 50)}..."

Esta es una respuesta de demostración. Para respuestas reales, configure la API key del proveedor.`;
    }

    async getUserBalance(userId: number): Promise<UserBalance> {
        const result = await executeQuery('SELECT ia_coins, free_credits_remaining FROM user_balances WHERE user_id = $1', [userId]);
        return result[0] || { userId, iaCoins: 0, freeCreditsRemaining: 5 };
    }

    private async chargeUser(userId: number, amount: number, metadata: any): Promise<void> {
        await executeQuery(`
            UPDATE user_balances SET ia_coins = ia_coins - $2, updated_at = NOW()
            WHERE user_id = $1 AND ia_coins >= $2
        `, [userId, amount]);

        await executeQuery(`
            INSERT INTO ia_transactions (user_id, amount, type, metadata, created_at)
            VALUES ($1, $2, 'debit', $3, NOW())
        `, [userId, amount, JSON.stringify(metadata)]);
    }

    private async createGenerationRecord(userId: number, data: any): Promise<string> {
        const result = await executeQuery(`
            INSERT INTO ai_generations (user_id, provider, model, type, prompt, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `, [userId, data.provider, data.model, data.type, data.prompt, data.status]);
        return result[0].id;
    }

    private async updateGenerationRecord(generationId: string, data: any): Promise<void> {
        const updates: string[] = [];
        const params: any[] = [generationId];
        let idx = 2;

        if (data.content) { updates.push(`content = $${idx++}`); params.push(data.content); }
        if (data.tokensUsed) { updates.push(`tokens_used = $${idx++}`); params.push(data.tokensUsed); }
        if (data.status) { updates.push(`status = $${idx++}`); params.push(data.status); }
        if (data.error) { updates.push(`error = $${idx++}`); params.push(data.error); }

        await executeQuery(`UPDATE ai_generations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1`, params);
    }

    async getUserGenerations(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM ai_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
    }

    getPricing(): Record<string, Record<string, AIModel>> {
        const pricing: Record<string, Record<string, AIModel>> = {};
        for (const [key, provider] of Object.entries(this.providers)) {
            pricing[key] = provider.models;
        }
        return pricing;
    }

    getGenerationTypes(): string[] {
        return ['text', 'code', 'explanation', 'quiz', 'summary', 'translation'];
    }
}

// ============================================
// EXPORTS
// ============================================

const aiGenerationService = new AIGenerationService();

export { AIGenerationService };
export default aiGenerationService;

module.exports = aiGenerationService;
module.exports.AIGenerationService = AIGenerationService;
