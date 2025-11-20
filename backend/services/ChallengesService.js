/**
 * 🏆 CHALLENGES SERVICE
 * Servicio para gestión de retos dinámicos
 * FASE 1 - Semana 5-6
 */

const { executeQuery } = require('../data/database-access');

class ChallengesService {
    constructor() {
        // Configuración de multiplicadores de streak
        this.streakMultipliers = {
            3: 1.1,   // 3 días = 10% bonus
            7: 1.25,  // 7 días = 25% bonus
            14: 1.5,  // 14 días = 50% bonus
            30: 2.0,  // 30 días = 100% bonus
            60: 2.5,  // 60 días = 150% bonus
            100: 3.0  // 100 días = 200% bonus
        };

        // Materias de BGE
        this.subjects = [
            'Matemáticas', 'Física', 'Química', 'Biología', 'Historia',
            'Geografía', 'Español', 'Inglés', 'Filosofía', 'Ética',
            'Informática', 'Economía', 'Sociología', 'Psicología', 'Arte',
            'Música', 'Educación Física', 'Civismo', 'Ecología', 'Derecho'
        ];
    }

    // =====================================
    // OBTENER RETOS
    // =====================================

    /**
     * Obtiene retos disponibles para un usuario
     */
    async getAvailableChallenges(userId, options = {}) {
        const {
            category,
            difficulty,
            frequency,
            subject,
            includeProgress = true,
            limit = 50,
            offset = 0
        } = options;

        let query = `
            SELECT
                c.*,
                ${includeProgress ? `
                cp.status as user_status,
                cp.current_progress,
                cp.target_progress,
                cp.completion_count,
                cp.coins_earned,
                cp.xp_earned
                ` : 'NULL as user_status'}
            FROM challenges c
            ${includeProgress ? `
            LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $1
            ` : ''}
            WHERE c.is_active = true
            AND (c.start_date IS NULL OR c.start_date <= NOW())
            AND (c.end_date IS NULL OR c.end_date >= NOW())
        `;

        const params = includeProgress ? [userId] : [];
        let paramIndex = params.length + 1;

        // Filtros opcionales
        if (category) {
            query += ` AND c.category = $${paramIndex++}`;
            params.push(category);
        }

        if (difficulty) {
            query += ` AND c.difficulty = $${paramIndex++}`;
            params.push(difficulty);
        }

        if (frequency) {
            query += ` AND c.frequency = $${paramIndex++}`;
            params.push(frequency);
        }

        if (subject) {
            query += ` AND c.subject = $${paramIndex++}`;
            params.push(subject);
        }

        query += `
            ORDER BY c.featured DESC, c.sort_order ASC, c.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `;
        params.push(limit, offset);

        const challenges = await executeQuery(query, params);

        // Procesar cada reto
        return challenges.map(challenge => this.processChallenge(challenge, userId));
    }

    /**
     * Obtiene un reto específico con progreso del usuario
     */
    async getChallengeById(challengeId, userId) {
        const query = `
            SELECT
                c.*,
                cp.status as user_status,
                cp.current_progress,
                cp.target_progress,
                cp.completion_count,
                cp.coins_earned,
                cp.xp_earned,
                cp.started_at,
                cp.first_completed_at
            FROM challenges c
            LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $2
            WHERE c.id = $1
        `;

        const result = await executeQuery(query, [challengeId, userId]);
        if (result.length === 0) return null;

        return this.processChallenge(result[0], userId);
    }

    /**
     * Obtiene retos diarios del usuario
     */
    async getDailyChallenges(userId) {
        return this.getAvailableChallenges(userId, {
            frequency: 'daily',
            limit: 10
        });
    }

    /**
     * Obtiene retos destacados
     */
    async getFeaturedChallenges(userId, limit = 5) {
        const query = `
            SELECT
                c.*,
                cp.status as user_status,
                cp.current_progress,
                cp.target_progress
            FROM challenges c
            LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id AND cp.user_id = $1
            WHERE c.is_active = true
            AND c.featured = true
            AND (c.start_date IS NULL OR c.start_date <= NOW())
            AND (c.end_date IS NULL OR c.end_date >= NOW())
            ORDER BY c.sort_order ASC
            LIMIT $2
        `;

        const challenges = await executeQuery(query, [userId, limit]);
        return challenges.map(c => this.processChallenge(c, userId));
    }

    // =====================================
    // PROGRESO DE RETOS
    // =====================================

