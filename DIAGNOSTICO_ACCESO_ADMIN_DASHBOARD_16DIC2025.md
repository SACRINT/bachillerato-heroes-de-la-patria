# 🔴 DIAGNÓSTICO: Admin Dashboard Access Denied (16 Diciembre 2025)

**Versión:** v2.30.25
**Status:** 🔧 PROBLEMA IDENTIFICADO Y PARCIALMENTE REPARADO
**Fecha:** 16 Diciembre 2025 (22:00 hrs)

---

## 📋 RESUMEN EJECUTIVO

**Problema Reportado:**
- Usuario logueado como admin (`POST /api/auth/login` retorna 200 con rol "admin")
- Pero al acceder a `admin-dashboard.html` recibe modal: "Acceso restringido: Debes iniciar sesión como administrador"
- Sistema redirige automáticamente a `index.html`

**Root Cause Identificado:**
- **Mismatch de claves en localStorage** entre `unified-auth-system-v2.js` y `dashboard-auth-check.js`
  * `unified-auth-system-v2.js` GUARDA con: `bge_auth_token`, `bge_auth_user`
  * `dashboard-auth-check.js` BUSCA: `authToken`, `userData`
  * **RESULTADO:** Las claves no coinciden → autenticación falla

- **Problema secundario:** Búsqueda solo en `localStorage`
  * `unified-auth-system-v2.js` guarda en `sessionStorage` si usuario NO marca "Recordarme"
  * `dashboard-auth-check.js` SOLO busca en `localStorage`
  * **RESULTADO:** Usuarios sin checkbox marcado pierden autenticación al recargar

---

## 🔍 INVESTIGACIÓN DETALLADA

### 1. Flujo de Login Funcionando ✅

```
Usuario → Header "Administrador" → unified-login-handler.js
         → Modal "Acceso Seguro" abre
         → User ingresa: admin@heroespatria.edu.mx + password
         → POST /api/auth/login
         → Backend: Busca usuario en BD PostgreSQL
         → Backend: Verifica contraseña con bcrypt
         → Backend: Genera JWT token
         → ✅ Backend retorna HTTP 200 CON:
            {
              user: {
                id: ...,
                role: "admin",  ← CRÍTICO: ROLE ESTÁ AQUÍ
                email: "admin@heroespatria.edu.mx",
                nombre: "...",
                ...
              },
              tokens: {
                accessToken: "eyJhbGc...",
                ...
              }
            }
         → unified-auth-system-v2.js recibe respuesta
         → processLogin() es llamado con userData + token
         → ✅ Lo Guarda en storage (localStorage o sessionStorage)
```

**Estado:** Backend retorna datos correctos ✅

---

### 2. Acceso a Admin Dashboard - FALLANDO ❌

```
Usuario recarga página → admin-dashboard.html carga
                      → Línea 85: <script src="dashboard-auth-check.js"></script>
                      → dashboard-auth-check.js se ejecuta
                      → isAuthenticated() busca credenciales
                      → ❌ NO ENCUENTRA LAS CLAVES
                      → Modal "Acceso restringido" aparece
                      → Auto-redirige a index.html
```

**Causa Raíz:** isAuthenticated() busca en las claves incorrectas

---

### 3. Análisis de Claves - MISMATCH CONFIRMADO

#### A. Lo que `unified-auth-system-v2.js` GUARDA

**Línea 1819-1824:**
```javascript
this.STORAGE_KEYS = {
    token: 'bge_auth_token',
    user: 'bge_auth_user',
    refresh: 'bge_refresh_token',
    expiry: 'bge_auth_expiry'
};
```

**Línea 1830-1847:**
```javascript
saveSession(userData, token, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.STORAGE_KEYS.token, token);           // bge_auth_token
    storage.setItem(this.STORAGE_KEYS.user, JSON.stringify(userData)); // bge_auth_user
    storage.setItem(this.STORAGE_KEYS.expiry, expiryTime.toString());  // bge_auth_expiry
}
```

**Guardado en:**
- localStorage SI usuario marca "Recordarme"
- sessionStorage SI usuario NO marca "Recordarme"

---

#### B. Lo que `dashboard-auth-check.js` BUSCA (ANTES DEL FIX)

**Línea 13-14:**
```javascript
const token = localStorage.getItem('authToken');     // ❌ CLAVE INCORRECTA
const userData = localStorage.getItem('userData');    // ❌ CLAVE INCORRECTA
```

