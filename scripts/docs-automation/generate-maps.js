#!/usr/bin/env node

/**
 * 🗺️ GENERADOR AUTOMÁTICO DE MAPAS DE ARQUITECTURA BGE
 * generate-maps.js - Sistema de Mapeo Inteligente
 *
 * Funcionalidad:
 * - Analiza estructura del proyecto automáticamente
 * - Mapea dependencias JavaScript dinámicamente
 * - Documenta flujos de autenticación
 * - Genera diagramas de arquitectura actualizados
 *
 * Uso: node scripts/docs-automation/generate-maps.js
 */

const fs = require('fs');
const path = require('path');

class BGEArchitectureMapper {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../../');
        this.jsFiles = [];
        this.htmlFiles = [];
        this.dependencies = new Map();
        this.windowObjects = new Set();
        this.authFlows = [];

        console.log('🗺️ Iniciando BGE Architecture Mapper...');
        console.log('📁 Directorio del proyecto:', this.projectRoot);
    }

    // Escanear todos los archivos del proyecto
    scanProjectStructure() {
        console.log('🔍 Escaneando estructura del proyecto...');

        try {
            this.jsFiles = this.findFiles('**/*.js', [
                'node_modules/**',
                'no_usados/**',
                'scripts/**'
            ]);

            this.htmlFiles = this.findFiles('**/*.html', [
                'node_modules/**',
                'dist/**'
            ]);

            console.log(`✅ Encontrados ${this.jsFiles.length} archivos JS`);
            console.log(`✅ Encontrados ${this.htmlFiles.length} archivos HTML`);

        } catch (error) {
            console.error('❌ Error en escaneo:', error.message);
        }
    }

    // Encontrar archivos por patrón
    findFiles(pattern, excludes = []) {
        try {
            const glob = require('glob');
            return glob.sync(pattern, {
                cwd: this.projectRoot,
                ignore: excludes
            });
        } catch (error) {
            console.error(`❌ Error buscando archivos ${pattern}:`, error.message);
            return [];
        }
    }

    // Analizar dependencias JavaScript
    analyzeDependencies() {
        console.log('🔗 Analizando dependencias JavaScript...');

        this.jsFiles.forEach(jsFile => {
            try {
                const fullPath = path.join(this.projectRoot, jsFile);
                const content = fs.readFileSync(fullPath, 'utf8');

                // Buscar dependencias de archivos
                const importRegex = /(?:import.*from\\s*['"](.+?)['"]|require\\(['"](.+?)['"]\\))/g;
                const srcRegex = /<script.*?src=['"](.+?)['"].*?>/g;

                let match;
                const fileDeps = new Set();

                // Buscar imports y requires
                while ((match = importRegex.exec(content)) !== null) {
                    const dep = match[1] || match[2];
                    if (dep && !dep.startsWith('http')) {
                        fileDeps.add(dep);
                    }
                }

                // Buscar objetos window
                const windowRegex = /window\\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
                while ((match = windowRegex.exec(content)) !== null) {
                    this.windowObjects.add(match[1]);
                }

                // Buscar patrones de autenticación
                if (content.includes('OAuth') || content.includes('JWT') || content.includes('auth')) {
                    this.authFlows.push({
                        file: jsFile,
                        hasOAuth: content.includes('OAuth'),
                        hasJWT: content.includes('JWT'),
                        hasLogin: content.includes('login'),
                        hasAuth: content.includes('auth')
                    });
                }

                this.dependencies.set(jsFile, Array.from(fileDeps));

            } catch (error) {
                console.error(`❌ Error analizando ${jsFile}:`, error.message);
            }
        });

        console.log(`✅ Analizadas dependencias de ${this.jsFiles.length} archivos`);
        console.log(`🔗 Encontrados ${this.windowObjects.size} objetos window`);
        console.log(`🔐 Encontrados ${this.authFlows.length} flujos de autenticación`);
    }

    // Generar mapa de dependencias JavaScript
    generateJSMap() {
        console.log('🗺️ Generando mapa de dependencias JS...');

        let mapContent = `# 🗺️ MAPA DE DEPENDENCIAS JAVASCRIPT
## Generado Automáticamente - ${new Date().toLocaleDateString('es-MX')}

---

## 📊 RESUMEN DE DEPENDENCIAS

- **Total archivos JS:** ${this.jsFiles.length}
- **Archivos con dependencias:** ${Array.from(this.dependencies.values()).filter(deps => deps.length > 0).length}
- **Objetos window detectados:** ${this.windowObjects.size}
- **Flujos de autenticación:** ${this.authFlows.length}

---

## 🔗 DEPENDENCIAS POR ARCHIVO

`;

        // Listar dependencias por archivo
        for (const [file, deps] of this.dependencies) {
            if (deps.length > 0) {
                mapContent += `### 📄 \`${file}\`\n`;
                mapContent += `**Dependencias encontradas:** ${deps.length}\n\n`;
                deps.forEach(dep => {
                    mapContent += `- 🔗 \`${dep}\`\n`;
                });
                mapContent += '\n---\n\n';
            }
        }

        // Listar objetos window
        mapContent += `## 🌐 OBJETOS WINDOW GLOBALES

Total detectados: **${this.windowObjects.size}**

`;

        Array.from(this.windowObjects).sort().forEach(obj => {
            mapContent += `- 🔧 \`window.${obj}\`\n`;
        });

        mapContent += '\n---\n\n**🤖 Generado automáticamente por BGE Architecture Mapper**\n';

        return mapContent;
    }

    // Generar mapa de autenticación
    generateAuthMap() {
        console.log('🔐 Generando mapa de autenticación...');

        let authContent = `# 🔐 MAPA DE FLUJOS DE AUTENTICACIÓN
## Generado Automáticamente - ${new Date().toLocaleDateString('es-MX')}

---

## 📊 RESUMEN DE AUTENTICACIÓN

- **Archivos con autenticación:** ${this.authFlows.length}
- **Implementaciones OAuth:** ${this.authFlows.filter(f => f.hasOAuth).length}
- **Implementaciones JWT:** ${this.authFlows.filter(f => f.hasJWT).length}
- **Sistemas de login:** ${this.authFlows.filter(f => f.hasLogin).length}

---

## 🔒 FLUJOS DETECTADOS

`;

        this.authFlows.forEach(flow => {
            authContent += `### 📄 \`${flow.file}\`\n\n`;
            authContent += `**Características detectadas:**\n`;

            if (flow.hasOAuth) authContent += `- ✅ **OAuth 2.0** implementado\n`;
            if (flow.hasJWT) authContent += `- ✅ **JWT** implementado\n`;
            if (flow.hasLogin) authContent += `- ✅ **Sistema de Login** presente\n`;
            if (flow.hasAuth) authContent += `- ✅ **Autenticación** general implementada\n`;

            authContent += '\n---\n\n';
        });

        authContent += '**🤖 Generado automáticamente por BGE Architecture Mapper**\n';

        return authContent;
    }

    // Generar mapa maestro de arquitectura
    generateMasterMap() {
        console.log('🏗️ Generando mapa maestro de arquitectura...');

        const masterContent = `# 🏗️ MAPA MAESTRO DE ARQUITECTURA BGE
## Generado Automáticamente - ${new Date().toLocaleDateString('es-MX')}

---

## 📊 ESTADÍSTICAS DEL PROYECTO

### 🏗️ **ESTRUCTURA GENERAL:**
- **Archivos HTML:** ${this.htmlFiles.length} páginas
- **Archivos JavaScript:** ${this.jsFiles.length} módulos
- **Dependencias totales:** ${Array.from(this.dependencies.values()).flat().length}
- **Objetos window:** ${this.windowObjects.size}

### 🔐 **SEGURIDAD Y AUTENTICACIÓN:**
- **Flujos de autenticación:** ${this.authFlows.length}
- **OAuth implementado:** ${this.authFlows.filter(f => f.hasOAuth).length > 0 ? '✅' : '❌'}
- **JWT implementado:** ${this.authFlows.filter(f => f.hasJWT).length > 0 ? '✅' : '❌'}

---

## 🎯 ARQUITECTURA PRINCIPAL

### 📱 **FRONTEND (PWA)**
\`\`\`
├── 📄 Páginas HTML: ${this.htmlFiles.length}
├── 💻 Módulos JS: ${this.jsFiles.length}
├── 🔧 Objetos Global: ${this.windowObjects.size}
└── 🔗 Dependencias: ${Array.from(this.dependencies.values()).flat().length}
\`\`\`

### 🔐 **AUTENTICACIÓN**
\`\`\`
├── 🔒 Archivos Auth: ${this.authFlows.length}
├── 🌐 OAuth 2.0: ${this.authFlows.filter(f => f.hasOAuth).length > 0 ? 'Implementado' : 'No implementado'}
├── 🎫 JWT: ${this.authFlows.filter(f => f.hasJWT).length > 0 ? 'Implementado' : 'No implementado'}
└── 👤 Login System: ${this.authFlows.filter(f => f.hasLogin).length > 0 ? 'Implementado' : 'No implementado'}
\`\`\`

---

## 📁 ARCHIVOS PRINCIPALES DETECTADOS

### 🌐 **ARCHIVOS HTML:**
${this.htmlFiles.slice(0, 10).map(file => `- 📄 \`${file}\``).join('\n')}
${this.htmlFiles.length > 10 ? `\n... y ${this.htmlFiles.length - 10} archivos más` : ''}

### 💻 **ARCHIVOS JAVASCRIPT CORE:**
${this.jsFiles.filter(f => !f.includes('public/')).slice(0, 10).map(file => `- 💻 \`${file}\``).join('\n')}
${this.jsFiles.filter(f => !f.includes('public/')).length > 10 ? `\n... y ${this.jsFiles.filter(f => !f.includes('public/')).length - 10} archivos más` : ''}

---

## 🔄 SISTEMA DE ACTUALIZACIÓN

Este mapa se actualiza automáticamente detectando:
- ✅ Nuevos archivos JavaScript
- ✅ Cambios en dependencias
- ✅ Nuevos objetos window
- ✅ Implementaciones de autenticación

**🕐 Última actualización:** ${new Date().toLocaleString('es-MX')}
**🤖 Próxima actualización:** En el siguiente commit de Git

---

**🗺️ Generado automáticamente por BGE Architecture Mapper v1.0**`;

        return masterContent;
    }

    // Escribir mapas a archivos
    writeMaps() {
        console.log('💾 Escribiendo mapas generados...');

        const docsDir = path.join(this.projectRoot, 'docs', 'arquitectura');

        // Crear directorio si no existe
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
            console.log('📁 Creado directorio docs/arquitectura/');
        }

        try {
            // Escribir mapa de dependencias JS
            const jsMapPath = path.join(docsDir, 'MAPA_DEPENDENCIAS_JS.md');
            fs.writeFileSync(jsMapPath, this.generateJSMap(), 'utf8');
            console.log('✅ MAPA_DEPENDENCIAS_JS.md generado');

            // Escribir mapa de autenticación
            const authMapPath = path.join(docsDir, 'MAPA_AUTENTICACION.md');
            fs.writeFileSync(authMapPath, this.generateAuthMap(), 'utf8');
            console.log('✅ MAPA_AUTENTICACION.md generado');

            // Escribir mapa maestro
            const masterMapPath = path.join(docsDir, 'MAPA_MAESTRO_COMPLETO.md');
            fs.writeFileSync(masterMapPath, this.generateMasterMap(), 'utf8');
            console.log('✅ MAPA_MAESTRO_COMPLETO.md generado');

        } catch (error) {
            console.error('❌ Error escribiendo mapas:', error.message);
        }
    }

    // Ejecutar generación completa
    async run() {
        console.log('🚀 Iniciando generación de mapas de arquitectura...');
        console.log('=' .repeat(60));

        this.scanProjectStructure();
        this.analyzeDependencies();
        this.writeMaps();

        console.log('=' .repeat(60));
        console.log('🎉 Mapas de arquitectura generados exitosamente!');
        console.log('📁 Ubicación: docs/arquitectura/');
        console.log('🗺️ 3 mapas actualizados automáticamente');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const mapper = new BGEArchitectureMapper();
    mapper.run().catch(console.error);
}

module.exports = BGEArchitectureMapper;