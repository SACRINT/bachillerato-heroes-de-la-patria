/**
 * 🧠 RECOMMENDATIONS SERVICE
 * Propósito: Generar y servir recomendaciones de contenido personalizadas (Fase 5 - Semana 38)
 */

const { executeQuery } = require('../config/database.js');

class RecommendationsService {

    // --- INTERACTION LOGGING ---

    async logInteraction(userId, contentType, contentId, interactionType) {
        let weight = 1.0;

        // Define weights logic
        switch (interactionType) {
            case 'view': weight = 1.0; break;
            case 'complete': weight = 3.0; break;
            case 'like': weight = 5.0; break;
            case 'high_score': weight = 8.0; break;
            case 'dropout': weight = -1.0; break;
            default: weight = 1.0;
        }

        const query = `
            INSERT INTO user_interaction_logs (user_id, content_type, content_id, interaction_type, weight_score)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await executeQuery(query, [userId, contentType, contentId, interactionType, weight]);

        // Trigger async recommendation update (in background usually, here synchronous for proto)
        // await this.refreshRecommendations(userId);
    }

    // --- GENERATION ENGINE ---

    async refreshRecommendations(userId) {
        // 1. Get User Profile & History
        const prefsRes = await executeQuery('SELECT * FROM user_learning_preferences WHERE user_id = $1', [userId]);
        const prefs = prefsRes[0] || { favorite_topics: [] };

        const history = await executeQuery(
            'SELECT content_type, content_id FROM user_interaction_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
            [userId]
        );

        // 2. Simple Content-Based Filtering (Tag Matching)
        // Find contents that match favorite topics
        let contentBasedRecs = [];
        if (prefs && prefs.favorite_topics && prefs.favorite_topics.length > 0) {
            // Nota: Esto asume que tendríamos una tabla unificada de contenidos o buscaríamos en cada tabla.
            // Para este prototipo, simularemos buscar en 'studio_templates' o 'video_metadata' basado en strings.
            // Real implementation would use ElasticSearch or specialized View.
        }

        // 3. Trending / Popular (Fallback)
        const trendingRecs = await this._getTrendingContent();

        // 4. Save to Cache
        await executeQuery('DELETE FROM content_recommendations WHERE user_id = $1', [userId]);

        for (const item of trendingRecs) {
            await executeQuery(
                `INSERT INTO content_recommendations (user_id, recommended_content_type, recommended_content_id, score, reason, algorithm_source)
                 VALUES ($1, $2, $3, $4, $5, 'trending')`,
                [userId, item.type, item.id, item.score, 'Popular entre tus compañeros']
            );
        }
    }

    async getRecommendations(userId) {
        const cached = await executeQuery(
            'SELECT * FROM content_recommendations WHERE user_id = $1 ORDER BY score DESC LIMIT 10',
            [userId]
        );

        if (cached.length === 0) {
            // Force refresh if empty
            await this.refreshRecommendations(userId);
            return await this.getRecommendations(userId); // Retry once
        }

        // Enrich data (Fetch titles, thumbnails)
        const enriched = [];
        for (const item of cached) {
            const details = await this._fetchContentDetails(item.recommended_content_type, item.recommended_content_id);
            if (details) {
                enriched.push({ ...item, details });
            }
        }
        return enriched;
    }

    // --- HELPERS ---

    async _getTrendingContent() {
        // Aggregate interactions to find popular items in last 7 days
        // Mock result for now as tables might be empty
        // In real SQL: 
        // SELECT content_type, content_id, SUM(weight_score) as score 
        // FROM user_interaction_logs 
        // GROUP BY content_type, content_id ORDER BY score DESC LIMIT 5

        // Returning mock mix
        return [
            { type: 'video', id: 1, score: 95 },
            { type: 'lab', id: 1, score: 88 }
        ];
    }

    async _fetchContentDetails(type, id) {
        try {
            if (type === 'video') {
                const res = await executeQuery('SELECT title, description, thumbnail_url FROM video_metadata WHERE id = $1', [id]);
                return res[0];
            } else if (type === 'lab') {
                const res = await executeQuery('SELECT title, description FROM virtual_labs WHERE id = $1', [id]);
                return res[0];
            }
        } catch (e) { return null; }
        return null;
    }
}

module.exports = new RecommendationsService();
