/**
 * HEALTH CHECK ENDPOINT
 * Endpoint para verificar el estado del sistema en producción
 * Fecha: 18 de Octubre, 2025
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Importar pool de PostgreSQL
const pool = require('../config/database');

/**
 * GET /api/health
 * Endpoint de health check completo del sistema
 *
 * Verifica:
 * - Estado de la base de datos
 * - Estado del caché (si aplica)
 * - Uso de memoria
 * - Uso de disco
 * - Tiempo de actividad del servidor
 * - Versión de Node.js
 */
router.get('/', async (req, res) => {
    const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.version,
        services: {}
    };

    try {
        // ============================================
        // 1. VERIFICAR BASE DE DATOS
        // ============================================
        try {
            const dbStart = Date.now();
            const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
            const dbLatency = Date.now() - dbStart;

            // Obtener estadísticas de conexiones del pool
            const poolStats = {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount
            };

            healthCheck.services.database = {
                status: 'healthy',
                latency: `${dbLatency}ms`,
                connection: 'active',
                type: 'PostgreSQL',
                version: result.rows[0].pg_version.split(' ')[1],
                current_time: result.rows[0].current_time,
                pool: poolStats
            };
        } catch (dbError) {
            healthCheck.status = 'degraded';
            healthCheck.services.database = {
                status: 'unhealthy',
                error: dbError.message,
                connection: 'failed'
            };
        }

        // ============================================
        // 2. VERIFICAR MEMORIA
        // ============================================
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

        healthCheck.services.memory = {
            status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
            process: {
                rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
            },
            system: {
                total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                usagePercent: `${memoryUsagePercent}%`
            }
        };

        // Advertencia si el uso de memoria del sistema es alto
        if (memoryUsagePercent >= 90) {
            healthCheck.status = 'degraded';
        }

        // ============================================
        // 3. VERIFICAR CPU
        // ============================================
        const cpus = os.cpus();
        const cpuCount = cpus.length;
        const loadAverage = os.loadavg();

        healthCheck.services.cpu = {
            status: 'healthy',
            cores: cpuCount,
            model: cpus[0].model,
            loadAverage: {
                '1min': loadAverage[0].toFixed(2),
                '5min': loadAverage[1].toFixed(2),
                '15min': loadAverage[2].toFixed(2)
            }
        };

        // ============================================
        // 4. VERIFICAR DISCO (Espacio Disponible)
        // ============================================
        try {
            let diskInfo = {};

            // Verificación específica por plataforma
            if (os.platform() === 'win32') {
                // Windows: usar wmic
                try {
                    const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
                    const lines = stdout.trim().split('\n').slice(1); // Omitir encabezado

                    let totalSpace = 0;
                    let totalFree = 0;

                    lines.forEach(line => {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length >= 3 && parts[1] !== '') {
                            const free = parseInt(parts[1]);
                            const total = parseInt(parts[2]);
                            if (!isNaN(free) && !isNaN(total)) {
                                totalFree += free;
                                totalSpace += total;
                            }
                        }
                    });

                    const usedSpace = totalSpace - totalFree;
                    const usagePercent = ((usedSpace / totalSpace) * 100).toFixed(2);

                    diskInfo = {
                        status: usagePercent < 90 ? 'healthy' : 'warning',
                        total: `${(totalSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        free: `${(totalFree / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        used: `${(usedSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        usagePercent: `${usagePercent}%`
                    };
                } catch (wmicError) {
                    diskInfo = {
                        status: 'unknown',
                        message: 'No se pudo obtener información del disco en Windows',
                        error: wmicError.message
                    };
                }
            } else {
                // Linux/Mac: usar df
                try {
                    const { stdout } = await execAsync('df -k /');
                    const lines = stdout.trim().split('\n');
                    const data = lines[1].split(/\s+/);

                    const total = parseInt(data[1]) * 1024;
                    const used = parseInt(data[2]) * 1024;
                    const available = parseInt(data[3]) * 1024;
                    const usagePercent = parseFloat(data[4].replace('%', ''));

                    diskInfo = {
                        status: usagePercent < 90 ? 'healthy' : 'warning',
                        total: `${(total / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        free: `${(available / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        used: `${(used / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        usagePercent: `${usagePercent}%`
                    };
                } catch (dfError) {
                    diskInfo = {
                        status: 'unknown',
                        message: 'No se pudo obtener información del disco',
                        error: dfError.message
                    };
                }
            }

            healthCheck.services.disk = diskInfo;

            // Advertencia si el uso de disco es alto
            if (diskInfo.usagePercent && parseFloat(diskInfo.usagePercent) >= 90) {
                healthCheck.status = 'degraded';
            }
        } catch (diskError) {
            healthCheck.services.disk = {
                status: 'unknown',
                error: diskError.message
            };
        }

        // ============================================
        // 5. INFORMACIÓN DEL SISTEMA
        // ============================================
        healthCheck.services.system = {
            status: 'healthy',
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            nodeVersion: process.version,
            uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
            processUptime: `${(process.uptime() / 60).toFixed(2)} minutes`
        };

        // ============================================
        // 6. VERIFICAR CACHÉ (Si existe middleware de caché)
        // ============================================
        // Nota: Si se implementa un sistema de caché (Redis, etc.), verificar aquí
        healthCheck.services.cache = {
            status: 'not_implemented',
            message: 'Sistema de caché no configurado'
        };

        // ============================================
        // DETERMINAR ESTADO GLOBAL
        // ============================================
        const unhealthyServices = Object.values(healthCheck.services).filter(
            service => service.status === 'unhealthy'
        );

        if (unhealthyServices.length > 0) {
            healthCheck.status = 'unhealthy';
        }

        // Código HTTP según el estado
        const statusCode = healthCheck.status === 'ok' ? 200 :
                          healthCheck.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(healthCheck);

    } catch (error) {
        // Error crítico en el health check
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/health/simple
 * Health check simplificado para balanceadores de carga
 */
router.get('/simple', async (req, res) => {
    try {
        // Solo verificar si el servidor responde
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

/**
 * GET /api/health/db
 * Health check solo de base de datos
 */
router.get('/db', async (req, res) => {
    try {
        const start = Date.now();
        const result = await pool.query('SELECT NOW() as time, version() as version');
        const latency = Date.now() - start;

        res.status(200).json({
            status: 'healthy',
            latency: `${latency}ms`,
            connection: 'active',
            time: result.rows[0].time,
            version: result.rows[0].version
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;
