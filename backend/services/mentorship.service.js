const { executeQuery } = require('../config/database');

class MentorshipService {

    // Aplicar para ser mentor
    async respondToMentorCall(userId, profileData) {
        const query = `
            INSERT INTO mentor_profiles (user_id, specialties, bio, years_experience)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) 
            DO UPDATE SET specialties = $2, bio = $3, years_experience = $4, is_approved = FALSE
            RETURNING *
        `;
        return await executeQuery(query, [userId, profileData.specialties || [], profileData.bio, profileData.years_experience]);
    }

    // Buscar Mentores
    async findMentors(specialty = null) {
        let query = `
            SELECT mp.*, u.nombre, u.avatar_url 
            FROM mentor_profiles mp
            JOIN usuarios u ON mp.user_id = u.id
            WHERE mp.is_approved = TRUE AND mp.current_mentees < mp.max_mentees
        `;
        const params = [];
        if (specialty) {
            query += ` AND $1 = ANY(mp.specialties)`;
            params.push(specialty);
        }
        return await executeQuery(query, params);
    }

    // Solicitar Mentoría
    async requestMentorship(menteeId, mentorId, goals) {
        // Verificar si ya existe relación
        const existing = await executeQuery(
            'SELECT id FROM mentorships WHERE mentee_id = $1 AND mentor_id = $2 AND status IN (\'pending\', \'active\')',
            [menteeId, mentorId]
        );
        if (existing.length > 0) throw new Error('Ya existe una solicitud o mentoría activa con este mentor');

        const query = `
            INSERT INTO mentorships (mentee_id, mentor_id, goals, status)
            VALUES ($1, $2, $3, 'pending')
            RETURNING id
        `;
        return await executeQuery(query, [menteeId, mentorId, goals]);
    }

    // Gestionar Solicitud (Aceptar/Rechazar) - Por parte del Mentor
    async respondToRequest(mentorId, mentorshipId, action) {
        if (action === 'accept') {
            await executeQuery(
                'UPDATE mentorships SET status = \'active\', start_date = NOW() WHERE id = $1 AND mentor_id = $2',
                [mentorshipId, mentorId]
            );
            // Incrementar contador
            await executeQuery('UPDATE mentor_profiles SET current_mentees = current_mentees + 1 WHERE user_id = $1', [mentorId]);
        } else {
            await executeQuery(
                'UPDATE mentorships SET status = \'rejected\' WHERE id = $1 AND mentor_id = $2',
                [mentorshipId, mentorId]
            );
        }
        return { success: true };
    }

    // Obtener mis mentorías (como mentor o mentee)
    async getMyMentorships(userId) {
        const asMentee = await executeQuery(`
            SELECT m.*, u.nombre as other_name, u.avatar_url as other_avatar
            FROM mentorships m
            JOIN usuarios u ON m.mentor_id = u.id
            WHERE m.mentee_id = $1
        `, [userId]);

        const asMentor = await executeQuery(`
            SELECT m.*, u.nombre as other_name, u.avatar_url as other_avatar
            FROM mentorships m
            JOIN usuarios u ON m.mentee_id = u.id
            WHERE m.mentor_id = $1
        `, [userId]);

        return { asMentee, asMentor };
    }

    // Agendar Sesión
    async scheduleSession(mentorshipId, userId, sessionData) {
        // Validar que usuario pertenece a la mentoría
        const auth = await executeQuery('SELECT 1 FROM mentorships WHERE id = $1 AND (mentor_id = $2 OR mentee_id = $2)', [mentorshipId, userId]);
        if (auth.length === 0) throw new Error('No autorizado');

        const query = `
            INSERT INTO mentorship_sessions (mentorship_id, scheduled_at, topic, meeting_link)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        return await executeQuery(query, [mentorshipId, sessionData.scheduled_at, sessionData.topic, sessionData.meeting_link]);
    }
}

module.exports = new MentorshipService();
