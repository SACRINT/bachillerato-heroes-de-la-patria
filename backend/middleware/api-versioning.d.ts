/**
 * Middleware para detectar y validar versión de API
 *
 * Orden de prioridad:
 * 1. Header: Accept-Version: v2
 * 2. URL path: /api/v2/...
 * 3. Query param: ?api_version=v2
 * 4. Default: v2
 */
export function apiVersioning(req: any, res: any, next: any): any;
/**
 * Transforma requests v1 al formato v2 (backward compatibility)
 *
 * Cambios principales v1 → v2:
 * - Campo `active` → `status` ('active'/'inactive')
 * - Campo `password` → `password_hash`
 * - Response format: data wrapping
 */
export function v1CompatibilityLayer(req: any, res: any, next: any): any;
export function rateLimitByTier(req: any, res: any, next: any): any;
/**
 * Obtiene información de todas las versiones disponibles
 */
export function getVersionsInfo(): {
    supportedVersions: string[];
    defaultVersion: string;
    versions: {
        v1: {
            version: string;
            status: string;
            deprecationDate: string;
            endOfLifeDate: string;
            features: string[];
        };
        v2: {
            version: string;
            status: string;
            features: string[];
        };
    };
};
/**
 * Verifica si una feature está disponible en una versión
 */
export function isFeatureAvailable(version: any, feature: any): any;
export namespace API_VERSIONS {
    namespace v1 {
        let version: string;
        let status: string;
        let deprecationDate: string;
        let endOfLifeDate: string;
        let features: string[];
    }
    namespace v2 {
        let version_1: string;
        export { version_1 as version };
        let status_1: string;
        export { status_1 as status };
        let features_1: string[];
        export { features_1 as features };
    }
}
export const SUPPORTED_VERSIONS: string[];
export const DEFAULT_VERSION: "v2";
//# sourceMappingURL=api-versioning.d.ts.map