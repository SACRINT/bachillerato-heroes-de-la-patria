/**
 * @file tutor_service.js
 * @description Servicio backend para el Tutor Inteligente (Socrático).
 */

const OpenAI = require('openai');
const { SOCRATIC_SYSTEM_PROMPT } = require('./tutor_prompts');

// Singleton OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Procesa una interacción de tutoría.
 * @param {string} studentMessage Mensaje del alumno
 * @param {Array} history Historial de conversación (roles: user, assistant)
 * @param {string} subject Materia (opcional: 'matematicas', 'historia')
 */
async function processTutorInteraction(studentMessage, history = [], subject = 'general') {
    try {
        console.time('Tutor Inference');

        // Construir contexto
        const messages = [
            { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
            ...history.slice(-6), // Ventana de contexto móvil (últimos 6 mensajes)
            { role: "user", content: studentMessage }
        ];

        // Llamada al LLM
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Modelo rápido y económico
            messages: messages,
            temperature: 0.5, // Balance entre creatividad pedagógica y precisión
            max_tokens: 800,
            n: 1
        });

        console.timeEnd('Tutor Inference');

        const responseContent = completion.choices[0].message.content;

        return {
            response: responseContent,
            metadata: {
                model: "gpt-4o-mini",
                subject: subject,
                pedagogy: "socratic"
            }
        };

    } catch (error) {
        console.error('[TUTOR] Error:', error);
        throw new Error('El tutor está tomando un descanso. Intenta más tarde.');
    }
}

module.exports = { processTutorInteraction };
