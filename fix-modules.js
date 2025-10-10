/**
 * 🧹 Script de limpieza de módulos inexistentes
 * Elimina referencias a 4 módulos JS que causan errores en producción
 */

const fs = require('fs');
const path = require('path');

// Módulos a eliminar
const modulesToRemove = [
    'bge-analytics-module.js',
    'bge-education-module.js',
    'bge-pwa-module.js',
    'bge-apis-module.js'
];

// Directorios a procesar
const directories = [
    'C:\\03 BachilleratoHeroesWeb',
    'C:\\03 BachilleratoHeroesWeb\\public'
];

let filesProcessed = 0;
let linesRemoved = 0;

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let removedCount = 0;

        // Remover cada módulo
        modulesToRemove.forEach(module => {
            // Patrón para encontrar <script src="...module.js"></script>
            const pattern = new RegExp(
                `\\s*<script\\s+src=["'].*?${module.replace('.', '\\.')}["'][^>]*>\\s*</script>\\s*\\n?`,
                'gi'
            );

            const matches = content.match(pattern);
            if (matches) {
                removedCount += matches.length;
                content = content.replace(pattern, '');
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesProcessed++;
            linesRemoved += removedCount;
            console.log(`✅ ${path.basename(filePath)} - Removidas ${removedCount} referencias`);
        }

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && file.endsWith('.html')) {
            processFile(filePath);
        }
    });
}

console.log('🧹 Iniciando limpieza de módulos inexistentes...\n');

directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`📂 Procesando: ${dir}`);
        processDirectory(dir);
    }
});

console.log('\n✅ Limpieza completada:');
console.log(`   📄 Archivos procesados: ${filesProcessed}`);
console.log(`   🗑️  Referencias eliminadas: ${linesRemoved}`);
