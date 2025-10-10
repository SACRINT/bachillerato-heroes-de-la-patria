/**
 * 🔧 RUTAS DE MANTENIMIENTO - BGE HÉROES DE LA PATRIA
 * APIs para herramientas de mantenimiento y diagnóstico del sistema
 */

const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { getMaintenanceTools } = require('../services/maintenanceTools');
const { logger } = require('../middleware/logger');
const router = express.Router();

// Aplicar autenticación de admin a todas las rutas de mantenimiento
router.use(requireAdmin);

/**
 * GET /api/maintenance/diagnostic
 * Obtener diagnóstico completo del sistema
 */
router.get('/diagnostic', async (req, res, next) => {
    try {
        console.log('🔧 [MAINTENANCE API] Ejecutando diagnóstico del sistema');

        const maintenanceTools = getMaintenanceTools();
        const diagnostic = await maintenanceTools.systemDiagnostic();

        await logger.info('Diagnóstico del sistema ejecutado', {
            userId: req.user.id,
            systemHealth: diagnostic.summary.overallHealth
        });

        res.json({
            success: true,
            data: diagnostic,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/maintenance/health
 * Verificar salud del sistema (versión rápida)
 */
router.get('/health', async (req, res, next) => {
    try {
        console.log('💚 [MAINTENANCE API] Verificando salud del sistema');

        const maintenanceTools = getMaintenanceTools();
        const health = await maintenanceTools.quickHealthCheck();

        res.json({
            success: true,
            data: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/cleanup
 * Ejecutar limpieza del sistema
 */
router.post('/cleanup', async (req, res, next) => {
    try {
        const { options = {} } = req.body;

        console.log('🧹 [MAINTENANCE API] Ejecutando limpieza del sistema');

        const maintenanceTools = getMaintenanceTools();
        const result = await maintenanceTools.cleanupSystem(options);

        await logger.warn('Limpieza del sistema ejecutada', {
            userId: req.user.id,
            spaceFreed: result.spaceFreed,
            operationsCount: result.operations.length
        });

        res.json({
            success: true,
            message: 'Limpieza del sistema completada',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/maintenance/performance
 * Obtener análisis de rendimiento
 */
router.get('/performance', async (req, res, next) => {
    try {
        console.log('📊 [MAINTENANCE API] Analizando rendimiento del sistema');

        const maintenanceTools = getMaintenanceTools();
        const performance = await maintenanceTools.performanceAnalysis();

        res.json({
            success: true,
            data: performance,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/optimize-database
 * Optimizar base de datos
 */
router.post('/optimize-database', async (req, res, next) => {
    try {
        console.log('🗃️ [MAINTENANCE API] Optimizando base de datos');

        const maintenanceTools = getMaintenanceTools();
        const result = await maintenanceTools.optimizeDatabase();

        await logger.info('Optimización de base de datos ejecutada', {
            userId: req.user.id,
            success: result.success,
            operationsCount: result.operations?.length || 0
        });

        res.json({
            success: true,
            message: 'Optimización de base de datos completada',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/maintenance/integrity-check
 * Verificar integridad del sistema
 */
router.get('/integrity-check', async (req, res, next) => {
    try {
        console.log('🔍 [MAINTENANCE API] Verificando integridad del sistema');

        const maintenanceTools = getMaintenanceTools();
        const integrity = await maintenanceTools.checkSystemIntegrity();

        await logger.info('Verificación de integridad ejecutada', {
            userId: req.user.id,
            issuesFound: integrity.issues?.length || 0,
            overallStatus: integrity.overall.status
        });

        res.json({
            success: true,
            data: integrity,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/maintenance/storage-analysis
 * Análisis de almacenamiento
 */
router.get('/storage-analysis', async (req, res, next) => {
    try {
        console.log('💾 [MAINTENANCE API] Analizando almacenamiento');

        const maintenanceTools = getMaintenanceTools();
        const storage = await maintenanceTools.storageAnalysis();

        res.json({
            success: true,
            data: storage,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/restart-services
 * Reiniciar servicios específicos
 */
router.post('/restart-services', async (req, res, next) => {
    try {
        const { services = [] } = req.body;

        if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Lista de servicios requerida',
                message: 'Proporcione un array de servicios a reiniciar'
            });
        }

        console.log(`🔄 [MAINTENANCE API] Reiniciando servicios: ${services.join(', ')}`);

        const maintenanceTools = getMaintenanceTools();
        const result = await maintenanceTools.restartServices(services);

        await logger.warn('Servicios reiniciados', {
            userId: req.user.id,
            services: services,
            success: result.success
        });

        res.json({
            success: true,
            message: 'Servicios procesados',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/maintenance/system-logs
 * Obtener logs del sistema con filtros
 */
router.get('/system-logs', async (req, res, next) => {
    try {
        const {
            level = 'info',
            category = 'general',
            limit = 100,
            since = null
        } = req.query;

        console.log(`📋 [MAINTENANCE API] Obteniendo logs del sistema (${level}/${category})`);

        const maintenanceTools = getMaintenanceTools();
        const logs = await maintenanceTools.getSystemLogs({
            level,
            category,
            limit: parseInt(limit),
            since: since ? new Date(since) : null
        });

        res.json({
            success: true,
            data: {
                logs: logs,
                filters: { level, category, limit, since },
                total: logs.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/generate-report
 * Generar reporte completo de mantenimiento
 */
router.post('/generate-report', async (req, res, next) => {
    try {
        const { includeDetails = true, format = 'json' } = req.body;

        console.log('📊 [MAINTENANCE API] Generando reporte de mantenimiento');

        const maintenanceTools = getMaintenanceTools();
        const report = await maintenanceTools.generateMaintenanceReport({
            includeDetails,
            format
        });

        await logger.info('Reporte de mantenimiento generado', {
            userId: req.user.id,
            format: format,
            includeDetails: includeDetails
        });

        res.json({
            success: true,
            message: 'Reporte de mantenimiento generado',
            data: report
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/maintenance/scheduled-tasks
 * Obtener información de tareas programadas
 */
router.get('/scheduled-tasks', async (req, res, next) => {
    try {
        console.log('⏰ [MAINTENANCE API] Consultando tareas programadas');

        const maintenanceTools = getMaintenanceTools();
        const tasks = await maintenanceTools.getScheduledTasks();

        res.json({
            success: true,
            data: tasks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/schedule-task
 * Programar nueva tarea de mantenimiento
 */
router.post('/schedule-task', async (req, res, next) => {
    try {
        const {
            name,
            description,
            cronExpression,
            action,
            enabled = true
        } = req.body;

        if (!name || !cronExpression || !action) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren name, cronExpression y action'
            });
        }

        console.log(`⏰ [MAINTENANCE API] Programando nueva tarea: ${name}`);

        const maintenanceTools = getMaintenanceTools();
        const result = await maintenanceTools.scheduleMaintenanceTask({
            name,
            description,
            cronExpression,
            action,
            enabled
        });

        await logger.info('Nueva tarea programada', {
            userId: req.user.id,
            taskName: name,
            cronExpression: cronExpression
        });

        res.json({
            success: true,
            message: 'Tarea programada exitosamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;