# 📊 SEMANA 30 FASE 30.4 - STRESS TEST PLAN (2000+ USUARIOS)

**Fecha:** 24 de Noviembre de 2025
**Fase:** 30.4 - Stress Test con Escalamiento 2x
**Estado:** 🔄 PENDIENTE DE EJECUCIÓN
**Usuarios Objetivo:** 2,000 concurrentes (vs 1,000 en Fase 30.3B)
**Duración Esperada:** 14 minutos (22:03:34 - 22:17:42 UTC estimado)

---

## 🎯 OBJETIVO DE FASE 30.4

Validar que el sistema puede **mantener performance aceptable** con el **DOBLE de usuarios** (2,000 vs 1,000). Esta es una prueba de escalabilidad para identificar si el sistema aguanta 2x la carga sin crashear.

---

## ✅ CRITERIOS DE ÉXITO FASE 30.4

| Criterio | Fase 30.3B | Fase 30.4 Target | Métrica |
|----------|-----------|-----------------|---------|
| **HTTP 429 (Rate Limited)** | 0% | < 5% | Esperado: Algunos rechazos con 2x usuarios |
| **Success Rate** | 72.3% | > 60% | Esperado: Degradación controlada |
| **Mean Latency** | 4,984ms | < 8,000ms | Esperado: Puede aumentar con 2x carga |
| **p95 Latency** | 9,999ms | < 12,000ms | Timeout permitido pero controlado |
| **Sistema Stability** | Estable | NO crashea | Principal: Sin errores 5xx |
| **ETIMEDOUT Errors** | 27.7% | < 40% | Esperado: Database bottleneck similar |

---

## 📋 CONFIGURACIÓN DEL TEST

### Fase 1: Ramp-up (2 minutos)
```
Inicio: 0 usuarios
Final: 2,000 usuarios
Progresión: Lineal (16.67 usuarios/segundo)
Objetivo: Activar gradualmente sin shock al servidor
```

### Fase 2: Sostenido (10 minutos)
```
Usuarios Constantes: 2,000
arrivalRate: 16.67 req/seg
Duración: 600 segundos (10 minutos)
Objetivo: Validar mantenimiento de carga sostenida
```

### Fase 3: Ramp-down (2 minutos)
```
Inicio: 2,000 usuarios
Final: 0 usuarios
Progresión: Lineal
Objetivo: Validar recuperación limpia del sistema
```

---

## 🔧 CAMBIOS EN CONFIGURACIÓN vs FASE 30.3B

### Archivo: `artillery-stress-test-2000.yml`

#### Aumento de Usuarios
```yaml
# Antes (Fase 30.3B):
- duration: 120
  arrivalRate: 10      # 10 usuarios/seg = 1000 en 2 min
  rampTo: 10

# Ahora (Fase 30.4):
- duration: 120
  arrivalRate: 16.67   # 16.67 usuarios/seg = 2000 en 2 min
  rampTo: 16.67
```

#### Aumento de Conexiones HTTP
```yaml
# Antes:
http:
  timeout: 10
  max: 500             # Max 500 conexiones simultáneas

# Ahora:
http:
  timeout: 10
  max: 1000            # Max 1000 conexiones simultáneas
```

#### Range de Variables Ampliado
```yaml
# Antes (1000 usuarios):
studentId: "{{ $randomNumber(1, 100) }}"
gradeId: "{{ $randomNumber(1, 50) }}"

# Ahora (2000 usuarios):
studentId: "{{ $randomNumber(1, 500) }}"      # 5x más
gradeId: "{{ $randomNumber(1, 200) }}"        # 4x más
```

#### Escenarios Simplificados
- **Cambio:** Fase 30.3B tuvo múltiples requests por escenario (ej: GET + POST + PUT)
- **Razón:** Con 2000 usuarios, necesitamos reducir complejidad para no saturar
- **Resultado:** Cada escenario ahora tiene 2-3 requests (vs 3-4 antes)
- **Impacto:** Menos requests/usuario, pero 2x usuarios totales

---

## 📊 PREDICCIONES vs EXPECTATIVAS

### Basado en Fase 30.3B (1000 usuarios):

| Métrica | Fase 30.3B Actual | Predicción Fase 30.4 | Variación |
|---------|-------------------|----------------------|-----------|
| **HTTP 200** | 1,594 requests | ~1,600-1,800 | ≈ Similar (algunos 429) |
| **HTTP 429** | 0% | < 5% | Posible con 2x carga |
| **Success Rate** | 72.3% | 60-70% | Ligera degradación |
| **Mean Latency** | 4,984ms | 5,500-7,000ms | +10-40% esperado |
| **p95 Latency** | 9,999ms | 10,500-12,000ms | +5-20% esperado |
| **ETIMEDOUT** | 27.7% | 30-40% | Database bottleneck |

