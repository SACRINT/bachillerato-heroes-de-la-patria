const express = require('express');
const router = express.Router();

/**
 * Semana 51: AI Teacher API
 * Endpoints para conversación con profesores virtuales
 */

// Cache de conversaciones por estudiante
const conversationCache = new Map();

// Configuración de guardrails
const BLOCKED_KEYWORDS = ['violencia', 'drogas', 'armas', 'insulto'];
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONVERSATION_HISTORY = 20;

/**
 * @route POST /api/ai/teacher/chat
 * @desc Enviar mensaje al profesor AI
 */
router.post('/chat', async (req, res) => {
    try {
        const { messages, systemPrompt, teacherId, studentId } = req.body;

        // Validar input
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.content.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ error: 'Mensaje inválido o muy largo' });
        }

        // Guardrails: filtrar contenido inapropiado
        const lowerContent = lastMessage.content.toLowerCase();
        const hasBlockedContent = BLOCKED_KEYWORDS.some(kw => lowerContent.includes(kw));

        if (hasBlockedContent) {
            return res.json({
                response: 'Prefiero que hablemos sobre temas educativos. ¿Tienes alguna pregunta sobre la materia?',
                moderated: true
            });
        }

        // Obtener historial de conversación
        const historyKey = `${studentId || 'anon'}-${teacherId}`;
        let history = conversationCache.get(historyKey) || [];

        // Agregar nuevo mensaje al historial
        history.push({
            role: 'user',
            content: lastMessage.content,
            timestamp: Date.now()
        });

        // Limitar historial
        if (history.length > MAX_CONVERSATION_HISTORY) {
            history = history.slice(-MAX_CONVERSATION_HISTORY);
        }

        // Llamar a la API de AI (OpenAI/Anthropic)
        const aiResponse = await callAIProvider(systemPrompt, history);

        // Agregar respuesta al historial
        history.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now()
        });

        conversationCache.set(historyKey, history);

        res.json({
            response: aiResponse,
            moderated: false,
            tokensUsed: aiResponse.length // Simulación
        });

    } catch (error) {
        console.error('[AI Teacher] Error:', error);
        res.status(500).json({
            error: 'Error al procesar la solicitud',
            response: 'Disculpa, estoy teniendo problemas técnicos. ¿Podrías intentar de nuevo?'
        });
    }
});

/**
 * @route GET /api/ai/teacher/history/:studentId/:teacherId
 * @desc Obtener historial de conversación
 */
router.get('/history/:studentId/:teacherId', (req, res) => {
    const { studentId, teacherId } = req.params;
    const historyKey = `${studentId}-${teacherId}`;
    const history = conversationCache.get(historyKey) || [];

    res.json({ history });
});

/**
 * @route DELETE /api/ai/teacher/history/:studentId/:teacherId
 * @desc Limpiar historial de conversación
 */
router.delete('/history/:studentId/:teacherId', (req, res) => {
    const { studentId, teacherId } = req.params;
    const historyKey = `${studentId}-${teacherId}`;
    conversationCache.delete(historyKey);

    res.json({ success: true, message: 'Historial eliminado' });
});

/**
 * @route GET /api/ai/teacher/available
 * @desc Listar profesores AI disponibles
 */
router.get('/available', (req, res) => {
    const teachers = [
        {
            id: 'hidalgo',
            name: 'Don Miguel Hidalgo',
            subject: 'Historia de México',
            personality: 'Apasionado por la libertad, patriota y motivador',
            avatar: '/avatars/hidalgo.glb',
            available: true
        },
        {
            id: 'curie',
            name: 'Marie Curie',
            subject: 'Química y Física',
            personality: 'Curiosa, rigurosa científica y perseverante',
            avatar: '/avatars/curie.glb',
            available: true
        },
        {
            id: 'sor_juana',
            name: 'Sor Juana Inés de la Cruz',
            subject: 'Literatura y Poesía',
            personality: 'Elocuente, feminista y defensora del conocimiento',
            avatar: '/avatars/sor_juana.glb',
            available: true
        },
        {
            id: 'newton',
            name: 'Isaac Newton',
            subject: 'Matemáticas y Física',
            personality: 'Analítico, preciso y algo excéntrico',
            avatar: '/avatars/newton.glb',
            available: true
        }
    ];

    res.json(teachers);
});

/**
 * Llamar al proveedor de AI (Mockup)
 * En producción: OpenAI, Anthropic, etc.
 */
async function callAIProvider(systemPrompt, history) {
    // Simular latencia de API
    await new Promise(resolve => setTimeout(resolve, 500));

    // En producción, aquí iría la llamada real a OpenAI/Anthropic
    // Por ahora, respuestas simuladas basadas en el contexto

    const lastUserMessage = history.filter(m => m.role === 'user').pop();
    const content = lastUserMessage?.content?.toLowerCase() || '';

    // Respuestas contextuales simuladas
    if (content.includes('hola') || content.includes('buenos')) {
        return '¡Hola! Es un gusto verte por aquí. ¿En qué puedo ayudarte hoy con tus estudios?';
    }

    if (content.includes('ayuda') || content.includes('entiendo')) {
        return 'No te preocupes, estoy aquí para ayudarte. ¿Podrías ser más específico sobre qué tema te gustaría que expliquemos juntos?';
    }

    if (content.includes('gracias')) {
        return '¡De nada! Recuerda que siempre puedes venir a preguntarme. Estudiar es un acto de valentía. ¡Sigue así!';
    }

    if (content.includes('examen') || content.includes('tarea')) {
        return 'Entiendo que los exámenes pueden ser estresantes. Lo mejor es organizarte: divide el material en secciones pequeñas y estudia un poco cada día.';
    }

    // Respuesta genérica educativa
    return 'Esa es una excelente pregunta. En el contexto de nuestra materia, te recomiendo revisar los conceptos fundamentales primero. ¿Quieres que profundicemos en algún tema específico?';
}

module.exports = router;
