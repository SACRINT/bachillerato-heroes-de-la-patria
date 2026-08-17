/**
 * 🕸️ KNOWLEDGE GRAPH & GAP DETECTION SERVICE
 * Bachillerato General Estatal "Héroes de la Patria"
 * Recuperado de código legacy y actualizado para FASE 5 (Semanas 18-20)
 */

const { executeQuery, getPool } = require('../data/database-access.js');
const devLogger = require('../utils/devLogger.js');

// Grafo curricular estructurado oficial BGE
const CURRICULUM_GRAPH = {
    nodes: [
        { id: 'mat_alg_1', name: 'Álgebra y Factorización', category: 'Matemáticas', complexity: 'Básico', level: 1 },
        { id: 'mat_eq_2', name: 'Ecuaciones de 2do Grado', category: 'Matemáticas', complexity: 'Intermedio', level: 2 },
        { id: 'mat_func_3', name: 'Funciones y Gráficas', category: 'Matemáticas', complexity: 'Intermedio', level: 3 },
        { id: 'mat_calc_4', name: 'Cálculo Diferencial (Derivadas)', category: 'Matemáticas', complexity: 'Avanzado', level: 4 },
        { id: 'mat_calc_5', name: 'Cálculo Integral', category: 'Matemáticas', complexity: 'Avanzado', level: 5 },
        
        { id: 'fis_cin_1', name: 'Cinemática y Movimiento Rectilíneo', category: 'Física', complexity: 'Básico', level: 1 },
        { id: 'fis_newt_2', name: 'Leyes de Newton y Dinámica', category: 'Física', complexity: 'Intermedio', level: 2 },
        { id: 'fis_energ_3', name: 'Trabajo y Conservación de Energía', category: 'Física', complexity: 'Avanzado', level: 3 },
        
        { id: 'qui_atom_1', name: 'Estructura Atómica y Tabla Periódica', category: 'Química', complexity: 'Básico', level: 1 },
        { id: 'qui_enlac_2', name: 'Enlaces Químicos y Estequiometría', category: 'Química', complexity: 'Intermedio', level: 2 },
        { id: 'qui_org_3', name: 'Química del Carbono (Orgánica)', category: 'Química', complexity: 'Avanzado', level: 3 }
    ],
    links: [
        // Prerrequisitos de Matemáticas
        { source: 'mat_alg_1', target: 'mat_eq_2', relation_type: 'prerequisite' },
        { source: 'mat_eq_2', target: 'mat_func_3', relation_type: 'prerequisite' },
        { source: 'mat_func_3', target: 'mat_calc_4', relation_type: 'prerequisite' },
        { source: 'mat_calc_4', target: 'mat_calc_5', relation_type: 'prerequisite' },
        
        // Prerrequisitos de Física
        { source: 'mat_alg_1', target: 'fis_cin_1', relation_type: 'applied' },
        { source: 'fis_cin_1', target: 'fis_newt_2', relation_type: 'prerequisite' },
        { source: 'fis_newt_2', target: 'fis_energ_3', relation_type: 'prerequisite' },
        { source: 'mat_calc_4', target: 'fis_energ_3', relation_type: 'applied' },
        
        // Prerrequisitos de Química
        { source: 'qui_atom_1', target: 'qui_enlac_2', relation_type: 'prerequisite' },
        { source: 'qui_enlac_2', target: 'qui_org_3', relation_type: 'prerequisite' }
    ]
};

class KnowledgeGraphService {
    constructor() {
        this.tablesInitialized = false;
        this.initTables();
    }

