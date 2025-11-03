/**
 * 🌐 BGE MULTI-TENANT API ROUTES
 * API REST para gestión de configuraciones multi-tenant
 *
 * Funcionalidades:
 * - CRUD de configuraciones de tenants
 * - Validación de configuraciones
 * - Generación de páginas dinámicas
 * - Migración entre configuraciones
 * - Exportación e importación
 *
 * @version 1.0.0
 * @author BGE Development Team
 * @date 2025-09-25
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

// Configuración
const CONFIG_DIR = path.join(__dirname, '../../config');
const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const GENERATED_DIR = path.join(__dirname, '../../generated');

/**
 * Detectar si estamos en entorno serverless
 */
const isServerlessEnvironment = () => {
    return process.env.VERCEL === '1' ||
           process.env.AWS_LAMBDA_FUNCTION_NAME ||
           process.env.NETLIFY === 'true' ||
           process.env.NODE_ENV === 'production' && !process.env.HAS_PERSISTENT_FILESYSTEM;
};

// Asegurar que los directorios existen (solo en entornos con filesystem persistente)
const ensureDirectories = async () => {
    if (isServerlessEnvironment()) {
        console.log('ℹ️ Entorno serverless detectado, saltando creación de directorios');
        return;
    }

    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        await fs.mkdir(TEMPLATES_DIR, { recursive: true });
        await fs.mkdir(GENERATED_DIR, { recursive: true });
        console.log('✅ Directorios multi-tenant creados/verificados');
    } catch (error) {
        console.warn('⚠️ Advertencia creando directorios:', error.message);
    }
};

