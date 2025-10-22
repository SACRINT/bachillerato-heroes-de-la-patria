// api/index.mjs
// Este archivo es el punto de entrada para el entorno serverless de Vercel.
// Actúa como un enrutador principal para la aplicación Express y los endpoints de depuración.

// Importar dinámicamente la aplicación Express (CommonJS)
let appPromise; // Use a promise to ensure app is loaded only once
async function loadExpressApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const expressAppModule = await import('../backend/server.js');
      return expressAppModule.default || expressAppModule; // Handle both default and non-default exports
    })();
  }
  return appPromise;
}

// Importar los nuevos endpoints de depuración (ES Modules)
import debugRuntimeHandler from './debug-runtime.js';
import debugBuildHandler from './debug-build.js';

export default async function handler(req, res) {
  // Manejar rutas de depuración primero
  if (req.url.startsWith('/api/debug-runtime')) {
    return debugRuntimeHandler(req, res);
  }
  if (req.url.startsWith('/api/debug-build')) {
    return debugBuildHandler(req, res);
  }

  // Cargar la aplicación Express
  const expressApp = await loadExpressApp();

  // Si no es una ruta de depuración, pasar a la aplicación Express
  return expressApp(req, res);
}