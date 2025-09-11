#!/usr/bin/env node
/**
 * Script de validación del proyecto
 * Verifica que todas las configuraciones y archivos estén correctos
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

class ProjectValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
    this.passed = 0;
  }

  /**
   * Ejecutar todas las validaciones
   */
  async validate() {
    console.log(chalk.bgBlue.white(' 🔍 VALIDACIÓN DEL PROYECTO - Héroes de la Patria '));
    console.log('');

    // Validaciones principales
    this.validatePackageStructure();
    this.validateNamingConsistency();
    this.validateConfigFiles();
    this.validateCDNSetup();
    this.validateBuildFiles();
    
    // Reporte final
    this.generateReport();
  }

  /**
   * Validar estructura de paquetes
   */
  validatePackageStructure() {
    console.log(chalk.blue('📦 Validando estructura de paquetes...'));
    
    const expectedPackages = [
      'apps/web/package.json',
      'apps/api/package.json',
      'packages/ui/package.json',
      'packages/config/package.json',
      'packages/types/package.json'
    ];

    expectedPackages.forEach(pkgPath => {
      this.checks++;
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (pkg.name && pkg.name.startsWith('@heroes-patria/')) {
          this.passed++;
          console.log(chalk.green(`  ✅ ${pkgPath} - ${pkg.name}`));
        } else {
          this.errors.push(`Package ${pkgPath} no usa el prefijo @heroes-patria/`);
          console.log(chalk.red(`  ❌ ${pkgPath} - Nombre incorrecto`));
        }
      } else {
        this.errors.push(`Package no encontrado: ${pkgPath}`);
        console.log(chalk.red(`  ❌ ${pkgPath} - No encontrado`));
      }
    });
  }

  /**
   * Validar consistencia de nomenclatura
   */
  validateNamingConsistency() {
    console.log(chalk.blue('🏷️  Validando consistencia de nomenclatura...'));
    
    // Verificar imports en archivos TypeScript/Astro
    const webPkg = 'apps/web/package.json';
    this.checks++;
    
    if (existsSync(webPkg)) {
      const pkg = JSON.parse(readFileSync(webPkg, 'utf8'));
      const deps = pkg.dependencies || {};
      
      const hasOldRefs = Object.keys(deps).some(dep => dep.includes('@cbtis166'));
      if (!hasOldRefs) {
        this.passed++;
        console.log(chalk.green('  ✅ No hay referencias a @cbtis166 en dependencias'));
      } else {
        this.errors.push('Aún existen referencias @cbtis166 en dependencias');
        console.log(chalk.red('  ❌ Referencias @cbtis166 encontradas'));
      }
    }

    // Verificar configuración de TypeScript
    const tsConfig = 'apps/web/tsconfig.json';
    this.checks++;
    
    if (existsSync(tsConfig)) {
      const config = readFileSync(tsConfig, 'utf8');
      const hasOldPaths = config.includes('@cbtis166');
      if (!hasOldPaths) {
        this.passed++;
        console.log(chalk.green('  ✅ TypeScript config actualizado'));
      } else {
        this.errors.push('tsconfig.json contiene rutas @cbtis166');
        console.log(chalk.red('  ❌ tsconfig.json necesita actualización'));
      }
    }
  }

  /**
   * Validar archivos de configuración
   */
  validateConfigFiles() {
    console.log(chalk.blue('⚙️  Validando archivos de configuración...'));
    
    const configFiles = [
      { path: 'config/cdn.config.js', name: 'CDN Config' },
      { path: 'packages/config/src/site.ts', name: 'Site Config' },
      { path: 'apps/web/astro.config.mjs', name: 'Astro Config' },
      { path: '.env.example', name: 'Environment Template' }
    ];

    configFiles.forEach(({ path, name }) => {
      this.checks++;
      if (existsSync(path)) {
        this.passed++;
        console.log(chalk.green(`  ✅ ${name} - ${path}`));
      } else {
        this.errors.push(`Archivo de configuración faltante: ${path}`);
        console.log(chalk.red(`  ❌ ${name} - ${path} no encontrado`));
      }
    });
  }

  /**
   * Validar configuración de CDN
   */
  validateCDNSetup() {
    console.log(chalk.blue('🌐 Validando configuración CDN...'));
    
    const cdnConfig = 'config/cdn.config.js';
    const deployScript = 'scripts/deploy-cdn.js';
    const envExample = '.env.example';

    this.checks += 3;

    if (existsSync(cdnConfig)) {
      this.passed++;
      console.log(chalk.green('  ✅ Configuración CDN presente'));
    } else {
      this.errors.push('Configuración CDN faltante');
      console.log(chalk.red('  ❌ config/cdn.config.js no encontrado'));
    }

    if (existsSync(deployScript)) {
      this.passed++;
      console.log(chalk.green('  ✅ Script de deploy CDN presente'));
    } else {
      this.errors.push('Script de deploy CDN faltante');
      console.log(chalk.red('  ❌ scripts/deploy-cdn.js no encontrado'));
    }

    if (existsSync(envExample)) {
      const envContent = readFileSync(envExample, 'utf8');
      if (envContent.includes('CLOUDFLARE_API_TOKEN')) {
        this.passed++;
        console.log(chalk.green('  ✅ Variables CDN en .env.example'));
      } else {
        this.warnings.push('Variables CDN no encontradas en .env.example');
        console.log(chalk.yellow('  ⚠️  Variables CDN no en .env.example'));
      }
    }
  }

  /**
   * Validar archivos de build
   */
  validateBuildFiles() {
    console.log(chalk.blue('🏗️  Validando configuración de build...'));
    
    const buildFiles = [
      'package.json',
      'apps/web/package.json',
      'packages/ui/package.json'
    ];

    buildFiles.forEach(filePath => {
      this.checks++;
      if (existsSync(filePath)) {
        const pkg = JSON.parse(readFileSync(filePath, 'utf8'));
        if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
          this.passed++;
          console.log(chalk.green(`  ✅ ${filePath} con scripts`));
        } else {
          this.warnings.push(`${filePath} sin scripts definidos`);
          console.log(chalk.yellow(`  ⚠️  ${filePath} sin scripts`));
        }
      }
    });

    // Verificar script de deploy CDN en package.json principal
    this.checks++;
    if (existsSync('package.json')) {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
      if (pkg.scripts && pkg.scripts['deploy:cdn']) {
        this.passed++;
        console.log(chalk.green('  ✅ Script deploy:cdn configurado'));
      } else {
        this.errors.push('Script deploy:cdn no encontrado en package.json');
        console.log(chalk.red('  ❌ Script deploy:cdn faltante'));
      }
    }
  }

  /**
   * Generar reporte final
   */
  generateReport() {
    console.log('');
    console.log(chalk.bgGreen.white(' 📊 REPORTE DE VALIDACIÓN '));
    console.log('');
    
    console.log(`✅ Verificaciones pasadas: ${this.passed}/${this.checks}`);
    console.log(`❌ Errores: ${this.errors.length}`);
    console.log(`⚠️  Advertencias: ${this.warnings.length}`);
    
    const successRate = Math.round((this.passed / this.checks) * 100);
    
    if (this.errors.length === 0) {
      console.log('');
      console.log(chalk.bgGreen.white(` 🎉 VALIDACIÓN EXITOSA (${successRate}%) `));
      console.log(chalk.green('El proyecto está correctamente configurado y listo para producción!'));
    } else {
      console.log('');
      console.log(chalk.bgRed.white(' ❌ ERRORES ENCONTRADOS '));
      this.errors.forEach((error, index) => {
        console.log(chalk.red(`${index + 1}. ${error}`));
      });
    }

    if (this.warnings.length > 0) {
      console.log('');
      console.log(chalk.bgYellow.black(' ⚠️  ADVERTENCIAS '));
      this.warnings.forEach((warning, index) => {
        console.log(chalk.yellow(`${index + 1}. ${warning}`));
      });
    }

    console.log('');
    console.log(chalk.blue('Para ejecutar el proyecto:'));
    console.log(chalk.gray('  npm install'));
    console.log(chalk.gray('  npm run dev'));
    console.log('');
    console.log(chalk.blue('Para desplegar con CDN:'));
    console.log(chalk.gray('  npm run deploy:cdn'));
  }
}

// Ejecutar validación
const validator = new ProjectValidator();
validator.validate().catch(console.error);

export default ProjectValidator;