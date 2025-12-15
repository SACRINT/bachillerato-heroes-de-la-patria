# 🔧 ANÁLISIS TÉCNICO DETALLADO: FLUJO DE LOGIN Y ALMACENAMIENTO DE SESIÓN

## 1️⃣ FLUJO NORMAL DE LOGIN (LO QUE DEBERÍA PASAR)

```
USUARIO EN index.html
           ↓
[Click] "Iniciar Sesión" button en header
           ↓
Modal abre (unified-auth-system-v2.js showModal())
           ↓
Usuario ingresa email: docente@test.com
Usuario ingresa password: Test123!
           ↓
[Click] "Iniciar Sesión" button en modal
           ↓
ManualLoginManager.submitLogin() se ejecuta (línea 1549)
           ↓
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'docente@test.com',
        password: 'Test123!',
        rememberMe: false
    })
})
           ↓
Backend responde (200 OK) con:
{
    "success": true,
    "message": "Autenticación exitosa",
    "user": {
        "id": 1,
        "email": "docente@test.com",
        "nombre": "Docente",
        "apellido_paterno": "Test",
        "role": "docente"
    },
    "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "sessionInfo": {
        "rememberMe": false
    }
}
           ↓
Frontend parsea respuesta (línea 1561):
data = await response.json()
           ↓
Frontend verifica (línea 1568):
if (response.ok && data.success)  // true + true = true
           ↓
Frontend extrae token (línea 1599):
const accessToken = data.tokens?.accessToken  // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
           ↓
Frontend llama processLogin (línea 1611):
await this.auth.processLogin(data.user, accessToken, false)
           ↓
processLogin() se ejecuta (línea 590):
- Asigna this.state.currentUser = data.user
- Asigna this.state.token = token
- Asigna this.state.isAuthenticated = true
- Llama saveSession(userData, token, rememberMe) línea 607
           ↓
saveSession() se ejecuta (línea 1829):
- rememberMe = false, entonces usa sessionStorage
- sessionStorage.setItem('bge_auth_token', token)
- sessionStorage.setItem('bge_auth_user', JSON.stringify(userData))
- sessionStorage.setItem('bge_auth_expiry', timestamp)
           ↓
Console muestra:
✅ Sesión guardada en sessionStorage
           ↓
processLogin() continúa (línea 613):
- Llama updateAuthUI()
           ↓
updateAuthUI() se ejecuta (línea 696):
- Intenta encontrar #loginButtons en DOM
- Si no existe, reintenta (máximo 10 intentos)
- Una vez encuentra los elementos, actualiza:
  * loginButtons.classList.add('d-none')  // Oculta botón "Iniciar Sesión"
  * userMenu.classList.remove('d-none')   // Muestra menú de usuario
  * userMenuName.textContent = "Docente"  // Muestra nombre
           ↓
Console muestra:
[AUTH-UI] ✅ Nombre actualizado: Docente
           ↓
processLogin() continúa (línea 638):
- Cierra modal
- Muestra alerta verde: "Bienvenido, Docente!"
           ↓
ESTADO ESPERADO DESPUÉS:
- sessionStorage.getItem('bge_auth_token') = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
- sessionStorage.getItem('bge_auth_user') = '{"id":1,"nombre":"Docente"...}'
- Header muestra "Docente" (NO "Iniciar Sesión")
- Usuario puede navegar a cualquier página
           ↓
Usuario navega a iacoins-dashboard.html
           ↓
iacoins-dashboard.js se carga y ejecuta init()
           ↓
init() busca token:
const token = sessionStorage.getItem('bge_auth_token') || ...
           ↓
token EXISTE (encontrado) = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
           ↓
if (!token) es FALSE, NO redirige
           ↓
Dashboard carga datos:
- loadBalance()
- loadTransactions()
- loadChallenges()
- loadAchievements()
- loadLeaderboard()
           ↓
✅ DASHBOARD FUNCIONA CORRECTAMENTE
```

---

## 2️⃣ FLUJO CON PROBLEMA (LO QUE ESTÁ PASANDO)

