export = ImageOptimizationService;
declare class ImageOptimizationService {
    constructor(options?: {});
    uploadsDir: any;
    thumbnailsDir: string;
    webpDir: string;
    sizes: {
        thumbnail: {
            width: number;
            height: number;
        };
        small: {
            width: number;
            height: number;
        };
        medium: {
            width: number;
            height: number;
        };
        large: {
            width: number;
            height: number;
        };
    };
    quality: {
        jpeg: number;
        webp: number;
        png: number;
    };
    /**
     * Detectar si estamos en entorno serverless (Vercel, AWS Lambda, etc.)
     * 🚨 FIX VERCEL: Detección de entornos serverless
     */
    isServerlessEnvironment(): string | boolean;
    /**
     * Inicializar directorios necesarios
     */
    init(): Promise<void>;
    /**
     * Optimizar imagen y generar múltiples tamaños
     * @param {string} inputPath - Ruta de la imagen original
     * @param {string} filename - Nombre del archivo
     * @returns {Promise<Object>} - Rutas de las imágenes generadas
     */
    optimizeImage(inputPath: string, filename: string): Promise<any>;
    /**
     * Crear versión optimizada de la imagen
     */
    createOptimizedVersion(inputPath: any, outputPath: any, format: any): Promise<void>;
    /**
     * Crear thumbnail
     */
    createThumbnail(inputPath: any, outputPath: any, dimensions: any, format: any): Promise<void>;
    /**
     * Convertir imagen a WebP
     */
    convertToWebP(inputPath: any, outputPath: any, dimensions?: any): Promise<void>;
    /**
     * Optimización batch de múltiples imágenes
     */
    optimizeBatch(imagePaths: any): Promise<{
        total: any;
        successful: number;
        failed: number;
        results: any[];
        errors: {
            filename: string;
            error: any;
        }[];
    }>;
    /**
     * Obtener estadísticas de optimización (ahorro de espacio)
     */
    getOptimizationStats(originalPath: any, optimizedPath: any): Promise<{
        originalSize: number;
        optimizedSize: number;
        savedBytes: number;
        savedPercent: number;
        ratio: string;
    }>;
    /**
     * Limpiar archivos antiguos (garbage collection)
     */
    cleanOldImages(daysOld?: number): Promise<number>;
    /**
     * Generar imagen responsive (srcset)
     */
    generateResponsiveSet(inputPath: any, filename: any): Promise<string>;
}
//# sourceMappingURL=imageOptimizationService.d.ts.map