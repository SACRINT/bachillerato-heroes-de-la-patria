/**
 * Rutas del Marketplace de Recursos Educativos
 * BGE Héroes de la Patria
 * FASE 3 - Semana 23-24
 *
 * Endpoints para sistema de compra-venta de recursos
 */

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');

// Middleware de autenticación
const { authenticateToken } = require('../middleware/auth');

// Helper para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Intentar cargar el servicio
let marketplaceService;
try {
    marketplaceService = require('../services/MarketplaceService');
} catch (error) {
    console.log('[MARKETPLACE] Servicio no disponible, usando mock');
    marketplaceService = null;
}

// ========================================
// ITEMS DEL MARKETPLACE
// ========================================

/**
 * GET /api/marketplace/items
 * Obtener items del marketplace
 */
router.get('/items',
    authenticateToken,
    [
        query('category_id').optional().isInt(),
        query('item_type').optional().isIn(['notes', 'guide', 'template', 'quiz_pack', 'tutorial', 'course']),
        query('subject').optional().isString(),
        query('min_price').optional().isInt({ min: 0 }),
        query('max_price').optional().isInt({ min: 0 }),
        query('is_free').optional().isBoolean(),
        query('is_featured').optional().isBoolean(),
        query('search').optional().isString(),
        query('sort_by').optional().isIn(['newest', 'popular', 'rating', 'price_low', 'price_high']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const options = {
                categoryId: req.query.category_id ? parseInt(req.query.category_id) : null,
                itemType: req.query.item_type,
                subject: req.query.subject,
                minPrice: req.query.min_price ? parseInt(req.query.min_price) : undefined,
                maxPrice: req.query.max_price ? parseInt(req.query.max_price) : undefined,
                isFree: req.query.is_free === 'true',
                isFeatured: req.query.is_featured === 'true',
                search: req.query.search,
                sortBy: req.query.sort_by || 'newest',
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (marketplaceService && marketplaceService.getItems) {
                const items = await marketplaceService.getItems(options);
                return res.json({
                    success: true,
                    data: items
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo items:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener items'
            });
        }
    }
);

/**
 * GET /api/marketplace/items/featured
 * Obtener items destacados
 */
router.get('/items/featured', authenticateToken, async (req, res) => {
    try {
        if (marketplaceService && marketplaceService.getItems) {
            const items = await marketplaceService.getItems({
                isFeatured: true,
                limit: 10
            });
            return res.json({
                success: true,
                data: items
            });
        }

        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('[MARKETPLACE] Error obteniendo destacados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener items destacados'
        });
    }
});

/**
 * GET /api/marketplace/items/:id
 * Obtener detalles de un item
 */
router.get('/items/:id',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de item inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (marketplaceService && marketplaceService.getItemById) {
                const item = await marketplaceService.getItemById(id, userId);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: 'Item no encontrado'
                    });
                }
                return res.json({
                    success: true,
                    data: item
                });
            }

            res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo item:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener item'
            });
        }
    }
);

/**
 * POST /api/marketplace/items
 * Crear nuevo item
 */
router.post('/items',
    authenticateToken,
    [
        body('title').notEmpty().withMessage('Título requerido'),
        body('description').notEmpty().withMessage('Descripción requerida'),
        body('item_type').isIn(['notes', 'guide', 'template', 'quiz_pack', 'tutorial', 'course']),
        body('price_coins').isInt({ min: 0 }),
        body('category_id').optional().isInt(),
        body('subject').optional().isString(),
        body('content_url').optional().isString(),
        body('preview_url').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const sellerId = req.user.id;
            const itemData = {
                title: req.body.title,
                description: req.body.description,
                shortDescription: req.body.short_description,
                itemType: req.body.item_type,
                categoryId: req.body.category_id,
                priceCoins: req.body.price_coins,
                subject: req.body.subject,
                topics: req.body.topics,
                gradeLevel: req.body.grade_level,
                contentUrl: req.body.content_url,
                previewUrl: req.body.preview_url,
                fileType: req.body.file_type,
                fileSizeBytes: req.body.file_size_bytes,
                tags: req.body.tags,
                metadata: req.body.metadata
            };

            if (marketplaceService && marketplaceService.createItem) {
                const item = await marketplaceService.createItem(sellerId, itemData);
                return res.status(201).json({
                    success: true,
                    message: 'Item creado',
                    data: item
                });
            }

            res.status(201).json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error creando item:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear item'
            });
        }
    }
);

/**
 * PUT /api/marketplace/items/:id
 * Actualizar item
 */
