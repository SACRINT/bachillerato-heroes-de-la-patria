const fs = require('fs');
const path = require('path');

const publicDirs = [
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', 'public', 'dist')
];

let modifiedFilesCount = 0;

publicDirs.forEach(publicDir => {
    if (!fs.existsSync(publicDir)) return;
    
    const htmlFiles = fs.readdirSync(publicDir)
        .filter(f => f.endsWith('.html') && !f.startsWith('.'));

    console.log(`Encontrados ${htmlFiles.length} archivos HTML en ${publicDir}`);

    htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Inyectar tenant-content-binder.js en <head> si no está presente
    if (!content.includes('tenant-content-binder.js')) {
        if (content.includes('tenant-config-loader.js')) {
            content = content.replace(
                /<script\s+src=["'](?:(?:\/)?js\/)?tenant-config-loader\.js["'][^>]*><\/script>/i,
                '<script src="js/tenant-config-loader.js"></script>\n    <script src="js/tenant-content-binder.js"></script>'
            );
        } else if (content.includes('</head>')) {
            content = content.replace('</head>', '    <!-- Multi-tenant Dynamic Config & Binder -->\n    <script src="js/tenant-config-loader.js"></script>\n    <script src="js/tenant-content-binder.js"></script>\n</head>');
        }
    }

    // 2. Limpiar títulos en <title>
    content = content.replace(
        /<title([^>]*)>([^<]*)Bachillerato General Estatal\s*(?:"H[eé]roes\s+de\s+la\s+Patria"|H[eé]roes\s+de\s+la\s+Patria)?([^<]*)<\/title>/gi,
        (match, attrs, prefix, suffix) => {
            const cleanPrefix = prefix.replace(/-|\s*\|\s*/g, '').trim();
            const baseTitle = cleanPrefix || 'Portal Institucional';
            return `<title id="page-title" data-base-title="${baseTitle}" data-tenant-field="school_name"${attrs}>${cleanPrefix ? cleanPrefix + ' - ' : ''}Bachillerato General</title>`;
        }
    );

    // 3. Limpiar meta descriptions
    content = content.replace(
        /<meta\s+name=["']description["']([^>]*)content=["']([^"']*)H[eé]roes\s+de\s+la\s+Patria([^"']*)["']([^>]*)>/gi,
        (match, pre, desc1, desc2, post) => {
            return `<meta name="description" id="page-description" data-tenant-field="mision" content="Bachillerato General - Educación media superior de calidad."${pre}${post}>`;
        }
    );

    // 4. Limpiar Schema.org JSON-LD
    content = content.replace(
        /"name":\s*"Bachillerato General Estatal H[eé]roes de la Patria"/gi,
        '"name": "Bachillerato General"'
    );
    content = content.replace(
        /"alternateName":\s*"BGE H[eé]roes de la Patria"/gi,
        '"alternateName": "BGE"'
    );
    content = content.replace(
        /"streetAddress":\s*"Coronel Tito Hern[aá]ndez"/gi,
        '"streetAddress": "Dirección del plantel"'
    );
    content = content.replace(
        /"addressLocality":\s*"Venustiano Carranza"/gi,
        '"addressLocality": "Municipio"'
    );

    // 5. Limpiar CCT
    content = content.replace(/21EBH0200X|21EBH0200/gi, '<span data-tenant-field="cct">21EBHXXXXX</span>');

    // 6. Limpiar direcciones en texto
    content = content.replace(
        /C\.\s*Manuel\s+[AÁ]vila\s+Camacho\s+#?7,?\s*Coronel\s+Tito\s+Hern[aá]ndez,?\s*(?:V\.\s*Carranza|Venustiano\s+Carranza),?\s*Puebla/gi,
        '<span data-tenant-field="direccion">Dirección del plantel</span>'
    );
    content = content.replace(
        /Coronel\s+Tito\s+Hern[aá]ndez,?\s*(?:V\.\s*Carranza|Venustiano\s+Carranza),?\s*Puebla/gi,
        '<span data-tenant-field="direccion">Dirección del plantel, Puebla</span>'
    );

    // 7. Limpiar emails
    content = content.replace(/21ebh0200x\.sep@gmail\.com/gi, 'contacto@ejemplo.edu.mx');
    content = content.replace(/contacto@heroespatria\.edu\.mx/gi, 'contacto@ejemplo.edu.mx');

    // 8. Reemplazar menciones en cabeceras o banners comunes
    content = content.replace(
        /Bachillerato General Estatal\s+["“]H[eé]roes de la Patria["”]/gi,
        '<span data-tenant-field="school_type">Bachillerato General</span> <span data-tenant-field="school_short_name">BGE</span>'
    );
    content = content.replace(
        /Bachillerato General por Competencias\s+["“]H[eé]roes de la Patria["”]/gi,
        '<span data-tenant-field="school_type">Bachillerato General</span> <span data-tenant-field="school_short_name">BGE</span>'
    );
    content = content.replace(
        /BGE\s+["“]H[eé]roes de la Patria["”]/gi,
        '<span data-tenant-field="school_short_name">BGE</span>'
    );
    content = content.replace(
        /["“]H[eé]roes de la Patria["”]/gi,
        '<span data-tenant-field="school_short_name">nuestro plantel</span>'
    );
    content = content.replace(
        /H[eé]roes de la Patria/gi,
        '<span data-tenant-field="school_short_name">nuestro plantel</span>'
    );

    // 9. Reemplazar logos específicos con data-tenant-src
    content = content.replace(
        /<img([^>]*)src=["'](?:\/)?images\/(?:logo\/)?logo-bachillerato-HDLP(?:2)?\.webp["']([^>]*)alt=["'][^"']*["']([^>]*)>/gi,
        '<img$1data-tenant-src="logo_url" src="/images/logo/logo-general-bge.webp"$2alt="Logo del Bachillerato"$3>'
    );

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedFilesCount++;
            console.log(`[OK] Adaptado: ${file}`);
        }
    });
});

console.log(`\n========================================`);
console.log(`Procesamiento completado.`);
console.log(`Archivos modificados: ${modifiedFilesCount}`);
console.log(`========================================`);
