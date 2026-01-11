# 🧹 PLAN DE LIMPIEZA DE CÓDIGO - FASES INCREMENTALES

**Fecha:** 11 de Enero de 2026  
**Metodología:** Un módulo a la vez, un PR por refactorización  
**Principio:** Nunca romper funcionalidades existentes

---

## 📋 CHECKLIST DE PREREQUISITOS

Antes de comenzar cualquier fase de limpieza:

- [ ] ✅ Backup completo del proyecto
- [ ] ✅ Commit limpio sin cambios pendientes
- [ ] ⏳ Suite de tests E2E para flujos críticos
- [ ] ✅ Documentación de dependencias (MODULE_DEPENDENCY_MAP.md)
- [ ] ✅ Diagnóstico arquitectónico (ARCHITECTURAL_DIAGNOSIS.md)

---

## 🟢 FASE 1: LIMPIEZA SIN RIESGO (Semana 1)

**Objetivo:** Eliminar código que con certeza no se usa.

### Tarea 1.1: Eliminar carpeta _quarantine

```bash
# Ubicación: public/js/_quarantine/
# Archivos: 53 archivos
# Riesgo: NINGUNO (ya están en cuarentena)
```

**Acción:**

```powershell
Remove-Item -Path "public/js/_quarantine" -Recurse -Force
```

**Verificación:** La aplicación debe funcionar igual después.

---

### Tarea 1.2: Eliminar archivos de backup

```bash
# Patrones a eliminar:
# *.backup, *.bak, *.old, *.tmp
# Riesgo: NINGUNO
```

**Archivos a eliminar:**

```
public/js/**/*.backup
public/js/**/*.bak
public/js/**/*.old
public/js/**/*.tmp
backend/**/*.backup
backend/**/*.bak
```

---

### Tarea 1.3: Eliminar carpeta js_backup de rutas

```bash
# Ya eliminada en commit anterior ✅
# backend/routes/js_backup/ - ELIMINADA
```

---

### Tarea 1.4: Limpiar servicios huérfanos del backend

**Servicios a evaluar para eliminación:**

| Servicio | Razón | Acción |
|----------|-------|--------|
| `AITutorService.js` | Reemplazado por ai-tutor.service.js | ✅ YA ELIMINADO |
| `openai-service.js` | Reemplazado por AIService.js | ✅ YA ELIMINADO |
| `deprecated/` folder | Código viejo | Eliminar si existe |

---

## 🟡 FASE 2: CONSOLIDACIÓN DE DUPLICADOS (Semana 2)

**Objetivo:** Reducir archivos duplicados a versiones únicas.

### Tarea 2.1: Consolidar admin-dashboard.js

**Estado actual:**

```
public/js/admin-dashboard.js (65KB)
public/js/admin/admin-dashboard.js (62KB)
```

**Acción:**

1. Comparar ambos archivos
2. Identificar versión más completa
3. Migrar funcionalidades únicas
4. Eliminar duplicado
5. Actualizar imports en HTML

**Verificación:**

- Dashboard admin debe cargar correctamente
- Todas las funciones deben operar

---

### Tarea 2.2: Consolidar Portal de Padres

**Estado actual:**

```
public/js/parent-portal.js (27KB) - USA DATOS MOCK ❌
public/js/parents-portal-manager.js (19KB) - USA API REAL ✅
```

**Acción:**

1. Verificar que `parents-portal-manager.js` tiene toda la funcionalidad
2. Actualizar `padres.html` para usar `parents-portal-manager.js`
3. Eliminar `parent-portal.js`
4. Renombrar `parents-portal-manager.js` → `parent-portal.js`

**Verificación:**

- Login de padres funciona
- Calificaciones cargan desde API
- Asistencia carga desde API

---

### Tarea 2.3: Consolidar context-manager.js

**Estado actual:**

```
public/js/context-manager.js
public/js/mobile/context-manager.js
```

**Acción:**

1. Verificar que ambos son idénticos o identificar diferencias
2. Si son iguales, eliminar uno
3. Si difieren, consolidar funcionalidades

---

### Tarea 2.4: Consolidar api-client.js

**Estado actual:**

```
public/js/api-client.js
public/js/mobile/api-client.js
```

**Acción:**

1. Comparar versiones
2. Crear versión unificada
3. Actualizar imports

---

## 🟠 FASE 3: MODULARIZACIÓN (Semana 3-4)

**Objetivo:** Dividir archivos monolíticos en módulos.

### Tarea 3.1: Modularizar dashboard-manager-2025.js (148KB)

**Módulos objetivo:**

```
De: dashboard-manager-2025.js (148KB)

A:
├── dashboard-core.js (inicialización, layout)
├── dashboard-widgets.js (gestión de widgets)
├── dashboard-charts.js (gráficas)
├── dashboard-stats.js (estadísticas)
├── dashboard-notifications.js
├── dashboard-users.js (si aplica)
└── dashboard-reports.js (si aplica)
```

**Proceso:**

1. Identificar responsabilidades en el archivo
2. Crear módulos separados
3. Mantener API pública
4. Migrar gradualmente

---

### Tarea 3.2: Modularizar unified-auth-system-v2.js (86KB)

**Módulos objetivo:**

```
De: unified-auth-system-v2.js (86KB)

A:
├── auth-core.js (token management)
├── auth-login.js (login flows)
├── auth-google.js (OAuth)
├── auth-session.js (session management)
└── auth-ui.js (modals, forms)
```

