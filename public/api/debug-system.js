import os from "os";

export default async function handler(req, res) {
  try {
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      cpus: os.cpus().length,
      memory: {
        totalMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMB: Math.round(os.freemem() / 1024 / 1024)
      },
      uptime: `${process.uptime().toFixed(2)}s`,
      cwd: process.cwd(),
      region: process.env.VERCEL_REGION || "(unknown)"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}