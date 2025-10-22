// SOLUCIÓN DEFINITIVA - FUERZA BRUTA TOTAL
console.log('🔥 INICIANDO SOLUCIÓN DE FUERZA BRUTA...');

// Función que se ejecuta cada 100ms para mantener elementos visibles
function forceElementsVisible() {
    const adminElements = document.querySelectorAll('#adminOnlySection, #adminOnlySection2');
    const loginBtn = document.getElementById('adminPanelMenuLink');
    const logoutBtn = document.getElementById('adminPanelLogoutOption');
    
    let changed = false;
    
    adminElements.forEach((el) => {
        if (el && el.classList.contains('d-none')) {
            el.classList.remove('d-none');
            el.style.display = 'block !important';
            el.style.visibility = 'visible !important';
            el.setAttribute('data-admin-forced', 'true');
            changed = true;
        }
    });
    
    if (loginBtn && !loginBtn.innerHTML.includes('Panel Admin')) {
        loginBtn.innerHTML = '<i class="fas fa-user-shield me-1"></i>Panel Admin <span class="badge bg-success ms-1">✓</span>';
        loginBtn.style.color = 'green';
        changed = true;
    }
    
    if (logoutBtn && logoutBtn.classList.contains('d-none')) {
        logoutBtn.classList.remove('d-none');
        logoutBtn.style.display = 'block !important';
        changed = true;
    }
    
    if (changed) {
        console.log('🔥 ELEMENTOS FORZADOS A SER VISIBLES');
    }
}

// Ejecutar cada 100ms
setInterval(forceElementsVisible, 100);

// Ejecutar inmediatamente
forceElementsVisible();

console.log('🔥 SISTEMA DE FUERZA BRUTA ACTIVADO - ELEMENTOS SE MANTENDRÁN VISIBLES');