# 🚀 GUÍA COMPLETA: DEPLOYMENT A VERCEL + NEON

**Fecha:** 09 de Octubre 2025
**Proyecto:** BGE Héroes de la Patria
**Tiempo Estimado:** 1h 30min
**Dificultad:** ⭐⭐ (Intermedio)

---

## 📋 PREREQUISITOS

Antes de empezar, asegúrate de tener:

- [x] Cuenta de correo válida (Gmail recomendado)
- [x] Navegador web moderno
- [x] Acceso al proyecto en GitHub (opcional pero recomendado)
- [x] Los archivos del proyecto listos

---

## 🎯 RESUMEN DE LO QUE HAREMOS

1. ✅ **Neon** - Base de datos PostgreSQL serverless (GRATIS)
2. ✅ **Vercel** - Hosting serverless (GRATIS)
3. ✅ **Variables de Entorno** - Configuración segura
4. ✅ **Deploy** - Proyecto en producción

**Resultado:** Proyecto VIVO en internet con URL pública

---

## 📦 PASO 1: CONFIGURAR NEON VIA VERCEL (20 minutos)

### 1.1 Crear Cuenta en Vercel (si aún no la tienes)

1. Ir a: https://vercel.com
2. Click "Sign Up"
3. **IMPORTANTE:** Usar GitHub para login (facilita deployment)
4. Autorizar Vercel a acceder a tus repos

### 1.2 Acceder a Vercel Storage

```
1. Dashboard de Vercel
2. Click en tu proyecto (si ya lo importaste) o "Add New" → "Project"
3. En la barra lateral: "Storage"
4. Click en "Create Database"
```

### 1.3 Seleccionar Neon PostgreSQL

```
1. En la lista de opciones, buscar "Neon"
2. Click en "Continue with Neon"
3. Se abrirá el panel de integración de Neon
```

### 1.4 Crear Cuenta de Neon

**🟢 ESTÁS AQUÍ AHORA:**

```
1. Click en "Accept and Create"
   - Esto acepta los términos de servicio
   - Crea automáticamente tu cuenta de Neon
   - Vincula Neon con tu proyecto de Vercel

2. Esperar 30-60 segundos mientras se crea la cuenta
```

### 1.5 Configurar la Base de Datos

Una vez creada la cuenta:

```
1. Vercel te mostrará el panel de configuración
2. Database name: heroes-patria-db
3. Region: US East (Ohio) - us-east-2 (recomendado)
4. Click "Create"
```

### 1.6 Conexión Automática

**✨ MAGIA DE VERCEL + NEON:**

```
Vercel automáticamente:
✅ Crea la variable DATABASE_URL
✅ La agrega a tu proyecto
✅ Configura la conexión segura
✅ Habilita SSL automáticamente

NO necesitas copiar/pegar connection strings manualmente.
```

---

## 🗄️ PASO 2: EJECUTAR EL SCRIPT SQL (15 minutos)

### 2.1 Acceder al SQL Editor de Neon

**Opción A: Desde Vercel Storage**
```
1. Vercel Dashboard → Tu Proyecto → Storage
2. Click en tu base de datos Neon
3. Click en "Query" o "SQL Editor"
```

**Opción B: Directo en Neon.tech**
```
1. Ir a: https://console.neon.tech
2. Login con la cuenta que acabas de crear
3. Seleccionar tu proyecto
4. Click en "SQL Editor" en la barra lateral
```

### 2.2 Ejecutar el Script PostgreSQL

1. **Abrir el archivo del script:**
   - Ubicación: `backend/scripts/setup-database-neon-postgres.sql`

2. **Copiar TODO el contenido del archivo**

3. **Pegar en el SQL Editor de Neon**

4. **Click en "Run" o presionar Ctrl+Enter**

5. **Verificar la ejecución:**
   ```sql
   -- Deberías ver mensajes de éxito como:
   -- ✅ Table egresados created
   -- ✅ Table usuarios created
   -- ✅ Table bolsa_trabajo created
   -- ✅ Table suscriptores_notificaciones created
   -- ✅ Table logs_sistema created
   ```

### 2.3 Verificar Tablas Creadas

```sql
-- En el SQL Editor de Neon, ejecutar:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Deberías ver:
-- egresados
-- usuarios
-- logs_sistema
-- bolsa_trabajo
-- suscriptores_notificaciones
```

