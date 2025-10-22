// SOLUCIÓN INTELIGENTE - RESPETA EL ESTADO DE AUTENTICACIÓN
console.log('🎯 INICIANDO SISTEMA INTELIGENTE DE ADMIN...');

// Función que verifica el estado de auth antes de mostrar elementos
function nuclearForceAdminElements() {
    console.log('🔍 VERIFICANDO ESTADO DE AUTENTICACIÓN...');
    
    // Verificar si hay sesión válida
    const adminSession = localStorage.getItem('admin_session');
    let isAuthenticated = false;
    
    if (adminSession) {
        try {
            const sessionData = JSON.parse(adminSession);
            const sessionTimeout = 30 * 60 * 1000; // 30 minutos como en admin-auth.js
            const now = Date.now();
            
            if (now - sessionData.timestamp < sessionTimeout) {
                isAuthenticated = true;
                console.log('✅ Sesión válida encontrada');
            } else {
                console.log('⏰ Sesión expirada');
                localStorage.removeItem('admin_session');
            }
        } catch (error) {
            console.log('❌ Error parseando sesión:', error);
            localStorage.removeItem('admin_session');
        }
    } else {
        console.log('ℹ️ No hay sesión de admin');
    }
    
    // Obtener elementos
    const adminSection1 = document.getElementById('adminOnlySection');
    const adminSection2 = document.getElementById('adminOnlySection2');  
    const loginBtn = document.getElementById('adminPanelMenuLink');
    const logoutBtn = document.getElementById('adminPanelLogoutOption');
    
    if (isAuthenticated) {
        console.log('🔥 MOSTRANDO ELEMENTOS ADMIN - USUARIO AUTENTICADO');
        
        // Mostrar elementos admin
        if (adminSection1) {
            adminSection1.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            adminSection1.classList.remove('d-none', 'hidden');
            adminSection1.setAttribute('data-nuclear-forced', 'true');
            console.log('👁️ adminOnlySection MOSTRADO');
        }
        
        if (adminSection2) {
            adminSection2.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            adminSection2.classList.remove('d-none', 'hidden'); 
            adminSection2.setAttribute('data-nuclear-forced', 'true');
            console.log('👁️ adminOnlySection2 MOSTRADO');
        }
        
        // Actualizar botón de login a estado activo
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-shield-check me-2"></i>Admin <span class="badge bg-success">ACTIVO</span>';
            loginBtn.style.cssText = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important; color: white !important; font-weight: bold !important;';
            loginBtn.setAttribute('data-nuclear-forced', 'true');
            console.log('✅ LOGIN BUTTON ACTUALIZADO A ACTIVO');
        }
        
        // Mostrar logout
        if (logoutBtn) {
            logoutBtn.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            logoutBtn.classList.remove('d-none', 'hidden');
            logoutBtn.setAttribute('data-nuclear-forced', 'true');
            console.log('👁️ LOGOUT BUTTON MOSTRADO');
        }
        
    } else {
        console.log('🙈 OCULTANDO ELEMENTOS ADMIN - USUARIO NO AUTENTICADO');
        
        // Ocultar elementos admin
        if (adminSection1) {
            adminSection1.classList.add('d-none');
            adminSection1.style.display = 'none';
            adminSection1.removeAttribute('data-nuclear-forced');
            console.log('🙈 adminOnlySection OCULTADO');
        }
        
        if (adminSection2) {
            adminSection2.classList.add('d-none');
            adminSection2.style.display = 'none';
            adminSection2.removeAttribute('data-nuclear-forced');
            console.log('🙈 adminOnlySection2 OCULTADO');
        }
        
        // Restaurar botón de login a estado normal
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-shield-halved me-2"></i>Admin';
            loginBtn.style.cssText = '';
            loginBtn.classList.remove('text-success');
            loginBtn.removeAttribute('data-nuclear-forced');
            console.log('🔄 LOGIN BUTTON RESTAURADO A NORMAL');
        }
        
        // Ocultar logout
        if (logoutBtn) {
            logoutBtn.classList.add('d-none');
            logoutBtn.style.display = 'none';
            logoutBtn.removeAttribute('data-nuclear-forced');
            console.log('🙈 LOGOUT BUTTON OCULTADO');
        }
    }
    
    console.log('✅ ESTADO ACTUALIZADO CORRECTAMENTE');
}

// Ejecutar inmediatamente
nuclearForceAdminElements();

