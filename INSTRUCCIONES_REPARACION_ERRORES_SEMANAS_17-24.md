# 🔧 INSTRUCCIONES DE REPARACIÓN - ERRORES SEMANAS 17-24

**Fecha:** 17 Noviembre 2025
**Arquitecto:** [Tu nombre]
**Rama:** `claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`
**Acción:** Reparar errores ANTES de mergear a main
**Tiempo estimado:** 90-120 minutos

---

## 📋 RESUMEN EJECUTIVO

Se completó la validación de las **Semanas 17-24** (ML/AI + Mobile) en rama del arquitecto.

**Resultado:**
- ✅ Código creado: 32 archivos, 11,430+ líneas
- ❌ Errores encontrados: **7 errores críticos + warnings**
- 🔴 Servidor NO puede iniciar (bloqueador)
- 🔴 Base de datos tiene errores de schema (bloqueador)

**Estado:** PROYECTO NO PUEDE FUNCIONAR hasta que se reparen estos errores.

---

## 🚨 ERRORES CRÍTICOS (PRIORIDAD ALTA)

### ERROR 1: Module Not Found - authMiddleware (BLOQUEADOR)
**Severidad:** 🔴 CRÍTICA - Servidor no inicia
**Impacto:** Servidor backend crashea al arrancar

**Descripción:**
```
Error: Cannot find module '../middleware/authMiddleware'
Require stack:
- backend/routes/reports.js
- backend/routes/webhooks.js
- backend/routes/search.js
- backend/routes/notifications-realtime.js
```

**Causa Raíz:**
- 4 archivos intentan importar `../middleware/authMiddleware`
- El archivo correcto es `../middleware/auth` (sin "Middleware" al final)
- Typo en nombre del módulo

**Archivos Afectados:**
1. `backend/routes/reports.js` línea 9
2. `backend/routes/webhooks.js` línea 19
3. `backend/routes/search.js` línea 11
4. `backend/routes/notifications-realtime.js` línea 16

**SOLUCIÓN:**

**Archivo 1: backend/routes/reports.js**

```javascript
// ❌ INCORRECTO (línea 9):
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ CORRECTO:
const { authMiddleware } = require('../middleware/auth');
```

**Archivo 2: backend/routes/webhooks.js**

```javascript
// ❌ INCORRECTO (línea 19):
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ CORRECTO:
const { authMiddleware } = require('../middleware/auth');
```

**Archivo 3: backend/routes/search.js**

```javascript
// ❌ INCORRECTO (línea 11):
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ CORRECTO:
const { authMiddleware } = require('../middleware/auth');
```

**Archivo 4: backend/routes/notifications-realtime.js**

```javascript
// ❌ INCORRECTO (línea 16):
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ CORRECTO:
const { authMiddleware } = require('../middleware/auth');
```

**Pasos de Reparación:**

1. Abre cada uno de los 4 archivos
2. Busca la línea que contiene `require('../middleware/authMiddleware')`
3. Reemplaza `authMiddleware` por `auth`
4. Guarda cada archivo
5. Verificación:
   ```bash
   node -c backend/routes/reports.js
   node -c backend/routes/webhooks.js
   node -c backend/routes/search.js
   node -c backend/routes/notifications-realtime.js
   ```

**Commit esperado:**
```bash
git add backend/routes/reports.js backend/routes/webhooks.js backend/routes/search.js backend/routes/notifications-realtime.js
git commit -m "fix(routes): Corregir import de authMiddleware -> auth

- Cambiar '../middleware/authMiddleware' a '../middleware/auth' en 4 archivos
- reports.js línea 9
- webhooks.js línea 19
- search.js línea 11
- notifications-realtime.js línea 16
- Fix MODULE_NOT_FOUND error que previene servidor de iniciar"
```

---

### ERROR 2: Column "nombre" does not exist (BLOQUEADOR)
**Severidad:** 🔴 CRÍTICA - Queries fallan
**Impacto:** Tenant context NO funciona, queries de BD fallan repetidamente

**Descripción:**
```
[TENANT-CONTEXT] Error obteniendo config de tenant default: column "nombre" does not exist
```

**Frecuencia:** Este error aparece 50+ veces en logs del servidor

**Causa Raíz:**
- El middleware `tenant-context-advanced.js` intenta leer columna `nombre` de tabla `tenants`
- La columna `nombre` **SÍ EXISTE** en la tabla `tenants` (fue creada en commit anterior)
- **PERO:** El SQL que ejecuta el arquitecto tiene un problema

