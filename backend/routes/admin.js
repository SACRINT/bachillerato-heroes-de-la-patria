/**
 * 🔐 RUTAS DE ADMINISTRACIÓN - BGE HÉROES DE LA PATRIA
 * Endpoints para gestión administrativa de solicitudes de registro
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAuthService } = require('../services/authService');
const { getPasswordGenerator } = require('../utils/passwordGenerator');
const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// GDPR Logging - Debug condicional y sanitización
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');

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
    /**
     * Leer solicitudes desde archivo JSON
     */
    async readRegistrationRequests() {
        try {
            const data = await fs.readFile(REGISTRATION_REQUESTS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, crearlo
            const initialData = { requests: [], lastId: 0 };
            await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
    },

    /**
     * Guardar solicitudes en archivo JSON
     */
    async writeRegistrationRequests(data) {
        await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(data, null, 2));
    },

    /**
     * Buscar solicitud por ID
     */
    async findRequestById(requestId) {
        const data = await this.readRegistrationRequests();
        const request = data.requests.find(req => req.id === requestId);
        return { request, data };
    }
};

// ============================================
// ENDPOINTS DE ADMINISTRACIÓN
// ============================================

/**
 * GET /api/admin/pending-registrations
 * Obtener todas las solicitudes pendientes de registro
 * Requiere: Autenticación de administrador
 */
router.get('/pending-registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();

        // Filtrar solo solicitudes pendientes
        const pendingRequests = data.requests.filter(req => req.status === 'pending');

        // Ordenar por fecha de creación (más reciente primero)
        pendingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        devLogger.log('📋 Admin ${req.user.email} consultó solicitudes pendientes: ${pendingRequests.length}');

        res.json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests,
            totalRequests: data.requests.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        devLogger.error('❌ Error obteniendo solicitudes pendientes:');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron cargar las solicitudes pendientes'
        });
    }
});

/**
 * GET /api/admin/all-registrations
 * Obtener TODAS las solicitudes de registro (incluyendo aprobadas y rechazadas)
 * Requiere: Autenticación de administrador
 */
router.get('/all-registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();

        // Ordenar por fecha de creación (más reciente primero)
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
        devLogger.error('❌ Error obteniendo todas las solicitudes:');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron cargar las solicitudes'
        });
    }
});

/**
 * GET /api/admin/check-approval/:email
 * Verificar si un email está aprobado
 * Público (no requiere autenticación para permitir login)
 */
router.get('/check-approval/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const data = await RegistrationHelpers.readRegistrationRequests();

        // Buscar solicitud aprobada para este email
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
        devLogger.error('❌ Error verificando aprobación:');
        res.status(500).json({
            success: false,
            approved: false
        });
    }
});

/**
 * POST /api/admin/approve-registration
 * Aprobar solicitud de registro y crear usuario
 * Requiere: Autenticación de administrador
 */
router.post('/approve-registration', authenticateToken, requireAdmin, [
    body('requestId')
        .notEmpty()
        .withMessage('ID de solicitud requerido'),
    body('reviewNotes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notas de revisión máximo 500 caracteres')
], async (req, res) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { requestId, reviewNotes } = req.body;

        // Buscar solicitud
        const { request, data } = await RegistrationHelpers.findRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada',
                message: `No se encontró la solicitud con ID: ${requestId}`
            });
        }

        // Verificar que esté pendiente
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Solicitud ya procesada',
                message: `Esta solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 'rechazada'}`
            });
        }

        // Generar contraseña temporal
        const temporaryPassword = passwordGenerator.generateInstitutionalPassword('BGE');

        // Mapear roles
        const roleMapping = {
            'docente': 'docente',
            'estudiante': 'estudiante',
            'administrativo': 'admin'
        };

        const userRole = roleMapping[request.requestedRole] || 'estudiante';

        // Crear usuario en el sistema
        try {
            // Extraer nombre y apellidos del fullName
            const nameParts = request.fullName.trim().split(' ');
            let nombre, apellidoPaterno, apellidoMaterno;

            if (nameParts.length >= 3) {
                apellidoPaterno = nameParts[0];
                apellidoMaterno = nameParts[1];
                nombre = nameParts.slice(2).join(' ');
            } else if (nameParts.length === 2) {
                apellidoPaterno = nameParts[0];
                nombre = nameParts[1];
                apellidoMaterno = null;
            } else {
                nombre = request.fullName;
                apellidoPaterno = 'Pendiente';
                apellidoMaterno = null;
            }

            // Generar username a partir del email
            const username = request.email.split('@')[0];

            const newUser = await authService.createUser({
                email: request.email,
                password: temporaryPassword,
                username: username,
                nombre: nombre,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                role: userRole
            });

            // Actualizar solicitud
            const requestIndex = data.requests.findIndex(r => r.id === requestId);
            data.requests[requestIndex].status = 'approved';
            data.requests[requestIndex].reviewedBy = req.user.email;
            data.requests[requestIndex].reviewedAt = new Date().toISOString();
            data.requests[requestIndex].reviewNotes = reviewNotes || 'Solicitud aprobada';
            data.requests[requestIndex].userId = newUser.id;

            // Guardar cambios
            await RegistrationHelpers.writeRegistrationRequests(data);

            devLogger.log('✅ Admin ${req.user.email} aprobó solicitud ${requestId} - Usuario creado: ${newUser.email}');

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role,
                    temporaryPassword: temporaryPassword
                },
                request: {
                    id: request.id,
                    status: 'approved',
                    reviewedAt: data.requests[requestIndex].reviewedAt
                },
                notice: 'IMPORTANTE: Guarda la contraseña temporal y envíala al usuario de forma segura. Esta es la única vez que se mostrará.'
            });

        } catch (userError) {
            devLogger.error('❌ Error creando usuario:', userError);

            // Si falla la creación del usuario, revertir el cambio de estado
            return res.status(500).json({
                success: false,
                error: 'Error creando usuario',
                message: userError.message
            });
        }

    } catch (error) {
        devLogger.error('❌ Error aprobando solicitud:');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo aprobar la solicitud'
        });
    }
});