**Problema:**
- SOLO busca en `localStorage`
- NUNCA busca en `sessionStorage`
- Busca claves antiguas (`authToken`, `userData`)
- NO busca claves modernas (`bge_auth_token`, `bge_auth_user`)

---

### 4. 3 Casos de Fallo

| Caso | Usuario Marca "Recordarme" | Guardado en | Buscado en | Resultado |
|------|---------------------------|-----------|-----------|-----------|
| 1 | SÍ | localStorage (bge_auth_*) | localStorage (authToken) | ❌ FALLA - Claves diferentes |
| 2 | NO | sessionStorage (bge_auth_*) | localStorage (authToken) | ❌ FALLA - Storage diferente + claves diferentes |
| 3 | Legacy | localStorage (authToken) | localStorage (authToken) | ✅ FUNCIONA - Pero legacy |

---

## ✅ SOLUCIÓN IMPLEMENTADA

### FIX 1: Actualizar `dashboard-auth-check.js`

**Cambios realizados (líneas 11-73):**

1. **Buscar Sistema Moderno (Priority 1):**
   - Buscar `bge_auth_token` en localStorage
   - Si NO encuentra, buscar en sessionStorage
   - Buscar `bge_auth_user` en localStorage
   - Si NO encuentra, buscar en sessionStorage
   - Aceptar roles: `admin` O `administrativo`

2. **Buscar Sistema Legacy (Priority 2):**
   - Buscar `authToken` en localStorage O sessionStorage
   - Buscar `userData` en localStorage O sessionStorage
   - Aceptar roles: `admin` O `administrativo`

3. **Buscar Sistema Seguro (Priority 3):**
   - Buscar `secure_admin_session` en localStorage O sessionStorage
   - Validar que no esté expirado

4. **Logging Detallado:**
   - Cada sistema reporta qué encontró o no encontró
   - Si falla, muestra qué rol tenía el usuario (debug info)

**Resultado esperado:**
- ✅ Usuarios con "Recordarme" SÍ pueden acceder (localStorage)
- ✅ Usuarios sin "Recordarme" SÍ pueden acceder (sessionStorage)
- ✅ Usuarios legacy SÍ pueden acceder (claves antiguas)
- ✅ Logging claro para debugging si hay issues

---

## 📊 VERIFICACIÓN POST-FIX

### Checklist

- [x] FIX 1: `dashboard-auth-check.js` actualizado para buscar en claves correctas
- [x] FIX 1: Busca en localStorage Y sessionStorage
- [x] FIX 1: Acepta roles `admin` y `administrativo`
- [ ] ⏳ Testing manual: Login con "Recordarme" → admin-dashboard.html
- [ ] ⏳ Testing manual: Login sin "Recordarme" → admin-dashboard.html
- [ ] ⏳ Testing manual: Recargar página post-login → debe mantener sesión
- [ ] ⏳ Verificar consola: Debe mostrar `✅ [DASHBOARD AUTH] JWT moderno (bge_auth_*) válido`
- [ ] ⏳ Verificar en Vercel: Deploy nuevo y test en producción

---

## 🔧 PASOS PARA USUARIO

### Paso 1: Deploy del Fix

```bash
git add api/index.js public/js/dashboard/dashboard-auth-check.js
git commit -m "fix(admin-dashboard): Fix auth check for correct localStorage keys"
git push origin main
```

En Vercel:
- Esperar deploy automático (5-10 minutos)
- Verificar en Vercel Dashboard que build es exitoso

### Paso 2: Testing Manual

1. **Abrir:** https://bge-heroesdelapatria.vercel.app/
2. **Click:** "Administrador" en header
3. **Ingresar:**
   - Email: admin@heroespatria.edu.mx
   - Contraseña: (la contraseña admin)
4. **MARCAR:** "Recordarme" checkbox
5. **Click:** "Iniciar Sesión"
6. **Resultado esperado:** Redirecciona a `/admin-dashboard.html` SIN modal de error
7. **Verificar consola (F12):** Debe mostrar:
   ```
   ✅ [DASHBOARD AUTH] JWT moderno (bge_auth_*) válido - Rol: admin
   ✅ [DASHBOARD AUTH] Autenticación confirmada - Cargando dashboard
   ```

