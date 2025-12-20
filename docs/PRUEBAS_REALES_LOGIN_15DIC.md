# 🔍 PRUEBAS REALES DEL SISTEMA DE LOGIN - 15 Diciembre 2025

## 📋 Objetivo
Identificar exactamente por qué:
1. El login se ve exitoso pero la sesión NO se guarda
2. El header NO muestra el nombre del usuario
3. Cuando intentas acceder a un dashboard protegido, te redirige a index

---

## 🚀 INSTRUCCIONES PASO A PASO

### PASO 1: Abrir el navegador en LOCAL

1. **URL**: http://localhost:3000/index.html
2. **Abre DevTools**: Presiona **F12**
3. **Ve a Console**: Tab **Console**

### PASO 2: Cargar el script de debugging

En la **Console**, copia y pega ESTO:

```javascript
fetch('/DEBUG_LOGIN_SESSION.js')
    .then(r => r.text())
    .then(code => eval(code))
```

**O simplemente copia TODO el contenido de `DEBUG_LOGIN_SESSION.js` y pégalo en la console**

Deberías ver mensajes como:
```
🔍 [DEBUG] Iniciando diagnóstico de sesión...
📦 [STORAGE] Contenido de localStorage:
...
✅ Debugging tools ready!
```

### PASO 3: Ejecutar prueba ANTES del login

En Console, escribe:

```javascript
testSessionLoad()
```

Deberías ver:
```
❌ [TEST] NO HAY SESIÓN GUARDADA
  Token: no
  Usuario: no
```

**Esto es correcto** (aún no has hecho login)

### PASO 4: Hacer login

1. **Click** en el botón "Iniciar Sesión" del header
2. Aparece el modal
3. **Email**: docente@test.com
4. **Contraseña**: Test123!
5. **Click**: "Iniciar Sesión"

Observa en Console si aparecen logs:
```
[AUTH-LOGIN] ✅ Respuesta del servidor: {...}
[AUTH-PROCESS] 📥 userData recibido en processLogin: {...}
```

### PASO 5: Verificar inmediatamente DESPUÉS del login

**SIN CERRAR LA PÁGINA**, en Console ejecuta:

```javascript
testSessionLoad()
```

**Aquí es CRUCIAL ver qué pasa**:

#### ✅ ESCENARIO 1 (LO QUE ESPERAMOS):
```
✅ [TEST] Sesión encontrada
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Usuario: {
    id: 1,
    email: "docente@test.com",
    nombre: "Docente",
    role: "docente"
  }
```

#### ❌ ESCENARIO 2 (PROBLEMA):
```
❌ [TEST] NO HAY SESIÓN GUARDADA
  Token: no
  Usuario: no
```

**Si ves esto, la sesión NO se está guardando. ← PROBLEMA REAL**

### PASO 6: Verificar el header

En Console:

```javascript
testHeader()
```

Deberías ver:
```
Botón login visible? false       (debe ser FALSE = está oculto)
Menú usuario visible? true       (debe ser TRUE = está visible)
Nombre mostrado: Docente         (debe mostrar el nombre del usuario)
```

### PASO 7: Intentar ir a una página protegida

1. En la URL, cambia a: http://localhost:3000/ia-dashboard.html
2. **Presiona Enter**

**Observa qué pasa**:
- ✅ **SI FUNCIONA**: Carga el dashboard (ves contenido de IA)
- ❌ **SI FALLA**: Te redirige a index.html (porque NO hay sesión guardada)

---

## 📊 INTERPRETACIÓN DE RESULTADOS

### Si testSessionLoad() muestra la sesión GUARDADA

✅ **La sesión SÍ se está guardando** → El problema está en otra parte:
- Verificar que `/ia-dashboard.html` tiene el script de validación de sesión
- Verificar que el script valida el token correctamente

### Si testSessionLoad() NO muestra nada

❌ **La sesión NO se está guardando** → Problema en `saveSession()`:
- Verificar que la respuesta del login tiene `tokens.accessToken`
- Verificar que no hay errores en Console durante el login
- Problema probable: El token no se está extrayendo correctamente del response

---

## 🧪 PRUEBAS ADICIONALES

### Test 1: Ver TODOS los logs del login

En Console, durante login, busca estos mensajes:

```
[AUTH-LOGIN] ✅ Respuesta del servidor: {...}
```

**Si NO ves esto**, el endpoint `/api/auth/login` NO está respondiendo correctamente.

### Test 2: Verificar respuesta exacta del endpoint

En Console:

```javascript
await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'docente@test.com',
        password: 'Test123!'
    })
}).then(r => r.json()).then(data => {
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
})
```

**Deberías ver** (estructura esperada):
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "user": {
    "id": 1,
    "email": "docente@test.com",
    "nombre": "Docente",
    "role": "docente"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "sessionInfo": {
    "rememberMe": false
  }
}
```

**Si la respuesta es diferente**, el problema está en el BACKEND.

### Test 3: Simular sesión guardada

En Console:

```javascript
testSessionSave()
```

Esto guarda una sesión de prueba. Luego recarga la página:

```javascript
location.reload()
```

Cuando la página recargue, ejecuta:

```javascript
testSessionLoad()
```

**Deberías ver** la sesión que acabas de guardar.

**Si ves la sesión**, significa que `loadSession()` funciona bien. El problema está en que `saveSession()` no se ejecuta durante el login real.

---

## 📝 CAPTURAR INFORMACIÓN PARA EL DIAGNÓSTICO

Copia EXACTAMENTE estos datos y envíamelos:

### 1. Resultado de testSessionLoad() DESPUÉS del login:
```
❌ O ✅ ?
Mostrar el output exacto
```

### 2. Resultado de testHeader() DESPUÉS del login:
```
Mostrar el output exacto
```

### 3. Todos los logs de Console durante el login:
```
Selecciona todo (Ctrl+A)
Copia (Ctrl+C)
Pégalo aquí
```

### 4. Respuesta del endpoint (del Test 2):
```
Pegar la respuesta JSON aquí
```

Con esta información, podré:
1. ✅ Identificar exactamente dónde falla
2. ✅ Darte un fix específico
3. ✅ Verificar que funciona

---

## 🎯 RESUMEN RÁPIDO

| Prueba | Comando |
|--------|---------|
| Cargar tools | Copiar/pegar contenido de `DEBUG_LOGIN_SESSION.js` en Console |
| Ver sesión ANTES | `testSessionLoad()` |
| Ver sesión DESPUÉS | `testSessionLoad()` (después de login) |
| Ver header | `testHeader()` |
| Test endpoint directo | (Ver Test 2 arriba) |
| Simular sesión | `testSessionSave()` + `location.reload()` |

---

## ✨ PRÓXIMOS PASOS

Una vez que hagas estas pruebas y me envíes los resultados, podré:

1. **Si sesión SÍ se guarda**: Buscar problema en `/ia-dashboard.html` (validación de sesión)
2. **Si sesión NO se guarda**: Arreglar `saveSession()` para que guarde el token correctamente
3. **Si header NO se actualiza**: Arreglar `updateAuthUI()` (timing del DOM)

---

**⏱️ Duración estimada: 5-10 minutos**

**Hazlo ahorita y comparte los resultados. Con eso identifico el problema en minutos.** 🔍

