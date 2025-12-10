/**
 * Validar request body
 */
export function validateBody(schema: any): (req: any, res: any, next: any) => any;
/**
 * Validar query params
 */
export function validateQuery(schema: any): (req: any, res: any, next: any) => any;
/**
 * Validar params (IDs en URL)
 */
export function validateParams(schema: any): (req: any, res: any, next: any) => any;
export function validateId(req: any, res: any, next: any): any;
export function validatePagination(req: any, res: any, next: any): any;
/**
 * Schema para emails
 */
export const emailSchema: any;
/**
 * Schema para contraseñas
 */
export const passwordSchema: any;
/**
 * Schema para nombres
 */
export const nameSchema: any;
/**
 * Schema para teléfonos
 */
export const phoneSchema: any;
/**
 * Schema para IDs numéricos
 */
export const idSchema: any;
/**
 * Schema para paginación
 */
export const paginationSchema: any;
/**
 * Schema para registro de usuarios
 */
export const registerSchema: any;
/**
 * Schema para login
 */
export const loginSchema: any;
/**
 * Schema para crear estudiante
 */
export const createEstudianteSchema: any;
/**
 * Schema para crear noticia
 */
export const createNoticiaSchema: any;
/**
 * Schema para formulario de contacto
 */
export const contactSchema: any;
/**
 * Schema para calificaciones
 */
export const calificacionSchema: any;
/**
 * Schema para citas
 */
export const citaSchema: any;
/**
 * Validar que un campo sea único en BD
 */
export function validateUnique(field: any, table: any, queryFn: any): (req: any, res: any, next: any) => Promise<any>;
/**
 * Sanitizar HTML en campos de texto
 */
export function sanitizeHtmlFields(fields: any): (req: any, res: any, next: any) => void;
export { Joi };
//# sourceMappingURL=input-validation.d.ts.map