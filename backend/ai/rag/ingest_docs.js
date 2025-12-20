/**
 * @file ingest_docs.js
 * @description Script de ingesta ETL para documentos (PDF -> Pinecone).
 * Uso: node ingest_docs.js ./files/reglamento.pdf "normativa"
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const OpenAI = require('openai');
const { getIndex } = require('./pinecone_client');

// Configuración
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Lee y extrae texto de un archivo PDF.
 */
async function extractText(filePath) {
    console.log(`[INGEST] Leyendo archivo: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text; // Texto plano limpio
}

/**
 * Divide el texto en fragmentos solapados.
 */
function chunkText(text) {
    const chunks = [];
    let start = 0;

    // Limpieza básica
    const cleanText = text.replace(/\s+/g, ' ').trim();

    while (start < cleanText.length) {
        const end = Math.min(start + CHUNK_SIZE, cleanText.length);
        let chunk = cleanText.slice(start, end);

        // Ajustar corte a última palabra para no cortar a la mitad
        /* (Lógica simplificada para demo) */

        chunks.push(chunk);

        // Mover cursor considerando overlap
        start += (CHUNK_SIZE - CHUNK_OVERLAP);
    }
    return chunks;
}

/**
 * Genera Embeddings usando OpenAI.
 */
async function getEmbeddings(chunks) {
    console.log(`[INGEST] Generando embeddings para ${chunks.length} fragmentos...`);
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks,
        encoding_format: "float",
    });
    return response.data; // Array de objetos { embedding: [], index: 0, ... }
}

/**
 * Pipeline Principal de Ingesta.
 */
async function ingestDocument(filePath, namespace = 'general') {
    try {
        if (!fs.existsSync(filePath)) throw new Error('Archivo no encontrado');
        const filename = path.basename(filePath);

        // 1. Extract
        const fullText = await extractText(filePath);
        console.log(`[INGEST] Texto extraído (${fullText.length} caracteres).`);

        // 2. Chunk
        const textChunks = chunkText(fullText);
        console.log(`[INGEST] Generados ${textChunks.length} chunks.`);

        // 3. Embed (Batch processing recomendado para producción, aquí simple)
        const embeddingResponse = await getEmbeddings(textChunks);

        // 4. Load (Pinecone Upsert)
        const index = await getIndex();

        const vectors = embeddingResponse.map((item, i) => ({
            id: `${filename}_chunk_${i}`,
            values: item.embedding,
            metadata: {
                source: filename,
                text: textChunks[i],
                chunk_index: i,
                namespace: namespace
            }
        }));

        // Batch upsert (Pinecone limit is usually 100 vectors per request ideally)
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.namespace(namespace).upsert(batch);
            console.log(`[INGEST] Batch ${i / batchSize + 1} subido a Pinecone.`);
        }

        console.log('✅ [INGEST] Documento indexado exitosamente.');

    } catch (error) {
        console.error('❌ [INGEST] Error fatal:', error);
    }
}

// Ejecución CLI
// Ejemplo: node ingest_docs.js C:/docs/manual.pdf "reglamentos"
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log("Uso: node ingest_docs.js <path_to_pdf> [namespace]");
    } else {
        ingestDocument(args[0], args[1]);
    }
}

module.exports = { ingestDocument };
