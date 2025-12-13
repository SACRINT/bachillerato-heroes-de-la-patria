"use strict";
/**
 * 🔐 RUTAS DE ADMINISTRACIÓN - BGE HÉROES DE LA PATRIA
 * Endpoints para gestión administrativa de solicitudes de registro y usuarios.
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
// @ts-ignore
const authService_1 = require("../services/authService");
// @ts-ignore
const passwordGenerator_1 = require("../utils/passwordGenerator");
// @ts-ignore
const admin_dao_1 = __importDefault(require("../data/admin.dao"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
// @ts-ignore
const audit_logging_service_1 = __importDefault(require("../services/audit-logging-service"));
const router = express_1.default.Router();
// Instancias de servicios
const authService = (0, authService_1.getAuthService)();
const passwordGenerator = (0, passwordGenerator_1.getPasswordGenerator)();
// Rutas de archivos
const REGISTRATION_REQUESTS_PATH = path_1.default.join(__dirname, '../data/registration-requests.json');
/**
 * Helpers para manejo de solicitudes de registro
 */
const RegistrationHelpers = {
    async readRegistrationRequests() {
        try {
            const data = await promises_1.default.readFile(REGISTRATION_REQUESTS_PATH, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            const initialData = { requests: [], lastId: 0 };
            await promises_1.default.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
    },
    async writeRegistrationRequests(data) {
        await promises_1.default.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(data, null, 2));
    },
    async findRequestById(requestId) {
        const data = await this.readRegistrationRequests();
        const request = data.requests.find((req) => req.id === requestId);
        return { request, data };
    }
};
// ============================================
// ENDPOINTS DE ADMINISTRACIÓN
// ============================================
router.get('/pending-registrations', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const pendingRequests = data.requests.filter((req) => req.status === 'pending');
        pendingRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        debug_logger_1.debugLog.log('ADMIN', `📋 Admin ${req.user.email} consultó solicitudes pendientes: ${pendingRequests.length}`);
        res.json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests,
            totalRequests: data.requests.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', '❌ Error obteniendo solicitudes pendientes', (0, sanitized_errors_1.sanitizeError)(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor', message: 'No se pudieron cargar las solicitudes pendientes' });
    }
});
router.get('/all-registrations', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const allRequests = [...data.requests];
        allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const stats = {
            total: allRequests.length,
            pending: allRequests.filter((r) => r.status === 'pending').length,
            approved: allRequests.filter((r) => r.status === 'approved').length,
            rejected: allRequests.filter((r) => r.status === 'rejected').length
        };
        res.json({ success: true, stats, requests: allRequests, timestamp: new Date().toISOString() });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', '❌ Error obteniendo todas las solicitudes', (0, sanitized_errors_1.sanitizeError)(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor', message: 'No se pudieron cargar las solicitudes' });
    }
});
router.get('/check-approval/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const data = await RegistrationHelpers.readRegistrationRequests();
        const approvedRequest = data.requests.find((req) => req.email.toLowerCase() === email.toLowerCase() && req.status === 'approved');
        res.json({
            success: true,
            email: email,
            approved: !!approvedRequest,
            approvedAt: approvedRequest?.approvedAt || null,
            role: approvedRequest?.requestedRole || 'estudiante'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', '❌ Error verificando aprobación', (0, sanitized_errors_1.sanitizeError)(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, approved: false });
    }
});
router.post('/approve-registration', auth_1.authenticateToken, auth_1.requireAdmin, [
    (0, express_validator_1.body)('requestId').notEmpty().withMessage('ID de solicitud requerido'),
    (0, express_validator_1.body)('reviewNotes').optional().isLength({ max: 500 }).withMessage('Notas de revisión máximo 500 caracteres')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { requestId, reviewNotes } = req.body;
        const { request, data } = await RegistrationHelpers.findRequestById(requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' });
            return;
        }
        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.reviewedBy = req.user.email;
        request.reviewNotes = reviewNotes || '';
        await RegistrationHelpers.writeRegistrationRequests(data);
        res.json({ success: true, message: 'Solicitud aprobada correctamente', request });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error aprobando solicitud' });
    }
});
router.post('/reject-registration', auth_1.authenticateToken, auth_1.requireAdmin, [
    (0, express_validator_1.body)('requestId').notEmpty().withMessage('ID de solicitud requerido'),
    (0, express_validator_1.body)('reviewNotes').isLength({ min: 10, max: 500 }).withMessage('Notas de revisión requeridas (10-500 caracteres)')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { requestId, reviewNotes } = req.body;
        const { request, data } = await RegistrationHelpers.findRequestById(requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' });
            return;
        }
        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();
        request.reviewedBy = req.user.email;
        request.reviewNotes = reviewNotes;
        await RegistrationHelpers.writeRegistrationRequests(data);
        res.json({ success: true, message: 'Solicitud rechazada', request });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error rechazando solicitud' });
    }
});
router.get('/registration-stats', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();
        const pending = data.requests.filter((r) => r.status === 'pending').length;
        const approved = data.requests.filter((r) => r.status === 'approved').length;
        const rejected = data.requests.filter((r) => r.status === 'rejected').length;
        res.json({ success: true, stats: { total: data.requests.length, pending, approved, rejected } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
    }
});
router.get('/teachers', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const teachers = await admin_dao_1.default.getTeachers();
        res.json({ success: true, data: teachers });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', '❌ Error al obtener docentes', (0, sanitized_errors_1.sanitizeError)(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener docentes' });
    }
});
router.get('/students', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        debug_logger_1.debugLog.log('ADMIN', '[DB_DEBUG] Ejecutando consulta: SELECT * FROM estudiantes');
        const students = await admin_dao_1.default.getStudents();
        debug_logger_1.debugLog.log('ADMIN', `[DB_DEBUG] ✅ Consulta exitosa: ${students.length} estudiantes encontrados`);
        res.json({ success: true, data: students });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', '❌ Error al obtener estudiantes', (0, sanitized_errors_1.sanitizeError)(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estudiantes' });
    }
});
router.get('/parents', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const parents = await admin_dao_1.default.getParents();
        res.json({ success: true, data: parents, total: parents.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', '❌ Error al obtener padres', (0, sanitized_errors_1.sanitizeError)(new Error('Admin error'), 'admin'));
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener padres' });
    }
});
/**
 * PUT /api/admin/users/:id/role
 * Actualizar el rol de un usuario (Admin only)
 */
