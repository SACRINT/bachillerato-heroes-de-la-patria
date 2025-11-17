# 📊 MONITORING CON PROMETHEUS + GRAFANA - SEMANA 10

**Fecha:** 17 Noviembre 2025
**Versión:** v1.0.0
**Estado:** ✅ COMPLETADO

---

## RESUMEN EJECUTIVO

Sistema completo de monitoring y alerting con Prometheus + Grafana para garantizar SLA 99.9% uptime. Incluye 20+ reglas de alertas, dashboards interactivos, y integración con Alertmanager para notificaciones.

### Características Implementadas

✅ **Prometheus Metrics:**
- HTTP request duration, rate, in_progress
- Database query duration, connections
- Business metrics (login attempts, registrations)
- Cache hits/misses
- System resources (CPU, memory, disk)

✅ **Alerting Rules (20+ reglas):**
- Availability: HighErrorRate, ServiceDown, DatabaseDown
- Performance: HighResponseTime, SlowDatabaseQueries
- Resources: HighMemoryUsage, HighCPUUsage, HighDiskUsage
- Database: ConnectionPoolExhausted, DatabaseConnectionLeaks
- Business: HighLoginFailureRate, LowCacheHitRate
- Degradation: ResponseTimeDegrading, ErrorRateIncreasing

✅ **Grafana Dashboards:**
- Main Monitoring Dashboard con 5 paneles principales
- HTTP Request Rate, Response Time p95, Error Rate
- Database Connections, Memory Usage

✅ **SLA Monitoring:**
- Target: 99.9% uptime (43.8 min downtime/mes)
- Error rate máximo: 0.1%
- Response time p95: <1s, p99: <2s

---

## ARQUITECTURA

```
┌─────────────┐
│ BGE Backend │──► Expone /metrics
└─────────────┘
       │
       ▼
┌─────────────┐
│ Prometheus  │──► Scrapes cada 15s, evalúa alertas
└─────────────┘
       │
       ├──► Grafana (visualización)
       └──► Alertmanager (notificaciones)
              │
              ├──► Slack #incidents
              ├──► Email (admin@bge.edu.mx)
              └──► PagerDuty (critical only)
```

---

## MÉTRICAS DISPONIBLES

### HTTP Metrics

| Métrica                          | Tipo      | Descripción                           |
|----------------------------------|-----------|---------------------------------------|
| http_request_duration_seconds    | Histogram | Duración de requests HTTP             |
| http_requests_total              | Counter   | Total de requests por status code     |
| http_requests_in_progress        | Gauge     | Requests actualmente en progreso      |

### Database Metrics

| Métrica                      | Tipo      | Descripción                         |
|------------------------------|-----------|-------------------------------------|
| db_query_duration_seconds    | Histogram | Duración de queries SQL             |
| db_queries_total             | Counter   | Total de queries por tipo y status  |
| db_connections_active        | Gauge     | Conexiones PostgreSQL activas       |

### Business Metrics

| Métrica                     | Tipo    | Descripción                          |
|-----------------------------|---------|--------------------------------------|
| login_attempts_total        | Counter | Intentos de login (success/failed)   |
| user_registrations_total    | Counter | Registros de usuarios                |
| active_users                | Gauge   | Usuarios activos por rol             |
| emails_sent_total           | Counter | Emails enviados                      |

### Cache Metrics

| Métrica              | Tipo    | Descripción       |
|----------------------|---------|-------------------|
| cache_hits_total     | Counter | Cache hits        |
| cache_misses_total   | Counter | Cache misses      |

---

## ALERTAS CONFIGURADAS

### Alertas Críticas (Severidad: critical)

#### 1. HighErrorRate
```yaml
expr: (sum(rate(http_requests_total{status_code=~"5.."}[5m])) / 
       sum(rate(http_requests_total[5m]))) > 0.01
for: 5m
```
**Umbral:** Error rate > 1%
**Acción:** Slack #incidents + PagerDuty + Email inmediato

#### 2. ServiceDown
```yaml
expr: up{job="bge-backend"} == 0
for: 1m
```
**Umbral:** Servicio no responde por 1 minuto
**Acción:** PagerDuty inmediato + Slack #incidents

