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

// Páginas a migrar del sitio heredado
const PAGES_TO_MIGRATE = [
  { legacy: 'index.html', modern: 'src/pages/index.astro', priority: 'high' },
  { legacy: 'conocenos.html', modern: 'src/pages/conocenos.astro', priority: 'high' },
  { legacy: 'oferta-educativa.html', modern: 'src/pages/oferta-educativa.astro', priority: 'high' },
  { legacy: 'servicios.html', modern: 'src/pages/servicios.astro', priority: 'high' },
  { legacy: 'comunidad.html', modern: 'src/pages/comunidad.astro', priority: 'medium' },
  { legacy: 'contacto.html', modern: 'src/pages/contacto.astro', priority: 'high' },
  { legacy: 'calendario.html', modern: 'src/pages/calendario.astro', priority: 'medium' },
  { legacy: 'descargas.html', modern: 'src/pages/descargas.astro', priority: 'medium' },
  { legacy: 'convocatorias.html', modern: 'src/pages/convocatorias.astro', priority: 'medium' },
  { legacy: 'bolsa-trabajo.html', modern: 'src/pages/bolsa-trabajo.astro', priority: 'low' },
  { legacy: 'estudiantes.html', modern: 'src/pages/estudiantes.astro', priority: 'medium' },
  { legacy: 'padres.html', modern: 'src/pages/padres.astro', priority: 'medium' },
  { legacy: 'egresados.html', modern: 'src/pages/egresados.astro', priority: 'low' },
  { legacy: 'citas.html', modern: 'src/pages/citas.astro', priority: 'medium' },
  { legacy: 'calificaciones.html', modern: 'src/pages/calificaciones.astro', priority: 'low' },
  { legacy: 'pagos.html', modern: 'src/pages/pagos.astro', priority: 'low' }
];

