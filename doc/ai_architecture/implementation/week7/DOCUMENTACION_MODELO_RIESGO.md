# Documentación Técnica: Sistema Predictivo de Deserción Escolar (Semana 7)

**Fecha:** 18 Dic 2025
**Estado:** Modelo V0 (Heurístico) Implementado
**Ubicación:** `backend/ai/models/dropout_prediction/`

## 1. Arquitectura del Modelo

### Modelo V0 (Heurístico)

Debido a la falta de histórico etiquetado ("Cold Start"), iniciamos con un Sistema Experto basado en reglas ponderadas.

* **Entradas (Features):**
  * `promedio_actual` (Peso: 0.45)
  * `total_faltas` (Peso: 0.35)
  * `materias_reprobadas` (Peso: 0.20)
* **Lógica:** `Score = (InvNorm(Promedio) * 0.45) + (Norm(Faltas) * 0.35) + (Norm(Reprobadas) * 0.20)`
* **Salida:** Probabilidad (0-1) y Nivel de Riesgo (CRITICAL, HIGH, MEDIUM, LOW).

### Modelo V1 (Futuro - XGBoost)

Se ha dejado la estructura lista (`train_model_stub.js`) para entrenar un modelo Gradient Boosting una vez se recolecten >1000 datapoints etiquetados.

## 2. API de Inferencia

### Endpoint

`POST /api/ai/predict/dropout`

### Request Body

```json
{
  "studentId": 123
}
```

### Response

```json
{
  "student_id": 123,
  "probability": 0.85,
  "risk_level": "CRITICAL",
  "risk_factors": ["Bajo Rendimiento Académico", "Materias Reprobadas"],
  "model_version": "v0.1_heuristic",
  "generated_at": "2025-12-18T00:00:00.000Z"
}
```

## 3. Integración con ETL

El servicio de inferencia `inference_service.js` consulta el Feature Store (`feature_store_student_360`) poblado por el ETL de la Semana 5.
**Prerrequisito:** El ETL debe correr antes de solicitar predicciones.

## 4. Próximos Pasos (Validación)

* Ejecutar el pipeline ETL completo con datos reales.
* Comparar las alertas del Modelo V0 con la intuición de los tutores reales.
