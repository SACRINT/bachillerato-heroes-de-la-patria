/**
 * 🏢 RUTAS DE ADMINISTRACIÓN DE TENANTS (SaaS Multi-Tenant)
 *
 * Propósito: Gestionar la administración de tenants (escuelas) en el sistema SaaS
 *
 * Funcionalidades:
 * - Listar todos los tenants
 * - Crear nuevos tenants
 * - Editar tenants existentes
 * - Eliminar tenants
 * - Sincronización con base de datos vía API
 *
 * Fecha: 8 de Noviembre de 2025
 * Versión: 1.0.0
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
    getTenantByDomain,
    getAllTenants,
    createTenant,
    updateTenant,
    deleteTenant
} = require('../data/database-access');

const router = express.Router();

/**
 * ============================================
 * MIDDLEWARE DE VALIDACIÓN
 * ============================================
 */

// Validaciones para crear/actualizar tenants
const validateTenantData = [
    body('school_name')
        .trim()
        .notEmpty().withMessage('school_name es requerido')
        .isLength({ min: 3 }).withMessage('school_name debe tener al menos 3 caracteres'),

    body('domain')
        .trim()
        .notEmpty().withMessage('domain es requerido')
        .isLength({ min: 3 }).withMessage('domain debe tener al menos 3 caracteres'),

    body('admin_email')
        .trim()
        .isEmail().withMessage('admin_email debe ser un email válido'),

    body('status')
        .optional()
        .isIn(['activo', 'inactivo']).withMessage('status debe ser "activo" o "inactivo"'),

    body('config_json')
        .optional()
        .custom((value) => {
            if (typeof value !== 'object' && typeof value !== 'string') {
                throw new Error('config_json debe ser un objeto o string JSON válido');
            }
            if (typeof value === 'string') {
                try {
                    JSON.parse(value);
                } catch (e) {
                    throw new Error('config_json debe ser un JSON válido');
                }
            }
            return true;
        })
];

/**
 * ============================================
 * ENDPOINTS CRUD
 * ============================================
 */

/**
 * GET /api/tenants
 * Obtener lista de todos los tenants
 * Requiere: Autenticación + SuperAdmin
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        console.log(`[TENANTS-ROUTES] 📋 GET /api/tenants - Usuario: ${req.user.email}`);

        const tenants = await getAllTenants();

        console.log(`[TENANTS-ROUTES] ✅ Obtenidos ${tenants.length} tenants`);

        return res.status(200).json({
            success: true,
            message: 'Tenants obtenidos exitosamente',
            data: tenants,
            count: tenants.length
        });

    } catch (error) {
        console.error('[TENANTS-ROUTES] ❌ Error en GET /api/tenants:', error);
        return res.status(500).json({
            success: false,
            error: 'Error obteniendo tenants',
            message: error.message
        });
    }
});

/**
 * GET /api/tenants/:id
 * Obtener un tenant específico por ID
 * Requiere: Autenticación + SuperAdmin
 */
router.get('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const tenantId = parseInt(req.params.id);
        console.log(`[TENANTS-ROUTES] 🔍 GET /api/tenants/${tenantId} - Usuario: ${req.user.email}`);

        if (isNaN(tenantId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de tenant inválido'
            });
        }

        const tenants = await getAllTenants();
        const tenant = tenants.find(t => t.id === tenantId);

        if (!tenant) {
            console.warn(`[TENANTS-ROUTES] ⚠️ Tenant no encontrado: ${tenantId}`);
            return res.status(404).json({
                success: false,
                error: 'Tenant no encontrado'
            });
        }

        console.log(`[TENANTS-ROUTES] ✅ Tenant encontrado: ${tenant.school_name}`);

        return res.status(200).json({
            success: true,
            message: 'Tenant obtenido exitosamente',
            data: tenant
        });

    } catch (error) {
        console.error('[TENANTS-ROUTES] ❌ Error en GET /api/tenants/:id:', error);
        return res.status(500).json({
            success: false,
            error: 'Error obteniendo tenant',
            message: error.message
        });
    }
});

/**
 * POST /api/tenants
 * Crear un nuevo tenant
 * Requiere: Autenticación + SuperAdmin
 */
