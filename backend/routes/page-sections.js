"use strict";
/**
 * 🎛️ RUTAS DE CONFIGURACIÓN DE PÁGINAS - Gestión de secciones por página
 * 
 * Endpoints:
 *   GET    /api/page-sections/config              → Todas las páginas activas
 *   GET    /api/page-sections/config/:page        → Config completa de una página
 *   PUT    /api/page-sections/config/:page        → Actualizar config de página
 *   GET    /api/page-sections/sections/:page      → Secciones de una página
 *   POST   /api/page-sections/sections            → Crear sección
 *   PUT    /api/page-sections/sections/:id        → Actualizar sección
 *   DELETE /api/page-sections/sections/:id        → Eliminar sección
 *   GET    /api/page-sections/items/:sectionId    → Items de una sección
 *   POST   /api/page-sections/items               → Crear item
 *   PUT    /api/page-sections/items/:id           → Actualizar item
 *   DELETE /api/page-sections/items/:id           → Eliminar item
 *   POST   /api/page-sections/seed/:tenantId      → Poblar datos generales
 *   GET    /api/page-sections/public/:page        → Datos públicos (sin auth)
 */

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express"));
const auth_1 = require('../middleware/auth.js');
const database_config_1 = require('../config/database.js');

const router = express_1.default.Router();

function getPool() {
    return database_config_1.pool;
}

function getTenantId(req) {
    return req.user?.tenant_id || req.tenant?.id || 1;
}

// Middleware: Director o Admin
function requireDirectorOrAdmin(req, res, next) {
    const role = req.user?.role;
    if (role === 'admin' || role === 'director') {
        return next();
    }
    return res.status(403).json({ success: false, error: 'Se requiere rol de administrador o director' });
}

// ============================================
// 1. OBTENER CONFIGURACIÓN COMPLETA DE UNA PÁGINA
// ============================================

router.get('/config/:page', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { page } = req.params;

        // Obtener config de la página
        const pageResult = await pool.query(
            'SELECT * FROM tenant_page_configs WHERE tenant_id = $1 AND page_slug = $2',
            [tenantId, page]
        );

        let pageConfig = pageResult.rows[0];

        // Si no existe, crear con valores por defecto
        if (!pageConfig) {
            const insertResult = await pool.query(
                `INSERT INTO tenant_page_configs (tenant_id, page_slug, is_active, sort_order)
                 VALUES ($1, $2, true, 0)
                 ON CONFLICT (tenant_id, page_slug) DO NOTHING
                 RETURNING *`,
                [tenantId, page]
            );
            pageConfig = insertResult.rows[0];
        }

        // Obtener secciones
        const sectionsResult = await pool.query(
            `SELECT * FROM tenant_page_sections
             WHERE tenant_id = $1 AND page_slug = $2
             ORDER BY sort_order`,
            [tenantId, page]
        );

        // Obtener items para cada sección
        const sections = [];
        for (const section of sectionsResult.rows) {
            const itemsResult = await pool.query(
                `SELECT * FROM tenant_section_items
                 WHERE section_id = $1 AND tenant_id = $2
                 ORDER BY sort_order`,
                [section.id, tenantId]
            );
            sections.push({
                ...section,
                items: itemsResult.rows
            });
        }

        res.json({
            success: true,
            data: {
                page: pageConfig,
                sections: sections
            }
        });
    } catch (error) {
        console.error('[PageSections] Error obteniendo config:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo configuración' });
    }
});

// ============================================
// 2. OBTENER TODAS LAS PÁGINAS ACTIVAS
// ============================================

router.get('/config', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);

        const result = await pool.query(
            `SELECT * FROM tenant_page_configs
             WHERE tenant_id = $1
             ORDER BY sort_order`,
            [tenantId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('[PageSections] Error obteniendo páginas:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo páginas' });
    }
});

// ============================================
// 3. ACTUALIZAR CONFIGURACIÓN DE UNA PÁGINA
// ============================================

