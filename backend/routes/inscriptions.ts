/**
 * 📝 API CRUD PARA INSCRIPCIONES - TypeScript
 * Gestión de solicitudes de inscripción a actividades extracurriculares
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';

// ✅ FASE 3: DAO Layer
import InscriptionsDAO from '../data/inscriptions.dao';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface Inscription {
    id: number;
    activity_id: string;
    activity_name: string;
    student_id?: string;
    student_name: string;
    student_email: string;
    student_group?: string;
    emergency_contact?: string;
    additional_info?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    admin_notes?: string;
    processed_by?: number;
    fecha_solicitud: string;
    created_at: string;
    updated_at: string;
}

interface InscriptionStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/inscriptions/register
 */
router.post('/register', [
    body('activityId').trim().notEmpty().withMessage('ID de actividad requerido'),
    body('activityName').trim().notEmpty().withMessage('Nombre de actividad requerido'),
    body('studentName').trim().notEmpty().withMessage('Nombre del estudiante requerido'),
    body('studentEmail').isEmail().withMessage('Email inválido'),
    body('studentId').optional().trim(),
    body('studentGroup').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('additionalInfo').optional().trim()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    const { activityId, activityName, studentId, studentName, studentEmail, studentGroup, emergencyContact, additionalInfo } = req.body;
    const ip_address = req.ip || (req.connection as any).remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        const existing = await InscriptionsDAO.checkExisting(studentEmail, activityId) as Inscription | null;

        if (existing) {
            if (existing.status === 'pending') {
                res.json({ success: true, message: 'Ya tienes una solicitud pendiente.', data: { id: existing.id, already_pending: true } });
                return;
            }
            if (existing.status === 'approved') {
                res.json({ success: true, message: 'Ya estás inscrito.', data: { id: existing.id, already_approved: true } });
                return;
            }
            if (existing.status === 'rejected' || existing.status === 'cancelled') {
                const result = await InscriptionsDAO.updateResubmit(existing.id, { studentName, studentId, studentGroup, emergencyContact, additionalInfo, ip_address, user_agent });
                debugLog.log('INSCRIPTIONS', '✅ Inscripción actualizada (reintento):', result.id);
                res.json({ success: true, message: 'Tu nueva solicitud ha sido enviada.', data: { id: result.id, resubmitted: true } });
                return;
            }
        }

        const result = await InscriptionsDAO.create({ activityId, activityName, studentId, studentName, studentEmail, studentGroup, emergencyContact, additionalInfo, ip_address, user_agent });
        debugLog.log('INSCRIPTIONS', '✅ Nueva inscripción creada:', result.id);
        res.status(201).json({ success: true, message: '¡Solicitud enviada exitosamente!', data: { id: result.id, activityName: result.activity_name, fecha: result.fecha_solicitud } });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al crear inscripción:', sanitizeError(error as Error, 'inscriptions'));
        const err = error as Error & { code?: string };
        if (err.code === '23505') {
            res.status(400).json({ success: false, error: 'Ya existe una solicitud para esta actividad con este email' });
            return;
        }
        res.status(500).json({ success: false, error: 'Error al procesar tu solicitud.' });
    }
});

/**
 * GET /api/inscriptions
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { status, activity_id, student_email, limit = '50', offset = '0' } = req.query as Record<string, string>;
    try {
        const { data, total } = await InscriptionsDAO.getAll({ status, activity_id, student_email, limit, offset });
        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al obtener inscripciones:', sanitizeError(error as Error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al obtener los datos' });
    }
});

/**
 * GET /api/inscriptions/list
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
    try {
        const inscripciones = await InscriptionsDAO.list() as Inscription[];
        res.json({ success: true, inscripciones, total: inscripciones.length });
    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al listar inscripciones:', sanitizeError(error as Error, 'inscriptions'));
        res.json({ success: true, inscripciones: [], total: 0, message: 'Error al obtener inscripciones' });
    }
});

/**
 * GET /api/inscriptions/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await InscriptionsDAO.getStats() as InscriptionStats;
        res.json({ success: true, data: stats });
    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al obtener estadísticas:', sanitizeError(error as Error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/inscriptions/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const inscripcion = await InscriptionsDAO.getById(id) as Inscription | null;
        if (!inscripcion) {
            res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
            return;
        }
        res.json({ success: true, data: inscripcion });
    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al obtener inscripción:', sanitizeError(error as Error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al obtener la inscripción' });
    }
});

/**
 * PUT /api/inscriptions/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, admin_notes, processed_by } = req.body as { status?: string; admin_notes?: string; processed_by?: number };

    try {
        const result = await InscriptionsDAO.update(id, { status, admin_notes, processed_by });
        if (!result) {
            res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
            return;
        }
        debugLog.log('INSCRIPTIONS', `✅ Inscripción ${id} actualizada: ${status}`);
        res.json({ success: true, message: 'Inscripción actualizada correctamente', data: result });
    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al actualizar inscripción:', sanitizeError(error as Error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al actualizar la inscripción' });
    }
});

/**
 * DELETE /api/inscriptions/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await InscriptionsDAO.cancel(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Inscripción cancelada correctamente' });
    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al cancelar inscripción:', sanitizeError(error as Error, 'inscriptions'));
        res.status(500).json({ success: false, error: 'Error al cancelar la inscripción' });
    }
});

export default router;
