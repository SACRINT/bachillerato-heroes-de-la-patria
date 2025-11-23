/**
 * 🔐 RUTAS DE ADMINISTRACIÓN - BGE HÉROES DE LA PATRIA
 * Endpoints para gestión administrativa de solicitudes de registro y usuarios.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAuthService } = require('../services/authService');
const { getPasswordGenerator } = require('../utils/passwordGenerator');
const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');
const AuditLoggingService = require('../services/audit-logging-service');

const router = express.Router();

// Instancias de servicios
const authService = getAuthService();
const passwordGenerator = getPasswordGenerator();

// Rutas de archivos
const REGISTRATION_REQUESTS_PATH = path.join(__dirname, '../data/registration-requests.json');

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
    async writeRegistrationRequests(data) {
        await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(data, null, 2));
    },
    async findRequestById(requestId) {
        const data = await this.readRegistrationRequests();
        const request = data.requests.find(req => req.id === requestId);
        return { request, data };
    }
};

// ============================================
// ENDPOINTS DE ADMINISTRACIÓN
// ============================================

router.get('/pending-registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const pendingRequests = data.requests.filter(req => req.status === 'pending');
        pendingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        debugLog.log('ADMIN', `📋 Admin ${req.user.email} consultó solicitudes pendientes: ${pendingRequests.length}`);
        res.json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests,
            totalRequests: data.requests.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error obteniendo solicitudes pendientes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron cargar las solicitudes pendientes'
        });
    }
});

router.get('/all-registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const allRequests = [...data.requests];
        allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const stats = {
            total: allRequests.length,
            pending: allRequests.filter(r => r.status === 'pending').length,
            approved: allRequests.filter(r => r.status === 'approved').length,
            rejected: allRequests.filter(r => r.status === 'rejected').length
        };
        res.json({
            success: true,
            stats,
            requests: allRequests,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error obteniendo todas las solicitudes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron cargar las solicitudes'
        });
    }
});

router.get('/check-approval/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const data = await RegistrationHelpers.readRegistrationRequests();
        const approvedRequest = data.requests.find(
            req => req.email.toLowerCase() === email.toLowerCase() &&
                   req.status === 'approved'
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
        res.status(500).json({
            success: false,
            approved: false
        });
    }
});

router.post('/approve-registration', authenticateToken, requireAdmin, [
    body('requestId').notEmpty().withMessage('ID de solicitud requerido'),
    body('reviewNotes').optional().isLength({ max: 500 }).withMessage('Notas de revisión máximo 500 caracteres')
], async (req, res) => {
    // ... (logic from original file)
});

router.post('/reject-registration', authenticateToken, requireAdmin, [
    body('requestId').notEmpty().withMessage('ID de solicitud requerido'),
    body('reviewNotes').isLength({ min: 10, max: 500 }).withMessage('Notas de revisión requeridas (10-500 caracteres)')
], async (req, res) => {
    // ... (logic from original file)
});

router.get('/registration-stats', authenticateToken, requireAdmin, async (req, res) => {
    // ... (logic from original file)
});

router.get('/teachers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM docentes ORDER BY apellido_paterno, apellido_materno, nombre ASC');
        const teachers = result.rows || [];
        res.json({ success: true, data: teachers });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error al obtener docentes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener docentes' });
    }
});

router.get('/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        debugLog.log('ADMIN', '[DB_DEBUG] Ejecutando consulta: SELECT * FROM estudiantes');
        const result = await pool.query('SELECT * FROM estudiantes ORDER BY apellido_paterno, apellido_materno, nombre ASC');
        const students = result.rows || [];
        debugLog.log('ADMIN', `[DB_DEBUG] ✅ Consulta exitosa: ${students.length} estudiantes encontrados`);
        res.json({ success: true, data: students });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error al obtener estudiantes', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estudiantes' });
    }
});

router.get('/parents', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.nombre, p.email, p.telefono, p.fecha_creacion as fecha_registro, p.activo
            FROM parents p ORDER BY p.nombre ASC
        `);
        const parents = result.rows || [];
        res.json({ success: true, data: parents, total: parents.length });
    } catch (error) {
        debugLog.error('ADMIN', '❌ Error al obtener padres', sanitizeError(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener padres' });
    }
});

/**
 * PUT /api/admin/users/:id/role
 * Actualizar el rol de un usuario (Admin only)
 * Tarea: Semana 28 - SOC2 Audit Trail
 */
router.put('/users/:id/role', authenticateToken, requireAdmin, [
    body('role').isIn(['admin', 'docente', 'estudiante', 'padre_familia']).withMessage('Rol inválido proporcionado')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id: userIdToUpdate } = req.params;
    const { role: newRole } = req.body;
    const adminUserId = req.user.userId; // ID del admin que realiza la acción

    try {
        // 1. Obtener el estado actual del usuario para la auditoría
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userIdToUpdate]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
        const oldUser = userResult.rows[0];
        const oldRole = oldUser.role;

        // Prevenir cambiar el propio rol a algo que no sea admin para evitar auto-bloqueo
        if (parseInt(userIdToUpdate, 10) === adminUserId && newRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'No puedes cambiar tu propio rol a uno que no sea administrador.' });
        }

        // 2. Actualizar el rol del usuario usando el servicio
        const updatedUser = await authService.updateUserRole(userIdToUpdate, newRole);

        // 3. Registrar el evento de auditoría (¡Paso CRÍTICO para SOC2!)
        await AuditLoggingService.logRoleChanged(
            parseInt(userIdToUpdate),
            oldRole,
            newRole,
            adminUserId,
            req.tenant?.id // Asumiendo que el middleware de tenant añade esta info
        );

        res.json({
            success: true,
            message: `Rol del usuario actualizado a '${newRole}' exitosamente.`,
            user: updatedUser
        });

    } catch (error) {
        devLogger.error(`[ADMIN] Falla al actualizar rol para usuario ${userIdToUpdate}:`, error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el rol.' });
    }
});


module.exports = router;