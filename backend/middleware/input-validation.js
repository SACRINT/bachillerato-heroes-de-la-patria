/**
 * ✅ INPUT VALIDATION MIDDLEWARE
 *
 * Sistema de validación de entrada con Joi para prevenir inyecciones
 * OWASP: A03:2021 - Injection Prevention
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const Joi = require('joi');

// ============================================
// SCHEMAS DE VALIDACIÓN REUTILIZABLES
// ============================================

/**
 * Schema para emails
 */
const emailSchema = Joi.string()
    .email({ tlds: { allow: true } })
    .max(255)
    .required()
    .messages({
        'string.email': 'Email inválido',
        'string.empty': 'Email es requerido',
        'any.required': 'Email es requerido'
    });

/**
 * Schema para contraseñas
 */
const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
        'string.min': 'Contraseña debe tener mínimo 8 caracteres',
        'string.pattern.base': 'Contraseña debe contener mayúsculas, minúsculas y números',
        'any.required': 'Contraseña es requerida'
    });

/**
 * Schema para nombres
 */
const nameSchema = Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
        'string.min': 'Nombre debe tener mínimo 2 caracteres',
        'string.max': 'Nombre muy largo',
        'string.pattern.base': 'Nombre solo puede contener letras y espacios',
        'any.required': 'Nombre es requerido'
    });

/**
 * Schema para teléfonos
 */
const phoneSchema = Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
        'string.pattern.base': 'Teléfono debe tener 10 dígitos'
    });

/**
 * Schema para IDs numéricos
 */
const idSchema = Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        'number.base': 'ID debe ser un número',
        'number.positive': 'ID debe ser positivo',
        'any.required': 'ID es requerido'
    });

/**
 * Schema para paginación
 */
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('id', 'nombre', 'fecha', 'created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// ============================================
// SCHEMAS POR ENDPOINT
// ============================================

/**
 * Schema para registro de usuarios
 */
const registerSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema,
    nombre: nameSchema,
    apellido_paterno: nameSchema,
    apellido_materno: nameSchema.optional(),
    telefono: phoneSchema.optional(),
    role: Joi.string().valid('estudiante', 'padre', 'docente', 'administrativo').default('estudiante')
});

/**
 * Schema para login
 */
const loginSchema = Joi.object({
    email: emailSchema,
    password: Joi.string().required()
});

/**
 * Schema para crear estudiante
 */
const createEstudianteSchema = Joi.object({
    matricula: Joi.string().pattern(/^[A-Z0-9]{8,12}$/).required(),
    nombre: nameSchema,
    apellido_paterno: nameSchema,
    apellido_materno: nameSchema.optional(),
    fecha_nacimiento: Joi.date().max('now').required(),
    genero: Joi.string().valid('M', 'F', 'Otro').required(),
    email: emailSchema,
    telefono: phoneSchema.optional(),
    direccion: Joi.string().max(500).optional(),
    grado: Joi.number().integer().min(1).max(6).required(),
    grupo: Joi.string().pattern(/^[A-Z]$/).required()
});

/**
 * Schema para crear noticia
 */
const createNoticiaSchema = Joi.object({
    titulo: Joi.string().min(5).max(200).required(),
    contenido: Joi.string().min(20).max(10000).required(),
    categoria: Joi.string().valid('academico', 'deportivo', 'cultural', 'general').required(),
    imagen_url: Joi.string().uri().optional(),
    autor_id: idSchema.optional(),
    visible: Joi.boolean().default(true)
});

/**
 * Schema para formulario de contacto
 */
const contactSchema = Joi.object({
    nombre: nameSchema,
    email: emailSchema,
    asunto: Joi.string().min(5).max(200).required(),
    mensaje: Joi.string().min(20).max(2000).required(),
    telefono: phoneSchema.optional()
});

/**
 * Schema para calificaciones
 */
const calificacionSchema = Joi.object({
    estudiante_id: idSchema,
    materia_id: idSchema,
    periodo: Joi.string().valid('1', '2', '3', '4', 'final').required(),
    calificacion: Joi.number().min(0).max(10).precision(2).required(),
    observaciones: Joi.string().max(500).optional()
});

/**
 * Schema para citas
 */
const citaSchema = Joi.object({
    nombre_completo: nameSchema,
    email: emailSchema,
    telefono: phoneSchema.required(),
    tipo_cita: Joi.string().valid('academica', 'administrativa', 'orientacion').required(),
    fecha_solicitada: Joi.date().min('now').required(),
    hora_solicitada: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    motivo: Joi.string().min(10).max(500).required()
});

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

/**
 * Validar request body
 */
function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Retornar todos los errores
            stripUnknown: true, // Eliminar campos no definidos
            convert: true // Convertir tipos automáticamente
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validación fallida',
                errors: errors
            });
        }

        // Reemplazar body con valores validados y sanitizados
        req.body = value;
        next();
    };
}

/**
 * Validar query params
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Parámetros inválidos',
                errors: errors
            });
        }

        req.query = value;
        next();
    };
}

/**
 * Validar params (IDs en URL)
 */
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Parámetros de ruta inválidos',
                errors: errors
            });
        }

        req.params = value;
        next();
    };
}

/**
 * Validar ID en params (uso común)
 */
const validateId = validateParams(Joi.object({
    id: idSchema
}));

/**
 * Validar paginación en query
 */
const validatePagination = validateQuery(paginationSchema);

// ============================================
// VALIDADORES PERSONALIZADOS
// ============================================

/**
 * Validar que un campo sea único en BD
 */
function validateUnique(field, table, queryFn) {
    return async (req, res, next) => {
        const value = req.body[field];
        if (!value) return next();

        try {
            const exists = await queryFn(value);
            if (exists) {
                return res.status(409).json({
                    success: false,
                    error: 'Conflicto',
                    message: `${field} ya existe`,
                    field: field
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Sanitizar HTML en campos de texto
 */
function sanitizeHtmlFields(fields) {
    return (req, res, next) => {
        const DOMPurify = require('isomorphic-dompurify');

        fields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                req.body[field] = DOMPurify.sanitize(req.body[field], {
                    ALLOWED_TAGS: [], // Solo texto, sin tags
                    ALLOWED_ATTR: []
                });
            }
        });

        next();
    };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Middlewares principales
    validateBody,
    validateQuery,
    validateParams,
    validateId,
    validatePagination,

    // Schemas reutilizables
    emailSchema,
    passwordSchema,
    nameSchema,
    phoneSchema,
    idSchema,
    paginationSchema,

    // Schemas por endpoint
    registerSchema,
    loginSchema,
    createEstudianteSchema,
    createNoticiaSchema,
    contactSchema,
    calificacionSchema,
    citaSchema,

    // Validadores personalizados
    validateUnique,
    sanitizeHtmlFields,

    // Joi para crear schemas personalizados
    Joi
};