**VERIFICACIÓN:**
En Neon Console, la columna SÍ existe:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tenants' AND column_name = 'nombre';
-- Resultado: nombre (existe)
```

**Causa Probable:**
- El query en `tenant-context-advanced.js` puede estar mal escrito
- O la conexión de BD no tiene permisos para esa columna
- O hay un typo en el nombre de la columna en el query

**SOLUCIÓN:**

**1. Abre el archivo:**
```bash
code backend/middleware/tenant-context-advanced.js
```

**2. Busca queries que usen columna `nombre`:**

Busca con `Ctrl+F`: `nombre`

**3. Verifica sintaxis:**

❌ **INCORRECTO (ejemplo posible):**
```javascript
SELECT id, nombre, domain, config_json
FROM tenant  -- ← Error: debe ser "tenants" (plural)
```

✅ **CORRECTO:**
```javascript
SELECT id, nombre, domain, config_json
FROM tenants  -- ← Plural
WHERE domain = $1
```

**4. Si el error persiste, revisar:**

```javascript
// Verificar que este query esté correcto:
const query = `
    SELECT id, nombre, domain, config_json, status
    FROM tenants
    WHERE domain = $1 AND status = 'activo'
`;
```

**5. Opcional: Verificar en Neon que columna existe:**

Ejecuta en Neon Console:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Debe mostrar:
-- id, uuid, schema_name, school_name, domain, config_json, status, admin_email, admin_phone, created_at, updated_at, nombre
```

**Commit esperado:**
```bash
git add backend/middleware/tenant-context-advanced.js
git commit -m "fix(tenant-context): Corregir query de columna nombre

- Verificar sintaxis SQL para columna 'nombre' en tabla tenants
- Asegurar que nombre de tabla sea 'tenants' (plural)
- Fix error repetido 'column nombre does not exist'"
```

---

### ERROR 3: RLS Context - Syntax Error at or near "$1" (BLOQUEADOR)
**Severidad:** 🔴 CRÍTICA - Security policies fallan
**Impacto:** Row-Level Security NO funciona

**Descripción:**
```
[TENANT-CONTEXT] Error configurando RLS context: syntax error at or near "$1"
```

**Frecuencia:** 30+ veces en logs

**Causa Raíz:**
- El middleware intenta configurar Row-Level Security (RLS) en PostgreSQL
- El SQL para `SET LOCAL` tiene sintaxis incorrecta
- PostgreSQL no acepta placeholders `$1` en `SET LOCAL`

**Ejemplo de error común:**
```sql
-- ❌ INCORRECTO:
SET LOCAL app.current_tenant_id = $1;  -- PostgreSQL NO permite $1 en SET LOCAL
```

**SOLUCIÓN:**

**1. Abre el archivo:**
```bash
code backend/middleware/tenant-context-advanced.js
```

**2. Busca queries con `SET LOCAL`:**

Busca con `Ctrl+F`: `SET LOCAL`

**3. Identifica el error:**

❌ **INCORRECTO:**
```javascript
const query = `SET LOCAL app.current_tenant_id = $1`;
await pool.query(query, [tenantId]);
```

✅ **CORRECTO (Opción A - String interpolation):**
```javascript
const query = `SET LOCAL app.current_tenant_id = '${tenantId}'`;
await pool.query(query);
```

✅ **CORRECTO (Opción B - Template literal):**
```javascript
await pool.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
```

**4. ADVERTENCIA DE SEGURIDAD:**

Si usas string interpolation, **DEBES validar** que `tenantId` sea un número/UUID válido:

```javascript
// Validar antes de usar en query
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
    throw new Error('Invalid tenant ID');
}
await pool.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
```

**5. Verificación:**

Ejecuta en Neon Console para confirmar sintaxis:
```sql
BEGIN;
SET LOCAL app.current_tenant_id = '1';  -- Usar valor literal, NO $1
SHOW app.current_tenant_id;
ROLLBACK;
```

**Commit esperado:**
```bash
git add backend/middleware/tenant-context-advanced.js
git commit -m "fix(rls): Corregir sintaxis PostgreSQL en SET LOCAL

- Cambiar SET LOCAL app.current_tenant_id = \$1 a usar valor literal
- PostgreSQL no permite placeholders en SET LOCAL statements
- Agregar validación de tenantId antes de usar en query
- Fix error 'syntax error at or near \"\$1\"'"
```

---

### ERROR 4: Column "fecha_registro" does not exist
**Severidad:** 🟡 ALTA - Endpoint falla
**Impacto:** `/api/admin/finances` retorna error 500

**Descripción:**
```
[FINANCES] ❌ Error obteniendo datos financieros: {
  message: 'column "fecha_registro" does not exist',
  code: '42703',
  context: 'finances'
}
```

**Causa Raíz:**
- El endpoint de finanzas intenta leer columna `fecha_registro`
- La tabla tiene columna `created_at` o `fecha` pero NO `fecha_registro`

**SOLUCIÓN:**

