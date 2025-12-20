# Especificación de Servicios de Datos (Internal API)

**Objetivo:** Desacoplar la lógica de IA del backend principal mediante una API interna de servicios de datos.

## 1. Endpoints de Servicio de Datos (`/api/data-service/`)

Estos endpoints son **estrictamente internos** (protegidos por `SERVICE_ROLE_KEY`) y sirven para que los agentes de IA consulten datos sin hacer SQL directo.

### A. Consulta Académica

* `GET /api/data-service/student/{id}/summary`
  * **Response:** JSON conforme a `Student360Profile`.
  * **Uso:** Inyectar contexto al Chatbot Tutor.

### B. Ingesta de Logs

* `POST /api/data-service/logs/interaction`
  * **Payload:** `{ user_id, prompt, response_time, model }`
  * **Acción:** Inserta en `ai_interaction_logs` de forma asíncrona.

### C. Vector Search Proxy

* `POST /api/data-service/knowledge/search`
  * **Payload:** `{ query: "reglamento uniformes", top_k: 3 }`
  * **Acción:** Genera embedding y consulta Pinecone. Abstrae la complejidad de Pinecone del resto de la app.

## 2. Sistema Centralizado de Logging

### Estándar de Logs (JSON Estructurado)

Para facilitar la auditoría, todos los logs de IA deben seguir este formato:

```json
{
  "timestamp": "2025-10-27T10:00:00Z",
  "level": "INFO",
  "service": "ai-tutor",
  "trace_id": "abc-123-xyz",
  "user_hash": "e6a2...",
  "event": "completion_generated",
  "metadata": {
    "model": "gpt-4o-mini",
    "prompt_length": 150,
    "response_length": 45,
    "cost_usd": 0.00012
  }
}
```

## 3. Estrategia de Backups

### Modelos (Vector Store)

* **Snapshot Diario:** Exportar índices de Pinecone a JSON/Parquet y guardar en AWS S3 / Google Cloud Storage (Bucket Privado).
* **Recuperación:** Script `restore-vectors.js` que lee del bucket y repuebla Pinecone.

### Feature Store (PostgreSQL)

* **Backup Nativo:** Usar pg_dump diario (gestionado por Neon/PlanetScale).
* **Retención:** 30 días.
