/**
 * ORGANIGRAMA POPUP FIX - Funcionalidad de popups del organigrama
 *
 * Este archivo contiene todo el JavaScript necesario para el funcionamiento
 * de los popups del organigrama, movido desde conocenos.html para cumplir
 * con Content Security Policy (CSP)
 */

// Variables globales para el organigrama
let activeOrgPopup = null;

// Función principal para inicializar los popups del organigrama
function initOrganigramPopups() {
    

    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupOrganigramaPopups);
    } else {
        setupOrganigramaPopups();
    }
}

// Configurar los popups del organigrama
function setupOrganigramaPopups() {
    const orgCards = document.querySelectorAll('.org-card');
    const orgPopupOverlay = document.querySelector('.org-popup-overlay');

    

    if (orgCards.length === 0) {
        
        setTimeout(setupOrganigramaPopups, 1000); // Reintentar después de 1 segundo
        return;
    }

    // Agregar funcionalidad de click a las tarjetas del organigrama
    orgCards.forEach((card, index) => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const personId = card.getAttribute('data-person-id');
            

            if (!personId) {
                console.error('❌ [ORGANIGRAMA-FIX] Tarjeta sin data-person-id');
                return;
            }

            const infoPopup = document.getElementById(`info-${personId}`);

            if (infoPopup) {
                // Cerrar cualquier popup activo
                if (activeOrgPopup) {
                    activeOrgPopup.classList.remove('active');
                }

                activeOrgPopup = infoPopup;
                infoPopup.classList.add('active');

                if (orgPopupOverlay) {
                    orgPopupOverlay.classList.add('active');
                }

                
            } else {
                console.error(`❌ [ORGANIGRAMA-FIX] No se encontró popup info-${personId}`);
            }
        });

        // Agregar efectos hover
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'all 0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Botones de cerrar popup
    const closeButtons = document.querySelectorAll('.close-popup-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeActivePopup();
        });
    });

    // Cerrar popup al hacer click en overlay
    if (orgPopupOverlay) {
        orgPopupOverlay.addEventListener('click', () => {
            closeActivePopup();
        });
    }

    // Cerrar popup con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeOrgPopup) {
            closeActivePopup();
        }
    });

    
}

// Función para cerrar el popup activo
function closeActivePopup() {
    if (activeOrgPopup) {
        activeOrgPopup.classList.remove('active');
        activeOrgPopup = null;
    }

    const orgPopupOverlay = document.querySelector('.org-popup-overlay');
    if (orgPopupOverlay) {
        orgPopupOverlay.classList.remove('active');
    }

    
}

// Inicializar automáticamente
initOrganigramPopups();

