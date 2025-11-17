# 🏗️ CONTEXTO Y INSTRUCCIONES PARA ARQUITECTO - CONTINUACIÓN DEL PROYECTO

**Fecha:** 17 de Noviembre 2025
**Proyecto:** Bachillerato Héroes de la Patria (BGE) v4.1.0
**Estado:** Validación completada, Reparación de errores PENDIENTE
**Rama Actual:** `claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`

---

## 📋 CONTEXTO GENERAL DEL PROYECTO

### ¿Qué es BGE?
BGE (Bachillerato Héroes de la Patria) es un **sistema educativo integral** desarrollado en Node.js + PostgreSQL + React que incluye:

- **Gestión de Estudiantes:** Dashboard, calificaciones, horarios, asistencia
- **Portal de Padres:** Comunicación, reportes académicos, pagos
- **Portal de Docentes:** Gestión de clases, evaluaciones, tareas
- **Admin Dashboard:** Reportes, aprobaciones, configuración multi-tenant
- **AI Features (NUEVO - Semanas 17-24):** ML models, GPT-4 Chatbot, Predicciones
- **Mobile & PWA:** React Native App, Progressive Web App con offline support

### Versión Actual
- **v4.1.0** - Incluye Semanas 17-24 (ML/AI + Mobile + PWA)
- **Backend:** Node.js + Express
- **Base de Datos:** PostgreSQL 17.5 en Neon
- **Frontend:** Vanilla JavaScript (sin framework) + Bootstrap 5
- **Deployment:** Vercel (producción)

---

## 🚀 ESTADO ACTUAL DEL TRABAJO

### Lo que SE HA COMPLETADO:

#### ✅ Semanas 1-16 (Completadas exitosamente hace 1 semana)
- Autenticación unificada
- Dashboard Admin
- Portales de estudiantes, padres, docentes
- Gestión de solicitudes y aprobaciones
- GDPR compliance
- Security hardening
- **ESTATUS:** En producción en Vercel, funcionando correctamente

#### ✅ Semanas 17-24 (Completadas por arquitecto anterior)
- **Semana 17:** Machine Learning - Student Success Prediction (5 archivos)
- **Semana 18:** AI Chatbot con GPT-4 Turbo (5 archivos)
- **Semana 19:** Recommendation Engine (5 archivos)
- **Semana 20:** Predictive Analytics (4 archivos)
- **Semana 21:** React Native Mobile App (5 archivos)
- **Semana 22:** PWA Enhanced (1 archivo)
- **Semana 23:** Cross-Platform Sync WebSocket (1 archivo)
- **Semana 24:** Documentation v4.1.0 (1 archivo)
- **TOTAL:** 27 archivos nuevos, 11,430+ líneas de código
- **ESTATUS:** Código generado, PERO CON ERRORES (ver sección siguiente)

---

## 🔴 ERRORES ENCONTRADOS (TU TAREA)

Se validó el código de las Semanas 17-24 y se encontraron **7 errores**:

### 🔴 ERRORES CRÍTICOS (BLOQUEAN EL SERVIDOR)

#### ❌ ERROR 1: authMiddleware import incorrecto
**Severidad:** CRÍTICA - El servidor NO inicia
**Archivos afectados:** 4
```
backend/routes/reports.js (línea 9)
backend/routes/webhooks.js (línea 19)
backend/routes/search.js (línea 11)
backend/routes/notifications-realtime.js (línea 16)
```

**Problema:**
```javascript
// ❌ INCORRECTO (archivo no existe)
const { authMiddleware } = require('../middleware/authMiddleware');
```

**Solución:**
```javascript
// ✅ CORRECTO (archivo que existe)
const { authMiddleware } = require('../middleware/auth');
```

**Instrucciones de reparación:**
1. Abre archivo: `backend/routes/reports.js`
2. Ve a línea 9
3. Cambia `authMiddleware` a `auth` en el require
4. Haz lo mismo en los otros 3 archivos (webhooks.js, search.js, notifications-realtime.js)
5. **Verifica:** El servidor debe iniciar sin error MODULE_NOT_FOUND

**Commit esperado:**
```
git add backend/routes/reports.js backend/routes/webhooks.js backend/routes/search.js backend/routes/notifications-realtime.js
git commit -m "fix(routes): Corregir import de authMiddleware -> auth (ERROR 1)"
```

---

