/**
 * 🔍 DEVICE FINGERPRINTING BACKEND - SEMANA 25
 * Sistema de tracking y validación de dispositivos (servidor)
 *
 * Features:
 * - Almacenamiento de fingerprints de dispositivos
 * - Detección de dispositivos nuevos/desconocidos
 * - Tracking de cambios de dispositivo
 * - Alertas de actividad sospechosa
 * - Revocación de dispositivos comprometidos
 * - Estadísticas de dispositivos por usuario
 * - Portable y modular
 *
 * Uso:
 * const deviceFingerprinting = require('./middleware/deviceFingerprinting');
 * app.use(deviceFingerprinting.middleware());
 * app.post('/api/device/register', deviceFingerprinting.registerDevice);
 *
 * Fecha: 20 Noviembre 2025
 */

const crypto = require('crypto');
const devLogger = require('../utils/devLogger');

class DeviceFingerprinting {
    constructor() {
        // Almacén de dispositivos (en producción usar PostgreSQL)
        // Estructura: Map<userId, Set<DeviceInfo>>
        this.userDevices = new Map();

        // Dispositivos bloqueados/revocados
        this.revokedDevices = new Set();

        // Configuración
        this.config = {
            maxDevicesPerUser: 5,               // Máximo 5 dispositivos por usuario
            trustNewDevice: false,              // Nuevos dispositivos requieren verificación
            alertOnNewDevice: true,             // Alertar cuando se detecte nuevo dispositivo
            fingerprintSimilarityThreshold: 80, // 80% similitud para considerar mismo dispositivo
            deviceExpirationDays: 90,           // Dispositivos inactivos expiran en 90 días
            auditLogEnabled: true               // Logging de auditoría
        };

        // Cleanup automático cada 24 horas
        setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000);

