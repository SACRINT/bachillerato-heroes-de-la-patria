const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const personalityService = require('./personality-profiling.service');

class AdaptiveContentService {

    /**
     * Obtener contenido adaptado para un nodo específico
     * Algoritmo de Selección:
     * 1. Obtener perfil del usuario (Visual, Auditivo, Kinestésico).
     * 2. Obtener nivel de maestría/dificultad preferida del usuario en el tema.
     * 3. Buscar adaptaciones disponibles que coincidan con estilo y dificultad.
     * 4. Si no hay coincidencia exacta de estilo, usar 'neutral' o fallback.
     * 5. Si no hay coincidencia exacta de dificultad, buscar la más cercana.
     */
    async getContentForNode(userId, nodeId) {
        // 1. Obtener Perfil & Maestría
        const profile = await personalityService.getProfile(userId);
        const userStyle = profile ? profile.dominant_style : 'visual'; // Default visual

        // Obtener Topic ID del nodo para buscar maestría
        const nodeRes = await pool.query('SELECT topic_id FROM adaptive_nodes WHERE id = $1', [nodeId]);
        if (nodeRes.rows.length === 0) throw new Error('Nodo no encontrado');
        const topicId = nodeRes.rows[0].topic_id;

        const masteryRes = await pool.query(
            'SELECT current_difficulty_preference FROM user_topic_mastery WHERE user_id = $1 AND topic_id = $2',
            [userId, topicId]
        );
        const userDifficulty = masteryRes.rows.length > 0 ? masteryRes.rows[0].current_difficulty_preference : 5; // Default 5

        // 2. Buscar Adaptaciones Candidatas
        const adaptationsRes = await pool.query(
            'SELECT * FROM content_adaptations WHERE node_id = $1',
            [nodeId]
        );
        const allAdaptations = adaptationsRes.rows;

        if (allAdaptations.length === 0) return null;

        // 3. Filtrar y Ordenar (Scoring System)
        const scoredAdaptations = allAdaptations.map(adapt => {
            let score = 0;

            // Match de Estilo (Peso Alto)
            if (adapt.target_style === userStyle) score += 10;
            else if (adapt.target_style === 'neutral') score += 5;

            // Match de Dificultad (Peso Medio) - Penalizar distancia
            const diffDistance = Math.abs(adapt.difficulty_level - userDifficulty);
            score += (10 - diffDistance); // Mayor score si distancia es 0

            return { adaptation: adapt, score };
        });

        // Ordenar por score descendente
        scoredAdaptations.sort((a, b) => b.score - a.score);

        // Retornar la mejor opción + metadatos de por qué se eligió
        const bestMatch = scoredAdaptations[0];

        return {
            content: bestMatch.adaptation,
            context: {
                userStyle,
                userDifficulty,
                matchScore: bestMatch.score,
                adaptationReason: `Optimizado para estilo ${userStyle} y nivel ${userDifficulty}`
            }
        };
    }

    /**
     * Registrar interacción y ajustar dificultad automáticamente
     */
    async logInteraction(userId, adaptationId, interactionData) {
        const { type, success, score } = interactionData;
        // type: 'view', 'quiz'
        // success: Boolean (completó exitosamente?)
        // score: Number (si es quiz)

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Guardar Log
            await client.query(`
                INSERT INTO adaptive_interaction_logs (user_id, adaptation_id, interaction_type, success_rate)
                VALUES ($1, $2, $3, $4)
            `, [userId, adaptationId, type, score]);

            // 2. Ajustar Nivel de Dificultad (Algoritmo Simplificado)
            if (type === 'quiz' || type === 'complete') {
                // Obtener topic_id
                const adaptRes = await client.query(`
                    SELECT n.topic_id 
                    FROM content_adaptations a
                    JOIN adaptive_nodes n ON a.node_id = n.id
                    WHERE a.id = $1
                `, [adaptationId]);

                if (adaptRes.rows.length > 0) {
                    const topicId = adaptRes.rows[0].topic_id;

                    // Lógica de Ajuste:
                    // Si score > 80% => Subir dificultad +1
                    // Si score < 40% => Bajar dificultad -1
                    let difficultyChange = 0;
                    if (score >= 80) difficultyChange = 1;
                    if (score <= 40) difficultyChange = -1;

                    if (difficultyChange !== 0) {
                        await client.query(`
                            INSERT INTO user_topic_mastery (user_id, topic_id, current_difficulty_preference)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (user_id, topic_id) DO UPDATE SET
                                current_difficulty_preference = GREATEST(1, LEAST(10, user_topic_mastery.current_difficulty_preference + $4)),
                                last_interaction_at = NOW()
                        `, [userId, topicId, 5 + difficultyChange, difficultyChange]); // Default 5+change si es insert

                        devLogger.log(`[Adaptive] User ${userId} difficulty adjusted by ${difficultyChange} for topic ${topicId}`);
                    }
                }
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new AdaptiveContentService();
