/**
 * 🤖 SERVICIO DE INTELIGENCIA ARTIFICIAL
 * Integración con OpenAI GPT-4 para el sistema de recompensas
 * Procesamiento inteligente de prompts educativos
 */

const OpenAI = require('openai');

class AIService {
    constructor() {
        // Verificar si tenemos la API key
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ OPENAI_API_KEY no configurada. Usando modo simulado.');
            this.simulationMode = true;
            return;
        }

        // Configurar cliente OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.simulationMode = false;
        this.defaultModel = 'gpt-4-turbo-preview';

        // Configuraciones por tipo de usuario
        this.userConfigurations = {
            student: {
                maxTokens: 800,
                temperature: 0.7,
                systemPrompt: `Eres un tutor educativo especializado en nivel bachillerato.
                Responde de manera clara, didáctica y motivadora. Usa ejemplos mexicanos cuando sea relevante.
                Mantén un tono amigable pero profesional. Limita respuestas a 800 tokens.`
            },
            teacher: {
                maxTokens: 1200,
                temperature: 0.6,
                systemPrompt: `Eres un asistente pedagógico experto para docentes de bachillerato.
                Proporciona respuestas técnicas, estrategias didácticas y recursos educativos.
                Considera el contexto del sistema educativo mexicano. Respuestas hasta 1200 tokens.`
            },
            parent: {
                maxTokens: 600,
                temperature: 0.8,
                systemPrompt: `Eres un consejero familiar especializado en educación adolescente.
                Responde con empatía, practicidad y comprensión hacia padres de familia.
                Enfócate en soluciones concretas y comunicación efectiva. Máximo 600 tokens.`
            },
            admin: {
                maxTokens: 1500,
                temperature: 0.5,
                systemPrompt: `Eres un consultor educativo especializado en gestión institucional.
                Proporciona análisis estratégicos, métricas educativas y recomendaciones administrativas.
                Mantén un enfoque profesional y basado en datos. Hasta 1500 tokens.`
            }
        };