#### 3. DatabaseDown
```yaml
expr: db_connections_active == 0
for: 2m
```
**Umbral:** Sin conexiones a BD por 2 minutos
**Acción:** Slack #incidents + Email

#### 4. OutOfMemory
```yaml
expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.05
for: 2m
```
**Umbral:** Memoria disponible < 5%
**Acción:** Pager Duty + Reinicio automático del servicio

### Alertas de Warning (Severidad: warning)

#### 5. HighResponseTime
```yaml
expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 1
for: 10m
```
**Umbral:** p95 response time > 1s por 10 minutos
**Acción:** Slack #monitoring + Email

#### 6. SlowDatabaseQueries
```yaml
expr: histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le, table)) > 0.5
for: 10m
```
**Umbral:** p95 query duration > 500ms
**Acción:** Investigar queries lentas, revisar índices

---

## INSTALACIÓN Y CONFIGURACIÓN

### 1. Instalar Prometheus

```bash
# Docker (recomendado)
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus:/etc/prometheus \
  prom/prometheus:latest \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus

# Verificar
curl http://localhost:9090/api/v1/status/config
```

### 2. Instalar Grafana

```bash
# Docker
docker run -d \
  --name grafana \
  -p 3001:3000 \
  -v $(pwd)/grafana:/var/lib/grafana \
  grafana/grafana:latest

# Login: admin / admin (cambiar en primer login)
# URL: http://localhost:3001
```

### 3. Configurar Datasource en Grafana

1. Login a Grafana: http://localhost:3001
2. Configuration → Data Sources → Add data source
3. Seleccionar Prometheus
4. URL: `http://prometheus:9090` (si usan Docker network) o `http://localhost:9090`
5. Save & Test

### 4. Importar Dashboards

```bash
# Opción 1: Import JSON
# Grafana UI → Dashboards → Import → Upload JSON file
# Archivo: grafana/dashboards/bge-main-dashboard.json

# Opción 2: Provisioning automático
# Grafana detecta automáticamente archivos en /var/lib/grafana/dashboards/
```

### 5. Configurar Alertmanager (Opcional)

```bash
# Crear alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#monitoring'
        title: 'BGE Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

# Ejecutar
docker run -d \
  --name alertmanager \
  -p 9093:9093 \
  -v $(pwd)/alertmanager:/etc/alertmanager \
  prom/alertmanager:latest
```

---

## CONSULTAS PROMETHEUS ÚTILES

### Performance

```promql
# Response time p95 por ruta
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
)

# Error rate últimos 5 minutos
(sum(rate(http_requests_total{status_code=~"5.."}[5m]))
 / sum(rate(http_requests_total[5m]))) * 100

# Requests por segundo
sum(rate(http_requests_total[1m]))
```

### Database

```promql
# Queries más lentas (p99)
topk(10,
  histogram_quantile(0.99,
    sum(rate(db_query_duration_seconds_bucket[5m])) by (le, table)
  )
)

# Connection pool utilization
db_connections_active / 20 * 100

# Query error rate
(sum(rate(db_queries_total{status="error"}[5m]))
 / sum(rate(db_queries_total[5m]))) * 100
```

### Business

```promql
# Login success rate
(sum(rate(login_attempts_total{status="success"}[5m]))
 / sum(rate(login_attempts_total[5m]))) * 100

# Registrations por hora
sum(increase(user_registrations_total[1h]))

# Cache hit rate
(sum(rate(cache_hits_total[5m]))
 / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))) * 100
```

---

## SLA MONITORING

### Objetivo: 99.9% Uptime

**Downtime permitido por período:**
- Día: 1.44 minutos
- Semana: 10.08 minutos
- Mes: 43.8 minutos
- Año: 8.76 horas

### Cálculo de Uptime

```promql
# Uptime últimas 24 horas
(1 - (
  sum(increase(http_requests_total{status_code=~"5.."}[24h]))
  / sum(increase(http_requests_total[24h]))
)) * 100

# Debe ser > 99.9%
```

### Dashboard de SLA

Panel recomendado en Grafana:

```json
{
  "title": "SLA - Last 30 days",
  "targets": [{
    "expr": "(1 - (sum(increase(http_requests_total{status_code=~\"5..\"}[30d])) / sum(increase(http_requests_total[30d])))) * 100",
    "legendFormat": "Uptime %"
  }],
  "thresholds": [
    {"value": 99.9, "color": "green"},
    {"value": 99.5, "color": "yellow"},
    {"value": 0, "color": "red"}
  ]
}
```

