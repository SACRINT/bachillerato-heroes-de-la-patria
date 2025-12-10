/**
 * Crea una conexión de pool de prueba
 */
export function createTestPool(): any;
/**
 * Limpia tablas de prueba
 */
export function cleanTestTables(pool: any, tables: any): Promise<void>;
/**
 * Ejecuta seeds de prueba
 */
export function seedTestData(pool: any, seeds: any): Promise<void>;
export namespace UserFactory {
    function create(pool: any, overrides?: {}): Promise<any>;
    function createAdmin(pool: any, overrides?: {}): Promise<any>;
    function createTeacher(pool: any, overrides?: {}): Promise<any>;
    function createStudent(pool: any, overrides?: {}): Promise<any>;
    function createParent(pool: any, overrides?: {}): Promise<any>;
}
export namespace StudentFactory {
    function create(pool: any, overrides?: {}): Promise<any>;
}
export namespace GradeFactory {
    function create(pool: any, studentId: any, overrides?: {}): Promise<any>;
}
export namespace NotificationFactory {
    function create(pool: any, userId: any, overrides?: {}): Promise<any>;
}
/**
 * Genera token JWT de prueba
 */
export function generateTestToken(payload?: {}, options?: {}): never;
/**
 * Verifica token JWT de prueba
 */
export function verifyTestToken(token: any): string | jwt.JwtPayload;
/**
 * Crea headers de autenticación
 */
export function authHeaders(token: any): {
    Authorization: string;
    'Content-Type': string;
};
/**
 * Crea mock de request Express
 */
export function createMockRequest(overrides?: {}): {
    body: {};
    params: {};
    query: {};
    headers: {};
    user: any;
    ip: string;
    method: string;
    path: string;
    get: (header: any) => any;
};
/**
 * Crea mock de response Express
 */
export function createMockResponse(): {
    statusCode: number;
    _data: any;
    _headers: {};
    status(code: any): /*elided*/ any;
    json(data: any): /*elided*/ any;
    send(data: any): /*elided*/ any;
    setHeader(key: any, value: any): /*elided*/ any;
    getHeader(key: any): any;
    getData(): any;
    getStatusCode(): number;
};
/**
 * Crea mock de next function
 */
export function createMockNext(): jest.Mock<any, any, any>;
/**
 * Verifica estructura de respuesta API estándar
 */
export function expectApiResponse(response: any, options?: {}): void;
/**
 * Verifica estructura de error API
 */
export function expectApiError(response: any, expectedCode: any): void;
/**
 * Verifica paginación
 */
export function expectPagination(meta: any, options?: {}): void;
/**
 * Verifica que un objeto tenga las propiedades esperadas
 */
export function expectProperties(obj: any, properties: any): void;
/**
 * Verifica que una fecha sea válida
 */
export function expectValidDate(dateString: any): void;
/**
 * Espera un tiempo determinado
 */
export function wait(ms: any): Promise<any>;
/**
 * Espera a que una condición sea verdadera
 */
export function waitFor(condition: any, options?: {}): Promise<boolean>;
/**
 * Mide el tiempo de ejecución
 */
export function measureTime(fn: any): Promise<{
    result: any;
    duration: number;
}>;
/**
 * Genera email aleatorio
 */
export function randomEmail(domain?: string): string;
/**
 * Genera string aleatorio
 */
export function randomString(length?: number): string;
/**
 * Genera número aleatorio en rango
 */
export function randomNumber(min?: number, max?: number): number;
/**
 * Genera fecha aleatoria
 */
export function randomDate(start?: Date, end?: Date): Date;
/**
 * Genera calificación aleatoria (0-10)
 */
export function randomGrade(): number;
/**
 * Configura entorno de prueba
 */
export function setupTestEnvironment(): void;
/**
 * Restaura entorno después de pruebas
 */
export function teardownTestEnvironment(): void;
/**
 * Crea contexto de prueba completo
 */
export function createTestContext(): Promise<{
    pool: any;
    factories: {
        user: {
            create(pool: any, overrides?: {}): Promise<any>;
            createAdmin(pool: any, overrides?: {}): Promise<any>;
            createTeacher(pool: any, overrides?: {}): Promise<any>;
            createStudent(pool: any, overrides?: {}): Promise<any>;
            createParent(pool: any, overrides?: {}): Promise<any>;
        };
        student: {
            create(pool: any, overrides?: {}): Promise<any>;
        };
        grade: {
            create(pool: any, studentId: any, overrides?: {}): Promise<any>;
        };
        notification: {
            create(pool: any, userId: any, overrides?: {}): Promise<any>;
        };
    };
    auth: {
        generateToken: typeof generateTestToken;
        verifyToken: typeof verifyTestToken;
        headers: typeof authHeaders;
    };
    cleanup: () => Promise<void>;
}>;
/**
 * Prepara objeto para snapshot (remueve campos dinámicos)
 */
export function prepareForSnapshot(obj: any, fieldsToRemove?: string[]): any;
/**
 * Espera que una función async lance un error
 */
export function expectAsyncError(fn: any, expectedError: any): Promise<any>;
import jwt = require("jsonwebtoken");
//# sourceMappingURL=index.d.ts.map