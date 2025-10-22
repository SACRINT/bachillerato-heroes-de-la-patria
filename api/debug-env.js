export default async function handler(req, res) {
  try {
    const visibleEnv = {};
    const allowedKeys = [
      "NODE_ENV",
      "VERCEL_REGION",
      "VERCEL_ENV",
      "VERCEL_URL",
      "DATABASE_URL",
      "SESSION_SECRET",
      "CORS_ORIGIN"
    ];

    allowedKeys.forEach(key => {
      visibleEnv[key] = process.env[key] || "(not set)";
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      env: visibleEnv
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}