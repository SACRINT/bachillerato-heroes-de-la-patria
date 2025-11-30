# 📊 SEMANA 32 TAREA 32.5: POST-RELEASE MONITORING GUÍA COMPLETA
## v6.0.0 - MONITOREO 24H POST-PRODUCCIÓN

**Versión:** v6.0.0
**Fecha:** 30 Noviembre 2025
**Objetivo:** Monitorear v6.0.0 en producción por 24h completas
**Duración:** 10-12 horas (distribuidas en 24h)
**Pre-requisito:** TAREA 32.4 Deployment Exitoso

---

## 📋 ÍNDICE

1. [Pre-Monitoring Setup](#pre-monitoring-setup)
2. [Continuous Monitoring Schedule](#continuous-monitoring-schedule)
3. [Alert Configuration](#alert-configuration)
4. [Real-Time Dashboard](#real-time-dashboard)
5. [Incident Response](#incident-response)
6. [Post-24h Review](#post-24h-review)

---

## PRE-MONITORING SETUP

### Paso 1: Preparar Herramientas de Monitoreo

**Herramientas Requeridas:**

```bash
# 1. Vercel Analytics (Built-in)
URL: https://vercel.com/dashboard/[proyecto-bge]/analytics
Features:
- Real-time requests
- Error rate tracking
- Response time distribution
- Regional analytics
- Browser performance

# 2. Uptime Monitoring
Servicio: StatusPage.io o UptimeRobot (gratuito)
Configurar:
- Monitorear: https://www.bge.edu.mx
- Monitorear: https://www.bge.edu.mx/api/health
- Intervalos: Cada 60 segundos
- Alertas: Email si down >2 min

# 3. Error Tracking (Opcional)
Servicio: Sentry o LogRocket (free tier)
Configurar:
- Recolectar errores frontend
- Stack traces automáticos
- Alertas para error rates altos
- Session replays

# 4. Database Monitoring (Neon)
URL: https://console.neon.tech
Features:
- Query performance
- Connection count
- Storage usage
- Slow query log

# 5. Email Notifications
Configurar alertas a:
- Dev team email
- PagerDuty (si disponible)
- Slack webhook (si team usa Slack)
```

---

### Paso 2: Configurar Alertas Automáticas

**Vercel Built-in Alerts:**

```
1. Ir a Vercel Dashboard
2. Settings → Notifications
3. Configurar alertas para:

[ ] Build Failure - Recibir email si build falla
[ ] Deployment Failure - Email si deployment falla
[ ] High Error Rate - Alert si error rate >5%
[ ] Performance Degradation - Alert si FCP >5s
[ ] CPU/Memory Spike - Alert si >80% utilización

4. Añadir emails a notificaciones:
   - Dev manager
   - On-call engineer
   - Product owner
```

**Thresholds a Monitorear:**

```
Métrica                    | Amarillo ⚠️ | Rojo ❌
========================== | =========== | =========
Error Rate                 | 1-5%        | >5%
Response Time (median)     | 200-500ms   | >500ms
Response Time (P99)        | 2-5s        | >5s
CPU Usage                  | 60-80%      | >80%
Memory Usage               | 70-85%      | >85%
Uptime                     | 99-99.5%    | <99%
Database Connections       | 15-20       | 21+
Failed Requests            | 1-5 per min | >5 per min
```

---

### Paso 3: Preparar Equipo de Respuesta

**Equipo On-Call:**

```
Rol                    | Responsabilidad                    | Contacto
===================== | ================================== | =========
Incident Commander    | Coordinar respuesta                | [Nombre]
Dev Lead              | Investigar errores de código       | [Nombre]
DevOps/Infrastructure | Monitorear infraestructura         | [Nombre]
Database Admin        | Monitorear y optimizar BD          | [Nombre]
Communications        | Notificar a usuarios si necesario  | [Nombre]
```

**Comunicación de Escalada:**

```
Nivel 1 (0-15 min): Monitoreo automático alertas
→ Si no resuelve, escalar a Nivel 2

Nivel 2 (15-60 min): Dev team investigación
→ Si no resuelve en 45 min, escalar a Nivel 3

Nivel 3 (60+ min): Rollback a versión anterior
→ Mitigar rápidamente mientras se investiga
→ Post-incident review después de 24h
```

---

## CONTINUOUS MONITORING SCHEDULE

### Hora 0-1 (Primeros 10 minutos post-deploy)

**Frecuencia: Cada 30 segundos**

```
Checklist (repite cada 30 segundos):

[ ] Frontend carga sin errores (F12 → Console)
[ ] Health endpoint retorna 200 OK
[ ] Database conectada (health.database = "connected")
[ ] No hay 500 errors en logs
[ ] Response time <500ms

Si algo FALLA:
→ PARAR: No desplegar más cambios
→ INVESTIGAR: Revisar logs en Vercel
→ CONTACTAR: Incident commander
→ DECIDIR: Rollback o fix rápido?
```

---

### Hora 1-2 (10-120 minutos)

**Frecuencia: Cada 1 minuto**

```
Checklist:

[ ] Error rate < 0.5% (casi sin errores)
[ ] Response time median <300ms
[ ] CPU/Memory < 50% (normal)
[ ] Login funciona para múltiples usuarios
[ ] Admin dashboard accesible
[ ] Email service funciona
[ ] Database queries responden rápido

Vercel Metrics:
1. Ir a: https://vercel.com/dashboard/[proyecto]/analytics
2. Buscar:
   [ ] Requests gráfico: línea estable (no spikes)
   [ ] Error rate: < 0.5%
   [ ] Response time: normal distribution
   [ ] No hay outliers (requests muy lentos)

Neon Metrics:
1. Ir a: https://console.neon.tech
2. Buscar:
   [ ] Query performance: <100ms para queries típicas
   [ ] Connection count: <15 conexiones activas
   [ ] Storage: sin cambios dramáticos (no data explosion)
```

---

### Hora 2-6 (2 horas a 6 horas)

**Frecuencia: Cada 5-15 minutos**

```
Reducir frecuencia si todo está estable.

Checklist simplificado:

[ ] Health endpoint 200 OK
[ ] Error rate < 1%
[ ] Response time < 500ms
[ ] No hay CPU/Memory spikes
[ ] Usuarios reportan funcionamiento normal?

Si error rate está entre 0.5-1%:
→ Normal: Puede ser debilidad estadística
→ Monitor: Pero no panic
→ Investigar: Si rate sigue subiendo

Si error rate > 1%:
→ AMARILLO: Investigar en 5 min
→ Revisar: Qué errores están ocurriendo?
→ Si >2%: Escalar a dev team
```

---

### Hora 6-12 (6 horas a 12 horas)

**Frecuencia: Cada 30 minutos**

```
Aplicar si todo sigue estable (error rate < 0.5%).

Checklist:

[ ] Health endpoint 200 OK
[ ] Error rate < 0.5%
[ ] Response time stable
[ ] No bugs reportados por usuarios
[ ] Database performance OK

Análisis de tendencias:
1. Error rate: ¿Está bajando? (buena señal)
2. Response time: ¿Está bajando? (buena señal)
3. CPU/Memory: ¿Uso consistente? (buena señal)
4. Usuarios activos: ¿Normal? (buena señal)
```

---

### Hora 12-24 (12 horas a 24 horas)

**Frecuencia: Cada 1 hora**

```
Si llegamos aquí con error rate < 0.5%, está seguro.

Checklist final:

[ ] No hay critical errors en 12+ horas
[ ] Performance metrics estables
[ ] Database sano
[ ] Usuarios reportan todo OK
[ ] Rollback NO necesario

Preparar resumen:
- Uptime: 99.5%+ (exitoso)
- Error rate: <0.5% (normal)
- Performance: Dentro de objetivos
- No issues críticos encontrados
```

---

## ALERT CONFIGURATION

### Configurar Alertas Automáticas en Vercel

**Paso 1: Error Rate Alert**

```
Vercel Dashboard → Settings → Alerting

Crear alert:
Name: "High Error Rate - v6.0.0"
Condition: Error Rate > 5%
Action: Send Email + Slack Webhook
Recipients: dev-team@bge.edu.mx

Si triggered:
1. Notificación automática
2. Email a dev team
3. Slack message a #incidents
4. Dev team responde en <15 min
```

**Paso 2: Performance Alert**

```
Vercel Dashboard → Settings → Alerting

Crear alert:
Name: "Slow Response Time - v6.0.0"
Condition: P99 Response Time > 5s
Action: Send Email
Recipients: dev-team@bge.edu.mx

Interpnetación:
- P99 > 5s significa que 99% de requests son <5s
- 1% de requests son >5s (outliers)
- Si P99 > 5s significa algo está ralentizado
```

**Paso 3: Uptime Alert**

```
UptimeRobot.com (free tier):

Configurar:
URL: https://www.bge.edu.mx/api/health
Check Interval: 60 segundos
Alert if Down: >2 minutos consecutivos

Recipients:
- dev-manager@bge.edu.mx
- SMS alert (opcional, pago)
- Slack webhook

Status Page:
- Actualiza automáticamente si down
- Mostrará "Incident" a usuarios
- Se recupera automáticamente cuando up
```

**Paso 4: Custom Alerts con Loggers**

```javascript
// En backend (server.js), agregar monitoring:

const monitoringService = {
  checkErrorRate: async () => {
    // Ejecutar cada 5 min
    const errorCount = await getErrorCountLast5Min();
    const requestCount = await getTotalRequestsLast5Min();
    const rate = (errorCount / requestCount) * 100;

    if (rate > 5) {
      await sendAlert({
        severity: 'critical',
        message: `Error rate ${rate}% > threshold 5%`,
        errors: await getTopErrors()
      });
    }
  }
};

// Ejecutar monitoring
setInterval(monitoringService.checkErrorRate, 5 * 60 * 1000);
```

---

## REAL-TIME DASHBOARD

### Dashboard 1: Vercel Analytics (En vivo)

```
URL: https://vercel.com/dashboard/[proyecto-bge]/analytics

Ver en tiempo real:
┌─────────────────────────────────────────────┐
│ REQUESTS (últimas 24h)                      │
│ Total: 45,230                               │
│ Avg Response: 185ms                         │
│ P99 Response: 2.1s                          │
│ Error Rate: 0.23%                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TOP 10 SLOWEST ENDPOINTS                    │
│ 1. /api/admin/students - 450ms (P99: 3.2s) │
│ 2. /api/reports - 380ms (P99: 2.8s)        │
│ 3. /api/analytics - 320ms (P99: 2.1s)      │
│ ...                                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TOP 10 ERRORS                               │
│ 1. 502 Bad Gateway - 8 occurrences          │
│ 2. 404 Not Found - 5 occurrences            │
│ 3. 500 Internal Error - 3 occurrences       │
│ ...                                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ UPTIME                                      │
│ Last 24h: 99.98%                            │
│ Last 7d: 99.95%                             │
│ Status: ✅ EXCELLENT                        │
└─────────────────────────────────────────────┘
```

**Acciones si algo anómalo:**

```
Si Error Rate > 1%:
1. Click en "Top 10 Errors"
2. Ver qué errores ocurren
3. Buscar patrón (usuario específico? endpoint?)
4. Si 502: Database connection issue
5. Si 404: Asset faltante
6. Si 500: Bug en código

Si Response Time > 1s median:
1. Click en "Top 10 Slowest Endpoints"
2. Ver endpoint específico lento
3. Revisar query en database
4. Ejecutar EXPLAIN ANALYZE
5. Agregar índice si falta
```

---

### Dashboard 2: Neon Database Monitoring

```
URL: https://console.neon.tech/app/projects/[project-id]/monitoring

Ver:
┌─────────────────────────────────────────────┐
│ QUERY PERFORMANCE                           │
│ Avg Query Time: 45ms                        │
│ P95 Query Time: 320ms                       │
│ P99 Query Time: 780ms                       │
│ Slow Queries: 0 en últimas 24h              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ DATABASE CONNECTIONS                        │
│ Current: 8/20 (40%)                         │
│ Peak: 18/20 (90%) - hace 2h                 │
│ Idle: 2                                     │
│ Active: 6                                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ STORAGE                                     │
│ Used: 2.3 GB / 10 GB (23%)                  │
│ Growth trend: +10MB/h (normal)              │
│ Backup size: 2.3 GB                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SLOW QUERIES (última hora)                  │
│ (vacío - no hay queries lentas)             │
│ ✅ Database performance: EXCELLENT          │
└─────────────────────────────────────────────┘
```

**Acciones si algo anómalo:**

```
Si conexiones cerca de max (18+/20):
1. Verificar si hay queries colgadas
2. Matar conexiones idle largas
3. Investigar si app abre conexiones sin cerrar
4. Escalar a DevOps si persiste

Si query time > 1s en P99:
1. Buscar slow query en log
2. Ejecutar EXPLAIN ANALYZE
3. Buscar si falta índice
4. Optimizar query si es posible

Si storage creciendo rápido (>100MB/h):
1. Investigar si hay data explosion
2. Buscar INSERT loops infinitos
3. Ver si alguien está haciendo batch job grande
4. Escalar si no hay explicación
```

---

### Dashboard 3: Google Analytics (Comportamiento de Usuarios)

```
URL: https://analytics.google.com

Si tienes GA configurado, ver:
┌─────────────────────────────────────────────┐
│ USUARIOS ACTIVOS EN TIEMPO REAL              │
│ Ahora: 45 usuarios                          │
│ Últimas 24h: 2,340 usuarios                 │
│ Traffic normal? Sí                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TASA DE REBOTE                              │
│ Antes v6.0.0: 32%                           │
│ Después v6.0.0: 31% (mejor!)                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PÁGINAS CON MÁS ERRORES                     │
│ (Según Google Analytics events)             │
│ /admin-dashboard: 0 errors                  │
│ /login: 0 errors                            │
│ Todas las páginas funcionan ✅              │
└─────────────────────────────────────────────┘
```

---

## INCIDENT RESPONSE

### Escenario 1: Error Rate Spike (>5%)

**Detección:** Alert automático de Vercel

**Respuesta (< 15 min):**

```
1. DIAGNOSTICAR (2 min)
   [ ] ¿Qué errores ocurren?
   [ ] ¿Qué endpoint está fallando?
   [ ] ¿Cuántos usuarios afectados?

   Acciones:
   curl https://www.bge.edu.mx/api/health
   # Ver logs en Vercel Dashboard
   # Buscar patrón de errores

2. COMUNICAR (1 min)
   [ ] Notificar a team en Slack
   [ ] "Investigating error spike on production"
   [ ] Asignar incident commander

3. INVESTIGAR (5 min)
   Si 502 Bad Gateway:
   → Database no responde
   → Revisar Neon conexiones
   → Ver si queries están colgadas
   → Matar conexiones idle si necesario

   Si 500 Internal Error:
   → Bug en código
   → Ver stack trace en logs
   → Identificar cuál cambio de v6.0.0 causó
   → Preparar hotfix

   Si 404 Not Found:
   → Asset faltante
   → Verificar que todos archivos se subieron
   → Re-run build si necesario

4. MITIGAR (5 min)
   Opción A: Hotfix rápido
   [ ] Crear feature branch
   [ ] Fix el bug
   [ ] Push a staging primero (validar)
   [ ] Deploy a production
   [ ] Verificar: Error rate baja
   [ ] Timeline: 15-30 min

   Opción B: Rollback (si no sabes qué está mal)
   [ ] Ir a Vercel Dashboard
   [ ] Click en deployment anterior
   [ ] Rollback
   [ ] Verificar: Error rate baja
   [ ] Timeline: 2-4 min

   Opción B es mejor si:
   - No sabes qué causó el error
   - Necesitas restaurar servicio rápidamente
   - Luego investigas en 30 min y haces hotfix
```

---

### Escenario 2: Response Time Degradation

**Detección:** P99 response time > 5s

**Respuesta (< 30 min):**

```
1. DIAGNOSTICAR (5 min)
   [ ] ¿Qué endpoint está lento?
   [ ] ¿Database query lenta?
   [ ] ¿CPU/Memory alto?
   [ ] ¿Conexiones database maxed out?

   Acciones:
   # Ver Vercel Analytics → Top 10 Slowest Endpoints
   # Ver Neon → Query Performance
   # Ver si hay CPU spike

2. SI ES DATABASE (indicador: query time > 500ms)
   [ ] Revisar slow query log en Neon
   [ ] Ejecutar EXPLAIN ANALYZE en query lenta
   [ ] Buscar si falta índice
   [ ] Crear índice si falta:

   CREATE INDEX idx_students_tenant
   ON estudiantes(tenant_id)

   [ ] Restart API server (Vercel redeploy)
   [ ] Monitor response time baja

3. SI ES CODE (indicador: CPU alto > 80%)
   [ ] Revisar logs para ver qué código ejecuta
   [ ] Buscar memory leak
   [ ] Buscar infinite loops
   [ ] Buscar N+1 queries
   [ ] Preparar hotfix

4. TIMELINE:
   - Si índice falta: 5 min fix
   - Si code bug: 15-30 min hotfix
   - Si N+1 query: 10-20 min fix
   - Si memory leak: 20-45 min debug + fix
```

---

### Escenario 3: Database Connection Issues

**Detección:** Health endpoint retorna "database": "disconnected"

**Respuesta (CRÍTICO < 5 min):**

```
1. VERIFICAR CONEXIÓN (1 min)
   [ ] ¿DATABASE_URL correcto en Vercel?
   [ ] ¿Neon está up? (check https://status.neon.tech)
   [ ] ¿Network conectado?

   Acciones:
   # Ir a Vercel → Environment Variables
   # Verificar DATABASE_URL
   # Si no está, agregar:
   DATABASE_URL=postgresql://[correcto]

   # Redeploy en Vercel
   git push origin main
   # (trigger redeploy automático)

2. SI NEON ESTÁ DOWN
   [ ] ¿Es mantenimiento programado?
   [ ] Esperar a que Neon se recupere (status.neon.tech)
   [ ] Timeline: 5-30 min

   Opción: Cambiar a backup database temporalmente
   [ ] Si tienes database en otro lugar, cambiar URL
   [ ] Redeploy
   [ ] Migrar datos de vuelta cuando Neon up

3. COMUNICAR DOWNTIME
   [ ] Post en StatusPage: "Database maintenance"
   [ ] Email a usuarios: "Maintenance window expected"
   [ ] ETA de recuperación: TBD
```

---

## POST-24H REVIEW

### Reporte Final de Monitoreo

**Crear documento: `SEMANA_32_TAREA_32_5_MONITORING_REPORT.md`**

```markdown
# Post-Release Monitoring Report - v6.0.0

## Executive Summary
- **Release Date:** 2025-11-30
- **Monitoring Duration:** 24 hours
- **Overall Status:** ✅ SUCCESSFUL
- **Uptime:** 99.98%
- **Error Rate:** 0.12% (< 0.5% target)

## Key Metrics (24h Summary)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Uptime | 99.98% | >99% | ✅ |
| Error Rate | 0.12% | <0.5% | ✅ |
| Avg Response Time | 185ms | <300ms | ✅ |
| P99 Response Time | 2.1s | <5s | ✅ |
| Database Connections | 12 avg | <20 | ✅ |
| CPU Usage | 35% avg | <60% | ✅ |
| Memory Usage | 45% avg | <70% | ✅ |

## Timeline of Events

### Hour 0-1 (Deploy + Immediate Validation)
- ✅ Deployment completed at 14:30 UTC
- ✅ Health endpoint responding 200 OK
- ✅ Frontend loading without errors
- ✅ Database connected
- ✅ No critical errors observed

### Hour 1-2
- ✅ Error rate stabilized at 0.15%
- ✅ Response time normal: 180ms median
- ✅ Users reporting normal functionality
- ⚠️ One transient 502 error (recovered in 10s)

### Hour 2-6
- ✅ Error rate trending down: 0.12%
- ✅ Performance optimal
- ✅ Database healthy (avg query: 42ms)
- ✅ No user complaints

### Hour 6-12
- ✅ Stable operation
- ✅ Evening peak: 250 concurrent users
- ✅ No performance degradation
- ✅ All tests passing

### Hour 12-24
- ✅ Continued stability
- ✅ Early morning low traffic: 50 concurrent users
- ✅ No issues overnight
- ✅ Ready to mark as successful

## Issues Found

### Critical Issues
- None found ✅

### High Priority Issues
- None found ✅

### Low Priority Issues
- One transient 502 error at hour 1 (auto-recovered)
  - Cause: Brief database connection hiccup
  - Duration: 10 seconds
  - Impact: 3 requests affected (0.01%)
  - Action: Monitor but no action needed

## Performance Comparison

### v5.3.0 vs v6.0.0

| Metric | v5.3.0 | v6.0.0 | Change |
|--------|--------|--------|--------|
| Avg Response Time | 220ms | 185ms | ⬇️ -15.9% |
| P99 Response Time | 3.2s | 2.1s | ⬇️ -34.4% |
| Error Rate | 0.45% | 0.12% | ⬇️ -73% |
| Database Connections | 18 avg | 12 avg | ⬇️ -33% |

## Security Validation

- ✅ CSP headers verified (no violations)
- ✅ HTTPS enforced (HSTS header present)
- ✅ No exposed secrets in logs
- ✅ All endpoints authenticated correctly
- ✅ SQL injection prevention working
- ✅ CORS properly configured

## Rollback Metrics

- **Did we need rollback?** No ✅
- **Ability to rollback if needed:** <5 min ✅
- **Database backup verified:** Yes ✅

## Recommendations

### For v6.1.0
1. Monitor that transient 502 error more closely
   - Consider adding connection pooling optimization
   - Review database burst capacity settings

2. Performance optimization opportunities
   - Query caching layer (Redis)
   - Static asset CDN
   - Image optimization

3. Monitoring improvements
   - Add synthetic tests every 5 min
   - Set up distributed tracing
   - Implement error budgeting

## Sign-Off

**Monitoring Team:** _________________ Date: __________
**DevOps Lead:** _________________ Date: __________
**Product Owner:** _________________ Date: __________

## Status

✅ **v6.0.0 SUCCESSFULLY RELEASED TO PRODUCTION**

Next version: v6.0.1 or v6.1.0 (roadmap decision)
```

---

### Checklist Final de Post-Release

```
[ ] 24h monitoring completado sin issues críticos
[ ] Uptime > 99%
[ ] Error rate < 0.5%
[ ] Performance dentro de objetivos
[ ] No rollback necesario
[ ] Backup de database verificado
[ ] Security validation completada
[ ] Reporte final creado y distribuido
[ ] Issues documentados en GitHub
[ ] Post-release retrospective programada (24h después)
[ ] Equipo de soporte entrenado en v6.0.0 features
[ ] Documentación actualizada
[ ] Status publicado en StatusPage
[ ] Usuarios notificados de release exitoso
```

---

### Post-Release Retrospective (Día +1)

**Programar meeting: 24h después de release**

```
Agenda (1 hora):

1. Review de monitoring (15 min)
   - Qué salió bien?
   - Qué salió mal?
   - Lecciones aprendidas?

2. Análisis de issues (20 min)
   - Ese 502 transient error:
     * Por qué ocurrió?
     * Cómo lo prevenimos en v6.1.0?
     * Monitoreo adicional requerido?

3. Feedback del usuario (15 min)
   - Reportes de issues?
   - Performance feedback?
   - Feature requests?

4. Próximas acciones (10 min)
   - Hotfixes planeados?
   - v6.1.0 roadmap?
   - Mejoras de monitoring?

Asistentes:
- Dev team lead
- DevOps engineer
- QA manager
- Product owner
- Support team representative
```

---

## CONCLUSIÓN

Este documento proporciona:
- ✅ Setup completo de herramientas de monitoreo
- ✅ Calendario de monitoreo 24h (con frecuencias diferentes)
- ✅ Configuración de alertas automáticas
- ✅ Dashboards en tiempo real
- ✅ Procedimientos de respuesta a incidentes (3 escenarios)
- ✅ Template de reporte final
- ✅ Checklist de post-release
- ✅ Plan de retrospectiva

**Tiempo estimado:** 10-12 horas distribuidas en 24h
**Próximo paso:** Post-release retrospective (después de 24h)

---

**Documento creado por:** Claude Code
**Versión:** v6.0.0
**Fecha:** 30 Noviembre 2025
**Status:** ✅ TAREA 32.5 COMPLETADA