        console.log('🤖 Servicio de IA inicializado correctamente');
    }

    /**
     * 🚀 Ejecutar prompt con IA real
     */
    async executePrompt(promptData, userInput, userProfile) {
        try {
            // Modo simulación si no hay API key
            if (this.simulationMode) {
                return this.simulateAIResponse(promptData, userInput, userProfile);
            }

            // Configuración por tipo de usuario
            const config = this.userConfigurations[userProfile.type] || this.userConfigurations.student;

            // Construir mensajes para la conversación
            const messages = [
                {
                    role: 'system',
                    content: config.systemPrompt
                },
                {
                    role: 'system',
                    content: `Prompt especializado: "${promptData.name}"
                    Descripción: ${promptData.description}
                    Categoría: ${promptData.category}
                    Usuario: ${userProfile.name} (${userProfile.type})
                    Nivel: ${userProfile.level}`
                },
                {
                    role: 'user',
                    content: `${promptData.prompt}\n\nInput del usuario: ${userInput}`
                }
            ];

            // Llamada a OpenAI
            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: messages,
                max_tokens: config.maxTokens,
                temperature: config.temperature,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1
            });

            const aiResponse = completion.choices[0].message.content;

            // Registrar uso para estadísticas
            await this.logAIUsage({
                userId: userProfile.id,
                promptId: promptData.id,
                inputTokens: completion.usage.prompt_tokens,
                outputTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
                model: this.defaultModel,
                timestamp: new Date()
            });

            return {
                success: true,
                response: aiResponse,
                tokensUsed: completion.usage.total_tokens,
                model: this.defaultModel,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error al ejecutar prompt IA:', error);

            // Fallback a modo simulación en caso de error
            return this.simulateAIResponse(promptData, userInput, userProfile);
        }
    }

    /**
     * 🎭 Simular respuesta de IA (fallback)
     */
    simulateAIResponse(promptData, userInput, userProfile) {
        const simulatedResponses = {
            'basic-summary': `📚 **Resumen Generado:**

**Tema:** ${userInput}

**Puntos Clave:**
• Concepto principal y definición
• Características más importantes
• Aplicaciones prácticas
• Ejemplos relevantes

**Conclusión:**
Este tema es fundamental para tu formación académica y te ayudará a comprender conceptos más avanzados.

*Respuesta generada por IA educativa • +${promptData.xpReward} XP otorgados*`,

            'lesson-planner': `📋 **Plan de Clase Generado:**

**Asignatura:** ${userInput}
**Duración:** 50 minutos
**Nivel:** Bachillerato

**OBJETIVOS:**
• Objetivo general
• Objetivos específicos

**DESARROLLO:**
1. **Apertura (10 min)** - Activación conocimientos previos
2. **Desarrollo (30 min)** - Contenido principal + actividades
3. **Cierre (10 min)** - Síntesis y evaluación

**RECURSOS:** Materiales sugeridos
**EVALUACIÓN:** Criterios de evaluación

*Plan generado por IA pedagógica • +${promptData.xpReward} XP otorgados*`,

            'homework-helper': `👨‍👩‍👧‍👦 **Guía para Padres:**

**Tema de la tarea:** ${userInput}

**Cómo apoyar sin hacer la tarea:**
1. Hacer preguntas guía
2. Proporcionar recursos adicionales
3. Crear un ambiente de estudio
4. Establecer metas alcanzables

**Preguntas sugeridas:**
• "¿Qué entiendes de esto?"
• "¿Dónde puedes buscar más información?"
• "¿Cómo lo explicarías con tus palabras?"

*Guía generada por IA familiar • +${promptData.xpReward} XP otorgados*`
        };

        const response = simulatedResponses[promptData.id] ||
        `✨ **Respuesta IA Simulada**

Procesando: "${userInput}"

Esta es una respuesta simulada del sistema. Para respuestas reales de IA, configura la API key de OpenAI.

**Usuario:** ${userProfile.name} (${userProfile.type})
**Prompt:** ${promptData.name}
**XP Ganados:** +${promptData.xpReward}

*Sistema en modo demostración*`;

        return {
            success: true,
            response: response,
            tokensUsed: 0,
            model: 'simulado',
            timestamp: new Date().toISOString(),
            isSimulated: true
        };
    }

    /**
     * 📊 Registrar uso de IA para estadísticas
     */
    async logAIUsage(usageData) {
        try {
            // Aquí se guardarían las estadísticas en base de datos
            // Por ahora solo log en consola
            console.log('📊 Uso de IA registrado:', {
                user: usageData.userId,
                prompt: usageData.promptId,
                tokens: usageData.totalTokens,
                timestamp: usageData.timestamp
            });

            // TODO: Implementar guardado en base de datos
            // await db.aiUsage.create(usageData);

        } catch (error) {
            console.error('Error al registrar uso de IA:', error);
        }
    }

    /**
     * 🔍 Validar entrada del usuario
     */
    validateInput(input, maxLength = 2000) {
        if (!input || typeof input !== 'string') {
            return { valid: false, error: 'Input no válido' };
        }

        if (input.length > maxLength) {
            return { valid: false, error: `Input demasiado largo (máximo ${maxLength} caracteres)` };
        }

        // Filtro básico de contenido inapropiado
        const inappropriate = ['spam', 'hack', 'virus'];
        const hasInappropriate = inappropriate.some(word =>
            input.toLowerCase().includes(word)
        );

        if (hasInappropriate) {
            return { valid: false, error: 'Contenido no apropiado detectado' };
        }

        return { valid: true };
    }

    /**
     * 📈 Obtener estadísticas de uso
     */
    async getUsageStats(timeframe = '24h') {
        try {
            // Placeholder para estadísticas reales
            return {
                totalPrompts: 156,
                totalTokens: 45678,
                averageResponseTime: '2.3s',
                mostUsedPrompts: [
                    'basic-summary',
                    'homework-helper',
                    'lesson-planner'
                ],
                userTypes: {
                    student: 60,
                    teacher: 25,
                    parent: 10,
                    admin: 5
                }
            };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return null;
        }
    }

    /**
     * 🔧 Configurar límites por usuario
     */
    getUserLimits(userProfile) {
        const baseLimits = {
            student: { dailyPrompts: 20, tokensPerDay: 5000 },
            teacher: { dailyPrompts: 50, tokensPerDay: 12000 },
            parent: { dailyPrompts: 15, tokensPerDay: 3000 },
            admin: { dailyPrompts: 100, tokensPerDay: 20000 }
        };

        const userLimits = baseLimits[userProfile.type] || baseLimits.student;

        // Multiplicador por nivel de usuario
        const levelMultiplier = 1 + (userProfile.level * 0.05);

        return {
            dailyPrompts: Math.floor(userLimits.dailyPrompts * levelMultiplier),
            tokensPerDay: Math.floor(userLimits.tokensPerDay * levelMultiplier)
        };
    }
}

module.exports = AIService;