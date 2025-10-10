# 🚀 GUÍA COMPLETA: DEPLOYMENT A VERCEL + PLANETSCALE

**Fecha:** 09 de Octubre 2025
**Proyecto:** BGE Héroes de la Patria
**Tiempo Estimado:** 1h 50min
**Dificultad:** ⭐⭐ (Intermedio)

---

## 📋 PREREQUISITOS

Antes de empezar, asegúrate de tener:

- [x] Cuenta de correo válida (Gmail recomendado)
- [x] Acceso a terminal/CMD
- [x] Node.js instalado (v14+)
- [x] Git instalado
- [x] Código actual funcionando en `localhost:3000`

---

## 🎯 RESUMEN DE LO QUE HAREMOS

1. ✅ **PlanetScale** - Base de datos MySQL en la nube (GRATIS)
2. ✅ **Vercel** - Hosting serverless (GRATIS)
3. ✅ **Variables de Entorno** - Configuración segura
4. ✅ **Deploy** - Proyecto en producción

**Resultado:** Proyecto VIVO en internet con URL pública

---

## 📦 PASO 1: CONFIGURAR PLANETSCALE (30 minutos)

### 1.1 Crear Cuenta en PlanetScale

1. Ir a: https://planetscale.com
2. Click en "Sign up"
3. Usar cuenta de GitHub/Google/Email
4. **Plan:** Seleccionar "Hobby" (GRATIS)
   - 5GB storage
   - 1 billion row reads/month
   - 10 million row writes/month

### 1.2 Crear Database

```bash
# En la web de PlanetScale:
1. Click "Create a database"
2. Name: heroes-patria-db
3. Region: AWS us-east-1 (N. Virginia)
4. Click "Create database"
```

### 1.3 Instalar PlanetScale CLI (OPCIONAL)

```bash
# Windows (con Chocolatey)
choco install planetscale

# macOS (con Homebrew)
brew install planetscale/tap/pscale

# Verificar instalación
pscale version
```

### 1.4 Conectar y Ejecutar Script SQL

**OPCIÓN A: Via Web Console (MÁS FÁCIL)**

1. En PlanetScale dashboard → Tu database
2. Click en "Console" (pestaña)
3. Copiar contenido de `backend/scripts/setup-database-planetscale.sql`
4. Pegarlo en el console
5. Click "Run"

**OPCIÓN B: Via CLI**

```bash
# Login
pscale auth login

# Conectar a database
pscale shell heroes-patria-db main

# Ejecutar script
SOURCE backend/scripts/setup-database-planetscale.sql;

# O copiar y pegar el contenido directamente
```

### 1.5 Verificar Tablas Creadas

```sql
-- En el console de PlanetScale
SHOW TABLES;

-- Deberías ver:
-- egresados
-- logs_sistema
-- usuarios
-- bolsa_trabajo
-- suscriptores_notificaciones

-- Verificar datos
SELECT COUNT(*) FROM egresados;    -- Debe ser 3
SELECT COUNT(*) FROM usuarios;     -- Debe ser 1
```

### 1.6 Obtener Connection String

**IMPORTANTE:** Necesitas el connection string para Vercel

```bash
# Via PlanetScale Web:
1. Dashboard → Tu database
2. Click "Connect"
3. Framework: Node.js
4. Database branch: main
5. Copiar el "Connection string"

# Formato esperado:
mysql://USER:PASSWORD@aws.connect.psdb.cloud/heroes-patria-db?ssl={"rejectUnauthorized":true}
```

**⚠️ GUARDAR ESTE STRING - Lo necesitarás en el siguiente paso**

---

## 🌐 PASO 2: CONFIGURAR VERCEL (20 minutos)

### 2.1 Crear Cuenta en Vercel

1. Ir a: https://vercel.com
2. Click "Sign Up"
3. **IMPORTANTE:** Usar GitHub para login (facilita deployment)
4. Autorizar Vercel a acceder a tus repos

### 2.2 Conectar Repositorio

**SI TIENES GITHUB REPO:**
```bash
1. En Vercel dashboard: "Add New" → "Project"
2. Import Git Repository
3. Seleccionar tu repo: 03-BachilleratoHeroesWeb
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

# 3. Inicializar Git (si no está inicializado)
git init
git add .
git commit -m "🚀 Preparado para deployment en Vercel"

# 4. Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/BachilleratoHeroesWeb.git
git branch -M main
git push -u origin main

# 5. Ahora sí, en Vercel: Import Git Repository
```

