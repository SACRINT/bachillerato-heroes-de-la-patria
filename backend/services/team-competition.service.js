const { executeQuery } = require('../config/database');

class TeamCompetitionService {

    // Crear Equipo
    async createTeam(userId, teamData) {
        // Verificar si el usuario ya tiene equipo
        const existing = await executeQuery('SELECT id FROM team_members WHERE user_id = $1', [userId]);
        if (existing.length > 0) throw new Error('El usuario ya pertenece a un equipo');

        const query = `
            INSERT INTO competition_teams (name, motto, captain_id, avatar_url)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name
        `;
        const res = await executeQuery(query, [teamData.name, teamData.motto, userId, teamData.avatar_url]);
        const team = res[0];

        // Añadir capitán como miembro
        await executeQuery(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, \'captain\')',
            [team.id, userId]
        );

        return team;
    }

    // Unirse a Equipo (por código o invitación - simplificado a ID directo por ahora para MVP)
    async joinTeam(userId, teamId) {
        // Verificar membresía existente
        const existing = await executeQuery('SELECT id FROM team_members WHERE user_id = $1', [userId]);
        if (existing.length > 0) throw new Error('El usuario ya tiene equipo. Debe salir primero.');

        // Verificar capacidad (opcional, ej. max 5)
        const count = await executeQuery('SELECT COUNT(*) as c FROM team_members WHERE team_id = $1', [teamId]);
        if (count[0].c >= 5) throw new Error('Equipo lleno');

        await executeQuery(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, \'member\')',
            [teamId, userId]
        );

        return { success: true };
    }

    // Obtener mi equipo
    async getMyTeam(userId) {
        const member = await executeQuery('SELECT team_id FROM team_members WHERE user_id = $1', [userId]);
        if (member.length === 0) return null;

        const teamId = member[0].team_id;
        const team = await executeQuery('SELECT * FROM competition_teams WHERE id = $1', [teamId]);

        const members = await executeQuery(`
            SELECT tm.*, u.nombre, u.avatar_url 
            FROM team_members tm
            JOIN usuarios u ON tm.user_id = u.id
            WHERE tm.team_id = $1
        `, [teamId]);

        return { ...team[0], members };
    }

    // Listar Competencias Activas
    async getActiveCompetitions() {
        return await executeQuery('SELECT * FROM competitions WHERE status = \'active\' OR status = \'upcoming\' ORDER BY start_date ASC');
    }

    // Inscribir Equipo a Competencia
    async registerForCompetition(teamId, competitionId) {
        await executeQuery(
            'INSERT INTO competition_enrollments (competition_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [competitionId, teamId]
        );
        return { success: true };
    }

    // Lista Global de Equipos (Leaderboard)
    async getLeaderboard() {
        return await executeQuery('SELECT * FROM competition_teams ORDER BY score DESC LIMIT 50');
    }
}

module.exports = new TeamCompetitionService();
