import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar la instancia de Express del backend
// Esto asegura paridad 1:1 entre dev y prod.
let app;
try {
    // Intentar con path absoluto primero
    // Estamos en backend/api/index.js, server.js está en backend/server.js
    const serverPath = resolve(__dirname, '../server.js');
    console.error(`[API] Intentando cargar: ${serverPath}`);
    app = require(serverPath);
    console.error('[API] Servidor cargado exitosamente');
} catch (error) {
    console.error('[API] Error cargando servidor:', error.message);
    console.error('[API] Stack:', error.stack);

    // Intentar con path relativo como fallback
    try {
        console.error('[API] Intentando fallback con path relativo...');
        app = require('../server.js');
    } catch (fallbackError) {
        console.error('[API] Fallback también falló:', fallbackError.message);
        throw error; // Lanzar el error original
    }
}

// Exportar para Vercel Serverless Function
export default app;
