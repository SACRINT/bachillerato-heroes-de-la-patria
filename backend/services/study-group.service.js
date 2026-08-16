const { executeQuery } = require('../config/database.js');
const crypto = require('crypto');

class StudyGroupService {

    /**
     * Crea un nuevo grupo de estudio
     */
    async createGroup(userId, groupData) {
        const joinCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 caracteres

        const query = `
            INSERT INTO study_groups 
            (name, description, subject, topic, created_by, max_members, is_private, join_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            groupData.name,
            groupData.description,
            groupData.subject,
            groupData.topic,
            userId,
            groupData.max_members || 10,
            groupData.is_private || false,
            joinCode
        ];

        try {
            const result = await executeQuery(query, values);
            const newGroup = result[0];

            // Añadir creador como admin
            await this.addMember(newGroup.id, userId, 'admin');

            return newGroup;
        } catch (error) {
            console.error('Error creating study group:', error);
            throw error;
        }
    }

    /**
     * Añade un miembro al grupo
     */
    async addMember(groupId, userId, role = 'member') {
        const query = `
            INSERT INTO study_group_members (group_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (group_id, user_id) DO NOTHING
            RETURNING *
        `;
        return await executeQuery(query, [groupId, userId, role]);
    }

    /**
     * Obtiene los grupos de un usuario
     */
    async getUserGroups(userId) {
        const query = `
            SELECT sg.*, sgm.role as my_role,
            (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id) as member_count
            FROM study_groups sg
            JOIN study_group_members sgm ON sg.id = sgm.group_id
            WHERE sgm.user_id = $1
            ORDER BY sg.created_at DESC
        `;
        return await executeQuery(query, [userId]);
    }

    /**
     * Busca grupos públicos
     */
    async searchGroups(subject, topic) {
        let query = `
            SELECT sg.*,
            (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id) as member_count
            FROM study_groups sg
            WHERE sg.is_private = FALSE
        `;
        const params = [];

        if (subject) {
            params.push(subject);
            query += ` AND sg.subject ILIKE $${params.length}`;
        }

        // MVP simplificado, lógica de filtrado básica
        query += ` ORDER BY sg.created_at DESC LIMIT 20`;

        return await executeQuery(query, params);
    }

    /**
     * Unirse a un grupo mediante código o ID (si es público)
     */
    async joinGroup(userId, groupId, joinCode) {
        // Verificar grupo
        const groups = await executeQuery('SELECT * FROM study_groups WHERE id = $1', [groupId]);
        if (groups.length === 0) throw new Error('Grupo no encontrado');
        const group = groups[0];

        // Verificar código si es privado
        if (group.is_private && group.join_code !== joinCode) {
            throw new Error('Código de unión inválido');
        }

        // Verificar capacidad
        const members = await executeQuery('SELECT COUNT(*) as count FROM study_group_members WHERE group_id = $1', [groupId]);
        if (parseInt(members[0].count) >= group.max_members) {
            throw new Error('El grupo está lleno');
        }

        return await this.addMember(groupId, userId, 'member');
    }

    /**
     * Crear una sesión de estudio
     */
    async createSession(userId, groupId, sessionData) {
        // Verificar permisos (solo miembros pueden crear sesiones?)
        // Por ahora permitimos a cualquier miembro
        const query = `
            INSERT INTO study_group_sessions
            (group_id, title, start_time, meeting_link, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        return await executeQuery(query, [
            groupId,
            sessionData.title,
            sessionData.start_time,
            sessionData.meeting_link,
            userId
        ]);
    }

    async getGroupSessions(groupId) {
        return await executeQuery(
            'SELECT * FROM study_group_sessions WHERE group_id = $1 ORDER BY start_time ASC',
            [groupId]
        );
    }
}

module.exports = new StudyGroupService();
