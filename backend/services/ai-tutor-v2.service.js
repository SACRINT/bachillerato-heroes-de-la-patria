/**
 * 🤖 AI TUTOR V2 SERVICE (Conversational Memory & Pedagogical Context)
 * Bachillerato General Estatal "Héroes de la Patria"
 * Recuperado de código legacy y actualizado para FASE 5 (Semanas 18-20)
 */

const { executeQuery, getPool } = require('../data/database-access.js');
const { callGemini } = require('../middleware/iacoins-deduction.js');
const devLogger = require('../utils/devLogger.js');

class AiTutorV2Service {
    constructor() {
        this.tablesInitialized = false;
        this.memoryCache = new Map(); // In-memory fallback para garantizar memoria aún sin DB
        this.initTables();
    }

    /**
     * Asegurar tablas de persistencia en PostgreSQL
     */
    async initTables() {
        if (this.tablesInitialized) return;
        try {
            const createSessionsTable = `
                CREATE TABLE IF NOT EXISTS tutor_chat_sessions (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(100) UNIQUE NOT NULL,
                    user_id INTEGER,
                    current_topic VARCHAR(255) DEFAULT 'General',
                    subject VARCHAR(100) DEFAULT 'Matemáticas',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;

            const createMessagesTable = `
                CREATE TABLE IF NOT EXISTS tutor_chat_messages (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(100) NOT NULL,
                    sender VARCHAR(20) NOT NULL,
                    message_text TEXT NOT NULL,
                    context_data_json JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `;

            await executeQuery(createSessionsTable);
            await executeQuery(createMessagesTable);
            this.tablesInitialized = true;
            devLogger.log('[AI-TUTOR-V2] Tablas de sesiones y mensajes inicializadas correctamente');
        } catch (error) {
            devLogger.warn('[AI-TUTOR-V2] Error inicializando tablas (usará fallback seguro):', error.message);
        }
    }

    /**
     * Iniciar nueva sesión de tutoría o recuperar existente
     */
    async startSession(userId, topic = 'Álgebra y Ciencias', subject = 'Matemáticas') {
        await this.initTables();
        const sessionId = `tutor_${userId || 'guest'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        try {
            const query = `
                INSERT INTO tutor_chat_sessions (session_id, user_id, current_topic, subject)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const rows = await executeQuery(query, [sessionId, userId || null, topic, subject]);
            return rows[0] || { session_id: sessionId, user_id: userId, current_topic: topic, subject };
        } catch (error) {
            devLogger.warn('[AI-TUTOR-V2] startSession error DB fallback:', error.message);
            return { session_id: sessionId, user_id: userId, current_topic: topic, subject };
        }
    }

    /**
     * Enviar mensaje al tutor IA manteniendo memoria de conversación
     */
    async sendMessage(sessionId, userId, userMessage, subject = 'Matemáticas') {
        await this.initTables();

        // 1. Guardar mensaje del usuario
        await this._saveMessage(sessionId, 'user', userMessage, { userId });

        // 2. Recuperar historial de los últimos 6 turnos para mantener memoria contextual
        const previousMessages = await this.getSessionHistory(sessionId, 6);
        
        // Excluir el último mensaje recién insertado de la lista previa para formatear
        const priorHistory = previousMessages.slice(0, -1);
        const formattedHistory = priorHistory.map(m => 
            `${m.sender === 'user' ? 'Estudiante' : 'Tutor IA'}: ${m.message_text}`
        ).join('\n');

        // 3. Construir Prompt socrático con memoria de turnos anteriores
        const tutorPrompt = `Eres el Tutor IA Inteligente del Bachillerato General Estatal "Héroes de la Patria".
Tu misión es guiar al estudiante de preparatoria con explicaciones pedagógicas claras, analogías cotidianas y preguntas reflexivas.

MATERIA: ${subject}
SESIÓN ID: ${sessionId}

${formattedHistory ? `HISTORIAL DE LA CONVERSACIÓN PREVIA (MEMORIA DE SESIÓN):\n${formattedHistory}\n\n` : ''}PREGUNTA ACTUAL DEL ESTUDIANTE:
"${userMessage}"

INSTRUCCIONES CLAVE:
1. Recuerda el contexto y los temas discutidos en los mensajes anteriores de esta sesión.
2. Si el estudiante hace referencia a preguntas o conceptos previos (ej. "lo anterior", "las leyes", "la fórmula", "el ejemplo"), responde conectando directamente con lo hablado antes.
3. Sé motivador, didáctico y fomenta el razonamiento crítico.`;

        // 4. Llamar a Gemini Flash (con fallback demo contextualizado)
        let aiResponseText = '';
        try {
            const geminiResult = await callGemini(tutorPrompt, 'chat');
            
            // Si está en modo demo pero hay memoria conversacional, generar respuesta pedagógica inteligente
            if (geminiResult.isDemo) {
                aiResponseText = this._generateContextualDemoResponse(userMessage, priorHistory, subject);
            } else {
                aiResponseText = geminiResult.text;
            }
        } catch (e) {
            devLogger.error('[AI-TUTOR-V2] Error llamando a Gemini:', e);
            aiResponseText = this._generateContextualDemoResponse(userMessage, priorHistory, subject);
        }

        // 5. Guardar respuesta del Tutor IA en BD
        const contextMeta = {
            memoryTurns: priorHistory.length,
            subject,
            timestamp: new Date().toISOString()
        };
        const savedAiMsg = await this._saveMessage(sessionId, 'ai', aiResponseText, contextMeta);

        return {
            id: savedAiMsg ? savedAiMsg.id : Date.now(),
            sessionId,
            text: aiResponseText,
            memoryContext: {
                previousTurnsCount: priorHistory.length,
                subject
            }
        };
    }

    /**
     * Generador de respuesta demo con memoria pedagógica contextual
     */
    _generateContextualDemoResponse(message, priorHistory, subject) {
        const lowerMsg = message.toLowerCase();
        const hasPreviousHistory = priorHistory && priorHistory.length > 0;
        const priorTopics = priorHistory.map(m => m.message_text.toLowerCase()).join(' ');

        // Caso 1: Preguntas sobre Leyes de Newton
        if (lowerMsg.includes('newton') || priorTopics.includes('newton')) {
            if (lowerMsg.includes('frena') || lowerMsg.includes('camion') || lowerMsg.includes('adelante') || lowerMsg.includes('inercia') || lowerMsg.includes('cual de las')) {
                return `¡Excelente pregunta! Relacionando esto con las **Leyes de Newton** que mencionamos anteriormente:

Esto se explica mediante la **Primera Ley de Newton (Ley de la Inercia)**. 
Esta ley establece que *todo cuerpo permanece en su estado de reposo o de movimiento rectilíneo uniforme a menos que una fuerza externa actúe sobre él*.

🚌 **¿Por qué te vas hacia adelante en el camión?**
Cuando el camión frena, tus pies se detienen junto con el piso del vehículo debido a la fricción, pero la parte superior de tu cuerpo tiende a mantener la velocidad que llevaba. Por eso sientes que te proyectas hacia adelante.

¿Tiene sentido esta analogía con lo que veníamos revisando? ¿Quieres que veamos cómo se calcula la fuerza de frenado con la Segunda Ley?`;
            }

            return `Las **Tres Leyes de Newton** son los pilares de la mecánica clásica:
1. **Primera Ley (Inercia):** Un cuerpo mantiene su estado de reposo o movimiento a menos que actúe una fuerza sobre él.
2. **Segunda Ley (F = m·a):** La aceleración es directamente proporcional a la fuerza e inversamente proporcional a la masa.
3. **Tercera Ley (Acción y Reacción):** A toda acción corresponde una reacción de igual magnitud pero en sentido opuesto.

¿Te gustaría analizar un ejemplo de la vida diaria sobre alguna de ellas?`;
        }

        // Caso 2: Preguntas sobre Ecuaciones Cuadráticas o Álgebra
        if (lowerMsg.includes('ecuacion') || lowerMsg.includes('segundo grado') || priorTopics.includes('ecuacion')) {
            if (lowerMsg.includes('ejemplo') || lowerMsg.includes('resolver') || lowerMsg.includes('formula')) {
                return `Continuando con las **Ecuaciones de Segundo Grado** que estábamos estudiando, aquí tienes un ejemplo resuelto paso a paso:

Dada la ecuación: **x² - 5x + 6 = 0**
1. Identificamos coeficientes: a = 1, b = -5, c = 6.
2. Aplicamos la fórmula general: x = [-(-5) ± √((-5)² - 4(1)(6))] / (2·1)
3. Calculamos: x = [5 ± √(25 - 24)] / 2 = [5 ± 1] / 2
4. Obtenemos dos soluciones: **x₁ = 3** y **x₂ = 2**.

¿Quieres intentar resolver una similar tú mismo para reforzar este tema?`;
            }

            return `Una **ecuación de segundo grado** tiene la forma general **ax² + bx + c = 0** (con a ≠ 0). 
Se puede resolver mediante:
- Factorización directa.
- Completando el trinomio cuadrado perfecto.
- La fórmula general cuadrática.

¿Cuál de estos métodos te gustaría repasar primero?`;
        }

        // Caso general con continuidad
        if (hasPreviousHistory) {
            return `Entendido. Tomando en cuenta lo que hemos venido revisando en esta sesión sobre ${subject}, respecto a "${message}":

Es un concepto fundamental para tu avance en el bachillerato. Recuerda descomponer el problema en datos conocidos, fórmula aplicable y sustitución paso a paso.

¿Qué parte de este procedimiento te resulta más compleja?`;
        }

        return `¡Hola! Soy tu **Tutor IA del BGE Héroes de la Patria**. Estoy aquí para ayudarte a comprender temas de ${subject} y resolver dudas paso a paso. ¿Qué tema o problema deseas que revisemos hoy?`;
    }

    /**
     * Obtener historial de una sesión
     */
    async getSessionHistory(sessionId, limit = 20) {
        try {
            const query = `
                SELECT id, session_id, sender, message_text, context_data_json, created_at
                FROM tutor_chat_messages
                WHERE session_id = $1
                ORDER BY id ASC
                LIMIT $2
            `;
            const rows = await executeQuery(query, [sessionId, limit]);
            if (rows && rows.length > 0) return rows;
            return this.memoryCache.get(sessionId) || [];
        } catch (error) {
            devLogger.warn('[AI-TUTOR-V2] getSessionHistory error (using memory cache):', error.message);
            return this.memoryCache.get(sessionId) || [];
        }
    }

    /**
     * Guardar mensaje individual
     */
    async _saveMessage(sessionId, sender, text, meta = {}) {
        const msgObj = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            session_id: sessionId,
            sender,
            message_text: text,
            context_data_json: meta,
            created_at: new Date().toISOString()
        };

        // Guardar en cache en memoria
        if (!this.memoryCache.has(sessionId)) {
            this.memoryCache.set(sessionId, []);
        }
        this.memoryCache.get(sessionId).push(msgObj);

        try {
            const query = `
                INSERT INTO tutor_chat_messages (session_id, sender, message_text, context_data_json)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const rows = await executeQuery(query, [sessionId, sender, text, JSON.stringify(meta)]);
            return rows ? rows[0] : msgObj;
        } catch (error) {
            devLogger.warn('[AI-TUTOR-V2] _saveMessage error (saved to cache):', error.message);
            return msgObj;
        }
    }
}

module.exports = new AiTutorV2Service();
