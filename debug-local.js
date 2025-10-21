/**
 * 🔍 DEBUG LOCAL vs VERCEL - COMPARADOR AUTOMÁTICO + AUTO-FIX MODE
 * Autor: GPT-5 para BGE Héroes de la Patria
 * 
 * Ejecuta:
 *   node debug-local.js
 *   node debug-local.js --auto-fix
 */

import fs from "fs";
import os from "os";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// Node-fetch ESM compatible en Node >=18
const fetch = (await import("node-fetch")).default;

const VERCEL_URL = process.env.VERCEL_URL || "https://bge-heroesdelapatria.vercel.app";
const AUTO_FIX_MODE = process.argv.includes("--auto-fix");

async function checkEndpoint(name, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { name, success: true, data };
  } catch (error) {
    return { name, success: false, error: error.message };
  }
}

async function localEnvironmentReport() {
  const baseDir = process.cwd();
  const backendDir = path.join(baseDir, "backend");
  const apiDir = path.join(baseDir, "api");

  const fileCount = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) count += fileCount(full);
      else count++;
    }
    return count;
  };

  const envKeys = Object.keys(process.env).filter((k) =>
    ["DATABASE_URL", "SESSION_SECRET", "CORS_ORIGIN"].includes(k)
  );

  return {
    success: true,
    localNode: process.version,
    cwd: baseDir,
    platform: os.platform(),
    cpus: os.cpus().length,
    totalRAM_MB: Math.round(os.totalmem() / 1024 / 1024),
    backendFiles: fileCount(backendDir),
    apiFiles: fileCount(apiDir),
    envVars: envKeys.reduce((acc, k) => {
      acc[k] = process.env[k] ? "(set)" : "(not set)";
      return acc;
    }, {}),
  };
}

async function autoFix(report) {
  console.log("\n🛠️ Ejecutando Modo Auto-Doctor...");
  const suggestions = [];

  // Verificar si falta vercel.json o está mal configurado
  if (!fs.existsSync("vercel.json")) {
    suggestions.push("⚙️ Crear un archivo vercel.json base para Node backend.");
    fs.writeFileSync(
      "vercel.json",
      JSON.stringify(
        {
          version: 2,
          builds: [{ src: "api/index.js", use: "@vercel/node" }],
          functions: {
            "api/index.js": {
              maxDuration: 30,
              memory: 1024,
              includeFiles: "backend/**", // Ensure backend files are included
            },
          },
          rewrites: [
            { source: "/api/(.*)", destination: "/api/index.js" },
            { source: "/(.*)", destination: "/public/$1" },
          ],
          env: { NODE_ENV: "production" },
          regions: ["iad1"],
          outputDirectory: "public",
        },
        null,
        2
      )
    );
  } else {
    // If vercel.json exists, check its content for backend inclusion
    const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
    const apiIndexFunction = vercelConfig.functions?.["api/index.js"];
    if (apiIndexFunction && (!apiIndexFunction.includeFiles || !apiIndexFunction.includeFiles.includes("backend/**"))) {
      suggestions.push("⚙️ Tu vercel.json existe, pero la función 'api/index.js' no incluye 'backend/**'. Considera añadir 'includeFiles: \"backend/**\"' a la configuración de esa función para asegurar que todos los archivos del backend se empaqueten.");
    }
  }

  // Verificar .vercelignore
  if (fs.existsSync(".vercelignore")) {
    const ignored = fs.readFileSync(".vercelignore", "utf8");
    if (ignored.includes("backend/")) {
      suggestions.push("❌ 'backend/' está siendo ignorado en .vercelignore. Elimina esta línea para que el backend se empaquete.");
    }
  } else if (report.diff.backendFiles < report.local.backendFiles) {
    // If .vercelignore doesn't exist but files are missing, suggest creating one or checking .gitignore
    suggestions.push("🔍 No se encontró un archivo .vercelignore. Si faltan archivos del backend, revisa tu .gitignore o considera crear un .vercelignore para controlar explícitamente qué se despliega.");
  }


  // Variables críticas
  const vars = report.local.envVars;
  if (vars.DATABASE_URL === "(not set)") {
    suggestions.push("⚠️ La variable de entorno DATABASE_URL no está configurada localmente. Asegúrate de que esté definida en tu archivo .env local y en Vercel.");
  }

  // General suggestion for missing backend files
  if (report.diff.backendFiles < report.local.backendFiles) {
    suggestions.push("📦 Gran diferencia en el número de archivos del backend entre local y Vercel. Esto es crítico. Revisa a fondo tu vercel.json y .vercelignore. Asegúrate de que no haya reglas que excluyan el directorio 'backend' o sus subdirectorios. Un redespliegue con 'Clear build cache' es a menudo necesario después de estos cambios.");
  }


  if (suggestions.length === 0) {
    console.log("✅ No se detectaron problemas automáticos.");
  } else {
    console.log("📋 Sugerencias de corrección:");
    suggestions.forEach((s) => console.log(" -", s));
  }

  console.log("🧩 Auto-Doctor finalizado.\n");
}

async function main() {
  console.log("🧠 Iniciando diagnóstico completo del entorno BGE Héroes de la Patria...");
  console.log("🌐 Vercel URL:", VERCEL_URL);
  if (AUTO_FIX_MODE) console.log("🛠️ Modo Auto-Doctor ACTIVADO");
  console.log("⏳ Analizando...\n");

  const endpoints = ["debug-health", "debug-env", "debug-system", "debug-files", "debug-db"];
  const results = {};
  for (const ep of endpoints) results[ep] = await checkEndpoint(ep, `${VERCEL_URL}/api/${ep}`);
  const local = await localEnvironmentReport();

  const diff = {
    missingEndpoints: endpoints.filter((ep) => !results[ep].success),
    dbConnection: results["debug-db"]?.data?.success ? "OK" : "FAIL",
    backendFiles: results["debug-files"]?.data?.backendFilesCount || 0,
    localFiles: local.backendFiles,
  };

  const warnings = [];
  if (diff.dbConnection === "FAIL") warnings.push("⚠️ Base de datos inaccesible en producción.");
  if (diff.backendFiles < local.backendFiles)
    warnings.push("⚠️ No todos los archivos del backend se empaquetaron.");
  if (diff.missingEndpoints.length)
    warnings.push(`⚠️ Endpoints faltantes: ${diff.missingEndpoints.join(", ")}`);

  const report = { timestamp: new Date().toISOString(), local, vercel: results, diff, warnings };
  fs.writeFileSync("diagnostic-report.json", JSON.stringify(report, null, 2));

  console.log("\n📋 Informe completo guardado en diagnostic-report.json\n");
  console.table([
    { Check: "Endpoints OK", Value: endpoints.length - diff.missingEndpoints.length },
    { Check: "Archivos Backend Local", Value: local.backendFiles },
    { Check: "Archivos Backend en Vercel", Value: diff.backendFiles },
    { Check: "DB Connection", Value: diff.dbConnection },
  ]);

  if (warnings.length) {
    console.log("\n⚠️ ADVERTENCIAS:");
    warnings.forEach((w) => console.log(" -", w));
  } else {
    console.log("\n✅ Todo parece correcto.");
  }

  if (AUTO_FIX_MODE) await autoFix(report);
  console.log("\n🧠 Diagnóstico completado.\n");
}

main();