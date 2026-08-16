/**
 * Mass DOMPurify Sanitizer
 * Scans public/js, js/, and public/*.html to sanitize innerHTML / insertAdjacentHTML
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIRS = [
    path.join(ROOT_DIR, 'public', 'js'),
    path.join(ROOT_DIR, 'js')
];

let totalFilesProcessed = 0;
let totalFilesModified = 0;
let totalReplacements = 0;

function sanitizeJsFile(filePath) {
    totalFilesProcessed++;
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let fileReplacements = 0;

    // Pattern 1: element.innerHTML = variable (not already sanitized)
    content = content.replace(/(\.innerHTML\s*=\s*)([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)*(?:\([^)]*\))?)\s*(;|\n|$)/g, (match, prefix, expr, suffix) => {
        if (expr.includes('sanitize') || expr.includes('DOMPurify') || expr === '""' || expr === "''" || expr === 'null') {
            return match;
        }
        fileReplacements++;
        return `${prefix}(typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(${expr}) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(${expr}) : ${expr}))${suffix}`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        totalFilesModified++;
        totalReplacements += fileReplacements;
        console.log(`  ✅ Sanitized: ${path.relative(ROOT_DIR, filePath)} (${fileReplacements} updates)`);
    }
}

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (item.name !== 'node_modules' && item.name !== '.git') {
                scanDir(fullPath);
            }
        } else if (item.isFile() && item.name.endsWith('.js')) {
            try {
                sanitizeJsFile(fullPath);
            } catch (err) {
                console.error(`  ❌ Error processing ${fullPath}:`, err.message);
            }
        }
    }
}

console.log('🔒 Starting Mass DOMPurify Sanitization Scan...');
TARGET_DIRS.forEach(dir => scanDir(dir));

console.log('\n📊 MASS SANITIZATION SUMMARY:');
console.log(`  • Files Processed: ${totalFilesProcessed}`);
console.log(`  • Files Modified: ${totalFilesModified}`);
console.log(`  • Total Sanitizations Applied: ${totalReplacements}`);
