# 🔍 DIAGNÓSTICO DEFINITIVO: PROBLEMAS DE LOGIN Y SESIÓN - 14 DICIEMBRE 2025

## 📋 Resumen Ejecutivo

Se han identificado **3 problemas críticos separados** que causan que el sistema de login no funcione correctamente:

| # | Problema | Severidad | Causa | Fix |
|---|----------|-----------|-------|-----|
| 1 | Sesión NO se persiste después del login | 🔴 CRÍTICO | Ver abajo | Ver sección Problema 1 |
| 2 | Header NO muestra nombre del usuario | 🟠 ALTO | Race condition en updateAuthUI() | Ver sección Problema 2 |
| 3 | Usuario redirigido de iacoins-dashboard.html a index | 🔴 CRÍTICO | Consecuencia de Problema 1 | Se resuelve fixing Problema 1 |

---

## 🔴 PROBLEMA 1: SESIÓN NO SE PERSISTE (ROOT CAUSE)

### Síntoma
- Usuario hace login con credenciales válidas
- Modal se cierra, alerta verde "Bienvenido..."
- Usuario intenta acceder a `iacoins-dashboard.html`
- Es inmediatamente redirigido a `index.html`
- Consola muestra: `[IACOINS] ⚠️ No se encontró token de autenticación`

### Mecanismo de Validación (iacoins-dashboard.js líneas 443-456)
```javascript
async function init() {
    const token = sessionStorage.getItem('bge_auth_token') ||
                 localStorage.getItem('bge_auth_token') ||
                 sessionStorage.getItem('authToken') ||
                 localStorage.getItem('authToken');

    if (!token) {
        console.warn('[IACOINS] 🔐 Usuario no autenticado - redirigiendo a login');
        setTimeout(() => {
            window.location.href = '/index.html';  // ← REDIRECT AQUÍ
        }, 1000);
        return;
    }
    // ... resto del código
}
```

**Así funciona:**
1. `iacoins-dashboard.html` se carga
2. Se llama `init()`
3. Busca token en `sessionStorage.getItem('bge_auth_token')`
4. **Si NO encuentra token → REDIRIGE a index.html**

### Por Qué Sucede

El flujo correcto de login **DEBERÍA SER**:

```
1. Usuario ingresa email/contraseña
2. Frontend fetch a /api/auth/login
3. Backend responde con:
   {
     "success": true,
     "user": { "id": 1, "nombre": "Docente", "email": "docente@test.com", "role": "docente" },
     "tokens": { "accessToken": "eyJh...", "refreshToken": "..." }
   }
4. Frontend parsea respuesta
5. Frontend LLAMA A saveSession(userData, token)
6. saveSession() GUARDA en sessionStorage:
   - bge_auth_token = "eyJh..."
   - bge_auth_user = '{"id":1,"nombre":"Docente"...}'
   - bge_auth_expiry = timestamp
7. Frontend llama updateAuthUI()
8. Usuario ve su nombre en header
9. Usuario puede navegar a iacoins-dashboard.html
10. iacoins-dashboard.js ENCUENTRA token en storage
11. Dashboard carga datos correctamente
```

### Dónde Podría Estar el Problema

Hay **4 puntos posibles de fallo**:

#### Posibilidad A: Respuesta del `/api/auth/login` es incorrecta
**¿Cómo verificar?**
- Abre DevTools (F12) → Console
- Haz login
- Busca mensaje: `[AUTH-LOGIN] ✅ Respuesta del servidor:`
- Verifica que muestre:
  - `success: true`
  - `tokens: (presente)` ← **CRÍTICO**
  - `user: { id, nombre, email, role }`

**Si NO ves este mensaje o tokens dice "(ausente)":**
- El backend NO devuelve tokens correctamente
- **FIX NECESARIO:** Revisar endpoint `/api/auth/login` en backend

#### Posibilidad B: saveSession() NO se ejecuta
**¿Cómo verificar?**
- Abre DevTools → Console
- Haz login
- Busca mensaje: `✅ Sesión guardada en sessionStorage`
- Immediatamente después de ese log, ejecuta en console:
  ```javascript
  console.log('Token almacenado:', sessionStorage.getItem('bge_auth_token'));
  ```
- **Debería mostrar un token que comienza con "eyJ"**

**Si NO ves el log de "Sesión guardada":**
- `processLogin()` no está siendo llamada
- **FIX NECESARIO:** Revisar línea 1611 en unified-auth-system-v2.js

**Si ves el log pero `console.log` muestra null:**
- `saveSession()` se ejecutó pero NO guardó el token
- **FIX NECESARIO:** Revisar sessionStorage.setItem() en SessionManager

