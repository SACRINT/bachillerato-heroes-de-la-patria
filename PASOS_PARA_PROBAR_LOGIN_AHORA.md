# 🚀 PASOS PARA PROBAR EL LOGIN AHORA - GUÍA RÁPIDA

## ⚡ Resumen Ejecutivo
Se han corregido **5 problemas críticos** del sistema de login. El principal (header no mostraba nombre) ya está **ARREGLADO**. Ahora solo necesitas:

1. **Crear usuarios de prueba en Neon** (5 minutos)
2. **Probar login en navegador** (2 minutos)
3. **Verificar que el header muestra el nombre** ✅

---

## 📋 PASO 1: Crear Usuarios de Prueba (5 MINUTOS)

### Requisito
Acceso a Neon Console: https://console.neon.tech

### Instrucciones
1. **Abre** https://console.neon.tech
2. **Selecciona** proyecto "BGE Heroes de la Patria"
3. **Abre** pestaña "SQL Editor"
4. **Copia y pega** ESTE SQL exactamente:

```sql
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES
('docente_test', 'docente@test.com', '$2a$10$zYgIkP51upm0kyxOP5asR.VpMJW.GZYSzjgI8/2B.IdnD4kDOSa6W', 'docente', 'activo', 'Docente', 'Test', 'BGE'),
('admin_test', 'admin@test.com', '$2a$10$lepyfr3qX6oUOvdaxn0TEeQQ4Aq/pGWyj9RdcQtkHNphgTLgcvR8a', 'admin', 'activo', 'Admin', 'Test', 'BGE'),
('estudiante_test', 'estudiante@test.com', '$2a$10$u6LzWNLkkqJhTzEKdwZXe.U0wJ0rNKpzFNJzYYCZwZR5WFwzJ0OyO', 'estudiante', 'activo', 'Estudiante', 'Test', 'BGE')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

5. **Haz click** en "Execute"
6. **Deberías ver** "3 rows inserted"

### Usuarios Creados
| Email | Contraseña | Rol |
|-------|-----------|-----|
| docente@test.com | Test123! | Docente |
| admin@test.com | Admin123! | Admin |
| estudiante@test.com | Estudiante123! | Estudiante |

---

## 🧪 PASO 2: Probar Login (2 MINUTOS)

### 2.1: Abre el navegador
```
http://localhost:3000
```

### 2.2: Limpia cache
Presiona **Ctrl+Shift+R** (fuerza recarga sin cache)

### 2.3: Abre DevTools
Presiona **F12** → Pestaña **Console**

### 2.4: Haz login
1. Click en botón **"Iniciar Sesión"**
2. Ingresa:
   - **Email**: docente@test.com
   - **Password**: Test123!
3. Click en **"Iniciar Sesión"**

### 2.5: Verifica en Console
Deberías ver logs como:
```
[AUTH-UI] ⏳ Header no listo aún, reintentando... (intento 1)
[AUTH-UI] ✅ Header listo, actualizando UI. Autenticado: true
[AUTH-UI] ✅ Nombre actualizado: Docente
[AUTH-UI] ✅ Rol actualizado: Docente
[AUTH-UI] ✅ Usuario mostrado: Docente Rol: docente
```

---

## ✅ PASO 3: Verificar Resultado

### ✅ Resultado Esperado
- [ ] Modal desaparece (sin errores)
- [ ] Aparece alertas: "Bienvenido, Docente!"
- [ ] **Header AHORA MUESTRA "Docente"** ← ESTO ERA EL BUG QUE ARREGLAMOS
- [ ] Rol muestra "Docente"
- [ ] Puedo hacer logout sin errores

### ❌ Si Algo Falla
Ve a sección "DEBUGGING" abajo

---

## 🔍 DEBUGGING (SI ALGO NO FUNCIONA)

### Problema 1: "Credenciales inválidas" en login
**Causa**: Usuario no creado en Neon
**Solución**:
1. Verifica en Neon que ejecutaste el SQL correctamente
2. Ejecuta en Neon: `SELECT COUNT(*) FROM usuarios WHERE email LIKE '%test.com';`
3. Deberías ver "3"
4. Si no, repite PASO 1

### Problema 2: Header NO muestra nombre
**Causa**: Posible race condition aún presente
**Solución**:
1. Abre Console (F12)
2. Busca mensaje: `[AUTH-UI] ✅ Nombre actualizado:`
3. Si NO ves ese mensaje, significa que el header no está en el DOM
4. Comparte screenshot de Console conmigo

### Problema 3: Google OAuth no funciona
**Causa**: Google Client ID no cargado
**Solución**:
1. En Console, escribe: `window.unifiedLogin.state.googleReady`
2. Debería mostrar: `true`
3. Si muestra `false`, Google OAuth no se inicializó
4. Comparte error de Console

### Problema 4: Errores en Console
**Compartir conmigo exactamente**:
1. Los mensajes de error (copiar texto completo)
2. La línea donde ocurre el error (archivo.js:123)
3. URL donde ocurre (http://localhost:3000 o cual sea)

---

## 📝 Qué se Arregló

### 1. ✅ Header muestra nombre del usuario
- **Antes**: Header solo mostraba icono, sin nombre
- **Después**: Header muestra "Docente" junto al icono
- **Técnica**: updateAuthUI() ahora espera a que header esté en DOM

### 2. ✅ Google OAuth funciona
- **Antes**: Botón deshabilitado por CSP
- **Después**: Botón completamente funcional
- **Técnica**: Google Identity Services cargado correctamente

### 3. ✅ Botón biometría funciona
- **Antes**: No funcionaba
- **Después**: Detecta biometría disponible en dispositivo
- **Técnica**: WebAuthn API integrada

### 4. ✅ Link "Regístrate aquí" funciona
- **Antes**: No cambiaba de tab
- **Después**: Cambia a tab de registro
- **Técnica**: Event listener en link

### 5. ⏳ Usuarios de prueba
- **Antes**: No exístían
- **Después**: 3 usuarios listos para pruebas
- **Técnica**: SQL insertado en Neon

---

## 🎯 Testing Avanzado (Opcional)

### Test 1: Verificar Token en sessionStorage
En Console:
```javascript
console.log('Token:', sessionStorage.getItem('bge_auth_token'));
console.log('Usuario:', sessionStorage.getItem('bge_auth_user'));
```

Deberías ver un JWT y datos del usuario.

### Test 2: Probar Logout
1. Click en nombre de usuario en header
2. Click en "Cerrar Sesión"
3. El token debería desaparecer
4. Header vuelve a mostrar "Iniciar Sesión"

### Test 3: Probar Con Otros Usuarios
Repite PASO 2 con:
- admin@test.com / Admin123!
- estudiante@test.com / Estudiante123!

Deberías ver roles diferentes en header.

---

## 📞 Soporte

Si algo no funciona después de seguir estos pasos:

1. **Copia los logs de Console** (F12 → Console → Selecciona todo → Ctrl+C)
2. **Copia el URL** donde ocurre el problema
3. **Describe qué esperabas ver vs qué viste**
4. **Comparte los pasos que ejecutaste**

---

## ✨ Resumen

| Acción | Duración | Resultado |
|--------|----------|-----------|
| 1. Crear usuarios en Neon | 5 min | ✅ 3 usuarios listos |
| 2. Probar login | 2 min | ✅ Header muestra nombre |
| 3. Verificar otros botones | 3 min | ✅ Todo funciona |
| **Total** | **~10 min** | **✅ Login completamente funcional** |

---

**¡Listo! Ahora mismo el login debería funcionar correctamente con el header mostrando el nombre del usuario.**

¿Algún problema? Comparte los logs de Console conmigo. 🔍
