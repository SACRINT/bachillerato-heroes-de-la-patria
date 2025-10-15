
const { Pool } = require('pg');
require('dotenv').config();

/**
 * CONFIGURACIÓN DE LA BASE DE DATOS POSTGRESQL
 * 
 * Utiliza un pool de conexiones para mayor eficiencia y escalabilidad.
 * La configuración se obtiene de la variable de entorno DATABASE_URL.
 * 
 * Formato de DATABASE_URL (ejemplo para Neon/PostgreSQL):
 * postgresql://user:password@host:port/database
 * 
 * Ejemplo:
 * postgresql://user:password@ep-some-long-id.us-east-2.aws.neon.tech/bachillerato_db?sslmode=require
 */

// Validar que la variable de entorno DATABASE_URL exista
if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR CRÍTICO: La variable de entorno DATABASE_URL no está definida.');
    console.error('Por favor, crea un archivo .env en el directorio /server y añade la línea:');
    console.error('DATABASE_URL="postgresql://user:password@host:port/database"');
    process.exit(1); // Detiene la aplicación si la BD no está configurada
}

// Crear el pool de conexiones
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // Solo para producción con SSL
});

// Probar la conexión al iniciar
pool.query('SELECT NOW()')
    .then(res => {
        console.log('✅ Conexión a la base de datos PostgreSQL establecida con éxito. Hora actual:', res.rows[0].now);
    })
    .catch(err => {
        console.error('❌ ERROR AL CONECTAR A LA BASE DE DATOS:', err.message);
        if (err.code === '28P01') { // invalid_password
            console.error('   -> Causa: Usuario o contraseña incorrectos.');
        } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            console.error('   -> Causa: No se pudo alcanzar el host de la base de datos. ¿Está el host correcto y el servidor de BD corriendo?');
        } else if (err.code === '3D000') { // invalid_catalog_name
            console.error('   -> Causa: La base de datos especificada no existe.');
        }
        console.error('   -> Revisa tu cadena de conexión en la variable DATABASE_URL.');
        process.exit(1);
    });

module.exports = pool;
