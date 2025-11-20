/**
 * 🌟 LEVELS SERVICE
 * Servicio para sistema de niveles, XP y badges
 * FASE 1 - Semana 7-8
 */

const { executeQuery } = require('../data/database-access');

class LevelsService {
    constructor() {
        // Cache de niveles (se carga una vez)
        this.levelsCache = null;
        this.badgesCache = null;
    }

    // =====================================
    // GESTIÓN DE NIVELES
    // =====================================

    /**
     * Obtiene todas las definiciones de niveles
     */
    async getLevelDefinitions() {
        if (this.levelsCache) return this.levelsCache;

        const query = `
            SELECT * FROM level_definitions
            ORDER BY level ASC
        `;
        this.levelsCache = await executeQuery(query, []);
        return this.levelsCache;
    }

    /**
     * Obtiene información de un nivel específico
     */
    async getLevelInfo(level) {
        const levels = await this.getLevelDefinitions();
        return levels.find(l => l.level === level) || null;
    }

    /**
     * Calcula el nivel basado en XP
     */
    async calculateLevelFromXP(xp) {
        const levels = await this.getLevelDefinitions();

        let currentLevel = levels[0];
        for (const level of levels) {
            if (xp >= level.xp_required) {
                currentLevel = level;
            } else {
                break;
            }
        }

        // Calcular progreso al siguiente nivel
        const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
        let progressToNext = 100;
        let xpForNext = 0;

        if (nextLevel) {
            const xpInCurrentLevel = xp - currentLevel.xp_required;
            const xpNeededForNext = nextLevel.xp_required - currentLevel.xp_required;
            progressToNext = Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
            xpForNext = nextLevel.xp_required - xp;
        }

        return {
            level: currentLevel.level,
            title: currentLevel.title,
            subtitle: currentLevel.subtitle,
            icon: currentLevel.icon,
            color: currentLevel.color,
            currentXP: xp,
            xpForCurrentLevel: currentLevel.xp_required,
            xpForNextLevel: nextLevel ? nextLevel.xp_required : currentLevel.xp_required,
            xpNeeded: xpForNext,
            progressPercent: Math.min(progressToNext, 100),
            isMaxLevel: !nextLevel
        };
    }

    /**
     * Otorga XP a un usuario y procesa subida de nivel
     */
    async grantXP(userId, amount, source = 'general') {
        // Obtener XP actual
        const balanceQuery = `
            SELECT experience_points, level
            FROM iacoins_balance
            WHERE user_id = $1
        `;
        const balanceResult = await executeQuery(balanceQuery, [userId]);

        if (balanceResult.length === 0) {
            throw new Error('Usuario no tiene balance de IACoins');
        }

        const currentXP = balanceResult[0].experience_points;
        const currentLevel = balanceResult[0].level;
        const newXP = currentXP + amount;

        // Actualizar XP
        const updateQuery = `
            UPDATE iacoins_balance
            SET experience_points = $1,
                updated_at = NOW()
            WHERE user_id = $2
        `;
        await executeQuery(updateQuery, [newXP, userId]);

        // Calcular nuevo nivel
        const newLevelInfo = await this.calculateLevelFromXP(newXP);

        // Procesar subida de nivel si corresponde
        let levelUpRewards = null;
        if (newLevelInfo.level > currentLevel) {
            levelUpRewards = await this.processLevelUp(userId, currentLevel, newLevelInfo.level);
        }

        return {
            xpGranted: amount,
            source,
            totalXP: newXP,
            levelInfo: newLevelInfo,
            levelUp: levelUpRewards
        };
    }

    /**
     * Procesa subida de nivel
     */
    async processLevelUp(userId, fromLevel, toLevel) {
        const rewards = {
            coinsEarned: 0,
            badgesEarned: [],
            unlocks: []
        };

        // Procesar cada nivel subido
        for (let level = fromLevel + 1; level <= toLevel; level++) {
            const levelInfo = await this.getLevelInfo(level);
            if (!levelInfo) continue;

            // Otorgar recompensas del nivel
            if (levelInfo.reward_coins > 0) {
                rewards.coinsEarned += levelInfo.reward_coins;

                // Agregar a balance
                await this.addCoinsToUser(userId, levelInfo.reward_coins);

                // Registrar transacción
                await this.createTransaction(
                    userId,
                    levelInfo.reward_coins,
                    `Subida a nivel ${level}: ${levelInfo.title}`
                );
            }

            // Registrar en historial
            await this.recordLevelUp(userId, level, fromLevel, levelInfo);

            // Verificar badges de nivel
            const levelBadge = await this.checkLevelBadge(userId, level);
            if (levelBadge) {
                rewards.badgesEarned.push(levelBadge);
            }

            // Obtener desbloqueos
            const unlocks = await this.getUnlocksForLevel(level);
            if (unlocks.length > 0) {
                rewards.unlocks.push(...unlocks);
            }
        }

        // Actualizar nivel en balance
        const updateLevelQuery = `
            UPDATE iacoins_balance
            SET level = $1,
                updated_at = NOW()
            WHERE user_id = $2
        `;
        await executeQuery(updateLevelQuery, [toLevel, userId]);

        return rewards;
    }

