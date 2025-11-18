/**
 * 🔍 ADVANCED SEARCH ROUTES - SEMANA 6
 * Endpoints de búsqueda avanzada con PostgreSQL Full-Text Search
 * Fecha: 17 Noviembre 2025
 * Mejoras: Full-text search, filters, analytics, performance < 200ms
 */

const express = require('express');
const router = express.Router();
const searchService = require('../services/search-service');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/search/advanced
 * Búsqueda avanzada con filtros complejos y full-text search
 *
 * Query params:
 * - q: Término de búsqueda (required)
 * - tables: Tablas donde buscar (comma-separated, optional)
 * - operator: 'AND' o 'OR' (default: 'AND')
 * - dateFrom: Fecha desde (ISO 8601, optional)
 * - dateTo: Fecha hasta (ISO 8601, optional)
 * - limit: Límite de resultados (default: 20)
 * - offset: Offset para paginación (default: 0)
 * - filters: JSON string con filtros adicionales (optional)
 */
router.get('/advanced', async (req, res) => {
    try {
        const {
            q,
            tables,
            operator = 'AND',
            dateFrom,
            dateTo,
            limit = 20,
            offset = 0,
            filters: filtersStr
        } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                query: q,
                results: {},
                total: 0,
                took: 0
            });
        }

        // Parse tables
        const tablesToSearch = tables ? tables.split(',').map(t => t.trim()) : undefined;

        // Parse filters
        let parsedFilters = {};
        if (filtersStr) {
            try {
                parsedFilters = JSON.parse(filtersStr);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filters JSON'
                });
            }
        }

        // Parse date range
        const dateRange = {};
        if (dateFrom) dateRange.from = dateFrom;
        if (dateTo) dateRange.to = dateTo;

        // Execute advanced search
        const results = await searchService.advancedSearch({
            query: q,
            tables: tablesToSearch,
            filters: parsedFilters,
            dateRange,
            operator,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(results);

    } catch (error) {
        console.error('[SEARCH] Error en búsqueda avanzada:', error);
        res.status(500).json({
            success: false,
            error: 'Error al realizar la búsqueda'
        });
    }
});

/**
 * GET /api/search/suggestions?q=texto
 * Sugerencias de búsqueda (autocompletado) con debounce-friendly response
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { q, tables, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const tablesToSearch = tables ? tables.split(',').map(t => t.trim()) : undefined;

        const suggestions = await searchService.getSuggestions(
            q,
            tablesToSearch,
            parseInt(limit)
        );

        res.json({
            success: true,
            suggestions
        });

    } catch (error) {
        console.error('[SEARCH] Error en sugerencias:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener sugerencias'
        });
    }
});

/**
 * GET /api/search/analytics/top-terms
 * Obtener términos más buscados (analytics)
 * Auth: Admin only
 */
router.get('/analytics/top-terms', authMiddleware, async (req, res) => {
    try {
        // Solo admins pueden ver analytics
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const { limit = 10, dateFrom, dateTo } = req.query;

        const dateRange = {};
        if (dateFrom) dateRange.from = dateFrom;
        if (dateTo) dateRange.to = dateTo;

        const topTerms = await searchService.getTopSearchTerms(
            parseInt(limit),
            dateRange
        );

        res.json({
            success: true,
            topTerms
        });

    } catch (error) {
        console.error('[SEARCH-ANALYTICS] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener analytics'
        });
    }
});

/**
 * GET /api/search/analytics/summary
 * Obtener resumen de analytics de búsqueda
 * Auth: Admin only
 */
router.get('/analytics/summary', authMiddleware, async (req, res) => {
    try {
        // Solo admins pueden ver analytics
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const { dateFrom, dateTo } = req.query;

        const dateRange = {};
        if (dateFrom) dateRange.from = dateFrom;
        if (dateTo) dateRange.to = dateTo;

        const summary = await searchService.getSearchAnalytics(dateRange);

        res.json({
            success: true,
            ...summary
        });

    } catch (error) {
        console.error('[SEARCH-ANALYTICS] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener analytics'
        });
    }
});

/**
 * GET /api/search/global (LEGACY - Backward compatibility)
 * Búsqueda global simple (mantener para compatibilidad)
 * Redirige a /advanced internamente
 */
router.get('/global', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        // Redirigir a búsqueda avanzada
        const results = await searchService.advancedSearch({
            query: q || '',
            limit: parseInt(limit)
        });

        // Formatear para compatibilidad con API antigua
        res.json({
            success: true,
            query: q,
            results: results.results,
            total: results.total
        });

    } catch (error) {
        console.error('[SEARCH] Error en búsqueda global:', error);
        res.status(500).json({
            success: false,
            error: 'Error al realizar la búsqueda'
        });
    }
});

module.exports = router;
