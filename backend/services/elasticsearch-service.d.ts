export const client: any;
/**
 * Crear índice si no existe
 * @param {string} indexName - Nombre del índice
 * @param {object} mappings - Mappings del índice
 */
export function createIndexIfNotExists(indexName: string, mappings: object): Promise<void>;
/**
 * Eliminar índice
 * @param {string} indexName - Nombre del índice
 */
export function deleteIndex(indexName: string): Promise<void>;
/**
 * Indexar documento
 * @param {string} indexName - Nombre del índice
 * @param {string} docId - ID del documento
 * @param {object} document - Documento a indexar
 */
export function indexDocument(indexName: string, docId: string, document: object): Promise<any>;
/**
 * Actualizar documento
 * @param {string} indexName - Nombre del índice
 * @param {string} docId - ID del documento
 * @param {object} updates - Campos a actualizar
 */
export function updateDocument(indexName: string, docId: string, updates: object): Promise<any>;
/**
 * Eliminar documento
 * @param {string} indexName - Nombre del índice
 * @param {string} docId - ID del documento
 */
export function deleteDocument(indexName: string, docId: string): Promise<any>;
/**
 * Buscar estudiantes con multi-match
 * @param {string} query - Texto de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {object} options - Opciones de búsqueda (limit, offset)
 */
export function searchStudents(query: string, tenantId: string, options?: object): Promise<{
    total: any;
    students: any;
}>;
/**
 * Buscar noticias con full-text search
 * @param {string} query - Texto de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {object} options - Opciones de búsqueda
 */
export function searchNews(query: string, tenantId: string, options?: object): Promise<{
    total: any;
    news: any;
}>;
/**
 * Búsqueda universal en múltiples índices
 * @param {string} query - Texto de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {array} indices - Índices a buscar
 */
export function universalSearch(query: string, tenantId: string, indices?: any[]): Promise<any>;
/**
 * Obtener sugerencias de autocompletado
 * @param {string} prefix - Prefijo de búsqueda
 * @param {string} field - Campo a buscar
 * @param {string} index - Índice
 */
export function getSuggestions(prefix: string, field: string, index?: string): Promise<any>;
/**
 * Obtener términos más buscados
 * @param {string} indexName - Nombre del índice
 * @param {string} field - Campo a agregar
 */
export function getTopSearchTerms(indexName: string, field?: string): Promise<any>;
//# sourceMappingURL=elasticsearch-service.d.ts.map