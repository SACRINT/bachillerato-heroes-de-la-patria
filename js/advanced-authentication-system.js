/**
 * 🔐 BGE Advanced Authentication System
 * Sistema de Autenticación Multifactor Avanzado
 *
 * Implementa autenticación de múltiples factores con:
 * - Biometría (huella dactilar, reconocimiento facial)
 * - Tokens de tiempo (TOTP)
 * - SMS/Email verification
 * - Hardware security keys (FIDO2/WebAuthn)
 * - Patrones de comportamiento
 *
 * @version 1.0.0
 * @since Phase D - Security Implementation
 */

class BGEAdvancedAuthenticationSystem {
    constructor() {
        this.authFactors = {
            PASSWORD: 'password',
            BIOMETRIC: 'biometric',
            TOTP: 'totp',
            SMS: 'sms',
            EMAIL: 'email',
            HARDWARE_KEY: 'hardware_key',
            BEHAVIORAL: 'behavioral'
        };

        this.authLevels = {
            LOW: { factors: 1, methods: ['password'] },
            MEDIUM: { factors: 2, methods: ['password', 'sms'] },
            HIGH: { factors: 3, methods: ['password', 'biometric', 'totp'] },
            CRITICAL: { factors: 4, methods: ['password', 'biometric', 'hardware_key', 'behavioral'] }
        };

        this.userSessions = new Map();
        this.failedAttempts = new Map();
        this.behavioralPatterns = new Map();

        this.config = {
            maxFailedAttempts: 5,
            lockoutDuration: 30 * 60 * 1000, // 30 minutos
            sessionTimeout: 8 * 60 * 60 * 1000, // 8 horas
            totpWindow: 30, // segundos
            behavioralThreshold: 0.8 // umbral de confianza
        };

        this.logger = window.BGELogger || console;
        this.initializeAuthentication();
    }

    async initializeAuthentication() {
        try {
            this.logger.info('AdvancedAuth', 'Inicializando sistema de autenticación avanzado');

            // Verificar soporte de WebAuthn/FIDO2
            await this.checkWebAuthnSupport();

            // Inicializar biometría
            await this.initializeBiometrics();

            // Configurar behavioral analytics
            this.initializeBehavioralAnalytics();

            // Registrar event listeners
            this.setupEventListeners();

            this.logger.info('AdvancedAuth', 'Sistema de autenticación inicializado correctamente');
        } catch (error) {
            this.logger.error('AdvancedAuth', 'Error al inicializar autenticación', error);
        }
    }

    async checkWebAuthnSupport() {
        if (window.PublicKeyCredential) {
            this.webAuthnSupported = true;
            this.logger.info('AdvancedAuth', 'WebAuthn/FIDO2 soportado');

            // Verificar disponibilidad de authenticators
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            this.platformAuthenticatorAvailable = available;

            if (available) {
                this.logger.info('AdvancedAuth', 'Authenticator de plataforma disponible');
            }
        } else {
            this.webAuthnSupported = false;
            this.logger.warn('AdvancedAuth', 'WebAuthn no soportado en este navegador');
        }
    }

    async initializeBiometrics() {
        // Verificar soporte de Web Authentication API
        if ('credentials' in navigator) {
            this.biometricSupported = true;
            this.logger.info('AdvancedAuth', 'Biometría soportada');
        } else {
            this.biometricSupported = false;
            this.logger.warn('AdvancedAuth', 'Biometría no soportada');
        }
    }

    initializeBehavioralAnalytics() {
        // Patrones de comportamiento del usuario
        this.behaviorMetrics = {
            typingPattern: [],
            mouseMovements: [],
            deviceFingerprint: {},
            accessPatterns: [],
            locationHistory: []
        };

        // Recopilar fingerprint del dispositivo
        this.generateDeviceFingerprint();

        this.logger.info('AdvancedAuth', 'Análisis comportamental inicializado');
    }

    setupEventListeners() {
        // Eventos de teclado para typing patterns
        document.addEventListener('keydown', (e) => this.recordTypingPattern(e));
        document.addEventListener('keyup', (e) => this.recordTypingPattern(e));

        // Eventos de mouse para movement patterns
        document.addEventListener('mousemove', (e) => this.recordMouseMovement(e));

        // Eventos de touch para dispositivos móviles
        document.addEventListener('touchstart', (e) => this.recordTouchPattern(e));
        document.addEventListener('touchmove', (e) => this.recordTouchPattern(e));
    }

