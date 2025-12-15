/**
 * 🔍 SCRIPT DE DEBUGGING PARA LOGIN Y SESIÓN
 * Ejecutar en Console (F12 → Console) para ver qué está pasando con el login
 */

console.log('🔍 [DEBUG] Iniciando diagnóstico de sesión...\n');

// 1. Verificar qué hay en localStorage y sessionStorage
console.log('📦 [STORAGE] Contenido de localStorage:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (key.includes('bge') || key.includes('auth') || key.includes('token')) {
        console.log(`  ${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
    }
}

console.log('\n📦 [STORAGE] Contenido de sessionStorage:');
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    if (key.includes('bge') || key.includes('auth') || key.includes('token')) {
        console.log(`  ${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
    }
}

// 2. Verificar estado del sistema de autenticación
console.log('\n🔐 [AUTH STATE] Estado de window.unifiedLogin:');
if (window.unifiedLogin) {
    console.log('  ✅ window.unifiedLogin EXISTS');
    console.log('  isAuthenticated:', window.unifiedLogin.state?.isAuthenticated);
    console.log('  currentUser:', window.unifiedLogin.state?.currentUser);
    console.log('  token:', window.unifiedLogin.state?.token ? '(presente)' : '(no presente)');
} else {
    console.log('  ❌ window.unifiedLogin NO EXISTE');
}

// 3. Verificar elementos del DOM (header)
console.log('\n🎨 [DOM] Elementos del header:');
const loginButtons = document.getElementById('loginButtons');
const userMenu = document.getElementById('userMenu');
const userMenuName = document.getElementById('userMenuName');
const userMenuRole = document.getElementById('userMenuRole');

console.log('  #loginButtons:', {
    existe: !!loginButtons,
    visible: loginButtons && !loginButtons.classList.contains('d-none'),
    html: loginButtons?.outerHTML.substring(0, 100)
});

console.log('  #userMenu:', {
    existe: !!userMenu,
    visible: userMenu && !userMenu.classList.contains('d-none')
});

console.log('  #userMenuName:', {
    existe: !!userMenuName,
    texto: userMenuName?.textContent
});

console.log('  #userMenuRole:', {
    existe: !!userMenuRole,
    texto: userMenuRole?.textContent
});

// 4. Funciones de prueba
console.log('\n🧪 [TEST] Funciones disponibles:');

console.log('\n✨ Ejecuta:');
console.log('  testLogin() - Intentar login con docente@test.com');
console.log('  testSessionSave() - Guardar sesión de prueba');
console.log('  testSessionLoad() - Cargar sesión guardada');
console.log('  testHeader() - Ver estado del header');

window.testLogin = async function() {
    console.log('🚀 [TEST] Iniciando test de login...');

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'docente@test.com',
            password: 'Test123!'
        })
    });

    console.log('📊 [TEST] Status:', response.status);
    const data = await response.json();

    if (data.success) {
        console.log('✅ [TEST] Login exitoso!');
        console.log('  User:', data.user);
        console.log('  Token:', data.tokens?.accessToken ? '(presente)' : '(no presente)');

        // Guardar en sessionStorage como lo haría el sistema real
        sessionStorage.setItem('bge_auth_token', data.tokens.accessToken);
        sessionStorage.setItem('bge_auth_user', JSON.stringify(data.user));
        console.log('✅ [TEST] Token guardado en sessionStorage');

    } else {
        console.log('❌ [TEST] Login fallido:', data.error);
    }
};

window.testSessionSave = function() {
    console.log('💾 [TEST] Guardando sesión de prueba...');

    const testUser = {
        id: 1,
        email: 'docente@test.com',
        nombre: 'Docente',
        apellido_paterno: 'Test',
        role: 'docente'
    };

    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidGVzdCJ9.test';

    sessionStorage.setItem('bge_auth_token', testToken);
    sessionStorage.setItem('bge_auth_user', JSON.stringify(testUser));

    console.log('✅ [TEST] Sesión de prueba guardada');
    console.log('  Token:', testToken);
    console.log('  Usuario:', testUser);
};

window.testSessionLoad = function() {
    console.log('📂 [TEST] Cargando sesión...');

    const token = sessionStorage.getItem('bge_auth_token');
    const userStr = sessionStorage.getItem('bge_auth_user');

    if (token && userStr) {
        console.log('✅ [TEST] Sesión encontrada');
        console.log('  Token:', token.substring(0, 50) + '...');
        console.log('  Usuario:', JSON.parse(userStr));
    } else {
        console.log('❌ [TEST] NO HAY SESIÓN GUARDADA');
        console.log('  Token:', token ? 'sí' : 'no');
        console.log('  Usuario:', userStr ? 'sí' : 'no');
    }
};

window.testHeader = function() {
    console.log('🎨 [TEST] Estado actual del header:');

    const loginButtons = document.getElementById('loginButtons');
    const userMenu = document.getElementById('userMenu');
    const userMenuName = document.getElementById('userMenuName');

    console.log('  Botón login visible?', loginButtons && !loginButtons.classList.contains('d-none'));
    console.log('  Menú usuario visible?', userMenu && !userMenu.classList.contains('d-none'));
    console.log('  Nombre mostrado:', userMenuName?.textContent);
};

console.log('\n✅ Debugging tools ready!\n');