router.put('/items/:id',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        body('title').optional().isString(),
        body('description').optional().isString(),
        body('price_coins').optional().isInt({ min: 0 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const sellerId = req.user.id;

            if (marketplaceService && marketplaceService.updateItem) {
                const item = await marketplaceService.updateItem(id, sellerId, req.body);
                return res.json({
                    success: true,
                    message: 'Item actualizado',
                    data: item
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error actualizando item:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar item'
            });
        }
    }
);

/**
 * POST /api/marketplace/items/:id/submit
 * Enviar item a revisión
 */
router.post('/items/:id/submit',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const sellerId = req.user.id;

            if (marketplaceService && marketplaceService.submitForReview) {
                const item = await marketplaceService.submitForReview(id, sellerId);
                return res.json({
                    success: true,
                    message: 'Item enviado a revisión',
                    data: item
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error enviando a revisión:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar a revisión'
            });
        }
    }
);

/**
 * POST /api/marketplace/items/:id/review (admin)
 * Aprobar/rechazar item
 */
router.post('/items/:id/review',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        body('approved').isBoolean(),
        body('rejection_reason').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const { id } = req.params;
            const { approved, rejection_reason } = req.body;

            if (marketplaceService && marketplaceService.reviewItem) {
                const item = await marketplaceService.reviewItem(id, req.user.id, approved, rejection_reason);
                return res.json({
                    success: true,
                    message: approved ? 'Item aprobado' : 'Item rechazado',
                    data: item
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error en revisión:', error);
            res.status(500).json({
                success: false,
                message: 'Error en revisión'
            });
        }
    }
);

// ========================================
// COMPRAS
// ========================================

/**
 * POST /api/marketplace/items/:id/purchase
 * Comprar un item
 */
router.post('/items/:id/purchase',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID de item inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const buyerId = req.user.id;

            if (marketplaceService && marketplaceService.purchaseItem) {
                const purchase = await marketplaceService.purchaseItem(buyerId, id);
                return res.status(201).json({
                    success: true,
                    message: 'Compra exitosa',
                    data: purchase
                });
            }

            res.status(201).json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error en compra:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al comprar'
            });
        }
    }
);

/**
 * GET /api/marketplace/purchases
 * Obtener mis compras
 */
router.get('/purchases',
    authenticateToken,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (marketplaceService && marketplaceService.getUserPurchases) {
                const purchases = await marketplaceService.getUserPurchases(userId, options);
                return res.json({
                    success: true,
                    data: purchases
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo compras:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener compras'
            });
        }
    }
);

// ========================================
// REVIEWS
// ========================================

/**
 * GET /api/marketplace/items/:id/reviews
 * Obtener reviews de un item
 */
router.get('/items/:id/reviews',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (marketplaceService && marketplaceService.getItemReviews) {
                const reviews = await marketplaceService.getItemReviews(id, options);
                return res.json({
                    success: true,
                    data: reviews
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener reviews'
            });
        }
    }
);

/**
 * POST /api/marketplace/items/:id/reviews
 * Crear review
 */
router.post('/items/:id/reviews',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser 1-5'),
        body('title').optional().isString(),
        body('content').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, title, content } = req.body;
            const reviewerId = req.user.id;

            if (marketplaceService && marketplaceService.createReview) {
                const review = await marketplaceService.createReview(reviewerId, id, rating, title, content);
                return res.status(201).json({
                    success: true,
                    message: 'Review creada',
                    data: review
                });
            }

            res.status(201).json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error creando review:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear review'
            });
        }
    }
);

// ========================================
// FAVORITOS
// ========================================

/**
 * GET /api/marketplace/favorites
 * Obtener mis favoritos
 */
router.get('/favorites',
    authenticateToken,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (marketplaceService && marketplaceService.getUserFavorites) {
                const favorites = await marketplaceService.getUserFavorites(userId, options);
                return res.json({
                    success: true,
                    data: favorites
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo favoritos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener favoritos'
            });
        }
    }
);

/**
 * POST /api/marketplace/items/:id/favorite
 * Agregar a favoritos
 */
router.post('/items/:id/favorite',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (marketplaceService && marketplaceService.addToFavorites) {
                await marketplaceService.addToFavorites(userId, id);
                return res.json({
                    success: true,
                    message: 'Agregado a favoritos'
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error agregando favorito:', error);
            res.status(500).json({
                success: false,
                message: 'Error al agregar a favoritos'
            });
        }
    }
);

/**
 * DELETE /api/marketplace/items/:id/favorite
 * Quitar de favoritos
 */
router.delete('/items/:id/favorite',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (marketplaceService && marketplaceService.removeFromFavorites) {
                await marketplaceService.removeFromFavorites(userId, id);
                return res.json({
                    success: true,
                    message: 'Quitado de favoritos'
                });
            }

            res.json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error quitando favorito:', error);
            res.status(500).json({
                success: false,
                message: 'Error al quitar de favoritos'
            });
        }
    }
);

