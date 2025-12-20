# Diseño de Pipeline de Datos (Data Pipeline)

**Objetivo:** Automatizar el flujo de información desde los documentos institucionales y la base de datos hasta el sistema de conocimiento de la IA.

## Fuentes de Datos

1. **Datos Estructurados (PostgreSQL):**
    * Oferta académica (Carreras, materias).
    * Calendario escolar.
    * FAQs predefinidas.
2. **Datos No Estructurados (Archivos):**
    * Reglamento Escolar (PDF).
    * Manuales de Inscripción (PDF/Word).
    * Guías de estudio (PDF).

## Arquitectura del Pipeline

### Etapa 1: Ingesta (Extraction)

* **Herramienta:** Script Node.js `scripts/ai/ingest-docs.js`.
* **Trigger:** Manual (al inicio) -> Automático (Watch folder o Admin Dashboard Upload).
* **Proceso:**
  * Leer archivos del directorio `backend/data/documents/`.
  * Extraer texto plano usando `pdf-parse`.

### Etapa 2: Transformación (Transformation)

* **Limpieza:**
  * Eliminar encabezados/pies de página repetitivos.
  * Normalizar espacios en blanco.
* **Chunking (Fragmentación):**
  * Dividir el texto en bloques de **500 a 1000 caracteres**.
  * Overlap (Superposición): 100 caracteres para mantener contexto entre cortes.
  * *Librería:* `LangChain RecursiveCharacterTextSplitter`.

### Etapa 3: Carga (Loading - Embeddings)

* **Embedding Model:** `text-embedding-3-small` (OpenAI).
  * Input: Chunk de texto.
  * Output: Vector de 1536 dimensiones.
* **Vector Database (Pinecone):**
  * Operación: `upsert`.
  * ID: Hash del contenido (para evitar duplicados).
  * Metadata: `{ source: "reglamento.pdf", page: 5, category: "normativa" }`.

## Diagrama de Flujo (Pseudocódigo)

```javascript
async function runPipeline() {
  // 1. Cargar documentos
  const docs = await loadDocuments('./data/source');
  
  // 2. Split en chunks
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const chunks = await splitter.splitDocuments(docs);
  
  // 3. Generar Embeddings & Guardar
  const vectorStore = await PineconeStore.fromDocuments(chunks, new OpenAIEmbeddings(), {
    pineconeIndex: index,
    namespace: 'knowledge-base-v1'
  });
  
  console.log(`Ingestada completada: ${chunks.length} vectores creados.`);
}
```

## Plan de Actualización

* **Frecuencia:** Semanal o bajo demanda cuando cambie un reglamento.
* **Mantenimiento:** Botón "Re-indexar Conocimiento" en el Dashboard de Admin.
