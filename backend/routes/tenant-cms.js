"use strict";
/**
 * 🎛️ RUTAS CMS DEL DIRECTOR - Gestión completa del contenido del plantel
 * 
 * Endpoints:
 *   GET/POST/PUT/DELETE /api/tenant-cms/staff        → Personal
 *   GET/POST/PUT/DELETE /api/tenant-cms/timeline      → Línea del tiempo
 *   GET/POST/PUT/DELETE /api/tenant-cms/gallery        → Galería de imágenes
 *   GET/POST/PUT/DELETE /api/tenant-cms/testimonials   → Testimonios
 *   GET/POST/PUT/DELETE /api/tenant-cms/installations  → Instalaciones
 *   GET/POST/PUT/DELETE /api/tenant-cms/hero           → Imágenes del hero
 *   GET               /api/tenant-cms/stats            → Estadísticas consolidadas
 *   GET               /api/tenant-cms/public/:section  → Datos públicos (sin auth)
 */

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express"));
const auth_1 = require('../middleware/auth.js');
const database_config_1 = require('../config/database.js');

// DAOs
const TenantStaffDAO = require('../data/tenant-staff.dao.js');
const TenantTimelineDAO = require('../data/tenant-timeline.dao.js');
const TenantGalleryDAO = require('../data/tenant-gallery.dao.js');
const TenantTestimonialsDAO = require('../data/tenant-testimonials.dao.js');
const TenantInstallationsDAO = require('../data/tenant-installations.dao.js');
const TenantHeroImagesDAO = require('../data/tenant-hero-images.dao.js');

const router = express_1.default.Router();

// Helper para obtener pool
function getPool() {
    return database_config_1.pool;
}

// Helper para obtener tenant_id del JWT
function getTenantId(req) {
    return req.user?.tenant_id || req.tenant?.id || 1;
}

// ============================================
// MIDDLEWARE: Verificar que el usuario es director o admin
// ============================================
function requireDirectorOrAdmin(req, res, next) {
    const role = req.user?.role;
    if (role === 'admin' || role === 'director') {
        return next();
    }
    return res.status(403).json({ success: false, error: 'Se requiere rol de administrador o director' });
}

// ============================================
// 1. PERSONAL DEL PLANTEL (/api/tenant-cms/staff)
// ============================================

router.get('/staff', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantStaffDAO(getPool());
        const staff = await dao.getByTenant(getTenantId(req));
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo personal' });
    }
});

router.post('/staff', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantStaffDAO(getPool());
        const member = await dao.create(req.body, getTenantId(req));
        res.status(201).json({ success: true, data: member });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando miembro del personal' });
    }
});

router.put('/staff/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantStaffDAO(getPool());
        const updated = await dao.update(parseInt(req.params.id), req.body, getTenantId(req));
        if (!updated) return res.status(404).json({ success: false, error: 'Miembro no encontrado' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando miembro' });
    }
});

router.delete('/staff/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantStaffDAO(getPool());
        await dao.delete(parseInt(req.params.id), getTenantId(req));
        res.json({ success: true, message: 'Miembro eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando miembro' });
    }
});

// ============================================
// 2. LÍNEA DEL TIEMPO (/api/tenant-cms/timeline)
// ============================================

router.get('/timeline', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTimelineDAO(getPool());
        const timeline = await dao.getByTenant(getTenantId(req));
        res.json({ success: true, data: timeline });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo línea del tiempo' });
    }
});

router.post('/timeline', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTimelineDAO(getPool());
        const event = await dao.create(req.body, getTenantId(req));
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando evento de línea del tiempo' });
    }
});

router.put('/timeline/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTimelineDAO(getPool());
        const updated = await dao.update(parseInt(req.params.id), req.body, getTenantId(req));
        if (!updated) return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando evento' });
    }
});

router.delete('/timeline/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTimelineDAO(getPool());
        await dao.delete(parseInt(req.params.id), getTenantId(req));
        res.json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando evento' });
    }
});

// ============================================
// 3. GALERÍA DE IMÁGENES (/api/tenant-cms/gallery)
// ============================================

router.get('/gallery', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantGalleryDAO(getPool());
        const images = await dao.getByTenant(getTenantId(req), req.query.category);
        res.json({ success: true, data: images });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo galería' });
    }
});

router.get('/gallery/categories', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantGalleryDAO(getPool());
        const categories = await dao.getCategories(getTenantId(req));
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo categorías' });
    }
});

router.post('/gallery', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantGalleryDAO(getPool());
        const image = await dao.create(req.body, getTenantId(req));
        res.status(201).json({ success: true, data: image });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error agregando imagen a galería' });
    }
});

router.put('/gallery/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantGalleryDAO(getPool());
        const updated = await dao.update(parseInt(req.params.id), req.body, getTenantId(req));
        if (!updated) return res.status(404).json({ success: false, error: 'Imagen no encontrada' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando imagen' });
    }
});

router.delete('/gallery/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantGalleryDAO(getPool());
        await dao.delete(parseInt(req.params.id), getTenantId(req));
        res.json({ success: true, message: 'Imagen eliminada de galería' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando imagen' });
    }
});

