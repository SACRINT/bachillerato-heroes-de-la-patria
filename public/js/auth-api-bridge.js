/**
 * ✅ AUTH-API-BRIDGE.JS
 * Desacopla dependencia circular entre auth.js y api-client.js
 * Inyecta token provider en api-client de forma inmediata sin bucles de polling excesivos.
 */

(function() {
  'use strict';

  let bridgeInitialized = false;

  function getFallbackToken() {
    return sessionStorage.getItem('bge_auth_token') ||
           localStorage.getItem('bge_auth_token') ||
           sessionStorage.getItem('authToken') ||
           localStorage.getItem('authToken') ||
           null;
  }

  function initializeBridge() {
    if (bridgeInitialized) return;

    if (!window.getAuthToken || typeof window.getAuthToken !== 'function') {
      window.getAuthToken = getFallbackToken;
    }

    if (window.apiClient && typeof window.apiClient.setTokenProvider === 'function') {
      window.apiClient.setTokenProvider(window.getAuthToken);
      bridgeInitialized = true;
    } else {
      // Reintentar una sola vez con un pequeño delay
      setTimeout(() => {
        if (!bridgeInitialized && window.apiClient && typeof window.apiClient.setTokenProvider === 'function') {
          window.apiClient.setTokenProvider(window.getAuthToken);
          bridgeInitialized = true;
        }
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBridge);
  } else {
    initializeBridge();
  }

  window.initAuthApiBridge = initializeBridge;
})();
