# ⚡ ACCIONES INMEDIATAS PARA EL USUARIO - LOGIN NO FUNCIONA

## 🚨 Situación Actual

**El login parece funcionar pero la sesión NO se guarda.** Esto causa que al entrar a `iacoins-dashboard.html`, seas redirigido a `index.html`.

**Causa:** Token de autenticación NO se está almacenando en `sessionStorage` después del login.

---

## ⏱️ PLAN DE 15 MINUTOS

### MINUTO 0-2: Preparar Herramientas de Debugging

1. Abre tu navegador en **http://localhost:3000**
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Copia TODO el contenido de este archivo: `C:\03_BachilleratoHeroesWeb\DEBUG_LOGIN_SESSION.js`
5. Pégalo en la **Console** y presiona **Enter**
6. Deberías ver mensajes como:
   ```
   🔍 [DEBUG] Iniciando diagnóstico de sesión...
   📦 [STORAGE] Contenido de localStorage:
   ...
   ✅ Debugging tools ready!
   ```

### MINUTO 2-4: Prueba ANTES del Login

En la **Console**, ejecuta:
```javascript
testSessionLoad()
```

**Resultado esperado:**
```
❌ [TEST] NO HAY SESIÓN GUARDADA
  Token: no
  Usuario: no
```

**Esto es CORRECTO** (aún no has hecho login)

### MINUTO 4-8: Hacer Login

1. Cierra DevTools (**F12** de nuevo) o minimiza
2. En la página principal, busca el botón **"Iniciar Sesión"** en el header
3. Click en él
4. Aparece un modal/formulario
5. Ingresa:
   - **Email:** `docente@test.com`
   - **Contraseña:** `Test123!`
6. Click en botón **"Iniciar Sesión"**
7. **MANTÉN DEVTOOLS ABIERTO** - no cierres la ventana

### MINUTO 8-10: Verificar DESPUÉS del Login

**SIN CERRAR DevTools**, en la **Console** ejecuta:
```javascript
testSessionLoad()
```

**AQUÍ ES DONDE VEREMOS EL PROBLEMA:**

#### ✅ Escenario A (LO QUE ESPERAMOS):
```
✅ [TEST] Sesión encontrada
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Usuario: { id: 1, email: "docente@test.com", nombre: "Docente", role: "docente" }
```

**Si ves esto = LOGIN FUNCIONA PERFECTAMENTE**

Próximos pasos:
1. Recarga la página (F5)
2. Intenta ir a `http://localhost:3000/iacoins-dashboard.html`
3. Debería cargar el dashboard SIN problemas

#### ❌ Escenario B (EL PROBLEMA):
```
❌ [TEST] NO HAY SESIÓN GUARDADA
  Token: no
  Usuario: no
```

**Si ves esto = SESSION NO SE PERSISTE (ROOT CAUSE CONFIRMADO)**

Próximo paso: Ejecuta esto para obtener más información:
```javascript
console.log('=== LOGS DE LOGIN COMPLETOS ===');
console.log('Busca estos mensajes en la consola:');
console.log('1. [AUTH-LOGIN] ✅ Respuesta del servidor:');
console.log('2. [AUTH-PROCESS] 📥 userData recibido:');
console.log('3. ✅ Sesión guardada en sessionStorage');
```

### MINUTO 10-15: Obtener Información para Debugging

**En Console, ejecuta:**
```javascript
testHeader()
```

Debería mostrar algo como:
```
🎨 [TEST] Estado actual del header:
  Botón login visible? false       (está bien - debería ser false si estás logueado)
  Menú usuario visible? true        (está bien - debería ser true)
  Nombre mostrado: Docente          (SI FUNCIONA - debería mostrar tu nombre)
```

---

## 📊 QUÉ HACER CON ESTA INFORMACIÓN

### Caso 1: Sesión SÍ se guarda (Escenario A)
✅ **LOGIN FUNCIONA CORRECTAMENTE**
- El problema es diferente (no de persistencia)
- Intenta acceder a `iacoins-dashboard.html`
- Si funciona → TODO BIEN
- Si no funciona → Verificar que archivo existe

### Caso 2: Sesión NO se guarda (Escenario B)
❌ **PROBLEMA CONFIRMADO - SESSION NO PERSISTE**

Acciones adicionales:
1. Busca en los logs de Console: `[AUTH-LOGIN] ✅ Respuesta del servidor:`
   - ¿Lo ves? → Backend devolvió respuesta
   - ¿No lo ves? → Backend no responde correctamente

2. Busca: `✅ Sesión guardada en sessionStorage`
   - ¿Lo ves? → saveSession() se ejecutó
   - ¿No lo ves? → processLogin() no se llamó

3. **COMPARTE TODO ESTO CONMIGO:**
   - Los logs que encontraste
   - El resultado de testSessionLoad()
   - El resultado de testHeader()

---

## 📱 COMANDOS ÚTILES ADICIONALES

En Console, puedes también ejecutar:

```javascript
// Ver EXACTAMENTE lo que hay en storage
console.log('sessionStorage:', sessionStorage.getItem('bge_auth_token'));
console.log('localStorage:', localStorage.getItem('bge_auth_token'));

// Ver estado del sistema de autenticación
console.log('window.unifiedLogin state:', window.unifiedLogin.state);

// Verificar que storage funciona (test básico)
sessionStorage.setItem('test', 'value');
console.log('Storage test:', sessionStorage.getItem('test'));
sessionStorage.removeItem('test');
```

---

## ⚠️ PROBLEMAS COMUNES

### Problema: "No encuentro los logs [AUTH-LOGIN]"
**Causa:** Servidor no está devolviendo respuesta
**Solución:** Verifica que el servidor backend está corriendo en `http://localhost:3000/api`

### Problema: "Veo [AUTH-LOGIN] pero tokens dice (ausente)"
**Causa:** Backend no devuelve token en la respuesta
**Solución:** Backend necesita fix en endpoint `/api/auth/login`

### Problema: "Navigation blocked" en DevTools
**Causa:** El modal intenta redirigir a otra página
**Solución:** Espera, es normal durante pruebas

---

## ✅ CHECKLIST FINAL

Marca esto mientras avanzas:

- [ ] DevTools abierto (F12)
- [ ] DEBUG_LOGIN_SESSION.js pasted en Console
- [ ] testSessionLoad() ejecutado ANTES del login
- [ ] Login completado con docente@test.com / Test123!
- [ ] testSessionLoad() ejecutado DESPUÉS del login
- [ ] Resultados anotados
- [ ] testHeader() ejecutado
- [ ] Logs compartidos conmigo (si hay problema)

---

## 🎯 RESULTADO ESPERADO

**Si todo funciona:**
- Sesión guardada ✅
- Header muestra nombre ✅
- Puedes acceder a iacoins-dashboard.html ✅
- Dashboard carga correctamente ✅

---

**HAZLO AHORA. Debería tomar solo 15 minutos.** ⏱️

Una vez que obtengas los resultados, **comparte los logs conmigo y te daré el fix exacto necesario.** 🚀
