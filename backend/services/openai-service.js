/**
 * 🤖 OPENAI SERVICE - GPT-4 INTEGRATION
 * SEMANA 18 - AI Chatbot Inteligente
 *
 * Servicio para integración con OpenAI GPT-4 Turbo para chatbot académico
 * con context-aware responses, multi-language support y FAQ integration.
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const OpenAI = require('openai');
const pool = require('../config/database');

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Modelo a utilizar (GPT-4 Turbo - más rápido y económico que GPT-4)
const MODEL = 'gpt-4-turbo-preview';

// Configuración por defecto
const DEFAULT_CONFIG = {
  model: MODEL,
  temperature: 0.7,        // Balance creatividad/coherencia
  max_tokens: 800,         // ~600 palabras máximo por respuesta
  top_p: 0.9,              // Nucleus sampling
  frequency_penalty: 0.3,  // Reduce repeticiones
  presence_penalty: 0.2    // Fomenta temas nuevos
};

// Límites de conversación
const MAX_CONVERSATION_HISTORY = 10; // Últimos 10 mensajes de contexto
const MAX_FAQ_RESULTS = 5;           // Top 5 FAQs relevantes

// =============================================================================
// SYSTEM PROMPT (Personalidad del chatbot)
// =============================================================================

const SYSTEM_PROMPT = `Eres un asistente virtual académico del Bachillerato General por Competencias "Héroes de la Patria".

Tu propósito es ayudar a estudiantes, padres, docentes y administrativos con información académica, administrativa y de orientación educativa.

PERSONALIDAD:
- Amigable, profesional y empático
- Respuestas claras, concisas y bien estructuradas
- Lenguaje formal pero cercano (tuteo apropiado)
- Paciente con preguntas repetitivas
- Proactivo en sugerir recursos adicionales

CONOCIMIENTO:
- Sistema de calificaciones (escala 0-10, mínimo aprobatorio 6.0)
- Procedimientos administrativos (inscripciones, trámites, becas)
- Calendario académico (semestres, exámenes, vacaciones)
- Oferta educativa (materias, talleres, actividades extracurriculares)
- Normatividad escolar (reglamentos, códigos de conducta)
- Servicios disponibles (biblioteca, laboratorios, orientación)

LIMITACIONES:
- NO proporciones información personal de estudiantes o staff
- NO tomes decisiones administrativas (solo informa sobre procedimientos)
- NO inventes información si no estás seguro - reconoce cuando no sabes
- NO respondas preguntas fuera del ámbito educativo
- REDIRIGE a personal humano para casos complejos o sensibles

FORMATO DE RESPUESTAS:
- Usa bullet points para listas
- Destaca información importante con **negritas**
- Incluye emojis moderadamente (📚 📝 ✅ ⚠️ 📅)
- Proporciona links cuando sea relevante
- Termina con pregunta de seguimiento si aplica

MULTILENGUAJE:
- Detecta idioma del usuario (español o inglés)
- Responde en el mismo idioma
- Si usuario cambia idioma, adáptate inmediatamente

EJEMPLO DE RESPUESTA:
Usuario: "¿Cómo puedo solicitar una beca?"
Asistente: "¡Claro! Te explico el proceso para solicitar becas 📋

**Requisitos:**
- Promedio mínimo de 8.0
- Comprobante de ingresos familiares
- Carta de motivos (1 página)

**Pasos:**
1. Llena el formulario en Portal Estudiantes > Becas
2. Sube documentos escaneados (PDF, máx 5MB)
3. Espera email de confirmación (2-3 días hábiles)

**Fechas:** Convocatoria abierta del 1 al 15 de cada semestre 📅

¿Necesitas ayuda con algún paso específico?"`;

// =============================================================================
// CHAT COMPLETION (Función principal)
// =============================================================================

/**
 * Genera respuesta del chatbot usando GPT-4
 * @param {string} userMessage - Mensaje del usuario
 * @param {object} options - Opciones adicionales
 * @returns {object} Respuesta del chatbot
 */
