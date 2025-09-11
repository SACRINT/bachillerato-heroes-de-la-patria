/**
 * Manejo de Submenús Anidados - Versión Simplificada
 * CSS maneja desktop (hover), JS maneja móvil (click)
 */

(function() {
    'use strict';
    
    function initNestedDropdowns() {
        const dropdownSubmenus = document.querySelectorAll('.dropdown-submenu');
        
        console.log('Inicializando submenús:', dropdownSubmenus.length);
        
        dropdownSubmenus.forEach(function(submenuItem) {
            const dropdownToggle = submenuItem.querySelector('.dropdown-toggle');
            
            if (dropdownToggle) {
                // Solo manejar click en móvil
                dropdownToggle.addEventListener('click', function(e) {
                    if (window.innerWidth <= 991) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Toggle clase 'open' para móvil
                        const isOpen = submenuItem.classList.contains('open');
                        
                        // Cerrar otros submenús
                        document.querySelectorAll('.dropdown-submenu.open').forEach(function(openSubmenu) {
                            if (openSubmenu !== submenuItem) {
                                openSubmenu.classList.remove('open');
                            }
                        });
                        
                        // Toggle este submenú
                        submenuItem.classList.toggle('open', !isOpen);
                    }
                    // En desktop, permitir navegación si tiene URL
                    else if (this.href && this.href !== '#' && !this.href.endsWith('#')) {
                        return true; // Permitir navegación
                    }
                });
            }
        });
        
        // Cerrar submenús al cerrar dropdown principal
        document.querySelectorAll('.nav-item.dropdown').forEach(function(dropdown) {
            dropdown.addEventListener('hidden.bs.dropdown', function() {
                this.querySelectorAll('.dropdown-submenu.open').forEach(function(submenu) {
                    submenu.classList.remove('open');
                });
            });
        });
    }
    
    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNestedDropdowns);
    } else {
        initNestedDropdowns();
    }
    
})();