```
USUARIO EN index.html
           ↓
[Click] "Iniciar Sesión"
           ↓
... (pasos 1-19 igual que arriba) ...
           ↓
processLogin() llama saveSession() línea 607
           ↓
❌ PROBLEMA OCURRE AQUÍ - UNA DE ESTAS COSAS:

OPCIÓN A: saveSession() NO se ejecuta
- Causa: processLogin() no se llama desde ManualLoginManager
- Síntoma: Console NO muestra "✅ Sesión guardada en sessionStorage"
- Evidencia: NO hay logs [AUTH-PROCESS]

OPCIÓN B: saveSession() se ejecuta pero sessionStorage.setItem() falla
- Causa: sessionStorage bloqueado (navegador en modo privado/incógnito)
- Síntoma: Console muestra error en rojo
- Evidencia: Exception en sessionStorage.setItem()

OPCIÓN C: Token en respuesta es undefined o null
- Causa: Backend devuelve response sin tokens field
- Síntoma: data.tokens = undefined, accessToken = undefined
- Evidencia: Console muestra "[AUTH-LOGIN] tokens: (ausente)"

OPCIÓN D: Response no es JSON válido
- Causa: Backend devuelve error HTML en lugar de JSON
- Síntoma: JSON.parse() falla
- Evidencia: Error "response is not valid JSON"

           ↓
❌ RESULTADO: Token NO se guarda en sessionStorage
           ↓
sessionStorage.getItem('bge_auth_token') = null
           ↓
User intenta navegar a iacoins-dashboard.html
           ↓
init() se ejecuta
           ↓
const token = sessionStorage.getItem('bge_auth_token')  // null
           ↓
if (!token) es TRUE
           ↓
Console muestra:
[IACOINS] 🔐 Usuario no autenticado - redirigiendo a login
           ↓
setTimeout(() => {
    window.location.href = '/index.html'  // ← REDIRECT AQUÍ
}, 1000)
           ↓
❌ USUARIO REDIRIGIDO A INDEX.HTML
           ↓
❌ DASHBOARD NO CARGA
```

---

## 3️⃣ PUNTOS CRÍTICOS A VERIFICAR

### Punto A: ¿La respuesta del backend es correcta?

**Archivo:** Backend route `/api/auth/login`
**Ubicación:** `backend/routes/auth.js` (asumido)

**Debería retornar:**
```json
{
    "success": true,
    "message": "Autenticación exitosa",
    "user": {
        "id": 1,
        "email": "docente@test.com",
        "nombre": "Docente",
        "apellido_paterno": "Test",
        "role": "docente"
    },
    "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**¿Cómo verificar desde Console?**
```javascript
// Hacer login manualmente
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'docente@test.com',
        password: 'Test123!'
    })
})
.then(r => r.json())
.then(data => {
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
    console.log('Has tokens?', data.tokens ? 'YES' : 'NO');
    console.log('Has user.nombre?', data.user?.nombre ? 'YES' : 'NO');
})
.catch(e => console.error('ERROR:', e))
```

**Si ves:**
- ✅ `Has tokens? YES` → Backend devuelve correctamente
- ❌ `Has tokens? NO` → Backend necesita fix

---

### Punto B: ¿La línea 1611 se ejecuta?

**Ubicación:** `public/js/unified-auth-system-v2.js` línea 1611

**Código actual:**
```javascript
if (response.ok && data.success) {
    // ... verificaciones ...
    const accessToken = data.tokens?.accessToken || data.token;

    // 🔍 DEBUG: Verificar datos
    console.log('[AUTH-LOGIN] 📋 Datos del usuario:', { ... });

    // ← ESTA LÍNEA DEBERÍA EJECUTARSE:
    await this.auth.processLogin(data.user, accessToken, rememberMe);
}
```

**¿Cómo verificar?**
- Hace login
- Busca en Console: `[AUTH-LOGIN] 📋 Datos del usuario:`
- Si lo ves → Significa línea 1611 se ejecutó
- Si NO lo ves → Significa if() evaluó a false (response.ok o data.success son false)

---

### Punto C: ¿saveSession() se ejecuta?

**Ubicación:** `public/js/unified-auth-system-v2.js` línea 1829

**Código actual:**
```javascript
saveSession(userData, token, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.STORAGE_KEYS.token, token);
    storage.setItem(this.STORAGE_KEYS.user, JSON.stringify(userData));

    // ... expiry ...

    debugLog.log('APP', '✅ Sesión guardada en', rememberMe ? 'localStorage' : 'sessionStorage');
}
```

**¿Cómo verificar?**
- Busca en Console: `✅ Sesión guardada en sessionStorage`
- Si lo ves → saveSession() se ejecutó correctamente
- Si NO lo ves → Hay un error antes de que saveSession() se ejecute

**Verificación adicional:**
```javascript
// En Console DESPUÉS de login:
console.log('Token saved?', sessionStorage.getItem('bge_auth_token') ? 'YES' : 'NO');
console.log('Token value:', sessionStorage.getItem('bge_auth_token'));
```

---

### Punto D: ¿El storage está bloqueado?

**Navegadores que bloquean storage:**
- Firefox en modo privado
- Chrome en modo incógnito
- Algunos navegadores más antiguos

**¿Cómo verificar?**
```javascript
try {
    sessionStorage.setItem('test', 'value');
    sessionStorage.removeItem('test');
    console.log('✅ sessionStorage funciona');
} catch (e) {
    console.error('❌ sessionStorage bloqueado:', e.message);
}
```

**Si ves error:**
- Usuario debe deshabilitar modo incógnito
- Limpiar cache y cookies
- Reintentar login

---

## 4️⃣ ÁRBOLES DE DECISIÓN

### Pregunta 1: ¿Sesión se guarda?
```
testSessionLoad() DESPUÉS de login
         ↓
    ┌────┴────┐
    ↓         ↓
   SÍ        NO
    ↓         ↓
