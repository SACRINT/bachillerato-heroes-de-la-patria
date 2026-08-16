"use strict";
/**
 * 🎯 CMS SERVICE - TypeScript Version
 * Gestión de contenido para BGE
 * Soporte MySQL y fallback JSON
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSService = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const devLogger = require('../utils/devLogger.js');
// ============================================
// CMS SERVICE CLASS
// ============================================
class CMSService {
    constructor() {
        this.dbAvailable = false;
        this.db = null;
        this.jsonPath = path_1.default.join(__dirname, '../../data');
        this.initialize();
    }
    async initialize() {
        try {
            this.db = require('../config/database.js');
            const isConnected = await this.db.testConnection();
            if (isConnected && typeof this.db.execute === 'function') {
                this.dbAvailable = true;
                devLogger.log('✅ CMS Service: MySQL disponible');
                await this.ensureTablesExist();
            }
            else {
                devLogger.log('⚠️ CMS Service: Fallback a JSON');
                this.dbAvailable = false;
                await this.ensureJsonStructure();
            }
        }
        catch (error) {
            devLogger.log('⚠️ CMS Service: Fallback a JSON -', error.message);
            this.dbAvailable = false;
            await this.ensureJsonStructure();
        }
    }
    async ensureTablesExist() {
        try {
            const createContentTable = `
                CREATE TABLE IF NOT EXISTS cms_content (
                    id SERIAL PRIMARY KEY,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    image_url VARCHAR(500),
                    priority VARCHAR(20) DEFAULT 'media',
                    status VARCHAR(20) DEFAULT 'borrador',
                    author_id INT,
                    updated_by INT,
                    publish_date TIMESTAMP,
                    expire_date TIMESTAMP,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            await this.db.execute(createContentTable);
            devLogger.log('✅ CMS Service: Tabla cms_content verificada');
        }
        catch (error) {
            devLogger.error('Error creando tablas CMS:', error);
            throw error;
        }
    }
    async ensureJsonStructure() {
        try {
            await promises_1.default.access(this.jsonPath);
        }
        catch {
            await promises_1.default.mkdir(this.jsonPath, { recursive: true });
        }
        const jsonFiles = [
            { name: 'avisos.json', structure: { avisos: [], lastUpdated: new Date().toISOString() } },
            { name: 'noticias.json', structure: { noticias: [], lastUpdated: new Date().toISOString() } },
            { name: 'eventos.json', structure: { eventos: [], lastUpdated: new Date().toISOString() } },
            { name: 'comunicados.json', structure: { comunicados: [], lastUpdated: new Date().toISOString() } }
        ];
        for (const file of jsonFiles) {
            const filePath = path_1.default.join(this.jsonPath, file.name);
            try {
                await promises_1.default.access(filePath);
            }
            catch {
                await promises_1.default.writeFile(filePath, JSON.stringify(file.structure, null, 2));
                devLogger.log(`✅ Creado: ${file.name}`);
            }
        }
    }
    // ============================================
    // CRUD OPERATIONS
    // ============================================
    async getContent(filters = {}) {
        if (this.dbAvailable) {
            return this.getContentFromDB(filters);
        }
        else {
            return this.getContentFromJSON(filters);
        }
    }
    async getContentFromDB(filters) {
        try {
            let query = `SELECT id, type, title, content, image_url, priority, status, author_id, publish_date, expire_date, created_at, updated_at, metadata FROM cms_content WHERE 1=1`;
            const params = [];
            let paramIndex = 1;
            if (filters.type) {
                query += ` AND type = $${paramIndex++}`;
                params.push(filters.type);
            }
            if (filters.status && filters.status !== 'all') {
                query += ` AND status = $${paramIndex++}`;
                params.push(filters.status);
            }
            else if (!filters.status) {
                query += ` AND status = 'publicado' AND (expire_date IS NULL OR expire_date > NOW())`;
            }
            if (filters.priority) {
                query += ` AND priority = $${paramIndex++}`;
                params.push(filters.priority);
            }
            if (filters.search) {
                query += ` AND (title ILIKE $${paramIndex++} OR content ILIKE $${paramIndex++})`;
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }
            query += ' ORDER BY publish_date DESC, created_at DESC';
            if (filters.limit) {
                query += ` LIMIT $${paramIndex++}`;
                params.push(filters.limit);
            }
            if (filters.offset) {
                query += ` OFFSET $${paramIndex++}`;
                params.push(filters.offset);
            }
            const result = await this.db.execute(query, params);
            const content = result[0] || result;
            const countResult = await this.db.execute('SELECT COUNT(*) as total FROM cms_content');
            const total = countResult[0]?.total || content.length;
            return { content, total };
        }
        catch (error) {
            devLogger.error('Error obteniendo contenido de DB:', error);
            throw error;
        }
    }
    async getContentFromJSON(filters) {
        try {
            const allContent = [];
            const types = filters.type ? [filters.type] : ['aviso', 'noticia', 'evento', 'comunicado'];
            for (const type of types) {
                const fileName = type === 'aviso' ? 'avisos.json' : `${type}s.json`;
                const filePath = path_1.default.join(this.jsonPath, fileName);
                try {
                    const fileContent = await promises_1.default.readFile(filePath, 'utf-8');
                    const data = JSON.parse(fileContent);
                    const items = data[type === 'aviso' ? 'avisos' : `${type}s`] || [];
                    const processedItems = items.map((item, index) => ({
                        id: item.id || `${type}_${index}`,
                        type: type,
                        title: item.title || item.titulo,
                        content: item.content || item.contenido || item.description,
                        image_url: item.image_url || item.imagen,
                        priority: item.priority || 'media',
                        status: 'publicado',
                        publish_date: item.publish_date || item.fecha || new Date().toISOString(),
                        created_at: item.created_at || item.fecha || new Date().toISOString()
                    }));
                    allContent.push(...processedItems);
                }
                catch (fileError) {
                    devLogger.warn(`No se pudo leer ${fileName}:`, fileError.message);
                }
            }
            let filteredContent = allContent;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredContent = filteredContent.filter(item => item.title.toLowerCase().includes(searchLower) ||
                    (item.content && item.content.toLowerCase().includes(searchLower)));
            }
            filteredContent.sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
            const total = filteredContent.length;
            const offset = filters.offset || 0;
            const limit = filters.limit || total;
            const paginatedContent = filteredContent.slice(offset, offset + limit);
            return { content: paginatedContent, total };
        }
        catch (error) {
            devLogger.error('Error obteniendo contenido de JSON:', error);
            throw error;
        }
    }
    async getContentById(id) {
        if (this.dbAvailable) {
            try {
                const result = await this.db.execute('SELECT * FROM cms_content WHERE id = $1', [id]);
                return result[0]?.[0] || null;
            }
            catch (error) {
                devLogger.error('Error obteniendo contenido por ID:', error);
                throw error;
            }
        }
        else {
            const result = await this.getContent({});
            return result.content.find(item => item.id.toString() === id.toString()) || null;
        }
    }
    async createContent(contentData) {
        if (this.dbAvailable) {
            const result = await this.db.execute(`
                INSERT INTO cms_content (type, title, content, image_url, priority, status, author_id, publish_date, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                contentData.type,
                contentData.title,
                contentData.content,
                contentData.image_url || null,
                contentData.priority || 'media',
                contentData.status || 'borrador',
                contentData.author_id,
                contentData.publish_date || new Date(),
                JSON.stringify(contentData.metadata || {})
            ]);
            return result[0];
        }
        else {
            throw new Error('Creación de contenido no soportada en modo JSON');
        }
    }
    async updateContent(id, updateData) {
        if (!this.dbAvailable)
            return null;
        const fields = [];
        const params = [];
        let paramIndex = 1;
        const allowedFields = ['title', 'content', 'image_url', 'priority', 'status', 'publish_date', 'expire_date', 'updated_by'];
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramIndex++}`);
                params.push(value);
            }
        }
        if (fields.length === 0)
            return await this.getContentById(id);
        fields.push('updated_at = NOW()');
        params.push(id);
        await this.db.execute(`UPDATE cms_content SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
        return await this.getContentById(id);
    }
    async deleteContent(id) {
        if (!this.dbAvailable)
            return false;
        const result = await this.db.execute('DELETE FROM cms_content WHERE id = $1', [id]);
        return result?.affectedRows > 0 || result?.rowCount > 0;
    }
    // ============================================
    // SPECIAL METHODS
    // ============================================
    async publishContent(id, userId) {
        return this.updateContent(id, { status: 'publicado', publish_date: new Date(), updated_by: userId });
    }
    async archiveContent(id, userId) {
        return this.updateContent(id, { status: 'archivado', updated_by: userId });
    }
    async getRecentContent(options = {}) {
        const result = await this.getContent({ limit: options.limit || 5, type: options.type, status: 'publicado' });
        return result.content;
    }
    async getUrgentContent() {
        const result = await this.getContent({ priority: 'urgente', status: 'publicado', limit: 10 });
        return result.content;
    }
    async getCMSStats() {
        const result = await this.getContent({ status: 'all' });
        const content = result.content;
        return {
            detailed: [],
            summary: {
                total: content.length,
                published: content.filter(item => item.status === 'publicado').length,
                draft: content.filter(item => item.status === 'borrador').length,
                urgent: content.filter(item => item.priority === 'urgente').length
            },
            last_updated: new Date().toISOString()
        };
    }
}
exports.CMSService = CMSService;
// ============================================
// EXPORTS
// ============================================
const cmsService = new CMSService();
exports.default = cmsService;
module.exports = cmsService;
module.exports.CMSService = CMSService;
//# sourceMappingURL=cms.service.js.map