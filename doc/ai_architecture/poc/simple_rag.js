/**
 * POC: Simple Semantic Retrieval (RAG)
 * Demostración de cómo funcionaría el backend de búsqueda sin base de datos real.
 * Simula: OpenAI Embeddings + Búsqueda de similitud de Coseno.
 * 
 * Requisitos: npm install openai dot-product
 */

// Simulación de base de datos vectorial (Memoria)
const knowledgeBase = [
    { id: 1, text: "El uniforme escolar consta de pantalón azul marino y camisa blanca polo institucional.", category: "reglamento" },
    { id: 2, text: "Las clases inician a las 7:00 AM y terminan a las 2:00 PM de lunes a viernes.", category: "horario" },
    { id: 3, text: "Para justificar faltas, se debe presentar receta médica en Servicios Escolares antes de 48 horas.", category: "tramites" },
    { id: 4, text: "El director actual del plantel es el Mtro. Juan Pérez.", category: "directorio" }
];

// Mock de Embeddings (En producción esto viene de OpenAI text-embedding-3-small)
// Vectores simplificados de 3 dimensiones para demo visual
const vectors = {
    1: [0.1, 0.8, 0.2], // Uniforme (Alta correlación con 'ropa')
    2: [0.9, 0.2, 0.1], // Horario (Alta correlación con 'tiempo')
    3: [0.5, 0.5, 0.5], // Trámites (Mixto)
    4: [0.2, 0.3, 0.9]  // Director (Alta correlación con 'personas')
};

// Función de similitud de coseno
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magA * magB);
}

// Simulador de Pipeline RAG
async function queryRAG(userQuery) {
    console.log(`\n🔍 Usuario pregunta: "${userQuery}"`);

    // 1. Convertir Query a Vector (Simulado)
    // Supongamos que el usuario preguntó por 'ropa' o 'vestimenta' -> Vector similar al ID 1
    let queryVector;
    if (userQuery.includes("uniforme") || userQuery.includes("ropa")) {
        queryVector = [0.15, 0.75, 0.25];
    } else if (userQuery.includes("hora") || userQuery.includes("entrada")) {
        queryVector = [0.85, 0.25, 0.15];
    } else {
        queryVector = [0.33, 0.33, 0.33]; // Query genérica
    }

    console.log(`🔢 Vector generado (Mock): [${queryVector.join(', ')}]`);

    // 2. Búsqueda Vectorial (Nearest Neighbor)
    const matches = knowledgeBase.map(doc => {
        const docVector = vectors[doc.id];
        const score = cosineSimilarity(queryVector, docVector);
        return { ...doc, score };
    });

    // 3. Ranking y Filtrado
    const topResults = matches
        .sort((a, b) => b.score - a.score) // Ordenar descendente
        .filter(doc => doc.score > 0.7)    // Threshold (Umbral de mínima relevancia)
        .slice(0, 2);                      // Top 2

    // 4. Resultado
    if (topResults.length > 0) {
        console.log(`✅ Documentos Recuperados (Contexto):`);
        topResults.forEach(r => console.log(`   - [Score: ${r.score.toFixed(4)}] "${r.text}"`));

        // Aquí se enviaría a GPT-4 para generar la respuesta final
        console.log(`🤖 Prompt a GPT-4: "Usa la información anterior para responder..."`);
    } else {
        console.log(`⚠️ No se encontró información relevante (Score muy bajo). Respuesta default.`);
    }
}

// Ejecutar pruebas
/* 
   Para correr esto: 
   1. Guarda como simple_rag.js 
   2. node simple_rag.js
*/
console.log("--- POC RAG SIMULATOR ---");
queryRAG("¿Cuál es el uniforme?");
queryRAG("¿A qué hora entramos?");
queryRAG("¿Quién descubrió América?"); // Caso sin contexto
