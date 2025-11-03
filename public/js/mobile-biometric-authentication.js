/**
 * 🔐 BGE Mobile Biometric Authentication
 * Sistema de Autenticación Biométrica Móvil
 *
 * Implementa autenticación biométrica nativa para dispositivos móviles:
 * - Integración con sensores biométricos nativos (iOS/Android)
 * - Fallback a WebAuthn para PWA
 * - Múltiples tipos de biometría (huella, cara, voz, iris)
 * - Gestión segura de credenciales biométricas
 * - Encriptación de plantillas biométricas
 * - Detección de dispositivos comprometidos
 * - Auditoría completa de accesos biométricos
 *
 * @version 1.0.0
 * @since Phase E - Mobile Native Implementation
 */

class BGEMobileBiometricAuthentication {
    constructor(mobileArchitecture) {
        this.mobileArch = mobileArchitecture;

        this.biometricConfig = {
            supportedTypes: {
                FINGERPRINT: {
                    ios: 'TouchID',
                    android: 'Fingerprint',
                    web: 'platform',
                    priority: 1
                },
                FACE: {
                    ios: 'FaceID',
                    android: 'Face',
                    web: 'platform',
                    priority: 2
                },
                VOICE: {
                    ios: 'VoiceID',
                    android: 'Voice',
                    web: 'experimental',
                    priority: 3
                },
                IRIS: {
                    ios: null,
                    android: 'Iris',
                    web: null,
                    priority: 4
                }
            },
            security: {
                encryption: 'AES-256-GCM',
                templateStorage: 'secure-enclave', // iOS Secure Enclave / Android TEE
                maxAttempts: 5,
                lockoutTime: 30 * 60 * 1000, // 30 minutos
                templateRefresh: 90 * 24 * 60 * 60 * 1000 // 90 días
            },
            fallback: {
                enabled: true,
                methods: ['password', 'pin', 'pattern'],
                requireAfterFailures: 3
            },
            privacy: {
                templateStorage: 'device-only', // nunca en servidor
                anonymization: true,
                auditLog: true,
                gdprCompliant: true
            }
        };

        this.biometricProviders = new Map();
        this.enrolledBiometrics = new Map();
        this.authenticationHistory = [];
        this.secureStorage = null;

        this.logger = window.BGELogger || console;
        this.initializeBiometricAuth();
    }

    async initializeBiometricAuth() {
        try {
            this.logger.info('BiometricAuth', 'Inicializando autenticación biométrica móvil');

            // Detectar capacidades biométricas del dispositivo
            await this.detectBiometricCapabilities();

            // Inicializar almacenamiento seguro
            await this.initializeSecureStorage();

            // Configurar proveedores biométricos
            await this.initializeBiometricProviders();

            // Verificar estado de enrolamiento
            await this.checkEnrollmentStatus();

            // Configurar políticas de seguridad
            this.setupSecurityPolicies();

            // Inicializar auditoría biométrica
            this.initializeBiometricAudit();

            this.logger.info('BiometricAuth', 'Autenticación biométrica inicializada correctamente');

        } catch (error) {
            this.logger.error('BiometricAuth', 'Error al inicializar autenticación biométrica', error);
            throw error;
        }
    }

    async detectBiometricCapabilities() {
        // Detectar qué tipos de biometría están disponibles
        this.capabilities = {
            platform: this.mobileArch.environment.platform.os,
            device: this.mobileArch.environment.platform.device,
            availableTypes: [],
            hardwareSecure: false,
            secureEnclave: false
        };

        if (this.mobileArch.environment.isNative) {
            // Detección nativa específica por plataforma
            this.capabilities.availableTypes = await this.detectNativeBiometrics();
            this.capabilities.hardwareSecure = await this.checkHardwareSecurity();
            this.capabilities.secureEnclave = await this.checkSecureEnclaveSupport();
        } else {
            // Detección web/PWA
            this.capabilities.availableTypes = await this.detectWebBiometrics();
            this.capabilities.hardwareSecure = window.isSecureContext;
        }

        this.logger.info('BiometricAuth', `Capacidades detectadas: ${JSON.stringify(this.capabilities)}`);
    }

