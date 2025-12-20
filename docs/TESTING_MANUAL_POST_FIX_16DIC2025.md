# 🧪 GUÍA DE TESTING MANUAL - 16 DICIEMBRE 2025

**Versión:** v2.30.27
**Status:** ✅ TODAS LAS REPARACIONES COMPLETADAS
**Commits:** ed104ca, ae0f239, 9389053, 11b0d66, 1042129
**Hora:** 16 Diciembre 2025 (Después de Vercel Auto-Deploy)

---

## 📋 PRE-REQUISITOS ANTES DE EMPEZAR

**✅ Verificar que todo está pusheado:**
```bash
git status  # Debe estar limpio (no hay cambios pendientes)
git log --oneline -5  # Debe mostrar los 5 commits de fix
```

**⏳ Esperar a que Vercel termine el deploy:**
- Ir a: https://vercel.com/dashboard/bge-heroesdelapatria
- Esperar a que el estado cambie a "Ready" (verde)
- Esto toma 5-10 minutos después del push

---

## 🧪 TEST A: LOGIN CON "RECORDARME" (IMPORTANTE)

### Pasos:
1. Abrir navegador (Chrome, Firefox, Safari - cualquiera)
2. Ir a: **https://bge-heroesdelapatria.vercel.app/** (Vercel Production)
   - O si deseas probar local: **http://localhost:3000/index.html** (con servidor corriendo)
3. Buscar botón azul **"Administrador"** en el header
4. Hacer clic en el botón
5. Debería aparecer **modal "Acceso Seguro"** (NOT error modal)
6. Ingresar credenciales:
   - **Email:** `admin@heroespatria.edu.mx`
   - **Contraseña:** `HeroesPatria2024!`
7. **IMPORTANTE:** Marcar checkbox **"Recordarme"** ✅
8. Hacer clic en **"Iniciar Sesión"**

### Resultado Esperado:
- ✅ Modal desaparece (sin error)
- ✅ Página redirecciona a `/admin-dashboard.html`
- ✅ Header muestra **nombre de usuario** (ej: "Admin Usuario")
- ✅ Dashboard completamente visible (sin modal rojo)
- ✅ NO aparece mensaje "Acceso restringido"
- ✅ NO aparece modal "Seguridad Activada"

### Si Ves Esto = ❌ PROBLEMA:
- ❌ Modal rojo: "Acceso restringido: Debes iniciar sesión como administrador"
- ❌ Modal rojo: "Seguridad Activada - Acceso no autorizado"
- ❌ Redirecciona a index.html automáticamente
- ❌ Header no muestra usuario
- ❌ Error 500 o 400 en console

---

## 🧪 TEST B: LOGIN SIN "RECORDARME" (VALIDAR SESSIONSTORE)

### Pasos:
1. En admin-dashboard.html, buscar **logout button** (esquina superior derecha)
2. Hacer clic en usuario logueado → Ver menú dropdown
3. Hacer clic en **"Salir"** o **"Logout"**
4. Debería volver a index.html
5. Hacer clic en **"Administrador"** nuevamente
6. Ingresar credenciales (MISMO EMAIL + PASSWORD)
7. **ESTA VEZ:** NO marcar "Recordarme" ❌
8. Hacer clic en **"Iniciar Sesión"**

### Resultado Esperado:
- ✅ Mismo comportamiento que Test A
- ✅ Dashboard carga correctamente
- ✅ Usuario visible en header
- ✅ Sesión funciona incluso sin "Recordarme"
- ✅ Si recargas la página (F5), MANTIENE sesión durante esa sesión de navegador

---

## 🧪 TEST C: RECARGAR PÁGINA MIENTRAS LOGUEADO

### Pasos:
1. Estar en admin-dashboard.html (desde Test A)
2. Presionar **F5** (recargar página)
3. Esperar a que cargue completamente

### Resultado Esperado:
- ✅ Página recarga sin problemas
- ✅ Usuario sigue logueado (visible en header)
- ✅ Dashboard sigue accesible
- ✅ NO aparecen modales de error
- ✅ Sesión NO se pierda

---

## 🔍 VERIFICAR CONSOLA (F12) - MUY IMPORTANTE

### Presiona F12 → Pestaña "Console"

### Debería Ver (Buscar estos mensajes):
```
✅ [MAIN.JS] 🚀 Inicializando main.js...
✅ [MAIN.JS] Cargando header dinámicamente...
✅ [MAIN.JS] Header inyectado exitosamente
✅ [DASHBOARD AUTH] JWT moderno (bge_auth_*) válido - Rol: admin
✅ [DASHBOARD AUTH] Autenticación confirmada - Cargando dashboard
✅ [SECURITY] Sistema JWT moderno detectado
```

