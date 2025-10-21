/**
 * 🗑️ MOVER ARCHIVOS NO USADOS A no_usados/
 * Organiza archivos huérfanos de forma segura y documentada
 */

const fs = require('fs');
const path = require('path');

// Leer reporte de auditoría
const report = JSON.parse(fs.readFileSync('audit-report.json', 'utf8'));

console.log('🗑️  INICIANDO LIMPIEZA DEL PROYECTO\n');

// Crear estructura de carpetas
const noUsadosDir = 'no_usados';
const timestamp = new Date().toISOString().split('T')[0];
const archiveDir = path.join(noUsadosDir, `archive_${timestamp}`);

const categories = {
    js_frontend: path.join(archiveDir, 'js_frontend'),
    backend_routes: path.join(archiveDir, 'backend_routes'),
    images: path.join(archiveDir, 'images')
};

// Crear directorios
if (!fs.existsSync(noUsadosDir)) {
    fs.mkdirSync(noUsadosDir);
}

if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

Object.values(categories).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

console.log(`✅ Estructura creada en: ${archiveDir}\n`);

// ============================================
// FUNCIÓN PARA MOVER ARCHIVO SEGURO
// ============================================
function moveFileSafe(sourceRelative, targetDir) {
    const source = path.join(__dirname, sourceRelative.replace('.\\', ''));

    if (!fs.existsSync(source)) {
        console.log(`   ⚠️  Archivo no existe: ${sourceRelative}`);
        return false;
    }

    const fileName = path.basename(source);
    const target = path.join(targetDir, fileName);

    try {
        // Si el archivo ya existe en destino, agregar sufijo
        let finalTarget = target;
        let counter = 1;
        while (fs.existsSync(finalTarget)) {
            const ext = path.extname(fileName);
            const base = path.basename(fileName, ext);
            finalTarget = path.join(targetDir, `${base}_${counter}${ext}`);
            counter++;
        }

        fs.copyFileSync(source, finalTarget);
        fs.unlinkSync(source);

        console.log(`   ✅ Movido: ${fileName}`);
        return true;
    } catch (error) {
        console.log(`   ❌ Error moviendo ${fileName}: ${error.message}`);
        return false;
    }
}

// ============================================
// MOVER ARCHIVOS JS FRONTEND
// ============================================
console.log('🔧 FASE 1: Moviendo archivos JS frontend...\n');

let movedJsCount = 0;
const jsFiles = report.details.unusedJsFiles || [];

jsFiles.forEach(file => {
    if (moveFileSafe(file, categories.js_frontend)) {
        movedJsCount++;
    }
});

console.log(`\n✅ JS Frontend: ${movedJsCount}/${jsFiles.length} archivos movidos\n`);

// ============================================
// MOVER RUTAS BACKEND
// ============================================
console.log('🗄️  FASE 2: Moviendo rutas backend...\n');

let movedBackendCount = 0;
const backendRoutes = report.details.unusedBackendRoutes || [];

backendRoutes.forEach(file => {
    if (moveFileSafe(file, categories.backend_routes)) {
        movedBackendCount++;
    }
});

console.log(`\n✅ Backend Routes: ${movedBackendCount}/${backendRoutes.length} archivos movidos\n`);

// ============================================
// MOVER IMÁGENES (OPCIONAL - REQUIERE CONFIRMACIÓN)
// ============================================
console.log('🖼️  FASE 3: Imágenes detectadas como no usadas...\n');

const images = report.details.unusedImages || [];
console.log(`   ℹ️  ${images.length} imágenes sin referencias detectadas`);
console.log('   ⚠️  NO se moverán automáticamente (pueden ser recursos importantes)');
console.log('   📝 Revisa audit-report.json para ver la lista completa\n');

// ============================================
// GENERAR DOCUMENTACIÓN
// ============================================
console.log('📝 FASE 4: Generando documentación...\n');

