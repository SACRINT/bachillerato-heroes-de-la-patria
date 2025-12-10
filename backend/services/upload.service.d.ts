/**
 * 📁 UPLOAD SERVICE - TypeScript Version
 * Gestión de archivos y uploads
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */
export interface UploadFile {
    originalname: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    buffer?: Buffer;
}
export interface UploadResult {
    filename: string;
    originalName: string;
    path: string;
    url: string;
    size: number;
    mimeType: string;
    category: string;
    uploadedAt: Date;
}
export interface FileInfo {
    filename: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    mimeType: string;
    path: string;
}
export interface UploadOptions {
    generateUniqueName?: boolean;
    overwrite?: boolean;
    maxSize?: number;
}
type UploadCategory = 'cv' | 'images' | 'documents' | 'temp' | 'avatars';
declare class UploadService {
    private uploadDirs;
    private allowedTypes;
    private maxSizes;
    constructor();
    private initializeDirectories;
    uploadFile(file: UploadFile, category?: UploadCategory, options?: UploadOptions): Promise<UploadResult>;
    deleteFile(filename: string, category?: UploadCategory): Promise<boolean>;
    getFileInfo(filename: string, category?: UploadCategory): Promise<FileInfo | null>;
    listFiles(category?: UploadCategory): Promise<FileInfo[]>;
    private _validateFile;
    private _generateUniqueFilename;
    private _ensureDirectory;
    private _getMimeType;
    cleanupTempFiles(maxAgeHours?: number): Promise<number>;
}
declare const uploadService: UploadService;
export { UploadService };
export default uploadService;
//# sourceMappingURL=upload.service.d.ts.map