/**
 * Simula executeQuery de MySQL
 */
export function executeQuery(query: any, params?: any[]): Promise<any>;
/**
 * Test de conexión (siempre exitoso para JSON)
 */
export function testConnection(): Promise<boolean>;
/**
 * Cerrar "conexión" (no hace nada en JSON)
 */
export function closePool(): Promise<void>;
/**
 * Stats del sistema JSON
 */
export function getPoolStats(): Promise<{
    totalUsuarios: any;
    totalInformacion: any;
    sistemaActivo: boolean;
    tipo: string;
}>;
//# sourceMappingURL=database-json.d.ts.map