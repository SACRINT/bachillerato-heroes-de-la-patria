/**
 * Genera respuesta del chatbot usando GPT-4
 * @param {string} userMessage - Mensaje del usuario
 * @param {object} options - Opciones adicionales
 * @returns {object} Respuesta del chatbot
 */
export function generateChatResponse(userMessage: string, options?: object): object;
/**
 * Continúa conversación existente
 * @param {string} userId - ID del usuario
 * @param {string} userMessage - Mensaje nuevo del usuario
 * @param {object} options - Opciones adicionales
 * @returns {object} Respuesta del chatbot
 */
export function continueConversation(userId: string, userMessage: string, options?: object): object;
/**
 * Obtiene historial de conversación del usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número de mensajes a obtener
 * @returns {Array} Historial de conversación
 */
export function getChatHistory(userId: string, limit?: number): any[];
/**
 * Agrega nuevo FAQ a la base de conocimiento
 * @param {object} faqData - Datos del FAQ
 * @returns {object} FAQ creado
 */
export function createFAQ(faqData: object): object;
/**
 * Actualiza FAQ existente
 * @param {string} faqId - ID del FAQ
 * @param {object} updates - Campos a actualizar
 * @returns {object} FAQ actualizado
 */
export function updateFAQ(faqId: string, updates: object): object;
/**
 * Obtiene todos los FAQs (admin)
 * @param {object} filters - Filtros opcionales
 * @returns {Array} Lista de FAQs
 */
export function getAllFAQs(filters?: object): any[];
/**
 * Obtiene estadísticas de uso del chatbot
 * @param {object} filters - Filtros opcionales (dateFrom, dateTo, userId)
 * @returns {object} Estadísticas
 */
export function getChatbotAnalytics(filters?: object): object;
/**
 * Construye contexto de conversación para GPT-4
 * @param {string} userMessage - Mensaje actual del usuario
 * @param {Array} conversationHistory - Historial previo [{role, content}]
 * @param {boolean} includeContext - Si incluir contexto adicional
 * @returns {Array} Mensajes formateados para OpenAI
 */
export function buildConversationContext(userMessage: string, conversationHistory: any[], includeContext: boolean): any[];
/**
 * Busca FAQs relevantes en base de datos
 * @param {string} query - Query del usuario
 * @returns {string|null} Contexto de FAQs o null
 */
export function searchRelevantFAQs(query: string): string | null;
/**
 * Genera respuesta de fallback sin usar OpenAI
 * @param {string} userMessage - Mensaje del usuario
 * @returns {string} Respuesta genérica
 */
export function getFallbackResponse(userMessage: string): string;
//# sourceMappingURL=openai-service.d.ts.map