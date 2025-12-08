/**
 * API REST - GESTIÓN DE CURSOS/MATERIAS - TypeScript
 * BGE Héroes de la Patria
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../data/database-access';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Curso {
    id: number;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    creditos?: number;
    horas_totales?: number;
    grado_minimo?: number;
    grado_maximo?: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string; email: string };
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/cursos
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const cursos = await getAllCourses() as Curso[];
        res.json({ success: true, data: cursos, count: cursos.length });
    } catch (error) {
        debugLog.error('CURSOS', '❌ Error obteniendo cursos:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({ success: false, error: 'Error al obtener cursos' });
    }
});

/**
 * GET /api/cursos/:id
 */
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) { res.status(400).json({ success: false, error: 'ID de curso inválido' }); return; }

        const curso = await getCourseById(cursoId) as Curso | null;
        if (!curso) { res.status(404).json({ success: false, error: 'Curso no encontrado' }); return; }

        res.json({ success: true, data: curso });
    } catch (error) {
        debugLog.error('CURSOS', '❌ Error obteniendo curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({ success: false, error: 'Error al obtener curso' });
    }
});

/**
 * POST /api/cursos
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;
        debugLog.log('CURSOS', '📚 Creando nuevo curso...');

        if (!nombre) { res.status(400).json({ success: false, message: 'El nombre del curso es requerido' }); return; }

        const curso = await createCourse({ nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo }) as Curso;
        debugLog.log('CURSOS', `✅ Curso creado con ID: ${curso.id}`);
        res.status(201).json({ success: true, message: 'Curso creado exitosamente', data: curso });
    } catch (error) {
        debugLog.error('CURSOS', '❌ Error creando curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({ success: false, message: 'Error al crear curso' });
    }
});

/**
 * PUT /api/cursos/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) { res.status(400).json({ success: false, error: 'ID de curso inválido' }); return; }

        debugLog.log('CURSOS', `📚 Actualizando curso ID: ${cursoId}`);
        const { nombre, codigo, descripcion, creditos, horas_totales, grado_minimo, grado_maximo, activo } = req.body;

        const updateData: Partial<Curso> = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (codigo !== undefined) updateData.codigo = codigo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (creditos !== undefined) updateData.creditos = creditos;
        if (horas_totales !== undefined) updateData.horas_totales = horas_totales;
        if (grado_minimo !== undefined) updateData.grado_minimo = grado_minimo;
        if (grado_maximo !== undefined) updateData.grado_maximo = grado_maximo;
        if (activo !== undefined) updateData.activo = activo;

        const curso = await updateCourse(cursoId, updateData) as Curso | null;
        if (!curso) { res.status(404).json({ success: false, message: 'Curso no encontrado' }); return; }

        debugLog.log('CURSOS', `✅ Curso actualizado: ${curso.id}`);
        res.json({ success: true, message: 'Curso actualizado exitosamente', data: curso });
    } catch (error) {
        debugLog.error('CURSOS', '❌ Error actualizando curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({ success: false, message: 'Error al actualizar curso' });
    }
});

/**
 * DELETE /api/cursos/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const cursoId = parseInt(req.params.id);
        if (isNaN(cursoId)) { res.status(400).json({ success: false, error: 'ID de curso inválido' }); return; }

        debugLog.log('CURSOS', `📚 Eliminando curso ID: ${cursoId}`);
        const deleted = await deleteCourse(cursoId);
        if (!deleted) { res.status(404).json({ success: false, message: 'Curso no encontrado' }); return; }

        debugLog.log('CURSOS', `✅ Curso eliminado: ${cursoId}`);
        res.json({ success: true, message: 'Curso eliminado exitosamente' });
    } catch (error) {
        debugLog.error('CURSOS', '❌ Error eliminando curso:', sanitizeError(error as Error, 'cursos'));
        res.status(500).json({ success: false, message: 'Error al eliminar curso' });
    }
});

export default router;
