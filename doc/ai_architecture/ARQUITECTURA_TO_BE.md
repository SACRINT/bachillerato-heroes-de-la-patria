# Arquitectura "To-Be" del Sistema Inteligente (Semana 1)

**Propósito:** Definir la integración de componentes de IA en la arquitectura web existente.

## Diagrama de Alto Nivel

```mermaid
graph TD
    User[Usuario (Estudiante/Admin)] -->|HTTPS| Frontend[Web App Vercel]
    
    subgraph "Frontend Layer"
        Frontend -->|API Call| ChatWidget[Chat Widget JS]
        Frontend -->|View Report| Dashboard[Dashboard Chart.js]
    end
    
    subgraph "Backend Layer (Vercel Node.js)"
        API[API Endpoint /api/chat] -->|Auth JWT| AuthMiddleware
        API -->|1. Context Search| VectorService[Pinecone Service]
        API -->|3. Prompt + Context| LLMService[OpenAI Service]
        API -->|Log Interaction| PG[PostgreSQL Database]
    end
    
    subgraph "AI Services (External)"
        VectorService -->|Query| Pinecone[Pinecone Vector DB]
        LLMService -->|Generate| OpenAI[OpenAI GPT-4o-mini]
    end
    
    subgraph "Data Pipeline (Async)"
        Docs[Documentos Institucionales] -->|Upload| Ingesta[Ingest Script]
        DataGrades[Historial Académico] -->|ETL| MLTraining[Training Env (Local/Colab)]
        Ingesta -->|Embed| OpenAI
        Ingesta -->|Upsert| Pinecone
    end
```

## Componentes Clave

### 1. API Gateway de IA (`/api/ai/*`)

Un conjunto de endpoints protegidos en `api/index.js`:

* `POST /api/ai/chat`: Endpoint principal para consultas. Maneja historial y contexto.
* `POST /api/ai/recommend`: Genera sugerencias de contenido personalizadas.
* `GET /api/ai/stats`: Métricas de uso para el dashboard admin.

### 2. Servicio RAG (Retrieval-Augmented Generation)

Lógica encapsulada (posiblemente en `backend/services/aiService.js`) que:

1. Recibe la pregunta del usuario.
2. Convierte la pregunta en vector (Embedding).
3. Consulta Pinecone para encontrar los 3-5 fragmentos de texto más relevantes.
4. Construye un prompt enriquecido: _"Usa la siguiente información para responder: {contexto}. Pregunta: {query}"_.

### 3. Almacén de Vectores (Vector Store)

* **Namespace:** `reglamentos`, `contenido-academico`.
* **Metadata:** `fuente: manual_estudiante_2025.pdf`, `pagina: 12`.

### 4. Modelo de Predicción (Futuro)

Para la alerta temprana de deserción:

* Debido a las limitaciones de Vercel, el modelo (XGBoost/RandomForest) se entrenará **offline** (local/Colab).
* El modelo entrenado se exportará a **ONNX** o formato JSON ligero.
* Un servicio Node.js cargará el modelo ligero (`onnxruntime-node`) para hacer inferencias rápidas en tiempo real o batch nocturno.

## Flujo de Seguridad

1. **Sanitización:** Todo input pasa por filtros de XSS y SQLi.
2. **Moderación:** El input se envía primero a `OpenAI Moderation Endpoint` para detectar odio/violencia.
3. **Privacidad:** NO se envían nombres reales ni matrículas a OpenAI. Se usan identificadores opacos (`student_hash_123`).
