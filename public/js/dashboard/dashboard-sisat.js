/**
 * 🏛️ DASHBOARD ADMINISTRATIVO BGE - MOTOR SISAT-ATP / SIGPAD-EMS
 * Control integral del plantel, CMS Multi-Tenant y Asistente Directivo
 */

(function () {
    'use strict';

    let currentTenant = null;
    let activeSection = 'section-identidad';
    let currentStep = 1;

    // Obtener token JWT de sesión
    function getAuthToken() {
        return localStorage.getItem('token') || 
               localStorage.getItem('auth_token') || 
               localStorage.getItem('adminToken') || '';
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
        if (btnAddPhoto) {
            btnAddPhoto.addEventListener('click', async function () {
                const title = document.getElementById('newPhotoTitle')?.value.trim();
                const url = document.getElementById('newPhotoUrl')?.value.trim();
                const category = document.getElementById('newPhotoCategory')?.value || 'general';

                if (!url) {
                    alert('Por favor ingresa la URL de la imagen.');
                    return;
                }

                try {
                    const token = getAuthToken();
                    const res = await fetch('/api/tenant-cms/gallery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title, image_url: url, category })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        showToast('✅ Foto agregada a la galería', 'success');
                        document.getElementById('newPhotoTitle').value = '';
                        document.getElementById('newPhotoUrl').value = '';
                        await loadGalleryData();
                    } else {
                        showToast('⚠️ ' + (data.error || 'Error al guardar foto'), 'danger');
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
                            <i class="fas fa-images fa-3x mb-2 text-secondary"></i>
                            <p>No hay fotos en la galería aún. Agrega la primera arriba.</p>
                        </div>`;
                    return;
                }

                container.innerHTML = data.data.map(item => `
                    <div class="col-sm-6 col-md-4 col-lg-3">
                        <div class="media-preview-card">
                            <img src="${item.image_url}" alt="${item.title || 'Foto'}" class="media-preview-img" onerror="this.src='/images/hero-bge-main.webp'">
                            <div class="media-preview-actions">
                                <button class="btn btn-sm btn-danger py-0 px-2" onclick="window.deleteGalleryItem(${item.id})">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                            <div class="p-2 bg-white text-dark small text-truncate fw-medium">
                                ${item.title || 'Foto de plantel'}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.warn('[SISAT-DASHBOARD] Error cargando galería:', err);
        }
    }

    window.deleteGalleryItem = async function (id) {
        if (!confirm('¿Eliminar esta foto de la galería?')) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`/api/tenant-cms/gallery/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Foto eliminada', 'success');
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
            const res = await fetch('/api/tenant-cms/staff', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
    // 6. ASISTENTE IA PARA EL DIRECTOR (GEMINI / PROMPT SYSTEM)
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

        const btnGenerateSlogan = document.getElementById('btnAiGenSlogan');
        if (btnGenerateSlogan) {
            btnGenerateSlogan.addEventListener('click', async () => {
                const schoolName = document.getElementById('cfg_school_name')?.value || 'Bachillerato General Estatal';
                const key = localStorage.getItem('bge_director_ai_key');

                const prompt = `Genera un lema o eslogan educativo inspirador, formal y breve (máximo 10 palabras) para una escuela de Educación Media Superior en México llamada: "${schoolName}". Devuelve solo el lema sin comillas ni explicaciones.`;
                await runAiTask(key, prompt, 'cfg_eslogan');
            });
        }

        const btnGenerateMission = document.getElementById('btnAiGenMission');
        if (btnGenerateMission) {
            btnGenerateMission.addEventListener('click', async () => {
                const schoolName = document.getElementById('cfg_school_name')?.value || 'Bachillerato General Estatal';
                const key = localStorage.getItem('bge_director_ai_key');

                const prompt = `Escribe una Misión institucional formal y alineada a la Nueva Escuela Mexicana (SEP) para el plantel "${schoolName}". Máximo 3 renglones.`;
                await runAiTask(key, prompt, 'cfg_mision');
            });
        }
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
            }
            return;
        }

        try {
            showToast('🤖 Asistente IA generando contenido...', 'info');
            // Llamar a Gemini API directamente con la clave del director
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
                const text = data.candidates[0].content.parts[0].text.trim();
                target.value = text;
                showToast('✨ Contenido generado e insertado con éxito', 'success');
            } else {
                throw new Error(data.error?.message || 'Respuesta vacía');
            }
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
