# Diseño de ETL y Estándares de Calidad de Datos

## 1. Arquitectura ETL (Extract, Transform, Load)

Dado que operamos en un entorno **Serverless (Vercel)**, el ETL no puede ser un proceso de larga duración. Se opta por una arquitectura de **Micro-Batching** disparada por eventos o Cron Jobs.

### Fuentes de Datos -> Destino (PostgreSQL Analytics)

| Fuente | Frecuencia | Método de Extracción | Transformación | Destino |
| :--- | :--- | :--- | :--- | :--- |
| **Logs de App** | Tiempo Real (Async) | Webhook / Middleware | Sanitización PII | `ai_interaction_logs` |
| **Calificaciones** | Diario (Noche) | Cron Job (`api/cron/sync-grades`) | Cálculo de promedios | `feature_store_student_360` |
| **Documentos** | Bajo Demanda | Upload API | PDF Parsing + Chunking | `Pinecone` (Vectores) |

### Flujo Detallado: Actualización de Feature Store

1. **Trigger:** `03:00 AM UTC` vía Vercel Cron.
2. **Extract:** Query a tablas `calificaciones` y `asistencia` (últimos cambios).
3. **Transform:**
    * Calcular promedio móvil de los últimos 3 periodos.
    * Calcular tendencia (¿Subió o bajó respecto al mes anterior?).
    * Detectar outliers (ej. bajada brusca de 9.0 a 5.0).
4. **Load:** `UPSERT` en tabla `feature_store_student_360`.

## 2. Puntos de Control de Calidad (Data Quality Gates)

Antes de que cualquier dato alimente a los modelos de IA, debe pasar por las siguientes validaciones automáticas (Zod Schemas / SQL Constraints).

### Gate 1: Integridad Estructural (Ingesta)

* **Regla:** No permitir `null` en campos críticos (`estudiante_id`, `fecha`).
* **Acción:** Registro en `etl_errors_log` y descarte del registro.

### Gate 2: Rango y Lógica (Transformación)

* **Reglas:**
  * `calificacion` debe estar entre 0 y 10.
  * `edad` entre 12 y 25 años (rango esperado bachillerato).
  * `asistencia_porcentaje` entre 0% y 100%.
* **Acción:** Si falla > 5% del dataset, **abortar pipeline** y enviar alerta crítica a Admin.

### Gate 3: Unicidad y Duplicados

* **Regla:** Un estudiante no puede tener dos promedios para el mismo periodo.
* **Acción:** Deduplicación basada en `updated_at` (quedarse con el último).

## 3. Orquestación

### Selección: Vercel Cron + GitHub Actions

* **Vercel Cron:** Para tareas ligeras (< 60s) como actualizar contadores diarios.
* **GitHub Actions (Scheduled):** Para tareas pesadas de mantenimiento semanal (ej. re-entrenamiento o re-indexado masivo de vectores) que excedan el timeout de Vercel.

**Ejemplo Vercel Cron (`vercel.json`):**

```json
{
  "crons": [
    {
      "path": "/api/cron/update-features",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/detect-drift",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

## 4. Manejo de Errores

* **Dead Letter Queue (DLQ):** Si un chunks de documento falla al procesarse (ej. PDF corrupto), se mueve a una tabla `failed_jobs` para revisión manual, sin detener el resto de la ingesta.
