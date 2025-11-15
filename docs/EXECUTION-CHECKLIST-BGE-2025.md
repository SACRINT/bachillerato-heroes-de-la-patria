# 🚀 EXECUTION CHECKLIST - PROYECTO BGE (PRÓXIMAS ACCIONES)

**Creado:** 14 Noviembre 2025
**Versión del Proyecto:** v2.25.1
**Estado:** FASE 4 Completada ✅ - LISTO PARA FASE 5

---

## ✅ STATUS ACTUAL

| Fase | Estado | Completada |
|------|--------|-----------|
| FASE 1: Seguridad Crítica | ✅ 90% | 11 Nov 2025 |
| FASE 2: Sanitización XSS | ✅ 100% | 11 Nov 2025 |
| FASE 2.3: Inline Handlers Pattern A | ✅ 100% | 12 Nov 2025 |
| FASE 4: Saneamiento Total Código | ✅ 100% | 14 Nov 2025 |
| **TOTAL COMPLETADO** | **✅ 85%** | - |

---

## 🎯 PRÓXIMAS TAREAS (ORDENADAS POR EJECUCIÓN RECOMENDADA)

### **BLOQUE 1: CRÍTICA PARA PRODUCCIÓN (Hoy - 1 hora)**

#### **TAREA 1.1: 🔴 CRÍTICA - Fix Tenant Fallback Logic**
- **Prioridad:** 🔴 CRÍTICA (Bloquea /api/config/tenant en Vercel)
- **Duración:** 30 minutos
- **Estado:** ⏳ PENDIENTE
- **Descripción:**
  - El endpoint `/api/config/tenant` retorna 500 en Vercel
  - Root cause: No encuentra tenant para dominio Vercel
  - Solución: Agregar fallback a búsqueda de tenant por defecto

- **Pasos Ejecutivos:**
  1. Leer función `getTenantByDomain` en `backend/data/database-access.js` línea 1176
  2. Reemplazar con versión mejorada que incluya fallback para dominio Vercel
  3. Crear rama: `git checkout -b fix/tenant-fallback-logic`
  4. Commit: `fix(dal): Add fallback to getTenantByDomain for Vercel environments`
  5. Push rama
  6. Crear Pull Request

- **Archivo a Modificar:** `backend/data/database-access.js` (línea 1176)
- **Función Original:**
  ```javascript
  async function getTenantByDomain(domain) {
      try {
          devLogger.log('Operación DAL iniciada');
          const result = await pool.query(
              'SELECT * FROM tenants WHERE domain = $1 LIMIT 1',
              [domain]
          );
          const tenant = result.rows[0] || null;
          devLogger.log(`[DAL] ✅ getTenantByDomain: ${tenant ? 'encontrado' : 'no encontrado'}`);
          return tenant;
      } catch (error) {
          devLogger.error('Error durante operación DAL');
          throw error;
      }
  }
  ```

- **Nueva Función (Mejorada):**
  ```javascript
  async function getTenantByDomain(domain) {
      try {
          devLogger.log(`[DAL] Buscando tenant por dominio: ${domain}`);

          // Búsqueda principal
          let result = await pool.query(
              'SELECT * FROM tenants WHERE domain = $1 AND status = $2 LIMIT 1',
              [domain, 'active']
          );
          let tenant = result.rows[0] || null;

          // 🚨 FALLBACK CRÍTICO PARA VERCEL 🚨
          if (!tenant && domain && domain.includes('vercel.app')) {
              devLogger.warn(`[DAL] No se encontró tenant para dominio Vercel "${domain}". Buscando fallback...`);

              // Buscar tenant por defecto (ID=1 o localhost)
              result = await pool.query(
                  'SELECT * FROM tenants WHERE (id = 1 OR domain = $1) AND status = $2 LIMIT 1',
                  ['localhost', 'active']
              );
              tenant = result.rows[0] || null;

              if (tenant) {
                  devLogger.log(`[DAL] ✅ Fallback exitoso: usando tenant ${tenant.id} (${tenant.school_name})`);
              }
          }

          devLogger.log(`[DAL] ✅ getTenantByDomain: ${tenant ? `encontrado (ID: ${tenant.id})` : 'no encontrado'}`);
          return tenant;

      } catch (error) {
          devLogger.error(`[DAL] ❌ Error en getTenantByDomain para dominio "${domain}":`, error);
          throw error;
      }
  }
  ```

- **Validación Post-Fix:**
  - [ ] `node -c backend/data/database-access.js` pasa sin errores
  - [ ] Rama creada: `fix/tenant-fallback-logic`
  - [ ] Commit realizado con mensaje descriptivo
  - [ ] Pull Request creado

