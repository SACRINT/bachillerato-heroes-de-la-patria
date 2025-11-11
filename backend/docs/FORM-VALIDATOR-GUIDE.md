# 📋 Guía de Uso - Form Validator

Sistema centralizado de validaciones para formularios del proyecto BGE.

## 📦 Instalación

Incluir el script en el HTML antes de los formularios:

```html
<script src="js/form-validator.js?v=20251019"></script>
```

## 🎯 Uso Básico

### 1. Validación de Campo Individual

```javascript
const emailField = document.getElementById('email');

const result = formValidator.validateField(emailField, {
    required: true,
    type: 'email'
});

if (!result.valid) {
    formValidator.showFieldError(emailField, result.message);
} else {
    formValidator.markFieldValid(emailField);
}
```

### 2. Validación de Formulario Completo

```javascript
// Definir reglas por campo
const rules = {
    nombre: {
        required: true,
        type: 'nombre',
        minLength: 2,
        maxLength: 50
    },
    email: {
        required: true,
        type: 'email'
    },
    telefono: {
        required: true,
        type: 'phone'
    },
    curp: {
        required: false,
        type: 'curp'
    }
};

// Validar al enviar formulario
document.getElementById('miFormulario').addEventListener('submit', (e) => {
    e.preventDefault();

    const validation = formValidator.validateForm('miFormulario', rules);

    if (validation.valid) {
        // Enviar formulario
        console.log('Formulario válido');
        // submitForm();
    } else {
        console.log('Errores:', validation.errors);
    }
});
```

### 3. Validación en Tiempo Real

```javascript
// Activar validación mientras el usuario escribe
formValidator.enableRealTimeValidation('email', {
    required: true,
    type: 'email'
}, 500); // 500ms de debounce
```

## 🔧 Tipos de Validación Disponibles

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `email` | Correo electrónico válido | usuario@ejemplo.com |
| `phone` | Teléfono de 10 dígitos | 5512345678 |
| `curp` | CURP válida | AAAA######HMMMMMM## |
| `rfc` | RFC válido | AAA######AAA |
| `matricula` | Matrícula (8-12 alfanum.) | BGE20251234 |
| `nombre` | Solo letras y espacios | Juan Pérez |
| `url` | URL válida | https://ejemplo.com |
| `onlyNumbers` | Solo números | 12345 |
| `onlyLetters` | Solo letras | Texto |
| `alphanumeric` | Letras y números | abc123 |
| `noSpecialChars` | Sin caracteres especiales | Texto normal |

## 📝 Reglas de Validación

### Reglas Básicas

```javascript
{
    required: true,              // Campo obligatorio
    type: 'email',              // Tipo de validación
    minLength: 5,               // Longitud mínima
    maxLength: 50,              // Longitud máxima
    min: 0,                     // Valor mínimo (números)
    max: 100,                   // Valor máximo (números)
    match: 'confirmPassword'    // Debe coincidir con otro campo
}
```

### Validación Personalizada

```javascript
{
    required: true,
    custom: (value, field) => {
        if (value.includes('admin')) {
            return 'No se permite la palabra "admin"';
        }
        return true; // Válido
    }
}
```

## 🎨 Ejemplos de Uso

### Ejemplo 1: Formulario de Contacto

```javascript
const contactRules = {
    nombre: {
        required: true,
        type: 'nombre',
        minLength: 2,
        maxLength: 50
    },
    email: {
        required: true,
        type: 'email'
    },
    telefono: {
        required: false,
        type: 'phone'
    },
    mensaje: {
        required: true,
        minLength: 10,
        maxLength: 500
    }
};

document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const validation = formValidator.validateForm(this, contactRules);

    if (validation.valid) {
        // Obtener datos sanitizados
        const formData = new FormData(this);
        const sanitized = formValidator.validateAndSanitize(formData, contactRules);

        // Enviar datos
        enviarFormulario(sanitized.data);
    }
});

// Validación en tiempo real para email
formValidator.enableRealTimeValidation('email', contactRules.email);
```

### Ejemplo 2: Formulario de Registro de Estudiante

```javascript
const studentRules = {
    matricula: {
        required: true,
        type: 'matricula'
    },
    nombre: {
        required: true,
        type: 'nombre',
        minLength: 2
    },
    apellidoPaterno: {
        required: true,
        type: 'nombre'
    },
    apellidoMaterno: {
        required: false,
        type: 'nombre'
    },
    curp: {
        required: true,
        type: 'curp'
    },
    email: {
        required: true,
        type: 'email'
    },
    telefono: {
        required: true,
        type: 'phone'
    },
    password: {
        required: true,
        minLength: 8,
        custom: (value) => {
            if (!/[A-Z]/.test(value)) {
                return 'Debe contener al menos una mayúscula';
            }
            if (!/[0-9]/.test(value)) {
                return 'Debe contener al menos un número';
            }
            return true;
        }
    },
    confirmPassword: {
        required: true,
        match: 'password'
    }
};

// Aplicar validación en tiempo real
Object.keys(studentRules).forEach(fieldId => {
    formValidator.enableRealTimeValidation(fieldId, studentRules[fieldId]);
});
```

