/**
 * 🔐 INPUT VALIDATOR - v1.0.0
 * Validación y sanitización de inputs
 *
 * SEMANA 6-7 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Validación con Joi-like schema
 * - Sanitización de HTML/XSS
 * - Validación de tipos comunes
 * - Middleware de validación
 * - Mensajes de error claros
 */

const devLogger = require('./devLogger');

/**
 * Patrones de validación comunes
 */
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]{8,20}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericSpaces: /^[a-zA-Z0-9\s]+$/,
  url: /^https?:\/\/.+/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}(:\d{2})?$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  matricula: /^[A-Z0-9]{6,12}$/,
  curp: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/
};

/**
 * Sanitizar string para prevenir XSS
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitizar objeto recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Validador de campos
 */
class Validator {
  constructor() {
    this.errors = [];
    this.value = null;
    this.fieldName = '';
  }

  /**
   * Iniciar validación de campo
   * @param {*} value - Valor a validar
   * @param {string} name - Nombre del campo
   * @returns {Validator} this
   */
  field(value, name) {
    this.value = value;
    this.fieldName = name;
    return this;
  }

  /**
   * Campo requerido
   * @param {string} message - Mensaje de error
   * @returns {Validator} this
   */
  required(message = null) {
    if (this.value === undefined || this.value === null || this.value === '') {
      this.errors.push(message || `${this.fieldName} es requerido`);
    }
    return this;
  }

  /**
   * Debe ser string
   * @returns {Validator} this
   */
  string() {
    if (this.value !== undefined && this.value !== null && typeof this.value !== 'string') {
      this.errors.push(`${this.fieldName} debe ser texto`);
    }
    return this;
  }

  /**
   * Debe ser número
   * @returns {Validator} this
   */
  number() {
    if (this.value !== undefined && this.value !== null) {
      const num = Number(this.value);
      if (isNaN(num)) {
        this.errors.push(`${this.fieldName} debe ser número`);
      }
    }
    return this;
  }

  /**
   * Debe ser entero
   * @returns {Validator} this
   */
  integer() {
    if (this.value !== undefined && this.value !== null) {
      if (!Number.isInteger(Number(this.value))) {
        this.errors.push(`${this.fieldName} debe ser entero`);
      }
    }
    return this;
  }

  /**
   * Debe ser boolean
   * @returns {Validator} this
   */
  boolean() {
    if (this.value !== undefined && this.value !== null) {
      if (typeof this.value !== 'boolean' && this.value !== 'true' && this.value !== 'false') {
        this.errors.push(`${this.fieldName} debe ser booleano`);
      }
    }
    return this;
  }

  /**
   * Debe ser array
   * @returns {Validator} this
   */
  array() {
    if (this.value !== undefined && this.value !== null && !Array.isArray(this.value)) {
      this.errors.push(`${this.fieldName} debe ser array`);
    }
    return this;
  }

  /**
   * Longitud mínima
   * @param {number} min - Longitud mínima
   * @returns {Validator} this
   */
  minLength(min) {
    if (this.value && this.value.length < min) {
      this.errors.push(`${this.fieldName} debe tener al menos ${min} caracteres`);
    }
    return this;
  }

  /**
   * Longitud máxima
   * @param {number} max - Longitud máxima
   * @returns {Validator} this
   */
  maxLength(max) {
    if (this.value && this.value.length > max) {
      this.errors.push(`${this.fieldName} no debe exceder ${max} caracteres`);
    }
    return this;
  }

  /**
   * Valor mínimo
   * @param {number} min - Valor mínimo
   * @returns {Validator} this
   */
  min(min) {
    const num = Number(this.value);
    if (!isNaN(num) && num < min) {
      this.errors.push(`${this.fieldName} debe ser al menos ${min}`);
    }
    return this;
  }

  /**
   * Valor máximo
   * @param {number} max - Valor máximo
   * @returns {Validator} this
   */
  max(max) {
    const num = Number(this.value);
    if (!isNaN(num) && num > max) {
      this.errors.push(`${this.fieldName} no debe exceder ${max}`);
    }
    return this;
  }

  /**
   * Debe coincidir con patrón
   * @param {RegExp|string} pattern - Patrón o nombre de patrón
   * @param {string} message - Mensaje de error
   * @returns {Validator} this
   */
  matches(pattern, message = null) {
    const regex = typeof pattern === 'string' ? patterns[pattern] : pattern;
    if (this.value && regex && !regex.test(this.value)) {
      this.errors.push(message || `${this.fieldName} tiene formato inválido`);
    }
    return this;
  }