// ============================================
// 4. TESTIMONIOS (/api/tenant-cms/testimonials)
// ============================================

router.get('/testimonials', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTestimonialsDAO(getPool());
        const testimonials = await dao.getByTenant(getTenantId(req));
        res.json({ success: true, data: testimonials });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo testimonios' });
    }
});

router.post('/testimonials', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTestimonialsDAO(getPool());
        const testimonial = await dao.create(req.body, getTenantId(req));
        res.status(201).json({ success: true, data: testimonial });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando testimonio' });
    }
});

router.put('/testimonials/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTestimonialsDAO(getPool());
        const updated = await dao.update(parseInt(req.params.id), req.body, getTenantId(req));
        if (!updated) return res.status(404).json({ success: false, error: 'Testimonio no encontrado' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando testimonio' });
    }
});

router.delete('/testimonials/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantTestimonialsDAO(getPool());
        await dao.delete(parseInt(req.params.id), getTenantId(req));
        res.json({ success: true, message: 'Testimonio eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando testimonio' });
    }
});

// ============================================
// 5. INSTALACIONES (/api/tenant-cms/installations)
// ============================================

router.get('/installations', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantInstallationsDAO(getPool());
        const installations = await dao.getByTenant(getTenantId(req));
        res.json({ success: true, data: installations });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo instalaciones' });
    }
});

router.post('/installations', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantInstallationsDAO(getPool());
        const installation = await dao.create(req.body, getTenantId(req));
        res.status(201).json({ success: true, data: installation });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando instalación' });
    }
});

router.put('/installations/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantInstallationsDAO(getPool());
        const updated = await dao.update(parseInt(req.params.id), req.body, getTenantId(req));
        if (!updated) return res.status(404).json({ success: false, error: 'Instalación no encontrada' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando instalación' });
    }
});

router.delete('/installations/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantInstallationsDAO(getPool());
        await dao.delete(parseInt(req.params.id), getTenantId(req));
        res.json({ success: true, message: 'Instalación eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando instalación' });
    }
});

// ============================================
// 6. IMÁGENES DEL HERO (/api/tenant-cms/hero)
// ============================================

router.get('/hero', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantHeroImagesDAO(getPool());
        const images = await dao.getByTenant(getTenantId(req));
        res.json({ success: true, data: images });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo imágenes del hero' });
    }
});

router.post('/hero', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantHeroImagesDAO(getPool());
        const image = await dao.create(req.body, getTenantId(req));
        res.status(201).json({ success: true, data: image });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creando imagen del hero' });
    }
});

router.put('/hero/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantHeroImagesDAO(getPool());
        const updated = await dao.update(parseInt(req.params.id), req.body, getTenantId(req));
        if (!updated) return res.status(404).json({ success: false, error: 'Imagen no encontrada' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando imagen' });
    }
});

router.delete('/hero/:id', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const dao = new TenantHeroImagesDAO(getPool());
        await dao.delete(parseInt(req.params.id), getTenantId(req));
        res.json({ success: true, message: 'Imagen del hero eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando imagen' });
    }
});

// ============================================
// 7. ESTADÍSTICAS CONSOLIDADAS (/api/tenant-cms/stats)
// ============================================

router.get('/stats', auth_1.authenticateToken, requireDirectorOrAdmin, async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const staffDao = new TenantStaffDAO(getPool());
        const timelineDao = new TenantTimelineDAO(getPool());
        const galleryDao = new TenantGalleryDAO(getPool());
        const testimonialsDao = new TenantTestimonialsDAO(getPool());
        const installationsDao = new TenantInstallationsDAO(getPool());
        const heroDao = new TenantHeroImagesDAO(getPool());

        const [staff, timeline, gallery, testimonials, installations, hero] = await Promise.all([
            staffDao.getStats(tenantId),
            timelineDao.getStats(tenantId),
            galleryDao.getStats(tenantId),
            testimonialsDao.getStats(tenantId),
            installationsDao.getStats(tenantId),
            heroDao.getStats(tenantId)
        ]);

        res.json({
            success: true,
            data: { staff, timeline, gallery, testimonials, installations, hero }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas del CMS' });
    }
});

// ============================================
// 8. DATOS PÚBLICOS (sin auth) - Para el frontend
// ============================================

router.get('/public/:section', async (req, res) => {
    try {
        const { section } = req.params;
        const tenantId = req.query.tenant_id || 1;
        let dao;

        switch (section) {
            case 'staff': dao = new TenantStaffDAO(getPool()); break;
            case 'timeline': dao = new TenantTimelineDAO(getPool()); break;
            case 'gallery': dao = new TenantGalleryDAO(getPool()); break;
            case 'testimonials': dao = new TenantTestimonialsDAO(getPool()); break;
            case 'installations': dao = new TenantInstallationsDAO(getPool()); break;
            case 'hero': dao = new TenantHeroImagesDAO(getPool()); break;
            default: return res.status(404).json({ success: false, error: 'Sección no encontrada' });
        }

        const data = await dao.getByTenant(parseInt(tenantId));
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo datos públicos' });
    }
});

exports.default = router;