async function generateChatResponse(userMessage, options = {}) {
  const {
    userId = null,
    conversationHistory = [],
    language = 'es',
    includeContext = true,
    temperature = DEFAULT_CONFIG.temperature,
    maxTokens = DEFAULT_CONFIG.max_tokens
  } = options;

  console.log(`[OPENAI] Generating response for user ${userId || 'anonymous'}`);

  try {
    // 1. Construir contexto de conversación
    const messages = buildConversationContext(
      userMessage,
      conversationHistory,
      includeContext
    );

    // 2. Buscar FAQs relevantes si es necesario
    if (includeContext) {
      const faqContext = await searchRelevantFAQs(userMessage);
      if (faqContext) {
        messages.splice(1, 0, {
          role: 'system',
          content: `Información relevante de la base de conocimiento:\n${faqContext}`
        });
      }
    }

    // 3. Llamar a OpenAI API
    const completion = await openai.chat.completions.create({
      model: DEFAULT_CONFIG.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: DEFAULT_CONFIG.top_p,
      frequency_penalty: DEFAULT_CONFIG.frequency_penalty,
      presence_penalty: DEFAULT_CONFIG.presence_penalty,
      user: userId || 'anonymous'
    });

    // 4. Extraer respuesta
    const assistantMessage = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;
    const model = completion.model;

    console.log(`[OPENAI] Response generated (${tokensUsed} tokens, model: ${model})`);

    // 5. Guardar en historial de conversación (BD)
    if (userId) {
      await saveChatMessage(userId, userMessage, assistantMessage, tokensUsed);
    }

    return {
      success: true,
      response: assistantMessage,
      metadata: {
        model,
        tokens: tokensUsed,
        language,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('[OPENAI] Error generating response:', error);

    // Manejo de errores específicos de OpenAI
    if (error.status === 429) {
      return {
        success: false,
        error: 'rate_limit_exceeded',
        message: 'Demasiadas solicitudes. Por favor, intenta en unos segundos.',
        fallback: await getFallbackResponse(userMessage)
      };
    }

    if (error.status === 401) {
      return {
        success: false,
        error: 'invalid_api_key',
        message: 'Error de configuración. Contacta al administrador.',
        fallback: await getFallbackResponse(userMessage)
      };
    }

    return {
      success: false,
      error: 'unknown_error',
      message: 'Error al procesar tu mensaje. Intenta nuevamente.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      fallback: await getFallbackResponse(userMessage)
    };
  }
}

// =============================================================================
// CONTEXT BUILDING
// =============================================================================

/**
 * Construye contexto de conversación para GPT-4
 * @param {string} userMessage - Mensaje actual del usuario
 * @param {Array} conversationHistory - Historial previo [{role, content}]
 * @param {boolean} includeContext - Si incluir contexto adicional
 * @returns {Array} Mensajes formateados para OpenAI
 */
function buildConversationContext(userMessage, conversationHistory, includeContext) {
  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    }
  ];

  // Agregar historial reciente (últimos MAX_CONVERSATION_HISTORY mensajes)
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
    messages.push(...recentHistory);
  }

  // Agregar mensaje actual del usuario
  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}

// =============================================================================
// FAQ SEARCH (Base de Conocimiento)
// =============================================================================

/**
 * Busca FAQs relevantes en base de datos
 * @param {string} query - Query del usuario
 * @returns {string|null} Contexto de FAQs o null
 */
