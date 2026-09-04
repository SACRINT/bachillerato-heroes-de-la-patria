/**
 * 🛣️ RUTAS API: LANGGRAPH TUTOR ESCOLAR
 * Fase 6 - Backend Inteligente: Objetivo 3
 * Endpoints REST para interactuar con la Máquina de Estados / Grafo Socrático.
 * Protegido con autenticación JWT institucional (BGE Héroes de la Patria).
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const tutorService = require('../services/langgraph-tutor.service.js');
const { authenticateToken } = require('../middleware/auth.js');

/**
 * GET /api/tutor/graph/subjects
 * Obtener catálogo oficial de materias y temas del BGE (Ruta Pública)
 */
router.get('/subjects', (req, res) => {
    try {
        const subjects = tutorService.getSubjects();
        res.json({
            success: true,
            count: subjects.length,
            subjects
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Error al consultar catálogo de materias',
            details: err.message
        });
    }
});

/**
 * POST /api/tutor/graph/chat
 * Procesar mensaje del estudiante a través del grafo de estados pedagógico
 * Protegido: Requiere autenticación JWT de estudiante/docente/admin
 */
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { sessionId, message, subject, userId } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El campo "message" es obligatorio.'
            });
        }

        // FIX 5: Generación segura de session ID con crypto.randomUUID()
        const sid = sessionId || `session_${crypto.randomUUID()}`;
        const effectiveUserId = req.user ? req.user.id : (userId || null);

        const result = await tutorService.executeGraph(sid, message.trim(), subject || 'matematicas', effectiveUserId);

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('[ROUTE /api/tutor/graph/chat] Error:', err);
        res.status(500).json({
            success: false,
            error: 'Error procesando el turno conversacional en el grafo pedagógico',
            details: err.message
        });
    }
});

/**
 * POST /api/tutor/graph/interact (Alias para retrocompatibilidad)
 */
router.post('/interact', authenticateToken, async (req, res, next) => {
    req.url = '/chat';
    return router.handle(req, res, next);
});

/**
 * GET /api/tutor/graph/session/:sessionId
 * Consultar el estado y checkpoint actual de la sesión
 * Protegido: Requiere autenticación JWT
 */
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const state = await tutorService.getOrCreateSessionState(sessionId);
        res.json({
            success: true,
            state
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Error consultando estado de sesión',
            details: err.message
        });
    }
});

/**
 * POST /api/tutor/graph/session/reset
 * Reiniciar la sesión del grafo
 * Protegido: Requiere autenticación JWT
 */
router.post('/session/reset', authenticateToken, async (req, res) => {
    try {
        const { sessionId, subject } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere "sessionId" para reiniciar.'
            });
        }
        const newState = await tutorService.resetSession(sessionId, subject || 'matematicas');
        res.json({
            success: true,
            message: 'Sesión reiniciada con éxito',
            state: newState
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Error reiniciando sesión',
            details: err.message
        });
    }
});

module.exports = router;
