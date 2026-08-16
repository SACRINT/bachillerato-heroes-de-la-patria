"use strict";
/**
 * HEALTH CHECK ENDPOINT - TypeScript
 * Endpoint para verificar el estado del sistema en producción
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// ✅ FASE 3: Using DAO layer
const health_dao_1 = __importDefault(require('../data/health.dao.js'));
// Importar pool manager
const pool_manager_1 = __importDefault(require('../middleware/pool-manager.js'));
const router = express_1.default.Router();
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/health
 * Endpoint de health check completo del sistema
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
            const dbInfo = await health_dao_1.default.getDbInfo();
            const dbLatency = Date.now() - dbStart;
            const poolStats = health_dao_1.default.getPoolStats();
            healthCheck.services.database = {
                status: 'healthy',
                latency: `${dbLatency}ms`,
                connection: 'active',
                type: 'PostgreSQL',
                version: dbInfo.pg_version.split(' ')[1],
                current_time: dbInfo.current_time,
                pool: poolStats
            };
        }
        catch (dbError) {
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
        const totalMemory = os_1.default.totalmem();
        const freeMemory = os_1.default.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);
        healthCheck.services.memory = {
            status: parseFloat(memoryUsagePercent) < 90 ? 'healthy' : 'warning',
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
        if (parseFloat(memoryUsagePercent) >= 90) {
            healthCheck.status = 'degraded';
        }
        // ============================================
        // 3. VERIFICAR CPU
        // ============================================
        const cpus = os_1.default.cpus();
        const cpuCount = cpus.length;
        const loadAverage = os_1.default.loadavg();
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
        // 4. VERIFICAR DISCO
        // ============================================
        try {
            let diskInfo = { status: 'unknown' };
            if (os_1.default.platform() === 'win32') {
                try {
                    const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
                    const lines = stdout.trim().split('\n').slice(1);
                    let totalSpace = 0;
                    let totalFree = 0;
                    lines.forEach((line) => {
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
                        status: parseFloat(usagePercent) < 90 ? 'healthy' : 'warning',
                        total: `${(totalSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        free: `${(totalFree / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        used: `${(usedSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
                        usagePercent: `${usagePercent}%`
                    };
                }
                catch (wmicError) {
                    diskInfo = {
                        status: 'unknown',
                        message: 'No se pudo obtener información del disco en Windows',
                        error: wmicError.message
                    };
                }
            }
            else {
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
                }
                catch (dfError) {
                    diskInfo = {
                        status: 'unknown',
                        message: 'No se pudo obtener información del disco',
                        error: dfError.message
                    };
                }
            }
            healthCheck.services.disk = diskInfo;
            if (diskInfo.usagePercent && parseFloat(diskInfo.usagePercent) >= 90) {
                healthCheck.status = 'degraded';
            }
        }
        catch (diskError) {
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
            platform: os_1.default.platform(),
            arch: os_1.default.arch(),
            hostname: os_1.default.hostname(),
            nodeVersion: process.version,
            uptime: `${(os_1.default.uptime() / 3600).toFixed(2)} hours`,
            processUptime: `${(process.uptime() / 60).toFixed(2)} minutes`
        };
        // ============================================
        // 6. VERIFICAR CACHÉ
        // ============================================
        healthCheck.services.cache = {
            status: 'not_implemented',
            message: 'Sistema de caché no configurado'
        };
        // ============================================
        // DETERMINAR ESTADO GLOBAL
        // ============================================
        const unhealthyServices = Object.values(healthCheck.services).filter((service) => service?.status === 'unhealthy');
        if (unhealthyServices.length > 0) {
            healthCheck.status = 'unhealthy';
        }
        const statusCode = healthCheck.status === 'ok' ? 200 :
            healthCheck.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(healthCheck);
    }
    catch (error) {
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
        await health_dao_1.default.ping();
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});
/**
 * GET /api/health/db
 * Health check solo de base de datos
 */
router.get('/db', async (req, res) => {
    try {
        const dbHealth = await health_dao_1.default.getDbHealth();
        res.status(200).json({
            status: 'healthy',
            latency: `${dbHealth.latency}ms`,
            connection: 'active',
            time: dbHealth.time,
            version: dbHealth.version
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
// ============================================
// CONNECTION POOL MANAGER ENDPOINTS
// ============================================
/**
 * GET /api/health/pool
 * Estado actual del connection pool
 */
router.get('/pool', pool_manager_1.default.getPoolStatusEndpoint);
/**
 * GET /api/health/pool/history
 * Histórico de métricas del pool
 */
router.get('/pool/history', pool_manager_1.default.getPoolHistoryEndpoint);
/**
 * GET /api/health/pool/stats
 * Estadísticas resumidas del pool
 */
router.get('/pool/stats', pool_manager_1.default.getPoolStatsEndpoint);
exports.default = router;
//# sourceMappingURL=health.js.map