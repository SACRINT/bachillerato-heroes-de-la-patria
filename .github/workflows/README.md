# 🚀 CI/CD Pipeline - Proyecto BGE

## 📋 Descripción

Pipeline automatizado de Integración Continua y Despliegue Continuo para el proyecto Bachillerato General Estatal "Héroes de la Patria".

## 🔄 Flujo del Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  Lint   │ -> │  Test   │ -> │  Build  │ -> │ Security │ -> │ Deploy  │
└─────────┘    └─────────┘    └─────────┘    └──────────┘    └─────────┘
     ↓             ↓              ↓               ↓               ↓
  ESLint      Unit Tests     npm build      npm audit      Vercel Prod
  Prettier    Integration    Artifacts      Outdated
              PostgreSQL                    Check
```

## 🎯 Jobs del Pipeline

### 1. 📝 Linting
- **Objetivo**: Verificar la calidad y estilo del código
- **Herramientas**: ESLint, Prettier
- **Acción**: Analiza el código en busca de errores de sintaxis y estilo
- **Fallo**: Si hay errores críticos de lint

### 2. 🧪 Testing
- **Objetivo**: Ejecutar pruebas unitarias e integración
- **Herramientas**: Jest, Supertest (cuando se implementen)
- **Servicios**: PostgreSQL 15 (contenedor)
- **Acción**: Corre todas las pruebas y genera reporte de cobertura
- **Fallo**: Si alguna prueba falla

### 3. 🏗️ Build
- **Objetivo**: Construir el proyecto para producción
- **Herramientas**: npm build
- **Acción**: Compila y optimiza el código para deploy
- **Artefactos**: Guarda archivos generados en caché
- **Fallo**: Si el build falla

### 4. 🔒 Security Scan
- **Objetivo**: Auditar seguridad del proyecto
- **Herramientas**: npm audit, npm-check-updates
- **Acción**: Detecta vulnerabilidades y dependencias obsoletas
- **Fallo**: Si hay vulnerabilidades críticas

### 5. 🚀 Deploy (Solo en main)
- **Objetivo**: Desplegar a producción en Vercel
- **Herramientas**: Vercel CLI
- **Condición**: Solo se ejecuta en push a `main`
- **Acción**: Despliega el código a Vercel
- **Post-Deploy**: Ejecuta health check en `/api/health/simple`
- **Fallo**: Si el deploy falla

### 6. 📢 Notificación
- **Objetivo**: Reportar estado del pipeline
- **Acción**: Genera resumen de todos los jobs

## ⚙️ Configuración Requerida

### Secrets de GitHub

Para que el pipeline funcione correctamente, debes configurar estos **secrets** en tu repositorio de GitHub:

1. **VERCEL_TOKEN**
   - Token de autenticación de Vercel
   - Obtenerlo en: https://vercel.com/account/tokens
   - Scope: `vercel:deploy`

2. **VERCEL_ORG_ID**
   - ID de la organización de Vercel
   - Obtenerlo ejecutando: `vercel whoami`
   - O en la configuración del proyecto Vercel

3. **VERCEL_PROJECT_ID**
   - ID del proyecto en Vercel
   - Obtenerlo en: https://vercel.com/[tu-org]/[tu-proyecto]/settings
   - O ejecutando: `vercel link` en el directorio del proyecto

### Cómo Agregar Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Agrega cada secret con su nombre y valor correspondiente

## 🚦 Triggers del Pipeline

El pipeline se ejecuta automáticamente en los siguientes eventos:

### Push
```yaml
branches:
  - main      # Deploy a producción
  - develop   # Solo CI (sin deploy)
```

### Pull Request
```yaml
branches:
  - main      # PR hacia main
  - develop   # PR hacia develop
```

## 📊 Estados del Pipeline

- ✅ **Success**: Todos los jobs pasaron
- ❌ **Failure**: Al menos un job falló
- 🟡 **Partial**: Algunos jobs se saltaron (ej: deploy en develop)
- ⏭️ **Skipped**: Job no se ejecutó por condiciones

## 🔍 Monitoreo

### Ver el Estado del Pipeline
1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow "CI/CD Pipeline"
3. Ve los detalles de cada job

### Health Check Post-Deploy
Después de cada deploy exitoso, el pipeline ejecuta:
```bash
curl https://tu-proyecto.vercel.app/api/health/simple
```

Respuesta esperada:
```json
{"status":"ok"}
```

## 🛠️ Comandos Útiles

### Ejecutar Localmente

```bash
# Linting
npm run lint

# Tests
npm test

# Build
npm run build

# Security Audit
npm audit
```

### Simular el Pipeline Localmente

Puedes usar [act](https://github.com/nektos/act) para ejecutar el pipeline localmente:

```bash
# Instalar act
brew install act  # macOS
# O descargar desde: https://github.com/nektos/act

# Ejecutar workflow
act -j lint
act -j test
act -j build
```

## 📝 Scripts de package.json

Asegúrate de tener estos scripts en `package.json`:

```json
{
  "scripts": {
    "start": "node backend/server.js",
    "dev": "nodemon backend/server.js",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "build": "echo 'Build step - Add if needed'",
    "deploy": "vercel --prod"
  }
}
```

## 🐛 Troubleshooting

### El Pipeline Falla en Lint
- Ejecuta `npm run lint:fix` localmente
- Commit los cambios

### El Pipeline Falla en Tests
- Verifica que PostgreSQL esté configurado correctamente
- Revisa los logs del job de tests

### El Pipeline Falla en Deploy
- Verifica que los secrets de Vercel estén configurados
- Revisa que `VERCEL_TOKEN` tenga permisos suficientes
- Asegúrate de que el proyecto esté linkeado con Vercel

### Health Check Falla Post-Deploy
- Espera unos minutos (cold start de Vercel)
- Verifica que la base de datos en producción esté accesible
- Revisa los logs de Vercel

## 🔐 Seguridad

- ✅ Secrets nunca se exponen en logs
- ✅ Token de Vercel con permisos mínimos necesarios
- ✅ Audit de seguridad en cada pipeline
- ✅ Variables de entorno separadas por ambiente

## 📈 Mejoras Futuras

- [ ] Agregar notificaciones a Slack/Discord
- [ ] Implementar deploy a staging automático
- [ ] Agregar rollback automático en fallo de health check
- [ ] Integrar SonarQube para análisis de código
- [ ] Agregar badges de estado del pipeline al README
- [ ] Implementar semantic versioning automático

## 📚 Referencias

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [CI/CD Best Practices](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)

---

**Última actualización**: 18 de Octubre, 2025
**Mantenido por**: Equipo de Desarrollo BGE