// Helpers de Handlebars
Handlebars.registerHelper('if', function(conditional, options) {
    if (conditional) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('each', function(context, options) {
    let ret = '';
    for (let i = 0, j = context.length; i < j; i++) {
        ret = ret + options.fn(context[i]);
    }
    return ret;
});

/**
 * GET /api/multi-tenant/tenants
 * Obtener lista de tenants configurados
 */
router.get('/tenants', async (req, res) => {
    try {
        console.log('📋 Obteniendo lista de tenants...');

        const files = await fs.readdir(CONFIG_DIR);
        const configFiles = files.filter(file => file.endsWith('-config.json'));

        const tenants = [];

        for (const file of configFiles) {
            try {
                const filePath = path.join(CONFIG_DIR, file);
                const content = await fs.readFile(filePath, 'utf8');
                const config = JSON.parse(content);

                tenants.push({
                    tenantId: config.tenantId,
                    name: config.institution.name,
                    shortName: config.institution.shortName,
                    type: config.institution.type,
                    status: config.configType,
                    location: `${config.institution.address.city}, ${config.institution.address.state}`,
                    lastUpdated: config.lastUpdated,
                    primaryColor: config.branding.primaryColor,
                    features: Object.keys(config.features).filter(key => config.features[key]).length
                });
            } catch (error) {
                console.warn(`Error procesando archivo ${file}:`, error);
            }
        }

        res.json({
            success: true,
            count: tenants.length,
            tenants: tenants
        });

    } catch (error) {
        console.error('❌ Error obteniendo tenants:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * GET /api/multi-tenant/tenant/:tenantId
 * Obtener configuración específica de un tenant
 */
router.get('/tenant/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        console.log(`📖 Obteniendo configuración para tenant: ${tenantId}`);

        const configFile = getConfigFileName(tenantId);
        const filePath = path.join(CONFIG_DIR, configFile);

        try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(content);

            res.json({
                success: true,
                tenant: config
            });

        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'Tenant no encontrado',
                    tenantId: tenantId
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Error obteniendo tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * POST /api/multi-tenant/tenant
 * Crear nueva configuración de tenant
 */
router.post('/tenant', async (req, res) => {
    try {
        const tenantConfig = req.body;
        console.log(`🏗️ Creando nuevo tenant: ${tenantConfig.institution?.name}`);

        // Validar configuración
        const validation = validateTenantConfig(tenantConfig);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Configuración inválida',
                issues: validation.issues
            });
        }

        // Generar ID único si no existe
        if (!tenantConfig.tenantId) {
            tenantConfig.tenantId = generateTenantId(tenantConfig.institution.name);
        }

        // Completar configuración con valores por defecto
        const completeConfig = completeWithDefaults(tenantConfig);

        // Guardar configuración
        const configFile = getConfigFileName(completeConfig.tenantId);
        const filePath = path.join(CONFIG_DIR, configFile);

        await fs.writeFile(filePath, JSON.stringify(completeConfig, null, 2), 'utf8');

        // Generar página HTML
        await generateTenantPage(completeConfig);

        console.log(`✅ Tenant ${completeConfig.tenantId} creado exitosamente`);

        res.status(201).json({
            success: true,
            message: 'Tenant creado exitosamente',
            tenantId: completeConfig.tenantId,
            tenant: completeConfig
        });

    } catch (error) {
        console.error('❌ Error creando tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * PUT /api/multi-tenant/tenant/:tenantId
 * Actualizar configuración de tenant existente
 */
router.put('/tenant/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const updates = req.body;

        console.log(`🔄 Actualizando tenant: ${tenantId}`);

        const configFile = getConfigFileName(tenantId);
        const filePath = path.join(CONFIG_DIR, configFile);

        // Verificar que el tenant existe
        try {
            const currentContent = await fs.readFile(filePath, 'utf8');
            const currentConfig = JSON.parse(currentContent);

            // Fusionar configuraciones
            const updatedConfig = mergeConfigurations(currentConfig, updates);
            updatedConfig.lastUpdated = new Date().toISOString();

            // Validar configuración actualizada
            const validation = validateTenantConfig(updatedConfig);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Configuración actualizada inválida',
                    issues: validation.issues
                });
            }

            // Guardar configuración
            await fs.writeFile(filePath, JSON.stringify(updatedConfig, null, 2), 'utf8');

            // Regenerar página HTML
            await generateTenantPage(updatedConfig);

            console.log(`✅ Tenant ${tenantId} actualizado exitosamente`);

            res.json({
                success: true,
                message: 'Tenant actualizado exitosamente',
                tenant: updatedConfig
            });

        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'Tenant no encontrado',
                    tenantId: tenantId
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Error actualizando tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * DELETE /api/multi-tenant/tenant/:tenantId
 * Eliminar tenant
 */
router.delete('/tenant/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        console.log(`🗑️ Eliminando tenant: ${tenantId}`);

        const configFile = getConfigFileName(tenantId);
        const filePath = path.join(CONFIG_DIR, configFile);

        try {
            await fs.unlink(filePath);

            // Eliminar página generada si existe
            const generatedPagePath = path.join(GENERATED_DIR, `${tenantId}.html`);
            try {
                await fs.unlink(generatedPagePath);
            } catch (error) {
                // Ignorar si no existe
            }

            console.log(`✅ Tenant ${tenantId} eliminado exitosamente`);

            res.json({
                success: true,
                message: 'Tenant eliminado exitosamente',
                tenantId: tenantId
            });

        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'Tenant no encontrado',
                    tenantId: tenantId
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Error eliminando tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * POST /api/multi-tenant/generate/:tenantId
 * Generar página HTML para tenant específico
 */
router.post('/generate/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        console.log(`🎨 Generando página para tenant: ${tenantId}`);

        const configFile = getConfigFileName(tenantId);
        const filePath = path.join(CONFIG_DIR, configFile);

        try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(content);

            const generatedPagePath = await generateTenantPage(config);

            console.log(`✅ Página generada en: ${generatedPagePath}`);

            res.json({
                success: true,
                message: 'Página generada exitosamente',
                tenantId: tenantId,
                generatedPath: generatedPagePath
            });

        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'Tenant no encontrado',
                    tenantId: tenantId
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Error generando página:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * POST /api/multi-tenant/validate
 * Validar configuración de tenant
 */
router.post('/validate', async (req, res) => {
    try {
        const config = req.body;
        console.log('🔍 Validando configuración...');

        const validation = validateTenantConfig(config);

        res.json({
            success: true,
            valid: validation.valid,
            issues: validation.issues,
            suggestions: validation.suggestions || []
        });

    } catch (error) {
        console.error('❌ Error validando configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * GET /api/multi-tenant/export/:tenantId
 * Exportar configuración de tenant
 */
router.get('/export/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        console.log(`📤 Exportando tenant: ${tenantId}`);

        const configFile = getConfigFileName(tenantId);
        const filePath = path.join(CONFIG_DIR, configFile);

        try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(content);

            // Agregar metadatos de exportación
            const exportData = {
                ...config,
                exportMetadata: {
                    exportedAt: new Date().toISOString(),
                    exportedBy: req.headers['x-user-id'] || 'system',
                    version: '1.0.0'
                }
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${tenantId}-config.json"`);
            res.json(exportData);

        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'Tenant no encontrado',
                    tenantId: tenantId
                });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Error exportando tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * POST /api/multi-tenant/import
 * Importar configuración de tenant
 */
router.post('/import', async (req, res) => {
    try {
        const importedConfig = req.body;
        console.log(`📥 Importando configuración...`);

        // Limpiar metadatos de exportación si existen
        if (importedConfig.exportMetadata) {
            delete importedConfig.exportMetadata;
        }

        // Validar configuración importada
        const validation = validateTenantConfig(importedConfig);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Configuración importada inválida',
                issues: validation.issues
            });
        }

        // Generar nuevo ID si es necesario
        const originalId = importedConfig.tenantId;
        const newId = req.body.newTenantId || generateTenantId(importedConfig.institution.name);
        importedConfig.tenantId = newId;
        importedConfig.lastUpdated = new Date().toISOString();

        // Guardar configuración
        const configFile = getConfigFileName(newId);
        const filePath = path.join(CONFIG_DIR, configFile);

        await fs.writeFile(filePath, JSON.stringify(importedConfig, null, 2), 'utf8');

        // Generar página HTML
        await generateTenantPage(importedConfig);

        console.log(`✅ Configuración importada como tenant: ${newId}`);

        res.status(201).json({
            success: true,
            message: 'Configuración importada exitosamente',
            originalTenantId: originalId,
            newTenantId: newId,
            tenant: importedConfig
        });

    } catch (error) {
        console.error('❌ Error importando configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================
// FUNCIONES AUXILIARES
// ===============================

/**
 * Obtener nombre del archivo de configuración
 */
function getConfigFileName(tenantId) {
    return `${tenantId.replace('-001', '-config')}.json`;
}

/**
 * Generar ID único para tenant
 */
function generateTenantId(institutionName) {
    const slug = institutionName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);

    const timestamp = Date.now().toString().slice(-3);
    return `${slug}-${timestamp}`;
}

/**
 * Validar configuración de tenant
 */
function validateTenantConfig(config) {
    const issues = [];
    const suggestions = [];

    // Campos requeridos
    const requiredFields = [
        'institution.name',
        'institution.shortName',
        'institution.address.city',
        'institution.address.state',
        'branding.primaryColor',
        'localization.language'
    ];

    for (const field of requiredFields) {
        if (!getNestedProperty(config, field)) {
            issues.push(`Campo requerido faltante: ${field}`);
        }
    }

    // Validaciones específicas
    if (config.branding?.primaryColor && !isValidHexColor(config.branding.primaryColor)) {
        issues.push('El color primario debe ser un color hexadecimal válido');
    }

    if (config.institution?.contact?.email && !isValidEmail(config.institution.contact.email)) {
        issues.push('El email de contacto no es válido');
    }

    if (config.institution?.contact?.phone && !isValidPhone(config.institution.contact.phone)) {
        suggestions.push('Considere usar formato internacional para el teléfono (+52...)');
    }

    // Sugerencias
    if (!config.academicInfo?.missionStatement) {
        suggestions.push('Agregar declaración de misión mejorará el SEO');
    }

    if (!config.socialMedia?.facebook && !config.socialMedia?.instagram) {
        suggestions.push('Agregar redes sociales aumentará el engagement');
    }

    return {
        valid: issues.length === 0,
        issues: issues,
        suggestions: suggestions
    };
}

/**
 * Completar configuración con valores por defecto
 */
function completeWithDefaults(config) {
    const defaults = {
        version: '1.0.0',
        configType: 'production',
        lastUpdated: new Date().toISOString(),
        features: {
            chatbotEnabled: true,
            paymentsEnabled: true,
            calendarEnabled: true,
            gradesEnabled: true,
            appointmentsEnabled: true,
            newsEnabled: true,
            downloadsEnabled: true,
            communityEnabled: true,
            aiTutorEnabled: true,
            analyticsEnabled: true
        },
        localization: {
            language: 'es',
            timezone: 'America/Mexico_City',
            currency: 'MXN',
            dateFormat: 'DD/MM/YYYY'
        },
        metadata: {
            keywords: [
                config.institution?.name?.toLowerCase() || 'educacion',
                config.institution?.address?.city?.toLowerCase() || 'mexico',
                'educacion',
                'estudiantes'
            ],
            description: `${config.institution?.name || 'Institución Educativa'} - Educación de calidad`,
            ogTitle: config.institution?.name || 'Institución Educativa',
            ogDescription: `Conoce ${config.institution?.name || 'nuestra institución'} y únete a nosotros`
        }
    };

    return mergeConfigurations(defaults, config);
}

/**
 * Fusionar configuraciones (deep merge)
 */
function mergeConfigurations(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = mergeConfigurations(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

/**
 * Generar página HTML para tenant
 */
async function generateTenantPage(config) {
    try {
        // Leer plantilla
        const templatePath = path.join(TEMPLATES_DIR, 'institution-template.html');
        const templateContent = await fs.readFile(templatePath, 'utf8');

        // Compilar plantilla
        const template = Handlebars.compile(templateContent);

        // Preparar datos para la plantilla
        const templateData = prepareTemplateData(config);

        // Generar HTML
        const generatedHTML = template(templateData);

        // Guardar página generada
        const outputPath = path.join(GENERATED_DIR, `${config.tenantId}.html`);
        await fs.writeFile(outputPath, generatedHTML, 'utf8');

        return outputPath;

    } catch (error) {
        console.error('Error generando página:', error);
        throw error;
    }
}

/**
 * Preparar datos para la plantilla
 */
function prepareTemplateData(config) {
    return {
        // Basic info
        TENANT_ID: config.tenantId,
        LANGUAGE: config.localization.language,

        // Institution
        INSTITUTION_NAME: config.institution.name,
        INSTITUTION_SHORT_NAME: config.institution.shortName,

        // Address
        FULL_ADDRESS: formatAddress(config.institution.address),

        // Contact
        MAIN_PHONE: config.institution.contact?.phone || '',
        MAIN_EMAIL: config.institution.contact?.email || '',
        WEBSITE_URL: config.institution.contact?.website || '',

        // Branding
        PRIMARY_COLOR: config.branding.primaryColor,
        SECONDARY_COLOR: config.branding.secondaryColor,
        ACCENT_COLOR: config.branding.accentColor,
        LOGO_URL: config.branding.logoUrl,
        FAVICON_URL: config.branding.faviconUrl,
        HERO_IMAGE_URL: config.branding.heroImageUrl,
        FONT_FAMILY: config.branding.fontFamily,

        // Content
        WELCOME_MESSAGE: config.customContent?.welcomeMessage || `Bienvenidos a ${config.institution.name}`,
        HERO_SLOGAN: config.customContent?.heroSlogan || 'Educación de Excelencia',
        ABOUT_US: config.customContent?.aboutUs || `Somos ${config.institution.name}, comprometidos con la educación de calidad.`,
        ABOUT_US_SHORT: config.customContent?.aboutUs?.substring(0, 100) + '...' || '',

        // Academic
        MISSION_STATEMENT: config.academicInfo?.missionStatement || '',
        VISION_STATEMENT: config.academicInfo?.visionStatement || '',
        VALUES: config.academicInfo?.values || [],
        EDUCATIONAL_PROGRAMS: config.academicInfo?.educationalPrograms || [],
        ACCREDITATION: config.academicInfo?.accreditation || '',
        ESTABLISHED_YEAR: config.academicInfo?.establishedYear || '2024',

        // Leadership
        LEADERSHIP: config.leadership || {},

        // Social Media
        SOCIAL_MEDIA: config.socialMedia || {},

        // Features
        FEATURES: config.features || {},
        FEATURES_JSON: JSON.stringify(config.features || {}),

        // Localization
        LOCALIZATION_JSON: JSON.stringify(config.localization || {}),

        // Metadata
        META_DESCRIPTION: config.metadata?.description || '',
        META_KEYWORDS: config.metadata?.keywords?.join(', ') || '',
        OG_TITLE: config.metadata?.ogTitle || config.institution.name,
        OG_DESCRIPTION: config.metadata?.ogDescription || ''
    };
}

/**
 * Formatear dirección completa
 */
function formatAddress(address) {
    if (!address) return '';

    const parts = [
        address.street,
        address.city,
        address.state,
        address.country,
        address.postalCode
    ].filter(part => part);

    return parts.join(', ');
}

/**
 * Obtener propiedad anidada de objeto
 */
function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Validar color hexadecimal
 */
function isValidHexColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validar email
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validar teléfono
 */
function isValidPhone(phone) {
    // Validación básica para números mexicanos e internacionales
    return /^(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(phone);
}

// Inicializar directorios al cargar el módulo
ensureDirectories();

module.exports = router;