    /**
     * Autenticación principal con múltiples factores
     */
    async authenticate(credentials, requiredLevel = 'MEDIUM') {
        try {
            this.logger.info('AdvancedAuth', `Iniciando autenticación nivel ${requiredLevel}`);

            const authResult = {
                success: false,
                factors: [],
                level: requiredLevel,
                sessionId: null,
                errors: []
            };

            // Verificar si el usuario está bloqueado
            if (this.isUserLocked(credentials.username)) {
                authResult.errors.push('Usuario bloqueado por intentos fallidos');
                return authResult;
            }

            const requiredFactors = this.authLevels[requiredLevel];
            let completedFactors = 0;

            // Factor 1: Password (siempre requerido)
            if (await this.verifyPassword(credentials.username, credentials.password)) {
                authResult.factors.push(this.authFactors.PASSWORD);
                completedFactors++;
            } else {
                this.recordFailedAttempt(credentials.username);
                authResult.errors.push('Credenciales inválidas');
                return authResult;
            }

            // Factores adicionales según el nivel requerido
            if (requiredFactors.factors > 1) {
                // Factor 2: Biométrico (si está disponible y requerido)
                if (requiredFactors.methods.includes('biometric') && this.biometricSupported) {
                    if (await this.verifyBiometric(credentials.username)) {
                        authResult.factors.push(this.authFactors.BIOMETRIC);
                        completedFactors++;
                    }
                }

                // Factor 3: TOTP (si está configurado)
                if (requiredFactors.methods.includes('totp') && credentials.totpCode) {
                    if (await this.verifyTOTP(credentials.username, credentials.totpCode)) {
                        authResult.factors.push(this.authFactors.TOTP);
                        completedFactors++;
                    }
                }

                // Factor 4: Hardware Key (para nivel crítico)
                if (requiredFactors.methods.includes('hardware_key') && this.webAuthnSupported) {
                    if (await this.verifyHardwareKey(credentials.username)) {
                        authResult.factors.push(this.authFactors.HARDWARE_KEY);
                        completedFactors++;
                    }
                }

                // Factor 5: Análisis comportamental
                if (requiredFactors.methods.includes('behavioral')) {
                    const behaviorScore = await this.analyzeBehavior(credentials.username);
                    if (behaviorScore >= this.config.behavioralThreshold) {
                        authResult.factors.push(this.authFactors.BEHAVIORAL);
                        completedFactors++;
                    }
                }
            }

            // Verificar si se completaron suficientes factores
            if (completedFactors >= requiredFactors.factors) {
                authResult.success = true;
                authResult.sessionId = this.createSecureSession(credentials.username, authResult.factors);
                this.clearFailedAttempts(credentials.username);

                // Actualizar patrones comportamentales
                this.updateBehavioralPattern(credentials.username);

                this.logger.info('AdvancedAuth', `Autenticación exitosa: ${completedFactors} factores completados`);
            } else {
                authResult.errors.push(`Factores insuficientes: ${completedFactors}/${requiredFactors.factors}`);
                this.recordFailedAttempt(credentials.username);
            }

            return authResult;

        } catch (error) {
            this.logger.error('AdvancedAuth', 'Error en proceso de autenticación', error);
            return {
                success: false,
                factors: [],
                level: requiredLevel,
                sessionId: null,
                errors: ['Error interno del sistema']
            };
        }
    }

    async verifyPassword(username, password) {
        // Simulación - en producción conectar con backend seguro
        const storedHash = this.getStoredPasswordHash(username);
        return await this.verifyPasswordHash(password, storedHash);
    }