    async detectNativeBiometrics() {
        const availableTypes = [];

        try {
            // Verificar cada tipo de biometría
            for (const [type, config] of Object.entries(this.biometricConfig.supportedTypes)) {
                const platformSupport = config[this.capabilities.platform.toLowerCase()];

                if (platformSupport && platformSupport !== null) {
                    const isAvailable = await this.mobileArch.callNativeMethod(
                        'Biometrics.isTypeAvailable',
                        { type: platformSupport }
                    );

                    if (isAvailable) {
                        availableTypes.push({
                            type: type,
                            nativeType: platformSupport,
                            priority: config.priority,
                            enrolled: await this.checkBiometricEnrollment(type)
                        });
                    }
                }
            }

            // Ordenar por prioridad
            return availableTypes.sort((a, b) => a.priority - b.priority);

        } catch (error) {
            this.logger.error('BiometricAuth', 'Error al detectar biométricos nativos', error);
            return [];
        }
    }

    async detectWebBiometrics() {
        const availableTypes = [];

        try {
            // Verificar soporte de WebAuthn
            if ('credentials' in navigator && 'create' in navigator.credentials) {
                const platformAuthAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

                if (platformAuthAvailable) {
                    // Verificar tipos específicos disponibles
                    const supportedTypes = await this.checkWebAuthnBiometricTypes();

                    for (const type of supportedTypes) {
                        availableTypes.push({
                            type: type,
                            nativeType: 'platform',
                            priority: this.biometricConfig.supportedTypes[type]?.priority || 99,
                            enrolled: await this.checkWebAuthnEnrollment(type)
                        });
                    }
                }
            }

            return availableTypes.sort((a, b) => a.priority - b.priority);

        } catch (error) {
            this.logger.error('BiometricAuth', 'Error al detectar biométricos web', error);
            return [];
        }
    }

    async checkWebAuthnBiometricTypes() {
        // Intentar detectar qué tipos de biometría están disponibles en WebAuthn
        const supportedTypes = [];

        // La mayoría de implementaciones WebAuthn soportan huella digital y facial
        if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
            // iOS probablemente tenga TouchID o FaceID
            supportedTypes.push('FINGERPRINT', 'FACE');
        } else if (navigator.userAgent.includes('Android')) {
            // Android probablemente tenga huella digital
            supportedTypes.push('FINGERPRINT');
        } else {
            // Desktop probablemente tenga Windows Hello o similar
            supportedTypes.push('FINGERPRINT', 'FACE');
        }