**1. Verificar schema en Neon:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name IN ('ingresos', 'gastos', 'pagos_pendientes')
ORDER BY table_name, ordinal_position;
```

**2. Identificar nombre correcto de columna:**

Posibles nombres:
- `created_at` (estándar)
- `fecha` (español)
- `fecha_creacion`

**3. Abre el archivo:**
```bash
code backend/routes/finances.js
```

**4. Busca `fecha_registro`:**

❌ **INCORRECTO (ejemplo):**
```sql
SELECT id, concepto, monto, fecha_registro
FROM ingresos
```

✅ **CORRECTO (reemplazar con nombre real):**
```sql
SELECT id, concepto, monto, created_at AS fecha_registro
FROM ingresos
```

O si la columna se llama `fecha`:
```sql
SELECT id, concepto, monto, fecha AS fecha_registro
FROM ingresos
```

**5. Aplicar mismo cambio en:**
- Queries de `ingresos`
- Queries de `gastos`
- Queries de `pagos_pendientes`

**Commit esperado:**
```bash
git add backend/routes/finances.js
git commit -m "fix(finances): Corregir nombre de columna fecha_registro

- Cambiar 'fecha_registro' a 'created_at' (o nombre correcto de columna)
- Usar alias AS fecha_registro para mantener compatibilidad con frontend
- Fix error 42703 'column fecha_registro does not exist'"
```

---

## ⚠️ WARNINGS (PRIORIDAD MEDIA)

### WARNING 1: OpenAI API Key Inválida
**Severidad:** 🟡 MEDIA - Feature AI no funciona
**Impacto:** Chatbot GPT-4 y ML predictions no funcionan

**Descripción:**
```
[WARN] ⚠️ Error configurando OpenAI: 401 Incorrect API key provided: sk-your-***************here
```

**Causa Raíz:**
- Variable de entorno `OPENAI_API_KEY` tiene valor placeholder
- Clave API real no está configurada

**SOLUCIÓN:**

**IMPORTANTE:** Esta reparación requiere que el **USUARIO/PM** proporcione la API key real de OpenAI.

**Para el Arquitecto:**

No puedes reparar esto tú mismo porque requiere credenciales privadas.

**Instrucciones para el Usuario/PM:**

1. Obtener API key de OpenAI:
   - Ve a: https://platform.openai.com/api-keys
   - Crea una nueva API key
   - Cópiala (solo se muestra una vez)

2. Configurar en entorno local:
   ```bash
   # En archivo .env (si existe)
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # O exportar en terminal:
   export OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Para producción (Vercel):
   - Ve a: https://vercel.com/[tu-proyecto]/settings/environment-variables
   - Agrega: `OPENAI_API_KEY` = `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Redeploy

**Documentación para incluir en proyecto:**

Crea archivo: `.env.example`
```
# AI Services
OPENAI_API_KEY=sk-proj-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password-here
```

**No requiere commit** (es configuración de entorno)

---

### WARNING 2: Anthropic API Key Inválida
**Severidad:** 🟡 MEDIA - Feature AI alternativa no funciona
**Impacto:** Fallback de Claude API no disponible

**Descripción:**
```
[WARN] ⚠️ Error configurando Anthropic: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}
```

**Causa Raíz:**
- Similar a WARNING 1
- Variable `ANTHROPIC_API_KEY` no configurada

**SOLUCIÓN:**

Igual que WARNING 1, pero con Anthropic:

1. Obtener API key: https://console.anthropic.com/settings/keys
2. Configurar en `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Configurar en Vercel (producción)

**No requiere commit** (es configuración de entorno)

---

## 📊 RESUMEN DE ERRORES

| # | Error | Severidad | Impacto | Tiempo Reparación |
|---|-------|-----------|---------|-------------------|
| 1 | authMiddleware import | 🔴 CRÍTICA | Servidor no inicia | 10 min |
| 2 | Column nombre not exist | 🔴 CRÍTICA | Tenant context falla | 20 min |
| 3 | RLS syntax error $1 | 🔴 CRÍTICA | Security policies fallan | 30 min |
| 4 | Column fecha_registro | 🟡 ALTA | Finances endpoint falla | 15 min |
| 5 | OpenAI API key | 🟡 MEDIA | AI features no funcionan | 5 min (PM) |
| 6 | Anthropic API key | 🟡 MEDIA | AI fallback no funciona | 5 min (PM) |
| **TOTAL** | **6 errores** | | | **75-90 min** |

---

## ✅ ORDEN DE REPARACIÓN RECOMENDADO

### FASE 1: Errores Bloqueadores (40 minutos)
1. ✅ **ERROR 1** - authMiddleware import (10 min)
   - Sin este fix, servidor NO inicia
2. ✅ **ERROR 2** - Column nombre (20 min)
   - Sin este fix, tenant context NO funciona
3. ✅ **ERROR 3** - RLS syntax (30 min)
   - Sin este fix, security falla

