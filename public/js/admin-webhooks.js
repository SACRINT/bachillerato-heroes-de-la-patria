/**
 * 🛰️ CLIENTE JAVASCRIPT: PANEL DE ADMINISTRACIÓN DE WEBHOOKS
 * public/js/admin-webhooks.js
 * 
 * Funcionalidades:
 * - Carga de suscripciones y bitácora histórica de entregas
 * - Generador de secretos criptográficos HMAC seguros en el cliente (Web Crypto)
 * - Registro y eliminación de suscripciones
 * - Despacho de prueba interactivo (Ping) con reporte de latencia y código HTTP
 * - Procesador manual de cola de reintentos
 * - Modal de inspección de payloads canónicos y respuestas de servidor
 */

(function () {
    'use strict';

    const API_BASE = '/api/webhooks';

    // Estado local
    let currentSubscriptions = [];
    let currentLogs = [];
    let isProcessing = false;

    /**
     * Obtener token JWT institucional desde el almacenamiento local
     */
    function getAuthToken() {
        if (window.getGlobalAdminToken && typeof window.getGlobalAdminToken === 'function') {
            const t = window.getGlobalAdminToken();
            if (t) return t;
        }

        const directToken = localStorage.getItem('bge_auth_token') || localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (directToken) return directToken;

        try {
            const sess = JSON.parse(localStorage.getItem('adminSession') || '{}');
            if (sess.token) return sess.token;
        } catch (e) {}

        return '';
    }

    /**
     * Cabeceras HTTP estándar para peticiones
     */
    function getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    /**
     * Mostrar alerta visual flotante
     */
    function showAlert(message, type = 'success', timeout = 4000) {
        const placeholder = document.getElementById('liveAlertPlaceholder');
        if (!placeholder) return;

        const alertId = 'alert_' + Date.now();
        const iconMap = {
            success: 'fa-check-circle',
            danger: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const icon = iconMap[type] || 'fa-info-circle';

        const wrapper = document.createElement('div');
        wrapper.id = alertId;
        wrapper.className = `alert alert-${type} alert-dismissible fade show shadow-sm d-flex align-items-center gap-2 mb-3`;
        wrapper.role = 'alert';
        wrapper.innerHTML = `
            <i class="fas ${icon} fs-5"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        placeholder.innerHTML = '';
        placeholder.appendChild(wrapper);

        if (timeout > 0) {
            setTimeout(() => {
                const el = document.getElementById(alertId);
                if (el) {
                    const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
                    bsAlert.close();
                }
            }, timeout);
        }
    }

    /**
     * Generar Secreto Criptográfico HMAC Seguro (whsec_ + 64 hex chars)
     * Utiliza estrictamente la Web Crypto API (window.crypto.getRandomValues).
     * No utiliza Math.random() para evitar secretos predecibles.
     */
    function generateClientSecret() {
        if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) {
            showAlert('Tu navegador no soporta Web Crypto API segura (window.crypto). No es posible generar el secreto.', 'danger', 5000);
            throw new Error('window.crypto.getRandomValues no disponible');
        }
        const arr = new Uint8Array(32);
        window.crypto.getRandomValues(arr);
        const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
        return `whsec_${hex}`;
    }

    /**
     * Cargar Métricas Generales (KPIs)
     */
    async function loadStats() {
        try {
            const res = await fetch(`${API_BASE}/stats`, { headers: getHeaders() });
            const data = await res.json();

            if (data.success && data.stats) {
                document.getElementById('kpiActiveWebhooks').textContent = data.stats.activeSubscriptions || 0;
                document.getElementById('kpiDelivered').textContent = data.stats.successfulDeliveries || 0;
                document.getElementById('kpiPending').textContent = data.stats.pendingDeliveries || 0;
                document.getElementById('kpiRate').textContent = `${data.stats.successRate || 100}%`;
            }
        } catch (err) {
            console.warn('[WEBHOOKS-CLIENT] Error cargando stats:', err.message);
        }
    }

    /**
     * Cargar Suscripciones Registradas
     */
    async function loadSubscriptions() {
        const tbody = document.getElementById('webhooksTableBody');
        try {
            const res = await fetch(`${API_BASE}`, { headers: getHeaders() });
            const data = await res.json();

            if (!data.success) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">${data.error || 'Error cargando suscripciones'}</td></tr>`;
                return;
            }

            currentSubscriptions = data.subscriptions || [];
            document.getElementById('badgeSubsCount').textContent = `${currentSubscriptions.length} suscripciones`;

            if (currentSubscriptions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4"><i class="fas fa-inbox fs-3 d-block mb-2 text-secondary"></i>No hay webhooks registrados aún. Agrega uno con el formulario.</td></tr>`;
                return;
            }

            tbody.innerHTML = currentSubscriptions.map(sub => {
                const eventsBadges = (sub.events || []).map(ev => {
                    const isAll = ev === '*';
                    return `<span class="event-badge ${isAll ? 'bg-purple text-white' : ''}">${ev}</span>`;
                }).join('');

                const statusBadge = sub.active
                    ? `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill"><i class="fas fa-check-circle me-1"></i>Activo</span>`
                    : `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill"><i class="fas fa-pause-circle me-1"></i>Pausado</span>`;

                return `
                    <tr data-sub-id="${sub.id}">
                        <td>
                            <div class="fw-bold text-break font-monospace small">${escapeHtml(sub.url)}</div>
                            <div class="extra-small text-muted" style="font-size: 0.72rem;">
                                ID: ${sub.id} &bull; Creado: ${formatDate(sub.created_at)}
                            </div>
                        </td>
                        <td>
                            <div class="d-flex flex-wrap" style="max-width: 260px;">
                                ${eventsBadges}
                            </div>
                        </td>
                        <td>${statusBadge}</td>
                        <td class="text-end text-nowrap">
                            <button class="btn btn-sm btn-outline-primary rounded-pill btn-test-wh me-1" data-id="${sub.id}" title="Enviar prueba de conexión">
                                <i class="fas fa-paper-plane me-1"></i>Probar
                            </button>
                            <button class="btn btn-sm btn-outline-danger rounded-pill btn-delete-wh" data-id="${sub.id}" title="Eliminar webhook">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Asignar listeners a botones de prueba y eliminación
            attachTableActions();

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Error de conexión al cargar webhooks.</td></tr>`;
        }
    }

    /**
     * Cargar Bitácora de Entregas (Logs)
     */
    async function loadLogs() {
        const tbody = document.getElementById('logsTableBody');
        const filterSelect = document.getElementById('logStatusFilter');
        const status = filterSelect ? filterSelect.value : '';

        try {
            let url = `${API_BASE}/logs?limit=30`;
            if (status) url += `&status=${encodeURIComponent(status)}`;

            const res = await fetch(url, { headers: getHeaders() });
            const data = await res.json();

            if (!data.success) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Error cargando bitácora.</td></tr>`;
                return;
            }

            currentLogs = data.logs || [];

            if (currentLogs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i class="fas fa-history fs-3 d-block mb-2 text-secondary"></i>No hay registros de entrega recientes.</td></tr>`;
                return;
            }

            tbody.innerHTML = currentLogs.map(log => {
                let statusBadge = '';
                if (log.status === 'delivered') {
                    statusBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="fas fa-check me-1"></i>${log.response_code || 200} OK</span>`;
                } else if (log.status === 'pending') {
                    statusBadge = `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1"><i class="fas fa-clock me-1"></i>${log.response_code || 'Err'} (Reintento)</span>`;
                } else {
                    statusBadge = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="fas fa-times me-1"></i>${log.response_code || 'Err'} Fallido</span>`;
                }

                return `
                    <tr>
                        <td class="font-monospace small text-muted">#${log.id}</td>
                        <td>
                            <span class="event-badge">${escapeHtml(log.event)}</span>
                            <div class="extra-small text-muted font-monospace text-truncate" style="max-width: 160px;">
                                ${escapeHtml(log.url || '')}
                            </div>
                        </td>
                        <td>${statusBadge}</td>
                        <td>
                            <span class="badge bg-light text-dark border">
                                ${log.attempts || 1}/5
                            </span>
                        </td>
                        <td class="extra-small text-muted text-nowrap">
                            ${formatDate(log.delivered_at || log.created_at)}
                        </td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-light border rounded-pill btn-inspect-log" data-log-id="${log.id}">
                                <i class="fas fa-eye me-1"></i>Ver
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Asignar listeners a botones de inspección
            document.querySelectorAll('.btn-inspect-log').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const logId = parseInt(btn.getAttribute('data-log-id'));
                    const logEntry = currentLogs.find(l => l.id === logId);
                    if (logEntry) showLogModal(logEntry);
                });
            });

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Error de red al cargar bitácora.</td></tr>`;
        }
    }

    /**
     * Listeners de Acciones en Tabla de Suscripciones
     */
    function attachTableActions() {
        // Botón Probar Webhook
        document.querySelectorAll('.btn-test-wh').forEach(btn => {
            btn.addEventListener('click', async () => {
                const subId = btn.getAttribute('data-id');
                const originalHtml = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Probando...`;

                try {
                    const res = await fetch(`${API_BASE}/${subId}/test`, {
                        method: 'POST',
                        headers: getHeaders()
                    });
                    const result = await res.json();

                    if (result.success) {
                        showAlert(`✅ Prueba exitosa: ${result.message}`, 'success');
                    } else {
                        showAlert(`⚠️ Respuesta de prueba: ${result.message}`, 'warning', 6000);
                    }

                    // Refrescar bitácora y stats de inmediato
                    loadStats();
                    loadLogs();
                } catch (err) {
                    showAlert(`❌ Error ejecutando prueba: ${err.message}`, 'danger');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            });
        });

        // Botón Eliminar Webhook
        document.querySelectorAll('.btn-delete-wh').forEach(btn => {
            btn.addEventListener('click', async () => {
                const subId = btn.getAttribute('data-id');
                if (!confirm(`¿Estás seguro de eliminar el webhook #${subId}? Se cancelarán todas las entregas pendientes asociadas.`)) {
                    return;
                }

                try {
                    const res = await fetch(`${API_BASE}/${subId}`, {
                        method: 'DELETE',
                        headers: getHeaders()
                    });
                    const result = await res.json();

                    if (result.success) {
                        showAlert('Webhook eliminado correctamente.', 'info');
                        loadSubscriptions();
                        loadStats();
                    } else {
                        showAlert(`Error al eliminar: ${result.error}`, 'danger');
                    }
                } catch (err) {
                    showAlert(`Error al eliminar: ${err.message}`, 'danger');
                }
            });
        });
    }

    /**
     * Mostrar Modal con Detalles del Log
     */
    function showLogModal(log) {
        document.getElementById('modalEventName').textContent = log.event;
        document.getElementById('modalTargetUrl').textContent = log.url || 'N/A';

        let statusHtml = `${log.response_code || 'Sin respuesta'} (${log.status})`;
        if (log.status === 'delivered') {
            statusHtml = `<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i>${log.response_code} OK</span>`;
        } else if (log.status === 'pending') {
            statusHtml = `<span class="text-warning fw-bold"><i class="fas fa-clock me-1"></i>${log.response_code || 'Error'} (Reintento programado)</span>`;
        } else {
            statusHtml = `<span class="text-danger fw-bold"><i class="fas fa-times-circle me-1"></i>${log.response_code || 'Fallo'} Fallido definitivo</span>`;
        }
        document.getElementById('modalHttpStatus').innerHTML = statusHtml;

        // Payload formateado
        try {
            const parsed = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
            document.getElementById('modalPayloadJson').textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
            document.getElementById('modalPayloadJson').textContent = String(log.payload);
        }

        // Response body
        document.getElementById('modalResponseBody').textContent = log.response_body || '(Cuerpo de respuesta vacío)';

        const modalEl = document.getElementById('logModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    /**
     * Procesar Cola de Reintentos
     */
    async function handleProcessQueue() {
        const btn = document.getElementById('btnProcessQueue');
        if (!btn || isProcessing) return;

        isProcessing = true;
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Procesando...`;

        try {
            const res = await fetch(`${API_BASE}/process-queue`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ limit: 50 })
            });
            const data = await res.json();

            if (data.success) {
                showAlert(`⚡ ${data.message}`, 'info');
                loadStats();
                loadLogs();
            } else {
                showAlert(`Error procesando cola: ${data.error}`, 'danger');
            }
        } catch (err) {
            showAlert(`Error de conexión: ${err.message}`, 'danger');
        } finally {
            isProcessing = false;
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }

    /**
     * Manejar Formulario de Nuevo Webhook
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmitWebhook');
        const urlInput = document.getElementById('whUrl');
        const secretInput = document.getElementById('whSecret');
        const activeInput = document.getElementById('whActive');

        // Recolectar eventos seleccionados
        const selectedEvents = [];
        document.querySelectorAll('#eventsContainer input[type="checkbox"]:checked').forEach(cb => {
            selectedEvents.push(cb.value);
        });

        if (selectedEvents.length === 0) {
            showAlert('Debes seleccionar al menos un evento para suscribir.', 'warning');
            return;
        }

        const url = urlInput.value.trim();
        let secret = secretInput.value.trim();
        if (!secret) {
            try {
                secret = generateClientSecret();
                secretInput.value = secret;
            } catch (secErr) {
                showAlert('Por favor ingresa un secreto manualmente o usa un navegador moderno compatible con Web Crypto API.', 'warning', 5000);
                return;
            }
        }
        const active = activeInput.checked;

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Guardando...`;

        try {
            const res = await fetch(`${API_BASE}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    url,
                    secret,
                    events: selectedEvents,
                    active
                })
            });

            const result = await res.json();

            if (result.success) {
                showAlert(`🎉 Webhook registrado exitosamente (#${result.subscription.id}).`, 'success');
                // Limpiar formulario y regenerar secreto
                urlInput.value = '';
                try {
                    secretInput.value = generateClientSecret();
                } catch (e) {
                    secretInput.value = '';
                }
                loadSubscriptions();
                loadStats();
            } else {
                showAlert(`Error al guardar: ${result.error}`, 'danger');
            }
        } catch (err) {
            showAlert(`Error de red al guardar webhook: ${err.message}`, 'danger');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fas fa-save me-1"></i> Guardar y Activar Suscripción`;
        }
    }

    /**
     * Utilidades auxiliares
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('es-MX', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * Inicialización del Módulo
     */
    document.addEventListener('DOMContentLoaded', () => {
        // Inicializar Secreto Seguro por defecto
        const secretInput = document.getElementById('whSecret');
        if (secretInput && !secretInput.value) {
            try {
                secretInput.value = generateClientSecret();
            } catch (e) {
                console.warn('[WEBHOOKS-ADMIN] crypto no disponible al inicializar secreto:', e.message);
            }
        }

        // Botón Generar Secreto
        const btnGen = document.getElementById('btnGenerateSecret');
        if (btnGen) {
            btnGen.addEventListener('click', () => {
                try {
                    secretInput.value = generateClientSecret();
                    showAlert('Nuevo secreto HMAC generado con crypto seguro.', 'info', 2000);
                } catch (e) {
                    console.error('[WEBHOOKS-ADMIN] Error generando secreto seguro:', e.message);
                }
            });
        }

        // Botón Copiar Secreto
        const btnCopy = document.getElementById('btnCopySecret');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                if (secretInput.value) {
                    navigator.clipboard.writeText(secretInput.value).then(() => {
                        showAlert('Secreto copiado al portapapeles.', 'success', 2000);
                    });
                }
            });
        }

        // Botones Selección de Eventos
        const btnSelectAll = document.getElementById('btnSelectAllEvents');
        if (btnSelectAll) {
            btnSelectAll.addEventListener('click', () => {
                document.querySelectorAll('#eventsContainer input[type="checkbox"]').forEach(cb => cb.checked = true);
            });
        }

        const btnClear = document.getElementById('btnClearEvents');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                document.querySelectorAll('#eventsContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
            });
        }

        // Formulario
        const form = document.getElementById('webhookForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        // Botón Actualizar
        const btnRefresh = document.getElementById('btnRefresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                loadStats();
                loadSubscriptions();
                loadLogs();
                showAlert('Datos actualizados.', 'info', 1500);
            });
        }

        // Botón Procesar Cola
        const btnProcess = document.getElementById('btnProcessQueue');
        if (btnProcess) {
            btnProcess.addEventListener('click', handleProcessQueue);
        }

        // Filtro de estado de logs
        const filterSelect = document.getElementById('logStatusFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', loadLogs);
        }

        // Carga inicial de datos
        loadStats();
        loadSubscriptions();
        loadLogs();
    });

})();
