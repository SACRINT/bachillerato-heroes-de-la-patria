/**
 * Tournaments and Events System
 * Sistema completo de torneos, duelos, eventos y notificaciones
 */

import { executeQuery } from '../config/database';

// ============================================
// TOURNAMENTS SERVICE (Torneos de Trivia)
// ============================================

export interface Tournament {
    id?: number;
    nombre: string;
    descripcion: string;
    tipo: 'trivia' | 'examen' | 'competencia' | 'evento_especial';
    categoria: string; // matematicas, historia, ciencias, etc.
    fecha_inicio: Date;
    fecha_fin: Date;
    max_participantes?: number;
    premio_coins: number;
    premio_items?: string[];
    status: 'pendiente' | 'activo' | 'finalizado' | 'cancelado';
}

class TournamentsService {
    /**
     * Crear torneo de trivia
     */
    async createTournament(data: Tournament): Promise<any> {
        const result = await executeQuery(`
            INSERT INTO tournaments (
                nombre, descripcion, tipo, categoria,
                fecha_inicio, fecha_fin, max_participantes,
                premio_coins, premio_items, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente')
            RETURNING *
        `, [
            data.nombre,
            data.descripcion,
            data.tipo,
            data.categoria,
            data.fecha_inicio,
            data.fecha_fin,
            data.max_participantes || 999,
            data.premio_coins,
            JSON.stringify(data.premio_items || [])
        ]) as any[];

        return result[0];
    }

    /**
     * Inscribir usuario a torneo
     */
    async registerParticipant(tournamentId: number, userId: number): Promise<any> {
        // Verificar capacidad
        const tournament = await executeQuery(`
            SELECT 
                t.*,
                (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participantes_actuales
            FROM tournaments t
            WHERE t.id = $1
        `, [tournamentId]) as any[];

        if (!tournament || tournament.length === 0) {
            throw new Error('Torneo no encontrado');
        }

        if (tournament[0].participantes_actuales >= tournament[0].max_participantes) {
            throw new Error('Torneo lleno');
        }

        if (tournament[0].status !== 'pendiente' && tournament[0].status !== 'activo') {
            throw new Error('Torneo no disponible para inscripción');
        }

        // Verificar si ya está inscrito
        const existing = await executeQuery(`
            SELECT id FROM tournament_participants
            WHERE tournament_id = $1 AND user_id = $2
        `, [tournamentId, userId]) as any[];

        if (existing.length > 0) {
            throw new Error('Ya estás inscrito en este torneo');
        }

        // Inscribir
        const result = await executeQuery(`
            INSERT INTO tournament_participants (tournament_id, user_id, puntos, posicion)
            VALUES ($1, $2, 0, 0)
            RETURNING *
        `, [tournamentId, userId]) as any[];

        return result[0];
    }

    /**
     * Actualizar puntos de participante
     */
    async updateParticipantScore(tournamentId: number, userId: number, puntos: number): Promise<void> {
        await executeQuery(`
            UPDATE tournament_participants
            SET puntos = puntos + $3, updated_at = CURRENT_TIMESTAMP
            WHERE tournament_id = $1 AND user_id = $2
        `, [tournamentId, userId, puntos]);

        // Actualizar posiciones
        await this.updateRankings(tournamentId);
    }

    /**
     * Actualizar rankings del torneo
     */
    private async updateRankings(tournamentId: number): Promise<void> {
        await executeQuery(`
            WITH ranked AS (
                SELECT 
                    id,
                    ROW_NUMBER() OVER (ORDER BY puntos DESC, updated_at ASC) as nueva_posicion
                FROM tournament_participants
                WHERE tournament_id = $1
            )
            UPDATE tournament_participants tp
            SET posicion = r.nueva_posicion
            FROM ranked r
            WHERE tp.id = r.id
        `, [tournamentId]);
    }

    /**
     * Finalizar torneo y otorgar premios
     */
    async finalizeTournament(tournamentId: number): Promise<any> {
        await executeQuery(`
            UPDATE tournaments SET status = 'finalizado' WHERE id = $1
        `, [tournamentId]);

        // Obtener top 3
        const winners = await executeQuery(`
            SELECT tp.*, u.nombre, t.premio_coins
            FROM tournament_participants tp
            JOIN usuarios u ON tp.user_id = u.id
            JOIN tournaments t ON tp.tournament_id = t.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.posicion ASC
            LIMIT 3
        `, [tournamentId]) as any[];

        // Otorgar premios
        for (let i = 0; i < winners.length; i++) {
            const multiplier = i === 0 ? 1 : (i === 1 ? 0.5 : 0.25); // 100%, 50%, 25%
            const premio = Math.floor(winners[i].premio_coins * multiplier);

            await executeQuery(`
                UPDATE usuarios SET ia_coins = ia_coins + $1 WHERE id = $2
            `, [premio, winners[i].user_id]);

            await executeQuery(`
                INSERT INTO notifications (user_id, tipo, titulo, mensaje)
                VALUES ($1, 'tournament_prize', 'Premio de Torneo!', $2)
            `, [winners[i].user_id, `Ganaste ${premio} coins por quedar en posición ${i + 1}`]);
        }

        return winners;
    }

