# Diseño Técnico: Chatbot RAG y Guardrails

## 1. Arquitectura RAG (Recuperación Aumentada)

El chatbot no "memoriza" el reglamento, lo "lee" en tiempo real.

### Flujo de Inferencia

1. **Input Usuario:** "¿Me pueden expulsar por tener el pelo largo?"
2. **Moderación (Guardrail In):** Verificar que no es una pregunta tóxica/ilegal.
3. **Reformulación (Query Expansion):**
    * LLM transforma la pregunta a: _"Reglamento escolar sobre apariencia personal y corte de cabello sanciones"._
4. **Retrieval (Pinecone):**
    * Buscar top-3 fragmentos más similares en el namespace `normativa`.
    * _Resultado:_ "Artículo 45: La apariencia... (Score: 0.89)".
5. **Generación (Synthesis):**
    * Prompt: "Responde al alumno basándote SOLO en el contexto proporcionado. Cita el artículo."
6. **Guardrail Out:** Verificar que la respuesta es amable y no alucina información externa.

## 2. Sistema de Guardrails (Seguridad)

Utilizaremos una capa lógica antes y después del LLM.

### A. Tópicos Prohibidos (Blocklist)

Si el usuario pregunta sobre:

* Cómo hackear la escuela.
* Fabricación de armas/drogas.
* Contenido sexual explícito.
* Insultos a docentes.

**Acción:** Respuesta predefinida: _"Lo siento, no puedo ayudarte con esa consulta ya que viola las normas de uso de la plataforma."_

### B. Detectores de Tono

El bot debe mantener un tono **Institucional pero Cercano**.

* Prohibido: Jerga vulgar, sarcasmo, coqueteo.
* Instrucción de Sistema: _"Eres un asistente administrativo útil y profesional del BGE Héroes de la Patria."_

### C. Alucinación (Hallucination Check)

* Regla: Si el `retrieval_score` de Pinecone es menor a 0.6 (bajo match), el Bot **NO debe inventar**.
* Acción: Responder _"No tengo información específica sobre eso en mis documentos oficiales. Por favor contacta a Control Escolar."_

## 3. Manejo de Memoria (Conversación)

* **Buffer Window:** Mantener solo los últimos 4 pares de mensajes (Usuario/Bot) para ahorrar tokens y evitar confusiones con contextos viejos.
* **Almacenamiento:** Redis (Hash: `session:{id}`, TTL: 30 min).

## 4. Prompt Template Maestro (v1)

```text
SYSTEM: Actúa como el Asistente Virtual Oficial del Bachillerato "Héroes de la Patria".
Tu tono es amable, profesional y conciso.
Responde SIEMPRE en Español de México.

CONTEXTO RECUPERADO DE LA BASE DE CONOCIMIENTO:
"""
{context}
"""

HISTORIAL DE CHAT:
{chat_history}

PREGUNTA DEL USUARIO:
{question}

INSTRUCCIONES:
1. Responde usando ÚNICAMENTE el contexto proporcionado.
2. Si la respuesta no está en el contexto, di que no sabes y sugiere ir a Dirección.
3. Si citas un reglamento, menciona el Artículo.
4. Sé breve (máximo 3 párrafos).
```
