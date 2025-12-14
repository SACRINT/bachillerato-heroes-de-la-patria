/**
 * 📧 ADMINISTRACIÓN DE NEWSLETTERS
 * Panel de administración para gestión de suscriptores y envío de newsletters
 * BGE Héroes de la Patria
 */

// ============================================
// VARIABLES GLOBALES
// ============================================

let subscribers = [];
let newsletters = [];
let statistics = {};

const API_BASE = '/api';

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📧 Inicializando panel de newsletters...');

    // Cargar estadísticas
    await loadStatistics();

    // Cargar suscriptores
    await loadSubscribers();

    // Configurar eventos
    setupEventListeners();

    console.log('✅ Panel de newsletters listo');
});

// ============================================
// CARGAR ESTADÍSTICAS
// ============================================

async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/subscriptions/stats`);
        const data = await response.json();

        if (data.success) {
            statistics = data.statistics;

            // Actualizar cards
            document.getElementById('totalSubscribers').textContent = statistics.activeSubscribers || 0;
            document.getElementById('totalNewsletters').textContent = statistics.newslettersSent || 0;
            document.getElementById('inactiveSubscribers').textContent = statistics.inactiveSubscribers || 0;

            // Calcular promedio
            const avg = statistics.activeSubscribers > 0
                ? Math.round((statistics.newslettersSent * statistics.activeSubscribers) / statistics.activeSubscribers)
                : 0;
            document.getElementById('averageEmails').textContent = avg;

            console.log('✅ Estadísticas cargadas:', statistics);
        }
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        showAlert('danger', 'Error al cargar estadísticas');
    }
}

// ============================================
// CARGAR SUSCRIPTORES
// ============================================

async function loadSubscribers() {
    const spinner = document.getElementById('subscribersSpinner');
    const tableBody = document.getElementById('subscribersTableBody');

    try {
        spinner.classList.add('active');
        tableBody.innerHTML = '';

        const response = await fetch(`${API_BASE}/subscriptions/list`);
        const data = await response.json();

        if (data.success) {
            subscribers = data.subscribers;

            if (subscribers.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px;">
                            <div class="empty-state">
                                <i class="fas fa-inbox"></i>
                                <h4>No hay suscriptores todavía</h4>
                                <p>Los suscriptores aparecerán aquí cuando se registren desde la web</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                renderSubscribers(subscribers);
            }

            console.log(`✅ ${subscribers.length} suscriptores cargados`);
        }
    } catch (error) {
        console.error('❌ Error cargando suscriptores:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: red;">
                    Error al cargar suscriptores
                </td>
            </tr>
        `;
    } finally {
        spinner.classList.remove('active');
    }
}

// ============================================
// RENDERIZAR SUSCRIPTORES
// ============================================

function renderSubscribers(subscribersList) {
    const tableBody = document.getElementById('subscribersTableBody');
    tableBody.innerHTML = '';

    subscribersList.forEach(sub => {
        const row = document.createElement('tr');

        const categories = sub.categories.map(cat =>
            `<span class="category-tag">${cat}</span>`
        ).join('');

        const statusBadge = sub.active
            ? '<span class="badge badge-success">✓ Activo</span>'
            : '<span class="badge text-bg-secondary">✗ Inactivo</span>';

        const date = new Date(sub.subscribedAt).toLocaleDateString('es-MX');

        row.innerHTML = `
            <td><small>${sub.id}</small></td>
            <td><strong>${sub.email}</strong></td>
            <td>${sub.name}</td>
            <td>${categories}</td>
            <td><span class="badge badge-info">${sub.emailsSent || 0}</span></td>
            <td>${date}</td>
            <td>${statusBadge}</td>
        `;

        tableBody.appendChild(row);
    });
}

// ============================================
// CARGAR HISTORIAL DE NEWSLETTERS
// ============================================