### Paso 3: Testing sin "Recordarme"

1. **En admin-dashboard.html:** Click logout (esquina superior derecha)
2. **Click:** "Administrador" en header nuevamente
3. **Ingresar credenciales** (SIN marcar "Recordarme")
4. **Click:** "Iniciar Sesión"
5. **Resultado esperado:** Redirecciona a admin-dashboard.html exitosamente
6. **Recargar página (F5):** Debe mantener sesión (NO redirige a index.html)
7. **Verificar consola:** Debe mostrar JWT moderno válido

---

## 📌 NOTAS TÉCNICAS

### ¿Por qué pasó esto?

1. **Evolución de código:**
   - Sistema antiguo: Usaba claves `authToken`, `userData`
   - Sistema nuevo (unified-auth-system-v2.js): Cambió a `bge_auth_token`, `bge_auth_user`
   - Pero `dashboard-auth-check.js` NO se actualizó para las nuevas claves

2. **Diferencias de storage:**
   - `localStorage`: Persiste 30 días (incluso después de cerrar navegador)
   - `sessionStorage`: Solo persiste mientras tab está abierto
   - `unified-auth-system-v2.js` usa ambos (según checkbox "Recordarme")
   - `dashboard-auth-check.js` SOLO buscaba en localStorage

3. **Roles:**
   - Backend usa `admin` o `administrativo`
   - `dashboard-auth-check.js` original SOLO aceptaba `admin`
   - Actualizado para aceptar ambos

---

## 🚀 PRÓXIMOS PASOS OPCIONALES

### Mejora Futura 1: Debug Console Mejorado

En navegador, usuario puede ejecutar en consola:

```javascript
// Ver qué está guardado en storage
console.log('localStorage:', localStorage);
console.log('sessionStorage:', sessionStorage);
console.log('authToken (localStorage):', localStorage.getItem('authToken'));
console.log('bge_auth_token (localStorage):', localStorage.getItem('bge_auth_token'));
console.log('bge_auth_token (sessionStorage):', sessionStorage.getItem('bge_auth_token'));
console.log('userData:', localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : 'null');
console.log('bge_auth_user:', localStorage.getItem('bge_auth_user') ? JSON.parse(localStorage.getItem('bge_auth_user')) : sessionStorage.getItem('bge_auth_user') ? JSON.parse(sessionStorage.getItem('bge_auth_user')) : 'null');
```

### Mejora Futura 2: Consolidar a Una Sola Clave

Actualizar `unified-auth-system-v2.js` para SIEMPRE guardar en localStorage (nunca sessionStorage) para admin:

```javascript
if (userData.role === 'admin' || userData.role === 'administrativo') {
    // Admin SIEMPRE en localStorage, independiente de "Recordarme"
    localStorage.setItem('bge_auth_token', token);
    localStorage.setItem('bge_auth_user', JSON.stringify(userData));
} else {
    // Regular users respetan "Recordarme"
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('bge_auth_token', token);
}
```

---

## 📝 GIT INFO

**Commit:** (Pendiente - usuario debe hacer push)

**Archivos Modificados:**
- `public/js/dashboard/dashboard-auth-check.js` (61 líneas cambiadas)

**Líneas agregadas:** +58
**Líneas removidas:** -18

---

## 🎯 CONCLUSIÓN

**Problema:** Admin dashboard inaccesible porque gatekeeper buscaba en claves incorrectas

**Solución:** Actualizar `dashboard-auth-check.js` para buscar en:
1. Claves modernas (`bge_auth_*`) en localStorage
2. Claves modernas (`bge_auth_*`) en sessionStorage
3. Claves legacy (`authToken`, `userData`) en ambos storages
4. Aceptar roles `admin` O `administrativo`

**Resultado esperado:** ✅ Admin puede acceder a dashboard exitosamente

---

**Status:** 🟡 REPARADO EN CÓDIGO - ⏳ PENDIENTE TESTING MANUAL Y DEPLOYMENT

**Próximo Paso:** Usuario ejecuta `git push` y verifica en Vercel + testing manual

---

**🧠 Generated with Claude Code**
**Fecha:** 16 Diciembre 2025, 22:00 hrs
**Tiempo de investigación:** 45 minutos
**Root Cause:** Mismatch entre claves de storage en sistemas JWT moderno vs legacy
