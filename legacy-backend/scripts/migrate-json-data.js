/**
 * 🔄 SCRIPT DE MIGRACIÓN DE DATOS JSON A MYSQL
 * =============================================
 * Migra datos existentes desde archivos JSON a la base de datos MySQL
 * Proyecto: Bachillerato General Estatal "Héroes de la Patria"
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env.database' });

// Configuración de conexión MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'bge_user',
    password: process.env.DB_PASSWORD || 'HeroesPatria2025DB!',
    database: process.env.DB_NAME || 'heroes_patria_db',
    charset: 'utf8mb4'
};

/**
 * Leer y parsear archivo JSON
 * @param {string} filePath - Ruta del archivo JSON
 * @returns {Object|null} Datos parseados o null si hay error
 */
async function readJsonFile(filePath) {
    try {
        const absolutePath = path.resolve(__dirname, '../../', filePath);
        const data = await fs.readFile(absolutePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Error leyendo ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Generar UUID simple
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Migrar docentes desde JSON a MySQL
 * @param {Object} connection - Conexión MySQL
 * @param {Object} docentesData - Datos de docentes desde JSON
 */
async function migrateDocentes(connection, docentesData) {
    console.log('🔄 Migrando docentes...');

    if (!docentesData || !docentesData.docentes) {
        console.log('❌ No se encontraron datos de docentes');
        return;
    }

    let migrados = 0;
    let errores = 0;

    for (const docente of docentesData.docentes) {
        try {
            // Crear usuario para el docente
            const uuid = generateUUID();
            const username = docente.email?.split('@')[0] || `docente_${docente.id}`;
            const defaultPassword = await bcrypt.hash('BGE2025!', 12);

            // Insertar usuario
            await connection.execute(`
                INSERT IGNORE INTO usuarios (uuid, username, email, password_hash, role, status)
                VALUES (?, ?, ?, ?, 'docente', 'activo')
            `, [uuid, username, docente.email || `${username}@heroesdelapatria.edu.mx`, defaultPassword]);

            // Obtener ID del usuario
            const [userRows] = await connection.execute(
                'SELECT id FROM usuarios WHERE email = ?',
                [docente.email || `${username}@heroesdelapatria.edu.mx`]
            );

            if (userRows.length > 0) {
                const userId = userRows[0].id;

                // Insertar docente
                await connection.execute(`
                    INSERT IGNORE INTO docentes
                    (usuario_id, numero_empleado, nombre, apellido_paterno, apellido_materno,
                     especialidad, telefono, email_institucional, status, fecha_ingreso)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)
                `, [
                    userId,
                    `EMP${String(docente.id).padStart(4, '0')}`,
                    docente.nombre || docente.name || 'Sin nombre',
                    'Apellido1', // Los datos JSON no tienen apellidos separados
                    'Apellido2',
                    docente.specialization || docente.especialidad || 'General',
                    docente.telefono || '',
                    docente.email || `${username}@heroesdelapatria.edu.mx`,
                    docente.fechaIngreso || '2020-01-01'
                ]);

                migrados++;
            }

        } catch (error) {
            console.error(`❌ Error migrando docente ${docente.id}:`, error.message);
            errores++;
        }
    }

    console.log(`✅ Docentes migrados: ${migrados}, Errores: ${errores}`);
}

/**
 * Migrar estudiantes desde JSON a MySQL
 * @param {Object} connection - Conexión MySQL
 * @param {Object} estudiantesData - Datos de estudiantes desde JSON
 */
async function migrateEstudiantes(connection, estudiantesData) {
    console.log('🔄 Migrando estudiantes...');

    if (!estudiantesData || !estudiantesData.estudiantes) {
        console.log('❌ No se encontraron datos de estudiantes');
        return;
    }

    let migrados = 0;
    let errores = 0;

    for (const estudiante of estudiantesData.estudiantes) {
        try {
            // Crear usuario para el estudiante
            const uuid = generateUUID();
            const username = estudiante.email?.split('@')[0] || `estudiante_${estudiante.id}`;
            const defaultPassword = await bcrypt.hash('Estudiante2025!', 12);

            // Insertar usuario
            await connection.execute(`
                INSERT IGNORE INTO usuarios (uuid, username, email, password_hash, role, status)
                VALUES (?, ?, ?, ?, 'estudiante', 'activo')
            `, [uuid, username, estudiante.email || `${username}@student.bgeholandapatria.edu.mx`, defaultPassword]);

            // Obtener ID del usuario
            const [userRows] = await connection.execute(
                'SELECT id FROM usuarios WHERE email = ?',
                [estudiante.email || `${username}@student.bgeholandapatria.edu.mx`]
            );

            if (userRows.length > 0) {
                const userId = userRows[0].id;

                // Separar nombre completo
                const nombreCompleto = estudiante.nombre || 'Sin nombre';
                const partesNombre = nombreCompleto.split(' ');
                const nombre = partesNombre[0] || 'Sin';
                const apellidoPaterno = partesNombre[1] || 'nombre';
                const apellidoMaterno = partesNombre[2] || '';

                // Insertar estudiante
                await connection.execute(`
                    INSERT IGNORE INTO estudiantes
                    (usuario_id, matricula, nombre, apellido_paterno, apellido_materno,
                     fecha_nacimiento, genero, telefono, direccion, semestre, especialidad,
                     promedio, status_academico, fecha_ingreso)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    estudiante.matricula || `EST${String(estudiante.id).padStart(6, '0')}`,
                    nombre,
                    apellidoPaterno,
                    apellidoMaterno,
                    estudiante.fechaNacimiento || '2005-01-01',
                    estudiante.genero === 'Masculino' ? 'M' : estudiante.genero === 'Femenino' ? 'F' : 'O',
                    estudiante.telefono || '',
                    estudiante.direccion || '',
                    parseInt(estudiante.semestre?.replace('°', '')) || 1,
                    estudiante.especialidad || 'General',
                    parseFloat(estudiante.promedio) || 0.00,
                    estudiante.estado === 'Activo' ? 'regular' : 'irregular',
                    estudiante.fechaIngreso || '2023-08-15'
                ]);

                // Insertar estadísticas de gamificación iniciales
                await connection.execute(`
                    INSERT IGNORE INTO user_gamification_stats
                    (usuario_id, level, xp, ia_coins, total_achievements, streak_days)
                    VALUES (?, 1, 0, 100, 0, 0)
                `, [userId]);

                migrados++;
            }

        } catch (error) {
            console.error(`❌ Error migrando estudiante ${estudiante.id}:`, error.message);
            errores++;
        }
    }

    console.log(`✅ Estudiantes migrados: ${migrados}, Errores: ${errores}`);
}

/**
 * Migrar noticias/avisos desde JSON a MySQL
 * @param {Object} connection - Conexión MySQL
 * @param {Object} noticiasData - Datos de noticias desde JSON
 */
async function migrateNoticias(connection, noticiasData) {
    console.log('🔄 Migrando noticias...');

    if (!noticiasData || !noticiasData.noticias) {
        console.log('❌ No se encontraron datos de noticias');
        return;
    }

    // Buscar usuario administrador
    const [adminRows] = await connection.execute(
        'SELECT id FROM usuarios WHERE role = "admin" LIMIT 1'
    );

    if (adminRows.length === 0) {
        console.log('❌ No se encontró usuario administrador para asignar noticias');
        return;
    }

    const adminId = adminRows[0].id;
    let migradas = 0;
    let errores = 0;

    for (const noticia of noticiasData.noticias) {
        try {
            await connection.execute(`
                INSERT IGNORE INTO avisos
                (title, content, type, target_audience, priority, autor_id,
                 image_url, is_published, published_at)
                VALUES (?, ?, 'noticia', 'todos', 'media', ?, ?, true, ?)
            `, [
                noticia.titulo || noticia.title || 'Sin título',
                noticia.contenido || noticia.content || 'Sin contenido',
                adminId,
                noticia.imagen || noticia.image || null,
                noticia.fecha || new Date()
            ]);

            migradas++;

        } catch (error) {
            console.error(`❌ Error migrando noticia ${noticia.id}:`, error.message);
            errores++;
        }
    }

    console.log(`✅ Noticias migradas: ${migradas}, Errores: ${errores}`);
}

/**
 * Función principal de migración
 */
async function runMigration() {
    console.log('🚀 Iniciando migración de datos JSON a MySQL');
    console.log('================================================');

    let connection;

    try {
        // Conectar a MySQL
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a MySQL establecida');

        // Verificar que las tablas existan
        const [tables] = await connection.execute(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = ? AND table_name IN ('usuarios', 'docentes', 'estudiantes', 'avisos')
        `, [dbConfig.database]);

        if (tables.length < 4) {
            console.log('❌ No se encontraron todas las tablas necesarias');
            console.log('💡 Ejecuta primero: mysql -u bge_user -p heroes_patria_db < backend/scripts/create-database.sql');
            return;
        }

        // Leer archivos JSON
        const docentesData = await readJsonFile('data/docentes.json');
        const estudiantesData = await readJsonFile('data/estudiantes.json');
        const noticiasData = await readJsonFile('data/noticias.json');

        // Ejecutar migraciones
        if (docentesData) await migrateDocentes(connection, docentesData);
        if (estudiantesData) await migrateEstudiantes(connection, estudiantesData);
        if (noticiasData) await migrateNoticias(connection, noticiasData);

        // Mostrar estadísticas finales
        console.log('\n📊 ESTADÍSTICAS FINALES:');
        console.log('========================');

        const [usuariosCount] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
        const [docentesCount] = await connection.execute('SELECT COUNT(*) as count FROM docentes');
        const [estudiantesCount] = await connection.execute('SELECT COUNT(*) as count FROM estudiantes');
        const [avisosCount] = await connection.execute('SELECT COUNT(*) as count FROM avisos');

        console.log(`👥 Total usuarios: ${usuariosCount[0].count}`);
        console.log(`👨‍🏫 Total docentes: ${docentesCount[0].count}`);
        console.log(`🎓 Total estudiantes: ${estudiantesCount[0].count}`);
        console.log(`📢 Total avisos: ${avisosCount[0].count}`);

        console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
        console.log('====================================');
        console.log('💡 Credenciales por defecto:');
        console.log('   - Admin: admin / [password en create-database.sql]');
        console.log('   - Docentes: [email] / BGE2025!');
        console.log('   - Estudiantes: [email] / Estudiante2025!');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 SOLUCIÓN:');
            console.log('1. Verificar que MySQL esté ejecutándose: net start MySQL80');
            console.log('2. Verificar credenciales en .env.database');
            console.log('3. Crear base de datos: mysql -u root -p < backend/scripts/create-database.sql');
        }

    } finally {
        if (connection) {
            await connection.end();
            console.log('📝 Conexión MySQL cerrada');
        }
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    runMigration();
}

module.exports = {
    runMigration,
    migrateDocentes,
    migrateEstudiantes,
    migrateNoticias
};