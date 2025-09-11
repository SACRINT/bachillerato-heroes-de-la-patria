/**
 * SISTEMA SIMPLE DE DETECCIÓN DE ICONOS
 * Solo detecta y reporta problemas - no los arregla automáticamente
 */

// Función simple para detectar Font Awesome
function checkFontAwesome() {
    // Esperar 2 segundos para que Font Awesome se cargue
    setTimeout(() => {
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-star';
        testIcon.style.position = 'absolute';
        testIcon.style.left = '-9999px';
        testIcon.style.fontSize = '16px';
        
        document.body.appendChild(testIcon);
        
        const computedStyle = window.getComputedStyle(testIcon, '::before');
        const content = computedStyle.getPropertyValue('content');
        const fontFamily = computedStyle.getPropertyValue('font-family');
        
        const isLoaded = content && content !== 'none' && content !== '"\\f005"' && 
                        fontFamily.includes('Font Awesome');
        
        if (!isLoaded) {
            console.warn('⚠️ Font Awesome no se cargó correctamente');
            // Opcional: Mostrar notificación discreta al admin
            if (window.location.pathname.includes('admin-dashboard')) {
                showAdminNotification('Font Awesome no se cargó. Algunos iconos pueden no aparecer.');
            }
        } else {
            console.log('✅ Font Awesome funcionando correctamente');
        }
        
        document.body.removeChild(testIcon);
    }, 2000);
}

// Función opcional para mostrar notificación a admin
function showAdminNotification(message) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ff9800; color: white; 
                    padding: 10px 15px; border-radius: 5px; z-index: 9999; font-size: 14px;">
            <strong>Aviso Técnico:</strong> ${message}
            <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; 
                    border: none; color: white; cursor: pointer; font-weight: bold;">&times;</button>
        </div>
    `;
    document.body.appendChild(notification.firstElementChild);
    
    // Auto-remover después de 10 segundos
    setTimeout(() => {
        if (notification.firstElementChild) {
            notification.firstElementChild.remove();
        }
    }, 10000);
}

// Inicializar cuando la página carga
document.addEventListener('DOMContentLoaded', checkFontAwesome);