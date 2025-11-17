/**
 * Script para verificar usuarios en tabla 'usuarios' de PostgreSQL (Neon)
 * Uso: node backend/scripts/check-usuarios-db.js
 */

require('dotenv').config();
const { executeQuery } = require('../config/database');

async function checkUsuarios() {
    try {
        console.log('🔍 Verificando tabla usuarios en PostgreSQL...\n');

        // Obtener todos los usuarios
        const usuarios = await executeQuery('SELECT id, username, email, role, active, created_at FROM usuarios ORDER BY id');

        console.log(`✅ Total de usuarios encontrados: ${usuarios.length}\n`);

        if (usuarios.length === 0) {
            console.log('⚠️ No hay usuarios en la tabla usuarios');
            console.log('📝 Necesitas crear usuarios primero con un script SQL migration');
        } else {
            console.log('📋 USUARIOS EN LA BASE DE DATOS:');
            console.log('═'.repeat(80));
            usuarios.forEach(user => {
                console.log(`
ID: ${user.id}
├─ Username: ${user.username}
├─ Email: ${user.email}
├─ Role: ${user.role}
├─ Active: ${user.active || user.status === 'activo' ? '✅ Sí' : '❌ No'}
└─ Creado: ${user.created_at}
`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error consultando tabla usuarios:');
        console.error(error.message);
        console.log('\n⚠️ Posibles problemas:');
        console.log('1. PostgreSQL/Neon no está conectado');
        console.log('2. La tabla "usuarios" no existe');
        console.log('3. DATABASE_URL no está configurada en .env');
        process.exit(1);
    }
}

checkUsuarios();
