/**
 * Servicio de Torneos y Competencias
 * BGE Héroes de la Patria
 * FASE 3 - Semana 21-22
 *
 * Sistema de torneos académicos con brackets, equipos y premios
 */

const pool = require('../data/database-access').pool;

class TournamentsService {
    constructor() {
        // Tipos de torneo soportados
        this.tournamentTypes = ['quiz', 'challenge', 'project', 'hackathon', 'debate'];

        // Formatos de competencia
        this.formats = ['bracket', 'round_robin', 'swiss', 'league'];

        // Estados de torneo
        this.statuses = ['draft', 'registration', 'active', 'completed', 'cancelled'];
    }

    // ========================================
    // GESTIÓN DE TORNEOS
    // ========================================

    /**
     * Crear nuevo torneo
     */
    async createTournament(tournamentData) {
        const {
            name, description, tournamentType, format, subject, topics,
            minParticipants, maxParticipants, teamSize, registrationStart,
            registrationEnd, startDate, endDate, minLevel, entryFeeCoins,
            prizePoolCoins, prizePoolXp, prizes, rules, scoringSystem,
            settings, createdBy
        } = tournamentData;

        // Generar slug
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' + Date.now().toString(36);

        const result = await pool.query(`
            INSERT INTO tournaments (
                name, slug, description, tournament_type, format, subject,
                topics, min_participants, max_participants, team_size,
                is_team_tournament, registration_start, registration_end,
                start_date, end_date, min_level, entry_fee_coins,
                prize_pool_coins, prize_pool_xp, prizes, rules,
                scoring_system, settings, created_by, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'draft'
            )
            RETURNING *
        `, [
            name, slug, description, tournamentType, format || 'bracket',
            subject, JSON.stringify(topics || []), minParticipants || 2,
            maxParticipants || 100, teamSize || 1, (teamSize || 1) > 1,
            registrationStart, registrationEnd, startDate, endDate,
            minLevel || 1, entryFeeCoins || 0, prizePoolCoins || 0,
            prizePoolXp || 0, JSON.stringify(prizes || []), rules,
            JSON.stringify(scoringSystem || {}), JSON.stringify(settings || {}),
            createdBy
        ]);

        return result.rows[0];
    }

