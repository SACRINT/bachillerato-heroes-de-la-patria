# 📊 Documentación de Métricas y Dimensiones - Sistema de Analítica IA

## Semana 9 - Tarea 12: Documentar métricas y dimensiones disponibles

**Fecha:** Diciembre 2025  
**Versión:** 1.0.0  
**Autor:** AI Architect Agent

---

## 1. Métricas Disponibles

### 1.1 Métricas de Estudiantes

| Métrica | Descripción | Tipo | Fórmula/Fuente |
|---------|-------------|------|----------------|
| `total_students` | Total de estudiantes activos | Contador | `COUNT(*) FROM estudiantes WHERE activo = true` |
| `new_enrollments` | Nuevas inscripciones (período) | Contador | `COUNT(*) WHERE created_at > período` |
| `dropout_rate` | Tasa de deserción | Porcentaje | `(bajas / total_inicial) * 100` |
| `average_age` | Edad promedio | Promedio | `AVG(edad)` |
| `gender_distribution` | Distribución por género | Distribución | `GROUP BY genero` |

### 1.2 Métricas Académicas

| Métrica | Descripción | Tipo | Fórmula/Fuente |
|---------|-------------|------|----------------|
| `average_grade` | Promedio general de calificaciones | Promedio | `AVG(calificacion)` |
| `passing_rate` | Tasa de aprobación | Porcentaje | `(aprobados / total) * 100` |
| `failing_subjects` | Materias con bajo rendimiento | Lista | `WHERE AVG(calificacion) < 7.0` |
| `grade_distribution` | Distribución de calificaciones | Histograma | `GROUP BY rango_calificacion` |
| `subject_performance` | Rendimiento por materia | Tabla | `AVG(calificacion) GROUP BY materia` |

### 1.3 Métricas de Asistencia

| Métrica | Descripción | Tipo | Fórmula/Fuente |
|---------|-------------|------|----------------|
| `attendance_rate` | Tasa de asistencia | Porcentaje | `(presentes / registros_totales) * 100` |
| `chronic_absenteeism` | Ausentismo crónico | Contador | `COUNT WHERE asistencia < 80%` |
| `daily_attendance` | Asistencia diaria | Serie temporal | `GROUP BY fecha` |
| `attendance_by_group` | Asistencia por grupo | Tabla | `GROUP BY grupo` |

### 1.4 Métricas de Uso del Sistema de IA

| Métrica | Descripción | Tipo | Fórmula/Fuente |
|---------|-------------|------|----------------|
| `chatbot_interactions` | Interacciones con chatbot | Contador | `COUNT WHERE event_type = 'chatbot_interaction'` |
| `tutor_sessions` | Sesiones de tutoría IA | Contador | `COUNT WHERE event_type = 'tutor_session'` |
| `risk_predictions` | Predicciones de riesgo ejecutadas | Contador | `COUNT WHERE event_type = 'risk_prediction'` |
| `avg_response_time` | Tiempo promedio de respuesta IA | Milisegundos | `AVG(response_time)` |
| `user_satisfaction` | Satisfacción del usuario (thumbs) | Porcentaje | `(positivos / total_feedback) * 100` |

---

## 2. Dimensiones de Análisis

### 2.1 Dimensiones Temporales

| Dimensión | Valores | Uso |
|-----------|---------|-----|
| `timeframe` | `7d`, `14d`, `30d`, `90d` | Filtrar por período |
| `date` | `YYYY-MM-DD` | Análisis diario |
| `week` | `1-52` | Análisis semanal |
| `month` | `1-12` | Análisis mensual |
| `semester` | `1`, `2` | Análisis semestral |
| `school_year` | `2024-2025` | Análisis anual |

### 2.2 Dimensiones de Segmentación

| Dimensión | Valores | Tabla Fuente |
|-----------|---------|--------------|
| `grupo` | `1A`, `2B`, etc. | `estudiantes.grupo` |
| `turno` | `matutino`, `vespertino` | `estudiantes.turno` |
| `grado` | `1`, `2`, `3` | `estudiantes.grado` |
| `materia` | Lista de materias | `calificaciones.materia` |
| `docente` | Lista de docentes | `teachers.id` |
| `categoria_evento` | Tipos de eventos | `eventos.categoria` |

### 2.3 Dimensiones de Clasificación

| Dimensión | Valores | Descripción |
|-----------|---------|-------------|
| `risk_level` | `low`, `medium`, `high`, `critical` | Nivel de riesgo del estudiante |
| `performance_cluster` | `Excelente`, `Bueno`, `Regular`, `En riesgo`, `Crítico` | Clustering por rendimiento |
| `engagement_level` | `alto`, `medio`, `bajo` | Nivel de participación |
| `alert_severity` | `info`, `warning`, `critical` | Severidad de alertas |