---

#### **TAREA 1.2: ⚠️ ALTA - Validar tabla tenants en Neon**
- **Prioridad:** ⚠️ ALTA (Prerequisito para TAREA 1.1)
- **Duración:** 5 minutos
- **Estado:** ⏳ PENDIENTE (usuario confirmó que SÍ existe)
- **Descripción:** Verificar que tabla existe y tiene datos
- **Acción:** Ejecutar en Neon Console:
  ```sql
  -- Verificar tabla y datos
  SELECT id, domain, school_name, status FROM tenants LIMIT 5;

  -- Contar registros
  SELECT COUNT(*) FROM tenants;
  ```

- **Resultado Esperado:**
  - Mínimo 1 registro (preferiblemente tenant por defecto con domain='localhost' o id=1)
  - Status='active'

- **Si NO hay registros:** Necesitaremos crear datos de prueba con INSERT

- **Validación:**
  - [ ] Tabla existe
  - [ ] Tiene mínimo 1 registro activo
  - [ ] Tenant por defecto existe

---

#### **TAREA 1.3: 🟢 MEDIA - Deployment a Vercel**
- **Prioridad:** 🟢 MEDIA (Después de TAREA 1.1 + 1.2)
- **Duración:** 20 minutos
- **Estado:** ⏳ PENDIENTE
- **Descripción:** Desplegar fix a producción
- **Pasos:**
  1. Merge de PR `fix/tenant-fallback-logic` a main
  2. Push a GitHub
  3. Vercel rebuild automático (esperar 5-10 min)
  4. Verificación de endpoints

- **Validación Post-Deployment:**
  - [ ] `/api/health` retorna 200 OK
  - [ ] `/api/config/tenant` retorna 200 OK (NO 500)
  - [ ] Logs de Vercel sin errores críticos
  - [ ] curl https://bge-heroesdelapatria.vercel.app/api/health retorna datos

---

### **BLOQUE 2: FASE 2.4 - REFACTORIZACIÓN ONCLICK PATTERN B (Esta semana - 4-6 horas)**

#### **TAREA 2.1: 🟡 ALTA - Análisis de Pattern B Onclick**
- **Prioridad:** 🟡 ALTA
- **Duración:** 1 hora
- **Estado:** ⏳ PENDIENTE
- **Descripción:**
  - FASE 2.3 completó Pattern A: `onclick="simple()"` → `data-action="simple"`
  - FASE 2.4 requiere Pattern B: `onclick="func(param1, param2)"` → `data-action="func-param1-param2"`
  - Necesitamos identificar y contar instancias

- **Pasos:**
  1. Buscar en codebase: `onclick=".*\(.*,.*\)"`
  2. Identificar todos los handlers con parámetros
  3. Crear lista de cambios requeridos
  4. Generar script de refactorización

- **Salida Esperada:**
  - Documento: `docs/FASE-2.4-PATTERN-B-ANALYSIS.md`
  - Contiene: Lista de handlers, ubicaciones, parámetros
  - Script: `scripts/refactor-pattern-b-onclick.mjs` (generador de cambios)

---

#### **TAREA 2.2: 🟡 ALTA - Ejecutar Refactorización Pattern B**
- **Prioridad:** 🟡 ALTA
- **Duración:** 3-4 horas
- **Estado:** ⏳ PENDIENTE (después de TAREA 2.1)
- **Descripción:**
  - Aplicar cambios identificados en TAREA 2.1
  - Refactorizar ~400 handlers con parámetros
  - Actualizar event-handler-registry.js para soportar parámetros

- **Pasos:**
  1. Crear rama: `git checkout -b feat/phase-2.4-pattern-b`
  2. Ejecutar script de refactorización
  3. Actualizar event-handler-registry.js para parsed parámetros
  4. Validar sintaxis JavaScript (node -c en todos los archivos)
  5. Testing manual en navegador

- **Validación:**
  - [ ] 400+ handlers refactorizados correctamente
  - [ ] Sintaxis válida (0 errores)
  - [ ] Funcionalidad preservada (no breaking changes)
  - [ ] PR creado con cambios

---

