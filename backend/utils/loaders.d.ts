/**
 * Batch load de calificaciones por estudiante_id
 * Resuelve: 1 + N queries → 2 queries
 */
export function createCalificacionesLoader(): DataLoader;
/**
 * Batch load de asistencia por estudiante_id
 */
export function createAsistenciaLoader(): DataLoader;
/**
 * Batch load de pagos pendientes por estudiante_id
 */
export function createPagosPendientesLoader(): DataLoader;
/**
 * Batch load de inscripciones (cursos) por estudiante_id
 */
export function createInscripcionesLoader(): DataLoader;
/**
 * Batch load de docentes por curso_id
 */
export function createDocentesLoader(): DataLoader;
/**
 * Batch load de usuarios por ID
 */
export function createUsuariosLoader(): DataLoader;
/**
 * Crear todos los loaders para una request
 * (Cada request debe tener su propio set de loaders para evitar leaks de caché)
 */
export function createLoaders(): {
    calificaciones: DataLoader;
    asistencia: DataLoader;
    pagosPendientes: DataLoader;
    inscripciones: DataLoader;
    docentes: DataLoader;
    usuarios: DataLoader;
};
/**
 * Middleware que agrega loaders a cada request
 * Usar en app.js: app.use(loadersMiddleware);
 */
export function loadersMiddleware(req: any, res: any, next: any): void;
import DataLoader = require("./dataloader");
//# sourceMappingURL=loaders.d.ts.map