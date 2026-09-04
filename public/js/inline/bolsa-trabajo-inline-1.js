// Estado de la aplicación de empleos
        const jobApplicationState = {
            jobs: [
                { id: 1, title: 'Auxiliar Administrativo', company: 'Empresa ABC', location: 'Puebla', type: 'Tiempo Completo', salary: '$8,000 - $10,000', posted: '2025-01-08' },
                { id: 2, title: 'Recepcionista', company: 'Hotel Plaza', location: 'Puebla Centro', type: 'Medio Tiempo', salary: '$6,000 - $7,000', posted: '2025-01-07' },
                { id: 3, title: 'Vendedor', company: 'Tienda XYZ', location: 'Centro Comercial', type: 'Tiempo Completo', salary: '$7,500 + Comisiones', posted: '2025-01-06' },
                { id: 4, title: 'Auxiliar de Sistemas', company: 'TechSoft SA', location: 'Zona Industrial', type: 'Tiempo Completo', salary: '$9,000 - $12,000', posted: '2025-01-05' }
            ],
            savedJobs: JSON.parse(localStorage.getItem('savedJobs') || '[]'),
            applications: JSON.parse(localStorage.getItem('applications') || '[]')
        };

        // ✅ NOTA: showUploadCV() ELIMINADA
        // El modal se abre con Bootstrap: data-bs-toggle="modal" data-bs-target="#uploadCVModal"
        // El formulario se envía automáticamente con professional-forms.js

        function showUploadCV() {
            // Abrir modal de Bootstrap directamente
            const modal = new bootstrap.Modal(document.getElementById('uploadCVModal'));
            modal.show();
        }

        function showSavedJobs() {
            if (jobApplicationState.savedJobs.length === 0) {
                showJobAlert('No tienes trabajos guardados aún. Explora las ofertas disponibles y guarda las que te interesen.', 'info');
                return;
            }

            const savedJobsHtml = jobApplicationState.savedJobs.map(jobId => {
                const job = jobApplicationState.jobs.find(j => j.id === jobId);

                return job ? ` <div class="card mb-3" > <div class="card-body" > <h5 class="card-title" >$ {
                        job.title
                    }

                    </h5> <p class="card-text" > <strong>$ {
                        job.company
                    }

                    </strong> - $ {
                        job.location
                    }

                    <br> <span class="badge bg-primary" >$ {
                        job.type
                    }

                    </span> <span class="badge bg-success" >$ {
                        job.salary
                    }

                    </span> </p> <button class="btn btn-outline-primary btn-sm" data-action="apply-to-job" data-param-1="${job.id}" > <i class="fas fa-paper-plane me-1" ></i>Aplicar </button> <button class="btn btn-outline-danger btn-sm" data-action="remove-from-saved" data-param-1="${job.id}" > <i class="fas fa-trash me-1" ></i>Eliminar </button> </div> </div> ` : '';
            }).join('');

            showJobModal('Trabajos Guardados', savedJobsHtml);
        }

        function searchJobs() {
            const searchTerm = document.getElementById('searchKeywords')?.value.toLowerCase() || '';
            const location = document.getElementById('jobLocation')?.value.toLowerCase() || '';
            const category = document.getElementById('jobCategory')?.value || '';

            let filteredJobs = jobApplicationState.jobs;

            if (searchTerm) {
                filteredJobs = filteredJobs.filter(job => job.title.toLowerCase().includes(searchTerm) || job.company.toLowerCase().includes(searchTerm));
            }

            if (location && location !== '') {
                filteredJobs = filteredJobs.filter(job => job.location.toLowerCase().includes(location));
            }

            displayJobResults(filteredJobs);
        }

        function displayJobResults(jobs) {
            const resultsContainer = document.getElementById('featuredJobsContainer');
            if (!resultsContainer) return;

            if (jobs.length === 0) {
                resultsContainer.innerHTML = ` <div class="col-12"><div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No se encontraron empleos con esos criterios. Intenta con otros términos de búsqueda. </div></div>`;
                return;
            }

            const jobsHtml = jobs.map(job => ` <div class="col-md-6 col-lg-4 mb-4" > <div class="card h-100 shadow-sm" > <div class="card-body" > <h5 class="card-title" >$ {
                    job.title
                }

                </h5> <h6 class="card-subtitle mb-2 text-muted" >$ {
                    job.company
                }

                </h6> <p class="card-text" > <i class="fas fa-map-marker-alt me-1 text-primary" ></i>$ {
                    job.location
                }

                <br> <span class="badge bg-primary mt-2" >$ {
                    job.type
                }

                </span> <span class="badge bg-success mt-2" >$ {
                    job.salary
                }

                </span> </p> <small class="text-muted d-block mb-3" >Publicado: $ {
                    job.posted
                }

                </small> <div class="d-flex gap-2" > <button class="btn btn-sm btn-outline-secondary" data-action="save-job" data-param-1="${job.id}" > <i class="fas fa-bookmark" ></i> </button> <button class="btn btn-sm btn-primary flex-grow-1" data-action="show-upload-c-v" > <i class="fas fa-paper-plane me-1" ></i>Aplicar </button> </div> </div> </div> </div> `).join('');

            resultsContainer.innerHTML = jobsHtml;
        }

        function saveJob(jobId) {
            if (!jobApplicationState.savedJobs.includes(jobId)) {
                jobApplicationState.savedJobs.push(jobId);
                localStorage.setItem('savedJobs', JSON.stringify(jobApplicationState.savedJobs));
                showJobAlert('Trabajo guardado exitosamente.', 'success');
            }

            else {
                showJobAlert('Este trabajo ya está guardado.', 'info');
            }
        }

        function removeFromSaved(jobId) {
            jobApplicationState.savedJobs = jobApplicationState.savedJobs.filter(id => id !== jobId);
            localStorage.setItem('savedJobs', JSON.stringify(jobApplicationState.savedJobs));
            showJobAlert('Trabajo eliminado de guardados.', 'info');
            showSavedJobs();
        }

        function applyToJob(jobId) {
            const job = jobApplicationState.jobs.find(j => j.id === jobId);
            showUploadCV(); // Abrir formulario de CV
            showJobAlert(`Para aplicar a "${job.title}", completa el formulario de CV.`, 'info');
        }

        function showAllJobs() {
            displayJobResults(jobApplicationState.jobs);
        }

        function showCareerTips() {
            const content = ` <div class="row"><div class="col-12"><h5 class="text-primary mb-3">Consejos para el Éxito Laboral</h5><ul class="list-group"><li class="list-group-item"><i class="fas fa-check text-success me-2"></i>Mantén tu CV actualizado y profesional</li><li class="list-group-item"><i class="fas fa-check text-success me-2"></i>Investiga sobre la empresa antes de aplicar</li><li class="list-group-item"><i class="fas fa-check text-success me-2"></i>Personaliza tu carta de presentación</li><li class="list-group-item"><i class="fas fa-check text-success me-2"></i>Prepara respuestas para preguntas comunes</li><li class="list-group-item"><i class="fas fa-check text-success me-2"></i>Sé puntual y viste apropiadamente</li></ul></div></div>`;
            showJobModal('Consejos Profesionales', content);
        }

        function showApplications() {
            if (jobApplicationState.applications.length === 0) {
                showJobAlert('No tienes postulaciones registradas aún.', 'info');
                return;
            }

            const content = `<p>Tienes $ {
                jobApplicationState.applications.length
            }

            postulaciones enviadas.</p>`;
            showJobModal('Mis Postulaciones', content);
        }

        function showJobModal(title, content) {
            const modalId = 'jobInfoModal_' + Date.now();

            const modalHtml = ` <div class="modal fade" id="${modalId}" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">$ {
                title
            }

            </h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body">$ {
                content
            }

            </div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div></div></div></div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();

            document.getElementById(modalId).addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
        }

        function showJobAlert(message, type) {
            const alertDiv = document.createElement('div');

            alertDiv.className = `alert alert-$ {
                type
            }

            alert-dismissible fade show position-fixed`;
            alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; max-width: 400px;';

            alertDiv.innerHTML = ` $ {
                message
            }

            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;
            document.body.appendChild(alertDiv);

            setTimeout(() => {
                if (alertDiv.parentNode) alertDiv.remove();
            }

                , 5000);
        }

        // Inicializar al cargar página
        document.addEventListener('DOMContentLoaded', function () {
            displayJobResults(jobApplicationState.jobs);

            // Event listener para formulario de búsqueda
            const searchForm = document.getElementById('jobSearchForm');

            if (searchForm) {
                searchForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    searchJobs();
                });
            }
        });

        document.addEventListener('DOMContentLoaded', function () {
            if (typeof window.applyUnifiedTheme === 'function' || typeof window.setUnifiedTheme === 'function') {
                return;
            }

            const darkModeToggle = document.getElementById('darkModeToggle');
            const body = document.body;

            if (localStorage.getItem('darkMode') === 'enabled') {
                body.classList.add('dark-mode');
                updateDarkModeIcon(true);
            }

            darkModeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                body.classList.toggle('dark-mode');

                if (body.classList.contains('dark-mode')) {
                    localStorage.setItem('darkMode', 'enabled');
                    updateDarkModeIcon(true);
                } else {
                    localStorage.setItem('darkMode', 'disabled');
                    updateDarkModeIcon(false);
                }
            });

            function updateDarkModeIcon(isDark) {
                if (darkModeToggle) {
                    let icon = darkModeToggle.querySelector('i');
                    if (icon) {
                        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                    }
                }
            }
        });
