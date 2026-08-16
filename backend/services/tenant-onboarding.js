/**
 * 🏢 TENANT ONBOARDING SERVICE
 * Automatiza la creación de nuevos tenants
 * Semana 5 - Multi-tenancy Avanzado - Tarea 8
 */

const tenantConfigService = require('./tenant-config-service.js');
const { transactionWithTenant } = require('../config/multi-tenant-pool.js');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * Crea un nuevo tenant completo (tenant + usuario admin)
 */
async function onboardNewTenant(data) {
    const {
        tenant_id,
        tenant_name,
        subdomain,
        domain,
        admin_email,
        admin_password,
        admin_name,
        config = {}
    } = data;

    // Validaciones
    if (!tenant_id || !tenant_name || !subdomain || !admin_email || !admin_password) {
        throw new Error('Faltan campos requeridos para onboarding');
    }

    // Validar formato de subdomain (solo alfanuméricos y guiones)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
        throw new Error('Subdomain debe contener solo letras minúsculas, números y guiones');
    }

    try {
        // PASO 1: Crear tenant
        const tenant = await tenantConfigService.createTenant({
            id: tenant_id,
            nombre: tenant_name,
            subdomain,
            dominio: domain || `${subdomain}.bge.edu.mx`,
            config: {
                school_name: tenant_name,
                school_short_name: tenant_name.substring(0, 10).toUpperCase(),
                ...config
            }
        });

        console.log(`[ONBOARDING] Tenant creado: ${tenant.id}`);

        // PASO 2: Crear usuario admin para el tenant
        const adminUserId = uuidv4();
        const passwordHash = await bcrypt.hash(admin_password, 10);

        await transactionWithTenant(tenant_id, async (client) => {
            // Crear usuario admin
            await client.query(
                `INSERT INTO usuarios (
                    uuid, email, username, password_hash, role, status, tenant_id, nombre
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    adminUserId,
                    admin_email,
                    admin_email.split('@')[0],
                    passwordHash,
                    'admin',
                    'activo',
                    tenant_id,
                    admin_name || 'Administrador'
                ]
            );

            console.log(`[ONBOARDING] Usuario admin creado: ${admin_email}`);

            // OPCIONAL: Crear datos iniciales (noticias de bienvenida, etc)
            await client.query(
                `INSERT INTO noticias (
                    titulo, contenido, categoria, autor, fecha_publicacion, status, tenant_id
                ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)`,
                [
                    '¡Bienvenido a tu nueva plataforma!',
                    'Tu sistema de gestión escolar está listo para usar.',
                    'Anuncios',
                    'Sistema',
                    'publicada',
                    tenant_id
                ]
            );
        });

        console.log(`[ONBOARDING] Onboarding completado para tenant: ${tenant.id}`);

        return {
            success: true,
            tenant: {
                id: tenant.id,
                nombre: tenant.nombre,
                subdomain: tenant.subdomain,
                dominio: tenant.dominio
            },
            admin: {
                email: admin_email,
                userId: adminUserId
            },
            next_steps: [
                'Iniciar sesión con credenciales de admin',
                'Configurar colores y logo del tenant',
                'Crear primer estudiante de prueba',
                'Explorar dashboard administrativo'
            ]
        };

    } catch (error) {
        console.error(`[ONBOARDING] Error en onboarding de ${tenant_id}:`, error.message);
        throw error;
    }
}

/**
 * Valida disponibilidad de subdomain
 */
async function checkSubdomainAvailability(subdomain) {
    try {
        const tenants = await tenantConfigService.listTenants();
        const exists = tenants.some(t => t.subdomain === subdomain);

        return {
            available: !exists,
            subdomain,
            suggested: !exists ? null : `${subdomain}-${Math.floor(Math.random() * 1000)}`
        };

    } catch (error) {
        console.error(`[ONBOARDING] Error verificando subdomain ${subdomain}:`, error.message);
        throw error;
    }
}

/**
 * Elimina un tenant completamente (soft delete)
 */
async function offboardTenant(tenantId) {
    if (tenantId === 'default') {
        throw new Error('No se puede eliminar el tenant default');
    }

    try {
        // Cambiar status a inactivo
        await tenantConfigService.updateStatus(tenantId, 'inactivo');

        // OPCIONAL: En producción, aquí se podría:
        // - Archivar datos del tenant
        // - Notificar al admin por email
        // - Programar eliminación física después de X días

        console.log(`[ONBOARDING] Tenant offboarded: ${tenantId}`);

        return {
            success: true,
            tenant_id: tenantId,
            status: 'inactivo',
            message: 'Tenant marcado como inactivo. Los datos se preservan.'
        };

    } catch (error) {
        console.error(`[ONBOARDING] Error en offboarding de ${tenantId}:`, error.message);
        throw error;
    }
}

module.exports = {
    onboardNewTenant,
    checkSubdomainAvailability,
    offboardTenant
};
