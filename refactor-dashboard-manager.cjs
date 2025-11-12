#!/usr/bin/env node
/**
 * Script para refactorizar dashboard-manager-2025.js
 * Extrae onclick inline y los convierte en funciones helper
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/js/dashboard-manager-2025.js');

// Leer archivo
let content = fs.readFileSync(filePath, 'utf-8');

// REFACTOR 1: Agregar función helper handleCopyPassword
// Esta función se añadirá dentro de la clase AdminDashboard, justo después de approveRegistration()
const handleCopyPasswordFunc = `
    /**
     * Helper para copiar contraseña temporal al portapapeles
     * @param {HTMLElement} button - Elemento botón que disparó la acción
     * @param {string} password - Contraseña a copiar
     */
    handleCopyPassword(button, password) {
        try {
            // Copiar al portapapeles
            navigator.clipboard.writeText(password).then(() => {
                // Cambiar icono a check
                button.innerHTML = window.sanitizeHTML ?
                    window.sanitizeHTML('<i class="fas fa-check"></i> Copiado') :
                    '<i class="fas fa-check"></i> Copiado';

                // Volver al icono de copiar después de 2 segundos
                setTimeout(() => {
                    button.innerHTML = window.sanitizeHTML ?
                        window.sanitizeHTML('<i class="fas fa-copy"></i> Copiar') :
                        '<i class="fas fa-copy"></i> Copiar';
                }, 2000);
            }).catch(err => {
                console.error('Error al copiar al portapapeles:', err);
                button.innerHTML = window.sanitizeHTML ?
                    window.sanitizeHTML('<i class="fas fa-exclamation-triangle"></i> Error') :
                    '<i class="fas fa-exclamation-triangle"></i> Error';
            });
        } catch (error) {
            console.error('Error en handleCopyPassword:', error);
        }
    }
`;

// Buscar la línea del método approveRegistration y agregar la función helper después
const approveRegPattern = /(\s*async approveRegistration\(email\) \{[\s\S]*?return this\.approveRequest\(email\);\s*\})/;
const match = content.match(approveRegPattern);

if (match) {
    const methodEnd = content.indexOf(match[1]) + match[1].length;
    content = content.slice(0, methodEnd) + handleCopyPasswordFunc + content.slice(methodEnd);
    console.log('✅ Función helper handleCopyPassword agregada');
} else {
    console.warn('⚠️ No se encontró el patrón de approveRegistration, se agregará la función manualmente');
}

// REFACTOR 2: Reemplazar el onclick complejo con una llamada simple
// Buscar y reemplazar el patrón del onclick complejo
const oldPattern = new RegExp(
    'onclick="\\s*navigator\\.clipboard\\.writeText\\(\'\\$\\{password\\}\'\\)\\);\\s*' +
    'this\\.innerHTML = sanitizeHTML\\(\'<i class=\\\\\'\\"fas fa-check\\\\\'\\"\\\\\\\\><\\\\/i\\\\\\\\> Copiado\'\\);\\s*' +
    'setTimeout\\(\\(\\) => \\{\\s*' +
    'this\\.innerHTML = sanitizeHTML\\(\'<i class=\\\\\'\\"fas fa-copy\\\\\'\\"\\\\\\\\><\\\\/i\\\\\\\\> Copiar\'\\);\\s*' +
    '\\}, 2000\\);\\s*"',
    'g'
);

// Usar un patrón más simple que funcione mejor
const simplePattern = /onclick="\s*navigator\.clipboard\.writeText\('.*?'\)\);[^"]*?setTimeout\([^}]*?\}, 2000\);[^"]*?"/gs;

let replacementCount = 0;

// Intentar reemplazo con patrón flexible
let result = content.replace(/onclick="[\s\S]*?navigator\.clipboard\.writeText\(\$\{password\}\)\)\);[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?\}, 2000\);[\s\S]*?"/g,
    `onclick="this.handleCopyPassword(this, '\${password}')"`) ||
    // Intento alternativo
    content.replace(/onclick="[\s\S]*?navigator\.clipboard\.writeText\('[^']*?'\)\);[\s\S]*?}, 2000\);[\s\S]*?"/g,
    `onclick="this.handleCopyPassword(this, '\${password}')"`);

if (result !== content) {
    content = result;
    replacementCount++;
    console.log(`✅ onclick refactorizado ${replacementCount} vez(es)`);
}

// Si el método simple no funcionó, hacer un reemplazo línea por línea
if (replacementCount === 0) {
    console.warn('⚠️ Reemplazo automático no funcionó, intentando método manual...');

    // Dividir por líneas
    let lines = content.split('\n');
    let inOnclick = false;
    let onclickStart = -1;

    for (let i = 0; i < lines.length; i++) {
        // Buscar inicio del onclick complejo
        if (lines[i].includes('navigator.clipboard.writeText') && lines[i].includes('onclick=')) {
            inOnclick = true;
            onclickStart = i;
        }

        // Si estamos en un onclick y encontramos el cierre, hacer el reemplazo
        if (inOnclick && lines[i].includes('}>') && lines[i].includes('">')) {
            // Reemplazar el bloque completo del onclick
            const indentation = lines[onclickStart].match(/^\s*/)[0];
            lines[onclickStart] = indentation + `<button class="btn btn-outline-primary"`;
            lines[onclickStart + 1] = indentation + `        type="button"`;
            lines[onclickStart + 2] = indentation + `        onclick="this.handleCopyPassword(this, '\${password}')">`;

            // Eliminar las líneas del medio (el onclick complejo)
            lines.splice(onclickStart + 3, i - onclickStart - 2);

            inOnclick = false;
            replacementCount++;
            console.log(`✅ Bloque onclick refactorizado (línea ${onclickStart})`);
            break;
        }
    }

    content = lines.join('\n');
}

// Guardar archivo
fs.writeFileSync(filePath, content, 'utf-8');
console.log(`✅ Archivo guardado: ${filePath}`);
console.log(`📊 Total de cambios: ${replacementCount} onclick(s) refactorizado(s)`);

// Validar sintaxis Node.js
const { execSync } = require('child_process');
try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
    console.log('✅ Sintaxis JavaScript válida');
} catch (error) {
    console.error('❌ Error de sintaxis:', error.message);
    process.exit(1);
}
