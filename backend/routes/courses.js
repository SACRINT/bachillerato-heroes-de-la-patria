"use strict";
/**
 * 📚 COURSES ROUTES - TypeScript
 * Gestión de cursos y materias
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const auth_1 = require("../middleware/auth");
// Importar funciones del DAL (Data Access Layer)
// Usamos require para compatibilidad con el módulo JS existente
// @ts-ignore
const databaseAccess = require('../data/database-access');
const { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } = databaseAccess;
const router = express_1.default.Router();
// ============================================
// ENDPOINTS ADMINISTRATIVOS (CRUD)
// ============================================
/**
 * GET /api/cursos
 * Obtiene lista de todos los cursos (admin only)
 */
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursos = await getAllCourses();
        res.json({
            success: true,
            data: cursos,
            count: cursos.length
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ [CURSOS] Error obteniendo cursos:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener cursos',
            message: error.message
        });
    }
});
/**
 * GET /api/cursos/:id
 * Obtiene un curso específico por ID (admin only)
 */
router.get('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }
        const curso = await getCourseById(cursoId);
        if (!curso) {
            res.status(404).json({ success: false, error: 'Curso no encontrado' });
            return;
        }
        res.json({ success: true, data: curso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ [CURSOS] Error obteniendo curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener curso',
            message: error.message
        });
    }
});
/**
 * POST /api/cursos
 * Crea un nuevo curso (admin only)
 */
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;
        debug_logger_1.debugLog.log('CURSOS', '📚 [CURSOS] Creando nuevo curso...');
        // Validaciones
        if (!nombre) {
            res.status(400).json({ success: false, message: 'El nombre del curso es requerido' });
            return;
        }
        const curso = await createCourse({
            nombre,
            codigo,
            descripcion,
            creditos,
            horas_totales,
            grado_minimo,
            grado_maximo,
            activo
        });
        debug_logger_1.debugLog.log('CURSOS', `✅ [CURSOS] Curso creado con ID: ${curso.id}`);
        res.status(201).json({
            success: true,
            message: 'Curso creado exitosamente',
            data: curso
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ [CURSOS] Error creando curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({
            success: false,
            message: 'Error al crear curso',
            error: error.message
        });
    }
});
/**
 * PUT /api/cursos/:id
 * Actualiza un curso existente (admin only)
 */
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `📚 [CURSOS] Actualizando curso ID: ${cursoId}`);
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;
        // Preparar objeto de actualización
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
        const curso = await updateCourse(cursoId, updateData);
        if (!curso) {
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `✅ [CURSOS] Curso actualizado: ${curso.id}`);
        res.json({
            success: true,
            message: 'Curso actualizado exitosamente',
            data: curso
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ [CURSOS] Error actualizando curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({
            success: false,
            message: 'Error al actualizar curso',
            error: error.message
        });
    }
});
/**
 * DELETE /api/cursos/:id
 * Elimina un curso (admin only)
 */
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `📚 [CURSOS] Eliminando curso ID: ${cursoId}`);
        const deleted = await deleteCourse(cursoId);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
            return;
        }
        debug_logger_1.debugLog.log('CURSOS', `✅ [CURSOS] Curso eliminado: ${cursoId}`);
        res.json({ success: true, message: 'Curso eliminado exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CURSOS', '❌ [CURSOS] Error eliminando curso:', (0, sanitized_errors_1.sanitizeError)(error, 'cursos'));
        res.status(500).json({
            success: false,
            message: 'Error al eliminar curso',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=courses.js.map