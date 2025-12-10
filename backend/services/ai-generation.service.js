"use strict";
/**
 * 🤖 AI GENERATION SERVICE - TypeScript Version
 * Generación con múltiples proveedores de IA
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGenerationService = void 0;
const { executeQuery } = require('../data/database-access');
const devLogger = require('../utils/devLogger');
// ============================================
// AI GENERATION SERVICE CLASS
// ============================================
class AIGenerationService {
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
    async generate(userId, options) {
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
            let content;
            if (!this.providers[provider].available) {
                content = await this.generateDemoResponse(provider, prompt);
            }
            else {
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
        }
        catch (error) {
            await this.updateGenerationRecord(generationId, { status: 'failed', error: error.message });
            throw error;
        }
    }
    async callOpenAI(model, prompt, systemPrompt, maxTokens = 1000, temperature = 0.7) {
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
    async callAnthropic(model, prompt, systemPrompt, maxTokens = 1000, temperature = 0.7) {
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
    async callGemini(model, prompt, maxTokens = 1000, temperature = 0.7) {
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
    async generateDemoResponse(provider, prompt) {
        return `[Demo ${provider}] Respuesta simulada para: "${prompt.substring(0, 50)}..."

Esta es una respuesta de demostración. Para respuestas reales, configure la API key del proveedor.`;
    }
    async getUserBalance(userId) {
        const result = await executeQuery('SELECT ia_coins, free_credits_remaining FROM user_balances WHERE user_id = $1', [userId]);
        return result[0] || { userId, iaCoins: 0, freeCreditsRemaining: 5 };
    }
    async chargeUser(userId, amount, metadata) {
        await executeQuery(`
            UPDATE user_balances SET ia_coins = ia_coins - $2, updated_at = NOW()
            WHERE user_id = $1 AND ia_coins >= $2
        `, [userId, amount]);
        await executeQuery(`
            INSERT INTO ia_transactions (user_id, amount, type, metadata, created_at)
            VALUES ($1, $2, 'debit', $3, NOW())
        `, [userId, amount, JSON.stringify(metadata)]);
    }
    async createGenerationRecord(userId, data) {
        const result = await executeQuery(`
            INSERT INTO ai_generations (user_id, provider, model, type, prompt, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `, [userId, data.provider, data.model, data.type, data.prompt, data.status]);
        return result[0].id;
    }
    async updateGenerationRecord(generationId, data) {
        const updates = [];
        const params = [generationId];
        let idx = 2;
        if (data.content) {
            updates.push(`content = $${idx++}`);
            params.push(data.content);
        }
        if (data.tokensUsed) {
            updates.push(`tokens_used = $${idx++}`);
            params.push(data.tokensUsed);
        }
        if (data.status) {
            updates.push(`status = $${idx++}`);
            params.push(data.status);
        }
        if (data.error) {
            updates.push(`error = $${idx++}`);
            params.push(data.error);
        }
        await executeQuery(`UPDATE ai_generations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1`, params);
    }
    async getUserGenerations(userId, limit = 20, offset = 0) {
        return await executeQuery(`
            SELECT * FROM ai_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
    }
    getPricing() {
        const pricing = {};
        for (const [key, provider] of Object.entries(this.providers)) {
            pricing[key] = provider.models;
        }
        return pricing;
    }
    getGenerationTypes() {
        return ['text', 'code', 'explanation', 'quiz', 'summary', 'translation'];
    }
}
exports.AIGenerationService = AIGenerationService;
// ============================================
// EXPORTS
// ============================================
const aiGenerationService = new AIGenerationService();
exports.default = aiGenerationService;
module.exports = aiGenerationService;
module.exports.AIGenerationService = AIGenerationService;
//# sourceMappingURL=ai-generation.service.js.map