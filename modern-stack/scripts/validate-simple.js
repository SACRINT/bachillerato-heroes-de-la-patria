#!/usr/bin/env node
/**
 * Validador simple del proyecto sin dependencias externas
 */

import { existsSync, readFileSync } from 'fs';

class SimpleValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
    this.passed = 0;
  }

  log(message, type = 'info') {
    const prefix = {
      info: '  ℹ️ ',
      success: '  ✅ ',
      error: '  ❌ ',
      warning: '  ⚠️  '
    };
    console.log(prefix[type] + message);
  }

  async validate() {
    console.log('\n🔍 VALIDACIÓN DEL PROYECTO - Héroes de la Patria\n');

    this.validatePackages();
    this.validateConfigs();
    this.validateCDN();
    this.generateReport();
  }

  validatePackages() {
    console.log('📦 Validando paquetes...');
    
    const packages = [
      'apps/web/package.json',
      'apps/api/package.json', 
      'packages/ui/package.json',
      'packages/config/package.json',
      'packages/types/package.json'
    ];

    packages.forEach(pkg => {
      this.checks++;
      if (existsSync(pkg)) {
        const content = JSON.parse(readFileSync(pkg, 'utf8'));
        if (content.name?.startsWith('@heroes-patria/')) {
          this.passed++;
          this.log(`${pkg} - ${content.name}`, 'success');
        } else {
          this.errors.push(`${pkg} - Nombre incorrecto`);
          this.log(`${pkg} - Nombre incorrecto`, 'error');
        }
      } else {
        this.errors.push(`${pkg} - No encontrado`);
        this.log(`${pkg} - No encontrado`, 'error');
      }
    });
  }

  validateConfigs() {
    console.log('\n⚙️ Validando configuraciones...');
    
    const configs = [
      'config/cdn.config.js',
      'packages/config/src/site.ts',
      'apps/web/astro.config.mjs',
      '.env.example'
    ];

    configs.forEach(config => {
      this.checks++;
      if (existsSync(config)) {
        this.passed++;
        this.log(`${config}`, 'success');
      } else {
        this.errors.push(`${config} - No encontrado`);
        this.log(`${config} - No encontrado`, 'error');
      }
    });

    // Verificar consistencia en web app
    this.checks++;
    if (existsSync('apps/web/package.json')) {
      const webPkg = JSON.parse(readFileSync('apps/web/package.json', 'utf8'));
      const hasOldRefs = Object.keys(webPkg.dependencies || {}).some(dep => dep.includes('@cbtis166'));
      if (!hasOldRefs) {
        this.passed++;
        this.log('Dependencies actualizadas', 'success');
      } else {
        this.errors.push('Referencias @cbtis166 en dependencies');
        this.log('Referencias @cbtis166 encontradas', 'error');
      }
    }
  }

  validateCDN() {
    console.log('\n🌐 Validando CDN...');
    
    this.checks++;
    if (existsSync('scripts/deploy-cdn.js')) {
      this.passed++;
      this.log('Script deploy-cdn.js', 'success');
    } else {
      this.errors.push('deploy-cdn.js no encontrado');
      this.log('deploy-cdn.js no encontrado', 'error');
    }

    this.checks++;
    if (existsSync('package.json')) {
      const mainPkg = JSON.parse(readFileSync('package.json', 'utf8'));
      if (mainPkg.scripts?.['deploy:cdn']) {
        this.passed++;
        this.log('Script deploy:cdn configurado', 'success');
      } else {
        this.errors.push('deploy:cdn script faltante');
        this.log('deploy:cdn script faltante', 'error');
      }
    }
  }

  generateReport() {
    console.log('\n📊 REPORTE DE VALIDACIÓN\n');
    
    const successRate = Math.round((this.passed / this.checks) * 100);
    
    console.log(`Verificaciones: ${this.passed}/${this.checks}`);
    console.log(`Errores: ${this.errors.length}`);
    console.log(`Tasa de éxito: ${successRate}%`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 VALIDACIÓN EXITOSA');
      console.log('El proyecto está correctamente configurado!');
    } else {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      this.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    console.log('\n📝 COMANDOS DISPONIBLES:');
    console.log('  npm run dev       # Desarrollo');
    console.log('  npm run build     # Build producción');
    console.log('  npm run deploy:cdn # Deploy con CDN');
    console.log('');
  }
}

new SimpleValidator().validate().catch(console.error);