    /**
     * Registra subida de nivel en historial
     */
    async recordLevelUp(userId, level, previousLevel, levelInfo) {
        // Obtener XP actual
        const xpQuery = `
            SELECT experience_points FROM iacoins_balance WHERE user_id = $1
        `;
        const xpResult = await executeQuery(xpQuery, [userId]);
        const currentXP = xpResult[0]?.experience_points || 0;

        const query = `
            INSERT INTO level_history (
                user_id, level, previous_level, xp_at_levelup,
                coins_earned, unlocks_gained
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await executeQuery(query, [
            userId, level, previousLevel, currentXP,
            levelInfo.reward_coins, levelInfo.unlocks
        ]);
    }

    /**
     * Obtiene el nivel actual del usuario con detalles
     */
    async getUserLevel(userId) {
        const query = `
            SELECT
                ib.level,
                ib.experience_points,
                ib.balance,
                ib.total_earned,
                ld.title,
                ld.subtitle,
                ld.icon,
                ld.color,
                ld.description
            FROM iacoins_balance ib
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            WHERE ib.user_id = $1
        `;

        const result = await executeQuery(query, [userId]);
        if (result.length === 0) return null;

        const data = result[0];
        const levelInfo = await this.calculateLevelFromXP(data.experience_points);

        return {
            ...data,
            ...levelInfo
        };
    }

    // =====================================
    // GESTIÓN DE BADGES
    // =====================================

    /**
     * Obtiene todos los badges disponibles
     */
    async getAllBadges() {
        if (this.badgesCache) return this.badgesCache;

        const query = `
            SELECT * FROM badges
            WHERE is_active = true
            ORDER BY category, sort_order, rarity
        `;
        this.badgesCache = await executeQuery(query, []);
        return this.badgesCache;
    }

    /**
     * Obtiene badges de un usuario
     */
    async getUserBadges(userId) {
        const query = `
            SELECT
                b.*,
                ub.earned_at,
                ub.is_featured,
                ub.earn_details
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = $1
            ORDER BY ub.is_featured DESC, ub.earned_at DESC
        `;

        return executeQuery(query, [userId]);
    }

    /**
     * Obtiene badges con estado para usuario (ganados y no ganados)
     */
    async getBadgesWithStatus(userId) {
        const query = `
            SELECT
                b.*,
                ub.earned_at,
                ub.is_featured,
                CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as earned
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
            WHERE b.is_active = true
            AND (b.is_hidden = false OR ub.id IS NOT NULL)
            ORDER BY b.category, earned DESC, b.sort_order
        `;

        return executeQuery(query, [userId]);
    }

    /**
     * Otorga un badge a un usuario
     */
    async grantBadge(userId, badgeId, details = null) {
        // Verificar si ya tiene el badge
        const checkQuery = `
            SELECT id FROM user_badges
            WHERE user_id = $1 AND badge_id = $2
        `;
        const existing = await executeQuery(checkQuery, [userId, badgeId]);

        if (existing.length > 0) {
            return { success: false, message: 'Badge ya otorgado' };
        }

        // Obtener info del badge
        const badgeQuery = `SELECT * FROM badges WHERE id = $1`;
        const badgeResult = await executeQuery(badgeQuery, [badgeId]);

        if (badgeResult.length === 0) {
            throw new Error('Badge no encontrado');
        }

        const badge = badgeResult[0];

        // Otorgar badge
        const insertQuery = `
            INSERT INTO user_badges (user_id, badge_id, earn_details)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        await executeQuery(insertQuery, [userId, badgeId, details]);

        // Otorgar recompensas del badge
        if (badge.reward_coins > 0) {
            await this.addCoinsToUser(userId, badge.reward_coins);
            await this.createTransaction(
                userId,
                badge.reward_coins,
                `Badge obtenido: ${badge.name}`
            );
        }

        if (badge.reward_xp > 0) {
            await this.grantXP(userId, badge.reward_xp, `Badge: ${badge.name}`);
        }

        return {
            success: true,
            badge,
            rewards: {
                coins: badge.reward_coins,
                xp: badge.reward_xp
            }
        };
    }

