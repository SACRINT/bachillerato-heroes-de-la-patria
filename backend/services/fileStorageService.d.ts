declare const _exports: FileStorageService;
export = _exports;
declare class FileStorageService {
    constructor(options?: {});
    baseDir: any;
    maxFileSize: any;
    allowedTypes: any;
    init(): Promise<void>;
    save(file: any, options?: {}): Promise<{
        success: boolean;
        filename: string;
        path: string;
        fullPath: string;
        size: any;
        mimetype: any;
        originalname: any;
    }>;
    get(filepath: any): Promise<{
        success: boolean;
        buffer: NonSharedBuffer;
        size: number;
    }>;
    delete(filepath: any): Promise<{
        success: boolean;
    }>;
    list(directory?: string): Promise<{
        success: boolean;
        files: {
            name: string;
            isDirectory: boolean;
            size: number;
            modified: Date;
        }[];
    }>;
    getStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        totalSizeMB: string;
    }>;
    cleanup(maxAge?: number): Promise<{
        deleted: number;
    }>;
}
//# sourceMappingURL=fileStorageService.d.ts.map