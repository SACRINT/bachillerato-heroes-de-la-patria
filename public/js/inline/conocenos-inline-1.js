function toggleOrganigramaView(view) {
            const cardsView = document.getElementById('organigramaCards');
            const jerarquicaView = document.getElementById('organigramaJerarquica');
            const cardsBtn = document.getElementById('vistaCards');
            const jerarquicaBtn = document.getElementById('vistaJerarquica');

            if (view === 'cards') {
                cardsView.style.display = 'block';
                jerarquicaView.style.display = 'none';
                cardsBtn.classList.add('active');
                cardsBtn.classList.remove('btn-outline-primary');
                cardsBtn.classList.add('btn-primary');
                jerarquicaBtn.classList.remove('active');
                jerarquicaBtn.classList.add('btn-outline-primary');
                jerarquicaBtn.classList.remove('btn-primary');
            } else {
                cardsView.style.display = 'none';
                jerarquicaView.style.display = 'block';
                jerarquicaBtn.classList.add('active');
                jerarquicaBtn.classList.remove('btn-outline-primary');
                jerarquicaBtn.classList.add('btn-primary');
                cardsBtn.classList.remove('active');
                cardsBtn.classList.add('btn-outline-primary');
                cardsBtn.classList.remove('btn-primary');
            }
        }

        /* COMENTADO - Movido a js/organigrama-popup-fix.js para cumplir CSP
        // Add hover effects and popup functionality
        document.addEventListener('DOMContentLoaded', function() {
            const orgCards = document.querySelectorAll('.org-card');
            const orgPopupOverlay = document.querySelector('.org-popup-overlay');
            let activeOrgPopup = null;
            
            // Add org cards click functionality
            orgCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const personId = card.getAttribute('data-person-id');
                    const infoPopup = document.getElementById(`info-${personId}`);
                    if (infoPopup) {
                        activeOrgPopup = infoPopup;
                        infoPopup.classList.add('active');
                        orgPopupOverlay.classList.add('active');
                    }
                });
                
                // Add hover effects
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-5px)';
                    this.style.transition = 'all 0.3s ease';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
            
            // Close popup buttons
            const closeButtons = document.querySelectorAll('.close-popup-btn');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if (activeOrgPopup) {
                        activeOrgPopup.classList.remove('active');
                        orgPopupOverlay.classList.remove('active');
                        activeOrgPopup = null;
                    }
                });
            });
            
            // Close on overlay click
            if (orgPopupOverlay) {
                orgPopupOverlay.addEventListener('click', () => {
                    if (activeOrgPopup) {
                        activeOrgPopup.classList.remove('active');
                        orgPopupOverlay.classList.remove('active');
                        activeOrgPopup = null;
                    }
                });
            }
            
            // Close on ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && activeOrgPopup) {
                    activeOrgPopup.classList.remove('active');
                    orgPopupOverlay.classList.remove('active');
                    activeOrgPopup = null;
                }
            });
        });
        */ // FIN COMENTARIO - CSP COMPLIANCE

        // Funciones para manejo de video institucional
        function agregarVideo() {
            // Simulación de video con URL de ejemplo
            const videoPlaceholder = document.querySelector('#video-institucional .ratio > div');

            // Crear modal simple para mostrar que la funcionalidad está lista
            const modal = document.createElement('div');
            modal.className = 'modal fade show';
            modal.style.display = 'block';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-video me-2"></i>Video Institucional</h5>
                            <button type="button" class="btn-close btn-close-white" data-action="cerrarModalVideo"></button>
                        </div>
                        <div class="modal-body p-0">
                            <div class="ratio ratio-16x9">
                                <!-- Video institucional local -->
                                <video controls class="w-100 h-100">
                                    <source src="videos/video_institucional.webm" type="video/webm">
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <p class="text-muted mb-0 me-auto">
                                <small><i class="fas fa-graduation-cap me-1"></i>
                                <span data-tenant-field="school_name">Bachillerato General Estatal <span data-tenant-field="school_name">"Héroes de la Patria"</span></span></small>
                            </p>
                            <button type="button" class="btn btn-secondary" data-action="cerrarModalVideo">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        }

        function cerrarModalVideo() {
            const modal = document.querySelector('.modal.show');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        function mostrarFormularioVideo() {
            alert('Esta funcionalidad permitiría al administrador configurar el video institucional real. Por ahora muestra un video de demostración.');
        }

        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', function (event) {
            const modal = document.querySelector('.modal.show');
            if (modal && event.target === modal) {
                cerrarModalVideo();
            }
        });

        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                cerrarModalVideo();
            }
        });
