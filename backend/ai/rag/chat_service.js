/**
 * @file chat_service.js
 * @description Orquestador RAG: Une Retrieval + Generation. Centraliza la lógica del Chatbot.
 */

const OpenAI = require('openai');
const { retrieveContext } = require('./retrieval_service');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Procesa un mensaje de chat usando RAG.
 * @param {string} userMessage Mensaje del usuario
 * @param {Array} history Historial previo (opcional)
 * @param {string} namespace Contexto de búsqueda
 */
async function processChatMessage(userMessage, history = [], namespace = 'normativa') {
    // 1. Retrieval (Búsqueda de Contexto)
    console.time('RAG Retrieval');
    const contextDocs = await retrieveContext(userMessage, namespace, 3);
    console.timeEnd('RAG Retrieval');

    // 2. Construcción del Prompt Aumentado
    let contextText = "";
    if (contextDocs.length > 0) {
        contextText = contextDocs.map(d => `- "${d.text}" (Fuente: ${d.source})`).join("\n\n");
    } else {
        contextText = "No se encontró información específica en los documentos oficiales.";
    }

    const systemPrompt = `
        Eres el Asistente Virtual Oficial del Bachillerato "Héroes de la Patria".
        Tu misión es responder dudas de alumnos y padres basándote en la informaciòn oficial proporcionada.
        
        REGLAS:
        1. Responde ÚNICAMENTE usando el CONTEXTO proporcionado abajo.
        2. Si la respuesta no está en el contexto, di amablemente que no sabes y sugiere ir a Dirección.
        3. No inventes reglas ni fechas.
        4. Sé conciso y formal pero cercano.
        
        CONTEXTO OFICIAL:
        """
        ${contextText}
        """
    `;

    // 3. Generación (LLM Call)
    try {
        console.time('LLM Generation');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-4), // Mantener ventana de memoria corta
                { role: "user", content: userMessage }
            ],
            temperature: 0.3, // Baja temperatura para factualidad
            max_tokens: 500
        });
        console.timeEnd('LLM Generation');

        return {
            response: completion.choices[0].message.content,
            sources: contextDocs.map(d => d.source), // Para citar fuentes en UI
            usage: completion.usage
        };

    } catch (error) {
        console.error('[CHAT] Error generando respuesta:', error);
        throw new Error('Servicio de IA temporalmente no disponible.');
    }
}

module.exports = { processChatMessage };
