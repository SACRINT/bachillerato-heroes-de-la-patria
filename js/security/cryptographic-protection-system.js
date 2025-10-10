/**
 * 🔐 BGE Cryptographic Protection System
 * Sistema Avanzado de Protección Criptográfica
 *
 * Implementa múltiples capas de encriptación para proteger datos sensibles:
 * - Encriptación AES-256-GCM para datos en reposo
 * - Encriptación RSA-OAEP para intercambio de claves
 * - ECDH para intercambio seguro de claves
 * - PBKDF2/Argon2 para derivación de claves
 * - Firma digital ECDSA para integridad
 * - Hashing seguro con SHA-256/SHA-512
 *
 * @version 1.0.0
 * @since Phase D - Security Implementation
 */

class BGECryptographicProtectionSystem {
    constructor() {
        this.cryptoConfig = {
            symmetric: {
                algorithm: 'AES-GCM',
                keyLength: 256,
                ivLength: 12,
                tagLength: 16
            },
            asymmetric: {
                algorithm: 'RSA-OAEP',
                keyLength: 4096,
                hashFunction: 'SHA-256'
            },
            keyExchange: {
                algorithm: 'ECDH',
                namedCurve: 'P-384'
            },
            keyDerivation: {
                algorithm: 'PBKDF2',
                iterations: 600000,
                saltLength: 32,
                hashFunction: 'SHA-512'
            },
            signing: {
                algorithm: 'ECDSA',
                namedCurve: 'P-384',
                hashFunction: 'SHA-384'
            },
            hashing: {
                algorithm: 'SHA-256',
                strongAlgorithm: 'SHA-512'
            }
        };

        this.keyStore = new Map();
        this.encryptedData = new Map();
        this.certificateStore = new Map();

        this.logger = window.BGELogger || console;
        this.initializeCryptographicSystem();
    }