#### ❌ ERROR 2: Column "nombre" does not exist
**Severidad:** CRÍTICA - Queries a BD fallan (aparece 50+ veces en logs)
**Archivo:** `backend/middleware/tenant-context-advanced.js`
**Línea:** Aproximadamente línea 45-60

**Problema:**
La query intenta acceder a columna "nombre" que no existe en la tabla. El código probablemente está buscando en tabla incorrecta o el nombre de columna es diferente.

**Cómo identificar:**
1. Abre: `backend/middleware/tenant-context-advanced.js`
2. Busca (Ctrl+F): `column "nombre"`
3. O busca la query SQL que tenga `nombre`
4. Revisa qué tabla estás consultando

**Solución probable:**
- Verificar nombre correcto de columna (podría ser `name`, `tenant_name`, etc.)
- Verificar nombre correcto de tabla (debería ser `tenants` si es config de tenant)
- Actualizar la query SQL con el nombre correcto

**Ejemplo:**
```javascript
// ❌ POSIBLE INCORRECTO
const result = await client.query('SELECT nombre FROM tenants WHERE id = $1');

// ✅ POSIBLE CORRECTO (depende de tu schema)
const result = await client.query('SELECT name FROM tenants WHERE id = $1');
// O
const result = await client.query('SELECT tenant_name FROM tenants WHERE id = $1');
```

**Instrucciones:**
1. Abre el archivo y busca la query problemática
2. Verifica el schema de la tabla con el PM o documentación
3. Corrige el nombre de columna
4. **Testing:** Reinicia servidor, revisa logs, no debería ver "column nombre does not exist"

**Commit esperado:**
```
git add backend/middleware/tenant-context-advanced.js
git commit -m "fix(tenant-context): Corregir query de columna nombre (ERROR 2)"
```

---

#### ❌ ERROR 3: RLS syntax error "$1"
**Severidad:** CRÍTICA - PostgreSQL rechaza sintaxis (aparece 30+ veces en logs)
**Archivo:** `backend/middleware/tenant-context-advanced.js`
**Línea:** Aproximadamente línea 70-90

**Problema:**
PostgreSQL no permite placeholders (`$1`) en `SET LOCAL` statements. La sintaxis es incorrecta.

**Problema específico:**
```javascript
// ❌ INCORRECTO - PostgreSQL rechaza $1 aquí
await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId]);
```

**Solución:**
```javascript
// ✅ CORRECTO - Usar valor literal, NO placeholder
await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
```

**IMPORTANTE - SEGURIDAD:**
Si `tenantId` viene de usuario, debes validar que sea UUID válido:
```javascript
// Validar antes de usar
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
    throw new Error('Invalid tenant ID');
}
await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
```

**Instrucciones:**
1. Abre `backend/middleware/tenant-context-advanced.js`
2. Busca: `SET LOCAL app.current_tenant_id`
3. Si ves `= $1`, cámbialo a `= '${tenantId}'`
4. Agrega validación de UUID
5. **Testing:** Logs no debería mostrar "syntax error at or near $1"

**Commit esperado:**
```
git add backend/middleware/tenant-context-advanced.js
git commit -m "fix(rls): Corregir sintaxis PostgreSQL en SET LOCAL (ERROR 3)"
```

---

#### ❌ ERROR 4: Column "fecha_registro" does not exist
**Severidad:** ALTA - Endpoint /finances falla
**Archivo:** `backend/routes/finances.js`
**Línea:** Aproximadamente línea 30-50

**Problema:**
La query intenta leer columna "fecha_registro" que no existe.

**Solución probable:**
```javascript
// ❌ INCORRECTO
SELECT * FROM ingresos WHERE fecha_registro = $1

// ✅ CORRECTO (probablemente)
SELECT * FROM ingresos WHERE created_at = $1
```

**Nombres de columnas comunes:**
- `created_at` (timestamp estándar)
- `fecha_creacion` (Spanish variant)
- `fecha` (genérico)

**Instrucciones:**
1. Abre `backend/routes/finances.js`
2. Busca: "fecha_registro"
3. Consulta con PM cuál es el nombre correcto de columna
4. Reemplaza en todas las queries
5. **Testing:** Endpoint `/api/finances` debe responder sin error 500

**Commit esperado:**
```
git add backend/routes/finances.js
git commit -m "fix(finances): Corregir nombre de columna fecha_registro (ERROR 4)"
```

---

### 🟡 WARNINGS (No bloquean pero features no funcionan)

