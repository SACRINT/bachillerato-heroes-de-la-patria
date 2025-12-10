/**
 * 📚 COURSES ROUTES - TypeScript
 * Gestión de cursos y materias
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';
import { authenticateToken, requireAdmin } from '../middleware/auth';

// Importar funciones del DAL (Data Access Layer)
// Usamos require para compatibilidad con el módulo JS existente
// @ts-ignore
const databaseAccess = require('../data/database-access');
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} = databaseAccess;

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Course {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    creditos: number;
    horas_totales: number;
    grado_minimo: number;
    grado_maximo: number;
    activo: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface CreateCourseDTO {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    creditos?: number;
    horas_totales?: number;
    grado_minimo?: number;
    grado_maximo?: number;
    activo?: boolean;
}

// ============================================
// ENDPOINTS ADMINISTRATIVOS (CRUD)
// ============================================

/**
 * GET /api/cursos
 * Obtiene lista de todos los cursos (admin only)
 */
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const cursos = await getAllCourses();

        res.json({
            success: true,
            data: cursos,
            count: cursos.length
        });

    } catch (error) {
        debugLog.error('CURSOS', '❌ [CURSOS] Error obteniendo cursos:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener cursos',
            message: (error as Error).message
        });
    }
});

/**
 * GET /api/cursos/:id
 * Obtiene un curso específico por ID (admin only)
 */
router.get('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
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

    } catch (error) {
        debugLog.error('CURSOS', '❌ [CURSOS] Error obteniendo curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener curso',
            message: (error as Error).message
        });
    }
});

/**
 * POST /api/cursos
 * Crea un nuevo curso (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            nombre,
            codigo,
            descripcion,
            creditos,
            horas_totales,
            grado_minimo,
            grado_maximo,
            activo
        }: CreateCourseDTO = req.body;

        debugLog.log('CURSOS', '📚 [CURSOS] Creando nuevo curso...');

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

        debugLog.log('CURSOS', `✅ [CURSOS] Curso creado con ID: ${curso.id}`);

        res.status(201).json({
            success: true,
            message: 'Curso creado exitosamente',
            data: curso
        });

    } catch (error) {
        debugLog.error('CURSOS', '❌ [CURSOS] Error creando curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({
            success: false,
            message: 'Error al crear curso',
            error: (error as Error).message
        });
    }
});

/**
 * PUT /api/cursos/:id
 * Actualiza un curso existente (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const cursoId = parseInt(req.params.id);

        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }

        debugLog.log('CURSOS', `📚 [CURSOS] Actualizando curso ID: ${cursoId}`);

        const {
            nombre,
            codigo,
            descripcion,
            creditos,
            horas_totales,
            grado_minimo,
            grado_maximo,
            activo
        }: Partial<CreateCourseDTO> = req.body;

        // Preparar objeto de actualización
        const updateData: Partial<CreateCourseDTO> = {};

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
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
            return;
        }

        debugLog.log('CURSOS', `✅ [CURSOS] Curso actualizado: ${curso.id}`);

        res.json({
            success: true,
            message: 'Curso actualizado exitosamente',
            data: curso
        });

    } catch (error) {
        debugLog.error('CURSOS', '❌ [CURSOS] Error actualizando curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({
            success: false,
            message: 'Error al actualizar curso',
            error: (error as Error).message
        });
    }
});

/**
 * DELETE /api/cursos/:id
 * Elimina un curso (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const cursoId = parseInt(req.params.id);

        if (isNaN(cursoId)) {
            res.status(400).json({ success: false, error: 'ID de curso inválido' });
            return;
        }

        debugLog.log('CURSOS', `📚 [CURSOS] Eliminando curso ID: ${cursoId}`);

        const deleted = await deleteCourse(cursoId);

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
            return;
        }

        debugLog.log('CURSOS', `✅ [CURSOS] Curso eliminado: ${cursoId}`);

        res.json({ success: true, message: 'Curso eliminado exitosamente' });

    } catch (error) {
        debugLog.error('CURSOS', '❌ [CURSOS] Error eliminando curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({
            success: false,
            message: 'Error al eliminar curso',
            error: (error as Error).message
        });
    }
});

export default router;