    /**
     * Inicia un reto para el usuario
     */
    async startChallenge(userId, challengeId) {
        // Verificar que el reto existe y está activo
        const challenge = await this.getChallengeById(challengeId, userId);
        if (!challenge) {
            throw new Error('Reto no encontrado');
        }

        if (challenge.user_status) {
            return { success: true, message: 'Reto ya iniciado', progress: challenge };
        }

        // Verificar nivel mínimo
        const userLevel = await this.getUserLevel(userId);
        if (userLevel < challenge.min_level) {
            throw new Error(`Necesitas nivel ${challenge.min_level} para este reto`);
        }

        // Verificar prerrequisitos
        if (challenge.prerequisites && challenge.prerequisites.length > 0) {
            const completedPrereqs = await this.checkPrerequisites(userId, challenge.prerequisites);
            if (!completedPrereqs) {
                throw new Error('No has completado los retos previos requeridos');
            }
        }

        // Crear progreso inicial
        const targetProgress = challenge.completion_criteria.target || 1;

        const query = `
            INSERT INTO challenge_progress (
                user_id, challenge_id, status, current_progress, target_progress
            ) VALUES ($1, $2, 'in_progress', 0, $3)
            RETURNING *
        `;

        const result = await executeQuery(query, [userId, challengeId, targetProgress]);

        return {
            success: true,
            message: 'Reto iniciado',
            progress: result[0]
        };
    }

    /**
     * Actualiza el progreso de un reto
     */
    async updateProgress(userId, challengeId, incrementBy = 1, progressData = null) {
        // Obtener progreso actual
        const progressQuery = `
            SELECT cp.*, c.completion_criteria, c.reward_coins, c.reward_xp,
                   c.is_repeatable, c.max_completions, c.bonus_multiplier
            FROM challenge_progress cp
            JOIN challenges c ON cp.challenge_id = c.id
            WHERE cp.user_id = $1 AND cp.challenge_id = $2
        `;

        const progressResult = await executeQuery(progressQuery, [userId, challengeId]);

        if (progressResult.length === 0) {
            // Auto-iniciar el reto si no existe progreso
            await this.startChallenge(userId, challengeId);
            return this.updateProgress(userId, challengeId, incrementBy, progressData);
        }

        const progress = progressResult[0];

        // Si ya está completado y no es repetible, no hacer nada
        if (progress.status === 'claimed' && !progress.is_repeatable) {
            return { success: false, message: 'Reto ya completado' };
        }

        // Verificar límite de completaciones
        if (progress.max_completions && progress.completion_count >= progress.max_completions) {
            return { success: false, message: 'Límite de completaciones alcanzado' };
        }

        // Actualizar progreso
        const newProgress = Math.min(
            progress.current_progress + incrementBy,
            progress.target_progress
        );

        let newStatus = progress.status;
        let completionUpdate = '';

        // Verificar si se completó
        if (newProgress >= progress.target_progress && progress.status !== 'completed') {
            newStatus = 'completed';
            completionUpdate = `,
                completion_count = completion_count + 1,
                first_completed_at = COALESCE(first_completed_at, NOW()),
                last_completed_at = NOW()
            `;
        }

        const updateQuery = `
            UPDATE challenge_progress
            SET current_progress = $1,
                status = $2,
                progress_data = COALESCE($3, progress_data),
                updated_at = NOW()
                ${completionUpdate}
            WHERE user_id = $4 AND challenge_id = $5
            RETURNING *
        `;

        const updateResult = await executeQuery(updateQuery, [
            newProgress, newStatus, progressData, userId, challengeId
        ]);

        return {
            success: true,
            completed: newStatus === 'completed',
            progress: updateResult[0],
            canClaim: newStatus === 'completed'
        };
    }

    /**
     * Reclamar recompensa de reto completado
     */
    async claimReward(userId, challengeId) {
        // Obtener progreso y verificar que está completado
        const query = `
            SELECT cp.*, c.reward_coins, c.reward_xp, c.bonus_multiplier, c.title
            FROM challenge_progress cp
            JOIN challenges c ON cp.challenge_id = c.id
            WHERE cp.user_id = $1 AND cp.challenge_id = $2
        `;

        const result = await executeQuery(query, [userId, challengeId]);

        if (result.length === 0) {
            throw new Error('No tienes progreso en este reto');
        }

        const progress = result[0];

        if (progress.status !== 'completed') {
            throw new Error('El reto no está completado');
        }

        // Calcular recompensa con multiplicador de streak
        const streakMultiplier = await this.getStreakMultiplier(userId);
        const totalMultiplier = (progress.bonus_multiplier || 1) * streakMultiplier;

        const coinsEarned = Math.floor(progress.reward_coins * totalMultiplier);
        const xpEarned = Math.floor(progress.reward_xp * totalMultiplier);

        // Actualizar balance del usuario
        await this.addRewardsToUser(userId, coinsEarned, xpEarned);

        // Marcar como reclamado
        const updateQuery = `
            UPDATE challenge_progress
            SET status = 'claimed',
                coins_earned = coins_earned + $1,
                xp_earned = xp_earned + $2,
                claimed_at = NOW(),
                updated_at = NOW()
            WHERE user_id = $3 AND challenge_id = $4
            RETURNING *
        `;

        await executeQuery(updateQuery, [coinsEarned, xpEarned, userId, challengeId]);

        // Registrar transacción
        await this.createTransaction(userId, coinsEarned, `Reto completado: ${progress.title}`);

        return {
            success: true,
            coinsEarned,
            xpEarned,
            multiplier: totalMultiplier,
            message: `¡Felicidades! Has ganado ${coinsEarned} IACoins y ${xpEarned} XP`
        };
    }