### Ejemplo 3: Formulario con Validador Personalizado

```javascript
// Registrar validador personalizado
formValidator.registerValidator('isAdult', (value) => {
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 18) {
        return 'Debes ser mayor de 18 años';
    }
    return true;
});

// Usar validador registrado
const rules = {
    fechaNacimiento: {
        required: true,
        validator: 'isAdult'
    }
};
```

## 🛠️ Métodos Útiles

### Limpiar Errores

```javascript
// Limpiar un campo específico
formValidator.clearFieldError(field);

// Limpiar todo el formulario
formValidator.clearFormErrors('miFormulario');
```

### Sanitización

```javascript
// Sanitizar texto individual
const clean = formValidator.sanitize(userInput);

// Validar y sanitizar FormData completo
const result = formValidator.validateAndSanitize(formData, rules);
if (result.valid) {
    console.log('Datos limpios:', result.data);
} else {
    console.log('Errores:', result.errors);
}
```

### Agregar Reglas Personalizadas

```javascript
formValidator.addValidationRule(
    'nss',                                          // Nombre
    /^\d{11}$/,                                     // Patrón RegExp
    'NSS inválido. Debe tener 11 dígitos'         // Mensaje
);

// Usar la nueva regla
const rules = {
    numeroSeguroSocial: {
        required: true,
        type: 'nss'
    }
};
```

## 🎯 Integración con Formularios Existentes

### Paso 1: Identificar campos y reglas

```javascript
const formConfig = {
    formId: 'quejasForm',
    rules: {
        nombre: { required: true, type: 'nombre' },
        email: { required: true, type: 'email' },
        asunto: { required: true, minLength: 5 },
        descripcion: { required: true, minLength: 20 }
    }
};
```

### Paso 2: Agregar manejador de submit

```javascript
function initFormValidation(config) {
    const form = document.getElementById(config.formId);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Limpiar errores previos
        formValidator.clearFormErrors(form);

        // Validar
        const validation = formValidator.validateForm(form, config.rules);

        if (validation.valid) {
            // Sanitizar y enviar
            const formData = new FormData(form);
            const sanitized = formValidator.validateAndSanitize(formData, config.rules);

            submitToAPI(sanitized.data);
        } else {
            // Mostrar mensaje general
            showAlert('Por favor corrige los errores en el formulario', 'warning');
        }
    });

    // Opcional: validación en tiempo real
    Object.keys(config.rules).forEach(fieldId => {
        formValidator.enableRealTimeValidation(fieldId, config.rules[fieldId]);
    });
}

// Inicializar
initFormValidation(formConfig);
```

## 💡 Mejores Prácticas

1. **Validación en Dos Niveles**: Siempre validar en cliente Y servidor
2. **Mensajes Claros**: Los mensajes de error deben ser específicos y útiles
3. **Validación en Tiempo Real**: Usar para mejorar UX, pero con debounce
4. **Sanitización**: Siempre sanitizar datos antes de enviarlos
5. **Feedback Visual**: Usar clases de Bootstrap (`is-valid`, `is-invalid`)

## 🔒 Seguridad

### ⚠️ IMPORTANTE

- ✅ **SÍ** usar este validador para mejorar UX
- ✅ **SÍ** sanitizar datos con `validateAndSanitize()`
- ✅ **SÍ** validar en el servidor SIEMPRE
- ❌ **NO** confiar solo en validación del cliente
- ❌ **NO** asumir que datos sanitizados son 100% seguros

### Backend Validation (Ejemplo Node.js)

```javascript
// SIEMPRE validar en backend también
app.post('/api/contact', (req, res) => {
    const { nombre, email, mensaje } = req.body;

    // Validación en servidor
    if (!nombre || !email || !mensaje) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Validación adicional, sanitización con biblioteca especializada
    // ...

    // Procesar datos
});
```

## 📚 Referencia Rápida

```javascript
// Validar campo
formValidator.validateField(field, rules)

// Validar formulario
formValidator.validateForm(formId, fieldRules)

// Validación en tiempo real
formValidator.enableRealTimeValidation(fieldId, rules, debounce)

// Mostrar error
formValidator.showFieldError(field, message)

// Limpiar error
formValidator.clearFieldError(field)

// Marcar como válido
formValidator.markFieldValid(field)

// Limpiar formulario
formValidator.clearFormErrors(formId)

// Sanitizar
formValidator.sanitize(text)

// Validar y sanitizar
formValidator.validateAndSanitize(data, rules)

// Registrar validador
formValidator.registerValidator(name, fn)

// Agregar regla
formValidator.addValidationRule(name, pattern, message)
```

---

**Fecha de Creación**: 19 de Octubre, 2025
**Versión**: 1.0
**Autor**: Claude Code - Arquitecto BGE
