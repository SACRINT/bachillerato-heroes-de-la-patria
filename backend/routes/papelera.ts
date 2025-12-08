/**
 * 🗑️ RUTAS DE PAPELERA - TypeScript
 * Gestión de registros eliminados (soft deletes)
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getDeletedRecords, restoreDeleted, hardDelete } from '../data/soft-delete-helpers';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string; email: string };
}

interface DeletedRecord {
    id: number;
    deleted_at: string;
    [key: string]: unknown;
}

// ============================================
// ALLOWED TABLES
// ============================================

const ALLOWED_TABLES = [
    'usuarios', 'estudiantes', 'docentes', 'calificaciones',
    'noticias', 'eventos', 'avisos', 'citas', 'solicitudes_documentos', 'contactos'
];

// ============================================
// MIDDLEWARE
// ============================================

function validateTableName(req: Request, res: Response, next: NextFunction): void {
    const { table } = req.params;
    if (!ALLOWED_TABLES.includes(table)) {
        res.status(400).json({ success: false, error: 'Tabla no permitida', allowedTables: ALLOWED_TABLES });
        return;
    }
    next();
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/papelera - Estadísticas de papelera
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const stats: Record<string, string> = {};
        for (const table of ALLOWED_TABLES) {
            try {
                const records = await getDeletedRecords(table, 1) as DeletedRecord[];
                stats[table] = records.length > 0 ? '1+' : '0';
            } catch {
                stats[table] = 'error';
            }
        }

        debugLog.log('PAPELERA', '📊 Admin consultó estadísticas de papelera');
        res.json({ success: true, message: 'Estadísticas de registros eliminados por tabla', stats, allowedTables: ALLOWED_TABLES });
    } catch (error) {
        debugLog.error('PAPELERA', '❌ Error obteniendo estadísticas de papelera', sanitizeError(error as Error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/papelera/:table - Listar registros eliminados
 */
router.get('/:table', authenticateToken, requireAdmin, validateTableName, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { table } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;

        const deletedRecords = await getDeletedRecords(table, limit) as DeletedRecord[];
        debugLog.log('PAPELERA', `📋 Admin consultó ${deletedRecords.length} registros eliminados de ${table}`);
        res.json({ success: true, table, count: deletedRecords.length, data: deletedRecords, limit });
    } catch (error) {
        debugLog.error('PAPELERA', `❌ Error obteniendo registros eliminados de ${req.params.table}`, sanitizeError(error as Error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al obtener registros eliminados' });
    }
});

/**
 * POST /api/papelera/:table/:id/restore - Restaurar registro
 */
router.post('/:table/:id/restore', authenticateToken, requireAdmin, validateTableName, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { table, id } = req.params;
        const restored = await restoreDeleted(table, parseInt(id));

        if (!restored) {
            res.status(404).json({ success: false, error: 'Registro no encontrado o ya restaurado' });
            return;
        }

        debugLog.log('PAPELERA', `♻️ Admin restauró registro ${id} de ${table}`);
        res.json({ success: true, message: `Registro restaurado correctamente de ${table}`, table, id: parseInt(id) });
    } catch (error) {
        debugLog.error('PAPELERA', `❌ Error restaurando registro ${req.params.id} de ${req.params.table}`, sanitizeError(error as Error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al restaurar el registro' });
    }
});

/**
 * DELETE /api/papelera/:table/:id/permanent - Eliminar permanentemente
 */
router.delete('/:table/:id/permanent', authenticateToken, requireAdmin, validateTableName, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { table, id } = req.params;
        const { confirm } = req.body as { confirm?: string };

        if (confirm !== 'CONFIRMAR_ELIMINACION_PERMANENTE') {
            res.status(400).json({ success: false, error: 'Se requiere confirmación explícita', message: 'Debes enviar { "confirm": "CONFIRMAR_ELIMINACION_PERMANENTE" } en el body' });
            return;
        }

        const deleted = await hardDelete(table, parseInt(id));
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Registro no encontrado' });
            return;
        }

        debugLog.log('PAPELERA', `🔥 Admin eliminó PERMANENTEMENTE registro ${id} de ${table}`);
        res.json({ success: true, message: `Registro eliminado permanentemente de ${table}`, warning: 'Esta acción es IRREVERSIBLE', table, id: parseInt(id) });
    } catch (error) {
        debugLog.error('PAPELERA', `❌ Error eliminando permanentemente registro ${req.params.id} de ${req.params.table}`, sanitizeError(error as Error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al eliminar permanentemente el registro' });
    }
});

export default router;
