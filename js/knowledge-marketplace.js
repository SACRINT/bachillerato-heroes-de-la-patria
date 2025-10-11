/**
 * 🏪 MARKETPLACE DE CONOCIMIENTO
 * Portal BGE Héroes de la Patria
 * Sistema de intercambio de conocimiento donde estudiantes comparten y monetizan su aprendizaje
 */

class KnowledgeMarketplace {
    constructor() {
        this.marketplace = {
            users: new Map(),
            products: new Map(),
            transactions: [],
            categories: new Map(),
            reviews: new Map(),
            earnings: new Map(),
            subscriptions: new Map()
        };

        this.economicSystem = {
            currencies: {
                iaCoins: 'IA Coins',
                knowledgePoints: 'Knowledge Points',
                reputationScore: 'Reputation Score'
            },
            exchangeRates: {
                iaCoinsToKnowledge: 10,
                knowledgeToReputation: 100,
                reputationBonus: 1.5
            },
            transactionFees: {
                selling: 0.05,  // 5%
                premium: 0.03   // 3% para usuarios premium
            }
        };

        this.contentTypes = new Map();
        this.qualitySystem = null;
        this.recommendationEngine = null;
        this.analyticsEngine = null;

        this.initializeMarketplace();
        this.setupContentTypes();
        this.setupQualitySystem();
        this.setupRecommendationEngine();
        this.loadMarketplaceData();
    }

    initializeMarketplace() {
        // Configurar categorías principales
        this.marketplace.categories.set('tutoriales', {
            name: 'Tutoriales',
            description: 'Explicaciones paso a paso de conceptos',
            icon: 'fas fa-chalkboard-teacher',
            basePrice: 50,
            demandMultiplier: 1.2
        });

        this.marketplace.categories.set('resumenes', {
            name: 'Resúmenes',
            description: 'Resúmenes concisos de temas importantes',
            icon: 'fas fa-file-alt',
            basePrice: 30,
            demandMultiplier: 1.0
        });

        this.marketplace.categories.set('ejercicios', {
            name: 'Ejercicios',
            description: 'Problemas resueltos y ejercicios prácticos',
            icon: 'fas fa-calculator',
            basePrice: 40,
            demandMultiplier: 1.3
        });

        this.marketplace.categories.set('proyectos', {
            name: 'Proyectos',
            description: 'Proyectos completos y estudios de caso',
            icon: 'fas fa-project-diagram',
            basePrice: 100,
            demandMultiplier: 1.5
        });

        this.marketplace.categories.set('examenes', {
            name: 'Exámenes de Práctica',
            description: 'Exámenes simulados y bancos de preguntas',
            icon: 'fas fa-clipboard-check',
            basePrice: 75,
            demandMultiplier: 1.8
        });

        this.marketplace.categories.set('recursos', {
            name: 'Recursos Adicionales',
            description: 'Materiales complementarios y herramientas',
            icon: 'fas fa-toolbox',
            basePrice: 25,
            demandMultiplier: 0.9
        });
    }

    setupContentTypes() {
        this.contentTypes.set('document', {
            name: 'Documento',
            formats: ['pdf', 'docx', 'txt', 'md'],
            maxSize: 10 * 1024 * 1024, // 10MB
            validator: this.validateDocument.bind(this)
        });

        this.contentTypes.set('video', {
            name: 'Video',
            formats: ['mp4', 'webm', 'avi'],
            maxSize: 100 * 1024 * 1024, // 100MB
            validator: this.validateVideo.bind(this)
        });

        this.contentTypes.set('audio', {
            name: 'Audio',
            formats: ['mp3', 'wav', 'ogg'],
            maxSize: 50 * 1024 * 1024, // 50MB
            validator: this.validateAudio.bind(this)
        });

        this.contentTypes.set('interactive', {
            name: 'Contenido Interactivo',
            formats: ['html', 'js', 'zip'],
            maxSize: 25 * 1024 * 1024, // 25MB
            validator: this.validateInteractive.bind(this)
        });

        this.contentTypes.set('presentation', {
            name: 'Presentación',
            formats: ['pptx', 'pdf', 'html'],
            maxSize: 15 * 1024 * 1024, // 15MB
            validator: this.validatePresentation.bind(this)
        });
    }

