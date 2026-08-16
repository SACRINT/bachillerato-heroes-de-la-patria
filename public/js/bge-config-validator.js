/**
 * 🔍 BGE CONFIG VALIDATOR
 * Sistema avanzado de validación y migración de configuraciones multi-tenant
 *
 * Características:
 * - Validación exhaustiva de configuraciones JSON
 * - Migración automática entre versiones
 * - Detección de inconsistencias
 * - Sugerencias de mejora
 * - Compatibilidad hacia atrás
 *
 * @version 1.0.0
 * @author BGE Development Team
 * @date 2025-09-25
 */

class BGEConfigValidator {
    constructor() {
        this.version = '1.0.0';
        this.supportedVersions = ['1.0.0'];
        this.currentSchemaVersion = '1.0.0';

        // Schema de validación
        this.schema = {
            required: [
                'tenantId',
                'version',
                'institution.name',
                'institution.shortName',
                'branding.primaryColor',
                'localization.language'
            ],
            optional: [
                'configType',
                'lastUpdated',
                'institution.type',
                'institution.address',
                'institution.contact',
                'branding.secondaryColor',
                'branding.accentColor',
                'branding.logoUrl',
                'branding.heroImageUrl',
                'branding.fontFamily',
                'leadership',
                'socialMedia',
                'academicInfo',
                'customContent',
                'features',
                'documents',
                'metadata'
            ],
            deprecated: [
                'oldColorScheme',
                'legacyFeatures'
            ]
        };

        // Reglas de validación
        this.validationRules = {
            tenantId: {
                type: 'string',
                pattern: /^[a-z0-9\-]+$/,
                minLength: 3,
                maxLength: 50
            },
            'institution.name': {
                type: 'string',
                minLength: 5,
                maxLength: 100
            },
            'institution.shortName': {
                type: 'string',
                minLength: 2,
                maxLength: 20
            },
            'branding.primaryColor': {
                type: 'string',
                pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
            },
            'institution.contact.email': {
                type: 'string',
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            'institution.contact.phone': {
                type: 'string',
                pattern: /^(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/
            },
            'localization.language': {
                type: 'string',
                enum: ['es', 'en', 'fr', 'pt']
            }
        };

        // Valores por defecto para campos faltantes
        this.defaults = {
            version: '1.0.0',
            configType: 'production',
            lastUpdated: () => new Date().toISOString(),
            features: {
                chatbotEnabled: true,
                paymentsEnabled: false,
                calendarEnabled: true,
                gradesEnabled: true,
                appointmentsEnabled: true,
                newsEnabled: true,
                downloadsEnabled: true,
                communityEnabled: true,
                aiTutorEnabled: false,
                analyticsEnabled: true
            },
            localization: {
                language: 'es',
                timezone: 'America/Mexico_City',
                currency: 'MXN',
                dateFormat: 'DD/MM/YYYY'
            },
            branding: {
                secondaryColor: '#FFC107',
                accentColor: '#FF5722',
                fontFamily: "'Segoe UI', Roboto, Arial, sans-serif"
            }
        };

        void 0;
    }

    /**
     * Validar configuración completa
     * @param {Object} config - Configuración a validar
     * @returns {Object} Resultado de validación
     */
    validateConfig(config) {
        void 0;

        const result = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            missing: [],
            deprecated: [],
            score: 0,
            details: {}
        };

        try {
            // Validar estructura básica
            this.validateStructure(config, result);

            // Validar campos requeridos
            this.validateRequiredFields(config, result);

            // Validar tipos y formatos
            this.validateTypes(config, result);

            // Validar consistencia
            this.validateConsistency(config, result);

            // Detectar campos deprecados
            this.detectDeprecated(config, result);

            // Generar sugerencias
            this.generateSuggestions(config, result);

            // Calcular puntuación
            result.score = this.calculateScore(result);

            // Determinar validez general
            result.valid = result.errors.length === 0;

            void 0;

        } catch (error) {
            console.error('❌ Error durante validación:', error);
            result.valid = false;
            result.errors.push(`Error interno de validación: ${error.message}`);
        }

        return result;
    }

    /**
     * Validar estructura básica
     */
    validateStructure(config, result) {
        if (!config || typeof config !== 'object') {
            result.errors.push('La configuración debe ser un objeto válido');
            return;
        }

        // Verificar que no esté vacía
        if (Object.keys(config).length === 0) {
            result.errors.push('La configuración no puede estar vacía');
        }

        result.details.structure = 'válida';
    }

    /**
     * Validar campos requeridos
     */
    validateRequiredFields(config, result) {
        for (const field of this.schema.required) {
            const value = this.getNestedProperty(config, field);

            if (value === undefined || value === null || value === '') {
                result.errors.push(`Campo requerido faltante: ${field}`);
                result.missing.push(field);
            }
        }

        result.details.requiredFields = {
            total: this.schema.required.length,
            present: this.schema.required.length - result.missing.length,
            missing: result.missing.length
        };
    }

    /**
     * Validar tipos y formatos
     */
    validateTypes(config, result) {
        for (const [field, rules] of Object.entries(this.validationRules)) {
            const value = this.getNestedProperty(config, field);

            if (value === undefined || value === null) {
                continue; // Ya manejado en campos requeridos
            }

            // Validar tipo
            if (rules.type && typeof value !== rules.type) {
                result.errors.push(`Campo '${field}' debe ser de tipo '${rules.type}', pero es '${typeof value}'`);
                continue;
            }

            // Validar patrón
            if (rules.pattern && !rules.pattern.test(value)) {
                result.errors.push(`Campo '${field}' no cumple con el formato requerido`);
            }

            // Validar longitud mínima
            if (rules.minLength && value.length < rules.minLength) {
                result.errors.push(`Campo '${field}' debe tener al menos ${rules.minLength} caracteres`);
            }

            // Validar longitud máxima
            if (rules.maxLength && value.length > rules.maxLength) {
                result.errors.push(`Campo '${field}' no puede tener más de ${rules.maxLength} caracteres`);
            }

            // Validar enumeración
            if (rules.enum && !rules.enum.includes(value)) {
                result.errors.push(`Campo '${field}' debe ser uno de: ${rules.enum.join(', ')}`);
            }
        }

        result.details.typeValidation = 'completada';
    }

    /**
     * Validar consistencia entre campos
     */
    validateConsistency(config, result) {
        // Validar que el tenantId coincida con el nombre
        if (config.tenantId && config.institution?.name) {
            const expectedSlug = this.generateTenantSlug(config.institution.name);
            if (!config.tenantId.includes(expectedSlug.substring(0, 10))) {
                result.warnings.push('El tenantId no parece corresponder al nombre de la institución');
            }
        }

        // Validar coherencia de colores
        if (config.branding?.primaryColor && config.branding?.secondaryColor) {
            if (config.branding.primaryColor === config.branding.secondaryColor) {
                result.warnings.push('El color primario y secundario son iguales');
            }
        }

        // Validar URLs de recursos
        const urls = [
            config.branding?.logoUrl,
            config.branding?.heroImageUrl,
            config.branding?.faviconUrl
        ].filter(url => url);

        for (const url of urls) {
            if (!this.isValidUrl(url)) {
                result.warnings.push(`URL potencialmente inválida: ${url}`);
            }
        }

        // Validar features habilitadas
        if (config.features) {
            if (config.features.paymentsEnabled && !config.institution?.contact?.email) {
                result.warnings.push('Pagos habilitados pero falta email de contacto');
            }

            if (config.features.appointmentsEnabled && !config.institution?.contact?.phone) {
                result.warnings.push('Citas habilitadas pero falta teléfono de contacto');
            }
        }

        result.details.consistency = 'validada';
    }

    /**
     * Detectar campos deprecados
     */
    detectDeprecated(config, result) {
        for (const deprecatedField of this.schema.deprecated) {
            if (this.getNestedProperty(config, deprecatedField) !== undefined) {
                result.deprecated.push(deprecatedField);
                result.warnings.push(`Campo deprecado encontrado: ${deprecatedField}`);
            }
        }

        result.details.deprecated = result.deprecated.length;
    }

    /**
     * Generar sugerencias de mejora
     */
    generateSuggestions(config, result) {
        // Sugerir campos opcionales importantes
        if (!config.academicInfo?.missionStatement) {
            result.suggestions.push('Agregar declaración de misión mejorará el SEO y la percepción');
        }

        if (!config.academicInfo?.visionStatement) {
            result.suggestions.push('Agregar declaración de visión fortalecerá la identidad institucional');
        }

        if (!config.socialMedia?.facebook && !config.socialMedia?.instagram) {
            result.suggestions.push('Agregar enlaces a redes sociales aumentará el engagement');
        }

        if (!config.leadership?.director) {
            result.suggestions.push('Incluir información del equipo directivo genera confianza');
        }

        // Sugerir mejoras de branding
        if (!config.branding?.logoUrl) {
            result.suggestions.push('Agregar logo institucional mejorará el reconocimiento de marca');
        }

        if (!config.branding?.heroImageUrl) {
            result.suggestions.push('Incluir imagen principal hará el sitio más atractivo');
        }

        // Sugerir características avanzadas
        if (!config.features?.aiTutorEnabled) {
            result.suggestions.push('Considerar habilitar el tutor IA para mejorar la experiencia educativa');
        }

        if (!config.features?.analyticsEnabled) {
            result.suggestions.push('Habilitar analytics para obtener insights valiosos');
        }

        // Sugerir metadatos SEO
        if (!config.metadata?.keywords || config.metadata.keywords.length < 3) {
            result.suggestions.push('Agregar más palabras clave mejorará el posicionamiento SEO');
        }

        if (!config.metadata?.description) {
            result.suggestions.push('Incluir meta descripción optimizará el SEO');
        }

        result.details.suggestions = result.suggestions.length;
    }

    /**
     * Calcular puntuación de calidad
     */
    calculateScore(result) {
        let score = 100;

        // Penalizar errores
        score -= result.errors.length * 10;

        // Penalizar advertencias
        score -= result.warnings.length * 5;

        // Penalizar campos faltantes importantes
        score -= result.missing.length * 8;

        // Bonificar por campos opcionales presentes
        score += Math.max(0, 10 - result.suggestions.length);

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Migrar configuración a versión más reciente
     */
    migrateConfig(config, targetVersion = null) {
        const target = targetVersion || this.currentSchemaVersion;

        void 0;

        const migrated = JSON.parse(JSON.stringify(config)); // Deep clone

        // Aplicar migraciones según versión origen
        const sourceVersion = config.version || '0.9.0';

        if (this.compareVersions(sourceVersion, '1.0.0') < 0) {
            this.migrateFrom0_9_0(migrated);
        }

        // Actualizar versión
        migrated.version = target;
        migrated.lastUpdated = new Date().toISOString();

        void 0;

        return migrated;
    }

    /**
     * Migración desde versión 0.9.0
     */
    migrateFrom0_9_0(config) {
        void 0;

        // Migrar esquema de colores legacy
        if (config.oldColorScheme) {
            if (!config.branding) config.branding = {};

            config.branding.primaryColor = config.oldColorScheme.primary || '#1976D2';
            config.branding.secondaryColor = config.oldColorScheme.secondary || '#FFC107';

            delete config.oldColorScheme;
        }

        // Migrar features legacy
        if (config.legacyFeatures) {
            if (!config.features) config.features = {};

            Object.assign(config.features, config.legacyFeatures);
            delete config.legacyFeatures;
        }

        // Agregar campos nuevos con valores por defecto
        this.applyDefaults(config);

        void 0;
    }

    /**
     * Aplicar valores por defecto
     */
    applyDefaults(config) {
        for (const [path, defaultValue] of Object.entries(this.defaults)) {
            if (this.getNestedProperty(config, path) === undefined) {
                const value = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
                this.setNestedProperty(config, path, value);
            }
        }
    }

    /**
     * Reparar configuración automáticamente
     */
    repairConfig(config) {
        void 0;

        const repaired = JSON.parse(JSON.stringify(config));
        const repairLog = [];

        // Aplicar valores por defecto para campos faltantes
        this.applyDefaults(repaired);
        repairLog.push('Aplicados valores por defecto');

        // Corregir formatos incorrectos
        if (repaired.branding?.primaryColor && !this.validationRules['branding.primaryColor'].pattern.test(repaired.branding.primaryColor)) {
            repaired.branding.primaryColor = '#1976D2';
            repairLog.push('Corregido color primario inválido');
        }

        // Normalizar tenantId
        if (repaired.tenantId && !/^[a-z0-9\-]+$/.test(repaired.tenantId)) {
            repaired.tenantId = this.generateTenantSlug(repaired.institution?.name || 'institucion');
            repairLog.push('Normalizado tenantId');
        }

        // Limpiar campos deprecados
        for (const deprecatedField of this.schema.deprecated) {
            if (this.getNestedProperty(repaired, deprecatedField) !== undefined) {
                this.deleteNestedProperty(repaired, deprecatedField);
                repairLog.push(`Eliminado campo deprecado: ${deprecatedField}`);
            }
        }

        void 0;

        return {
            config: repaired,
            repairs: repairLog
        };
    }

    /**
     * Generar slug para tenantId
     */
    generateTenantSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 20);
    }

