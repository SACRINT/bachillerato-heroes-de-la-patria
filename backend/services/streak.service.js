const { pool } = require('../config/database');
const xpService = require('./xp.service');
const devLogger = require('../utils/devLogger');

class StreakService {

    /**
     * Obtiene el estado actual de la racha de un usuario.
     * Si no existe registro, lo inicializa.
     */
    async getStreak(userId) {
        try {
            const query = `
                SELECT 
                    current_streak, 
                    max_streak, 
                    last_check_in_date, 
                    streak_freeze_count
                FROM streaks 
                WHERE user_id = $1
            `;
            const result = await pool.query(query, [userId]);

            if (result.rows.length === 0) {
                // Inicializar si no existe
                await this.initializeStreak(userId);
                return {
                    current_streak: 0,
                    max_streak: 0,
                    last_check_in_date: null,
                    streak_freeze_count: 0,
                    streak_status: 'inactive'
                };
            }

            const streakData = result.rows[0];
            const status = this.calculateStreakStatus(streakData.last_check_in_date);

            // Si status es 'lost' y current_streak > 0, visualmente es 0 aunque DB tenga datos antiguos
            if (status === 'lost' && streakData.current_streak > 0) {
                return { ...streakData, current_streak: 0, streak_status: 'lost' };
            }

            return { ...streakData, streak_status: status };
        } catch (error) {
            devLogger.error('[StreakService] Error getting streak:', error);
            throw error;
        }
    }