### 2.3 Configurar Build Settings en Vercel

**IMPORTANTE:** Vercel detectará automáticamente `vercel.json`

```
Framework Preset: Other
Build Command: (dejar vacío)
Output Directory: public
Install Command: npm install
```

### 2.4 Configurar Variables de Entorno

**🔴 CRÍTICAS (DEBEN configurarse):**

```bash
# En Vercel:
1. Settings → Environment Variables
2. Agregar TODAS estas variables:

# Database
DATABASE_URL=mysql://USER:PASSWORD@aws.connect.psdb.cloud/heroes-patria-db?ssl={"rejectUnauthorized":true}

# Seguridad (generar valores únicos y largos)
SESSION_SECRET=GENERA_RANDOM_64_CARACTERES_AQUI
JWT_SECRET=GENERA_RANDOM_64_CARACTERES_AQUI

# Email Gmail
EMAIL_USER=21ebh0200x.sep@gmail.com
EMAIL_PASS=TU_APP_PASSWORD_DE_GMAIL
EMAIL_TO=21ebh0200x.sep@gmail.com

# CORS
CORS_ORIGIN=https://tu-proyecto.vercel.app

# Node
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**🔑 Cómo generar SESSION_SECRET y JWT_SECRET:**

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: Online
# Ir a: https://generate-secret.vercel.app/64
```

**📧 Cómo obtener EMAIL_PASS de Gmail:**

```
1. Ir a: https://myaccount.google.com/security
2. Buscar "App passwords" (Contraseñas de aplicaciones)
3. Click "Generate"
4. App: "Vercel Backend"
5. Copiar la contraseña generada (16 caracteres)
6. Usar ESA contraseña en EMAIL_PASS
```

**🔄 CORS_ORIGIN:**
```
# TEMPORAL (usar mientras no tengas el dominio final):
CORS_ORIGIN=https://*.vercel.app

# FINAL (después del primer deploy):
CORS_ORIGIN=https://bge-heroes-patria.vercel.app
```

### 2.5 Deploy Inicial

```bash
# En Vercel dashboard:
1. Click "Deploy"
2. Esperar ~2 minutos
3. Si todo sale bien: ✅ "Deployment successful"

# Obtendrás URL como:
# https://bge-heroes-patria-abc123.vercel.app
```

---

## ✅ PASO 3: VERIFICAR DEPLOYMENT (10 minutos)

### 3.1 Probar Health Check

```bash
# En navegador o curl:
curl https://tu-proyecto.vercel.app/api/health

# Respuesta esperada:
{
  "status": "OK",
  "timestamp": "2025-10-09T...",
  "uptime": 0.123,
  "environment": "production",
  "version": "1.0.0"
}
```

### 3.2 Probar API de Egresados

```bash
curl https://tu-proyecto.vercel.app/api/egresados/stats/general

# Respuesta esperada:
{
  "success": true,
  "stats": {
    "total": 3,
    "nuevosUltimos7Dias": 3,
    ...
  }
}
```

### 3.3 Probar Frontend

```
1. Ir a: https://tu-proyecto.vercel.app
2. Verificar que la página index.html carga
3. Verificar que el menú funciona
4. Verificar que las imágenes cargan
```

### 3.4 Probar Dashboard Admin

