/**
 * DEBUG LOGIN HELPER - Script auxiliar para pruebas interactivas
 * Ejecutar en Console de DevTools para capturar estado completo
 *
 * Uso:
 * 1. Abrir DevTools → Console
 * 2. Copiar y pegar este script completo
 * 3. Ejecutar: debugLoginState()
 */

(function() {
  'use strict';

  /**
   * Captura el estado completo del sistema de autenticación
   */
  window.debugLoginState = function() {
    void 0;
    void 0;
    void 0;

    // 1. URL y Contexto
    void 0;
    void 0;
    void 0;
    void 0;
    void 0;
    void 0;

    // 2. SessionStorage
    void 0;
    const sessionKeys = Object.keys(sessionStorage);
    void 0;
    void 0;

    sessionKeys.forEach(key => {
      const value = sessionStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        void 0;
      } catch (e) {
        void 0;
      }
    });

    // 3. LocalStorage
    void 0;
    const localKeys = Object.keys(localStorage).filter(k => !k.startsWith('_'));
    void 0;
    void 0;

    localKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        void 0;
      } catch (e) {
        void 0;
      }
    });

    // 4. Variables Globales
    void 0;
    void 0;
    void 0;
    void 0;
    void 0;

    // 5. DOM Elements Críticos
    void 0;
    const btnLogin = document.querySelector('#btnLogin, [data-action="openLoginModal"]');
    const btnLogout = document.querySelector('#btnLogout, [data-action="logout"]');
    const userMenu = document.querySelector('.user-menu, #userMenu');
    const loginModal = document.querySelector('#loginModal, .login-modal');

    void 0;
    void 0;
    void 0;
    void 0;

    if (userMenu) {
      void 0;
    }

    // 6. Scripts Cargados
    void 0;
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const relevantScripts = scripts.filter(s =>
      s.src.includes('auth') ||
      s.src.includes('login') ||
      s.src.includes('unified') ||
      s.src.includes('main.js')
    );

    void 0;
    relevantScripts.forEach(script => {
      const url = new URL(script.src);
      void 0;
    });

    // 7. Network Requests (si están disponibles)
    void 0;
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const authRequests = resources.filter(r =>
        r.name.includes('/api/auth') ||
        r.name.includes('/api/config')
      );

      void 0;
      authRequests.forEach(req => {
        void 0;
        void 0;
      });
    }

    // 8. Estado de Autenticación Inferido
    void 0;
    const authToken = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    const userDataStr = sessionStorage.getItem('user_data') || localStorage.getItem('user_data');
    let userData = null;

    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
      } catch (e) {
        console.error('Error parsing user_data:', e);
      }
    }

    if (authToken && userData) {
      void 0;
      void 0;
      void 0;
      void 0;
      void 0;
    } else {
      void 0;
      void 0;
      void 0;
    }

    // 9. Errores en Console
    void 0;
    void 0;

    void 0;
    void 0;
    void 0;
  };

  /**
   * Test rápido de fetch al backend
   */
  window.testBackendAuth = async function(email = 'docente@test.com', password = 'Test123!') {
    void 0;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      void 0;
      void 0;

      if (response.ok) {
        const data = await response.json();
        void 0;
        void 0;
        return data;
      } else {
        const error = await response.text();
        void 0;
        void 0;
        return null;
      }
    } catch (error) {
      void 0;
      console.error(error);
      return null;
    }
  };

  /**
   * Limpia toda la autenticación
   */
  window.clearAuth = function() {
    void 0;

    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('user_role');

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');

    void 0;
    void 0;
  };

  /**
   * Fuerza un login manual para testing
   */
  window.forceLogin = function(userData = {
    id: 1,
    email: 'docente@test.com',
    nombre: 'Docente',
    apellido_paterno: 'Test',
    role: 'docente'
  }) {
    void 0;

    const fakeToken = 'test-token-' + Date.now();

    sessionStorage.setItem('auth_token', fakeToken);
    sessionStorage.setItem('user_data', JSON.stringify(userData));
    sessionStorage.setItem('user_role', userData.role);

    void 0;
    void 0;
    void 0;
    void 0;
  };

  // Auto-ejecutar al cargar
  void 0;
  void 0;
  void 0;
  void 0;
  void 0;
  void 0;
})();
