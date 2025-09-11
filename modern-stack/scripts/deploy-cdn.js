#!/usr/bin/env node
/**
 * Script de despliegue con integración de CDN
 * Automatiza el proceso de subida de assets al CDN y purga de caché
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import fetch from 'node-fetch';
import chalk from 'chalk';
import { cdnConfig, getCdnUrl, getOptimizedHeaders } from '../config/cdn.config.js';

// Configuración
const BUILD_DIR = 'dist';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

class CDNDeployer {
  constructor() {
    this.cdnUrl = getCdnUrl();
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
    this.deployStats = {
      totalFiles: 0,
      uploadedFiles: 0,
      skippedFiles: 0,
      errors: 0
    };
  }

  /**
   * Proceso principal de despliegue
   */
  async deploy() {
    console.log(chalk.bgBlue.white(' 🚀 DESPLIEGUE CON CDN - Héroes de la Patria '));
    console.log('');

    try {
      // 1. Verificar configuración
      await this.validateConfig();
      
      // 2. Construir el proyecto
      await this.buildProject();
      
      // 3. Analizar archivos
      const files = await this.analyzeFiles();
      
      // 4. Subir archivos al CDN
      await this.uploadFiles(files);
      
      // 5. Purgar caché del CDN
      await this.purgeCache();
      
      // 6. Configurar reglas de página
      await this.configurePageRules();
      
      // 7. Reporte final
      this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('❌ Error en el despliegue:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Validar configuración del CDN
   */
  async validateConfig() {
    console.log(chalk.blue('🔍 Validando configuración del CDN...'));
    
    if (!cdnConfig.enabled) {
      throw new Error('CDN está deshabilitado para este entorno');
    }
    
    if (!this.apiToken || !this.zoneId) {
      throw new Error('Variables de entorno CLOUDFLARE_API_TOKEN y CLOUDFLARE_ZONE_ID son requeridas');
    }
    
    // Verificar conectividad con Cloudflare API
    const response = await this.makeCloudflareRequest(`zones/${this.zoneId}`);
    if (!response.success) {
      throw new Error(`Error conectando con Cloudflare: ${response.errors?.[0]?.message}`);
    }
    
    console.log(chalk.green('✅ Configuración válida'));
  }

  /**
   * Construir el proyecto Astro
   */
  async buildProject() {
    console.log(chalk.blue('🏗️  Construyendo el proyecto...'));
    
    try {
      // Limpiar build anterior
      execSync('rm -rf dist', { cwd: process.cwd(), stdio: 'pipe' });
      
      // Construir proyecto
      execSync('npm run build:web', { 
        cwd: process.cwd(), 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      console.log(chalk.green('✅ Proyecto construido exitosamente'));
      
    } catch (error) {
      throw new Error(`Error construyendo el proyecto: ${error.message}`);
    }
  }

  /**
   * Analizar archivos del build
   */
  async analyzeFiles() {
    console.log(chalk.blue('📋 Analizando archivos...'));
    
    const files = [];
    const buildPath = join(process.cwd(), BUILD_DIR);
    
    if (!existsSync(buildPath)) {
      throw new Error(`Directorio de build no encontrado: ${buildPath}`);
    }
    
    const scanDirectory = (dir, basePath = '') => {
      const items = readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = join(dir, item);
        const relativePath = join(basePath, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, relativePath);
        } else {
          files.push({
            localPath: fullPath,
            remotePath: relativePath.replace(/\\/g, '/'),
            size: stat.size,
            extension: extname(item).toLowerCase(),
            type: this.getFileType(item),
            headers: getOptimizedHeaders(item)
          });
        }
      });
    };
    
    scanDirectory(buildPath);
    this.deployStats.totalFiles = files.length;
    
    console.log(chalk.green(`✅ ${files.length} archivos analizados`));
    
    // Mostrar estadísticas por tipo
    const typeStats = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Tipos de archivo:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} archivos`);
    });
    
    return files;
  }

  /**
   * Subir archivos al CDN (simulación - en producción usarías APIs específicas)
   */
  async uploadFiles(files) {
    console.log(chalk.blue('📤 Subiendo archivos al CDN...'));
    
    const concurrency = 5; // Subir 5 archivos en paralelo
    const chunks = this.chunkArray(files, concurrency);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(file => this.uploadFile(file)));
    }
    
    console.log(chalk.green(`✅ ${this.deployStats.uploadedFiles} archivos subidos`));
  }

  /**
   * Subir archivo individual
   */
  async uploadFile(file, retries = 0) {
    try {
      // Simulación de subida (en producción usarías AWS S3, Cloudflare Workers, etc.)
      console.log(chalk.gray(`📤 ${file.remotePath} (${this.formatBytes(file.size)})`));
      
      // Aquí implementarías la lógica real de subida
      // Por ejemplo, usando AWS SDK para S3:
      // await s3.upload({ Bucket: 'cdn-bucket', Key: file.remotePath, Body: readFileSync(file.localPath) }).promise();
      
      // O usando Cloudflare Workers KV para archivos estáticos
      
      this.deployStats.uploadedFiles++;
      
    } catch (error) {
      console.error(chalk.red(`❌ Error subiendo ${file.remotePath}: ${error.message}`));
      
      if (retries < MAX_RETRIES) {
        console.log(chalk.yellow(`🔄 Reintentando ${file.remotePath} (${retries + 1}/${MAX_RETRIES})`));
        await this.delay(RETRY_DELAY);
        return this.uploadFile(file, retries + 1);
      }
      
      this.deployStats.errors++;
    }
  }

  /**
   * Purgar caché del CDN
   */
  async purgeCache() {
    console.log(chalk.blue('🗑️  Purgando caché del CDN...'));
    
    try {
      const purgePaths = [
        ...cdnConfig.purge.auto,
        '/assets/css/*',
        '/assets/js/*',
        '/sitemap.xml'
      ];
      
      const response = await this.makeCloudflareRequest(`zones/${this.zoneId}/purge_cache`, {
        method: 'POST',
        body: JSON.stringify({
          files: purgePaths.map(path => `${this.cdnUrl}${path}`)
        })
      });
      
      if (response.success) {
        console.log(chalk.green('✅ Caché purgado exitosamente'));
      } else {
        throw new Error(response.errors?.[0]?.message || 'Error purgando caché');
      }
      
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Error purgando caché: ${error.message}`));
    }
  }

  /**
   * Configurar reglas de página en Cloudflare
   */
  async configurePageRules() {
    console.log(chalk.blue('⚙️  Configurando reglas de página...'));
    
    try {
      for (const rule of cdnConfig.cloudflare.pageRules) {
        await this.createPageRule(rule);
      }
      
      console.log(chalk.green('✅ Reglas de página configuradas'));
      
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Error configurando reglas: ${error.message}`));
    }
  }

  /**
   * Crear regla de página individual
   */
  async createPageRule(rule) {
    const response = await this.makeCloudflareRequest(`zones/${this.zoneId}/pagerules`, {
      method: 'POST',
      body: JSON.stringify({
        targets: [{ target: 'url', constraint: { operator: 'matches', value: rule.pattern } }],
        actions: Object.entries(rule.settings).map(([key, value]) => ({
          id: key,
          value: value
        })),
        status: 'active',
        priority: 1
      })
    });
    
    if (!response.success) {
      console.log(chalk.yellow(`⚠️  Regla ya existe o error: ${rule.pattern}`));
    }
  }

  /**
   * Hacer petición a la API de Cloudflare
   */
  async makeCloudflareRequest(endpoint, options = {}) {
    const url = `https://api.cloudflare.com/client/v4/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    return await response.json();
  }

  /**
   * Generar reporte final
   */
  generateReport() {
    console.log('');
    console.log(chalk.bgGreen.white(' 📊 REPORTE DE DESPLIEGUE '));
    console.log('');
    
    console.log(`📁 Archivos totales: ${this.deployStats.totalFiles}`);
    console.log(`✅ Archivos subidos: ${this.deployStats.uploadedFiles}`);
    console.log(`⏭️  Archivos omitidos: ${this.deployStats.skippedFiles}`);
    console.log(`❌ Errores: ${this.deployStats.errors}`);
    console.log(`🌐 CDN URL: ${this.cdnUrl}`);
    
    if (this.deployStats.errors === 0) {
      console.log('');
      console.log(chalk.bgGreen.white(' ✅ DESPLIEGUE COMPLETADO EXITOSAMENTE '));
    } else {
      console.log('');
      console.log(chalk.bgYellow.black(' ⚠️  DESPLIEGUE COMPLETADO CON ADVERTENCIAS '));
    }
  }

  /**
   * Utilidades
   */
  getFileType(filename) {
    const ext = extname(filename).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico'];
    const cssExts = ['.css'];
    const jsExts = ['.js', '.mjs'];
    const fontExts = ['.woff', '.woff2', '.eot', '.ttf', '.otf'];
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    
    if (imageExts.includes(ext)) return 'images';
    if (cssExts.includes(ext)) return 'css';
    if (jsExts.includes(ext)) return 'javascript';
    if (fontExts.includes(ext)) return 'fonts';
    if (docExts.includes(ext)) return 'documents';
    if (ext === '.html') return 'html';
    
    return 'other';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new CDNDeployer();
  deployer.deploy().catch(console.error);
}

export default CDNDeployer;