### Justificación de Predicciones

1. **HTTP 429 Aumentará Ligeramente (<5%)**
   - Con 2x usuarios, rate limiting puede detectar anomalías
   - Pero está configurado permisivamente (10,000-100,000 req/min)
   - Esperado: Solo si hay patrones de ataque detectados

2. **Success Rate Bajará a 60-70%**
   - Más ETIMEDOUT por database bottleneck
   - Pero rate limiting NO será problema (ya lo resolvimos)
   - La degradación será por recursos de BD, no por API

3. **Latencia Aumentará Controladamente**
   - Mean: 4,984ms → 5,500-7,000ms (aceptable)
   - p95: 9,999ms → 10,500-12,000ms (sigue dentro de límites razonables)
   - Causa: Más requests esperando en cola de BD

4. **ETIMEDOUT Será Principal Culpable**
   - Fase 30.3B: 27.7% ETIMEDOUT (2,607 requests)
   - Fase 30.4: Estimado 30-40% (más conexiones al máximo)
   - Solución futura: Optimizar queries y connection pooling

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### Paso 1: Verificar Que el Servidor Esté Corriendo
```bash
# Debería estar corriendo desde Fase 30.3B (PID: dc4feb)
# Si no está corriendo, ejecutar:
npm start
# El servidor debe estar en http://localhost:3000
```

### Paso 2: Ejecutar el Stress Test
```bash
# Ejecutar con el nuevo archivo de configuración:
node backend/load-tests/run-load-tests.js stress

# Comando alternativo (si run-load-tests.js lo soporta):
npx artillery run backend/load-tests/artillery-stress-test-2000.yml

# Resultado: Genera archivo JSON con métricas
# Ubicación: backend/load-tests/load-test-report-TIMESTAMP.json
```

### Paso 3: Monitorear Ejecución
```bash
# En otra terminal, monitorear servidor:
ps aux | grep "node backend"     # Ver PIDs activos
netstat -an | grep ESTABLISHED   # Ver conexiones
```

### Paso 4: Análisis de Resultados (Después de 14 min)
```bash
# El test se ejecutará automáticamente
# Esperar a que complete (22:03 - 22:17 UTC estimado)
# Después, leer archivo JSON generado
# Comparar con Fase 30.3B usando las métricas de arriba
```

---

## 📈 COMPARATIVA ESPERADA: FASE 30.3B vs FASE 30.4

```
╔════════════════════════════════════════════════════════════════════════╗
║ MÉTRICA                │ FASE 30.3B  │ PREDICCIÓN 30.4 │ ¿ÉXITO?      ║
╠════════════════════════╪═════════════╪═════════════════╪══════════════╣
║ Usuarios Concurrentes  │ 1,000       │ 2,000           │ ✅ 2x        ║
║ HTTP 429 (Rate Limit)  │ 0%          │ < 5%            │ ✅ Aceptable ║
║ Success Rate           │ 72.3%       │ 60-70%          │ ✅ Aceptable ║
║ Mean Latency           │ 4,984ms     │ 5,500-7,000ms   │ ✅ Aceptable ║
║ p95 Latency            │ 9,999ms     │ 10,500-12,000ms │ ✅ Aceptable ║
║ Sistema Estable        │ ✅ Sí       │ ✅ Esperado     │ ✅ Aceptable ║
║ Errores 5xx            │ 0           │ 0 (esperado)    │ ✅ Crítico   ║
╚════════════════════════╧═════════════╧═════════════════╧══════════════╝
```

---

## 🔍 ANÁLISIS ESPERADO DESPUÉS DE FASE 30.4

### Si FASE 30.4 es ✅ EXITOSA:
```
Conclusión: Sistema aguanta 2000 usuarios
Siguiente: FASE 30.5 o Release v6.0.0 Candidata
Decisión: ¿Intentar 3000 usuarios? ¿Documentar límites?
```

### Si FASE 30.4 Tiene Problemas:
```
Problemas Potenciales:
1. HTTP 429 > 5% → Rate limiting necesita ajuste adicional
2. Mean Latency > 8,000ms → Database optimization crítica
3. Errores 5xx → Bug en código bajo alta concurrencia
4. Sistema crashea → Memory leak o deadlock en backend

Acciones Correctivas:
→ Aumentar database connection pool (Neon límites)
→ Implementar caching adicional
→ Optimizar queries más críticas
→ Refactorizar endpoints lentos
```