    async initializeCryptographicSystem() {
        try {
            this.logger.info('CryptoProtection', 'Inicializando sistema criptográfico avanzado');

            // Verificar soporte de Web Crypto API
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error('Web Crypto API no soportada');
            }

            // Generar claves maestras del sistema
            await this.generateSystemMasterKeys();

            // Inicializar almacén seguro de claves
            await this.initializeKeyStore();

            // Configurar rotación automática de claves
            this.setupKeyRotation();

            // Inicializar validación de integridad
            this.initializeIntegrityValidation();

            this.logger.info('CryptoProtection', 'Sistema criptográfico inicializado correctamente');

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al inicializar sistema criptográfico', error);
            throw error;
        }
    }

    async generateSystemMasterKeys() {
        try {
            // Generar clave maestra para encriptación simétrica
            this.masterKey = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false, // No exportable por seguridad
                ['encrypt', 'decrypt']
            );

            // Generar par de claves para encriptación asimétrica
            this.asymmetricKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.asymmetric.algorithm,
                    modulusLength: this.cryptoConfig.asymmetric.keyLength,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: this.cryptoConfig.asymmetric.hashFunction
                },
                true, // Exportable para intercambio
                ['encrypt', 'decrypt']
            );

            // Generar par de claves para firma digital
            this.signingKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.signing.algorithm,
                    namedCurve: this.cryptoConfig.signing.namedCurve
                },
                true,
                ['sign', 'verify']
            );

            // Generar par de claves para intercambio ECDH
            this.ecdhKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.keyExchange.algorithm,
                    namedCurve: this.cryptoConfig.keyExchange.namedCurve
                },
                true,
                ['deriveKey']
            );

            this.logger.info('CryptoProtection', 'Claves maestras generadas exitosamente');

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al generar claves maestras', error);
            throw error;
        }
    }

    async initializeKeyStore() {
        // Almacén seguro de claves con metadatos
        this.keyStoreStructure = {
            userKeys: new Map(),      // Claves específicas por usuario
            sessionKeys: new Map(),   // Claves temporales de sesión
            dataKeys: new Map(),      // Claves para datos específicos
            backupKeys: new Map(),    // Claves de respaldo
            rotationHistory: new Map() // Historial de rotación
        };

        this.logger.info('CryptoProtection', 'Almacén de claves inicializado');
    }

    setupKeyRotation() {
        // Programar rotación automática de claves cada 24 horas
        setInterval(async () => {
            await this.rotateSessionKeys();
        }, 24 * 60 * 60 * 1000);

        // Programar rotación de claves maestras cada 30 días
        setInterval(async () => {
            await this.rotateMasterKeys();
        }, 30 * 24 * 60 * 60 * 1000);

        this.logger.info('CryptoProtection', 'Rotación automática de claves configurada');
    }

    initializeIntegrityValidation() {
        // Sistema de validación de integridad con checksums
        this.integrityValidator = {
            checksums: new Map(),
            validationRules: new Map(),
            auditLog: []
        };

        this.logger.info('CryptoProtection', 'Sistema de validación de integridad inicializado');
    }

    /**
     * Encriptación de datos sensibles con AES-GCM
     */
    async encryptSensitiveData(data, dataType = 'general', userId = null) {
        try {
            this.logger.debug('CryptoProtection', `Encriptando datos tipo: ${dataType}`);

            // Convertir datos a ArrayBuffer si es necesario
            const dataBuffer = typeof data === 'string' ?
                new TextEncoder().encode(data) :
                data;

            // Generar IV único para esta encriptación
            const iv = window.crypto.getRandomValues(
                new Uint8Array(this.cryptoConfig.symmetric.ivLength)
            );

            // Obtener clave apropiada según el tipo de datos
            const key = await this.getEncryptionKey(dataType, userId);

            // Encriptar datos
            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    iv: iv,
                    tagLength: this.cryptoConfig.symmetric.tagLength * 8
                },
                key,
                dataBuffer
            );

            // Crear objeto de datos encriptados con metadatos
            const encryptedObject = {
                data: new Uint8Array(encryptedData),
                iv: iv,
                algorithm: this.cryptoConfig.symmetric.algorithm,
                keyLength: this.cryptoConfig.symmetric.keyLength,
                timestamp: new Date().toISOString(),
                dataType: dataType,
                userId: userId,
                checksum: await this.calculateChecksum(dataBuffer)
            };

            // Firmar datos encriptados para garantizar integridad
            encryptedObject.signature = await this.signData(encryptedObject);

            // Almacenar en caché encriptado
            const dataId = this.generateDataId();
            this.encryptedData.set(dataId, encryptedObject);

            this.logger.info('CryptoProtection', `Datos encriptados exitosamente: ${dataId}`);

            return {
                dataId: dataId,
                encryptedData: encryptedObject
            };

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al encriptar datos', error);
            throw error;
        }
    }

    /**
     * Desencriptación de datos sensibles
     */
    async decryptSensitiveData(encryptedObject, dataType = 'general', userId = null) {
        try {
            this.logger.debug('CryptoProtection', `Desencriptando datos tipo: ${dataType}`);

            // Verificar firma digital primero
            const isValid = await this.verifyDataSignature(encryptedObject);
            if (!isValid) {
                throw new Error('Firma digital inválida - datos comprometidos');
            }

            // Obtener clave apropiada
            const key = await this.getEncryptionKey(dataType, userId);

            // Desencriptar datos
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    iv: encryptedObject.iv,
                    tagLength: this.cryptoConfig.symmetric.tagLength * 8
                },
                key,
                encryptedObject.data
            );

            // Verificar integridad con checksum
            const calculatedChecksum = await this.calculateChecksum(decryptedBuffer);
            if (calculatedChecksum !== encryptedObject.checksum) {
                throw new Error('Checksum inválido - datos corrompidos');
            }

            // Convertir de vuelta a formato original
            const decryptedData = new TextDecoder().decode(decryptedBuffer);

            this.logger.info('CryptoProtection', 'Datos desencriptados y verificados exitosamente');

            return decryptedData;

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al desencriptar datos', error);
            throw error;
        }
    }

    /**
     * Encriptación asimétrica para intercambio de claves
     */
    async encryptWithPublicKey(data, publicKey) {
        try {
            const dataBuffer = typeof data === 'string' ?
                new TextEncoder().encode(data) :
                data;

            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: this.cryptoConfig.asymmetric.algorithm
                },
                publicKey,
                dataBuffer
            );

            return new Uint8Array(encryptedData);

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error en encriptación asimétrica', error);
            throw error;
        }
    }

    async decryptWithPrivateKey(encryptedData, privateKey) {
        try {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: this.cryptoConfig.asymmetric.algorithm
                },
                privateKey,
                encryptedData
            );

            return new TextDecoder().decode(decryptedBuffer);

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error en desencriptación asimétrica', error);
            throw error;
        }
    }

    /**
     * Derivación segura de claves con PBKDF2
     */
    async deriveKeyFromPassword(password, salt = null, iterations = null) {
        try {
            // Generar salt si no se proporciona
            if (!salt) {
                salt = window.crypto.getRandomValues(
                    new Uint8Array(this.cryptoConfig.keyDerivation.saltLength)
                );
            }

            // Usar iteraciones configuradas si no se especifican
            const keyIterations = iterations || this.cryptoConfig.keyDerivation.iterations;

            // Importar password como clave base
            const baseKey = await window.crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(password),
                { name: this.cryptoConfig.keyDerivation.algorithm },
                false,
                ['deriveKey']
            );

            // Derivar clave final
            const derivedKey = await window.crypto.subtle.deriveKey(
                {
                    name: this.cryptoConfig.keyDerivation.algorithm,
                    salt: salt,
                    iterations: keyIterations,
                    hash: this.cryptoConfig.keyDerivation.hashFunction
                },
                baseKey,
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );

            return {
                key: derivedKey,
                salt: salt,
                iterations: keyIterations
            };

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error en derivación de clave', error);
            throw error;
        }
    }

    /**
     * Intercambio seguro de claves con ECDH
     */
    async performKeyExchange(remotePublicKey) {
        try {
            // Realizar intercambio ECDH
            const sharedKey = await window.crypto.subtle.deriveKey(
                {
                    name: this.cryptoConfig.keyExchange.algorithm,
                    public: remotePublicKey
                },
                this.ecdhKeyPair.privateKey,
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );

            return sharedKey;

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error en intercambio de claves', error);
            throw error;
        }
    }

    /**
     * Firma digital para integridad
     */
    async signData(data) {
        try {
            const dataBuffer = typeof data === 'string' ?
                new TextEncoder().encode(JSON.stringify(data)) :
                new TextEncoder().encode(JSON.stringify(data));

            const signature = await window.crypto.subtle.sign(
                {
                    name: this.cryptoConfig.signing.algorithm,
                    hash: this.cryptoConfig.signing.hashFunction
                },
                this.signingKeyPair.privateKey,
                dataBuffer
            );

            return new Uint8Array(signature);

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al firmar datos', error);
            throw error;
        }
    }

    async verifyDataSignature(dataObject) {
        try {
            const { signature, ...dataToVerify } = dataObject;

            const dataBuffer = new TextEncoder().encode(JSON.stringify(dataToVerify));

            const isValid = await window.crypto.subtle.verify(
                {
                    name: this.cryptoConfig.signing.algorithm,
                    hash: this.cryptoConfig.signing.hashFunction
                },
                this.signingKeyPair.publicKey,
                signature,
                dataBuffer
            );

            return isValid;

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al verificar firma', error);
            return false;
        }
    }

    /**
     * Hashing seguro para integridad
     */
    async calculateChecksum(data, algorithm = null) {
        try {
            const hashAlgorithm = algorithm || this.cryptoConfig.hashing.algorithm;

            const dataBuffer = data instanceof ArrayBuffer ?
                data :
                new TextEncoder().encode(data);

            const hashBuffer = await window.crypto.subtle.digest(hashAlgorithm, dataBuffer);
            const hashArray = new Uint8Array(hashBuffer);

            // Convertir a string hexadecimal
            return Array.from(hashArray)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al calcular checksum', error);
            throw error;
        }
    }

    async verifyChecksum(data, expectedChecksum, algorithm = null) {
        try {
            const calculatedChecksum = await this.calculateChecksum(data, algorithm);
            return calculatedChecksum === expectedChecksum;

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al verificar checksum', error);
            return false;
        }
    }

    /**
     * Gestión de claves
     */
    async getEncryptionKey(dataType, userId) {
        // Estrategia de claves según tipo de datos
        switch (dataType) {
            case 'user_data':
                return await this.getUserSpecificKey(userId);
            case 'session_data':
                return await this.getSessionKey();
            case 'government_data':
                return await this.getGovernmentDataKey();
            case 'academic_records':
                return await this.getAcademicRecordsKey();
            case 'personal_info':
                return await this.getPersonalInfoKey();
            default:
                return this.masterKey;
        }
    }

    async getUserSpecificKey(userId) {
        if (!this.keyStoreStructure.userKeys.has(userId)) {
            // Generar clave específica para el usuario
            const userKey = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );

            this.keyStoreStructure.userKeys.set(userId, {
                key: userKey,
                created: new Date(),
                lastUsed: new Date()
            });
        }

        const userKeyData = this.keyStoreStructure.userKeys.get(userId);
        userKeyData.lastUsed = new Date();

        return userKeyData.key;
    }

    async getSessionKey() {
        const sessionId = this.getCurrentSessionId();

        if (!this.keyStoreStructure.sessionKeys.has(sessionId)) {
            const sessionKey = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );

            this.keyStoreStructure.sessionKeys.set(sessionId, {
                key: sessionKey,
                created: new Date(),
                expires: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 horas
            });
        }

        return this.keyStoreStructure.sessionKeys.get(sessionId).key;
    }

    async getGovernmentDataKey() {
        // Clave especial para datos gubernamentales con mayor seguridad
        if (!this.governmentDataKey) {
            this.governmentDataKey = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );
        }
        return this.governmentDataKey;
    }

    async getAcademicRecordsKey() {
        if (!this.academicRecordsKey) {
            this.academicRecordsKey = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );
        }
        return this.academicRecordsKey;
    }

    async getPersonalInfoKey() {
        if (!this.personalInfoKey) {
            this.personalInfoKey = await window.crypto.subtle.generateKey(
                {
                    name: this.cryptoConfig.symmetric.algorithm,
                    length: this.cryptoConfig.symmetric.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );
        }
        return this.personalInfoKey;
    }

    /**
     * Rotación de claves
     */
    async rotateSessionKeys() {
        try {
            this.logger.info('CryptoProtection', 'Iniciando rotación de claves de sesión');

            const now = new Date();
            let rotatedCount = 0;

            // Rotar claves de sesión expiradas
            for (const [sessionId, keyData] of this.keyStoreStructure.sessionKeys) {
                if (now > keyData.expires) {
                    // Generar nueva clave
                    const newKey = await window.crypto.subtle.generateKey(
                        {
                            name: this.cryptoConfig.symmetric.algorithm,
                            length: this.cryptoConfig.symmetric.keyLength
                        },
                        false,
                        ['encrypt', 'decrypt']
                    );

                    // Actualizar almacén
                    this.keyStoreStructure.sessionKeys.set(sessionId, {
                        key: newKey,
                        created: now,
                        expires: new Date(now.getTime() + 8 * 60 * 60 * 1000)
                    });

                    rotatedCount++;
                }
            }

            this.logger.info('CryptoProtection', `Rotación completada: ${rotatedCount} claves rotadas`);

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error en rotación de claves', error);
        }
    }

    async rotateMasterKeys() {
        try {
            this.logger.info('CryptoProtection', 'Iniciando rotación de claves maestras');

            // Respaldar claves actuales
            const backupKeys = {
                masterKey: this.masterKey,
                asymmetricKeyPair: this.asymmetricKeyPair,
                signingKeyPair: this.signingKeyPair,
                timestamp: new Date()
            };

            // Generar nuevas claves maestras
            await this.generateSystemMasterKeys();

            // Almacenar respaldo
            const backupId = this.generateDataId();
            this.keyStoreStructure.backupKeys.set(backupId, backupKeys);

            this.logger.info('CryptoProtection', 'Rotación de claves maestras completada');

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error en rotación de claves maestras', error);
        }
    }

    /**
     * Exportación/Importación segura de claves
     */
    async exportPublicKey(keyPair = null) {
        try {
            const keys = keyPair || this.asymmetricKeyPair;

            const exportedKey = await window.crypto.subtle.exportKey(
                'spki',
                keys.publicKey
            );

            return new Uint8Array(exportedKey);

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al exportar clave pública', error);
            throw error;
        }
    }

    async importPublicKey(keyData) {
        try {
            const publicKey = await window.crypto.subtle.importKey(
                'spki',
                keyData,
                {
                    name: this.cryptoConfig.asymmetric.algorithm,
                    hash: this.cryptoConfig.asymmetric.hashFunction
                },
                true,
                ['encrypt']
            );

            return publicKey;

        } catch (error) {
            this.logger.error('CryptoProtection', 'Error al importar clave pública', error);
            throw error;
        }
    }

    /**
     * Utilidades
     */
    generateDataId() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    getCurrentSessionId() {
        // Obtener ID de sesión actual del sistema de autenticación
        return window.currentSessionId || 'default_session';
    }

    /**
     * API pública para integración con otros módulos
     */

    // Encriptar datos de estudiante
    async encryptStudentData(studentData, studentId) {
        return await this.encryptSensitiveData(
            JSON.stringify(studentData),
            'user_data',
            studentId
        );
    }

    // Encriptar datos gubernamentales
    async encryptGovernmentData(governmentData) {
        return await this.encryptSensitiveData(
            JSON.stringify(governmentData),
            'government_data'
        );
    }

    // Encriptar registros académicos
    async encryptAcademicRecords(academicData, studentId) {
        return await this.encryptSensitiveData(
            JSON.stringify(academicData),
            'academic_records',
            studentId
        );
    }

    // Encriptar información personal
    async encryptPersonalInfo(personalData, userId) {
        return await this.encryptSensitiveData(
            JSON.stringify(personalData),
            'personal_info',
            userId
        );
    }

    // Obtener métricas del sistema criptográfico
    getCryptographicMetrics() {
        return {
            activeKeys: {
                userKeys: this.keyStoreStructure.userKeys.size,
                sessionKeys: this.keyStoreStructure.sessionKeys.size,
                dataKeys: this.keyStoreStructure.dataKeys.size,
                backupKeys: this.keyStoreStructure.backupKeys.size
            },
            encryptedDataObjects: this.encryptedData.size,
            algorithms: {
                symmetric: this.cryptoConfig.symmetric.algorithm,
                asymmetric: this.cryptoConfig.asymmetric.algorithm,
                keyExchange: this.cryptoConfig.keyExchange.algorithm,
                signing: this.cryptoConfig.signing.algorithm
            },
            security: {
                keyLength: this.cryptoConfig.symmetric.keyLength,
                ivLength: this.cryptoConfig.symmetric.ivLength,
                iterations: this.cryptoConfig.keyDerivation.iterations
            }
        };
    }

    // Verificar estado de seguridad
    async performSecurityAudit() {
        const audit = {
            timestamp: new Date(),
            cryptographicHealth: 'HEALTHY',
            findings: [],
            recommendations: []
        };

        // Verificar claves expiradas
        const now = new Date();
        let expiredSessions = 0;

        for (const [sessionId, keyData] of this.keyStoreStructure.sessionKeys) {
            if (now > keyData.expires) {
                expiredSessions++;
            }
        }

        if (expiredSessions > 0) {
            audit.findings.push(`${expiredSessions} claves de sesión expiradas`);
            audit.recommendations.push('Ejecutar rotación de claves de sesión');
        }

        // Verificar integridad de datos encriptados
        let corruptedData = 0;
        for (const [dataId, encryptedObject] of this.encryptedData) {
            try {
                const isValid = await this.verifyDataSignature(encryptedObject);
                if (!isValid) {
                    corruptedData++;
                }
            } catch (error) {
                corruptedData++;
            }
        }

        if (corruptedData > 0) {
            audit.cryptographicHealth = 'WARNING';
            audit.findings.push(`${corruptedData} objetos de datos corrompidos`);
            audit.recommendations.push('Revisar integridad de datos y regenerar si es necesario');
        }

        return audit;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGECryptographicProtectionSystem;
} else if (typeof window !== 'undefined') {
    window.BGECryptographicProtectionSystem = BGECryptographicProtectionSystem;
}