        devLogger.log('DEVICE-FINGERPRINT', '🔍 Device Fingerprinting initialized');
    }

    /**
     * MIDDLEWARE PRINCIPAL (opcional - solo para logging)
     */
    middleware() {
        return async (req, res, next) => {
            try {
                // Este middleware es opcional - solo para logging
                // La validación real se hace en registerDevice() y validateDevice()

                // Extraer fingerprint si existe en headers
                const fingerprint = req.headers['x-device-fingerprint'];

                if (fingerprint && req.user) {
                    const userId = req.user.id.toString();

                    // Validar dispositivo
                    const validation = await this.validateDevice(userId, fingerprint);

                    if (!validation.trusted) {
                        devLogger.warn('DEVICE-FINGERPRINT', `⚠️ Dispositivo no confiable: userId=${userId}`);
                        this.auditLog(userId, 'UNTRUSTED_DEVICE_DETECTED', { fingerprint: fingerprint.substring(0, 20) });
                    }

                    // Adjuntar info de dispositivo al request
                    req.deviceInfo = validation;
                }

                next();

            } catch (error) {
                devLogger.error('DEVICE-FINGERPRINT', 'Error en middleware:', error);
                next(); // No bloquear en caso de error
            }
        };
    }

    /**
     * REGISTRAR NUEVO DISPOSITIVO
     */
    async registerDevice(userId, fingerprintData, metadata = {}) {
        try {
            userId = userId.toString();

            devLogger.log('DEVICE-FINGERPRINT', `📱 Registrando dispositivo: userId=${userId}`);

            // Validar fingerprint
            if (!fingerprintData || !fingerprintData.hash) {
                throw new Error('Fingerprint inválido');
            }

            // Verificar límite de dispositivos
            const userDevicesSet = this.userDevices.get(userId) || new Set();

            if (userDevicesSet.size >= this.config.maxDevicesPerUser) {
                throw new Error(`Límite de dispositivos alcanzado (${this.config.maxDevicesPerUser})`);
            }

            // Verificar si dispositivo ya existe (por similarity)
            const existingDevice = this.findSimilarDevice(userId, fingerprintData.hash, fingerprintData.components);

            if (existingDevice) {
                // Actualizar última vez visto
                existingDevice.lastSeen = Date.now();
                existingDevice.loginCount = (existingDevice.loginCount || 1) + 1;

                devLogger.log('DEVICE-FINGERPRINT', `✅ Dispositivo existente actualizado: deviceId=${existingDevice.deviceId}`);

                return {
                    success: true,
                    deviceId: existingDevice.deviceId,
                    isNew: false,
                    trusted: existingDevice.trusted
                };
            }

            // Crear nuevo dispositivo
            const deviceId = crypto.randomBytes(16).toString('hex');

            const device = {
                deviceId: deviceId,
                userId: userId,
                fingerprint: fingerprintData.hash,
                components: fingerprintData.components,
                metadata: {
                    userAgent: metadata.userAgent || 'unknown',
                    ip: metadata.ip || 'unknown',
                    name: metadata.name || this.generateDeviceName(fingerprintData.components),
                    ...metadata
                },
                trusted: !this.config.trustNewDevice, // false si requiere verificación
                createdAt: Date.now(),
                lastSeen: Date.now(),
                loginCount: 1
            };

            userDevicesSet.add(device);
            this.userDevices.set(userId, userDevicesSet);

            devLogger.log('DEVICE-FINGERPRINT', `✅ Nuevo dispositivo registrado: deviceId=${deviceId}`);

            // Alertar si configurado
            if (this.config.alertOnNewDevice) {
                this.auditLog(userId, 'NEW_DEVICE_REGISTERED', {
                    deviceId,
                    name: device.metadata.name,
                    ip: device.metadata.ip
                });
            }

            return {
                success: true,
                deviceId: deviceId,
                isNew: true,
                trusted: device.trusted,
                requiresVerification: !device.trusted
            };

        } catch (error) {
            devLogger.error('DEVICE-FINGERPRINT', 'Error registrando dispositivo:', error);
            throw error;
        }
    }

    /**
     * VALIDAR DISPOSITIVO
     */
    async validateDevice(userId, fingerprintHash) {
        try {
            userId = userId.toString();

            const userDevicesSet = this.userDevices.get(userId);

            if (!userDevicesSet || userDevicesSet.size === 0) {
                return {
                    valid: false,
                    trusted: false,
                    isNew: true,
                    reason: 'No devices registered'
                };
            }

            // Buscar dispositivo por fingerprint exacto
            let matchedDevice = null;

            for (const device of userDevicesSet) {
                if (device.fingerprint === fingerprintHash) {
                    matchedDevice = device;
                    break;
                }
            }

            if (matchedDevice) {
                // Verificar si dispositivo está revocado
                if (this.revokedDevices.has(matchedDevice.deviceId)) {
                    return {
                        valid: false,
                        trusted: false,
                        isNew: false,
                        reason: 'Device revoked',
                        deviceId: matchedDevice.deviceId
                    };
                }

                // Actualizar última vez visto
                matchedDevice.lastSeen = Date.now();

                return {
                    valid: true,
                    trusted: matchedDevice.trusted,
                    isNew: false,
                    deviceId: matchedDevice.deviceId,
                    deviceName: matchedDevice.metadata.name
                };
            }

            // Dispositivo no encontrado exactamente, buscar similar
            return {
                valid: false,
                trusted: false,
                isNew: true,
                reason: 'Device not recognized'
            };

        } catch (error) {
            devLogger.error('DEVICE-FINGERPRINT', 'Error validando dispositivo:', error);
            return {
                valid: false,
                trusted: false,
                isNew: true,
                reason: 'Validation error'
            };
        }
    }

    /**
     * BUSCAR DISPOSITIVO SIMILAR
     */
    findSimilarDevice(userId, fingerprintHash, components) {
        const userDevicesSet = this.userDevices.get(userId);

        if (!userDevicesSet) {
            return null;
        }

        for (const device of userDevicesSet) {
            // Match exacto por hash
            if (device.fingerprint === fingerprintHash) {
                return device;
            }

            // Match por similitud de componentes
            const similarity = this.calculateSimilarity(device.components, components);

            if (similarity >= this.config.fingerprintSimilarityThreshold) {
                return device;
            }
        }

        return null;
    }

    /**
     * CALCULAR SIMILITUD ENTRE DOS FINGERPRINTS
     */
    calculateSimilarity(components1, components2) {
        if (!components1 || !components2) {
            return 0;
        }

        const keys = Object.keys(components1);
        let matchCount = 0;

        for (const key of keys) {
            if (components1[key] === components2[key]) {
                matchCount++;
            }
        }

        return Math.round((matchCount / keys.length) * 100);
    }

    /**
     * GENERAR NOMBRE DE DISPOSITIVO
     */
    generateDeviceName(components) {
        if (!components) {
            return 'Dispositivo Desconocido';
        }

        const ua = components.userAgent || '';
        const platform = components.platform || '';

        // Detectar tipo de dispositivo
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/iPad/.test(ua)) return 'iPad';
        if (/Android/.test(ua)) return 'Android Device';
        if (/Macintosh/.test(ua) || /Mac OS/.test(platform)) return 'Mac';
        if (/Windows/.test(ua) || /Win/.test(platform)) return 'Windows PC';
        if (/Linux/.test(ua) || /Linux/.test(platform)) return 'Linux Device';

        return 'Dispositivo Desconocido';
    }

    /**
     * OBTENER DISPOSITIVOS DE UN USUARIO
     */
    getUserDevices(userId) {
        userId = userId.toString();

        const userDevicesSet = this.userDevices.get(userId);

        if (!userDevicesSet) {
            return [];
        }

        // Convertir Set a Array y ordenar por última vez visto
        const devices = Array.from(userDevicesSet);

        devices.sort((a, b) => b.lastSeen - a.lastSeen);

        // Formatear para API
        return devices.map(device => ({
            deviceId: device.deviceId,
            name: device.metadata.name,
            fingerprint: device.fingerprint.substring(0, 20) + '...',
            trusted: device.trusted,
            createdAt: new Date(device.createdAt).toISOString(),
            lastSeen: new Date(device.lastSeen).toISOString(),
            loginCount: device.loginCount || 1,
            ip: device.metadata.ip,
            userAgent: device.metadata.userAgent
        }));
    }

    /**
     * CONFIAR EN UN DISPOSITIVO
     */
    trustDevice(userId, deviceId) {
        userId = userId.toString();

        const userDevicesSet = this.userDevices.get(userId);

        if (!userDevicesSet) {
            throw new Error('Usuario no tiene dispositivos registrados');
        }

        for (const device of userDevicesSet) {
            if (device.deviceId === deviceId) {
                device.trusted = true;

                devLogger.log('DEVICE-FINGERPRINT', `✅ Dispositivo confiable: userId=${userId}, deviceId=${deviceId}`);
                this.auditLog(userId, 'DEVICE_TRUSTED', { deviceId });

                return { success: true };
            }
        }

        throw new Error('Dispositivo no encontrado');
    }

    /**
     * REVOCAR DISPOSITIVO
     */
    revokeDevice(userId, deviceId) {
        userId = userId.toString();

        const userDevicesSet = this.userDevices.get(userId);

        if (!userDevicesSet) {
            throw new Error('Usuario no tiene dispositivos registrados');
        }

        for (const device of userDevicesSet) {
            if (device.deviceId === deviceId) {
                // Agregar a lista de revocados
                this.revokedDevices.add(deviceId);

                // Eliminar del set de usuario
                userDevicesSet.delete(device);

                devLogger.warn('DEVICE-FINGERPRINT', `🚫 Dispositivo revocado: userId=${userId}, deviceId=${deviceId}`);
                this.auditLog(userId, 'DEVICE_REVOKED', { deviceId });

                return { success: true };
            }
        }

        throw new Error('Dispositivo no encontrado');
    }

    /**
     * ELIMINAR TODOS LOS DISPOSITIVOS DE UN USUARIO
     */
    revokeAllUserDevices(userId) {
        userId = userId.toString();

        const userDevicesSet = this.userDevices.get(userId);

        if (!userDevicesSet) {
            return 0;
        }

        let count = 0;

        for (const device of userDevicesSet) {
            this.revokedDevices.add(device.deviceId);
            count++;
        }

        this.userDevices.delete(userId);

        devLogger.warn('DEVICE-FINGERPRINT', `🚫 Todos los dispositivos revocados: userId=${userId}, count=${count}`);
        this.auditLog(userId, 'ALL_DEVICES_REVOKED', { count });

        return count;
    }

    /**
     * AUDIT LOGGING
     */
    auditLog(userId, eventType, details = {}) {
        if (!this.config.auditLogEnabled) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: userId,
            eventType: eventType,
            details: details
        };

        devLogger.log('DEVICE-AUDIT', JSON.stringify(logEntry));

        // En producción: guardar en BD
    }

    /**
     * CLEANUP DE DISPOSITIVOS EXPIRADOS
     */
    cleanup() {
        const now = Date.now();
        const expirationMs = this.config.deviceExpirationDays * 24 * 60 * 60 * 1000;
        let cleanedDevices = 0;

        for (const [userId, devicesSet] of this.userDevices.entries()) {
            const activeDevices = new Set();

            for (const device of devicesSet) {
                const inactiveTime = now - device.lastSeen;

                if (inactiveTime < expirationMs) {
                    activeDevices.add(device);
                } else {
                    cleanedDevices++;
                    this.auditLog(userId, 'DEVICE_EXPIRED', { deviceId: device.deviceId });
                }
            }

            if (activeDevices.size === 0) {
                this.userDevices.delete(userId);
            } else {
                this.userDevices.set(userId, activeDevices);
            }
        }

        if (cleanedDevices > 0) {
            devLogger.log('DEVICE-FINGERPRINT', `🧹 Cleanup: ${cleanedDevices} dispositivos expirados eliminados`);
        }
    }

    /**
     * OBTENER ESTADÍSTICAS
     */
    getStats() {
        const stats = {
            totalUsers: this.userDevices.size,
            totalDevices: 0,
            revokedDevices: this.revokedDevices.size,
            usersWithMultipleDevices: 0,
            averageDevicesPerUser: 0
        };

        for (const [userId, devicesSet] of this.userDevices.entries()) {
            stats.totalDevices += devicesSet.size;

            if (devicesSet.size > 1) {
                stats.usersWithMultipleDevices++;
            }
        }

        if (stats.totalUsers > 0) {
            stats.averageDevicesPerUser = (stats.totalDevices / stats.totalUsers).toFixed(2);
        }

        return stats;
    }
}

// Exportar instancia singleton
const deviceFingerprinting = new DeviceFingerprinting();

module.exports = deviceFingerprinting;
