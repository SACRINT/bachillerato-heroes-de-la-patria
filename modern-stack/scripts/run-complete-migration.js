#!/usr/bin/env node

import fs from 'fs/promises';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { runMigration as runContentMigration } from '../tools/content-migration.js';
import { runPWAMigration } from '../tools/pwa-migration.js';
import { runChatbotMigration } from '../tools/chatbot-migration.js';

const log = {
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  step: (msg) => console.log(chalk.cyan('🔄 ' + msg)),
  header: (msg) => console.log(chalk.bgBlue.white(` ${msg} `))
};

async function runCompleteMigration() {
  console.log(chalk.bgMagenta.white(' 🚀 MIGRACIÓN COMPLETA - Bachillerato Héroes de la Patria '));
  console.log('');
  
  log.info('Iniciando migración completa del sitio Bachillerato Héroes de la Patria...');
  log.info('Este proceso incluye: contenido, PWA, chatbot y verificaciones finales');
  console.log('');
  
  const startTime = Date.now();
  const results = {
    content: false,
    pwa: false,
    chatbot: false,
    verification: false,
    errors: []
  };
  
  try {
    // FASE 1: Migración de Contenido
    log.header('📄 FASE 1: MIGRACIÓN DE CONTENIDO');
    log.step('Ejecutando migración automática de páginas HTML a Astro...');
    
    try {
      await runContentMigration();
      results.content = true;
      log.success('Migración de contenido completada exitosamente');
    } catch (error) {
      results.errors.push(`Content Migration: ${error.message}`);
      log.error(`Error en migración de contenido: ${error.message}`);
    }
    
    console.log('');
    
    // FASE 2: Migración de PWA
    log.header('📱 FASE 2: MIGRACIÓN DE PWA');
    log.step('Migrando Service Worker, manifest y funcionalidades PWA...');
    
    try {
      await runPWAMigration();
      results.pwa = true;
      log.success('Migración de PWA completada exitosamente');
    } catch (error) {
      results.errors.push(`PWA Migration: ${error.message}`);
      log.error(`Error en migración de PWA: ${error.message}`);
    }
    
    console.log('');
    
    // FASE 3: Migración de Chatbot
    log.header('🤖 FASE 3: MIGRACIÓN DE CHATBOT');
    log.step('Migrando chatbot con API moderna y UI responsive...');
    
    try {
      await runChatbotMigration();
      results.chatbot = true;
      log.success('Migración de chatbot completada exitosamente');
    } catch (error) {
      results.errors.push(`Chatbot Migration: ${error.message}`);
      log.error(`Error en migración de chatbot: ${error.message}`);
    }
    
    console.log('');
    
    // FASE 4: Verificaciones Post-Migración
    log.header('🔍 FASE 4: VERIFICACIONES FINALES');
    
    try {
      await runPostMigrationVerifications();
      results.verification = true;
      log.success('Verificaciones finales completadas');
    } catch (error) {
      results.errors.push(`Verification: ${error.message}`);
      log.error(`Error en verificaciones: ${error.message}`);
    }
    
    // REPORTE FINAL
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\\n');
    generateFinalReport(results, duration);
    
    if (results.errors.length === 0) {
      console.log(chalk.bgGreen.black(' 🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE '));
      console.log('');
      console.log('📝 Próximos pasos:');
      console.log('   1. Revisar páginas migradas manualmente');
      console.log('   2. Ejecutar testing completo: npm run test:complete');
      console.log('   3. Build de producción: npm run build');
      console.log('   4. Deploy cuando esté listo: npm run deploy:prod');
    } else {
      console.log(chalk.bgRed.white(' ⚠️  MIGRACIÓN CON ERRORES '));
      console.log('');
      console.log('Revisar errores arriba y corregir antes de continuar.');
    }
    
  } catch (error) {
    log.error(`Error crítico durante la migración: ${error.message}`);
    process.exit(1);
  }
}

async function runPostMigrationVerifications() {
  log.step('Ejecutando verificaciones post-migración...');
  
  const verifications = [
    { name: 'Estructura de archivos', check: verifyFileStructure },
    { name: 'Configuración de packages', check: verifyPackageConfig },
    { name: 'Assets migrados', check: verifyAssets },
    { name: 'Componentes funcionales', check: verifyComponents },
    { name: 'Configuración API', check: verifyAPIConfig }
  ];
  
  for (const verification of verifications) {
    try {
      log.step(`Verificando: ${verification.name}...`);
      await verification.check();
      log.success(`✓ ${verification.name}`);
    } catch (error) {
      log.warning(`⚠ ${verification.name}: ${error.message}`);
    }
  }
}

