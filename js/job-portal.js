// Sistema de Bolsa de Trabajo para Bachillerato Héroes de la Patria
class JobPortal {
    constructor() {
        this.jobs = this.loadJobs();
        this.companies = this.getCompanies();
        this.userProfiles = this.loadUserProfiles();
        this.savedJobs = this.loadSavedJobs();
        this.applications = this.loadApplications();
        
        this.initializePortal();
    }

    // Datos de empleos (simulados)
    loadJobs() {
        const storedJobs = localStorage.getItem('job_portal_jobs');
        if (storedJobs) {
            return JSON.parse(storedJobs);
        }

        // Empleos por defecto
        const defaultJobs = [
            {
                id: 'job_001',
                title: 'Asistente Administrativo',
                company: 'Grupo Empresarial Puebla',
                location: 'Puebla Capital',
                category: 'administracion',
                type: 'tiempo_completo',
                salary: '$8,000 - $10,000',
                description: 'Buscamos asistente administrativo para apoyo en tareas generales de oficina, atención telefónica y manejo de documentos.',
                requirements: [
                    'Bachillerato terminado',
                    'Manejo básico de Office',
                    'Excelente comunicación',
                    'Proactivo y responsable'
                ],
                benefits: [
                    'Prestaciones de ley',
                    'Seguro de gastos médicos',
                    'Capacitación continua',
                    'Oportunidad de crecimiento'
                ],
                featured: true,
                postedDate: '2024-09-01',
                expiryDate: '2024-10-01',
                status: 'active'
            },
            {
                id: 'job_002',
                title: 'Vendedor de Mostrador',
                company: 'Ferreterías Hernández',
                location: 'Cholula',
                category: 'ventas',
                type: 'tiempo_completo',
                salary: '$7,500 - $9,500 + comisiones',
                description: 'Se solicita vendedor para atención a clientes, ventas de productos ferreteros y manejo de inventario.',
                requirements: [
                    'Bachillerato concluido',
                    'Experiencia en ventas (deseable)',
                    'Buena actitud de servicio',
                    'Conocimientos básicos de herramientas'
                ],
                benefits: [
                    'Sueldo base + comisiones',
                    'IMSS desde primer día',
                    'Descuentos en productos',
                    'Ambiente laboral positivo'
                ],
                featured: true,
                postedDate: '2024-09-02',
                expiryDate: '2024-09-30',
                status: 'active'
            },
            {
                id: 'job_003',
                title: 'Técnico en Sistemas',
                company: 'TecnoSoluciones',
                location: 'Puebla Capital',
                category: 'tecnologia',
                type: 'tiempo_completo',
                salary: '$12,000 - $15,000',
                description: 'Técnico para soporte en sistemas, mantenimiento de equipos de cómputo y redes básicas.',
                requirements: [
                    'Bachillerato técnico en computación',
                    'Conocimientos en hardware y software',
                    'Experiencia básica en redes',
                    'Capacidad de resolución de problemas'
                ],
                benefits: [
                    'Excelente sueldo',
                    'Prestaciones superiores',
                    'Capacitación técnica',
                    'Herramientas de trabajo'
                ],
                featured: true,
                postedDate: '2024-09-03',
                expiryDate: '2024-10-15',
                status: 'active'
            },
            {
                id: 'job_004',
                title: 'Recepcionista',
                company: 'Hotel Plaza Central',
                location: 'Puebla Capital',
                category: 'turismo',
                type: 'tiempo_completo',
                salary: '$8,500 - $10,000',
                description: 'Se busca recepcionista para hotel, atención a huéspedes, reservaciones y tareas administrativas.',
                requirements: [
                    'Bachillerato terminado',
                    'Inglés básico-intermedio',
                    'Excelente presentación',
                    'Habilidades de comunicación'
                ],
                benefits: [
                    'Prestaciones de ley',
                    'Propinas',
                    'Uniformes incluidos',
                    'Horarios rotativos'
                ],
                featured: false,
                postedDate: '2024-08-28',
                expiryDate: '2024-09-28',
                status: 'active'
            },
            {
                id: 'job_005',
                title: 'Auxiliar de Producción',
                company: 'Manufacturas del Centro',
                location: 'Tlaxcala',
                category: 'manufactura',
                type: 'tiempo_completo',
                salary: '$7,000 - $8,500',
                description: 'Auxiliar para línea de producción, empaque y control de calidad básico.',
                requirements: [
                    'Secundaria o bachillerato',
                    'Disponibilidad de horario',
                    'Trabajo en equipo',
                    'Responsabilidad y puntualidad'
                ],
                benefits: [
                    'Transporte incluido',
                    'Comedor subsidiado',
                    'Bonos de productividad',
                    'Estabilidad laboral'
                ],
                featured: false,
                postedDate: '2024-09-01',
                expiryDate: '2024-10-01',
                status: 'active'
            },
            {
                id: 'job_006',
                title: 'Community Manager Junior',
                company: 'Agencia Digital Creativa',
                location: 'Remoto',
                category: 'tecnologia',
                type: 'medio_tiempo',
                salary: '$6,000 - $8,000',
                description: 'Manejo de redes sociales, creación de contenido y atención a clientes digitales.',
                requirements: [
                    'Bachillerato concluido',
                    'Conocimiento de redes sociales',
                    'Creatividad y redacción',
                    'Manejo básico de Photoshop'
                ],
                benefits: [
                    'Trabajo remoto',
                    'Horario flexible',
                    'Capacitación en marketing digital',
                    'Crecimiento profesional'
                ],
                featured: true,
                postedDate: '2024-09-04',
                expiryDate: '2024-10-04',
                status: 'active'
            }
        ];

        this.saveJobs(defaultJobs);
        return defaultJobs;
    }

