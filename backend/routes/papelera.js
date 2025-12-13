"use strict";
/**
 * 🗑️ RUTAS DE PAPELERA - TypeScript
 * Gestión de registros eliminados (soft deletes)
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const auth_1 = require("../middleware/auth");
const soft_delete_helpers_1 = require("../data/soft-delete-helpers");
const router = express_1.default.Router();
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
function validateTableName(req, res, next) {
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
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const stats = {};
        for (const table of ALLOWED_TABLES) {
            try {
                const records = await (0, soft_delete_helpers_1.getDeletedRecords)(table, 1);
                stats[table] = records.length > 0 ? '1+' : '0';
            }
            catch {
                stats[table] = 'error';
            }
        }
        debug_logger_1.debugLog.log('PAPELERA', '📊 Admin consultó estadísticas de papelera');
        res.json({ success: true, message: 'Estadísticas de registros eliminados por tabla', stats, allowedTables: ALLOWED_TABLES });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PAPELERA', '❌ Error obteniendo estadísticas de papelera', (0, sanitized_errors_1.sanitizeError)(error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});
/**
 * GET /api/papelera/:table - Listar registros eliminados
 */
router.get('/:table', auth_1.authenticateToken, auth_1.requireAdmin, validateTableName, async (req, res) => {
    try {
        const { table } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const deletedRecords = await (0, soft_delete_helpers_1.getDeletedRecords)(table, limit);
        debug_logger_1.debugLog.log('PAPELERA', `📋 Admin consultó ${deletedRecords.length} registros eliminados de ${table}`);
        res.json({ success: true, table, count: deletedRecords.length, data: deletedRecords, limit });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PAPELERA', `❌ Error obteniendo registros eliminados de ${req.params.table}`, (0, sanitized_errors_1.sanitizeError)(error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al obtener registros eliminados' });
    }
});
/**
 * POST /api/papelera/:table/:id/restore - Restaurar registro
 */
router.post('/:table/:id/restore', auth_1.authenticateToken, auth_1.requireAdmin, validateTableName, async (req, res) => {
    try {
        const { table, id } = req.params;
        const restored = await (0, soft_delete_helpers_1.restoreDeleted)(table, parseInt(id));
        if (!restored) {
            res.status(404).json({ success: false, error: 'Registro no encontrado o ya restaurado' });
            return;
        }
        debug_logger_1.debugLog.log('PAPELERA', `♻️ Admin restauró registro ${id} de ${table}`);
        res.json({ success: true, message: `Registro restaurado correctamente de ${table}`, table, id: parseInt(id) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PAPELERA', `❌ Error restaurando registro ${req.params.id} de ${req.params.table}`, (0, sanitized_errors_1.sanitizeError)(error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al restaurar el registro' });
    }
});
/**
 * DELETE /api/papelera/:table/:id/permanent - Eliminar permanentemente
 */
router.delete('/:table/:id/permanent', auth_1.authenticateToken, auth_1.requireAdmin, validateTableName, async (req, res) => {
    try {
        const { table, id } = req.params;
        const { confirm } = req.body;
        if (confirm !== 'CONFIRMAR_ELIMINACION_PERMANENTE') {
            res.status(400).json({ success: false, error: 'Se requiere confirmación explícita', message: 'Debes enviar { "confirm": "CONFIRMAR_ELIMINACION_PERMANENTE" } en el body' });
            return;
        }
        const deleted = await (0, soft_delete_helpers_1.hardDelete)(table, parseInt(id));
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Registro no encontrado' });
            return;
        }
        debug_logger_1.debugLog.log('PAPELERA', `🔥 Admin eliminó PERMANENTEMENTE registro ${id} de ${table}`);
        res.json({ success: true, message: `Registro eliminado permanentemente de ${table}`, warning: 'Esta acción es IRREVERSIBLE', table, id: parseInt(id) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PAPELERA', `❌ Error eliminando permanentemente registro ${req.params.id} de ${req.params.table}`, (0, sanitized_errors_1.sanitizeError)(error, 'papelera'));
        res.status(500).json({ success: false, error: 'Error al eliminar permanentemente el registro' });
    }
});
exports.default = router;
//# sourceMappingURL=papelera.js.map