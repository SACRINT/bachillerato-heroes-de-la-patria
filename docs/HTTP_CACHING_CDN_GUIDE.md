# 🚀 HTTP CACHING & CDN CONFIGURATION - SEMANA 4

**Fecha:** 17 Noviembre 2025
**Objetivo:** Optimizar delivery de assets y reducir carga del servidor
**Tecnologías:** HTTP Cache Headers, ETags, CDN (Cloudflare/Vercel)

---

## 📋 TABLA DE CONTENIDOS

1. [HTTP Caching Headers](#http-caching)
2. [ETags y Conditional Requests](#etags)
3. [Configuración de CDN](#cdn-config)
4. [Integración en Backend](#backend-integration)
5. [Testing y Verificación](#testing)

---

## 🔧 HTTP CACHING HEADERS {#http-caching}

### Cache-Control Directivas

| Directiva | Significado | Uso |
|-----------|-------------|-----|
| **public** | Puede cachearse en navegador + proxies/CDN | Assets públicos |
| **private** | Solo caché del navegador (no CDN) | Datos de usuario |
| **no-cache** | Debe revalidar antes de usar | Datos críticos |
| **no-store** | NUNCA cachear | Datos sensibles |
| **max-age=N** | TTL en segundos | Todos los casos |
| **must-revalidate** | Revalidar cuando expira | Datos importantes |
| **immutable** | Nunca cambiará | Assets con hash |

### Ejemplos de Headers

**API Pública (5 minutos):**
```http
Cache-Control: public, max-age=300, must-revalidate
ETag: "abc123def456"
Vary: Accept-Encoding
```

**Contenido Estático (30 días):**
```http
Cache-Control: public, max-age=2592000, immutable
ETag: "xyz789abc123"
Vary: Accept-Encoding
```

**Datos Privados (sin caché):**
```http
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
```

---

## 🏷️ ETAGS Y CONDITIONAL REQUESTS {#etags}

### Flujo de ETag

1. **Primera Request:**
   ```http
   GET /api/noticias
   ```

2. **Servidor Response:**
   ```http
   HTTP/1.1 200 OK
   ETag: "abc123"
   Cache-Control: public, max-age=300

   { "data": [...] }
   ```

3. **Segunda Request (con ETag):**
   ```http
   GET /api/noticias
   If-None-Match: "abc123"
   ```

4. **Servidor Response (no cambió):**
   ```http
   HTTP/1.1 304 Not Modified
   ETag: "abc123"
   ```
   (Sin body - ahorra bandwidth)

5. **Servidor Response (cambió):**
   ```http
   HTTP/1.1 200 OK
   ETag: "def456"

   { "data": [...nuevos datos] }
   ```

### Beneficios de ETags

- **Ahorro de Bandwidth:** 304 responses sin body (95% menos datos)
- **Carga del Servidor:** Menor procesamiento para requests 304
- **UX:** Validación rápida sin re-download

---

## 🌐 CONFIGURACIÓN DE CDN {#cdn-config}

### Opción 1: Cloudflare (Recomendado para producción)

#### Paso 1: Configurar DNS

1. Ir a [cloudflare.com](https://cloudflare.com)
2. Agregar dominio (ej: `bachilleratoheroesdelapatria.edu.mx`)
3. Cambiar nameservers en registrar de dominio
4. Esperar propagación DNS (24-48 horas)

#### Paso 2: Page Rules para Caching

**Regla 1: Assets Estáticos (Max Cache)**
```
URL Pattern: *.bachilleratoheroesdelapatria.edu.mx/public/images/*
```
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 7 days

**Regla 2: JavaScript/CSS (Cache Moderado)**
```
URL Pattern: *.bachilleratoheroesdelapatria.edu.mx/public/js/*
```
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 week
- Browser Cache TTL: 1 day

**Regla 3: API (Cache Corto)**
```
URL Pattern: api.bachilleratoheroesdelapatria.edu.mx/api/*
```
Settings:
- Cache Level: Bypass (dejar que backend maneje con headers)

#### Paso 3: Optimizaciones de Cloudflare

- ✅ **Auto Minify:** JavaScript, CSS, HTML
- ✅ **Brotli Compression:** Mejor que Gzip (20% más compresión)
- ✅ **Polish:** Optimización automática de imágenes (WebP)
- ✅ **Mirage:** Lazy loading de imágenes
- ✅ **Rocket Loader:** Async JavaScript loading

---

### Opción 2: Vercel CDN (Si hospedado en Vercel)

Vercel automáticamente cachea assets estáticos. Configurar en `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/public/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/public/js/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=604800, must-revalidate"
        }
      ]
    },
    {
      "source": "/public/css/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=604800, must-revalidate"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=60, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## 💻 INTEGRACIÓN EN BACKEND {#backend-integration}

### Paso 1: Importar Middleware

```javascript
// backend/server.js o api/app.js
const {
    httpCacheMiddleware,
    apiCacheMiddleware,
    staticCacheMiddleware,
    noCacheMiddleware,
    CACHE_PRESETS
} = require('./middleware/http-cache');
```

### Paso 2: Aplicar a Rutas Específicas

#### API Pública (5 minutos)

```javascript
// backend/routes/noticias.js
const { apiCacheMiddleware } = require('../middleware/http-cache');

router.get('/',
    apiCacheMiddleware({ maxAge: 300 }),  // 5 minutos
    async (req, res) => {
        const noticias = await pool.query('SELECT * FROM noticias WHERE estado = $1', ['publicada']);
        res.json({ success: true, data: noticias.rows });
    }
);
```

#### API Privada (sin caché)

```javascript
// backend/routes/admin.js
const { noCacheMiddleware } = require('../middleware/http-cache');

router.get('/dashboard',
    noCacheMiddleware(),  // Datos sensibles, no cachear
    async (req, res) => {
        const stats = await getDashboardStats();
        res.json({ success: true, data: stats });
    }
);
```

#### Assets Estáticos (30 días)

```javascript
// backend/server.js
const { staticCacheMiddleware } = require('./middleware/http-cache');

// Servir archivos estáticos con cache headers
app.use('/public', staticCacheMiddleware({ maxAge: 86400 * 30 }), express.static('public'));
```

### Paso 3: Usar Presets

```javascript
const { httpCacheMiddleware, CACHE_PRESETS } = require('./middleware/http-cache');

// Realtime (1 minuto)
router.get('/stats/live',
    httpCacheMiddleware(CACHE_PRESETS.REALTIME),
    async (req, res) => { /* ... */ }
);

// Contenido (1 hora)
router.get('/eventos',
    httpCacheMiddleware(CACHE_PRESETS.CONTENT),
    async (req, res) => { /* ... */ }
);

// Inmutable (1 año - para assets con hash)
router.get('/assets/:hash/:file',
    httpCacheMiddleware(CACHE_PRESETS.IMMUTABLE),
    async (req, res) => { /* ... */ }
);
```

---

## 🧪 TESTING Y VERIFICACIÓN {#testing}

### Verificar Headers con curl

```bash
# Ver headers completos
curl -I https://yourdomain.com/api/noticias

# Output esperado:
HTTP/1.1 200 OK
Cache-Control: public, max-age=300, must-revalidate
ETag: "abc123def456"
Vary: Accept-Encoding
Content-Type: application/json
```

### Verificar ETags con curl

```bash
# Primera request (obtener ETag)
curl -I https://yourdomain.com/api/noticias
# Output: ETag: "abc123"

# Segunda request con If-None-Match
curl -I -H 'If-None-Match: "abc123"' https://yourdomain.com/api/noticias
# Output esperado: HTTP/1.1 304 Not Modified
```

### Verificar en Chrome DevTools

1. Abrir DevTools (F12)
2. Network tab
3. Recargar página (Ctrl+R)
4. Ver columna "Size":
   - Primera carga: Tamaño real (ej: 150 KB)
   - Segunda carga: "(disk cache)" o "(memory cache)"
5. Ver columna "Status":
   - 200 OK (primera carga)
   - 304 Not Modified (ETag funciona)
   - 200 OK (from disk cache) (Browser cache funciona)

---

## 📊 MÉTRICAS ESPERADAS POST-IMPLEMENTACIÓN

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Bandwidth mensual** | 100 GB | 30 GB | 70% ↓ |
| **Requests 304 vs 200** | 0% / 100% | 60% / 40% | 60% ahorro |
| **CDN cache hit ratio** | N/A | 85% | N/A |
| **TTFB (Time To First Byte)** | 500ms | 50ms | 90% ↓ |
| **Page Load Time** | 3.5s | 1.2s | 66% ↓ |
| **Server CPU** | 70% | 25% | 64% ↓ |

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Vary Header para Contenido Dinámico

```javascript
// backend/routes/noticias.js

// Cachear diferente para mobile vs desktop
router.get('/featured',
    httpCacheMiddleware({
        maxAge: 600,
        vary: ['Accept-Encoding', 'User-Agent']  // Cache separado por UA
    }),
    async (req, res) => {
        const isMobile = req.headers['user-agent'].includes('Mobile');
        const noticias = await getFeaturedNews(isMobile);
        res.json({ success: true, data: noticias });
    }
);
```

### Purge de Caché Programático

```javascript
// backend/routes/admin.js

// Endpoint para invalidar caché cuando se publique contenido nuevo
router.post('/noticias',
    async (req, res) => {
        const noticia = await createNoticia(req.body);

        // Purge de caché en Cloudflare
        if (process.env.CLOUDFLARE_API_TOKEN) {
            await fetch('https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: [
                        'https://yourdomain.com/api/noticias',
                        'https://yourdomain.com/api/noticias/featured'
                    ]
                })
            });
        }

        res.status(201).json({ success: true, data: noticia });
    }
);
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Setup Inicial
- [ ] HTTP cache middleware creado (`backend/middleware/http-cache.js`)
- [ ] Importado en server.js principal
- [ ] Testing local: headers visibles en curl/DevTools

### Backend Integration
- [ ] API pública con cache (5-60 min)
- [ ] API privada sin cache
- [ ] Assets estáticos con cache largo (30 días)
- [ ] ETags funcionando (verificar 304 responses)

### CDN Configuration
- [ ] Dominio agregado a Cloudflare/Vercel
- [ ] DNS configurado y propagado
- [ ] Page rules configuradas (Cloudflare)
- [ ] Headers configurados (vercel.json)
- [ ] SSL/TLS activado

### Optimizaciones
- [ ] Auto Minify activado
- [ ] Brotli compression activado
- [ ] Image optimization (Polish/WebP)
- [ ] Lazy loading activado (Mirage)

### Testing Post-Deploy
- [ ] curl muestra headers correctos
- [ ] DevTools muestra 304 Not Modified
- [ ] CDN cache hit ratio > 80%
- [ ] TTFB < 100ms (CDN)
- [ ] Page Load Time reducido 50%+

---

## 🎯 RESUMEN DE IMPACTO

**Antes:**
- Sin cache headers → Redownload completo en cada request
- Sin CDN → Todas las requests al servidor origen
- Sin ETags → Sin validación, siempre 200 OK

**Después:**
- Cache headers → 60% de requests sirven desde browser cache
- CDN → 85% de requests sirven desde edge (< 50ms)
- ETags → 30% adicional de requests 304 Not Modified

**Resultado:**
- **Bandwidth:** 70% reducción
- **Server Load:** 85% reducción
- **TTFB:** 90% reducción (500ms → 50ms)
- **Page Load:** 66% reducción (3.5s → 1.2s)

---

**Próximo paso:** Deploy a producción y monitorear métricas en Cloudflare Analytics.
