/**
 * Tests Unitarios para FormValidator
 * BGE Héroes de la Patria
 */

// Mock del DOM para el navegador
global.document = {
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn(),
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    remove: jest.fn(),
  })),
};

global.window = {};

// Importar FormValidator (usa module.exports en el archivo original)
const FormValidator = require('../../js/form-validator.js');

describe('FormValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new FormValidator();
  });

  describe('Constructor', () => {
    test('debería inicializar con reglas de validación', () => {
      expect(validator.validationRules).toBeDefined();
      expect(validator.validationRules.email).toBeDefined();
      expect(validator.validationRules.phone).toBeDefined();
      expect(validator.validationRules.curp).toBeDefined();
    });

    test('debería inicializar con mensajes de error', () => {
      expect(validator.errorMessages).toBeDefined();
      expect(validator.errorMessages.required).toBe('Este campo es obligatorio');
      expect(validator.errorMessages.email).toBeDefined();
    });

    test('debería inicializar customValidators como objeto vacío', () => {
      expect(validator.customValidators).toEqual({});
    });
  });

  describe('validateField - Campo Requerido', () => {
    test('debería fallar si campo requerido está vacío', () => {
      const field = { value: '', name: 'testField' };
      const rules = { required: true };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Este campo es obligatorio');
    });

    test('debería fallar si campo requerido solo tiene espacios', () => {
      const field = { value: '   ', name: 'testField' };
      const rules = { required: true };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Este campo es obligatorio');
    });

    test('debería pasar si campo requerido tiene valor', () => {
      const field = { value: 'test value', name: 'testField' };
      const rules = { required: true };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería pasar si campo no requerido está vacío', () => {
      const field = { value: '', name: 'testField' };
      const rules = { required: false };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateField - Email', () => {
    test('debería validar email válido', () => {
      const field = { value: 'test@example.com', name: 'email' };
      const rules = { type: 'email' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar email sin @', () => {
      const field = { value: 'testexample.com', name: 'email' };
      const rules = { type: 'email' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('correo electrónico válido');
    });

    test('debería rechazar email sin dominio', () => {
      const field = { value: 'test@', name: 'email' };
      const rules = { type: 'email' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
    });

    test('debería rechazar email con espacios', () => {
      const field = { value: 'test @example.com', name: 'email' };
      const rules = { type: 'email' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateField - Teléfono', () => {
    test('debería validar teléfono de 10 dígitos', () => {
      const field = { value: '5551234567', name: 'phone' };
      const rules = { type: 'phone' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar teléfono con menos de 10 dígitos', () => {
      const field = { value: '555123456', name: 'phone' };
      const rules = { type: 'phone' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('10 dígitos');
    });

    test('debería rechazar teléfono con más de 10 dígitos', () => {
      const field = { value: '55512345678', name: 'phone' };
      const rules = { type: 'phone' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
    });

    test('debería rechazar teléfono con letras', () => {
      const field = { value: '555ABC4567', name: 'phone' };
      const rules = { type: 'phone' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateField - CURP', () => {
    test('debería validar CURP válida', () => {
      const field = { value: 'HEGG900101HDFRRR09', name: 'curp' };
      const rules = { type: 'curp' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar CURP con formato incorrecto', () => {
      const field = { value: 'HEGG900101', name: 'curp' };
      const rules = { type: 'curp' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('CURP inválida');
    });

    test('debería rechazar CURP con minúsculas', () => {
      const field = { value: 'hegg900101hdfrrr09', name: 'curp' };
      const rules = { type: 'curp' };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateField - Longitud', () => {
    test('debería validar longitud mínima correcta', () => {
      const field = { value: 'abcdef', name: 'testField' };
      const rules = { minLength: 5 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar si no cumple longitud mínima', () => {
      const field = { value: 'abc', name: 'testField' };
      const rules = { minLength: 5 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('al menos 5 caracteres');
    });

    test('debería validar longitud máxima correcta', () => {
      const field = { value: 'abc', name: 'testField' };
      const rules = { maxLength: 5 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar si excede longitud máxima', () => {
      const field = { value: 'abcdefgh', name: 'testField' };
      const rules = { maxLength: 5 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('más de 5 caracteres');
    });
  });

  describe('validateField - Valores Min/Max', () => {
    test('debería validar valor mínimo', () => {
      const field = { value: '10', name: 'testField' };
      const rules = { min: 5 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar si es menor al mínimo', () => {
      const field = { value: '3', name: 'testField' };
      const rules = { min: 5 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('mínimo es 5');
    });

    test('debería validar valor máximo', () => {
      const field = { value: '5', name: 'testField' };
      const rules = { max: 10 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería rechazar si excede el máximo', () => {
      const field = { value: '15', name: 'testField' };
      const rules = { max: 10 };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('máximo es 10');
    });
  });

  describe('validateField - Múltiples Reglas', () => {
    test('debería validar múltiples reglas correctamente', () => {
      const field = { value: 'test@example.com', name: 'email' };
      const rules = {
        required: true,
        type: 'email',
        minLength: 5,
        maxLength: 50,
      };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería fallar en la primera regla que no cumpla', () => {
      const field = { value: '', name: 'email' };
      const rules = {
        required: true,
        type: 'email',
      };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Este campo es obligatorio');
    });
  });

  describe('validateField - Casos Edge', () => {
    test('debería manejar campo sin name ni id', () => {
      const field = { value: 'test' };
      const rules = { required: true };

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería manejar reglas vacías', () => {
      const field = { value: 'test', name: 'testField' };
      const rules = {};

      const result = validator.validateField(field, rules);

      expect(result.valid).toBe(true);
    });

    test('debería manejar tipo de validación desconocido', () => {
      const field = { value: 'test', name: 'testField' };
      const rules = { type: 'unknownType' };

      const result = validator.validateField(field, rules);

      // Si el tipo no existe en validationRules, no hay patrón para validar
      expect(result.valid).toBe(true);
    });
  });

  describe('Patrones de Validación', () => {
    test('patrón onlyNumbers debería validar solo números', () => {
      expect(validator.validationRules.onlyNumbers.test('12345')).toBe(true);
      expect(validator.validationRules.onlyNumbers.test('abc')).toBe(false);
      expect(validator.validationRules.onlyNumbers.test('123abc')).toBe(false);
    });

    test('patrón onlyLetters debería validar solo letras', () => {
      expect(validator.validationRules.onlyLetters.test('abcABC')).toBe(true);
      expect(validator.validationRules.onlyLetters.test('123')).toBe(false);
      expect(validator.validationRules.onlyLetters.test('abc123')).toBe(false);
    });

    test('patrón alphanumeric debería validar letras y números', () => {
      expect(validator.validationRules.alphanumeric.test('abc123')).toBe(true);
      expect(validator.validationRules.alphanumeric.test('abc')).toBe(true);
      expect(validator.validationRules.alphanumeric.test('123')).toBe(true);
      expect(validator.validationRules.alphanumeric.test('abc@123')).toBe(false);
    });

    test('patrón url debería validar URLs', () => {
      expect(validator.validationRules.url.test('http://example.com')).toBe(true);
      expect(validator.validationRules.url.test('https://example.com')).toBe(true);
      expect(validator.validationRules.url.test('example.com')).toBe(false);
      expect(validator.validationRules.url.test('ftp://example.com')).toBe(false);
    });
  });
});
