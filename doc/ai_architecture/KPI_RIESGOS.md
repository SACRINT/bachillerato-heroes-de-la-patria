# KPIs y Matriz de Riesgos (Semana 1)

## 1. KPIs de Éxito del Proyecto IA

### Módulo: Chatbot Académico & Tutoría

* **Tasa de Resolución (Resolution Rate):** % de consultas resueltas sin intervención humana. **Meta: >80%**.
* **Precisión de Respuesta (Accuracy):** % de respuestas correctas (validado por humanos en muestra aleatoria). **Meta: >95%**.
* **Satisfacción del Estudiante (CSAT):** Puntuación promedio (1-5 estrellas) post-interacción. **Meta: >4.5**.

### Módulo: Alerta Temprana (Retención)

* **Recall (Sensibilidad):** % de estudiantes en riesgo real detectados correctamente por el modelo. **Meta: >90%** (Priorizar no perder a nadie).
* **Reducción de Deserción:** Comparativa anual de bajas escolares. **Meta: -15%**.

### Módulo: Administrativo

* **Tiempo Ahorrado:** Horas/hombre reducidas en atención a dudas frecuentes. **Meta: -20 horas/semana**.

---

## 2. Matriz de Riesgos Técnicos (GenAI)

| Riesgo | Probabilidad | Impacto | Mitigación |
| :--- | :---: | :---: | :--- |
| **Alucinaciones:** El chatbot inventa fechas de exámenes o reglamentos. | Alta | Crítico | Implementar **RAG (Retrieval-Augmented Generation)** estricto. Si no está en el contexto, el bot no responde. |
| **Inyección de Prompt:** Alumnos intentan manipular al bot para que diga groserías o haga tareas. | Media | Alto | Capa de seguridad intermedia (Guardrails), validación de input/output, System Prompt robusto. |
| **Sesgo Algorítmico:** El modelo predictivo marca a ciertos grupos como "riesgoso" injustamente. | Media | Alto | Auditoría de datos de entrenamiento para eliminar sesgos demográficos. |
| **Costos de API:** Uso excesivo dispara la factura de OpenAI. | Alta | Medio | Implementar Caching semántico, Rate Limiting por alumno, usar modelos más pequeños (GPT-3.5/Haiku) para tareas simples. |
| **Privacidad:** Fuga de datos personales de alumnos a la API pública. | Baja | Crítico | **Anonimización** de datos (Paso de PII Scrubbing) antes de enviar a la API. Contratos Enterprise si es posible. |