    setupQualitySystem() {
        this.qualitySystem = {
            criteria: {
                accuracy: { weight: 0.3, min: 0.8 },
                clarity: { weight: 0.25, min: 0.7 },
                completeness: { weight: 0.2, min: 0.75 },
                originality: { weight: 0.15, min: 0.6 },
                usefulness: { weight: 0.1, min: 0.7 }
            },
            minimumQualityScore: 0.75,
            reviewersRequired: 3,
            expertReviewBonus: 1.2,
            qualityTiers: {
                bronze: { min: 0.75, bonus: 1.0, badge: '🥉' },
                silver: { min: 0.85, bonus: 1.25, badge: '🥈' },
                gold: { min: 0.93, bonus: 1.5, badge: '🥇' },
                platinum: { min: 0.98, bonus: 2.0, badge: '💎' }
            }
        };
    }

    setupRecommendationEngine() {
        this.recommendationEngine = {
            algorithms: {
                collaborative: this.collaborativeFiltering.bind(this),
                contentBased: this.contentBasedFiltering.bind(this),
                hybrid: this.hybridRecommendation.bind(this)
            },
            userBehavior: new Map(),
            contentSimilarity: new Map(),
            trendingScore: new Map(),
            personalizedWeight: 0.6,
            trendingWeight: 0.4
        };
    }

    async createProduct(creatorData, productData) {
        // Validar datos del producto
        const validation = await this.validateProductData(productData);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        // Generar ID único
        const productId = this.generateProductId();

        // Calcular precio sugerido
        const suggestedPrice = this.calculateSuggestedPrice(productData);

        // Crear producto
        const product = {
            id: productId,
            creator: creatorData.id,
            title: productData.title,
            description: productData.description,
            category: productData.category,
            subcategory: productData.subcategory,
            subject: productData.subject,
            academicLevel: productData.academicLevel,
            contentType: productData.contentType,
            content: productData.content,
            price: productData.price || suggestedPrice,
            suggestedPrice: suggestedPrice,
            tags: productData.tags || [],
            difficulty: productData.difficulty || 'medium',
            estimatedTime: productData.estimatedTime || 30,
            language: productData.language || 'es',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'pending_review',
            qualityScore: 0,
            reviews: [],
            sales: 0,
            revenue: 0,
            downloads: 0,
            likes: 0,
            views: 0,
            featured: false,
            promoted: false
        };

        // Guardar producto
        this.marketplace.products.set(productId, product);

        // Iniciar proceso de revisión de calidad
        await this.initiateQualityReview(productId);

        // Notificar al creador
        this.notifyCreator(creatorData.id, 'product_created', {
            productId: productId,
            title: product.title,
            status: 'pending_review'
        });

        return {
            success: true,
            productId: productId,
            product: product,
            message: 'Producto creado exitosamente. En proceso de revisión de calidad.'
        };
    }