/**
 * POST /api/admin/reject-registration
 * Rechazar solicitud de registro
 * Requiere: Autenticación de administrador
 */
router.post('/reject-registration', authenticateToken, requireAdmin, [
    body('requestId')
        .notEmpty()
        .withMessage('ID de solicitud requerido'),
    body('reviewNotes')
        .isLength({ min: 10, max: 500 })
        .withMessage('Notas de revisión requeridas (10-500 caracteres)')
], async (req, res) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { requestId, reviewNotes } = req.body;

        // Buscar solicitud
        const { request, data } = await RegistrationHelpers.findRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada',
                message: `No se encontró la solicitud con ID: ${requestId}`
            });
        }

        // Verificar que esté pendiente
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Solicitud ya procesada',
                message: `Esta solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 'rechazada'}`
            });
        }

        // Actualizar solicitud
        const requestIndex = data.requests.findIndex(r => r.id === requestId);
        data.requests[requestIndex].status = 'rejected';
        data.requests[requestIndex].reviewedBy = req.user.email;
        data.requests[requestIndex].reviewedAt = new Date().toISOString();
        data.requests[requestIndex].reviewNotes = reviewNotes;

        // Guardar cambios
        await RegistrationHelpers.writeRegistrationRequests(data);

        devLogger.log('🚫 Admin ${req.user.email} rechazó solicitud ${requestId}');

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente',
            request: {
                id: request.id,
                email: request.email,
                status: 'rejected',
                reviewedBy: req.user.email,
                reviewedAt: data.requests[requestIndex].reviewedAt,
                reviewNotes: reviewNotes
            }
        });

    } catch (error) {
        devLogger.error('❌ Error rechazando solicitud:');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo rechazar la solicitud'
        });
    }
});

/**
 * GET /api/admin/registration-stats
 * Obtener estadísticas de solicitudes de registro
 * Requiere: Autenticación de administrador
 */
router.get('/registration-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const data = await RegistrationHelpers.readRegistrationRequests();

        const stats = {
            total: data.requests.length,
            pending: data.requests.filter(r => r.status === 'pending').length,
            approved: data.requests.filter(r => r.status === 'approved').length,
            rejected: data.requests.filter(r => r.status === 'rejected').length,
            byRole: {
                docente: data.requests.filter(r => r.requestedRole === 'docente').length,
                estudiante: data.requests.filter(r => r.requestedRole === 'estudiante').length,
                administrativo: data.requests.filter(r => r.requestedRole === 'administrativo').length
            },
            recent: {
                last24h: data.requests.filter(r => {
                    const requestDate = new Date(r.createdAt);
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return requestDate > yesterday;
                }).length,
                last7days: data.requests.filter(r => {
                    const requestDate = new Date(r.createdAt);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return requestDate > weekAgo;
                }).length
            }
        };

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        devLogger.error('❌ Error obteniendo estadísticas:');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron cargar las estadísticas'
        });
    }
});

/**
 * GET /api/admin/teachers
 * Obtener todos los docentes
 * Requiere: Autenticación de administrador
 */
router.get('/teachers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM docentes ORDER BY apellido_paterno, apellido_materno, nombre ASC');
        const teachers = result.rows || [];
        res.json({ success: true, data: teachers });
    } catch (error) {
        devLogger.error('❌ Error al obtener docentes:');
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener docentes' });
    }
});

/**
 * GET /api/admin/students
 * Obtener todos los estudiantes
 * Requiere: Autenticación de administrador
 */
router.get('/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // 🔍 LOGS DE DIAGNÓSTICO - Verificar conexión a BD
        devLogger.log('[DB_DEBUG] DATABASE_URL presente: ${!!process.env.DATABASE_URL}');
        devLogger.log('[DB_DEBUG] Pool configurado - Total connections: ${pool.totalCount}, Idle: ${pool.idleCount}');
        devLogger.log('[DB_DEBUG] Ejecutando consulta: SELECT * FROM estudiantes');

        const result = await pool.query('SELECT * FROM estudiantes ORDER BY apellido_paterno, apellido_materno, nombre ASC');
        const students = result.rows || [];

        devLogger.log('[DB_DEBUG] ✅ Consulta exitosa: ${students.length} estudiantes encontrados');

        res.json({ success: true, data: students });
    } catch (error) {
        devLogger.error('❌ Error al obtener estudiantes:');
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estudiantes' });
    }
});

/**
 * GET /api/admin/parents
 * Obtener todos los padres de familia
 * Requiere: Autenticación de administrador
 */
router.get('/parents', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.nombre,
                p.email,
                p.telefono,
                p.fecha_creacion as fecha_registro,
                p.activo
            FROM parents p
            ORDER BY p.nombre ASC
        `);
        const parents = result.rows || [];
        res.json({ success: true, data: parents, total: parents.length });
    } catch (error) {
        devLogger.error('❌ Error al obtener padres:');
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener padres' });
    }
});

module.exports = router;
