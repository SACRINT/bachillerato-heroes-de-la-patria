# Auditoría de Infraestructura y Datos (Semana 1)

**Fecha:** 17 de Diciembre de 2025
**Responsable:** AI Architect Agent

## 1. Estado Actual de la Infraestructura

* **Hosting:** Vercel (Serverless Functions).
* **Backend:** Node.js (Express) adaptado a Serverless (`api/index.js`).
* **Base de Datos:** PostgreSQL (Neon/PlanetScale indicados en scripts).
* **Frontend:** HTML5/JS Vanilla + Bootstrap.
* **Gestión de Dependencias:** npm (limitado en Vercel por tamaño de bundle).

### Hallazgos Críticos para IA

* ⚠️ **Limitación de Tiempo de Ejecución:** Las funciones serverless de Vercel tienen un timeout (10-60s). El entrenamiento de modelos no puede correr aquí. La inferencia debe ser rápida (API externa).
* ⚠️ **Limitación de Tamaño:** El bundle no debe exceder 250MB. Librerías pesadas de Python (Pandas, TensorFlow) o Node (Puppeteer) son problemáticas.
* ✅ **Conectividad:** Node.js conecta bien con APIs externas (OpenAI, Anthropic).

## 2. Evaluación de Datos (Data Readiness)

Basado en `master-database-setup.sql`:

| Entidad | Estado | Comentarios |
| :--- | :--- | :--- |
| **Estudiantes** | ✅ Existente | Tabla `estudiantes` vinculada a `usuarios`. Contiene matrícula y grupo. |
| **Calificaciones** | ❌ Ausente/Parcial | Se observó un `DROP TABLE calificaciones` pero no su `CREATE`. **Crítico:** No se pueden entrenar modelos predictivos sin historial académico. |
| **Asistencia** | ❌ Ausente | No se encontraron tablas de asistencia. |
| **Material Didáctico** | ⚠️ Parcial | Tablas `library_documents` mencionadas en drops, pero sistema de gestión de archivos parece básico. |
| **Interacciones** | ❌ Ausente | No hay logs de comportamiento de usuario (clics, tiempo en página) para recomendaciones. |

## 3. Recomendaciones Inmediatas

1. **Migrar Calificaciones:** Urge implementar y poblar la tabla `calificaciones` para el módulo de "Alerta Temprana".
2. **Externalizar IA:** Debido a las resticciones de Vercel, **toda la carga de IA debe ser vía API** (OpenAI, Hugging Face Inference API) o nubes separadas (AWS Lambda/Google Run para tareas pesadas).
3. **Vector Store:** Usar una base de datos vectorial gestionada (Pinecone o Weaviate Cloud) para no sobrecargar Postgres.
