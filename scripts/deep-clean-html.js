const fs = require('fs');
const path = require('path');

const publicDirs = [
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', 'public', 'dist')
];

let totalFilesModified = 0;

publicDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

    files.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // 1. Email cleanup
        content = content.replace(/director@heroesdelapatria\.edu\.mx/gi, 'director@ejemplo.edu.mx');
        content = content.replace(/contacto@heroesdelapatria\.edu\.mx/gi, 'contacto@ejemplo.edu.mx');
        content = content.replace(/heroesdelapatria\.edu\.mx/gi, 'ejemplo.edu.mx');
        content = content.replace(/https:\/\/SACRINT\.github\.io\/heroes_de_la_patria_oficial\/?/gi, '/');
        content = content.replace(/<span\s+data-tenant-field=["']cct["']>21EBHXXXXX<\/span>\.sep@gmail\.com/gi, '<span data-tenant-field="email_institucional">contacto@ejemplo.edu.mx</span>');
        content = content.replace(/mailto:<span[^>]*>[^<]*<\/span>\.sep@gmail\.com/gi, 'mailto:contacto@ejemplo.edu.mx');

        // 2. Address & Locality cleanup in text and JSON
        content = content.replace(/"addressLocality":\s*"Coronel Tito Hern[aá]ndez(?:\s*\(Mar[ií]a Andrea\))?"/gi, '"addressLocality": "Municipio"');
        content = content.replace(/"addressRegion":\s*"Venustiano Carranza,?\s*Puebla"/gi, '"addressRegion": "Puebla"');
        content = content.replace(/Coronel\s+Tito\s+Hern[aá]ndez\s*\(Mar[ií]a Andrea\)/gi, '<span data-tenant-field="direccion">Dirección del plantel</span>');
        content = content.replace(/Coronel\s+Tito\s+Hern[aá]ndez,?\s*Venustiano\s+Carranza/gi, '<span data-tenant-field="direccion">Dirección del plantel</span>');
        content = content.replace(/Coronel\s+Tito\s+Hern[aá]ndez/gi, '<span data-tenant-field="direccion">Dirección del plantel</span>');
        content = content.replace(/Venustiano\s+Carranza/gi, '<span data-tenant-field="municipio">Municipio</span>');

        // 3. Keywords cleanup
        content = content.replace(/bachillerato\s+heroes\s+patria\s+puebla/gi, 'bachillerato puebla educacion media superior');
        content = content.replace(/heroes\s+de\s+la\s+patria/gi, 'nuestro plantel');

        // 4. Broken nested title tags cleanup (e.g., <title ...><span ...>...</span></title>)
        content = content.replace(/<title\s+id=["']page-title["'][^>]*>[\s\S]*?<\/title>/gi, (match) => {
            if (match.includes('<span')) {
                // Strip inner tags
                const clean = match.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '').replace(/"Héroes de la Patria"|"nuestro plantel"/gi, '').trim();
                return clean;
            }
            return match;
        });

        // 5. Facebook links cleanup
        content = content.replace(/https:\/\/www\.facebook\.com\/heroesdelapatria\/?/gi, '#');
        content = content.replace(/facebook\.com\/heroesdelapatria/gi, '#');

        // 6. Fix any remaining hardcoded title tags
        content = content.replace(
            /<title>([^<]*)H[eé]roes\s+de\s+la\s+Patria([^<]*)<\/title>/gi,
            '<title id="page-title" data-base-title="Portal Institucional" data-tenant-field="school_name">Bachillerato General</title>'
        );

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            totalFilesModified++;
            console.log(`[DEEP-CLEAN] Purificado: ${path.relative(path.join(__dirname, '..'), filePath)}`);
        }
    });
});

console.log(`\nLimpieza profunda completada: ${totalFilesModified} archivos purificados.`);
