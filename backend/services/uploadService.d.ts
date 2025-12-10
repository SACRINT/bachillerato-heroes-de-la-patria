declare const _exports: UploadService;
export = _exports;
declare class UploadService {
    uploadDirs: {
        cv: string;
        documents: string;
        images: string;
        temp: string;
    };
    allowedTypes: {
        cv: string[];
        images: string[];
        documents: string[];
    };
    maxSizes: {
        cv: number;
        images: number;
        documents: number;
    };
    /**
     * Subir un archivo
     * @param {Object} file - Objeto de archivo (req.file de multer)
     * @param {string} category - Categoría (cv, images, documents)
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<Object>} Información del archivo subido
     */
    uploadFile(file: any, category?: string, options?: any): Promise<any>;
    /**
     * Eliminar un archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} category - Categoría del archivo
     * @returns {Promise<boolean>} true si se eliminó correctamente
     */
    deleteFile(filename: string, category?: string): Promise<boolean>;
    /**
     * Obtener información de un archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} category - Categoría del archivo
     * @returns {Promise<Object>} Información del archivo
     */
    getFileInfo(filename: string, category?: string): Promise<any>;
    /**
     * Listar archivos en una categoría
     * @param {string} category - Categoría
     * @returns {Promise<Array>} Lista de archivos
     */
    listFiles(category?: string): Promise<any[]>;
    /**
     * Validar archivo
     * @private
     */
    private _validateFile;
    /**
     * Generar nombre único de archivo
     * @private
     */
    private _generateUniqueFilename;
    /**
     * Asegurar que el directorio existe
     * @private
     */
    private _ensureDirectory;
    /**
     * Limpiar archivos temporales antiguos
     * @param {number} maxAgeHours - Edad máxima en horas (default: 24)
     * @returns {Promise<number>} Número de archivos eliminados
     */
    cleanupTempFiles(maxAgeHours?: number): Promise<number>;
}
//# sourceMappingURL=uploadService.d.ts.map