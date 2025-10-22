export default async function handler(req, res) {
  const start = Date.now();
  try {
    const uptime = process.uptime();
    const environment = process.env.NODE_ENV || "development";

    return res.status(200).json({
      success: true,
      message: "✅ Backend en funcionamiento",
      uptime: `${uptime.toFixed(2)}s`,
      responseTime: `${Date.now() - start}ms`,
      environment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error en el backend",
      error: error.message
    });
  }
}