    async purchaseProduct(buyerId, productId, paymentMethod = 'iaCoins') {
        const product = this.marketplace.products.get(productId);
        const buyer = this.marketplace.users.get(buyerId);

        if (!product) {
            return { success: false, error: 'Producto no encontrado' };
        }

        if (!buyer) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        if (product.creator === buyerId) {
            return { success: false, error: 'No puedes comprar tu propio producto' };
        }

        // Verificar disponibilidad
        if (product.status !== 'active') {
            return { success: false, error: 'Producto no disponible' };
        }

        // Calcular precio final
        const finalPrice = this.calculateFinalPrice(product, buyer);

        // Verificar fondos
        const hasEnoughFunds = await this.verifyFunds(buyerId, finalPrice, paymentMethod);
        if (!hasEnoughFunds) {
            return { success: false, error: 'Fondos insuficientes' };
        }

        // Procesar transacción
        const transaction = await this.processTransaction({
            buyerId: buyerId,
            sellerId: product.creator,
            productId: productId,
            amount: finalPrice,
            paymentMethod: paymentMethod,
            timestamp: Date.now()
        });

        if (transaction.success) {
            // Actualizar estadísticas del producto
            product.sales += 1;
            product.revenue += finalPrice;

            // Actualizar ganancias del vendedor
            const sellerEarnings = finalPrice * (1 - this.economicSystem.transactionFees.selling);
            this.updateSellerEarnings(product.creator, sellerEarnings);

            // Otorgar acceso al comprador
            await this.grantProductAccess(buyerId, productId);

            // Actualizar métricas del usuario
            this.updateUserMetrics(buyerId, 'purchase', { productId, amount: finalPrice });
            this.updateUserMetrics(product.creator, 'sale', { productId, amount: sellerEarnings });

            // Generar recomendaciones actualizadas
            this.updateRecommendations(buyerId);

            return {
                success: true,
                transaction: transaction,
                product: product,
                accessGranted: true
            };
        }

        return { success: false, error: 'Error procesando la transacción' };
    }

    async searchProducts(query, filters = {}) {
        let results = Array.from(this.marketplace.products.values())
            .filter(product => product.status === 'active');

        // Aplicar filtros
        if (filters.category) {
            results = results.filter(p => p.category === filters.category);
        }

        if (filters.subject) {
            results = results.filter(p => p.subject === filters.subject);
        }

        if (filters.academicLevel) {
            results = results.filter(p => p.academicLevel === filters.academicLevel);
        }

        if (filters.priceRange) {
            results = results.filter(p =>
                p.price >= filters.priceRange.min &&
                p.price <= filters.priceRange.max
            );
        }

        if (filters.difficulty) {
            results = results.filter(p => p.difficulty === filters.difficulty);
        }

        if (filters.contentType) {
            results = results.filter(p => p.contentType === filters.contentType);
        }

        // Búsqueda por texto
        if (query) {
            const queryLower = query.toLowerCase();
            results = results.filter(product =>
                product.title.toLowerCase().includes(queryLower) ||
                product.description.toLowerCase().includes(queryLower) ||
                product.tags.some(tag => tag.toLowerCase().includes(queryLower))
            );
        }

        // Aplicar puntuación de relevancia
        results = results.map(product => ({
            ...product,
            relevanceScore: this.calculateRelevanceScore(product, query, filters)
        }));

        // Ordenar por relevancia y calidad
        results.sort((a, b) => {
            const scoreA = (a.relevanceScore * 0.7) + (a.qualityScore * 0.3);
            const scoreB = (b.relevanceScore * 0.7) + (b.qualityScore * 0.3);
            return scoreB - scoreA;
        });

        return {
            results: results,
            totalCount: results.length,
            query: query,
            filters: filters,
            searchTime: Date.now()
        };
    }

    async getRecommendations(userId, type = 'hybrid', limit = 10) {
        const user = this.marketplace.users.get(userId);
        if (!user) {
            return { recommendations: [], type: 'error' };
        }

        let recommendations = [];

        switch (type) {
            case 'collaborative':
                recommendations = await this.recommendationEngine.algorithms.collaborative(userId);
                break;
            case 'contentBased':
                recommendations = await this.recommendationEngine.algorithms.contentBased(userId);
                break;
            case 'trending':
                recommendations = await this.getTrendingProducts(limit);
                break;
            case 'hybrid':
            default:
                recommendations = await this.recommendationEngine.algorithms.hybrid(userId);
                break;
        }

        // Personalizar recomendaciones
        recommendations = this.personalizeRecommendations(recommendations, user);

        // Limitar resultados
        recommendations = recommendations.slice(0, limit);

        // Tracking de recomendaciones mostradas
        this.trackRecommendations(userId, recommendations, type);

        return {
            recommendations: recommendations,
            type: type,
            userId: userId,
            timestamp: Date.now()
        };
    }