async function loadNewsletterHistory() {
    const spinner = document.getElementById('historySpinner');
    const listContainer = document.getElementById('newsletterHistoryList');

    try {
        spinner.classList.add('active');
        listContainer.innerHTML = '';

        const response = await fetch(`${API_BASE}/newsletters/list`);
        const data = await response.json();

        if (data.success) {
            newsletters = data.newsletters;

            if (newsletters.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-envelope"></i>
                        <h4>No se han enviado newsletters todavía</h4>
                        <p>Las newsletters que envíes aparecerán aquí</p>
                    </div>
                `;
            } else {
                // Ordenar por fecha (más reciente primero)
                newsletters.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

                newsletters.forEach(news => {
                    const item = createNewsletterHistoryItem(news);
                    listContainer.appendChild(item);
                });
            }

            console.log(`✅ ${newsletters.length} newsletters cargadas`);
        }
    } catch (error) {
        console.error('❌ Error cargando historial:', error);
        listContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el historial de newsletters
            </div>
        `;
    } finally {
        spinner.classList.remove('active');
    }
}

// ============================================
// CREAR ITEM DE HISTORIAL
// ============================================

function createNewsletterHistoryItem(news) {
    const div = document.createElement('div');
    div.className = 'newsletter-item';

    const date = new Date(news.sentAt).toLocaleString('es-MX');
    const successRate = news.sentTo > 0
        ? Math.round((news.successCount / news.sentTo) * 100)
        : 0;

    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h4>${news.subject}</h4>
                <div class="newsletter-meta">
                    <span><i class="fas fa-calendar me-1"></i>${date}</span>
                    <span><i class="fas fa-tag me-1"></i>${news.targetCategory}</span>
                    <span><i class="fas fa-paper-plane me-1"></i>${news.sentTo} enviados</span>
                </div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="viewNewsletterDetail('${news.id}')">
                <i class="fas fa-eye me-1"></i>Ver Detalle
            </button>
        </div>
        <div class="mt-3">
            <div class="d-flex justify-content-between mb-2">
                <span>Tasa de éxito: <strong>${successRate}%</strong></span>
                <span>
                    <span class="text-success me-3">
                        <i class="fas fa-check-circle"></i> ${news.successCount}
                    </span>
                    <span class="text-danger">
                        <i class="fas fa-times-circle"></i> ${news.failureCount}
                    </span>
                </span>
            </div>
            <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-success" style="width: ${successRate}%"></div>
            </div>
        </div>
    `;

    return div;
}

// ============================================
// VER DETALLE DE NEWSLETTER
// ============================================

async function viewNewsletterDetail(newsletterId) {
    try {
        const response = await fetch(`${API_BASE}/newsletters/${newsletterId}`);
        const data = await response.json();

        if (data.success) {
            const news = data.newsletter;

            // Crear modal con detalle
            const modal = `
                <div class="modal fade" id="newsletterDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${news.subject}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p><strong>ID:</strong> ${news.id}</p>
                                <p><strong>Categoría:</strong> ${news.targetCategory}</p>
                                <p><strong>Enviado:</strong> ${new Date(news.sentAt).toLocaleString('es-MX')}</p>
                                <p><strong>Destinatarios:</strong> ${news.sentTo}</p>
                                <p><strong>Éxitos:</strong> ${news.successCount}</p>
                                <p><strong>Fallos:</strong> ${news.failureCount}</p>

                                <hr>

                                <h6>Contenido:</h6>
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; max-height: 400px; overflow-y: auto;">
                                    ${news.content}
                                </div>

                                <hr>

                                <h6>Detalles de Envío:</h6>
                                <div style="max-height: 300px; overflow-y: auto;">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Email</th>
                                                <th>Estado</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${news.subscribers.map(sub => `
                                                <tr>
                                                    <td>${sub.email}</td>
                                                    <td>
                                                        ${sub.status === 'sent'
                                                            ? '<span class="badge badge-success">Enviado</span>'
                                                            : '<span class="badge badge-danger">Fallido</span>'}
                                                    </td>
                                                    <td>${sub.sentAt ? new Date(sub.sentAt).toLocaleTimeString('es-MX') : '-'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Agregar modal al body
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modal;
            document.body.appendChild(modalContainer);

            // Mostrar modal
            const modalElement = new bootstrap.Modal(document.getElementById('newsletterDetailModal'));
            modalElement.show();

            // Limpiar al cerrar
            document.getElementById('newsletterDetailModal').addEventListener('hidden.bs.modal', () => {
                modalContainer.remove();
            });
        }
    } catch (error) {
        console.error('❌ Error cargando detalle:', error);
        alert('Error al cargar el detalle de la newsletter');
    }
}

// ============================================
// ENVIAR NEWSLETTER
// ============================================

async function sendNewsletter(subject, content, targetCategory) {
    const spinner = document.getElementById('sendingSpinner');
    const resultDiv = document.getElementById('sendResult');

    try {
        spinner.classList.add('active');
        resultDiv.innerHTML = '';

        console.log('📤 Enviando newsletter...');

        const response = await fetch(`${API_BASE}/newsletters/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject: subject,
                content: content,
                targetCategory: targetCategory
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Newsletter enviada:', data.newsletter);

            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="fas fa-check-circle me-2"></i>¡Newsletter Enviada Exitosamente!</h5>
                    <hr>
                    <p><strong>ID:</strong> ${data.newsletter.id}</p>
                    <p><strong>Asunto:</strong> ${data.newsletter.subject}</p>
                    <p><strong>Destinatarios:</strong> ${data.newsletter.sentTo}</p>
                    <p><strong>Éxitos:</strong> <span class="text-success">${data.newsletter.successCount}</span></p>
                    <p><strong>Fallos:</strong> <span class="text-danger">${data.newsletter.failureCount}</span></p>
                    <p><strong>Enviado:</strong> ${new Date(data.newsletter.sentAt).toLocaleString('es-MX')}</p>
                </div>
            `;

            // Limpiar formulario
            document.getElementById('subject').value = '';
            document.getElementById('contentEditor').innerHTML = '<h2>📢 Título de tu Newsletter</h2><p>Escribe aquí el contenido...</p>';
            document.getElementById('targetCategory').value = 'all';

            // Actualizar estadísticas
            await loadStatistics();
        } else {
            throw new Error(data.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('❌ Error enviando newsletter:', error);

        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-triangle me-2"></i>Error al Enviar</h5>
                <p>${error.message}</p>
                <small>Verifica que haya suscriptores activos y que el servidor esté funcionando.</small>
            </div>
        `;
    } finally {
        spinner.classList.remove('active');
    }
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Formulario de newsletter
    const form = document.getElementById('newsletterForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const subject = document.getElementById('subject').value.trim();
        const content = document.getElementById('contentEditor').innerHTML;
        const targetCategory = document.getElementById('targetCategory').value;

        if (!subject) {
            showAlert('warning', 'Por favor ingresa un asunto');
            return;
        }

        if (!content || content.trim() === '') {
            showAlert('warning', 'Por favor ingresa contenido para la newsletter');
            return;
        }

        // Confirmar envío
        const confirmSend = confirm(`¿Enviar newsletter a la categoría "${targetCategory}"?`);
        if (confirmSend) {
            await sendNewsletter(subject, content, targetCategory);
        }
    });

    // Búsqueda de suscriptores
    const searchInput = document.getElementById('searchSubscriber');
    searchInput.addEventListener('input', filterSubscribers);

    // Filtros
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');

    filterCategory.addEventListener('change', filterSubscribers);
    filterStatus.addEventListener('change', filterSubscribers);

    // Al cambiar de tab, cargar datos
    document.getElementById('history-tab').addEventListener('shown.bs.tab', () => {
        loadNewsletterHistory();
    });

    document.getElementById('subscribers-tab').addEventListener('shown.bs.tab', () => {
        loadSubscribers();
    });
}

// ============================================
// FILTRAR SUSCRIPTORES
// ============================================

function filterSubscribers() {
    const searchTerm = document.getElementById('searchSubscriber').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStatus').value;

    let filtered = [...subscribers];

    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(sub =>
            sub.email.toLowerCase().includes(searchTerm) ||
            sub.name.toLowerCase().includes(searchTerm)
        );
    }

    // Filtrar por categoría
    if (categoryFilter) {
        filtered = filtered.filter(sub =>
            sub.categories.includes(categoryFilter)
        );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        filtered = filtered.filter(sub => sub.active === isActive);
    }

    renderSubscribers(filtered);
}

// ============================================
// EDITOR DE TEXTO - FORMATEO
// ============================================

function formatText(command) {
    document.execCommand(command, false, null);
}

function insertHeading(level) {
    document.execCommand('formatBlock', false, `<h${level}>`);
}

function insertLink() {
    const url = prompt('Ingresa la URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
}

// ============================================
// VISTA PREVIA
// ============================================

function previewNewsletter() {
    const subject = document.getElementById('subject').value;
    const content = document.getElementById('contentEditor').innerHTML;

    const previewWindow = window.open('', '_blank', 'width=700,height=800');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Vista Previa - ${subject}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f4f4f4;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                    margin: -30px -30px 30px -30px;
                }
                .content {
                    color: #333;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 BGE Héroes de la Patria</h1>
                    <p>${subject}</p>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p><strong>Bachillerato General Estatal "Héroes de la Patria"</strong></p>
                    <p>📧 contacto.heroesdelapatria.sep@gmail.com</p>
                    <p style="font-size: 11px; color: #999;">
                        Esta es una vista previa. Los enlaces de cancelación aparecerán en el email real.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
}

// ============================================
// UTILIDADES
// ============================================

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.querySelector('.admin-container').insertBefore(
        alertDiv,
        document.querySelector('.stats-grid')
    );

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Exponer funciones globales
window.loadSubscribers = loadSubscribers;
window.loadNewsletterHistory = loadNewsletterHistory;
window.viewNewsletterDetail = viewNewsletterDetail;
window.formatText = formatText;
window.insertHeading = insertHeading;
window.insertLink = insertLink;
window.previewNewsletter = previewNewsletter;