    async initTables() {
        if (this.tablesInitialized) return;
        try {
            const createNodesTable = `
                CREATE TABLE IF NOT EXISTS knowledge_nodes (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    complexity_level VARCHAR(50) DEFAULT 'Intermedio',
                    level_order INTEGER DEFAULT 1
                );
            `;

            const createLinksTable = `
                CREATE TABLE IF NOT EXISTS knowledge_links (
                    id SERIAL PRIMARY KEY,
                    source_node_id VARCHAR(50) NOT NULL,
                    target_node_id VARCHAR(50) NOT NULL,
                    relation_type VARCHAR(50) DEFAULT 'prerequisite',
                    weight NUMERIC DEFAULT 1.0
                );
            `;

            const createUserStateTable = `
                CREATE TABLE IF NOT EXISTS user_knowledge_state (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    node_id VARCHAR(50) NOT NULL,
                    mastery_level INTEGER DEFAULT 0,
                    is_unlocked BOOLEAN DEFAULT true,
                    last_interaction TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id, node_id)
                );
            `;

            await executeQuery(createNodesTable);
            await executeQuery(createLinksTable);
            await executeQuery(createUserStateTable);

            // Poblar nodos curriculares iniciales
            for (const n of CURRICULUM_GRAPH.nodes) {
                await executeQuery(`
                    INSERT INTO knowledge_nodes (id, name, category, complexity_level, level_order)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO NOTHING
                `, [n.id, n.name, n.category, n.complexity, n.level]);
            }

            this.tablesInitialized = true;
            devLogger.log('[GRAPH-SERVICE] Tablas y nodos del grafo de conocimiento inicializados');
        } catch (e) {
            devLogger.warn('[GRAPH-SERVICE] Error inicializando tablas del grafo (usando fallback en memoria):', e.message);
        }
    }

    /**
     * Obtiene el grafo completo con el estado de maestría del estudiante
     */
    async getUserGraph(userId = 1) {
        await this.initTables();
        let userMasteryMap = {};

        try {
            const query = `
                SELECT node_id, mastery_level, is_unlocked
                FROM user_knowledge_state
                WHERE user_id = $1
            `;
            const rows = await executeQuery(query, [userId]);
            if (rows) {
                rows.forEach(r => {
                    userMasteryMap[r.node_id] = {
                        mastery: parseInt(r.mastery_level) || 0,
                        unlocked: r.is_unlocked !== false
                    };
                });
            }
        } catch (e) {
            devLogger.warn('[GRAPH-SERVICE] Error fetching user knowledge state:', e.message);
        }

        const nodes = CURRICULUM_GRAPH.nodes.map(n => {
            const state = userMasteryMap[n.id] || { mastery: 45, unlocked: true };
            return {
                id: n.id,
                label: n.name,
                category: n.category,
                level: n.complexity,
                mastery: state.mastery,
                unlocked: state.unlocked,
                color: this.getNodeColor(state.mastery, state.unlocked)
            };
        });

        const edges = CURRICULUM_GRAPH.links.map(l => ({
            from: l.source,
            to: l.target,
            relationType: l.relation_type,
            arrows: 'to',
            dashes: l.relation_type === 'applied'
        }));

        return { nodes, edges };
    }

