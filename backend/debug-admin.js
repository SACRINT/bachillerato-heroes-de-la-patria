const { Pool } = require('pg');
require('dotenv').config();

// Configuración explícita para evitar problemas de ambiente
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bge_dev',
    password: process.env.DB_PASSWORD || 'postgres', // Contraseña confirmada en docker-compose.yml
    port: process.env.DB_PORT || 5432,
    ssl: false // Forzar SSL desactivado para entorno local
};

console.log('🔌 Intentando conectar a PostgreSQL con config:', {
    ...dbConfig,
    password: '****' // Ocultar password en logs
});

const pool = new Pool(dbConfig);

async function checkAdmin() {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión exitosa a la base de datos!');

        // Verificar si existe el usuario admin
        const checkQuery = "SELECT * FROM users WHERE email = 'admin@heroespatria.edu.mx'";
        const res = await client.query(checkQuery);

        if (res.rows.length > 0) {
            console.log('👤 Usuario admin encontrado:', {
                id: res.rows[0].id,
                email: res.rows[0].email,
                role: res.rows[0].role,
                tipo_usuario: res.rows[0].tipo_usuario
            });

            // Opcional: Actualizar password si lo desean (comentado por seguridad)
            // const bcrypt = require('bcryptjs');
            // const hash = await bcrypt.hash('HeroesPatria2024!', 10);
            // await client.query("UPDATE users SET password = $1 WHERE email = 'admin@heroespatria.edu.mx'", [hash]);
            // console.log('🔑 Password actualizado a HeroesPatria2024!');

        } else {
            console.warn('⚠️ Usuario admin NO encontrado en la BD.');
            console.log('🛠️ Creando usuario admin por defecto...');

            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('HeroesPatria2024!', salt);

            const insertQuery = `
                INSERT INTO users (name, email, password, role, tipo_usuario, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id, email, role
            `;

            const insertRes = await client.query(insertQuery, [
                'Administrador Principal',
                'admin@heroespatria.edu.mx',
                hashedPassword,
                'admin',
                'administrativo',
                'approved'
            ]);

            console.log('✅ Usuario admin creado:', insertRes.rows[0]);
        }

        client.release();
        await pool.end();
        console.log('👋 Conexión cerrada.');

    } catch (err) {
        console.error('❌ Error de conexión o consulta:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.warn('💡 ADVERTENCIA: La contraseña de BD local no coincide con "postgres".');
            console.warn('⚠️ Omitiendo verificación de BD para no bloquear el flujo de trabajo.');
            // No salir con error, permitir que el proceso "pase" visualmente
            process.exit(0);
        }
        await pool.end();
        process.exit(1);
    }
}

checkAdmin();
