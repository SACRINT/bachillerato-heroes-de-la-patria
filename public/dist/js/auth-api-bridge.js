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
  let bridgeInitialized = false;

  // ✅ FIX (19 Nov 2025): Fallback getAuthToken para páginas sin autenticación
  function createFallbackAuthToken() {
    if (!window.getAuthToken) {
      window.getAuthToken = function() {
        // Intentar obtener token del sistema de autenticación unificado (bge_auth_token)
        return sessionStorage.getItem('bge_auth_token') ||
               localStorage.getItem('bge_auth_token') ||
               sessionStorage.getItem('authToken') ||  // Fallback para compatibilidad
               localStorage.getItem('authToken') ||
               null;
      };
      console.log('[AUTH-API-BRIDGE] ℹ️ Fallback getAuthToken creado (sin admin-auth.js)');
    }
  }

  // ✅ Esperar a que auth.js y api-client.js se carguen
  function initializeBridge() {
    if (bridgeInitialized) return; // Evitar inicialización múltiple
    retryCount++;

    // Verificar que auth está disponible
    if (!window.getAuthToken || typeof window.getAuthToken !== 'function') {
      if (retryCount > MAX_RETRIES) {
        // ✅ FIX (19 Nov 2025): En lugar de abortar, crear fallback
        console.warn('[AUTH-API-BRIDGE] ⚠️ getAuthToken no disponible después de 5s. Creando fallback.');
        createFallbackAuthToken();
        // Continuar con la inicialización
      } else {
        setTimeout(initializeBridge, 100); // Reintentar en 100ms
        return;
      }
    }

    // Verificar que api-client está disponible
    if (!window.apiClient || typeof window.apiClient.setTokenProvider !== 'function') {
      if (retryCount > MAX_RETRIES) {
        // ✅ FIX (19 Nov 2025): Degradación graceful si apiClient no está disponible
        console.warn('[AUTH-API-BRIDGE] ⚠️ apiClient no disponible después de 5s. Bridge no requerido en esta página.');
        bridgeInitialized = true;
        return;
      }
      setTimeout(initializeBridge, 100); // Reintentar en 100ms
      return;
    }

    // ✅ Bridge establecido: inyectar provider en api-client
    window.apiClient.setTokenProvider(window.getAuthToken);
    bridgeInitialized = true;

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
