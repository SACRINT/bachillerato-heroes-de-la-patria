#!/usr/bin/env node
/**
 * Script seguro para inyectar DOMPurify en archivos HTML
 * Características:
 * - Lee cada archivo HTML
 * - Verifica si ya contiene dompurify-config.js (evita duplicación)
 * - Busca el punto de inserción después de Bootstrap
 * - Inyecta los scripts de forma segura
 * - Crea backups antes de modificar
 * - Reporta exactamente qué fue modificado
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', `dompurify-${new Date().toISOString().split('T')[0]}`);

// Código a inyectar
const DOMPURIFY_CODE = `
    <!-- 🔒 DOMPurify XSS Protection -->
    <script src="https://cdn.jsdelivr.net/npm/isomorphic-dompurify/dist/purify.min.js"><\/script>
    <script src="js/dompurify-config.js"><\/script>`;

// Patrón de búsqueda: línea con bootstrap.bundle.min.js
const BOOTSTRAP_PATTERN = /(<script[^>]*src=["']https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@[\d.]+\/dist\/js\/bootstrap\.bundle\.min\.js["'][^>]*><\/script>)/;

/**
 * Obtener lista de archivos HTML (excluyendo partials)
 */
function getHtmlFiles() {
    const files = fs.readdirSync(PUBLIC_DIR)
        .filter(f => f.endsWith('.html') && !f.includes('partials'))
        .sort();
    return files;
}

/**
 * Verificar si el archivo ya tiene dompurify-config.js
 */
function hasDOMPurifyConfig(content) {
    return content.includes('dompurify-config.js');
}

/**
 * Inyectar DOMPurify en el contenido
 */
function injectDOMPurify(content, fileName) {
    // Si ya tiene, saltamos
    if (hasDOMPurifyConfig(content)) {
        return { modified: false, reason: 'Ya tiene dompurify-config.js' };
    }

    // Buscar bootstrap
    const match = content.match(BOOTSTRAP_PATTERN);
    if (!match) {
        return { modified: false, reason: 'No contiene bootstrap.bundle.min.js' };
    }

    // Reemplazar: después del script de bootstrap, agregar DOMPurify
    const newContent = content.replace(match[0], match[0] + DOMPURIFY_CODE);

    if (newContent === content) {
        return { modified: false, reason: 'El reemplazo no cambió el contenido' };
    }

    return { modified: true, newContent };
}

/**
 * Main
 */
function main() {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('🔒 INYECCIÓN SEGURA DE DOMPURIFY EN HTML');
    console.log('════════════════════════════════════════════════════════\n');

    const htmlFiles = getHtmlFiles();
    console.log(`📋 Archivos HTML encontrados: ${htmlFiles.length}\n`);

    // Crear directorio de backups
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    let modifiedCount = 0;
    let skippedCount = 0;

    for (const fileName of htmlFiles) {
        const filePath = path.join(PUBLIC_DIR, fileName);
        const content = fs.readFileSync(filePath, 'utf-8');

        const result = injectDOMPurify(content, fileName);

        if (result.modified) {
            // Crear backup
            const backupPath = path.join(BACKUP_DIR, fileName);
            fs.writeFileSync(backupPath, content, 'utf-8');

            // Escribir archivo modificado
            fs.writeFileSync(filePath, result.newContent, 'utf-8');

            console.log(`✅ ${fileName}`);
            console.log(`   └─ Backup: ${path.relative(process.cwd(), backupPath)}`);
            modifiedCount++;
        } else {
            console.log(`⏭️  ${fileName}`);
            console.log(`   └─ ${result.reason}`);
            skippedCount++;
        }
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log(`📊 RESUMEN:`);
    console.log(`   ✅ Modificados: ${modifiedCount}`);
    console.log(`   ⏭️  Saltados: ${skippedCount}`);
    console.log(`   📁 Backups: ${BACKUP_DIR}`);
    console.log('════════════════════════════════════════════════════════\n');

    if (modifiedCount > 0) {
        console.log('✨ INYECCIÓN COMPLETADA EXITOSAMENTE\n');
    }
}

main();
