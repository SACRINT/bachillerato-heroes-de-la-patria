/**
 * 🧠 SEMANTIC SEARCH SERVICE (pgvector + Neon PostgreSQL)
 * Fase 6 - Backend Inteligente: Objetivo 2
 * Búsqueda semántica de conocimiento escolar con embeddings vectoriales de 1536 dimensiones.
 */

const { pool } = require('../config/database.js');
const { INSTITUTIONAL_DOCUMENTS } = require('../data/institutional-knowledge.js');

// Documentos complementarios para enriquecer el corpus escolar
const ADDITIONAL_DOCUMENTS = [
    {
        id: "doc_tramite_justificantes",
        category: "tramites",
        title: "Procedimiento Oficial para Justificación de Inasistencias",
        source: "Control Escolar y Orientación Educativa BGE",
        keywords: ["justificante", "falta", "inasistencia", "receta", "medico", "enfermedad", "permiso", "plazo"],
        content: `Para justificar una inasistencia escolar en el BGE, el alumno o tutor debe presentar:
1. Receta médica original expedida por el IMSS, ISSSTE, Centro de Salud o médico particular con cédula profesional.
2. Solicitud de justificante firmada por el padre de familia o tutor legal.
3. El trámite debe realizarse dentro de las 48 a 72 horas hábiles posteriores al reingreso del estudiante.
Una vez validado, el orientador educativo sella el justificante oficial con el cual los docentes permitirán la entrega de tareas, prácticas y aplicación extemporánea de exámenes.`
    },
    {
        id: "doc_seguro_imss_estudiantes",
        category: "tramites",
        title: "Seguro Facultativo de Salud IMSS para Estudiantes",
        source: "Secretaría de Educación Pública - IMSS",
        keywords: ["imss", "seguro", "salud", "facultativo", "clinica", "afiliacion", "nss", "estudiante"],
        content: `Todos los alumnos del Bachillerato General Estatal tienen derecho al Seguro de Salud para Estudiantes (Seguro Facultativo IMSS) gratuito durante todo su bachillerato.
Pasos para darse de alta:
1. Obtener el Número de Seguridad Social (NSS) en la página web oficial del IMSS o app IMSS Digital con su CURP.
2. Descargar la Constancia de Vigencia de Derechos.
3. Entregar ambos comprobantes en el Departamento de Servicios Estudiantiles del plantel.
4. Acudir a la clínica familiar asignada para darse de alta en el consultorio y recibir su Cartilla Nacional de Salud.`
    },
    {
        id: "doc_servicio_social",
        category: "academico",
        title: "Reglamento de Servicio Social y Prácticas BGE",
        source: "Dirección de Vinculación y Acreditación",
        keywords: ["servicio social", "horas", "acreditacion", "practicas", "quinto semestre", "sexto semestre", "comunidad"],
        content: `El Servicio Social es un requisito indispensable y obligatorio para obtener el Certificado de Bachillerato General Estatal.
- Se cursa a partir del quinto semestre una vez cubierto al menos el 70% de los créditos del plan de estudios.
- Debe cubrir un total de 480 horas en un periodo no menor a seis meses ni mayor a dos años.
- Puede prestarse en instituciones públicas, escuelas secundarias, bibliotecas comunitarias o programas de alfabetización y cuidado ambiental avalados por la institución.`
    },
    {
        id: "doc_clubes_torneos",
        category: "vida_estudiantil",
        title: "Clubes CTIM, Deportes y Actividades Extracurriculares",
        source: "Coordinación de Difusión Cultural y Deportiva",
        keywords: ["deportes", "futbol", "basquetbol", "ajedrez", "club", "robotica", "ctim", "banda de guerra", "torneo"],
        content: `El BGE promueve la formación integral mediante talleres vespertinos y selecciones representativas:
- Club de Robótica y Ciencias CTIM: Proyectos con Arduino, impresión 3D e IA en el FabLab.
- Deportes: Selecciones varonil y femenil de Fútbol rápido, Básquetbol, Voleibol y club de Ajedrez.
- Cultura y Civismo: Banda de Guerra representativa, Escolta de Bandera Nacional y Taller de Teatro.
Las inscripciones a clubes son gratuitas y se abren durante las primeras dos semanas de cada semestre lectivo.`
    },
    {
        id: "doc_buzon_transparencia",
        category: "convivencia",
        title: "Buzón Escolar de Atención Ciudadana, Quejas y Sugerencias",
        source: "Comité de Transparencia y Convivencia Escolar",
        keywords: ["quejas", "sugerencias", "buzon", "folio", "denuncia", "acoso", "bullying", "transparencia", "atencion"],
        content: `El portal del BGE cuenta con el Buzón Digital de Atención Ciudadana (Hub 7).
Cualquier estudiante, docente o padre de familia puede registrar comentarios, quejas o solicitudes de apoyo garantizando estricta confidencialidad.
Al enviar el reporte se genera un Folio Único Institucional (ejemplo: BGE-QUEJA-2026-XXXX) con el que se puede dar seguimiento en tiempo real al estatus de resolución por parte de la Dirección escolar.`
    }
];

