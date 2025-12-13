"use strict";
/**
 * 🏆 CHALLENGES ROUTES - SISTEMA DE RETOS v2.0 - TypeScript
 * Gestión de desafíos educativos, streaks y recompensas
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const ChallengesService_1 = __importDefault(require("../services/ChallengesService"));
const database_access_1 = require("../data/database-access");
const router = express_1.default.Router();
// ============================================
// MIDDLEWARE
// ============================================
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'Error de validación', errors: errors.array() });
        return;
    }
    next();
};
// =====================================
// OBTENER RETOS
// =====================================
/**
 * GET /api/challenges
 */
router.get('/', auth_1.authenticateToken, [
    (0, express_validator_1.query)('category').optional().isIn(['academic', 'social', 'creative', 'physical', 'daily']),
    (0, express_validator_1.query)('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
    (0, express_validator_1.query)('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'one-time', 'event']),
    (0, express_validator_1.query)('subject').optional().isString().isLength({ max: 100 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
], validate, async (req, res) => {
    try {
        const userId = req.user.id;
        const options = {
            category: req.query.category,
            difficulty: req.query.difficulty,
            frequency: req.query.frequency,
            subject: req.query.subject,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        const challenges = await ChallengesService_1.default.getAvailableChallenges(userId, options);
        const grouped = {
            all: challenges,
            daily: challenges.filter(c => c.frequency === 'daily'),
            weekly: challenges.filter(c => c.frequency === 'weekly'),
            monthly: challenges.filter(c => c.frequency === 'monthly'),
            oneTime: challenges.filter(c => c.frequency === 'one-time')
        };
        const frequencyKey = req.query.frequency;
        res.json({
            success: true,
            data: frequencyKey ? grouped[frequencyKey] || challenges : challenges,
            summary: {
                total: challenges.length,
                completed: challenges.filter(c => c.user_status === 'claimed').length,
                in_progress: challenges.filter(c => c.user_status === 'in_progress').length,
                available: challenges.filter(c => !c.user_status).length
            },
            pagination: {
                limit: options.limit,
                offset: options.offset,
                count: challenges.length
            }
        });
    }
    catch (error) {
        console.error('[CHALLENGES] Error obteniendo retos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener retos' });
    }
});
/**
 * GET /api/challenges/daily
 */
router.get('/daily', auth_1.authenticateToken, async (req, res) => {
    try {
        const challenges = await ChallengesService_1.default.getDailyChallenges(req.user.id);
        res.json({ success: true, data: challenges });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener retos diarios' });
    }
});
/**
 * GET /api/challenges/featured
 */
router.get('/featured', auth_1.authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const challenges = await ChallengesService_1.default.getFeaturedChallenges(req.user.id, limit);
        res.json({ success: true, data: challenges });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener retos destacados' });
    }
});
/**
 * GET /api/challenges/user/streaks
 */
router.get('/user/streaks', auth_1.authenticateToken, async (req, res) => {
    try {
        const streaks = await ChallengesService_1.default.getUserStreaks(req.user.id);
        res.json({ success: true, data: streaks });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener streaks' });
    }
});
/**
 * GET /api/challenges/user/stats
 */
router.get('/user/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await ChallengesService_1.default.getUserChallengeStats(req.user.id);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});
/**
 * GET /api/challenges/streaks/multiplier
 */
router.get('/streaks/multiplier', auth_1.authenticateToken, async (req, res) => {
    try {
        const multiplier = await ChallengesService_1.default.getStreakMultiplier(req.user.id);
        res.json({ success: true, data: { multiplier, percentage: Math.round((multiplier - 1) * 100) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener multiplicador' });
    }
});
/**
 * GET /api/challenges/meta/categories
 */
router.get('/meta/categories', async (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'academic', name: 'Académico', icon: 'fa-graduation-cap', color: '#4a90d9' },
            { id: 'social', name: 'Social', icon: 'fa-users', color: '#6c5ce7' },
            { id: 'creative', name: 'Creativo', icon: 'fa-paint-brush', color: '#e17055' },
            { id: 'physical', name: 'Físico', icon: 'fa-running', color: '#00b894' },
            { id: 'daily', name: 'Diario', icon: 'fa-calendar-day', color: '#f5a623' }
        ]
    });
});
/**
 * GET /api/challenges/meta/subjects
 */
router.get('/meta/subjects', async (req, res) => {
    res.json({ success: true, data: ChallengesService_1.default.subjects });
});
/**
 * GET /api/challenges/:id
 */
router.get('/:id', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const challenge = await ChallengesService_1.default.getChallengeById(parseInt(req.params.id), req.user.id);
        if (!challenge) {
            res.status(404).json({ success: false, message: 'Reto no encontrado' });
            return;
        }
        res.json({ success: true, data: challenge });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener reto' });
    }
});
// =====================================
// ACCIONES DE RETOS
// =====================================
/**
 * POST /api/challenges/:id/start
 */