router.put('/config/:page', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { page } = req.params;
        const { is_active, sort_order, page_title, config_json } = req.body;

        const result = await pool.query(
            `INSERT INTO tenant_page_configs (tenant_id, page_slug, is_active, sort_order, page_title, config_json)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (tenant_id, page_slug)
             DO UPDATE SET
                is_active = COALESCE($3, tenant_page_configs.is_active),
                sort_order = COALESCE($4, tenant_page_configs.sort_order),
                page_title = COALESCE($5, tenant_page_configs.page_title),
                config_json = COALESCE($6, tenant_page_configs.config_json),
                updated_at = NOW()
             RETURNING *`,
            [tenantId, page, is_active, sort_order, page_title, config_json ? JSON.stringify(config_json) : null]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[PageSections] Error actualizando página:', error);
        res.status(500).json({ success: false, error: 'Error actualizando página' });
    }
});

// ============================================
// 4. OBTENER SECCIONES DE UNA PÁGINA
// ============================================

router.get('/sections/:page', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { page } = req.params;

        const result = await pool.query(
            `SELECT * FROM tenant_page_sections
             WHERE tenant_id = $1 AND page_slug = $2
             ORDER BY sort_order`,
            [tenantId, page]
        );

        // Obtener items para cada sección
        const sections = [];
        for (const section of result.rows) {
            const itemsResult = await pool.query(
                `SELECT * FROM tenant_section_items
                 WHERE section_id = $1 AND tenant_id = $2
                 ORDER BY sort_order`,
                [section.id, tenantId]
            );
            sections.push({
                ...section,
                items: itemsResult.rows
            });
        }

        res.json({ success: true, data: sections });
    } catch (error) {
        console.error('[PageSections] Error obteniendo secciones:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo secciones' });
    }
});

// ============================================
// 5. CREAR SECCIÓN
// ============================================

router.post('/sections', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { page_slug, section_key, section_title, section_subtitle, section_content, section_image_url, section_icon, is_active, sort_order, config_json } = req.body;

        const result = await pool.query(
            `INSERT INTO tenant_page_sections
             (tenant_id, page_slug, section_key, section_title, section_subtitle, section_content, section_image_url, section_icon, is_active, sort_order, config_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [tenantId, page_slug, section_key, section_title || '', section_subtitle || '', section_content || '', section_image_url || '', section_icon || '', is_active !== false, sort_order || 0, config_json ? JSON.stringify(config_json) : '{}']
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[PageSections] Error creando sección:', error);
        res.status(500).json({ success: false, error: 'Error creando sección' });
    }
});

// ============================================
// 6. ACTUALIZAR SECCIÓN
// ============================================

router.put('/sections/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { id } = req.params;
        const { section_title, section_subtitle, section_content, section_image_url, section_icon, is_active, sort_order, config_json } = req.body;

        const result = await pool.query(
            `UPDATE tenant_page_sections SET
                section_title = COALESCE($1, section_title),
                section_subtitle = COALESCE($2, section_subtitle),
                section_content = COALESCE($3, section_content),
                section_image_url = COALESCE($4, section_image_url),
                section_icon = COALESCE($5, section_icon),
                is_active = COALESCE($6, is_active),
                sort_order = COALESCE($7, sort_order),
                config_json = COALESCE($8, config_json),
                updated_at = NOW()
             WHERE id = $9 AND tenant_id = $10
             RETURNING *`,
            [section_title, section_subtitle, section_content, section_image_url, section_icon, is_active, sort_order, config_json ? JSON.stringify(config_json) : null, id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Sección no encontrada' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[PageSections] Error actualizando sección:', error);
        res.status(500).json({ success: false, error: 'Error actualizando sección' });
    }
});

// ============================================
// 7. ELIMINAR SECCIÓN
// ============================================

router.delete('/sections/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM tenant_page_sections WHERE id = $1 AND tenant_id = $2 RETURNING id',
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Sección no encontrada' });
        }

        res.json({ success: true, message: 'Sección eliminada' });
    } catch (error) {
        console.error('[PageSections] Error eliminando sección:', error);
        res.status(500).json({ success: false, error: 'Error eliminando sección' });
    }
});

// ============================================
// 8. OBTENER ITEMS DE UNA SECCIÓN
// ============================================

router.get('/items/:sectionId', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { sectionId } = req.params;

        const result = await pool.query(
            `SELECT * FROM tenant_section_items
             WHERE section_id = $1 AND tenant_id = $2
             ORDER BY sort_order`,
            [sectionId, tenantId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('[PageSections] Error obteniendo items:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo items' });
    }
});

// ============================================
// 9. CREAR ITEM
// ============================================

router.post('/items', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { section_id, item_key, item_title, item_content, item_image_url, item_icon, item_link, is_active, sort_order, config_json } = req.body;

        const result = await pool.query(
            `INSERT INTO tenant_section_items
             (section_id, tenant_id, item_key, item_title, item_content, item_image_url, item_icon, item_link, is_active, sort_order, config_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [section_id, tenantId, item_key || '', item_title || '', item_content || '', item_image_url || '', item_icon || '', item_link || '', is_active !== false, sort_order || 0, config_json ? JSON.stringify(config_json) : '{}']
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[PageSections] Error creando item:', error);
        res.status(500).json({ success: false, error: 'Error creando item' });
    }
});