    /**
     * Verifica y otorga badge de nivel
     */
    async checkLevelBadge(userId, level) {
        const query = `
            SELECT * FROM badges
            WHERE requirement_type = 'level_reach'
            AND requirement_value = $1
            AND is_active = true
        `;

        const badges = await executeQuery(query, [level]);
        if (badges.length === 0) return null;

        const badge = badges[0];
        const result = await this.grantBadge(userId, badge.id, { level_reached: level });

        return result.success ? badge : null;
    }

    /**
     * Verifica badges basados en actividad
     */
    async checkActivityBadges(userId, activityType, value) {
        const query = `
            SELECT * FROM badges
            WHERE requirement_type = $1
            AND requirement_value <= $2
            AND is_active = true
        `;

        const badges = await executeQuery(query, [activityType, value]);
        const granted = [];

        for (const badge of badges) {
            const result = await this.grantBadge(userId, badge.id, {
                activity_type: activityType,
                value
            });
            if (result.success) {
                granted.push(badge);
            }
        }

        return granted;
    }

    /**
     * Establece un badge como destacado
     */
    async setFeaturedBadge(userId, badgeId) {
        // Quitar destacado de otros
        await executeQuery(
            `UPDATE user_badges SET is_featured = false WHERE user_id = $1`,
            [userId]
        );

        // Establecer nuevo destacado
        const query = `
            UPDATE user_badges
            SET is_featured = true
            WHERE user_id = $1 AND badge_id = $2
            RETURNING *
        `;

        const result = await executeQuery(query, [userId, badgeId]);
        return result.length > 0;
    }

    // =====================================
    // PERFIL DE USUARIO
    // =====================================

    /**
     * Obtiene perfil público de usuario
     */
    async getUserProfile(userId) {
        const query = `
            SELECT
                up.*,
                u.nombre,
                u.apellido_paterno,
                ib.level,
                ib.experience_points,
                ib.total_earned,
                ld.title as level_title,
                ld.icon as level_icon,
                ld.color as level_color
            FROM user_profiles up
            JOIN usuarios u ON up.user_id = u.id
            LEFT JOIN iacoins_balance ib ON up.user_id = ib.user_id
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            WHERE up.user_id = $1
        `;

        const result = await executeQuery(query, [userId]);

        if (result.length === 0) {
            // Crear perfil si no existe
            return this.createUserProfile(userId);
        }

        const profile = result[0];

        // Agregar badges destacados
        profile.featuredBadges = await this.getUserBadges(userId);
        profile.levelInfo = await this.calculateLevelFromXP(profile.experience_points || 0);

        return profile;
    }

    /**
     * Crea perfil inicial de usuario
     */
    async createUserProfile(userId) {
        // Obtener datos del usuario
        const userQuery = `
            SELECT nombre, apellido_paterno FROM usuarios WHERE id = $1
        `;
        const userResult = await executeQuery(userQuery, [userId]);

        if (userResult.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        const user = userResult[0];
        const displayName = `${user.nombre} ${user.apellido_paterno}`.trim();

        const insertQuery = `
            INSERT INTO user_profiles (user_id, display_name)
            VALUES ($1, $2)
            RETURNING *
        `;

        const result = await executeQuery(insertQuery, [userId, displayName]);
        return result[0];
    }

    /**
     * Actualiza perfil de usuario
     */
    async updateUserProfile(userId, updates) {
        const allowedFields = [
            'display_name', 'bio', 'avatar_url', 'is_public',
            'show_level', 'show_badges', 'show_stats',
            'show_achievements', 'theme', 'social_links'
        ];

        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }

        values.push(userId);
        const query = `
            UPDATE user_profiles
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE user_id = $${paramIndex}
            RETURNING *
        `;

        const result = await executeQuery(query, values);
        return result[0];
    }

    /**
     * Actualiza estadísticas cacheadas del perfil
     */
    async updateProfileStats(userId) {
        const query = `
            UPDATE user_profiles up
            SET
                total_xp = COALESCE(ib.experience_points, 0),
                total_coins_earned = COALESCE(ib.total_earned, 0),
                challenges_completed = COALESCE(cp.completed, 0),
                current_streak = COALESCE(us.current_streak, 0),
                updated_at = NOW()
            FROM
                (SELECT user_id, experience_points, total_earned FROM iacoins_balance WHERE user_id = $1) ib,
                (SELECT COUNT(*) as completed FROM challenge_progress WHERE user_id = $1 AND status = 'claimed') cp,
                (SELECT current_streak FROM user_streaks WHERE user_id = $1 AND streak_type = 'daily_login') us
            WHERE up.user_id = $1
        `;

        await executeQuery(query, [userId]);
    }

