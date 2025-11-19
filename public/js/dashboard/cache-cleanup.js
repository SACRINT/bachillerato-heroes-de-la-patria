/**
 * 🔄 CACHE CLEANUP - Limpieza de cache y service workers para forzar recarga
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(async function() {
    console.log('🧹 [CACHE CLEANUP] Iniciando limpieza de cache...');

    // 1. Limpiar Service Workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            await registration.unregister();
            console.log('✅ Service Worker desregistrado:', registration.scope);
        }
    }

    // 2. Limpiar Cache Storage
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (let cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('✅ Cache eliminado:', cacheName);
        }
    }

    // 3. Limpiar localStorage de scripts antiguos
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('script_') || key.includes('cache_'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('✅ [CACHE CLEANUP] Limpieza completada - Scripts frescos se cargarán');
})();
