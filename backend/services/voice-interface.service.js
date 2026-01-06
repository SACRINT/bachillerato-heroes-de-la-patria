const { executeQuery } = require('../config/database');

class VoiceInterfaceService {

    /**
     * Procesa un comando de voz transcrito
     * @param {number} userId 
     * @param {string} transcript Texto reconocido (ej: "Hey Tutor, explícame derivadas")
     */
    async processCommand(userId, transcript) {
        const text = transcript.toLowerCase();

        // 1. Análisis de intención simple (Keyword matching)
        // En fases futuras usaríamos NLP/LLM real

        // Intención: Explicación
        if (text.includes('explica') || text.includes('qué es') || text.includes('definición')) {
            return await this._handleExplanation(userId, text);
        }

        // Intención: Navegación
        if (text.includes('ir a') || text.includes('abrir')) {
            return this._handleNavigation(text);
        }

        // Intención: Tarea
        if (text.includes('tengo tarea') || text.includes('pendiente')) {
            return await this._handleTaskQuery(userId);
        }

        return {
            type: 'unknown',
            message: 'No entendí el comando. Intenta decir "Explícame álgebra" o "Ir a mis notas".'
        };
    }

    async _handleExplanation(userId, text) {
        // Extraer el tema (muy simplificado)
        const topic = text.replace('explícame', '').replace('qué es', '').replace('definición de', '').trim();

        // Buscar micro-lesson relacionada
        const result = await executeQuery(
            `SELECT * FROM micro_lessons WHERE title ILIKE $1 OR description ILIKE $1 LIMIT 1`,
            [`%${topic}%`]
        );

        if (result.length > 0) {
            return {
                type: 'content_found',
                message: `Aquí tienes una lección sobre ${result[0].title}`,
                data: result[0],
                action: 'navigate',
                target: 'MicroLearning', // Pantalla a abrir
                params: { lessonId: result[0].id }
            };
        }

        // Si no hay contenido, respuesta genérica (simulado)
        return {
            type: 'explanation',
            message: `El tema "${topic}" es fundamental. Básicamente se refiere a... (Respuesta generada por AI Tutor)`,
            tts_text: `El tema ${topic} es fundamental. Básicamente se refiere a...`
        };
    }

    _handleNavigation(text) {
        let route = 'Home';
        if (text.includes('perfil')) route = 'Profile';
        if (text.includes('lecciones') || text.includes('clases')) route = 'MicroLearning';
        if (text.includes('notas')) route = 'Notes';

        return {
            type: 'navigation',
            message: `Abriendo ${route}...`,
            action: 'navigate',
            target: route
        };
    }

    async _handleTaskQuery(userId) {
        // Consultar tareas pendientes real
        // Mock por ahora
        return {
            type: 'info',
            message: 'Tienes 2 tareas pendientes de Matemáticas para mañana.',
        };
    }
}

module.exports = new VoiceInterfaceService();
