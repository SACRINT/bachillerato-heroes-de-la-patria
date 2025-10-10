# 🔐 GU

ÍA COMPLETA: Configurar Google OAuth 2.0

**Fecha**: 04 de Octubre 2025
**Versión**: 1.0
**Estado**: ✅ Implementado (pendiente configuración de Client ID)

---

## 📋 Descripción del Problema

Actualmente, el botón "Iniciar sesión con Google" **NO funciona** porque:

1. ❌ El Client ID de Google OAuth no está configurado
2. ❌ El sistema detecta que no hay configuración válida
3. ❌ Automáticamente redirige al flujo de "Usuario Demo"

**Resultado**: Los usuarios NO pueden usar Google Sign-In real.

---

## ✅ Solución Implementada

Se ha centralizado la configuración de Google OAuth en `js/config.js` y se modificó `js/google-auth-integration.js` para usar esta configuración.

---

## 🛠️ Pasos para Configurar Google OAuth

### PASO 1: Crear Proyecto en Google Cloud Console

1. **Ve a Google Cloud Console**
   👉 https://console.cloud.google.com/

2. **Crea un nuevo proyecto** (o selecciona uno existente)
   - Clic en el menú desplegable de proyectos (arriba a la izquierda)
   - Clic en "Nuevo proyecto"
   - Nombre del proyecto: `BGE Héroes de la Patria`
   - Clic en "Crear"

3. **Espera a que el proyecto se cree** (puede tardar unos segundos)

---

### PASO 2: Habilitar Google Identity Services

1. **Ve a "APIs y servicios" > "Biblioteca"**
   👉 https://console.cloud.google.com/apis/library

2. **Busca**: "Google+ API" o "Google Identity Services"

3. **Habilita la API**
   - Clic en "Habilitar"

---

### PASO 3: Crear Credenciales OAuth 2.0

1. **Ve a "APIs y servicios" > "Credenciales"**
   👉 https://console.cloud.google.com/apis/credentials

2. **Clic en "Crear credenciales" > "ID de cliente de OAuth 2.0"**

3. **Si es tu primera vez**, deberás configurar la "Pantalla de consentimiento de OAuth":
   - **Tipo de usuario**: Externo
   - **Nombre de la aplicación**: `BGE Héroes de la Patria`
   - **Correo de asistencia**: `tu-email@gmail.com`
   - **Logotipo** (opcional): Puedes dejarlo en blanco
   - **Dominio autorizado** (producción): `heroespatria.edu.mx`
   - **Correo del desarrollador**: `tu-email@gmail.com`
   - Clic en "Guardar y continuar"
   - **Alcances** (Scopes): Selecciona:
     - `userinfo.email`
     - `userinfo.profile`
   - Clic en "Guardar y continuar"
   - **Usuarios de prueba**: Agrega tu correo de Gmail
   - Clic en "Guardar y continuar"

4. **Ahora crea las credenciales**:
   - **Tipo de aplicación**: Aplicación web
   - **Nombre**: `BGE Web Client - Development`

5. **Configura los orígenes autorizados de JavaScript**:
   ```
   http://localhost:3000
   http://127.0.0.1:8080
   ```

   **Para producción, agregar**:
   ```
   https://heroespatria.edu.mx
   https://www.heroespatria.edu.mx
   ```

6. **Configura las URI de redireccionamiento autorizados**:
   ```
   http://localhost:3000
   http://127.0.0.1:8080
   ```

   **Para producción, agregar**:
   ```
   https://heroespatria.edu.mx
   https://www.heroespatria.edu.mx
   ```

7. **Clic en "Crear"**

8. **COPIA el Client ID**
   Se verá algo así:
   ```
   123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```

---

### PASO 4: Configurar el Client ID en el Proyecto

#### Opción A: Configuración en `js/config.js` (Recomendado)

1. **Abre el archivo**: `js/config.js`

2. **Busca la sección de Google**:
   ```javascript
   google: {
       clientId: null, // ⬅️ AQUÍ
       apiKey: null,
       enabled: false  // ⬅️ CAMBIAR A true
   },
   ```

3. **Pega tu Client ID**:
   ```javascript
   google: {
       clientId: '123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
       apiKey: null,
       enabled: true  // ✅ ACTIVADO
   },
   ```

4. **Guarda el archivo**

#### Opción B: Configuración en `.env` (Para producción)

1. **Abre el archivo**: `.env.example`

2. **Busca**:
   ```bash
   GOOGLE_OAUTH_CLIENT_ID_DEV=YOUR_GOOGLE_CLIENT_ID_FOR_DEVELOPMENT.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_ID_PROD=YOUR_GOOGLE_CLIENT_ID_FOR_PRODUCTION.apps.googleusercontent.com
   ```

3. **Reemplaza con tus Client IDs**:
   ```bash
   GOOGLE_OAUTH_CLIENT_ID_DEV=123456789-dev.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_ID_PROD=987654321-prod.apps.googleusercontent.com
   ```

4. **Renombra el archivo** de `.env.example` a `.env`

---

