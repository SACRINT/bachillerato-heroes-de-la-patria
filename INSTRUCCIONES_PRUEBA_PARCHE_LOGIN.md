# 🧪 INSTRUCCIONES DE PRUEBA - Parche de Login

**Fecha:** 15 Diciembre 2025
**Status:** Código pusheado, listo para testing local

---

## ✅ ANTES DE PROBAR

1. **Actualiza tu código local:**
   ```bash
   git pull origin main
   ```

2. **Asegúrate de que el servidor está CORRIENDO:**
   - Si está corriendo, el último commit debe aparecer en los logs
   - Si NO está corriendo, inicia: `npm run dev`

3. **Abre el navegador y haz HARD REFRESH:**
   - **Windows/Linux:** `Ctrl + Shift + R`
   - **Mac:** `Cmd + Shift + R`

---

## 🧪 PRUEBA DEL LOGIN

### Paso 1: Abre DevTools
- Presiona **F12**
- Ve a la pestaña **Console**
- Busca cualquier mensaje que diga `[AUTH-PATCH]`

### Paso 2: Abre el Modal de Login
- En la página, haz clic en **"Iniciar Sesión"**
- En la consola, deberías ver: `[AUTH-PATCH] 🔧 Iniciando parche...`
- Si YES lo ves, ✅ el parche se cargó correctamente

### Paso 3: Ingresa Credenciales
- **Email:** `admin@test.com`
- **Password:** `Admin123!`

### Paso 4: Haz Clic en "Iniciar Sesión"
- En la consola, deberías ver logs como estos:

```
[AUTH-PATCH] 🔐 handleManualLogin interceptado
[AUTH-PATCH] 📤 Enviando login para: admin@test.com
[AUTH-PATCH] 📥 Response status: 200
[AUTH-PATCH] 📊 Response data: {
  success: true,
  hasUser: true,
  hasToken: true,
  message: "Autenticación exitosa"
}
[AUTH-PATCH] 🎯 Validación: {
  responseOk: true,
  hasUser: true,
  hasToken: true,
  messageHasSuccess: true,
  isSuccess: true
}
[AUTH-PATCH] ✅ Login EXITOSO
```

### Paso 5: Verifica el Comportamiento
- ✅ **Modal se cierra** (desaparece)
- ✅ **Header se actualiza** con tu nombre (debería decir "Admin")
- ✅ **Botón de login** cambia a un menú de usuario
- ✅ **Alerta verde** de bienvenida (opcional)

### Paso 6: Prueba Que la Sesión Se Guardó
- Presiona **F5** (refrescar la página)
- Deberías seguir conectado
- El header debería mostrar "Admin"
- Si necesitas ver el token, abre DevTools → Application → Session Storage
  - Debería haber una clave `bge_auth_token` con un valor largo (JWT)

---

## ❌ SI ALGO SALE MAL

### Escenario 1: No ves logs `[AUTH-PATCH]`
**Problema:** El parche no se cargó
**Solución:**
- Haz hard refresh nuevamente (Ctrl+Shift+R)
- Verifica en Consola: ¿hay errores 404?
- Si hay error 404, el archivo `auth-login-patch.js` no se encontró
- Verifica que el archivo existe: `/public/js/auth-login-patch.js`

### Escenario 2: Ves `[AUTH-PATCH]` pero modal no se cierra
**Problema:** El modal se intenta cerrar pero no funciona
**Acción:**
- Copia el log completo de la consola
- Busca dónde dice `[AUTH-PATCH] ❌` (error)
- Comparte ese error conmigo

### Escenario 3: Ves `[AUTH-PATCH] ✅ Login EXITOSO` pero modal sigue abierto
**Problema:** El método `ui.hideModal()` no funciona
**Acción:**
- Abre el archivo `/public/js/auth-login-patch.js`
- En la línea ~158, hay una llamada a `this.ui.hideModal()`
- Puede que el nombre del método sea diferente en el código compilado
- Comparte la lista de métodos disponibles en `this.ui` en consola

### Escenario 4: Modal muestra alerta ROJA en lugar de VERDE
**Problema:** La validación sigue evaluando como error
**Acción:**
- Mira los logs de validación: `[AUTH-PATCH] 🎯 Validación:`
- Verifica qué valores son `false`
- Probablemente `isSuccess: false` significa que `response.ok` o `hasUser` o `hasToken` son false
- Comparte esos valores conmigo

---

## 📋 CHECKLIST DE ÉXITO

Si puedes hacer esto SIN ERRORES, entonces ✅ FUNCIONA:

- [ ] Ves log `[AUTH-PATCH] 🔧 Iniciando parche...` en consola
- [ ] Ves log `[AUTH-PATCH] 🔐 handleManualLogin interceptado` cuando haces clic en login
- [ ] Ves logs de `📤 Enviando login` y `📥 Response status: 200`
- [ ] Ves `[AUTH-PATCH] 🎯 Validación:` con `isSuccess: true`
- [ ] Modal se cierra automáticamente
- [ ] Header muestra "Admin" (tu nombre de usuario)
- [ ] Haces F5 y sigues conectado
- [ ] sessionStorage tiene `bge_auth_token`

---

## 🎯 PRÓXIMOS PASOS

Una vez que el login funcione CORRECTAMENTE:

1. **Prueba acceso a admin-dashboard.html**
   - Debería cargar sin pedir login de nuevo
   - Debería mostrar "Admin" en header

2. **Prueba logout**
   - Busca botón de usuario en header
   - Haz clic en "Cerrar sesión"
   - Deberías volver a la página principal
   - sessionStorage debería estar vacío

3. **Prueba con credenciales INCORRECTAS**
   - Email: `admin@test.com`
   - Password: `incorrecta`
   - Debería mostrar alerta ROJA
   - Modal NO se cierra
   - sessionStorage NO se actualiza

---

## ⏱️ TIEMPO ESTIMADO

- Setup: 2 minutos
- Pruebas: 5 minutos
- Total: 7 minutos

---

**¡Listo! Ahora es tu turno de probar. Comparte qué ves en la consola cuando hagas login.**