#### **TAREA 2.3: 🟡 ALTA - Testing FASE 2.4**
- **Prioridad:** 🟡 ALTA
- **Duración:** 1-2 horas
- **Estado:** ⏳ PENDIENTE (después de TAREA 2.2)
- **Descripción:** Validar que refactorización no rompió nada
- **Checklist:**
  - [ ] Admin dashboard: todos los botones funcionan
  - [ ] Formularios: envío de datos funciona
  - [ ] Modales: abrir/cerrar funciona
  - [ ] Operaciones con parámetros: eliminación, edición, etc.
  - [ ] Navegación: links y botones de navegación
  - [ ] Console: sin errores JavaScript

- **Resultado:** Documento `docs/FASE-2.4-TESTING-RESULTS.md`

---

### **BLOQUE 3: FASE 1.7 - CIERRE ADMINISTRATIVO (Mañana - 30 minutos)**

#### **TAREA 3.1: 🔵 BAJA - Commit Final FASE 1**
- **Prioridad:** 🔵 BAJA (Administrativo)
- **Duración:** 30 minutos
- **Estado:** ⏳ PENDIENTE
- **Descripción:** Consolidar FASE 1 con commit final
- **Pasos:**
  1. Crear rama: `git checkout -b docs/phase-1-closure`
  2. Crear archivo: `docs/FASE-1-COMPLETADA-RESUMEN-FINAL.md` (1-2 páginas)
  3. Actualizar CHANGELOG.md con entrada v2.25.0
  4. Commit: `docs(phase-1): Mark PHASE 1 as complete - all security remediations finished`
  5. Push y crear PR
  6. Merge a main

- **Contenido `FASE-1-COMPLETADA-RESUMEN-FINAL.md`:**
  ```
  - FASE 1.1 - 1.6: ✅ Completadas
  - Vulnerabilidades críticas: ✅ Remediadas (19 riesgos)
  - XSS sanitization: ✅ 9 archivos con DOMPurify
  - Logging GDPR: ✅ 10 TOP críticos migrados
  - Puntuación seguridad: 40/100 → 60/100
  - Timeline: 11 Nov 2025
  ```

---

### **BLOQUE 4: FASE 2 BLOQUE 4 - SANITIZACIÓN MEDIO (Semana 2 - 8-10 horas)**

#### **TAREA 4.1: 🟡 ALTA - Sanitización 62 archivos MEDIO**
- **Prioridad:** 🟡 ALTA
- **Duración:** 8-10 horas
- **Estado:** ⏳ PENDIENTE (después de FASE 2.4)
- **Descripción:** Aplicar DOMPurify a 62 archivos con prioridad MEDIA
- **Patrón:** Sanitizar innerHTML, insertAdjacentHTML, setAttribute

- **Proceso Similar a FASE 2 Bloque 3:**
  1. Crear rama: `git checkout -b security/phase-2-block-4`
  2. Ejecutar script de sanitización
  3. Validar sintaxis
  4. Testing manual
  5. PR y merge

- **Resultado:**
  - Código: Todos los 62 archivos sanitizados
  - Documentación: `docs/FASE-2-BLOQUE-4-RESULTADOS.md`
  - Validación: Testing report

---

### **BLOQUE 5: FASE 1 TAREA 2 - GDPR LOGS (Semana 2-3 - 4-6 horas)**

#### **TAREA 5.1: 🟡 ALTA - Migración GDPR Logs TOP 10 Restantes**
- **Prioridad:** 🟡 ALTA (GDPR Compliance)
- **Duración:** 2-3 horas
- **Estado:** ⏳ PENDIENTE
- **Descripción:**
  - 10 TOP logs críticos YA migrados
  - 256 logs restantes requieren migración
  - Priorizar los TOP 10 siguientes primero

- **Pasos:**
  1. Identificar TOP 10 siguientes logs críticos
  2. Crear rama: `git checkout -b security/gdpr-logs-phase2`
  3. Reemplazar console.log con devLogger en archivos críticos
  4. Validar que devLogger enmascare datos sensibles
  5. Testing de funcionalidad

- **Validación:**
  - [ ] Tokens no expuestos en logs
  - [ ] Emails no expuestos en logs
  - [ ] IDs de usuario enmascarados
  - [ ] Funcionalidad preservada

---

### **BLOQUE 6: TESTING MANUAL COMPLETO (Semana 3 - 2-3 horas)**

