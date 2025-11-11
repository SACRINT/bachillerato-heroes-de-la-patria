/**
 * 🗄️ MIGRACIÓN DATOS JSON A MYSQL - BGE HEROES DE LA PATRIA
 * Script para migrar todos los datos JSON existentes a MySQL
 */

const mysql = require('mysql2/promise');
const devLogger = require('../utils/devLogger');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

// Configuración de base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'heroes_patria_db',
    charset: 'utf8mb4'
};

// Rutas de archivos JSON
const dataPath = path.join(__dirname, '../../data');
const jsonFiles = {
    users: 'users.json',
    estudiantes: 'estudiantes.json',
    docentes: 'docentes.json',
    noticias: 'noticias.json',
    eventos: 'eventos.json',
    avisos: 'avisos.json',
    comunicados: 'comunicados.json',
    estadisticas: 'dashboard-stats.json',
    finanzas: 'finanzas.json',
    testimonios: 'testimonios.json'
};

class JSONToMySQLMigrator {
    constructor() {
        this.connection = null;
        this.migrationStats = {
            totalFiles: 0,
            migratedFiles: 0,
            totalRecords: 0,
            migratedRecords: 0,
            errors: []
        };
    }

    async initialize() {
        try {
            devLogger.log('🔧 Conectando a MySQL...');
            this.connection = await mysql.createConnection(dbConfig);
            devLogger.log('✅ Conexión MySQL establecida');

            await this.createDatabase();
            await this.createTables();

        } catch (error) {
            devLogger.error('❌ Error inicializando migrador:', error.message);
            throw error;
        }
    }

    async createDatabase() {
        try {
            await this.connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await this.connection.execute(`USE ${dbConfig.database}`);
            devLogger.log('✅ Base de datos preparada');
        } catch (error) {
            devLogger.error('❌ Error creando base de datos:', error.message);
            throw error;
        }
    }

