# 🔐 Configuración de Google Sign-In

## 📋 **PROBLEMA ACTUAL**

El botón de Google Sign-In muestra error 400/403 porque no está configurado con un Client ID real.

**Estado actual:** ❌ Deshabilitado (se oculta automáticamente)
**Para habilitar:** ✅ Sigue estas instrucciones

---

## 🚀 **PASOS PARA CONFIGURAR GOOGLE SIGN-IN**

### **1. Crear proyecto en Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs y servicios** > **Credenciales**

### **2. Configurar OAuth 2.0**

1. Click en **"+ CREAR CREDENCIALES"** > **"ID de cliente de OAuth 2.0"**
2. Selecciona **"Aplicación web"**
3. Configura los orígenes autorizados:
   ```
   Orígenes JavaScript autorizados:
   - https://sacrint.github.io
   - https://sacrint.github.io/heroes_de_la_patria_oficial
   
   URIs de redirección autorizados:
   - https://sacrint.github.io/heroes_de_la_patria_oficial/
   ```

### **3. Obtener Client ID**

1. Copia el **Client ID** generado (algo como: `123456789-abcdef.googleusercontent.com`)
2. También puedes obtener una **API Key** si planeas usar otras APIs de Google

### **4. Configurar en el código**

Edita el archivo `js/config.js`:

```javascript
// En js/config.js - líneas 24-28
google: {
    clientId: 'TU_GOOGLE_CLIENT_ID.googleusercontent.com', // ← Pega aquí tu Client ID
    apiKey: 'TU_GOOGLE_API_KEY',   // ← Opcional: API Key
    enabled: true  // ← Cambiar a true para habilitar
},
```

**Ejemplo real:**
```javascript
google: {
    clientId: '123456789012-abcdefghijklmnopqrstuvwxyz.googleusercontent.com',
    apiKey: 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
    enabled: true
},
```

---

## ✅ **VERIFICAR FUNCIONAMIENTO**

Después de configurar:

1. **Recarga la página**
2. **Click en "Iniciar Sesión"**
3. **Verifica que aparezca el botón de Google**
4. **Prueba el login con tu cuenta Google**

---

## 🔧 **MODO ACTUAL (SIN CONFIGURAR)**

**Estado:** El sistema detecta automáticamente que Google no está configurado y:
- ✅ Oculta el botón de Google Sign-In
- ✅ Oculta el separador "o continúa con"
- ✅ Solo muestra autenticación tradicional (email/password)
- ✅ No genera errores 400/403

**En consola verás:**
```
⚠️ Google Sign-In no configurado - ocultando botón
🔐 Usando solo autenticación tradicional
```

---

## 🎯 **BENEFICIOS DE HABILITAR GOOGLE SIGN-IN**

- ✅ **Login rápido** para estudiantes/profesores con Gmail
- ✅ **No necesitan recordar otra contraseña**
- ✅ **Verificación automática** de email
- ✅ **Integración con Google Workspace** (si la escuela lo usa)
- ✅ **Foto de perfil automática**

---

## 🛠️ **PARA DESARROLLADORES**

**Estructura del código:**
- `js/auth-interface.js` - Lógica de autenticación
- `js/config.js` - Configuración de APIs
- `js/api-client.js` - Cliente API con soporte Google

**Función principal:**
```javascript
window.handleGoogleCredentialResponse(response)
```

**Fallback:** Si el backend no está disponible, el sistema guarda la sesión localmente.

---

## 📞 **SOPORTE**

Si necesitas ayuda configurando Google Sign-In:
1. Consulta la documentación de Google
2. Verifica que el dominio esté bien configurado
3. Revisa la consola del navegador para errores específicos

**¡La autenticación tradicional funciona perfectamente sin Google!**