### 2.4 Verificar Datos de Prueba

```sql
-- Verificar egresados
SELECT COUNT(*) FROM egresados;  -- Debe ser 3

-- Verificar usuarios
SELECT COUNT(*) FROM usuarios;   -- Debe ser 1

-- Ver datos de ejemplo
SELECT nombre, email FROM egresados;
SELECT nombre, email, rol FROM usuarios;
```

**✅ Si ves los datos, la base de datos está LISTA**

---

## 🌐 PASO 3: CONFIGURAR VERCEL (25 minutos)

### 3.1 Importar Proyecto a Vercel

**SI TIENES GITHUB REPO:**
```bash
1. Vercel Dashboard → "Add New" → "Project"
2. Import Git Repository
3. Seleccionar tu repo: BachilleratoHeroesWeb
4. Click "Import"
```

**SI NO TIENES GITHUB REPO (crear ahora):**

```bash
# 1. Crear repo en GitHub
#    - Ve a github.com
#    - Click "New repository"
#    - Name: BachilleratoHeroesWeb
#    - Public/Private (tu elección)
#    - NO agregar README, .gitignore, license

# 2. En tu proyecto local:
cd C:\03 BachilleratoHeroesWeb

# 3. Inicializar Git
git init
git add .
git commit -m "🚀 Preparado para deployment en Vercel + Neon"

# 4. Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/BachilleratoHeroesWeb.git
git branch -M main
git push -u origin main

# 5. Ahora sí, en Vercel: Import Git Repository
```

### 3.2 Configurar Build Settings

**Vercel detectará automáticamente `vercel.json`**

```
Framework Preset: Other
Build Command: (dejar vacío)
Output Directory: public
Install Command: npm install
```

### 3.3 Configurar Variables de Entorno

**🔴 CRÍTICAS (DEBEN configurarse):**

```bash
# En Vercel:
1. Settings → Environment Variables
2. Agregar TODAS estas variables:
```

#### Variables Obligatorias:

```bash
# Database (YA CONFIGURADA AUTOMÁTICAMENTE POR NEON)
# DATABASE_URL ya existe, NO la modifiques

# Seguridad (generar valores únicos y largos)
SESSION_SECRET=GENERA_RANDOM_64_CARACTERES_AQUI
JWT_SECRET=GENERA_RANDOM_64_CARACTERES_AQUI

# Email Gmail
EMAIL_USER=21ebh0200x.sep@gmail.com
EMAIL_PASS=TU_APP_PASSWORD_DE_GMAIL
EMAIL_TO=21ebh0200x.sep@gmail.com

# CORS (temporal hasta tener el dominio final)
CORS_ORIGIN=https://*.vercel.app

# Node Environment
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 🔑 Cómo generar SESSION_SECRET y JWT_SECRET:

**Opción 1: PowerShell (Windows)**
```powershell
# Abrir PowerShell y ejecutar:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Opción 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción 3: Online**
```
Ir a: https://generate-secret.vercel.app/64
```

#### 📧 Cómo obtener EMAIL_PASS de Gmail:

```
1. Ir a: https://myaccount.google.com/security
2. Buscar "App passwords" (Contraseñas de aplicaciones)
3. Si no aparece, activar "2-Step Verification" primero
4. Click "Generate"
5. App: "Vercel Backend BGE"
6. Copiar la contraseña generada (16 caracteres sin espacios)
7. Usar ESA contraseña en EMAIL_PASS
```

### 3.4 Agregar las Variables

Para cada variable:

```
1. Name: [nombre de la variable, ej: SESSION_SECRET]
2. Value: [el valor generado]
3. Environment: Production, Preview, Development (seleccionar todos)
4. Click "Save"
```

---

## 🚀 PASO 4: DEPLOY INICIAL (10 minutos)

### 4.1 Ejecutar el Deploy

```bash
# En Vercel dashboard:
1. Con todas las variables configuradas
2. Click "Deploy"
3. Esperar ~2-3 minutos
4. Vercel ejecutará:
   - npm install
   - Build del proyecto
   - Deploy a producción
```

### 4.2 Monitorear el Deploy