router.put('/users/:id/role', auth_1.authenticateToken, auth_1.requireAdmin, [
    (0, express_validator_1.body)('role').isIn(['admin', 'docente', 'estudiante', 'padre_familia']).withMessage('Rol inválido proporcionado')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { id: userIdToUpdate } = req.params;
    const { role: newRole } = req.body;
    const adminUserId = req.user.userId;
    try {
        const oldUser = await admin_dao_1.default.getUserById(userIdToUpdate);
        if (!oldUser) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            return;
        }
        const oldRole = oldUser.role;
        if (parseInt(userIdToUpdate) === adminUserId && newRole !== 'admin') {
            res.status(403).json({ success: false, message: 'No puedes cambiar tu propio rol a uno que no sea administrador.' });
            return;
        }
        const updatedUser = await authService.updateUserRole(userIdToUpdate, newRole);
        await audit_logging_service_1.default.logRoleChanged(parseInt(userIdToUpdate), oldRole, newRole, adminUserId, req.tenant?.id);
        res.json({ success: true, message: `Rol del usuario actualizado a '${newRole}' exitosamente.`, user: updatedUser });
    }
    catch (error) {
        debug_logger_1.debugLog.error('ADMIN', `Falla al actualizar rol para usuario ${userIdToUpdate}:`, error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el rol.' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map