    /**
     * Obtener leaderboard del torneo
     */
    async getTournamentLeaderboard(tournamentId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                tp.*,
                u.nombre,
                e.matricula,
                e.grado,
                e.grupo
            FROM tournament_participants tp
            JOIN usuarios u ON tp.user_id = u.id
            LEFT JOIN estudiantes e ON e.usuario_id = u.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.posicion ASC
        `, [tournamentId]) as any[];
    }
}

// ============================================
// DUELS SERVICE (Duelos 1v1)
// ============================================

class DuelsService {
    /**
     * Crear desafío de duelo
     */
    async createDuel(challengerId: number, opponentId: number, categoria: string, apuesta: number): Promise<any> {
        const result = await executeQuery(`
            INSERT INTO duels (
                challenger_id, opponent_id, categoria, apuesta_coins,
                status, fecha_creacion
            ) VALUES ($1, $2, $3, $4, 'pendiente', CURRENT_TIMESTAMP)
            RETURNING *
        `, [challengerId, opponentId, categoria, apuesta]) as any[];

        // Notificar al oponente
        await executeQuery(`
            INSERT INTO notifications (user_id, tipo, titulo, mensaje)
            VALUES ($1, 'duel_challenge', 'Nuevo Desafío!', $2)
        `, [opponentId, `Te han retado a un duelo de ${categoria}`]);

        return result[0];
    }

    /**
     * Aceptar duelo
     */
    async acceptDuel(duelId: number, opponentId: number): Promise<any> {
        const duel = await executeQuery(`
            SELECT * FROM duels WHERE id = $1 AND opponent_id = $2
        `, [duelId, opponentId]) as any[];

        if (!duel || duel.length === 0) {
            throw new Error('Duelo no encontrado');
        }

        if (duel[0].status !== 'pendiente') {
            throw new Error('Duelo no está pendiente');
        }

        // Verificar que ambos tengan coins suficientes
        const [challenger, opponent] = await Promise.all([
            executeQuery('SELECT ia_coins FROM usuarios WHERE id = $1', [duel[0].challenger_id]),
            executeQuery('SELECT ia_coins FROM usuarios WHERE id = $1', [opponentId])
        ]);

        if ((challenger as any[])[0].ia_coins < duel[0].apuesta_coins ||
            (opponent as any[])[0].ia_coins < duel[0].apuesta_coins) {
            throw new Error('Fondos insuficientes');
        }

        // Actualizar duelo
        const result = await executeQuery(`
            UPDATE duels
            SET status = 'en_curso', fecha_inicio = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [duelId]) as any[];

        // Generar preguntas del duelo
        await this.generateDuelQuestions(duelId, duel[0].categoria);

