/**
 * Subir archivo a Cloudinary
 * @param {object} file - Objeto de archivo (multer)
 * @param {object} options - Opciones de subida
 * @returns {object} - Información del archivo subido
 */
export function uploadFile(file: object, options?: object): object;
/**
 * Subir imagen con transformaciones
 * @param {object} file - Objeto de archivo (multer)
 * @param {object} options - Opciones de transformación
 */
export function uploadImage(file: object, options?: object): Promise<any>;
/**
 * Subir documento (PDF, Word, etc)
 * @param {object} file - Objeto de archivo (multer)
 * @param {string} category - Categoría del documento
 */
export function uploadDocument(file: object, category?: string): Promise<any>;
/**
 * Subir video
 * @param {object} file - Objeto de archivo (multer)
 * @param {object} options - Opciones de video
 */
export function uploadVideo(file: object, options?: object): Promise<any>;
/**
 * Obtener información de archivo
 * @param {string} publicId - ID público del archivo
 * @param {object} options - Opciones de recursos
 */
export function getFileInfo(publicId: string, options?: object): Promise<{
    publicId: any;
    url: any;
    format: any;
    size: any;
    width: any;
    height: any;
    createdAt: any;
    tags: any;
    context: any;
}>;
/**
 * Eliminar archivo
 * @param {string} publicId - ID público del archivo
 * @param {string} resourceType - Tipo de recurso (image, video, raw)
 */
export function deleteFile(publicId: string, resourceType?: string): Promise<boolean>;
/**
 * Actualizar tags de archivo
 * @param {string} publicId - ID público del archivo
 * @param {array} tags - Nuevos tags
 */
export function updateFileTags(publicId: string, tags: any[]): Promise<boolean>;
/**
 * Generar URL con transformaciones
 * @param {string} publicId - ID público del archivo
 * @param {object} transformations - Transformaciones a aplicar
 */
export function getTransformedUrl(publicId: string, transformations?: object): any;
/**
 * Generar thumbnail
 * @param {string} publicId - ID público de la imagen
 * @param {number} size - Tamaño del thumbnail
 */
export function getThumbnailUrl(publicId: string, size?: number): any;
/**
 * Listar archivos en carpeta
 * @param {string} folder - Nombre de la carpeta
 * @param {object} options - Opciones de listado
 */
export function listFilesInFolder(folder: string, options?: object): Promise<any>;
/**
 * Eliminar carpeta completa
 * @param {string} folder - Nombre de la carpeta
 */
export function deleteFolder(folder: string): Promise<any>;
/**
 * Validar tipo de archivo
 * @param {string} mimetype - MIME type del archivo
 * @param {array} allowedTypes - Tipos permitidos
 */
export function validateFileType(mimetype: string, allowedTypes: any[]): boolean;
/**
 * Validar tamaño de archivo
 * @param {number} size - Tamaño del archivo en bytes
 * @param {number} maxSize - Tamaño máximo permitido (bytes)
 */
export function validateFileSize(size: number, maxSize?: number): boolean;
/**
 * Obtener formato de archivo desde MIME type
 * @param {string} mimetype - MIME type
 */
export function getFileFormat(mimetype: string): any;
//# sourceMappingURL=file-upload-service.d.ts.map