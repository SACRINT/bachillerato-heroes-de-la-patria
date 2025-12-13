"use strict";
/**
 * API REST - GESTIÓN DE CURSOS/MATERIAS - TypeScript
 * BGE Héroes de la Patria
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_access_1 = require("../data/database-access");
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const router = express_1.default.Router();
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/cursos
 */
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursos = await (0, database_access_1.getAllCourses)();
        res.json({ success: true, data: cursos, count: cursos.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ Error obteniendo cursos:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({ success: false, error: 'Error al obtener cursos' });
    }
});
/**
 * GET /api/cursos/:id
 */
router.get('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }
        const curso = await (0, database_access_1.getCourseById)(cursoId);
        if (!curso) {
            res.status(404).json({ success: false, error: 'Curso no encontrado' });
            return;
        }
        res.json({ success: true, data: curso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ Error obteniendo curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({ success: false, error: 'Error al obtener curso' });
    }
});
/**
 * POST /api/cursos
 */
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;
        debug_logger_1.debugLog.log('CURSOS', '📚 Creando nuevo curso...');
        if (!nombre) {
            res.status(400).json({ success: false, message: 'El nombre del curso es requerido' });
            return;
        }
        const curso = await (0, database_access_1.createCourse)({ nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo });
        debug_logger_1.debugLog.log('CURSOS', `✅ Curso creado con ID: ${curso.id}`);
        res.status(201).json({ success: true, message: 'Curso creado exitosamente', data: curso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ Error creando curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({ success: false, message: 'Error al crear curso' });
    }
});
/**
 * PUT /api/cursos/:id
 */
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `📚 Actualizando curso ID: ${cursoId}`);
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;
        const updateData = {};
        if (nombre !== undefined)
            updateData.nombre = nombre;
        if (codigo !== undefined)
            updateData.codigo = codigo;
        if (descripcion !== undefined)
            updateData.descripcion = descripcion;
        if (creditos !== undefined)
            updateData.creditos = creditos;
        if (horas_totales !== undefined)
            updateData.horas_totales = horas_totales;
        if (grado_minimo !== undefined)
            updateData.grado_minimo = grado_minimo;
        if (grado_maximo !== undefined)
            updateData.grado_maximo = grado_maximo;
        if (activo !== undefined)
            updateData.activo = activo;
        const curso = await (0, database_access_1.updateCourse)(cursoId, updateData);
        if (!curso) {
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `✅ Curso actualizado: ${curso.id}`);
        res.json({ success: true, message: 'Curso actualizado exitosamente', data: curso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ Error actualizando curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({ success: false, message: 'Error al actualizar curso' });
    }
});
/**
 * DELETE /api/cursos/:id
 */
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `📚 Eliminando curso ID: ${cursoId}`);
        const deleted = await (0, database_access_1.deleteCourse)(cursoId);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `✅ Curso eliminado: ${cursoId}`);
        res.json({ success: true, message: 'Curso eliminado exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ Error eliminando curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({ success: false, message: 'Error al eliminar curso' });
    }
});
exports.default = router;
//# sourceMappingURL=cursos.js.map