/**
 * 🔧 RUTAS DE MANTENIMIENTO - BGE HÉROES DE LA PATRIA
 * APIs para herramientas de mantenimiento y diagnóstico del sistema
 */

import express, { Request, Response, NextFunction } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';
// @ts-ignore
import { requireAdmin } from '../middleware/auth';
// @ts-ignore
import { getMaintenanceTools } from '../services/maintenanceTools';

const router = express.Router();

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
        [key: string]: any;
    };
}

// Aplicar autenticación de admin a todas las rutas de mantenimiento
// Note: We cast requireAdmin to any because Express types might mismtach with middleware signature
router.use(requireAdmin as any);

/**
 * GET /api/maintenance/diagnostic
 * Obtener diagnóstico completo del sistema
 */
router.get('/diagnostic', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '🔧 [MAINTENANCE API] Ejecutando diagnóstico del sistema');

        const maintenanceTools = getMaintenanceTools();
        const diagnostic = await maintenanceTools.systemDiagnostic();

        if (req.user) {
            debugLog.log('MAINTENANCE', 'Diagnóstico del sistema ejecutado', {
                userId: req.user.id,
                // @ts-ignore
                systemHealth: diagnostic.summary?.overallHealth || diagnostic.system?.uptimeFormatted
            });
        }

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
router.get('/health', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '💚 [MAINTENANCE API] Verificando salud del sistema');

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore - Check if quickHealthCheck exists on instance
        const health = await maintenanceTools.quickHealthCheck();

        res.json({
            success: true,
            data: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Fallback if quickHealthCheck doesn't exist but systemDiagnostic does
        try {
            const maintenanceTools = getMaintenanceTools();
            const diagnostic = await maintenanceTools.systemDiagnostic();
            res.json({
                success: true,
                data: { status: 'online', diagnostic },
                timestamp: new Date().toISOString()
            });
        } catch (innerError) {
            next(error);
        }
    }
});

/**
 * POST /api/maintenance/cleanup
 * Ejecutar limpieza del sistema
 */
