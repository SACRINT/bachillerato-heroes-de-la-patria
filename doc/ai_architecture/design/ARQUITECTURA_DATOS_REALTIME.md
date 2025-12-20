# Arquitectura de Datos en Tiempo Real (Redis)

**Objetivo:** Manejar eventos efímeros y caché de alta velocidad para la IA.

## 1. Tecnología Seleccionada: Redis (Upstash)

* **Modelo:** Serverless (Compatible con Vercel).
* **Protocolo:** HTTP/REST (Evita problemas de conexión persistente en Lambda).

## 2. Casos de Uso

### A. Caché Semántico (Semantic Caching)

Para reducir costos de OpenAI.

1. Usuario pregunta: "¿Cuándo empiezan los exámenes?"
2. Generar embedding de la pregunta.
3. Consultar Redis: ¿Existe un vector muy similar (similitud > 0.95) almacenado en las últimas 24h?
4. **Hit:** Devolver respuesta guardada (Latencia: 50ms, Costo: $0).
5. **Miss:** Llamar a OpenAI -> Guardar par (PreguntaVector, Respuesta) en Redis con TTL 24h.

### B. Rate Limiting Inteligente

Evitar abuso del chatbot.

* **Key:** `ratelimit:chat:{user_id}`
* **Valor:** Contador (Integer).
* **Regla:** Máximo 50 mensajes / hora.
* **Excepción:** Si el usuario es 'Profesor', límite = 500.

### C. Cola de Tareas (Queue) para Generación de Documentos

Si un alumno pide "Resumen de mis calificaciones en PDF":

1. API pone tarea en Redis List: `queue:pdf_generation`.
2. Worker (Cron/External Service) consume la tarea.
3. Websocket/Notifications avisa al usuario cuando está listo.

## 3. Esquema de Claves (Key Schema)

| Patrón Clave | Tipo | TTL | Descripción |
| :--- | :--- | :--- | :--- |
| `cache:embedding:{hash}` | String | 48h | Respuesta de LLM cacheada por similitud semántica. |
| `session:{session_id}` | Hash | 30m | Historial de chat en curso (Short-term memory). |
| `user:{id}:context` | JSON | 7d | Preferencias de aprendizaje del usuario. |
| `stats:daily:tokens` | Counter | 1d | Conteo de tokens consumidos hoy (alerta de presupuesto). |

## 4. Estrategia de Eventos (Pub/Sub)

* Canal `events:grade_update`: Cuando se actualiza una calificación, notificar al servicio de "Alerta Temprana" para recalcular riesgo inmediatamente.
