# 🧪 PROTOCOLO DE PRUEBAS INTERACTIVAS - LOGIN SYSTEM
**Fecha:** 14 de Diciembre 2025
**Objetivo:** Diagnosticar flujo completo de autenticación
**URL Base:** http://localhost:3000

---

## 📋 PASO 1: Preparación Inicial

### 1.1. Abrir Navegador
- URL: `http://localhost:3000/index.html`
- Navegador: Chrome/Edge (DevTools compatible)

### 1.2. Abrir DevTools
- Presiona: `F12` o `Ctrl+Shift+I`
- Tabs a tener visibles:
  - **Console** (principal)
  - **Network** (secundario)
  - **Application → Storage** (terciario)

### 1.3. Configuración DevTools
```javascript
// En Console, ejecutar para logs detallados:
localStorage.setItem('DEBUG', 'true');
console.clear(); // Limpiar console antes de empezar
```

---

## 🔐 PASO 2: Flujo de Login Manual

### 2.1. Abrir Modal de Login
**Acción:** Click en botón "Iniciar Sesión" en header

**Logs Esperados en Console:**
```
[UNIFIED-AUTH] Sistema inicializado
[UNIFIED-AUTH] Modal de login abierto
[UNIFIED-AUTH] Tab activo: manual-login
```

**Capturar:**
- ✅ ¿El modal aparece?
- ✅ ¿Qué tabs se muestran? (Google | Email)
- ✅ Screenshot del modal

---

### 2.2. Llenar Formulario
**Datos de Prueba:**
- Email: `docente@test.com`
- Contraseña: `Test123!`
- Checkbox "Recordarme": ✅ (activado)

**Acción:** Click en botón "Iniciar Sesión"

---

### 2.3. Capturar Request Network
**En Tab Network:**
- Buscar request: `POST /api/auth/login`
- Click derecho → Copy → Copy as cURL
- **Pegar aquí el cURL completo:**

```bash
# PEGAR CURL AQUÍ
```

**Response esperado:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "docente@test.com",
    "nombre": "Docente",
    "apellido_paterno": "Test",
    "role": "docente"
  }
}
```

**Capturar:**
- Status Code: ¿200 OK? ¿401? ¿500?
- Response Body completo
- Response Headers (buscar `Set-Cookie`)

---

### 2.4. Logs de Console POST-LOGIN

**Logs Esperados Paso a Paso:**

```javascript
// 1. Request enviado
[UNIFIED-AUTH] Login request iniciado
[UNIFIED-AUTH] Email: docente@test.com

// 2. Response recibido
[UNIFIED-AUTH] Login exitoso
[UNIFIED-AUTH] Token recibido: eyJhbGc...
[UNIFIED-AUTH] Usuario: {id: 1, email: "docente@test.com", role: "docente"}

// 3. Sesión guardada
[UNIFIED-AUTH] Sesión guardada en sessionStorage
[UNIFIED-AUTH] Clave: auth_token, Valor: eyJhbGc...
[UNIFIED-AUTH] Clave: user_data, Valor: {...}
[UNIFIED-AUTH] remember=true → Copiado a localStorage

// 4. UI Actualizado
[UNIFIED-AUTH] Modal cerrado
[UNIFIED-AUTH] Header actualizado: Modo autenticado
[UNIFIED-AUTH] Icono usuario: visible
[UNIFIED-AUTH] Nombre usuario: "Docente Test"

// 5. Redirect (si aplica)
[UNIFIED-AUTH] Role detectado: docente
[UNIFIED-AUTH] Redirigiendo a: /ia-dashboard.html
```

**CAPTURAR LOGS REALES AQUÍ:**
```
// PEGAR TODOS LOS LOGS DE CONSOLE
```

---

### 2.5. Verificar Estado del Modal

**Preguntas Críticas:**
- ✅ ¿El modal se CIERRA automáticamente?
- ✅ ¿Aparece algún mensaje de éxito? (ej: "Bienvenido Docente Test")
- ✅ ¿Aparece algún error? (ej: "Email o contraseña incorrectos")
- ✅ ¿El modal se queda abierto o se cierra solo?

**Capturar:**
- Screenshot del estado final (modal cerrado/abierto)
- Mensaje exacto que aparece (si hay)

---

### 2.6. Verificar Header Actualizado

**Estado Esperado del Header:**

**ANTES del login:**
```html
<button id="btnLogin">Iniciar Sesión</button>
```

**DESPUÉS del login:**
```html
<div class="user-menu">
  <img src="https://ui-avatars.com/api/?name=Docente+Test" alt="Avatar">
  <span>Docente Test</span>
  <div class="dropdown">
    <a href="/ia-dashboard.html">Mi Dashboard</a>
    <a href="#" id="btnLogout">Cerrar Sesión</a>
  </div>
