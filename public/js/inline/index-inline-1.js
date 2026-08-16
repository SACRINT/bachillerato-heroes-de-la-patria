if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        // EVITAR RE-REGISTRO MÚLTIPLE - Verificación mejorada
        if (window.swAlreadyRegistered) {
            console.log('[SW] Registration ya intentado, saltando...');
            return;
        }
        window.swAlreadyRegistered = true;

        try {
            // Verificar si ya hay un SW registrado para evitar re-registros
            const existingRegistration = await navigator.serviceWorker.getRegistration();

            if (existingRegistration && existingRegistration.active &&
                existingRegistration.active.scriptURL.includes('sw-offline-first.js')) {
                console.log('[SW] Service Worker Offline-First ya está activo y funcionando');
                return; // No hacer nada si ya está registrado
            }

            console.log('[SW] Registrando Service Worker Offline-First estable...');

            // Limpiar todos los SW anteriores para evitar conflictos
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                if (!registration.active?.scriptURL.includes('sw-offline-first.js')) {
                    await registration.unregister();
                    console.log('[SW] Cleaned old SW:', registration.active?.scriptURL);
                }
            }

            // Registrar el nuevo SW estable solo una vez
            let registration = await navigator.serviceWorker.register('./sw-offline-first.js', {
                updateViaCache: 'none', // Evitar cache del SW mismo
                scope: './' // Scope explícito
            });

            console.log('[SW] Service Worker ESTABLE registrado una sola vez:', registration);

            // NO manejar updatefound para evitar ciclos infinitos

        } catch (error) {
            console.error('[SW] Service Worker registration failed:', error);
        }
    });
}