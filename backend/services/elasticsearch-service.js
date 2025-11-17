/**
 * 🔍 ELASTICSEARCH SERVICE - Full-Text Search
 * Sistema de búsqueda avanzada con Elasticsearch
 * Semana 11-12 - Features Avanzadas
 */

const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/winston-logger');

// Cliente de Elasticsearch
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_PASSWORD
    ? {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD,
      }
    : undefined,
});

// =============================================================================
// GESTIÓN DE ÍNDICES
// =============================================================================

/**
 * Crear índice si no existe
 * @param {string} indexName - Nombre del índice
 * @param {object} mappings - Mappings del índice
 */
async function createIndexIfNotExists(indexName, mappings) {
  try {
    const exists = await client.indices.exists({ index: indexName });

    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: {
          mappings,
          settings: {
            analysis: {
              analyzer: {
                spanish_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'spanish_stop', 'spanish_stemmer'],
                },
              },
              filter: {
                spanish_stop: {
                  type: 'stop',
                  stopwords: '_spanish_',
                },
                spanish_stemmer: {
                  type: 'stemmer',
                  language: 'spanish',
                },
              },
            },
          },
        },
      });

      logger.info(`[ELASTICSEARCH] Índice creado: ${indexName}`);
    }
  } catch (error) {
    logger.logError(error, { context: 'createIndexIfNotExists', indexName });
    throw error;
  }
}

/**
 * Eliminar índice
 * @param {string} indexName - Nombre del índice
 */
async function deleteIndex(indexName) {
  try {
    await client.indices.delete({ index: indexName });
    logger.info(`[ELASTICSEARCH] Índice eliminado: ${indexName}`);
  } catch (error) {
    logger.logError(error, { context: 'deleteIndex', indexName });
    throw error;
  }
}

// =============================================================================
// INDEXACIÓN DE DOCUMENTOS
// =============================================================================

/**
 * Indexar documento
 * @param {string} indexName - Nombre del índice
 * @param {string} docId - ID del documento
 * @param {object} document - Documento a indexar
 */
async function indexDocument(indexName, docId, document) {
  try {
    const result = await client.index({
      index: indexName,
      id: docId,
      body: document,
      refresh: true,
    });

    logger.debug(`[ELASTICSEARCH] Documento indexado: ${indexName}/${docId}`);
    return result;
  } catch (error) {
    logger.logError(error, { context: 'indexDocument', indexName, docId });
    throw error;
  }
}

/**
 * Actualizar documento
 * @param {string} indexName - Nombre del índice
 * @param {string} docId - ID del documento
 * @param {object} updates - Campos a actualizar
 */
async function updateDocument(indexName, docId, updates) {
  try {
    const result = await client.update({
      index: indexName,
      id: docId,
      body: {
        doc: updates,
      },
      refresh: true,
    });

    logger.debug(`[ELASTICSEARCH] Documento actualizado: ${indexName}/${docId}`);
    return result;
  } catch (error) {
    logger.logError(error, { context: 'updateDocument', indexName, docId });
    throw error;
  }
}

/**
 * Eliminar documento
 * @param {string} indexName - Nombre del índice
 * @param {string} docId - ID del documento
 */
async function deleteDocument(indexName, docId) {
  try {
    const result = await client.delete({
      index: indexName,
      id: docId,
      refresh: true,
    });

    logger.debug(`[ELASTICSEARCH] Documento eliminado: ${indexName}/${docId}`);
    return result;
  } catch (error) {
    logger.logError(error, { context: 'deleteDocument', indexName, docId });
    throw error;
  }
}

// =============================================================================
// BÚSQUEDA DE ESTUDIANTES
// =============================================================================

/**
 * Buscar estudiantes con multi-match
 * @param {string} query - Texto de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {object} options - Opciones de búsqueda (limit, offset)
 */
async function searchStudents(query, tenantId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  try {
    const result = await client.search({
      index: 'students',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['nombre^3', 'email', 'matricula^4', 'apellido_paterno^2', 'apellido_materno'],
                  fuzziness: 'AUTO',
                  type: 'best_fields',
                },
              },
            ],
            filter: [{ term: { tenant_id: tenantId } }],
          },
        },
        from: offset,
        size: limit,
        highlight: {
          fields: {
            nombre: {},
            email: {},
            matricula: {},
          },
        },
      },
    });

    return {
      total: result.hits.total.value,
      students: result.hits.hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
        _highlights: hit.highlight,
      })),
    };
  } catch (error) {
    logger.logError(error, { context: 'searchStudents', query, tenantId });
    throw error;
  }
}