    async createTables() {
        const tables = {
            // Tabla de usuarios
            users: `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    nombre VARCHAR(255) NOT NULL,
                    apellido_paterno VARCHAR(255),
                    apellido_materno VARCHAR(255),
                    role ENUM('admin', 'teacher', 'student', 'parent') DEFAULT 'student',
                    active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL,
                    INDEX idx_email (email),
                    INDEX idx_role (role),
                    INDEX idx_active (active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de estudiantes
            estudiantes: `
                CREATE TABLE IF NOT EXISTS estudiantes (
                    id VARCHAR(20) PRIMARY KEY,
                    matricula VARCHAR(20) NOT NULL UNIQUE,
                    nombre VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    telefono VARCHAR(20),
                    semestre VARCHAR(10),
                    promedio DECIMAL(4,2),
                    grupo VARCHAR(10),
                    tutor VARCHAR(255),
                    fecha_nacimiento DATE,
                    direccion TEXT,
                    status ENUM('activo', 'inactivo', 'egresado') DEFAULT 'activo',
                    user_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_matricula (matricula),
                    INDEX idx_semestre (semestre),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de docentes
            docentes: `
                CREATE TABLE IF NOT EXISTS docentes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    telefono VARCHAR(20),
                    especialidad VARCHAR(255),
                    materias JSON,
                    horario JSON,
                    activo BOOLEAN DEFAULT true,
                    fecha_ingreso DATE,
                    user_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_email (email),
                    INDEX idx_especialidad (especialidad),
                    INDEX idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de noticias
            noticias: `
                CREATE TABLE IF NOT EXISTS noticias (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    titulo VARCHAR(255) NOT NULL,
                    contenido TEXT NOT NULL,
                    resumen TEXT,
                    autor VARCHAR(255),
                    fecha_publicacion DATE,
                    categoria VARCHAR(100),
                    imagen VARCHAR(255),
                    activa BOOLEAN DEFAULT true,
                    destacada BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_fecha (fecha_publicacion),
                    INDEX idx_categoria (categoria),
                    INDEX idx_activa (activa),
                    INDEX idx_destacada (destacada)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de eventos
            eventos: `
                CREATE TABLE IF NOT EXISTS eventos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    titulo VARCHAR(255) NOT NULL,
                    descripcion TEXT,
                    fecha_inicio DATETIME NOT NULL,
                    fecha_fin DATETIME,
                    ubicacion VARCHAR(255),
                    categoria VARCHAR(100),
                    dirigido_a VARCHAR(100),
                    cupo_maximo INT,
                    inscripciones_abiertas BOOLEAN DEFAULT true,
                    activo BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_fecha_inicio (fecha_inicio),
                    INDEX idx_categoria (categoria),
                    INDEX idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de avisos
            avisos: `
                CREATE TABLE IF NOT EXISTS avisos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    titulo VARCHAR(255) NOT NULL,
                    contenido TEXT NOT NULL,
                    tipo ENUM('general', 'urgente', 'academico', 'administrativo') DEFAULT 'general',
                    dirigido_a JSON,
                    fecha_inicio DATE,
                    fecha_fin DATE,
                    activo BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_tipo (tipo),
                    INDEX idx_fecha_inicio (fecha_inicio),
                    INDEX idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de comunicados
            comunicados: `
                CREATE TABLE IF NOT EXISTS comunicados (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    titulo VARCHAR(255) NOT NULL,
                    contenido TEXT NOT NULL,
                    remitente VARCHAR(255),
                    destinatarios JSON,
                    fecha_publicacion DATETIME,
                    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
                    leido BOOLEAN DEFAULT false,
                    archivado BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_fecha_publicacion (fecha_publicacion),
                    INDEX idx_prioridad (prioridad),
                    INDEX idx_leido (leido)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de estadísticas
            estadisticas: `
                CREATE TABLE IF NOT EXISTS estadisticas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    tipo VARCHAR(100) NOT NULL,
                    valor DECIMAL(10,2),
                    valor_texto VARCHAR(255),
                    metadata JSON,
                    fecha DATE,
                    periodo VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_tipo (tipo),
                    INDEX idx_fecha (fecha),
                    INDEX idx_periodo (periodo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de finanzas
            finanzas: `
                CREATE TABLE IF NOT EXISTS finanzas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    concepto VARCHAR(255) NOT NULL,
                    tipo ENUM('ingreso', 'egreso') NOT NULL,
                    monto DECIMAL(10,2) NOT NULL,
                    categoria VARCHAR(100),
                    descripcion TEXT,
                    fecha_transaccion DATE,
                    referencia VARCHAR(100),
                    autorizado_por VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_tipo (tipo),
                    INDEX idx_fecha_transaccion (fecha_transaccion),
                    INDEX idx_categoria (categoria)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `,

            // Tabla de testimonios
            testimonios: `
                CREATE TABLE IF NOT EXISTS testimonios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    tipo ENUM('estudiante', 'egresado', 'padre', 'docente') NOT NULL,
                    testimonio TEXT NOT NULL,
                    calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5),
                    fecha DATE,
                    activo BOOLEAN DEFAULT true,
                    destacado BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_tipo (tipo),
                    INDEX idx_activo (activo),
                    INDEX idx_destacado (destacado)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `
        };

        try {
            for (const [tableName, sql] of Object.entries(tables)) {
                await this.connection.execute(sql);
                devLogger.log(`✅ Tabla ${tableName} creada/verificada`);
            }
        } catch (error) {
            devLogger.error('❌ Error creando tablas:', error.message);
            throw error;
        }
    }

    async readJSONFile(filename) {
        try {
            const filePath = path.join(dataPath, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            devLogger.error(`❌ Error leyendo ${filename}:`, error.message);
            return null;
        }
    }

    async migrateUsers() {
        devLogger.log('👥 Migrando usuarios...');
        const users = await this.readJSONFile(jsonFiles.users);

        if (!users || !Array.isArray(users)) {
            devLogger.log('⚠️ No se encontraron usuarios o formato inválido');
            return;
        }

        for (const user of users) {
            try {
                await this.connection.execute(
                    `INSERT INTO users (username, email, password_hash, nombre, apellido_paterno, role, active, created_at, last_login)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     username = VALUES(username), password_hash = VALUES(password_hash), nombre = VALUES(nombre)`,
                    [
                        user.username,
                        user.email,
                        user.password_hash,
                        user.nombre,
                        user.apellido_paterno || '',
                        user.role || 'student',
                        user.active !== false,
                        user.created_at || new Date(),
                        user.last_login || null
                    ]
                );
                this.migrationStats.migratedRecords++;
            } catch (error) {
                devLogger.error(`❌ Error migrando usuario ${user.email}:`, error.message);
                this.migrationStats.errors.push(`Usuario ${user.email}: ${error.message}`);
            }
        }

        devLogger.log(`✅ ${users.length} usuarios procesados`);
    }

    async migrateEstudiantes() {
        devLogger.log('🎓 Migrando estudiantes...');
        const data = await this.readJSONFile(jsonFiles.estudiantes);

        if (!data || !data.estudiantes || !Array.isArray(data.estudiantes)) {
            devLogger.log('⚠️ No se encontraron estudiantes o formato inválido');
            return;
        }

        const estudiantes = data.estudiantes;

        for (const estudiante of estudiantes) {
            try {
                await this.connection.execute(
                    `INSERT INTO estudiantes (id, matricula, nombre, email, telefono, semestre, promedio, grupo, tutor, fecha_nacimiento, direccion, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     nombre = VALUES(nombre), email = VALUES(email), semestre = VALUES(semestre), promedio = VALUES(promedio)`,
                    [
                        estudiante.id,
                        estudiante.matricula,
                        estudiante.nombre,
                        estudiante.email || null,
                        estudiante.telefono || null,
                        estudiante.semestre || null,
                        estudiante.promedio || null,
                        estudiante.grupo || null,
                        estudiante.tutor || null,
                        estudiante.fecha_nacimiento || null,
                        estudiante.direccion || null,
                        estudiante.status || 'activo'
                    ]
                );
                this.migrationStats.migratedRecords++;
            } catch (error) {
                devLogger.error(`❌ Error migrando estudiante ${estudiante.matricula}:`, error.message);
                this.migrationStats.errors.push(`Estudiante ${estudiante.matricula}: ${error.message}`);
            }
        }

        devLogger.log(`✅ ${estudiantes.length} estudiantes procesados`);
    }

    async migrateDocentes() {
        devLogger.log('👨‍🏫 Migrando docentes...');
        const data = await this.readJSONFile(jsonFiles.docentes);

        if (!data || !data.docentes || !Array.isArray(data.docentes)) {
            devLogger.log('⚠️ No se encontraron docentes o formato inválido');
            return;
        }

        const docentes = data.docentes;

        for (const docente of docentes) {
            try {
                await this.connection.execute(
                    `INSERT INTO docentes (nombre, email, telefono, especialidad, materias, horario, activo, fecha_ingreso)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     nombre = VALUES(nombre), telefono = VALUES(telefono), especialidad = VALUES(especialidad)`,
                    [
                        docente.nombre,
                        docente.email || null,
                        docente.telefono || null,
                        docente.especialidad || null,
                        JSON.stringify(docente.materias || []),
                        JSON.stringify(docente.horario || {}),
                        docente.activo !== false,
                        docente.fecha_ingreso || null
                    ]
                );
                this.migrationStats.migratedRecords++;
            } catch (error) {
                devLogger.error(`❌ Error migrando docente ${docente.nombre}:`, error.message);
                this.migrationStats.errors.push(`Docente ${docente.nombre}: ${error.message}`);
            }
        }

        devLogger.log(`✅ ${docentes.length} docentes procesados`);
    }

    async migrateNoticias() {
        devLogger.log('📰 Migrando noticias...');
        const data = await this.readJSONFile(jsonFiles.noticias);

        if (!data || !data.noticias || !Array.isArray(data.noticias)) {
            devLogger.log('⚠️ No se encontraron noticias o formato inválido');
            return;
        }

        const noticias = data.noticias;

        for (const noticia of noticias) {
            try {
                await this.connection.execute(
                    `INSERT INTO noticias (titulo, contenido, resumen, autor, fecha_publicacion, categoria, imagen, activa, destacada)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        noticia.titulo,
                        noticia.contenido,
                        noticia.resumen || null,
                        noticia.autor || null,
                        noticia.fecha || new Date(),
                        noticia.categoria || 'general',
                        noticia.imagen || null,
                        noticia.activa !== false,
                        noticia.destacada === true
                    ]
                );
                this.migrationStats.migratedRecords++;
            } catch (error) {
                devLogger.error(`❌ Error migrando noticia "${noticia.titulo}":`, error.message);
                this.migrationStats.errors.push(`Noticia "${noticia.titulo}": ${error.message}`);
            }
        }

        devLogger.log(`✅ ${noticias.length} noticias procesadas`);
    }

    async migrateEventos() {
        devLogger.log('📅 Migrando eventos...');
        const data = await this.readJSONFile(jsonFiles.eventos);

        if (!data || !data.eventos || !Array.isArray(data.eventos)) {
            devLogger.log('⚠️ No se encontraron eventos o formato inválido');
            return;
        }

        const eventos = data.eventos;

        for (const evento of eventos) {
            try {
                await this.connection.execute(
                    `INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, categoria, dirigido_a, cupo_maximo, inscripciones_abiertas, activo)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        evento.titulo,
                        evento.descripcion || null,
                        evento.fecha || new Date(),
                        evento.fecha_fin || null,
                        evento.ubicacion || null,
                        evento.categoria || 'general',
                        evento.dirigido_a || null,
                        evento.cupo_maximo || null,
                        evento.inscripciones_abiertas !== false,
                        evento.activo !== false
                    ]
                );
                this.migrationStats.migratedRecords++;
            } catch (error) {
                devLogger.error(`❌ Error migrando evento "${evento.titulo}":`, error.message);
                this.migrationStats.errors.push(`Evento "${evento.titulo}": ${error.message}`);
            }
        }

        devLogger.log(`✅ ${eventos.length} eventos procesados`);
    }

    async migrateDashboardStats() {
        devLogger.log('📊 Migrando estadísticas...');
        const stats = await this.readJSONFile(jsonFiles.estadisticas);

        if (!stats) {
            devLogger.log('⚠️ No se encontraron estadísticas');
            return;
        }

        let recordCount = 0;

        for (const [key, value] of Object.entries(stats)) {
            try {
                let valorNumerico = null;
                let valorTexto = null;

                if (typeof value === 'number') {
                    valorNumerico = value;
                } else if (typeof value === 'string') {
                    valorTexto = value;
                } else {
                    valorTexto = JSON.stringify(value);
                }

                await this.connection.execute(
                    `INSERT INTO estadisticas (tipo, valor, valor_texto, fecha, periodo)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE valor = VALUES(valor), valor_texto = VALUES(valor_texto)`,
                    [
                        key,
                        valorNumerico,
                        valorTexto,
                        new Date(),
                        'mensual'
                    ]
                );

                recordCount++;
                this.migrationStats.migratedRecords++;
            } catch (error) {
                devLogger.error(`❌ Error migrando estadística ${key}:`, error.message);
                this.migrationStats.errors.push(`Estadística ${key}: ${error.message}`);
            }
        }

        devLogger.log(`✅ ${recordCount} estadísticas procesadas`);
    }

    async runMigration() {
        devLogger.log('🚀 INICIANDO MIGRACIÓN JSON → MySQL');
        devLogger.log('=====================================');

        const startTime = Date.now();

        try {
            await this.initialize();

            // Ejecutar migraciones en orden
            await this.migrateUsers();
            await this.migrateEstudiantes();
            await this.migrateDocentes();
            await this.migrateNoticias();
            await this.migrateEventos();
            await this.migrateDashboardStats();

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            devLogger.log('\n📈 RESUMEN DE MIGRACIÓN');
            devLogger.log('=======================');
            devLogger.log(`✅ Registros migrados: ${this.migrationStats.migratedRecords}`);
            devLogger.log(`⏱️ Tiempo transcurrido: ${duration}s`);
            devLogger.log(`❌ Errores: ${this.migrationStats.errors.length}`);

            if (this.migrationStats.errors.length > 0) {
                devLogger.log('\n🚨 ERRORES ENCONTRADOS:');
                this.migrationStats.errors.forEach(error => devLogger.log(`  • ${error}`));
            }

            devLogger.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');

        } catch (error) {
            devLogger.error('💥 ERROR CRÍTICO EN MIGRACIÓN:', error.message);
            throw error;
        } finally {
            if (this.connection) {
                await this.connection.end();
                devLogger.log('🔌 Conexión MySQL cerrada');
            }
        }
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    const migrator = new JSONToMySQLMigrator();
    migrator.runMigration()
        .then(() => {
            devLogger.log('✅ Script de migración terminado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            devLogger.error('❌ Script de migración falló:', error.message);
            process.exit(1);
        });
}

module.exports = JSONToMySQLMigrator;