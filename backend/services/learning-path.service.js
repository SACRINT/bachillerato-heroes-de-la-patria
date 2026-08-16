/**
 * 🛣️ LEARNING PATH SERVICE
 * Propósito: Optimización dinámica del currículo del estudiante (Fase 6 - Semana 43)
 */

const { executeQuery } = require('../config/database.js');

class LearningPathService {

    async assignPath(userId, pathId) {
        // 1. Get Base Path
        const basePath = await executeQuery('SELECT base_structure_json FROM learning_paths WHERE id = $1', [pathId]);
        if (basePath.length === 0) throw new Error('Path not found');

        // 2. Create User Instance
        const query = `
            INSERT INTO user_learning_paths (user_id, path_id, current_structure_json)
            VALUES ($1, $2, $3)
            RETURNING id, current_structure_json
        `;
        const res = await executeQuery(query, [userId, pathId, basePath[0].base_structure_json]);
        return res[0];
    }

    async optimizePath(userId, pathId) {
        // 1. Fetch User Performance
        // Mock: Check if user failed "Algebra I"
        const failedModules = ['Algebra I']; // Simulated detection
        const userPathRes = await executeQuery(
            'SELECT * FROM user_learning_paths WHERE user_id = $1 AND path_id = $2',
            [userId, pathId]
        );

        if (userPathRes.length === 0) throw new Error('User path not found');
        const userPath = userPathRes[0];
        let structure = userPath.current_structure_json;

        // 2. Apply Logic: Inject Remedial Module
        // If 'Algebra I' failed, add 'Algebra Remedial' before 'Algebra II'
        if (failedModules.includes('Algebra I')) {
            // Mock manipulation of JSON structure
            // In real app: Graph traversal and insertion
            structure.modules = [...(structure.modules || []), { id: 999, name: 'Algebra Refuerzo' }];
        }

        // 3. Save Update
        await executeQuery(
            'UPDATE user_learning_paths SET current_structure_json = $1, last_optimization_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(structure), userPath.id]
        );

        // 4. Log Action
        await executeQuery(
            `INSERT INTO path_optimizations_log (user_path_id, trigger_reason, action_taken, details_json)
             VALUES ($1, 'failed_exam', 'add_module', '{"module": "Algebra Refuerzo"}')`,
            [userPath.id]
        );

        return { optimized: true, newStructure: structure };
    }

    async getUserPath(userId, pathId) {
        const res = await executeQuery(
            'SELECT * FROM user_learning_paths WHERE user_id = $1 AND path_id = $2',
            [userId, pathId]
        );
        return res[0];
    }
}

module.exports = new LearningPathService();
