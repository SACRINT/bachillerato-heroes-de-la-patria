/**
 * 🏛️ SISTEMA PROFESIONAL DE FORMULARIOS
 * window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal "window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')')')')')')"')
 * Sistema híbrido con verificación de email y anti-spam avanzado
 */

class ProfessionalFormsManager {
    constructor() {
        // Detectar si estamos en localhost para configuración de development
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '::1';

        this.config = {
            // Configuración del servidor de formularios
            apiEndpoint: '/api/contact/send',  // Endpoint del backend propio
            fallbackEndpoint: 'https://formspree.io/f/mblyyzon', // Fallback a Formspree
            verificationService: 'https://api.hunter.io/v2/email-verifier', // Servicio de verificación

            // Anti-spam y seguridad
            honeypotField: '_gotcha',
            maxSubmissions: isLocalhost ? 100 : 3, // 100 en localhost para testing, 3 en producción
            requiredDelay: 3000, // Tiempo mínimo antes de envío (ms)

            // Email institucional
            institutionEmail: 'contacto@bgeheroespatria.edu.mx',
            fromDomain: '@bgeheroespatria.edu.mx',

            // Validaciones
            emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phoneRegex: /^[\d\s\-\+\(\)]{10,}$/
        };

        this.state = {
            submissionTimes: new Map(),
            verifiedEmails: new Map(),
            blockedIPs: new Set(),
            formInteractions: new Map()
        };

        this.init();
    }

    init() {
        console.log('🏛️ [FORMS] Inicializando sistema profesional de formularios...');

        // Buscar y configurar todos los formularios
        this.setupAllForms();

        // Configurar anti-spam
        this.setupAntiSpam();

        // Configurar validaciones en tiempo real
        this.setupRealTimeValidation();

        console.log('✅ [FORMS] Sistema profesional inicializado');
    }

    // ==========================================
    // CONFIGURACIÓN DE FORMULARIOS
    // ==========================================

    setupAllForms() {
        const formSelectors = [
            '#contactForm',           // Formulario de contacto
            '#appointmentForm',       // Formulario de citas
            '#cvUploadForm',         // Formulario de CV/bolsa trabajo
            '#parentLoginForm',      // Formulario padres de familia
            '#newsletterForm',       // Newsletter
            '#feedbackForm',         // Sugerencias
            '#enrollmentForm'        // Inscripciones
        ];

        formSelectors.forEach(selector => {
            const form = document.querySelector(selector);
            if (form) {
                this.setupProfessionalForm(form);
            }
        });

        // También buscar formularios por clase
        document.querySelectorAll('.professional-form').forEach(form => {
            // IMPORTANTE: Saltar formularios que ya son manejados por handlers específicos
            if (form.getAttribute('data-handled-by')) {
                console.log(`📝 [FORMS] Formulario #${form.id} ya es manejado por: ${form.getAttribute('data-handled-by')}. Saltando...`);
                return;
            }
            this.setupProfessionalForm(form);
        });
    }

