# 🚨 INSTRUCCIONES URGENTES - PRUEBAS INTERACTIVAS DE LOGIN

**Fecha:** 14 de Diciembre 2025
**Objetivo:** Diagnosticar EXACTAMENTE dónde falla el sistema de login
**Duración Estimada:** 15-20 minutos

---

## 📝 RESUMEN EJECUTIVO

He creado **3 herramientas** para facilitar el debugging:

1. **PROTOCOLO_PRUEBAS_LOGIN_14DIC2025.md** - Guía paso a paso detallada (6,000+ palabras)
2. **public/js/debug-login-helper.js** - Script auxiliar para Console
3. **public/test-login-debug.html** - Página web interactiva de testing

---

## 🎯 OPCIÓN 1: Página de Testing Interactiva (RECOMENDADO - 10 min)

Esta es la forma MÁS RÁPIDA y FÁCIL de diagnosticar el problema.

### Pasos:

1. **Abrir la página de testing:**
   ```
   http://localhost:3000/test-login-debug.html
   ```

2. **Abrir DevTools:**
   - Presiona `F12`
   - Ve a la tab **Console**

3. **Probar el login:**
   - En la página web:
     - Email: `docente@test.com` (ya pre-llenado)
     - Contraseña: `Test123!` (ya pre-llenado)
     - Checkbox "Recordarme": ✅ activado
   - Click en botón **"🚀 Intentar Login"**

4. **Observar resultados:**
   - La página mostrará en tiempo real:
     - ✅ Estado del request (éxito/fallo)
     - 📝 Token recibido
     - 👤 Datos del usuario
     - 💾 Storage actualizado
   - Console mostrará logs detallados

5. **Verificar estado:**
   - Click en **"✅ Verificar Estado Auth"**
   - Verás si la sesión se guardó correctamente

6. **Probar navegación:**
   - Click en **"📊 IA Dashboard"**
   - ¿Te redirige a index o carga el dashboard?

7. **Capturar TODO:**
   - Screenshot de la página web (sección "Output Console")
   - Copia COMPLETA de Console en DevTools
   - Pégalo en un documento de texto

---

## 🎯 OPCIÓN 2: Debugging con Script en Console (AVANZADO - 15 min)

Si prefieres usar el script auxiliar directamente en Console:

### Pasos:

1. **Abrir index.html:**
   ```
   http://localhost:3000/index.html
   ```

2. **Abrir DevTools → Console**

3. **Cargar el script auxiliar:**
   - Abre el archivo: `public/js/debug-login-helper.js`
   - Copia TODO el contenido (380 líneas)
   - Pégalo en Console y presiona Enter

4. **Ejecutar diagnóstico inicial:**
   ```javascript
   debugLoginState()
   ```
   - Copia TODO el output que aparece

5. **Intentar login manual:**
   - Click en "Iniciar Sesión" en el header
   - Llena el formulario:
     - Email: `docente@test.com`
     - Contraseña: `Test123!`
   - Click "Iniciar Sesión"

6. **Verificar estado post-login:**
   ```javascript
   debugLoginState()
   ```
   - Copia TODO el output nuevamente

7. **Test del backend directamente:**
   ```javascript
   await testBackendAuth('docente@test.com', 'Test123!')
   ```
   - Copia el response

8. **Navegar a dashboard:**
   ```javascript
   window.location.href = '/ia-dashboard.html';
   ```

9. **En ia-dashboard.html, ejecutar:**
   ```javascript
   debugLoginState()
   ```

---

## 🎯 OPCIÓN 3: Testing Manual Completo (EXHAUSTIVO - 20 min)

Sigue el protocolo detallado en:
```
PROTOCOLO_PRUEBAS_LOGIN_14DIC2025.md
```

Este documento tiene 7 pasos con capturas específicas de:
- Network requests (cURL)
- Console logs
- sessionStorage/localStorage
- DOM elements
- Screenshots

---

## 📊 INFORMACIÓN QUE NECESITO

