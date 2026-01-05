# 📚 Documentación del Modelo de Predicción de Deserción

## Semana 13 - Sistema Early Warning

**Fecha:** Enero 2026  
**Versión:** 1.0.0  
**Autor:** AI Architect Agent

---

## 1. Descripción General

El Sistema Early Warning para Predicción de Deserción Escolar es un modelo predictivo que identifica estudiantes en riesgo de abandonar sus estudios antes de que esto ocurra, permitiendo intervenciones preventivas.

---

## 2. Metodología

### 2.1 Fuentes de Datos

| Fuente | Variables | Frecuencia |
|--------|-----------|------------|
| Sistema de Asistencia | Tasa de asistencia, patrones de ausentismo | Diaria |
| Calificaciones | Promedios, tendencias, materias reprobadas | Por periodo |
| Disciplina | Incidentes conductuales, suspensiones | Por evento |
| Vinculación Familiar | Reuniones con padres, comunicaciones | Por evento |
| Actividades | Participación extracurricular | Mensual |

### 2.2 Variables del Modelo (Features)

| Variable | Peso | Impacto | Descripción |
|----------|------|---------|-------------|
| `attendance_rate` | -0.35 | ⬆️ Riesgo si baja | Porcentaje de asistencia (0-1) |
| `grade_trend` | -0.25 | ⬆️ Riesgo si negativa | Tendencia de calificaciones |
| `failed_subjects` | +0.20 | ⬆️ Riesgo si alta | Materias reprobadas normalizadas |
| `behavioral_incidents` | +0.15 | ⬆️ Riesgo si alta | Incidentes de conducta |
| `socioeconomic_risk` | +0.10 | ⬆️ Riesgo si alta | Factor socioeconómico |
| `parent_engagement` | -0.08 | ⬆️ Riesgo si baja | Participación de padres |
| `extracurricular` | -0.07 | ⬆️ Riesgo si baja | Actividades extracurriculares |

### 2.3 Algoritmo

```
riskScore = 0.5 (base)
+ Σ(peso_i × valor_normalizado_i)

Normalización: [0, 1] para todas las variables
```

---

## 3. Clasificación de Riesgo

| Nivel | Score | Acción Sugerida |
|-------|-------|-----------------|
| 🟢 **Bajo** | < 0.30 | Monitoreo estándar |
| 🟡 **Medio** | 0.30 - 0.55 | Atención preventiva |
| 🟠 **Alto** | 0.55 - 0.75 | Intervención activa |
| 🔴 **Crítico** | > 0.75 | Intervención urgente |

---

## 4. Explicabilidad (SHAP-like)

El sistema proporciona explicaciones transparentes de cada predicción:

```json
{
  "explanation": [
    {
      "feature": "Tasa de Asistencia",
      "value": 0.65,
      "weight": -0.35,
      "contribution": 0.1225,
      "impact": "increases_risk"
    }
  ],
  "narrative": "El estudiante presenta un nivel de riesgo alto. El factor más influyente es 'Tasa de Asistencia' que incrementa el riesgo."
}
```

---

## 5. Intervenciones Sugeridas

### Por Factor de Riesgo

| Factor | Tipo Intervención | Acciones Prioritarias |
|--------|-------------------|----------------------|
| Asistencia Baja | Seguimiento | Contacto con padres, tutor asignado |
| Notas en Declive | Apoyo Académico | Tutorías, mentor estudiantil |
| Materias Reprobadas | Recuperación | Exámenes extras, asesorías |
| Conducta | Intervención | Orientación, plan de mejora |
| Socioeconómico | Apoyo Social | Becas, materiales, transporte |
| Padres Ausentes | Vinculación | Visita domiciliaria, comunicación |
| Sin Actividades | Integración | Clubes, deportes, eventos |

---

## 6. Endpoints de API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ai/dropout/health` | Estado del servicio |
| GET | `/api/ai/dropout/eda` | Análisis Exploratorio |
| GET | `/api/ai/dropout/predict/:studentId` | Predicción individual |
| POST | `/api/ai/dropout/predict/batch` | Predicción masiva |
| GET | `/api/ai/dropout/explain/:studentId` | Explicabilidad |
| GET | `/api/ai/dropout/features/:studentId` | Características |
| GET | `/api/ai/dropout/interventions/:studentId` | Intervenciones |
| GET | `/api/ai/dropout/dashboard/:teacherId` | Dashboard docente |
| GET | `/api/ai/dropout/monitoring` | Monitoreo |
| POST | `/api/ai/dropout/shadow-mode` | Modo sombra |
| GET/POST | `/api/ai/dropout/thresholds` | Umbrales |

---

## 7. Modo Sombra

El sistema inicia en **modo sombra** (sin alertas visibles):

- Las predicciones se calculan y almacenan
- No se generan alertas a docentes
- Se compara predicciones vs. realidad
- Permite ajustar el modelo antes de activarlo

### Activación

```http
POST /api/ai/dropout/shadow-mode
{"enabled": false}
```

---

## 8. Sesgos y Limitaciones

### 8.1 Sesgos Potenciales Identificados

| Sesgo | Descripción | Mitigación |
|-------|-------------|------------|
| Socioeconómico | Estigmatización por nivel económico | Usar solo como factor complementario |
| Histórico | Datos pasados pueden no reflejar intervenciones | Monitoreo continuo post-intervención |
| Género | Posibles patrones diferenciados | Auditoría de equidad periódica |

### 8.2 Limitaciones

1. El modelo no considera factores externos (salud, migración)
2. Requiere mínimo 3 meses de datos para predicciones confiables
3. No sustituye el juicio profesional del orientador

---

## 9. Monitoreo y Validación

### 9.1 Métricas de Evaluación

- **Precision:** % de alertas que son deserción real
- **Recall:** % de desertores detectados a tiempo
- **F1-Score:** Balance precision/recall

### 9.2 Validación Cruzada

- K-Fold (k=5) implementado
- Actualización trimestral de pesos

---

## 10. Roadmap

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1.0 | Modelo base + modo sombra | ✅ Completado |
| 1.1 | Dashboard docentes | ✅ Completado |
| 1.2 | Intervenciones automáticas | ✅ Completado |
| 2.0 | ML real (XGBoost) | 🔄 Próximo |
| 2.1 | SHAP values reales | 📅 Planeado |
| 3.0 | Alertas en tiempo real | 📅 Planeado |

---

**Documento actualizado:** 4 de Enero de 2026
