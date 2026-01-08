const { executeQuery } = require('../config/database');

class PeerTutoringService {

    /**
     * Registra o actualiza el perfil de tutor de un usuario
     */
    async registerTutor(userId, profileData) {
        // Verificar si ya existe perfil
        const existing = await executeQuery('SELECT id FROM peer_tutors WHERE user_id = $1', [userId]);

        let tutorId;
        if (existing.length > 0) {
            // Update
            const query = `
                UPDATE peer_tutors 
                SET bio = $1, hourly_rate = $2, is_active = $3, updated_at = NOW()
                WHERE user_id = $4
                RETURNING id
            `;
            const res = await executeQuery(query, [profileData.bio, profileData.hourly_rate, true, userId]);
            tutorId = res[0].id;
        } else {
            // Insert
            const query = `
                INSERT INTO peer_tutors (user_id, bio, hourly_rate)
                VALUES ($1, $2, $3)
                RETURNING id
            `;
            const res = await executeQuery(query, [userId, profileData.bio, profileData.hourly_rate]);
            tutorId = res[0].id;
        }

        // Actualizar materias (Simplificado: borra y reinserta)
        if (profileData.subjects && Array.isArray(profileData.subjects)) {
            await executeQuery('DELETE FROM tutor_subjects WHERE tutor_id = $1', [tutorId]);

            for (const sub of profileData.subjects) {
                await executeQuery(
                    'INSERT INTO tutor_subjects (tutor_id, subject, expertise_level) VALUES ($1, $2, $3)',
                    [tutorId, sub.name, sub.level || 'Intermediate']
                );
            }
        }

        return { tutorId, success: true };
    }

    /**
     * Busca tutores disponibles (Algoritmo de Matching Básico)
     * Puede evolucionar a AI Matching usando historial de éxito
     */
    async findTutors(subject, minRating = 0, maxRate = 1000) {
        let query = `
            SELECT t.*, u.nombre as user_name, u.avatar_url,
            json_agg(ts.subject) as subjects
            FROM peer_tutors t
            JOIN usuarios u ON t.user_id = u.id
            LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
            WHERE t.is_active = TRUE
            AND t.rating >= $1
            AND t.hourly_rate <= $2
        `;
        const params = [minRating, maxRate];

        if (subject) {
            query += ` AND ts.subject ILIKE $3`;
            params.push(subject);
        }

        query += ` GROUP BY t.id, u.id ORDER BY t.rating DESC, t.hourly_rate ASC`;

        return await executeQuery(query, params);
    }

    /**
     * Solicita una sesión de tutoría
     */
    async requestSession(studentId, tutorId, sessionData) {
        const query = `
            INSERT INTO tutoring_sessions 
            (tutor_id, student_id, subject, scheduled_at, duration_minutes, cost, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        // Aquí se debería integrar con el sistema de IACoins para congelar fondos

        return await executeQuery(query, [
            tutorId,
            studentId,
            sessionData.subject,
            sessionData.scheduled_at,
            sessionData.duration || 60,
            sessionData.cost,
            sessionData.notes
        ]);
    }

    /**
     * Gestionar estado de sesión (Aceptar/Rechazar/Completar)
     */
    async updateSessionStatus(sessionId, userId, status) {
        // Validar que el usuario sea el tutor o el estudiante (dependiendo del cambio)
        // Por simplificación actualizamos directo
        const query = `
            UPDATE tutoring_sessions
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        return await executeQuery(query, [status, sessionId]);
    }

    /**
     * Calificar al tutor
     */
    async reviewTutor(sessionId, studentId, rating, comment) {
        // Verificar sesión válida y completada
        const session = await executeQuery(
            'SELECT tutor_id FROM tutoring_sessions WHERE id = $1 AND student_id = $2 AND status = \'completed\'',
            [sessionId, studentId]
        );

        if (session.length === 0) throw new Error('Sesión inválida o no completada');

        const tutorId = session[0].tutor_id;

        // Insertar review
        await executeQuery(
            'INSERT INTO tutor_reviews (session_id, tutor_id, student_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [sessionId, tutorId, studentId, rating, comment]
        );

        // Recalcular rating promedio del tutor (Trigger o cálculo manual)
        await this._updateTutorRating(tutorId);

        return { success: true };
    }

    async _updateTutorRating(tutorId) {
        const aggs = await executeQuery(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM tutor_reviews WHERE tutor_id = $1',
            [tutorId]
        );

        if (aggs.length > 0) {
            const { avg_rating, count } = aggs[0];
            await executeQuery(
                'UPDATE peer_tutors SET rating = $1, total_reviews = $2 WHERE id = $3',
                [parseFloat(avg_rating).toFixed(2), count, tutorId]
            );
        }
    }
}

module.exports = new PeerTutoringService();
