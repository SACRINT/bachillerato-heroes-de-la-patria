/**
 * 📁 UPLOAD SERVICE - TypeScript Version
 * Gestión de archivos y uploads
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// UPLOAD SERVICE CLASS
// ============================================

class UploadService {
    private uploadDirs: Record<UploadCategory, string>;
    private allowedTypes: Record<UploadCategory, string[]>;
    private maxSizes: Record<UploadCategory, number>;

    constructor() {
        const baseDir = path.join(__dirname, '../../uploads');

        this.uploadDirs = {
            cv: path.join(baseDir, 'cv'),
            documents: path.join(baseDir, 'documents'),
            images: path.join(baseDir, 'images'),
            temp: path.join(baseDir, 'temp'),
            avatars: path.join(baseDir, 'avatars')
        };

        this.allowedTypes = {
            cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            temp: ['*'],
            avatars: ['image/jpeg', 'image/png', 'image/webp']
        };

        this.maxSizes = {
            cv: 5 * 1024 * 1024,        // 5MB
            documents: 10 * 1024 * 1024, // 10MB
            images: 5 * 1024 * 1024,     // 5MB
            temp: 50 * 1024 * 1024,      // 50MB
            avatars: 2 * 1024 * 1024     // 2MB
        };

        this.initializeDirectories();
        devLogger.log('[UPLOAD] Service initialized');
    }

    private async initializeDirectories(): Promise<void> {
        for (const dir of Object.values(this.uploadDirs)) {
            await this._ensureDirectory(dir);
        }
    }

    async uploadFile(file: UploadFile, category: UploadCategory = 'documents', options: UploadOptions = {}): Promise<UploadResult> {
        devLogger.log('UPLOAD', `Uploading file to ${category}`, { originalName: file.originalname });

        try {
            this._validateFile(file, category);

            const filename = options.generateUniqueName !== false
                ? this._generateUniqueFilename(file.originalname)
                : file.originalname;

            const uploadDir = this.uploadDirs[category];
            const filePath = path.join(uploadDir, filename);

            await this._ensureDirectory(uploadDir);

            if (file.buffer) {
                await fs.writeFile(filePath, file.buffer);
            } else if (file.path) {
                await fs.copyFile(file.path, filePath);
            } else {
                throw new Error('No file data provided');
            }

            const result: UploadResult = {
                filename,
                originalName: file.originalname,
                path: filePath,
                url: `/uploads/${category}/${filename}`,
                size: file.size,
                mimeType: file.mimetype,
                category,
                uploadedAt: new Date()
            };

            devLogger.log('UPLOAD', 'File uploaded successfully', { filename });
            return result;
        } catch (error: any) {
            devLogger.error('UPLOAD', 'Error uploading file', error.message);
            throw error;
        }
    }

    async deleteFile(filename: string, category: UploadCategory = 'documents'): Promise<boolean> {
        devLogger.log('UPLOAD', `Deleting file: ${filename} from ${category}`);

        try {
            const filePath = path.join(this.uploadDirs[category], filename);
            await fs.unlink(filePath);
            devLogger.log('UPLOAD', 'File deleted successfully');
            return true;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                devLogger.warn('UPLOAD', 'File not found');
                return false;
            }
            throw error;
        }
    }

    async getFileInfo(filename: string, category: UploadCategory = 'documents'): Promise<FileInfo | null> {
        try {
            const filePath = path.join(this.uploadDirs[category], filename);
            const stats = await fs.stat(filePath);

            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                mimeType: this._getMimeType(filename),
                path: filePath
            };
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async listFiles(category: UploadCategory = 'documents'): Promise<FileInfo[]> {
        try {
            const dirPath = this.uploadDirs[category];
            const files = await fs.readdir(dirPath);

            const fileInfos: FileInfo[] = [];
            for (const filename of files) {
                const info = await this.getFileInfo(filename, category);
                if (info) {
                    fileInfos.push(info);
                }
            }

            return fileInfos;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    private _validateFile(file: UploadFile, category: UploadCategory): void {
        const maxSize = this.maxSizes[category];
        if (file.size > maxSize) {
            throw new Error(`Archivo demasiado grande. Máximo: ${maxSize / 1024 / 1024}MB`);
        }

        const allowedTypes = this.allowedTypes[category];
        if (allowedTypes[0] !== '*' && !allowedTypes.includes(file.mimetype)) {
            throw new Error(`Tipo de archivo no permitido: ${file.mimetype}`);
        }
    }

    private _generateUniqueFilename(originalName: string): string {
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        const timestamp = Date.now();
        const randomStr = crypto.randomBytes(4).toString('hex');
        return `${baseName}_${timestamp}_${randomStr}${ext}`;
    }

    private async _ensureDirectory(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    private _getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.txt': 'text/plain'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    async cleanupTempFiles(maxAgeHours: number = 24): Promise<number> {
        devLogger.log('UPLOAD', `Cleaning up temp files older than ${maxAgeHours} hours`);

        try {
            const tempDir = this.uploadDirs.temp;
            const files = await fs.readdir(tempDir);
            const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            let deletedCount = 0;

            for (const filename of files) {
                const filePath = path.join(tempDir, filename);
                const stats = await fs.stat(filePath);

                if (stats.mtime.getTime() < cutoffTime) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }

            devLogger.log('UPLOAD', `Cleaned up ${deletedCount} temp files`);
            return deletedCount;
        } catch (error: any) {
            devLogger.error('UPLOAD', 'Error cleaning temp files', error.message);
            return 0;
        }
    }
}

// ============================================
// EXPORTS
// ============================================

const uploadService = new UploadService();

export { UploadService };
export default uploadService;

module.exports = uploadService;
module.exports.UploadService = UploadService;