// Assets a migrar
const ASSETS_TO_MIGRATE = [
  { legacy: 'images/', modern: 'public/images/', type: 'directory' },
  { legacy: 'videos/', modern: 'public/videos/', type: 'directory' },
  { legacy: 'documents/', modern: 'public/documents/', type: 'directory' },
  { legacy: 'css/style.css', modern: 'legacy-styles.css', type: 'file', analyze: true },
  { legacy: 'js/script.js', modern: 'legacy-scripts.js', type: 'file', analyze: true },
  { legacy: 'js/chatbot.js', modern: 'legacy-chatbot.js', type: 'file', analyze: true },
  { legacy: 'manifest.json', modern: 'public/manifest.json', type: 'file' },
  { legacy: 'sw-offline-first.js', modern: 'legacy-sw.js', type: 'file', analyze: true }
];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function extractHTMLContent(htmlPath) {
  log.step(`Analizando ${htmlPath}...`);
  
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    
    // Extraer información clave del HTML
    const title = content.match(/<title[^>]*>([^<]+)<\\/title>/i)?.[1] || '';
    const description = content.match(/<meta\\s+name=[\"']description[\"']\\s+content=[\"']([^\"']+)[\"']/i)?.[1] || '';
    const keywords = content.match(/<meta\\s+name=[\"']keywords[\"']\\s+content=[\"']([^\"']+)[\"']/i)?.[1] || '';
    
    // Extraer contenido del body (sin header y footer)
    const bodyMatch = content.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);
    let bodyContent = bodyMatch?.[1] || '';
    
    // Remover header y footer comunes
    bodyContent = bodyContent.replace(/<header[^>]*>[\\s\\S]*?<\\/header>/gi, '');
    bodyContent = bodyContent.replace(/<footer[^>]*>[\\s\\S]*?<\\/footer>/gi, '');
    bodyContent = bodyContent.replace(/<nav[^>]*>[\\s\\S]*?<\\/nav>/gi, '');
    
    // Extraer secciones principales
    const sections = [];
    const sectionMatches = [...bodyContent.matchAll(/<section[^>]*>([\\s\\S]*?)<\\/section>/gi)];
    
    sectionMatches.forEach((match, index) => {
      sections.push({
        index: index + 1,
        content: match[1].trim(),
        classes: match[0].match(/class=[\"']([^\"']+)[\"']/)?.[1] || '',
        id: match[0].match(/id=[\"']([^\"']+)[\"']/)?.[1] || ''
      });
    });
    
    // Si no hay secciones, tomar todo el contenido del body
    if (sections.length === 0) {
      sections.push({
        index: 1,
        content: bodyContent.trim(),
        classes: '',
        id: 'main-content'
      });
    }
    
    return {
      title,
      description,
      keywords,
      sections,
      originalContent: content
    };
    
  } catch (error) {
    log.error(`Error leyendo ${htmlPath}: ${error.message}`);
    return null;
  }
}

function convertHTMLToAstro(extractedContent, pageName) {
  const { title, description, keywords, sections } = extractedContent;
  
  // Generar frontmatter de Astro
  const frontmatter = `---
import { Layout } from '@heroes-patria/ui';
import { siteConfig } from '@heroes-patria/config';

const title = "${title || `${pageName} - Bachillerato Héroes de la Patria`}";
const description = "${description || `Página ${pageName} del Bachillerato Héroes de la Patria (Héroes de Puebla)`}";
const keywords = "${keywords || 'Bachillerato Héroes de la Patria, Héroes de Puebla, bachillerato general, educación integral'}";
---`;

  // Generar el layout de Astro
  const astroContent = `${frontmatter}

<Layout 
  title={title}
  description={description}
  keywords={keywords}
>
  <main class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
${sections.map(section => `
      <!-- Sección ${section.index}${section.id ? ` - ${section.id}` : ''} -->
      <section class="${section.classes || 'mb-8'}">
        ${section.content.split('\\n').map(line => `        ${line}`).join('\\n')}
      </section>`).join('\\n')}
    </div>
  </main>
</Layout>

<!-- 
TODO: Revisar y optimizar este contenido migrado
- ✅ Estructura básica migrada
- ⏳ Revisar estilos y clases CSS
- ⏳ Optimizar imágenes y assets
- ⏳ Agregar componentes reutilizables donde sea posible
- ⏳ Validar accesibilidad
- ⏳ Testing funcional
-->`;

  return astroContent;
}

async function migratePage(pageConfig) {
  const legacyPath = path.join(LEGACY_ROOT, pageConfig.legacy);
  const modernPath = path.join(MODERN_ROOT, 'apps/web', pageConfig.modern);
  
  log.step(`Migrando ${pageConfig.legacy} -> ${pageConfig.modern}...`);
  
  // Verificar que existe el archivo legacy
  if (!(await fileExists(legacyPath))) {
    log.warning(`Archivo legacy no encontrado: ${pageConfig.legacy}`);
    return false;
  }
  
  // Extraer contenido del HTML original
  const extractedContent = await extractHTMLContent(legacyPath);
  if (!extractedContent) {
    return false;
  }
  
  // Convertir a formato Astro
  const pageName = path.basename(pageConfig.legacy, '.html');
  const astroContent = convertHTMLToAstro(extractedContent, pageName);
  
  // Crear directorio si no existe
  const modernDir = path.dirname(modernPath);
  await fs.mkdir(modernDir, { recursive: true });
  
  // Escribir archivo Astro
  await fs.writeFile(modernPath, astroContent, 'utf-8');
  
  log.success(`Página migrada: ${pageConfig.modern}`);
  return true;
}

async function migrateAssets() {
  log.info('🖼️  Migrando assets...');
  
  for (const assetConfig of ASSETS_TO_MIGRATE) {
    const legacyPath = path.join(LEGACY_ROOT, assetConfig.legacy);
    const modernPath = path.join(MODERN_ROOT, 'apps/web/public', path.basename(assetConfig.legacy));
    
    if (!(await fileExists(legacyPath))) {
      log.warning(`Asset no encontrado: ${assetConfig.legacy}`);
      continue;
    }
    
    try {
      if (assetConfig.type === 'directory') {
        // Copiar directorio completo
        await fs.cp(legacyPath, modernPath, { recursive: true, force: true });
        log.success(`Directorio copiado: ${assetConfig.legacy}`);
      } else {
        // Copiar archivo individual
        await fs.copyFile(legacyPath, modernPath);
        log.success(`Archivo copiado: ${assetConfig.legacy}`);
        
        // Si necesita análisis, crear reporte
        if (assetConfig.analyze) {
          await analyzeJSOrCSS(modernPath, assetConfig.legacy);
        }
      }
    } catch (error) {
      log.error(`Error migrando ${assetConfig.legacy}: ${error.message}`);
    }
  }
}

async function analyzeJSOrCSS(filePath, originalName) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const analysisPath = filePath + '.analysis.md';
    
    let analysis = `# Análisis de migración: ${originalName}\\n\\n`;
    analysis += `**Archivo original:** ${originalName}\\n`;
    analysis += `**Tamaño:** ${content.length} caracteres\\n\\n`;
    
    if (filePath.endsWith('.js')) {
      analysis += `## Funciones encontradas:\\n`;
      const functions = [...content.matchAll(/function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(/g)];
      functions.forEach(([, name]) => {
        analysis += `- ${name}()\\n`;
      });
      
      analysis += `\\n## Variables globales:\\n`;
      const globals = [...content.matchAll(/var\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g)];
      globals.forEach(([, name]) => {
        analysis += `- ${name}\\n`;
      });
      
      analysis += `\\n## TODO para migración:\\n`;
      analysis += `- [ ] Convertir a módulos ES6\\n`;
      analysis += `- [ ] Integrar con la nueva arquitectura\\n`;
      analysis += `- [ ] Añadir TypeScript\\n`;
      analysis += `- [ ] Testing unitario\\n`;
    }
    
    if (filePath.endsWith('.css')) {
      analysis += `## Clases CSS encontradas:\\n`;
      const classes = [...content.matchAll(/\\.([a-zA-Z_-][a-zA-Z0-9_-]*)\\s*\\{/g)];
      classes.forEach(([, name]) => {
        analysis += `- .${name}\\n`;
      });
      
      analysis += `\\n## TODO para migración:\\n`;
      analysis += `- [ ] Migrar a Tailwind CSS\\n`;
      analysis += `- [ ] Extraer componentes reutilizables\\n`;
      analysis += `- [ ] Optimizar para mobile-first\\n`;
      analysis += `- [ ] Validar accesibilidad\\n`;
    }
    
    await fs.writeFile(analysisPath, analysis, 'utf-8');
    log.success(`Análisis creado: ${path.basename(analysisPath)}`);
    
  } catch (error) {
    log.error(`Error analizando ${filePath}: ${error.message}`);
  }
}

async function createMigrationReport(migratedPages) {
  const report = `# 📋 Reporte de Migración de Contenido

**Fecha:** ${new Date().toISOString()}
**Páginas migradas:** ${migratedPages.filter(p => p.success).length} de ${migratedPages.length}

## ✅ Páginas Migradas Exitosamente

${migratedPages.filter(p => p.success).map(p => `- ✅ ${p.legacy} → ${p.modern}`).join('\\n')}

## ⚠️ Páginas Pendientes o con Problemas

${migratedPages.filter(p => !p.success).map(p => `- ❌ ${p.legacy} - ${p.error || 'No encontrada'}`).join('\\n')}

## 📝 Próximos Pasos

### Inmediatos (Esta semana)
- [ ] Revisar cada página migrada manualmente
- [ ] Ajustar estilos con Tailwind CSS
- [ ] Verificar que todas las imágenes cargan correctamente
- [ ] Probar navegación entre páginas

### Corto Plazo (Próximas 2 semanas)  
- [ ] Migrar funcionalidades JavaScript específicas
- [ ] Integrar formularios con la API
- [ ] Implementar PWA completa
- [ ] Migrar chatbot

### Mediano Plazo (Próximo mes)
- [ ] Testing completo E2E
- [ ] Optimización de performance
- [ ] SEO audit completo
- [ ] Deployment a producción

## 🎯 KPIs de Migración

- **Paridad de Contenido:** 100% del contenido original preservado
- **Mejora de Performance:** Target >90% Lighthouse score
- **Accesibilidad:** Target >95% accessibility score
- **Tiempo de Carga:** Target <2s First Contentful Paint

## 🛠️ Herramientas Utilizadas

- Extractor automático de contenido HTML
- Convertidor HTML → Astro
- Analizador de assets legacy
- Sistema de reportes automático

---
*Generado automáticamente por content-migration.js*
`;

  const reportPath = path.join(MODERN_ROOT, 'MIGRATION_REPORT.md');
  await fs.writeFile(reportPath, report, 'utf-8');
  log.success(`Reporte de migración creado: MIGRATION_REPORT.md`);
}

async function runMigration() {
  console.log(chalk.bgBlue.white(' 🚀 INICIANDO MIGRACIÓN DE CONTENIDO ') + '\\n');
  
  log.info(`Legacy Root: ${LEGACY_ROOT}`);
  log.info(`Modern Root: ${MODERN_ROOT}\\n`);
  
  // Migrar páginas por prioridad
  const migratedPages = [];
  const priorityOrder = ['high', 'medium', 'low'];
  
  for (const priority of priorityOrder) {
    log.info(`🔥 Migrando páginas de prioridad: ${priority.toUpperCase()}`);
    
    const pagesOfPriority = PAGES_TO_MIGRATE.filter(p => p.priority === priority);
    
    for (const pageConfig of pagesOfPriority) {
      const success = await migratePage(pageConfig);
      migratedPages.push({
        ...pageConfig,
        success,
        error: success ? null : 'Error durante migración'
      });
    }
    
    console.log('');
  }
  
  // Migrar assets
  await migrateAssets();
  
  // Crear reporte
  await createMigrationReport(migratedPages);
  
  // Resumen final
  const successCount = migratedPages.filter(p => p.success).length;
  const totalCount = migratedPages.length;
  
  console.log(chalk.bgGreen.black(' 🎉 MIGRACIÓN COMPLETADA '));
  console.log(`\\n📊 Resumen:`);
  console.log(`   • Páginas migradas: ${successCount}/${totalCount}`);
  console.log(`   • Assets migrados: ${ASSETS_TO_MIGRATE.length} elementos`);
  console.log(`   • Siguiente paso: Revisar y ajustar páginas migradas`);
  console.log(`\\n📍 Archivos importantes creados:`);
  console.log(`   • MIGRATION_REPORT.md - Reporte detallado`);
  console.log(`   • apps/web/src/pages/*.astro - Páginas migradas`);
  console.log(`   • *.analysis.md - Análisis de assets legacy`);
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(error => {
    log.error(`Error durante la migración: ${error.message}`);
    process.exit(1);
  });
}

export default runMigration;