async function searchRelevantFAQs(query) {
  try {
    // Búsqueda por similaridad de texto (PostgreSQL full-text search)
    const result = await pool.query(
      `SELECT
        pregunta,
        respuesta,
        categoria,
        ts_rank(
          to_tsvector('spanish', pregunta || ' ' || respuesta),
          plainto_tsquery('spanish', $1)
        ) AS rank
       FROM faqs_chatbot
       WHERE to_tsvector('spanish', pregunta || ' ' || respuesta)
         @@ plainto_tsquery('spanish', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [query, MAX_FAQ_RESULTS]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Formatear FAQs como contexto
    const faqContext = result.rows
      .map((faq, index) => {
        return `[FAQ ${index + 1}] Categoría: ${faq.categoria}
Pregunta: ${faq.pregunta}
Respuesta: ${faq.respuesta}`;
      })
      .join('\n\n');

    console.log(`[OPENAI] Found ${result.rows.length} relevant FAQs`);

    return faqContext;

  } catch (error) {
    console.error('[OPENAI] Error searching FAQs:', error);
    return null;
  }
}

// =============================================================================
// FALLBACK RESPONSES
// =============================================================================

/**
 * Genera respuesta de fallback sin usar OpenAI
 * @param {string} userMessage - Mensaje del usuario
 * @returns {string} Respuesta genérica
 */
async function getFallbackResponse(userMessage) {
  // Búsqueda simple de palabra clave en FAQs
  const keywords = userMessage.toLowerCase().split(' ').filter(w => w.length > 3);

  if (keywords.length === 0) {
    return 'Lo siento, no pude procesar tu mensaje. ¿Podrías reformular tu pregunta?';
  }

  try {
    // Búsqueda básica por palabra clave
    const result = await pool.query(
      `SELECT respuesta FROM faqs_chatbot
       WHERE LOWER(pregunta) LIKE ANY($1)
       LIMIT 1`,
      [keywords.map(k => `%${k}%`)]
    );

    if (result.rows.length > 0) {
      return result.rows[0].respuesta + '\n\n(Respuesta automática - el sistema AI está temporalmente no disponible)';
    }

    return `Lo siento, estoy teniendo problemas técnicos. Por favor, contacta directamente a:
📧 Email: contacto@bachillerato-heroes.edu.mx
📞 Teléfono: (33) 1234-5678
⏰ Horario: Lunes a Viernes, 8:00 AM - 6:00 PM`;

  } catch (error) {
    console.error('[OPENAI] Error generating fallback:', error);
    return 'Lo siento, estoy temporalmente fuera de servicio. Por favor, intenta más tarde.';
  }
}

// =============================================================================
// CHAT HISTORY PERSISTENCE
// =============================================================================

/**
 * Guarda mensaje de chat en base de datos
 * @param {string} userId - ID del usuario
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} assistantMessage - Respuesta del asistente
 * @param {number} tokensUsed - Tokens consumidos
 */
async function saveChatMessage(userId, userMessage, assistantMessage, tokensUsed) {
  try {
    await pool.query(
      `INSERT INTO chat_history (
        user_id, user_message, assistant_message, tokens_used, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, userMessage, assistantMessage, tokensUsed]
    );

    console.log(`[OPENAI] Chat message saved for user ${userId}`);

  } catch (error) {
    console.error('[OPENAI] Error saving chat message:', error);
    // No throwear error - guardado es opcional
  }
}

/**
 * Obtiene historial de conversación del usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número de mensajes a obtener
 * @returns {Array} Historial de conversación
 */