#### **TAREA 6.1: 🟢 MEDIA - Testing Exhaustivo de Funcionalidades**
- **Prioridad:** 🟢 MEDIA
- **Duración:** 2-3 horas
- **Estado:** ⏳ PENDIENTE (después de todos los fixes)
- **Descripción:** Validar que todas las funcionalidades críticas funcionan
- **Checklist:**
  - [ ] **Autenticación:** Login Google, Login Manual, Logout
  - [ ] **Dashboard Admin:** Todos los tabs cargan, datos correctos
  - [ ] **Formularios:** Citas, Bolsa de Trabajo, Egresados, Contacto
  - [ ] **API Endpoints:** 28 nuevas rutas accesibles
  - [ ] **Multi-tenant:** Configuración por dominio funciona
  - [ ] **Security:** CSP sin violaciones, XSS sanitized
  - [ ] **Performance:** LCP < 2.5s, no memory leaks

- **Documentación:** `docs/TESTING-MANUAL-RESULTS.md` (1-2 páginas)

---

## 📊 RESUMEN EJECUTABLE

| # | Tarea | Bloque | Horas | Estado | Aprobado |
|---|-------|--------|-------|--------|----------|
| 1.1 | Fix Tenant Fallback | CRÍTICA | 0.5 | ⏳ | ? |
| 1.2 | Validar tenants BD | CRÍTICA | 0.1 | ⏳ | ? |
| 1.3 | Deployment Vercel | CRÍTICA | 0.3 | ⏳ | ? |
| 2.1 | Análisis Pattern B | FASE 2.4 | 1 | ⏳ | ? |
| 2.2 | Refactor Pattern B | FASE 2.4 | 3.5 | ⏳ | ? |
| 2.3 | Testing FASE 2.4 | FASE 2.4 | 1.5 | ⏳ | ? |
| 3.1 | Commit FASE 1 | Admin | 0.5 | ⏳ | ? |
| 4.1 | Sanitización 62 arch | FASE 2 | 9 | ⏳ | ? |
| 5.1 | GDPR Logs TOP 10 | FASE 1 | 3 | ⏳ | ? |
| 6.1 | Testing Manual | Validación | 2.5 | ⏳ | ? |

**TOTAL TIEMPO ESTIMADO:** 21.8 horas (3-4 semanas)

---

## 🎯 CRONOGRAMA RECOMENDADO

### **HOY (14 Nov - 1 hora)**
- ✅ TAREA 1.1: Fix Tenant Fallback
- ✅ TAREA 1.2: Validar tenants
- ✅ TAREA 1.3: Deploy a Vercel

### **MAÑANA (15 Nov - 1.5 horas)**
- ✅ TAREA 3.1: Commit FASE 1
- ✅ TAREA 2.1: Análisis Pattern B (inicio)

### **ESTA SEMANA (16-18 Nov - 4 horas)**
- ✅ TAREA 2.1: Análisis Pattern B (completar)
- ✅ TAREA 2.2: Refactor Pattern B
- ✅ TAREA 2.3: Testing FASE 2.4

### **SEMANA 2 (19-22 Nov - 8 horas)**
- ✅ TAREA 4.1: Sanitización 62 archivos
- ✅ TAREA 5.1: GDPR Logs (inicio)

### **SEMANA 3 (23-25 Nov - 3.5 horas)**
- ✅ TAREA 5.1: GDPR Logs (completar)
- ✅ TAREA 6.1: Testing Manual

---

## 🔐 CONSIDERACIONES CRÍTICAS

### **Para TAREA 1.1 (Tenant Fallback):**
- ⚠️ **CRÍTICO:** Sin este fix, producción está caída
- Verificar que tenant por defecto (localhost o ID=1) existe
- Después del fix, TODOS los dominios Vercel usarán el tenant por defecto

### **Para TAREA 2.2 (Pattern B):**
- ⚠️ **RIESGO:** Refactorizar 400+ handlers requiere testing exhaustivo
- Considerar hacer en pequeños chunks (50 handlers por vez)
- Validar cada chunk antes de siguiente

### **Para TAREA 4.1 (Sanitización):**
- ⚠️ **RIESGO:** 62 archivos es mucho, considerar automatización
- Crear script de sanitización antes de aplicar manualmente
- Testing extra importante para preservar funcionalidad

---

## ✅ APROBACIÓN REQUERIDA

**Por favor confirma o sugiere cambios para:**

1. ¿Apruebas el orden de ejecución?
2. ¿Necesitas agregar/remover tareas?
3. ¿Hay cambios en las duraciones estimadas?
4. ¿Hay dependencias que cambien el cronograma?
5. ¿Hay tareas de MÁXIMA prioridad que no están listadas?

**Responde y podré comenzar INMEDIATAMENTE con TAREA 1.1.**

---

**Estado:** LISTO PARA APROBACIÓN
**Última Actualización:** 14 Nov 2025
**Próxima Acción:** Esperar tu aprobación para TAREA 1.1