### PASO 5: Sincronizar Archivos

**⚠️ IMPORTANTE**: Como el proyecto tiene estructura DUAL, debes copiar los cambios:

```bash
# Copiar config.js actualizado
cp js/config.js public/js/config.js

# Copiar google-auth-integration.js actualizado
cp js/google-auth-integration.js public/js/google-auth-integration.js

# Copiar .env.example actualizado
cp .env.example public/.env.example
```

---

### PASO 6: Probar la Configuración

1. **Reinicia los servidores**:
   ```bash
   # Terminal 1: Backend Node.js
   cd backend
   npm start

   # Terminal 2: Servidor estático (si usas)
   cd public
   python -m http.server 8080
   ```

2. **Abre el navegador**:
   - `http://localhost:3000/index.html`

3. **Abre la consola del navegador** (F12)

4. **Verifica que aparezca**:
   ```
   ✅ [Google Auth] Inicializando con: {
     hasValidClientId: true,
     clientIdConfigured: "✅ Sí",
     isIndexPage: true
   }
   ```

5. **Haz clic en "Iniciar Sesión" en el navbar**

6. **Haz clic en "Iniciar con Google"**

7. **Debe aparecer el popup de Google**:
   - Si aparece el popup de Google ✅ **ÉXITO**
   - Si aparece el modal demo ❌ **Revisa la configuración**

---

## 🚨 Problemas Comunes

### Problema 1: Sigue apareciendo modo DEMO

**Solución**:
1. Verifica que `enabled: true` en `js/config.js`
2. Limpia la caché del navegador (Ctrl + Shift + Delete)
3. Recarga la página con Ctrl + F5

### Problema 2: Error "redirect_uri_mismatch"

**Solución**:
1. Ve a Google Cloud Console > Credenciales
2. Edita tu OAuth Client ID
3. Asegúrate de que la URL exacta esté en "URI de redireccionamiento"
4. Ejemplo: Si accedes con `http://localhost:3000`, debe estar esa URL exacta

### Problema 3: Error "origin_mismatch"

**Solución**:
1. Ve a Google Cloud Console > Credenciales
2. Edita tu OAuth Client ID
3. Agrega el origen en "Orígenes autorizados de JavaScript"
4. Ejemplo: `http://localhost:3000` (SIN barra final)

### Problema 4: Pantalla "Este sitio no es seguro" en producción

**Solución**:
1. Ve a Google Cloud Console > "Pantalla de consentimiento de OAuth"
2. Clic en "Publicar aplicación"
3. Completa el proceso de verificación de Google

---

## 📊 Verificación de Configuración

### Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Identity Services habilitado
- [ ] Credenciales OAuth 2.0 creadas
- [ ] Pantalla de consentimiento configurada
- [ ] Orígenes autorizados agregados
- [ ] URI de redireccionamiento agregados
- [ ] Client ID copiado
- [ ] `js/config.js` actualizado
- [ ] `google.enabled = true` configurado
- [ ] Archivos sincronizados a `public/`
- [ ] Servidores reiniciados
- [ ] Caché del navegador limpiada
- [ ] Popup de Google aparece correctamente

---

## 📝 Notas Adicionales

### Desarrollo vs Producción

**Para Desarrollo**:
- Usa `http://localhost:3000` y `http://127.0.0.1:8080`
- Puedes usar un solo Client ID para ambos

**Para Producción**:
- Crea un Client ID separado para producción
- Usa HTTPS obligatoriamente (`https://tu-dominio.com`)
- Publica la aplicación en Google Cloud Console

### Seguridad

**⚠️ IMPORTANTE**:
- **NUNCA** subas `js/config.js` con el Client ID real a GitHub público
- Usa variables de entorno (`.env`) para producción
- Agrega `js/config.js` a `.gitignore` si tiene datos sensibles

### Alternativa: Archivo config-local.js

Si no quieres modificar `js/config.js` directamente:

1. Crea `js/config-local.js`:
   ```javascript
   // Sobrescribir configuración local
   window.AppConfig.google.clientId = 'TU_CLIENT_ID.apps.googleusercontent.com';
   window.AppConfig.google.enabled = true;
   ```

2. Cárgalo DESPUÉS de `config.js` en `index.html`:
   ```html
   <script src="js/config.js"></script>
   <script src="js/config-local.js"></script> <!-- ⬅️ NUEVO -->
   ```

3. Agrega `js/config-local.js` a `.gitignore`

---

## 🎯 Resultado Esperado

Después de completar esta configuración:

✅ El botón "Iniciar con Google" abre el popup real de Google
✅ Los usuarios pueden autenticarse con su cuenta de Google
✅ El sistema recibe el token de Google y crea la sesión
✅ El usuario ve su nombre y foto de perfil en el navbar

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la consola del navegador** (F12) para errores
2. **Verifica los logs del servidor** backend
3. **Consulta la documentación oficial** de Google:
   👉 https://developers.google.com/identity/gsi/web/guides/overview

---

**Autor**: Claude (Ingeniero Backend Principal)
**Última actualización**: 04 de Octubre 2025
