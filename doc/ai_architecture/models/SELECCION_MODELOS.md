# Selección de Modelos de IA (Week 3)

**Objetivo:** Elegir los modelos definitivos equilibrando **Costo**, **Precisión** y **Latencia** para la Fase 1 y 2.

## 1. LLM Principal (Chatbot General y Tutoría)

### Ganador: OpenAI GPT-4o-mini

* **Tipo:** Modelo Comercial (SaaS).
* **Justificación:**
  * **Costo:** Extremadamente bajo ($0.15 / 1M tokens input).
  * **Ventana de Contexto:** 128k (permite pasar manuales completos en el prompt si es necesario).
  * **Latencia:** Muy baja (< 1s Time-to-first-token), ideal para chat en vivo.
  * **Capacidad Multilingüe:** Excelente rendimiento en español mexicano.
* **Rol:** Manejar el 95% de las interacciones conversacionales.

### Alternativa Open Source (Fallback): Llama 3 8B (vía Groq/Together AI)

* **Uso:** Si se requiere soberanía de datos estricta en el futuro.
* **Limitación actual:** Infraestructura. Desplegarlo en Vercel es imposible. Requiere servicio externo de inferencia rápida.

## 2. Modelo de Embeddings (Búsqueda Semántica)

### Ganador: OpenAI text-embedding-3-small

* **Dimensión:** 1536.
* **Costo:** Marginal ($0.02 / 1M tokens).
* **Justificación:** Estándar de la industria, optimizado para RAG. Superior a `ada-002`.

## 3. Modelo de Clasificación (Routing / Triage)

### Ganador: GPT-4o-mini (Zero-Shot)

* En lugar de entrenar un modelo Bert pequeño, usaremos el mismo LLM con un prompt específico para clasificar la intención del usuario (`json_mode: true`).
* **Categorías:** `SOPORTE_TECNICO`, `CONSULTA_ACADEMICA`, `TRAMITES_ADMIN`, `SALUD_MENTAL`.

## 4. Modelo Predictivo (Riesgo de Deserción)

### Ganador: XGBoost (Tabular)

* **Tipo:** Machine Learning Clásico (Supervisado).
* **Justificación:**
  * Funciona mejor que Deep Learning para datos tabulares (calificaciones, faltas).
  * **Explicabilidad (XAI):** Permite usar valores SHAP para decirle al docente *por qué* el alumno está en riesgo (ej. "Bajada de 1.5 puntos en matemáticas").
  * **Entrenamiento:** Rápido y barato en CPU.
* **Despliegue:** Inferencia vía `onnxruntime-node` en Vercel (muy ligero).

## 5. Estrategia de Cuantización

* No aplica para modelos API (SaaS).
* Para el modelo XGBoost local: Exportar a formato binario comprimido.

## Matriz de Decisión

| Tarea | Modelo Candidato | Score Costo (5=Barato) | Score Calidad | Decisión |
| :--- | :--- | :---: | :---: | :--- |
| **Chat General** | GPT-4o | 1 | 5 | ❌ Muy caro para uso masivo. |
| **Chat General** | **GPT-4o-mini** | **5** | **4** | ✅ **Seleccionado**. |
| **Embeddings** | BERT-multilingual | 5 | 3 | ❌ Complejo de mantener. |
| **Embeddings** | **text-embedding-3** | **5** | **5** | ✅ **Seleccionado**. |
| **Predicción** | Red Neuronal (TensorFlow) | 2 | 4 | ❌ Overkill y "caja negra". |
| **Predicción** | **XGBoost** | **5** | **5** | ✅ **Seleccionado**. |