// ============================================
// 10. ACTUALIZAR ITEM
// ============================================

router.put('/items/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { id } = req.params;
        const { item_key, item_title, item_content, item_image_url, item_icon, item_link, is_active, sort_order, config_json } = req.body;

        const result = await pool.query(
            `UPDATE tenant_section_items SET
                item_key = COALESCE($1, item_key),
                item_title = COALESCE($2, item_title),
                item_content = COALESCE($3, item_content),
                item_image_url = COALESCE($4, item_image_url),
                item_icon = COALESCE($5, item_icon),
                item_link = COALESCE($6, item_link),
                is_active = COALESCE($7, is_active),
                sort_order = COALESCE($8, sort_order),
                config_json = COALESCE($9, config_json),
                updated_at = NOW()
             WHERE id = $10 AND tenant_id = $11
             RETURNING *`,
            [item_key, item_title, item_content, item_image_url, item_icon, item_link, is_active, sort_order, config_json ? JSON.stringify(config_json) : null, id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item no encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[PageSections] Error actualizando item:', error);
        res.status(500).json({ success: false, error: 'Error actualizando item' });
    }
});

// ============================================
// 11. ELIMINAR ITEM
// ============================================

router.delete('/items/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const pool = getPool();
        const tenantId = getTenantId(req);
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM tenant_section_items WHERE id = $1 AND tenant_id = $2 RETURNING id',
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item no encontrado' });
        }

        res.json({ success: true, message: 'Item eliminado' });
    } catch (error) {
        console.error('[PageSections] Error eliminando item:', error);
        res.status(500).json({ success: false, error: 'Error eliminando item' });
    }
});

// ============================================
// 12. ENDPOINT PÚBLICO (sin auth) - Para que las páginas HTML carguen contenido
// ============================================

router.get('/public/:page', async (req, res) => {
    try {
        const pool = getPool();
        const { page } = req.params;

        // Resolución resiliente de tenant (igual que tenant-cms.js)
        const host = req.headers.host || '';
        let tenantId = req.query.tenant_id ? parseInt(req.query.tenant_id) : null;

        if (!tenantId) {
            const tRes = await pool.query(
                'SELECT id FROM tenants WHERE domain = $1 AND status = $2 LIMIT 1',
                [host, 'activo']
            );
            tenantId = tRes.rows.length > 0 ? tRes.rows[0].id : 1;
        }

        // Obtener config de la página
        const pageResult = await pool.query(
            'SELECT * FROM tenant_page_configs WHERE tenant_id = $1 AND page_slug = $2 AND is_active = true',
            [tenantId, page]
        );

        if (pageResult.rows.length === 0) {
            return res.json({ success: true, data: null, message: 'Página no activa' });
        }

        // Obtener secciones activas
        const sectionsResult = await pool.query(
            `SELECT * FROM tenant_page_sections
             WHERE tenant_id = $1 AND page_slug = $2 AND is_active = true
             ORDER BY sort_order`,
            [tenantId, page]
        );

        // Obtener items para cada sección
        const sections = [];
        for (const section of sectionsResult.rows) {
            const itemsResult = await pool.query(
                `SELECT * FROM tenant_section_items
                 WHERE section_id = $1 AND tenant_id = $2 AND is_active = true
                 ORDER BY sort_order`,
                [section.id, tenantId]
            );
            sections.push({
                ...section,
                items: itemsResult.rows
            });
        }

        res.json({
            success: true,
            data: {
                page: pageResult.rows[0],
                sections: sections
            }
        });
    } catch (error) {
        console.error('[PageSections] Error en endpoint público:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo contenido' });
    }
});

module.exports = router;
module.exports.default = router;
