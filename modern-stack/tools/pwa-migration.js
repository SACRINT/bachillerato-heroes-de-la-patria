#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_ROOT = path.resolve(__dirname, '../../');
const MODERN_ROOT = path.resolve(__dirname, '../');

const log = {
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  step: (msg) => console.log(chalk.cyan('🔄 ' + msg))
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function migratePWAManifest() {
  log.step('Migrando PWA manifest...');
  
  const legacyManifest = path.join(LEGACY_ROOT, 'manifest.json');
  const modernManifest = path.join(MODERN_ROOT, 'apps/web/public/manifest.json');
  
  if (!(await fileExists(legacyManifest))) {
    log.warning('manifest.json no encontrado en el sitio legacy');
    return false;
  }
  
  try {
    const legacyContent = await fs.readFile(legacyManifest, 'utf-8');
    const manifest = JSON.parse(legacyContent);
    
    // Actualizar manifest para la nueva arquitectura
    const updatedManifest = {
      ...manifest,
      start_url: '/03-BachilleratoHeroesWeb/',
      scope: '/03-BachilleratoHeroesWeb/',
      id: '/03-BachilleratoHeroesWeb/',
      
      // Mejorar información del app
      name: manifest.name || 'Bachillerato Héroes de la Patria - Héroes de Puebla',
      short_name: manifest.short_name || 'Héroes Patria',
      description: manifest.description || 'Centro de Bachillerato Tecnológico Industrial y de Servicios No. 166 "Héroes de la Patria"',
      
      // Configuración PWA moderna
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: manifest.theme_color || '#2563eb',
      background_color: manifest.background_color || '#ffffff',
      
      // Categorías para mejor discoverabilidad
      categories: ['education', 'school', 'academic'],
      
      // Screenshots para mejor experiencia de instalación
      screenshots: [
        {
          src: '/images/screenshots/desktop-home.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Página principal en desktop'
        },
        {
          src: '/images/screenshots/mobile-home.png', 
          sizes: '375x812',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Página principal en móvil'
        }
      ],
      
      // Atajos de aplicación
      shortcuts: [
        {
          name: 'Conócenos',
          short_name: 'Info',
          description: 'Información sobre el Bachillerato Héroes de la Patria',
          url: '/conocenos',
          icons: [{ src: '/images/icons/info-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Contacto',
          short_name: 'Contacto', 
          description: 'Contactar con el Bachillerato Héroes de la Patria',
          url: '/contacto',
          icons: [{ src: '/images/icons/contact-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Servicios',
          short_name: 'Servicios',
          description: 'Servicios disponibles',
          url: '/servicios', 
          icons: [{ src: '/images/icons/services-192x192.png', sizes: '192x192' }]
        }
      ],
      
      // Relacionar con otros apps
      related_applications: [],
      prefer_related_applications: false
    };
    
    // Asegurar que los iconos usen rutas correctas
    if (updatedManifest.icons) {
      updatedManifest.icons = updatedManifest.icons.map(icon => ({
        ...icon,
        src: icon.src.startsWith('/') ? icon.src : `/${icon.src}`
      }));
    }
    
    await fs.writeFile(modernManifest, JSON.stringify(updatedManifest, null, 2), 'utf-8');
    log.success('PWA Manifest migrado y mejorado');
    
    return updatedManifest;
  } catch (error) {
    log.error(`Error migrando manifest: ${error.message}`);
    return false;
  }
}

async function migrateServiceWorker() {
  log.step('Migrando Service Worker...');
  
  const legacySW = path.join(LEGACY_ROOT, 'sw-offline-first.js');
  const modernSW = path.join(MODERN_ROOT, 'apps/web/public/sw.js');
  
  if (!(await fileExists(legacySW))) {
    log.warning('Service Worker legacy no encontrado');
    return false;
  }
  
  try {
    const legacyContent = await fs.readFile(legacySW, 'utf-8');
    
    // Crear Service Worker modernizado
    const modernSWContent = `
// Service Worker para Bachillerato Héroes de la Patria - Versión Moderna
// Migrado y optimizado desde sw-offline-first.js

const CACHE_NAME = 'heroes-patria-v2.0.0';
const STATIC_CACHE = 'heroes-patria-static-v2.0.0';
const DYNAMIC_CACHE = 'heroes-patria-dynamic-v2.0.0';

// Archivos críticos para cachear inmediatamente
const STATIC_ASSETS = [
  '/03-BachilleratoHeroesWeb/',
  '/03-BachilleratoHeroesWeb/index.html',
  '/03-BachilleratoHeroesWeb/offline.html',
  '/03-BachilleratoHeroesWeb/manifest.json',
  '/03-BachilleratoHeroesWeb/assets/css/main.css',
  '/03-BachilleratoHeroesWeb/assets/js/main.js',
  '/03-BachilleratoHeroesWeb/images/icons/icon-192x192.png',
  '/03-BachilleratoHeroesWeb/images/icons/icon-512x512.png',
  '/03-BachilleratoHeroesWeb/images/logo.webp'
];

// Patrones de URLs para diferentes estrategias de cache
const CACHE_STRATEGIES = {
  static: /\\.(css|js|woff2?|eot|ttf|otf)$/,
  images: /\\.(png|jpe?g|gif|svg|webp|avif|ico)$/,
  pages: /\\.(html|php)$/,
  api: /\\/api\\//
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v2.0.0');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker v2.0.0');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches antiguos
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }
  
  // Estrategia basada en el tipo de recurso
  if (CACHE_STRATEGIES.static.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (CACHE_STRATEGIES.images.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (CACHE_STRATEGIES.pages.test(url.pathname) || url.pathname === '/03-BachilleratoHeroesWeb/') {
    event.respondWith(networkFirst(request));
  } else if (CACHE_STRATEGIES.api.test(url.pathname)) {
    event.respondWith(networkOnly(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache First - Para assets estáticos
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First - Para páginas HTML
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback a página offline
    if (request.destination === 'document') {
      return caches.match('/03-BachilleratoHeroesWeb/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Network Only - Para API calls
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Offline', message: 'API no disponible offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - Para contenido dinámico
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.0.0' });
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Ejecutando sincronización en segundo plano');
  // Aquí se puede implementar lógica de sincronización
  // Por ejemplo, enviar formularios offline, sincronizar datos, etc.
}

// Push notifications (para futuro uso)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del Bachillerato Héroes de la Patria',
    icon: '/03-BachilleratoHeroesWeb/images/icons/icon-192x192.png',
    badge: '/03-BachilleratoHeroesWeb/images/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Bachillerato Héroes de la Patria', options)
  );
});

console.log('[SW] Service Worker v2.0.0 cargado correctamente');
`;

    await fs.writeFile(modernSW, modernSWContent.trim(), 'utf-8');
    log.success('Service Worker migrado y modernizado');
    
    // Crear también offline.html
    await createOfflinePage();
    
    return true;
  } catch (error) {
    log.error(`Error migrando Service Worker: ${error.message}`);
    return false;
  }
}

async function createOfflinePage() {
  const offlinePage = path.join(MODERN_ROOT, 'apps/web/public/offline.html');
  
  const offlineContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sin conexión - Bachillerato Héroes de la Patria</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        
        .offline-container {
            max-width: 500px;
            padding: 2rem;
        }
        
        .offline-icon {
            font-size: 4rem;
            margin-bottom: 2rem;
        }
        
        .offline-title {
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        
        .offline-message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .offline-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .network-status {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .online { color: #10b981; }
        .offline { color: #ef4444; }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">🌐</div>
        <h1 class="offline-title">Sin conexión a Internet</h1>
        <p class="offline-message">
            No hay conexión disponible en este momento. Algunas páginas visitadas anteriormente 
            podrían estar disponibles offline.
        </p>
        
        <div class="offline-actions">
            <button class="btn" onclick="window.location.reload()">
                🔄 Reintentar
            </button>
            <a href="/03-BachilleratoHeroesWeb/" class="btn">
                🏠 Ir al inicio
            </a>
        </div>
        
        <div class="network-status">
            Estado: <span id="network-status">Verificando...</span>
        </div>
    </div>
    
    <script>
        // Monitoreo del estado de la red
        function updateNetworkStatus() {
            const statusEl = document.getElementById('network-status');
            if (navigator.onLine) {
                statusEl.textContent = 'Conectado';
                statusEl.className = 'online';
            } else {
                statusEl.textContent = 'Desconectado';
                statusEl.className = 'offline';
            }
        }
        
        // Detectar cambios en el estado de la red
        window.addEventListener('online', () => {
            updateNetworkStatus();
            // Auto-reload cuando se recupere la conexión
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
        
        window.addEventListener('offline', updateNetworkStatus);
        
        // Estado inicial
        updateNetworkStatus();
        
        // Retry automático cada 30 segundos
        setInterval(() => {
            if (navigator.onLine) {
                window.location.reload();
            }
        }, 30000);
    </script>
</body>
</html>`;

  await fs.writeFile(offlinePage, offlineContent, 'utf-8');
  log.success('Página offline creada');
}

async function createPWAIntegration() {
  log.step('Creando integración PWA para Astro...');
  
  const pwaComponent = path.join(MODERN_ROOT, 'apps/web/src/components/PWAInstaller.astro');
  
  const componentContent = `---
// Componente para promover instalación de PWA
export interface Props {
  class?: string;
}

const { class: className = '' } = Astro.props;
---

<div class={\`pwa-installer \${className}\`} id="pwa-installer" style="display: none;">
  <div class="pwa-prompt">
    <div class="pwa-content">
      <div class="pwa-icon">📱</div>
      <div class="pwa-text">
        <h3>Instalar Bachillerato Héroes de la Patria</h3>
        <p>Accede rápidamente desde tu pantalla de inicio</p>
      </div>
    </div>
    <div class="pwa-actions">
      <button id="pwa-install" class="btn-primary">Instalar</button>
      <button id="pwa-dismiss" class="btn-secondary">Ahora no</button>
    </div>
  </div>
</div>

<style>
  .pwa-installer {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .pwa-prompt {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    padding: 20px;
    animation: slideUp 0.3s ease-out;
  }
  
  .pwa-content {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .pwa-icon {
    font-size: 2rem;
    margin-right: 12px;
  }
  
  .pwa-text h3 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .pwa-text p {
    margin: 0;
    font-size: 0.9rem;
    color: #6b7280;
  }
  
  .pwa-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-primary {
    flex: 1;
    background: #2563eb;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary:hover {
    background: #1d4ed8;
  }
  
  .btn-secondary {
    background: transparent;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-secondary:hover {
    color: #1f2937;
    border-color: #d1d5db;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @media (max-width: 640px) {
    .pwa-installer {
      left: 16px;
      right: 16px;
      bottom: 16px;
    }
  }
</style>

<script>
  // PWA Installation Logic
  let deferredPrompt: any = null;
  
  // Detectar evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar prompt personalizado después de 3 segundos
    setTimeout(() => {
      showInstallPrompt();
    }, 3000);
  });
  
  function showInstallPrompt() {
    const installer = document.getElementById('pwa-installer');
    const installBtn = document.getElementById('pwa-install');
    const dismissBtn = document.getElementById('pwa-dismiss');
    
    if (!installer || !deferredPrompt) return;
    
    // Verificar si ya fue instalado o descartado
    if (localStorage.getItem('pwa-dismissed') === 'true') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    
    installer.style.display = 'block';
    
    installBtn?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalada por el usuario');
      }
      
      deferredPrompt = null;
      installer.style.display = 'none';
    });
    
    dismissBtn?.addEventListener('click', () => {
      installer.style.display = 'none';
      localStorage.setItem('pwa-dismissed', 'true');
      deferredPrompt = null;
    });
  }
  
  // Detectar si ya está instalado
  window.addEventListener('appinstalled', () => {
    console.log('PWA instalada correctamente');
    localStorage.setItem('pwa-installed', 'true');
  });
  
  // Service Worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registrado:', registration.scope);
      } catch (error) {
        console.log('SW registration failed:', error);
      }
    });
  }
</script>`;

  await fs.mkdir(path.dirname(pwaComponent), { recursive: true });
  await fs.writeFile(pwaComponent, componentContent, 'utf-8');
  log.success('Componente PWA Installer creado');
}

async function runPWAMigration() {
  console.log(chalk.bgBlue.white(' 📱 MIGRACIÓN PWA - Bachillerato Héroes de la Patria ') + '\n');
  
  const results = {
    manifest: false,
    serviceWorker: false,
    pwaComponents: false
  };
  
  // Migrar manifest
  results.manifest = await migratePWAManifest();
  
  // Migrar Service Worker
  results.serviceWorker = await migrateServiceWorker();
  
  // Crear componentes PWA
  await createPWAIntegration();
  results.pwaComponents = true;
  
  // Crear reporte de migración PWA
  const report = `# 📱 Reporte de Migración PWA

**Fecha:** ${new Date().toISOString()}

## ✅ Componentes Migrados

${results.manifest ? '- ✅ manifest.json migrado y mejorado' : '- ❌ manifest.json falló'}
${results.serviceWorker ? '- ✅ Service Worker migrado a estrategia moderna' : '- ❌ Service Worker falló'}
${results.pwaComponents ? '- ✅ Componentes PWA para Astro creados' : '- ❌ Componentes PWA fallaron'}

## 🚀 Nuevas Funcionalidades PWA

### Manifest Mejorado
- ✅ Shortcuts de aplicación
- ✅ Screenshots para instalación 
- ✅ Categorización mejorada
- ✅ Mejor información descriptiva

### Service Worker Moderno
- ✅ Estrategias de cache diferenciadas por tipo de recurso
- ✅ Network-first para páginas HTML
- ✅ Cache-first para assets estáticos
- ✅ Stale-while-revalidate para contenido dinámico
- ✅ Página offline personalizada
- ✅ Soporte para sync en segundo plano

### Componentes de Instalación
- ✅ PWAInstaller component para promover instalación
- ✅ Detección automática de capacidad de instalación
- ✅ UI moderna para prompt de instalación

## 📋 Próximos Pasos

### Inmediatos
- [ ] Integrar PWAInstaller en el layout principal
- [ ] Generar iconos en todos los tamaños necesarios
- [ ] Crear screenshots para el manifest
- [ ] Probar instalación en diferentes navegadores

### Corto Plazo  
- [ ] Implementar push notifications
- [ ] Añadir sincronización offline de formularios
- [ ] Mejorar página offline con contenido útil
- [ ] Implementar update notifications

### Testing PWA
- [ ] Probar offline functionality
- [ ] Validar Lighthouse PWA audit
- [ ] Testing en diferentes dispositivos
- [ ] Verificar instalación en iOS y Android

---
*Migración PWA completada - Bachillerato Héroes de la Patria*
`;

  const reportPath = path.join(MODERN_ROOT, 'PWA_MIGRATION_REPORT.md');
  await fs.writeFile(reportPath, report, 'utf-8');
  
  // Resumen
  console.log(chalk.bgGreen.black(' ✅ MIGRACIÓN PWA COMPLETADA '));
  console.log(`\n📊 Resumen:`);
  console.log(`   • Manifest: ${results.manifest ? '✅ Migrado' : '❌ Falló'}`);
  console.log(`   • Service Worker: ${results.serviceWorker ? '✅ Migrado' : '❌ Falló'}`);
  console.log(`   • Componentes: ${results.pwaComponents ? '✅ Creados' : '❌ Fallaron'}`);
  console.log(`\n📁 Archivos creados:`);
  console.log(`   • apps/web/public/manifest.json`);
  console.log(`   • apps/web/public/sw.js`);
  console.log(`   • apps/web/public/offline.html`);
  console.log(`   • apps/web/src/components/PWAInstaller.astro`);
  console.log(`   • PWA_MIGRATION_REPORT.md`);
}

export { runPWAMigration };

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runPWAMigration().catch(error => {
    log.error(`Error durante la migración PWA: ${error.message}`);
    process.exit(1);
  });
}