/**
 * 🔍 RUTAS DE BÚSQUEDA SEMÁNTICA VECTORIAL (pgvector)
 * Fase 6 - Backend Inteligente: Objetivo 2
 * Endpoints:
 *   POST /api/search/semantic            → Búsqueda por lenguaje natural
 *   GET  /api/search/semantic            → Búsqueda por query string (?q=...)
 *   GET  /api/search/semantic/categories → Listar categorías y estadísticas
 *   POST /api/search/semantic/seed       → Sembrar o regenerar embeddings
 */

const express = require('express');
const { semanticSearchService } = require('../services/semantic-search.service.js');
const router = express.Router();

// Helper para extraer tenant_id del JWT o header
function getTenantId(req) {
    return req.user?.tenant_id || req.tenant?.id || 1;
}

/**
 * POST /api/search/semantic
 * Body: { query: string, limit?: number, category?: string, minScore?: number }
 */
router.post('/semantic', async (req, res) => {
    try {
        const { query, limit, category, minScore } = req.body || {};
        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro "query" es requerido y no puede estar vacío.'
            });
        }

        const tenantId = getTenantId(req);
        const results = await semanticSearchService.search(query.trim(), tenantId, {
            limit: parseInt(limit) || 5,
            category: category || null,
            minScore: minScore !== undefined ? parseFloat(minScore) : 0.05
        });

        res.json({
            success: true,
            query: query.trim(),
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('[API-SEMANTIC] Error procesando búsqueda semántica:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno en búsqueda semántica: ' + error.message
        });
    }
});

/**
 * GET /api/search/semantic?q=...&limit=5&category=...
 */
router.get('/semantic', async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro de consulta "?q=" es requerido.'
            });
        }

        const tenantId = getTenantId(req);
        const results = await semanticSearchService.search(query.trim(), tenantId, {
            limit: parseInt(req.query.limit) || 5,
            category: req.query.category || null,
            minScore: req.query.minScore !== undefined ? parseFloat(req.query.minScore) : 0.05
        });

        res.json({
            success: true,
            query: query.trim(),
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('[API-SEMANTIC] Error procesando GET semantic search:', error);
        res.status(500).json({
            success: false,
            error: 'Error en búsqueda semántica: ' + error.message
        });
    }
});

/**
 * GET /api/search/semantic/categories
 */
router.get('/semantic/categories', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const pool = semanticSearchService.getPool();
        if (!pool) {
            return res.json({
                success: true,
                categories: ['reglamento', 'academico', 'tramites', 'becas', 'admisiones', 'contacto', 'convivencia', 'vida_estudiantil']
            });
        }

        const result = await pool.query(`
            SELECT category, COUNT(*) as count 
            FROM school_knowledge_embeddings 
            WHERE tenant_id = $1 
            GROUP BY category 
            ORDER BY count DESC;
        `, [tenantId]);

        res.json({
            success: true,
            categories: result.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/search/semantic/seed
 * Regenerar o sembrar embeddings
 */
router.post('/semantic/seed', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const result = await semanticSearchService.seedKnowledgeBase(tenantId);
        res.json({
            success: true,
            message: 'Base de conocimiento vectorial sembrada exitosamente.',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