[Ir a 2]   [Ir a 3]
```

### Pregunta 2: ¿Header muestra nombre?
```
testHeader() DESPUÉS de login
         ↓
    ┌────┴────┐
    ↓         ↓
   SÍ        NO
    ↓         ↓
✅ TODO     [Ir a 4]
   BIEN
```

### Pregunta 3: ¿Ves [AUTH-LOGIN] en logs?
```
Busca "[AUTH-LOGIN] 📋 Datos" en Console
         ↓
    ┌────┴────┐
    ↓         ↓
   SÍ        NO
    ↓         ↓
[Ir a 5]   [Ir a 6]
```

### Pregunta 4: ¿Ves [AUTH-UI] en logs?
```
Busca "[AUTH-UI]" en Console
         ↓
    ┌────┴────┐
    ↓         ↓
   SÍ        NO
    ↓         ↓
 Fix    Fix main.js
Header  o partials
```

### Pregunta 5: ¿Ves "Sesión guardada" en logs?
```
Busca "✅ Sesión guardada" en Console
         ↓
    ┌────┴────┐
    ↓         ↓
   SÍ        NO
    ↓         ↓
Storage  Process
bloqueado Login
         no llama
```

### Pregunta 6: ¿Ves error en logs?
```
¿Hay mensajes en ROJO en Console?
         ↓
    ┌────┴────┐
    ↓         ↓
   SÍ        NO
    ↓         ↓
Lee   Backend
error no
     responde
```

---

## 5️⃣ CÓDIGO QUE DEBE EXISTIR Y ESTAR CONECTADO

### En unified-auth-system-v2.js

✅ **Debe existir:** Línea 1549 - fetch a `/api/auth/login`
✅ **Debe existir:** Línea 1599 - extracción del token
✅ **Debe existir:** Línea 1611 - llamada a processLogin()
✅ **Debe existir:** Línea 607 - llamada a saveSession()
✅ **Debe existir:** Línea 1829 - sesión.setItem() en sessionStorage

**Verificación:**
```javascript
// En Console:
console.log('processLogin exists?', typeof window.unifiedLogin.processLogin);
console.log('saveSession exists?', typeof window.unifiedLogin.managers.session.saveSession);
console.log('STORAGE_KEYS:', window.unifiedLogin.managers.session.STORAGE_KEYS);
```

---

## 6️⃣ RESUMEN PARA DECISIONES RÁPIDAS

| Síntoma | Causa Probable | Verificación |
|---------|----------------|--------------|
| Sesión NO se guarda pero veo todos los logs | Backend responde mal | Revisar `data.tokens` |
| Sesión NO se guarda y NO veo [AUTH-LOGIN] logs | response.ok es false | HTTP status != 200 |
| Sesión NO se guarda y NO veo "Sesión guardada" | processLogin() no se llama | Revisar línea 1611 |
| Error rojo en Console durante login | Exception en almacenamiento | Storage bloqueado |
| Header sigue vacío pero sesión guardada | updateAuthUI() no actualiza | Falta #userMenuName en header.html |
| Usuario redirigido de iacoins-dashboard | Token not found in storage | Consecuencia de Problema 1 |

---

**FIN DEL ANÁLISIS TÉCNICO**

Usa este documento junto con `ACCIONES_INMEDIATAS_USUARIO.md` para diagnóstico completo.
