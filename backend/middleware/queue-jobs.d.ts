/**
 * Encolar un job para procesamiento asíncrono
 *
 * @param {string} jobType - Tipo de job (debe existir en jobHandlers)
 * @param {object} jobData - Datos del job
 * @param {string} priority - Prioridad: 'high', 'normal', 'low'
 * @returns {Promise<string>} - Job ID
 */
export function enqueueJob(jobType: string, jobData?: object, priority?: string): Promise<string>;
/**
 * Procesar jobs de las colas (debe ejecutarse en worker separado)
 *
 * Orden de prioridad:
 * 1. high
 * 2. normal
 * 3. low
 */
export function processJobs(): Promise<void>;
/**
 * Obtener status de un job
 */
export function getJobStatus(jobId: any): Promise<any>;
/**
 * Limpiar jobs antiguos (cleanup job - ejecutar periódicamente)
 */
export function cleanupOldJobs(maxAgeDays?: number): Promise<number>;
/**
 * Obtener estadísticas de las colas
 */
export function getQueueStats(): Promise<{
    high: number;
    normal: number;
    low: number;
}>;
/**
 * Registry de job handlers
 * Cada handler recibe (jobData) y retorna Promise
 */
export const jobHandlers: {
    /**
     * Enviar email (operación pesada)
     */
    'send-email': (jobData: any) => Promise<{
        success: boolean;
        recipient: any;
    }>;
    /**
     * Generar reporte grande (operación pesada)
     */
    'generate-report': (jobData: any) => Promise<{
        success: boolean;
        reportType: any;
        recordCount: number;
    }>;
    /**
     * Procesar imágenes (operación pesada)
     */
    'process-images': (jobData: any) => Promise<{
        success: boolean;
        processedCount: any;
    }>;
    /**
     * Enviar notificaciones en batch (operación pesada)
     */
    'batch-notifications': (jobData: any) => Promise<{
        success: boolean;
        sentCount: any;
    }>;
    /**
     * Exportar datos a CSV/Excel (operación pesada)
     */
    'export-data': (jobData: any) => Promise<{
        success: boolean;
        fileUrl: string;
    }>;
    /**
     * Backup de base de datos (operación muy pesada)
     */
    'database-backup': (jobData: any) => Promise<{
        success: boolean;
        backupSize: string;
        location: any;
    }>;
};
export namespace JOB_STATUS {
    let pending: string;
    let processing: string;
    let completed: string;
    let failed: string;
}
export namespace QUEUE_PRIORITIES {
    let high: string;
    let normal: string;
    let low: string;
}
//# sourceMappingURL=queue-jobs.d.ts.map