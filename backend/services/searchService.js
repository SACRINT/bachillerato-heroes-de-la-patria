/**
 * 🔍 SEARCH SERVICE - v2.0.0
 * Búsqueda full-text avanzada - Refactorizado: 04 Diciembre 2025
 */

const SearchDAO = require('../data/search.dao.js');
const devLogger = require('../utils/devLogger.js');

class SearchService {
  constructor() {
    this.searchableEntities = {
      estudiantes: { table: 'estudiantes', searchColumns: ['nombre', 'apellido_paterno', 'matricula', 'email'], returnColumns: ['id', 'nombre', 'apellido_paterno', 'matricula', 'email', 'semestre'], type: 'estudiante' },
      noticias: { table: 'noticias', searchColumns: ['titulo', 'contenido', 'resumen'], returnColumns: ['id', 'titulo', 'resumen', 'fecha_publicacion'], type: 'noticia' },
      docentes: { table: 'docentes', searchColumns: ['nombre', 'apellido_paterno', 'email', 'especialidad'], returnColumns: ['id', 'nombre', 'apellido_paterno', 'email', 'especialidad'], type: 'docente' }
    };
  }

  async search(query, options = {}) {
    const { entities = Object.keys(this.searchableEntities), limit = 20, highlight = true } = options;
    if (!query || query.length < 2) return { success: false, message: 'Búsqueda muy corta' };

    const results = [];
    const searchTerm = `%${query.toLowerCase()}%`;

    for (const entityName of entities) {
      const entity = this.searchableEntities[entityName];
      if (!entity) continue;
      try {
        const rows = await SearchDAO.searchEntity(entity.table, entity.searchColumns, entity.returnColumns, searchTerm, limit);
        rows.forEach(row => results.push({ ...row, _type: entity.type, _score: this.calculateScore(row, query, entity.searchColumns) }));
      } catch (error) { devLogger.error(`[Search] Error en ${entityName}:`, error.message); }
    }

    results.sort((a, b) => b._score - a._score);
    if (highlight) results.forEach(r => this.applyHighlight(r, query));
    return { success: true, query, total: results.length, data: results.slice(0, limit), facets: this.getFacets(results) };
  }

  calculateScore(row, query, columns) {
    const queryLower = query.toLowerCase(); let score = 0;
    columns.forEach((col, index) => {
      const value = String(row[col] || '').toLowerCase();
      if (value === queryLower) score += 100; else if (value.startsWith(queryLower)) score += 50; else if (value.includes(queryLower)) score += 25;
      score += (columns.length - index) * 5;
    });
    return score;
  }

  applyHighlight(row, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    Object.keys(row).forEach(key => { if (typeof row[key] === 'string' && !key.startsWith('_')) row[`${key}_highlighted`] = row[key].replace(regex, '<mark>$1</mark>'); });
  }

  getFacets(results) { const facets = {}; results.forEach(r => facets[r._type] = (facets[r._type] || 0) + 1); return facets; }

  async suggest(query, options = {}) {
    const { limit = 5, entity = 'all' } = options;
    if (!query || query.length < 2) return { success: true, suggestions: [] };
    const suggestions = []; const searchTerm = `${query.toLowerCase()}%`;
    const entities = entity === 'all' ? Object.keys(this.searchableEntities) : [entity];
    for (const entityName of entities) {
      const entityConfig = this.searchableEntities[entityName];
      if (!entityConfig) continue;
      try {
        const rows = await SearchDAO.suggestEntity(entityConfig.table, entityConfig.searchColumns[0], searchTerm, limit);
        rows.forEach(row => { if (row.suggestion) suggestions.push({ text: row.suggestion, type: entityConfig.type }); });
      } catch (error) { devLogger.error(`[Search] Suggest error:`, error.message); }
    }
    return { success: true, suggestions: suggestions.slice(0, limit) };
  }
}

module.exports = new SearchService();