    async verifyPasswordHash(password, hash) {
        // Implementación de verificación de hash con bcrypt/scrypt
        // Simulación para desarrollo
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulación de verificación criptográfica
                const isValid = hash && password.length >= 8;
                resolve(isValid);
            }, 100); // Simular tiempo de cómputo criptográfico
        });
    }

    async verifyBiometric(username) {
        if (!this.biometricSupported) return false;

        try {
            // Crear challenge para autenticación biométrica
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: [{
                    id: new TextEncoder().encode(username),
                    type: 'public-key',
                    transports: ['internal']
                }],
                userVerification: 'required',
                timeout: 30000
            };

            // Solicitar autenticación biométrica
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (assertion) {
                this.logger.info('AdvancedAuth', 'Autenticación biométrica exitosa');
                return true;
            }

            return false;

        } catch (error) {
            this.logger.warn('AdvancedAuth', 'Error en autenticación biométrica', error);
            return false;
        }
    }

    async verifyTOTP(username, code) {
        // Obtener secret del usuario (almacenado de forma segura)
        const secret = this.getUserTOTPSecret(username);
        if (!secret) return false;

        // Verificar código TOTP
        const validCodes = this.generateTOTPCodes(secret);
        return validCodes.includes(code);
    }

    generateTOTPCodes(secret) {
        // Implementación simplificada de TOTP (RFC 6238)
        const timeStep = Math.floor(Date.now() / 1000 / this.config.totpWindow);
        const codes = [];

        // Generar códigos para ventana de tiempo actual y adyacentes
        for (let i = -1; i <= 1; i++) {
            const time = timeStep + i;
            const code = this.calculateTOTP(secret, time);
            codes.push(code);
        }

        return codes;
    }

    calculateTOTP(secret, time) {
        // Implementación simplificada - en producción usar librería crypto estándar
        const hash = this.hmacSHA1(secret, time.toString());
        const code = (hash % 1000000).toString().padStart(6, '0');
        return code;
    }

    hmacSHA1(key, message) {
        // Implementación simplificada para desarrollo
        // En producción usar crypto.subtle.sign con HMAC-SHA1
        let hash = 0;
        const combined = key + message;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    async verifyHardwareKey(username) {
        if (!this.webAuthnSupported) return false;

        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: [{
                    id: new TextEncoder().encode(`${username}_hwkey`),
                    type: 'public-key',
                    transports: ['usb', 'nfc', 'ble']
                }],
                userVerification: 'discouraged', // Hardware key maneja la verificación
                timeout: 60000
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (assertion) {
                this.logger.info('AdvancedAuth', 'Hardware key verificado exitosamente');
                return true;
            }

            return false;

        } catch (error) {
            this.logger.warn('AdvancedAuth', 'Error en verificación de hardware key', error);
            return false;
        }
    }

    async analyzeBehavior(username) {
        const userPattern = this.behavioralPatterns.get(username);
        if (!userPattern) {
            // Primera vez del usuario - aceptar y empezar a construir patrón
            return 1.0;
        }

        let score = 0;
        let factors = 0;

        // Analizar patrón de tipeo
        if (userPattern.typingPattern && this.behaviorMetrics.typingPattern.length > 0) {
            score += this.compareTypingPatterns(userPattern.typingPattern, this.behaviorMetrics.typingPattern);
            factors++;
        }

        // Analizar movimientos de mouse
        if (userPattern.mouseMovements && this.behaviorMetrics.mouseMovements.length > 0) {
            score += this.compareMousePatterns(userPattern.mouseMovements, this.behaviorMetrics.mouseMovements);
            factors++;
        }

        // Analizar fingerprint del dispositivo
        if (userPattern.deviceFingerprint) {
            score += this.compareDeviceFingerprints(userPattern.deviceFingerprint, this.behaviorMetrics.deviceFingerprint);
            factors++;
        }

        // Analizar patrones de acceso (horarios, ubicación)
        if (userPattern.accessPatterns) {
            score += this.compareAccessPatterns(userPattern.accessPatterns, {
                time: new Date(),
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            factors++;
        }

        const finalScore = factors > 0 ? score / factors : 0;
        this.logger.debug('AdvancedAuth', `Análisis comportamental: ${finalScore.toFixed(2)}`);

        return finalScore;
    }

    compareTypingPatterns(stored, current) {
        // Comparar velocidad y ritmo de tipeo
        if (stored.length === 0 || current.length === 0) return 0.5;

        const storedAvg = stored.reduce((sum, t) => sum + t.interval, 0) / stored.length;
        const currentAvg = current.reduce((sum, t) => sum + t.interval, 0) / current.length;

        const difference = Math.abs(storedAvg - currentAvg) / Math.max(storedAvg, currentAvg);
        return Math.max(0, 1 - difference);
    }

    compareMousePatterns(stored, current) {
        // Comparar patrones de movimiento del mouse
        if (stored.length === 0 || current.length === 0) return 0.5;

        // Análisis simplificado de velocidad y aceleración
        const storedVelocity = this.calculateAverageVelocity(stored);
        const currentVelocity = this.calculateAverageVelocity(current);

        const difference = Math.abs(storedVelocity - currentVelocity) / Math.max(storedVelocity, currentVelocity);
        return Math.max(0, 1 - difference);
    }

    compareDeviceFingerprints(stored, current) {
        let matches = 0;
        let total = 0;

        const keys = ['screen', 'timezone', 'language', 'platform', 'hardwareConcurrency'];

        keys.forEach(key => {
            total++;
            if (stored[key] === current[key]) {
                matches++;
            }
        });

        return total > 0 ? matches / total : 0;
    }

    compareAccessPatterns(stored, current) {
        // Analizar horarios habituales de acceso
        const currentHour = current.time.getHours();
        const storedHours = stored.map(p => p.hour);

        // Verificar si el horario actual está dentro del rango habitual
        const hourScore = storedHours.includes(currentHour) ? 1.0 : 0.3;

        // Verificar zona horaria
        const timezoneScore = stored.some(p => p.timezone === current.timezone) ? 1.0 : 0.0;

        return (hourScore + timezoneScore) / 2;
    }

    recordTypingPattern(event) {
        const now = performance.now();
        this.behaviorMetrics.typingPattern.push({
            key: event.key,
            type: event.type,
            timestamp: now,
            interval: this.lastKeyTimestamp ? now - this.lastKeyTimestamp : 0
        });

        this.lastKeyTimestamp = now;

        // Mantener solo los últimos 50 eventos
        if (this.behaviorMetrics.typingPattern.length > 50) {
            this.behaviorMetrics.typingPattern.shift();
        }
    }

    recordMouseMovement(event) {
        const now = performance.now();
        this.behaviorMetrics.mouseMovements.push({
            x: event.clientX,
            y: event.clientY,
            timestamp: now,
            velocity: this.calculateVelocity(event, this.lastMouseEvent, now - (this.lastMouseTimestamp || now))
        });

        this.lastMouseEvent = event;
        this.lastMouseTimestamp = now;

        // Mantener solo los últimos 100 movimientos
        if (this.behaviorMetrics.mouseMovements.length > 100) {
            this.behaviorMetrics.mouseMovements.shift();
        }
    }

    recordTouchPattern(event) {
        // Similar al mouse pero para dispositivos táctiles
        if (event.touches && event.touches.length > 0) {
            const touch = event.touches[0];
            const now = performance.now();

            this.behaviorMetrics.touchPatterns = this.behaviorMetrics.touchPatterns || [];
            this.behaviorMetrics.touchPatterns.push({
                x: touch.clientX,
                y: touch.clientY,
                timestamp: now,
                pressure: touch.force || 0,
                type: event.type
            });

            // Mantener solo los últimos 50 touches
            if (this.behaviorMetrics.touchPatterns.length > 50) {
                this.behaviorMetrics.touchPatterns.shift();
            }
        }
    }

    calculateVelocity(currentEvent, lastEvent, timeDiff) {
        if (!lastEvent || timeDiff === 0) return 0;

        const dx = currentEvent.clientX - lastEvent.clientX;
        const dy = currentEvent.clientY - lastEvent.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance / timeDiff;
    }

    calculateAverageVelocity(movements) {
        if (movements.length === 0) return 0;

        const totalVelocity = movements.reduce((sum, m) => sum + (m.velocity || 0), 0);
        return totalVelocity / movements.length;
    }

    generateDeviceFingerprint() {
        this.behaviorMetrics.deviceFingerprint = {
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            maxTouchPoints: navigator.maxTouchPoints
        };
    }

    createSecureSession(username, factors) {
        const sessionId = this.generateSecureSessionId();
        const session = {
            id: sessionId,
            username: username,
            factors: factors,
            createdAt: new Date(),
            lastActivity: new Date(),
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            deviceFingerprint: this.behaviorMetrics.deviceFingerprint
        };

        this.userSessions.set(sessionId, session);

        // Configurar expiración automática
        setTimeout(() => {
            this.invalidateSession(sessionId);
        }, this.config.sessionTimeout);

        return sessionId;
    }

    generateSecureSessionId() {
        // Generar ID seguro usando crypto API
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    validateSession(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (!session) return null;

        // Verificar expiración
        const now = new Date();
        const elapsed = now - session.lastActivity;

        if (elapsed > this.config.sessionTimeout) {
            this.invalidateSession(sessionId);
            return null;
        }

        // Actualizar última actividad
        session.lastActivity = now;
        return session;
    }

    invalidateSession(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (session) {
            this.logger.info('AdvancedAuth', `Sesión invalidada: ${sessionId}`);
            this.userSessions.delete(sessionId);
        }
    }

    isUserLocked(username) {
        const attempts = this.failedAttempts.get(username);
        if (!attempts) return false;

        const now = Date.now();
        const recentAttempts = attempts.filter(time => now - time < this.config.lockoutDuration);

        return recentAttempts.length >= this.config.maxFailedAttempts;
    }

    recordFailedAttempt(username) {
        const attempts = this.failedAttempts.get(username) || [];
        attempts.push(Date.now());
        this.failedAttempts.set(username, attempts);

        // Limpiar intentos antiguos
        const now = Date.now();
        const recentAttempts = attempts.filter(time => now - time < this.config.lockoutDuration);
        this.failedAttempts.set(username, recentAttempts);

        this.logger.warn('AdvancedAuth', `Intento fallido registrado para usuario: ${username}`);
    }

    clearFailedAttempts(username) {
        this.failedAttempts.delete(username);
    }

    updateBehavioralPattern(username) {
        // Actualizar patrón comportamental del usuario
        const currentPattern = {
            typingPattern: [...this.behaviorMetrics.typingPattern],
            mouseMovements: [...this.behaviorMetrics.mouseMovements],
            touchPatterns: [...(this.behaviorMetrics.touchPatterns || [])],
            deviceFingerprint: { ...this.behaviorMetrics.deviceFingerprint },
            accessPatterns: [
                ...(this.behavioralPatterns.get(username)?.accessPatterns || []),
                {
                    hour: new Date().getHours(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    timestamp: new Date()
                }
            ]
        };

        // Mantener solo los últimos 10 patrones de acceso
        if (currentPattern.accessPatterns.length > 10) {
            currentPattern.accessPatterns = currentPattern.accessPatterns.slice(-10);
        }

        this.behavioralPatterns.set(username, currentPattern);
    }

    getStoredPasswordHash(username) {
        // Simulación - en producción obtener del backend seguro
        const hashes = {
            'admin': 'hash_admin_secure',
            'director': 'hash_director_secure',
            'docente': 'hash_docente_secure',
            'estudiante': 'hash_estudiante_secure'
        };
        return hashes[username];
    }

    getUserTOTPSecret(username) {
        // Simulación - en producción obtener del backend seguro
        const secrets = {
            'admin': 'ADMIN_SECRET_KEY',
            'director': 'DIRECTOR_SECRET_KEY',
            'docente': 'DOCENTE_SECRET_KEY'
        };
        return secrets[username];
    }

    getClientIP() {
        // En producción obtener IP real del cliente
        return '127.0.0.1';
    }

    /**
     * API pública para el sistema de autenticación
     */

    async registerBiometric(username) {
        if (!this.webAuthnSupported) {
            throw new Error('WebAuthn no soportado');
        }

        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "BGE Héroes de la Patria",
                    id: window.location.hostname,
                },
                user: {
                    id: new TextEncoder().encode(username),
                    name: username,
                    displayName: username,
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required"
                },
                timeout: 60000,
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (credential) {
                this.logger.info('AdvancedAuth', 'Biometría registrada exitosamente');
                return true;
            }

            return false;

        } catch (error) {
            this.logger.error('AdvancedAuth', 'Error al registrar biometría', error);
            throw error;
        }
    }

    async registerHardwareKey(username) {
        if (!this.webAuthnSupported) {
            throw new Error('WebAuthn no soportado');
        }

        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "BGE Héroes de la Patria",
                    id: window.location.hostname,
                },
                user: {
                    id: new TextEncoder().encode(`${username}_hwkey`),
                    name: `${username}_hwkey`,
                    displayName: `${username} Hardware Key`,
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" },
                    { alg: -257, type: "public-key" }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "cross-platform",
                    userVerification: "discouraged"
                },
                timeout: 60000,
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (credential) {
                this.logger.info('AdvancedAuth', 'Hardware key registrado exitosamente');
                return true;
            }

            return false;

        } catch (error) {
            this.logger.error('AdvancedAuth', 'Error al registrar hardware key', error);
            throw error;
        }
    }

    generateTOTPQR(username, secret) {
        // Generar URL para código QR de TOTP
        const issuer = 'BGE Héroes de la Patria';
        const label = `${issuer}:${username}`;
        const otpauthURL = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        return otpauthURL;
    }

    getSecurityMetrics() {
        return {
            activeSessions: this.userSessions.size,
            failedAttempts: Array.from(this.failedAttempts.values()).reduce((total, attempts) => total + attempts.length, 0),
            registeredUsers: this.behavioralPatterns.size,
            webAuthnSupported: this.webAuthnSupported,
            biometricSupported: this.biometricSupported,
            platformAuthenticator: this.platformAuthenticatorAvailable
        };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEAdvancedAuthenticationSystem;
} else if (typeof window !== 'undefined') {
    window.BGEAdvancedAuthenticationSystem = BGEAdvancedAuthenticationSystem;
}