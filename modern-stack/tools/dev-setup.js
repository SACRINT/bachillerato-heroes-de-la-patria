#!/usr/bin/env node
/**
 * Development Setup Script
 * Prepara el entorno de desarrollo moderno para el proyecto
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Configurando entorno de desarrollo moderno...\n');

// Función para ejecutar comandos
function run(command, cwd = rootDir) {
  console.log(`📦 Ejecutando: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd,
      encoding: 'utf8'
    });
    console.log('✅ Completado\n');
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// 1. Instalar dependencias del workspace principal
console.log('🔧 Instalando dependencias del monorepo...');
run('npm install');

// 2. Instalar dependencias de todos los workspaces
console.log('🔧 Instalando dependencias de todos los workspaces...');
run('npm install --workspaces');

// 3. Generar tipos de TypeScript
console.log('🏗️ Generando tipos de TypeScript...');
run('npm run build --workspace=@heroes-patria/types');

// 4. Crear archivos de entorno si no existen
console.log('⚙️ Configurando variables de entorno...');

const envFiles = [
  {
    path: join(rootDir, 'apps', 'api', '.env'),
    content: `# Configuración de desarrollo para API
NODE_ENV=development
PORT=3001
HOST=localhost

# Base de datos (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/heroes_patria_dev?schema=public"

# JWT Secret (cambiar en producción)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Origins
CORS_ORIGINS=http://localhost:4321,http://localhost:3000

# Email (para desarrollo usar mailtrap.io o similar)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your-mailtrap-user
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=noreply@heroesdelapatria.edu.mx

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`
  },
  {
    path: join(rootDir, 'apps', 'web', '.env'),
    content: `# Configuración de desarrollo para Frontend
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_API_URL=http://localhost:3001

# Analytics (opcional para desarrollo)
PUBLIC_GA_ID=
PUBLIC_GTM_ID=

# PWA
PUBLIC_VAPID_PUBLIC_KEY=

# Feature flags
PUBLIC_ENABLE_PWA=true
PUBLIC_ENABLE_ANALYTICS=false
PUBLIC_ENABLE_CHATBOT=true
`
  }
];

envFiles.forEach(({ path, content }) => {
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    console.log(`✅ Creado: ${path}`);
  } else {
    console.log(`⏭️ Ya existe: ${path}`);
  }
});

// 5. Crear manifest básico para PWA
console.log('📱 Configurando PWA...');
const manifestPath = join(rootDir, 'apps', 'web', 'public', 'manifest.json');
const publicDir = dirname(manifestPath);

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

if (!existsSync(manifestPath)) {
  const manifest = {
    name: "Bachillerato General Estatal Héroes de la Patria",
    short_name: "BGE Héroes",
    description: "Educación de calidad con formación integral",
    start_url: "/",
    display: "standalone",
    background_color: "#1976D2",
    theme_color: "#1976D2",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any"
      },
      {
        src: "/icon-512.png", 
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any"
      }
    ],
    categories: ["education", "school"],
    lang: "es-MX",
    scope: "/",
    screenshots: []
  };
  
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Creado: manifest.json');
}

// 6. Crear favicon básico
const faviconPath = join(rootDir, 'apps', 'web', 'public', 'favicon.svg');
if (!existsSync(faviconPath)) {
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#1976D2"/>
  <text x="50" y="65" font-family="Arial, sans-serif" font-size="40" font-weight="bold" text-anchor="middle" fill="white">BGE</text>
</svg>`;
  
  writeFileSync(faviconPath, favicon);
  console.log('✅ Creado: favicon.svg');
}

// 7. Crear Service Worker básico
const swPath = join(rootDir, 'apps', 'web', 'public', 'sw.js');
if (!existsSync(swPath)) {
  const sw = `// Service Worker básico para PWA
const CACHE_NAME = 'heroes-patria-v1';
const urlsToCache = [
  '/',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }
    )
  );
});`;
  
  writeFileSync(swPath, sw);
  console.log('✅ Creado: sw.js');
}

// 8. Configurar Git hooks si existe Husky
if (existsSync(join(rootDir, 'node_modules', '.bin', 'husky'))) {
  console.log('🐺 Configurando Husky hooks...');
  run('npx husky init');
  
  const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint:fix
npm run format
`;
  
  const huskyDir = join(rootDir, '.husky');
  if (!existsSync(huskyDir)) {
    mkdirSync(huskyDir, { recursive: true });
  }
  
  writeFileSync(join(huskyDir, 'pre-commit'), preCommitHook);
  console.log('✅ Configurado pre-commit hook');
}

console.log(`
🎉 ¡Configuración completa!

📋 Próximos pasos:

1. 🗄️ Configurar base de datos PostgreSQL:
   - Instalar PostgreSQL local o usar Docker
   - Crear base de datos 'heroes_patria_dev'
   - Ejecutar: npm run db:push --workspace=@heroes-patria/api

2. 🚀 Iniciar desarrollo:
   - Frontend: npm run dev:web
   - Backend:  npm run dev:api
   - Ambos:    npm run dev

3. 🧪 Ejecutar tests:
   - npm run test

4. 🎨 Formatear código:
   - npm run format
   - npm run lint:fix

📖 Documentación disponible en:
   - README.md - Guía general
   - apps/web/README.md - Frontend específico  
   - apps/api/README.md - Backend específico

🌐 URLs de desarrollo:
   - Frontend: http://localhost:4321
   - Backend:  http://localhost:3001

¡Feliz desarrollo! 🚀
`);