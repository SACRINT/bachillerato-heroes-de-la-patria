const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchain-service');

// Middleware para verificar autenticación
const authMiddleware = require('../middleware/auth');

/**
 * Semana 37: API de Economía DeFi
 * Endpoints para interactuar con los contratos financieros
 */

// ============ STAKING ============

/**
 * @route GET /api/economy/staking/info/:address
 * @desc Obtener información de staking de un usuario
 */
router.get('/staking/info/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // En producción: llamar a StudyStaking.stakes(address)
        // Simulación por ahora
        const mockData = {
            stakedAmount: '500000000000000000000', // 500 tokens (18 decimals)
            pendingRewards: '12500000000000000000', // 12.5 tokens
            effectiveAPY: 750, // 7.5%
            lockEndTime: Math.floor(Date.now() / 1000) + 86400 * 60,
            gradeBonus: 250 // 2.5% extra
        };

        res.json(mockData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/economy/staking/update-grade
 * @desc Actualizar bonus de calificación (Oracle endpoint)
 */
router.post('/staking/update-grade', authMiddleware, async (req, res) => {
    try {
        const { studentAddress, gradeAverage } = req.body;

        // Verificar permisos de oráculo
        // En producción: llamar a StudyStaking.updateGradeBonus()

        console.log(`[Economy] Updating grade bonus for ${studentAddress}: ${gradeAverage}`);

        res.json({
            success: true,
            message: 'Grade bonus updated',
            newBonus: Math.max(0, (gradeAverage - 80) * 50)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ MARKETPLACE ============

/**
 * @route GET /api/economy/marketplace/listings
 * @desc Obtener listados activos del marketplace
 */
router.get('/marketplace/listings', async (req, res) => {
    try {
        const { itemId, category, rarity, page = 1, limit = 20 } = req.query;

        // En producción: usar The Graph o escanear eventos
        const mockListings = [
            {
                listingId: 1,
                itemId: 101,
                name: 'Gorra Espacial',
                seller: '0x1234567890abcdef...',
                amount: 1,
                pricePerUnit: '50000000000000000000',
                category: 'CLOTHING',
                rarity: 'RARE'
            },
            {
                listingId: 2,
                itemId: 102,
                name: 'Mochila Rocket',
                seller: '0xabcdef1234567890...',
                amount: 3,
                pricePerUnit: '75000000000000000000',
                category: 'ACCESSORY',
                rarity: 'EPIC'
            }
        ];

        res.json({
            listings: mockListings,
            total: mockListings.length,
            page: parseInt(page),
            totalPages: 1
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/economy/marketplace/price-history/:itemId
 * @desc Historial de precios de un item
 */
router.get('/marketplace/price-history/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;

        // Simulación de historial
        const history = [];
        const now = Date.now();
        for (let i = 30; i >= 0; i--) {
            history.push({
                date: new Date(now - i * 86400 * 1000).toISOString().split('T')[0],
                price: (50 + Math.random() * 20).toFixed(2),
                volume: Math.floor(Math.random() * 100)
            });
        }

        res.json({ itemId, history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ SCHOLARSHIPS ============

/**
 * @route GET /api/economy/scholarships/available
 * @desc Listar becas disponibles para solicitar
 */
router.get('/scholarships/available', async (req, res) => {
    try {
        const scholarships = [
            {
                type: 'MERIT',
                name: 'Beca de Excelencia Académica',
                monthlyAmount: '100',
                duration: 6,
                requirements: 'Promedio >= 9.5',
                available: true
            },
            {
                type: 'STEM',
                name: 'Beca STEM Innovadores',
                monthlyAmount: '150',
                duration: 12,
                requirements: 'Aprobar proyecto de ciencias',
                available: true
            }
        ];

        res.json(scholarships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/economy/scholarships/my/:address
 * @desc Mis becas activas y pendientes
 */
router.get('/scholarships/my/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // En producción: llamar a ScholarshipManager.getStudentScholarships()
        res.json({
            active: [],
            pending: [],
            completed: []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ECONOMY STATS ============

/**
 * @route GET /api/economy/stats
 * @desc Estadísticas globales de la economía
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            totalCirculating: '10000000',       // IACoins en circulación
            totalStaked: '2500000',             // Tokens en staking
            marketplaceVolume24h: '15000',      // Volumen 24h
            averageAPY: 650,                    // 6.5% promedio
            totalScholarshipsDistributed: '50000',
            activeListings: 127,
            totalUsers: 856
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