```
1. Verás logs en tiempo real
2. Buscar mensajes de éxito:
   ✅ Installing dependencies...
   ✅ Building...
   ✅ Deploying...
   ✅ Deployment successful!
```

### 4.3 Obtener la URL

```
Al finalizar exitosamente:
- URL de producción: https://bge-heroes-patria-abc123.vercel.app
- Copiar esta URL para el siguiente paso
```

---

## ✅ PASO 5: VERIFICAR DEPLOYMENT (10 minutos)

### 5.1 Probar Health Check

```bash
# En navegador o curl:
https://tu-proyecto.vercel.app/api/health

# Respuesta esperada:
{
  "status": "OK",
  "timestamp": "2025-10-09T...",
  "uptime": 0.123,
  "environment": "production",
  "version": "1.0.0"
}
```

**✅ Si ves esto, el backend funciona**

### 5.2 Probar API de Egresados

```bash
https://tu-proyecto.vercel.app/api/egresados/stats/general

# Respuesta esperada:
{
  "success": true,
  "stats": {
    "total": 3,
    "porGeneracion": [...],
    "porEstatus": [...]
  }
}
```

**✅ Si ves datos, la conexión con Neon funciona**

### 5.3 Probar Frontend

```
1. Ir a: https://tu-proyecto.vercel.app
2. Verificar que index.html carga
3. Verificar que el menú funciona
4. Verificar que las imágenes cargan
```

### 5.4 Probar Dashboard Admin

```
1. Ir a: https://tu-proyecto.vercel.app/admin-dashboard.html
2. Login con:
   - Email: admin@heroesdelapatria.edu.mx
   - Password: Admin123!
3. Verificar que el dashboard carga
4. Verificar que los datos se muestran
```

**✅ Si todo funciona, ¡DEPLOYMENT EXITOSO!**

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "DATABASE_URL not defined"

```bash
# Causa: Variable no configurada correctamente
# Solución:
1. Vercel → Settings → Environment Variables
2. Verificar que DATABASE_URL existe (debería estar automática)
3. Si no existe:
   - Ir a Storage → Tu base de datos Neon
   - Click en "Settings"
   - Copiar "Connection String"
   - Agregar como DATABASE_URL manualmente
4. Redeploy
```

### Error: "CORS policy"

```bash
# Causa: CORS_ORIGIN incorrecto
# Solución:
1. Obtener tu URL real de Vercel
2. Actualizar CORS_ORIGIN:
   CORS_ORIGIN=https://tu-proyecto-real.vercel.app
3. Redeploy
```

### Error: "Module not found"

```bash
# Causa: Dependencias no instaladas
# Solución:
1. Verificar que backend/package.json existe
2. Verificar que api/package.json NO existe (puede causar conflictos)
3. Vercel → Settings → General
4. Install Command: cd backend && npm install
5. Redeploy
```

### Error: "Health check timeout"

```bash
# Causa: Función serverless tarda mucho
# Solución:
1. Verificar que backend/server.js exporta app correctamente
2. Verificar que api/index.js existe y es correcto
3. Verificar logs de Vercel:
   Deployments → Click en deployment → View Function Logs
4. Buscar errores específicos
```

### Frontend carga pero APIs fallan

```bash
# Causa: Rutas incorrectas en vercel.json
# Verificación:
1. Abrir vercel.json
2. Verificar sección "routes"
3. Debe tener:
   { "src": "/api/(.*)", "dest": "/api/index.js" }
4. Si está mal, corregir y push a GitHub
```

---

## 🔄 ACTUALIZAR CORS CON DOMINIO REAL

Una vez que el deployment esté funcionando:

```bash
# 1. Copiar tu URL real de Vercel
#    Ejemplo: https://bge-heroes-patria.vercel.app

# 2. Actualizar variable de entorno:
Vercel → Settings → Environment Variables
CORS_ORIGIN=https://bge-heroes-patria.vercel.app

# 3. Redeploy
Deployments → Latest → Redeploy
```

---

## 📊 MÉTRICAS POST-DEPLOYMENT

### Espera Ver:

```
✅ Vercel Dashboard:
   - Build: Success
   - Function: Active
   - Response time: < 1s promedio

✅ Neon Dashboard:
   - Connections: Active
   - Storage: < 100MB (inicio)
   - Queries: Funcionando

✅ Tu URL:
   - Index.html carga ✓
   - APIs responden ✓
   - Dashboard admin funciona ✓
   - Sin errores en consola ✓
```