</div>
```

**Capturar:**
- Screenshot del header ANTES del login
- Screenshot del header DESPUÉS del login
- ¿Qué elementos se muestran? (solo icono, icono+nombre, dropdown?)

---

## 🔍 PASO 3: Verificar Almacenamiento

### 3.1. SessionStorage
**En Console, ejecutar:**
```javascript
console.log('=== SESSION STORAGE ===');
console.log('Keys:', Object.keys(sessionStorage));
console.log('auth_token:', sessionStorage.getItem('auth_token'));
console.log('user_data:', sessionStorage.getItem('user_data'));
console.log('user_role:', sessionStorage.getItem('user_role'));
```

**Output Esperado:**
```
Keys: ['auth_token', 'user_data', 'user_role']
auth_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user_data: {"id":1,"email":"docente@test.com",...}
user_role: docente
```

**PEGAR OUTPUT REAL:**
```
// PEGAR AQUÍ
```

---

### 3.2. LocalStorage (si "Recordarme" activado)
**En Console, ejecutar:**
```javascript
console.log('=== LOCAL STORAGE ===');
console.log('Keys:', Object.keys(localStorage));
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('user_data:', localStorage.getItem('user_data'));
console.log('remember_me:', localStorage.getItem('remember_me'));
```

**Output Esperado:**
```
Keys: ['auth_token', 'user_data', 'remember_me', 'DEBUG']
auth_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user_data: {"id":1,"email":"docente@test.com",...}
remember_me: true
```

**PEGAR OUTPUT REAL:**
```
// PEGAR AQUÍ
```

---

## 🚀 PASO 4: Probar Redirección a Dashboard

### 4.1. Navegación Manual
**Acción:** En la barra de direcciones, ir a:
```
http://localhost:3000/ia-dashboard.html
```

**Comportamientos Posibles:**

**Escenario A: Acceso Exitoso (✅ Correcto)**
- Dashboard carga normalmente
- Console muestra: `[IA-DASHBOARD] Usuario autenticado: docente@test.com`
- Contenido del dashboard visible

**Escenario B: Redirect a Index (❌ Error)**
- Browser redirige a `http://localhost:3000/index.html`
- Console muestra: `[IA-DASHBOARD] Usuario no autenticado, redirigiendo...`
- Razón: No detecta sesión

**Escenario C: Página en Blanco (❌ Error Crítico)**
- Página queda en blanco
- Console muestra errores JavaScript
- Razón: Script crashea antes de verificar auth

**CAPTURAR:**
- ¿Qué escenario ocurre? (A, B, o C)
- Screenshot de la página resultante
- Todos los logs de Console

---

### 4.2. Verificar Logs de ia-dashboard.html

**Logs Esperados:**
```javascript
[IA-DASHBOARD] Script cargado
[IA-DASHBOARD] Verificando autenticación...
[IA-DASHBOARD] sessionStorage auth_token: eyJhbGc...
[IA-DASHBOARD] sessionStorage user_data: {...}
[IA-DASHBOARD] Usuario autenticado: docente@test.com (role: docente)
[IA-DASHBOARD] Inicializando dashboard...
```

**PEGAR LOGS REALES:**
```
// PEGAR AQUÍ
```

---

## 🐛 PASO 5: Diagnóstico de Errores

### 5.1. Si el Login Falla (Status 401/500)

**Verificar en Network:**
- Request Body: ¿Se envía email y password correctamente?
- Response: ¿Qué mensaje de error retorna el backend?

**Posibles Causas:**
- ❌ Usuario no existe en BD
- ❌ Contraseña incorrecta
- ❌ Backend no está corriendo
- ❌ Endpoint `/api/auth/login` no existe

**Ejecutar en Console:**
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'docente@test.com', password: 'Test123!' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