    /**
     * Obtener torneos con filtros
     */
    async getTournaments(options = {}) {
        const {
            status, tournamentType, subject, featured,
            page = 1, limit = 20
        } = options;
        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (status) {
            params.push(status);
            whereClause += ` AND status = $${params.length}`;
        }

        if (tournamentType) {
            params.push(tournamentType);
            whereClause += ` AND tournament_type = $${params.length}`;
        }

        if (subject) {
            params.push(subject);
            whereClause += ` AND subject = $${params.length}`;
        }

        if (featured) {
            whereClause += ` AND is_featured = true`;
        }

        params.push(limit, offset);

        const result = await pool.query(`
            SELECT *,
                (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = tournaments.id) as current_participants
            FROM tournaments
            ${whereClause}
            ORDER BY
                CASE status
                    WHEN 'registration' THEN 1
                    WHEN 'active' THEN 2
                    WHEN 'draft' THEN 3
                    ELSE 4
                END,
                start_date ASC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        return result.rows;
    }

    /**
     * Obtener torneo por ID
     */
    async getTournamentById(tournamentId, userId = null) {
        const result = await pool.query(`
            SELECT t.*,
                (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as current_participants,
                (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = t.id) as total_matches
            FROM tournaments t
            WHERE t.id = $1
        `, [tournamentId]);

        if (result.rows.length === 0) return null;

        const tournament = result.rows[0];

        // Verificar si el usuario está registrado
        if (userId) {
            const participantResult = await pool.query(`
                SELECT * FROM tournament_participants
                WHERE tournament_id = $1 AND user_id = $2
            `, [tournamentId, userId]);
            tournament.userParticipation = participantResult.rows[0] || null;
        }

        return tournament;
    }

    /**
     * Actualizar estado del torneo
     */
    async updateTournamentStatus(tournamentId, newStatus) {
        const result = await pool.query(`
            UPDATE tournaments
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [tournamentId, newStatus]);

        // Si se activa, generar brackets/rondas
        if (newStatus === 'active') {
            await this.generateBrackets(tournamentId);
        }

        return result.rows[0];
    }

    // ========================================
    // PARTICIPACIÓN
    // ========================================

    /**
     * Registrar participante en torneo
     */
    async registerParticipant(tournamentId, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar torneo
            const tournament = await client.query(`
                SELECT * FROM tournaments WHERE id = $1
            `, [tournamentId]);

            if (tournament.rows.length === 0) {
                throw new Error('Torneo no encontrado');
            }

            const t = tournament.rows[0];

            // Verificar estado
            if (t.status !== 'registration') {
                throw new Error('El torneo no está abierto para registro');
            }

            // Verificar capacidad
            const countResult = await client.query(`
                SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1
            `, [tournamentId]);

            if (parseInt(countResult.rows[0].count) >= t.max_participants) {
                throw new Error('El torneo está lleno');
            }

            // Verificar nivel mínimo
            const userResult = await client.query(`
                SELECT COALESCE(
                    (SELECT current_level FROM user_levels WHERE user_id = $1),
                    1
                ) as level
            `, [userId]);

            if (userResult.rows[0].level < t.min_level) {
                throw new Error(`Nivel mínimo requerido: ${t.min_level}`);
            }

            // Cobrar entrada si aplica
            if (t.entry_fee_coins > 0) {
                const balanceResult = await client.query(`
                    SELECT balance FROM iacoins_wallets WHERE user_id = $1
                `, [userId]);

                const balance = balanceResult.rows[0]?.balance || 0;
                if (balance < t.entry_fee_coins) {
                    throw new Error(`IACoins insuficientes. Necesitas: ${t.entry_fee_coins}`);
                }

                // Descontar
                await client.query(`
                    UPDATE iacoins_wallets
                    SET balance = balance - $2, updated_at = NOW()
                    WHERE user_id = $1
                `, [userId, t.entry_fee_coins]);

                // Registrar transacción
                await client.query(`
                    INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description)
                    VALUES ($1, 'spent', $2, $3)
                `, [userId, t.entry_fee_coins, `Entrada a torneo: ${t.name}`]);
            }

            // Registrar participante
            const participant = await client.query(`
                INSERT INTO tournament_participants (
                    tournament_id, user_id, status, entry_paid, paid_at
                ) VALUES ($1, $2, 'registered', $3, $4)
                RETURNING *
            `, [
                tournamentId, userId,
                t.entry_fee_coins > 0, t.entry_fee_coins > 0 ? new Date() : null
            ]);

            // Actualizar contador
            await client.query(`
                UPDATE tournaments
                SET participant_count = participant_count + 1
                WHERE id = $1
            `, [tournamentId]);

            await client.query('COMMIT');
            return participant.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Retirar participante
     */
    async withdrawParticipant(tournamentId, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(`
                UPDATE tournament_participants
                SET status = 'withdrawn'
                WHERE tournament_id = $1 AND user_id = $2
                RETURNING *
            `, [tournamentId, userId]);

            if (result.rows.length === 0) {
                throw new Error('Participante no encontrado');
            }

            await client.query(`
                UPDATE tournaments
                SET participant_count = GREATEST(0, participant_count - 1)
                WHERE id = $1
            `, [tournamentId]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener participantes de un torneo
     */
    async getParticipants(tournamentId, options = {}) {
        const { status, page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        const params = [tournamentId];
        let whereClause = 'WHERE p.tournament_id = $1';

        if (status) {
            params.push(status);
            whereClause += ` AND p.status = $${params.length}`;
        }

        params.push(limit, offset);

        const result = await pool.query(`
            SELECT p.*, u.nombre, u.apellido_paterno, u.email
            FROM tournament_participants p
            JOIN usuarios u ON p.user_id = u.id
            ${whereClause}
            ORDER BY p.points DESC, p.wins DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        return result.rows;
    }

    // ========================================
    // MATCHES Y COMPETENCIA
    // ========================================

    /**
     * Generar brackets para torneo
     */
    async generateBrackets(tournamentId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener participantes
            const participants = await client.query(`
                SELECT * FROM tournament_participants
                WHERE tournament_id = $1 AND status = 'registered'
                ORDER BY RANDOM()
            `, [tournamentId]);

            const count = participants.rows.length;
            if (count < 2) {
                throw new Error('Se necesitan al menos 2 participantes');
            }

            // Calcular rondas necesarias
            const rounds = Math.ceil(Math.log2(count));

            // Crear rondas
            const roundNames = ['Ronda 1', 'Ronda 2', 'Cuartos de Final', 'Semifinal', 'Final'];

            for (let i = 0; i < rounds; i++) {
                await client.query(`
                    INSERT INTO tournament_rounds (tournament_id, round_number, name, status)
                    VALUES ($1, $2, $3, $4)
                `, [
                    tournamentId, i + 1,
                    roundNames[Math.min(i, roundNames.length - 1)] || `Ronda ${i + 1}`,
                    i === 0 ? 'pending' : 'pending'
                ]);
            }

            // Obtener primera ronda
            const firstRound = await client.query(`
                SELECT id FROM tournament_rounds
                WHERE tournament_id = $1 AND round_number = 1
            `, [tournamentId]);

            // Crear matches de primera ronda
            const matchesFirstRound = Math.ceil(count / 2);
            for (let i = 0; i < matchesFirstRound; i++) {
                const p1 = participants.rows[i * 2];
                const p2 = participants.rows[i * 2 + 1];

                await client.query(`
                    INSERT INTO tournament_matches (
                        tournament_id, round_id, participant1_id, participant2_id,
                        match_number, status
                    ) VALUES ($1, $2, $3, $4, $5, 'scheduled')
                `, [
                    tournamentId, firstRound.rows[0].id,
                    p1?.id, p2?.id, i + 1
                ]);

                // Asignar seeds
                if (p1) {
                    await client.query(`
                        UPDATE tournament_participants SET seed = $1 WHERE id = $2
                    `, [i * 2 + 1, p1.id]);
                }
                if (p2) {
                    await client.query(`
                        UPDATE tournament_participants SET seed = $1 WHERE id = $2
                    `, [i * 2 + 2, p2.id]);
                }
            }

            // Actualizar estado de participantes
            await client.query(`
                UPDATE tournament_participants
                SET status = 'active', confirmed_at = NOW()
                WHERE tournament_id = $1 AND status = 'registered'
            `, [tournamentId]);

            await client.query('COMMIT');
            return { rounds, matchesFirstRound };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener matches de un torneo
     */
    async getMatches(tournamentId, options = {}) {
        const { roundId, status, page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        const params = [tournamentId];
        let whereClause = 'WHERE m.tournament_id = $1';

        if (roundId) {
            params.push(roundId);
            whereClause += ` AND m.round_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            whereClause += ` AND m.status = $${params.length}`;
        }

        params.push(limit, offset);

        const result = await pool.query(`
            SELECT m.*,
                p1.user_id as user1_id,
                p2.user_id as user2_id,
                u1.nombre as user1_nombre,
                u2.nombre as user2_nombre
            FROM tournament_matches m
            LEFT JOIN tournament_participants p1 ON m.participant1_id = p1.id
            LEFT JOIN tournament_participants p2 ON m.participant2_id = p2.id
            LEFT JOIN usuarios u1 ON p1.user_id = u1.id
            LEFT JOIN usuarios u2 ON p2.user_id = u2.id
            ${whereClause}
            ORDER BY m.round_id, m.match_number
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        return result.rows;
    }

    /**
     * Iniciar match
     */
    async startMatch(matchId) {
        const result = await pool.query(`
            UPDATE tournament_matches
            SET status = 'live', started_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [matchId]);

        return result.rows[0];
    }

    /**
     * Registrar resultado de match
     */
    async recordMatchResult(matchId, resultData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { score1, score2, winnerId, responses, duration } = resultData;

            // Determinar ganador
            let winner = winnerId;
            let isDraw = false;

            if (!winner) {
                if (score1 > score2) {
                    const match = await client.query(`
                        SELECT participant1_id FROM tournament_matches WHERE id = $1
                    `, [matchId]);
                    winner = match.rows[0].participant1_id;
                } else if (score2 > score1) {
                    const match = await client.query(`
                        SELECT participant2_id FROM tournament_matches WHERE id = $1
                    `, [matchId]);
                    winner = match.rows[0].participant2_id;
                } else {
                    isDraw = true;
                }
            }

            // Actualizar match
            const match = await client.query(`
                UPDATE tournament_matches
                SET status = 'completed',
                    score1 = $2,
                    score2 = $3,
                    winner_participant_id = $4,
                    is_draw = $5,
                    responses = $6,
                    duration_seconds = $7,
                    ended_at = NOW()
                WHERE id = $1
                RETURNING *
            `, [matchId, score1, score2, winner, isDraw, JSON.stringify(responses || []), duration]);

            const m = match.rows[0];

            // Actualizar estadísticas de participantes
            if (m.participant1_id) {
                await this.updateParticipantStats(m.participant1_id, {
                    won: winner === m.participant1_id,
                    lost: winner === m.participant2_id,
                    draw: isDraw,
                    score: score1
                }, client);
            }

            if (m.participant2_id) {
                await this.updateParticipantStats(m.participant2_id, {
                    won: winner === m.participant2_id,
                    lost: winner === m.participant1_id,
                    draw: isDraw,
                    score: score2
                }, client);
            }

            await client.query('COMMIT');
            return match.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualizar estadísticas de participante
     */
    async updateParticipantStats(participantId, result, client) {
        const { won, lost, draw, score } = result;

        await client.query(`
            UPDATE tournament_participants
            SET
                matches_played = matches_played + 1,
                wins = wins + $2,
                losses = losses + $3,
                draws = draws + $4,
                total_score = total_score + $5,
                points = points + $6,
                status = CASE
                    WHEN $3 = 1 THEN 'eliminated'
                    ELSE status
                END,
                eliminated_at = CASE
                    WHEN $3 = 1 THEN NOW()
                    ELSE eliminated_at
                END
            WHERE id = $1
        `, [
            participantId,
            won ? 1 : 0,
            lost ? 1 : 0,
            draw ? 1 : 0,
            score || 0,
            won ? 3 : (draw ? 1 : 0)
        ]);
    }

    // ========================================
    // LEADERBOARD
    // ========================================

    /**
     * Obtener leaderboard de torneo
     */
    async getLeaderboard(tournamentId, limit = 20) {
        const result = await pool.query(`
            SELECT
                p.user_id,
                u.nombre,
                u.apellido_paterno,
                p.wins,
                p.losses,
                p.draws,
                p.points,
                p.total_score,
                p.matches_played,
                p.status,
                p.final_rank,
                RANK() OVER (ORDER BY p.points DESC, p.total_score DESC) as current_rank
            FROM tournament_participants p
            JOIN usuarios u ON p.user_id = u.id
            WHERE p.tournament_id = $1
            ORDER BY p.points DESC, p.total_score DESC
            LIMIT $2
        `, [tournamentId, limit]);

        return result.rows;
    }

    /**
     * Actualizar leaderboard
     */
    async updateLeaderboard(tournamentId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Calcular rankings
            const rankings = await client.query(`
                SELECT
                    user_id,
                    wins, losses, points, total_score, matches_played,
                    RANK() OVER (ORDER BY points DESC, total_score DESC) as rank
                FROM tournament_participants
                WHERE tournament_id = $1
                ORDER BY rank
            `, [tournamentId]);

            // Actualizar/insertar en leaderboard
            for (const row of rankings.rows) {
                await client.query(`
                    INSERT INTO tournament_leaderboards (
                        tournament_id, user_id, rank, points, wins, losses,
                        score, matches_played, avg_score
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (tournament_id, user_id) DO UPDATE SET
                        previous_rank = tournament_leaderboards.rank,
                        rank = $3,
                        points = $4,
                        wins = $5,
                        losses = $6,
                        score = $7,
                        matches_played = $8,
                        avg_score = $9,
                        updated_at = NOW()
                `, [
                    tournamentId, row.user_id, row.rank, row.points,
                    row.wins, row.losses, row.total_score, row.matches_played,
                    row.matches_played > 0 ? row.total_score / row.matches_played : 0
                ]);
            }

            await client.query('COMMIT');
            return rankings.rows;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // PREMIOS Y FINALIZACIÓN
    // ========================================

    /**
     * Finalizar torneo y distribuir premios
     */
    async finalizeTournament(tournamentId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener torneo y premios
            const tournament = await client.query(`
                SELECT * FROM tournaments WHERE id = $1
            `, [tournamentId]);

            if (tournament.rows.length === 0) {
                throw new Error('Torneo no encontrado');
            }

            const t = tournament.rows[0];
            const prizes = t.prizes || [];

            // Obtener ranking final
            const rankings = await this.getLeaderboard(tournamentId, 100);

            // Distribuir premios
            for (const prize of prizes) {
                const winner = rankings.find(r => r.current_rank === prize.rank);
                if (winner) {
                    // Actualizar participante
                    await client.query(`
                        UPDATE tournament_participants
                        SET final_rank = $1,
                            prize_won_coins = $2,
                            prize_won_xp = $3,
                            badge_won_id = $4
                        WHERE tournament_id = $5 AND user_id = $6
                    `, [prize.rank, prize.coins || 0, prize.xp || 0, prize.badge_id, tournamentId, winner.user_id]);

                    // Dar IACoins
                    if (prize.coins > 0) {
                        await client.query(`
                            UPDATE iacoins_wallets
                            SET balance = balance + $2, total_earned = total_earned + $2
                            WHERE user_id = $1
                        `, [winner.user_id, prize.coins]);

                        await client.query(`
                            INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description)
                            VALUES ($1, 'earned', $2, $3)
                        `, [winner.user_id, prize.coins, `Premio torneo: ${t.name} (${prize.rank}° lugar)`]);
                    }

                    // Dar XP
                    if (prize.xp > 0) {
                        await client.query(`
                            UPDATE user_levels
                            SET current_xp = current_xp + $2
                            WHERE user_id = $1
                        `, [winner.user_id, prize.xp]);
                    }

                    // Registrar en historial
                    await client.query(`
                        INSERT INTO tournament_history (
                            user_id, tournament_id, final_rank, total_points,
                            total_score, coins_won, xp_won, matches_played,
                            wins, losses
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (user_id, tournament_id) DO UPDATE SET
                            final_rank = $3, coins_won = $6, xp_won = $7
                    `, [
                        winner.user_id, tournamentId, prize.rank, winner.points,
                        winner.total_score, prize.coins || 0, prize.xp || 0,
                        winner.matches_played, winner.wins, winner.losses
                    ]);
                }
            }

            // Marcar torneo como completado
            await client.query(`
                UPDATE tournaments
                SET status = 'completed', updated_at = NOW()
                WHERE id = $1
            `, [tournamentId]);

            await client.query('COMMIT');
            return { success: true, winners: rankings.slice(0, 3) };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // HISTORIAL Y ESTADÍSTICAS
    // ========================================

    /**
     * Obtener historial de torneos del usuario
     */
    async getUserTournamentHistory(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT h.*, t.name, t.tournament_type, t.subject
            FROM tournament_history h
            JOIN tournaments t ON h.tournament_id = t.id
            WHERE h.user_id = $1
            ORDER BY h.completed_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        return result.rows;
    }

    /**
     * Obtener estadísticas de torneos del usuario
     */
    async getUserTournamentStats(userId) {
        const result = await pool.query(`
            SELECT
                COUNT(*) as tournaments_played,
                SUM(wins) as total_wins,
                SUM(losses) as total_losses,
                SUM(coins_won) as total_coins_won,
                SUM(xp_won) as total_xp_won,
                COUNT(*) FILTER (WHERE final_rank = 1) as first_places,
                COUNT(*) FILTER (WHERE final_rank <= 3) as podium_finishes,
                AVG(final_rank) as avg_rank
            FROM tournament_history
            WHERE user_id = $1
        `, [userId]);

        return result.rows[0];
    }

    /**
     * Obtener torneos activos del usuario
     */
    async getUserActiveTournaments(userId) {
        const result = await pool.query(`
            SELECT t.*, p.status as participation_status, p.points, p.wins
            FROM tournament_participants p
            JOIN tournaments t ON p.tournament_id = t.id
            WHERE p.user_id = $1 AND t.status IN ('registration', 'active')
            ORDER BY t.start_date ASC
        `, [userId]);

        return result.rows;
    }

    /**
     * Obtener logros de torneos del usuario
     */
    async getUserAchievements(userId) {
        const result = await pool.query(`
            SELECT a.*, ua.earned_at, t.name as tournament_name
            FROM tournament_user_achievements ua
            JOIN tournament_achievements a ON ua.achievement_id = a.id
            LEFT JOIN tournaments t ON ua.tournament_id = t.id
            WHERE ua.user_id = $1
            ORDER BY ua.earned_at DESC
        `, [userId]);

        return result.rows;
    }
}

module.exports = new TournamentsService();
