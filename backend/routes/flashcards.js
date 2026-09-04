/**
 * 🛣️ RUTAS API: FLASHCARDS MNEMOTÉCNICAS Y MOTOR FSRS v4
 * Fase 6 - Objetivo 4: Repetición Espaciada para el Bachillerato General Estatal
 * 
 * Endpoints REST protegidos para mazos, tarjetas, cola de repaso y registro FSRS.
 * Incluye Rate Limiting (30/min), Guardián de Concurrencia (<5s) y Gamificación (+2/+10 IA Coins).
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const fsrsService = require('../services/fsrs.service.js');
const { authenticateToken, optionalAuth } = require('../middleware/auth.js');
const devLogger = require('../utils/devLogger.js');

// =============================================================================
// RATE LIMITING (Ajuste 3 de Auditoría)
// Límite: 30 calificaciones por minuto por usuario/IP
// =============================================================================
const reviewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // Máximo 30 calificaciones por minuto
    keyGenerator: (req) => String(req.user?.id || req.ip),
    message: {
        success: false,
        error: 'Límite de calificaciones alcanzado. Puedes realizar hasta 30 repasos por minuto.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * GET /api/flashcards/decks
 * Listar mazos curriculares disponibles (con filtro opcional por materia)
 * Acceso: Público / Opcional Auth
 */
router.get('/decks', optionalAuth, async (req, res) => {
    try {
        const { subject } = req.query;
        const decks = await fsrsService.getDecks(subject);
        res.json({
            success: true,
            count: decks.length,
            decks
        });
    } catch (err) {
        devLogger.error('Error al listar mazos:', err);
        res.status(500).json({
            success: false,
            error: 'Error al consultar mazos de flashcards',
            details: err.message
        });
    }
});

/**
 * GET /api/flashcards/decks/:id
 * Consultar detalles de un mazo
 */
router.get('/decks/:id', optionalAuth, async (req, res) => {
    try {
        const deckId = parseInt(req.params.id);
        if (isNaN(deckId)) {
            return res.status(400).json({ success: false, error: 'ID de mazo inválido' });
        }
        const deck = await fsrsService.getDeckById(deckId);
        if (!deck) {
            return res.status(404).json({ success: false, error: 'Mazo no encontrado' });
        }
        res.json({ success: true, deck });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error al consultar mazo', details: err.message });
    }
});

/**
 * GET /api/flashcards/decks/:id/cards
 * Obtener las tarjetas de un mazo
 */
router.get('/decks/:id/cards', optionalAuth, async (req, res) => {
    try {
        const deckId = parseInt(req.params.id);
        if (isNaN(deckId)) {
            return res.status(400).json({ success: false, error: 'ID de mazo inválido' });
        }
        const cards = await fsrsService.getDeckCards(deckId);
        res.json({
            success: true,
            deck_id: deckId,
            count: cards.length,
            cards
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Error al consultar tarjetas del mazo',
            details: err.message
        });
    }
});

/**
 * POST /api/flashcards/decks
 * Crear un nuevo mazo (Docentes / Administradores / Estudiantes autorizados)
 */
router.post('/decks', authenticateToken, async (req, res) => {
    try {
        const { subject, name, description, category } = req.body;
        if (!subject || !name) {
            return res.status(400).json({
                success: false,
                error: 'Los campos "subject" y "name" son requeridos.'
            });
        }
        const deck = await fsrsService.createDeck({
            subject,
            name,
            description,
            category: category || 'Personal',
            tenant_id: 1,
            created_by: req.user.id
        });
        res.status(201).json({ success: true, deck });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error al crear mazo', details: err.message });
    }
});

/**
 * POST /api/flashcards/decks/:id/cards
 * Agregar una tarjeta a un mazo existente
 */
router.post('/decks/:id/cards', authenticateToken, async (req, res) => {
    try {
        const deckId = parseInt(req.params.id);
        const { front, back, hints, difficulty } = req.body;
        if (isNaN(deckId) || !front || !back) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere "front" y "back" válidos.'
            });
        }
        const card = await fsrsService.createCard({
            deck_id: deckId,
            front,
            back,
            hints: hints || '',
            difficulty: difficulty || 3
        });
        res.status(201).json({ success: true, card });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error al agregar tarjeta', details: err.message });
    }
});

/**
 * GET /api/flashcards/due
 * Obtener tarjetas pendientes de repaso para el estudiante autenticado
 */
router.get('/due', authenticateToken, async (req, res) => {
    try {
        const { subject, deckId, limit } = req.query;
        const dueCards = await fsrsService.getDueCards(
            req.user.id,
            subject || null,
            deckId ? parseInt(deckId) : null,
            limit ? parseInt(limit) : 50
        );
        res.json({
            success: true,
            user_id: req.user.id,
            count: dueCards.length,
            cards: dueCards
        });
    } catch (err) {
        devLogger.error('Error al consultar tarjetas pendientes:', err);
        res.status(500).json({
            success: false,
            error: 'Error al consultar tarjetas pendientes',
            details: err.message
        });
    }
});

/**
 * POST /api/flashcards/review
 * Registrar calificación FSRS de una tarjeta (1: Again, 2: Hard, 3: Good, 4: Easy)
 * Protegido con: JWT Auth + Rate Limiting (30/min) + Concurrent Review Guard (<5s)
 */
router.post('/review', authenticateToken, reviewLimiter, async (req, res) => {
    try {
        const { cardId, grade } = req.body;
        if (!cardId || grade === undefined || grade === null) {
            return res.status(400).json({
                success: false,
                error: 'Los campos "cardId" y "grade" (1 a 4) son obligatorios.'
            });
        }

        const numericGrade = parseInt(grade);
        if (numericGrade < 1 || numericGrade > 4) {
            return res.status(400).json({
                success: false,
                error: 'La calificación "grade" debe ser: 1 (Again), 2 (Hard), 3 (Good) o 4 (Easy).'
            });
        }

        // Ejecutar revisión en el servicio FSRS
        const result = await fsrsService.reviewCard(parseInt(cardId), req.user.id, numericGrade);

        // AJUSTE 4: Manejo de concurrencia (<5s)
        if (!result.success) {
            return res.status(409).json(result);
        }

        res.json(result);
    } catch (err) {
        devLogger.error('Error registrando calificación FSRS:', err);
        res.status(500).json({
            success: false,
            error: 'Error procesando la calificación FSRS',
            details: err.message
        });
    }
});

/**
 * GET /api/flashcards/stats
 * Consultar métricas de retención, rachas y tarjetas memorizadas del alumno
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await fsrsService.getUserStats(req.user.id);
        res.json({
            success: true,
            user_id: req.user.id,
            stats
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Error al consultar estadísticas FSRS',
            details: err.message
        });
    }
});

/**
 * POST /api/flashcards/generate
 * Generar automáticamente un mazo desde templates predefinidos por materia (Ajuste 5 - Opción A)
 */
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { subject, title } = req.body;
        if (!subject) {
            return res.status(400).json({
                success: false,
                error: 'El campo "subject" es requerido (ej: matematicas, fisica, quimica).'
            });
        }
        const generated = await fsrsService.generateDeckFromCorpus(
            subject.toLowerCase(),
            title || null,
            1,
            req.user.id
        );
        res.status(201).json({
            success: true,
            message: `Mazo generado exitosamente con ${generated.cardsCount} tarjetas curriculares`,
            data: generated
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Error generando mazo de flashcards',
            details: err.message
        });
    }
});

module.exports = router;