    async submitReview(reviewerId, productId, reviewData) {
        const product = this.marketplace.products.get(productId);
        const reviewer = this.marketplace.users.get(reviewerId);

        if (!product || !reviewer) {
            return { success: false, error: 'Producto o revisor no encontrado' };
        }

        // Verificar que el usuario haya comprado el producto
        const hasAccess = await this.verifyProductAccess(reviewerId, productId);
        if (!hasAccess) {
            return { success: false, error: 'Debes comprar el producto para reseñarlo' };
        }

        // Verificar que no haya reseñado antes
        const existingReview = product.reviews.find(r => r.reviewerId === reviewerId);
        if (existingReview) {
            return { success: false, error: 'Ya has reseñado este producto' };
        }

        // Crear reseña
        const review = {
            id: this.generateReviewId(),
            reviewerId: reviewerId,
            productId: productId,
            rating: reviewData.rating,
            comment: reviewData.comment,
            criteriaScores: reviewData.criteriaScores || {},
            helpful: 0,
            reported: false,
            createdAt: Date.now()
        };

        // Agregar reseña al producto
        product.reviews.push(review);

        // Actualizar puntuación de calidad
        await this.updateQualityScore(productId);

        // Otorgar recompensas al revisor
        this.rewardReviewer(reviewerId, review);

        // Notificar al creador del producto
        this.notifyCreator(product.creator, 'new_review', {
            productId: productId,
            rating: review.rating,
            reviewerId: reviewerId
        });

        return {
            success: true,
            review: review,
            newQualityScore: product.qualityScore
        };
    }

    async becomeCreator(userId, creatorData) {
        const user = this.marketplace.users.get(userId);
        if (!user) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        if (user.isCreator) {
            return { success: false, error: 'Ya eres un creador' };
        }

        // Validar requisitos mínimos
        const requirements = this.validateCreatorRequirements(user, creatorData);
        if (!requirements.meetsRequirements) {
            return {
                success: false,
                error: 'No cumples con los requisitos mínimos',
                missingRequirements: requirements.missing
            };
        }

        // Crear perfil de creador
        const creatorProfile = {
            specialties: creatorData.specialties || [],
            experience: creatorData.experience || '',
            portfolio: creatorData.portfolio || [],
            verificationStatus: 'pending',
            qualityRating: 0,
            totalSales: 0,
            totalRevenue: 0,
            createdProducts: 0,
            followers: 0,
            bio: creatorData.bio || '',
            socialLinks: creatorData.socialLinks || {},
            createdAt: Date.now()
        };

        // Actualizar usuario
        user.isCreator = true;
        user.creatorProfile = creatorProfile;

        // Iniciar proceso de verificación
        await this.initiateCreatorVerification(userId);

        // Otorgar insignia inicial
        if (window.achievementSystem) {
            window.achievementSystem.unlockAchievement(userId, 'knowledge_creator');
        }

        return {
            success: true,
            creatorProfile: creatorProfile,
            message: 'Perfil de creador creado. Proceso de verificación iniciado.'
        };
    }

    async getMarketplaceAnalytics(creatorId, period = '30d') {
        const creator = this.marketplace.users.get(creatorId);
        if (!creator || !creator.isCreator) {
            return { error: 'Creador no encontrado' };
        }

        const creatorProducts = Array.from(this.marketplace.products.values())
            .filter(p => p.creator === creatorId);

        const analytics = {
            period: period,
            overview: {
                totalProducts: creatorProducts.length,
                activeProducts: creatorProducts.filter(p => p.status === 'active').length,
                totalSales: creatorProducts.reduce((sum, p) => sum + p.sales, 0),
                totalRevenue: creatorProducts.reduce((sum, p) => sum + p.revenue, 0),
                averageRating: this.calculateAverageRating(creatorProducts),
                totalViews: creatorProducts.reduce((sum, p) => sum + p.views, 0),
                totalDownloads: creatorProducts.reduce((sum, p) => sum + p.downloads, 0)
            },
            topProducts: this.getTopProducts(creatorProducts, 5),
            salesTrend: this.calculateSalesTrend(creatorProducts, period),
            categoryPerformance: this.analyzeCategoryPerformance(creatorProducts),
            revenueBreakdown: this.calculateRevenueBreakdown(creatorProducts),
            audienceInsights: this.getAudienceInsights(creatorProducts),
            recommendations: this.getCreatorRecommendations(creatorId, creatorProducts)
        };

        return analytics;
    }

