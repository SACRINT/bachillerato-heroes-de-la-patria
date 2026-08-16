"use strict";
/**
 * Challenges and Achievements System
 * Sistema completo de gamificación: retos, logros, rachas, leaderboards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitionsService = exports.leaderboardService = exports.achievementsService = exports.streaksService = exports.challengesService = void 0;
const database_1 = require('../config/database.js');
class ChallengesService {
    /**
     * Generar retos diarios dinámicos
     */
    async generateDailyChallenges() {
        const templates = [
            { titulo: 'Estudiante Dedicado', descripcion: 'Completa 3 tareas hoy', metrica: 'tareas_completadas', objetivo: 3, coins: 50, xp: 100 },
            { titulo: 'Racha de Asistencia', descripcion: 'Inicia sesión 5 días seguidos', metrica: 'login_streak', objetivo: 5, coins: 100, xp: 200 },
            { titulo: 'Excelencia Académica', descripcion: 'Obtén calificación mayor a 9 en 2 materias', metrica: 'calificacion_alta', objetivo: 2, coins: 150, xp: 300 },
            { titulo: 'Participación Activa', descripcion: 'Comenta en 5 clases', metrica: 'comentarios', objetivo: 5, coins: 75, xp: 150 },
            { titulo: 'Investigador', descripcion: 'Lee 3 artículos de la biblioteca', metrica: 'articulos_leidos', objetivo: 3, coins: 60, xp: 120 }
        ];
        // Seleccionar 3 retos aleatorios
        const selected = templates.sort(() => 0.5 - Math.random()).slice(0, 3);
        const challenges = [];
        for (const template of selected) {
            const result = await (0, database_1.executeQuery)(`
                INSERT INTO challenges (
                    tipo, titulo, descripcion, objetivo, metrica,
                    recompensa_coins, recompensa_xp, activo,
                    fecha_inicio, fecha_fin
                ) VALUES (
                    'diario', $1, $2, $3, $4, $5, $6, true,
                    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day'
                )
                RETURNING *
            `, [template.titulo, template.descripcion, template.objetivo,
                template.metrica, template.coins, template.xp]);
            challenges.push(result[0]);
        }
        return challenges;
    }
    /**
     * Obtener retos activos para un usuario
     */
    async getUserChallenges(userId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                c.*,
                ucp.progreso,
                ucp.completado,
                ucp.fecha_completado,
                CASE 
                    WHEN ucp.completado THEN 'completado'
                    WHEN ucp.progreso >= c.objetivo THEN 'listo_reclamar'
                    ELSE 'en_progreso'
                END as status
            FROM challenges c
            LEFT JOIN user_challenge_progress ucp ON c.id = ucp.challenge_id AND ucp.user_id = $1
            WHERE c.activo = true
            AND c.fecha_fin >= CURRENT_DATE
            ORDER BY c.tipo, c.fecha_fin
        `, [userId]);
    }
    /**
     * Actualizar progreso de reto
     */
    async updateProgress(userId, metrica, incremento = 1) {
        // Buscar retos activos con esta métrica
        const challenges = await (0, database_1.executeQuery)(`
            SELECT id FROM challenges
            WHERE metrica = $1 AND activo = true AND fecha_fin >= CURRENT_DATE
        `, [metrica]);
        for (const challenge of challenges) {
            await (0, database_1.executeQuery)(`
                INSERT INTO user_challenge_progress (user_id, challenge_id, progreso)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, challenge_id)
                DO UPDATE SET progreso = user_challenge_progress.progreso + $3
            `, [userId, challenge.id, incremento]);
        }
    }
    /**
     * Reclamar recompensa de reto
     */
    async claimReward(userId, challengeId) {
        const progress = await (0, database_1.executeQuery)(`
            SELECT ucp.*, c.recompensa_coins, c.recompensa_xp, c.objetivo
            FROM user_challenge_progress ucp
            JOIN challenges c ON ucp.challenge_id = c.id
            WHERE ucp.user_id = $1 AND ucp.challenge_id = $2
        `, [userId, challengeId]);
        if (!progress || progress.length === 0 || progress[0].completado) {
            throw new Error('Reto no disponible para reclamar');
        }
        if (progress[0].progreso < progress[0].objetivo) {
            throw new Error('Reto no completado aún');
        }
        // Otorgar recompensas
        await (0, database_1.executeQuery)(`
            UPDATE usuarios
            SET ia_coins = ia_coins + $1, xp = xp + $2
            WHERE id = $3
        `, [progress[0].recompensa_coins, progress[0].recompensa_xp, userId]);
        // Marcar como completado
        await (0, database_1.executeQuery)(`
            UPDATE user_challenge_progress
            SET completado = true, fecha_completado = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND challenge_id = $2
        `, [userId, challengeId]);
        return {
            coins: progress[0].recompensa_coins,
            xp: progress[0].recompensa_xp
        };
    }
}
// ============================================
// STREAKS SERVICE (Rachas)
// ============================================
class StreaksService {
    /**
     * Registrar login diario y actualizar racha
     */
    async recordDailyLogin(userId) {
        const today = new Date().toISOString().split('T')[0];
        // Verificar si ya hizo login hoy
        const todayLogin = await (0, database_1.executeQuery)(`
            SELECT * FROM user_streaks
            WHERE user_id = $1 AND DATE(last_login) = $2
        `, [userId, today]);
        if (todayLogin.length > 0) {
            return todayLogin[0]; // Ya registrado hoy
        }
        // Obtener racha actual
        const streak = await (0, database_1.executeQuery)(`
            SELECT * FROM user_streaks WHERE user_id = $1
        `, [userId]);
        let newStreak = 1;
        let maxStreak = 1;
        if (streak.length > 0) {
            const lastLogin = new Date(streak[0].last_login);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            // Si last_login fue ayer, continuar racha
            if (lastLogin.toDateString() === yesterday.toDateString()) {
                newStreak = streak[0].current_streak + 1;
                maxStreak = Math.max(newStreak, streak[0].max_streak);
            }
            else {
                // Racha rota
                maxStreak = streak[0].max_streak;
            }
        }
        // Actualizar o crear racha
        const result = await (0, database_1.executeQuery)(`
            INSERT INTO user_streaks (user_id, current_streak, max_streak, last_login)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                current_streak = $2,
                max_streak = $3,
                last_login = CURRENT_TIMESTAMP
            RETURNING *
        `, [userId, newStreak, maxStreak]);
        // Otorgar bonus por milestones
        await this.checkStreakMilestones(userId, newStreak);
        return result[0];
    }
    async checkStreakMilestones(userId, streak) {
        const milestones = [7, 14, 30, 60, 100, 365];
        if (milestones.includes(streak)) {
            const bonus = streak * 10; // 7 días = 70 coins, 30 días = 300 coins
            await (0, database_1.executeQuery)(`
                UPDATE usuarios SET ia_coins = ia_coins + $1 WHERE id = $2
            `, [bonus, userId]);
            await (0, database_1.executeQuery)(`
                INSERT INTO notifications (user_id, tipo, titulo, mensaje)
                VALUES ($1, 'milestone', 'Milestone de Racha!', $2)
            `, [userId, `¡${streak} días de racha! Ganaste ${bonus} coins de bonus`]);
        }
    }
}
class AchievementsService {
    /**
     * Verificar y otorgar logros
     */
    async checkAchievements(userId) {
        const achievements = await (0, database_1.executeQuery)(`
            SELECT a.* FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            WHERE ua.id IS NULL
        `, [userId]);
        const unlocked = [];
        for (const achievement of achievements) {
            if (await this.meetsRequirements(userId, achievement.criterio)) {
                await this.unlockAchievement(userId, achievement.id);
                unlocked.push(achievement);
            }
        }
        return unlocked;
    }
    async meetsRequirements(userId, criterio) {
        // Ejemplo de criterios:
        // { type: 'tareas_completadas', value: 50 }
        // { type: 'promedio_general', value: 9.0 }
        // { type: 'login_streak', value: 30 }
        const user = await (0, database_1.executeQuery)(`
            SELECT 
                (SELECT COUNT(*) FROM entregas_tareas WHERE estudiante_id = e.id AND status = 'calificado') as tareas,
                (SELECT AVG(calificacion) FROM calificaciones WHERE estudiante_id = e.id) as promedio,
                u.xp,
                u.ia_coins
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.id = $1
        `, [userId]);
        if (!user || user.length === 0)
            return false;
        const stats = user[0];
        switch (criterio.type) {
            case 'tareas_completadas':
                return stats.tareas >= criterio.value;
            case 'promedio_general':
                return stats.promedio >= criterio.value;
            case 'xp_total':
                return stats.xp >= criterio.value;
            case 'coins_acumulados':
                return stats.ia_coins >= criterio.value;
            default:
                return false;
        }
    }
    async unlockAchievement(userId, achievementId) {
        const achievement = await (0, database_1.executeQuery)(`
            SELECT * FROM achievements WHERE id = $1
        `, [achievementId]);
        await (0, database_1.executeQuery)(`
            INSERT INTO user_achievements (user_id, achievement_id, fecha_desbloqueo)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [userId, achievementId]);
        // Otorgar recompensa
        if (achievement[0].recompensa_coins > 0) {
            await (0, database_1.executeQuery)(`
                UPDATE usuarios SET ia_coins = ia_coins + $1 WHERE id = $2
            `, [achievement[0].recompensa_coins, userId]);
        }
        // Notificar
        await (0, database_1.executeQuery)(`
            INSERT INTO notifications (user_id, tipo, titulo, mensaje)
            VALUES ($1, 'achievement', 'Logro Desbloqueado!', $2)
        `, [userId, `Has desbloqueado: ${achievement[0].nombre}`]);
    }
    async getUserAchievements(userId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                ua.*,
                a.nombre,
                a.descripcion,
                a.icono,
                a.rareza,
                a.categoria
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1
            ORDER BY ua.fecha_desbloqueo DESC
        `, [userId]);
    }
}
// ============================================
// LEADERBOARD SERVICE
// ============================================
class LeaderboardService {
    /**
     * Leaderboard por escuela (tenant)
     */
    async getSchoolLeaderboard(tenantId, timeframe = 'mensual', limit = 100) {
        let dateFilter = '';
        if (timeframe === 'semanal')
            dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
        else if (timeframe === 'mensual')
            dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
        return await (0, database_1.executeQuery)(`
            SELECT 
                u.id,
                u.nombre,
                e.matricula,
                e.grado,
                e.grupo,
                u.xp,
                u.ia_coins,
                (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as logros_total,
                us.current_streak as racha,
                ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.ia_coins DESC) as posicion
            FROM usuarios u
            JOIN estudiantes e ON e.usuario_id = u.id
            LEFT JOIN user_streaks us ON us.user_id = u.id
            WHERE u.tenant_id = $1
            ${dateFilter}
            ORDER BY u.xp DESC, u.ia_coins DESC
            LIMIT $2
        `, [tenantId, limit]);
    }
    /**
     * Leaderboard global (todas las escuelas)
     */
    async getGlobalLeaderboard(limit = 100) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                u.id,
                u.nombre,
                t.nombre_escuela,
                u.xp,
                u.ia_coins,
                (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as logros_total,
                ROW_NUMBER() OVER (ORDER BY u.xp DESC) as posicion_global
            FROM usuarios u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            WHERE u.role = 'student'
            ORDER BY u.xp DESC
            LIMIT $1
        `, [limit]);
    }
    /**
     * Posición individual de un usuario
     */
    async getUserRank(userId, tenantId) {
        const result = await (0, database_1.executeQuery)(`
            WITH ranked AS (
                SELECT 
                    id,
                    xp,
                    ROW_NUMBER() OVER (ORDER BY xp DESC) as posicion
                FROM usuarios
                WHERE tenant_id = $2 AND role = 'student'
            )
            SELECT * FROM ranked WHERE id = $1
        `, [userId, tenantId]);
        return result[0] || { posicion: 0 };
    }
}
// ============================================
// GROUP COMPETITIONS SERVICE
// ============================================
class CompetitionsService {
    /**
     * Crear competencia entre grupos
     */
    async createCompetition(data) {
        const competition = await (0, database_1.executeQuery)(`
            INSERT INTO group_competitions (
                nombre, descripcion, metrica, fecha_inicio, fecha_fin,
                premio_ganador, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'activa')
            RETURNING *
        `, [data.nombre, data.descripcion, data.metrica,
            data.fecha_inicio, data.fecha_fin, data.premio_ganador]);
        // Agregar grupos participantes
        for (const grupoId of data.grupos_ids) {
            await (0, database_1.executeQuery)(`
                INSERT INTO competition_participants (competition_id, grupo_id)
                VALUES ($1, $2)
            `, [competition[0].id, grupoId]);
        }
        return competition[0];
    }
    /**
     * Obtener resultados de competencia
     */
    async getCompetitionResults(competitionId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                cp.grupo_id,
                g.nombre as grupo_nombre,
                g.grado,
                g.seccion,
                cp.puntos_acumulados,
                ROW_NUMBER() OVER (ORDER BY cp.puntos_acumulados DESC) as posicion
            FROM competition_participants cp
            JOIN grupos g ON cp.grupo_id = g.id
            WHERE cp.competition_id = $1
            ORDER BY cp.puntos_acumulados DESC
        `, [competitionId]);
    }
    /**
     * Finalizar competencia y otorgar premios
     */
    async finalizeCompetition(competitionId) {
        const results = await this.getCompetitionResults(competitionId);
        const winner = results[0];
        // Actualizar status
        await (0, database_1.executeQuery)(`
            UPDATE group_competitions
            SET status = 'finalizada', grupo_ganador_id = $2
            WHERE id = $1
        `, [competitionId, winner.grupo_id]);
        // Otorgar premios a todos los estudiantes del grupo ganador
        await (0, database_1.executeQuery)(`
            UPDATE usuarios u
            SET ia_coins = ia_coins + (
                SELECT premio_ganador FROM group_competitions WHERE id = $1
            )
            FROM estudiantes e
            WHERE e.usuario_id = u.id AND e.grupo_id = $2
        `, [competitionId, winner.grupo_id]);
    }
}
// Export instances
exports.challengesService = new ChallengesService();
exports.streaksService = new StreaksService();
exports.achievementsService = new AchievementsService();
exports.leaderboardService = new LeaderboardService();
exports.competitionsService = new CompetitionsService();
