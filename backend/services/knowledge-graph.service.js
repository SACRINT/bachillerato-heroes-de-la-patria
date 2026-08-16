const { pool } = require('../config/database.js');
const debugLog = require('../utils/debug-logger.js');

class KnowledgeGraphService {

    /**
     * Obtiene el grafo completo enriquecido con datos del usuario
     */
    async getUserGraph(userId) {
        // 1. Obtener Nodos + Estado de Usuario
        const nodesQuery = `
            SELECT 
                n.id, n.name, n.category, n.complexity_level, n.coordinates_x, n.coordinates_y,
                COALESCE(uks.mastery_level, 0) as mastery_level,
                COALESCE(uks.is_unlocked, false) as is_unlocked,
                COALESCE(uks.confidence_level, 'none') as confidence
            FROM knowledge_nodes n
            LEFT JOIN user_knowledge_state uks ON n.id = uks.node_id AND uks.user_id = $1
        `;

        // 2. Obtener Enlaces
        const linksQuery = `
            SELECT source_node_id as source, target_node_id as target, relation_type, weight
            FROM knowledge_links
        `;

        try {
            const [nodesRes, linksRes] = await Promise.all([
                pool.query(nodesQuery, [userId]),
                pool.query(linksQuery)
            ]);

            // Procesar y formatear para D3/Vis
            const nodes = nodesRes.rows.map(n => ({
                id: n.id,
                label: n.name,
                group: n.category,
                level: n.complexity_level,
                value: 10 + (n.mastery_level / 5), // Tamaño basado en maestría
                title: `Mastery: ${n.mastery_level}%`,
                color: this.getNodeColor(n.mastery_level, n.is_unlocked),
                x: n.coordinates_x ? parseFloat(n.coordinates_x) : undefined,
                y: n.coordinates_y ? parseFloat(n.coordinates_y) : undefined
            }));

            const edges = linksRes.rows.map(l => ({
                from: l.source,
                to: l.target,
                arrows: 'to',
                color: { color: this.getLinkColor(l.relation_type) },
                dashes: l.relation_type === 'related'
            }));

            return { nodes, edges };

        } catch (error) {
            debugLog.error('GRAPH', 'Error fetching graph', error);
            throw error;
        }
    }

    /**
     * Auxiliar para coloreado
     */
    getNodeColor(mastery, unlocked) {
        if (!unlocked && mastery === 0) return '#e9ecef'; // Locked/Gray
        if (mastery >= 90) return '#4cc9f0'; // Mastered/Cyan
        if (mastery >= 70) return '#4361ee'; // High/Blue
        if (mastery >= 40) return '#f72585'; // Medium/Pink
        return '#ffb703'; // Low/Yellow
    }

    getLinkColor(type) {
        if (type === 'prerequisite') return '#adb5bd';
        if (type === 'consequence') return '#4361ee';
        return '#ced4da';
    }

    /**
     * Actualiza el dominio de un tema tras una lección
     */
    async updateNodeMastery(userId, nodeId, score) {
        // Lógica simple: Incremental
        const client = await pool.connect();
        try {
            const factor = score >= 80 ? 10 : (score >= 50 ? 5 : 0);

            const query = `
                INSERT INTO user_knowledge_state (user_id, node_id, mastery_level, is_unlocked, last_interaction)
                VALUES ($1, $2, $3, true, NOW())
                ON CONFLICT (user_id, node_id) DO UPDATE SET
                    mastery_level = LEAST(100, user_knowledge_state.mastery_level + $4),
                    last_interaction = NOW(),
                    is_unlocked = true
            `;
            await client.query(query, [userId, nodeId, factor, factor]);
            return true;
        } finally {
            client.release();
        }
    }
}

module.exports = new KnowledgeGraphService();
