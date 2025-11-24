# 🚀 Load Testing Suite - BGE v6.0.0 (SEMANA 30)

## Descripción

Suite completa de pruebas de carga y estrés para BGE usando **Artillery**, la herramienta más popular de load testing en Node.js.

### Propósito

- **Load Testing:** Simular 1000 usuarios concurrentes en 12 minutos
- **Stress Testing:** Encontrar el límite del sistema con hasta 2000+ usuarios
- **Análisis de Bottlenecks:** Identificar endpoints lentos y cuellos de botella
- **Validación de SLA:** Asegurar <200ms p95 latency y <0.5% error rate

---

## 📋 Requisitos

1. **Node.js** 14+ (verificar con `node --version`)
2. **npm** 6+ (verificar con `npm --version`)
3. **Artillery** instalado globalmente (ya instalado con `npm install -g artillery`)
4. **Servidor BGE** corriendo en `http://localhost:3000`
5. **Base de datos Neon** activa y conectada

### Verificar Instalación de Artillery

```bash
artillery -V
# Debe mostrar algo como: artillery/2.x.x
```

---

## 📁 Estructura de Archivos

```
backend/load-tests/
├── README.md                          # Este archivo
├── artillery-load-test.yml            # Configuración Load Test (1000 usuarios)
├── artillery-stress-test.yml          # Configuración Stress Test (2000 usuarios)
├── run-load-tests.js                  # Script helper para ejecutar tests
└── reports/                           # Directorio de reportes (se crea automáticamente)
    ├── load-test-report-timestamp.json
    └── stress-test-report-timestamp.json
```

---

## 🏃 Ejecución de Tests

### Opción 1: Usando el Script Helper (RECOMENDADO)

```bash
# Load test solamente
cd backend/load-tests
node run-load-tests.js load

# Stress test solamente
node run-load-tests.js stress

# Ambos (load + stress)
node run-load-tests.js both

# Con URL personalizada y token
node run-load-tests.js load http://api.example.com $AUTH_TOKEN
```

### Opción 2: Ejecutar Artillery Directamente

```bash
# Load test
artillery run artillery-load-test.yml

# Stress test
artillery run artillery-stress-test.yml

# Con target personalizado
TARGET_URL=http://api.example.com artillery run artillery-load-test.yml --target "$TARGET_URL"

# Con token de autenticación
AUTH_TOKEN=$TOKEN artillery run artillery-load-test.yml
```

### Opción 3: Ejecutar desde package.json

Agregar a `package.json`:

```json
{
  "scripts": {
    "test:load": "cd backend/load-tests && node run-load-tests.js load",
    "test:stress": "cd backend/load-tests && node run-load-tests.js stress",
    "test:load-stress": "cd backend/load-tests && node run-load-tests.js both"
  }
}
```

Luego:

```bash
npm run test:load
npm run test:stress
npm run test:load-stress
```

---

## 📊 Configuración de Tests

### Load Test (`artillery-load-test.yml`)

**Objetivo:** Validar rendimiento bajo carga normal

| Parámetro | Valor |
|-----------|-------|
| Duración Total | 12 minutos |
| Ramp-up | 2 minutos (0 → 1000 usuarios) |
| Carga Sostenida | 10 minutos (1000 usuarios) |
| Ramp-down | 2 minutos (1000 → 0 usuarios) |
| Usuarios Máximos | 1000 |
| Timeout Request | 10 segundos |

**Escenarios (5):**
1. **AI Tutor (25%):** Conversaciones con modelo IA
2. **Students (20%):** CRUD de estudiantes con paginación
3. **Grades (20%):** Gestión de calificaciones
4. **Notifications (15%):** Notificaciones en cascada
5. **Health Checks (20%):** Endpoints públicos sin autenticación

**SLA:**
- p95 latency: < 200ms
- Error rate: < 0.5%
- RPS sostenido: > 80 req/seg

### Stress Test (`artillery-stress-test.yml`)

**Objetivo:** Encontrar límite del sistema e identificar punto de quiebre

