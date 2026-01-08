const { executeQuery } = require('../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class MobileAuthService {

    /**
     * Registra un dispositivo móvil para un usuario
     * @param {number} userId 
     * @param {string} deviceId 
     * @param {string} deviceName 
     * @param {string} publicKey Clave pública PEM o JWK
     */
    async registerDevice(userId, deviceId, deviceName, publicKey) {
        // Verificar si ya existe
        const existing = await executeQuery(
            'SELECT id FROM user_devices WHERE user_id = $1 AND device_id = $2',
            [userId, deviceId]
        );

        if (existing.length > 0) {
            // Actualizar clave pública si es re-registro
            await executeQuery(
                'UPDATE user_devices SET public_key = $1, last_login = NOW(), is_active = TRUE WHERE user_id = $2 AND device_id = $3',
                [publicKey, userId, deviceId]
            );
            return { status: 'updated' };
        } else {
            // Insertar nuevo
            await executeQuery(
                'INSERT INTO user_devices (user_id, device_id, device_name, public_key, created_at) VALUES ($1, $2, $3, $4, NOW())',
                [userId, deviceId, deviceName, publicKey]
            );
            return { status: 'created' };
        }
    }

    /**
     * Verifica la firma biométrica y emite un token de sesión
     * @param {string} deviceId 
     * @param {string} signature Firma en base64 del challenge
     * @param {string} challenge Mensaje original firmado (ej. timestamp o nonce)
     */
    async verifyBiometricLogin(deviceId, signature, challenge) {
        // 1. Obtener dispositivo
        const devices = await executeQuery(
            'SELECT * FROM user_devices WHERE device_id = $1 AND is_active = TRUE',
            [deviceId]
        );

        if (devices.length === 0) {
            throw new Error('Dispositivo no registrado o inactivo');
        }

        const device = devices[0];

        // 2. Verificar firma (Simplificado para MVP: asumimos RSA-SHA256)
        // En producción real, usar crypto.verify con la public key del DB
        const isVerified = this._verifySignature(device.public_key, signature, challenge);

        if (!isVerified) {
            throw new Error('Firma biométrica inválida');
        }

        // 3. Generar JWT
        const user = await this._getUserById(device.user_id);
        const token = jwt.sign(
            { id: user.id, role: user.role, deviceId: deviceId },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' } // Sesiones móviles duraderas
        );

        // 4. Actualizar last login
        await executeQuery(
            'UPDATE user_devices SET last_login = NOW() WHERE id = $1',
            [device.id]
        );

        return { token, user: { id: user.id, name: user.nombre, role: user.role } };
    }

    _verifySignature(publicKey, signature, data) {
        try {
            // Simulación de verificación real
            // const verifier = crypto.createVerify('RSA-SHA256');
            // verifier.update(data);
            // return verifier.verify(publicKey, signature, 'base64');

            // MOCK para desarrollo sin claves reales en el frontend dummy
            return true;
        } catch (error) {
            console.error('Crypto error:', error);
            return false;
        }
    }

    async _getUserById(userId) {
        const res = await executeQuery('SELECT id, nombre, role FROM usuarios WHERE id = $1', [userId]);
        return res[0];
    }
}

module.exports = new MobileAuthService();
