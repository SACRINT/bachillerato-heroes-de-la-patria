/**
 * 🧩 /api/debug-build
 * Consulta la API de Vercel y devuelve los últimos Build Logs.
 */

import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  const team = process.env.VERCEL_TEAM_ID;

  if (!token || !project) {
    return res.status(200).json({
      success: false,
      message: "Faltan variables VERCEL_TOKEN o VERCEL_PROJECT_ID. Configúralas en tu panel de entorno.",
    });
  }

  const base = `https://api.vercel.com/v6/deployments?projectId=${project}${
    team ? `&teamId=${team}` : ""
  }`;

  try {
    const deploymentsRes = await fetch(base, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const deployments = await deploymentsRes.json();

    if (!deployments?.deployments?.length)
      return res.status(200).json({ success: false, message: "No se encontraron despliegues recientes." });

    const last = deployments.deployments[0];

    // Obtener logs del build
    const logsRes = await fetch(
      `https://api.vercel.com/v2/deployments/${last.uid}/events${
        team ? `?teamId=${team}` : ""
      }`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const logs = await logsRes.json();

    res.status(200).json({
      success: true,
      project,
      lastDeployment: {
        uid: last.uid,
        url: last.url,
        createdAt: new Date(last.createdAt).toLocaleString(),
        state: last.state,
      },
      events: logs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los Build Logs desde la API de Vercel.",
      error: err.message,
    });
  }
};