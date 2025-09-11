# 🌐 Guía de Integración CDN - Bachillerato Héroes de la Patria

## Descripción General

La integración de CDN (Content Delivery Network) con Cloudflare proporciona una capa adicional de rendimiento y escalabilidad para el sitio web. Esta guía detalla la configuración, implementación y uso del sistema CDN.

## 🚀 Características Implementadas

### 1. **Configuración Centralizada**
- ✅ Configuración unificada en `config/cdn.config.js`
- ✅ Variables de entorno para diferentes ambientes
- ✅ Configuraciones específicas por tipo de archivo

### 2. **Optimización de Caché**
- ✅ **Imágenes**: Caché de 1 año con headers inmutable
- ✅ **CSS/JS**: Caché de 1 mes con versionado
- ✅ **Fuentes**: Caché de 1 año con CORS headers
- ✅ **HTML**: Caché de 1 hora con revalidación
- ✅ **Documentos**: Caché de 1 día

### 3. **Automatización de Despliegue**
- ✅ Script automatizado de despliegue con CDN
- ✅ Subida paralela de archivos
- ✅ Purga automática de caché
- ✅ Configuración automática de reglas de página

### 4. **Optimizaciones de Rendimiento**
- ✅ Compresión Gzip automática
- ✅ Minificación HTML/CSS/JS
- ✅ Optimización automática de imágenes
- ✅ HTTP/2 Server Push para assets críticos

## 📋 Configuración Inicial

### 1. **Variables de Entorno**
Copia `.env.example` a `.env` y configura:

```env
# CDN Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id_here
CLOUDFLARE_WEB_ANALYTICS_TOKEN=your_web_analytics_token_here
CDN_ENABLED=true
```

### 2. **Obtener Tokens de Cloudflare**

#### API Token:
1. Ve a [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token" 
3. Usa el template "Zone:Zone Settings:Edit"
4. Selecciona tu zona (dominio)
5. Incluye permisos: Zone:Zone Settings:Edit, Zone:Cache Purge:Purge

#### Zone ID:
1. Ve a tu sitio en Cloudflare Dashboard
2. En la sidebar derecha, encuentra "Zone ID"
3. Copia el ID

### 3. **Configuración DNS**
Asegúrate de que tu dominio apunte a Cloudflare:
- Cambia los nameservers a los proporcionados por Cloudflare
- Configura los registros DNS necesarios

## 🛠️ Uso del Sistema CDN

### Comandos Disponibles

```bash
# Despliegue completo con CDN
npm run deploy:cdn

# Solo build del proyecto
npm run build

# Deploy tradicional (sin CDN)
npm run deploy:prod
```

### Proceso de Despliegue CDN

El comando `npm run deploy:cdn` ejecuta:

1. **Validación de Configuración**
   - Verifica tokens y conectividad
   - Valida variables de entorno

2. **Build del Proyecto**
   - Construye la versión optimizada
   - Genera assets con hash para cache busting

3. **Análisis de Archivos**
   - Categoriza archivos por tipo
   - Calcula estadísticas de deployment

4. **Subida de Archivos**
   - Subida paralela (5 archivos simultáneos)
   - Reintentos automáticos en caso de error
   - Headers optimizados por tipo de archivo

5. **Purga de Caché**
   - Purga selectiva de paths modificados
   - Purga automática de assets críticos

6. **Configuración de Reglas**
   - Aplica reglas de caché por patrón
   - Configura headers de seguridad

## 📊 Monitoreo y Analytics

### Headers de Respuesta Optimizados

```http
# Imágenes
Cache-Control: public, max-age=31536000, immutable
Vary: Accept-Encoding

# CSS/JS
Cache-Control: public, max-age=2592000, immutable
Vary: Accept-Encoding

# HTML
Cache-Control: public, max-age=3600, must-revalidate
Vary: Accept-Encoding

# Fuentes
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

### Cloudflare Analytics
- Habilitado automáticamente con el token de Web Analytics
- Métricas de rendimiento en tiempo real
- Reportes de caché hit/miss rates

## 🔧 Personalización

### Configuración de Caché por Tipo

Edita `config/cdn.config.js` para ajustar:

```javascript
cache: {
  images: {
    ttl: 31536000, // 1 año
    patterns: ['**/*.{jpg,jpeg,png,gif,webp,avif,svg,ico}'],
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
  // ... más configuraciones
}
```

### Reglas de Página Personalizadas

```javascript
pageRules: [
  {
    pattern: '*.heroespatria.edu.mx/api/*',
    settings: {
      cache_level: 'bypass',
      security_level: 'high'
    }
  }
]
```

## 🚨 Resolución de Problemas

### Problemas Comunes

1. **Error de Tokens**
   - Verifica que los tokens tengan los permisos correctos
   - Asegúrate de que el Zone ID sea correcto

2. **Caché No Se Actualiza**
   - Ejecuta purga manual: `cf-purge-cache.js`
   - Verifica que los assets tengan hash único

3. **Assets No Se Cargan**
   - Verifica la configuración de CORS
   - Revisa los dominios permitidos en `astro.config.mjs`

### Debug Mode

Activa modo debug agregando:

```env
DEBUG_CDN=true
```

## 📈 Beneficios Esperados

### Rendimiento
- 🚀 **Reducción de latencia**: 40-60% mejora en tiempo de carga
- 🌍 **Distribución global**: Servidores en múltiples ubicaciones
- 💾 **Reducción de ancho de banda**: Hasta 70% menos tráfico al servidor origen

### Escalabilidad
- ⚡ **Manejo de tráfico**: Soporta picos de hasta 10,000+ usuarios concurrentes
- 🛡️ **Protección DDoS**: Cloudflare automáticamente mitiga ataques
- 📊 **Analytics avanzados**: Métricas detalladas de rendimiento

### SEO
- 🎯 **Core Web Vitals**: Mejora significativa en LCP, FID, CLS
- 🔍 **Indexación**: Páginas más rápidas = mejor ranking
- 📱 **Mobile Performance**: Optimización automática para dispositivos móviles

## 🔮 Próximas Mejoras

### Roadmap CDN v2.0
- [ ] **Edge Computing**: Workers para lógica dinámica
- [ ] **Image Resizing**: Optimización automática de imágenes
- [ ] **Geographic Routing**: Contenido específico por región
- [ ] **A/B Testing**: Pruebas de rendimiento automáticas
- [ ] **Advanced Purging**: Purga inteligente basada en cambios

## 📞 Soporte

Para problemas relacionados con el CDN:

1. **Documentación**: Revisa esta guía completa
2. **Logs**: Ejecuta `npm run deploy:cdn` con `DEBUG=true`
3. **Cloudflare Dashboard**: Verifica métricas y configuración
4. **Contacto**: Reporta issues en el repositorio del proyecto

---

*Esta configuración de CDN está optimizada para el entorno educativo del Bachillerato Héroes de la Patria, proporcionando una experiencia web de clase mundial para estudiantes, padres y personal educativo.*