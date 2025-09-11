/**
 * 🤖 RUTAS DEL CHATBOT INTELIGENTE
 * Endpoints para integración con base de datos y analytics
 */

const express = require('express');
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
        
        // Buscar en la base de conocimiento dinámica
        const searchQuery = `
            SELECT id, clave, categoria, titulo, contenido, prioridad, updated_at
            FROM informacion_dinamica 
            WHERE is_active = TRUE 
            AND (tipos_usuario_permitidos IS NULL 
                 OR JSON_CONTAINS(tipos_usuario_permitidos, ?))
            AND (MATCH(titulo, contenido) AGAINST(? IN NATURAL LANGUAGE MODE)
                 OR titulo LIKE ? 
                 OR JSON_EXTRACT(contenido, '$.*') LIKE ?)
            ORDER BY 
                CASE 
                    WHEN MATCH(titulo, contenido) AGAINST(? IN NATURAL LANGUAGE MODE) > 0 
                    THEN MATCH(titulo, contenido) AGAINST(? IN NATURAL LANGUAGE MODE) * prioridad
                    ELSE prioridad * 0.5
                END DESC,
                updated_at DESC
            LIMIT ?
        `;
        
        const searchTerms = `%${query}%`;
        const results = await executeQuery(searchQuery, [
            JSON.stringify(user_type),
            query,
            searchTerms,
            searchTerms,
            query,
            query,
            limit
        ]);

        // Si no hay resultados específicos, buscar en categorías relacionadas
        if (results.length === 0) {
            const categoryQuery = `
                SELECT id, clave, categoria, titulo, contenido, prioridad, updated_at
                FROM informacion_dinamica 
                WHERE is_active = TRUE 
                AND categoria IN (
                    SELECT DISTINCT categoria 
                    FROM informacion_dinamica 
                    WHERE titulo LIKE ? OR JSON_EXTRACT(contenido, '$.*') LIKE ?
                )
                ORDER BY prioridad DESC, updated_at DESC
                LIMIT ?
            `;
            
            const categoryResults = await executeQuery(categoryQuery, [
                searchTerms, 
                searchTerms, 
                Math.min(limit, 3)
            ]);
            
            return res.json({
                results: categoryResults,
                total: categoryResults.length,
                query: query,
                type: 'category_fallback'
            });
        }

        res.json({
            results: results,
            total: results.length,
            query: query,
            type: 'direct_match'
        });

    } catch (error) {
        console.error('Error en búsqueda de chatbot:', error);
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

        // Verificar o crear conversación
        let conversation = await executeQuery(
            'SELECT id FROM chat_conversations WHERE session_id = ?',
            [session_id]
        );

        let conversationId;
        
        if (conversation.length === 0) {
            // Crear nueva conversación
            const newConversation = await executeQuery(`
                INSERT INTO chat_conversations 
                (session_id, user_type, user_id, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)
            `, [
                session_id,
                user_type,
                user_id,
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent') || null
            ]);
            
            conversationId = newConversation.insertId;
        } else {
            conversationId = conversation[0].id;
        }

        // Registrar mensaje
        const messageStart = Date.now();
        
        await executeQuery(`
            INSERT INTO chat_messages 
            (conversation_id, sender_type, message, intent_detected, confidence_score, response_time_ms) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            conversationId,
            sender_type,
            message,
            intent,
            confidence,
            sender_type === 'bot' ? Date.now() - messageStart : null
        ]);

        // Actualizar contador de mensajes en conversación
        await executeQuery(`
            UPDATE chat_conversations 
            SET total_messages = total_messages + 1, last_activity = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [conversationId]);

        res.json({
            success: true,
            conversation_id: conversationId,
            message: 'Mensaje registrado correctamente'
        });

    } catch (error) {
        console.error('Error registrando mensaje:', error);
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
        
        const analytics = await executeQuery(`
            SELECT 
                DATE(started_at) as fecha,
                COUNT(*) as total_conversaciones,
                COUNT(DISTINCT user_id) as usuarios_unicos,
                COUNT(DISTINCT session_id) as sesiones_unicas,
                AVG(total_messages) as promedio_mensajes,
                AVG(satisfaction_rating) as satisfaccion_promedio,
                COUNT(CASE WHEN status = 'escalated' THEN 1 END) as conversaciones_escaladas
            FROM chat_conversations 
            WHERE DATE(started_at) = ?
            GROUP BY DATE(started_at)
        `, [date]);

        // Intents más frecuentes del día
        const topIntents = await executeQuery(`
            SELECT 
                intent_detected,
                COUNT(*) as frequency
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE DATE(c.started_at) = ? 
            AND intent_detected IS NOT NULL
            GROUP BY intent_detected
            ORDER BY frequency DESC
            LIMIT 10
        `, [date]);

        // Tiempo de respuesta promedio
        const responseTime = await executeQuery(`
            SELECT AVG(response_time_ms) as avg_response_time
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE DATE(c.started_at) = ? 
            AND sender_type = 'bot' 
            AND response_time_ms IS NOT NULL
        `, [date]);

        res.json({
            date: date,
            stats: analytics[0] || {
                fecha: date,
                total_conversaciones: 0,
                usuarios_unicos: 0,
                sesiones_unicas: 0,
                promedio_mensajes: 0,
                satisfaccion_promedio: null,
                conversaciones_escaladas: 0
            },
            top_intents: topIntents,
            avg_response_time: responseTime[0]?.avg_response_time || 0
        });

    } catch (error) {
        console.error('Error obteniendo analytics:', error);
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
            SET satisfaction_rating = ? 
            WHERE id = ?
        `, [rating, conversation_id]);

        // Registrar feedback detallado si hay comentario
        if (comment) {
            await executeQuery(`
                INSERT INTO chat_feedback 
                (conversation_id, feedback_type, rating, comment) 
                VALUES (?, 'suggestion', ?, ?)
            `, [conversation_id, rating, comment]);
        }

        res.json({
            success: true,
            message: 'Feedback registrado correctamente'
        });

    } catch (error) {
        console.error('Error registrando feedback:', error);
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
            WHERE categoria = ? 
            AND is_active = TRUE
            AND (tipos_usuario_permitidos IS NULL 
                 OR JSON_CONTAINS(tipos_usuario_permitidos, ?))
            ORDER BY prioridad DESC, updated_at DESC
        `, [category, JSON.stringify(user_type)]);

        res.json({
            category: category,
            items: information,
            total: information.length
        });

    } catch (error) {
        console.error('Error obteniendo información por categoría:', error);
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
                 OR JSON_CONTAINS(tipos_usuario_permitidos, ?))
            GROUP BY categoria
            ORDER BY total_items DESC
        `, [JSON.stringify(user_type)]);

        res.json({
            categories: categories,
            total: categories.length
        });

    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las categorías'
        });
    }
});

module.exports = router;