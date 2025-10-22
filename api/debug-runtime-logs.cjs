/**
 * ⚙️ DEBUG RUNTIME LOGS - Bachillerato Héroes de la Patria
 * Permite recuperar logs recientes del entorno en ejecución (errores 500, crash, require, etc.)
 * Requiere las mismas variables de entorno de Vercel:
 * - VERCEL_TOKEN
 * - VERCEL_PROJECT_ID
 */

const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
      return res.status(400).json({
        error:
          "Faltan variables de entorno: VERCEL_TOKEN y/o VERCEL_PROJECT_ID",
      });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 🔹 Buscar la última función desplegada
    const functionsRes = await fetch(
      `https://api.vercel.com/v1/projects/${projectId}/functions`,
      { headers }
    );
    const functions = await functionsRes.json();
    const func = functions?.functions?.[0];

    if (!func) {
      return res.status(404).json({ error: "No se encontró ninguna función." });
    }

    // 🔹 Consultar los runtime logs
    const logsRes = await fetch(
      `https://api.vercel.com/v1/projects/${projectId}/functions/${func.id}/logs?limit=50`,
      { headers }
    );
    const logs = await logsRes.json();

    res.status(200).json({
      function: {
        id: func.id,
        name: func.name,
        createdAt: new Date(func.createdAt).toISOString(),
      },
      logs,
    });
  } catch (err) {
    console.error("❌ Error obteniendo runtime logs:", err);
    res.status(500).json({ error: err.message });
  }
};