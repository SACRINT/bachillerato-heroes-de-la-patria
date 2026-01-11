"use strict";
/**
 * API REST - SISTEMA DE ENCUESTAS Y VOTACIONES - TypeScript
 * BGE Héroes de la Patria
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require("../utils/debug-logger");
// @ts-ignore
const sanitized_errors_1 = require("../utils/sanitized-errors");
// @ts-ignore
const database_1 = require("../config/database");

const pollsDAO = require("../data/polls.dao"); // ✅ Import DAO

const router = express_1.default.Router();

// ============================================
// UTILIDADES Y HELPERS
// ============================================
/**
 * Obtiene el fingerprint del votante para votaciones anónimas
 */
function getVoterFingerprint(req) {
    const userAgent = req.get('user-agent') || '';
    const acceptLanguage = req.get('accept-language') || '';
    // @ts-ignore
    const acceptEncoding = req.get('accept-encoding') || '';
    return Buffer.from(`${userAgent}-${acceptLanguage}-${acceptEncoding}`).toString('base64');
}

// ============================================
// LISTAR ENCUESTAS
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status = 'active', category, featured, search, limit = '20', offset = '0', sort = 'created_at', order = 'DESC' } = req.query;

        const polls = await pollsDAO.getPolls({
            status, category, featured, search, limit: parseInt(limit), offset: parseInt(offset), sort, order
        });

        const total = await pollsDAO.getPollsCount({
            status, category, featured, search
        });

        res.json({
            success: true,
            data: polls,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + polls.length < total
            }
        });
    } catch (error) {
        debug_logger_1.debugLog.error('POLLS', 'Error al listar encuestas:', (0, sanitized_errors_1.sanitizeError)(error, 'polls'));
        res.json({
            success: true,
            data: [],
            pagination: { total: 0, limit: 20, offset: 0, hasMore: false }
        });
    }
});

// ============================================
// OBTENER ENCUESTA ESPECÍFICA
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session?.userId;
        const voterIp = req.ip || 'unknown';
        const voterFingerprint = getVoterFingerprint(req);

        // 1. Obtener encuesta
        const poll = await pollsDAO.getPollById(id);
        if (!poll) {
            return res.status(404).json({ success: false, error: 'Encuesta no encontrada' });
        }

        // 2. Obtener detalles paralelos
        const [options, categories, hasVoted, userVote] = await Promise.all([
            pollsDAO.getPollOptions(id),
            pollsDAO.getPollCategories(id),
            pollsDAO.hasUserVoted(id, userId, voterIp, voterFingerprint),
            pollsDAO.getUserVote(id, userId, voterIp, voterFingerprint)
        ]);

        res.json({
            success: true,
            data: {
                ...poll,
                options,
                categories,
                user_has_voted: hasVoted,
                user_vote: userVote
            }
        });
    } catch (error) {
        debug_logger_1.debugLog.error('POLLS', 'Error al obtener encuesta:', (0, sanitized_errors_1.sanitizeError)(error, 'polls'));
        res.status(500).json({ success: false, error: 'Error al obtener la encuesta', details: error.message });
    }
});

/**
 * POST /api/polls
 * Crear nueva encuesta
 */
router.post('/', async (req, res) => {
    // TODO: Middleware auth real
    const userId = req.session?.userId || 1;
    const { title, options } = req.body;

    // Validaciones básicas
    if (!title || title.trim() === '') return res.status(400).json({ success: false, error: 'El título es requerido' });
    if (!options || options.length < 2) return res.status(400).json({ success: false, error: 'Debe proporcionar al menos 2 opciones' });

    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Crear Encuesta
        const poll = await pollsDAO.createPoll(client, {
            ...req.body,
            created_by: userId
        });

        // 2. Insertar Opciones
        for (let i = 0; i < options.length; i++) {
            await pollsDAO.addPollOption(client, poll.id, options[i], i);
        }

        // 3. Asociar Categorías
        if (req.body.categories && req.body.categories.length > 0) {
            for (const catId of req.body.categories) {
                await pollsDAO.addPollCategory(client, poll.id, catId);
            }
        }

        // 4. Obtener resultado completo
        const fullPoll = await pollsDAO.getFullPoll(client, poll.id);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Encuesta creada exitosamente',
            data: fullPoll
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debug_logger_1.debugLog.error('POLLS', 'Error al crear encuesta:', (0, sanitized_errors_1.sanitizeError)(error, 'polls'));
        res.status(500).json({ success: false, error: 'Error al crear la encuesta', details: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
//# sourceMappingURL=polls.js.map