| Parámetro | Valor |
|-----------|-------|
| Duración Total | 20 minutos |
| Fase 1 | 3 min: 0 → 500 usuarios |
| Fase 2 | 3 min: 500 → 1000 usuarios |
| Fase 3 | 5 min: 1000 → 1500 usuarios |
| Fase 4 | 5 min: 1500 usuarios (sostenido) |
| Fase 5 | 4 min: Picos a 2000+ usuarios |
| Usuarios Máximos | 2000+ |
| Timeout Request | 15 segundos |

**Escenarios (4):**
1. **Heavy AI Tutor (40%):** 3 conversaciones IA por sesión
2. **Students Pagination (30%):** Paginar 5 veces por sesión
3. **Grades Operations (20%):** 2 calificaciones por sesión
4. **Notifications (10%):** Marcar 3 como leídas por sesión

---

## 📈 Interpretación de Resultados

### Métricas Principales

```
RPS (Requests per Second)
├── mean: Promedio de solicitudes por segundo
├── max: Máximo RPS alcanzado
└── min: Mínimo RPS

Latency (Milisegundos)
├── p50: Percentil 50 (mediana)
├── p95: Percentil 95 (importante para SLA)
├── p99: Percentil 99 (casos extremos)
├── mean: Promedio
└── max: Máximo

Códigos HTTP
├── 200-299: Éxito
├── 300-399: Redirección
├── 400-499: Error cliente
└── 500-599: Error servidor
```

### Ejemplos de Interpretación

**Load Test Exitoso:**
```
RPS mean: 85 req/seg
p50 latency: 120ms
p95 latency: 180ms        ✓ < 200ms (SLA)
p99 latency: 250ms
Error rate: 0.2%          ✓ < 0.5% (SLA)
```

**Stress Test Degradación Moderada:**
```
RPS mean: 120 req/seg
p50 latency: 800ms
p95 latency: 2500ms       ⚠ Degradación
p99 latency: 5000ms
Error rate: 1.5%          ⚠ Aumento
→ Recomendación: Optimizar queries de BD
```

---

## 🔧 Optimizaciones Post-Test

### Si p95 Latency > 200ms (Load Test)

1. **Revisar Logs:**
   ```bash
   tail -f logs/server.log | grep SLOW
   ```

2. **Identificar Endpoint Lento:**
   - Buscar en `artillery-load-test.yml` endpoint con mayor latencia
   - Usar MySQL EXPLAIN ANALYZE en queries críticas

3. **Optimizaciones Comunes:**
   - Agregar índices en BD: `CREATE INDEX idx_name ON table(column);`
   - Implementar caching Redis en endpoint lento
   - Usar pagination: `LIMIT 50 OFFSET 0`
   - Considerar connection pooling: `pg.Pool({ max: 20 })`

### Si Error Rate > 0.5% (Load Test)

1. **Revisar Códigos de Error:**
   ```bash
   grep "500\|503\|504" logs/server.log | head -20
   ```

2. **Causas Comunes:**
   - Database connection pool exhausted
   - Out of memory (Node.js heap)
   - Timeout en operaciones lentas
   - Rate limiting activado

3. **Soluciones:**
   - Aumentar `pg.Pool max` connections
   - Aumentar Node.js heap: `node --max-old-space-size=4096 server.js`
   - Reducir timeout en operaciones
   - Implementar circuit breaker para servicios externos

### Si Stress Test Falla Antes de 1500 Usuarios

1. **Encontrar Punto de Quiebre:**
   - Ver en qué fase empieza error rate a subir
   - Multiplicar RPS por fase para encontrar usuario #

2. **Ejemplo:** Si falla en Fase 3 (5min de 1500 usuarios):
   - RPS fallando: ~120 req/seg × 5 min × 60 seg = ~36000 requests
   - Capacidad máxima encontrada: ~1500 usuarios × 0.8 = ~1200 usuarios seguros

3. **Recomendar Escalado:**
   - Horizontal: Agregar más servidores Node.js
   - Vertical: Aumentar CPU/memoria del servidor actual
   - Caching: Redis para datos frecuentes
   - Read replicas: BD separada para lecturas