async function getChatHistory(userId, limit = MAX_CONVERSATION_HISTORY) {
  try {
    const result = await pool.query(
      `SELECT
        user_message,
        assistant_message,
        created_at
       FROM chat_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    // Formatear para OpenAI (más reciente primero, pero en orden cronológico)
    const history = result.rows.reverse().flatMap(row => [
      {
        role: 'user',
        content: row.user_message
      },
      {
        role: 'assistant',
        content: row.assistant_message
      }
    ]);

    return history;

  } catch (error) {
    console.error('[OPENAI] Error fetching chat history:', error);
    return [];
  }
}

// =============================================================================
// MULTI-TURN CONVERSATION
// =============================================================================

/**
 * Continúa conversación existente
 * @param {string} userId - ID del usuario
 * @param {string} userMessage - Mensaje nuevo del usuario
 * @param {object} options - Opciones adicionales
 * @returns {object} Respuesta del chatbot
 */
async function continueConversation(userId, userMessage, options = {}) {
  // Obtener historial previo
  const conversationHistory = await getChatHistory(userId);

  // Generar respuesta con contexto
  return generateChatResponse(userMessage, {
    userId,
    conversationHistory,
    ...options
  });
}

// =============================================================================
// FAQ MANAGEMENT
// =============================================================================

/**
 * Agrega nuevo FAQ a la base de conocimiento
 * @param {object} faqData - Datos del FAQ
 * @returns {object} FAQ creado
 */
async function createFAQ(faqData) {
  const { pregunta, respuesta, categoria, idioma = 'es', activo = true } = faqData;

  const result = await pool.query(
    `INSERT INTO faqs_chatbot (
      pregunta, respuesta, categoria, idioma, activo, created_at
    ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    RETURNING *`,
    [pregunta, respuesta, categoria, idioma, activo]
  );

  console.log(`[OPENAI] FAQ created: ${result.rows[0].id}`);

  return result.rows[0];
}

/**
 * Actualiza FAQ existente
 * @param {string} faqId - ID del FAQ
 * @param {object} updates - Campos a actualizar
 * @returns {object} FAQ actualizado
 */
async function updateFAQ(faqId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (['pregunta', 'respuesta', 'categoria', 'idioma', 'activo'].includes(key)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(faqId);

  const result = await pool.query(
    `UPDATE faqs_chatbot
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  console.log(`[OPENAI] FAQ updated: ${faqId}`);

  return result.rows[0];
}

/**
 * Obtiene todos los FAQs (admin)
 * @param {object} filters - Filtros opcionales
 * @returns {Array} Lista de FAQs
 */
async function getAllFAQs(filters = {}) {
  const { categoria, idioma, activo, search } = filters;

  let query = 'SELECT * FROM faqs_chatbot WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (categoria) {
    query += ` AND categoria = $${paramIndex}`;
    params.push(categoria);
    paramIndex++;
  }

  if (idioma) {
    query += ` AND idioma = $${paramIndex}`;
    params.push(idioma);
    paramIndex++;
  }

  if (activo !== undefined) {
    query += ` AND activo = $${paramIndex}`;
    params.push(activo);
    paramIndex++;
  }

  if (search) {
    query += ` AND (pregunta ILIKE $${paramIndex} OR respuesta ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);

  return result.rows;
}

// =============================================================================
// USAGE ANALYTICS
// =============================================================================

/**
 * Obtiene estadísticas de uso del chatbot
 * @param {object} filters - Filtros opcionales (dateFrom, dateTo, userId)
 * @returns {object} Estadísticas
 */
async function getChatbotAnalytics(filters = {}) {
  const { dateFrom, dateTo, userId } = filters;

  let whereClause = '1=1';
  const params = [];
  let paramIndex = 1;

  if (dateFrom) {
    whereClause += ` AND created_at >= $${paramIndex}`;
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereClause += ` AND created_at <= $${paramIndex}`;
    params.push(dateTo);
    paramIndex++;
  }

  if (userId) {
    whereClause += ` AND user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  const result = await pool.query(
    `SELECT
      COUNT(*) AS total_messages,
      COUNT(DISTINCT user_id) AS unique_users,
      SUM(tokens_used) AS total_tokens,
      AVG(tokens_used) AS avg_tokens_per_message,
      MAX(created_at) AS last_message_at
     FROM chat_history
     WHERE ${whereClause}`,
    params
  );

  return result.rows[0];
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  generateChatResponse,
  continueConversation,
  getChatHistory,
  createFAQ,
  updateFAQ,
  getAllFAQs,
  getChatbotAnalytics,
  buildConversationContext,
  searchRelevantFAQs,
  getFallbackResponse
};
