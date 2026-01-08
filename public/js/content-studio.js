/**
 * 🎨 CONTENT STUDIO ENGINE
 * Propósito: Lógica de arrastrar y soltar, edición y previsualización
 */

document.addEventListener('DOMContentLoaded', () => {
    initStudio();
});

let studioState = {
    contentId: null,
    elements: [],
    selectedElementId: null,
    isDirty: false
};

function initStudio() {
    const draggables = document.querySelectorAll('.draggable-element');
    const canvas = document.getElementById('canvas');

    // 1. Setup Draggable Sidebar Elements
    draggables.forEach(elem => {
        elem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', elem.dataset.type);
            elem.classList.add('dragging');
        });

        elem.addEventListener('dragend', () => {
            elem.classList.remove('dragging');
        });
    });

    // 2. Setup Canvas Drop Zones
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvas.classList.add('drag-over');
    });

    canvas.addEventListener('dragleave', () => {
        canvas.classList.remove('drag-over');
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.classList.remove('drag-over');
        const type = e.dataTransfer.getData('type');
        addElementToCanvas(type);
    });

    // 3. Load Meta Data (Templates/Elements)
    loadStudioMeta();
}

// --- CANVAS OPERATIONS ---

function addElementToCanvas(type) {
    const id = 'elem-' + Date.now();
    const newElement = {
        id: id,
        type: type,
        config: getDefaultConfig(type)
    };

    studioState.elements.push(newElement);
    renderElement(newElement);
    selectElement(id);
    hidePlaceholder();

    studioState.isDirty = true;
}

function renderElement(elem) {
    const canvas = document.getElementById('canvas');
    const div = document.createElement('div');
    div.className = 'canvas-element';
    div.id = elem.id;
    div.dataset.type = elem.type;

    div.innerHTML = `
        <div class="element-content">
            ${getElementPreviewHtml(elem)}
        </div>
        <div class="element-controls">
            <button class="control-btn" onclick="moveElementUp('${elem.id}')"><i class="fas fa-chevron-up"></i></button>
            <button class="control-btn" onclick="moveElementDown('${elem.id}')"><i class="fas fa-chevron-down"></i></button>
            <button class="control-btn delete" onclick="deleteElement('${elem.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `;

    div.onclick = (e) => {
        e.stopPropagation();
        selectElement(elem.id);
    };

    canvas.appendChild(div);
}

function selectElement(id) {
    // UI Cleanup
    document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('active'));

    const elem = studioState.elements.find(e => e.id === id);
    if (!elem) return;

    const div = document.getElementById(id);
    div.classList.add('active');

    studioState.selectedElementId = id;
    renderProperties(elem);
}

// --- RENDER HELPERS ---

function getElementPreviewHtml(elem) {
    switch (elem.type) {
        case 'text':
            return `<h3>${elem.config.text || 'Nuevo Texto'}</h3>`;
        case 'image':
            return `<div class="bg-light p-4 text-center border rounded">
                        <i class="fas fa-image fa-2x opacity-25"></i>
                        <p class="mb-0 mt-2 small">${elem.config.url || 'Sin imagen seleccionada'}</p>
                    </div>`;
        case 'video':
            return `<div class="ratio ratio-16x9 bg-dark rounded d-flex align-items-center justify-content-center">
                        <i class="fas fa-play-circle fa-3x text-white opacity-50"></i>
                    </div>`;
        case 'quiz':
            return `<div class="card shadow-sm border-primary">
                        <div class="card-body">
                            <h5 class="card-title"><i class="fas fa-question-circle me-2 text-primary"></i> Quiz Interactivo</h5>
                            <p class="card-text small text-muted">Añade preguntas en el panel de propiedades.</p>
                        </div>
                    </div>`;
        case 'button':
            return `<button class="btn btn-primary w-100">${elem.config.label || 'Botón'}</button>`;
        default:
            return `<div class="text-muted p-3 border rounded">${elem.type.toUpperCase()}</div>`;
    }
}

