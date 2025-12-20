# Estrategia de Monitoreo y Observabilidad IA

**Objetivo:** Saber qué está pasando con el cerebro de la escuela. ¿Está funcionando? ¿Está gastando mucho dinero? ¿Está insultando alumnos?

## 1. Métricas Clave (KPIs Técnicos)

Estas métricas deben visualizarse en un Dashboard Técnico (Grafana / Vercel Analytics / Custom Admin Panel).

| Métrica | Definición | Umbral de Alerta | Acción Automática |
| :--- | :--- | :--- | :--- |
| **Latencia P95** | Tiempo de respuesta del LLM (95% casos) | > 5 segundos | Notificar a Devs (Posible congestión OpenAI). |
| **Tasa de Errores** | % de peticiones fallidas (500s) | > 2% en 5 min | Switch a modelo Fallback o Circuito Abierto. |
| **Costo por Hora** | Gasto acumulado en API OpenAI | > $2 USD/hora | **Kill Switch**: Detener servicio IA temporalmente. |
| **Feedback Negativo** | % de usuarios dando "Pulgar Abajo" | > 10% diario | Crear ticket para revisión cualitativa de logs. |

## 2. Implementación de Logging

### Librería: `winston` o `pino` (Node.js)

Integrar un logger estructurado que envíe datos a una base de datos de logs (`ai_interaction_logs` en Postgres) o a un servicio externo (Datadog/CloudWatch) si el presupuesto lo permite. Para Fase 1, Postgres es suficiente.

### Ejemplo de Alerta (Pseudocódigo)

```javascript
// Middleware de monitoreo de costos
async function trackCost(req, res, next) {
  const usage = await checkDailyUsage();
  if (usage > DAILY_BUDGET_LIMIT) {
    // Alerta Crítica
    sendSlackNotification("⚠️ PRESUPUESTO IA EXCEDIDO. SERVICIO PAUSADO.");
    return res.status(503).json({ error: "Servicio temporalmente no disponible." });
  }
  next();
}
```

## 3. Auditoría Cualitativa Semanal

La IA no es determinista. El monitoreo numérico no basta.

* **Tarea:** El "AI Product Owner" o un docente designado debe leer aleatoriamente 20 conversaciones a la semana.
* **Objetivo:** Detectar "Soft Failures" (el bot respondió técnicamente bien, pero fue grosero o confuso).
