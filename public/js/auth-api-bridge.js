/**
 * ✅ AUTH-API-BRIDGE.JS
 *
 * Desacopla dependencia circular entre auth.js y api-client.js
 * Inyecta token provider en api-client sin imports circulares
 *
 * Problema Original:
 * - api-client.js requería auth.js para obtener tokens
 * - auth.js requería api-client.js para refresh tokens
 * - Circular: A → B → A
 *
 * Solución:
 * - auth.js obtiene tokens Y los inyecta en api-client
 * - api-client solo CONSUME los tokens, no los obtiene
 * - Bridge desacopla ambos módulos
 *
 * Patrón: Dependency Injection + Provider Pattern
 */

(function() {
  'use strict';

  const MAX_RETRIES = 50; // Máximo 50 reintentos = 5 segundos
  let retryCount = 0;

  // ✅ Esperar a que auth.js y api-client.js se carguen
  function initializeBridge() {
    retryCount++;

    // Verificar que auth está disponible
    if (!window.getAuthToken || typeof window.getAuthToken !== 'function') {
      if (retryCount > MAX_RETRIES) {
        console.error('[AUTH-API-BRIDGE] ❌ getAuthToken nunca estuvo disponible después de 5 segundos. Abortando.');
        return;
      }
      setTimeout(initializeBridge, 100); // Reintentar en 100ms
      return;
    }

    // Verificar que api-client está disponible
    if (!window.apiClient || typeof window.apiClient.setTokenProvider !== 'function') {
      if (retryCount > MAX_RETRIES) {
        console.error('[AUTH-API-BRIDGE] ❌ apiClient nunca estuvo disponible después de 5 segundos. Abortando.');
        return;
      }
      setTimeout(initializeBridge, 100); // Reintentar en 100ms
      return;
    }

    // ✅ Bridge establecido: inyectar provider en api-client
    window.apiClient.setTokenProvider(window.getAuthToken);

    console.log('[AUTH-API-BRIDGE] ✅ Bridge auth ↔ api-client establecido correctamente');
  }

  // ✅ Iniciar bridge cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBridge);
  } else {
    // Si ya pasó DOMContentLoaded, ejecutar inmediatamente
    initializeBridge();
  }

  // ✅ Alternativa: si los scripts se cargaron antes que el bridge
  // Exponer función para inicializar manualmente
  window.initAuthApiBridge = initializeBridge;

  // ✅ Información del bridge
  window.authApiBridgeInfo = function() {
    return {
      status: (window.apiClient && window.apiClient._tokenProvider) ? 'Connected' : 'Not Connected',
      authAvailable: typeof window.getAuthToken === 'function',
      apiClientAvailable: typeof window.apiClient === 'object',
      tokenProviderInjected: window.apiClient && typeof window.apiClient._tokenProvider === 'function',
      description: 'Bridge para desacoplar auth.js de api-client.js',
      retryCount: retryCount,
      maxRetries: MAX_RETRIES
    };
  };

})();