const docContent = `# 🗑️ LIMPIEZA DE PROYECTO - ${timestamp}

## 📊 Resumen de Limpieza

### Archivos Movidos

- **JS Frontend**: ${movedJsCount} archivos
- **Backend Routes**: ${movedBackendCount} archivos
- **Imágenes**: 0 (no movidas automáticamente)

### Total Archivos Archivados: ${movedJsCount + movedBackendCount}

---

## 🔧 Archivos JS Frontend Movidos (${movedJsCount})

${jsFiles.slice(0, movedJsCount).map(f => `- \`${path.basename(f.replace('.\\', ''))}\``).join('\n')}

---

## 🗄️ Rutas Backend Movidas (${movedBackendCount})

${backendRoutes.slice(0, movedBackendCount).map(f => `- \`${path.basename(f.replace('.\\', ''))}\``).join('\n')}

---

## 🖼️ Imágenes Sin Usar (NO MOVIDAS) (${images.length})

Las siguientes imágenes no tienen referencias en el código pero **NO se movieron automáticamente**
porque podrían ser recursos necesarios:

${images.slice(0, 20).map(f => `- \`${f.replace('.\\', '')}\``).join('\n')}

${images.length > 20 ? `\n... y ${images.length - 20} más (ver audit-report.json)\n` : ''}

---

## ⚠️ IMPORTANTE

### Antes de eliminar definitivamente:

1. ✅ Verifica que el sitio funciona correctamente
2. ✅ Prueba todas las páginas principales
3. ✅ Revisa que no hay errores en la consola
4. ✅ Espera al menos 7 días antes de eliminar permanentemente

### Para restaurar un archivo:

\`\`\`bash
cp no_usados/archive_${timestamp}/[categoria]/[archivo] [ubicacion_original]
\`\`\`

---

## 📈 Estadísticas del Proyecto Después de Limpieza

- **Archivos JS Frontend**: ${report.summary.usedJsFrontend} (eliminados ${movedJsCount})
- **Rutas Backend Activas**: ${report.summary.usedBackendRoutes} (eliminadas ${movedBackendCount})
- **Mejora en Organización**: ${Math.round((movedJsCount + movedBackendCount) / (report.summary.totalJsFrontend + report.summary.totalBackendRoutes) * 100)}% de archivos innecesarios removidos

---

## 🤖 Generado Automáticamente

- **Fecha**: ${new Date().toLocaleString('es-MX')}
- **Herramienta**: audit-unused-files.js + move-unused-files.js
- **Claude Code**: Sistema de limpieza automática

**Co-Authored-By: Claude <noreply@anthropic.com>**
`;

const docPath = path.join(archiveDir, 'LIMPIEZA_DOCUMENTACION.md');
fs.writeFileSync(docPath, docContent);

console.log(`   ✅ Documentación creada: ${docPath}\n`);

// Crear también en raíz
const rootDocPath = `LIMPIEZA_PROYECTO_${timestamp}.md`;
fs.writeFileSync(rootDocPath, docContent);

console.log(`   ✅ Documentación raíz creada: ${rootDocPath}\n`);

// ============================================
// RESUMEN FINAL
// ============================================
console.log('═══════════════════════════════════════════════════');
console.log('✅ LIMPIEZA COMPLETADA');
console.log('═══════════════════════════════════════════════════');
console.log(`📁 Archivos archivados en: ${archiveDir}`);
console.log(`📝 Documentación: ${rootDocPath}`);
console.log(`🔧 JS Frontend movidos: ${movedJsCount}`);
console.log(`🗄️  Backend routes movidos: ${movedBackendCount}`);
console.log(`🖼️  Imágenes sin mover: ${images.length} (revisar manualmente)`);
console.log('═══════════════════════════════════════════════════\n');

console.log('💡 PRÓXIMOS PASOS:\n');
console.log('   1. ✅ Verifica que el sitio funciona correctamente');
console.log('   2. 🧪 Ejecuta pruebas en localhost y producción');
console.log('   3. 📝 Revisa la documentación generada');
console.log('   4. ⏰ Espera 7 días antes de eliminar permanentemente');
console.log('   5. 🗑️  Si todo funciona, elimina la carpeta archive_*\n');

console.log('✅ Proceso de limpieza finalizado correctamente\n');