// ========================================
// VENDEDOR/CREADOR
// ========================================

/**
 * GET /api/marketplace/seller/items
 * Obtener mis items como vendedor
 */
router.get('/seller/items',
    authenticateToken,
    [
        query('status').optional().isString(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const sellerId = req.user.id;
            const options = {
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (marketplaceService && marketplaceService.getSellerItems) {
                const items = await marketplaceService.getSellerItems(sellerId, options);
                return res.json({
                    success: true,
                    data: items
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo items del vendedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener items'
            });
        }
    }
);

/**
 * GET /api/marketplace/seller/earnings
 * Obtener mis ganancias
 */
router.get('/seller/earnings', authenticateToken, async (req, res) => {
    try {
        const creatorId = req.user.id;

        if (marketplaceService && marketplaceService.getCreatorEarnings) {
            const earnings = await marketplaceService.getCreatorEarnings(creatorId);
            return res.json({
                success: true,
                data: earnings
            });
        }

        res.json({
            success: true,
            data: {
                total_sales: 0,
                total_earnings: 0,
                available_balance: 0,
                items_sold: 0
            }
        });
    } catch (error) {
        console.error('[MARKETPLACE] Error obteniendo ganancias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ganancias'
        });
    }
});

/**
 * GET /api/marketplace/seller/transactions
 * Obtener historial de transacciones
 */
router.get('/seller/transactions',
    authenticateToken,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const creatorId = req.user.id;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            if (marketplaceService && marketplaceService.getCreatorTransactions) {
                const transactions = await marketplaceService.getCreatorTransactions(creatorId, options);
                return res.json({
                    success: true,
                    data: transactions
                });
            }

            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error obteniendo transacciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener transacciones'
            });
        }
    }
);

/**
 * GET /api/marketplace/seller/stats
 * Obtener estadísticas del vendedor
 */
router.get('/seller/stats', authenticateToken, async (req, res) => {
    try {
        const sellerId = req.user.id;

        if (marketplaceService && marketplaceService.getSellerStats) {
            const stats = await marketplaceService.getSellerStats(sellerId);
            return res.json({
                success: true,
                data: stats
            });
        }

        res.json({
            success: true,
            data: {
                total_items: 0,
                published_items: 0,
                total_sales: 0,
                total_views: 0,
                avg_rating: null
            }
        });
    } catch (error) {
        console.error('[MARKETPLACE] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

// ========================================
// CATEGORÍAS
// ========================================

/**
 * GET /api/marketplace/categories
 * Obtener categorías
 */
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const parentId = req.query.parent_id ? parseInt(req.query.parent_id) : null;

        if (marketplaceService && marketplaceService.getCategories) {
            const categories = await marketplaceService.getCategories(parentId);
            return res.json({
                success: true,
                data: categories
            });
        }

        // Datos de ejemplo
        res.json({
            success: true,
            data: [
                { id: 1, name: 'Apuntes y Notas', slug: 'apuntes', item_count: 0 },
                { id: 2, name: 'Guías de Estudio', slug: 'guias', item_count: 0 },
                { id: 3, name: 'Plantillas', slug: 'plantillas', item_count: 0 }
            ]
        });
    } catch (error) {
        console.error('[MARKETPLACE] Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías'
        });
    }
});

// ========================================
// REPORTES
// ========================================

/**
 * POST /api/marketplace/items/:id/report
 * Reportar un item
 */
router.post('/items/:id/report',
    authenticateToken,
    [
        param('id').isInt().withMessage('ID inválido'),
        body('reason').isIn(['copyright', 'inappropriate', 'misleading', 'spam']),
        body('description').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason, description } = req.body;
            const reporterId = req.user.id;

            if (marketplaceService && marketplaceService.reportItem) {
                const report = await marketplaceService.reportItem(id, reporterId, reason, description);
                return res.status(201).json({
                    success: true,
                    message: 'Reporte enviado',
                    data: report
                });
            }

            res.status(201).json({
                success: true,
                message: 'Servicio no disponible'
            });
        } catch (error) {
            console.error('[MARKETPLACE] Error reportando item:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reportar item'
            });
        }
    }
);

module.exports = router;
