/**
 * 🗄️ SISTEMA DE BASE DE DATOS JSON (TEMPORAL)
 * Reemplaza MySQL hasta la instalación real
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');

// Directorio de datos JSON
const DB_DIR = path.join(__dirname, '..', 'data');

/**
 * Asegura que el directorio de datos existe
 */
async function ensureDataDir() {
    try {
        await fs.access(DB_DIR);
    } catch {
        await fs.mkdir(DB_DIR, { recursive: true });
        devLogger.log('📁 Directorio de datos creado:', DB_DIR);
    }
}

/**
 * Simula executeQuery de MySQL
 */
async function executeQuery(query, params = []) {
    await ensureDataDir();

    try {
        // Parsear queries básicos
        if (query.includes('SELECT') && query.includes('usuarios')) {
            return await getUsuarios(params);
        }

        if (query.includes('INSERT') && query.includes('usuarios')) {
            return await insertUsuario(params);
        }

        if (query.includes('SELECT') && query.includes('informacion_dinamica')) {
            return await getInformacionDinamica(params);
        }

        // Fallback para otros queries
        devLogger.log('📝 Query simulado:', query);
        return [];

    } catch (error) {
        devLogger.error('❌ Error en query JSON:', error.message);
        throw error;
    }
}

/**
 * Obtener usuarios del archivo JSON
 */
async function getUsuarios(params) {
    const filePath = path.join(DB_DIR, 'usuarios.json');

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const usuarios = JSON.parse(data);

        // Si hay parámetros, filtrar
        if (params.length > 0) {
            return usuarios.filter(u =>
                u.email === params[0] ||
                u.username === params[0] ||
                u.id === params[0]
            );
        }

        return usuarios;
    } catch {
        // Crear archivo inicial si no existe
        const usuariosDefault = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@heroespatria.edu.mx',
                password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeP8ZK4dKd4K2G.xS', // admin123
                role: 'admin',
                active: true,
                created_at: new Date().toISOString(),
                last_login: null
            },
            {
                id: 2,
                username: 'teacher',
                email: 'teacher@heroespatria.edu.mx',
                password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeP8ZK4dKd4K2G.xS', // teacher123
                role: 'teacher',
                active: true,
                created_at: new Date().toISOString(),
                last_login: null
            }
        ];

        await fs.writeFile(filePath, JSON.stringify(usuariosDefault, null, 2));
        devLogger.log('✅ Archivo usuarios.json creado');
        return usuariosDefault;
    }
}

/**
 * Insertar nuevo usuario
 */
async function insertUsuario(params) {
    const filePath = path.join(DB_DIR, 'usuarios.json');
    const usuarios = await getUsuarios([]);

    const nuevoUsuario = {
        id: usuarios.length + 1,
        username: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3] || 'student',
        active: params[4] !== undefined ? params[4] : true,
        created_at: new Date().toISOString(),
        last_login: null
    };

    usuarios.push(nuevoUsuario);
    await fs.writeFile(filePath, JSON.stringify(usuarios, null, 2));

    return { insertId: nuevoUsuario.id };
}

/**
 * Obtener información dinámica para chatbot
 */
async function getInformacionDinamica(params) {
    const filePath = path.join(DB_DIR, 'informacion_dinamica.json');

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const informacion = JSON.parse(data);

        // Si hay query de búsqueda
        if (params.length > 0) {
            const searchTerm = params[0].toLowerCase();
            return informacion.filter(item =>
                item.keywords.some(keyword =>
                    keyword.toLowerCase().includes(searchTerm)
                ) ||
                item.titulo.toLowerCase().includes(searchTerm)
            );
        }

        return informacion;
    } catch {
        // Crear datos iniciales del chatbot
        const datosIniciales = [
            {
                id: 1,
                titulo: "Horarios de Clases",
                keywords: ["horarios", "clases", "tiempo", "schedule"],
                categoria: "academico",
                tipo_usuario: "estudiante",
                contenido: JSON.stringify({
                    lunes_viernes: "7:00 AM - 3:30 PM",
                    recreos: ["10:00-10:30 AM", "1:00-1:30 PM"],
                    laboratorio: "Por horario especial"
                }),
                activo: true,
                prioridad: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                titulo: "Información de Contacto",
                keywords: ["contacto", "teléfono", "dirección", "ubicación"],
                categoria: "general",
                tipo_usuario: "general",
                contenido: JSON.stringify({
                    telefono: "222-123-4567",
                    direccion: "Av. Héroes de la Patria #123, Puebla",
                    email: "info@heroespatria.edu.mx"
                }),
                activo: true,
                prioridad: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        await fs.writeFile(filePath, JSON.stringify(datosIniciales, null, 2));
        devLogger.log('✅ Archivo informacion_dinamica.json creado');
        return datosIniciales;
    }
}

/**
 * Test de conexión (siempre exitoso para JSON)
 */
async function testConnection() {
    try {
        await ensureDataDir();
        await getUsuarios([]);
        await getInformacionDinamica([]);

        devLogger.log('✅ Sistema JSON funcionando correctamente');
        devLogger.log('📊 Modo: Base de datos temporal (archivos JSON)');
        return true;
    } catch (error) {
        devLogger.error('❌ Error en sistema JSON:', error.message);
        return false;
    }
}

/**
 * Cerrar "conexión" (no hace nada en JSON)
 */
async function closePool() {
    devLogger.log('✅ Sistema JSON cerrado correctamente');
}

/**
 * Stats del sistema JSON
 */
async function getPoolStats() {
    try {
        const usuarios = await getUsuarios([]);
        const informacion = await getInformacionDinamica([]);

        return {
            totalUsuarios: usuarios.length,
            totalInformacion: informacion.length,
            sistemaActivo: true,
            tipo: 'JSON'
        };
    } catch {
        return {
            totalUsuarios: 0,
            totalInformacion: 0,
            sistemaActivo: false,
            tipo: 'JSON'
        };
    }
}

module.exports = {
    executeQuery,
    testConnection,
    closePool,
    getPoolStats
};