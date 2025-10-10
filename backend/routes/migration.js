/**
 * 🔄 RUTAS API PARA MIGRACIÓN JSON → MySQL
 * Sistema de migración de datos con interfaz web
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const JSONToMySQLMigrator = require('../scripts/migrate-json-to-mysql');

/**
 * POST /api/migration/start
 * Iniciar migración de datos JSON a MySQL
 */
router.post('/start', authenticateToken, async (req, res) => {
    try {
        // Solo administradores pueden ejecutar migraciones
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: 'Solo administradores pueden ejecutar migraciones'
            });
        }

        console.log(`🔄 Iniciando migración JSON→MySQL por: ${req.user.email}`);

        const migrator = new JSONToMySQLMigrator();

        // Ejecutar migración de forma asíncrona
        migrator.runMigration()
            .then((stats) => {
                console.log('✅ Migración completada exitosamente');
            })
            .catch((error) => {
                console.error('❌ Error en migración:', error.message);
            });

        res.json({
            success: true,
            message: 'Migración iniciada exitosamente',
            data: {
                status: 'en_progreso',
                iniciado_por: req.user.email,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error iniciando migración:', error);
        res.status(500).json({
            success: false,
            error: 'Error iniciando migración',
            message: error.message
        });
    }
});

/**
 * GET /api/migration/status
 * Obtener estado del sistema de migración
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const db = require('../config/database');

        // Verificar conectividad MySQL
        let mysqlStatus = 'desconectado';
        let tablesInfo = {};

        try {
            const isConnected = await db.testConnection();
            if (isConnected) {
                mysqlStatus = 'conectado';

                // Obtener información de tablas
                const tables = await db.executeQuery('SHOW TABLES');
                tablesInfo = {
                    total_tablas: tables.length,
                    tablas: tables.map(row => Object.values(row)[0])
                };
            }
        } catch (error) {
            mysqlStatus = 'error';
        }

        // Verificar archivos JSON
        const fs = require('fs/promises');
        const path = require('path');
        const dataPath = path.join(__dirname, '../../data');

        let jsonFiles = [];
        try {
            const files = await fs.readdir(dataPath);
            jsonFiles = files.filter(file => file.endsWith('.json'));
        } catch (error) {
            jsonFiles = [];
        }

        res.json({
            success: true,
            message: 'Estado del sistema de migración',
            data: {
                mysql: {
                    status: mysqlStatus,
                    configuracion: {
                        host: process.env.DB_HOST || 'localhost',
                        puerto: process.env.DB_PORT || 3306,
                        base_datos: process.env.DB_NAME || 'heroes_patria_db'
                    },
                    tablas: tablesInfo
                },
                archivos_json: {
                    total: jsonFiles.length,
                    archivos: jsonFiles,
                    ruta: dataPath
                },
                sistema: {
                    fallback_activo: process.env.USE_JSON_FALLBACK === 'true',
                    modo_actual: mysqlStatus === 'conectado' ? 'mysql' : 'json'
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error obteniendo estado de migración:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estado',
            message: error.message
        });
    }
});

/**
 * GET /api/migration/preview
 * Vista previa de datos para migración
 */