router.post('/:id/start', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const result = await ChallengesService_1.default.startChallenge(req.user.id, parseInt(req.params.id));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Error al iniciar reto' });
    }
});
/**
 * POST /api/challenges/:id/progress
 */
router.post('/:id/progress', auth_1.authenticateToken, [
    (0, express_validator_1.param)('id').isInt({ min: 1 }),
    (0, express_validator_1.body)('increment').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
    try {
        const result = await ChallengesService_1.default.updateProgress(req.user.id, parseInt(req.params.id), req.body.increment || 1, req.body.progressData);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Error al actualizar progreso' });
    }
});
/**
 * POST /api/challenges/:id/complete
 */
router.post('/:id/complete', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const progressResult = await ChallengesService_1.default.updateProgress(req.user.id, parseInt(req.params.id), 1000);
        if (!progressResult.completed) {
            res.json(progressResult);
            return;
        }
        const claimResult = await ChallengesService_1.default.claimReward(req.user.id, parseInt(req.params.id));
        res.json({ success: true, ...claimResult, challenge: { id: parseInt(req.params.id) } });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Error al completar reto' });
    }
});
/**
 * POST /api/challenges/:id/claim
 */
router.post('/:id/claim', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const result = await ChallengesService_1.default.claimReward(req.user.id, parseInt(req.params.id));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Error al reclamar recompensa' });
    }
});
/**
 * POST /api/challenges/streaks/update
 */
router.post('/streaks/update', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await ChallengesService_1.default.updateStreak(req.user.id, req.body.streakType || 'daily_login');
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar streak' });
    }
});
/**
 * POST /api/challenges/:id/join
 */
router.post('/:id/join', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const result = await ChallengesService_1.default.joinCollaborativeChallenge(req.user.id, parseInt(req.params.id));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Error al unirse al reto' });
    }
});
/**
 * GET /api/challenges/:id/participants
 */
router.get('/:id/participants', auth_1.authenticateToken, [(0, express_validator_1.param)('id').isInt({ min: 1 })], validate, async (req, res) => {
    try {
        const participants = await ChallengesService_1.default.getCollaborativeParticipants(parseInt(req.params.id));
        res.json({ success: true, data: participants });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener participantes' });
    }
});
// =====================================
// ADMIN ENDPOINTS
// =====================================
/**
 * POST /api/challenges
 */
router.post('/', auth_1.authenticateToken, [
    (0, express_validator_1.body)('title').isString().isLength({ min: 3, max: 200 }),
    (0, express_validator_1.body)('description').isString().isLength({ min: 10 }),
    (0, express_validator_1.body)('category').isIn(['academic', 'social', 'creative', 'physical', 'daily']),
    (0, express_validator_1.body)('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
    (0, express_validator_1.body)('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'one-time', 'event']),
    (0, express_validator_1.body)('reward_coins').optional().isInt({ min: 1, max: 1000 }),
    (0, express_validator_1.body)('reward_xp').optional().isInt({ min: 1, max: 5000 })
], validate, async (req, res) => {
    try {
        if (!['admin', 'administrativo'].includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Solo administradores pueden crear retos' });
            return;
        }
        const { title, description, category, subject, difficulty = 'medium', challenge_type = 'assignment', frequency = 'one-time', reward_coins = 10, reward_xp = 50, completion_criteria = {}, start_date, end_date, is_collaborative = false, min_participants = 1, max_participants, icon = 'fa-trophy' } = req.body;
        const query = `
            INSERT INTO challenges (
                title, description, category, subject, difficulty,
                challenge_type, frequency, reward_coins, reward_xp,
                completion_criteria, start_date, end_date,
                is_collaborative, min_participants, max_participants, icon
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            )
            RETURNING *
        `;
        const result = await (0, database_access_1.executeQuery)(query, [
            title, description, category, subject, difficulty,
            challenge_type, frequency, reward_coins, reward_xp,
            JSON.stringify(completion_criteria), start_date, end_date,
            is_collaborative, min_participants, max_participants, icon
        ]);
        res.status(201).json({ success: true, data: result[0], message: 'Reto creado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear reto' });
    }
});
exports.default = router;
//# sourceMappingURL=challenges.js.map