#### ⚠️ WARNING 1: OpenAI API key inválida
**Archivo:** Probablemente en `backend/.env` o `api/app.js`
**Impacto:** Chatbot GPT-4 no funciona
**Solución:** Requiere PM configurar key válida (tu responsabilidad como arquitecto es asegurar que la key se lee correctamente)

#### ⚠️ WARNING 2: Anthropic API key inválida
**Archivo:** Probablemente en `backend/.env`
**Impacto:** Fallback AI no funciona
**Solución:** Requiere PM configurar key válida

---

## 📖 ARCHIVOS DE REFERENCIA CON INSTRUCCIONES COMPLETAS

Hay 3 documentos en GitHub que contienen TODO:

### 1. **INSTRUCCIONES_REPARACION_ERRORES_SEMANAS_17-24.md** (975 líneas)
Ubicación: Rama `claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`
Contiene:
- Descripción detallada de cada error
- Causa raíz completa
- Código incorrecto vs correcto
- Pasos exactos de reparación
- Procedimiento de testing
- Commits esperados

**👉 LEE ESTE ARCHIVO PRIMERO antes de hacer cualquier cambio**

### 2. **RESUMEN_VALIDACION_SEMANAS_17-24_PM.md**
Ubicación: Misma rama
Contiene: Resumen para PM, timeline, próximos pasos

### 3. **UBICACION_DOCUMENTACION_GITHUB.md**
Ubicación: Misma rama
Contiene: Cómo acceder a los archivos anteriores

---

## ✅ TU CHECKLIST DE TAREAS

### PASO 1: Preparación (10 minutos)
- [ ] Lee este documento (CONTEXTO_Y_INSTRUCCIONES_PARA_ARQUITECTO_NUEVO.md) - Estás aquí
- [ ] Ve a GitHub y abre: `INSTRUCCIONES_REPARACION_ERRORES_SEMANAS_17-24.md`
- [ ] Lee la sección "Resumen Ejecutivo" del archivo
- [ ] Entiende los 4 errores críticos

### PASO 2: Verificar Estado Local (5 minutos)
En terminal, ejecuta:
```bash
# Asegúrate de estar en la rama correcta
git branch -v

# Debería mostrar (con *)
* claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf

# Si NO es esa rama, cambia con:
git fetch origin
git checkout claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf
```

### PASO 3: Reparar ERROR 1 (10 minutos)
- [ ] Abre 4 archivos (reports.js, webhooks.js, search.js, notifications-realtime.js)
- [ ] Cambia todos los `require('../middleware/authMiddleware')` a `require('../middleware/auth')`
- [ ] Haz commit: `git commit -m "fix(routes): Corregir import de authMiddleware -> auth"`

### PASO 4: Reparar ERROR 2 (20 minutos)
- [ ] Abre `backend/middleware/tenant-context-advanced.js`
- [ ] Busca error "column nombre does not exist"
- [ ] Identifica la query problemática
- [ ] Corrige nombre de columna (probablemente `nombre` → `name` o similar)
- [ ] Haz commit: `git commit -m "fix(tenant-context): Corregir query de columna nombre"`

### PASO 5: Reparar ERROR 3 (30 minutos)
- [ ] Abre `backend/middleware/tenant-context-advanced.js`
- [ ] Busca: `SET LOCAL app.current_tenant_id = $1`
- [ ] Cámbialo a: `SET LOCAL app.current_tenant_id = '${tenantId}'`
- [ ] Agrega validación de UUID si es necesario
- [ ] Haz commit: `git commit -m "fix(rls): Corregir sintaxis PostgreSQL en SET LOCAL"`

### PASO 6: Reparar ERROR 4 (15 minutos)
- [ ] Abre `backend/routes/finances.js`
- [ ] Busca: "fecha_registro"
- [ ] Reemplaza con nombre correcto de columna (probablemente `created_at`)
- [ ] Haz commit: `git commit -m "fix(finances): Corregir nombre de columna fecha_registro"`

### PASO 7: Verificar Todo (10 minutos)
```bash
# Verifica que no hay cambios pendientes
git status

# Debería mostrar: "nothing to commit, working tree clean"

# Verifica que los 4 commits se hicieron
git log --oneline -5

# Debería mostrar tus 4 commits nuevos

# Pushea a GitHub
git push origin claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf
```

