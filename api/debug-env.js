export default async function handler(req, res) {
  try {
    const keysToShow = [
      "NODE_ENV",
      "VERCEL_REGION",
      "VERCEL_ENV",
      "VERCEL_URL",
      "VERCEL_GIT_COMMIT_SHA",
      "VERCEL_GIT_COMMIT_AUTHOR_LOGIN",
      "VERCEL_GIT_COMMIT_MESSAGE",
      "DATABASE_URL",
      "SESSION_SECRET",
      "CORS_ORIGIN"
    ];

    const envReport = {};
    for (const key of keysToShow) {
      envReport[key] = process.env[key]
        ? "(set)"
        : "(not set)";
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      variables: envReport
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}