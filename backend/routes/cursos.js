/**
 * API REST - GESTIÓN DE CURSOS/MATERIAS
 * BGE Héroes de la Patria
 * Fecha: 7 de Noviembre, 2025
 *
 * Endpoints para gestión de cursos/materias del plantel que incluye:
 * - Obtener listado de cursos
 * - Crear nuevos cursos
 * - Actualizar información de cursos
 * - Eliminar cursos
 * - Consultar detalles de un curso específico
 *
 * ✅ REFACTORIZADO (Acción 3.2 Fase 4): Usa el módulo DAL (database-access.js)
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../data/database-access');

const router = express.Router();

// ============================================
// ENDPOINTS ADMINISTRATIVOS (CRUD)
// ============================================

/**
 * GET /api/cursos
 * Obtiene lista de todos los cursos (admin only)
 *
 * ✅ REFACTORIZADO: Usa getAllCourses() del DAL
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cursos = await getAllCourses();

        res.json({
            success: true,
            data: cursos,
            count: cursos.length
        });

    } catch (error) {
        devLogger.error('❌ [CURSOS] Error obteniendo cursos:', error);
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
 *
 * ✅ REFACTORIZADO: Usa getCourseById() del DAL
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);

        if (isNaN(cursoId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de curso inválido'
            });
        }

        const curso = await getCourseById(cursoId);

        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }

        res.json({
            success: true,
            data: curso
        });

    } catch (error) {
        devLogger.error('❌ [CURSOS] Error obteniendo curso:', error);
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
 *
 * ✅ REFACTORIZADO: Usa createCourse() del DAL
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;

        devLogger.log('📚 [CURSOS] Creando nuevo curso...');

        // Validaciones
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del curso es requerido'
            });
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

        devLogger.log(`✅ [CURSOS] Curso creado con ID: ${curso.id}`);

        res.status(201).json({
            success: true,
            message: 'Curso creado exitosamente',
            data: curso
        });

    } catch (error) {
        devLogger.error('❌ [CURSOS] Error creando curso:', error);
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
 *
 * ✅ REFACTORIZADO: Usa updateCourse() del DAL
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);

        if (isNaN(cursoId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de curso inválido'
            });
        }

        devLogger.log(`📚 [CURSOS] Actualizando curso ID: ${cursoId}`);

        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;

        // Preparar objeto de actualización
        const updateData = {};

        if (nombre !== undefined) updateData.nombre = nombre;
        if (codigo !== undefined) updateData.codigo = codigo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (creditos !== undefined) updateData.creditos = creditos;
        if (horas_totales !== undefined) updateData.horas_totales = horas_totales;
        if (grado_minimo !== undefined) updateData.grado_minimo = grado_minimo;
        if (grado_maximo !== undefined) updateData.grado_maximo = grado_maximo;
        if (activo !== undefined) updateData.activo = activo;

        const curso = await updateCourse(cursoId, updateData);

        if (!curso) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        devLogger.log(`✅ [CURSOS] Curso actualizado: ${curso.id}`);

        res.json({
            success: true,
            message: 'Curso actualizado exitosamente',
            data: curso
        });

    } catch (error) {
        devLogger.error('❌ [CURSOS] Error actualizando curso:', error);
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
 *
 * ✅ REFACTORIZADO: Usa deleteCourse() del DAL
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cursoId = parseInt(req.params.id);

        if (isNaN(cursoId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de curso inválido'
            });
        }

        devLogger.log(`📚 [CURSOS] Eliminando curso ID: ${cursoId}`);

        const deleted = await deleteCourse(cursoId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        devLogger.log(`✅ [CURSOS] Curso eliminado: ${cursoId}`);

        res.json({
            success: true,
            message: 'Curso eliminado exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ [CURSOS] Error eliminando curso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar curso',
            error: error.message
        });
    }
});

module.exports = router;