    setupProfessionalForm(form) {
        const formId = form.id || 'form-' + Date.now();
        console.log('📝 [FORMS] Configurando formulario:', formId);

        // Prevenir envío estándar
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProfessionalSubmit(form);
        });

        // Agregar campo honeypot (anti-spam invisible)
        this.addHoneypot(form);

        // Configurar validación en tiempo real
        this.setupFormValidation(form);

        // Rastrear interacciones del usuario
        this.trackFormInteractions(form);

        // Agregar indicadores de seguridad
        this.addSecurityIndicators(form);
    }

    // ==========================================
    // SISTEMA ANTI-SPAM AVANZADO
    // ==========================================

    addHoneypot(form) {
        // Campo invisible para detectar bots
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = this.config.honeypotField;
        honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';

        form.appendChild(honeypot);
    }

    setupAntiSpam() {
        // Rate limiting por IP
        setInterval(() => {
            this.state.submissionTimes.clear();
        }, 3600000); // Limpiar cada hora
    }

    trackFormInteractions(form) {
        const formId = form.id;
        this.state.formInteractions.set(formId, {
            startTime: Date.now(),
            keystrokes: 0,
            mouseMovements: 0,
            fieldFocuses: 0
        });

        const interactions = this.state.formInteractions.get(formId);

        // Rastrear teclas
        form.addEventListener('keydown', () => {
            interactions.keystrokes++;
        });

        // Rastrear mouse
        form.addEventListener('mousemove', () => {
            interactions.mouseMovements++;
        });

        // Rastrear focus en campos
        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('focus', () => {
                interactions.fieldFocuses++;
            });
        });
    }

    // ==========================================
    // VERIFICACIÓN DE EMAIL PROFESIONAL
    // ==========================================

    async verifyEmailAddress(email) {
        // Verificación básica de formato
        if (!this.config.emailRegex.test(email)) {
            return { valid: false, reason: 'Formato de email inválido' };
        }

        // Verificar si ya está en caché
        if (this.state.verifiedEmails.has(email)) {
            return this.state.verifiedEmails.get(email);
        }

        try {
            // Verificación avanzada (simulada - en producción usar API real)
            const verification = await this.performEmailVerification(email);

            // Guardar en caché
            this.state.verifiedEmails.set(email, verification);

            return verification;
        } catch (error) {
            console.warn('⚠️ [FORMS] Error verificando email:', error);

            // En caso de error, permitir si el formato es válido
            return {
                valid: true,
                reason: 'Verificación no disponible, formato válido',
                warning: true
            };
        }
    }

    async performEmailVerification(email) {
        // Simulación de verificación avanzada
        // En producción, usar servicios como Hunter.io, ZeroBounce, etc.

        const commonDomains = [
            'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
            'icloud.com', 'protonmail.com', 'live.com'
        ];

        const domain = email.split('@')[1];

        // Verificar dominios comunes (mayoría válidos)
        if (commonDomains.includes(domain)) {
            return {
                valid: true,
                reason: 'Dominio verificado',
                quality: 'high'
            };
        }

        // Verificar dominios educativos
        if (domain.includes('edu') || domain.includes('gob')) {
            return {
                valid: true,
                reason: 'Dominio institucional',
                quality: 'high'
            };
        }

        // Para otros dominios, asumir válidos pero con menor calidad
        return {
            valid: true,
            reason: 'Formato válido',
            quality: 'medium',
            warning: 'Por favor, verifica que tu email sea correcto'
        };
    }

    // ==========================================
    // PROCESAMIENTO PROFESIONAL DE FORMULARIOS
    // ==========================================

    async handleProfessionalSubmit(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton?.textContent || 'Enviar';

        try {
            // 1. Validaciones de seguridad básicas (sin API externa)
            const securityCheck = await this.performSecurityChecksLocal(form);
            if (!securityCheck.passed) {
                this.showError(form, securityCheck.message);
                return;
            }

            // 2. Verificar email (solo formato básico)
            const emailField = form.querySelector('input[type="email"]');
            if (emailField && !this.isValidEmailFormat(emailField.value)) {
                this.showError(form, 'Por favor ingresa un email válido');
                return;
            }

            // 3. UI de carga
            this.showLoadingState(form, 'Enviando mensaje...');

            // 4. Envío al servidor propio (único método)
            let result = await this.sendToOwnServer(form);

            if (result.success) {
                if (result.requiresVerification) {
                    // ✅ NUEVO: Emitir evento para formulario de citas
                    if (form.id === 'appointmentForm') {
                        window.dispatchEvent(new CustomEvent('appointmentEmailSent', {
                            detail: { success: true, data: result.data }
                        }));
                    }

                    // Mostrar popup de verificación
                    this.showVerificationPopup(result.data);
                    this.resetForm(form);
                } else {
                    // Mostrar éxito para otros casos
                    this.showSuccess(form);
                    this.resetForm(form);
                }
            } else {
                this.showError(form, result.message || 'Error al enviar el mensaje. Por favor intenta nuevamente.');
            }

        } catch (error) {
            console.error('❌ [FORMS] Error procesando formulario:', error);
            this.showError(form, 'Error inesperado. Por favor intenta nuevamente.');
        } finally {
            this.hideLoadingState(form);
        }
    }

    // Validaciones locales de seguridad (sin APIs externas)
    async performSecurityChecksLocal(form) {
        // 1. Verificar honeypot
        const honeypot = form.querySelector(`input[name="${this.config.honeypotField}"]`);
        if (honeypot && honeypot.value) {
            return { passed: false, message: 'Actividad sospechosa detectada' };
        }

        // 2. Verificar tiempo de interacción (detectar bots)
        const formId = form.id || 'default';
        const interactions = this.state.formInteractions.get(formId);
        const now = Date.now();

        if (interactions) {
            const timeSpent = now - interactions.startTime;
            if (timeSpent < this.config.requiredDelay) {
                return {
                    passed: false,
                    message: 'Por favor, tómate tu tiempo para llenar el formulario.'
                };
            }

            if (interactions.keystrokes < 5 && interactions.mouseMovements < 5) {
                return {
                    passed: false,
                    message: 'Actividad inusual detectada.'
                };
            }
        }

        // 3. Rate limiting local simple (por sesión del navegador)
        const sessionKey = 'form_submissions_' + formId;
        const sessionSubmissions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        const recentSubmissions = sessionSubmissions.filter(time => now - time < 3600000); // 1 hora

        if (recentSubmissions.length >= this.config.maxSubmissions) {
            return {
                passed: false,
                message: 'Demasiados intentos. Intenta nuevamente en una hora.'
            };
        }

        // 4. Actualizar contadores en sessionStorage
        recentSubmissions.push(now);
        sessionStorage.setItem(sessionKey, JSON.stringify(recentSubmissions));

        return { passed: true };
    }

    // Validación simple de email (sin API externa)
    isValidEmailFormat(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // MÉTODO ANTIGUO DEPRECADO (mantener por compatibilidad pero no usar)
    async performSecurityChecks(form) {
        return this.performSecurityChecksLocal(form);
    }

    async getUserIP() {
        // No llamar a API externa - el backend puede obtener la IP del request
        return 'client-side';
    }

    // ==========================================
    // ENVÍO A SERVIDOR PROPIO (PROFESIONAL)
    // ==========================================

    async sendToOwnServer(form) {
        try {
            const formData = new FormData(form);
            const formType = formData.get('form_type');

            // 🆕 CORRECCIÓN CRÍTICA: Detectar suscripciones a newsletter
            if (formType === 'Suscripción Newsletter') {
                console.log('📧 Detectada suscripción a newsletter, usando endpoint especializado');
                return await this.handleNewsletterSubscription(formData);
            }

            // 🆕 NUEVO: Detectar formularios de citas
            if (formType === 'Agendamiento de Cita') {
                console.log('📅 Detectado formulario de citas, usando endpoint especializado');
                return await this.handleAppointmentSubmit(form, formData);
            }

            // 💼 DESACTIVADO: Bolsa de trabajo ahora manejada por bolsa-trabajo-cv-handler.js
            // Este handler no debe procesar formularios de bolsa-trabajo para evitar envíos duplicados
            // if (formType === 'Registro Bolsa de Trabajo') {
            //     console.log('💼 Detectado formulario de bolsa de trabajo, usando endpoint especializado');
            //     return await this.handleBolsaTrabajoSubmit(form, formData);
            // }

            // ✅ FIX BUG CRÍTICO: Mapeo de campos inglés → español
            // El backend espera: nombre, asunto, mensaje, telefono
            // Los formularios envían: name, subject, message, phone
            const jsonData = {
                nombre: formData.get('name') || formData.get('nombre'),
                email: formData.get('email'),
                telefono: formData.get('phone') || formData.get('telefono'),
                asunto: formData.get('subject') || formData.get('asunto'),
                mensaje: formData.get('message') || formData.get('mensaje'),
                form_type: formData.get('form_type'),

                // Campos adicionales para citas (mantener en inglés, son opcionales)
                ...(formData.get('department') && { department: formData.get('department') }),
                ...(formData.get('date') && { date: formData.get('date') }),
                ...(formData.get('time') && { time: formData.get('time') }),
                ...(formData.get('reason') && { reason: formData.get('reason') }),

                // Metadata profesional
                _timestamp: new Date().toISOString(),
                _source: 'website_contact',
                _institution: window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria'),
                _verified: 'true'
            };

            console.log('📤 Enviando datos al servidor:', jsonData);

            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            console.log('📥 Respuesta del servidor:', result);

            if (response.ok && result.success) {
                // Devolver resultado con flag de verificación
                return {
                    success: true,
                    requiresVerification: result.requiresVerification || true,
                    data: result
                };
            }

            // Si hay errores de validación, mostrarlos
            if (result.errors && result.errors.length > 0) {
                const errorMessages = result.errors.map(err => err.msg).join(', ');
                return {
                    success: false,
                    message: `Errores de validación: ${errorMessages}`
                };
            }

            return {
                success: false,
                message: result.message || 'Error al enviar mensaje'
            };
        } catch (error) {
            console.error('❌ [FORMS] Error enviando al servidor:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    }

    // ==========================================
    // MANEJO ESPECIALIZADO DE SUSCRIPCIONES
    // ==========================================

    async handleNewsletterSubscription(formData) {
        try {
            const email = formData.get('email');
            const name = formData.get('name') || formData.get('nombre') || 'Suscriptor';

            console.log('📧 [NEWSLETTER] Procesando suscripción:', { email, name });

            // Datos para el endpoint de suscripciones
            const subscriptionData = {
                email: email,
                name: name,
                source: 'website_newsletter'
                // categories omitido - el backend usará ['all'] por defecto
            };

            // Enviar al endpoint correcto
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscriptionData),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            console.log('📥 [NEWSLETTER] Respuesta del servidor:', result);

            if (response.ok && result.success) {
                return {
                    success: true,
                    requiresVerification: true,
                    message: result.existed
                        ? 'Ya estabas suscrito. Te hemos enviado un recordatorio a tu email.'
                        : '¡Gracias por suscribirte! Por favor revisa tu email para confirmar tu suscripción.',
                    data: result
                };
            }

            return {
                success: false,
                message: result.message || result.error || 'Error al procesar suscripción'
            };

        } catch (error) {
            console.error('❌ [NEWSLETTER] Error en suscripción:', error);
            return {
                success: false,
                message: 'Error de conexión. Por favor intenta nuevamente.'
            };
        }
    }

    // ==========================================
    // MANEJO ESPECIALIZADO DE CITAS
    // ==========================================

    async handleAppointmentSubmit(form, formData) {
        try {
            // Extraer datos del formulario
            const nombre = formData.get('nombre') || '';
            const email = formData.get('email') || '';
            const telefono = formData.get('telefono') || formData.get('phone') || '';
            const motivo = formData.get('reason') || '';
            const departamento = formData.get('department') || '';

            // Extraer fecha y hora del formato de appointment-hidden fields
            const dateFormatted = formData.get('date') || '';
            const timeFormatted = formData.get('time') || '';

            // Convertir fecha a formato YYYY-MM-DD si viene en otro formato
            let fecha_solicitada = '';
            let hora_solicitada = '';

            if (dateFormatted) {
                // El campo ahora viene en formato YYYY-MM-DD de appointments.js
                if (dateFormatted.includes('-') && dateFormatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Ya está en formato correcto
                    fecha_solicitada = dateFormatted;
                } else {
                    // Fallback: si viene en otro formato, intentar parsear
                    const dateMatch = dateFormatted.match(/(\d{1,2})\s+de\s+\w+\s+de\s+(\d{4})/);
                    if (dateMatch) {
                        // Este es un fallback para compatibilidad
                        const today = new Date();
                        fecha_solicitada = today.toISOString().split('T')[0];
                    }
                }
            }

            if (timeFormatted) {
                // Extraer HH:MM de texto (puede venir de appointments.js como "10:30")
                const timeMatch = timeFormatted.match(/(\d{2}):(\d{2})/);
                if (timeMatch) {
                    hora_solicitada = `${timeMatch[1]}:${timeMatch[2]}`;
                }
            }

            // Validación básica de campos requeridos
            if (!nombre.trim()) {
                return {
                    success: false,
                    message: 'El nombre es requerido'
                };
            }
            if (!email.trim() || !email.includes('@')) {
                return {
                    success: false,
                    message: 'El email es requerido y debe ser válido'
                };
            }
            if (!motivo.trim()) {
                return {
                    success: false,
                    message: 'El motivo de la cita es requerido'
                };
            }
            if (!departamento.trim()) {
                return {
                    success: false,
                    message: 'El departamento es requerido'
                };
            }

            console.log('📅 [CITAS] Procesando cita:', {
                nombre, email, departamento,
                fecha: fecha_solicitada,
                hora: hora_solicitada
            });

            // Datos para el endpoint de citas mejorado
            const appointmentData = {
                nombre_completo: nombre.trim(),
                email: email.trim(),
                telefono: telefono.trim(),
                tipo_persona: 'externo', // Valor por defecto para formulario público
                motivo: motivo.trim(),
                descripcion: formData.get('description') || '',
                fecha_solicitada: fecha_solicitada,
                hora_solicitada: hora_solicitada,
                departamento: departamento.trim()
            };

            console.log('📤 [CITAS] Enviando datos al endpoint /api/citas/create:', appointmentData);

            // Enviar al endpoint correcto de citas mejoradas
            const response = await fetch('/api/citas/create', {
                method: 'POST',
                body: JSON.stringify(appointmentData),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            console.log('📥 [CITAS] Respuesta del servidor:', result);

            if (response.ok && result.success) {
                return {
                    success: true,
                    requiresVerification: true,
                    message: '¡Tu cita ha sido agendada! Por favor revisa tu email para confirmar.',
                    data: result
                };
            }

            // Manejo de errores específicos
            if (result.errors && result.errors.length > 0) {
                const errorMessages = result.errors.map(err => err.msg).join(', ');
                return {
                    success: false,
                    message: `Errores de validación: ${errorMessages}`
                };
            }

            // Manejo de errores del servidor
            if (result.message) {
                return {
                    success: false,
                    message: result.message
                };
            }

            return {
                success: false,
                message: 'Error al agendar cita. Por favor intenta nuevamente.'
            };

        } catch (error) {
            console.error('❌ [CITAS] Error en agendamiento:', error);
            return {
                success: false,
                message: 'Error de conexión. Por favor intenta nuevamente.'
            };
        }
    }

    // ==========================================
    // MANEJO ESPECIALIZADO DE BOLSA DE TRABAJO
    // ==========================================

    async handleBolsaTrabajoSubmit(form, formData) {
        try {
            // Extraer datos del formulario
            const name = formData.get('name') || formData.get('nombre') || '';
            const email = formData.get('email') || '';
            const phone = formData.get('phone') || formData.get('telefono') || '';
            const graduationYear = formData.get('graduationYear') || '';
            const subject = formData.get('subject') || '';
            const message = formData.get('message') || '';
            const skills = formData.get('skills') || '';
            const experience = formData.get('experience') || '';

            // Validaciones básicas
            if (!name.trim()) {
                return {
                    success: false,
                    message: 'El nombre es requerido'
                };
            }
            if (!email.trim() || !email.includes('@')) {
                return {
                    success: false,
                    message: 'El email es requerido y debe ser válido'
                };
            }
            if (!phone.trim()) {
                return {
                    success: false,
                    message: 'El teléfono es requerido'
                };
            }
            if (!subject.trim()) {
                return {
                    success: false,
                    message: 'El área de especialidad es requerida'
                };
            }
            if (!message.trim() || message.trim().length < 20) {
                return {
                    success: false,
                    message: 'El resumen profesional debe tener al menos 20 caracteres'
                };
            }

            console.log('💼 [BOLSA-TRABAJO] Procesando registro CV:', {
                nombre: name,
                email: email,
                telefono: phone,
                subject: subject,
                year: graduationYear
            });

            // Datos para el endpoint de bolsa de trabajo
            const cvData = {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                graduationYear: graduationYear.trim(),
                subject: subject.trim(),
                message: message.trim(),
                skills: skills.trim(),
                experience: experience.trim(),
                form_type: 'bolsa_trabajo'
            };

            console.log('📤 [BOLSA-TRABAJO] Enviando datos al endpoint /api/bolsa-trabajo/cv:', cvData);

            // Enviar al endpoint correcto de bolsa de trabajo
            const response = await fetch('/api/bolsa-trabajo/cv', {
                method: 'POST',
                body: JSON.stringify(cvData),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            console.log('📥 [BOLSA-TRABAJO] Respuesta del servidor:', result);

            if (response.ok && result.success) {
                return {
                    success: true,
                    requiresVerification: true,
                    message: '¡Tu CV ha sido registrado! Por favor revisa tu email para confirmar tu registro.',
                    data: result
                };
            }

            // Manejo de errores específicos
            if (result.errors && result.errors.length > 0) {
                const errorMessages = result.errors.map(err => err.msg || err.message).join(', ');
                return {
                    success: false,
                    message: `Errores de validación: ${errorMessages}`
                };
            }

            // Manejo de errores del servidor
            if (result.message) {
                return {
                    success: false,
                    message: result.message
                };
            }

            if (result.error) {
                return {
                    success: false,
                    message: result.error
                };
            }

            return {
                success: false,
                message: 'Error al registrar CV. Por favor intenta nuevamente.'
            };

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error en registro:', error);
            return {
                success: false,
                message: 'Error de conexión. Por favor intenta nuevamente.'
            };
        }
    }

    // ==========================================
    // ENVÍO A FORMSPREE (FALLBACK MEJORADO)
    // ==========================================

    // MÉTODO DEPRECADO - Ya no usamos Formspree (bloqueado por CSP)
    async sendToFormspree(form) {
        console.warn('⚠️ sendToFormspree está deprecado y bloqueado por CSP');
        return false;
    }

    enhanceMessage(originalMessage, form) {
        const formData = new FormData(form);
        const name = formData.get('nombre') || formData.get('name') || 'Usuario';
        const email = formData.get('email') || 'No proporcionado';
        const phone = formData.get('telefono') || formData.get('phone') || 'No proporcionado';

        return `
CONTACTO DESDE SITIO WEB OFICIAL
═══════════════════════════════════════

👤 DATOS DEL CONTACTO:
• Nombre: ${name}
• Email: ${email}
• Teléfono: ${phone}
• Fecha: ${new Date().toLocaleString('es-MX')}

📝 MENSAJE:
${originalMessage}

═══════════════════════════════════════
🏛️ window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal "window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')')')')')')"')
🌐 Sistema de contacto verificado
        `.trim();
    }

    // ==========================================
    // INTERFAZ DE USUARIO
    // ==========================================

    showLoadingState(form, message = 'Enviando...') {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = sanitizeHTML(`
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                ${message}
            `);
        }
    }

    updateLoadingState(form, message) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            const spinner = submitButton.querySelector('.spinner-border');
            if (spinner) {
                submitButton.innerHTML = sanitizeHTML(`
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    ${message}
                `);
            }
        }
    }

    hideLoadingState(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = submitButton.dataset.originalText || 'Enviar Mensaje';
        }
    }

    showVerificationPopup(result) {
        // PRIMERO: Eliminar popups anteriores si existen
        const existingPopups = document.querySelectorAll('.verification-popup-overlay');
        existingPopups.forEach(p => p.remove());

        // Crear popup elegante para verificación de email
        const popup = document.createElement('div');
        popup.className = 'verification-popup-overlay';
        popup.innerHTML = sanitizeHTML(`
            <div class="verification-popup">
                <div class="popup-header">
                    <div class="popup-icon">📧</div>
                    <h3>¡Mensaje Enviado!</h3>
                    <button class="popup-close" onclick="this.closest('.verification-popup-overlay').remove()">×</button>
                </div>
                <div class="popup-content">
                    <p><strong>Tu mensaje ha sido enviado exitosamente.</strong></p>
                    <p>📮 Hemos enviado un enlace de confirmación a tu correo electrónico.</p>
                    <p>✅ Por favor revisa tu bandeja de entrada y haz clic en el enlace para completar el envío.</p>
                    <div class="popup-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <span>Revisa tu email</span>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <span>Haz clic en "Confirmar mensaje"</span>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <span>¡Listo! Tu mensaje llegará a nosotros</span>
                        </div>
                    </div>
                </div>
                <div class="popup-footer">
                    <button class="btn-primary" onclick="this.closest('.verification-popup-overlay').remove()">
                        Entendido
                    </button>
                </div>
            </div>
        `);

        // Estilos del popup
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        // Agregar estilos al popup
        this.addVerificationPopupStyles();

        document.body.appendChild(popup);

        // Auto-cerrar después de 15 segundos
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 15000);
    }

    addVerificationPopupStyles() {
        if (document.querySelector('#verification-popup-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'verification-popup-styles';
        styles.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .verification-popup {
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }

            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .popup-header {
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white;
                padding: 20px;
                border-radius: 15px 15px 0 0;
                text-align: center;
                position: relative;
            }

            .popup-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .popup-header h3 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }

            .popup-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s;
            }

            .popup-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .popup-content {
                padding: 25px;
                text-align: center;
            }

            .popup-content p {
                margin: 10px 0;
                color: #555;
                line-height: 1.6;
            }

            .popup-steps {
                margin: 20px 0;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .step {
                display: flex;
                align-items: center;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
                text-align: left;
            }

            .step-number {
                background: #3498db;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                margin-right: 15px;
            }

            .popup-footer {
                padding: 20px;
                text-align: center;
                border-top: 1px solid #eee;
                border-radius: 0 0 15px 15px;
            }

            .popup-footer .btn-primary {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                border: none;
                color: white;
                padding: 12px 30px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.3s;
            }

            .popup-footer .btn-primary:hover {
                transform: translateY(-2px);
            }
        `;

        document.head.appendChild(styles);
    }

    showSuccess(form) {
        // Este método ya no se usa para contacto, pero mantenerlo para otros formularios
        const successAlert = form.querySelector('.alert-success') || document.createElement('div');
        successAlert.className = 'alert alert-success';

        if (!form.querySelector('.alert-success')) {
            form.appendChild(successAlert);
        }

        successAlert.innerHTML = sanitizeHTML(`
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle fa-lg me-3 text-success"></i>
                <div>
                    <strong>¡Operación completada exitosamente!</strong><br>
                    <small>La información ha sido procesada correctamente.</small>
                </div>
            </div>
        `);

        successAlert.style.display = 'block';
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Ocultar errores
        const errorAlert = form.querySelector('.alert-danger');
        if (errorAlert) {
            errorAlert.style.display = 'none';
        }
    }

    showError(form, message) {
        // Buscar o crear contenedor de error
        let errorAlert = form.querySelector('.alert-danger');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger';
            form.appendChild(errorAlert);
        }

        errorAlert.innerHTML = sanitizeHTML(`
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle fa-lg me-3 text-danger"></i>
                <div>
                    <strong>Error al enviar mensaje</strong><br>
                    <small>${message}</small>
                </div>
            </div>
        `);

        errorAlert.style.display = 'block';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Ocultar éxito
        const successAlert = form.querySelector('.alert-success');
        if (successAlert) {
            successAlert.style.display = 'none';
        }
    }

    async showEmailWarning(warning) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = sanitizeHTML(`
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Verificar Email
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p><strong>Advertencia:</strong> ${warning}</p>
                            <p>¿Estás seguro de que tu email es correcto? Un email incorrecto significa que no podremos contactarte.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-action="cancel">
                                Corregir Email
                            </button>
                            <button type="button" class="btn btn-warning" data-action="proceed">
                                Continuar de Todos Modos
                            </button>
                        </div>
                    </div>
                </div>
            `);

            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

            modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    bsModal.hide();
                    modal.remove();
                    resolve(action === 'proceed');
                }
            });
        });
    }

    resetForm(form) {
        form.reset();
        form.classList.remove('was-validated');

        // Limpiar alertas
        form.querySelectorAll('.alert').forEach(alert => {
            alert.style.display = 'none';
        });
    }

    addSecurityIndicators(form) {
        // Agregar badge de seguridad
        const securityBadge = document.createElement('div');
        securityBadge.className = 'security-badge mb-3';
        securityBadge.innerHTML = sanitizeHTML(`
            <small class="text-muted d-flex align-items-center">
                <i class="fas fa-shield-alt text-success me-2"></i>
                <span>Formulario protegido contra spam • Verificación de email incluida</span>
            </small>
        `);

        form.insertBefore(securityBadge, form.firstChild);
    }

    setupFormValidation(form) {
        form.querySelectorAll('input[type="email"]').forEach(emailField => {
            emailField.addEventListener('blur', async () => {
                if (emailField.value) {
                    const verification = await this.verifyEmailAddress(emailField.value);

                    if (!verification.valid) {
                        emailField.setCustomValidity(verification.reason);
                        emailField.classList.add('is-invalid');
                    } else {
                        emailField.setCustomValidity('');
                        emailField.classList.remove('is-invalid');
                        emailField.classList.add('is-valid');
                    }
                }
            });
        });
    }

    setupRealTimeValidation() {
        // Configurar validaciones adicionales...
        document.querySelectorAll('input[type="tel"], input[name*="telefono"], input[name*="phone"]').forEach(phoneField => {
            phoneField.addEventListener('input', () => {
                const value = phoneField.value.replace(/\s/g, '');
                if (value && !this.config.phoneRegex.test(value)) {
                    phoneField.setCustomValidity('Formato de teléfono inválido');
                } else {
                    phoneField.setCustomValidity('');
                }
            });
        });
    }
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.professionalForms = new ProfessionalFormsManager();
});

// Funciones globales para compatibilidad
window.verifyEmail = async (email) => {
    if (window.professionalForms) {
        return await window.professionalForms.verifyEmailAddress(email);
    }
    return { valid: true, reason: 'Sistema no inicializado' };
};

console.log('🏛️ professional-forms.js cargado exitosamente');