class SemanticSearchService {
    constructor() {
        this.pool = null;
        this.dimension = 1536; // Vector estándar pgvector
    }

    /**
     * Obtener o inicializar conexión a base de datos Neon
     */
    getPool() {
        return pool;
    }

    /**
     * Generar vector embedding de 1536 dimensiones para un texto
     * Arquitectura híbrida: OpenAI / Gemini / Fallback semántico determinista L2
     */
    async generateEmbedding(text) {
        if (!text || typeof text !== 'string') {
            return new Array(this.dimension).fill(0);
        }

        const cleanText = text.trim();

        // 1. Prioridad: OpenAI API si está configurada
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('CHANGE_ME')) {
            try {
                const res = await fetch('https://api.openai.com/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'text-embedding-3-small',
                        input: cleanText
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data[0]?.embedding) {
                        return data.data[0].embedding;
                    }
                }
            } catch (err) {
                console.warn('[SEMANTIC-SEARCH] OpenAI embedding error, intentando fallback:', err.message);
            }
        }

        // 2. Prioridad: Gemini Embedding si está configurada
        if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('CHANGE_ME')) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: { parts: [{ text: cleanText }] }
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    const values = data.embedding?.values;
                    if (Array.isArray(values) && values.length > 0) {
                        // Si Gemini devuelve 768 dims, proyectar o duplicar simétricamente a 1536
                        if (values.length === 1536) return values;
                        if (values.length < 1536) {
                            const extended = new Array(1536).fill(0);
                            for (let i = 0; i < 1536; i++) {
                                extended[i] = values[i % values.length] * (i < values.length ? 1 : 0.5);
                            }
                            return this._normalizeL2(extended);
                        }
                    }
                }
            } catch (err) {
                console.warn('[SEMANTIC-SEARCH] Gemini embedding error, intentando fallback:', err.message);
            }
        }

        // 3. Generador semántico autónomo y determinista (Hashing n-gram + proyección L2)
        return this._generateLocalDeterministicEmbedding(cleanText);
    }

    /**
     * Generador determinista y normalizado en 1536 dimensiones
     * Modela frecuencia de subpalabras y n-gramas con ponderación posicional
     */
    _generateLocalDeterministicEmbedding(text) {
        const vec = new Array(this.dimension).fill(0);
        const lower = text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, " ");
        
        const words = lower.split(/\s+/).filter(w => w.length > 1);

        // Hashing de palabras y trigramas
        words.forEach((word, wordIdx) => {
            const weight = 1.0 + (1.0 / (wordIdx + 1));
            
            // Hash de la palabra completa
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                hash = ((hash << 5) - hash) + word.charCodeAt(i);
                hash |= 0;
            }

            const baseIdx = Math.abs(hash) % this.dimension;
            vec[baseIdx] += weight * 2.0;

            // Variaciones semánticas distribuidas
            const altIdx1 = (baseIdx * 31 + 17) % this.dimension;
            const altIdx2 = (baseIdx * 127 + 43) % this.dimension;
            vec[altIdx1] += weight * 1.2;
            vec[altIdx2] += weight * 0.8;

            // N-gramas de caracteres (trigramas)
            for (let i = 0; i <= word.length - 3; i++) {
                const trigram = word.substring(i, i + 3);
                let triHash = 0;
                for (let j = 0; j < 3; j++) {
                    triHash = ((triHash << 3) - triHash) + trigram.charCodeAt(j);
                    triHash |= 0;
                }
                const triIdx = Math.abs(triHash) % this.dimension;
                vec[triIdx] += 0.5;
            }
        });

        return this._normalizeL2(vec);
    }

    /**
     * Normalizar vector a norma unitaria Euclidiana (L2 = 1.0)
     */
    _normalizeL2(vec) {
        let sumSq = 0;
        for (let i = 0; i < vec.length; i++) {
            sumSq += vec[i] * vec[i];
        }
        const norm = Math.sqrt(sumSq) || 1e-10;
        return vec.map(v => Number((v / norm).toFixed(6)));
    }

    /**
     * Convertir array numérico a formato string nativo de pgvector: '[0.1, 0.2, ...]'
     */
    vectorToString(vec) {
        return `[${vec.join(',')}]`;
    }

    /**
     * Inicializar o poblar la base de conocimiento escolar en Neon pgvector
     */
    async seedKnowledgeBase(tenantId = 1) {
        const pool = this.getPool();
        if (!pool) throw new Error('No hay conexión a base de datos para sembrar pgvector');

        const allDocs = [...INSTITUTIONAL_DOCUMENTS, ...ADDITIONAL_DOCUMENTS];
        console.log(`🌱 [SEMANTIC-SEARCH] Sembrando ${allDocs.length} documentos para tenant ${tenantId}...`);

        let insertedCount = 0;
        for (const doc of allDocs) {
            const combinedText = `${doc.title}\n${doc.category}\n${doc.content}\nKeywords: ${(doc.keywords || []).join(', ')}`;
            const embedding = await this.generateEmbedding(combinedText);
            const vectorStr = this.vectorToString(embedding);

            const query = `
                INSERT INTO school_knowledge_embeddings 
                    (tenant_id, category, title, content, embedding, metadata, updated_at)
                VALUES ($1, $2, $3, $4, $5::vector, $6, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO NOTHING;
            `;

            const metadata = {
                source: doc.source || 'Manual Escolar BGE',
                keywords: doc.keywords || [],
                doc_id: doc.id
            };

            await pool.query(query, [
                tenantId,
                doc.category,
                doc.title,
                doc.content,
                vectorStr,
                JSON.stringify(metadata)
            ]);
            insertedCount++;
        }

        console.log(`✅ [SEMANTIC-SEARCH] Sembrado completado: ${insertedCount} documentos indexados con vectores.`);
        return { success: true, count: insertedCount };
    }

    /**
     * Búsqueda semántica usando similitud coseno de pgvector (<=>)
     * @param {string} query Texto de búsqueda en lenguaje natural
     * @param {number} tenantId Identificador del plantel
     * @param {object} options Opciones de búsqueda (limit, category, minScore)
     */
    async search(query, tenantId = 1, options = {}) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return [];
        }

        const limit = Math.min(options.limit || 5, 20);
        const category = options.category || null;
        const minScore = options.minScore !== undefined ? options.minScore : 0.25;

        const pool = this.getPool();
        if (!pool) {
            // Fallback en memoria si la BD no está disponible
            return this._searchMemoryFallback(query, limit);
        }

        try {
            // Generar vector de la consulta
            const queryVec = await this.generateEmbedding(query);
            const queryVecStr = this.vectorToString(queryVec);

            // Consulta pgvector con operador de distancia coseno (<=>)
            // Similitud Coseno = 1 - Distancia Coseno
            const sql = `
                SELECT 
                    id, 
                    tenant_id, 
                    category, 
                    title, 
                    content, 
                    metadata,
                    ROUND((1 - (embedding <=> $1::vector))::numeric, 4) AS similarity_score
                FROM school_knowledge_embeddings
                WHERE tenant_id = $2
                  AND ($3::text IS NULL OR category = $3)
                  AND embedding IS NOT NULL
                ORDER BY embedding <=> $1::vector ASC
                LIMIT $4;
            `;

            const result = await pool.query(sql, [queryVecStr, tenantId, category, limit]);

            // Si la tabla estaba vacía, intentar sembrar automáticamente y reintentar
            if (result.rows.length === 0) {
                const countRes = await pool.query('SELECT COUNT(*) FROM school_knowledge_embeddings WHERE tenant_id = $1', [tenantId]);
                if (parseInt(countRes.rows[0].count) === 0) {
                    console.log('🔄 [SEMANTIC-SEARCH] Tabla vacía, ejecutando siembra automática...');
                    await this.seedKnowledgeBase(tenantId);
                    const retryRes = await pool.query(sql, [queryVecStr, tenantId, category, limit]);
                    return retryRes.rows.map(r => ({
                        ...r,
                        similarity_score: parseFloat(r.similarity_score)
                    }));
                }
            }

            return result.rows
                .map(r => ({
                    ...r,
                    similarity_score: parseFloat(r.similarity_score)
                }))
                .filter(r => r.similarity_score >= minScore);

        } catch (err) {
            console.error('[SEMANTIC-SEARCH] Error en búsqueda vectorial pgvector:', err.message);
            return this._searchMemoryFallback(query, limit);
        }
    }

    /**
     * Fallback de búsqueda léxico-semántica si Neon no está disponible
     */
    _searchMemoryFallback(query, limit = 5) {
        const allDocs = [...INSTITUTIONAL_DOCUMENTS, ...ADDITIONAL_DOCUMENTS];
        const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        const scored = allDocs.map(doc => {
            let score = 0;
            const fullText = `${doc.title} ${doc.category} ${doc.content} ${(doc.keywords || []).join(' ')}`.toLowerCase();
            qWords.forEach(w => {
                if (fullText.includes(w)) score += 1;
            });
            return {
                id: doc.id,
                category: doc.category,
                title: doc.title,
                content: doc.content,
                metadata: { keywords: doc.keywords, source: doc.source },
                similarity_score: Math.min(Number((score / (qWords.length || 1)).toFixed(2)), 1.0)
            };
        });

        return scored
            .filter(d => d.similarity_score > 0)
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, limit);
    }
}

// Instancia singleton
const semanticSearchService = new SemanticSearchService();

module.exports = {
    SemanticSearchService,
    semanticSearchService
};
