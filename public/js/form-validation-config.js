/**
 * FORM VALIDATION CONFIG
 * Configuración centralizada de validaciones para todos los formularios
 * Fecha: 19 de Octubre, 2025
 */

const formValidationConfig = {
    // ========================================
    // FORMULARIOS PÚBLICOS
    // ========================================

    // Formulario de Contacto
    contactForm: {
        formId: 'contactForm',
        rules: {
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
            asunto: {
                required: true,
                minLength: 5,
                maxLength: 100
            },
            mensaje: {
                required: true,
                minLength: 10,
                maxLength: 1000
            }
        },
        realTimeValidation: true
    },

    // Formulario de Quejas y Sugerencias
    quejasForm: {
        formId: 'quejasForm',
        rules: {
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
            tipo: {
                required: true,
                custom: (value) => {
                    const validTypes = ['queja', 'sugerencia', 'felicitacion'];
                    if (!validTypes.includes(value)) {
                        return 'Tipo de reporte inválido';
                    }
                    return true;
                }
            },
            asunto: {
                required: true,
                minLength: 5,
                maxLength: 100
            },
            descripcion: {
                required: true,
                minLength: 20,
                maxLength: 2000
            }
        },
        realTimeValidation: true
    },

    // Formulario de Recuperación de Contraseña
    passwordRecoveryForm: {
        formId: 'passwordRecoveryForm',
        rules: {
            email: {
                required: true,
                type: 'email'
            }
        },
        realTimeValidation: true
    },

    // Formulario de Suscripción a Newsletter
    newsletterForm: {
        formId: 'newsletterForm',
        rules: {
            email: {
                required: true,
                type: 'email'
            },
            nombre: {
                required: false,
                type: 'nombre',
                minLength: 2,
                maxLength: 50
            }
        },
        realTimeValidation: true
    },

    // Formulario de Notificaciones de Convocatorias
    notificacionesForm: {
        formId: 'notificacionesForm',
        rules: {
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
            tipoConvocatoria: {
                required: true
            }
        },
        realTimeValidation: true
    },

    // Formulario de Bolsa de Trabajo - Subida de CV
    bolsaTrabajoCV: {
        formId: 'bolsaTrabajoForm',
        rules: {
            nombre: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 50
            },
            apellidoPaterno: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 50
            },
            apellidoMaterno: {
                required: false,
                type: 'nombre',
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
            profesion: {
                required: true,
                minLength: 3,
                maxLength: 100
            },
            aniosExperiencia: {
                required: true,
                type: 'onlyNumbers',
                min: 0,
                max: 50
            },
            areaInteres: {
                required: true
            },
            curriculum: {
                required: true,
                custom: (value, field) => {
                    // Validar archivo
                    if (field.files && field.files.length > 0) {
                        const file = field.files[0];
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

                        if (file.size > maxSize) {
                            return 'El archivo no debe superar los 5MB';
                        }

                        if (!allowedTypes.includes(file.type)) {
                            return 'Solo se permiten archivos PDF o Word';
                        }

                        return true;
                    }
                    return 'Por favor selecciona un archivo';
                }
            }
        },
        realTimeValidation: false // No validar archivos en tiempo real
    },

    // ========================================
    // FORMULARIOS DE ADMINISTRACIÓN (CMS)
    // ========================================

    // Formulario de Noticias
    noticiaForm: {
        formId: 'noticiaForm',
        rules: {
            noticiaTitulo: {
                required: true,
                minLength: 5,
                maxLength: 150
            },
            noticiaResumen: {
                required: false,
                maxLength: 300
            },
            noticiaContenido: {
                required: true,
                minLength: 20,
                maxLength: 10000
            },
            noticiaAutor: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 50
            },
            noticiaFecha: {
                required: true,
                custom: (value) => {
                    const fecha = new Date(value);
                    if (isNaN(fecha.getTime())) {
                        return 'Fecha inválida';
                    }
                    return true;
                }
            },
            noticiaCategoria: {
                required: true,
                custom: (value) => {
                    const categorias = ['académico', 'administrativo', 'cultural', 'deportivo', 'social', 'general'];
                    if (!categorias.includes(value)) {
                        return 'Categoría inválida';
                    }
                    return true;
                }
            },
            noticiaImagen: {
                required: false,
                custom: (value) => {
                    if (value && !value.startsWith('http') && !value.startsWith('images/')) {
                        return 'URL de imagen inválida';
                    }
                    return true;
                }
            }
        },
        realTimeValidation: false
    },

    // Formulario de Eventos
    eventoForm: {
        formId: 'eventoForm',
        rules: {
            eventoTitulo: {
                required: true,
                minLength: 5,
                maxLength: 150
            },
            eventoDescripcion: {
                required: true,
                minLength: 20,
                maxLength: 2000
            },
            eventoFecha: {
                required: true,
                custom: (value) => {
                    const fecha = new Date(value);
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);

                    if (isNaN(fecha.getTime())) {
                        return 'Fecha inválida';
                    }

                    // Permitir eventos pasados para edición
                    return true;
                }
            },
            eventoHora: {
                required: true,
                custom: (value) => {
                    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                    if (!timeRegex.test(value)) {
                        return 'Formato de hora inválido (HH:MM)';
                    }
                    return true;
                }
            },
            eventoLugar: {
                required: true,
                minLength: 3,
                maxLength: 200
            },
            eventoModalidad: {
                required: true,
                custom: (value) => {
                    const modalidades = ['presencial', 'virtual', 'híbrido'];
                    if (!modalidades.includes(value)) {
                        return 'Modalidad inválida';
                    }
                    return true;
                }
            },
            eventoCategoria: {
                required: true,
                custom: (value) => {
                    const categorias = ['académico', 'cultural', 'deportivo', 'social', 'institucional', 'otro'];
                    if (!categorias.includes(value)) {
                        return 'Categoría inválida';
                    }
                    return true;
                }
            },
            eventoOrganizador: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 100
            }
        },
        realTimeValidation: false
    },

    // Formulario de Avisos
    avisoForm: {
        formId: 'avisoForm',
        rules: {
            avisoTitulo: {
                required: true,
                minLength: 5,
                maxLength: 150
            },
            avisoContenido: {
                required: true,
                minLength: 10,
                maxLength: 2000
            },
            avisoPrioridad: {
                required: true,
                custom: (value) => {
                    const prioridades = ['baja', 'media', 'alta', 'urgente'];
                    if (!prioridades.includes(value)) {
                        return 'Prioridad inválida';
                    }
                    return true;
                }
            },
            avisoTipo: {
                required: true,
                custom: (value) => {
                    const tipos = ['informativo', 'advertencia', 'urgente', 'general'];
                    if (!tipos.includes(value)) {
                        return 'Tipo de aviso inválido';
                    }
                    return true;
                }
            },
            avisoFechaInicio: {
                required: true,
                custom: (value) => {
                    const fecha = new Date(value);
                    if (isNaN(fecha.getTime())) {
                        return 'Fecha inválida';
                    }
                    return true;
                }
            },
            avisoFechaFin: {
                required: false,
                custom: (value, field) => {
                    if (!value) return true;

                    const fechaFin = new Date(value);
                    const fechaInicio = new Date(document.getElementById('avisoFechaInicio').value);

                    if (isNaN(fechaFin.getTime())) {
                        return 'Fecha inválida';
                    }

                    if (fechaFin < fechaInicio) {
                        return 'La fecha de fin debe ser posterior a la fecha de inicio';
                    }

                    return true;
                }
            }
        },
        realTimeValidation: false
    },

    // Formulario de Comunicados
    comunicadoForm: {
        formId: 'comunicadoForm',
        rules: {
            comunicadoTitulo: {
                required: true,
                minLength: 5,
                maxLength: 150
            },
            comunicadoContenido: {
                required: true,
                minLength: 20,
                maxLength: 5000
            },
            comunicadoDestinatario: {
                required: true,
                custom: (value) => {
                    const destinatarios = ['alumnos', 'padres', 'docentes', 'general', 'administrativo'];
                    if (!destinatarios.includes(value)) {
                        return 'Destinatario inválido';
                    }
                    return true;
                }
            },
            comunicadoTipo: {
                required: true,
                custom: (value) => {
                    const tipos = ['oficial', 'informativo', 'urgente', 'circular'];
                    if (!tipos.includes(value)) {
                        return 'Tipo de comunicado inválido';
                    }
                    return true;
                }
            },
            comunicadoFecha: {
                required: true,
                custom: (value) => {
                    const fecha = new Date(value);
                    if (isNaN(fecha.getTime())) {
                        return 'Fecha inválida';
                    }
                    return true;
                }
            },
            comunicadoRemitente: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 100
            }
        },
        realTimeValidation: false
    },

    // ========================================
    // FORMULARIOS DE REGISTRO DE ESTUDIANTES
    // ========================================

    // Formulario de Inscripción
    inscripcionForm: {
        formId: 'inscripcionForm',
        rules: {
            matricula: {
                required: false, // Se genera automáticamente
                type: 'matricula'
            },
            nombre: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 50
            },
            apellidoPaterno: {
                required: true,
                type: 'nombre',
                minLength: 2,
                maxLength: 50
            },
            apellidoMaterno: {
                required: false,
                type: 'nombre',
                maxLength: 50
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
            fechaNacimiento: {
                required: true,
                custom: (value) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();

                    if (isNaN(birthDate.getTime())) {
                        return 'Fecha inválida';
                    }

                    if (age < 14 || age > 20) {
                        return 'La edad debe estar entre 14 y 20 años';
                    }

                    return true;
                }
            }
        },
        realTimeValidation: true
    }
};

