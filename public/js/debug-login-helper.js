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
    console.log('%c========================================', 'color: cyan; font-weight: bold');
    console.log('%c🔍 DEBUG LOGIN STATE - ' + new Date().toISOString(), 'color: cyan; font-weight: bold');
    console.log('%c========================================', 'color: cyan; font-weight: bold');

    // 1. URL y Contexto
    console.log('\n%c📍 CONTEXTO', 'color: yellow; font-weight: bold');
    console.log('URL Actual:', window.location.href);
    console.log('Protocolo:', window.location.protocol);
    console.log('Host:', window.location.host);
    console.log('Pathname:', window.location.pathname);
    console.log('User Agent:', navigator.userAgent);

    // 2. SessionStorage
    console.log('\n%c💾 SESSION STORAGE', 'color: yellow; font-weight: bold');
    const sessionKeys = Object.keys(sessionStorage);
    console.log('Total Keys:', sessionKeys.length);
    console.log('Keys:', sessionKeys);

    sessionKeys.forEach(key => {
      const value = sessionStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        console.log(`  ✅ ${key}:`, parsed);
      } catch (e) {
        console.log(`  📝 ${key}:`, value);
      }
    });

    // 3. LocalStorage
    console.log('\n%c💿 LOCAL STORAGE', 'color: yellow; font-weight: bold');
    const localKeys = Object.keys(localStorage).filter(k => !k.startsWith('_'));
    console.log('Total Keys:', localKeys.length);
    console.log('Keys:', localKeys);

    localKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        console.log(`  ✅ ${key}:`, parsed);
      } catch (e) {
        console.log(`  📝 ${key}:`, value);
      }
    });

    // 4. Variables Globales
    console.log('\n%c🌐 VARIABLES GLOBALES', 'color: yellow; font-weight: bold');
    console.log('window.unifiedAuth:', window.unifiedAuth);
    console.log('window.TENANT_CONFIG:', window.TENANT_CONFIG);
    console.log('window.CONFIG:', window.CONFIG);
    console.log('window.getTenantConfigValue:', typeof window.getTenantConfigValue);

    // 5. DOM Elements Críticos
    console.log('\n%c🎨 ELEMENTOS DOM', 'color: yellow; font-weight: bold');
    const btnLogin = document.querySelector('#btnLogin, [data-action="openLoginModal"]');
    const btnLogout = document.querySelector('#btnLogout, [data-action="logout"]');
    const userMenu = document.querySelector('.user-menu, #userMenu');
    const loginModal = document.querySelector('#loginModal, .login-modal');

    console.log('Botón Login:', btnLogin ? '✅ Existe' : '❌ No existe');
    console.log('Botón Logout:', btnLogout ? '✅ Existe' : '❌ No existe');
    console.log('User Menu:', userMenu ? '✅ Existe' : '❌ No existe');
    console.log('Login Modal:', loginModal ? '✅ Existe' : '❌ No existe');

    if (userMenu) {
      console.log('  → User Menu HTML:', userMenu.outerHTML.substring(0, 200));
    }

    // 6. Scripts Cargados
    console.log('\n%c📜 SCRIPTS CARGADOS', 'color: yellow; font-weight: bold');
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const relevantScripts = scripts.filter(s =>
      s.src.includes('auth') ||
      s.src.includes('login') ||
      s.src.includes('unified') ||
      s.src.includes('main.js')
    );

    console.log('Scripts Relevantes:', relevantScripts.length);
    relevantScripts.forEach(script => {
      const url = new URL(script.src);
      console.log(`  📦 ${url.pathname}`);
    });

    // 7. Network Requests (si están disponibles)
    console.log('\n%c🌐 NETWORK', 'color: yellow; font-weight: bold');
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const authRequests = resources.filter(r =>
        r.name.includes('/api/auth') ||
        r.name.includes('/api/config')
      );

      console.log('Auth API Requests:', authRequests.length);
      authRequests.forEach(req => {
        console.log(`  🔗 ${req.name}`);
        console.log(`     Duration: ${req.duration.toFixed(2)}ms`);
      });
    }

    // 8. Estado de Autenticación Inferido
    console.log('\n%c🔐 ESTADO DE AUTENTICACIÓN', 'color: yellow; font-weight: bold');
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
      console.log('✅ AUTENTICADO');
      console.log('  Token:', authToken.substring(0, 20) + '...');
      console.log('  Usuario:', userData.nombre || userData.email);
      console.log('  Role:', userData.role);
      console.log('  Email:', userData.email);
    } else {
      console.log('❌ NO AUTENTICADO');
      console.log('  Token:', authToken ? 'Existe pero sin user_data' : 'No existe');
      console.log('  User Data:', userData ? 'Existe pero sin token' : 'No existe');
    }

    // 9. Errores en Console
    console.log('\n%c⚠️ ERRORES', 'color: yellow; font-weight: bold');
    console.log('(Revisar arriba en console si hay errores rojos)');

    console.log('\n%c========================================', 'color: cyan; font-weight: bold');
    console.log('%c✅ DEBUG COMPLETO', 'color: green; font-weight: bold');
    console.log('%c========================================', 'color: cyan; font-weight: bold');
  };

  /**
   * Test rápido de fetch al backend
   */
  window.testBackendAuth = async function(email = 'docente@test.com', password = 'Test123!') {
    console.log('%c🧪 TESTING BACKEND AUTH...', 'color: blue; font-weight: bold');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('%c✅ LOGIN EXITOSO', 'color: green; font-weight: bold');
        console.log('Response:', data);
        return data;
      } else {
        const error = await response.text();
        console.log('%c❌ LOGIN FALLIDO', 'color: red; font-weight: bold');
        console.log('Error:', error);
        return null;
      }
    } catch (error) {
      console.log('%c❌ ERROR DE RED', 'color: red; font-weight: bold');
      console.error(error);
      return null;
    }
  };

  /**
   * Limpia toda la autenticación
   */
  window.clearAuth = function() {
    console.log('%c🧹 LIMPIANDO AUTENTICACIÓN...', 'color: orange; font-weight: bold');

    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('user_role');

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');

    console.log('✅ Autenticación limpiada');
    console.log('Recargar página para aplicar cambios: location.reload()');
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
    console.log('%c🔧 FORZANDO LOGIN...', 'color: purple; font-weight: bold');

    const fakeToken = 'test-token-' + Date.now();

    sessionStorage.setItem('auth_token', fakeToken);
    sessionStorage.setItem('user_data', JSON.stringify(userData));
    sessionStorage.setItem('user_role', userData.role);

    console.log('✅ Login forzado exitoso');
    console.log('Token:', fakeToken);
    console.log('User:', userData);
    console.log('Recargar página: location.reload()');
  };

  // Auto-ejecutar al cargar
  console.log('%c🛠️ DEBUG HELPER CARGADO', 'color: green; font-weight: bold');
  console.log('%cComandos disponibles:', 'color: cyan');
  console.log('  • debugLoginState() - Captura estado completo');
  console.log('  • testBackendAuth() - Test de login al backend');
  console.log('  • clearAuth() - Limpia autenticación');
  console.log('  • forceLogin() - Fuerza login para testing');
})();
