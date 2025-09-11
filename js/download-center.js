// Centro de Descargas - BGE Héroes de la Patria
class DownloadCenter {
    constructor() {
        this.documents = this.loadDocuments();
        this.categories = this.getCategories();
        this.downloadStats = this.loadDownloadStats();
        this.requests = this.loadRequests();
        
        this.initializeCenter();
    }

    loadDocuments() {
        // Base de datos de documentos disponibles
        return [
            // DOCUMENTOS ACADÉMICOS
            {
                id: 'calendario-escolar-2024',
                title: 'Calendario Escolar 2024-2025',
                description: 'Calendario oficial del ciclo escolar con fechas importantes, evaluaciones y vacaciones',
                category: 'academic',
                type: 'pdf',
                size: '2.5 MB',
                pages: 12,
                uploadDate: '2024-08-15',
                downloadCount: 2847,
                tags: ['calendario', 'fechas', 'evaluaciones', 'vacaciones'],
                featured: true,
                url: 'documents/calendario-escolar-2024-2025.pdf'
            },
            {
                id: 'plan-estudios-bge',
                title: 'Plan de Estudios Bachillerato General',
                description: 'Plan de estudios completo con materias por semestre y competencias a desarrollar',
                category: 'academic',
                type: 'pdf',
                size: '4.1 MB',
                pages: 28,
                uploadDate: '2024-08-10',
                downloadCount: 1923,
                tags: ['plan', 'estudios', 'materias', 'competencias'],
                featured: true,
                url: 'documents/plan-estudios-bge.pdf'
            },
            {
                id: 'manual-estudiante-2024',
                title: 'Manual del Estudiante 2024-2025',
                description: 'Guía completa para estudiantes con reglamentos, procedimientos y recursos',
                category: 'academic',
                type: 'pdf',
                size: '3.2 MB',
                pages: 45,
                uploadDate: '2024-08-20',
                downloadCount: 1654,
                tags: ['manual', 'estudiante', 'guía', 'procedimientos'],
                featured: true,
                url: 'documents/manual-estudiante-2024.pdf'
            },
            {
                id: 'guia-inscripciones',
                title: 'Guía de Inscripciones y Reinscripciones',
                description: 'Procedimientos paso a paso para procesos de inscripción',
                category: 'academic',
                type: 'pdf',
                size: '1.8 MB',
                pages: 16,
                uploadDate: '2024-07-25',
                downloadCount: 3421,
                tags: ['inscripción', 'reinscripción', 'procedimientos'],
                featured: false,
                url: 'documents/guia-inscripciones.pdf'
            },

            // FORMATOS ADMINISTRATIVOS
            {
                id: 'formato-inscripcion',
                title: 'Formato de Inscripción',
                description: 'Formato oficial para solicitud de inscripción al bachillerato',
                category: 'forms',
                type: 'pdf',
                size: '0.8 MB',
                pages: 4,
                uploadDate: '2024-08-01',
                downloadCount: 4523,
                tags: ['formato', 'inscripción', 'solicitud'],
                featured: true,
                url: 'documents/formato-inscripcion.pdf'
            },
            {
                id: 'formato-beca',
                title: 'Solicitud de Beca',
                description: 'Formato para solicitar becas académicas y de apoyo económico',
                category: 'forms',
                type: 'pdf',
                size: '1.2 MB',
                pages: 6,
                uploadDate: '2024-08-05',
                downloadCount: 2156,
                tags: ['beca', 'solicitud', 'apoyo', 'económico'],
                featured: false,
                url: 'documents/formato-beca.pdf'
            },
            {
                id: 'formato-constancia',
                title: 'Solicitud de Constancias',
                description: 'Formato para solicitar constancias de estudios y documentos oficiales',
                category: 'forms',
                type: 'pdf',
                size: '0.6 MB',
                pages: 2,
                uploadDate: '2024-08-01',
                downloadCount: 3234,
                tags: ['constancia', 'documentos', 'oficiales'],
                featured: true,
                url: 'documents/formato-constancia.pdf'
            },
            {
                id: 'formato-cambio-grupo',
                title: 'Solicitud de Cambio de Grupo',
                description: 'Formato para solicitar cambio de grupo o turno',
                category: 'forms',
                type: 'pdf',
                size: '0.5 MB',
                pages: 2,
                uploadDate: '2024-08-10',
                downloadCount: 856,
                tags: ['cambio', 'grupo', 'turno'],
                featured: false,
                url: 'documents/formato-cambio-grupo.pdf'
            },

            // DOCUMENTOS NORMATIVOS
            {
                id: 'reglamento-escolar',
                title: 'Reglamento Escolar Interno',
                description: 'Reglamento interno del plantel con derechos y obligaciones',
                category: 'regulatory',
                type: 'pdf',
                size: '2.1 MB',
                pages: 32,
                uploadDate: '2024-08-12',
                downloadCount: 1789,
                tags: ['reglamento', 'normas', 'derechos', 'obligaciones'],
                featured: false,
                url: 'documents/reglamento-escolar.pdf'
            },
            {
                id: 'codigo-conducta',
                title: 'Código de Conducta Estudiantil',
                description: 'Normas de comportamiento y convivencia escolar',
                category: 'regulatory',
                type: 'pdf',
                size: '1.4 MB',
                pages: 18,
                uploadDate: '2024-08-08',
                downloadCount: 1243,
                tags: ['código', 'conducta', 'comportamiento', 'convivencia'],
                featured: false,
                url: 'documents/codigo-conducta.pdf'
            },
            {
                id: 'lineamientos-evaluacion',
                title: 'Lineamientos de Evaluación',
                description: 'Criterios y procedimientos para la evaluación académica',
                category: 'regulatory',
                type: 'pdf',
                size: '1.7 MB',
                pages: 24,
                uploadDate: '2024-08-15',
                downloadCount: 987,
                tags: ['evaluación', 'criterios', 'calificaciones'],
                featured: false,
                url: 'documents/lineamientos-evaluacion.pdf'
            },

            // RECURSOS EDUCATIVOS
            {
                id: 'guia-matematicas-i',
                title: 'Guía de Estudio - Matemáticas I',
                description: 'Material de apoyo para la materia de Matemáticas I',
                category: 'educational',
                type: 'pdf',
                size: '5.2 MB',
                pages: 68,
                uploadDate: '2024-09-01',
                downloadCount: 2341,
                tags: ['matemáticas', 'guía', 'estudio', 'primer semestre'],
                featured: true,
                url: 'documents/guia-matematicas-i.pdf'
            },
            {
                id: 'manual-laboratorio-quimica',
                title: 'Manual de Laboratorio de Química',
                description: 'Prácticas y experimentos para la materia de Química',
                category: 'educational',
                type: 'pdf',
                size: '4.8 MB',
                pages: 52,
                uploadDate: '2024-09-05',
                downloadCount: 1876,
                tags: ['química', 'laboratorio', 'prácticas', 'experimentos'],
                featured: false,
                url: 'documents/manual-laboratorio-quimica.pdf'
            },
            {
                id: 'antologia-literatura',
                title: 'Antología de Literatura Universal',
                description: 'Selección de textos literarios para Literatura Universal',
                category: 'educational',
                type: 'pdf',
                size: '6.3 MB',
                pages: 89,
                uploadDate: '2024-08-28',
                downloadCount: 1567,
                tags: ['literatura', 'universal', 'textos', 'antología'],
                featured: false,
                url: 'documents/antologia-literatura.pdf'
            },
            {
                id: 'guia-metodologia-investigacion',
                title: 'Metodología de la Investigación',
                description: 'Guía para desarrollar proyectos de investigación',
                category: 'educational',
                type: 'pdf',
                size: '3.7 MB',
                pages: 41,
                uploadDate: '2024-09-02',
                downloadCount: 1432,
                tags: ['metodología', 'investigación', 'proyectos'],
                featured: false,
                url: 'documents/guia-metodologia-investigacion.pdf'
            },

            // DOCUMENTOS ADMINISTRATIVOS
            {
                id: 'organigrama-institucional',
                title: 'Organigrama Institucional',
                description: 'Estructura organizacional del bachillerato',
                category: 'administrative',
                type: 'pdf',
                size: '1.1 MB',
                pages: 3,
                uploadDate: '2024-08-18',
                downloadCount: 743,
                tags: ['organigrama', 'estructura', 'personal'],
                featured: false,
                url: 'documents/organigrama-institucional.pdf'
            },
            {
                id: 'directorio-personal',
                title: 'Directorio del Personal Docente',
                description: 'Lista de contactos del personal docente y administrativo',
                category: 'administrative',
                type: 'pdf',
                size: '0.9 MB',
                pages: 8,
                uploadDate: '2024-08-22',
                downloadCount: 1654,
                tags: ['directorio', 'personal', 'docentes', 'contactos'],
                featured: false,
                url: 'documents/directorio-personal.pdf'
            },
            {
                id: 'horarios-atencion',
                title: 'Horarios de Atención',
                description: 'Horarios de servicios administrativos y departamentos',
                category: 'administrative',
                type: 'pdf',
                size: '0.7 MB',
                pages: 4,
                uploadDate: '2024-08-25',
                downloadCount: 2187,
                tags: ['horarios', 'atención', 'servicios'],
                featured: false,
                url: 'documents/horarios-atencion.pdf'
            }
        ];
    }

