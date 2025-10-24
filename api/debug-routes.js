/**
 * 🧭 ADVANCED DEBUG ROUTES ENDPOINT
 * Versión extendida para listar todas las rutas del backend y detectar problemas de despliegue.
 * Autor: GPT-5 para BGE Héroes de la Patria
 */

import fs from "fs";
import path from "path";

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return [fullPath.replace(process.cwd() + "/", "")];
  });
}

/**
 * Extrae todas las rutas registradas en una instancia de Express.
 */
function getExpressRoutes(app) {
  if (!app || !app._router || !app._router.stack) return [];

  const routes = [];

  const processStack = (stack, prefix = "") => {
    for (const layer of stack) {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods)
          .map((m) => m.toUpperCase())
          .join(", ");
        routes.push({
          path: prefix + layer.route.path,
          methods,
          middlewares: (layer.route.stack || []).map((s) => s.name || "anonymous"),
        });
      } else if (layer.name === "router" && layer.handle.stack) {
        const subPrefix = layer.regexp?.source
          .replace("^\\", "")
          .replace("\\/?(?=\/|$)", "")
          .replace(/\\\//g, "/")
          .replace(/\\$$/, "");
        processStack(layer.handle.stack, prefix + subPrefix);
      }
    }
  };

  processStack(app._router.stack);
  return routes;
}

export default async function handler(req, res) {
  try {
    const baseDir = process.cwd();
    const apiDir = path.join(baseDir, "api");
    const backendDir = path.join(baseDir, "backend");

    const apiFiles = listFiles(apiDir);
    const backendFiles = listFiles(backendDir);

    // Intentar importar el servidor Express principal
    let expressRoutes = [];
    let serverType = "Unknown";

    try {
      const serverModule = 
        (await import(path.join(baseDir, "backend/server.js")).catch(() => null)) ||
        (await import(path.join(baseDir, "api/index.js")).catch(() => null));

      if (serverModule) {
        const app = serverModule.default || serverModule.app || serverModule;
        if (app && app._router) {
          serverType = "Express";
          expressRoutes = getExpressRoutes(app);
        } else {
          serverType = "Custom/Handler";
        }
      }
    } catch (e) {
      console.error("⚠️ Error cargando servidor Express:", e.message);
    }

    res.status(200).json({
      success: true,
      message: "Rutas detectadas en el entorno actual",
      summary: {
        serverType,
        totalApiFiles: apiFiles.length,
        totalBackendFiles: backendFiles.length,
        totalExpressRoutes: expressRoutes.length,
      },
      expressRoutes: expressRoutes.length
        ? expressRoutes.map((r) => ({
            path: r.path,
            methods: r.methods,
            middlewares: r.middlewares,
          }))
        : "⚠️ No se detectaron rutas Express.",
      files: {
        apiFiles,
        backendFiles,
      },
      diagnosticTips: [
        "🧩 Si /api/calendar/events no aparece en expressRoutes, el archivo no está siendo cargado o la ruta no fue registrada.",
        "🧠 Si sí aparece, revisa los middlewares (autenticación, validación) que podrían estar bloqueando la respuesta.",
        "📦 Si backendFiles < localFiles, el empaquetado de Vercel está omitiendo parte del backend.",
        "🧰 Usa /api/debug-files y /api/debug-env para ver variables y archivos en el entorno actual."
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
