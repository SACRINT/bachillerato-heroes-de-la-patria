#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../../public');
let filesProcessed = 0;
let filesFixed = 0;

// Mapping of corrupted emoji patterns to correct emojis
const emojiReplacements = {
  'ðŸŽ"': '🎓',
  'ðŸš€': '🚀',
  'ðŸ"§': '📧',
  'ðŸ"Š': '📊',
  'ðŸ"': '📍',
  'ðŸ¢': '🢢',
  'ðŸ¥½': '🥽',
  'âœ…': '✅',
  'âŒ': '❌',
  'ðŸŽ¯': '🎯',
  'ðŸ"': '📌',
  'ðŸ›': '🛠️',
  'ðŸ"¨': '🔨',
  'ðŸ§': '🧠',
  'ðŸ'': '👍',
  'ðŸ'Ž': '👎',
  'ðŸ""': '👏',
  'ðŸ"¥': '💥',
  'ðŸ"‰': '💰',
  'ðŸ""': '🌟',
  'ðŸ'"': '✨',
  'ðŸ'": '🚀',
  'ðŸ•': '⭕',
};

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log('🔧 Corrigiendo emojis corruptos en todas las páginas HTML...\n');

files.forEach((fileName, index) => {
  filesProcessed++;
  const filePath = path.join(publicDir, fileName);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply all emoji replacements
    Object.entries(emojiReplacements).forEach(([corrupted, correct]) => {
      if (content.includes(corrupted)) {
        content = content.split(corrupted).join(correct);
      }
    });
    
    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesFixed++;
      console.log(`[${filesProcessed}/${files.length}] ✅ ${fileName} - Emojis corregidos`);
    } else {
      console.log(`[${filesProcessed}/${files.length}] ⏭️  ${fileName} - Sin emojis corruptos`);
    }
  } catch (error) {
    console.log(`[${filesProcessed}/${files.length}] ❌ ${fileName} - Error: ${error.message}`);
  }
});

console.log('\n═══════════════════════════════════════');
console.log(`✅ Proceso completado`);
console.log(`Archivos procesados: ${filesProcessed}`);
console.log(`Archivos corregidos: ${filesFixed}`);
console.log(`Archivos sin emojis corruptos: ${filesProcessed - filesFixed}`);
console.log('═══════════════════════════════════════');
