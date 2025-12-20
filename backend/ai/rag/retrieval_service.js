/**
 * @file retrieval_service.js
 * @description Servicio de búsqueda semántica (Retrieval) en base de conocimiento.
 */

const OpenAI = require('openai');
const { getIndex } = require('./pinecone_client');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Busca fragmentos relevantes para una consulta.
 * @param {string} query Pregunta del usuario
 * @param {string} namespace Categoría (ej. 'normativa', 'academico')
 * @param {number} topK Cantidad de resultados (default 3)
 * @returns {Promise<Array>} Lista de chunks con score y metadata
 */
async function retrieveContext(query, namespace = 'general', topK = 3) {
    try {
        // 1. Vectorizar la query
        const embeddingResp = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });
        const queryVector = embeddingResp.data[0].embedding;

        // 2. Buscar en Pinecone
        const index = await getIndex();
        const searchResult = await index.namespace(namespace).query({
            vector: queryVector,
            topK: topK,
            includeMetadata: true,
            includeValues: false
        });

        // 3. Formatear y filtrar por score mínimo (threshold)
        const minScore = 0.40; // Ajustar según pruebas
        const relevantDocs = searchResult.matches
            .filter(match => match.score >= minScore)
            .map(match => ({
                text: match.metadata.text,
                source: match.metadata.source,
                score: match.score
            }));

        return relevantDocs;

    } catch (error) {
        console.error('[RETRIEVAL] Error buscando contexto:', error);
        return []; // Fallback seguro: devolver array vacío (RAG fallará "gracefully" a conocimiento base)
    }
}

module.exports = { retrieveContext };
