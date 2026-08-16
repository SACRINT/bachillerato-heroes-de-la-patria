/**
 * EXTRACT INLINE SCRIPTS (CSP Compliance)
 * Extrae todos los <script> inline (sin src, no JSON-LD) de las páginas HTML
 * de public/ a archivos externos en public/js/inline/, manteniendo la posición
 * exacta del script para no alterar el orden de ejecución DOM.
 *
 * Uso: node scripts/extract-inline-scripts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const INLINE_DIR = path.join(PUBLIC_DIR, 'js', 'inline');

if (!fs.existsSync(INLINE_DIR)) {
    fs.mkdirSync(INLINE_DIR, { recursive: true });
}

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
let totalExtracted = 0;
let totalPages = 0;

for (const file of files) {
    const filePath = path.join(PUBLIC_DIR, file);
    let html = fs.readFileSync(filePath, 'utf8');
    const original = html;
    const matches = [];
    let m;
    let pageCount = 0;

    while ((m = SCRIPT_RE.exec(html)) !== null) {
        const attrs = m[1] || '';
        const body = m[2] || '';
        const hasSrc = /\bsrc\s*=/.test(attrs);
        const isJsonLd = /type\s*=\s*["']application\/ld\+json/i.test(attrs);
        const isEmpty = body.trim().length === 0;
        if (hasSrc || isJsonLd || isEmpty) continue;

        pageCount++;
        const base = file.replace('.html', '');
        const outName = `${base}-inline-${pageCount}.js`;
        const outPath = path.join(INLINE_DIR, outName);
        fs.writeFileSync(outPath, body.trim() + '\n', 'utf8');
        matches.push({ full: m[0], outName });
    }

    if (matches.length === 0) continue;

    // Reemplazar cada script inline por referencia externa (en el mismo orden)
    for (const { full, outName } of matches) {
        const replacement = `<script src="js/inline/${outName}"></script>`;
        html = html.replace(full, replacement);
    }

    if (html !== original) {
        fs.writeFileSync(filePath, html, 'utf8');
        totalPages++;
        totalExtracted += matches.length;
        console.log(`[OK] ${file}: ${matches.length} script(s) -> js/inline/`);
    }
}

console.log(`\n=== RESUMEN: ${totalPages} páginas, ${totalExtracted} scripts extraídos a public/js/inline/ ===`);