        return result[0];
    }

    /**
     * Generar preguntas para el duelo
     */
    private async generateDuelQuestions(duelId: number, categoria: string): Promise<void> {
        // Mock: En producción, obtener de banco de preguntas
        const mockQuestions = [
            { pregunta: 'Pregunta 1', respuesta_correcta: 'A', opciones: ['A', 'B', 'C', 'D'] },
            { pregunta: 'Pregunta 2', respuesta_correcta: 'B', opciones: ['A', 'B', 'C', 'D'] },
            { pregunta: 'Pregunta 3', respuesta_correcta: 'C', opciones: ['A', 'B', 'C', 'D'] },
            { pregunta: 'Pregunta 4', respuesta_correcta: 'D', opciones: ['A', 'B', 'C', 'D'] },
            { pregunta: 'Pregunta 5', respuesta_correcta: 'A', opciones: ['A', 'B', 'C', 'D'] }
        ];

        for (const q of mockQuestions) {
            await executeQuery(`
                INSERT INTO duel_questions (duel_id, pregunta, respuesta_correcta, opciones)
                VALUES ($1, $2, $3, $4)
            `, [duelId, q.pregunta, q.respuesta_correcta, JSON.stringify(q.opciones)]);
        }
    }

    /**
     * Responder pregunta de duelo
     */
    async answerQuestion(duelId: number, userId: number, questionId: number, respuesta: string): Promise<any> {
        const question = await executeQuery(`
            SELECT * FROM duel_questions WHERE id = $1 AND duel_id = $2
        `, [questionId, duelId]) as any[];

        const isCorrect = question[0].respuesta_correcta === respuesta;

        await executeQuery(`
            INSERT INTO duel_answers (duel_id, user_id, question_id, respuesta, correcta)
            VALUES ($1, $2, $3, $4, $5)
        `, [duelId, userId, questionId, respuesta, isCorrect]);

        // Verificar si el duelo terminó (ambos respondieron todas)
        await this.checkDuelCompletion(duelId);

        return { correct: isCorrect };
    }

    /**
     * Verificar si el duelo terminó
     */
    private async checkDuelCompletion(duelId: number): Promise<void> {
        const stats = await executeQuery(`
            SELECT 
                d.challenger_id,
                d.opponent_id,
                d.apuesta_coins,
                (SELECT COUNT(*) FROM duel_questions WHERE duel_id = d.id) as total_questions,
                (SELECT COUNT(*) FROM duel_answers WHERE duel_id = d.id AND user_id = d.challenger_id) as challenger_answers,
                (SELECT COUNT(*) FROM duel_answers WHERE duel_id = d.id AND user_id = d.opponent_id) as opponent_answers
            FROM duels d
            WHERE d.id = $1
        `, [duelId]) as any[];

        const s = stats[0];

        if (s.challenger_answers === s.total_questions && s.opponent_answers === s.total_questions) {
            await this.finalizeDuel(duelId);
        }
    }

    /**
     * Finalizar duelo
     */
    private async finalizeDuel(duelId: number): Promise<void> {
        const results = await executeQuery(`
            SELECT 
                d.challenger_id,
                d.opponent_id,
                d.apuesta_coins,
                (SELECT COUNT(*) FROM duel_answers WHERE duel_id = d.id AND user_id = d.challenger_id AND correcta = true) as challenger_score,
                (SELECT COUNT(*) FROM duel_answers WHERE duel_id = d.id AND user_id = d.opponent_id AND correcta = true) as opponent_score
            FROM duels d
            WHERE d.id = $1
        `, [duelId]) as any[];

        const r = results[0];
        let winnerId, loserId;

        if (r.challenger_score > r.opponent_score) {
            winnerId = r.challenger_id;
            loserId = r.opponent_id;
        } else if (r.opponent_score > r.challenger_score) {
            winnerId = r.opponent_id;
            loserId = r.challenger_id;
        } else {
            // Empate: devolver apuesta a ambos
            await executeQuery(`
                UPDATE usuarios SET ia_coins = ia_coins + $1
                WHERE id IN ($2, $3)
            `, [r.apuesta_coins, r.challenger_id, r.opponent_id]);

            await executeQuery(`
                UPDATE duels SET status = 'empate', ganador_id = NULL, fecha_fin = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [duelId]);
            return;
        }

        // Otorgar premio (apuesta * 2)
        await executeQuery(`
            UPDATE usuarios SET ia_coins = ia_coins + $1 WHERE id = $2
        `, [r.apuesta_coins * 2, winnerId]);

        await executeQuery(`
            UPDATE duels SET status = 'finalizado', ganador_id = $2, fecha_fin = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [duelId, winnerId]);

        // Notificar
        await executeQuery(`
            INSERT INTO notifications (user_id, tipo, titulo, mensaje)
            VALUES 
                ($1, 'duel_result', 'Victoria en Duelo!', 'Ganaste el duelo y ${r.apuesta_coins * 2} coins'),
                ($2, 'duel_result', 'Duelo Perdido', 'Perdiste el duelo')
        `, [winnerId, loserId]);
    }
}

// ============================================
// EVENTS SERVICE (Eventos Temáticos)
// ============================================

export interface Event {
    id?: number;
    nombre: string;
    descripcion: string;
    tipo: 'examen' | 'fin_semestre' | 'inicio_ciclo' | 'festivo' | 'especial';
    fecha_inicio: Date;
    fecha_fin: Date;
    beneficios: any; // JSON con bonos especiales
    activo: boolean;
}

class EventsService {
    /**
     * Crear evento temático
     */
    async createEvent(data: Event): Promise<any> {
        const result = await executeQuery(`
            INSERT INTO events (
                nombre, descripcion, tipo, fecha_inicio, fecha_fin,
                beneficios, activo
            ) VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING *
        `, [
            data.nombre,
            data.descripcion,
            data.tipo,
            data.fecha_inicio,
            data.fecha_fin,
            JSON.stringify(data.beneficios || {})
        ]) as any[];

        // Notificar a todos los usuarios
        await this.notifyAllUsers(result[0]);

        return result[0];
    }

