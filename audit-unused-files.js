/**
 * 🔍 AUDITORÍA COMPLETA DE ARCHIVOS NO USADOS
 * Analiza frontend y backend para identificar archivos huérfanos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO AUDITORÍA COMPLETA DEL PROYECTO\n');

// ============================================
// CONFIGURACIÓN
// ============================================
const config = {
    rootDir: __dirname,
    excludeDirs: ['node_modules', '.git', 'no_usados', 'backend/node_modules'],
    jsDir: 'js',
    publicJsDir: 'public/js',
    backendDir: 'backend',
    htmlFiles: []
};

// ============================================
// UTILIDADES
// ============================================
function getAllFiles(dirPath, extension, excludeDirs = []) {
    const files = [];

    function traverseDir(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            // Skip excluded directories
            if (entry.isDirectory()) {
                const shouldExclude = excludeDirs.some(excluded =>
                    fullPath.includes(excluded)
                );
                if (!shouldExclude) {
                    traverseDir(fullPath);
                }
            } else if (extension === '*' || entry.name.endsWith(extension)) {
                files.push(fullPath);
            }
        }
    }

    traverseDir(dirPath);
    return files;
}

function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return '';
    }
}

function isFileReferenced(fileName, allContent) {
    // Normalizar nombre del archivo
    const baseName = path.basename(fileName);
    const nameWithoutExt = baseName.replace(/\.(js|css|jpg|jpeg|png|webp|gif|svg)$/, '');

    // Buscar referencias al archivo
    const patterns = [
        baseName,                                    // nombre completo
        nameWithoutExt,                              // sin extensión
        fileName.replace(/\\/g, '/'),                // path completo con /
        fileName.replace(/\\/g, '/').replace('js/', ''),  // sin carpeta js/
    ];

    return patterns.some(pattern => allContent.includes(pattern));
}

// ============================================
// FASE 1: ANALIZAR ARCHIVOS HTML
// ============================================
console.log('📄 FASE 1: Analizando archivos HTML...\n');

const htmlFiles = getAllFiles(config.rootDir, '.html', config.excludeDirs);
console.log(`   ✅ Encontrados ${htmlFiles.length} archivos HTML\n`);

// Leer contenido de todos los HTML
let allHtmlContent = '';
htmlFiles.forEach(file => {
    allHtmlContent += readFileContent(file) + '\n';
});

// ============================================
// FASE 2: ANALIZAR ARCHIVOS JS DEL FRONTEND
// ============================================
console.log('🔧 FASE 2: Analizando archivos JS del frontend...\n');

const jsFiles = getAllFiles(path.join(config.rootDir, config.jsDir), '.js', []);
console.log(`   📦 Total de archivos JS en /js: ${jsFiles.length}\n`);

// Leer contenido de todos los JS (para detectar imports/requires)
let allJsContent = '';
jsFiles.forEach(file => {
    allJsContent += readFileContent(file) + '\n';
});

// Combinar todo el contenido
const allContent = allHtmlContent + allJsContent;

// Analizar cada archivo JS
const unusedJsFiles = [];
const usedJsFiles = [];

jsFiles.forEach(file => {
    const fileName = path.basename(file);
    const isReferenced = isFileReferenced(file, allContent);

    if (isReferenced) {
        usedJsFiles.push({ file, fileName });
    } else {
        unusedJsFiles.push({ file, fileName });
    }
});

console.log(`   ✅ Archivos JS USADOS: ${usedJsFiles.length}`);
console.log(`   ❌ Archivos JS NO USADOS: ${unusedJsFiles.length}\n`);

if (unusedJsFiles.length > 0) {
    console.log('   📋 Archivos JS sin referencias:\n');
    unusedJsFiles.slice(0, 20).forEach(({ fileName }) => {
        console.log(`      • ${fileName}`);
    });
    if (unusedJsFiles.length > 20) {
        console.log(`      ... y ${unusedJsFiles.length - 20} más\n`);
    } else {
        console.log('');
    }
}

// ============================================
// FASE 3: ANALIZAR RUTAS DEL BACKEND
// ============================================
console.log('🗄️  FASE 3: Analizando rutas del backend...\n');

const backendRoutesDir = path.join(config.rootDir, config.backendDir, 'routes');
const backendRoutes = fs.existsSync(backendRoutesDir) ?
    getAllFiles(backendRoutesDir, '.js', ['node_modules']) : [];

console.log(`   📦 Total de rutas en backend/routes: ${backendRoutes.length}\n`);

// Leer server.js para ver qué rutas están registradas
const serverJsPath = path.join(config.rootDir, config.backendDir, 'server.js');
const serverContent = fs.existsSync(serverJsPath) ? readFileContent(serverJsPath) : '';

const unusedBackendRoutes = [];
const usedBackendRoutes = [];

backendRoutes.forEach(file => {
    const fileName = path.basename(file);
    const routeName = fileName.replace('.js', '');

    // Buscar si la ruta está registrada en server.js
    const isRegistered = serverContent.includes(fileName) ||
                        serverContent.includes(routeName) ||
                        serverContent.includes(`routes/${fileName}`);

    if (isRegistered) {
        usedBackendRoutes.push({ file, fileName });
    } else {
        unusedBackendRoutes.push({ file, fileName });
    }
});

console.log(`   ✅ Rutas backend REGISTRADAS: ${usedBackendRoutes.length}`);
console.log(`   ❌ Rutas backend NO REGISTRADAS: ${unusedBackendRoutes.length}\n`);

if (unusedBackendRoutes.length > 0) {
    console.log('   📋 Rutas backend sin registrar:\n');
    unusedBackendRoutes.forEach(({ fileName }) => {
        console.log(`      • ${fileName}`);
    });
    console.log('');
}

// ============================================
// FASE 4: ANALIZAR IMÁGENES
// ============================================
console.log('🖼️  FASE 4: Analizando imágenes...\n');

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ico'];
let allImages = [];

imageExtensions.forEach(ext => {
    const images = getAllFiles(path.join(config.rootDir, 'images'), ext, config.excludeDirs);
    allImages = allImages.concat(images);
});

console.log(`   📦 Total de imágenes encontradas: ${allImages.length}\n`);

const unusedImages = [];
const usedImages = [];

allImages.forEach(file => {
    const fileName = path.basename(file);
    const isReferenced = isFileReferenced(file, allContent);

    if (isReferenced) {
        usedImages.push({ file, fileName });
    } else {
        unusedImages.push({ file, fileName });
    }
});

console.log(`   ✅ Imágenes USADAS: ${usedImages.length}`);
console.log(`   ❌ Imágenes NO USADAS: ${unusedImages.length}\n`);

if (unusedImages.length > 0) {
    console.log('   📋 Imágenes sin referencias (primeras 20):\n');
    unusedImages.slice(0, 20).forEach(({ fileName }) => {
        console.log(`      • ${fileName}`);
    });
    if (unusedImages.length > 20) {
        console.log(`      ... y ${unusedImages.length - 20} más\n`);
    } else {
        console.log('');
    }
}

// ============================================
// RESUMEN FINAL
// ============================================
console.log('═══════════════════════════════════════════════════');
console.log('📊 RESUMEN DE AUDITORÍA');
console.log('═══════════════════════════════════════════════════');
console.log(`📄 HTML analizados: ${htmlFiles.length}`);
console.log(`🔧 JS frontend total: ${jsFiles.length}`);
console.log(`   ✅ Usados: ${usedJsFiles.length}`);
console.log(`   ❌ Sin usar: ${unusedJsFiles.length}`);
console.log(`🗄️  Backend rutas: ${backendRoutes.length}`);
console.log(`   ✅ Registradas: ${usedBackendRoutes.length}`);
console.log(`   ❌ Sin registrar: ${unusedBackendRoutes.length}`);
console.log(`🖼️  Imágenes total: ${allImages.length}`);
console.log(`   ✅ Usadas: ${usedImages.length}`);
console.log(`   ❌ Sin usar: ${unusedImages.length}`);
console.log('═══════════════════════════════════════════════════\n');

// ============================================
// GENERAR REPORTE JSON
// ============================================
const report = {
    timestamp: new Date().toISOString(),
    summary: {
        totalHtml: htmlFiles.length,
        totalJsFrontend: jsFiles.length,
        usedJsFrontend: usedJsFiles.length,
        unusedJsFrontend: unusedJsFiles.length,
        totalBackendRoutes: backendRoutes.length,
        usedBackendRoutes: usedBackendRoutes.length,
        unusedBackendRoutes: unusedBackendRoutes.length,
        totalImages: allImages.length,
        usedImages: usedImages.length,
        unusedImages: unusedImages.length
    },
    details: {
        unusedJsFiles: unusedJsFiles.map(item => item.file.replace(config.rootDir, '.')),
        unusedBackendRoutes: unusedBackendRoutes.map(item => item.file.replace(config.rootDir, '.')),
        unusedImages: unusedImages.map(item => item.file.replace(config.rootDir, '.'))
    }
};

fs.writeFileSync('audit-report.json', JSON.stringify(report, null, 2));
console.log('✅ Reporte detallado guardado en: audit-report.json\n');

// ============================================
// RECOMENDACIONES
// ============================================
console.log('💡 RECOMENDACIONES:\n');

if (unusedJsFiles.length > 0) {
    console.log(`   ⚠️  ${unusedJsFiles.length} archivos JS sin usar detectados`);
    console.log('   📝 Revisa audit-report.json para ver la lista completa');
    console.log('   🗑️  Considera mover a no_usados/ después de verificar\n');
}

if (unusedBackendRoutes.length > 0) {
    console.log(`   ⚠️  ${unusedBackendRoutes.length} rutas backend sin registrar`);
    console.log('   📝 Estas rutas no están en server.js');
    console.log('   ✅ Verifica si son archivos de respaldo o sin usar\n');
}

if (unusedImages.length > 0) {
    console.log(`   ⚠️  ${unusedImages.length} imágenes sin referencias`);
    console.log('   📝 Pueden ser recursos legacy o sin usar');
    console.log('   💾 Considera archivar antes de eliminar\n');
}

console.log('✅ Auditoría completa finalizada');
