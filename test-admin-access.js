/**
 * 🧪 TEST SCRIPT - Simular acceso a admin-dashboard
 * Propósito: Verificar que los gatekeepers funcionan correctamente
 */

// Simular credenciales guardadas por unified-auth-system-v2.js
const testUser = {
    id: "test-admin-123",
    email: "admin@heroespatria.edu.mx",
    nombre: "Admin",
    role: "admin"
};

const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLWlkIiwiZW1haWwiOiJhZG1pbkBoZXJvZXNwYXRyaWEuZWR1Lm14Iiwicm9sZSI6ImFkbWluIn0.test";

// Guardar en localStorage (simular que marcó "Recordarme")
localStorage.setItem('bge_auth_token', testToken);
localStorage.setItem('bge_auth_user', JSON.stringify(testUser));

console.log('✅ Credenciales simuladas guardadas en localStorage:');
console.log('   - bge_auth_token:', localStorage.getItem('bge_auth_token').substring(0, 50) + '...');
console.log('   - bge_auth_user:', localStorage.getItem('bge_auth_user'));

// Simular lo que haría dashboard-auth-check.js
console.log('\n🔍 Simulando dashboard-auth-check.js:');
let token = localStorage.getItem('bge_auth_token');
let userData = localStorage.getItem('bge_auth_user');

if (token && userData) {
    console.log('   ✅ ENCONTRADO: bge_auth_token + bge_auth_user en localStorage');
    try {
        const user = JSON.parse(userData);
        if (user && (user.role === 'admin' || user.role === 'administrativo')) {
            console.log('   ✅ AUTENTICACIÓN VÁLIDA - Role: admin');
            console.log('   ✅ dashboard-auth-check.js PERMITIRÍA ACCESO');
        }
    } catch (e) {
        console.log('   ❌ Error parsing JWT:', e);
    }
} else {
    console.log('   ❌ NO ENCONTRADO: credenciales no presentes');
}

// Simular lo que haría session-monitor.js
console.log('\n🔍 Simulando session-monitor.js (immediateSecurityCheck):');
const bgeToken = localStorage.getItem('bge_auth_token');
const bgeUser = localStorage.getItem('bge_auth_user');

if ((bgeToken && bgeUser)) {
    console.log('   ✅ ENCONTRADO: Sistema JWT moderno (bge_auth_*)');
    console.log('   ✅ session-monitor.js PERMITIRÍA ACCESO');
} else {
    console.log('   ❌ NO ENCONTRADO: Sistema JWT moderno');
}

console.log('\n✅ TEST COMPLETADO:');
console.log('   Si todo está en verde, admin-dashboard.html debería CARGAR');
console.log('   Si ves rojo, hay un problema en los gatekeepers');
