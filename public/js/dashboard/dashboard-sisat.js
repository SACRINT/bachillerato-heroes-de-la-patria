/**
 * 🏛️ DASHBOARD ADMINISTRATIVO BGE - MOTOR SISAT-ATP / SIGPAD-EMS
 * Control integral del plantel, CMS Multi-Tenant y Asistente Directivo
 */

(function () {
    'use strict';

    let currentTenant = null;
    let activeSection = 'section-identidad';
    let currentStep = 1;

    // Obtener token JWT de sesión blindado
    function getAuthToken() {
        if (typeof window.getGlobalAdminToken === 'function') {
            const tok = window.getGlobalAdminToken();
            if (tok) return tok;
        }
        const direct = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token') ||
                       localStorage.getItem('authToken') || sessionStorage.getItem('authToken') ||
                       localStorage.getItem('token') || sessionStorage.getItem('token') ||
                       localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') ||
                       localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (direct) return direct;

        const sessionStr = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession') ||
                           localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
        if (sessionStr) {
            try {
                const s = JSON.parse(sessionStr);
                if (s.token) return s.token;
            } catch (e) {}
        }
        return '';
    }

    // Inicialización al cargar el DOM
    document.addEventListener('DOMContentLoaded', async function () {
        console.log('[SISAT-DASHBOARD] Inicializando panel directivo...');
        setupNavigation();
        setupWizard();
        setupAIAssistant();
        setupMediaManager();
        await loadTenantData();
        await loadStaffData();
        await loadGalleryData();
    });

    // ================================================================
    // 1. NAVEGACIÓN Y SIDEBAR LATERAL
    // ================================================================
    function setupNavigation() {
        const menuLinks = document.querySelectorAll('.sisat-menu-link[data-section]');
        const sections = document.querySelectorAll('.sisat-panel-section');
        const toggleBtn = document.getElementById('toggleSidebarBtn');
        const sidebar = document.getElementById('sisatSidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', function () {
                sidebar.classList.toggle('collapsed');
            });
        }

        menuLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-section');

                menuLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                sections.forEach(sec => {
                    if (sec.id === targetId) {
                        sec.classList.remove('d-none');
                    } else {
                        sec.classList.add('d-none');
                    }
                });

                activeSection = targetId;

                // En móviles colapsar el menú al seleccionar
                if (window.innerWidth < 992 && sidebar) {
                    sidebar.classList.add('collapsed');
                }

                window.scrollTo({ top: 75, behavior: 'smooth' });
            });
        });
    }

    // ================================================================
    // 2. WIZARD ASISTENTE PASO A PASO (DIRECTOR)
    // ================================================================
    function setupWizard() {
        const stepIndicators = document.querySelectorAll('.sisat-step');
        const wizardPages = document.querySelectorAll('.wizard-step-content');
        const nextBtns = document.querySelectorAll('[data-wizard-next]');
        const prevBtns = document.querySelectorAll('[data-wizard-prev]');
        const saveBtn = document.getElementById('btnSaveSchoolConfig');

        function goToStep(step) {
            currentStep = step;
            stepIndicators.forEach(ind => {
                const stepNum = parseInt(ind.getAttribute('data-step'));
                ind.classList.remove('active', 'completed');
                if (stepNum === step) ind.classList.add('active');
                if (stepNum < step) ind.classList.add('completed');
            });

            wizardPages.forEach(p => {
                const pNum = parseInt(p.getAttribute('data-step-content'));
                if (pNum === step) {
                    p.classList.remove('d-none');
                } else {
                    p.classList.add('d-none');
                }
            });
        }

        stepIndicators.forEach(ind => {
            ind.addEventListener('click', function () {
                const step = parseInt(this.getAttribute('data-step'));
                goToStep(step);
            });
        });

        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep < 4) goToStep(currentStep + 1);
            });
        });

        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep > 1) goToStep(currentStep - 1);
            });
        });

        if (saveBtn) {
            saveBtn.addEventListener('click', saveSchoolConfig);
        }

        // Listener para subir logotipo desde el equipo
        const logoFileInput = document.getElementById('cfg_logo_file');
        const logoUrlInput = document.getElementById('cfg_logo_url');
        const logoPreview = document.getElementById('logoPreviewImg');
        if (logoFileInput) {
            logoFileInput.addEventListener('change', function () {
                const file = this.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    alert('Por favor selecciona un archivo de imagen válido.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (logoUrlInput) logoUrlInput.value = e.target.result;
                    if (logoPreview) logoPreview.src = e.target.result;
                    showToast('✅ Logotipo cargado desde tu equipo (Guarda cambios para persistir)', 'success');
                };
                reader.readAsDataURL(file);
            });
        }
        if (logoUrlInput && logoPreview) {
            logoUrlInput.addEventListener('input', function () {
                if (this.value.trim()) logoPreview.src = this.value.trim();
            });
        }
    }

    // ================================================================
    // 3. CARGA Y SINCRONIZACIÓN DE DATOS (NEON POSTGRESQL)
    // ================================================================
    async function loadTenantData() {
        try {
            const token = getAuthToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Intentar cargar perfil autenticado con RLS o fallback a config
            let res = await fetch('/api/tenant-cms/profile', { headers });
            let json;
            if (res.ok) {
                json = await res.json();
                currentTenant = json.data;
            } else {
                res = await fetch('/api/config/tenant');
                json = await res.json();
                currentTenant = json.tenant || json;
            }

            if (currentTenant) {
                populateFormFields(currentTenant);
                updateTopBarBadge(currentTenant);
            }
        } catch (err) {
            console.warn('[SISAT-DASHBOARD] Error cargando datos de la escuela:', err);
        }
    }

    function populateFormFields(data) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        // Identidad
        setVal('cfg_cct', data.cct);
        setVal('cfg_school_name', data.school_name);
        setVal('cfg_school_official_name', data.school_official_name);
        setVal('cfg_zona_escolar', data.zona_escolar);
        setVal('cfg_turno', data.turno);
        setVal('cfg_eslogan', data.eslogan);
        setVal('cfg_logo_url', data.logo_url);
        const logoPreview = document.getElementById('logoPreviewImg');
        if (logoPreview && data.logo_url) logoPreview.src = data.logo_url;

        // Director
        setVal('cfg_director_name', data.director_name);
        setVal('cfg_director_email', data.director_email);
        setVal('cfg_director_phone', data.director_phone);
        setVal('cfg_director_message', data.director_message);

        // Contacto & Ubicación
        setVal('cfg_direccion', data.direccion);
        setVal('cfg_codigo_postal', data.codigo_postal);
        setVal('cfg_municipio', data.municipio);
        setVal('cfg_estado', data.estado);
        setVal('cfg_telefono', data.telefono);
        setVal('cfg_email_institucional', data.email_institucional);
        setVal('cfg_horario_atencion', data.horario_atencion);

        // Redes
        setVal('cfg_facebook_url', data.facebook_url);
        setVal('cfg_youtube_url', data.youtube_url);
        setVal('cfg_instagram_url', data.instagram_url);
        setVal('cfg_tiktok_url', data.tiktok_url);
        setVal('cfg_whatsapp_number', data.whatsapp_number);

        // Misión & Visión
        setVal('cfg_mision', data.mision);
        setVal('cfg_vision', data.vision);
    }

    function updateTopBarBadge(data) {
        const badge = document.getElementById('schoolCctBadge');
        const nameEl = document.getElementById('schoolNameHeader');
        if (badge && data.cct) badge.textContent = `CCT: ${data.cct}`;
        if (nameEl && data.school_name) nameEl.textContent = data.school_name;
    }

    async function saveSchoolConfig() {
        const btn = document.getElementById('btnSaveSchoolConfig');
        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando en Neon PostgreSQL...';
        }

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : null;
        };

        const payload = {
            cct: getVal('cfg_cct'),
            school_name: getVal('cfg_school_name'),
            school_official_name: getVal('cfg_school_official_name'),
            zona_escolar: getVal('cfg_zona_escolar'),
            turno: getVal('cfg_turno'),
            eslogan: getVal('cfg_eslogan'),
            logo_url: getVal('cfg_logo_url'),
            director_name: getVal('cfg_director_name'),
            director_email: getVal('cfg_director_email'),
            director_phone: getVal('cfg_director_phone'),
            director_message: getVal('cfg_director_message'),
            direccion: getVal('cfg_direccion'),
            codigo_postal: getVal('cfg_codigo_postal'),
            municipio: getVal('cfg_municipio'),
            estado: getVal('cfg_estado'),
            telefono: getVal('cfg_telefono'),
            email_institucional: getVal('cfg_email_institucional'),
            horario_atencion: getVal('cfg_horario_atencion'),
            facebook_url: getVal('cfg_facebook_url'),
            youtube_url: getVal('cfg_youtube_url'),
            instagram_url: getVal('cfg_instagram_url'),
            tiktok_url: getVal('cfg_tiktok_url'),
            whatsapp_number: getVal('cfg_whatsapp_number'),
            mision: getVal('cfg_mision'),
            vision: getVal('cfg_vision')
        };

        try {
            const token = getAuthToken();
            const res = await fetch('/api/tenant-cms/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✅ Configuración institucional guardada exitosamente en la base de datos', 'success');
                updateTopBarBadge(payload);
            } else {
                showToast('⚠️ ' + (data.error || 'No se pudo guardar la configuración'), 'danger');
            }
        } catch (err) {
            console.error('[SISAT-DASHBOARD] Error al guardar:', err);
            showToast('❌ Error de conexión al guardar cambios', 'danger');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    }

    // ================================================================
    // 4. GESTIÓN MULTIMEDIA (GALERÍA & HERO & VIDEOS)
    // ================================================================
    function setupMediaManager() {
        const btnAddPhoto = document.getElementById('btnAddGalleryPhoto');
        const photoFileInput = document.getElementById('newPhotoFile');
        const photoUrlInput = document.getElementById('newPhotoUrl');
        const miniPreview = document.getElementById('mediaPreviewMini');
        const miniThumb = document.getElementById('mediaPreviewThumb');
        const mediaTypeHint = document.getElementById('mediaTypeHint');
        const lblMediaUrl = document.getElementById('lblMediaUrl');
        const btnBrowsePhoto = document.getElementById('btnBrowsePhoto');
        const btnRefreshGallery = document.getElementById('btnRefreshGallery');
        const radioPhoto = document.getElementById('mediaTypePhoto');
        const radioVideo = document.getElementById('mediaTypeVideo');
        const categorySelect = document.getElementById('newPhotoCategory');

        function extractYouTubeId(url) {
            if (!url) return null;
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            return match ? match[1] : null;
        }

        if (radioPhoto && radioVideo) {
            radioPhoto.addEventListener('change', () => {
                if (mediaTypeHint) mediaTypeHint.textContent = 'Subiendo imagen a la galería';
                if (lblMediaUrl) lblMediaUrl.textContent = 'URL o Archivo de Imagen';
                if (btnBrowsePhoto) btnBrowsePhoto.classList.remove('d-none');
                if (photoUrlInput) photoUrlInput.placeholder = 'https://... o selecciona un archivo local';
                if (categorySelect) categorySelect.value = 'academica';
            });

            radioVideo.addEventListener('change', () => {
                if (mediaTypeHint) mediaTypeHint.textContent = 'Enlace de video de YouTube o Vimeo';
                if (lblMediaUrl) lblMediaUrl.textContent = 'Enlace de YouTube (URL)';
                if (btnBrowsePhoto) btnBrowsePhoto.classList.add('d-none');
                if (photoUrlInput) photoUrlInput.placeholder = 'https://www.youtube.com/watch?v=... o https://youtu.be/...';
                if (categorySelect) categorySelect.value = 'videos';
            });
        }

        if (photoFileInput) {
            photoFileInput.addEventListener('change', function () {
                const file = this.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    alert('Por favor selecciona un archivo de imagen válido.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (photoUrlInput) photoUrlInput.value = e.target.result;
                    if (miniThumb) miniThumb.src = e.target.result;
                    if (miniPreview) miniPreview.classList.remove('d-none');
                    showToast('📷 Imagen cargada y lista para agregar', 'info');
                };
                reader.readAsDataURL(file);
            });
        }

        if (photoUrlInput) {
            photoUrlInput.addEventListener('input', function () {
                const val = this.value.trim();
                const ytId = extractYouTubeId(val);
                if (ytId) {
                    const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                    if (miniThumb) miniThumb.src = thumbUrl;
                    if (miniPreview) miniPreview.classList.remove('d-none');
                    if (radioVideo) radioVideo.checked = true;
                    if (categorySelect) categorySelect.value = 'videos';
                } else if (val.startsWith('http') || val.startsWith('data:image')) {
                    if (miniThumb) miniThumb.src = val;
                    if (miniPreview) miniPreview.classList.remove('d-none');
                } else {
                    if (miniPreview) miniPreview.classList.add('d-none');
                }
            });
        }

        if (btnRefreshGallery) {
            btnRefreshGallery.addEventListener('click', async () => {
                await loadGalleryData();
                showToast('Galería sincronizada', 'info');
            });
        }

        if (btnAddPhoto) {
            btnAddPhoto.addEventListener('click', async function () {
                const title = document.getElementById('newPhotoTitle')?.value.trim();
                let url = photoUrlInput?.value.trim();
                let category = categorySelect?.value || 'general';

                if (!url) {
                    alert('Por favor ingresa una URL o selecciona un archivo de imagen/video.');
                    return;
                }

                const ytId = extractYouTubeId(url);
                if (ytId) {
                    category = 'videos';
                }

                try {
                    const token = getAuthToken();
                    const res = await fetch('/api/tenant-cms/gallery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title: title || (ytId ? 'Video Institucional BGE' : 'Foto de Plantel'), image_url: url, category })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        showToast('✅ Elemento agregado a la galería', 'success');
                        if (document.getElementById('newPhotoTitle')) document.getElementById('newPhotoTitle').value = '';
                        if (photoUrlInput) photoUrlInput.value = '';
                        if (miniPreview) miniPreview.classList.add('d-none');
                        await loadGalleryData();
                    } else {
                        showToast('⚠️ ' + (data.error || 'Error al guardar'), 'danger');
                    }
                } catch (err) {
                    showToast('❌ Error al conectar con el servidor', 'danger');
                }
            });
        }
    }

    async function loadGalleryData() {
        const container = document.getElementById('galleryGridContainer');
        if (!container) return;

        try {
            const token = getAuthToken();
            const res = await fetch('/api/tenant-cms/gallery', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data.success && data.data) {
                if (data.data.length === 0) {
                    container.innerHTML = `
                        <div class="col-12 text-center text-muted py-4">
                            <i class="fas fa-photo-video fa-3x mb-2 text-secondary"></i>
                            <p>No hay fotos o videos en la galería aún. Agrega el primero arriba.</p>
                        </div>`;
                    return;
                }

                container.innerHTML = data.data.map(item => {
                    const isVideo = item.category === 'videos' || 
                                   item.image_url.includes('youtube.com') || 
                                   item.image_url.includes('youtu.be');
                    
                    let thumbUrl = item.image_url;
                    let videoLink = null;
                    const ytMatch = item.image_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                    if (ytMatch) {
                        thumbUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
                        videoLink = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
                    }

                    return `
                    <div class="col-sm-6 col-md-4 col-lg-3">
                        <div class="media-preview-card position-relative shadow-sm rounded overflow-hidden">
                            <img src="${thumbUrl}" alt="${item.title || 'Contenido'}" class="media-preview-img" onerror="this.src='/images/hero-bge-main.webp'">
                            ${isVideo ? `
                                <div class="position-absolute top-50 start-50 translate-middle" style="pointer-events: none;">
                                    <i class="fab fa-youtube fa-2x text-danger bg-white rounded-circle p-1 shadow"></i>
                                </div>
                                <span class="badge bg-danger position-absolute top-0 start-0 m-2">Video</span>
                            ` : `
                                <span class="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2 text-capitalize">${item.category || 'Foto'}</span>
                            `}
                            <div class="media-preview-actions position-absolute bottom-0 end-0 m-2">
                                ${videoLink ? `
                                    <a href="${videoLink}" target="_blank" class="btn btn-sm btn-info text-white py-0 px-2 me-1" title="Ver video">
                                        <i class="fas fa-play"></i>
                                    </a>
                                ` : ''}
                                <button class="btn btn-sm btn-danger py-0 px-2" onclick="window.deleteGalleryItem(${item.id})" title="Eliminar">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                            <div class="p-2 bg-white text-dark small text-truncate fw-medium">
                                ${item.title || 'Contenido de plantel'}
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');
            }
        } catch (err) {
            console.warn('[SISAT-DASHBOARD] Error cargando galería:', err);
        }
    }

    window.deleteGalleryItem = async function (id) {
        if (!confirm('¿Eliminar este elemento de la galería?')) return;
        try {
            const token = getAuthToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`/api/tenant-cms/gallery/${id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                showToast('Elemento eliminado', 'success');
                await loadGalleryData();
            }
        } catch (err) {
            showToast('Error al eliminar', 'danger');
        }
    };

    // ================================================================
    // 5. GESTIÓN DE PERSONAL DOCENTE
    // ================================================================
    async function loadStaffData() {
        const container = document.getElementById('staffTableBody');
        if (!container) return;

        try {
            const token = getAuthToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('/api/tenant-cms/staff', { headers });
            if (!res.ok) {
                if (res.status === 401) return; // Esperar a que el usuario se autentique
            }
            const data = await res.json();

            if (res.ok && data.success && data.data) {
                if (data.data.length === 0) {
                    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay personal registrado aún.</td></tr>`;
                    return;
                }

                container.innerHTML = data.data.map(member => `
                    <tr>
                        <td class="fw-semibold">${member.name}</td>
                        <td><span class="badge bg-light text-dark border">${member.role || 'Docente'}</span></td>
                        <td>${member.department || 'Académico'}</td>
                        <td>${member.email || 'N/A'}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteStaffMember(${member.id})">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.warn('[SISAT-DASHBOARD] Error cargando personal:', err);
        }
    }

    window.deleteStaffMember = async function (id) {
        if (!confirm('¿Eliminar a este miembro del personal?')) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`/api/tenant-cms/staff/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Miembro eliminado', 'success');
                await loadStaffData();
            }
        } catch (err) {
            showToast('Error eliminando', 'danger');
        }
    };

    // ================================================================
    // 6. ASISTENTE IA PARA EL DIRECTOR (GEMINI / AUTOMATIZACIÓN)
    // ================================================================
    function setupAIAssistant() {
        const apiKeyInput = document.getElementById('aiDirectorApiKey');
        const savedKey = localStorage.getItem('bge_director_ai_key');
        if (apiKeyInput && savedKey) apiKeyInput.value = savedKey;

        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', function () {
                localStorage.setItem('bge_director_ai_key', this.value.trim());
                showToast('🔑 API Key guardada de forma segura en tu navegador', 'info');
            });
        }

        // 1. Generador de Lema
        const btnGenerateSlogan = document.getElementById('btnAiGenSlogan');
        if (btnGenerateSlogan) {
            btnGenerateSlogan.addEventListener('click', async () => {
                const schoolName = document.getElementById('cfg_school_name')?.value || 'Bachillerato General Estatal';
                const key = localStorage.getItem('bge_director_ai_key');
                const prompt = `Genera un lema o eslogan educativo inspirador, formal y breve (máximo 10 palabras) para una escuela de Educación Media Superior en México llamada: "${schoolName}". Devuelve solo el lema sin comillas ni explicaciones.`;
                await runAiTask(key, prompt, 'cfg_eslogan');
            });
        }

        // 2. Generador de Misión
        const btnGenerateMission = document.getElementById('btnAiGenMission');
        if (btnGenerateMission) {
            btnGenerateMission.addEventListener('click', async () => {
                const schoolName = document.getElementById('cfg_school_name')?.value || 'Bachillerato General Estatal';
                const key = localStorage.getItem('bge_director_ai_key');
                const prompt = `Escribe una Misión institucional formal y alineada a la Nueva Escuela Mexicana (SEP) para el plantel "${schoolName}". Máximo 3 renglones.`;
                await runAiTask(key, prompt, 'cfg_mision');
            });
        }

        // 3. Mensaje de Bienvenida del Director
        const btnGenDirectorMsg = document.getElementById('btnAiGenDirectorMsg');
        if (btnGenDirectorMsg) {
            btnGenDirectorMsg.addEventListener('click', async () => {
                const schoolName = document.getElementById('cfg_school_name')?.value || 'Bachillerato General Estatal';
                const dirName = document.getElementById('cfg_director_name')?.value || 'Director Escolar';
                const key = localStorage.getItem('bge_director_ai_key');
                const prompt = `Redacta un Mensaje de Bienvenida institucional, cálido, formal y motivador del Director(a) "${dirName}" para toda la comunidad de estudiantes y padres de familia del plantel "${schoolName}". Máximo 2 párrafos concisos.`;
                await runAiTask(key, prompt, 'cfg_director_message');
            });
        }

        // 4. Redactor de Circulares y Avisos SEP
        const btnAiGenNotice = document.getElementById('btnAiGenNotice');
        if (btnAiGenNotice) {
            btnAiGenNotice.addEventListener('click', async () => {
                const promptInput = document.getElementById('aiNoticePromptInput')?.value.trim();
                if (!promptInput) {
                    alert('Por favor escribe una idea o instrucción breve para la circular en el campo de texto.');
                    return;
                }
                const schoolName = document.getElementById('cfg_school_name')?.value || 'Bachillerato General Estatal';
                const dirName = document.getElementById('cfg_director_name')?.value || 'Dirección del Plantel';
                const key = localStorage.getItem('bge_director_ai_key');

                const prompt = `Actúa como Director del plantel "${schoolName}". Genera una Circular Oficial para padres y alumnos basada en esta instrucción: "${promptInput}". 
                Responde en formato JSON con la siguiente estructura:
                {
                    "title": "Título formal del comunicado",
                    "priority": "urgente",
                    "body": "Cuerpo del comunicado con saludo protocolario a la comunidad escolar, explicación detallada, instrucciones y despedida formal firmada por ${dirName}."
                }
                Devuelve únicamente el código JSON válido, sin bloques markdown ni explicaciones adicionales.`;

                try {
                    showToast('🤖 Asistente IA redactando circular oficial...', 'info');
                    const text = await executeGeminiCall(key, prompt);
                    if (text) {
                        try {
                            const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(cleaned);
                            if (parsed.title) document.getElementById('notice_title').value = parsed.title;
                            if (parsed.priority && document.getElementById('notice_priority')) {
                                document.getElementById('notice_priority').value = parsed.priority;
                            }
                            if (parsed.body) document.getElementById('notice_content').value = parsed.body;
                            showToast('✨ Circular redactada con éxito', 'success');
                        } catch (parseErr) {
                            document.getElementById('notice_content').value = text;
                            showToast('✨ Circular redactada con éxito', 'success');
                        }
                    }
                } catch (err) {
                    showToast('⚠️ No se pudo redactar con IA. Verifique su API Key.', 'warning');
                }
            });
        }

        // 5. Consola Directiva de Asistencia Libre
        const btnAiRunFreePrompt = document.getElementById('btnAiRunFreePrompt');
        const freePromptInput = document.getElementById('aiFreePromptInput');
        const freeResultContainer = document.getElementById('aiFreeResultContainer');
        const freeResultText = document.getElementById('aiFreeResultText');
        const btnCopyAiFreeResult = document.getElementById('btnCopyAiFreeResult');
        const freeStatus = document.getElementById('aiFreeStatus');

        if (btnAiRunFreePrompt) {
            btnAiRunFreePrompt.addEventListener('click', async () => {
                const prompt = freePromptInput?.value.trim();
                if (!prompt) {
                    alert('Por favor escribe tu consulta para el asistente directivo.');
                    return;
                }
                const key = localStorage.getItem('bge_director_ai_key');
                if (!key) {
                    alert('Por favor ingresa tu API Key de Google Gemini en la parte superior para usar la consola libre.');
                    return;
                }

                if (freeStatus) freeStatus.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Generando respuesta institucional...';
                try {
                    const resText = await executeGeminiCall(key, prompt);
                    if (freeResultContainer) freeResultContainer.classList.remove('d-none');
                    if (freeResultText) freeResultText.textContent = resText;
                    if (freeStatus) freeStatus.innerHTML = '<i class="fas fa-check-circle text-success me-1"></i>Consulta completada';
                } catch (err) {
                    if (freeStatus) freeStatus.innerHTML = '<i class="fas fa-exclamation-triangle text-danger me-1"></i>Error al procesar';
                    showToast('Error al conectar con la IA', 'danger');
                }
            });
        }

        if (btnCopyAiFreeResult && freeResultText) {
            btnCopyAiFreeResult.addEventListener('click', () => {
                navigator.clipboard.writeText(freeResultText.textContent).then(() => {
                    showToast('📋 Texto copiado al portapapeles', 'info');
                });
            });
        }
    }

    async function executeGeminiCall(apiKey, prompt) {
        if (!apiKey) throw new Error('No API Key');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return data.candidates[0].content.parts[0].text.trim();
        }
        throw new Error(data.error?.message || 'Respuesta vacía');
    }

    async function runAiTask(apiKey, prompt, targetFieldId) {
        const target = document.getElementById(targetFieldId);
        if (!target) return;

        // Fallback institucional si no hay API Key configurada
        if (!apiKey) {
            showToast('ℹ️ Usando plantilla institucional estándar (Agrega tu API Key para personalizar con IA)', 'info');
            if (targetFieldId === 'cfg_eslogan') {
                target.value = 'Formando líderes con excelencia académica, valores y visión de futuro.';
            } else if (targetFieldId === 'cfg_mision') {
                target.value = 'Formar jóvenes analíticos, creativos y con alto sentido de responsabilidad cívica y humana, preparados para triunfar en la educación superior y transformar su comunidad.';
            } else if (targetFieldId === 'cfg_director_message') {
                target.value = 'Les damos la más cordial bienvenida a nuestra comunidad escolar. Nuestro compromiso es brindar una formación de excelencia que prepare a nuestras alumnas y alumnos para los retos del futuro.';
            }
            return;
        }

        try {
            showToast('🤖 Asistente IA generando contenido...', 'info');
            const text = await executeGeminiCall(apiKey, prompt);
            target.value = text;
            showToast('✨ Contenido generado e insertado con éxito', 'success');
        } catch (err) {
            console.warn('[AI-ASSISTANT] Fallback a plantilla por error:', err);
            showToast('⚠️ No se pudo conectar a la API de IA. Verifique su API Key.', 'warning');
        }
    }

    // ================================================================
    // UTILIDAD: NOTIFICACIONES TOAST INSTITUCIONALES
    // ================================================================
    function showToast(message, type = 'info') {
        let toastContainer = document.getElementById('sisatToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'sisatToastContainer';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'info' ? 'primary' : type} border-0 show shadow-lg mb-2`;
        toast.role = 'alert';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body fw-medium">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

})();
