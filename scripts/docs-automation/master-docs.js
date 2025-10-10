#!/usr/bin/env node

/**
 * 🎯 MAESTRO DE DOCUMENTACIÓN AUTOMATIZADA BGE
 * master-docs.js - Coordinador Principal del Sistema
 *
 * Funcionalidad:
 * - Coordina todos los scripts de documentación
 * - Instala git hooks automáticamente
 * - Programa tareas de mantenimiento
 * - Proporciona interfaz unificada
 *
 * Uso:
 *   node scripts/docs-automation/master-docs.js --install     (instalar sistema)
 *   node scripts/docs-automation/master-docs.js --update      (actualizar docs)
 *   node scripts/docs-automation/master-docs.js --cleanup     (limpiar docs)
 *   node scripts/docs-automation/master-docs.js --full        (operación completa)
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Importar otros módulos del sistema
const BGEDocsUpdater = require('./update-docs.js');
const BGEArchitectureMapper = require('./generate-maps.js');
const BGEDocsCleanup = require('./cleanup-docs.js');

class BGEDocsMaster {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../../');
        this.scriptsDir = path.join(this.projectRoot, 'scripts', 'docs-automation');
        this.gitHooksDir = path.join(this.projectRoot, '.git', 'hooks');

        console.log('🎯 Iniciando BGE Docs Master...');
        console.log('📁 Directorio del proyecto:', this.projectRoot);
    }

    // Verificar dependencias necesarias
    checkDependencies() {
        console.log('🔍 Verificando dependencias...');

        const requiredPackages = ['glob'];
        const packageJsonPath = path.join(this.projectRoot, 'package.json');

        let packageJson = {};
        if (fs.existsSync(packageJsonPath)) {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        }

        const dependencies = {
            ...packageJson.dependencies || {},
            ...packageJson.devDependencies || {}
        };

        const missing = requiredPackages.filter(pkg => !dependencies[pkg]);

        if (missing.length > 0) {
            console.log(`⚠️ Paquetes faltantes: ${missing.join(', ')}`);
            console.log('💡 Instalando dependencias...');

            try {
                execSync(`npm install ${missing.join(' ')}`, {
                    cwd: this.projectRoot,
                    stdio: 'inherit'
                });
                console.log('✅ Dependencias instaladas');
            } catch (error) {
                console.error('❌ Error instalando dependencias:', error.message);
                return false;
            }
        } else {
            console.log('✅ Todas las dependencias están instaladas');
        }

        return true;
    }

    // Instalar git hooks
    installGitHooks() {
        console.log('🪝 Instalando Git hooks...');

        if (!fs.existsSync(this.gitHooksDir)) {
            console.log('⚠️ No se encontró directorio .git/hooks');
            return false;
        }

        // Hook pre-commit
        const preCommitHook = `#!/bin/sh
#
# 🤖 BGE Docs Auto-Update Hook
# Actualiza documentación antes de cada commit
#

echo "🤖 BGE: Actualizando documentación automáticamente..."

# Ejecutar actualizador de documentos
node scripts/docs-automation/update-docs.js

# Agregar archivos actualizados al commit
git add ESTADO_MAESTRO_PROYECTO.md
git add docs/arquitectura/*.md

echo "✅ BGE: Documentación actualizada y agregada al commit"
`;

        // Hook post-commit
        const postCommitHook = `#!/bin/sh
#
# 🤖 BGE Docs Post-Commit Hook
# Regenera mapas después de cada commit
#

echo "🤖 BGE: Regenerando mapas de arquitectura..."

# Ejecutar generador de mapas
node scripts/docs-automation/generate-maps.js

echo "✅ BGE: Mapas regenerados exitosamente"
`;

        try {
            // Escribir hooks
            const preCommitPath = path.join(this.gitHooksDir, 'pre-commit');
            const postCommitPath = path.join(this.gitHooksDir, 'post-commit');

            fs.writeFileSync(preCommitPath, preCommitHook);
            fs.writeFileSync(postCommitPath, postCommitHook);

            // Hacer ejecutables (en sistemas Unix)
            if (process.platform !== 'win32') {
                fs.chmodSync(preCommitPath, '755');
                fs.chmodSync(postCommitPath, '755');
            }

            console.log('✅ Git hooks instalados:');
            console.log('   📝 pre-commit: Actualiza documentación');
            console.log('   🗺️ post-commit: Regenera mapas');

        } catch (error) {
            console.error('❌ Error instalando git hooks:', error.message);
            return false;
        }

        return true;
    }

    // Crear archivo de configuración
    createConfigFile() {
        console.log('⚙️ Creando archivo de configuración...');

        const config = {
            version: '1.0.0',
            enabled: true,
            autoUpdate: {
                onCommit: true,
                onPush: true,
                scheduled: true,
                interval: 3600000 // 1 hora
            },
            cleanup: {
                auto: true,
                preserveHistory: true,
                maxHistoryDays: 90
            },
            maps: {
                autoGenerate: true,
                includePrivate: false,
                detailedAnalysis: true
            },
            notifications: {
                console: true,
                file: true,
                gitCommit: true
            }
        };

        const configPath = path.join(this.scriptsDir, 'config.json');

        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            console.log('✅ Configuración creada: scripts/docs-automation/config.json');
        } catch (error) {
            console.error('❌ Error creando configuración:', error.message);
        }
    }

    // Actualizar documentación
    async updateDocs() {
        console.log('📝 Actualizando documentación...');

        try {
            const updater = new BGEDocsUpdater();
            await updater.run();
            console.log('✅ Documentación actualizada');
        } catch (error) {
            console.error('❌ Error actualizando documentación:', error.message);
        }
    }

    // Generar mapas
    async generateMaps() {
        console.log('🗺️ Generando mapas de arquitectura...');

        try {
            const mapper = new BGEArchitectureMapper();
            await mapper.run();
            console.log('✅ Mapas generados');
        } catch (error) {
            console.error('❌ Error generando mapas:', error.message);
        }
    }

    // Limpiar documentación
    async cleanupDocs(dryRun = false) {
        console.log('🧹 Limpiando documentación...');

        try {
            const cleanup = new BGEDocsCleanup(dryRun);
            await cleanup.run();
            console.log('✅ Documentación limpiada');
        } catch (error) {
            console.error('❌ Error limpiando documentación:', error.message);
        }
    }

    // Operación completa
    async fullOperation() {
        console.log('🚀 Ejecutando operación completa...');

        await this.updateDocs();
        await this.generateMaps();
        await this.cleanupDocs();

        console.log('🎉 Operación completa finalizada');
    }

    // Instalar sistema completo
    async installSystem() {
        console.log('🚀 Instalando sistema de documentación automatizada...');
        console.log('=' .repeat(70));

        // Verificar dependencias
        if (!this.checkDependencies()) {
            console.error('❌ No se pudieron instalar las dependencias');
            return;
        }

        // Instalar git hooks
        this.installGitHooks();

        // Crear configuración
        this.createConfigFile();

        // Ejecutar primera actualización
        await this.updateDocs();
        await this.generateMaps();

        console.log('=' .repeat(70));
        console.log('🎉 Sistema de documentación automatizada instalado!');
        console.log('');
        console.log('📋 Características instaladas:');
        console.log('   🤖 Actualización automática en commits');
        console.log('   🗺️ Generación automática de mapas');
        console.log('   🧹 Limpieza inteligente de duplicados');
        console.log('   📊 Estado del proyecto en tiempo real');
        console.log('');
        console.log('🎯 Próximos pasos:');
        console.log('   1. La documentación se actualiza automáticamente en cada commit');
        console.log('   2. Los mapas se regeneran después de cada commit');
        console.log('   3. Para limpiar manualmente: npm run docs:cleanup');
        console.log('   4. Para actualizar manualmente: npm run docs:update');
    }

    // Mostrar ayuda
    showHelp() {
        console.log(`
🎯 BGE DOCS MASTER - Sistema de Documentación Automatizada

COMANDOS DISPONIBLES:
  --install     Instalar sistema completo (recomendado para primera vez)
  --update      Actualizar documentación y métricas
  --maps        Generar mapas de arquitectura
  --cleanup     Limpiar duplicados y archivos obsoletos
  --full        Ejecutar operación completa (update + maps + cleanup)
  --help        Mostrar esta ayuda

EJEMPLOS DE USO:
  node scripts/docs-automation/master-docs.js --install
  node scripts/docs-automation/master-docs.js --update
  node scripts/docs-automation/master-docs.js --full

CONFIGURACIÓN:
  - Archivo de config: scripts/docs-automation/config.json
  - Git hooks: .git/hooks/pre-commit y post-commit
  - Documentos generados: ESTADO_MAESTRO_PROYECTO.md y docs/arquitectura/

AUTOMATIZACIÓN:
  ✅ Se ejecuta automáticamente en cada commit de Git
  ✅ Genera métricas en tiempo real del proyecto
  ✅ Mantiene mapas de arquitectura actualizados
  ✅ Limpia documentación obsoleta automáticamente
        `);
    }

    // Ejecutar según argumentos
    async run() {
        const args = process.argv.slice(2);

        if (args.length === 0 || args.includes('--help')) {
            this.showHelp();
            return;
        }

        if (args.includes('--install')) {
            await this.installSystem();
        } else if (args.includes('--update')) {
            await this.updateDocs();
        } else if (args.includes('--maps')) {
            await this.generateMaps();
        } else if (args.includes('--cleanup')) {
            const dryRun = args.includes('--dry-run');
            await this.cleanupDocs(dryRun);
        } else if (args.includes('--full')) {
            await this.fullOperation();
        } else {
            console.error('❌ Comando no reconocido. Use --help para ver opciones');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const master = new BGEDocsMaster();
    master.run().catch(console.error);
}

module.exports = BGEDocsMaster;