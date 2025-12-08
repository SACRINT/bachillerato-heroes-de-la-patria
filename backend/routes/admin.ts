/**
 * 🔐 RUTAS DE ADMINISTRACIÓN - BGE HÉROES DE LA PATRIA
 * Endpoints para gestión administrativa de solicitudes de registro y usuarios.
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
// @ts-ignore
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
// @ts-ignore
import { getAuthService } from '../services/authService';
// @ts-ignore
import { getPasswordGenerator } from '../utils/passwordGenerator';
// @ts-ignore
import AdminDAO from '../data/admin.dao';
import fs from 'fs/promises';
import path from 'path';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail, maskToken } from '../utils/sanitized-errors';
// @ts-ignore
import AuditLoggingService from '../services/audit-logging-service';

const router: Router = express.Router();

// Instancias de servicios
const authService = getAuthService();
const passwordGenerator = getPasswordGenerator();

// Rutas de archivos
const REGISTRATION_REQUESTS_PATH = path.join(__dirname, '../data/registration-requests.json');

interface RequestWithUser extends Request {
    user?: {
        id: number;
        userId: number; // For consistency
        email: string;
        role: string;
    };
    tenant?: {
        id: number;
    }
}

/**
 * Helpers para manejo de solicitudes de registro
 */
const RegistrationHelpers = {
    async readRegistrationRequests() {
        try {
            const data = await fs.readFile(REGISTRATION_REQUESTS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            const initialData = { requests: [], lastId: 0 };
            await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
    },
    async writeRegistrationRequests(data: any) {
        await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(data, null, 2));
    },
    async findRequestById(requestId: string) {
        const data = await this.readRegistrationRequests();
        const request = data.requests.find((req: any) => req.id === requestId);
        return { request, data };
    }
};

// ============================================
// ENDPOINTS DE ADMINISTRACIÓN
// ============================================

router.get('/pending-registrations', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const pendingRequests = data.requests.filter((req: any) => req.status === 'pending');
        pendingRequests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        debugLog.log('ADMIN', `📋 Admin ${req.user!.email} consultó solicitudes pendientes: ${pendingRequests.length}`);
        res.json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests,
            totalRequests: data.requests.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error obteniendo solicitudes pendientes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor', message: 'No se pudieron cargar las solicitudes pendientes' });
    }
});

router.get('/all-registrations', authenticateToken, requireAdmin, async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const allRequests = [...data.requests];
        allRequests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const stats = {
            total: allRequests.length,
            pending: allRequests.filter((r: any) => r.status === 'pending').length,
            approved: allRequests.filter((r: any) => r.status === 'approved').length,
            rejected: allRequests.filter((r: any) => r.status === 'rejected').length
        };
        res.json({ success: true, stats, requests: allRequests, timestamp: new Date().toISOString() });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error obteniendo todas las solicitudes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor', message: 'No se pudieron cargar las solicitudes' });
    }
});

router.get('/check-approval/:email', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.params;
        const data = await RegistrationHelpers.readRegistrationRequests();
        const approvedRequest = data.requests.find(
            (req: any) => req.email.toLowerCase() === email.toLowerCase() && req.status === 'approved'
        );
        res.json({
            success: true,
            email: email,
            approved: !!approvedRequest,
            approvedAt: approvedRequest?.approvedAt || null,
            role: approvedRequest?.requestedRole || 'estudiante'
        });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error verificando aprobación', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, approved: false });
    }
});

