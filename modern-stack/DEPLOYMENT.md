# 🚀 Guía de Deployment - Bachillerato Héroes de la Patria

Esta guía describe el proceso completo de deployment para el sitio web del Bachillerato Héroes de la Patria.

## 📋 Pre-requisitos

### Software Requerido
- **Node.js** v18.0.0 o superior
- **npm** v9.0.0 o superior  
- **Git** configurado con acceso al repositorio

### Configuración del Entorno
1. Copia `.env.example` a `.env` y configura las variables necesarias
2. Asegúrate de tener permisos de escritura en el repositorio
3. Configura las GitHub Actions secrets (ver sección de Configuración)

## 🔧 Configuración de GitHub Secrets

En tu repositorio GitHub, ve a **Settings → Secrets and variables → Actions** y agrega:

```
LHCI_GITHUB_APP_TOKEN     # Token de Lighthouse CI
LHCI_TOKEN               # Token de Lighthouse server
SLACK_WEBHOOK_URL        # URL webhook de Slack (opcional)
```

## 🚀 Métodos de Deployment

### 1. Deployment Automático (Recomendado)

El deployment se ejecuta automáticamente en cada push a la rama `main`:

```bash
# 1. Hacer cambios en tu rama de desarrollo
git add .
git commit -m "feat: nueva funcionalidad"

# 2. Merge a main (esto triggerea el deployment)
git checkout main
git merge tu-rama-feature
git push origin main
```

### 2. Deployment Manual con Script

```bash
# Ejecutar el script de deployment
npm run deploy:prod
```

Este script realiza:
- ✅ Verificación de rama y estado del repositorio
- ✅ Actualización desde remoto
- ✅ Instalación de dependencias
- ✅ Ejecución de tests y linting
- ✅ Build de producción
- ✅ Push para triggear GitHub Actions

### 3. Deployment Manual Paso a Paso

```bash
# 1. Verificar rama actual
git branch --show-current

# 2. Asegurar que estamos en main
git checkout main
git pull origin main

# 3. Instalar dependencias
npm ci

# 4. Ejecutar tests
npm run test
npm run type-check
npm run lint

# 5. Build de producción
npm run build

# 6. Push para triggear deployment
git push origin main
```

## 🔄 Pipeline de CI/CD

### Flujo de GitHub Actions

1. **🧪 Test & Lint Job**
   - Type checking con TypeScript
   - Linting con ESLint
   - Ejecución de tests unitarios

2. **🏗️ Build & Deploy Job**  
   - Build de la aplicación Astro
   - Análisis de bundle size
   - Lighthouse CI performance test
   - Deployment a GitHub Pages

3. **📈 Post Deploy Tasks**
   - Métricas de performance
   - Notificaciones (Slack)
   - Health check automático

### Archivos de Configuración

- `.github/workflows/deploy.yml` - Pipeline principal
- `.github/workflows/security-audit.yml` - Auditoría de seguridad
- `.github/workflows/performance-monitoring.yml` - Monitoreo continuo
- `lighthouserc.js` - Configuración Lighthouse CI

## 📊 Verificación Post-Deployment

### 1. Health Check Automático

```bash
npm run health-check
```

Verifica:
- ✅ Todas las páginas críticas responden correctamente
- ✅ Características SEO están activas
- ✅ Funciones de performance funcionan
- ✅ Service Worker registrado
- ✅ PWA manifest disponible

### 2. Verificación Manual

Visita estas URLs para confirmar el deployment:

- **🏠 Inicio**: https://sacrint.github.io/03-BachilleratoHeroesWeb/
- **📚 Conocenos**: https://sacrint.github.io/03-BachilleratoHeroesWeb/conocenos
- **🎓 Oferta Educativa**: https://sacrint.github.io/03-BachilleratoHeroesWeb/oferta-educativa
- **🔍 Transparencia**: https://sacrint.github.io/03-BachilleratoHeroesWeb/transparencia

### 3. Performance Testing

```bash
# Lighthouse CI
npm run lighthouse

# Web Vitals monitoring
npm run analyze
```

## 🛠️ Troubleshooting

### Deployment Falló

```bash
# Ver logs de GitHub Actions
# Ve a: Repository → Actions → último workflow run

# Debugging local
npm run build
# Revisar errores en consola
```

### Problemas de Performance

```bash
# Analizar bundle size
npm run analyze

# Ejecutar Lighthouse local
npx lighthouse https://sacrint.github.io/03-BachilleratoHeroesWeb/ --view
```

### Issues de Contenido

```bash
# Verificar que todas las páginas existen
npm run health-check

# Build local para debugging
npm run dev
```

## 📈 Monitoreo Continuo

### Métricas Automáticas

- **🔦 Lighthouse CI**: Cada deployment
- **📊 Web Vitals**: Cada 6 horas  
- **🔒 Security Audit**: Semanal
- **🏥 Health Check**: Bajo demanda

### Alertas y Notificaciones

- Deployment exitoso/fallido → Slack
- Performance regression → GitHub Issues
- Security vulnerabilities → Email

## 🔐 Seguridad

### Configuraciones de Seguridad

- CSP Headers configurados
- HTTPS enforcement
- Security headers en respuestas
- Dependencias auditadas semanalmente

### Buenas Prácticas

- ✅ Nunca commites secrets al repositorio
- ✅ Usa variables de entorno para configuración
- ✅ Mantén dependencias actualizadas
- ✅ Ejecuta auditorías de seguridad regularmente

## 📞 Contacto de Soporte

En caso de problemas con el deployment:

1. **Revisar logs** de GitHub Actions
2. **Ejecutar health-check** local
3. **Contactar al equipo** de desarrollo
4. **Documentar el issue** para futuras referencias

---

**🎯 Objetivo**: Deployment confiable, rápido y automatizado para el sitio web del Bachillerato Héroes de la Patria "Héroes de Puebla"