async function verifyFileStructure() {
  const requiredPaths = [
    'apps/web/src/pages/index.astro',
    'apps/web/src/components/Chatbot.astro',
    'apps/web/public/manifest.json',
    'apps/web/public/sw.js',
    'packages/ui/src/components/Layout.astro',
    'packages/config/src/site.ts',
    'apps/api/src/routes/chatbot.ts'
  ];
  
  for (const path of requiredPaths) {
    try {
      await fs.access(path);
    } catch {
      throw new Error(`Archivo requerido no encontrado: ${path}`);
    }
  }
}

async function verifyPackageConfig() {
  try {
    const webPackage = JSON.parse(await fs.readFile('apps/web/package.json', 'utf-8'));
    const apiPackage = JSON.parse(await fs.readFile('apps/api/package.json', 'utf-8'));
    
    if (!webPackage.dependencies['astro']) {
      throw new Error('Astro no configurado en web package');
    }
    
    if (!apiPackage.dependencies['express']) {
      throw new Error('Express no configurado en API package');
    }
  } catch (error) {
    throw new Error(`Configuración de packages inválida: ${error.message}`);
  }
}

async function verifyAssets() {
  const assetPaths = [
    'apps/web/public/images',
    'apps/web/public/manifest.json',
    'apps/web/public/sw.js'
  ];
  
  for (const path of assetPaths) {
    try {
      await fs.access(path);
    } catch {
      throw new Error(`Asset no encontrado: ${path}`);
    }
  }
}

async function verifyComponents() {
  const componentPaths = [
    'packages/ui/src/components/Layout.astro',
    'packages/ui/src/components/Header.astro',
    'packages/ui/src/components/Footer.astro',
    'apps/web/src/components/Chatbot.astro'
  ];
  
  for (const path of componentPaths) {
    try {
      const content = await fs.readFile(path, 'utf-8');
      if (!content.includes('---') || !content.length > 100) {
        throw new Error(`Componente parece inválido: ${path}`);
      }
    } catch (error) {
      throw new Error(`Error verificando componente ${path}: ${error.message}`);
    }
  }
}

async function verifyAPIConfig() {
  try {
    const chatbotAPI = await fs.readFile('apps/api/src/routes/chatbot.ts', 'utf-8');
    if (!chatbotAPI.includes('Router') || !chatbotAPI.includes('/message')) {
      throw new Error('API del chatbot no configurada correctamente');
    }
  } catch (error) {
    throw new Error(`Error verificando API config: ${error.message}`);
  }
}

function generateFinalReport(results, duration) {
  console.log(chalk.bgBlue.white(' 📊 REPORTE FINAL DE MIGRACIÓN '));
  console.log('');
  
  console.log(`⏱️  Tiempo total: ${duration} segundos`);
  console.log('');
  
  console.log('📋 Resultados por fase:');
  console.log(`   📄 Migración de Contenido: ${results.content ? '✅ EXITOSA' : '❌ FALLÓ'}`);
  console.log(`   📱 Migración de PWA: ${results.pwa ? '✅ EXITOSA' : '❌ FALLÓ'}`);
  console.log(`   🤖 Migración de Chatbot: ${results.chatbot ? '✅ EXITOSA' : '❌ FALLÓ'}`);
  console.log(`   🔍 Verificaciones: ${results.verification ? '✅ EXITOSA' : '❌ FALLÓ'}`);
  console.log('');
  
  const successCount = Object.values(results).filter(r => typeof r === 'boolean' && r).length;
  const totalPhases = 4;
  
  console.log(`🎯 Éxito general: ${successCount}/${totalPhases} fases completadas`);
  
  if (results.errors.length > 0) {
    console.log('');
    console.log('⚠️  Errores encontrados:');
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  console.log('');
  console.log('📁 Archivos de reporte generados:');
  console.log('   • MIGRATION_REPORT.md');
  console.log('   • PWA_MIGRATION_REPORT.md'); 
  console.log('   • CHATBOT_MIGRATION_REPORT.md');
  console.log('   • MASTER_MIGRATION_PLAN.md');
  console.log('');
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteMigration().catch(error => {
    log.error(`Error crítico: ${error.message}`);
    process.exit(1);
  });
}

export { runCompleteMigration };