    getCategories() {
        return [
            {
                id: 'academic',
                name: 'Documentos Académicos',
                description: 'Calendarios, planes de estudio, manuales y guías académicas',
                icon: 'fas fa-graduation-cap',
                color: 'primary',
                count: 0
            },
            {
                id: 'forms',
                name: 'Formatos y Solicitudes',
                description: 'Formatos oficiales para trámites y servicios',
                icon: 'fas fa-file-alt',
                color: 'success',
                count: 0
            },
            {
                id: 'regulatory',
                name: 'Documentos Normativos',
                description: 'Reglamentos, lineamientos y normativas institucionales',
                icon: 'fas fa-gavel',
                color: 'warning',
                count: 0
            },
            {
                id: 'educational',
                name: 'Recursos Educativos',
                description: 'Guías de estudio, manuales y material didáctico',
                icon: 'fas fa-book-open',
                color: 'info',
                count: 0
            },
            {
                id: 'administrative',
                name: 'Documentos Administrativos',
                description: 'Organigramas, directorios y documentos institucionales',
                icon: 'fas fa-building',
                color: 'secondary',
                count: 0
            }
        ];
    }

    loadDownloadStats() {
        const stored = localStorage.getItem('download_stats');
        return stored ? JSON.parse(stored) : {
            totalDownloads: 0,
            monthlyDownloads: 0,
            popularDocuments: {}
        };
    }