---

## 🔄 FLUJO DE TRABAJO POST-DEPLOYMENT

### Hacer Cambios:

```bash
# 1. Modificar código localmente
git add .
git commit -m "Descripción del cambio"
git push

# 2. Vercel automáticamente:
#    - Detecta el push
#    - Ejecuta build
#    - Despliega nueva versión
#    - Tu sitio se actualiza en ~2 minutos
```

### Rollback a Versión Anterior:

```bash
# En Vercel dashboard:
1. Deployments → Ver historial
2. Click en versión anterior
3. "Promote to Production"
```

---

## 📝 CHECKLIST FINAL

```
Antes de declarar "COMPLETADO":

Backend:
- [ ] Health check responde en producción
- [ ] API egresados funciona
- [ ] API bolsa-trabajo funciona
- [ ] API suscriptores funciona
- [ ] Login admin funciona

Frontend:
- [ ] Index.html carga correctamente
- [ ] Imágenes se muestran
- [ ] Menú funciona
- [ ] PWA instalable

Base de Datos:
- [ ] Neon conectado
- [ ] 5 tablas creadas
- [ ] Datos de prueba insertados
- [ ] Queries funcionan desde Vercel

Seguridad:
- [ ] SESSION_SECRET configurado
- [ ] JWT_SECRET configurado
- [ ] CORS configurado correctamente
- [ ] HTTPS funcionando (automático Vercel)
- [ ] EMAIL_PASS configurado

Verificación:
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en Function Logs de Vercel
- [ ] Todos los endpoints responden
```

---

## 🎯 SIGUIENTE PASOS (Post-MVP)

Una vez que todo funciona:

1. **Dominio Personalizado:**
   ```
   Vercel → Settings → Domains
   Agregar: www.heroesdelapatria.edu.mx
   Configurar DNS según instrucciones
   ```

2. **Optimización:**
   - Revisar métricas de rendimiento
   - Optimizar imágenes si es necesario
   - Configurar Vercel Analytics

3. **Monitoreo:**
   - Configurar alertas de uptime
   - Revisar logs regularmente
   - Monitorear uso de base de datos

---

## 💰 COSTOS

### Plan Gratuito Incluye:

**Vercel (Free Tier):**
- 100 GB bandwidth/mes
- Serverless Functions: 100 GB-Hrs/mes
- 1000 deploys/mes
- **Costo:** $0/mes

**Neon (Free Tier):**
- 512 MB storage
- 3 GB data transfer/mes
- 1 proyecto
- **Costo:** $0/mes

**Total: $0/mes** ✅

**Capacidad estimada:**
- ~10,000-20,000 usuarios/mes
- 99.9% uptime
- Performance global

---

## 📞 SOPORTE

**Si tienes problemas:**

1. **Logs de Vercel:**
   ```
   Dashboard → Deployments → Click en deployment → View Function Logs
   ```

2. **Logs de Neon:**
   ```
   Neon Dashboard → Tu proyecto → Monitoring
   ```

3. **Test Local:**
   ```bash
   # Verificar que funciona localmente primero
   cd backend
   npm start
   curl http://localhost:3000/api/health
   ```

4. **Comunidad:**
   - Vercel Discord: https://vercel.com/discord
   - Neon Discord: https://neon.tech/discord

---

## ✅ CONCLUSIÓN

Si seguiste todos los pasos:

**TIENES:**
- ✅ Base de datos PostgreSQL serverless (Neon)
- ✅ Backend Node.js serverless (Vercel)
- ✅ Frontend estático optimizado
- ✅ URL pública accesible
- ✅ HTTPS automático
- ✅ Deployment automático con Git
- ✅ 0 costo mensual

**TIEMPO TOTAL:** ~1h 30min

**PRÓXIMO PASO:** Prueba todo exhaustivamente y comparte la URL 🎉

---

🎉 **¡FELICIDADES! Tu proyecto está en PRODUCCIÓN** 🎉

---

**Documento creado:** 09 de Octubre 2025
**Autor:** Claude Code Assistant
**Versión:** 2.0 (Neon Edition)