router.post('/', authenticateToken, requireSuperAdmin, validateTenantData, async (req, res) => {
    try {
        console.log(`[TENANTS-ROUTES] 📝 POST /api/tenants - Usuario: ${req.user.email}`);

        // Validar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn('[TENANTS-ROUTES] ⚠️ Errores de validación:', errors.array());
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { school_name, domain, admin_email, status = 'activo', config_json } = req.body;

        // Verificar que el dominio no exista
        const existingTenant = await getTenantByDomain(domain);
        if (existingTenant) {
            console.warn(`[TENANTS-ROUTES] ⚠️ Dominio ya existe: ${domain}`);
            return res.status(409).json({
                success: false,
                error: 'El dominio ya está registrado',
                domain: domain
            });
        }

        // Preparar datos del tenant
        const tenantData = {
            school_name,
            domain,
            admin_email,
            status,
            config_json: config_json || {
                school: {
                    name: school_name,
                    abbreviation: '',
                    clave: '',
                    zone: ''
                },
                branding: {
                    primaryColor: '#1976D2',
                    secondaryColor: '#F57C00',
                    logoUrl: '/images/logo-bachillerato-HDLP.webp',
                    faviconUrl: '/images/favicon.ico'
                },
                contact: {
                    address: '',
                    email: admin_email,
                    phone: '',
                    hours: ''
                },
                features: {
                    googleOAuth: true,
                    tinymce: true,
                    pwaMobile: true,
                    darkMode: true,
                    notifications: true,
                    multiTenant: true
                }
            }
        };

        console.log('[TENANTS-ROUTES] 📋 Creando tenant con datos:', { school_name, domain });

        const newTenant = await createTenant(tenantData);

        console.log(`[TENANTS-ROUTES] ✅ Tenant creado exitosamente - ID: ${newTenant.id}`);

        return res.status(201).json({
            success: true,
            message: 'Tenant creado exitosamente',
            data: newTenant
        });

    } catch (error) {
        console.error('[TENANTS-ROUTES] ❌ Error en POST /api/tenants:', error);
        return res.status(500).json({
            success: false,
            error: 'Error creando tenant',
            message: error.message
        });
    }
});

/**
 * PUT /api/tenants/:id
 * Actualizar un tenant existente
 * Requiere: Autenticación + SuperAdmin
 */
router.put('/:id', authenticateToken, requireSuperAdmin, validateTenantData, async (req, res) => {
    try {
        const tenantId = parseInt(req.params.id);
        console.log(`[TENANTS-ROUTES] ✏️ PUT /api/tenants/${tenantId} - Usuario: ${req.user.email}`);

        if (isNaN(tenantId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de tenant inválido'
            });
        }

        // Validar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn('[TENANTS-ROUTES] ⚠️ Errores de validación:', errors.array());
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        // Verificar que el tenant existe
        const tenants = await getAllTenants();
        const existingTenant = tenants.find(t => t.id === tenantId);

        if (!existingTenant) {
            console.warn(`[TENANTS-ROUTES] ⚠️ Tenant no encontrado: ${tenantId}`);
            return res.status(404).json({
                success: false,
                error: 'Tenant no encontrado'
            });
        }

        const { school_name, domain, admin_email, status, config_json } = req.body;

        // Verificar que el dominio no esté usado por otro tenant
        if (domain !== existingTenant.domain) {
            const domainInUse = await getTenantByDomain(domain);
            if (domainInUse && domainInUse.id !== tenantId) {
                console.warn(`[TENANTS-ROUTES] ⚠️ Dominio ya existe: ${domain}`);
                return res.status(409).json({
                    success: false,
                    error: 'El dominio ya está registrado por otro tenant',
                    domain: domain
                });
            }
        }

        // Preparar datos de actualización
        const updateData = {
            school_name: school_name || existingTenant.school_name,
            domain: domain || existingTenant.domain,
            admin_email: admin_email || existingTenant.admin_email,
            status: status || existingTenant.status,
            config_json: config_json || existingTenant.config_json
        };

        console.log('[TENANTS-ROUTES] 📋 Actualizando tenant con datos:', { school_name, domain });

        const updatedTenant = await updateTenant(tenantId, updateData);

        console.log(`[TENANTS-ROUTES] ✅ Tenant actualizado exitosamente - ID: ${tenantId}`);

        return res.status(200).json({
            success: true,
            message: 'Tenant actualizado exitosamente',
            data: updatedTenant
        });

    } catch (error) {
        console.error('[TENANTS-ROUTES] ❌ Error en PUT /api/tenants/:id:', error);
        return res.status(500).json({
            success: false,
            error: 'Error actualizando tenant',
            message: error.message
        });
    }
});

/**
 * DELETE /api/tenants/:id
 * Eliminar un tenant
 * Requiere: Autenticación + SuperAdmin
 */
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const tenantId = parseInt(req.params.id);
        console.log(`[TENANTS-ROUTES] 🗑️ DELETE /api/tenants/${tenantId} - Usuario: ${req.user.email}`);

        if (isNaN(tenantId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de tenant inválido'
            });
        }

        // Verificar que el tenant existe
        const tenants = await getAllTenants();
        const existingTenant = tenants.find(t => t.id === tenantId);

        if (!existingTenant) {
            console.warn(`[TENANTS-ROUTES] ⚠️ Tenant no encontrado: ${tenantId}`);
            return res.status(404).json({
                success: false,
                error: 'Tenant no encontrado'
            });
        }

        console.log('[TENANTS-ROUTES] 🗑️ Eliminando tenant:', existingTenant.school_name);

        await deleteTenant(tenantId);

        console.log(`[TENANTS-ROUTES] ✅ Tenant eliminado exitosamente - ID: ${tenantId}`);

        return res.status(200).json({
            success: true,
            message: 'Tenant eliminado exitosamente',
            deletedId: tenantId
        });

    } catch (error) {
        console.error('[TENANTS-ROUTES] ❌ Error en DELETE /api/tenants/:id:', error);
        return res.status(500).json({
            success: false,
            error: 'Error eliminando tenant',
            message: error.message
        });
    }
});

/**
 * ============================================
 * EXPORTAR ROUTER
 * ============================================
 */

module.exports = router;