### NO Debería Ver (Si ves estos = PROBLEMA):
```
❌ 404 Not Found (en main.js, headers, etc)
❌ "authToken not found" o "userData not found"
❌ "Acceso no autorizado"
❌ "Error parsing JWT"
❌ ERROR undefined is not a function
❌ CORS errors (bloqueados por CSP)
```

---

## 📊 MATRIZ DE RESULTADOS

| Test | Esperado | ¿Pasó? | Notas |
|------|----------|--------|-------|
| **A. Login + "Recordarme"** | Dashboard carga sin error | ☐ | |
| **B. Login sin "Recordarme"** | Dashboard carga sin error | ☐ | |
| **C. Recargar página** | Sesión mantiene | ☐ | |
| **Consola F12** | Logs correctos, sin errores | ☐ | |
| **Header visible** | Muestra nombre de usuario | ☐ | |
| **No hay modales rojos** | Cero modales de error | ☐ | |

---

## 🔧 SI ALGO FALLA - DEBUGGING STEPS

### Paso 1: Verificar qué está en Storage
Abre **Console (F12)** y ejecuta estos comandos:

```javascript
// Ver qué hay en localStorage
console.log('localStorage:', localStorage);

// Ver qué hay en sessionStorage
console.log('sessionStorage:', sessionStorage);

// Ver específicamente nuestras claves modernas
console.log('bge_auth_token:', localStorage.getItem('bge_auth_token'));
console.log('bge_auth_user:', localStorage.getItem('bge_auth_user'));

// Ver claves legacy (por si acaso)
console.log('authToken:', localStorage.getItem('authToken'));
console.log('userData:', localStorage.getItem('userData'));
```

### Paso 2: Verificar que main.js se ejecutó
```javascript
// Si ves "true" = main.js ejecutó
console.log('¿main.js cargó?', !!window.HEADER_LOADED);
console.log('¿Sistema unificado cargó?', !!window.unifiedLogin);
```

### Paso 3: Forzar logout y reintentarar
```javascript
// Ejecutar en console
localStorage.clear();
sessionStorage.clear();
window.location.href = 'index.html';
```

Luego intenta login nuevamente desde cero.

---

## 📝 CUÁNDO REPORTAR PROBLEMA

Si después de completar todos los tests ves **CUALQUIERA** de estos:

1. ❌ Modal rojo "Acceso restringido" aparece
2. ❌ Modal rojo "Seguridad Activada" aparece
3. ❌ Error 400, 401, o 500 en Network tab
4. ❌ Error 404 en cualquier archivo (main.js, headers, etc)
5. ❌ Console muestra "undefined is not a function"
6. ❌ User no visible en header
7. ❌ Dashboard no carga aunque login parezca exitoso
8. ❌ Storage vacío después de login (no guardó credenciales)

**Reportar incluyendo:**
- Captura de pantalla del error/modal
- Salida completa de Console (F12)
- Network tab (buscar requests fallidos)
- Qué exactamente hiciste (pasos)
- Qué viste en storage (localStorage/sessionStorage)

---

## ✅ TESTING COMPLETADO CON ÉXITO

Cuando todos los tests pasen Y la consola muestre los mensajes correctos, el sistema estará **100% FUNCIONAL**.

En ese caso:

✅ **ADMIN PUEDE LOGUEARSE Y ACCEDER AL DASHBOARD**

---

## 📚 REFERENCIA RÁPIDA DE ARCHIVOS REPARADOS

| Archivo | Problema | Solución | Commit |
|---------|----------|----------|--------|
| `/api/index.js` | Middleware duplicado + Pool closing | Removidas duplicatas, `pool.end()` | ed104ca, 1042129 |
| `/public/js/dashboard/dashboard-auth-check.js` | Busca claves incorrectas | Actualizado buscar `bge_auth_*` | ed104ca |
| `/public/admin-dashboard.html` | main.js comentado | Descomentado main.js | ae0f239 |
| `/public/js/dashboard/session-monitor.js` | Solo busca old keys | Actualizado 4 sistemas auth | 11b0d66 |
| `/public/js/unified-login-handler.js` | No existía | Creado nuevo handler | ae0f239 |

---

## 🎯 CONCLUSIÓN

Se identificaron y repararon **4 problemas críticos** trabajando juntos:

1. ✅ Middleware duplicado bloqueando login
2. ✅ 2 sistemas de login conflictivos
3. ✅ 3 gatekeepers buscando en claves incorrectas
4. ✅ Database pool cerrándose en Vercel

**El sistema ahora debería estar 100% FUNCIONAL.**

**Próximo paso:** Ejecutar los tests manuales arriba y reportar resultados.

---

**Generado con Claude Code**
**Fecha:** 16 Diciembre 2025
**Versión:** v2.30.27
**Status:** ✅ LISTO PARA TESTING MANUAL