    getCompanies() {
        return [
            {
                id: 'comp_001',
                name: 'Grupo Empresarial Puebla',
                logo: 'images/companies/gep-logo.png',
                industry: 'Servicios Empresariales',
                size: 'Grande (500+ empleados)'
            },
            {
                id: 'comp_002', 
                name: 'Ferreterías Hernández',
                logo: 'images/companies/ferreteria-logo.png',
                industry: 'Comercio',
                size: 'Mediana (50-200 empleados)'
            },
            {
                id: 'comp_003',
                name: 'TecnoSoluciones',
                logo: 'images/companies/tecno-logo.png',
                industry: 'Tecnología',
                size: 'Pequeña (10-50 empleados)'
            },
            {
                id: 'comp_004',
                name: 'Hotel Plaza Central',
                logo: 'images/companies/hotel-logo.png',
                industry: 'Hotelería',
                size: 'Mediana (100-300 empleados)'
            },
            {
                id: 'comp_005',
                name: 'Manufacturas del Centro',
                logo: 'images/companies/manufactura-logo.png',
                industry: 'Manufactura',
                size: 'Grande (1000+ empleados)'
            },
            {
                id: 'comp_006',
                name: 'Agencia Digital Creativa',
                logo: 'images/companies/digital-logo.png',
                industry: 'Marketing Digital',
                size: 'Pequeña (5-20 empleados)'
            }
        ];
    }

    saveJobs(jobs) {
        localStorage.setItem('job_portal_jobs', JSON.stringify(jobs));
    }

    loadUserProfiles() {
        const stored = localStorage.getItem('job_portal_profiles');
        return stored ? JSON.parse(stored) : [];
    }

    saveUserProfiles() {
        localStorage.setItem('job_portal_profiles', JSON.stringify(this.userProfiles));
    }

    loadSavedJobs() {
        const stored = localStorage.getItem('job_portal_saved');
        return stored ? JSON.parse(stored) : [];
    }

    saveSavedJobs() {
        localStorage.setItem('job_portal_saved', JSON.stringify(this.savedJobs));
    }

    loadApplications() {
        const stored = localStorage.getItem('job_portal_applications');
        return stored ? JSON.parse(stored) : [];
    }

    saveApplications() {
        localStorage.setItem('job_portal_applications', JSON.stringify(this.applications));
    }

    initializePortal() {
        this.renderFeaturedJobs();
        this.renderCompanies();
        this.updateStatistics();
        this.setupEventListeners();
        this.populateGraduationYears();
    }

