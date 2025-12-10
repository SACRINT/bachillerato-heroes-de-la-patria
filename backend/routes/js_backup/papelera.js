/**
 * 🗑️ RUTAS DE PAPELERA - GESTIÓN DE REGISTROS ELIMINADOS (SOFT DELETES)
 * Sistema para ver y restaurar registros eliminados lógicamente
 * Fecha: 17 Noviembre 2025
 */

const express = require('express');
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError } = require('../utils/sanitized-errors');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDeletedRecords, restoreDeleted, hardDelete } = require('../data/soft-delete-helpers');

// Lista de tablas permitidas para operaciones de papelera
const ALLOWED_TABLES = [
    'usuarios',
    'estudiantes',
    'docentes',
    'calificaciones',
    'noticias',
    'eventos',
    'avisos',
    'citas',
    'solicitudes_documentos',
    'contactos'
];

/**
 * Middleware para validar nombre de tabla
 */
function validateTableName(req, res, next) {
    const { table } = req.params;

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({
            success: false,
            error: 'Tabla no permitida',
            allowedTables: ALLOWED_TABLES
        });
    }

    next();
}

// =====================================================
// GET /api/papelera/:table - Listar registros eliminados
// =====================================================
router.get('/:table', authenticateToken, requireAdmin, validateTableName, async (req, res) => {
    try {
        const { table } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const deletedRecords = await getDeletedRecords(table, limit);

        debugLog.log('PAPELERA', `📋 Admin consultó ${deletedRecords.length} registros eliminados de ${table}`);

        res.json({
            success: true,
            table,
            count: deletedRecords.length,
            data: deletedRecords,
            limit
        });

    } catch (error) {
        debugLog.error('PAPELERA', `❌ Error obteniendo registros eliminados de ${req.params.table}`, sanitizeError(error, 'papelera'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener registros eliminados',
            message: error.message
        });
    }
});

// =====================================================
// POST /api/papelera/:table/:id/restore - Restaurar registro
// =====================================================
router.post('/:table/:id/restore', authenticateToken, requireAdmin, validateTableName, async (req, res) => {
    try {
        const { table, id } = req.params;

        const restored = await restoreDeleted(table, parseInt(id));

        if (!restored) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado o ya restaurado'
            });
        }

        debugLog.log('PAPELERA', `♻️ Admin restauró registro ${id} de ${table}`);

        res.json({
            success: true,
            message: `Registro restaurado correctamente de ${table}`,
            table,
            id: parseInt(id)
        });

    } catch (error) {
        debugLog.error('PAPELERA', `❌ Error restaurando registro ${req.params.id} de ${req.params.table}`, sanitizeError(error, 'papelera'));
        res.status(500).json({
            success: false,
            error: 'Error al restaurar el registro',
            message: error.message
        });
    }
});

// =====================================================
// DELETE /api/papelera/:table/:id/permanent - Eliminar permanentemente
// =====================================================
router.delete('/:table/:id/permanent', authenticateToken, requireAdmin, validateTableName, async (req, res) => {
    try {
        const { table, id } = req.params;

        // Confirmación requerida para hard delete
        const { confirm } = req.body;
        if (confirm !== 'CONFIRMAR_ELIMINACION_PERMANENTE') {
            return res.status(400).json({
                success: false,
                error: 'Se requiere confirmación explícita',
                message: 'Debes enviar { "confirm": "CONFIRMAR_ELIMINACION_PERMANENTE" } en el body'
            });
        }

        const deleted = await hardDelete(table, parseInt(id));

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        debugLog.log('PAPELERA', `🔥 Admin eliminó PERMANENTEMENTE registro ${id} de ${table}`);

        res.json({
            success: true,
            message: `Registro eliminado permanentemente de ${table}`,
            warning: 'Esta acción es IRREVERSIBLE',
            table,
            id: parseInt(id)
        });

    } catch (error) {
        debugLog.error('PAPELERA', `❌ Error eliminando permanentemente registro ${req.params.id} de ${req.params.table}`, sanitizeError(error, 'papelera'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar permanentemente el registro',
            message: error.message
        });
    }
});

// =====================================================
// GET /api/papelera/stats - Estadísticas de papelera
// =====================================================
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = {};

        // Obtener conteo de registros eliminados por tabla
        for (const table of ALLOWED_TABLES) {
            try {
                const records = await getDeletedRecords(table, 1);
                stats[table] = records.length > 0 ? '1+' : '0';
            } catch (err) {
                stats[table] = 'error';
            }
        }

        debugLog.log('PAPELERA', '📊 Admin consultó estadísticas de papelera');

        res.json({
            success: true,
            message: 'Estadísticas de registros eliminados por tabla',
            stats,
            allowedTables: ALLOWED_TABLES
        });

    } catch (error) {
        debugLog.error('PAPELERA', '❌ Error obteniendo estadísticas de papelera', sanitizeError(error, 'papelera'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

module.exports = router;