Independientemente de la opción que elijas, necesito estos DATOS CRÍTICOS:

### 1. **Request/Response del Login**
```
POST /api/auth/login
Status: ¿200? ¿401? ¿500?
Response Body: {...}
```

### 2. **Console Logs Completos**
```
[UNIFIED-AUTH] ...
[UNIFIED-AUTH] ...
(TODO lo que aparezca)
```

### 3. **Estado de Storage**
```javascript
// SessionStorage
auth_token: ...
user_data: ...

// LocalStorage
auth_token: ...
remember_me: ...
```

### 4. **Comportamiento del Modal**
- ¿Se cierra automáticamente? SÍ / NO
- ¿Qué mensaje aparece? (texto exacto)
- ¿Qué pasa con el header? (describe)

### 5. **Redirect a ia-dashboard.html**
- ¿Carga el dashboard? SÍ / NO
- ¿Redirige a index? SÍ / NO
- ¿Errores en Console? (cuáles)

---

## 🔧 COMANDOS ÚTILES (Copiar y Pegar en Console)

### Ver estado completo:
```javascript
console.log('=== AUTH STATE ===');
console.log('sessionStorage:', { ...sessionStorage });
console.log('localStorage:', { ...localStorage });
console.log('window.unifiedAuth:', window.unifiedAuth);
```

### Test rápido de backend:
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

### Limpiar todo y reiniciar:
```javascript
sessionStorage.clear();
localStorage.clear();
location.reload();
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Si el backend NO responde (ERR_CONNECTION_REFUSED):
```bash
# Verificar que el servidor esté corriendo:
cd C:\03_BachilleratoHeroesWeb
node backend/server.js

# Debería decir:
# ✅ Servidor backend corriendo en http://localhost:3000
```

### Si el login retorna 401 (Unauthorized):
- Usuario no existe en BD
- Contraseña incorrecta
- Verificar en Neon que `docente@test.com` existe

### Si el login retorna 500 (Internal Server Error):
- Ver logs del terminal donde corre el servidor
- Copiar el error exacto
- Envíarmelo

### Si sessionStorage está vacío después del login:
- JavaScript crasheó antes de guardar
- Ver errores en Console (rojos)
- Verificar que `unified-auth-system-v2.js` se cargó

---

## 📋 CHECKLIST DE ENTREGA

Por favor envíame:

- [ ] Screenshot de **test-login-debug.html** (sección Output Console)
- [ ] Console logs COMPLETOS desde que abriste la página
- [ ] Network tab: Request/Response de POST /api/auth/login
- [ ] Output de `debugLoginState()` (si usaste Opción 2)
- [ ] Descripción de qué pasa con el modal (¿se cierra?)
- [ ] Descripción de qué pasa con el header (¿se actualiza?)
- [ ] Resultado al navegar a /ia-dashboard.html (¿funciona?)

---

## 🎯 PRÓXIMOS PASOS SEGÚN RESULTADOS

### Si TODO funciona (✅):
- Proceder con Google OAuth
- Deploy a Vercel
- Testing en producción

### Si FALLA el backend (❌):
- Revisar endpoint `/api/auth/login`
- Verificar BD Neon
- Revisar bcrypt password hash

### Si FALLA el frontend (❌):
- Revisar `unified-auth-system-v2.js`
- Agregar más logs de debugging
- Verificar event listeners

### Si FALLA el redirect (❌):
- Revisar `ia-dashboard.html` script de auth
- Verificar lectura de sessionStorage
- Agregar validación de token

---

**¡Ejecuta las pruebas y envíame los resultados!**

Con esos datos podré identificar EXACTAMENTE dónde está el problema y dar una solución definitiva.

---

## 📞 CONTACTO RÁPIDO

Si necesitas ayuda durante las pruebas:
1. Copia el error exacto que ves
2. Toma screenshot de Console
3. Envíamelo y te respondo con fix inmediato

**¡Buena suerte con las pruebas!** 🚀