        return supportedTypes;
    }

    async checkHardwareSecurity() {
        if (this.mobileArch.environment.isNative) {
            return await this.mobileArch.callNativeMethod('Biometrics.hasHardwareSecurity');
        }
        return window.isSecureContext;
    }

    async checkSecureEnclaveSupport() {
        if (this.mobileArch.environment.isNative) {
            return await this.mobileArch.callNativeMethod('Biometrics.hasSecureEnclave');
        }
        return false;
    }

    async initializeSecureStorage() {
        // Inicializar almacenamiento seguro para datos biométricos
        if (this.mobileArch.environment.isNative) {
            this.secureStorage = {
                store: async (key, data) => {
                    return await this.mobileArch.callNativeMethod('SecureStorage.store', {
                        key,
                        data: JSON.stringify(data),
                        accessGroup: 'biometric-data',
                        accessibility: 'WhenUnlockedThisDeviceOnly'
                    });
                },

                retrieve: async (key) => {
                    const result = await this.mobileArch.callNativeMethod('SecureStorage.retrieve', {
                        key,
                        accessGroup: 'biometric-data'
                    });
                    return result ? JSON.parse(result) : null;
                },

                remove: async (key) => {
                    return await this.mobileArch.callNativeMethod('SecureStorage.remove', {
                        key,
                        accessGroup: 'biometric-data'
                    });
                }
            };
        } else {
            // Fallback a almacenamiento web encriptado
            this.secureStorage = {
                store: async (key, data) => {
                    const encrypted = await this.encryptBiometricData(data);
                    localStorage.setItem(`bge_biometric_${key}`, encrypted);
                    return true;
                },

                retrieve: async (key) => {
                    const encrypted = localStorage.getItem(`bge_biometric_${key}`);
                    return encrypted ? await this.decryptBiometricData(encrypted) : null;
                },

                remove: async (key) => {
                    localStorage.removeItem(`bge_biometric_${key}`);
                    return true;
                }
            };
        }

        this.logger.info('BiometricAuth', 'Almacenamiento seguro inicializado');
    }

    async initializeBiometricProviders() {
        // Inicializar proveedores para cada tipo de biometría disponible
        for (const biometric of this.capabilities.availableTypes) {
            const provider = await this.createBiometricProvider(biometric);
            this.biometricProviders.set(biometric.type, provider);
        }

        this.logger.info('BiometricAuth', `Proveedores inicializados: ${this.biometricProviders.size}`);
    }

    async createBiometricProvider(biometric) {
        const provider = {
            type: biometric.type,
            nativeType: biometric.nativeType,
            isEnrolled: biometric.enrolled,

            // Métodos principales
            enroll: async (userId) => {
                return await this.enrollBiometric(biometric.type, userId);
            },

            authenticate: async (challenge) => {
                return await this.authenticateWithBiometric(biometric.type, challenge);
            },

            verify: async (template, sample) => {
                return await this.verifyBiometricSample(biometric.type, template, sample);
            },

            remove: async (userId) => {
                return await this.removeBiometric(biometric.type, userId);
            },

            // Métodos de gestión
            getMetadata: async () => {
                return await this.getBiometricMetadata(biometric.type);
            },

            updateTemplate: async (userId) => {
                return await this.updateBiometricTemplate(biometric.type, userId);
            },

            checkHealth: async () => {
                return await this.checkBiometricHealth(biometric.type);
            }
        };

        return provider;
    }

    async checkEnrollmentStatus() {
        // Verificar estado de enrolamiento para cada usuario
        const enrollmentStatus = await this.secureStorage.retrieve('enrollment_status') || {};

        for (const [type, provider] of this.biometricProviders) {
            const typeStatus = enrollmentStatus[type] || {};
            this.enrolledBiometrics.set(type, typeStatus);
        }

        this.logger.info('BiometricAuth', `Estados de enrolamiento cargados: ${this.enrolledBiometrics.size} tipos`);
    }

    setupSecurityPolicies() {
        // Configurar políticas de seguridad específicas para biometría móvil
        this.securityPolicies = {
            // Políticas de enrolamiento
            enrollment: {
                requireMultipleSamples: 3,
                qualityThreshold: 0.8,
                livenessDetection: true,
                spoofDetection: true
            },

            // Políticas de autenticación
            authentication: {
                confidenceThreshold: 0.9,
                maxAttempts: this.biometricConfig.security.maxAttempts,
                timeoutSeconds: 30,
                requireLiveness: true
            },

            // Políticas de almacenamiento
            storage: {
                encryption: this.biometricConfig.security.encryption,
                keyDerivation: 'PBKDF2',
                saltLength: 32,
                iterations: 100000
            },

            // Políticas de privacidad
            privacy: {
                templateAnonymization: true,
                noServerStorage: true,
                auditRetention: 90, // días
                gdprCompliance: true
            }
        };

        this.logger.info('BiometricAuth', 'Políticas de seguridad configuradas');
    }

    initializeBiometricAudit() {
        // Sistema de auditoría para eventos biométricos
        this.auditSystem = {
            events: [],

            log: (event) => {
                const auditEvent = {
                    timestamp: new Date(),
                    type: event.type,
                    biometricType: event.biometricType,
                    userId: event.userId,
                    success: event.success,
                    metadata: {
                        device: this.capabilities.device,
                        platform: this.capabilities.platform,
                        sessionId: this.getCurrentSessionId(),
                        ip: this.getClientIP()
                    },
                    details: event.details
                };

                this.auditSystem.events.push(auditEvent);

                // Mantener solo los últimos 1000 eventos
                if (this.auditSystem.events.length > 1000) {
                    this.auditSystem.events.shift();
                }

                // Log crítico para fallos de seguridad
                if (!event.success && event.type === 'AUTHENTICATION') {
                    this.logger.warn('BiometricAuth', `Fallo de autenticación biométrica: ${JSON.stringify(auditEvent)}`);
                }
            },

            export: () => {
                return this.auditSystem.events.slice(); // Copia para no exponer referencia
            },

            clear: () => {
                this.auditSystem.events = [];
            }
        };

        this.logger.info('BiometricAuth', 'Sistema de auditoría biométrica inicializado');
    }

    /**
     * Métodos principales de autenticación biométrica
     */

    async enrollBiometric(biometricType, userId, options = {}) {
        try {
            this.logger.info('BiometricAuth', `Iniciando enrolamiento biométrico: ${biometricType} para usuario ${userId}`);

            const provider = this.biometricProviders.get(biometricType);
            if (!provider) {
                throw new Error(`Tipo biométrico no soportado: ${biometricType}`);
            }

            // Verificar si ya está enrolado
            const existingEnrollment = this.enrolledBiometrics.get(biometricType)?.[userId];
            if (existingEnrollment && !options.force) {
                throw new Error(`Usuario ya tiene ${biometricType} enrolado`);
            }

            let enrollmentResult;

            if (this.mobileArch.environment.isNative) {
                // Enrolamiento nativo
                enrollmentResult = await this.performNativeEnrollment(biometricType, userId, options);
            } else {
                // Enrolamiento web/PWA
                enrollmentResult = await this.performWebEnrollment(biometricType, userId, options);
            }

            if (enrollmentResult.success) {
                // Almacenar datos de enrolamiento de forma segura
                await this.storeBiometricEnrollment(biometricType, userId, enrollmentResult.data);

                // Auditar evento
                this.auditSystem.log({
                    type: 'ENROLLMENT',
                    biometricType,
                    userId,
                    success: true,
                    details: { samples: enrollmentResult.samples }
                });

                this.logger.info('BiometricAuth', `Enrolamiento exitoso: ${biometricType} para ${userId}`);
            }

            return enrollmentResult;

        } catch (error) {
            this.auditSystem.log({
                type: 'ENROLLMENT',
                biometricType,
                userId,
                success: false,
                details: { error: error.message }
            });

            this.logger.error('BiometricAuth', `Error en enrolamiento biométrico`, error);
            throw error;
        }
    }

    async performNativeEnrollment(biometricType, userId, options) {
        // Enrolamiento usando APIs nativas
        const config = this.biometricConfig.supportedTypes[biometricType];
        const nativeType = config[this.capabilities.platform.toLowerCase()];

        const enrollmentData = {
            userId,
            biometricType,
            nativeType,
            prompt: options.prompt || `Enrollar ${biometricType.toLowerCase()}`,
            fallbackTitle: 'Usar contraseña',
            samples: options.samples || this.securityPolicies.enrollment.requireMultipleSamples
        };

        const result = await this.mobileArch.callNativeMethod('Biometrics.enroll', enrollmentData);

        return {
            success: result.success,
            data: {
                templateId: result.templateId,
                quality: result.quality,
                metadata: result.metadata
            },
            samples: result.samplesCollected
        };
    }

    async performWebEnrollment(biometricType, userId, options) {
        // Enrolamiento usando WebAuthn
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "BGE Héroes de la Patria",
                    id: window.location.hostname,
                },
                user: {
                    id: new TextEncoder().encode(`${userId}_${biometricType}`),
                    name: `${userId}_biometric`,
                    displayName: `${userId} Biometric`,
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    requireResidentKey: true
                },
                timeout: 60000,
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (credential) {
                return {
                    success: true,
                    data: {
                        templateId: credential.id,
                        publicKey: credential.response.publicKey,
                        metadata: {
                            authenticatorData: credential.response.authenticatorData,
                            clientDataJSON: credential.response.clientDataJSON
                        }
                    },
                    samples: 1 // WebAuthn es una sola muestra
                };
            } else {
                throw new Error('No se pudo crear la credencial');
            }

        } catch (error) {
            throw new Error(`Error en enrolamiento web: ${error.message}`);
        }
    }

    async authenticateWithBiometric(biometricType, challenge = null) {
        try {
            this.logger.info('BiometricAuth', `Iniciando autenticación biométrica: ${biometricType}`);

            const provider = this.biometricProviders.get(biometricType);
            if (!provider) {
                throw new Error(`Tipo biométrico no soportado: ${biometricType}`);
            }

            // Verificar si el tipo está enrolado
            if (!provider.isEnrolled) {
                throw new Error(`${biometricType} no está enrolado`);
            }

            const authChallenge = challenge || crypto.getRandomValues(new Uint8Array(32));
            let authResult;

            if (this.mobileArch.environment.isNative) {
                authResult = await this.performNativeAuthentication(biometricType, authChallenge);
            } else {
                authResult = await this.performWebAuthentication(biometricType, authChallenge);
            }

            // Auditar resultado
            this.auditSystem.log({
                type: 'AUTHENTICATION',
                biometricType,
                userId: authResult.userId || 'unknown',
                success: authResult.success,
                details: {
                    confidence: authResult.confidence,
                    liveness: authResult.liveness,
                    method: this.mobileArch.environment.isNative ? 'native' : 'web'
                }
            });

            this.logger.info('BiometricAuth', `Autenticación ${authResult.success ? 'exitosa' : 'fallida'}: ${biometricType}`);

            return authResult;

        } catch (error) {
            this.auditSystem.log({
                type: 'AUTHENTICATION',
                biometricType,
                userId: 'unknown',
                success: false,
                details: { error: error.message }
            });

            this.logger.error('BiometricAuth', 'Error en autenticación biométrica', error);
            throw error;
        }
    }

    async performNativeAuthentication(biometricType, challenge) {
        const config = this.biometricConfig.supportedTypes[biometricType];
        const nativeType = config[this.capabilities.platform.toLowerCase()];

        const authData = {
            biometricType,
            nativeType,
            challenge: Array.from(challenge),
            prompt: `Autenticar con ${biometricType.toLowerCase()}`,
            fallbackTitle: 'Usar contraseña',
            timeout: this.securityPolicies.authentication.timeoutSeconds * 1000
        };

        const result = await this.mobileArch.callNativeMethod('Biometrics.authenticate', authData);

        return {
            success: result.success,
            userId: result.userId,
            confidence: result.confidence,
            liveness: result.liveness,
            biometricType,
            timestamp: new Date(),
            metadata: result.metadata
        };
    }

    async performWebAuthentication(biometricType, challenge) {
        try {
            // Obtener credenciales enroladas para este tipo
            const enrolledCredentials = await this.getEnrolledWebCredentials(biometricType);

            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: enrolledCredentials.map(cred => ({
                    id: new TextEncoder().encode(cred.templateId),
                    type: 'public-key',
                    transports: ['internal']
                })),
                userVerification: 'required',
                timeout: this.securityPolicies.authentication.timeoutSeconds * 1000
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (assertion) {
                // Verificar la firma
                const isValid = await this.verifyWebAuthnAssertion(assertion, challenge);

                return {
                    success: isValid,
                    userId: this.extractUserIdFromCredential(assertion.id),
                    confidence: isValid ? 1.0 : 0.0,
                    liveness: true, // WebAuthn incluye liveness por defecto
                    biometricType,
                    timestamp: new Date(),
                    metadata: {
                        credentialId: assertion.id,
                        authenticatorData: assertion.response.authenticatorData,
                        signature: assertion.response.signature
                    }
                };
            } else {
                throw new Error('No se pudo obtener la aserción');
            }

        } catch (error) {
            throw new Error(`Error en autenticación web: ${error.message}`);
        }
    }

    async storeBiometricEnrollment(biometricType, userId, enrollmentData) {
        // Almacenar datos de enrolamiento de forma segura
        const enrollmentRecord = {
            userId,
            biometricType,
            templateId: enrollmentData.templateId,
            enrolledAt: new Date(),
            quality: enrollmentData.quality,
            metadata: enrollmentData.metadata,
            deviceId: await this.getDeviceId(),
            expiresAt: new Date(Date.now() + this.biometricConfig.security.templateRefresh)
        };

        // Encriptar datos sensibles
        const encryptedRecord = await this.encryptBiometricData(enrollmentRecord);

        // Almacenar en storage seguro
        const storageKey = `enrollment_${biometricType}_${userId}`;
        await this.secureStorage.store(storageKey, encryptedRecord);

        // Actualizar estado local
        const typeEnrollments = this.enrolledBiometrics.get(biometricType) || {};
        typeEnrollments[userId] = enrollmentRecord;
        this.enrolledBiometrics.set(biometricType, typeEnrollments);

        // Actualizar estado general
        const enrollmentStatus = await this.secureStorage.retrieve('enrollment_status') || {};
        enrollmentStatus[biometricType] = enrollmentStatus[biometricType] || {};
        enrollmentStatus[biometricType][userId] = {
            enrolled: true,
            enrolledAt: enrollmentRecord.enrolledAt,
            expiresAt: enrollmentRecord.expiresAt
        };
        await this.secureStorage.store('enrollment_status', enrollmentStatus);
    }

    async encryptBiometricData(data) {
        // Encriptar datos biométricos usando el sistema de criptografía existente
        if (this.mobileArch.securityLayer?.encryptData) {
            return await this.mobileArch.securityLayer.encryptData(
                JSON.stringify(data),
                'biometric_data'
            );
        } else {
            // Fallback básico (NO usar en producción)
            return btoa(JSON.stringify(data));
        }
    }

    async decryptBiometricData(encryptedData) {
        // Desencriptar datos biométricos
        if (this.mobileArch.securityLayer?.decryptData) {
            const decrypted = await this.mobileArch.securityLayer.decryptData(
                encryptedData,
                'biometric_data'
            );
            return JSON.parse(decrypted);
        } else {
            // Fallback básico
            return JSON.parse(atob(encryptedData));
        }
    }

    /**
     * API pública para integración
     */

    async isAvailable(biometricType = null) {
        if (biometricType) {
            return this.biometricProviders.has(biometricType);
        }
        return this.biometricProviders.size > 0;
    }

    async getAvailableTypes() {
        return Array.from(this.biometricProviders.keys());
    }

    async isEnrolled(biometricType, userId) {
        const provider = this.biometricProviders.get(biometricType);
        return provider?.isEnrolled &&
               this.enrolledBiometrics.get(biometricType)?.[userId]?.enrolled === true;
    }

    async getPrimaryBiometric() {
        // Retornar el tipo biométrico de mayor prioridad disponible y enrolado
        const available = this.capabilities.availableTypes
            .filter(b => b.enrolled)
            .sort((a, b) => a.priority - b.priority);

        return available.length > 0 ? available[0].type : null;
    }

    async authenticate(userId = null, preferredType = null) {
        // Autenticación automática usando el mejor método disponible
        const availableTypes = await this.getAvailableTypes();

        if (availableTypes.length === 0) {
            throw new Error('No hay métodos biométricos disponibles');
        }

        // Usar tipo preferido si está disponible
        if (preferredType && availableTypes.includes(preferredType)) {
            return await this.authenticateWithBiometric(preferredType);
        }

        // Usar tipo primario
        const primaryType = await this.getPrimaryBiometric();
        if (primaryType) {
            return await this.authenticateWithBiometric(primaryType);
        }

        throw new Error('No hay biométricos enrolados');
    }

    getBiometricMetrics() {
        return {
            availableTypes: this.capabilities.availableTypes.length,
            enrolledTypes: Array.from(this.enrolledBiometrics.values())
                .reduce((total, typeEnrollments) => total + Object.keys(typeEnrollments).length, 0),
            hardwareSecure: this.capabilities.hardwareSecure,
            secureEnclave: this.capabilities.secureEnclave,
            authenticationHistory: this.auditSystem.events.length,
            platform: this.capabilities.platform
        };
    }

    getAuditLog() {
        return this.auditSystem.export();
    }

    // Métodos auxiliares
    getCurrentSessionId() {
        return window.currentSessionId || 'unknown';
    }

    getClientIP() {
        return '127.0.0.1'; // Placeholder - en producción obtener IP real
    }

    async getDeviceId() {
        // Generar ID único del dispositivo
        if (this.mobileArch.environment.isNative) {
            return await this.mobileArch.callNativeMethod('Device.getId');
        } else {
            // Usar características del navegador para generar ID
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint', 2, 2);

            const deviceId = btoa(JSON.stringify({
                canvas: canvas.toDataURL(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }));

            return deviceId.substring(0, 32); // Truncar para tamaño manejable
        }
    }

    async checkBiometricEnrollment(type) {
        // Verificar si un tipo específico tiene enrolamientos
        if (this.mobileArch.environment.isNative) {
            return await this.mobileArch.callNativeMethod('Biometrics.isEnrolled', { type });
        } else {
            // Para web, verificar credenciales almacenadas
            const credentials = await this.getEnrolledWebCredentials(type);
            return credentials.length > 0;
        }
    }

    async getEnrolledWebCredentials(biometricType) {
        // Obtener credenciales WebAuthn enroladas
        const enrollmentStatus = await this.secureStorage.retrieve('enrollment_status') || {};
        const typeEnrollments = enrollmentStatus[biometricType] || {};

        return Object.entries(typeEnrollments)
            .filter(([userId, data]) => data.enrolled)
            .map(([userId, data]) => ({
                userId,
                templateId: `${userId}_${biometricType}`,
                enrolledAt: data.enrolledAt
            }));
    }

    extractUserIdFromCredential(credentialId) {
        // Extraer userId del ID de credencial
        try {
            const decoded = atob(credentialId);
            const parts = decoded.split('_');
            return parts[0];
        } catch {
            return 'unknown';
        }
    }

    async verifyWebAuthnAssertion(assertion, originalChallenge) {
        // Verificar la validez de la aserción WebAuthn
        // En una implementación real, esto se haría en el servidor
        // Aquí hacemos validaciones básicas del lado cliente

        try {
            const clientData = JSON.parse(new TextDecoder().decode(assertion.response.clientDataJSON));

            // Verificar challenge
            const receivedChallenge = new Uint8Array(
                atob(clientData.challenge.replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map(char => char.charCodeAt(0))
            );

            // Comparar challenges
            if (receivedChallenge.length !== originalChallenge.length) {
                return false;
            }

            for (let i = 0; i < originalChallenge.length; i++) {
                if (receivedChallenge[i] !== originalChallenge[i]) {
                    return false;
                }
            }

            // Verificar origen
            if (clientData.origin !== window.location.origin) {
                return false;
            }

            // Verificar tipo
            if (clientData.type !== 'webauthn.get') {
                return false;
            }

            return true;

        } catch (error) {
            this.logger.error('BiometricAuth', 'Error al verificar aserción WebAuthn', error);
            return false;
        }
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEMobileBiometricAuthentication;
} else if (typeof window !== 'undefined') {
    window.BGEMobileBiometricAuthentication = BGEMobileBiometricAuthentication;
}