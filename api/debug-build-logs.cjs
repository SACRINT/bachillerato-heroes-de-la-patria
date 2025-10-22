/**
 * 🧱 DEBUG BUILD LOGS - Bachillerato Héroes de la Patria
 * Muestra los últimos registros de build desde la API de Vercel.
 * Requiere las siguientes variables en tu entorno de Vercel:
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

    // 🔹 Obtener el último despliegue
    const deploymentsRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`,
      { headers }
    );
    const deployments = await deploymentsRes.json();
    const latest = deployments.deployments?.[0];

    if (!latest) {
      return res.status(404).json({ error: "No se encontró ningún despliegue." });
    }

    // 🔹 Obtener logs del build
    const logsRes = await fetch(
      `https://api.vercel.com/v2/deployments/${latest.uid}/events`,
      { headers }
    );
    const logs = await logsRes.json();

    res.status(200).json({
      deployment: {
        id: latest.uid,
        state: latest.readyState,
        createdAt: new Date(latest.createdAt).toISOString(),
        url: latest.url,
      },
      logs,
    });
  } catch (err) {
    console.error("❌ Error obteniendo logs de build:", err);
    res.status(500).json({ error: err.message });
  }
};