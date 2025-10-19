/**
 * 🔍 SEARCH ROUTES - Búsqueda Global
 * Endpoint para búsqueda global en todo el sistema
 * Fecha: 18 de Octubre, 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/search/global?q=texto&limit=10
 * Búsqueda global en todos los módulos del sistema
 */
router.get('/global', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                query: q,
                results: {
                    noticias: [],
                    eventos: [],
                    avisos: [],
                    comunicados: [],
                    egresados: [],
                    total: 0
                }
            });
        }

        const searchTerm = `%${q.toLowerCase()}%`;
        const limitNum = parseInt(limit);

        // Ejecutar búsquedas en paralelo
        const [
            noticiasResult,
            eventosResult,
            avisosResult,
            comunicadosResult,
            egresadosResult
        ] = await Promise.all([
            // Búsqueda en noticias
            pool.query(`
                SELECT
                    slug as id,
                    titulo as title,
                    resumen as description,
                    'noticia' as type,
                    '/noticias/' || slug as url,
                    fecha_publicacion as date
                FROM noticias
                WHERE (LOWER(titulo) LIKE $1 OR LOWER(contenido) LIKE $1)
                AND estado = 'publicada'
                ORDER BY fecha_publicacion DESC
                LIMIT $2
            `, [searchTerm, limitNum]),

            // Búsqueda en eventos
            pool.query(`
                SELECT
                    slug as id,
                    titulo as title,
                    resumen as description,
                    'evento' as type,
                    '/eventos/' || slug as url,
                    fecha_inicio as date
                FROM eventos
                WHERE (LOWER(titulo) LIKE $1 OR LOWER(descripcion) LIKE $1)
                AND estado = 'publicado'
                ORDER BY fecha_inicio DESC
                LIMIT $2
            `, [searchTerm, limitNum]),

            // Búsqueda en avisos
            pool.query(`
                SELECT
                    slug as id,
                    titulo as title,
                    contenido as description,
                    'aviso' as type,
                    '/avisos/' || slug as url,
                    fecha_publicacion as date
                FROM avisos
                WHERE (LOWER(titulo) LIKE $1 OR LOWER(contenido) LIKE $1)
                AND estado = 'publicada'
                ORDER BY fecha_publicacion DESC
                LIMIT $2
            `, [searchTerm, limitNum]),

            // Búsqueda en comunicados
            pool.query(`
                SELECT
                    slug as id,
                    titulo as title,
                    resumen as description,
                    'comunicado' as type,
                    '/comunicados/' || slug as url,
                    fecha_publicacion as date
                FROM comunicados
                WHERE (LOWER(titulo) LIKE $1 OR LOWER(contenido) LIKE $1)
                AND estado = 'publicada'
                ORDER BY fecha_publicacion DESC
                LIMIT $2
            `, [searchTerm, limitNum]),

            // Búsqueda en egresados
            pool.query(`
                SELECT
                    email as id,
                    CONCAT(nombre_completo, ' - ', carrera) as title,
                    empresa_actual as description,
                    'egresado' as type,
                    '/egresados/' || email as url,
                    fecha_egreso as date
                FROM egresados
                WHERE (LOWER(nombre_completo) LIKE $1 OR LOWER(carrera) LIKE $1 OR LOWER(empresa_actual) LIKE $1)
                AND estado_perfil = 'aprobado'
                ORDER BY fecha_egreso DESC
                LIMIT $2
            `, [searchTerm, limitNum])
        ]);

        // Formatear resultados
        const results = {
            noticias: noticiasResult.rows,
            eventos: eventosResult.rows,
            avisos: avisosResult.rows,
            comunicados: comunicadosResult.rows,
            egresados: egresadosResult.rows,
            total: noticiasResult.rows.length +
                   eventosResult.rows.length +
                   avisosResult.rows.length +
                   comunicadosResult.rows.length +
                   egresadosResult.rows.length
        };

        res.json({
            success: true,
            query: q,
            results
        });
    } catch (error) {
        console.error('Error en búsqueda global:', error);
        res.status(500).json({
            success: false,
            error: 'Error al realizar la búsqueda'
        });
    }
});

/**
 * GET /api/search/suggestions?q=texto
 * Sugerencias de búsqueda (autocompletado)
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const searchTerm = `%${q.toLowerCase()}%`;

        // Obtener sugerencias de títulos
        const result = await pool.query(`
            SELECT DISTINCT titulo as suggestion, 'noticia' as type
            FROM noticias
            WHERE LOWER(titulo) LIKE $1 AND estado = 'publicada'
            LIMIT 5
            UNION
            SELECT DISTINCT titulo as suggestion, 'evento' as type
            FROM eventos
            WHERE LOWER(titulo) LIKE $1 AND estado = 'publicado'
            LIMIT 5
        `, [searchTerm]);

        res.json({
            success: true,
            suggestions: result.rows
        });
    } catch (error) {
        console.error('Error en sugerencias:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener sugerencias'
        });
    }
});

module.exports = router;