    // Métodos de utilidad y helpers
    calculateSuggestedPrice(productData) {
        const category = this.marketplace.categories.get(productData.category);
        if (!category) return 50; // Precio base por defecto

        const basePrice = category.basePrice;
        let multiplier = category.demandMultiplier;

        // Ajustar por dificultad
        const difficultyMultipliers = {
            'beginner': 0.8,
            'intermediate': 1.0,
            'advanced': 1.3,
            'expert': 1.6
        };
        multiplier *= difficultyMultipliers[productData.difficulty] || 1.0;

        // Ajustar por tiempo estimado
        if (productData.estimatedTime > 60) {
            multiplier *= 1.2;
        } else if (productData.estimatedTime < 15) {
            multiplier *= 0.9;
        }

        // Ajustar por tipo de contenido
        const contentTypeMultipliers = {
            'video': 1.3,
            'interactive': 1.5,
            'document': 1.0,
            'audio': 1.1,
            'presentation': 1.2
        };
        multiplier *= contentTypeMultipliers[productData.contentType] || 1.0;

        return Math.round(basePrice * multiplier);
    }

    calculateFinalPrice(product, buyer) {
        let finalPrice = product.price;

        // Descuentos por nivel de usuario
        if (buyer.level >= 10) {
            finalPrice *= 0.9; // 10% descuento
        } else if (buyer.level >= 5) {
            finalPrice *= 0.95; // 5% descuento
        }

        // Descuentos por suscripción premium
        if (buyer.isPremium) {
            finalPrice *= 0.85; // 15% descuento adicional
        }

        return Math.round(finalPrice);
    }

    async verifyFunds(userId, amount, paymentMethod) {
        const user = this.marketplace.users.get(userId);
        if (!user) return false;

        switch (paymentMethod) {
            case 'iaCoins':
                return (user.iaCoins || 0) >= amount;
            case 'knowledgePoints':
                const requiredKP = amount * this.economicSystem.exchangeRates.iaCoinsToKnowledge;
                return (user.knowledgePoints || 0) >= requiredKP;
            default:
                return false;
        }
    }

