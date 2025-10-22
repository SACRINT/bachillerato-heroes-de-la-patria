/**
 * 🧩 /api/debug-runtime
 * Devuelve errores y advertencias recientes del entorno runtime
 * (captura global de excepciones y console logs).
 */
import os from "os";

let runtimeErrors = [];

process.on("uncaughtException", (err) => {
  runtimeErrors.push({
    type: "uncaughtException",
    message: err.message,
    stack: err.stack,
    time: new Date().toISOString(),
  });
});

process.on("unhandledRejection", (reason) => {
  runtimeErrors.push({
    type: "unhandledRejection",
    message: reason?.message || String(reason),
    time: new Date().toISOString(),
  });
});

console.error = ((orig) => (...args) => {
  runtimeErrors.push({
    type: "console.error",
    message: args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "),
    time: new Date().toISOString(),
  });
  orig(...args);
})(console.error);

export default async function handler(req, res) {
  const summary = {
    hostname: os.hostname(),
    nodeVersion: process.version,
    platform: os.platform(),
    uptimeMinutes: Math.round(process.uptime() / 60),
    errorCount: runtimeErrors.length,
  };

  res.status(200).json({
    success: true,
    summary,
    recentErrors: runtimeErrors.slice(-20),
  });
}