### PASO 8: Notificar al PM
Una vez termines:
- [ ] Mensaje al PM: "Completé reparación de 4 errores críticos. Pusheado a rama."
- [ ] Incluye el link a tu rama: `https://github.com/SACRINT/bachillerato-heroes-de-la-patria/tree/claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`

---

## ⏱️ TIMELINE ESTIMADO

| Paso | Tarea | Tiempo |
|------|-------|--------|
| 1 | Preparación + lectura | 10 min |
| 2 | Verificar estado | 5 min |
| 3 | Reparar ERROR 1 | 10 min |
| 4 | Reparar ERROR 2 | 20 min |
| 5 | Reparar ERROR 3 | 30 min |
| 6 | Reparar ERROR 4 | 15 min |
| 7 | Verificar y pushear | 10 min |
| **TOTAL** | | **100 minutos (~1.5 horas)** |

---

## 🔗 LINKS IMPORTANTES

### GitHub
- **Repositorio:** https://github.com/SACRINT/bachillerato-heroes-de-la-patria
- **Rama arquitecto anterior:** `claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`
- **Main (producción):** `main`

### Documentación
- **Instrucciones detalladas:** `INSTRUCCIONES_REPARACION_ERRORES_SEMANAS_17-24.md`
- **Resumen para PM:** `RESUMEN_VALIDACION_SEMANAS_17-24_PM.md`
- **Ubicación de docs:** `UBICACION_DOCUMENTACION_GITHUB.md`

### Stack Técnico
- **Backend:** Node.js + Express
- **BD:** PostgreSQL 17.5 en Neon
- **Frontend:** Vanilla JS + Bootstrap 5
- **Deploy:** Vercel

---

## ⚡ NOTAS IMPORTANTES

### 1. NO CREES RAMA NUEVA
Continúa en la rama: `claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`
No hagas: `git checkout -b nueva-rama`

### 2. USA CLAUDE CODE WEB
El PM comentó que trabajas en Claude Code Web (no local)
- Abre: https://github.com/SACRINT/bachillerato-heroes-de-la-patria
- Click en: "Open in Claude Code" (botón en la interfaz de GitHub)
- Edita directamente en Claude Code Web
- Claude Code te ayudará a hacer commits y pushear

### 3. COMMITS ESPECÍFICOS
Cada fix debe ser UN commit separado con mensaje claro:
```
git commit -m "fix(routes): Descripción específica"
git commit -m "fix(tenant-context): Descripción específica"
git commit -m "fix(rls): Descripción específica"
git commit -m "fix(finances): Descripción específica"
```

### 4. TESTING
Después de cada fix, verifica que no hay errores:
- Revisa logs en terminal
- No debería haber `ERROR` en rojo
- Si hay warnings, es normal (solo errores bloqueadores)

### 5. SI HAY DUDAS
Consulta el archivo `INSTRUCCIONES_REPARACION_ERRORES_SEMANAS_17-24.md` que tiene detalles completos de cada error.

---

## 📊 ESTADO ACTUAL DEL PROYECTO

```
RAMA MAIN (Producción):
├── v4.0.0 (Semanas 1-16) ✅ FUNCIONAL EN VERCEL
│
RAMA ARQUITECTO (Pendiente reparación):
├── v4.1.0 (Semanas 17-24) ⏳ CON ERRORES
├── Código: 32 archivos, 11,430+ líneas
├── Errores encontrados: 7 (4 críticos + 2 warnings + 1 adicional)
├── Status: VALIDADO, LISTO PARA REPARACIÓN
│
PRÓXIMA ACCIÓN:
└── ✅ TÚ REPARAS 4 ERRORES → PM CONFIGURA API KEYS → MERGE A MAIN → DEPLOY VERCEL
```

---

## 🎯 RESUMEN FINAL

**Tu misión:**
1. Leer la documentación de errores (INSTRUCCIONES_REPARACION_ERRORES_SEMANAS_17-24.md)
2. Reparar 4 errores críticos en ~1.5 horas
3. Hacer 4 commits y pushear a la rama
4. Notificar al PM

**El PM después:**
1. Configura 2 API keys (OpenAI + Anthropic)
2. Hace merge a main
3. Deploy automático en Vercel

**Resultado:**
- v4.1.0 con ML/AI, Mobile, PWA completamente funcional en producción 🚀

---

**Bienvenido al proyecto BGE. ¡Adelante con la reparación!**

Generado: 17 de Noviembre 2025
Arquitecto anterior: [Nombre del arquitecto anterior]
Validador: Claude Code
Estado: Listo para reparación
