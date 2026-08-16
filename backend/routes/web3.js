const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchain-service.js');

// Middleware para verificar que el servicio esté activo
const ensureBlockchain = (req, res, next) => {
    if (!blockchainService.isConnected) {
        return res.status(503).json({ error: 'Blockchain service unavailable' });
    }
    next();
};

/**
 * @route GET /api/web3/status
 * @desc Verificar estado de la conexión Blockchain
 */
router.get('/status', (req, res) => {
    res.json({
        connected: blockchainService.isConnected,
        provider: blockchainService.provider ? 'Active' : 'Inactive',
        contractsLoaded: Object.keys(blockchainService.contracts)
    });
});

/**
 * @route GET /api/web3/gas-price
 * @desc Obtener estimación de gas actual
 */
router.get('/gas-price', ensureBlockchain, async (req, res) => {
    try {
        const feeData = await blockchainService.provider.getFeeData();
        res.json({
            gasPrice: feeData.gasPrice ? feeData.gasPrice.toString() : null,
            maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : null,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toString() : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/web3/issue-diploma
 * @desc Emitir un diploma (Admin only - Simulado por ahora)
 */
router.post('/issue-diploma', ensureBlockchain, async (req, res) => {
    const { studentAddress, ipfsUri } = req.body;

    // Aquí iría validación de permisos de admin (JWT)
    // if (!req.user.isAdmin) return res.status(403)...

    try {
        const txHash = await blockchainService.issueDiploma(studentAddress, ipfsUri);
        res.json({ success: true, txHash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
