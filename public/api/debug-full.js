export default async function handler(req, res) {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const endpoints = [
      "debug-health",
      "debug-env",
      "debug-system",
      "debug-files",
      "debug-db"
    ];

    const results = {};
    for (const ep of endpoints) {
      try {
        const r = await fetch(`${base}/api/${ep}`);
        results[ep] = await r.json();
      } catch (err) {
        results[ep] = { success: false, error: err.message };
      }
    }

    res.status(200).json({
      success: true,
      summary: `🔍 Informe completo de diagnóstico del entorno`,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}