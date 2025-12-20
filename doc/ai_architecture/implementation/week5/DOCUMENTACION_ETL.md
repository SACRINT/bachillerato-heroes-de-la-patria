# Implementación de Pipeline de Datos (Semana 5)

**Estado:** Implementado (Código Beta)
**Ubicación del Código:** `backend/ai/etl/*`

## Componentes del Pipeline ETL

### 1. Extracción (`extract_grades.js`)

* **Fuente:** PostgreSQL (Tablas Core: `calificaciones`, `estudiantes`).
* **Lógica:** Agrega promedios, conteo de faltas y materias reprobadas por estudiante.
* **Optimizaciones:** Uso de `CASE WHEN` para conteos condicionales en una sola pasada.

### 2. Transformación (`transform_features.js`)

* **Limpieza:** Filtra promedios fuera de rango (0-10) como medida de Calidad de Datos.
* **Ingeniería de Características:**
  * `norm_promedio`: Escalamiento lineal (0 a 1).
  * `norm_faltas`: Escalamiento logarítmico (`log1p`) para mitigar outliers.
  * `heuristic_risk_level`: Etiquetado preliminar (Bajo/Medio/Alto) basado en reglas de negocio duras (ej. 3+ reprobadas).

### 3. Carga (`load_feature_store.js`)

* **Destino:** `feature_store_student_360`.
* **Estrategia:** `Upsert` (ON CONFLICT UPDATE). Garantiza idempotencia; se puede correr múltiples veces sin duplicar datos.
* **Transaccionalidad:** Todo el lote se carga dentro de una transacción `BEGIN...COMMIT`.

## Instrucciones de Uso

### Prerrequisitos

* Tener la tabla `calificaciones` creada (ver script Semana 2).
* Tener la tabla `feature_store_student_360` creada.
* Variable de entorno `DATABASE_URL` configurada.

### Ejecución Manual

```bash
cd backend/ai/etl
node run_pipeline.js
```

### Automatización (Cron)

Configurar en Vercel Cron o `crontab` local:

```cron
0 2 * * * node /path/to/backend/ai/etl/run_pipeline.js >> /var/log/ai_etl.log
```