    /**
     * Comparar versiones
     */
    compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;

            if (aPart < bPart) return -1;
            if (aPart > bPart) return 1;
        }

        return 0;
    }

    /**
     * Validar URL
     */
    isValidUrl(url) {
        try {
            new URL(url.startsWith('/') ? `https://example.com${url}` : url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Obtener propiedad anidada
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Establecer propiedad anidada
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);

        target[lastKey] = value;
    }

    /**
     * Eliminar propiedad anidada
     */
    deleteNestedProperty(obj, path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => current?.[key], obj);

        if (target) {
            delete target[lastKey];
        }
    }

    /**
     * Obtener estadísticas de validación
     */
    getValidationStats(config) {
        const validation = this.validateConfig(config);

        return {
            score: validation.score,
            errors: validation.errors.length,
            warnings: validation.warnings.length,
            suggestions: validation.suggestions.length,
            completeness: Math.round((1 - (validation.missing.length / this.schema.required.length)) * 100),
            valid: validation.valid,
            grade: this.getGrade(validation.score)
        };
    }

    /**
     * Obtener calificación textual
     */
    getGrade(score) {
        if (score >= 90) return 'Excelente';
        if (score >= 80) return 'Buena';
        if (score >= 70) return 'Aceptable';
        if (score >= 60) return 'Necesita Mejoras';
        return 'Crítica';
    }

    /**
     * Generar reporte completo
     */
    generateReport(config) {
        const validation = this.validateConfig(config);
        const stats = this.getValidationStats(config);

        return {
            timestamp: new Date().toISOString(),
            validator: `BGE Config Validator v${this.version}`,
            config: {
                tenantId: config.tenantId,
                version: config.version,
                institutionName: config.institution?.name
            },
            validation: validation,
            statistics: stats,
            recommendations: this.generateRecommendations(validation),
            summary: {
                status: validation.valid ? 'VÁLIDO' : 'INVÁLIDO',
                score: stats.score,
                grade: stats.grade,
                priority: validation.errors.length > 0 ? 'ALTA' : validation.warnings.length > 0 ? 'MEDIA' : 'BAJA'
            }
        };
    }

    /**
     * Generar recomendaciones específicas
     */
    generateRecommendations(validation) {
        const recommendations = [];

        if (validation.errors.length > 0) {
            recommendations.push({
                priority: 'CRÍTICA',
                action: 'Corregir errores',
                description: 'Resolver todos los errores antes de usar la configuración'
            });
        }

        if (validation.warnings.length > 0) {
            recommendations.push({
                priority: 'ALTA',
                action: 'Revisar advertencias',
                description: 'Verificar y corregir las advertencias para mejorar la calidad'
            });
        }

        if (validation.suggestions.length > 3) {
            recommendations.push({
                priority: 'MEDIA',
                action: 'Implementar sugerencias',
                description: 'Aplicar las sugerencias más importantes para optimizar la configuración'
            });
        }

        if (validation.deprecated.length > 0) {
            recommendations.push({
                priority: 'MEDIA',
                action: 'Migrar campos deprecados',
                description: 'Actualizar campos deprecados para mantener compatibilidad futura'
            });
        }

        return recommendations;
    }
}

// Inicialización automática
let configValidator;

if (typeof window !== 'undefined') {
    // Entorno del navegador
    window.BGEConfigValidator = BGEConfigValidator;
    configValidator = new BGEConfigValidator();
    window.configValidator = configValidator;

    void 0;
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEConfigValidator;
}

// API simplificada para uso rápido
if (typeof window !== 'undefined') {
    window.validateBGEConfig = function(config) {
        return configValidator.validateConfig(config);
    };

    window.migrateBGEConfig = function(config, targetVersion) {
        return configValidator.migrateConfig(config, targetVersion);
    };

    window.repairBGEConfig = function(config) {
        return configValidator.repairConfig(config);
    };

    window.getBGEConfigReport = function(config) {
        return configValidator.generateReport(config);
    };
}