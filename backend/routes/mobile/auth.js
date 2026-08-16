const express = require('express');
const router = express.Router();
const mobileAuthService = require('../../services/mobile-auth.service.js');
const { authenticateToken } = require('../../middleware/auth.js');

// POST /api/mobile/auth/device-register
// Registra un dispositivo (Requiere estar autenticado primero con user/pass)
router.post('/device-register', authenticateToken, async (req, res) => {
    try {
        const { deviceId, deviceName, publicKey } = req.body;
        if (!deviceId || !publicKey) {
            return res.status(400).json({ success: false, error: 'Faltan datos del dispositivo' });
        }

        const result = await mobileAuthService.registerDevice(req.user.id, deviceId, deviceName, publicKey);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/mobile/auth/biometric-login
// Login con biometría (No requiere token previo, usa firma)
router.post('/biometric-login', async (req, res) => {
    try {
        const { deviceId, signature, challenge } = req.body;
        // Challenge debería ser algo generado por el servidor o timestamp reciente para evitar replay

        const result = await mobileAuthService.verifyBiometricLogin(deviceId, signature, challenge);
        res.json({ success: true, token: result.token, user: result.user });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});

module.exports = router;
