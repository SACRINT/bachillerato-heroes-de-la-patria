#!/usr/bin/env node

import https from 'https';
import { promisify } from 'util';
import chalk from 'chalk';

const SITE_URL = 'https://sacrint.github.io/03-BachilleratoHeroesWeb/';
const TIMEOUT = 10000; // 10 segundos

const log = {
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg))
};

// Páginas críticas a verificar
const CRITICAL_PAGES = [
  '',
  'conocenos',
  'oferta-educativa',
  'servicios', 
  'comunidad',
  'transparencia',
  'normatividad',
  'contacto'
];

// Verificaciones de performance
const PERFORMANCE_CHECKS = [
  'service-worker',
  'manifest',
  'critical-css',
  'lazy-images'
];

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: TIMEOUT }, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        headers: response.headers,
        body: data
      }));
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkPageHealth(pagePath) {
  const url = SITE_URL + pagePath;
  
  try {
    const response = await httpGet(url);
    
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`);
    }
    
    // Verificaciones básicas del contenido
    const checks = {
      hasTitle: response.body.includes('<title>'),
      hasMetaDescription: response.body.includes('<meta name="description"'),
      hasViewport: response.body.includes('<meta name="viewport"'),
      hasLang: response.body.includes('<html lang='),
      hasServiceWorker: response.body.includes('serviceWorker.register'),
      hasManifest: response.body.includes('manifest.json'),
      hasCriticalCSS: response.body.includes('<style>'),
      hasLazyImages: response.body.includes('loading="lazy"') || response.body.includes('data-src'),
      responseTime: Date.now()
    };
    
    const startTime = Date.now();
    checks.responseTime = Date.now() - startTime;
    
    return {
      url,
      status: 'healthy',
      checks,
      responseTime: checks.responseTime
    };
    
  } catch (error) {
    return {
      url,
      status: 'unhealthy',
      error: error.message,
      responseTime: null
    };
  }
}

async function checkSEOHealth() {
  log.info('🔍 Verificando SEO...');
  
  try {
    const response = await httpGet(SITE_URL);
    const html = response.body;
    
    const seoChecks = {
      hasTitle: html.includes('<title>') && !html.includes('<title></title>'),
      hasMetaDescription: html.includes('<meta name="description"'),
      hasCanonical: html.includes('<link rel="canonical"'),
      hasOgTags: html.includes('<meta property="og:'),
      hasTwitterTags: html.includes('<meta name="twitter:'),
      hasSchemaOrg: html.includes('"@type"') || html.includes('application/ld+json'),
      hasRobots: html.includes('<meta name="robots"'),
      hasSitemap: response.headers['x-robots-tag'] || html.includes('sitemap.xml'),
      hasGoogleAnalytics: html.includes('gtag') || html.includes('ga('),
    };
    
    const passed = Object.values(seoChecks).filter(Boolean).length;
    const total = Object.keys(seoChecks).length;
    
    log.success(`SEO Score: ${passed}/${total} verificaciones pasaron`);
    
    return seoChecks;
  } catch (error) {
    log.error(`Error verificando SEO: ${error.message}`);
    return null;
  }
}

async function checkPerformanceFeatures() {
  log.info('⚡ Verificando características de performance...');
  
  try {
    const response = await httpGet(SITE_URL);
    const html = response.body;
    
    const perfChecks = {
      serviceWorker: html.includes('serviceWorker.register'),
      manifest: html.includes('manifest.json'),
      criticalCSS: html.includes('<style>'),
      lazyImages: html.includes('loading="lazy"'),
      webpImages: html.includes('.webp'),
      avifImages: html.includes('.avif'),
      preloadLinks: html.includes('<link rel="preload"'),
      preconnectLinks: html.includes('<link rel="preconnect"'),
      compressionHeaders: response.headers['content-encoding'] === 'gzip' || 
                         response.headers['content-encoding'] === 'br',
      cacheControl: !!response.headers['cache-control']
    };
    
    const passed = Object.values(perfChecks).filter(Boolean).length;
    const total = Object.keys(perfChecks).length;
    
    log.success(`Performance Score: ${passed}/${total} características activas`);
    
    return perfChecks;
  } catch (error) {
    log.error(`Error verificando performance: ${error.message}`);
    return null;
  }
}

async function runHealthCheck() {
  console.log(chalk.bgBlue.white(' 🏥 HEALTH CHECK - Bachillerato Héroes de la Patria Website ') + '\n');
  
  log.info(`Verificando sitio: ${SITE_URL}\n`);
  
  // Verificar páginas críticas
  log.info('📄 Verificando páginas críticas...');
  const pageResults = [];
  
  for (const page of CRITICAL_PAGES) {
    const result = await checkPageHealth(page);
    pageResults.push(result);
    
    if (result.status === 'healthy') {
      log.success(`${result.url} - OK (${result.responseTime}ms)`);
    } else {
      log.error(`${result.url} - FALLO: ${result.error}`);
    }
  }
  
  console.log('');
  
  // Verificar SEO
  const seoResults = await checkSEOHealth();
  
  console.log('');
  
  // Verificar características de performance
  const perfResults = await checkPerformanceFeatures();
  
  console.log('');
  
  // Resumen final
  const healthyPages = pageResults.filter(p => p.status === 'healthy').length;
  const totalPages = pageResults.length;
  
  console.log(chalk.bgGreen.black(' 📊 RESUMEN FINAL '));
  console.log(`📄 Páginas: ${healthyPages}/${totalPages} funcionando correctamente`);
  
  if (seoResults) {
    const seoScore = Object.values(seoResults).filter(Boolean).length;
    const seoTotal = Object.keys(seoResults).length;
    console.log(`🔍 SEO: ${seoScore}/${seoTotal} verificaciones`);
  }
  
  if (perfResults) {
    const perfScore = Object.values(perfResults).filter(Boolean).length;
    const perfTotal = Object.keys(perfResults).length;
    console.log(`⚡ Performance: ${perfScore}/${perfTotal} características activas`);
  }
  
  console.log('');
  
  // Status general
  if (healthyPages === totalPages) {
    console.log(chalk.bgGreen.black(' ✅ SITIO COMPLETAMENTE SALUDABLE '));
    process.exit(0);
  } else {
    console.log(chalk.bgRed.white(' ⚠️  SITIO CON PROBLEMAS - REVISAR LOGS '));
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().catch(error => {
    log.error(`Error durante health check: ${error.message}`);
    process.exit(1);
  });
}

export default runHealthCheck;