/**
 * Inicializa validación para un formulario
 * @param {string} configKey - Clave de configuración
 */
function initFormValidation(configKey) {
    const config = formValidationConfig[configKey];

    if (!config) {
        console.warn(`[Form Validator] No existe configuración para: ${configKey}`);
        return;
    }

    const form = document.getElementById(config.formId);

    if (!form) {
        console.warn(`[Form Validator] No se encontró el formulario: ${config.formId}`);
        return;
    }

    // Agregar manejador de submit
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Limpiar errores previos
        formValidator.clearFormErrors(form);

        // Validar formulario
        const validation = formValidator.validateForm(form, config.rules);

        if (validation.valid) {
            console.log(`✅ [Form Validator] Formulario ${config.formId} válido`);

            // Obtener datos sanitizados
            const formData = new FormData(form);
            const sanitized = formValidator.validateAndSanitize(
                Object.fromEntries(formData),
                config.rules
            );

            // Disparar evento personalizado con datos validados
            const validEvent = new CustomEvent('formValidated', {
                detail: {
                    formId: config.formId,
                    data: sanitized.data,
                    originalEvent: e
                }
            });

            form.dispatchEvent(validEvent);
        } else {
            console.warn(`⚠️ [Form Validator] Errores en ${config.formId}:`, validation.errors);

            // Disparar evento de errores
            const errorEvent = new CustomEvent('formValidationFailed', {
                detail: {
                    formId: config.formId,
                    errors: validation.errors
                }
            });

            form.dispatchEvent(errorEvent);
        }
    });

    if (config.realTimeValidation) {
        Object.keys(config.rules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                formValidator.enableRealTimeValidation(field, config.rules[fieldId], 500);
            }
        });
    }
}

/**
 * Inicializa todas las validaciones de formularios presentes en la página
 */
function initAllFormValidations() {
    Object.keys(formValidationConfig).forEach(configKey => {
        const config = formValidationConfig[configKey];
        const form = document.getElementById(config.formId);

        if (form) {
            initFormValidation(configKey);
        }
    });
}

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllFormValidations);
    } else {
        // DOM ya está listo
        initAllFormValidations();
    }
}