    saveDownloadStats() {
        localStorage.setItem('download_stats', JSON.stringify(this.downloadStats));
    }

    loadRequests() {
        const stored = localStorage.getItem('document_requests');
        return stored ? JSON.parse(stored) : [];
    }

    saveRequests() {
        localStorage.setItem('document_requests', JSON.stringify(this.requests));
    }

    initializeCenter() {
        this.updateCategoryCounts();
        this.renderCategories();
        this.renderPopularDocuments();
        this.renderRecentDocuments();
        this.updateStatistics();
        this.setupEventListeners();
    }

    updateCategoryCounts() {
        this.categories.forEach(category => {
            category.count = this.documents.filter(doc => doc.category === category.id).length;
        });
    }

    setupEventListeners() {
        // Búsqueda de documentos
        document.getElementById('documentSearch').addEventListener('input', () => {
            this.debounceSearch();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.performSearch();
        });

        // Formulario de solicitud
        const requestForm = document.getElementById('documentRequestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processDocumentRequest();
            });
        }

        // Enter en búsqueda
        document.getElementById('documentSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    }

    debounceSearch() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    performSearch() {
        const query = document.getElementById('documentSearch').value.toLowerCase().trim();
        const category = document.getElementById('categoryFilter').value;

        let filteredDocs = this.documents;

        if (category) {
            filteredDocs = filteredDocs.filter(doc => doc.category === category);
        }

        if (query) {
            filteredDocs = filteredDocs.filter(doc => 
                doc.title.toLowerCase().includes(query) ||
                doc.description.toLowerCase().includes(query) ||
                doc.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        if (query || category) {
            this.displaySearchResults(filteredDocs, query);
        } else {
            // Restaurar vista normal
            this.renderCategories();
            this.renderPopularDocuments();
            this.renderRecentDocuments();
        }
    }

    displaySearchResults(documents, query) {
        const container = document.getElementById('categoriesContainer');
        
        if (documents.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No se encontraron documentos</h4>
                    <p class="text-muted">Intenta con otros términos de búsqueda o verifica la categoría seleccionada</p>
                    <button class="btn btn-primary" onclick="downloadCenter.clearSearch()">
                        <i class="fas fa-arrow-left me-2"></i>Volver al catálogo
                    </button>
                </div>
            `;
            return;
        }

        const resultsHTML = `
            <div class="col-12 mb-4">
                <div class="search-results-header">
                    <h4>Resultados de búsqueda</h4>
                    <p class="text-muted">Se encontraron ${documents.length} documento(s) ${query ? `para "${query}"` : ''}</p>
                    <button class="btn btn-outline-secondary btn-sm" onclick="downloadCenter.clearSearch()">
                        <i class="fas fa-times me-2"></i>Limpiar búsqueda
                    </button>
                </div>
            </div>
        ` + documents.map(doc => this.generateDocumentCard(doc)).join('');

        container.innerHTML = resultsHTML;
    }

    clearSearch() {
        document.getElementById('documentSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        this.renderCategories();
        this.renderPopularDocuments();
        this.renderRecentDocuments();
    }

    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        
        const html = this.categories.map(category => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="category-card card border-0 shadow-sm h-100" onclick="downloadCenter.showCategoryDocuments('${category.id}')">
                    <div class="card-body p-4 text-center">
                        <div class="category-icon bg-${category.color} text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                            <i class="${category.icon} fa-2x"></i>
                        </div>
                        <h4 class="card-title text-${category.color} mb-3">${category.name}</h4>
                        <p class="card-text text-muted mb-3">${category.description}</p>
                        <div class="category-stats">
                            <span class="badge bg-${category.color} fs-6">
                                <i class="fas fa-file-pdf me-1"></i>
                                ${category.count} documentos
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    showCategoryDocuments(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        const docs = this.documents.filter(doc => doc.category === categoryId);
        
        const container = document.getElementById('categoriesContainer');
        
        const html = `
            <div class="col-12 mb-4">
                <div class="category-header d-flex align-items-center justify-content-between">
                    <div>
                        <h3 class="text-${category.color}">
                            <i class="${category.icon} me-2"></i>
                            ${category.name}
                        </h3>
                        <p class="text-muted">${category.description}</p>
                    </div>
                    <button class="btn btn-outline-secondary" onclick="downloadCenter.renderCategories()">
                        <i class="fas fa-arrow-left me-2"></i>Volver
                    </button>
                </div>
            </div>
        ` + docs.map(doc => this.generateDocumentCard(doc)).join('');

        container.innerHTML = html;
    }

    renderPopularDocuments() {
        const container = document.getElementById('popularDocumentsContainer');
        const popularDocs = this.documents
            .sort((a, b) => b.downloadCount - a.downloadCount)
            .slice(0, 6);

        const html = popularDocs.map(doc => this.generateDocumentCard(doc)).join('');
        container.innerHTML = html;
    }

    renderRecentDocuments() {
        const container = document.getElementById('recentDocumentsContainer');
        const recentDocs = this.documents
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
            .slice(0, 6);

        const html = recentDocs.map(doc => this.generateDocumentCard(doc)).join('');
        container.innerHTML = html;
    }

    generateDocumentCard(doc) {
        const category = this.categories.find(c => c.id === doc.category);
        const uploadDate = new Date(doc.uploadDate);
        const formattedDate = uploadDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="document-card card border-0 shadow-sm h-100">
                    <div class="card-header bg-${category.color} text-white d-flex justify-content-between align-items-center">
                        <span class="category-label">
                            <i class="${category.icon} me-2"></i>
                            ${category.name}
                        </span>
                        ${doc.featured ? '<i class="fas fa-star" title="Documento destacado"></i>' : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title text-primary mb-2">${doc.title}</h5>
                        <p class="card-text text-muted small mb-3">${doc.description}</p>
                        
                        <div class="document-meta mb-3">
                            <div class="row small text-muted">
                                <div class="col-6">
                                    <i class="fas fa-file-pdf text-danger me-1"></i>
                                    PDF • ${doc.size}
                                </div>
                                <div class="col-6">
                                    <i class="fas fa-file-alt me-1"></i>
                                    ${doc.pages} páginas
                                </div>
                                <div class="col-6 mt-1">
                                    <i class="fas fa-download text-success me-1"></i>
                                    ${doc.downloadCount.toLocaleString()} descargas
                                </div>
                                <div class="col-6 mt-1">
                                    <i class="fas fa-calendar me-1"></i>
                                    ${formattedDate}
                                </div>
                            </div>
                        </div>

                        <div class="document-tags mb-3">
                            ${doc.tags.slice(0, 3).map(tag => 
                                `<span class="badge bg-light text-dark me-1 mb-1">${tag}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm flex-fill" 
                                    onclick="downloadCenter.previewDocument('${doc.id}')" 
                                    title="Vista previa">
                                <i class="fas fa-eye me-1"></i>
                                Previsualizar
                            </button>
                            <button class="btn btn-primary btn-sm flex-fill" 
                                    onclick="downloadCenter.downloadDocument('${doc.id}')" 
                                    title="Descargar documento">
                                <i class="fas fa-download me-1"></i>
                                Descargar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    previewDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        const category = this.categories.find(c => c.id === doc.category);
        
        const previewContent = `
            <div class="document-preview">
                <div class="document-info mb-4">
                    <div class="d-flex align-items-center mb-3">
                        <div class="document-icon bg-${category.color} text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                            <i class="fas fa-file-pdf fa-2x"></i>
                        </div>
                        <div>
                            <h5 class="mb-1">${doc.title}</h5>
                            <small class="text-muted">${category.name}</small>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="info-item mb-2">
                                <strong>Tamaño:</strong> ${doc.size}
                            </div>
                            <div class="info-item mb-2">
                                <strong>Páginas:</strong> ${doc.pages}
                            </div>
                            <div class="info-item mb-2">
                                <strong>Formato:</strong> PDF
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-item mb-2">
                                <strong>Subido:</strong> ${new Date(doc.uploadDate).toLocaleDateString('es-ES')}
                            </div>
                            <div class="info-item mb-2">
                                <strong>Descargas:</strong> ${doc.downloadCount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <strong>Descripción:</strong>
                        <p class="text-muted">${doc.description}</p>
                    </div>
                    
                    <div class="document-tags">
                        <strong>Etiquetas:</strong>
                        ${doc.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('')}
                    </div>
                </div>
                
                <div class="preview-placeholder bg-light p-4 text-center rounded">
                    <i class="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                    <h6>Vista previa del documento</h6>
                    <p class="text-muted small">La vista previa completa estará disponible próximamente.<br>
                    Mientras tanto, puedes descargar el documento para verlo en tu dispositivo.</p>
                </div>
            </div>
        `;

        document.getElementById('previewModalBody').innerHTML = previewContent;
        document.getElementById('previewModalLabel').innerHTML = `
            <i class="fas fa-eye me-2"></i>Vista Previa - ${doc.title}
        `;

        // Configurar botón de descarga en el modal
        const downloadBtn = document.getElementById('downloadFromPreview');
        downloadBtn.onclick = () => {
            this.downloadDocument(docId);
            bootstrap.Modal.getInstance(document.getElementById('previewModal')).hide();
        };

        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        modal.show();
    }

    downloadDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        // Simular descarga
        this.showAlert(`Iniciando descarga de "${doc.title}"`, 'success');

        // Actualizar estadísticas
        doc.downloadCount++;
        this.downloadStats.totalDownloads++;
        this.downloadStats.monthlyDownloads++;
        this.saveDownloadStats();

        // En un caso real, aquí se haría la descarga
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Actualizar la vista si es necesario
        this.updateStatistics();
    }

    processDocumentRequest() {
        const form = document.getElementById('documentRequestForm');
        const formData = new FormData(form);

        const request = {
            id: this.generateId(),
            name: formData.get('requesterName'),
            email: formData.get('requesterEmail'),
            userType: formData.get('requesterType'),
            documentName: formData.get('documentName'),
            reason: formData.get('requestReason'),
            urgency: formData.get('urgencyLevel'),
            requestDate: new Date().toISOString(),
            status: 'pending'
        };

        this.requests.push(request);
        this.saveRequests();

        this.showAlert('Solicitud enviada exitosamente. Te contactaremos pronto.', 'success');

        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
        modal.hide();
        form.reset();
    }

    updateStatistics() {
        // Calcular estadísticas
        const totalDocs = this.documents.length;
        const totalCategories = this.categories.length;
        const totalDownloads = this.documents.reduce((sum, doc) => sum + doc.downloadCount, 0);
        const monthlyUpdates = this.documents.filter(doc => {
            const uploadDate = new Date(doc.uploadDate);
            const now = new Date();
            const diffTime = Math.abs(now - uploadDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        }).length;

        // Animar contadores
        this.animateCounter('totalDocuments', totalDocs);
        this.animateCounter('totalDownloads', totalDownloads);
        this.animateCounter('totalCategories', totalCategories);
        this.animateCounter('monthlyUpdates', monthlyUpdates);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = Math.ceil(targetValue / 50);
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = currentValue.toLocaleString();
        }, 30);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

// Funciones globales
function searchDocuments() {
    if (window.downloadCenter) {
        window.downloadCenter.performSearch();
    }
}

function showHelp() {
    const modal = new bootstrap.Modal(document.getElementById('helpModal'));
    modal.show();
}

function requestDocument() {
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
}

// Estilos CSS adicionales
const downloadCenterStyles = `
<style>
.category-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0.75rem 1.5rem rgba(0,0,0,0.1)!important;
}

.document-card {
    transition: all 0.3s ease;
}

.document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15)!important;
}

.document-meta {
    background-color: #f8f9fa;
    border-radius: 0.375rem;
    padding: 0.75rem;
}

.document-tags .badge {
    font-size: 0.7rem;
}

.preview-placeholder {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.search-results-header {
    background-color: #f8f9fa;
    border-radius: 0.375rem;
    padding: 1.5rem;
    border-left: 4px solid var(--bs-primary);
}

.category-header {
    background-color: #f8f9fa;
    border-radius: 0.375rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.stat-card {
    padding: 2rem 1rem;
}

.info-item {
    border-left: 3px solid #dee2e6;
    padding-left: 0.75rem;
}

.document-icon {
    flex-shrink: 0;
}

@media (max-width: 768px) {
    .category-card .card-body {
        padding: 1.5rem 1rem;
    }
    
    .document-card .card-body {
        padding: 1rem;
    }
    
    .stat-card {
        padding: 1rem 0.5rem;
    }
    
    .search-results-header,
    .category-header {
        padding: 1rem;
    }
}

.dark-mode .document-meta {
    background-color: #374151;
}

.dark-mode .search-results-header,
.dark-mode .category-header {
    background-color: #374151;
}

.dark-mode .preview-placeholder {
    background-color: #374151;
    color: #f9fafb;
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', downloadCenterStyles);

// Inicializar el centro de descargas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('categoriesContainer')) {
        window.downloadCenter = new DownloadCenter();
    }
});