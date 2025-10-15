import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Configurada en Vercel
  ssl: {
    rejectUnauthorized: false, // Requerido por Neon
  },
});

export const query = (text, params) => pool.query(text, params);