/**
 * 🔍 JOI VALIDATOR MIDDLEWARE - SEMANA 4
 * Validación de requests con Joi schemas
 *
 * Features:
 * - Validación de body, query, params
 * - Mensajes de error personalizados en español
 * - Sanitización automática
 * - Schemas reutilizables
 *
 * Fecha: 20 Noviembre 2025
 */

const Joi = require('joi');
const devLogger = require('../utils/devLogger');

// Mensajes de error en español
const spanishMessages = {
  'any.required': '{{#label}} es requerido',
  'any.only': '{{#label}} debe ser uno de {{#valids}}',
  'string.base': '{{#label}} debe ser texto',
  'string.empty': '{{#label}} no puede estar vacío',
  'string.min': '{{#label}} debe tener al menos {{#limit}} caracteres',
  'string.max': '{{#label}} no puede exceder {{#limit}} caracteres',
  'string.email': '{{#label}} debe ser un email válido',
  'string.pattern.base': '{{#label}} tiene un formato inválido',
  'number.base': '{{#label}} debe ser un número',
  'number.min': '{{#label}} debe ser al menos {{#limit}}',
  'number.max': '{{#label}} no puede ser mayor a {{#limit}}',
  'number.integer': '{{#label}} debe ser un número entero',
  'array.base': '{{#label}} debe ser un array',
  'array.min': '{{#label}} debe tener al menos {{#limit}} elementos',
  'object.base': '{{#label}} debe ser un objeto',
  'date.base': '{{#label}} debe ser una fecha válida',
  'boolean.base': '{{#label}} debe ser verdadero o falso'
};

// Configuración por defecto de Joi
const defaultOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  errors: {
    wrap: {
      label: ''
    }
  },
  messages: spanishMessages
};

/**
 * Middleware de validación
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, defaultOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      devLogger.warn('[JoiValidator] Validación fallida:', errors);

      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }

    // Reemplazar datos con valores sanitizados
    req[source] = value;
    next();
  };
};

// Schemas comunes reutilizables

const commonSchemas = {
  // ID numérico
  id: Joi.number().integer().positive().required().label('ID'),

  // Paginación
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).label('Página'),
    limit: Joi.number().integer().min(1).max(100).default(50).label('Límite'),
    sortBy: Joi.string().max(50).label('Ordenar por'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc').label('Orden')
  }),

  // Email
  email: Joi.string().email().max(255).lowercase().trim().label('Email'),

  // Contraseña
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .label('Contraseña')
    .messages({
      'string.pattern.base': 'La contraseña debe tener mayúsculas, minúsculas y números'
    }),

  // Teléfono México
  phone: Joi.string()
    .pattern(/^(\+52)?[1-9]\d{9}$/)
    .label('Teléfono')
    .messages({
      'string.pattern.base': 'Teléfono debe tener 10 dígitos'
    }),

  // Matrícula
  matricula: Joi.string()
    .pattern(/^[A-Z0-9]{6,15}$/)
    .uppercase()
    .label('Matrícula'),

  // CURP
  curp: Joi.string()
    .pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/)
    .uppercase()
    .length(18)
    .label('CURP'),

  // Fecha
  date: Joi.date().iso().label('Fecha'),

  // UUID
  uuid: Joi.string().uuid({ version: 'uuidv4' }).label('UUID')
};

// Schemas de entidades

const studentSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).trim().required().label('Nombre'),
  apellido_paterno: Joi.string().min(2).max(100).trim().required().label('Apellido paterno'),
  apellido_materno: Joi.string().min(2).max(100).trim().allow('').label('Apellido materno'),
  email: commonSchemas.email.required(),
  matricula: commonSchemas.matricula.required(),
  curp: commonSchemas.curp,
  telefono: commonSchemas.phone,
  fecha_nacimiento: commonSchemas.date,
  especialidad: Joi.string().max(100).label('Especialidad'),
  semestre: Joi.number().integer().min(1).max(6).label('Semestre'),
  grupo: Joi.string().max(10).label('Grupo'),
  status: Joi.string().valid('activo', 'baja', 'egresado').default('activo').label('Status')
});

const gradeSchema = Joi.object({
  estudiante_id: commonSchemas.id.label('ID de estudiante'),
  materia: Joi.string().min(2).max(100).required().label('Materia'),
  calificacion: Joi.number().min(0).max(10).precision(2).required().label('Calificación'),
  parcial: Joi.number().integer().min(1).max(3).label('Parcial'),
  ciclo: Joi.string().max(20).label('Ciclo escolar'),
  observaciones: Joi.string().max(500).allow('').label('Observaciones')
});

const userSchema = Joi.object({
  email: commonSchemas.email.required(),
  password: commonSchemas.password.required(),
  nombre: Joi.string().min(2).max(100).trim().required().label('Nombre'),
  apellido_paterno: Joi.string().min(2).max(100).trim().required().label('Apellido'),
  role: Joi.string().valid('admin', 'docente', 'estudiante', 'padre').required().label('Rol')
});

const loginSchema = Joi.object({
  email: commonSchemas.email.required(),
  password: Joi.string().required().label('Contraseña'),
  remember: Joi.boolean().default(false).label('Recordar')
});

const contactSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).trim().required().label('Nombre'),
  email: commonSchemas.email.required(),
  telefono: commonSchemas.phone,
  asunto: Joi.string().min(5).max(200).required().label('Asunto'),
  mensaje: Joi.string().min(20).max(2000).required().label('Mensaje')
});

const notificationSchema = Joi.object({
  user_id: commonSchemas.id,
  title: Joi.string().min(5).max(200).required().label('Título'),
  message: Joi.string().min(10).max(1000).required().label('Mensaje'),
  type: Joi.string().valid('info', 'success', 'warning', 'error').default('info').label('Tipo'),
  url: Joi.string().uri().allow('').label('URL')
});

// Schemas de query params
const searchQuerySchema = Joi.object({
  q: Joi.string().min(2).max(100).label('Búsqueda'),
  ...commonSchemas.pagination.extract(['page', 'limit', 'sortBy', 'sortOrder'])
});

const dateRangeSchema = Joi.object({
  start_date: commonSchemas.date.label('Fecha inicio'),
  end_date: commonSchemas.date.label('Fecha fin')
}).and('start_date', 'end_date');

// Export
module.exports = {
  validate,
  schemas: {
    common: commonSchemas,
    student: studentSchema,
    grade: gradeSchema,
    user: userSchema,
    login: loginSchema,
    contact: contactSchema,
    notification: notificationSchema,
    searchQuery: searchQuerySchema,
    dateRange: dateRangeSchema
  },
  Joi
};