    async processTransaction(transactionData) {
        const transactionId = this.generateTransactionId();

        try {
            // Deducir fondos del comprador
            await this.deductFunds(transactionData.buyerId, transactionData.amount, transactionData.paymentMethod);

            // Agregar fondos al vendedor
            const sellerAmount = transactionData.amount * (1 - this.economicSystem.transactionFees.selling);
            await this.addFunds(transactionData.sellerId, sellerAmount, 'iaCoins');

            // Registrar transacción
            const transaction = {
                id: transactionId,
                ...transactionData,
                status: 'completed',
                fees: transactionData.amount * this.economicSystem.transactionFees.selling,
                sellerAmount: sellerAmount
            };

            this.marketplace.transactions.push(transaction);

            return { success: true, transaction: transaction };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    generateProductId() {
        return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateReviewId() {
        return 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    loadMarketplaceData() {
        const savedData = localStorage.getItem('knowledgeMarketplace');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Restaurar datos del marketplace
                if (data.products) {
                    this.marketplace.products = new Map(data.products);
                }
                if (data.users) {
                    this.marketplace.users = new Map(data.users);
                }
                if (data.transactions) {
                    this.marketplace.transactions = data.transactions;
                }
            } catch (error) {
                console.error('Error cargando datos del marketplace:', error);
            }
        }
    }

    saveMarketplaceData() {
        const dataToSave = {
            products: Array.from(this.marketplace.products.entries()),
            users: Array.from(this.marketplace.users.entries()),
            transactions: this.marketplace.transactions,
            timestamp: Date.now()
        };

        localStorage.setItem('knowledgeMarketplace', JSON.stringify(dataToSave));
    }

    // Métodos stub para funcionalidad completa
    validateProductData() { return { isValid: true, errors: [] }; }
    validateDocument() { return true; }
    validateVideo() { return true; }
    validateAudio() { return true; }
    validateInteractive() { return true; }
    validatePresentation() { return true; }
    initiateQualityReview() {}
    notifyCreator() {}
    updateSellerEarnings() {}
    grantProductAccess() {}
    updateUserMetrics() {}
    updateRecommendations() {}
    calculateRelevanceScore() { return 0.8; }
    collaborativeFiltering() { return []; }
    contentBasedFiltering() { return []; }
    hybridRecommendation() { return []; }
    getTrendingProducts() { return []; }
    personalizeRecommendations(recs) { return recs; }
    trackRecommendations() {}
    verifyProductAccess() { return true; }
    updateQualityScore() {}
    rewardReviewer() {}
    validateCreatorRequirements() { return { meetsRequirements: true, missing: [] }; }
    initiateCreatorVerification() {}
    calculateAverageRating() { return 4.5; }
    getTopProducts(products, limit) { return products.slice(0, limit); }
    calculateSalesTrend() { return []; }
    analyzeCategoryPerformance() { return {}; }
    calculateRevenueBreakdown() { return {}; }
    getAudienceInsights() { return {}; }
    getCreatorRecommendations() { return []; }
    deductFunds() {}
    addFunds() {}

    // API pública
    getMarketplaceStats() {
        return {
            totalProducts: this.marketplace.products.size,
            activeProducts: Array.from(this.marketplace.products.values()).filter(p => p.status === 'active').length,
            totalUsers: this.marketplace.users.size,
            totalCreators: Array.from(this.marketplace.users.values()).filter(u => u.isCreator).length,
            totalTransactions: this.marketplace.transactions.length,
            categories: Array.from(this.marketplace.categories.entries()).map(([key, category]) => ({
                id: key,
                ...category
            }))
        };
    }

    async registerUser(userData) {
        const userId = userData.id || this.generateUserId();

        const user = {
            id: userId,
            email: userData.email,
            name: userData.name,
            level: userData.level || 1,
            iaCoins: userData.iaCoins || 100,
            knowledgePoints: userData.knowledgePoints || 0,
            reputationScore: userData.reputationScore || 0,
            isPremium: userData.isPremium || false,
            isCreator: false,
            purchasedProducts: [],
            createdProducts: [],
            reviews: [],
            preferences: userData.preferences || {},
            joinedAt: Date.now()
        };

        this.marketplace.users.set(userId, user);
        this.saveMarketplaceData();

        return { success: true, user: user };
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Inicializar y exponer globalmente
window.knowledgeMarketplace = new KnowledgeMarketplace();

// Integración con otros sistemas
document.addEventListener('DOMContentLoaded', function() {
    // Integrar con sistema de logros
    document.addEventListener('marketplacePurchase', function(event) {
        if (window.achievementSystem) {
            const purchase = event.detail;
            window.achievementSystem.addXP(Math.floor(purchase.amount / 10));

            // Verificar logros específicos del marketplace
            if (purchase.amount >= 100) {
                window.achievementSystem.checkAchievement('big_spender');
            }
        }
    });

    document.addEventListener('marketplaceSale', function(event) {
        if (window.achievementSystem) {
            const sale = event.detail;
            window.achievementSystem.addXP(Math.floor(sale.amount / 5));

            // Verificar logros de ventas
            if (sale.totalSales >= 10) {
                window.achievementSystem.checkAchievement('successful_creator');
            }
        }
    });
});

console.log('🏪 Marketplace de Conocimiento cargado correctamente');