    // =====================================
    // SISTEMA DE STREAKS
    // =====================================

    /**
     * Actualiza el streak de un usuario
     */
    async updateStreak(userId, streakType = 'daily_login') {
        const today = new Date().toISOString().split('T')[0];

        // Obtener streak actual
        const query = `
            SELECT * FROM user_streaks
            WHERE user_id = $1 AND streak_type = $2
        `;

        const result = await executeQuery(query, [userId, streakType]);

        if (result.length === 0) {
            // Crear nuevo streak
            const insertQuery = `
                INSERT INTO user_streaks (
                    user_id, streak_type, current_streak, longest_streak,
                    total_completions, last_activity_date, streak_started_at
                ) VALUES ($1, $2, 1, 1, 1, $3, NOW())
                RETURNING *
            `;
            const newStreak = await executeQuery(insertQuery, [userId, streakType, today]);
            return { ...newStreak[0], isNew: true };
        }

        const streak = result[0];
        const lastActivity = new Date(streak.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastActivity) / (1000 * 60 * 60 * 24));

        let newCurrentStreak = streak.current_streak;
        let newLongestStreak = streak.longest_streak;
        let bonusCoins = 0;
        let bonusXp = 0;

        if (diffDays === 0) {
            // Ya registrado hoy
            return { ...streak, alreadyRecorded: true };
        } else if (diffDays === 1) {
            // Día consecutivo
            newCurrentStreak += 1;
            if (newCurrentStreak > newLongestStreak) {
                newLongestStreak = newCurrentStreak;
            }

            // Calcular bonus por milestone
            const bonus = this.calculateStreakBonus(newCurrentStreak);
            bonusCoins = bonus.coins;
            bonusXp = bonus.xp;

            if (bonusCoins > 0) {
                await this.addRewardsToUser(userId, bonusCoins, bonusXp);
                await this.createTransaction(userId, bonusCoins, `Bonus de racha: ${newCurrentStreak} días`);
            }
        } else {
            // Streak roto
            newCurrentStreak = 1;
        }

        // Actualizar streak
        const updateQuery = `
            UPDATE user_streaks
            SET current_streak = $1,
                longest_streak = $2,
                total_completions = total_completions + 1,
                last_activity_date = $3,
                bonus_coins_earned = bonus_coins_earned + $4,
                bonus_xp_earned = bonus_xp_earned + $5,
                updated_at = NOW()
            WHERE user_id = $6 AND streak_type = $7
            RETURNING *
        `;

        const updated = await executeQuery(updateQuery, [
            newCurrentStreak, newLongestStreak, today,
            bonusCoins, bonusXp, userId, streakType
        ]);

