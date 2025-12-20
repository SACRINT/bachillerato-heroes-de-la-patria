# 🔑 AUTENTICACIÓN REAL CON PostgreSQL EN VERCEL (v2.30.15)

**Fecha:** 15 de Diciembre 2025
**Versión:** v2.30.15
**Status:** ✅ IMPLEMENTADO Y PUSHEADO A GITHUB

---

## 📋 RESUMEN DE CAMBIOS

El endpoint `/api/auth/login` en Vercel ahora conecta **DIRECTAMENTE a la base de datos PostgreSQL (Neon)** en lugar de usar demo users.

### ¿Qué cambió?

| Antes | Ahora |
|-------|-------|
| Demo users locales (`admin@test.com` / `admin123`) | Usuarios reales de tabla `usuarios` en PostgreSQL |
| No había conexión a BD | Conexión real a Neon con SSL |
| Validación de contraseña hardcodeada | Validación con bcrypt contra `password_hash` |
| Roles demo | Roles y permisos desde la BD |

---

## 🚀 QUÉ ESPERAR DESPUÉS DEL REDEPLOY

### Paso 1: Vercel Redeploy (Automático - 1-5 minutos)
1. Vercel detecta los cambios en GitHub
2. Instala las 3 nuevas dependencias:
   - `pg` (PostgreSQL client)
   - `bcryptjs` (password verification)
   - `jsonwebtoken` (token generation)
3. Despliega la nueva versión

### Paso 2: Probar Login en Producción

**Usa un usuario REAL de tu tabla `usuarios` en Neon:**

```bash
# Opción 1: Desde consola del navegador
curl -X POST https://bge-heroesdelapatria.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"TU_EMAIL_AQUI@example.com","password":"TU_CONTRASEÑA"}'

# Opción 2: Directamente en el navegador (F12 → Console)
fetch('https://bge-heroesdelapatria.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'TU_EMAIL@example.com', password: 'TU_CONTRASEÑA'})
}).then(r => r.json()).then(d => console.log(d))
```

### Paso 3: Respuesta Esperada (HTTP 200)

Si el usuario existe y la contraseña es correcta:

```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "user": {
    "id": 123,
    "uuid": "...",
    "email": "usuario@example.com",
    "username": "usuario",
    "nombre": "Juan",
    "apellido_paterno": "Pérez",
    "role": "estudiante",
    "permissions": ["read_profile", "read_grades", ...]
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "accessTokenExpiry": 1702710000,
    "refreshTokenExpiry": 1703315000,
    "tokenType": "Bearer"
  }
}
```

### Paso 4: Si algo falla

**Error 401 - Usuario no encontrado o contraseña incorrecta:**
```json
{
  "success": false,
  "error": "Credenciales inválidas",
  "message": "Email o contraseña incorrectos"
}
```

**Causas posibles:**
- ❌ Usuario no existe en tabla `usuarios`
- ❌ Usuario tiene `status != 'activo'` en la BD
- ❌ Contraseña es incorrecta
- ❌ El campo email NO coincide exactamente (mayúsculas/minúsculas)

**Error 500 - Error del servidor:**
```json
{
  "success": false,
  "error": "Error interno del servidor",
  "message": "..."
}
```

**Causas posibles:**
- ❌ `DATABASE_URL` no está configurada en Vercel
- ❌ La tabla `usuarios` no existe o tiene estructura diferente
- ❌ El campo `password_hash` no existe en la tabla

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Vercel completó el redeploy exitosamente
- [ ] Las 3 dependencias se instalaron (pg, bcryptjs, jsonwebtoken)
- [ ] DATABASE_URL está configurada en Vercel Environment Variables
- [ ] POST /api/auth/login retorna HTTP 200 (con usuario válido)
- [ ] JWT accessToken se genera correctamente
- [ ] Permisos se asignan según el role del usuario
- [ ] Las contraseñas se validan con bcrypt

---

## 🔍 VERIFICACIÓN TÉCNICA

### 1. Verificar que DATABASE_URL está seteada

En Vercel Dashboard:
```
Dashboard → Settings → Environment Variables
```

Debe haber una variable `DATABASE_URL` con la cadena de conexión a Neon PostgreSQL.

### 2. Verificar estructura de tabla `usuarios`

Conectar a Neon console:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usuarios';
```

Campos requeridos:
- `id` (integer/bigint)
- `email` (varchar) - **REQUERIDO**
- `password_hash` (varchar) - **REQUERIDO**
- `status` (varchar) - Debe ser 'activo' para poder loguear
- `role` (varchar) - admin, docente, estudiante, padre
- `nombre`, `apellido_paterno`, `uuid` (recomendados)

### 3. Verificar logs en Vercel

Vercel Dashboard → Functions → Logs

Busca `[AUTH]` para ver los logs de autenticación:
```
[AUTH] Login attempt for email: usuario@example.com
[AUTH] Login exitoso para: usuario@example.com role: estudiante
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problema: "Credenciales inválidas" pero el usuario existe

**Causa:** La tabla `usuarios` usa estructura diferente

**Solución:**
1. Verifica los nombres exactos de columnas:
   - Debe ser `password_hash` (no `password`)
   - Debe ser `status` (no `active`)
2. Verifica que los hashes estén en formato bcrypt (empiezan con `$2a$`, `$2b$`, o `$2y$`)

### Problema: "Error interno del servidor" (HTTP 500)

**Causa:** DATABASE_URL no configurada o BD no accesible

**Solución:**
1. Verifica Vercel Environment Variables (debe haber DATABASE_URL)
2. Verifica que la conexión a Neon es correcta:
   ```bash
   psql "postgresql://user:password@host:5432/database"
   ```
3. Verifica logs en Vercel para ver el error exacto

### Problema: "Cannot find module 'pg'"

**Causa:** Las dependencias no se instalaron correctamente

**Solución:**
1. Elimina `node_modules` y `package-lock.json` de `/api`
2. En Vercel, fuerza un redeploy manual:
   - Dashboard → Deployments → Select latest → Redeploy

---

## 📚 REFERENCIA: ROLES Y PERMISOS

| Role | Permisos |
|------|----------|
| **admin** | manage_users, manage_grades, manage_notifications, manage_reports, read_analytics |
| **docente** | read_students, manage_grades, read_attendance, manage_assignments, read_analytics |
| **estudiante** | read_profile, read_grades, read_attendance, view_assignments, submit_assignments |
| **padre** | read_student_profile, read_grades, read_attendance, contact_teacher |

Los permisos se asignan automáticamente según el `role` en la tabla `usuarios`.

---

## 📝 VARIABLES DE ENTORNO REQUERIDAS EN VERCEL

```
DATABASE_URL = postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET = (cualquier cadena segura, se generó una por defecto pero recomenda cambiarla)
```

---

## ✅ CONCLUSIÓN

**La autenticación real contra PostgreSQL está completamente implementada en Vercel.**

El endpoint `/api/auth/login` ahora:
- ✅ Conecta a Neon PostgreSQL
- ✅ Autentica usuarios reales
- ✅ Valida contraseñas con bcrypt
- ✅ Genera JWT tokens
- ✅ Asigna permisos según role
- ✅ Soporta múltiples roles

**Próximo paso:** Prueba el login con un usuario real de tu base de datos.

---

**v2.30.15 - Autenticación Real en Vercel ✅**
