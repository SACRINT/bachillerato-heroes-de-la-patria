/**
 * 🎯 FASE 2A - CMS SERVICE
 * Servicio de gestión de contenido para BGE
 * Funciona con MySQL o fallback a JSON
 */

const path = require('path');
const fs = require('fs').promises;

class CMSService {
    constructor() {
        this.dbAvailable = false;
        this.db = null;
        this.jsonPath = path.join(__dirname, '../../data');
        this.initialize();
    }

    async initialize() {
        try {
            // Intentar conexión con MySQL
            this.db = require('../config/database');
            const isConnected = await this.db.testConnection();

            if (isConnected && typeof this.db.execute === 'function') {
                this.dbAvailable = true;
                console.log('✅ CMS Service: MySQL disponible');
                await this.ensureTablesExist();
            } else {
                console.log('⚠️ CMS Service: Fallback a JSON');
                this.dbAvailable = false;
                await this.ensureJsonStructure();
            }
        } catch (error) {
            console.log('⚠️ CMS Service: Fallback a JSON -', error.message);
            this.dbAvailable = false;
            await this.ensureJsonStructure();
        }
    }

    // ============================================
    // INICIALIZACIÓN DE ESTRUCTURAS
    // ============================================

    async ensureTablesExist() {
        try {
            const createContentTable = `
                CREATE TABLE IF NOT EXISTS cms_content (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    type ENUM('aviso', 'noticia', 'evento', 'comunicado') NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    image_url VARCHAR(500),
                    priority ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
                    status ENUM('borrador', 'publicado', 'archivado') DEFAULT 'borrador',
                    author_id INT,
                    updated_by INT,
                    publish_date DATETIME,
                    expire_date DATETIME,
                    metadata JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    INDEX idx_type (type),
                    INDEX idx_status (status),
                    INDEX idx_priority (priority),
                    INDEX idx_publish_date (publish_date),
                    INDEX idx_created_at (created_at)
                )
            `;

            await this.db.execute(createContentTable);
            console.log('✅ CMS Service: Tabla cms_content verificada');

            // Crear tabla de archivos si no existe
            const createFilesTable = `
                CREATE TABLE IF NOT EXISTS cms_files (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    original_name VARCHAR(255) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    category VARCHAR(100) DEFAULT 'general',
                    alt_text VARCHAR(255),
                    title VARCHAR(255),
                    file_size BIGINT,
                    mime_type VARCHAR(100),
                    width INT,
                    height INT,
                    webp_url VARCHAR(500),
                    jpeg_url VARCHAR(500),
                    file_url VARCHAR(500),
                    thumbnail_url VARCHAR(500),
                    uploaded_by INT,
                    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,

                    INDEX idx_category (category),
                    INDEX idx_mime_type (mime_type),
                    INDEX idx_upload_date (upload_date)
                )
            `;

            await this.db.execute(createFilesTable);
            console.log('✅ CMS Service: Tabla cms_files verificada');

        } catch (error) {
            console.error('Error creando tablas CMS:', error);
            throw error;
        }
    }