    /**
     * Realiza el check-in diario para un usuario.
     * Maneja incrementos, reinicios, freezes y otorga XP.
     */
    async checkIn(userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const today = new Date().toISOString().split('T')[0];

            // 1. Verificar si ya hizo check-in hoy (Prevent Check-in Spam)
            const logCheck = await client.query(
                'SELECT id FROM streak_logs WHERE user_id = $1 AND check_in_date = $2',
                [userId, today]
            );

            if (logCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                // Devolver estado actual sin cambios
                const current = await this.getStreak(userId);
                return {
                    status: 'already_checked_in',
                    message: 'Ya has registrado tu racha hoy.',
                    streak_data: current
                };
            }

            // 2. Obtener estado actual (Bloqueo pesimista)
            let streakRes = await client.query(
                `SELECT * FROM streaks WHERE user_id = $1 FOR UPDATE`,
                [userId]
            );

            let streak = streakRes.rows[0];

            if (!streak) {
                // Inicializar si no existe
                await client.query(
                    `INSERT INTO streaks (user_id, current_streak, max_streak)
                     VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
                    [userId]
                );
                streakRes = await client.query(
                    `SELECT * FROM streaks WHERE user_id = $1 FOR UPDATE`,
                    [userId]
                );
                streak = streakRes.rows[0];
            }

            const lastDateISO = streak.last_check_in_date ? new Date(streak.last_check_in_date).toISOString().split('T')[0] : null;

            // 3. Calcular estado de la racha
            let newCurrentStreak = 1;
            let streakFrozen = false;
            let resetHappened = false;

            if (lastDateISO) {
                const lastDate = new Date(lastDateISO);
                const todayDate = new Date(today);
                const diffTime = Math.abs(todayDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Día consecutivo
                    newCurrentStreak = streak.current_streak + 1;
                } else if (diffDays > 1) {
                    // Racha rota - Intentar usar Freeze
                    if (streak.streak_freeze_count > 0) {
                        // Usar freeze si la diferencia no es extrema? 
                        // Nota: Generalmente freeze cubre un día perdido. Si diffDays = 2 (faltó ayer), salva.
                        if (diffDays === 2) {
                            await client.query(
                                `UPDATE streaks SET streak_freeze_count = streak_freeze_count - 1 WHERE user_id = $1`,
                                [userId]
                            );
                            newCurrentStreak = streak.current_streak + 1; // Mantiene y suma
                            streakFrozen = true;
                        } else {
                            // Demasiados días perdidos
                            newCurrentStreak = 1;
                            resetHappened = true;
                        }
                    } else {
                        // Sin freezes
                        newCurrentStreak = 1;
                        resetHappened = true;
                    }
                }
            }

            const newMaxStreak = Math.max(streak.max_streak, newCurrentStreak);

            // 4. Actualizar tabla streaks
            const updateRes = await client.query(
                `UPDATE streaks 
                 SET current_streak = $1, 
                     max_streak = $2,
                     last_check_in_date = $3,
                     updated_at = NOW()
                 WHERE user_id = $4
                 RETURNING *`,
                [newCurrentStreak, newMaxStreak, today, userId]
            );

            const updatedStreakData = updateRes.rows[0];

            // 5. Registrar Log
            await client.query(
                `INSERT INTO streak_logs (user_id, check_in_date) VALUES ($1, $2)`,
                [userId, today]
            );

            // 6. Otorgar XP (Usando XPService pero manejando transacción manulmente si es necesario, 
            //    o confiando en que XPService maneja su pool. 
            //    NOTA: xpService.awardXP usa pool.connect() internamente.
            //    Para evitar problemas de transacción anidada, lo ideal es pasar el client, 
            //    pero XPService no está diseñado así ahora.
            //    SOLUCIÓN SEGURA: Insertar transacciones de XP manualmente en esta query 
            //    o llamar a XPService DESPUÉS del commit de racha.
            //    Llamar después del commit es seguro: el usuario garantizó su check-in.
            //    Si XP falla, es un error menor que perder el check-in.

            //    *Haremos commit de streak primero.*

            // 7. Verificar Hitos (y sus XP)
            const milestonesAwarded = await this.checkMilestonesInternal(client, userId, newCurrentStreak);

            await client.query('COMMIT');

            // --- LÓGICA POST-COMMIT (XP & Rewards) ---

            let xpGained = 0;
            let levelUpData = null;

            // A. XP Base por Check-in
            try {
                const xpResult = await xpService.awardXP(userId, 10, 'daily_checkin', 'Check-in Diario');
                if (xpResult) {
                    xpGained += xpResult.amountAwared;
                    if (xpResult.leveledUp) levelUpData = xpResult;
                }
            } catch (err) {
                devLogger.warn('[StreakService] Error awarding daily XP:', err);
            }

            // B. XP por Hitos
            for (const ms of milestonesAwarded) {
                if (ms.reward_xp > 0) {
                    try {
                        const msXpRes = await xpService.awardXP(userId, ms.reward_xp, 'streak_milestone', `Hito: ${ms.name}`);
                        if (msXpRes) {
                            xpGained += msXpRes.amountAwared;
                            if (msXpRes.leveledUp) levelUpData = msXpRes; // Último level up data
                        }
                    } catch (err) {
                        devLogger.warn(`[StreakService] Error awarding Milestone XP for ${ms.name}:`, err);
                    }
                }
            }

            return {
                status: 'success',
                streak_frozen: streakFrozen,
                current_streak: newCurrentStreak,
                reset_happened: resetHappened,
                xp_gained: xpGained,
                level_up: levelUpData,
                milestones_awarded: milestonesAwarded,
                streak_data: updatedStreakData
            };

        } catch (error) {
            await client.query('ROLLBACK');
            devLogger.error('[StreakService] Check-in Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async initializeStreak(userId, client = pool) {
        await client.query(
            'INSERT INTO streaks (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
            [userId]
        );
    }

    /**
     * Verifica y otorga hitos dentro de la transacción del check-in.
     * Retorna lista de hitos ganados (sin XP awaring directo, eso va fuera).
     */
    async checkMilestonesInternal(client, userId, currentStreak) {
        // Obtenemos hitos que cumplan el requisito y que el usuario NO tenga
        const query = `
            SELECT id, name, reward_xp, description, badge_icon
            FROM streak_milestone_definitions 
            WHERE days_required <= $1
            AND id NOT IN (SELECT milestone_id FROM user_streak_milestones WHERE user_id = $2)
        `;

        const result = await client.query(query, [currentStreak, userId]);
        const awarded = [];

        for (const milestone of result.rows) {
            await client.query(
                `INSERT INTO user_streak_milestones (user_id, milestone_id) VALUES ($1, $2)`,
                [userId, milestone.id]
            );
            awarded.push(milestone);
        }

        return awarded;
    }

    calculateStreakStatus(lastCheckInDate) {
        if (!lastCheckInDate) return 'inactive';

        const today = new Date();
        const last = new Date(lastCheckInDate);

        today.setHours(0, 0, 0, 0);
        last.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today - last);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'active';
        if (diffDays === 1) return 'pending';
        return 'lost';
    }
}

module.exports = new StreakService();
