/**
 * 🔍 SEARCH SERVICE - SEMANA 8
 * Búsqueda full-text avanzada
 *
 * Features:
 * - Búsqueda en múltiples entidades
 * - Full-text search con PostgreSQL
 * - Faceted search
 * - Highlighting
 * - Sugerencias
 *
 * Fecha: 20 Noviembre 2025
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class SearchService {
  constructor() {
    this.searchableEntities = {
      estudiantes: {
        table: 'estudiantes',
        searchColumns: ['nombre', 'apellido_paterno', 'matricula', 'email'],
        returnColumns: ['id', 'nombre', 'apellido_paterno', 'matricula', 'email', 'semestre'],
        type: 'estudiante'
      },
      noticias: {
        table: 'noticias',
        searchColumns: ['titulo', 'contenido', 'resumen'],
        returnColumns: ['id', 'titulo', 'resumen', 'fecha_publicacion'],
        type: 'noticia'
      },
      docentes: {
        table: 'docentes',
        searchColumns: ['nombre', 'apellido_paterno', 'email', 'especialidad'],
        returnColumns: ['id', 'nombre', 'apellido_paterno', 'email', 'especialidad'],
        type: 'docente'
      }
    };
  }

  async search(query, options = {}) {
    const {
      entities = Object.keys(this.searchableEntities),
      limit = 20,
      page = 1,
      highlight = true
    } = options;

    if (!query || query.length < 2) {
      return { success: false, message: 'Búsqueda muy corta' };
    }

    const results = [];
    const searchTerm = `%${query.toLowerCase()}%`;

    for (const entityName of entities) {
      const entity = this.searchableEntities[entityName];
      if (!entity) continue;

      try {
        const whereConditions = entity.searchColumns
          .map((col, i) => `LOWER(${col}) LIKE $${i + 1}`)
          .join(' OR ');

        const params = entity.searchColumns.map(() => searchTerm);

        const result = await pool.query(`
          SELECT ${entity.returnColumns.join(', ')}
          FROM ${entity.table}
          WHERE ${whereConditions}
          LIMIT ${limit}
        `, params);

        result.rows.forEach(row => {
          results.push({
            ...row,
            _type: entity.type,
            _score: this.calculateScore(row, query, entity.searchColumns)
          });
        });

      } catch (error) {
        devLogger.error(`[Search] Error en ${entityName}:`, error.message);
      }
    }

    // Ordenar por relevancia
    results.sort((a, b) => b._score - a._score);

    // Aplicar highlighting
    if (highlight) {
      results.forEach(r => this.applyHighlight(r, query));
    }

    return {
      success: true,
      query,
      total: results.length,
      data: results.slice(0, limit),
      facets: this.getFacets(results)
    };
  }

  calculateScore(row, query, columns) {
    const queryLower = query.toLowerCase();
    let score = 0;

    columns.forEach((col, index) => {
      const value = String(row[col] || '').toLowerCase();
      if (value === queryLower) score += 100;
      else if (value.startsWith(queryLower)) score += 50;
      else if (value.includes(queryLower)) score += 25;

      // Peso por posición de columna
      score += (columns.length - index) * 5;
    });

    return score;
  }

  applyHighlight(row, query) {
    const regex = new RegExp(`(${query})`, 'gi');

    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string' && !key.startsWith('_')) {
        row[`${key}_highlighted`] = row[key].replace(regex, '<mark>$1</mark>');
      }
    });
  }

  getFacets(results) {
    const facets = {};

    results.forEach(r => {
      const type = r._type;
      facets[type] = (facets[type] || 0) + 1;
    });

    return facets;
  }

  async suggest(query, options = {}) {
    const { limit = 5, entity = 'all' } = options;

    if (!query || query.length < 2) {
      return { success: true, suggestions: [] };
    }

    const suggestions = [];
    const searchTerm = `${query.toLowerCase()}%`;

    const entities = entity === 'all'
      ? Object.keys(this.searchableEntities)
      : [entity];

    for (const entityName of entities) {
      const entityConfig = this.searchableEntities[entityName];
      if (!entityConfig) continue;

      const primaryColumn = entityConfig.searchColumns[0];

      try {
        const result = await pool.query(`
          SELECT DISTINCT ${primaryColumn} as suggestion
          FROM ${entityConfig.table}
          WHERE LOWER(${primaryColumn}) LIKE $1
          LIMIT ${limit}
        `, [searchTerm]);

        result.rows.forEach(row => {
          if (row.suggestion) {
            suggestions.push({
              text: row.suggestion,
              type: entityConfig.type
            });
          }
        });
      } catch (error) {
        devLogger.error(`[Search] Suggest error:`, error.message);
      }
    }

    return {
      success: true,
      suggestions: suggestions.slice(0, limit)
    };
  }
}

module.exports = new SearchService();