    /**
     * Detección Heurística de Brechas (Knowledge Gaps)
     * Realiza un recorrido inverso en el grafo de prerrequisitos para encontrar la causa raíz
     */
    async detectGaps(userId = 1, failedNodeId = 'mat_calc_4') {
        await this.initTables();

        // 1. Obtener estados de conocimiento del alumno
        let userStates = {};
        try {
            const rows = await executeQuery(`SELECT node_id, mastery_level FROM user_knowledge_state WHERE user_id = $1`, [userId]);
            if (rows) {
                rows.forEach(r => { userStates[r.node_id] = parseInt(r.mastery_level) || 0; });
            }
        } catch (e) {}

        const failedNode = CURRICULUM_GRAPH.nodes.find(n => n.id === failedNodeId) || { id: failedNodeId, name: 'Tema Avanzado' };

        // 2. Backtracking recursivo en enlaces de prerrequisitos
        const prerequisiteChain = [];
        let currentId = failedNodeId;
        let rootGapNode = null;

        // Búsqueda de ancestros en la cadena de prerrequisitos
        const visited = new Set();
        const queue = [currentId];

        while (queue.length > 0) {
            const curr = queue.shift();
            if (visited.has(curr)) continue;
            visited.add(curr);

            const directPrereqs = CURRICULUM_GRAPH.links
                .filter(l => l.target === curr && (l.relation_type === 'prerequisite' || l.relation_type === 'applied'))
                .map(l => l.source);

            for (const prereqId of directPrereqs) {
                const prereqNode = CURRICULUM_GRAPH.nodes.find(n => n.id === prereqId);
                if (prereqNode) {
                    const mastery = userStates[prereqId] !== undefined ? userStates[prereqId] : 40; // Default baja maestría si no evaluado
                    prerequisiteChain.push({
                        ...prereqNode,
                        mastery
                    });

                    // Si la maestría es deficiente (< 70%), es un candidato a causa raíz
                    if (mastery < 70) {
                        rootGapNode = prereqNode;
                    }
                    queue.push(prereqId);
                }
            }
        }

        // Si no se encontró un nodo raíz explícito, usar el prerrequisito base más temprano
        if (!rootGapNode && prerequisiteChain.length > 0) {
            rootGapNode = prerequisiteChain[prerequisiteChain.length - 1];
        }

        const rootGapName = rootGapNode ? rootGapNode.name : 'Conceptos Fundamentales';

        return {
            userId,
            failedTopic: failedNode.name,
            failedTopicId: failedNode.id,
            rootGap: rootGapName,
            rootGapId: rootGapNode?.id || 'mat_alg_1',
            prerequisiteChain: prerequisiteChain.map(p => ({ id: p.id, name: p.name, mastery: `${p.mastery || 40}%` })),
            recommendation: `Te recomendamos repasar "${rootGapName}" antes de continuar con "${failedNode.name}". Comprender la base garantizará tu éxito.`,
            remedialActionUrl: `/assessment-engine.html?topic=${encodeURIComponent(rootGapName)}`
        };
    }

    /**
     * Obtener listado de todas las brechas detectadas para el panel del estudiante
     */
    async getStudentGaps(userId = 1) {
        // Ejecutar detección para temas típicos en los que los alumnos suelen presentar dificultades
        const gaps = [];
        const gap1 = await this.detectGaps(userId, 'mat_calc_4'); // Falla en Cálculo
        gaps.push(gap1);

        return {
            userId,
            totalGaps: gaps.length,
            detectedGaps: gaps
        };
    }

    /**
     * Actualiza el nivel de maestría de un tema
     */
    async updateNodeMastery(userId = 1, nodeId = 'mat_alg_1', score = 85) {
        await this.initTables();
        try {
            const mastery = Math.min(100, Math.max(0, parseInt(score) || 80));
            const query = `
                INSERT INTO user_knowledge_state (user_id, node_id, mastery_level, is_unlocked, last_interaction)
                VALUES ($1, $2, $3, true, NOW())
                ON CONFLICT (user_id, node_id) DO UPDATE SET
                    mastery_level = $3,
                    last_interaction = NOW()
                RETURNING *
            `;
            const rows = await executeQuery(query, [userId, nodeId, mastery]);
            return rows[0] || { user_id: userId, node_id: nodeId, mastery_level: mastery };
        } catch (e) {
            devLogger.warn('[GRAPH-SERVICE] Error en updateNodeMastery:', e.message);
            return { user_id: userId, node_id: nodeId, mastery_level: score };
        }
    }

    getNodeColor(mastery, unlocked) {
        if (!unlocked) return '#94a3b8'; // Gris inactivo
        if (mastery >= 85) return '#10b981'; // Verde dominado
        if (mastery >= 65) return '#3b82f6'; // Azul intermedio
        if (mastery >= 40) return '#f59e0b'; // Amarillo en progreso
        return '#ef4444'; // Rojo en riesgo/brecha
    }
}

module.exports = new KnowledgeGraphService();
