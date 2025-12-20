# Documentación Técnica: Sistema RAG (Fase 2 - Semana 6)

**Ubicación del Código:** `backend/ai/rag/`
**Dependencias:** `openai`, `@pinecone-database/pinecone`, `pdf-parse`.

## Arquitectura del Componente

### 1. Ingesta (`ingest_docs.js`)

Script ETL manual para cargar conocimiento.

* **Input:** Archivo PDF.
* **Proceso:**
    1. Extracción de texto plano.
    2. Chunking (Ventana 1000 tokens, Overlap 200).
    3. Embedding (`text-embedding-3-small` -> 1536 dim).
    4. Upsert a Pinecone en batches.
* **Metadata:** Se adjunta el nombre del archivo y el texto original para retrieval inverso.

### 2. Recuperación (`retrieval_service.js`)

Servicio de búsqueda semántica.

* **Funcionalidad:** Convierte la pregunta del usuario en vector y busca los 3 vecinos más cercanos (Top-K=3) en Pinecone.
* **Threshold:** Ignora resultados con similitud < 0.40 para evitar "ruido".

### 3. Generación (`chat_service.js`)

Cerebro de la operación.

* **Modelo:** GPT-4o-mini.
* **Prompting:** Usa la técnica "Context Stuffing" (inyectar chunks recuperados en el System Prompt).
* **Safety:** Instrucción estricta "No inventes" (Grounding).

## Guía de Despliegue

### Variables de Entorno Requeridas

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pc-...
PINECONE_INDEX=heroes-knowledge-base
```

### Ejecución de Prueba

1. **Cargar Reglamento:**

    ```bash
    node backend/ai/rag/ingest_docs.js ./docs/reglamento_2025.pdf "normativa"
    ```

2. **Probar Chat (Script temporal):**

    ```javascript
    const { processChatMessage } = require('./backend/ai/rag/chat_service');
    processChatMessage("¿Puedo llevar tenis rojos?").then(console.log);
    ```

## Limitaciones Conocidas (Fase Beta)

* **Tablas en PDF:** El parser `pdf-parse` destruye la estructura de tablas complejas.
* **Memoria:** El chat no tiene persistencia de sesión real (Redis) todavía; solo memoria volátil en array.
