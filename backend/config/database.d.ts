export const pool: any;
/**
 * Función query simplificada (alias para pool.query)
 * Para compatibilidad con rutas que usan db.query()
 */
export function query(sql: any, params?: any[]): Promise<any[]>;
/**
 * Ejecutar query con manejo de errores y fallback JSON
 * @param {string} query - SQL query (sintaxis PostgreSQL)
 * @param {Array} params - Parámetros del query
 * @returns {Promise<Array>} Resultado del query
 */
export function executeQuery(query: string, params?: any[]): Promise<any[]>;
/**
 * Ejecutar múltiples queries en transacción
 * @param {Array} queries - Array de objetos {query, params}
 * @returns {Promise<Array>} Resultados de los queries
 */
export function executeTransaction(queries: any[]): Promise<any[]>;
/**
 * Test de conexión a la base de datos con fallback
 */
export function testConnection(): Promise<boolean>;
/**
 * Cerrar pool de conexiones o sistema JSON
 */
export function closePool(): Promise<void>;
/**
 * Obtener estadísticas del pool o sistema JSON
 */
export function getPoolStats(): Promise<{
    totalConnections: any;
    idleConnections: any;
    waitingConnections: any;
    tipo: string;
}>;
/**
 * Forzar uso de PostgreSQL (deshabilitar fallback JSON)
 */
export function forcePostgreSQL(): Promise<boolean>;
/**
 * Habilitar fallback JSON (modo híbrido)
 */
export function enableFallback(): Promise<boolean>;
/**
 * Obtener estado actual del sistema de base de datos
 */
export function getDatabaseMode(): {
    useJsonFallback: boolean;
    mode: string;
    config: {
        source: string;
        ssl: string;
        maxConnections: number;
    };
};
//# sourceMappingURL=database.d.ts.map