router.get('/preview', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado'
            });
        }

        const fs = require('fs/promises');
        const path = require('path');
        const dataPath = path.join(__dirname, '../../data');

        const preview = {};
        const jsonFiles = ['users.json', 'estudiantes.json', 'docentes.json', 'noticias.json'];

        for (const filename of jsonFiles) {
            try {
                const filePath = path.join(dataPath, filename);
                const data = await fs.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);

                let count = 0;
                let sample = null;

                if (Array.isArray(jsonData)) {
                    count = jsonData.length;
                    sample = jsonData[0] || null;
                } else if (jsonData.estudiantes) {
                    count = jsonData.estudiantes.length;
                    sample = jsonData.estudiantes[0] || null;
                } else if (jsonData.docentes) {
                    count = jsonData.docentes.length;
                    sample = jsonData.docentes[0] || null;
                } else if (jsonData.noticias) {
                    count = jsonData.noticias.length;
                    sample = jsonData.noticias[0] || null;
                } else {
                    count = Object.keys(jsonData).length;
                    sample = jsonData;
                }

                preview[filename.replace('.json', '')] = {
                    archivo: filename,
                    registros: count,
                    muestra: sample
                };

            } catch (error) {
                preview[filename.replace('.json', '')] = {
                    archivo: filename,
                    error: `No disponible: ${error.message}`
                };
            }
        }

        res.json({
            success: true,
            message: 'Vista previa de datos JSON',
            data: preview,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error generando vista previa:', error);
        res.status(500).json({
            success: false,
            error: 'Error generando vista previa',
            message: error.message
        });
    }
});

/**
 * POST /api/migration/force-mysql
 * Forzar uso de MySQL (deshabilitar fallback JSON)
 */
router.post('/force-mysql', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado'
            });
        }

        const db = require('../config/database');

        // Verificar que MySQL esté disponible
        const isConnected = await db.testConnection();

        if (!isConnected) {
            return res.status(400).json({
                success: false,
                error: 'MySQL no disponible',
                message: 'No se puede forzar MySQL cuando no está conectado'
            });
        }

        // Forzar uso de MySQL
        await db.forceMySQL();

        console.log(`✅ Forzado uso de MySQL por: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Sistema configurado para usar MySQL exclusivamente',
            data: {
                modo_anterior: 'fallback_json',
                modo_actual: 'mysql_forzado',
                configurado_por: req.user.email,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error forzando MySQL:', error);
        res.status(500).json({
            success: false,
            error: 'Error configurando MySQL',
            message: error.message
        });
    }
});

/**
 * POST /api/migration/enable-fallback
 * Habilitar fallback JSON (modo híbrido)
 */
router.post('/enable-fallback', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado'
            });
        }

        const db = require('../config/database');

        // Habilitar modo híbrido
        await db.enableFallback();

        console.log(`✅ Habilitado fallback JSON por: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Sistema configurado en modo híbrido (MySQL + JSON fallback)',
            data: {
                modo_anterior: 'mysql_forzado',
                modo_actual: 'hibrido',
                configurado_por: req.user.email,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error habilitando fallback:', error);
        res.status(500).json({
            success: false,
            error: 'Error configurando fallback',
            message: error.message
        });
    }
});

/**
 * GET /api/migration/tables-info
 * Información detallada de tablas MySQL
 */
router.get('/tables-info', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado'
            });
        }

        const db = require('../config/database');

        const isConnected = await db.testConnection();
        if (!isConnected) {
            return res.status(400).json({
                success: false,
                error: 'MySQL no disponible'
            });
        }

        const tablesInfo = {};
        const tables = ['users', 'estudiantes', 'docentes', 'noticias', 'eventos', 'avisos', 'comunicados', 'estadisticas'];

        for (const table of tables) {
            try {
                const count = await db.executeQuery(`SELECT COUNT(*) as total FROM ${table}`);
                const sample = await db.executeQuery(`SELECT * FROM ${table} LIMIT 1`);

                tablesInfo[table] = {
                    registros: count[0]?.total || 0,
                    muestra: sample[0] || null,
                    estado: 'disponible'
                };
            } catch (error) {
                tablesInfo[table] = {
                    registros: 0,
                    muestra: null,
                    estado: 'no_existe',
                    error: error.message
                };
            }
        }

        res.json({
            success: true,
            message: 'Información de tablas MySQL',
            data: {
                tablas: tablesInfo,
                total_registros: Object.values(tablesInfo).reduce((sum, info) => sum + (info.registros || 0), 0)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error obteniendo info de tablas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo información de tablas',
            message: error.message
        });
    }
});

module.exports = router;