    async ensureJsonStructure() {
        try {
            // Verificar si existe el directorio data
            await fs.access(this.jsonPath);
        } catch {
            await fs.mkdir(this.jsonPath, { recursive: true });
        }

        // Crear archivos JSON base si no existen
        const jsonFiles = [
            { name: 'avisos.json', structure: { avisos: [], lastUpdated: new Date().toISOString() } },
            { name: 'noticias.json', structure: { noticias: [], lastUpdated: new Date().toISOString() } },
            { name: 'eventos.json', structure: { eventos: [], lastUpdated: new Date().toISOString() } },
            { name: 'comunicados.json', structure: { comunicados: [], lastUpdated: new Date().toISOString() } }
        ];

        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonPath, file.name);
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, JSON.stringify(file.structure, null, 2));
                console.log(`✅ Creado: ${file.name}`);
            }
        }
    }

    // ============================================
    // OPERACIONES CRUD DE CONTENIDO
    // ============================================

    async getContent(filters = {}) {
        if (this.dbAvailable) {
            return this.getContentFromDB(filters);
        } else {
            return this.getContentFromJSON(filters);
        }
    }

    async getContentFromDB(filters) {
        try {
            let query = `
                SELECT
                    id, type, title, content, image_url, priority,
                    status, author_id, publish_date, expire_date,
                    created_at, updated_at, metadata
                FROM cms_content
                WHERE 1=1
            `;
            const params = [];

            // Aplicar filtros
            if (filters.type) {
                query += ' AND type = ?';
                params.push(filters.type);
            }

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.priority) {
                query += ' AND priority = ?';
                params.push(filters.priority);
            }

            if (filters.search) {
                query += ' AND (title LIKE ? OR content LIKE ?)';
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            // Solo mostrar contenido publicado y no expirado si no es admin
            if (filters.status !== 'all') {
                query += ' AND status = "publicado"';
                query += ' AND (expire_date IS NULL OR expire_date > NOW())';
            }

            // Ordenar por fecha de publicación descendente
            query += ' ORDER BY publish_date DESC, created_at DESC';

            // Paginación
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(filters.offset);
            }

            const [content] = await this.db.execute(query, params);

            // Contar total de resultados
            let countQuery = `SELECT COUNT(*) as total FROM cms_content WHERE 1=1`;
            const countParams = [];

            if (filters.type) {
                countQuery += ' AND type = ?';
                countParams.push(filters.type);
            }

            if (filters.status && filters.status !== 'all') {
                countQuery += ' AND status = "publicado"';
            }

            const [countResult] = await this.db.execute(countQuery, countParams);
            const total = countResult[0].total;

            // Procesar metadata JSON
            const processedContent = content.map(item => ({
                ...item,
                metadata: item.metadata ? JSON.parse(item.metadata) : null
            }));

            return { content: processedContent, total };

        } catch (error) {
            console.error('Error obteniendo contenido de DB:', error);
            throw error;
        }
    }

    async getContentFromJSON(filters) {
        try {
            const allContent = [];

            // Leer todos los archivos JSON según el tipo solicitado
            const types = filters.type ? [filters.type] : ['aviso', 'noticia', 'evento', 'comunicado'];

            for (const type of types) {
                const fileName = type === 'aviso' ? 'avisos.json' : `${type}s.json`;
                const filePath = path.join(this.jsonPath, fileName);

                try {
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    const data = JSON.parse(fileContent);
                    const items = data[type === 'aviso' ? 'avisos' : `${type}s`] || [];

                    // Agregar metadata de tipo y procesar
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
                } catch (fileError) {
                    console.warn(`No se pudo leer ${fileName}:`, fileError.message);
                }
            }

            // Aplicar filtros
            let filteredContent = allContent;

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredContent = filteredContent.filter(item =>
                    item.title.toLowerCase().includes(searchLower) ||
                    (item.content && item.content.toLowerCase().includes(searchLower))
                );
            }

            if (filters.priority) {
                filteredContent = filteredContent.filter(item => item.priority === filters.priority);
            }

            // Ordenar por fecha de publicación
            filteredContent.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

            // Paginación
            const total = filteredContent.length;
            const offset = filters.offset || 0;
            const limit = filters.limit || total;

            const paginatedContent = filteredContent.slice(offset, offset + limit);

            return { content: paginatedContent, total };

        } catch (error) {
            console.error('Error obteniendo contenido de JSON:', error);
            throw error;
        }
    }

    async getContentById(id) {
        if (this.dbAvailable) {
            try {
                const query = `
                    SELECT
                        id, type, title, content, image_url, priority,
                        status, author_id, publish_date, expire_date,
                        created_at, updated_at, metadata
                    FROM cms_content
                    WHERE id = ?
                `;

                const [rows] = await this.db.execute(query, [id]);

                if (rows.length === 0) return null;

                const content = rows[0];
                content.metadata = content.metadata ? JSON.parse(content.metadata) : null;

                return content;

            } catch (error) {
                console.error('Error obteniendo contenido por ID:', error);
                throw error;
            }
        } else {
            // Implementación JSON para obtener por ID
            const result = await this.getContent({});
            return result.content.find(item => item.id.toString() === id.toString());
        }
    }

    async createContent(contentData) {
        if (this.dbAvailable) {
            return this.createContentInDB(contentData);
        } else {
            return this.createContentInJSON(contentData);
        }
    }

    async createContentInDB(contentData) {
        try {
            const query = `
                INSERT INTO cms_content (
                    type, title, content, image_url, priority, status,
                    author_id, publish_date, expire_date, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                contentData.type,
                contentData.title,
                contentData.content,
                contentData.image_url || null,
                contentData.priority || 'media',
                contentData.status || 'borrador',
                contentData.author_id,
                contentData.publish_date || new Date(),
                contentData.expire_date || null,
                contentData.metadata || null
            ];

            const [result] = await this.db.execute(query, params);

            // Obtener el contenido recién creado
            return this.getContentById(result.insertId);

        } catch (error) {
            console.error('Error creando contenido en DB:', error);
            throw error;
        }
    }

    async createContentInJSON(contentData) {
        try {
            const type = contentData.type;
            const fileName = type === 'aviso' ? 'avisos.json' : `${type}s.json`;
            const filePath = path.join(this.jsonPath, fileName);

            // Leer archivo existente
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            const arrayKey = type === 'aviso' ? 'avisos' : `${type}s`;

            // Crear nuevo ID
            const newId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Crear nuevo item
            const newItem = {
                id: newId,
                titulo: contentData.title,
                contenido: contentData.content,
                imagen: contentData.image_url,
                priority: contentData.priority || 'media',
                fecha: contentData.publish_date || new Date().toISOString(),
                author_id: contentData.author_id,
                created_at: new Date().toISOString()
            };

            // Agregar al array
            data[arrayKey].unshift(newItem);
            data.lastUpdated = new Date().toISOString();

            // Guardar archivo
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));

            // Retornar en formato estándar
            return {
                id: newId,
                type: type,
                title: contentData.title,
                content: contentData.content,
                image_url: contentData.image_url,
                priority: contentData.priority || 'media',
                status: 'publicado',
                author_id: contentData.author_id,
                publish_date: contentData.publish_date || new Date().toISOString(),
                created_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error creando contenido en JSON:', error);
            throw error;
        }
    }

    async updateContent(id, updateData) {
        if (this.dbAvailable) {
            return this.updateContentInDB(id, updateData);
        } else {
            return this.updateContentInJSON(id, updateData);
        }
    }

    async updateContentInDB(id, updateData) {
        try {
            const fields = [];
            const params = [];

            // Construir query dinámicamente
            const allowedFields = [
                'title', 'content', 'image_url', 'priority', 'status',
                'publish_date', 'expire_date', 'metadata', 'updated_by'
            ];

            allowedFields.forEach(field => {
                if (updateData.hasOwnProperty(field)) {
                    fields.push(`${field} = ?`);
                    params.push(updateData[field]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            fields.push('updated_at = NOW()');

            const query = `UPDATE cms_content SET ${fields.join(', ')} WHERE id = ?`;
            params.push(id);

            const [result] = await this.db.execute(query, params);

            if (result.affectedRows === 0) {
                return null;
            }

            return this.getContentById(id);

        } catch (error) {
            console.error('Error actualizando contenido en DB:', error);
            throw error;
        }
    }

    async updateContentInJSON(id, updateData) {
        // Implementación simplificada para JSON
        // En un entorno de producción, esto sería más complejo
        console.warn('Actualización de contenido JSON no implementada completamente');
        return null;
    }

    async deleteContent(id) {
        if (this.dbAvailable) {
            try {
                const query = 'DELETE FROM cms_content WHERE id = ?';
                const [result] = await this.db.execute(query, [id]);
                return result.affectedRows > 0;
            } catch (error) {
                console.error('Error eliminando contenido:', error);
                throw error;
            }
        } else {
            // Implementación JSON simplificada
            return false;
        }
    }

    // ============================================
    // MÉTODOS ESPECIALES
    // ============================================

    async publishContent(id, userId) {
        return this.updateContent(id, {
            status: 'publicado',
            publish_date: new Date(),
            updated_by: userId
        });
    }

    async archiveContent(id, userId) {
        return this.updateContent(id, {
            status: 'archivado',
            updated_by: userId
        });
    }

    async getRecentContent(options = {}) {
        const filters = {
            limit: options.limit || 5,
            type: options.type,
            status: 'publicado'
        };

        const result = await this.getContent(filters);
        return result.content;
    }

    async getUrgentContent() {
        const filters = {
            priority: 'urgente',
            status: 'publicado',
            limit: 10
        };

        const result = await this.getContent(filters);
        return result.content;
    }

    async getCMSStats() {
        if (this.dbAvailable) {
            try {
                const statsQuery = `
                    SELECT
                        type,
                        status,
                        priority,
                        COUNT(*) as count
                    FROM cms_content
                    GROUP BY type, status, priority
                    ORDER BY type, status, priority
                `;

                const [stats] = await this.db.execute(statsQuery);

                const totalQuery = `
                    SELECT
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'publicado' THEN 1 END) as published,
                        COUNT(CASE WHEN status = 'borrador' THEN 1 END) as draft,
                        COUNT(CASE WHEN priority = 'urgente' THEN 1 END) as urgent
                    FROM cms_content
                `;

                const [totals] = await this.db.execute(totalQuery);

                return {
                    detailed: stats,
                    summary: totals[0],
                    last_updated: new Date().toISOString()
                };

            } catch (error) {
                console.error('Error obteniendo estadísticas CMS:', error);
                throw error;
            }
        } else {
            // Estadísticas básicas para JSON
            const result = await this.getContent({ status: 'all' });
            const content = result.content;

            const stats = {
                detailed: [],
                summary: {
                    total: content.length,
                    published: content.filter(item => item.status === 'publicado').length,
                    draft: 0,
                    urgent: content.filter(item => item.priority === 'urgente').length
                },
                last_updated: new Date().toISOString()
            };

            return stats;
        }
    }
}

// Singleton instance
let cmsServiceInstance = null;

const getCMSService = () => {
    if (!cmsServiceInstance) {
        cmsServiceInstance = new CMSService();
    }
    return cmsServiceInstance;
};

module.exports = getCMSService();