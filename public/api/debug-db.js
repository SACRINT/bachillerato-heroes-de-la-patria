import pkg from "pg";
const { Pool } = pkg;

export default async function handler(req, res) {
  const start = Date.now();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return res.status(500).json({
      success: false,
      message: "❌ No se encontró DATABASE_URL en variables de entorno."
    });
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query("SELECT NOW() as server_time");
    await pool.end();

    res.status(200).json({
      success: true,
      message: "✅ Conexión a base de datos exitosa",
      server_time: result.rows[0].server_time,
      responseTime: `${Date.now() - start}ms`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error al conectar a la base de datos",
      error: error.message
    });
  }
}