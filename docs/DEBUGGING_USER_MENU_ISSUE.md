# 🔍 DEBUGGING: Por qué el nombre del usuario NO aparece en el header

**Fecha:** 14 de Diciembre 2025
**Problema:** El login es exitoso (modal cierra, "Autenticación exitosa" aparece) pero el nombre del usuario NO aparece en el botón del header.
**Status:** Investigación en progreso - Logging agregado

---

## 📋 Lo que sabemos

✅ **Login ES exitoso:**
- El modal se cierra
- Se muestra "Autenticación exitosa"
- El usuario está autenticado (token guardado)

❌ **Lo que NO funciona:**
- El nombre del usuario NO aparece en el header
- El botón solo muestra el icono (sin nombre/rol)
- El menú de usuario NO se abre correctamente

---

## 🔧 Cambios Realizados para Debugging

He agregado logging detallado en `public/js/unified-auth-system-v2.js` que rastreará:

1. **[AUTH-LOGIN]** - Qué datos devuelve el servidor
2. **[AUTH-PROCESS]** - Si el nombre se recibe y se procesa
3. **[AUTH-UI]** - Si updateAuthUI() ejecuta y actualiza los elementos

---

## 🚀 CÓMO VERIFICAR (Pasos para el usuario)

### Paso 1: Abrir DevTools
Presiona **F12** o **Ctrl+Shift+I** en tu navegador

### Paso 2: Ir a la Tab Console
Ve a **Console** para ver los logs

### Paso 3: Hacer login
1. Click en botón "Iniciar Sesión"
2. Completa email y contraseña
3. Click en "Iniciar Sesión"

### Paso 4: OBSERVAR los logs en Console

Deberías ver mensajes como:

```
[AUTH-LOGIN] ✅ Respuesta del servidor: {
  success: true,
  message: "Autenticación exitosa",
  user: {...},
  tokens: "(presente)",
  sessionInfo: "(presente)"
}

[AUTH-LOGIN] 📋 Datos del usuario recibidos: {
  id: 1,
  username: "john.doe",
  email: "john@example.com",
  nombre: "John",        ← CRÍTICO: Este campo DEBE tener un valor
  apellido_paterno: "Doe",
  role: "estudiante"
}

[AUTH-PROCESS] 📥 userData recibido en processLogin: {id: 1, username: "john.doe", ...}
[AUTH-PROCESS] userData.nombre = "John"  ← DEBE mostrar el nombre
[AUTH-PROCESS] userData.name = undefined

[AUTH-PROCESS] ✅ state.currentUser asignado: "John"
[AUTH-PROCESS] 🎬 Llamando a updateAuthUI()...

[AUTH-PROCESS] 📍 Después de updateAuthUI(): {
  userMenuName: {
    existe: true,        ← DEBE ser true
    texto: "John",       ← DEBE mostrar el nombre
    oculto: false
  },
  loginButtons: {existe: true, oculto: true},
  userMenu: {existe: true, visible: true}
}
```

---

## 🎯 Qué buscar en los logs

### ESCENARIO 1: Nombre ES devuelto pero NO se muestra
```
[AUTH-LOGIN] 📋 Datos del usuario recibidos: {
  nombre: "John",        ← ✅ El nombre está aquí
  ...
}

PERO

[AUTH-UI] Usuario mostrado: "Usuario"   ← ❌ Muestra "Usuario" en lugar de "John"
```
**Causa posible:** El campo HTML `#userMenuName` NO existe o tiene otro ID

### ESCENARIO 2: Nombre NO es devuelto por el servidor
```
[AUTH-LOGIN] 📋 Datos del usuario recibidos: {
  nombre: undefined,     ← ❌ El nombre NO está en la respuesta
  name: undefined,
  ...
}
```
**Causa posible:** El endpoint `/api/auth/login` NO está incluyendo `nombre` en la respuesta

### ESCENARIO 3: updateAuthUI() NO se ejecuta
```
[AUTH-PROCESS] 🎬 Llamando a updateAuthUI()...

PERO NUNCA VES:

[AUTH-PROCESS] 📍 Después de updateAuthUI(): {...}
```
**Causa posible:** updateAuthUI() está fallando silenciosamente

---

## 📊 Diagnóstico basado en logs

Dependiendo de lo que veas en console, saber el **problema específico**:

| Log | Significa | Solución |
|-----|----------|----------|
| `nombre: "John"` pero muestra "Usuario" | Campo HTML incorrecto | Revisar header.html IDs |
| `nombre: undefined` | Backend no devuelve nombre | Revisar backend/routes/auth.js |
| Sin logs de `[AUTH-PROCESS]` | processLogin() no se llama | Revisar ManualLoginManager |
| Error en console | Exception durante login | Leer el error exacto |

---

## 🔴 Información Crítica

**El flujo esperado es:**

```
Usuario hace click en "Iniciar Sesión"
    ↓
Modal aparece (unified-auth-system-v2.js crea el modal)
    ↓
Usuario completa email/contraseña
    ↓
Envía POST /api/auth/login
    ↓
[AUTH-LOGIN] logs aparecen en console
    ↓
[AUTH-LOGIN] 📋 Datos del usuario: {nombre: "John", ...}
    ↓
[AUTH-PROCESS] userData recibido: {nombre: "John", ...}
    ↓
[AUTH-PROCESS] Llamando a updateAuthUI()
    ↓
[AUTH-PROCESS] Después de updateAuthUI(): {texto: "John"} ← DEBE aparecer
    ↓
Modal cierra
    ↓
"Bienvenido, John!" aparece
    ↓
Header muestra "John" en lugar del icono
```

Si **NO ves los logs de [AUTH-LOGIN] o [AUTH-PROCESS]**, significa que ManualLoginManager.handleLogin() no se ejecutó.

---

## 🛠️ Próximos Pasos

1. **Usuario ejecuta los pasos 1-4 arriba**
2. **Copia los logs del console**
3. **Me dice exactamente qué ve**
4. Basado en los logs, identificamos:
   - Si es problema de backend (respuesta incompleta)
   - Si es problema de frontend (DOM/elementos incorrect)
   - Si es problema de lógica (updateAuthUI() no se ejecuta)

---

## 📝 Notas Técnicas

### Archivos involucrados:
- `public/js/unified-auth-system-v2.js` - **ManualLoginManager.handleLogin()** (línea ~1490)
- `public/js/unified-auth-system-v2.js` - **processLogin()** (línea ~592)
- `public/js/unified-auth-system-v2.js` - **updateAuthUI()** (línea ~665)
- `backend/routes/auth.js` - **POST /api/auth/login** (línea ~147)
- `public/partials/header.html` - Elementos del menú (líneas ~595-615)

### Response esperada del servidor:
```javascript
{
  success: true,
  message: "Autenticación exitosa",
  user: {
    id: 1,
    username: "john.doe",
    email: "john@example.com",
    nombre: "John",              // ← CRÍTICO
    apellido_paterno: "Doe",
    role: "estudiante",
    permissions: [...]
  },
  tokens: {
    accessToken: "jwt...",
    refreshToken: "jwt...",
    ...
  },
  sessionInfo: {...}
}
```

---

## 🚀 Comando git

Cambios fueron commiteados en:
```bash
commit 5d1dc2d
Author: Claude <claude@anthropic.com>
Date: [timestamp]

    debug(auth): add comprehensive logging to trace user menu display issue
```

---

**STATUS:** ⏳ Esperando que el usuario ejecute los pasos de debugging y reporte los logs

**Siguiente acción:** Una vez que vea los logs, sabré exactamente dónde está el problema.
