# Informe de Cierre - Semana 3: Arquitectura de Modelos

**Estado:** ✅ Completado
**Entregables Generados:** 5 Documentos y 1 Script
**Ubicación:** `/doc/ai_architecture/models/`, `/doc/ai_architecture/poc/`

## Resumen de Tareas Realizadas (14/14)

### 1. Selección de Modelos (`SELECCION_MODELOS.md`)

- [x] **LLM:** Se eligió **GPT-4o-mini** como motor principal por su balance costo/latencia ($0.15/1M tokens).
- [x] **Embeddings:** `text-embedding-3-small` (OpenAI).
- [x] **Modelo Predictivo:** **XGBoost** (Tabular) para predicción de deserción, ejecutándose localmente (inference app) o vía Lambda ligera, evitando deep learning costoso.
- [x] **Comparativa:** Matriz de decisión Open Source vs Comercial completada. Se elige Comercial (API) para Fase 1 por time-to-market.

### 2. Diseño de Chatbot RAG (`DISENO_RAG_CHATBOT.md`)

- [x] **Arquitectura:** Flujo definido (Input -> Moderación -> Retrieval -> Generación).
- [x] **Guardrails:** Sistema de seguridad de triple capa (Blocklist, Tone Check, Hallucination Check).
- [x] **Memoria:** Uso de Redis para ventana de contexto de corto plazo.
- [x] **Prompt Engineering:** Template maestro v1 definido.

### 3. Tutoría Inteligente (`ESPECIFICACION_TUTOR.md`)

- [x] **Metodología:** Enfoque socrático (preguntar, no responder).
- [x] **Alcance:** Piloto en Matemáticas e Historia.
- [x] **Safety:** Protocolo de emergencia para crisis emocionales detectadas en chat.

### 4. Prueba de Concepto (`poc/simple_rag.js`)

- [x] **Implementación:** Script funcional en JS que simula la vectorización y retrieval por similitud de coseno. Demuestra la viabilidad lógica del sistema RAG.

## Hallazgos y Ajustes

1. **Límites de Vercel:** Se reconfirma que correr LLMs grandes (Llama 3 70B) en Vercel es imposible. La estrategia híbrida (Frontend Vercel + Backend API OpenAI) es la única viable.
2. **Costo:** El uso de GPT-4o-mini hace el proyecto extremadamente viable económicamente comparado con servidores GPU dedicados.

## Siguientes Pasos (Semana 4)

* Configuración de Infraestructura Base (AWS/Vercel setup real).
- CI/CD pipelines para ML.
- Documentación Final de Fase 1.

---
**Firma:** AI Architect Agent