  /**
   * Debe ser email válido
   * @returns {Validator} this
   */
  email() {
    return this.matches('email', `${this.fieldName} debe ser email válido`);
  }

  /**
   * Debe ser URL válida
   * @returns {Validator} this
   */
  url() {
    return this.matches('url', `${this.fieldName} debe ser URL válida`);
  }

  /**
   * Debe ser fecha válida
   * @returns {Validator} this
   */
  date() {
    if (this.value) {
      const date = new Date(this.value);
      if (isNaN(date.getTime())) {
        this.errors.push(`${this.fieldName} debe ser fecha válida`);
      }
    }
    return this;
  }

  /**
   * Debe estar en lista de valores
   * @param {Array} values - Valores permitidos
   * @returns {Validator} this
   */
  oneOf(values) {
    if (this.value && !values.includes(this.value)) {
      this.errors.push(`${this.fieldName} debe ser uno de: ${values.join(', ')}`);
    }
    return this;
  }

  /**
   * Validación personalizada
   * @param {Function} fn - Función de validación
   * @param {string} message - Mensaje de error
   * @returns {Validator} this
   */
  custom(fn, message) {
    if (this.value && !fn(this.value)) {
      this.errors.push(message || `${this.fieldName} es inválido`);
    }
    return this;
  }

  /**
   * Obtener errores
   * @returns {Array} Errores
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Verificar si es válido
   * @returns {boolean} Es válido
   */
  isValid() {
    return this.errors.length === 0;
  }

  /**
   * Resetear errores
   * @returns {Validator} this
   */
  reset() {
    this.errors = [];
    return this;
  }
}

/**
 * Crear middleware de validación
 * @param {Object} schema - Schema de validación
 * @returns {Function} Middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const validator = new Validator();
    const errors = [];

    // Validar body
    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        validateField(validator, req.body[field], field, rules, errors);
      }
    }

    // Validar params
    if (schema.params) {
      for (const [field, rules] of Object.entries(schema.params)) {
        validateField(validator, req.params[field], field, rules, errors);
      }
    }

    // Validar query
    if (schema.query) {
      for (const [field, rules] of Object.entries(schema.query)) {
        validateField(validator, req.query[field], field, rules, errors);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }

    // Sanitizar datos
    if (schema.sanitize !== false) {
      req.body = sanitizeObject(req.body);
      req.query = sanitizeObject(req.query);
      req.params = sanitizeObject(req.params);
    }

    next();
  };
}

/**
 * Validar campo individual
 * @private
 */
function validateField(validator, value, name, rules, errors) {
  validator.reset().field(value, name);

  if (rules.required) validator.required();
  if (rules.string) validator.string();
  if (rules.number) validator.number();
  if (rules.integer) validator.integer();
  if (rules.boolean) validator.boolean();
  if (rules.array) validator.array();
  if (rules.email) validator.email();
  if (rules.url) validator.url();
  if (rules.date) validator.date();
  if (rules.minLength) validator.minLength(rules.minLength);
  if (rules.maxLength) validator.maxLength(rules.maxLength);
  if (rules.min) validator.min(rules.min);
  if (rules.max) validator.max(rules.max);
  if (rules.pattern) validator.matches(rules.pattern, rules.patternMessage);
  if (rules.oneOf) validator.oneOf(rules.oneOf);
  if (rules.custom) validator.custom(rules.custom, rules.customMessage);

  errors.push(...validator.getErrors());
}

// Schemas predefinidos para validaciones comunes
const commonSchemas = {
  login: {
    body: {
      email: { required: true, email: true },
      password: { required: true, minLength: 3 }
    }
  },

  register: {
    body: {
      nombre: { required: true, string: true, minLength: 2, maxLength: 100 },
      email: { required: true, email: true },
      password: { required: true, minLength: 8 }
    }
  },

  pagination: {
    query: {
      page: { integer: true, min: 1 },
      limit: { integer: true, min: 1, max: 100 }
    }
  },

  idParam: {
    params: {
      id: { required: true, integer: true, min: 1 }
    }
  }
};

module.exports = {
  Validator,
  validateRequest,
  sanitizeString,
  sanitizeObject,
  patterns,
  commonSchemas
};
