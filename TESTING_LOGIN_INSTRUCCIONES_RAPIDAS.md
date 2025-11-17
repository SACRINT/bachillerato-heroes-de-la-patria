# 🧪 TESTING RÁPIDO DEL LOGIN - Instrucciones para Validar Correcciones

## Requisitos Previos
- ✅ Backend ejecutándose: `node backend/server.js`
- ✅ Base de datos PostgreSQL conectada (Neon)
- ✅ Cambios committeados: Commit `9bbe0b2` en GitHub

---

## Opción 1: Testing Rápido en Navegador (SIN código)

### Paso 1: Abre el Navegador
```
http://localhost:3000
O
http://tudominio.vercel.app (si está en producción)
```

### Paso 2: Haz Clic en "Iniciar Sesión" o "Login"
- Debería aparecer un modal con 2 campos:
  - Campo de email/usuario
  - Campo de contraseña

### Paso 3: Intenta Login
**Prueba A (Debe FALLAR - para validar validación):**
```
Email: test@test.com
Contraseña: wrongpassword

Resultado esperado:
❌ Modal muestra: "Credenciales inválidas"
```

**Prueba B (Debe FUNCIONAR - con usuario real de BD):**

Primero, obtén un usuario válido ejecutando:
```bash
node backend/scripts/test-db-connection.js
```

Esto mostrará los primeros 3 usuarios de la tabla `usuarios`.

Luego usa esas credenciales:
```
Email: [username del usuario]
Contraseña: [su contraseña]

Resultado esperado:
✅ Modal acepta credenciales
✅ Después de 2 segundos, modal cierra
✅ Página muestra usuario autenticado en header/menu
✅ Acceso a dashboard permitido
```

### Paso 4: Verifica en DevTools (F12)
1. Abre Chrome DevTools: **F12**
2. Ve a **Console**:
   - Debe estar SIN ERRORES rojos
   - Puede haber warnings amarillos (ignorables)
3. Ve a **Network** y filtra por:
   - Busca request POST a `/api/auth/login`
   - Click derecho → "Copy as cURL"
   - Paste en terminal para ver el payload completo

4. Ve a **Application > Local Storage**:
   - Busca clave: `bge_auth_token` o similar
   - Debe contener JWT token (string largo de 200+ caracteres)

---

## Opción 2: Testing con cURL (Terminal)

### Paso 1: Obtén un Usuario Válido
```bash
node backend/scripts/test-db-connection.js
```
Anota: `usuario1_username` y `usuario1_password`

### Paso 2: Prueba Login con cURL
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario1_username",
    "password": "usuario1_password",
    "rememberMe": true
  }'
```

### Paso 3: Interpreta Respuesta

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "user": {
    "id": 1,
    "username": "usuario1_username",
    "email": "usuario1@example.com",
    "nombre": "Juan",
    "apellido_paterno": "Pérez",
    "role": "estudiante"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiry": 1700000000,
    "expiresAt": "2025-11-16T12:30:00Z"
  },
  "sessionInfo": {
    "loginTime": "2025-11-16T11:30:00.000Z",
    "rememberMe": true,
    "expiresAt": "2025-11-16T12:30:00Z"
  }
}
```

**Respuesta fallida (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Credenciales inválidas",
  "message": "Email o contraseña incorrectos"
}
```

---

## Opción 3: Testing con Postman (Si tienes instalado)

### Paso 1: Crea Nueva Request
- **Método:** POST
- **URL:** `http://localhost:3000/api/auth/login`

### Paso 2: Headers
```
Content-Type: application/json
```

### Paso 3: Body (raw JSON)
```json
{
  "username": "usuario1_username",
  "password": "usuario1_password",
  "rememberMe": true
}
```

### Paso 4: Click Send
- Verifica que Status sea 200 y body contiene token

---

## Validación Checklist

Marca cada item como ✅ una vez completado:

### Frontend (Modal)
- [ ] Modal aparece al hacer click en "Iniciar Sesión"
- [ ] Campo de usuario/email acepta input
- [ ] Campo de contraseña acepta input
- [ ] Botón "Iniciar Sesión" es clickeable

### Autenticación Correcta
- [ ] Login exitoso con credenciales válidas (username + password)
- [ ] Modal cierra después de login exitoso
- [ ] Usuario permanece autenticado en página recargada
- [ ] Header/menu muestra nombre del usuario autenticado

### Validación de Errores
- [ ] Login fallido con credenciales incorrectas muestra error
- [ ] Mensaje de error es claro: "Credenciales inválidas"
- [ ] Después de 5 intentos fallidos, bloquea por 15 minutos (rate limiting)
- [ ] Mensajes de error NO revelan si usuario existe o no (seguridad)

### Backend
- [ ] POST `/api/auth/login` retorna 200 OK
- [ ] Respuesta contiene `tokens.accessToken` (NO `data.token`)
- [ ] Token es JWT válido (3 partes separadas por puntos)
- [ ] Console NO muestra errores SQL

### Base de Datos
- [ ] Query valida contraseña con bcrypt
- [ ] Usuario es recuperado de tabla `usuarios`
- [ ] NO hay hardcoded credentials
- [ ] TODO viene de PostgreSQL

### DevTools Console
- [ ] SIN ERRORES rojos
- [ ] Network POST `/api/auth/login` visible
- [ ] localStorage contiene token válido

---

## Troubleshooting

### ❌ "Error: Cannot POST /api/auth/login"
- Verifica que backend está ejecutándose: `node backend/server.js`
- Verifica que ruta está registrada en `backend/routes/auth.js`
- Reinicia backend y prueba de nuevo

### ❌ "Credenciales inválidas" incluso con usuario válido
- Verifica username (no email) en el payload:
  ```
  INCORRECTO: { "email": "user@example.com" }
  CORRECTO: { "username": "juan.perez" }
  ```
- Verifica que usuario existe en `usuarios` table
- Revisa contraseña en base de datos (debe estar en bcrypt hash)

### ❌ "Token is undefined" después de login exitoso
- Verifica que respuesta contiene `tokens.accessToken`:
  ```json
  {
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
  ```
- NO debe ser `{ "token": "..." }` (estructura antigua)

### ❌ "Network request blocked by CORS"
- Verifica CORS headers en `backend/server.js`
- Asegura que origen está permitido

### ❌ "Database connection refused"
- Verifica que Neon está accesible
- Verifica `DATABASE_URL` en `.env`
- Ejecuta: `node backend/scripts/test-db-connection.js`

---

## Comandos Útiles

### Ver usuarios disponibles en BD
```bash
node backend/scripts/test-db-connection.js
```
Mostrará primeros 3 usuarios con estructura.

### Reiniciar backend
```bash
# Detener proceso anterior (Ctrl+C)
# Reiniciar
node backend/server.js
```

### Ver logs en tiempo real
```bash
# En otra terminal
tail -f backend/logs/debug.log
```

### Limpiar sesión para nuevo login
En DevTools Console:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## Resultado Esperado Final

✅ Usuario puede:
1. Ingresar email/usuario y contraseña en modal
2. Hacer click en "Iniciar Sesión"
3. Backend valida contra PostgreSQL
4. Token JWT se guarda en localStorage
5. Modal cierra
6. Usuario accede al dashboard autenticado

❌ Sistema NO permite:
1. Hardcoded credentials
2. Demo login sin base de datos
3. Acceso sin token válido
4. Tokens sin expiración

---

**Documento:** Testing rápido del fix de login
**Fecha:** 16 de Noviembre de 2025
**Commit:** 9bbe0b2
**Status:** 🟢 LISTO PARA VALIDACIÓN
