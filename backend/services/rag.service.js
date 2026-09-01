/**
 * 🔍 RAG SERVICE (Retrieval-Augmented Generation)
 * Búsqueda léxica e inyección de contexto institucional con citas de fuentes
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión: FASE 5 (Semanas 18-20)
 */

const { INSTITUTIONAL_DOCUMENTS } = require('../data/institutional-knowledge.js');
const devLogger = require('../utils/devLogger.js');

class RAGService {
    constructor() {
        this.documents = INSTITUTIONAL_DOCUMENTS;
    }

    /**
     * Limpia y normaliza texto para búsqueda léxica
     */
    _normalize(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remover acentos
            .replace(/[^\w\s]/g, " ")       // Remover puntuación
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * Busca los fragmentos de conocimiento institucional más relevantes
     * @param {string} query Pregunta del usuario
     * @param {number} maxResults Máximo de documentos a retornar (default: 2)
     * @param {number} minScore Puntaje mínimo de relevancia
     */
    search(query, maxResults = 2, minScore = 1) {
        const normQuery = this._normalize(query);
        const queryTokens = normQuery.split(' ').filter(t => t.length > 2);

        if (queryTokens.length === 0) {
            return [];
        }

        const scoredDocs = this.documents.map(doc => {
            let score = 0;
            const normTitle = this._normalize(doc.title);
            const normContent = this._normalize(doc.content);
            const normKeywords = doc.keywords.map(k => this._normalize(k));

            queryTokens.forEach(token => {
                // Match en keywords (peso alto: +5)
                normKeywords.forEach(kw => {
                    if (kw === token) score += 5;
                    else if (kw.includes(token) || token.includes(kw)) score += 3;
                });

                // Match en título (peso medio: +3)
                if (normTitle.includes(token)) score += 3;

                // Match en contenido (peso base: +1)
                if (normContent.includes(token)) score += 1;
            });

            return {
                ...doc,
                score
            };
        });

        // Filtrar y ordenar por relevancia descendente
        const relevantDocs = scoredDocs
            .filter(d => d.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);

        devLogger.log(`[RAG-SERVICE] Query: "${query.substring(0, 40)}..." -> Encontrados ${relevantDocs.length} documentos (top score: ${relevantDocs[0]?.score || 0})`);

        return relevantDocs;
    }

    /**
     * Construye un prompt enriquecido con el contexto RAG para la IA
     */
    buildAugmentedPrompt(userMessage, relevantDocs) {
        if (!relevantDocs || relevantDocs.length === 0) {
            return {
                systemPrompt: `Eres el Asistente Virtual Oficial del Bachillerato General Estatal "Héroes de la Patria". 
Responde con amabilidad, precisión y tono institucional a los estudiantes, padres y docentes. Si no tienes certeza de un dato administrativo, sugiere amablemente acudir a la oficina de Control Escolar o enviar correo a contacto@sipweb-bg.edu.mx.`,
                contextText: "",
                sources: []
            };
        }

        const contextParts = relevantDocs.map((doc, idx) => 
            `[DOCUMENTO OFICIAL #${idx + 1}]\nInstitución: Bachillerato General Estatal "Héroes de la Patria"\nTítulo: ${doc.title}\nFuente: ${doc.source}\nContenido:\n${doc.content}`
        );

        const contextText = contextParts.join("\n\n---\n\n");
        const sources = relevantDocs.map(d => ({
            id: d.id,
            title: d.title,
            source: d.source,
            category: d.category
        }));

        const systemPrompt = `Eres el Asistente Virtual Inteligente del Bachillerato General Estatal "Héroes de la Patria" (Puebla, México).
A continuación tienes INFORMACIÓN OFICIAL VERIFICADA del plantel para responder la consulta del usuario.

REGLAS OBLIGATORIAS:
1. Basa tu respuesta PRINCIPALMENTE en los documentos oficiales proporcionados.
2. CITA explícitamente la fuente oficial al final de tu respuesta (ejemplo: "[Fuente: ${relevantDocs[0].source}]").
3. Sé claro, conciso, respetuoso y profesional.
4. Si la pregunta es sobre horarios, becas, inscripciones o trámites, proporciona los datos numéricos y exactos contenidos en los documentos.

INFORMACIÓN INSTITUCIONAL OFICIAL:
${contextText}`;

        return {
            systemPrompt,
            contextText,
            sources
        };
    }
}

const ragService = new RAGService();
module.exports = ragService;
