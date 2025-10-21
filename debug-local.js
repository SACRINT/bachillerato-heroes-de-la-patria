/**
 * 🔍 DEBUG LOCAL vs VERCEL - COMPARADOR AUTOMÁTICO
 * Autor: GPT-5 para BGE Héroes de la Patria
 * 
 * Ejecuta: node debug-local.js [--auto-fix]
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";
dotenv.config();

const VERCEL_URL = process.env.VERCEL_URL || "https://bge-heroesdelapatria.vercel.app";
const AUTO_FIX_MODE = process.argv.includes("--auto-fix");

async function checkEndpoint(name, url) {
  try {
    const res = await fetch(url);
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
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
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

async function main() {
  console.log("🧠 Iniciando diagnóstico completo del entorno BGE Héroes de la Patria...");
  console.log("🌐 Vercel URL:", VERCEL_URL);
  if (AUTO_FIX_MODE) {
    console.log("🛠️ Modo Auto-Doctor ACTIVADO. Se sugerirán correcciones.");
  }
  console.log("⏳ Esto puede tardar unos segundos...\n");

  const endpoints = [
    "debug-health",
    "debug-env",
    "debug-system",
    "debug-files",
    "debug-db",
  ];

  const results = {};
  for (const ep of endpoints) {
    results[ep] = await checkEndpoint(ep, `${VERCEL_URL}/api/${ep}`);
  }

  const local = await localEnvironmentReport();

  // Comparar diferencias clave
  const diff = {
    missingEndpoints: endpoints.filter((ep) => !results[ep].success),
    dbConnection: results["debug-db"]?.data?.success ? "OK" : "FAIL",
    backendFiles: results["debug-files"]?.data?.backendFilesCount || 0,
    localFiles: local.backendFiles,
    envComparison: local.envVars,
  };

  // Detectar problemas comunes
  const warnings = [];
  if (diff.dbConnection === "FAIL") warnings.push("⚠️ Base de datos inaccesible en producción.");
  if (diff.backendFiles < local.backendFiles) {
    warnings.push("⚠️ No todos los archivos del backend se empaquetaron en Vercel.");
  }
  if (diff.missingEndpoints.length) {
    warnings.push(`⚠️ Endpoints faltantes en Vercel: ${diff.missingEndpoints.join(", ")}`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    local,
    vercel: results,
    diff,
    warnings,
  };

  fs.writeFileSync("diagnostic-report.json", JSON.stringify(report, null, 2));
  console.log("\n📋 Informe completo guardado en diagnostic-report.json\n");

  console.log("🧾 RESUMEN:");
  console.table([
    { Check: "Endpoints OK", Value: endpoints.length - diff.missingEndpoints.length },
    { Check: "Archivos Backend Local", Value: local.backendFiles },
    { Check: "Archivos Backend en Vercel", Value: diff.backendFiles },
    { Check: "DB Connection", Value: diff.dbConnection },
  ]);

  if (warnings.length) {
    console.log("\n⚠️ ADVERTENCIAS DETECTADAS:");
    warnings.forEach((w) => console.log(" -", w));

    if (AUTO_FIX_MODE) {
      console.log("\n🛠️ SUGERENCIAS DE AUTO-CORRECCIÓN (Modo Auto-Doctor):");

      if (diff.dbConnection === "FAIL") {
        console.log("  - Problema: La base de datos no es accesible en Vercel.");
        console.log("    Sugerencia: Asegúrate de que la variable de entorno 'DATABASE_URL' esté correctamente configurada en tu proyecto de Vercel y que la base de datos permita conexiones desde Vercel (por ejemplo, lista blanca de IPs).");
      }
      if (diff.backendFiles < local.backendFiles) {
        console.log("  - Problema: Faltan archivos del backend en el despliegue de Vercel.");
        console.log("    Sugerencia: Revisa tu archivo '.vercelignore' (si existe) para asegurarte de que no esté excluyendo archivos necesarios. También, verifica los logs de construcción en Vercel para ver si hay errores relacionados con el empaquetado de archivos. Considera un redespliegue con 'Clear build cache'.");
      }
      if (diff.missingEndpoints.length) {
        console.log(`  - Problema: Los siguientes endpoints de depuración no responden en Vercel: ${diff.missingEndpoints.join(", ")}.`);
        console.log("    Sugerencia: Asegúrate de que los archivos 'debug-*.js' estén en la carpeta 'api/' de tu proyecto y que no estén siendo ignorados por '.vercelignore' o '.gitignore'. Realiza un 'git add' y 'git commit' de estos archivos, y luego un redespliegue en Vercel con 'Clear build cache'.");
      }
    }
  } else {
    console.log("\n✅ Todo parece correcto. Tu entorno Vercel está funcionando bien.");
  }

  console.log("\n🧠 Ejecución finalizada.\n");
}

main();