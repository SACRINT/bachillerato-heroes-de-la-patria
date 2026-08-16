const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');
const xpService = require('./xp.service.js');

class AchievementService {

    /**
     * Verifica y desbloquea un logro si cumple las condiciones.
     * Útil para logros de "estado" (ej: tiene perfil completo).
     */
    async unlockAchievement(userId, achievementCode) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener Logro
            const achievementRes = await client.query(
                `SELECT * FROM achievements WHERE code = $1 AND is_active = true`,
                [achievementCode]
            );

            if (achievementRes.rows.length === 0) {
                devLogger.warn(`[AchievementService] Logro ${achievementCode} no encontrado o inactivo.`);
                await client.query('ROLLBACK');
                return null;
            }

            const achievement = achievementRes.rows[0];

            // 2. Verificar si ya lo tiene
            const checkRes = await client.query(
                `SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2`,
                [userId, achievement.id]
            );

            if (checkRes.rows.length > 0) {
                // Ya lo tiene
                await client.query('ROLLBACK');
                return { status: 'already_earned', achievement };
            }

            // 3. Otorgar Logro
            await client.query(
                `INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES ($1, $2, NOW())`,
                [userId, achievement.id]
            );

            // 4. Recompensas (XP & Coins)
            let rewards = { xp: 0, iacoins: 0 };

            if (achievement.xp_reward > 0) {
                // Llamamos a XPService fuera de transaction o manejamos manual.
                // Como xpService es simple, haremos update manual para atomicidad
                await client.query(
                    `INSERT INTO xp_transactions (user_id, amount, source_type, description) 
                     VALUES ($1, $2, 'achievement', $3)`,
                    [userId, achievement.xp_reward, `Logro: ${achievement.name}`]
                );
                await client.query(
                    `UPDATE user_level_progress SET current_xp = current_xp + $1, updated_at = NOW() WHERE user_id = $2`,
                    [achievement.xp_reward, userId]
                );
                rewards.xp = achievement.xp_reward;
            }

            if (achievement.iacoins_reward > 0) {
                await client.query(
                    `UPDATE wallet SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW() WHERE user_id = $2`,
                    [achievement.iacoins_reward, userId]
                );
                await client.query(
                    `INSERT INTO wallet_history (user_id, transaction_type, amount, balance_after, description)
                     SELECT $1, 'earn', $2, balance, $3 FROM wallet WHERE user_id = $1`,
                    [userId, achievement.iacoins_reward, `Logro: ${achievement.name}`]
                );
                rewards.iacoins = achievement.iacoins_reward;
            }

            await client.query('COMMIT');

            devLogger.info(`[AchievementService] Usuario ${userId} desbloqueó: ${achievement.name}`);

            return {
                status: 'unlocked',
                achievement,
                rewards
            };

        } catch (error) {
            await client.query('ROLLBACK');
            devLogger.error(`[AchievementService] Error unlocking ${achievementCode}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualiza el progreso de un logro incremental (ej: 5/10 posts).
     * Si alcanza el target, lo desbloquea.
     */
    async updateProgress(userId, achievementCode, currentProgress, targetValue) {
        // Implementación futura para logros complejos
        // Por ahora, si current >= target, llamar a unlockAchievement
        if (currentProgress >= targetValue) {
            return await this.unlockAchievement(userId, achievementCode);
        }
        return null;
    }

    /**
     * Verifica logros relacionados con el Login (Hook automático)
     */
    async checkLoginAchievements(userId) {
        try {
            // 1. FIRST_STEPS: Primer Login (o simplemente login)
            // Si el trigger es 'login', intentamos darlo. El servicio ya maneja duplicados.
            await this.unlockAchievement(userId, 'FIRST_STEPS');

            const now = new Date();
            const hour = now.getHours(); // 0-23 Local Server Time

            // 2. NIGHT_OWL: Login después de las 10 PM (22:00)
            if (hour >= 22 || hour < 4) {
                await this.unlockAchievement(userId, 'NIGHT_OWL');
            }

            // 3. EARLY_BIRD: Login antes de las 7 AM (4:00 - 07:00)
            if (hour >= 4 && hour < 7) {
                await this.unlockAchievement(userId, 'EARLY_BIRD');
            }

        } catch (error) {
            devLogger.warn('[AchievementService] Error checking login achievements:', error);
            // No hacemos throw para no bloquear el login principal
        }
    }

    /**
     * Obtiene los logros del usuario con formato listo para UI.
     */
    async getUserAchievements(userId) {
        const query = `
            SELECT a.*, ua.earned_at, ua.is_claimed
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            WHERE a.is_active = true
            ORDER BY ua.earned_at DESC NULLS LAST, a.sort_order
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
    }
}

module.exports = new AchievementService();