---

## 3. Endpoints de API

### 3.1 Dashboard y Métricas

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ai/analytics/dashboard` | GET | Dashboard ejecutivo completo |
| `/api/ai/analytics/realtime` | GET | Métricas en tiempo real |
| `/api/ai/analytics/metrics?timeframe=30d` | GET | Métricas consolidadas |
| `/api/ai/analytics/kpis` | GET | KPIs principales |

### 3.2 Análisis Avanzado

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ai/analytics/summary` | GET | Resumen semanal (NLG) |
| `/api/ai/analytics/anomalies?category=all` | GET | Detección de anomalías |
| `/api/ai/analytics/clusters` | GET | Clustering de estudiantes |
| `/api/ai/analytics/insights` | GET | Insights automáticos |

### 3.3 Reportes y Alertas

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ai/analytics/report/pdf-data?type=weekly` | GET | Datos para PDF |
| `/api/ai/analytics/alerts` | GET | Alertas activas |
| `/api/ai/analytics/cache/clear` | POST | Limpiar caché |

---

## 4. Formato de Respuesta

### 4.1 Estructura Estándar

```json
{
    "success": true,
    "data": {
        // Datos específicos del endpoint
    },
    "metadata": {
        "generatedAt": "2025-12-19T00:30:00.000Z",
        "timeframe": "30d",
        "cached": false
    }
}
```

### 4.2 Ejemplo: Dashboard

```json
{
    "success": true,
    "data": {
        "kpis": {
            "totalStudents": 290,
            "totalTeachers": 25,
            "averageGrade": "8.45",
            "attendanceRate": "87.5"
        },
        "trends": {
            "attendance": "stable",
            "grades": "improving"
        },
        "alerts": {
            "hasAlerts": false,
            "criticalCount": 0
        },
        "lastUpdated": "2025-12-19T00:30:00.000Z"
    }
}
```

### 4.3 Ejemplo: Clustering

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "name": "Excelente",
                "count": 45,
                "averageGrade": 9.2,
                "attendanceRate": 95,
                "color": "#22c55e"
            }
        ],
        "totalStudents": 290,
        "chartData": {
            "labels": ["Excelente", "Bueno", "Regular", "En riesgo", "Crítico"],
            "datasets": [{
                "data": [45, 120, 85, 30, 10],
                "backgroundColor": ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"]
            }]
        }
    }
}
```

---

## 5. Umbrales y Alertas

### 5.1 Umbrales Configurados

| Métrica | Valor Normal | Warning | Critical |
|---------|--------------|---------|----------|
| Asistencia | ≥ 80% | 70-80% | < 70% |
| Promedio General | ≥ 7.5 | 6.5-7.5 | < 6.5 |
| Deserción | ≤ 5% | 5-10% | > 10% |
| Latencia BD | ≤ 1000ms | 1000-5000ms | > 5000ms |

### 5.2 Frecuencia de Verificación

| Tipo de Alerta | Frecuencia | Notificación |
|----------------|------------|--------------|
| Sistema | Cada 30 segundos | Inmediata |
| Asistencia | Cada hora | Dashboard |
| Académico | Diaria | Email semanal |
| Predicción riesgo | Semanal | Dashboard + Email |

---

## 6. Caché y Rendimiento

### 6.1 Estrategia de Caché

| Endpoint | TTL | Razón |
|----------|-----|-------|
| `/realtime` | 30 segundos | Datos críticos |
| `/dashboard` | 2 minutos | Balance actualidad/performance |
| `/clusters` | 10 minutos | Cálculo intensivo |
| `/metrics` | 5 minutos | Default |
| `/summary` | 30 minutos | NLG pesado |

### 6.2 Invalidación de Caché

- Automática al expirar TTL
- Manual vía `/cache/clear` (admin)
- Al detectar cambios significativos en datos

---

## 7. Privacidad y Seguridad

### 7.1 Datos Protegidos

- ❌ Nombres de estudiantes NO se exponen en clusters
- ❌ IDs reales NO se incluyen en reportes exportados
- ✅ Solo métricas agregadas y anónimas
- ✅ Logging cumple GDPR (sin PII)

### 7.2 Control de Acceso

| Endpoint | Rol Requerido |
|----------|---------------|
| `/dashboard` | `admin`, `teacher` |
| `/clusters` | `admin` |
| `/report/pdf-data` | `admin` |
| `/cache/clear` | `admin` |
| `/alerts` | `admin`, `teacher` |

---

**Documento creado como parte de la Semana 9: Analítica Descriptiva Inteligente**