        return {
            ...updated[0],
            streakBroken: diffDays > 1,
            bonusCoins,
            bonusXp
        };
    }

    /**
     * Obtiene todos los streaks del usuario
     */
    async getUserStreaks(userId) {
        const query = `
            SELECT * FROM user_streaks
            WHERE user_id = $1
            ORDER BY current_streak DESC
        `;
        return executeQuery(query, [userId]);
    }

    /**
     * Calcula bonus por milestone de streak
     */
    calculateStreakBonus(streak) {
        const milestones = {
            7: { coins: 25, xp: 100, message: '¡Una semana!' },
            14: { coins: 50, xp: 200, message: '¡Dos semanas!' },
            30: { coins: 150, xp: 500, message: '¡Un mes!' },
            60: { coins: 300, xp: 1000, message: '¡Dos meses!' },
            100: { coins: 500, xp: 2000, message: '¡100 días!' },
            365: { coins: 2000, xp: 10000, message: '¡Un año!' }
        };

        return milestones[streak] || { coins: 0, xp: 0 };
    }

    /**
     * Obtiene multiplicador actual por streak
     */
    async getStreakMultiplier(userId) {
        const streaks = await this.getUserStreaks(userId);
        const loginStreak = streaks.find(s => s.streak_type === 'daily_login');

        if (!loginStreak) return 1.0;

        const streak = loginStreak.current_streak;
        let multiplier = 1.0;

        for (const [days, mult] of Object.entries(this.streakMultipliers)) {
            if (streak >= parseInt(days)) {
                multiplier = mult;
            }
        }

        return multiplier;
    }

    // =====================================
    // RETOS COLABORATIVOS
    // =====================================

    /**
     * Unirse a un reto colaborativo
     */
    async joinCollaborativeChallenge(userId, challengeId) {
        // Verificar que es un reto colaborativo
        const challenge = await this.getChallengeById(challengeId, userId);
        if (!challenge || !challenge.is_collaborative) {
            throw new Error('No es un reto colaborativo válido');
        }

        // Verificar límite de participantes
        const participantsQuery = `
            SELECT COUNT(*) as count
            FROM collaborative_challenge_participants
            WHERE challenge_id = $1
        `;
        const participantsResult = await executeQuery(participantsQuery, [challengeId]);

        if (challenge.max_participants &&
            parseInt(participantsResult[0].count) >= challenge.max_participants) {
            throw new Error('El reto ya tiene el máximo de participantes');
        }

        // Agregar participante
        const insertQuery = `
            INSERT INTO collaborative_challenge_participants (
                challenge_id, user_id, role
            ) VALUES ($1, $2, 'participant')
            ON CONFLICT (challenge_id, user_id) DO NOTHING
            RETURNING *
        `;

        const result = await executeQuery(insertQuery, [challengeId, userId]);

        // También iniciar progreso individual
        await this.startChallenge(userId, challengeId);

        return {
            success: true,
            participation: result[0],
            message: 'Te has unido al reto colaborativo'
        };
    }

    /**
     * Obtiene participantes de un reto colaborativo
     */
    async getCollaborativeParticipants(challengeId) {
        const query = `
            SELECT
                ccp.*,
                u.nombre,
                u.apellido_paterno,
                COALESCE(ib.level, 1) as level
            FROM collaborative_challenge_participants ccp
            JOIN usuarios u ON ccp.user_id = u.id
            LEFT JOIN iacoins_balance ib ON ccp.user_id = ib.user_id
            WHERE ccp.challenge_id = $1
            ORDER BY ccp.contribution_score DESC
        `;
        return executeQuery(query, [challengeId]);
    }

    // =====================================
    // HELPERS
    // =====================================

    /**
     * Procesa un reto para agregar información adicional
     */
    processChallenge(challenge, userId) {
        return {
            ...challenge,
            completion_criteria: typeof challenge.completion_criteria === 'string'
                ? JSON.parse(challenge.completion_criteria)
                : challenge.completion_criteria,
            progress_percentage: challenge.target_progress
                ? Math.round((challenge.current_progress || 0) / challenge.target_progress * 100)
                : 0,
            can_start: !challenge.user_status,
            can_claim: challenge.user_status === 'completed'
        };
    }

    /**
     * Obtiene el nivel del usuario
     */
    async getUserLevel(userId) {
        const query = `
            SELECT level FROM iacoins_balance WHERE user_id = $1
        `;
        const result = await executeQuery(query, [userId]);
        return result.length > 0 ? result[0].level : 1;
    }

    /**
     * Verifica prerrequisitos completados
     */
    async checkPrerequisites(userId, prerequisiteIds) {
        const query = `
            SELECT COUNT(*) as completed
            FROM challenge_progress
            WHERE user_id = $1
            AND challenge_id = ANY($2)
            AND status = 'claimed'
        `;
        const result = await executeQuery(query, [userId, prerequisiteIds]);
        return parseInt(result[0].completed) === prerequisiteIds.length;
    }

    /**
     * Agrega recompensas al usuario
     */
    async addRewardsToUser(userId, coins, xp) {
        const query = `
            UPDATE iacoins_balance
            SET balance = balance + $1,
                total_earned = total_earned + $1,
                experience_points = experience_points + $2,
                updated_at = NOW()
            WHERE user_id = $3
        `;
        await executeQuery(query, [coins, xp, userId]);

        // Verificar si subió de nivel
        await this.checkLevelUp(userId);
    }

    /**
     * Verifica y actualiza nivel del usuario
     */
    async checkLevelUp(userId) {
        const query = `
            SELECT level, experience_points FROM iacoins_balance WHERE user_id = $1
        `;
        const result = await executeQuery(query, [userId]);
        if (result.length === 0) return;

        const { level, experience_points } = result[0];
        const requiredXp = Math.floor(100 * Math.pow(1.5, level));

        if (experience_points >= requiredXp) {
            const updateQuery = `
                UPDATE iacoins_balance
                SET level = level + 1,
                    updated_at = NOW()
                WHERE user_id = $1
            `;
            await executeQuery(updateQuery, [userId]);
        }
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
     * Obtiene estadísticas de retos del usuario
     */
    async getUserChallengeStats(userId) {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE status = 'claimed') as completed,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                SUM(coins_earned) as total_coins,
                SUM(xp_earned) as total_xp
            FROM challenge_progress
            WHERE user_id = $1
        `;
        const result = await executeQuery(query, [userId]);
        return result[0];
    }
}

module.exports = new ChallengesService();