router.post('/approve-registration', authenticateToken, requireAdmin, [
    body('requestId').notEmpty().withMessage('ID de solicitud requerido'),
    body('reviewNotes').optional().isLength({ max: 500 }).withMessage('Notas de revisión máximo 500 caracteres')
], async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const { requestId, reviewNotes } = req.body;
        const { request, data } = await RegistrationHelpers.findRequestById(requestId);

        if (!request) { res.status(404).json({ success: false, message: 'Solicitud no encontrada' }); return; }
        if (request.status !== 'pending') { res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' }); return; }

        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.reviewedBy = req.user!.email;
        request.reviewNotes = reviewNotes || '';

        await RegistrationHelpers.writeRegistrationRequests(data);
        res.json({ success: true, message: 'Solicitud aprobada correctamente', request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error aprobando solicitud' });
    }
});

router.post('/reject-registration', authenticateToken, requireAdmin, [
    body('requestId').notEmpty().withMessage('ID de solicitud requerido'),
    body('reviewNotes').isLength({ min: 10, max: 500 }).withMessage('Notas de revisión requeridas (10-500 caracteres)')
], async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const { requestId, reviewNotes } = req.body;
        const { request, data } = await RegistrationHelpers.findRequestById(requestId);

        if (!request) { res.status(404).json({ success: false, message: 'Solicitud no encontrada' }); return; }
        if (request.status !== 'pending') { res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' }); return; }

        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();
        request.reviewedBy = req.user!.email;
        request.reviewNotes = reviewNotes;

        await RegistrationHelpers.writeRegistrationRequests(data);
        res.json({ success: true, message: 'Solicitud rechazada', request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error rechazando solicitud' });
    }
});

router.get('/registration-stats', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const pending = data.requests.filter((r: any) => r.status === 'pending').length;
        const approved = data.requests.filter((r: any) => r.status === 'approved').length;
        const rejected = data.requests.filter((r: any) => r.status === 'rejected').length;

        res.json({ success: true, stats: { total: data.requests.length, pending, approved, rejected } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
    }
});

router.get('/teachers', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const teachers = await AdminDAO.getTeachers();
        res.json({ success: true, data: teachers });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error al obtener docentes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener docentes' });
    }
});

router.get('/students', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        debugLog.log('ADMIN', '[DB_DEBUG] Ejecutando consulta: SELECT * FROM estudiantes');
        const students = await AdminDAO.getStudents();
        debugLog.log('ADMIN', `[DB_DEBUG] ✅ Consulta exitosa: ${students.length} estudiantes encontrados`);
        res.json({ success: true, data: students });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error al obtener estudiantes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estudiantes' });
    }
});

router.get('/parents', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const parents = await AdminDAO.getParents();
        res.json({ success: true, data: parents, total: parents.length });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error al obtener padres', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener padres' });
    }
});

/**
 * PUT /api/admin/users/:id/role
 * Actualizar el rol de un usuario (Admin only)
 */
router.put('/users/:id/role', authenticateToken, requireAdmin, [
    body('role').isIn(['admin', 'docente', 'estudiante', 'padre_familia']).withMessage('Rol inválido proporcionado')
], async (req: RequestWithUser, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

    const { id: userIdToUpdate } = req.params;
    const { role: newRole } = req.body;
    const adminUserId = req.user!.userId;

    try {
        const oldUser = await AdminDAO.getUserById(userIdToUpdate);
        if (!oldUser) { res.status(404).json({ success: false, message: 'Usuario no encontrado.' }); return; }
        const oldRole = oldUser.role;

        if (parseInt(userIdToUpdate) === adminUserId && newRole !== 'admin') {
            res.status(403).json({ success: false, message: 'No puedes cambiar tu propio rol a uno que no sea administrador.' }); return;
        }

        const updatedUser = await authService.updateUserRole(userIdToUpdate, newRole);

        await AuditLoggingService.logRoleChanged(
            parseInt(userIdToUpdate),
            oldRole,
            newRole,
            adminUserId,
            req.tenant?.id
        );

        res.json({ success: true, message: `Rol del usuario actualizado a '${newRole}' exitosamente.`, user: updatedUser });

    } catch (error) {
        debugLog.error('ADMIN', `Falla al actualizar rol para usuario ${userIdToUpdate}:`, error as Error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el rol.' });
    }
});

export default router;
