/**
 * 🚀 PWA OPTIMIZER INITIALIZATION - INDEX PAGE
 * Inicialización del optimizador PWA
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 */

// 🚀 PWA OPTIMIZER - MAXIMIZACIÓN DE SCORE PWA
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un momento para que se carguen otros sistemas
    setTimeout(() => {
        console.log('🚀 [PWA OPTIMIZER] Inicializando optimizador PWA...');

        try {
            // Verificar que la clase esté disponible
            if (typeof PWAOptimizer !== 'undefined') {
                // Inicializar el optimizador PWA
                window.pwaOptimizer = new PWAOptimizer();
                console.log('✅ [PWA OPTIMIZER] PWA Optimizer inicializado correctamente');
            } else {
                console.warn('⚠️ [PWA OPTIMIZER] Clase PWAOptimizer no disponible, reintentando...');
                // Reintentar después de 1 segundo
                setTimeout(() => {
                    if (typeof PWAOptimizer !== 'undefined') {
                        window.pwaOptimizer = new PWAOptimizer();
                        console.log('✅ [PWA OPTIMIZER] PWA Optimizer inicializado en segundo intento');
                    } else {
                        console.error('❌ [PWA OPTIMIZER] No se pudo cargar PWAOptimizer');
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('❌ [PWA OPTIMIZER] Error al inicializar PWA Optimizer:', error);
        }
    }, 1500); // Esperar 1.5 segundos para que se carguen otros sistemas
});