function getDefaultConfig(type) {
    const configs = {
        text: { text: 'Título de sección', style: 'h3' },
        image: { url: '', alt: '', caption: '' },
        video: { url: 'https://www.youtube.com/watch?v=...', provider: 'youtube' },
        quiz: { questions: [{ q: 'Nueva pregunta', options: ['A', 'B', 'C'], correct: 0 }] },
        button: { label: 'Empezar ahora', action: 'next_page' },
        divider: {}
    };
    return configs[type] || {};
}

// --- PROPERTIES PANEL ---

function renderProperties(elem) {
    const panel = document.getElementById('properties-panel');
    const targetText = document.getElementById('property-target');
    targetText.innerText = `Editando: ${elem.type.toUpperCase()}`;

    let html = '';

    // Common properties logic (can be expanded)
    if (elem.type === 'text') {
        html = `
            <div class="property-group">
                <label class="property-label">Contenido de Texto</label>
                <textarea class="form-control" onchange="updateElementConfig('${elem.id}', 'text', this.value)">${elem.config.text}</textarea>
            </div>
        `;
    } else if (elem.type === 'button') {
        html = `
            <div class="property-group">
                <label class="property-label">Etiqueta del Botón</label>
                <input type="text" class="form-control" value="${elem.config.label}" onchange="updateElementConfig('${elem.id}', 'label', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Acción</label>
                <select class="form-select" onchange="updateElementConfig('${elem.id}', 'action', this.value)">
                    <option value="next" ${elem.config.action === 'next' ? 'selected' : ''}>Ir al siguiente paso</option>
                    <option value="link" ${elem.config.action === 'link' ? 'selected' : ''}>Abrir URL externa</option>
                </select>
            </div>
        `;
    } else if (elem.type === 'image') {
        html = `
            <div class="property-group">
                <label class="property-label">URL de la Imagen</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="img-url" value="${elem.config.url}" onchange="updateElementConfig('${elem.id}', 'url', this.value)">
                    <button class="btn btn-outline-secondary" onclick="openMediaManager('img-url')"><i class="fas fa-upload"></i></button>
                </div>
            </div>
        `;
    }

    panel.innerHTML = html;
}

function updateElementConfig(id, key, value) {
    const elem = studioState.elements.find(e => e.id === id);
    if (elem) {
        elem.config[key] = value;
        // Re-render only this element preview
        const divContent = document.querySelector(`#${id} .element-content`);
        divContent.innerHTML = getElementPreviewHtml(elem);
        studioState.isDirty = true;
    }
}

// --- UI HELPERS ---

function hidePlaceholder() {
    const placeholder = document.getElementById('placeholder');
    if (placeholder) placeholder.style.display = 'none';
}

function togglePreview() {
    const previewBody = document.getElementById('preview-body');
    previewBody.innerHTML = `
        <div class="mx-auto bg-white p-5 rounded shadow-sm" style="max-width: 800px;">
            <h1 class="text-center mb-5">${document.getElementById('content-title').value}</h1>
            ${studioState.elements.map(e => getElementPreviewHtml(e)).join('<div class="my-4"></div>')}
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

async function saveDraft() {
    const title = document.getElementById('content-title').value;
    const data = {
        title,
        content_json: { elements: studioState.elements },
        status: 'draft'
    };

    try {
        const response = await fetch('/api/studio/content/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire('Guardado', 'Tu progreso ha sido guardado como borrador.', 'success');
            studioState.isDirty = false;
        } else {
            Swal.fire('Error', result.error, 'error');
        }
    } catch (e) {
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
}

async function loadStudioMeta() {
    try {
        const res = await fetch('/api/studio/templates', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await res.json();
        if (result.success) {
            const list = document.getElementById('templates-list');
            list.innerHTML = result.data.map(t => `
                <a href="#" class="list-group-item list-group-item-action py-3" onclick="loadTemplate(${t.id})">
                    <div class="fw-bold">${t.name}</div>
                    <div class="text-muted extra-small">${t.category}</div>
                </a>
            `).join('');
        }
    } catch (e) {
        console.error('Error loading meta', e);
    }
}

function deleteElement(id) {
    studioState.elements = studioState.elements.filter(e => e.id !== id);
    document.getElementById(id).remove();
    if (studioState.elements.length === 0) {
        document.getElementById('placeholder').style.display = 'block';
    }
}
