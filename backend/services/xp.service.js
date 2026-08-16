const pool = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

class XPService {

    /**
     * Otorga XP a un usuario y maneja la subida de nivel.
     * @param {number} userId 
     * @param {number} amount 
     * @param {string} source (e.g. 'quiz', 'streak')
     * @param {string} description 
     * @returns {Object} Resultado con nivel anterior, nuevo nivel y si subió de nivel.
     */
    async awardXP(userId, amount, source, description) {
        if (amount <= 0) return null;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener o crear progreso del usuario
            let progressRes = await client.query(
                `SELECT * FROM user_level_progress WHERE user_id = $1 FOR UPDATE`,
                [userId]
            );

            if (progressRes.rows.length === 0) {
                // Inicializar
                await client.query(
                    `INSERT INTO user_level_progress (user_id, current_level, current_xp) VALUES ($1, 1, 0)`,
                    [userId]
                );
                progressRes = await client.query(
                    `SELECT * FROM user_level_progress WHERE user_id = $1 FOR UPDATE`,
                    [userId]
                );
            }

            const currentProgress = progressRes.rows[0];
            const oldLevel = currentProgress.current_level;
            const newTotalXP = currentProgress.current_xp + amount;

            // 2. Calcular nuevo nivel
            // Buscamos el nivel más alto donde xp_required <= newTotalXP
            const levelRes = await client.query(
                `SELECT level FROM leveling_config WHERE xp_required <= $1 ORDER BY level DESC LIMIT 1`,
                [newTotalXP]
            );

            let newLevel = oldLevel;
            if (levelRes.rows.length > 0) {
                newLevel = levelRes.rows[0].level;
            }

            // Fallback si superamos el nivel máximo definido en DB (cap at max level found)
            // Opcional: Implementar lógica de niveles infinitos

            const leveledUp = newLevel > oldLevel;

            // 3. Registrar transacción
            await client.query(
                `INSERT INTO xp_transactions (user_id, amount, source_type, description) VALUES ($1, $2, $3, $4)`,
                [userId, amount, source, description]
            );

            // 4. Actualizar progreso
            await client.query(
                `UPDATE user_level_progress 
                 SET current_xp = $1, current_level = $2, 
                     last_level_up_date = CASE WHEN $3 THEN NOW() ELSE last_level_up_date END,
                     updated_at = NOW()
                 WHERE user_id = $4`,
                [newTotalXP, newLevel, leveledUp, userId]
            );

            // 5. Si subió de nivel, podríamos dar recompensas adicionales (e.g. IACoins)
            // Esto se podría manejar via eventos o aquí mismo si es simple
            let levelUpRewards = [];
            if (leveledUp) {
                // Ejemplo: 50 IACoins por nivel
                const coinsReward = 50 * (newLevel - oldLevel);
                // Llamada a WalletService o Query directa (simplificado aquí)
                /* 
                await client.query('UPDATE wallet SET balance = balance + $1 WHERE user_id = $2', [coinsReward, userId]);
                levelUpRewards.push({ type: 'iacoins', amount: coinsReward });
                */
            }

            await client.query('COMMIT');

            devLogger.info(`[XPService] User ${userId} awarded ${amount} XP. Level: ${oldLevel} -> ${newLevel}`);

            return {
                amountAwared: amount,
                oldLevel,
                newLevel,
                leveledUp,
                currentXP: newTotalXP,
                rewards: levelUpRewards
            };

        } catch (error) {
            await client.query('ROLLBACK');
            devLogger.error('[XPService] Error awarding XP:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene el perfil de XP detallado del usuario (progreso, siguiente nivel, etc.)
     */
    async getXPProfile(userId) {
        try {
            // Left join para asegurar que devolvemos datos aunque no tenga registro (defaults)
            const query = `
                SELECT 
                    p.current_level, 
                    p.current_xp,
                    lc.title as level_title,
                    lc.xp_to_next_level as xp_for_next,
                    lc_next.xp_required as next_level_xp_req
                FROM user_level_progress p
                LEFT JOIN leveling_config lc ON p.current_level = lc.level
                LEFT JOIN leveling_config lc_next ON p.current_level + 1 = lc_next.level
                WHERE p.user_id = $1
            `;

            const res = await pool.query(query, [userId]);

            if (res.rows.length === 0) {
                return {
                    current_level: 1,
                    current_xp: 0,
                    level_title: 'Novato',
                    progress_percent: 0,
                    xp_to_next: 100
                };
            }

            const data = res.rows[0];
            const nextLevelReq = data.next_level_xp_req || (data.current_xp + 1000); // Fallback si es nivel max
            const currentLevelBaseXP = data.next_level_xp_req - data.xp_for_next; // Aprox

            // Calculo de porcentaje dentro del nivel actual
            // XP del nivel actual = current_xp - (xp_required del nivel actual)
            // Necesitamos xp_required del nivel actual para precisión
            // Simplificación:

            // Mejor query para progreso exacto:
            // Obtener XP del nivel actual y XP del siguiente
            /*
             Pero por ahora usaremos una aprox robusta con lo que tenemos o haríamos otra query.
            */

            return {
                ...data,
                // Progreso relativo al nivel (UI friendly)
                // TODO: Refinar cálculo matemático con base de datos real
            };

        } catch (error) {
            devLogger.error('[XPService] Error getting profile:', error);
            throw error;
        }
    }
}

module.exports = new XPService();