router.post('/cleanup', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { options = {} } = req.body;

        debugLog.log('MAINTENANCE', '🧹 [MAINTENANCE API] Ejecutando limpieza del sistema');

        const maintenanceTools = getMaintenanceTools();
        const result = await maintenanceTools.cleanupSystem(options);

        if (req.user) {
            debugLog.log('MAINTENANCE', 'Limpieza del sistema ejecutada', {
                userId: req.user.id,
                spaceFreed: result.totalSpaceFreed || result.spaceFreed,
                // @ts-ignore
                operationsCount: result.operations?.length || result.cleaned?.length
            });
        }

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
router.get('/performance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '📊 [MAINTENANCE API] Analizando rendimiento del sistema');

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore
        const performance = await maintenanceTools.performanceAnalysis ? await maintenanceTools.performanceAnalysis() : await maintenanceTools.getPerformanceInfo();

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
router.post('/optimize-database', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '🗃️ [MAINTENANCE API] Optimizando base de datos');

        const maintenanceTools = getMaintenanceTools();
        const result = await maintenanceTools.optimizeDatabase();

        if (req.user) {
            debugLog.log('MAINTENANCE', 'Optimización de base de datos ejecutada', {
                userId: req.user.id,
                // @ts-ignore
                success: result.success !== undefined ? result.success : true,
                // @ts-ignore
                operationsCount: result.operations?.length || result.optimizations?.length || 0
            });
        }

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
router.get('/integrity-check', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '🔍 [MAINTENANCE API] Verificando integridad del sistema');

        const maintenanceTools = getMaintenanceTools();
        const integrity = await maintenanceTools.checkSystemIntegrity();

        if (req.user) {
            debugLog.log('MAINTENANCE', 'Verificación de integridad ejecutada', {
                userId: req.user.id,
                issuesFound: integrity.issues?.length || 0,
                overallStatus: integrity.overall || 'unknown'
            });
        }

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
router.get('/storage-analysis', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '💾 [MAINTENANCE API] Analizando almacenamiento');

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore
        const storage = await maintenanceTools.storageAnalysis ? await maintenanceTools.storageAnalysis() : await maintenanceTools.getStorageInfo();

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
router.post('/restart-services', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { services = [] } = req.body;

        if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Lista de servicios requerida',
                message: 'Proporcione un array de servicios a reiniciar'
            });
        }

        debugLog.log('MAINTENANCE', `🔄 [MAINTENANCE API] Reiniciando servicios: ${services.join(', ')}`);

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore - Check availability
        if (!maintenanceTools.restartServices) {
            return res.status(501).json({
                success: false,
                message: 'Reinicio de servicios no implementado en esta plataforma'
            });
        }

        // @ts-ignore
        const result = await maintenanceTools.restartServices(services);

        if (req.user) {
            debugLog.log('MAINTENANCE', 'Servicios reiniciados', {
                userId: req.user.id,
                services: services,
                success: result.success
            });
        }

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
router.get('/system-logs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const {
            level = 'info',
            category = 'general',
            limit = '100',
            since = null
        } = req.query;

        debugLog.log('MAINTENANCE', `📋 [MAINTENANCE API] Obteniendo logs del sistema (${level}/${category})`);

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore
        if (maintenanceTools.getSystemLogs) {
            // @ts-ignore
            const logs = await maintenanceTools.getSystemLogs({
                level: level as string,
                category: category as string,
                limit: parseInt(limit as string),
                since: since ? new Date(since as string) : null
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
        } else {
            // Fallback
            const logsInfo = await maintenanceTools.getLogsInfo();
            res.json({
                success: true,
                data: {
                    logs: [],
                    info: logsInfo,
                    message: "Log retrieval not fully implemented in tools"
                }
            });
        }

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/generate-report
 * Generar reporte completo de mantenimiento
 */
router.post('/generate-report', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { includeDetails = true, format = 'json' } = req.body;

        debugLog.log('MAINTENANCE', '📊 [MAINTENANCE API] Generando reporte de mantenimiento');

        const maintenanceTools = getMaintenanceTools();
        const report = await maintenanceTools.generateMaintenanceReport({
            includeDetails,
            format: format as string
        });

        if (req.user) {
            debugLog.log('MAINTENANCE', 'Reporte de mantenimiento generado', {
                userId: req.user.id,
                format: format,
                includeDetails: includeDetails
            });
        }

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
router.get('/scheduled-tasks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        debugLog.log('MAINTENANCE', '⏰ [MAINTENANCE API] Consultando tareas programadas');

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore
        if (maintenanceTools.getScheduledTasks) {
            // @ts-ignore
            const tasks = await maintenanceTools.getScheduledTasks();
            res.json({
                success: true,
                data: tasks,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: true,
                data: [],
                message: "Scheduled tasks not supported"
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/maintenance/schedule-task
 * Programar nueva tarea de mantenimiento
 */
router.post('/schedule-task', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

        debugLog.log('MAINTENANCE', `⏰ [MAINTENANCE API] Programando nueva tarea: ${name}`);

        const maintenanceTools = getMaintenanceTools();
        // @ts-ignore
        if (maintenanceTools.scheduleMaintenanceTask) {
            // @ts-ignore
            const result = await maintenanceTools.scheduleMaintenanceTask({
                name,
                description,
                cronExpression,
                action,
                enabled
            });

            if (req.user) {
                debugLog.log('MAINTENANCE', 'Nueva tarea programada', {
                    userId: req.user.id,
                    taskName: name,
                    cronExpression: cronExpression
                });
            }

            res.json({
                success: true,
                message: 'Tarea programada exitosamente',
                data: result
            });
        } else {
            res.status(501).json({
                success: false,
                message: 'Task scheduling not supported'
            });
        }

    } catch (error) {
        next(error);
    }
});

export default router;