#### Posibilidad C: Modal se cierra antes de que saveSession() complete
**¿Cómo verificar?**
- En la timeline de Console, verifica el ORDEN de logs:
  1. `[AUTH-LOGIN] ✅ Respuesta del servidor:`
  2. `[AUTH-PROCESS] 📥 userData recibido:`
  3. `✅ Sesión guardada en sessionStorage`
  4. `[AUTH-UI] ✅ Nombre actualizado:`
  5. Modal cierra

**Si el ORDEN está alterado o algunos logs faltan:**
- Hay una race condition
- **FIX NECESARIO:** Agregar await a saveSession() si falta

#### Posibilidad D: Storage está bloqueado por política de seguridad
**¿Cómo verificar?**
- En Console, ejecuta:
  ```javascript
  try {
    sessionStorage.setItem('test', 'value');
    console.log('✅ sessionStorage funciona');
    sessionStorage.removeItem('test');
  } catch(e) {
    console.error('❌ sessionStorage bloqueado:', e);
  }
  ```

**Si muestra error:**
- Navegador tiene sesión privada/incógnito
- Politica de cookies bloqueada
- **FIX NECESARIO:** Instruir usuario a deshabilitar modo privado

---

## 🟠 PROBLEMA 2: HEADER NO MUESTRA NOMBRE DESPUÉS DEL LOGIN

### Síntoma
- Login exitoso
- Modal se cierra
- Header muestra solo icono, NO el nombre del usuario
- El nombre debería ser "Docente", "Admin", "Estudiante", etc.

### Mecanismo (unified-auth-system-v2.js líneas 696-805)
```javascript
updateAuthUI() {
    const tryUpdateUI = (attempts = 0) => {
        const loginButtons = document.getElementById('loginButtons');

        // Si header NO está en DOM, reintentar (hasta 10 intentos, 50ms entre cada uno)
        if (!loginButtons && attempts < 10) {
            console.log('[AUTH-UI] ⏳ Header no listo aún, reintentando...');
            setTimeout(() => tryUpdateUI(attempts + 1), 50);
            return;
        }

        // Ahora sí actualizar
        const userMenuName = document.getElementById('userMenuName');
        if (userMenuName) {
            userMenuName.textContent = this.state.currentUser.nombre;
            console.log('[AUTH-UI] ✅ Nombre actualizado:', userMenuName.textContent);
        }
    };

    tryUpdateUI();
}
```

### Por Qué Sucede

El problema es una **race condition**:

1. Página carga `index.html`
2. Se carga `unified-auth-system-v2.js` (el sistema de login)
3. Se carga `public/partials/header.html` dinámicamente
4. Login ocurre
5. `updateAuthUI()` intenta actualizar elementos que AÚN NO están en el DOM
6. Los elementos se inyectan después pero la actualización ya pasó
7. Header nunca se actualiza con el nombre

### Verificación y Fix

**¿Cómo verificar si esto está pasando?**
- Abre DevTools → Console
- Haz login
- Busca logs `[AUTH-UI]`:
  - Si ves `⏳ Header no listo aún, reintentando...` (varias veces)
  - Luego `✅ Nombre actualizado:`
  - **Entonces el fix (reintentos) SÍ está funcionando**

**Si SÍ está funcionando pero header sigue vacío:**
- El problema es que `updateAuthUI()` se ejecuta pero el elemento `#userMenuName` no existe
- Los elementos deben estar en `public/partials/header.html`
- Verificar líneas 609 en header.html tiene:
  ```html
  <span id="userMenuName">Usuario</span>
  ```

---

## 🔴 PROBLEMA 3: USUARIO REDIRIGIDO DESDE IACOINS-DASHBOARD A INDEX (CONSECUENCIA)

### Síntoma
- User intenta acceder a `/iacoins-dashboard.html`
- Inmediatamente es redirigido a `/index.html`
- Consola muestra: `[IACOINS] ⚠️ No se encontró token de autenticación`

### Causa Raíz
- Este NO es un problema separado
- Es LA CONSECUENCIA del Problema 1 (sesión no se persiste)
- Si Problema 1 se arregla, esto desaparece automáticamente

### Mecanismo (iacoins-dashboard.js líneas 449-456)
```javascript
if (!token) {
    console.warn('[IACOINS] 🔐 Usuario no autenticado - redirigiendo a login');
    setTimeout(() => {
        window.location.href = '/index.html';  // ← REDIRECT AQUÍ
    }, 1000);
    return;
}
```

---

## ✅ PLAN DE ACCIÓN PARA EL USUARIO

### PASO 1: Diagnóstico (5 minutos)

Abre DevTools (F12) y copia todo el contenido de `DEBUG_LOGIN_SESSION.js` en la consola:

