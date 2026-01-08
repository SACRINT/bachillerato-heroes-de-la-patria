/**
 * 🧹 FINAL RELEASE CLEANUP
 * Propósito: Limpieza de rutas de prueba y preparación para v3.0 (Fase 7 - Semana 56)
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando archivos temporales y caché...');

// 1. Clean 'uploads/temp'
const tempDir = path.join(__dirname, '../uploads/temp');
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ Carpeta uploads/temp eliminada.');
}

// 2. Remove dev-only scripts if strictly needed (skip for now to keep history)
// fs.unlinkSync(path.join(__dirname, 'scripts/benchmark.js'));

console.log('✅ Limpieza completada. Listo para Release v3.0.');
