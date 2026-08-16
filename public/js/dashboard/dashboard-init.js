/**
 * 📊 DASHBOARD INITIALIZATION - Inicialización principal del Admin Dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha extracción: 19 Nov 2025
 * Líneas originales: 5181-6213 (1032 líneas)
 */

(function () {
    'use strict';

    // ================================================================
    // 📊 FUNCIONES DE REPORTES Y GESTIÓN DE CONTENIDO
    // ================================================================

    // Función para refrescar estadísticas del dashboard
    window.refreshStats = function () {
        console.log('🔄 [STATS] Actualizando estadísticas del dashboard...');

        if (window.adminDashboard && typeof window.adminDashboard.refreshStats === 'function') {
            window.adminDashboard.refreshStats();
            alert('✅ Estadísticas actualizadas correctamente');
        } else {
            console.warn('⚠️ [STATS] AdminDashboard no está inicializado o refreshStats no existe');
            alert('⚠️ Error al actualizar estadísticas. Verifica que el dashboard esté cargado.');
        }
    }

    // Función para ver contenido por tipo (noticias, eventos, avisos, comunicados)
    window.viewContentType = function (type) {
        console.log(`👁️ [VIEW] Visualizando contenido tipo: ${type}`);
        displayContentByType(type);
    }

    // Función para mostrar contenido según el tipo
    function displayContentByType(type) {
        const titles = {
            noticias: '📰 Noticias Publicadas',
            eventos: '📅 Eventos Programados',
            avisos: '⚠️ Avisos del Sistema',
            comunicados: '📋 Comunicados Oficiales'
        };

        alert(`${titles[type] || 'Contenido'}\n\n` +
            `Esta sección mostraría una vista detallada de todos los ${type}.\n\n` +
            `Funcionalidades:\n` +
            `• Listado completo con paginación\n` +
            `• Filtros por fecha, estado, categoría\n` +
            `• Búsqueda de texto completo\n` +
            `• Vista previa antes de publicar\n` +
            `• Edición y eliminación\n\n` +
            `En desarrollo para la próxima versión.`);
    }

    // Función para editar contenido
    window.editContent = function (type, id) {
        console.log(`✏️ [EDIT] Editando ${type} con ID: ${id}`);
        alert(`✏️ Editar ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n` +
            `ID: ${id}\n\n` +
            `Esta función cargaría el editor con el contenido existente para permitir modificaciones.\n\n` +
            `Funcionalidades:\n` +
            `• Carga de datos desde la BD\n` +
            `• Editor WYSIWYG TinyMCE\n` +
            `• Guardado con versionado\n` +
            `• Vista previa en tiempo real\n\n` +
            `En desarrollo.`);
    }

    // Función para eliminar contenido
    window.deleteContent = function (type, id) {
        console.log(`🗑️ [DELETE] Eliminando ${type} con ID: ${id}`);

        if (confirm(`¿Estás seguro de eliminar este ${type}?\n\nEsta acción no se puede deshacer.`)) {
            alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} eliminado correctamente.\n\n` +
                `En la versión completa, esto eliminaría el registro de la base de datos.`);
        }
    }

    // Funciones para crear contenido nuevo
    window.showCreateNoticiaModal = function () {
        console.log('📰 [CREATE] Abriendo modal de crear noticia...');
        alert('📰 Crear Nueva Noticia\n\nModal de creación con editor TinyMCE (en desarrollo)');
    }

    window.showCreateEventoModal = function () {
        console.log('📅 [CREATE] Abriendo modal de crear evento...');
        alert('📅 Crear Nuevo Evento\n\nModal de creación con calendario (en desarrollo)');
    }

    window.showCreateAvisoModal = function () {
        console.log('⚠️ [CREATE] Abriendo modal de crear aviso...');
        alert('⚠️ Crear Nuevo Aviso\n\nModal de creación con prioridades (en desarrollo)');
    }

    window.showCreateComunicadoModal = function () {
        console.log('📋 [CREATE] Abriendo modal de crear comunicado...');
        alert('📋 Crear Nuevo Comunicado\n\nModal de creación formal (en desarrollo)');
    }

    // ================================================================
    // 📊 SISTEMA DE REPORTES
    // ================================================================

    window.generateReport = function (type) {
        console.log(`📊 [REPORT] Generando reporte tipo: ${type}`);

        const reports = {
            estudiantes: {
                title: '👨‍🎓 Reporte de Estudiantes',
                description: 'Lista completa de estudiantes activos con estadísticas de rendimiento académico'
            },
            docentes: {
                title: '👨‍🏫 Reporte de Docentes',
                description: 'Registro de docentes con materias asignadas y horarios'
            },
            calificaciones: {
                title: '📈 Reporte de Calificaciones',
                description: 'Análisis de calificaciones por materia, grupo y período'
            },
            asistencia: {
                title: '📋 Reporte de Asistencia',
                description: 'Control de asistencias y faltas por estudiante y fecha'
            },
            finanzas: {
                title: '💰 Reporte Financiero',
                description: 'Estado de pagos, ingresos y gastos del período'
            },
            general: {
                title: '📊 Reporte General del Sistema',
                description: 'Resumen ejecutivo con todas las métricas principales'
            }
        };

        const report = reports[type] || reports.general;

        alert(`${report.title}\n\n${report.description}\n\n` +
            `Incluye:\n` +
            `• Gráficas y estadísticas\n` +
            `• Tablas detalladas\n` +
            `• Análisis comparativo\n` +
            `• Exportación a PDF/Excel\n\n` +
            `Generando reporte...`);
    }

    window.downloadReport = function (type) {
        console.log(`📥 [DOWNLOAD] Descargando reporte "${type}" en formato PDF...`);
        alert(`📥 Descargando Reporte "${type}"\n\n` +
            `Formato: PDF\n` +
            `Incluye: Gráficas, tablas y análisis detallado\n\n` +
            `En la versión completa, esto generaría un PDF real con los datos actuales del sistema.`);
    }

    window.exportReport = function (type) {
        console.log(`📊 [EXPORT] Exportando reporte "${type}" en formato Excel...`);
        alert(`📊 Exportando reporte "${type}" en formato Excel...\n\n` +
            `En la versión completa, esto generaría un archivo Excel real con los datos actuales del sistema.`);
    }

    // ================================================================
    // 🚀 INICIALIZACIÓN DEL DASHBOARD ADMINISTRATIVO
    // ================================================================

    // Esperar a que el BGE Framework esté listo
    function waitForBGEFramework() {
        return new Promise((resolve) => {
            if ((window.BGE && typeof window.BGE.initialized === 'function' && window.BGE.initialized()) ||
                (window.bgeFramework && window.bgeFramework.initialized) ||
                window.secureAdminAuth) {
                resolve();
                return;
            }

            const readyHandler = () => {
                window.removeEventListener('bge:ready', readyHandler);
                resolve();
            };

            window.addEventListener('bge:ready', readyHandler);

            setTimeout(() => {
                window.removeEventListener('bge:ready', readyHandler);
                resolve();
            }, 1000);
        });
    }

    document.addEventListener('DOMContentLoaded', async function () {
        await waitForBGEFramework();

        function initializeDashboard() {
            if (window.adminDashboard) {
                return true;
            }

            if (typeof AdminDashboard === 'undefined') {
                return false;
            }

            try {
                window.adminDashboard = new AdminDashboard();
                return true;
            } catch (error) {
                return false;
            }
        }

        function initializeCharts() {
            if (typeof Chart === 'undefined' || !window.adminDashboard) {
                return false;
            }

            try {
                const canvas = document.getElementById('academicChart');
                if (!canvas) return false;

                window.adminDashboard.createAcademicChart();
                return true;
            } catch (error) {
                return false;
            }
        }

        function initializeTabListeners() {

            // Event listener para tab Estudiantes
            const studentsTab = document.getElementById('students-tab');
            if (studentsTab) {
                studentsTab.addEventListener('shown.bs.tab', function () {
                    if (window.adminDashboard && typeof window.adminDashboard.loadStudentsTable === 'function') {
                        window.adminDashboard.loadStudentsTable();
                    }
                });
            }

            // Event listener para tab Padres
            const parentsTab = document.getElementById('parents-tab');
            if (parentsTab) {
                parentsTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.parentManager) {
                        window.parentManager = new ParentManager();
                        await window.parentManager.init();
                    } else {
                        await window.parentManager.loadParents();
                    }
                });
            }

            // Event listener para tab Citas
            const citasTab = document.getElementById('citas-tab');
            if (citasTab) {
                citasTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.citasManager) {
                        window.citasManager = new CitasManager();
                        await window.citasManager.init();
                    } else {
                        await window.citasManager.loadCitas();
                    }
                });
            }

            // Event listener para tab Solicitudes
            const registrationsTab = document.getElementById('registrations-tab');
            if (registrationsTab) {
                registrationsTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.solicitudesManager) {
                        window.solicitudesManager = new SolicitudesManager();
                        await window.solicitudesManager.init();
                    } else {
                        await window.solicitudesManager.loadSolicitudes();
                    }
                });
            }

            // Event listener para tab Usuarios Activos
            const activeUsersTab = document.getElementById('activeusers-tab');
            if (activeUsersTab) {
                activeUsersTab.addEventListener('shown.bs.tab', function () {
                    if (window.adminDashboard && typeof window.adminDashboard.loadActiveUsers === 'function') {
                        window.adminDashboard.loadActiveUsers();
                    }
                });
            }

            // Event listener para tab Egresados
            const egresadosTab = document.getElementById('egresados-tab');
            if (egresadosTab) {
                egresadosTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.egresadosDashboard) {
                        window.egresadosDashboard = new EgresadosDashboard();
                        await window.egresadosDashboard.init();
                    } else {
                        await window.egresadosDashboard.loadEgresados();
                    }
                });
            }

            // Event listener para tab Bolsa de Trabajo
            const bolsaTab = document.getElementById('bolsa-trabajo-tab');
            if (bolsaTab) {
                bolsaTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.bolsaManager) {
                        window.bolsaManager = new BolsaTrabajoManager();
                        await window.bolsaManager.init();
                    } else {
                        await window.bolsaManager.cargarCandidatos();
                    }
                });
            }

            // Event listener para tab Suscriptores
            const suscriptoresTab = document.getElementById('suscriptores-tab');
            if (suscriptoresTab) {
                suscriptoresTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.suscriptoresManager) {
                        window.suscriptoresManager = new SuscriptoresManager();
                        await window.suscriptoresManager.init();
                    } else {
                        await window.suscriptoresManager.cargarSuscriptores();
                    }
                });
            }

            // Event listener para tab Finanzas
            const financesTab = document.getElementById('finances-tab');
            if (financesTab) {
                financesTab.addEventListener('shown.bs.tab', async function () {
                    if (!window.dynamicFinanceLoader) {
                        window.dynamicFinanceLoader = new DynamicFinanceLoader();
                        await window.dynamicFinanceLoader.init();
                    } else {
                        await window.dynamicFinanceLoader.loadFinances();
                    }
                });
            }
        }

        // Paso 1: Verificar que AdminDashboard esté definido
        if (typeof AdminDashboard === 'undefined') {
            setTimeout(() => {
                if (initializeDashboard()) {
                    initializeTabListeners();
                    setTimeout(initializeCharts, 500);
                }
            }, 500);
            return;
        }

        // Paso 2: Inicializar AdminDashboard
        if (!initializeDashboard()) {
            return;
        }

        // Paso 3: Inicializar listeners de tabs
        initializeTabListeners();

        // Paso 4: Inicializar gráficos
        setTimeout(initializeCharts, 500);
    });

    // ================================================================
    // 🔔 FUNCIONES DE NOTIFICACIONES
    // ================================================================

    // Función para panel de gestión de notificaciones
    window.openNotificationPanel = function () {
        console.log('🔔 [NOTIFICATIONS] Abriendo panel de gestión de notificaciones...');

        const notificationModal = document.createElement('div');
        notificationModal.className = 'modal fade';
        notificationModal.id = 'notificationManagementModal';
        notificationModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-bell me-2"></i>Gestión de Notificaciones Push
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="fas fa-paper-plane me-2"></i>Enviar Notificación</h6>
                                <form id="notificationForm">
                                    <div class="mb-3">
                                        <label class="form-label">Título</label>
                                        <input type="text" class="form-control" id="notificationTitle" placeholder="Ej: Recordatorio importante">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Mensaje</label>
                                        <textarea class="form-control" id="notificationMessage" rows="3" placeholder="Escribe tu mensaje aquí..."></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Destinatarios</label>
                                        <select class="form-select" id="notificationTargets">
                                            <option value="all">Todos los usuarios</option>
                                            <option value="students">Solo estudiantes</option>
                                            <option value="parents">Solo padres</option>
                                            <option value="teachers">Solo docentes</option>
                                        </select>
                                    </div>
                                    <button type="button" class="btn btn-warning" data-action="sendNotification">
                                        <i class="fas fa-send me-2"></i>Enviar Ahora
                                    </button>
                                </form>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="fas fa-history me-2"></i>Notificaciones Recientes</h6>
                                <div class="list-group">
                                    <div class="list-group-item">
                                        <strong>Inicio de clases</strong>
                                        <br><small class="text-muted">Enviado hace 2 horas - 1,247 usuarios</small>
                                    </div>
                                    <div class="list-group-item">
                                        <strong>Recordatorio de pagos</strong>
                                        <br><small class="text-muted">Enviado ayer - 156 padres</small>
                                    </div>
                                    <div class="list-group-item">
                                        <strong>Reunión docentes</strong>
                                        <br><small class="text-muted">Enviado hace 3 días - 68 docentes</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('notificationManagementModal');
        if (existingModal) existingModal.remove();

        // Agregar y mostrar modal
        document.body.appendChild(notificationModal);
        const modalInstance = new bootstrap.Modal(notificationModal);
        modalInstance.show();

        // Limpiar cuando se cierre
        notificationModal.addEventListener('hidden.bs.modal', function () {
            notificationModal.remove();
        });
    }

    // Función para enviar notificación
    window.sendNotification = function () {
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;
        const targets = document.getElementById('notificationTargets').value;

        if (!title || !message) {
            alert('⚠️ Por favor completa el título y mensaje de la notificación');
            return;
        }

        console.log('📤 [NOTIFICATION] Enviando notificación:', { title, message, targets });

        // Simular envío exitoso
        alert(`✅ Notificación enviada exitosamente!\n\nTítulo: ${title}\nDestinatarios: ${targets}\n\nEn la versión completa, esto enviaría una notificación push real a los dispositivos de los usuarios.`);

        // Limpiar formulario
        document.getElementById('notificationTitle').value = '';
        document.getElementById('notificationMessage').value = '';

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('notificationManagementModal'));
        modal.hide();
    }

    // ================================================================
    // ⚙️ FUNCIONES DE CONFIGURACIÓN DEL SISTEMA
    // ================================================================

    // Función para configurar estadísticas (botón "Configurar Estadísticas")
    window.openStatsConfiguration = function () {
        console.log('⚙️ [STATS] Abriendo configuración de estadísticas...');

        // Buscar el modal existente y abrirlo
        const existingModal = document.getElementById('statisticsConfigModal');
        if (existingModal) {
            const modalInstance = new bootstrap.Modal(existingModal);
            modalInstance.show();
        } else {
            alert('⚠️ Modal de configuración de estadísticas no encontrado en el DOM');
        }
    }

    // Función para abrir sistema de pagos
    window.openPaymentSystem = function () {
        console.log('💰 [PAYMENTS] Abriendo sistema de pagos...');
        alert('💳 Sistema de Pagos\n\nEsta funcionalidad conectaría con:\n• Registro de pagos\n• Control de vencimientos\n• Alertas automáticas\n• Comunicados a padres\n• Reportes financieros\n\nEn desarrollo para la próxima versión.');
    }

    // Función para calendario académico
    window.openAcademicCalendar = function () {
        console.log('📅 [CALENDAR] Abriendo calendario académico...');
        alert('📅 Calendario Académico\n\nFuncionalidades incluidas:\n• Planificación de eventos\n• Fechas de exámenes\n• Períodos vacacionales\n• Notificaciones automáticas\n• Eventos importantes\n\nSistema en desarrollo.');
    }

    // Función para configuración del sistema
    window.openSystemConfiguration = function () {
        console.log('⚙️ [CONFIG] Abriendo configuración del sistema...');
        alert('🔧 Configuración del Sistema\n\nOpciones disponibles:\n• Configuración institucional\n• Personalización de reportes\n• Gestión de usuarios\n• Respaldos automáticos\n\nPanel de administración avanzado en construcción.');
    }

    // ================================================================
    // 🔐 FUNCIONES DE AUTENTICACIÓN Y SESIÓN
    // ================================================================

    // Función para hacer login de admin
    window.loginAdmin = function () {
        console.log('🔐 [LOGIN] Iniciando proceso de login...');
        // Esta función debe delegar al sistema de autenticación existente
        if (typeof handleAdminLogin === 'function') {
            handleAdminLogin();
        } else {
            console.warn('⚠️ handleAdminLogin no está disponible');
        }
    }

    // Función para logout del admin
    window.logoutAdmin = function () {
        console.log('👋 [LOGOUT] Cerrando sesión...');
        if (typeof window.secureAdminAuth !== 'undefined' && typeof window.secureAdminAuth.logout === 'function') {
            window.secureAdminAuth.logout();
            window.location.href = 'index.html';
        } else {
            console.warn('⚠️ Sistema de autenticación no disponible');
        }
    }

    // ================================================================
    // 🔄 FUNCIONES DE RECARGA Y REFRESH
    // ================================================================

    // Función para refrescar el dashboard
    window.refreshDashboard = function () {
        console.log('🔄 [REFRESH] Refrescando dashboard...');
        location.reload();
    }

    // Función para recargar estudiantes
    window.reloadStudents = function () {
        console.log('👨‍🎓 [STUDENTS] Recargando lista de estudiantes...');
        if (typeof window.dynamicStudentLoader !== 'undefined' && typeof window.dynamicStudentLoader.loadStudents === 'function') {
            window.dynamicStudentLoader.loadStudents();
        } else {
            alert('⚠️ El cargador de estudiantes no está disponible');
        }
    }

    // Función para recargar docentes
    window.reloadTeachers = function () {
        console.log('👨‍🏫 [TEACHERS] Recargando lista de docentes...');
        if (typeof window.dynamicTeacherLoader !== 'undefined' && typeof window.dynamicTeacherLoader.loadTeachers === 'function') {
            window.dynamicTeacherLoader.loadTeachers();
        } else {
            alert('⚠️ El cargador de docentes no está disponible');
        }
    }

    // ================================================================
    // 📰 FUNCIONES ADICIONALES DE CMS Y GESTIÓN DE CONTENIDO
    // ================================================================

    window.exportAllContent = function () {
        console.log('📥 Exportar contenido');
        alert('Exportando contenido (en desarrollo)');
    }

    window.refreshContentStats = function () {
        console.log('🔄 Refrescar stats');
        alert('Refrescando estadísticas (en desarrollo)');
    }

    window.showContentPreview = function () {
        console.log('👁️ Vista previa');
        alert('Vista previa de contenido (en desarrollo)');
    }

    window.clearNoticiaForm = function () {
        console.log('🗑️ Limpiar formulario noticia');
    }

    window.refreshNoticiasList = function () {
        console.log('🔄 Refrescar noticias');
    }

    window.clearEventoForm = function () {
        console.log('🗑️ Limpiar formulario evento');
    }

    window.refreshEventosList = function () {
        console.log('🔄 Refrescar eventos');
    }

    window.clearAvisoForm = function () {
        console.log('🗑️ Limpiar formulario aviso');
    }

    window.refreshAvisosList = function () {
        console.log('🔄 Refrescar avisos');
    }

    window.clearComunicadoForm = function () {
        console.log('🗑️ Limpiar formulario comunicado');
    }

    window.refreshComunicadosList = function () {
        console.log('🔄 Refrescar comunicados');
    }

    window.showReportsManager = function () {
        console.log('📊 Gestor de reportes');
        alert('Gestor de reportes (en desarrollo)');
    }

    // ================================================================
    // 🔑 FUNCIÓN DE CAMBIO DE CONTRASEÑA
    // ================================================================

    // Función para cambiar contraseña
    window.showChangePasswordModal = function () {
        console.log('🔑 [PASSWORD] Abriendo modal de cambio de contraseña...');

        const passwordModal = document.createElement('div');
        passwordModal.className = 'modal fade';
        passwordModal.id = 'changePasswordModal';
        passwordModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-key me-2"></i>Cambiar Contraseña
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="changePasswordForm">
                            <div class="mb-3">
                                <label class="form-label">Contraseña Actual</label>
                                <input type="password" class="form-control" id="currentPassword" placeholder="Ingresa tu contraseña actual" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nueva Contraseña</label>
                                <input type="password" class="form-control" id="newPassword" placeholder="Mínimo 8 caracteres" required minlength="8">
                                <small class="text-muted">Debe contener al menos 8 caracteres</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Confirmar Nueva Contraseña</label>
                                <input type="password" class="form-control" id="confirmPassword" placeholder="Repite la nueva contraseña" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" data-action="changePassword">
                            <i class="fas fa-save me-2"></i>Cambiar Contraseña
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('changePasswordModal');
        if (existingModal) existingModal.remove();

        // Agregar y mostrar modal
        document.body.appendChild(passwordModal);
        const modalInstance = new bootstrap.Modal(passwordModal);
        modalInstance.show();

        // Limpiar cuando se cierre
        passwordModal.addEventListener('hidden.bs.modal', function () {
            passwordModal.remove();
        });
    }

    // Función para ejecutar cambio de contraseña
    window.changePassword = function () {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('⚠️ Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('⚠️ Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 8) {
            alert('⚠️ La contraseña debe tener al menos 8 caracteres');
            return;
        }

        console.log('🔑 [PASSWORD] Cambiando contraseña...');

        // Aquí iría la lógica real de cambio de contraseña
        alert('✅ Contraseña cambiada exitosamente!\n\nEn la versión completa, esto actualizaría tu contraseña en el servidor.');

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
    }
})();