```javascript
// [Aquí el contenido completo de DEBUG_LOGIN_SESSION.js]
```

Luego ejecuta en la consola:

```javascript
// PASO 1A: Verificar ANTES de login
testSessionLoad()
// Debería mostrar: ❌ NO HAY SESIÓN GUARDADA

// PASO 1B: Hacer login
// (usa formulario del header)
// Email: docente@test.com
// Contraseña: Test123!

// PASO 1C: Verificar DESPUÉS de login (SIN cerrar DevTools)
testSessionLoad()
// Debería mostrar: ✅ Sesión encontrada + Token + Usuario
```

### PASO 2: Interpretar Resultados

#### Resultado A: ✅ Sesión SÍ se guarda
```
✅ [TEST] Sesión encontrada
  Token: eyJhbGciOi...
  Usuario: { id: 1, email: "docente@test.com", nombre: "Docente", ... }
```

**Significa:** Problema 1 NO es el culpable. El problema está en otra parte:
- Verificar header con `testHeader()`
- Verificar que `/iacoins-dashboard.html` existe y carga correctamente
- Posible que falte script en iacoins-dashboard.html

#### Resultado B: ❌ Sesión NO se guarda
```
❌ [TEST] NO HAY SESIÓN GUARDADA
  Token: no
  Usuario: no
```

**Significa:** Problema 1 SÍ es el culpable. Hay 4 sub-causas posibles (ver sección Dónde Podría Estar el Problema).

**Acciones:**
1. Busca en Console: `[AUTH-LOGIN] ✅ Respuesta del servidor:`
   - Si NO ves este log → Backend no responde bien
   - Si SÍ ves → Token se recibió correctamente

2. Si token se recibió, busca: `✅ Sesión guardada en sessionStorage`
   - Si NO ves → saveSession() no se ejecutó
   - Si SÍ ves pero token no aparece → sessionStorage está bloqueado

3. Comparte los LOGS EXACTOS de Console conmigo

### PASO 3: Acciones Específicas según Diagnóstico

**Si el problema es de Backend:**
- Compartir logs de Console que muestren respuesta del `/api/auth/login`
- Esperar fix en endpoint backend

**Si el problema es de saveSession():**
- Verificar que `processLogin()` se llama en línea 1611
- Puede haber error silencioso en sessionStorage.setItem()

**Si el problema es de Storage bloqueado:**
- Usuario debe deshabilitar modo incógnito/privado
- Limpiar cookies y cache del navegador

---

## 📊 CHECKLIST FINAL

Use este checklist DESPUÉS de hacer los pasos anteriores:

- [ ] Login FUNCIONA (credenciales aceptadas, modal se cierra)
- [ ] DevTools muestra `✅ Sesión guardada en sessionStorage`
- [ ] `testSessionLoad()` muestra token y usuario guardados
- [ ] Header muestra nombre del usuario después del login
- [ ] `testHeader()` muestra:
  - `Botón login visible? false` (debe ser FALSE)
  - `Menú usuario visible? true` (debe ser TRUE)
  - `Nombre mostrado: Docente` (o el nombre del usuario)
- [ ] Usuario puede navegar a `iacoins-dashboard.html` SIN ser redirigido
- [ ] Dashboard carga datos sin errores de token

**Si todos los items están ✅:**
- LOGIN COMPLETAMENTE FUNCIONAL ✅

**Si algún item está ❌:**
- Compartir logs de Console conmigo para debugging

---

## 🔧 CÓMO COMPARTIR INFORMACIÓN PARA DEBUGGING

Cuando tengas problemas:

1. **Abre DevTools (F12) → Console**
2. **Ejecuta los tests:**
   ```javascript
   testSessionLoad()
   testHeader()
   ```
3. **Selecciona TODA la consola (Ctrl+A) y cópia (Ctrl+C)**
4. **Pégalo en tu mensaje para mí**

Lo que necesito ver:
- Mensaje de respuesta del servidor: `[AUTH-LOGIN] ✅ Respuesta del servidor:`
- Mensaje de sesión guardada: `✅ Sesión guardada en sessionStorage`
- Resultado de testSessionLoad()
- Resultado de testHeader()
- Cualquier error que aparezca en rojo

---

## 🎯 CONCLUSIÓN

El problema raíz es probablemente que **saveSession() NO se ejecuta o NO guarda el token** después del login.

**PRÓXIMOS PASOS INMEDIATOS:**

1. Ejecuta `testSessionLoad()` antes y después del login
2. Verifica si sesión se guarda
3. Comparte los logs de Console conmigo
4. Con esa información, podré decirte exactamente qué arreglar

**Duración estimada:** 10-15 minutos

**¿Estás listo? Hazlo ahora mismo.** 🚀
