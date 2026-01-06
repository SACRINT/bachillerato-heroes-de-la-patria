const { executeQuery } = require('../config/database');

class MobileGamificationService {

    /**
     * Ejecuta el Daily Spin para un usuario
     * Retorna la recompensa ganada o error si ya giró hoy
     */
    async spinDailyWheel(userId) {
        // Verificar si ya giró hoy
        const existing = await executeQuery(
            'SELECT id FROM daily_spins WHERE user_id = $1 AND spin_date = CURRENT_DATE',
            [userId]
        );

        if (existing.length > 0) {
            throw new Error('Ya has girado la ruleta hoy. Vuelve mañana.');
        }

        // Determinar recompensa (Lógica simple de probabilidades)
        const rewards = [
            { type: 'xp', value: 50, weight: 40 },
            { type: 'xp', value: 100, weight: 30 },
            { type: 'powerup', value: 1, weight: 15 }, // ej. x2 XP por 1 hora
            { type: 'streak_freeze', value: 1, weight: 10 },
            { type: 'badge', value: 0, weight: 5 } // Rare
        ];

        const reward = this._weightedRandom(rewards);

        // Guardar resultado
        await executeQuery(
            'INSERT INTO daily_spins (user_id, reward_type, reward_value) VALUES ($1, $2, $3)',
            [userId, reward.type, reward.value]
        );

        // Aplicar efecto de la recompensa (ej. dar XP) - Simplificado aquí
        if (reward.type === 'xp') {
            await executeQuery('UPDATE gamification_profiles SET current_xp = current_xp + $1 WHERE user_id = $2', [reward.value, userId]);
        }

        return reward;
    }

    _weightedRandom(items) {
        let totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            if (random < item.weight) return item;
            random -= item.weight;
        }
        return items[0];
    }

    /**
     * Registra puntuación de minijuego
     */
    async submitGameScore(userId, gameId, score, combo) {
        await executeQuery(
            'INSERT INTO minigame_scores (user_id, game_id, score, combo_count) VALUES ($1, $2, $3, $4)',
            [userId, gameId, score, combo]
        );

        // Verificar milestones de juegos (ej. Score > 1000)
        // ... Logica futura

        return { success: true, newHighScore: false }; // Placeholder logic
    }
}

module.exports = new MobileGamificationService();
