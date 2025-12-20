# Documentación Técnica: Tutor Inteligente (Semana 8)

**Estado:** Backend Implementado / Frontend Integración Pendiente
**Ubicación:** `backend/ai/tutor/`

## Arquitectura del Tutor Socrático

### 1. Pedagogía AI

El tutor no usa el mismo prompt que el Chatbot administrativo.

* **Prompt de Sistema:** `tutor_prompts.js`
* **Estrategia:** "Chain of Thought" guiado. Rompe problemas complejos en pasos simples.
* **Restricciones:** Prohibido resolver tareas directamente.

### 2. Backend Service (`tutor_service.js`)

* **Modelo:** GPT-4o-mini (Temperatura 0.5 para mayor flexibilidad creativa que el RAG).
* **Input:** Mensaje, Historial, Materia ('matematicas', 'historia').
* **Output:** Respuesta de texto + Metadatos pedagógicos.

### 3. Integración en Frontend (Guía)

Para activar el modo tutor en el chat existente:

1. Agregar un toggle "Modo Tutor" en la UI.
2. Cuando esté activo, apuntar las peticiones a `/api/ai/tutor` en lugar de `/api/ai/chat`.
3. Incluir soporte para renderizado de LaTeX (MathJax/KaTeX) en la ventana de chat.

## Integración Dashboard de Riesgo (`admin-risk-dashboard.js`)

Script cliente para visualizar las alertas tempranas generadas en la Semana 7.

* Conecta con `/api/ai/predict/dropout`.
* Renderiza gráfico de dona (distribución de riesgo) y tabla de alumnos críticos.
