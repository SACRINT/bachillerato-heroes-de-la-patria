"use strict";
/**
 * 📁 UPLOAD SERVICE - TypeScript Version
 * Gestión de archivos y uploads
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const devLogger = require('../utils/devLogger');
// ============================================
// UPLOAD SERVICE CLASS
// ============================================
class UploadService {
    constructor() {
        const baseDir = path_1.default.join(__dirname, '../../uploads');
        this.uploadDirs = {
            cv: path_1.default.join(baseDir, 'cv'),
            documents: path_1.default.join(baseDir, 'documents'),
            images: path_1.default.join(baseDir, 'images'),
            temp: path_1.default.join(baseDir, 'temp'),
            avatars: path_1.default.join(baseDir, 'avatars')
        };
        this.allowedTypes = {
            cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            temp: ['*'],
            avatars: ['image/jpeg', 'image/png', 'image/webp']
        };
        this.maxSizes = {
            cv: 5 * 1024 * 1024, // 5MB
            documents: 10 * 1024 * 1024, // 10MB
            images: 5 * 1024 * 1024, // 5MB
            temp: 50 * 1024 * 1024, // 50MB
            avatars: 2 * 1024 * 1024 // 2MB
        };
        this.initializeDirectories();
        devLogger.log('[UPLOAD] Service initialized');
    }
    async initializeDirectories() {
        for (const dir of Object.values(this.uploadDirs)) {
            await this._ensureDirectory(dir);
        }
    }
    async uploadFile(file, category = 'documents', options = {}) {
        devLogger.log('UPLOAD', `Uploading file to ${category}`, { originalName: file.originalname });
        try {
            this._validateFile(file, category);
            const filename = options.generateUniqueName !== false
                ? this._generateUniqueFilename(file.originalname)
                : file.originalname;
            const uploadDir = this.uploadDirs[category];
            const filePath = path_1.default.join(uploadDir, filename);
            await this._ensureDirectory(uploadDir);
            if (file.buffer) {
                await promises_1.default.writeFile(filePath, file.buffer);
            }
            else if (file.path) {
                await promises_1.default.copyFile(file.path, filePath);
            }
            else {
                throw new Error('No file data provided');
            }
            const result = {
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
        }
        catch (error) {
            devLogger.error('UPLOAD', 'Error uploading file', error.message);
            throw error;
        }
    }
    async deleteFile(filename, category = 'documents') {
        devLogger.log('UPLOAD', `Deleting file: ${filename} from ${category}`);
        try {
            const filePath = path_1.default.join(this.uploadDirs[category], filename);
            await promises_1.default.unlink(filePath);
            devLogger.log('UPLOAD', 'File deleted successfully');
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                devLogger.warn('UPLOAD', 'File not found');
                return false;
            }
            throw error;
        }
    }
    async getFileInfo(filename, category = 'documents') {
        try {
            const filePath = path_1.default.join(this.uploadDirs[category], filename);
            const stats = await promises_1.default.stat(filePath);
            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                mimeType: this._getMimeType(filename),
                path: filePath
            };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    async listFiles(category = 'documents') {
        try {
            const dirPath = this.uploadDirs[category];
            const files = await promises_1.default.readdir(dirPath);
            const fileInfos = [];
            for (const filename of files) {
                const info = await this.getFileInfo(filename, category);
                if (info) {
                    fileInfos.push(info);
                }
            }
            return fileInfos;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    _validateFile(file, category) {
        const maxSize = this.maxSizes[category];
        if (file.size > maxSize) {
            throw new Error(`Archivo demasiado grande. Máximo: ${maxSize / 1024 / 1024}MB`);
        }
        const allowedTypes = this.allowedTypes[category];
        if (allowedTypes[0] !== '*' && !allowedTypes.includes(file.mimetype)) {
            throw new Error(`Tipo de archivo no permitido: ${file.mimetype}`);
        }
    }
    _generateUniqueFilename(originalName) {
        const ext = path_1.default.extname(originalName);
        const baseName = path_1.default.basename(originalName, ext);
        const timestamp = Date.now();
        const randomStr = crypto_1.default.randomBytes(4).toString('hex');
        return `${baseName}_${timestamp}_${randomStr}${ext}`;
    }
    async _ensureDirectory(dirPath) {
        try {
            await promises_1.default.access(dirPath);
        }
        catch {
            await promises_1.default.mkdir(dirPath, { recursive: true });
        }
    }
    _getMimeType(filename) {
        const ext = path_1.default.extname(filename).toLowerCase();
        const mimeTypes = {
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
    async cleanupTempFiles(maxAgeHours = 24) {
        devLogger.log('UPLOAD', `Cleaning up temp files older than ${maxAgeHours} hours`);
        try {
            const tempDir = this.uploadDirs.temp;
            const files = await promises_1.default.readdir(tempDir);
            const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            let deletedCount = 0;
            for (const filename of files) {
                const filePath = path_1.default.join(tempDir, filename);
                const stats = await promises_1.default.stat(filePath);
                if (stats.mtime.getTime() < cutoffTime) {
                    await promises_1.default.unlink(filePath);
                    deletedCount++;
                }
            }
            devLogger.log('UPLOAD', `Cleaned up ${deletedCount} temp files`);
            return deletedCount;
        }
        catch (error) {
            devLogger.error('UPLOAD', 'Error cleaning temp files', error.message);
            return 0;
        }
    }
}
exports.UploadService = UploadService;
// ============================================
// EXPORTS
// ============================================
const uploadService = new UploadService();
exports.default = uploadService;
module.exports = uploadService;
module.exports.UploadService = UploadService;
//# sourceMappingURL=upload.service.js.map