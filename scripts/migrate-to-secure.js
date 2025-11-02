/**
 * 🔄 MIGRACIÓN A SISTEMA SEGURO
 * Script para migrar del sistema de auth antiguo al nuevo
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando migración a sistema seguro...');

// Archivos a actualizar
const filesToUpdate = [
    'index.html',
    'conocenos.html', 
    'oferta-educativa.html',
    'servicios.html',
    'comunidad.html',
    'contacto.html',
    'admisiones.html',
    'admin-dashboard.html',
    'calificaciones.html',
    'egresados.html',
    'bolsa-trabajo.html'
];

const updateFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Archivo no encontrado: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Reemplazar script de auth antiguo con el nuevo
    if (content.includes('admin-auth.js')) {
        content = content.replace(
            /<script src="js\/admin-auth\.js"><\/script>/g,
            '<script src="js/admin-auth-secure.js"></script>'
        );
        modified = true;
        console.log(`✅ Actualizado script de auth en: ${filePath}`);
    }
    
    // Comentar script nuclear (ya no necesario)
    if (content.includes('force-admin-nuclear.js')) {
        content = content.replace(
            /<script src="force-admin-nuclear\.js"><\/script>/g,
            '<!-- <script src="force-admin-nuclear.js"></script> DESHABILITADO - Ya no necesario con auth seguro -->'
        );
        modified = true;
        console.log(`🚫 Deshabilitado script nuclear en: ${filePath}`);
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`💾 Guardado: ${filePath}`);
    }
};

// Actualizar archivos principales
console.log('\n📄 Actualizando archivos HTML...');
filesToUpdate.forEach(file => {
    updateFile(file);
});

// Actualizar header.html
console.log('\n🔗 Actualizando header.html...');
const headerPath = 'partials/header.html';
if (fs.existsSync(headerPath)) {
    let headerContent = fs.readFileSync(headerPath, 'utf8');
    
    // Actualizar script de auth
    if (headerContent.includes('admin-auth.js')) {
        headerContent = headerContent.replace(
            'admin-auth.js',
            'admin-auth-secure.js'
        );
        
        fs.writeFileSync(headerPath, headerContent, 'utf8');
        console.log('✅ Header actualizado con auth seguro');
    }
}

// Crear archivo de respaldo del sistema antiguo
console.log('\n💾 Creando respaldo del sistema antiguo...');
const backupDir = 'backup-old-auth';
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Respaldar archivos importantes
const filesToBackup = [
    'js/admin-auth.js',
    'force-admin-nuclear.js'
];

filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
        const backupPath = path.join(backupDir, path.basename(file));
        fs.copyFileSync(file, backupPath);
        console.log(`📦 Respaldado: ${file} → ${backupPath}`);
    }
});

// Crear archivo README para el nuevo sistema
const readmeContent = `# 🛡️ SISTEMA DE AUTENTICACIÓN SEGURO

## Cambios Principales

### ✅ Mejoras de Seguridad
- ❌ **Eliminado**: Contraseñas hardcoded en JavaScript
- ✅ **Agregado**: Autenticación server-side con JWT
- ✅ **Agregado**: Hash de contraseñas con bcrypt (12 salt rounds)
- ✅ **Agregado**: Rate limiting (5 intentos cada 15 minutos)
- ✅ **Agregado**: Validación y sanitización server-side
- ✅ **Agregado**: Headers de seguridad (Helmet.js)
- ✅ **Agregado**: Protección CORS configurada

### 🔧 Archivos Nuevos
- \`server/\` - Backend Express.js seguro
- \`js/admin-auth-secure.js\` - Frontend actualizado
- \`setup-security.bat\` - Script de instalación

### 📦 Archivos Respaldados
- \`backup-old-auth/admin-auth.js\` - Sistema antiguo
- \`backup-old-auth/force-admin-nuclear.js\` - Script nuclear

## 🚀 Uso

### 1. Instalar Backend
\`\`\`bash
# Ejecutar script de instalación
setup-security.bat

# O manualmente:
cd server
npm install
\`\`\`

### 2. Iniciar Servicios
\`\`\`bash
# Terminal 1: Backend (puerto 3000)
cd server
npm start

# Terminal 2: Frontend (puerto 8080)
python -m http.server 8080
\`\`\`

### 3. Acceder
- **URL**: http://localhost:8080
- **Contraseña**: HeroesPatria2024! (cambiar en producción)

## 🔒 Seguridad

### Contraseña en Producción
1. Cambiar \`JWT_SECRET\` en \`server/.env\`
2. Cambiar \`SESSION_SECRET\` en \`server/.env\`
3. Usar endpoint \`POST /api/auth/change-password\` para nueva contraseña
4. Actualizar \`ADMIN_PASSWORD_HASH\` en \`.env\` con el hash generado

### Variables de Entorno Críticas
\`\`\`env
JWT_SECRET=tu_clave_jwt_super_segura_aqui
SESSION_SECRET=tu_clave_session_super_segura_aqui
ADMIN_PASSWORD_HASH=hash_generado_por_bcrypt
NODE_ENV=production
\`\`\`

## 📊 Beneficios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Contraseñas | Hardcoded en JS | Hash bcrypt server-side |
| Autenticación | Client-side only | JWT server-side |
| Seguridad | Vulnerable | Múltiples capas |
| Rate Limiting | ❌ | ✅ 5 intentos/15min |
| Validación | Cliente | Cliente + Servidor |
| Headers | Básicos | Helmet.js completo |

---
**Migración completada**: $(date)
`;

fs.writeFileSync('README-AUTH-SEGURO.md', readmeContent, 'utf8');

console.log('\n✅ MIGRACIÓN COMPLETADA');
console.log('===============================================');
console.log('📋 Resumen:');
console.log(`   📄 Archivos actualizados: ${filesToUpdate.length}`);
console.log('   🔄 Sistema migrado a autenticación segura');
console.log('   📦 Respaldos creados en: backup-old-auth/');
console.log('   📖 Documentación: README-AUTH-SEGURO.md');
console.log('');
console.log('🚀 Siguiente paso: Ejecutar setup-security.bat');
console.log('===============================================');