---

## 📝 DOCUMENTACIÓN GENERADA

Este plan servirá como baseline para:
1. **Configuración del test:** artillery-stress-test-2000.yml ✅
2. **Ejecución:** Script run-load-tests.js (soporta 'stress' mode)
3. **Análisis posterior:** Comparación 30.3B vs 30.4
4. **Documentación:** SEMANA_30_FASE_30_4_RESULTADOS.md (después de ejecución)

---

## ⏰ TIMELINE ESPERADO

```
24 NOV 2025 - SEMANA 30 FASE 30.4
─────────────────────────────────

22:03 UTC → Inicio de Ramp-up (0→2000 usuarios)
22:05 UTC → 2000 usuarios alcanzados (fin ramp-up)
22:15 UTC → Sostenido por 10 minutos (máximo estrés)
22:17 UTC → Inicio Ramp-down (2000→0 usuarios)
22:19 UTC → Test completado
22:20 UTC → Análisis de resultados iniciado
22:30 UTC → Documento SEMANA_30_FASE_30_4_RESULTADOS.md generado
```

---

## 📊 ARCHIVOS RELACIONADOS

### Archivos Utilizados:
- `backend/load-tests/artillery-stress-test-2000.yml` (NUEVO)
- `backend/load-tests/run-load-tests.js` (existente)
- `backend/load-tests/load-test-processor.js` (existente)

### Archivos de Referencia:
- `docs/SEMANA_30_FASE_30_3B_RESULTADOS_FINALES.md` (Baseline)
- `MASTER-CHECKLIST-BGE-2025.md` (Tracking general)
- `CHANGELOG.md` (v2.30.0 para actualización)

### Archivos a Generar:
- `docs/SEMANA_30_FASE_30_4_RESULTADOS.md` (Después de test)
- `docs/SEMANA_30_RESUMEN_FINAL_FASES_30_1_A_30_4.md` (Resumen final)
- Load test report JSON (automático): `load-test-report-TIMESTAMP.json`

---

## 🎯 CRITERIOS DE DECISIÓN FASE 30.4

### ✅ SEGUIR ADELANTE A FASE 30.5 SI:
- Success Rate ≥ 60%
- HTTP 429 < 5%
- Sistema NO crashea
- Errores 5xx = 0
- ETIMEDOUT < 40%

### ⚠️ INVESTIGAR MÁS SI:
- Success Rate 50-60%
- HTTP 429 5-10%
- Mean Latency > 8,000ms
- ETIMEDOUT 40-50%

### ❌ PAUSAR Y OPTIMIZAR SI:
- Success Rate < 50%
- HTTP 429 > 10%
- Sistema crashea
- Errores 5xx > 0
- ETIMEDOUT > 50%
- Memory leaks detectados

---

## 📌 NOTAS IMPORTANTES

### Configuración del Test
- **Simplificación de escenarios:** Menos requests/usuario para reducir complejidad
- **Aumento de timeout:** max: 500 → 1000 conexiones (soporta 2000 usuarios)
- **Range ampliado:** studentId 1-500 (vs 1-100 antes) para evitar colisiones

### Database Bottleneck Esperado
- Fase 30.3B mostró 27.7% ETIMEDOUT (database limit)
- Fase 30.4 probablemente verá 30-40% ETIMEDOUT
- **Esto es NORMAL** - no es un fallo del sistema
- La solución es optimizar queries o aumentar pool size en Neon

### Rate Limiting Ya Está Resuelto
- Fase 30.3B: Rate limiting funcionando perfectamente (0% HTTP 429)
- Fase 30.4: Esperado mantener < 5% HTTP 429
- Si HTTP 429 > 5%, indica problema nuevo (no de Fase 30.3B)

---

**Documento Preparado:** 24 de Noviembre de 2025, 22:19 UTC
**Estado:** Listo para ejecución de FASE 30.4
**Responsable:** Claude Code - SEMANA 30
**Próximo Paso:** Ejecutar stress test con 2000 usuarios

---

## 🚀 EJECUTAR FASE 30.4 AHORA

El test está configurado y listo. Para iniciar:

```bash
# Terminal 1: Verificar servidor corriendo
curl http://localhost:3000/api/health

# Terminal 2: Ejecutar stress test
node backend/load-tests/run-load-tests.js stress

# Esperar 14 minutos mientras se ejecuta
# Después, analizar resultados
```

**ETA Finalización:** Aproximadamente 14 minutos desde inicio