```
1. Ir a: https://tu-proyecto.vercel.app/admin-dashboard.html
2. Login con:
   - Email: admin@heroesdelapatria.edu.mx
   - Password: Admin123!
3. Verificar tabs funcionan
4. Verificar datos se cargan
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Module not found"

```bash
# Causa: Dependencias no instaladas
# Solución:
1. Vercel → Settings → General
2. Install Command: npm install
3. Redeploy
```

### Error: "DATABASE_URL not defined"

```bash
# Causa: Variable de entorno no configurada
# Solución:
1. Vercel → Settings → Environment Variables
2. Agregar DATABASE_URL con el connection string de PlanetScale
3. Redeploy
```

### Error: "CORS policy"

```bash
# Causa: CORS_ORIGIN incorrecto
# Solución:
1. Actualizar CORS_ORIGIN con tu dominio real de Vercel
2. Redeploy
```

### Error: "Health check timeout"

```bash
# Causa: Función serverless tarda mucho en iniciar
# Solución:
1. Verificar que backend/server.js exporta `app`
2. Verificar que api/index.js existe
3. Redeploy
```

### Frontend carga pero APIs fallan

```bash
# Causa: Rutas en vercel.json incorrectas
# Solución:
1. Verificar que vercel.json tiene las rutas correctas
2. Commit y push cambios
3. Vercel auto-redeploy
```

---

## 🎨 PASO 4: PERSONALIZACIÓN (Opcional)

### 4.1 Dominio Personalizado

```bash
# Si tienes dominio propio (ejemplo.com):
1. Vercel → Settings → Domains
2. Add Domain: www.heroesdelapatria.edu.mx
3. Seguir instrucciones DNS
4. Esperar propagación (10-60 min)
```

### 4.2 Actualizar CORS con Dominio Real

```bash
# Vercel → Environment Variables
CORS_ORIGIN=https://www.heroesdelapatria.edu.mx

# Redeploy
```

### 4.3 Configurar Analytics

```bash
# Vercel Analytics (gratis):
1. Dashboard → Analytics → Enable
2. Configurar objetivos (opcional)
```

---

## 📊 MÉTRICAS POST-DEPLOYMENT

### Espera Ver:

```
✅ Vercel Dashboard:
   - Build: Success
   - Uptime: 99.9%
   - Response time: < 500ms promedio

✅ PlanetScale Dashboard:
   - Connections: Active
   - Storage: < 100MB (inicio)
   - Queries: Funcionando

✅ Tu URL:
   - Index.html carga
   - APIs responden
   - Dashboard admin funciona
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
3. Promote to Production
```

---

## 📝 CHECKLIST FINAL

```
Antes de declarar "COMPLETADO":

Backend:
- [ ] Health check responde en producción
- [ ] API egresados funciona
- [ ] Login admin funciona
- [ ] Formularios envían emails

Frontend:
- [ ] Index.html carga correctamente
- [ ] Imágenes se muestran
- [ ] Menú funciona
- [ ] PWA instalable

Base de Datos:
- [ ] PlanetScale conectado
- [ ] Tablas creadas
- [ ] Datos de prueba insertados
- [ ] Queries funcionan desde Vercel

Seguridad:
- [ ] SESSION_SECRET configurado
- [ ] JWT_SECRET configurado
- [ ] CORS configurado correctamente
- [ ] HTTPS funcionando (automático Vercel)

Monitoreo:
- [ ] Vercel Analytics activado (opcional)
- [ ] Logs revisados sin errores
```

---

## 🎯 SIGUIENTE PASOS (Post-MVP)

Una vez que todo funciona:

1. **Optimización:**
   - Eliminar dependencias no usadas
   - Consolidar service workers
   - Lazy load de imágenes

2. **Monitoreo:**
   - Integrar Sentry para errores
   - Configurar alertas de uptime

3. **Features:**
   - Completar formularios pendientes
   - Google OAuth real
   - Sistema de aprobación

---

## 📞 SOPORTE

**Si tienes problemas:**

1. **Logs de Vercel:**
   ```
   Dashboard → Deployments → Click en deployment → View Function Logs
   ```

2. **Logs de PlanetScale:**
   ```
   Dashboard → Insights → Query statistics
   ```

3. **Test Local:**
   ```bash
   # Verificar que funciona localmente primero
   npm start
   curl http://localhost:3000/api/health
   ```

---

## ✅ CONCLUSIÓN

Si seguiste todos los pasos:

**TIENES:**
- ✅ Base de datos MySQL en la nube (PlanetScale)
- ✅ Backend serverless funcionando (Vercel)
- ✅ Frontend estático servido
- ✅ URL pública accesible
- ✅ HTTPS automático
- ✅ Deployment automático con Git

**TIEMPO TOTAL:** ~2 horas

**COSTO:** $0 (planes gratuitos)

**CAPACIDAD:**
- ~5,000-10,000 usuarios/mes
- 99.9% uptime
- Performance global

---

🎉 **¡FELICIDADES! Tu proyecto está en PRODUCCIÓN** 🎉

---

**Documento creado:** 09 de Octubre 2025
**Autor:** Claude Code Assistant
**Versión:** 1.0