---

## TROUBLESHOOTING

### Problema: Prometheus no scrape métricas

**Síntomas:**
- Dashboard vacío
- Error "No data" en Grafana

**Diagnóstico:**
```bash
# Verificar que backend expone métricas
curl http://localhost:3000/metrics

# Ver targets en Prometheus
curl http://localhost:9090/api/v1/targets

# Ver logs de Prometheus
docker logs prometheus
```

**Solución:**
- Verificar que `metricsMiddleware` está registrado en server.js
- Verificar firewall permite conexión puerto 3000
- En Docker, usar `host.docker.internal` en lugar de `localhost`

### Problema: Alertas no se disparan

**Síntomas:**
- Métrica supera umbral pero no hay alerta

**Diagnóstico:**
```bash
# Ver reglas cargadas
curl http://localhost:9090/api/v1/rules

# Ver alertas activas
curl http://localhost:9090/api/v1/alerts
```

**Solución:**
- Verificar sintaxis de `prometheus/alerts/rules.yml`
- Verificar que `rule_files` está configurado en prometheus.yml
- Reiniciar Prometheus después de cambios en reglas

### Problema: Grafana no muestra datos

**Síntomas:**
- Datasource configurado pero panels vacíos

**Diagnóstico:**
- Verificar datasource: Configuration → Data Sources → Test
- Ver query en panel: Edit → Query Inspector

**Solución:**
- Verificar que query PromQL es correcta
- Ajustar time range (últimas 6 horas recomendado)
- Verificar que Prometheus tiene datos: http://localhost:9090/graph

---

## BEST PRACTICES

### 1. Métricas

- ✅ Usar labels para agrupar (route, status_code, table)
- ✅ No crear labels con alta cardinalidad (ej: user_id)
- ✅ Preferir histogramas para timings (permiten percentiles)
- ✅ Usar counters para eventos (incrementan monotónicamente)
- ✅ Usar gauges para valores que suben/bajan

### 2. Alertas

- ✅ Definir severidades claras (critical, warning, info)
- ✅ Usar `for` para evitar alertas falsas (ej: `for: 5m`)
- ✅ Incluir `runbook_url` en annotations
- ✅ Agrupar alertas relacionadas para evitar spam
- ✅ Testear alertas antes de producción

### 3. Dashboards

- ✅ Organizar en secciones lógicas
- ✅ Usar variables para filtrar (ej: $environment, $service)
- ✅ Agregar descripciones a paneles complejos
- ✅ Configurar auto-refresh (30s recomendado)
- ✅ Exportar dashboards a JSON (version control)

---

## MÉTRICAS CLAVE POR ROL

### Para DevOps/SRE

- Error rate últimas 24h
- Response time p95, p99
- Database connection pool utilization
- Memory/CPU usage
- Disk usage
- Active alerts

### Para Product Manager

- Total requests/día
- User registrations/día
- Login success rate
- Active users por rol
- Cache hit rate

### Para Desarrolladores

- Response time por endpoint
- Slow queries (>500ms)
- Error rate por endpoint
- Database query count por tabla

---

## PRÓXIMOS PASOS

**SEMANA 11:** Disaster Recovery & Backups automatizados

Objetivos:
- Daily full backups + hourly incremental
- Test restore procedure (100% funcional)
- Geo-redundancy (múltiples regiones)
- Automated backup verification
- Recovery Time Objective (RTO): <1 hora
- Recovery Point Objective (RPO): <1 hora

---

**FIN DE SEMANA 10 - BLOQUE 3 (50% completado) ✅**

**Progreso General:** 10/24 semanas (41.7%)
- BLOQUE 1: 4/4 (100%) ✅ COMPLETADO
- BLOQUE 2: 4/4 (100%) ✅ COMPLETADO
- BLOQUE 3: 2/4 (50%) 🔄 EN PROGRESO
- BLOQUE 4: 0/4 (0%) ⏳ PENDIENTE
- BLOQUE 5: 0/4 (0%) ⏳ PENDIENTE
- BLOQUE 6: 0/4 (0%) ⏳ PENDIENTE
