"use strict";
/**
 * 🚪 AI GATEWAY ROUTE
 * Single API endpoint for all AI services.
 * Created: Jan 2026
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth.js');
const { aiService } = require('../services/ai/AIService.js');
const devLogger = require('../utils/devLogger.js');

// POST /api/ai/v1/process
router.post('/v1/process', optionalAuth, async (req, res) => {
    try {
        const { intent, payload } = req.body;
        const context = {
            userId: req.user?.id || null,
            username: req.user?.username || 'Guest',
            role: req.user?.role || 'anonymous'
        };

        if (!intent || !payload) {
            return res.status(400).json({
                success: false,
                error: 'Missing intent or payload'
            });
        }

        const result = await aiService.processRequest(intent, payload, context);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        devLogger.error('AI_GATEWAY', 'Error processing request', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal AI Error'
        });
    }
});

module.exports = router;