**Verificación después de FASE 1:**
```bash
# Servidor debe iniciar sin errores críticos
npm start

# Debe ver en logs:
# "✅ Servidor backend iniciado en http://localhost:3000"
# SIN errores de MODULE_NOT_FOUND o column not exist
```

### FASE 2: Errores de Features (15 minutos)
4. ✅ **ERROR 4** - Column fecha_registro (15 min)

**Verificación después de FASE 2:**
```bash
curl http://localhost:3000/api/admin/finances
# Debe retornar JSON sin error 500
```

### FASE 3: Configuración de Entorno (Usuario/PM)
5. ⏳ **WARNING 1** - OpenAI API key (PM configura)
6. ⏳ **WARNING 2** - Anthropic API key (PM configura)

---

## 🔍 TESTING DESPUÉS DE REPARACIONES

### TEST 1: Servidor Inicia Correctamente
```bash
npm start

# ✅ Esperado:
# "✅ Servidor backend iniciado en http://localhost:3000"
# NO debe haber errores de MODULE_NOT_FOUND
```

### TEST 2: Endpoints Responden
```bash
# Test health
curl http://localhost:3000/api/health

# Test tenant config
curl http://localhost:3000/api/config/tenant

# Test finances
curl http://localhost:3000/api/admin/finances
```

### TEST 3: Console de Navegador
Abrir en navegador:
```
http://localhost:3000/index.html
http://localhost:3000/admin-dashboard.html
http://localhost:3000/estudiantes.html
http://localhost:3000/padres.html
```

En DevTools (F12) → Console:
- ✅ NO debe haber errores rojos
- ⚠️ Warnings aceptables: API keys (si PM no configuró)

### TEST 4: Network Tab
En DevTools (F12) → Network:
- ✅ Todos los requests deben ser 200 OK o 304 Cached
- ❌ NO debe haber 500 Internal Server Error
- ❌ NO debe haber 404 Not Found

---

## 📋 CHECKLIST PARA EL ARQUITECTO

### Antes de Empezar:
- [ ] Leer este documento completo (15 min)
- [ ] Entender cada error
- [ ] Tener rama correcta: `claude/phase-2-performance-block-014w9WxgnJEB2ALWWPJXEBKf`

### Durante Reparaciones:
- [ ] ERROR 1: authMiddleware import (4 archivos)
- [ ] ERROR 2: Column nombre query syntax
- [ ] ERROR 3: RLS SET LOCAL syntax
- [ ] ERROR 4: Column fecha_registro

### Después de Cada Error:
- [ ] Verificar sintaxis: `node -c archivo.js`
- [ ] Hacer commit individual por error
- [ ] Push a tu rama

### Testing Final:
- [ ] Servidor inicia sin errores
- [ ] Endpoints responden correctamente
- [ ] Console sin errores críticos
- [ ] Network sin 500 errors

### Finalización:
- [ ] Push todos los commits
- [ ] Notificar al PM que reparaciones están completas
- [ ] PM hará merge a main

---

## 🎯 COMMITS ESPERADOS

```bash
# Commit 1 (ERROR 1):
git commit -m "fix(routes): Corregir import de authMiddleware -> auth"

# Commit 2 (ERROR 2):
git commit -m "fix(tenant-context): Corregir query de columna nombre"

# Commit 3 (ERROR 3):
git commit -m "fix(rls): Corregir sintaxis PostgreSQL en SET LOCAL"

# Commit 4 (ERROR 4):
git commit -m "fix(finances): Corregir nombre de columna fecha_registro"
```

**Total:** 4 commits de reparación

---

## 📞 SOPORTE

Si encuentras problemas durante reparación:

1. **Verificar logs del servidor:**
   ```bash
   npm start
   # Leer TODOS los mensajes de error en rojo
   ```

2. **Verificar sintaxis JavaScript:**
   ```bash
   node -c backend/routes/archivo.js
   ```

3. **Verificar sintaxis SQL en Neon:**
   - Copiar query problemático
   - Ejecutar en Neon Console
   - Ver error específico

4. **Contactar al PM** si:
   - Error no está en este documento
   - Reparación requiere cambios de arquitectura
   - Necesitas API keys

---

## 📖 DOCUMENTACIÓN DE REFERENCIA

- PostgreSQL SET LOCAL: https://www.postgresql.org/docs/current/sql-set.html
- Row-Level Security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Node.js require(): https://nodejs.org/api/modules.html
- OpenAI API: https://platform.openai.com/docs

---

**¡Éxito en las reparaciones!** El proyecto está muy cerca de estar 100% funcional.

Una vez completes estos 4 fixes, el proyecto podrá hacer merge a main y deployment a producción.

---

Generado: 17 Noviembre 2025
Validación: Testing en rama del arquitecto
Estado: Listo para reparación

