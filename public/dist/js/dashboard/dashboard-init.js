/**
 * 📊 DASHBOARD INITIALIZATION - Inicialización principal del Admin Dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha extracción: 19 Nov 2025
 * Líneas originales: 5181-6213 (1032 líneas)
 */

(function () {
    'use strict';

    console.log('✅ [DASHBOARD-INIT] Script de inicialización cargado');

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
            if (window.secureAdminAuth) {
                console.log('✅ [INIT] secureAdminAuth ya disponible');
                resolve();
                return;
            }

            console.log('⏳ [INIT] Esperando evento bge:ready...');
            window.addEventListener('bge:ready', (event) => {
                console.log('🎉 [INIT] Evento bge:ready recibido:', event.detail);
                resolve();
            });

            // Timeout de seguridad (5 segundos)
            setTimeout(() => {
                console.warn('⚠️ [INIT] Timeout esperando bge:ready, continuando...');
                resolve();
            }, 5000);
        });
    }

    document.addEventListener('DOMContentLoaded', async function () {
        console.log('🚀 [DASHBOARD] Inicializando AdminDashboard...');

        // ESPERAR a que el BGE Framework termine de cargar
        await waitForBGEFramework();
        console.log('✅ [INIT] BGE Framework listo, iniciando dashboard...');

        // Función para inicializar el dashboard
        function initializeDashboard() {
            console.log('🔧 [DASHBOARD] Inicializando AdminDashboard...');

            // ✅ CHECK: Si ya existe una instancia (desde bundle TypeScript), usarla
            if (window.adminDashboard) {
                console.log('✅ [DASHBOARD] Usando instancia existente de AdminDashboard (Bundle TS)');
                return true;
            }

            console.log('🔧 [DASHBOARD] Creando nueva instancia de AdminDashboard (Legacy)...');

            if (typeof AdminDashboard === 'undefined') {
                console.error('❌ [DASHBOARD] AdminDashboard no está definido');
                return false;
            }

            try {
                window.adminDashboard = new AdminDashboard();
                console.log('✅ [DASHBOARD] AdminDashboard inicializado correctamente');
                return true;
            } catch (error) {
                console.error('❌ [DASHBOARD] Error al inicializar AdminDashboard:', error);
                return false;
            }
        }

        // Función para inicializar los gráficos
        function initializeCharts() {
            console.log('📊 [CHARTS] Verificando Chart.js...');

            if (typeof Chart === 'undefined') {
                console.error('❌ [CHARTS] Chart.js no está disponible');
                return false;
            }

            console.log('📊 [CHARTS] Chart.js disponible, versión:', Chart.version);

            if (!window.adminDashboard) {
                console.error('❌ [CHARTS] AdminDashboard no está inicializado');
                return false;
            }

            try {
                const canvas = document.getElementById('academicChart');
                if (!canvas) {
                    console.error('❌ [CHARTS] Canvas academicChart no encontrado');
                    return false;
                }
                console.log('✅ [CHARTS] Canvas encontrado:', canvas);

                window.adminDashboard.createAcademicChart();
                console.log('✅ [CHARTS] Gráfico académico creado exitosamente');
                return true;
            } catch (error) {
                console.error('❌ [CHARTS] Error al crear gráfico:', error);
                return false;
            }
        }

        // Función para inicializar los event listeners de los tabs
        function initializeTabListeners() {
            console.log('📑 [TABS] Inicializando event listeners de tabs...');

            // Event listener para tab Estudiantes
            const studentsTab = document.getElementById('students-tab');
            if (studentsTab) {
                studentsTab.addEventListener('shown.bs.tab', function () {
                    console.log('👨‍🎓 [TAB] Cargando tabla de estudiantes...');
                    if (window.adminDashboard && typeof window.adminDashboard.loadStudentsTable === 'function') {
                        window.adminDashboard.loadStudentsTable();
                    } else {
                        console.error('❌ [TAB] loadStudentsTable no disponible');
                    }
                });
                console.log('✅ [TABS] Listener de estudiantes agregado');
            } else {
                console.warn('⚠️ [TABS] Tab students-tab no encontrado');
            }

            // Event listener para tab Padres
            const parentsTab = document.getElementById('parents-tab');
            if (parentsTab) {
                parentsTab.addEventListener('shown.bs.tab', async function () {
                    console.log('👨‍👩‍👧‍👦 [TAB] Inicializando Gestión de Padres...');
                    if (!window.parentManager) {
                        window.parentManager = new ParentManager();
                        await window.parentManager.init();
                    } else {
                        await window.parentManager.loadParents(); // Reload data if already initialized
                    }
                });
                console.log('✅ [TABS] Listener de padres agregado');
            } else {
                console.warn('⚠️ [TABS] Tab parents-tab no encontrado');
            }

            // Event listener para tab Citas
            const citasTab = document.getElementById('citas-tab');
            if (citasTab) {
                citasTab.addEventListener('shown.bs.tab', async function () {
                    console.log('📅 [TAB] Inicializando Gestión de Citas...');
                    if (!window.citasManager) {
                        window.citasManager = new CitasManager();
                        await window.citasManager.init();
                    } else {
                        await window.citasManager.loadCitas(); // Reload data if already initialized
                    }
                });
                console.log('✅ [TABS] Listener de citas agregado');
            } else {
                console.warn('⚠️ [TABS] Tab citas-tab no encontrado');
            }

            // Event listener para tab Solicitudes
            const registrationsTab = document.getElementById('registrations-tab');
            if (registrationsTab) {
                registrationsTab.addEventListener('shown.bs.tab', async function () {
                    console.log('📋 [TAB] Cargando solicitudes pendientes...');
                    if (!window.solicitudesManager) {
                        window.solicitudesManager = new SolicitudesManager();
                        await window.solicitudesManager.init();
                    } else {
                        await window.solicitudesManager.loadSolicitudes(); // Reload data if already initialized
                    }
                });
                console.log('✅ [TABS] Listener de solicitudes agregado');
            } else {
                console.warn('⚠️ [TABS] Tab registrations-tab no encontrado');
            }

            // Event listener para tab Usuarios Activos
            const activeUsersTab = document.getElementById('activeusers-tab');
            if (activeUsersTab) {
                activeUsersTab.addEventListener('shown.bs.tab', function () {
                    console.log('👥 [TAB] Cargando usuarios activos...');
                    if (window.adminDashboard && typeof window.adminDashboard.loadActiveUsers === 'function') {
                        window.adminDashboard.loadActiveUsers();
                    } else {
                        console.error('❌ [TAB] loadActiveUsers no disponible');
                    }
                });
                console.log('✅ [TABS] Listener de usuarios activos agregado');
            } else {
                console.warn('⚠️ [TABS] Tab activeusers-tab no encontrado');
            }

            // Event listener para tab Egresados
            const egresadosTab = document.getElementById('egresados-tab');
            if (egresadosTab) {
                egresadosTab.addEventListener('shown.bs.tab', async function () {
                    console.log('🎓 [TAB] Inicializando Gestión de Egresados...');
                    if (!window.egresadosDashboard) {
                        window.egresadosDashboard = new EgresadosDashboard();
                        await window.egresadosDashboard.init();
                    } else {
                        await window.egresadosDashboard.loadEgresados();
                    }
                });
                console.log('✅ [TABS] Listener de egresados agregado');
            } else {
                console.warn('⚠️ [TABS] Tab egresados-tab no encontrado');
            }

            // Event listener para tab Bolsa de Trabajo
            const bolsaTab = document.getElementById('bolsa-trabajo-tab');
            if (bolsaTab) {
                bolsaTab.addEventListener('shown.bs.tab', async function () {
                    console.log('💼 [TAB] Inicializando Bolsa de Trabajo...');
                    if (!window.bolsaManager) {
                        window.bolsaManager = new BolsaTrabajoManager();
                        await window.bolsaManager.init();
                    } else {
                        await window.bolsaManager.cargarCandidatos();
                    }
                });
                console.log('✅ [TABS] Listener de bolsa de trabajo agregado');
            } else {
                console.warn('⚠️ [TABS] Tab bolsa-trabajo-tab no encontrado');
            }

            // Event listener para tab Suscriptores
            const suscriptoresTab = document.getElementById('suscriptores-tab');
            if (suscriptoresTab) {
                suscriptoresTab.addEventListener('shown.bs.tab', async function () {
                    console.log('📧 [TAB] Inicializando Gestión de Suscriptores...');
                    if (!window.suscriptoresManager) {
                        window.suscriptoresManager = new SuscriptoresManager();
                        await window.suscriptoresManager.init();
                    } else {
                        await window.suscriptoresManager.cargarSuscriptores();
                    }
                });
                console.log('✅ [TABS] Listener de suscriptores agregado');
            } else {
                console.warn('⚠️ [TABS] Tab suscriptores-tab no encontrado');
            }

            // Event listener para tab Finanzas
            const financesTab = document.getElementById('finances-tab');
            if (financesTab) {
                financesTab.addEventListener('shown.bs.tab', async function () {
                    console.log('💰 [TAB] Inicializando Gestión Financiera...');
                    if (!window.dynamicFinanceLoader) {
                        window.dynamicFinanceLoader = new DynamicFinanceLoader();
                        await window.dynamicFinanceLoader.init();
                    } else {
                        await window.dynamicFinanceLoader.loadFinances(); // Reload data if already initialized
                    }
                });
                console.log('✅ [TABS] Listener de finanzas agregado');
            } else {
                console.warn('⚠️ [TABS] Tab finances-tab no encontrado');
            }

            console.log('✅ [TABS] Todos los listeners de tabs inicializados');
        }

        // Secuencia de inicialización
        console.log('🔄 [INIT] Iniciando secuencia de inicialización...');

        // Paso 1: Verificar que AdminDashboard esté definido
        if (typeof AdminDashboard === 'undefined') {
            console.warn('⚠️ [INIT] AdminDashboard aún no está definido, esperando 1 segundo...');
            setTimeout(() => {
                if (initializeDashboard()) {
                    initializeTabListeners();
                    // Dar tiempo para que Chart.js cargue
                    setTimeout(() => {
                        initializeCharts();
                    }, 500);
                }
            }, 1000);
            return;
        }

        // Paso 2: Inicializar AdminDashboard
        if (!initializeDashboard()) {
            console.error('❌ [INIT] No se pudo inicializar el dashboard');
            return;
        }

        // Paso 3: Inicializar listeners de tabs
        initializeTabListeners();

        // Paso 4: Inicializar gráficos (con delay para Chart.js)
        if (typeof Chart !== 'undefined') {
            console.log('✅ [INIT] Chart.js ya disponible, creando gráficos...');
            setTimeout(() => {
                initializeCharts();
            }, 500);
        } else {
            console.warn('⚠️ [INIT] Chart.js no disponible, esperando 1.5 segundos...');
            setTimeout(() => {
                if (!initializeCharts()) {
                    // Segundo intento después de 2 segundos más
                    console.warn('⚠️ [INIT] Primer intento fallido, reintentando en 2 segundos...');
                    setTimeout(() => {
                        initializeCharts();
                    }, 2000);
                }
            }, 1500);
        }

        console.log('✅ [INIT] Secuencia de inicialización completada');
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

    console.log('✅ [DASHBOARD-INIT] Todas las funciones del dashboard cargadas correctamente');

})();