---

### Tarea 3.3: Modularizar chatbot.js (93KB)

**Módulos objetivo:**

```
De: chatbot.js (93KB)

A:
├── chatbot-core.js
├── chatbot-ui.js
├── chatbot-ai.js (conexión con backend)
└── chatbot-history.js
```

---

## 🔴 FASE 4: CONSOLIDACIÓN BACKEND (Semana 5-6)

**Objetivo:** Reducir 177 rutas a ~25 bounded contexts.

### Bounded Contexts Objetivo

```
backend/routes/
├── auth.routes.ts        <- auth, auth-2fa, auth-google, auth-webauthn
├── users.routes.ts       <- users, roles, permissions
├── students.routes.ts    <- students, enrollment
├── grades.routes.ts      <- grades, grades-reports, grades-analytics
├── attendance.routes.ts  <- attendance, justifications
├── parents.routes.ts     <- parents (ya consolidado)
├── teachers.routes.ts    <- teachers-portal
├── messaging.routes.ts   <- messaging (ya consolidado)
├── forums.routes.ts      <- forums (ya consolidado)
├── polls.routes.ts       <- polls (ya listo)
├── gamification.routes.ts <- gamification, iacoins, wallet
├── library.routes.ts     <- digital-library
├── calendar.routes.ts    <- calendar, events
├── notifications.routes.ts
├── appointments.routes.ts <- citas
├── admin.routes.ts       <- admin, dashboard, reports
├── ai.routes.ts          <- ai-tutor, ai-chatbot, ai-gateway
├── config.routes.ts      <- settings, tenant-config
├── uploads.routes.ts     <- uploads, files
└── health.routes.ts      <- health checks
```

### Proceso de Consolidación

1. Crear archivo de ruta consolidada
2. Importar servicios existentes
3. Migrar endpoints uno por uno
4. Mantener rutas viejas como aliases (deprecation)
5. Eliminar rutas viejas después de verificar

---

## 🔵 FASE 5: MULTITENANT (Semana 7-8)

**Objetivo:** Preparar base para SaaS.

### Tarea 5.1: Agregar tenant_id a tablas

```sql
-- Ejemplo de migración
ALTER TABLE usuarios ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE students ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... para todas las tablas
```

### Tarea 5.2: Implementar Row-Level Security

```sql
-- Ejemplo de RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON usuarios
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### Tarea 5.3: Middleware de Tenant

```typescript
// backend/middleware/tenant.ts
export const resolveTenant = async (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'] || extractFromSubdomain(req);
    req.tenantId = tenantId;
    await pool.query("SET app.current_tenant = $1", [tenantId]);
    next();
};
```

---

## 📊 MÉTRICAS DE PROGRESO

### Semana 1 (Fase 1)

- [ ] Archivos eliminados: 0 → 53 (_quarantine)
- [ ] Archivos backup eliminados: 0 → ~20

### Semana 2 (Fase 2)

- [ ] Duplicados consolidados: 0 → 5
- [ ] Frontend JS: 380 → 375

### Semana 3-4 (Fase 3)

- [ ] Archivos monolíticos divididos: 0 → 3
- [ ] Nuevos módulos: 0 → 15

### Semana 5-6 (Fase 4)

- [ ] Rutas backend: 177 → 25
- [ ] Servicios: 262 → ~50

### Semana 7-8 (Fase 5)

- [ ] Tablas con tenant_id: 0 → todas
- [ ] RLS habilitado: No → Sí

---

## ✅ VERIFICACIÓN POR FASE

### Checklist Post-Fase 1

- [ ] Aplicación carga sin errores
- [ ] Login funciona
- [ ] Dashboard admin accesible
- [ ] Calificaciones visibles

### Checklist Post-Fase 2

- [ ] Portal de padres funciona con API real
- [ ] No hay archivos duplicados
- [ ] No hay errores en consola

### Checklist Post-Fase 3

- [ ] Módulos se cargan correctamente
- [ ] No hay regresiones en funcionalidad
- [ ] Performance igual o mejor

### Checklist Post-Fase 4

- [ ] Todas las APIs responden correctamente
- [ ] No hay endpoints rotos
- [ ] Documentación de API actualizada

### Checklist Post-Fase 5

- [ ] Aislamiento de datos por tenant
- [ ] Login multitenant funciona
- [ ] Configuración por institución

---

## 🚫 REGLAS INQUEBRANTABLES

1. **Un cambio a la vez:** No refactorizar múltiples sistemas simultáneamente
2. **Un PR por cambio:** Cada tarea genera un PR independiente
3. **Tests antes de merge:** No mergear sin verificar funcionalidad
4. **Documentar todo:** Cada cambio debe documentar qué se tocó
5. **Rollback ready:** Siempre tener forma de volver atrás
6. **No romper producción:** Si algo falla, revertir inmediatamente

---

## 📌 PRÓXIMA ACCIÓN INMEDIATA

**Ejecutar Fase 1, Tarea 1.1:**

```powershell
# Eliminar carpeta _quarantine
Remove-Item -Path "public/js/_quarantine" -Recurse -Force

# Commit
git add -A
git commit -m "chore: Remove quarantined JS files (53 files) - Phase 1.1"
git push
```

**¿Proceder con Fase 1.1?**