    renderFeaturedJobs() {
        const container = document.getElementById('featuredJobsContainer');
        if (!container) return;

        const featuredJobs = this.jobs.filter(job => job.featured && job.status === 'active').slice(0, 6);
        
        if (featuredJobs.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No hay empleos destacados disponibles</div>';
            return;
        }

        const html = featuredJobs.map(job => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card job-card border-0 shadow-sm h-100" data-job-id="${job.id}">
                    <div class="card-header bg-white border-0 d-flex justify-content-between align-items-start">
                        <div class="job-badge">
                            <span class="badge bg-${this.getCategoryColor(job.category)} mb-1">${this.getCategoryName(job.category)}</span>
                            ${job.type === 'tiempo_completo' ? '<span class="badge bg-success">Tiempo Completo</span>' : '<span class="badge bg-info">Medio Tiempo</span>'}
                        </div>
                        <button class="btn btn-sm btn-outline-warning save-job-btn" data-job-id="${job.id}" title="Guardar empleo">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title text-primary mb-2">${job.title}</h5>
                        <p class="card-text company-name mb-1">
                            <i class="fas fa-building text-muted me-2"></i>
                            ${job.company}
                        </p>
                        <p class="card-text location mb-2">
                            <i class="fas fa-map-marker-alt text-muted me-2"></i>
                            ${job.location}
                        </p>
                        <p class="card-text salary mb-3">
                            <i class="fas fa-dollar-sign text-success me-2"></i>
                            ${job.salary}
                        </p>
                        <p class="card-text description text-muted">${job.description.substring(0, 120)}...</p>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${this.formatDate(job.postedDate)}
                            </small>
                            <button class="btn btn-primary btn-sm view-job-btn" data-job-id="${job.id}">
                                Ver Detalles
                                <i class="fas fa-arrow-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderCompanies() {
        const container = document.getElementById('companiesContainer');
        if (!container) return;

        const html = this.companies.map(company => `
            <div class="col-lg-2 col-md-3 col-sm-4 col-6 text-center mb-4">
                <div class="company-logo-container p-3 bg-white rounded shadow-sm">
                    <div class="company-logo bg-light rounded p-3 mb-2" style="height: 80px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-building fa-2x text-muted"></i>
                    </div>
                    <h6 class="company-name small mb-0">${company.name}</h6>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateStatistics() {
        const activeJobs = this.jobs.filter(job => job.status === 'active').length;
        const totalCompanies = this.companies.length;
        const totalApplications = this.applications.length;
        const successfulHires = Math.floor(totalApplications * 0.3); // 30% success rate simulation

        this.animateCounter('totalJobs', activeJobs);
        this.animateCounter('totalCompanies', totalCompanies);
        this.animateCounter('totalApplications', totalApplications);
        this.animateCounter('successfulHires', successfulHires);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = Math.ceil(targetValue / 30);
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = currentValue;
        }, 50);
    }

    populateGraduationYears() {
        const select = document.getElementById('graduationYear');
        if (!select) return;

        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 10; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }

    setupEventListeners() {
        // Búsqueda de empleos
        const searchForm = document.getElementById('jobSearchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performJobSearch();
            });
        }

        // Ver detalles de empleo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-job-btn') || e.target.closest('.view-job-btn')) {
                const jobId = e.target.dataset.jobId || e.target.closest('.view-job-btn').dataset.jobId;
                this.showJobDetails(jobId);
            }
        });

        // Guardar empleo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-job-btn') || e.target.closest('.save-job-btn')) {
                const button = e.target.classList.contains('save-job-btn') ? e.target : e.target.closest('.save-job-btn');
                const jobId = button.dataset.jobId;
                this.toggleSaveJob(jobId, button);
            }
        });

        // Subir CV
        const cvForm = document.getElementById('cvUploadForm');
        if (cvForm) {
            cvForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processCVUpload();
            });
        }

        // Botones de acción rápida
        const applyJobBtn = document.getElementById('applyJobBtn');
        const saveJobBtn = document.getElementById('saveJobBtn');
        
        if (applyJobBtn) {
            applyJobBtn.addEventListener('click', () => {
                this.applyToCurrentJob();
            });
        }

        if (saveJobBtn) {
            saveJobBtn.addEventListener('click', () => {
                this.saveCurrentJob();
            });
        }
    }

    performJobSearch() {
        const keywords = document.getElementById('searchKeywords').value.toLowerCase();
        const category = document.getElementById('jobCategory').value;
        const location = document.getElementById('jobLocation').value;

        let filteredJobs = this.jobs.filter(job => job.status === 'active');

        if (keywords) {
            filteredJobs = filteredJobs.filter(job => 
                job.title.toLowerCase().includes(keywords) ||
                job.description.toLowerCase().includes(keywords) ||
                job.company.toLowerCase().includes(keywords)
            );
        }

        if (category) {
            filteredJobs = filteredJobs.filter(job => job.category === category);
        }

        if (location) {
            filteredJobs = filteredJobs.filter(job => 
                job.location.toLowerCase().includes(location.toLowerCase())
            );
        }

        this.displaySearchResults(filteredJobs);
    }

    displaySearchResults(jobs) {
        const container = document.getElementById('featuredJobsContainer');
        if (!container) return;

        if (jobs.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No se encontraron empleos que coincidan con tu búsqueda. 
                        <a href="#" onclick="jobPortal.renderFeaturedJobs()" class="alert-link">Ver todos los empleos</a>
                    </div>
                </div>
            `;
            return;
        }

        const html = jobs.map(job => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card job-card border-0 shadow-sm h-100" data-job-id="${job.id}">
                    <div class="card-header bg-white border-0 d-flex justify-content-between align-items-start">
                        <div class="job-badge">
                            <span class="badge bg-${this.getCategoryColor(job.category)} mb-1">${this.getCategoryName(job.category)}</span>
                            ${job.type === 'tiempo_completo' ? '<span class="badge bg-success">Tiempo Completo</span>' : '<span class="badge bg-info">Medio Tiempo</span>'}
                        </div>
                        <button class="btn btn-sm btn-outline-warning save-job-btn" data-job-id="${job.id}" title="Guardar empleo">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title text-primary mb-2">${job.title}</h5>
                        <p class="card-text company-name mb-1">
                            <i class="fas fa-building text-muted me-2"></i>
                            ${job.company}
                        </p>
                        <p class="card-text location mb-2">
                            <i class="fas fa-map-marker-alt text-muted me-2"></i>
                            ${job.location}
                        </p>
                        <p class="card-text salary mb-3">
                            <i class="fas fa-dollar-sign text-success me-2"></i>
                            ${job.salary}
                        </p>
                        <p class="card-text description text-muted">${job.description.substring(0, 120)}...</p>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${this.formatDate(job.postedDate)}
                            </small>
                            <button class="btn btn-primary btn-sm view-job-btn" data-job-id="${job.id}">
                                Ver Detalles
                                <i class="fas fa-arrow-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    showJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        this.currentJobId = jobId;
        
        const content = `
            <div class="job-detail-content">
                <div class="job-header mb-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h4 class="text-primary mb-1">${job.title}</h4>
                            <p class="text-muted mb-0">
                                <i class="fas fa-building me-2"></i>${job.company} • 
                                <i class="fas fa-map-marker-alt me-2"></i>${job.location}
                            </p>
                        </div>
                        <div class="job-badges text-end">
                            <span class="badge bg-${this.getCategoryColor(job.category)} mb-1">${this.getCategoryName(job.category)}</span><br>
                            <span class="badge bg-${job.type === 'tiempo_completo' ? 'success' : 'info'}">${job.type === 'tiempo_completo' ? 'Tiempo Completo' : 'Medio Tiempo'}</span>
                        </div>
                    </div>
                    <div class="salary-info">
                        <h5 class="text-success">
                            <i class="fas fa-dollar-sign me-2"></i>
                            ${job.salary}
                        </h5>
                    </div>
                </div>

                <div class="job-section mb-4">
                    <h6 class="section-title">Descripción del Puesto</h6>
                    <p>${job.description}</p>
                </div>

                <div class="job-section mb-4">
                    <h6 class="section-title">Requisitos</h6>
                    <ul class="requirements-list">
                        ${job.requirements.map(req => `<li><i class="fas fa-check text-success me-2"></i>${req}</li>`).join('')}
                    </ul>
                </div>

                <div class="job-section mb-4">
                    <h6 class="section-title">Beneficios</h6>
                    <ul class="benefits-list">
                        ${job.benefits.map(benefit => `<li><i class="fas fa-star text-warning me-2"></i>${benefit}</li>`).join('')}
                    </ul>
                </div>

                <div class="job-footer">
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">
                                <strong>Publicado:</strong> ${this.formatDate(job.postedDate)}
                            </small>
                        </div>
                        <div class="col-6 text-end">
                            <small class="text-muted">
                                <strong>Expira:</strong> ${this.formatDate(job.expiryDate)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('jobDetailContent').innerHTML = content;
        
        const modal = new bootstrap.Modal(document.getElementById('jobDetailModal'));
        modal.show();
    }

    toggleSaveJob(jobId, button) {
        const index = this.savedJobs.indexOf(jobId);
        
        if (index === -1) {
            this.savedJobs.push(jobId);
            button.innerHTML = '<i class="fas fa-bookmark text-warning"></i>';
            button.classList.remove('btn-outline-warning');
            button.classList.add('btn-warning');
            this.showAlert('Empleo guardado exitosamente', 'success');
        } else {
            this.savedJobs.splice(index, 1);
            button.innerHTML = '<i class="fas fa-bookmark"></i>';
            button.classList.remove('btn-warning');
            button.classList.add('btn-outline-warning');
            this.showAlert('Empleo eliminado de guardados', 'info');
        }
        
        this.saveSavedJobs();
    }

    saveCurrentJob() {
        if (this.currentJobId) {
            const button = document.getElementById('saveJobBtn');
            this.toggleSaveJob(this.currentJobId, button);
        }
    }

    applyToCurrentJob() {
        if (!this.currentJobId) return;

        const job = this.jobs.find(j => j.id === this.currentJobId);
        if (!job) return;

        // Verificar si ya se postuló
        const existingApplication = this.applications.find(app => app.jobId === this.currentJobId);
        if (existingApplication) {
            this.showAlert('Ya te has postulado a este empleo anteriormente', 'warning');
            return;
        }

        // Crear nueva postulación
        const application = {
            id: this.generateId(),
            jobId: this.currentJobId,
            jobTitle: job.title,
            company: job.company,
            applicationDate: new Date().toISOString(),
            status: 'pending'
        };

        this.applications.push(application);
        this.saveApplications();

        this.showAlert('¡Postulación enviada exitosamente! Te contactarán pronto.', 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('jobDetailModal'));
        modal.hide();
    }

    processCVUpload() {
        const form = document.getElementById('cvUploadForm');
        const formData = new FormData(form);

        const profile = {
            id: this.generateId(),
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            graduationYear: formData.get('graduationYear'),
            professionalSummary: formData.get('professionalSummary'),
            skills: formData.get('skills'),
            createdAt: new Date().toISOString()
        };

        // Validación básica
        if (!profile.fullName || !profile.email || !profile.phone) {
            this.showAlert('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        this.userProfiles.push(profile);
        this.saveUserProfiles();

        this.showAlert('Perfil profesional creado exitosamente', 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadCVModal'));
        modal.hide();
        
        // Limpiar formulario
        form.reset();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getCategoryColor(category) {
        const colors = {
            'ventas': 'primary',
            'administracion': 'success', 
            'tecnologia': 'info',
            'servicio': 'warning',
            'manufactura': 'secondary',
            'salud': 'danger',
            'educacion': 'dark',
            'turismo': 'light'
        };
        return colors[category] || 'secondary';
    }

    getCategoryName(category) {
        const names = {
            'ventas': 'Ventas',
            'administracion': 'Administración',
            'tecnologia': 'Tecnología',
            'servicio': 'Servicio al Cliente',
            'manufactura': 'Manufactura',
            'salud': 'Salud',
            'educacion': 'Educación',
            'turismo': 'Turismo'
        };
        return names[category] || 'General';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Funciones globales para botones de acción rápida
function showUploadCV() {
    const modal = new bootstrap.Modal(document.getElementById('uploadCVModal'));
    modal.show();
}

function showSavedJobs() {
    if (!window.jobPortal || window.jobPortal.savedJobs.length === 0) {
        jobPortal.showAlert('No tienes empleos guardados', 'info');
        return;
    }
    
    const savedJobs = window.jobPortal.jobs.filter(job => 
        window.jobPortal.savedJobs.includes(job.id)
    );
    
    window.jobPortal.displaySearchResults(savedJobs);
    
    // Scroll to results
    document.getElementById('featuredJobsContainer').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function showApplications() {
    if (!window.jobPortal || window.jobPortal.applications.length === 0) {
        jobPortal.showAlert('No tienes postulaciones registradas', 'info');
        return;
    }
    
    // Mostrar modal con postulaciones
    const applicationsHTML = window.jobPortal.applications.map(app => `
        <div class="application-item border-bottom py-3">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${app.jobTitle}</h6>
                    <p class="text-muted small mb-1">${app.company}</p>
                    <small class="text-muted">Postulado: ${jobPortal.formatDate(app.applicationDate)}</small>
                </div>
                <span class="badge bg-warning">Pendiente</span>
            </div>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Mis Postulaciones</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${applicationsHTML}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

function showCareerTips() {
    const tipsModal = document.createElement('div');
    tipsModal.className = 'modal fade';
    tipsModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-lightbulb me-2"></i>
                        Consejos para el Éxito Laboral
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="accordion" id="tipsAccordion">
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="tip1">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1">
                                    <i class="fas fa-search me-2"></i>Búsqueda Efectiva de Empleo
                                </button>
                            </h2>
                            <div id="collapse1" class="accordion-collapse collapse show" data-bs-parent="#tipsAccordion">
                                <div class="accordion-body">
                                    <ul>
                                        <li>Define claramente tus objetivos profesionales</li>
                                        <li>Personaliza tu CV para cada aplicación</li>
                                        <li>Utiliza palabras clave relevantes</li>
                                        <li>Mantén una presencia profesional en redes sociales</li>
                                        <li>Networking: cultiva relaciones profesionales</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="tip2">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2">
                                    <i class="fas fa-handshake me-2"></i>Preparación para Entrevistas
                                </button>
                            </h2>
                            <div id="collapse2" class="accordion-collapse collapse" data-bs-parent="#tipsAccordion">
                                <div class="accordion-body">
                                    <ul>
                                        <li>Investiga a fondo sobre la empresa</li>
                                        <li>Practica respuestas a preguntas comunes</li>
                                        <li>Prepara preguntas inteligentes para hacer</li>
                                        <li>Viste apropiadamente para la cultura de la empresa</li>
                                        <li>Llega 10-15 minutos antes</li>
                                        <li>Trae copias adicionales de tu CV</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="tip3">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3">
                                    <i class="fas fa-chart-line me-2"></i>Desarrollo Profesional Continuo
                                </button>
                            </h2>
                            <div id="collapse3" class="accordion-collapse collapse" data-bs-parent="#tipsAccordion">
                                <div class="accordion-body">
                                    <ul>
                                        <li>Invierte en educación continua</li>
                                        <li>Obtén certificaciones relevantes</li>
                                        <li>Desarrolla habilidades blandas</li>
                                        <li>Busca mentorías y coaching</li>
                                        <li>Mantente actualizado en tu industria</li>
                                        <li>Establece metas de carrera claras</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(tipsModal);
    const modal = new bootstrap.Modal(tipsModal);
    modal.show();
    
    tipsModal.addEventListener('hidden.bs.modal', () => tipsModal.remove());
}

function showAllJobs() {
    if (window.jobPortal) {
        const allJobs = window.jobPortal.jobs.filter(job => job.status === 'active');
        window.jobPortal.displaySearchResults(allJobs);
        
        // Scroll to results
        document.getElementById('featuredJobsContainer').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

// Estilos adicionales
const jobPortalStyles = `
<style>
.job-card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.job-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0.75rem 1.5rem rgba(0,0,0,0.1)!important;
}

.company-logo-container {
    transition: all 0.3s ease;
}

.company-logo-container:hover {
    transform: scale(1.05);
}

.stat-card {
    padding: 2rem 1rem;
}

.job-detail-content .section-title {
    color: #1976d2;
    border-bottom: 2px solid #1976d2;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
}

.requirements-list, .benefits-list {
    list-style: none;
    padding-left: 0;
}

.requirements-list li, .benefits-list li {
    padding: 0.5rem 0;
}

.application-item:last-child {
    border-bottom: none !important;
}

@media (max-width: 768px) {
    .job-card .card-header {
        flex-direction: column;
        align-items: stretch;
    }
    
    .job-badge {
        margin-bottom: 1rem;
    }
    
    .stat-card {
        padding: 1rem 0.5rem;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', jobPortalStyles);

// Inicializar el portal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('featuredJobsContainer')) {
        window.jobPortal = new JobPortal();
    }
});