/**
 * Función para obtener un DAO de forma segura
 * @param {string} daoName - Nombre del DAO
 * @returns {Object|null} DAO o null si no existe
 */
export function getDAO(daoName: string): any | null;
/**
 * Función para obtener lista de todos los DAOs registrados
 * @returns {Array} Array de nombres de DAOs
 */
export function listDAOs(): any[];
/**
 * Función para validar que un DAO existe
 * @param {string} daoName - Nombre del DAO
 * @returns {boolean} true si el DAO existe
 */
export function hasDAO(daoName: string): boolean;
export namespace info {
    let totalDAOs: number;
    let lastUpdated: string;
    let version: string;
    let validationStatus: string;
    let daos: any[];
}
//# sourceMappingURL=daos.d.ts.map