    /**
     * Obtener eventos activos
     */
    async getActiveEvents(): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM events
            WHERE activo = true
            AND fecha_inicio <= CURRENT_TIMESTAMP
            AND fecha_fin >= CURRENT_TIMESTAMP
            ORDER BY fecha_inicio DESC
        `, []) as any[];
    }

    /**
     * Aplicar beneficios de evento
     */
    async applyEventBenefits(userId: number, eventId: number): Promise<any> {
        const event = await executeQuery(`
            SELECT * FROM events WHERE id = $1 AND activo = true
        `, [eventId]) as any[];

        if (!event || event.length === 0) {
            throw new Error('Evento no encontrado');
        }

        const benefits = event[0].beneficios;

        // Aplicar beneficios (ejemplo: 2x XP, coins bonus, etc.)
        if (benefits.xp_multiplier) {
            // Temporal multiplier flag
            await executeQuery(`
                INSERT INTO user_event_buffs (user_id, event_id, buff_type, buff_value, expires_at)
                VALUES ($1, $2, 'xp_multiplier', $3, $4)
            `, [userId, eventId, benefits.xp_multiplier, event[0].fecha_fin]);
        }

        if (benefits.coins_bonus) {
            await executeQuery(`
                UPDATE usuarios SET ia_coins = ia_coins + $1 WHERE id = $2
            `, [benefits.coins_bonus, userId]);
        }

        return benefits;
    }

    private async notifyAllUsers(event: any): Promise<void> {
        await executeQuery(`
            INSERT INTO notifications (user_id, tipo, titulo, mensaje)
            SELECT 
                id,
                'event_announcement',
                $1,
                $2
            FROM usuarios
            WHERE role = 'student'
        `, [event.nombre, event.descripcion]);
    }
}

// ============================================
// SOCIAL SHARING SERVICE
// ============================================

class SocialSharingService {
    /**
     * Compartir logro en redes sociales
     */
    async shareAchievement(userId: number, achievementId: number, platform: 'facebook' | 'twitter' | 'instagram'): Promise<any> {
        const achievement = await executeQuery(`
            SELECT a.* FROM achievements a
            JOIN user_achievements ua ON a.id = ua.achievement_id
            WHERE ua.user_id = $1 AND a.id = $2
        `, [userId, achievementId]) as any[];

        if (!achievement || achievement.length === 0) {
            throw new Error('Logro no encontrado');
        }

        const shareText = `¡Acabo de desbloquear el logro "${achievement[0].nombre}" en Héroes de la Patria! 🏆`;
        const shareUrl = `https://heroespatria.edu.mx/achievements/${achievementId}`;

        // Registrar compartida
        await executeQuery(`
            INSERT INTO social_shares (user_id, content_type, content_id, platform, share_url)
            VALUES ($1, 'achievement', $2, $3, $4)
        `, [userId, achievementId, platform, shareUrl]);

        // Otorgar bonus por compartir
        await executeQuery(`
            UPDATE usuarios SET ia_coins = ia_coins + 25 WHERE id = $1
        `, [userId]);

        return {
            text: shareText,
            url: shareUrl,
            platform_url: this.getPlatformShareUrl(platform, shareText, shareUrl)
        };
    }

    private getPlatformShareUrl(platform: string, text: string, url: string): string {
        switch (platform) {
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            case 'instagram':
                return url; // Instagram no permite share directo vía URL
            default:
                return url;
        }
    }
}

// ============================================
// NOTIFICATIONS SERVICE
// ============================================

class NotificationsService {
    /**
     * Enviar notificación push
     */
    async sendPushNotification(userId: number, notification: {
        tipo: string;
        titulo: string;
        mensaje: string;
        url?: string;
    }): Promise<void> {
        await executeQuery(`
            INSERT INTO notifications (user_id, tipo, titulo, mensaje, url, leido)
            VALUES ($1, $2, $3, $4, $5, false)
        `, [userId, notification.tipo, notification.titulo, notification.mensaje, notification.url || null]);

        // TODO: Integrar con servicio de push real (Firebase, OneSignal, etc.)
    }

    /**
     * Obtener notificaciones del usuario
     */
    async getUserNotifications(userId: number, limit: number = 50): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [userId, limit]) as any[];
    }

    /**
     * Marcar notificación como leída
     */
    async markAsRead(notificationId: number, userId: number): Promise<void> {
        await executeQuery(`
            UPDATE notifications SET leido = true
            WHERE id = $1 AND user_id = $2
        `, [notificationId, userId]);
    }

    /**
     * Marcar todas como leídas
     */
    async markAllAsRead(userId: number): Promise<void> {
        await executeQuery(`
            UPDATE notifications SET leido = true WHERE user_id = $1
        `, [userId]);
    }
}

// Export instances
export const tournamentsService = new TournamentsService();
export const duelsService = new DuelsService();
export const eventsService = new EventsService();
export const socialSharingService = new SocialSharingService();
export const notificationsService = new NotificationsService();
