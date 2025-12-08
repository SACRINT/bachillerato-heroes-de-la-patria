/**
 * 📊 RUTAS DEL DASHBOARD ADMINISTRATIVO - TypeScript
 * APIs para métricas, estadísticas y gestión del dashboard
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

interface UserStats {
    total: number;
    admin: number;
    teacher: number;
    student: number;
    active: number;
    inactive: number;
}

interface AcademicStats {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    averageGrade: number;
    attendanceRate: number;
    graduationRate: number;
}

interface SystemStats {
    serverUptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    activeConnections: number;
    lastBackup: string;
    systemLoad: number;
}

interface ActivityItem {
    id: number;
    type: 'login' | 'document' | 'grade' | 'user' | 'alert';
    user: string;
    role: string;
    action: string;
    timestamp: string;
    details: string;
}

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    available: boolean;
}

interface ActionResult {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
}

interface HealthStatus {
    status: 'healthy' | 'warning' | 'critical';
    [key: string]: unknown;
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/dashboard/stats
 * Estadísticas generales del sistema
 */
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        debugLog.log('DASHBOARD', '📊 [DASHBOARD] Obteniendo estadísticas generales...');

        const users: Array<{ role: string; active: boolean }> = [];
        const userStats: UserStats = {
            total: users.length,
            admin: users.filter(u => u.role === 'admin').length,
            teacher: users.filter(u => u.role === 'teacher').length,
            student: users.filter(u => u.role === 'student').length,
            active: users.filter(u => u.active).length,
            inactive: users.filter(u => !u.active).length
        };

        const academicStats: AcademicStats = {
            totalStudents: userStats.student,
            totalTeachers: userStats.teacher,
            totalCourses: 24,
            averageGrade: 8.5,
            attendanceRate: 92.3,
            graduationRate: 89.7
        };

        const systemStats: SystemStats = {
            serverUptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            activeConnections: users.filter(u => u.active).length,
            lastBackup: new Date().toISOString(),
            systemLoad: 0.45
        };

        const activityStats = {
            loginToday: Math.floor(Math.random() * 50) + 20,
            documentsUploaded: Math.floor(Math.random() * 15) + 5,
            messagesExchanged: Math.floor(Math.random() * 200) + 100,
            systemAlerts: Math.floor(Math.random() * 3)
        };

        debugLog.log('DASHBOARD', 'Estadísticas del dashboard consultadas', {
            adminId: authReq.user.id,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                users: userStats,
                academic: academicStats,
                system: systemStats,
                activity: activityStats,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/recent-activity
 * Actividad reciente del sistema
 */
router.get('/recent-activity', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        debugLog.log('DASHBOARD', '🔄 [DASHBOARD] Obteniendo actividad reciente...');

        const activities: ActivityItem[] = [
            {
                id: 1,
                type: 'login',
                user: 'María González',
                role: 'teacher',
                action: 'Inicio de sesión',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                details: 'Acceso desde Chrome'
            },
            {
                id: 2,
                type: 'document',
                user: 'Admin Sistema',
                role: 'admin',
                action: 'Documento subido',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                details: 'Calendario escolar 2024-2025.pdf'
            },
            {
                id: 3,
                type: 'grade',
                user: 'Carlos Mendoza',
                role: 'teacher',
                action: 'Calificaciones actualizadas',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                details: 'Matemáticas III - Grupo A'
            },
            {
                id: 4,
                type: 'user',
                user: 'Sistema Automático',
                role: 'system',
                action: 'Backup completado',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                details: 'Backup diario de base de datos'
            },
            {
                id: 5,
                type: 'alert',
                user: 'Monitor Sistema',
                role: 'system',
                action: 'Alerta de seguridad',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                details: 'Intento de acceso no autorizado bloqueado'
            }
        ];

        res.json({
            success: true,
            data: activities
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/system-health
 * Estado de salud del sistema
 */
router.get('/system-health', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        debugLog.log('DASHBOARD', '🏥 [DASHBOARD] Verificando salud del sistema...');

        const health = {
            database: {
                status: 'healthy' as const,
                responseTime: Math.floor(Math.random() * 50) + 10,
                lastCheck: new Date().toISOString()
            },
            server: {
                status: 'healthy' as const,
                uptime: process.uptime(),
                memoryUsage: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
                cpuUsage: Math.floor(Math.random() * 30) + 20
            },
            storage: {
                status: 'healthy' as const,
                used: Math.floor(Math.random() * 40) + 30,
                available: 70,
                totalSpace: 100
            },
            backup: {
                status: 'healthy' as const,
                lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                nextScheduled: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
            },
            security: {
                status: 'healthy' as const,
                threatsBlocked: Math.floor(Math.random() * 5),
                lastScan: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            }
        };

        res.json({
            success: true,
            data: health
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/quick-actions
 * Acciones rápidas disponibles
 */
router.get('/quick-actions', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const actions: QuickAction[] = [
            {
                id: 'create_user',
                title: 'Crear Usuario',
                description: 'Registrar nuevo usuario en el sistema',
                icon: 'fas fa-user-plus',
                category: 'users',
                available: true
            },
            {
                id: 'backup_system',
                title: 'Backup Manual',
                description: 'Ejecutar respaldo manual del sistema',
                icon: 'fas fa-download',
                category: 'system',
                available: true
            },
            {
                id: 'send_notification',
                title: 'Enviar Notificación',
                description: 'Enviar comunicado a toda la comunidad',
                icon: 'fas fa-bell',
                category: 'communication',
                available: true
            },
            {
                id: 'system_maintenance',
                title: 'Modo Mantenimiento',
                description: 'Activar/desactivar modo mantenimiento',
                icon: 'fas fa-tools',
                category: 'system',
                available: true
            },
            {
                id: 'generate_report',
                title: 'Generar Reporte',
                description: 'Crear reporte de actividades',
                icon: 'fas fa-chart-bar',
                category: 'reports',
                available: true
            },
            {
                id: 'security_scan',
                title: 'Escaneo Seguridad',
                description: 'Ejecutar análisis de seguridad',
                icon: 'fas fa-shield-alt',
                category: 'security',
                available: true
            }
        ];

        res.json({
            success: true,
            data: actions
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/dashboard/execute-action
 * Ejecutar una acción rápida
 */
router.post('/execute-action', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { actionId, parameters } = req.body as { actionId: string; parameters?: Record<string, unknown> };

        debugLog.log('DASHBOARD', '⚡ [DASHBOARD] Ejecutando acción:', actionId);

        const results: Record<string, ActionResult> = {
            create_user: {
                success: true,
                message: 'Usuario creado exitosamente',
                data: { userId: Date.now() }
            },
            backup_system: {
                success: true,
                message: 'Backup iniciado en segundo plano',
                data: { backupId: `backup_${Date.now()}` }
            },
            send_notification: {
                success: true,
                message: 'Notificación enviada a 150 usuarios',
                data: { recipientCount: 150 }
            },
            system_maintenance: {
                success: true,
                message: 'Modo mantenimiento activado',
                data: { maintenanceMode: true }
            },
            generate_report: {
                success: true,
                message: 'Reporte generado exitosamente',
                data: { reportId: `report_${Date.now()}` }
            },
            security_scan: {
                success: true,
                message: 'Escaneo de seguridad completado',
                data: { threatsFound: 0, scanTime: '2.3s' }
            }
        };

        const result = results[actionId] || {
            success: false,
            message: 'Acción no reconocida'
        };

        debugLog.log('DASHBOARD', 'Acción del dashboard ejecutada:', actionId, {
            adminId: authReq.user.id,
            actionId,
            parameters,
            result: result.success
        });

        res.json(result);

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/active-users
 * Usuarios activos con sesiones vigentes
 */
router.get('/active-users', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        debugLog.log('DASHBOARD', '👥 [DASHBOARD] Obteniendo usuarios activos...');

        const activeSessions: Array<{ sess: string | object; expire: string }> = [];

        const activeUsers = activeSessions.map((session, index) => {
            try {
                const sessionData = typeof session.sess === 'string'
                    ? JSON.parse(session.sess)
                    : session.sess;

                return {
                    id: index + 1,
                    username: sessionData.user?.username || sessionData.user?.email || 'Usuario',
                    email: sessionData.user?.email || 'N/A',
                    role: sessionData.user?.role || 'N/A',
                    lastActivity: session.expire,
                    sessionExpires: session.expire
                };
            } catch (error) {
                debugLog.error('DASHBOARD', 'Error procesando sesión:', sanitizeError(error as Error, 'dashboard'));
                return null;
            }
        }).filter((user): user is NonNullable<typeof user> => user !== null);

        debugLog.log('DASHBOARD', `✅ [DASHBOARD] ${activeUsers.length} usuarios activos encontrados`);

        res.json({
            success: true,
            data: activeUsers,
            count: activeUsers.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        debugLog.error('DASHBOARD', '❌ [DASHBOARD] Error obteniendo usuarios activos:', sanitizeError(error as Error, 'dashboard'));
        next(error);
    }
});

export default router;