    // =====================================
    // DESBLOQUEOS
    // =====================================

    /**
     * Obtiene features desbloqueados para un nivel
     */
    async getUnlocksForLevel(level) {
        const query = `
            SELECT * FROM unlockable_features
            WHERE required_level = $1
            AND is_active = true
        `;
        return executeQuery(query, [level]);
    }

    /**
     * Obtiene todas las features disponibles para un usuario
     */
    async getAvailableFeatures(userId) {
        const userLevel = await this.getUserLevel(userId);
        if (!userLevel) return [];

        const query = `
            SELECT * FROM unlockable_features
            WHERE required_level <= $1
            AND is_active = true
            ORDER BY required_level ASC
        `;

        return executeQuery(query, [userLevel.level]);
    }

    /**
     * Verifica si usuario tiene acceso a una feature
     */
    async hasFeatureAccess(userId, featureSlug) {
        const userLevel = await this.getUserLevel(userId);
        if (!userLevel) return false;

        const query = `
            SELECT * FROM unlockable_features
            WHERE slug = $1
            AND required_level <= $2
            AND is_active = true
        `;

        const result = await executeQuery(query, [featureSlug, userLevel.level]);
        return result.length > 0;
    }

    // =====================================
    // LEADERBOARD
    // =====================================

    /**
     * Obtiene leaderboard por XP
     */
    async getXPLeaderboard(limit = 10) {
        const query = `
            SELECT
                u.id as user_id,
                u.nombre,
                u.apellido_paterno,
                ib.level,
                ib.experience_points,
                ib.total_earned,
                ld.title as level_title,
                ld.icon as level_icon,
                ld.color as level_color,
                up.avatar_url
            FROM iacoins_balance ib
            JOIN usuarios u ON ib.user_id = u.id
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            LEFT JOIN user_profiles up ON ib.user_id = up.user_id
            WHERE u.status = 'activo'
            ORDER BY ib.experience_points DESC
            LIMIT $1
        `;

        const results = await executeQuery(query, [limit]);

        return results.map((user, index) => ({
            rank: index + 1,
            ...user
        }));
    }

    /**
     * Obtiene posición del usuario en leaderboard
     */
    async getUserRank(userId) {
        const query = `
            SELECT COUNT(*) + 1 as rank
            FROM iacoins_balance
            WHERE experience_points > (
                SELECT experience_points FROM iacoins_balance WHERE user_id = $1
            )
        `;

        const result = await executeQuery(query, [userId]);
        return parseInt(result[0].rank);
    }

    // =====================================
    // HISTORIAL
    // =====================================

    /**
     * Obtiene historial de niveles del usuario
     */
    async getLevelHistory(userId, limit = 10) {
        const query = `
            SELECT
                lh.*,
                ld.title,
                ld.icon,
                ld.color
            FROM level_history lh
            JOIN level_definitions ld ON lh.level = ld.level
            WHERE lh.user_id = $1
            ORDER BY lh.achieved_at DESC
            LIMIT $2
        `;

        return executeQuery(query, [userId, limit]);
    }

    // =====================================
    // HELPERS
    // =====================================

    /**
     * Agrega monedas al usuario
     */
    async addCoinsToUser(userId, amount) {
        const query = `
            UPDATE iacoins_balance
            SET balance = balance + $1,
                total_earned = total_earned + $1,
                updated_at = NOW()
            WHERE user_id = $2
        `;
        await executeQuery(query, [amount, userId]);
    }

    /**
     * Crea transacción de IACoins
     */
    async createTransaction(userId, amount, description) {
        const query = `
            INSERT INTO iacoins_transactions (
                user_id, type, amount, description, balance_before, balance_after
            )
            SELECT
                $1, 'earn', $2, $3,
                balance - $2, balance
            FROM iacoins_balance
            WHERE user_id = $1
            RETURNING *
        `;
        return executeQuery(query, [userId, amount, description]);
    }

    /**
     * Invalida cache de niveles
     */
    invalidateCache() {
        this.levelsCache = null;
        this.badgesCache = null;
    }
}

module.exports = new LevelsService();
