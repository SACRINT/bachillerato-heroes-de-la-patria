/**
 * Configuración de CDN para Bachillerato Héroes de la Patria
 * Optimización de rendimiento con Cloudflare CDN
 */

export const cdnConfig = {
  // Configuración general del CDN
  provider: 'cloudflare',
  enabled: process.env.NODE_ENV === 'production',
  
  // URLs del CDN
  urls: {
    production: 'https://cdn.heroespatria.edu.mx',
    staging: 'https://staging-cdn.heroespatria.edu.mx',
    development: 'http://localhost:4321'
  },

  // Configuración de Cloudflare
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    
    // Configuraciones de caché
    cache: {
      // Caché para imágenes - 1 año
      images: {
        ttl: 31536000, // 1 año en segundos
        patterns: ['**/*.{jpg,jpeg,png,gif,webp,avif,svg,ico}'],
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Vary': 'Accept-Encoding'
        }
      },
      
      // Caché para CSS/JS - 1 mes con revisioning
      assets: {
        ttl: 2592000, // 1 mes en segundos
        patterns: ['**/*.{css,js}'],
        headers: {
          'Cache-Control': 'public, max-age=2592000, immutable',
          'Vary': 'Accept-Encoding'
        }
      },
      
      // Caché para fuentes - 1 año
      fonts: {
        ttl: 31536000,
        patterns: ['**/*.{woff,woff2,eot,ttf,otf}'],
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        }
      },
      
      // Caché para HTML - 1 hora con revalidation
      html: {
        ttl: 3600, // 1 hora
        patterns: ['**/*.html', '/'],
        headers: {
          'Cache-Control': 'public, max-age=3600, must-revalidate',
          'Vary': 'Accept-Encoding'
        }
      },
      
      // Caché para documentos - 1 día
      documents: {
        ttl: 86400, // 1 día
        patterns: ['**/*.{pdf,doc,docx,xls,xlsx,ppt,pptx}'],
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'Vary': 'Accept-Encoding'
        }
      }
    },

    // Configuraciones de optimización
    optimization: {
      // Compresión
      compression: {
        enabled: true,
        types: ['text/html', 'text/css', 'application/javascript', 'application/json'],
        level: 'gzip'
      },
      
      // Minificación automática
      minification: {
        html: true,
        css: true,
        js: true
      },
      
      // Optimización de imágenes
      imageOptimization: {
        enabled: true,
        formats: ['avif', 'webp', 'auto'],
        quality: 85,
        progressive: true
      },

      // HTTP/2 Server Push
      http2Push: {
        enabled: true,
        assets: [
          '/assets/css/critical.css',
          '/assets/fonts/main.woff2'
        ]
      }
    },

    // Reglas de página
    pageRules: [
      {
        pattern: '*.heroespatria.edu.mx/assets/*',
        settings: {
          cache_level: 'cache_everything',
          edge_cache_ttl: 31536000,
          browser_cache_ttl: 31536000
        }
      },
      {
        pattern: '*.heroespatria.edu.mx/*.{jpg,jpeg,png,gif,webp,avif,svg}',
        settings: {
          cache_level: 'cache_everything',
          edge_cache_ttl: 31536000,
          browser_cache_ttl: 31536000
        }
      },
      {
        pattern: 'heroespatria.edu.mx/*',
        settings: {
          cache_level: 'cache_everything',
          edge_cache_ttl: 3600,
          browser_cache_ttl: 3600
        }
      }
    ],

    // Configuraciones de seguridad
    security: {
      ssl: 'flexible', // 'off', 'flexible', 'full', 'strict'
      securityLevel: 'medium', // 'essentially_off', 'low', 'medium', 'high', 'under_attack'
      challengePassage: 86400,
      
      // Headers de seguridad
      securityHeaders: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    }
  },

  // Configuración de purga de caché
  purge: {
    // URLs automáticas a purgar en deploy
    auto: [
      '/',
      '/index.html',
      '/sitemap.xml',
      '/robots.txt'
    ],
    
    // Patrones para purga granular
    patterns: {
      all: ['/*'],
      assets: ['/assets/*'],
      images: ['/images/*', '/assets/images/*'],
      css: ['/assets/css/*', '/*.css'],
      js: ['/assets/js/*', '/*.js']
    }
  },

  // Configuración de Analytics y monitoreo
  analytics: {
    enabled: true,
    webAnalytics: process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN,
    realUserMonitoring: true
  }
};

/**
 * Obtiene la URL del CDN según el entorno
 */
export function getCdnUrl() {
  const env = process.env.NODE_ENV;
  
  if (!cdnConfig.enabled) {
    return cdnConfig.urls.development;
  }
  
  switch (env) {
    case 'production':
      return cdnConfig.urls.production;
    case 'staging':
      return cdnConfig.urls.staging;
    default:
      return cdnConfig.urls.development;
  }
}

/**
 * Construye la URL completa para un asset
 */
export function buildAssetUrl(assetPath) {
  const cdnUrl = getCdnUrl();
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${cdnUrl}${cleanPath}`;
}

/**
 * Headers optimizados para diferentes tipos de archivos
 */
export function getOptimizedHeaders(filePath) {
  const { cache } = cdnConfig.cloudflare;
  
  // Determinar tipo de archivo
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(filePath)) {
    return cache.images.headers;
  }
  
  if (/\.(css|js)$/i.test(filePath)) {
    return cache.assets.headers;
  }
  
  if (/\.(woff|woff2|eot|ttf|otf)$/i.test(filePath)) {
    return cache.fonts.headers;
  }
  
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(filePath)) {
    return cache.documents.headers;
  }
  
  return cache.html.headers;
}

export default cdnConfig;