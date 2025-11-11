#!/usr/bin/env node
/**
 * Script para corregir encoding UTF-8 en todos los archivos HTML
 * Proyecto: BGE (Bachillerato Héroes de la Patria)
 * Fecha: 10 de Noviembre de 2025
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../../public');
const logFile = path.join(__dirname, '../../encoding-fix-log.txt');

let filesProcessed = 0;
let filesFixed = 0;

// Replacements mapping
const replacements = {
  'HÃ©roes': 'Héroes',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã ': 'à',
  'Ã§': 'ç',
  'Â¡': '¡',
  'Â¿': '¿',
  'Ã—': '×',
  'Ã¡': 'á',
  'Ã¤': 'ä',
  'Ã«': 'ë',
  'Ã¯': 'ï',
  'Ã¶': 'ö',
  'Ã¼': 'ü',
  'ðŸ¥½': '�½',
  'ðŸ"§': '📧',
  'ðŸ¢': '🢢',
  'ðŸ"': '📍',
  'âœ…': '✅',
  'âŒ': '❌',
  'ðŸŽ"': '🎓',
};

function logMessage(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

function clearLog() {
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }
}

function processHtmlFiles() {
  clearLog();

  logMessage('=== CORRECCION DE ENCODING UTF-8 EN ARCHIVOS HTML ===');
  logMessage(`Fecha: ${new Date().toISOString()}`);
  logMessage(`Directorio: ${publicDir}`);
  logMessage('');

  try {
    const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

    logMessage(`Total de archivos HTML encontrados: ${files.length}`);
    logMessage('');

    files.forEach((fileName, index) => {
      filesProcessed++;
      const filePath = path.join(publicDir, fileName);

      process.stdout.write(`[${filesProcessed}/${files.length}] Procesando: ${fileName}... `);

      try {
        // Read file in UTF-8
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Apply replacements
        Object.entries(replacements).forEach(([from, to]) => {
          if (content.includes(from)) {
            content = content.split(from).join(to);
          }
        });

        // If changes were made, write back
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          filesFixed++;
          console.log('✅ FIXED');
          logMessage(`  ✅ ${fileName} (encoding corregido)`);
        } else {
          console.log('⏭️  SKIP');
          logMessage(`  ⏭️  ${fileName} (sin cambios necesarios)`);
        }
      } catch (error) {
        console.log('❌ ERROR');
        logMessage(`  ❌ ${fileName}: ${error.message}`);
      }
    });

    logMessage('');
    logMessage('=== RESUMEN ===');
    logMessage(`Archivos procesados: ${filesProcessed}`);
    logMessage(`Archivos corregidos: ${filesFixed}`);
    logMessage(`Archivos sin cambios: ${filesProcessed - filesFixed}`);
    logMessage(`Tasa de éxito: ${((filesFixed / filesProcessed) * 100).toFixed(2)}%`);
    logMessage('');

    console.log('');
    console.log(`✅ PROCESO COMPLETADO`);
    console.log(`   Archivos corregidos: ${filesFixed}/${filesProcessed}`);
    console.log(`   Log guardado en: ${logFile}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    logMessage(`ERROR FATAL: ${error.message}`);
  }
}

// Run the script
processHtmlFiles();