---

## 📝 Workflow Típico SEMANA 30

### Día 1: Setup y Configuración
```bash
# 1. Instalar Artillery
npm install -g artillery

# 2. Crear directorio load-tests
mkdir -p backend/load-tests

# 3. Copiar configuraciones YAML
# (ya incluidas en este kit)

# 4. Verificar servidor corre
npm start &  # en otra terminal

# 5. Hacer primer test pequeño (5 min)
artillery run artillery-load-test.yml --ramp 10
```

### Día 2-3: Load Testing (30.2)
```bash
# 1. Ejecutar load test completo (1000 usuarios)
node backend/load-tests/run-load-tests.js load

# 2. Analizar reporte
cat backend/load-tests/load-test-report-*.json | jq '.aggregate.latency'

# 3. Si p95 > 200ms: Optimizar endpoint lento
# 4. Commit cambios + reprueba

# 5. Documentar resultados en archivo RESULTADOS.md
```

### Día 4-5: Stress Testing (30.3)
```bash
# 1. Ejecutar stress test (2000+ usuarios)
node backend/load-tests/run-load-tests.js stress

# 2. Analizar: ¿A cuántos usuarios falla?
cat backend/load-tests/stress-test-report-*.json | jq '.aggregate'

# 3. Identificar bottleneck principal
# 4. Implementar optimizaciones clave
# 5. Retest y documentar capacidad máxima

# 6. Crear gráfico de degradación de performance
```

### Día 6: Análisis Final (30.4 + 30.5)
```bash
# 1. Documentar todos los hallazgos en SEMANA_30_RESULTADOS.md
# 2. Listar cuellos de botella encontrados
# 3. Crear plan de optimizaciones para Semana 31
# 4. Commit final: "test(semana-30): Load testing completado - 1000 usuarios OK"
```

---

## 📄 Estructura del Reporte

Artillery genera reportes JSON automáticamente:

```json
{
  "timestamp": "2025-11-23T10:30:00Z",
  "aggregate": {
    "rps": {
      "mean": 85.5,
      "max": 95,
      "min": 10
    },
    "latency": {
      "p50": 120,
      "p95": 185,
      "p99": 250,
      "mean": 145,
      "max": 5000
    },
    "codes": {
      "200": 51000,
      "500": 100
    }
  },
  "phases": [
    { "name": "Ramp-up", "duration": 120, ... },
    { "name": "Sustained Load", "duration": 600, ... },
    { "name": "Ramp-down", "duration": 120, ... }
  ]
}
```

---

## 🐛 Troubleshooting

### Error: "Connection refused on port 3000"

```bash
# Verificar servidor corre
netstat -an | grep 3000

# Si no está corriendo:
npm start &
```

### Error: "Artillery not found"

```bash
# Reinstalar Artillery globalmente
npm install -g artillery

# Verificar:
artillery -V
```

### Error: "ENOTFOUND localhost"

```bash
# Usar IP explícita en test config
# Cambiar en YAML: target: "http://127.0.0.1:3000"
```

### Memory Leak Durante Test

```bash
# Aumentar heap de Node.js
node --max-old-space-size=4096 backend/server.js &

# Luego ejecutar test
artillery run artillery-load-test.yml
```

---

## 📚 Recursos Adicionales

- **Artillery Docs:** https://artillery.io/docs
- **Load Testing Best Practices:** https://loadimpact.com/blog/
- **SLA Standards:** https://en.wikipedia.org/wiki/Service-level_agreement

---

## 🎯 SLA Target para v6.0.0

| Métrica | Target | Status |
|---------|--------|--------|
| p95 Latency (Load) | < 200ms | TBD |
| p95 Latency (Stress @ 1500 users) | < 500ms | TBD |
| Error Rate (Load) | < 0.5% | TBD |
| Error Rate (Stress @ 1500 users) | < 2% | TBD |
| Usuarios Máximos | 2000+ | TBD |
| Uptime | 99.99% | TBD |

---

**Última actualización:** 23 de Noviembre de 2025
**Versión:** 1.0.0 (SEMANA 30)