// =============================================================================
// BÚSQUEDA DE NOTICIAS
// =============================================================================

/**
 * Buscar noticias con full-text search
 * @param {string} query - Texto de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {object} options - Opciones de búsqueda
 */
async function searchNews(query, tenantId, options = {}) {
  const { limit = 20, offset = 0, dateFrom, dateTo, categories } = options;

  try {
    const mustClauses = [
      {
        multi_match: {
          query,
          fields: ['titulo^3', 'contenido', 'resumen^2', 'tags'],
          fuzziness: 'AUTO',
        },
      },
    ];

    const filterClauses = [{ term: { tenant_id: tenantId } }, { term: { publicado: true } }];

    // Filtro de fecha
    if (dateFrom || dateTo) {
      filterClauses.push({
        range: {
          fecha_publicacion: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        },
      });
    }

    // Filtro de categorías
    if (categories && categories.length > 0) {
      filterClauses.push({
        terms: { categoria: categories },
      });
    }

    const result = await client.search({
      index: 'news',
      body: {
        query: {
          bool: {
            must: mustClauses,
            filter: filterClauses,
          },
        },
        from: offset,
        size: limit,
        sort: [{ fecha_publicacion: { order: 'desc' } }],
        highlight: {
          fields: {
            titulo: {},
            contenido: { fragment_size: 150 },
            resumen: {},
          },
        },
      },
    });

    return {
      total: result.hits.total.value,
      news: result.hits.hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
        _highlights: hit.highlight,
      })),
    };
  } catch (error) {
    logger.logError(error, { context: 'searchNews', query, tenantId });
    throw error;
  }
}

// =============================================================================
// BÚSQUEDA UNIVERSAL (CROSS-INDEX)
// =============================================================================

/**
 * Búsqueda universal en múltiples índices
 * @param {string} query - Texto de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {array} indices - Índices a buscar
 */
async function universalSearch(query, tenantId, indices = ['students', 'news', 'teachers']) {
  try {
    const result = await client.search({
      index: indices.join(','),
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['*'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [{ term: { tenant_id: tenantId } }],
          },
        },
        size: 50,
      },
    });

    return result.hits.hits.map((hit) => ({
      index: hit._index,
      type: hit._index.slice(0, -1), // Remove 's' for singular
      ...hit._source,
      _score: hit._score,
    }));
  } catch (error) {
    logger.logError(error, { context: 'universalSearch', query, tenantId });
    throw error;
  }
}

// =============================================================================
// SUGERENCIAS (AUTOCOMPLETE)
// =============================================================================

/**
 * Obtener sugerencias de autocompletado
 * @param {string} prefix - Prefijo de búsqueda
 * @param {string} field - Campo a buscar
 * @param {string} index - Índice
 */
async function getSuggestions(prefix, field, index = 'students') {
  try {
    const result = await client.search({
      index,
      body: {
        suggest: {
          autocomplete: {
            prefix,
            completion: {
              field: `${field}_suggest`,
              size: 10,
              fuzzy: {
                fuzziness: 'AUTO',
              },
            },
          },
        },
      },
    });

    return result.suggest.autocomplete[0].options.map((option) => option.text);
  } catch (error) {
    logger.logError(error, { context: 'getSuggestions', prefix, field });
    return [];
  }
}

// =============================================================================
// ANALYTICS
// =============================================================================

/**
 * Obtener términos más buscados
 * @param {string} indexName - Nombre del índice
 * @param {string} field - Campo a agregar
 */
async function getTopSearchTerms(indexName, field = 'query_text') {
  try {
    const result = await client.search({
      index: indexName,
      body: {
        size: 0,
        aggs: {
          top_terms: {
            terms: {
              field: `${field}.keyword`,
              size: 10,
            },
          },
        },
      },
    });

    return result.aggregations.top_terms.buckets;
  } catch (error) {
    logger.logError(error, { context: 'getTopSearchTerms', indexName });
    return [];
  }
}

module.exports = {
  client,
  createIndexIfNotExists,
  deleteIndex,
  indexDocument,
  updateDocument,
  deleteDocument,
  searchStudents,
  searchNews,
  universalSearch,
  getSuggestions,
  getTopSearchTerms,
};
