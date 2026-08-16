function showPhotoGallery() {
            // Crear modal dinámico para galería de fotos
            const photos = [
                    {src: 'images/galeria/evento1.jpeg', title: 'Festival Cultural 2024', desc: 'Presentaciones artísticas de nuestros estudiantes' },
                    {src: 'images/galeria/evento2.jpeg', title: 'Ceremonia de Graduación', desc: 'Generación 2023-2024' },
                    {src: 'images/galeria/evento3.jpeg', title: 'Concurso de Ciencias', desc: 'Proyectos innovadores de nuestros alumnos' },
                    {src: 'images/galeria/evento4.jpeg', title: 'Viaje Estudiantil', desc: 'Reconocimiento a nuestro alumnos' },
                    {src: 'images/galeria/evento5.jpeg', title: 'Torneo Deportivo', desc: 'Competencias inter-grupos' },
                    {src: 'images/galeria/evento6.jpeg', title: 'Desfile del 18 de marzo', desc: 'Representación estudiantil' }
                    ];

                    const galleryHtml = `
                    <div class="row g-3">
                        ${photos.map((photo, index) => `
                        <div class="col-md-6 col-lg-4">
                            <div class="card h-100">
                                <img src="${photo.src}" alt="${photo.title}" class="card-img-top gallery-photo-img" style="height: 200px; object-fit: cover;" data-fallback="images/galeria/placeholder_actividad2.webp">
                                <div class="card-body">
                                    <h6 class="card-title">${photo.title}</h6>
                                    <p class="card-text small text-muted">${photo.desc}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    </div>
                    <div class="mt-3 text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        <small>Las fotografías se están subiendo al servidor. Pronto estarán disponibles para visualización.</small>
                    </div>
                    `;

                    createCommunityModal('Galería de Fotografías', galleryHtml);

            // Agregar manejadores de error después de crear el modal
            setTimeout(() => {
                        document.querySelectorAll('.gallery-photo-img').forEach(img => {
                            img.addEventListener('error', function () {
                                if (this.dataset.fallback && this.src !== this.dataset.fallback) {
                                    this.src = this.dataset.fallback;
                                }
                            });
                        });
            }, 100);
        }

                    function createCommunityModal(title, content) {
            const modalId = 'communityModal' + Date.now();
                    const modalHtml = `
                    <div class="modal fade" id="${modalId}" tabindex="-1">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">
                                        <i class="fas fa-images me-2"></i>${title}
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                                </div>
                                <div class="modal-body">${content}</div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();

            // Limpiar modal cuando se cierre
            document.getElementById(modalId).addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
        }