### 5.2. Si el Modal No Se Cierra

**Verificar en Console:**
```javascript
// ¿Hay algún error que bloquea el cierre?
// Buscar errores tipo: "Cannot read property 'remove' of null"
```

**Posibles Causas:**
- ❌ Modal HTML no tiene ID correcto
- ❌ JavaScript crashea antes de cerrar
- ❌ Event listener no está registrado

---

### 5.3. Si el Header No Se Actualiza

**Verificar en Elements Tab:**
```html
<!-- Buscar en DevTools → Elements → header -->
<!-- ¿El botón "Iniciar Sesión" sigue visible? -->
<!-- ¿Hay algún elemento .user-menu creado? -->
```

**Ejecutar en Console:**
```javascript
console.log('Button Login:', document.querySelector('#btnLogin'));
console.log('User Menu:', document.querySelector('.user-menu'));
```

---

### 5.4. Si sessionStorage Está Vacío

**Verificar:**
```javascript
// ¿El response del backend incluye "token"?
// ¿El JavaScript guarda el token correctamente?
```

**Buscar en código:**
- `public/js/unified-auth-system-v2.js` línea ~450
- Método: `saveSession(token, userData)`

---

## 📊 PASO 6: Reporte Final

### 6.1. Checklist de Funcionalidad

| Funcionalidad | ✅ Funciona | ❌ Falla | Observaciones |
|---------------|------------|---------|---------------|
| Modal se abre |  |  |  |
| Formulario envía POST |  |  |  |
| Backend retorna 200 OK |  |  |  |
| Token se guarda en sessionStorage |  |  |  |
| Modal se cierra automáticamente |  |  |  |
| Header muestra usuario autenticado |  |  |  |
| Redirect a ia-dashboard.html funciona |  |  |  |
| Dashboard detecta sesión activa |  |  |  |

---

### 6.2. Logs Completos

**Por favor pega TODOS los logs de Console aquí:**
```
=== LOGS COMPLETOS ===
// Desde que abriste index.html
// Hasta que intentaste acceder a ia-dashboard.html
```

---

### 6.3. Screenshots Críticos

**Adjunta screenshots de:**
1. Modal de login (antes de enviar)
2. Network tab con POST /api/auth/login (Request + Response)
3. Header después del login
4. Application → Storage → sessionStorage
5. ia-dashboard.html (acceso exitoso o redirect)

---

## 🎯 PASO 7: Próximos Pasos Basados en Resultados

### Si TODO Funciona (✅):
- Proceder con testing en producción (Vercel)
- Verificar Google OAuth
- Testing en 34+ páginas HTML

### Si FALLA el Login (❌):
- Revisar backend endpoint `/api/auth/login`
- Verificar usuarios en BD Neon
- Revisar logs de backend en terminal

### Si FALLA el Header (❌):
- Revisar `unified-auth-system-v2.js` método `updateUIAfterLogin()`
- Verificar que `main.js` inyecta header correctamente
- Revisar event listeners

### Si FALLA el Redirect (❌):
- Revisar `ia-dashboard.html` script de autenticación
- Verificar que lee `sessionStorage.getItem('auth_token')`
- Agregar logs de debugging

---

## 🔧 COMANDOS ÚTILES DE DEBUGGING

### Verificar Estado Completo
```javascript
console.log('=== ESTADO COMPLETO ===');
console.log('URL actual:', window.location.href);
console.log('sessionStorage:', { ...sessionStorage });
console.log('localStorage:', { ...localStorage });
console.log('window.unifiedAuth:', window.unifiedAuth);
console.log('window.TENANT_CONFIG:', window.TENANT_CONFIG);
```

### Forzar Logout
```javascript
sessionStorage.clear();
localStorage.removeItem('auth_token');
localStorage.removeItem('user_data');
location.reload();
```

### Forzar Login Manual
```javascript
sessionStorage.setItem('auth_token', 'test-token-123');
sessionStorage.setItem('user_data', JSON.stringify({
  id: 1,
  email: 'docente@test.com',
  nombre: 'Docente',
  role: 'docente'
}));
location.reload();
```

---

**FIN DEL PROTOCOLO**

Por favor ejecuta este protocolo paso a paso y pega TODOS los outputs solicitados.
Esto me permitirá identificar EXACTAMENTE dónde está el problema.
