/**
 * 🔒 GDPR COMPLIANCE ROUTES - SEMANA 27-28
 * Rutas API para cumplir con GDPR
 *
 * Endpoints:
 * - GET /api/gdpr/export/:userId - Export user data (Right to Access)
 * - POST /api/gdpr/delete/:userId - Delete user data (Right to Erasure)
 * - POST /api/gdpr/anonymize/:userId - Anonymize user data
 * - POST /api/gdpr/consent - Record consent
 * - GET /api/gdpr/consents/:userId - Get user consents
 * - POST /api/gdpr/breach - Report data breach
 * - GET /api/gdpr/stats - Get compliance statistics
 *
 * Fecha: 20 Noviembre 2025
 */

const express = require('express');
const router = express.Router();
const gdprService = require('../services/gdprComplianceService.js');
const devLogger = require('../utils/devLogger.js');

/**
 * RIGHT TO ACCESS (Artículo 15 GDPR)
 * Export all user data in specified format
 *
 * GET /api/gdpr/export/:userId?format=json
 * Query params:
 *   - format: 'json' | 'csv' | 'xml' (default: 'json')
 *
 * Response:
 * {
 *   userId: 123,
 *   format: 'json',
 *   exportedAt: '2025-11-20T...',
 *   dataSize: 45678,
 *   tables: ['usuarios', 'calificaciones', ...],
 *   data: { ... }
 * }
 */
router.get('/export/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const format = req.query.format || 'json';

        // Authorization check (user can only export their own data, or admin)
        if (req.user && req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to export this user data'
            });
        }

        const exportData = await gdprService.exportUserData(userId, format, {
            requestedBy: req.user ? req.user.id : null
        });

        // Set appropriate headers for download
        const mimeTypes = {
            json: 'application/json',
            csv: 'text/csv',
            xml: 'application/xml'
        };

        res.setHeader('Content-Type', mimeTypes[format] || 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user_${userId}_data.${format}"`);

        // Return data directly for download
        if (format === 'json') {
            res.json(exportData);
        } else {
            res.send(exportData.data);
        }

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error exporting user data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * RIGHT TO ERASURE (Artículo 17 GDPR)
 * Delete all user data permanently
 *
 * POST /api/gdpr/delete/:userId
 * Body:
 * {
 *   reason: 'User request',
 *   confirmation: true
 * }
 *
 * Response:
 * {
 *   userId: 123,
 *   deletedAt: '2025-11-20T...',
 *   backupRetentionDays: 90
 * }
 */
router.post('/delete/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { reason, confirmation } = req.body;

        // Authorization check
        if (req.user && req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this user data'
            });
        }

        // Require explicit confirmation
        if (!confirmation) {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required to delete user data'
            });
        }

        const deletionResult = await gdprService.deleteUserData(userId, {
            reason,
            requestedBy: req.user ? req.user.id : null
        });

        res.json({
            success: true,
            ...deletionResult
        });

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error deleting user data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * ANONYMIZE USER DATA
 * Alternative to deletion when data must be retained for legal reasons
 *
 * POST /api/gdpr/anonymize/:userId
 * Body:
 * {
 *   reason: 'User request',
 *   confirmation: true
 * }
 */
router.post('/anonymize/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { reason, confirmation } = req.body;

        // Authorization check
        if (req.user && req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to anonymize this user data'
            });
        }

        if (!confirmation) {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required to anonymize user data'
            });
        }

        const anonymizationResult = await gdprService.anonymizeUserData(userId, {
            reason,
            requestedBy: req.user ? req.user.id : null
        });

        res.json({
            success: true,
            ...anonymizationResult
        });

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error anonymizing user data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * RECORD CONSENT (Artículo 7 GDPR)
 * Record or update user consent for data processing
 *
 * POST /api/gdpr/consent
 * Body:
 * {
 *   userId: 123,
 *   consentType: 'email_marketing',
 *   granted: true
 * }
 */
router.post('/consent', async (req, res) => {
    try {
        const { userId, consentType, granted } = req.body;

        if (!userId || !consentType || typeof granted !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'userId, consentType, and granted (boolean) are required'
            });
        }

        const result = await gdprService.recordConsent(
            parseInt(userId),
            consentType,
            granted,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: req.body.metadata || {}
            }
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error recording consent:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET USER CONSENTS
 * Retrieve all consents for a user
 *
 * GET /api/gdpr/consents/:userId
 */
router.get('/consents/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Authorization check
        if (req.user && req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this user consents'
            });
        }

        const consents = await gdprService.getUserConsents(userId);

        res.json({
            success: true,
            userId,
            consents
        });

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error getting consents:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * REPORT DATA BREACH (Artículo 33-34 GDPR)
 * Report a data breach incident
 *
 * POST /api/gdpr/breach
 * Body:
 * {
 *   type: 'unauthorized_access',
 *   severity: 'high',
 *   affectedUsersCount: 150,
 *   description: 'Detailed breach description',
 *   detectedAt: '2025-11-20T10:00:00Z'
 * }
 *
 * ADMIN ONLY
 */
router.post('/breach', async (req, res) => {
    try {
        // Admin only
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only administrators can report data breaches'
            });
        }

        const breachInfo = req.body;

        // Validate required fields
        if (!breachInfo.type || !breachInfo.description) {
            return res.status(400).json({
                success: false,
                error: 'type and description are required'
            });
        }

        const result = await gdprService.reportDataBreach(breachInfo);

        res.json({
            success: true,
            ...result,
            warning: 'Data breach must be reported to authorities within 72 hours'
        });

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error reporting breach:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET COMPLIANCE STATISTICS
 * Get GDPR compliance metrics
 *
 * GET /api/gdpr/stats
 *
 * ADMIN ONLY
 */
router.get('/stats', async (req, res) => {
    try {
        // Admin only
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only administrators can view compliance statistics'
            });
        }

        const stats = gdprService.getComplianceStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        devLogger.error('GDPR-ROUTES', 'Error getting stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * HEALTH CHECK
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'GDPR Compliance',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
