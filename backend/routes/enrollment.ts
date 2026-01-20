/**
 * Enrollment Routes
 * API para sistema de inscripciones
 */

import { Router, Request, Response } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
const { authenticateToken, requireRole } = require('../middleware/auth');
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

import EnrollmentService from '../services/enrollment.service';
import PaymentService from '../services/payment.service';

interface AuthenticatedRequest extends Request {
    user: { id: number; email: string; role: string; };
}

const router = Router();

// Crear solicitud (público)
router.post('/apply', [
    body('nombres').notEmpty(),
    body('apellido_paterno').notEmpty(),
    body('fecha_nacimiento').isISO8601(),
    body('curp').notEmpty().isLength({ min: 18, max: 18 }),
    body('email').isEmail(),
    body('telefono').notEmpty()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const application = await EnrollmentService.createApplication(req.body);

        res.status(201).json({
            success: true,
            message: 'Solicitud creada exitosamente',
            data: application
        });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error creando solicitud', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al crear solicitud' });
    }
});

// Actualizar solicitud
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await EnrollmentService.updateApplication(parseInt(id), req.body);

        res.json({ success: true, data: updated });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error actualizando solicitud', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al actualizar solicitud' });
    }
});

// Enviar para revisión
router.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const submitted = await EnrollmentService.submitApplication(parseInt(id));

        res.json({
            success: true,
            message: 'Solicitud enviada para revisión',
            data: submitted
        });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error enviando solicitud', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// Subir documento
router.post('/:id/documents', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tipo_documento, url, nombre_archivo, mime_type, tamano_bytes } = req.body;

        const doc = await EnrollmentService.uploadDocument({
            solicitud_id: parseInt(id),
            tipo_documento,
            nombre_archivo,
            url,
            mime_type,
            tamano_bytes
        });

        res.json({ success: true, data: doc });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error subiendo documento', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al subir documento' });
    }
});

// Listar solicitudes (admin)
router.get('/list', authenticateToken, requireRole(['admin', 'coordinador']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, ciclo_escolar, tipo_inscripcion } = req.query;

        const filters: any = {};
        if (status) filters.status = status as string;
        if (ciclo_escolar) filters.ciclo_escolar = ciclo_escolar as string;
        if (tipo_inscripcion) filters.tipo_inscripcion = tipo_inscripcion as string;

        const applications = await EnrollmentService.getApplications(filters);

        res.json({ success: true, data: applications });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error listando solicitudes', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al listar solicitudes' });
    }
});

// Aprobar solicitud (admin)
router.post('/:id/approve', authenticateToken, requireRole(['admin', 'coordinador']), async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { id } = req.params;

        const approved = await EnrollmentService.approveApplication(parseInt(id), authReq.user.id);

        res.json({
            success: true,
            message: 'Solicitud aprobada',
            data: approved
        });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error aprobando solicitud', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al aprobar solicitud' });
    }
});

// Rechazar solicitud (admin)
router.post('/:id/reject', authenticateToken, requireRole(['admin', 'coordinador']), [
    body('motivo').notEmpty()
] as ValidationChain[], async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { id } = req.params;
        const { motivo } = req.body;

        const rejected = await EnrollmentService.rejectApplication(parseInt(id), motivo, authReq.user.id);

        res.json({
            success: true,
            message: 'Solicitud rechazada',
            data: rejected
        });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error rechazando solicitud', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al rechazar solicitud' });
    }
});

// Crear pago con tarjeta
router.post('/:id/payment/card', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;

        const payment = await PaymentService.createPaymentIntent({
            amount,
            currency: 'MXN',
            description: description || 'Pago de inscripción',
            metadata: {
                solicitud_id: parseInt(id),
                tipo_pago: 'inscripcion'
            }
        });

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error creando pago', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al crear pago' });
    }
});

// Crear pago OXXO
router.post('/:id/payment/oxxo', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;

        const payment = await PaymentService.createOxxoPayment({
            amount,
            currency: 'MXN',
            description: description || 'Pago de inscripción',
            metadata: {
                solicitud_id: parseInt(id),
                tipo_pago: 'inscripcion'
            }
        });

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error creando pago OXXO', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al crear pago OXXO' });
    }
});

// Webhook de Stripe
router.post('/webhook/stripe', async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, data } = req.body;

        if (type === 'payment_intent.succeeded') {
            await PaymentService.confirmPayment(data.object.id);
        }

        res.json({ received: true });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error en webhook', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false });
    }
});

// Estadísticas (admin)
router.get('/stats', authenticateToken, requireRole(['admin', 'coordinador']), async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await EnrollmentService.getStats();

        res.json({ success: true, data: stats });
    } catch (error) {
        debugLog.error('ENROLLMENT', 'Error obteniendo estadísticas', sanitizeError(error as Error, 'ENROLLMENT'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});

export default router;
