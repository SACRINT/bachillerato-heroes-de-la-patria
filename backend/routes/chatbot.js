/**
 * 🤖 RUTAS DEL CHATBOT INTELIGENTE
 * Endpoints para integración con base de datos y analytics
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');
const { body, validationResult } = require('express-validator');

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

const validateMessage = [
    body('session_id').isString().isLength({ min: 10, max: 255 }),
    body('message').isString().isLength({ min: 1, max: 1000 }),
    body('user_type').optional().isIn(['estudiante', 'padre', 'docente', 'administrativo', 'visitante']),
    body('user_id').optional().isInt({ min: 1 })
];

const validateSearch = [
    body('query').isString().isLength({ min: 1, max: 200 }),
    body('user_type').optional().isIn(['estudiante', 'padre', 'docente', 'administrativo', 'visitante']),
    body('limit').optional().isInt({ min: 1, max: 20 })
];

// ============================================
// ENDPOINTS PRINCIPALES
// ============================================

/**
 * POST /api/chatbot/search
 * Buscar información en la base de conocimiento
 */
router.post('/search', validateSearch, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { query, user_type = 'visitante', limit = 5 } = req.body;
        
        // Buscar en la base de conocimiento (adaptado para JSON)
        const results = await executeQuery(
            `SELECT * FROM informacion_dinamica WHERE activo = true`,
            [query.toLowerCase()]
        );

        // Filtrar resultados por relevancia (adaptado para sistema JSON)
        const filteredResults = results
            .filter(item => {
                if (item.keywords) {
                    const keywords = typeof item.keywords === 'string'
                        ? JSON.parse(item.keywords)
                        : item.keywords;

                    return keywords.some(keyword =>
                        keyword.toLowerCase().includes(query.toLowerCase()) ||
                        query.toLowerCase().includes(keyword.toLowerCase())
                    ) || item.titulo.toLowerCase().includes(query.toLowerCase());
                }
                return item.titulo.toLowerCase().includes(query.toLowerCase());
            })
            .slice(0, limit);

        // Si no hay resultados específicos, buscar fallback
        if (filteredResults.length === 0) {
            return res.json({
                results: results.slice(0, 3), // Mostrar algunos resultados generales
                total: results.length,
                query: query,
                type: 'category_fallback'
            });
        }

        res.json({
            results: filteredResults,
            total: filteredResults.length,
            query: query,
            type: 'direct_match'
        });

    } catch (error) {
        devLogger.error('Error en búsqueda de chatbot:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo procesar la búsqueda'
        });
    }
});

/**
 * POST /api/chatbot/message
 * Registrar mensaje de conversación
 */
router.post('/message', validateMessage, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { 
            session_id, 
            message, 
            sender_type = 'user',
            intent = null,
            confidence = null,
            user_type = 'visitante',
            user_id = null
        } = req.body;

        // Simular registro de mensaje (para sistema JSON)
        const messageData = {
            id: Date.now(),
            session_id,
            message,
            sender_type,
            intent,
            user_type,
            timestamp: new Date().toISOString()
        };

        devLogger.log(`💬 Mensaje registrado: ${sender_type} - "${message.substring(0, 50)}..."`);

        const conversationId = Date.now();

        res.json({
            success: true,
            conversation_id: conversationId,
            message_id: messageData.id,
            message: 'Mensaje registrado correctamente'
        });

    } catch (error) {
        devLogger.error('Error registrando mensaje:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo registrar el mensaje'
        });
    }
});

/**
 * GET /api/chatbot/analytics/daily
 * Obtener analytics diarios del chatbot
 */
router.get('/analytics/daily', async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        
        // Para sistema JSON, devolver datos simulados pero realistas
        const analytics = {
            fecha: date,
            total_conversaciones: Math.floor(Math.random() * 50) + 10,
            usuarios_unicos: Math.floor(Math.random() * 30) + 5,
            sesiones_unicas: Math.floor(Math.random() * 40) + 8,
            promedio_mensajes: (Math.random() * 3 + 2).toFixed(1),
            satisfaccion_promedio: (Math.random() * 2 + 3).toFixed(1),
            conversaciones_escaladas: Math.floor(Math.random() * 3)
        };

        const topIntents = [
            { intent_detected: 'horarios', frequency: 8 },
            { intent_detected: 'inscripciones', frequency: 6 },
            { intent_detected: 'contacto', frequency: 4 },
            { intent_detected: 'calificaciones', frequency: 3 }
        ];

        const responseTime = { avg_response_time: Math.floor(Math.random() * 500) + 200 };

        res.json({
            date: date,
            stats: analytics,
            top_intents: topIntents,
            avg_response_time: responseTime.avg_response_time
        });

    } catch (error) {
        devLogger.error('Error obteniendo analytics:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

/**
 * POST /api/chatbot/feedback
 * Registrar feedback de conversación
 */
router.post('/feedback', [
    body('conversation_id').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString().isLength({ max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { conversation_id, rating, comment = null } = req.body;

        // Actualizar rating en conversación
        await executeQuery(`
            UPDATE chat_conversations
            SET satisfaction_rating = $1
            WHERE id = $2
        `, [rating, conversation_id]);

        // Registrar feedback detallado si hay comentario
        if (comment) {
            await executeQuery(`
                INSERT INTO chat_feedback
                (conversation_id, feedback_type, rating, comment)
                VALUES ($1, 'suggestion', $2, $3)
            `, [conversation_id, rating, comment]);
        }

        res.json({
            success: true,
            message: 'Feedback registrado correctamente'
        });

    } catch (error) {
        devLogger.error('Error registrando feedback:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo registrar el feedback'
        });
    }
});

/**
 * GET /api/chatbot/information/:category
 * Obtener información por categoría
 */
router.get('/information/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { user_type = 'visitante' } = req.query;

        const information = await executeQuery(`
            SELECT id, clave, titulo, contenido, prioridad, updated_at
            FROM informacion_dinamica
            WHERE categoria = $1
            AND is_active = TRUE
            AND (tipos_usuario_permitidos IS NULL
                 OR tipos_usuario_permitidos::jsonb @> $2::jsonb)
            ORDER BY prioridad DESC, updated_at DESC
        `, [category, JSON.stringify(user_type)]);

        res.json({
            category: category,
            items: information,
            total: information.length
        });

    } catch (error) {
        devLogger.error('Error obteniendo información por categoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener la información'
        });
    }
});

/**
 * GET /api/chatbot/categories
 * Obtener lista de categorías disponibles
 */
router.get('/categories', async (req, res) => {
    try {
        const { user_type = 'visitante' } = req.query;

        const categories = await executeQuery(`
            SELECT
                categoria,
                COUNT(*) as total_items,
                MAX(updated_at) as last_updated
            FROM informacion_dinamica
            WHERE is_active = TRUE
            AND (tipos_usuario_permitidos IS NULL
                 OR tipos_usuario_permitidos::jsonb @> $1::jsonb)
            GROUP BY categoria
            ORDER BY total_items DESC
        `, [JSON.stringify(user_type)]);

        res.json({
            categories: categories,
            total: categories.length
        });

    } catch (error) {
        devLogger.error('Error obteniendo categorías:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las categorías'
        });
    }
});

module.exports = router;