// Ejecutar cada 500ms para mantener sincronizado con el estado de auth
const nuclearInterval = setInterval(() => {
    // Verificar si el estado ha cambiado
    const adminSession = localStorage.getItem('admin_session');
    let shouldBeAuthenticated = false;
    
    if (adminSession) {
        try {
            const sessionData = JSON.parse(adminSession);
            const sessionTimeout = 30 * 60 * 1000;
            const now = Date.now();
            shouldBeAuthenticated = (now - sessionData.timestamp < sessionTimeout);
        } catch (error) {
            shouldBeAuthenticated = false;
        }
    }
    
    const adminSection1 = document.getElementById('adminOnlySection');
    const adminSection2 = document.getElementById('adminOnlySection2');
    const loginBtn = document.getElementById('adminPanelMenuLink');
    const logoutBtn = document.getElementById('adminPanelLogoutOption');
    
    let needsUpdate = false;
    
    // Verificar si los elementos están en el estado correcto
    if (shouldBeAuthenticated) {
        // Debería estar logueado - verificar que los elementos estén visibles
        if (adminSection1 && adminSection1.classList.contains('d-none')) {
            needsUpdate = true;
        }
        if (adminSection2 && adminSection2.classList.contains('d-none')) {
            needsUpdate = true;
        }
        if (logoutBtn && logoutBtn.classList.contains('d-none')) {
            needsUpdate = true;
        }
        if (loginBtn && !loginBtn.innerHTML.includes('ACTIVO')) {
            needsUpdate = true;
        }
    } else {
        // No debería estar logueado - verificar que los elementos estén ocultos
        if (adminSection1 && !adminSection1.classList.contains('d-none')) {
            needsUpdate = true;
        }
        if (adminSection2 && !adminSection2.classList.contains('d-none')) {
            needsUpdate = true;
        }
        if (logoutBtn && !logoutBtn.classList.contains('d-none')) {
            needsUpdate = true;
        }
        if (loginBtn && loginBtn.innerHTML.includes('ACTIVO')) {
            needsUpdate = true;
        }
    }
    
    if (needsUpdate) {
        console.log('🔄 SINCRONIZANDO ESTADO DE ELEMENTOS CON AUTENTICACIÓN');
        nuclearForceAdminElements();
    }
}, 500);

// Crear override de CSS inteligente
const nuclearCSS = document.createElement('style');
nuclearCSS.innerHTML = `
    /* OVERRIDE INTELIGENTE - ELEMENTOS ADMIN VISIBLES SOLO CUANDO AUTENTICADO */
    #adminOnlySection[data-nuclear-forced="true"],
    #adminOnlySection2[data-nuclear-forced="true"],
    #adminPanelLogoutOption[data-nuclear-forced="true"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    #adminOnlySection[data-nuclear-forced="true"].d-none,
    #adminOnlySection2[data-nuclear-forced="true"].d-none,
    #adminPanelLogoutOption[data-nuclear-forced="true"].d-none {
        display: block !important;
    }
    
    #adminPanelMenuLink[data-nuclear-forced="true"] {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
        color: white !important;
        font-weight: bold !important;
    }
`;
document.head.appendChild(nuclearCSS);

console.log('✅ SISTEMA INTELIGENTE DE ADMIN ACTIVADO');
console.log('🎯 Los elementos se muestran/ocultan según el estado de autenticación');
console.log('🔧 EJECUTAR EN CONSOLA: nuclearForceAdminElements() para forzar actualización');

// Exponer función globalmente 
window.nuclearForceAdminElements = nuclearForceAdminElements;

// Escuchar cambios en localStorage para reaccionar inmediatamente
window.addEventListener('storage', function(e) {
    if (e.key === 'admin_session') {
        console.log('🔄 Detectado cambio en sesión admin - actualizando inmediatamente');
        setTimeout(() => nuclearForceAdminElements(), 100);
    }
});

// Función para configurar listener del botón de logout
function setupLogoutListener() {
    const logoutBtn = document.getElementById('adminPanelLogoutOption');
    if (logoutBtn) {
        const logoutLink = logoutBtn.querySelector('a[onclick*="logoutAdminPanel"]');
        if (logoutLink) {
            // Agregar listener adicional para reaccionar inmediatamente al logout
            logoutLink.addEventListener('click', function() {
                console.log('🚪 Detectado click en logout - actualizando inmediatamente');
                // Esperar un poco a que se ejecute el logout original
                setTimeout(() => {
                    nuclearForceAdminElements();
                    console.log('✅ UI actualizada después de logout');
                }, 200);
            });
            console.log('✅ Listener de logout configurado');
        }
    }
}

// Configurar listener cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupLogoutListener);

// También intentar configurarlo inmediatamente por si el DOM ya está listo
setupLogoutListener();