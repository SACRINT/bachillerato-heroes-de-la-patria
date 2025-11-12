/**
 * 🤝 SISTEMA DE IA COLABORATIVA BGE
 * Trabajo en equipo potenciado por inteligencia artificial
 */

class CollaborativeAISystem {
    constructor() {
        this.currentUser = null;
        this.activeStudyGroups = [];
        this.collaborativeSessions = [];
        this.sharedWorkspaces = new Map();
        this.realTimeConnections = new Map();
        this.aiModerator = new AIGroupModerator();
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadActiveGroups();
        this.setupCollaborativeUI();
        this.initializeRealTimeSync();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadActiveGroups() {
        if (!this.currentUser) return;

        const saved = localStorage.getItem(`bge_study_groups_${this.currentUser.email}`);
        if (saved) {
            this.activeStudyGroups = JSON.parse(saved);
        } else {
            this.generateSampleGroups();
        }
    }

    generateSampleGroups() {
        this.activeStudyGroups = [
            this.createStudyGroup('Matemáticas Avanzadas', 'mathematics', [
                'Ana García', 'Luis Hernández', 'María López'
            ]),
            this.createStudyGroup('Física Cuántica', 'physics', [
                'Carlos Ruiz', 'Sofia Martín', 'Diego Torres'
            ]),
            this.createStudyGroup('Química Orgánica', 'chemistry', [
                'Valeria Sánchez', 'Andrés Morales'
            ])
        ];
        this.saveStudyGroups();
    }

    createStudyGroup(name, subject, members) {
        return {
            id: this.generateGroupId(),
            name,
            subject,
            members: [...members, this.currentUser?.name].filter(Boolean),
            createdAt: Date.now(),
            lastActivity: Date.now(),
            sharedResources: [],
            collaborativeTasks: [],
            aiInsights: [],
            groupLevel: 1,
            groupCoins: 0,
            status: 'active'
        };
    }

    setupCollaborativeUI() {
        if (!this.currentUser) return;

        this.createCollaborativeButton();
        this.createGroupNotifications();
    }

    createCollaborativeButton() {
        const button = document.createElement('div');
        button.id = 'collaborativeAIButton';
        button.className = 'position-fixed';
        button.style.cssText = `
            bottom: 120px;
            right: 30px;
            z-index: 1000;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(17, 153, 142, 0.3);
            transition: all 0.3s ease;
        `;

        button.innerHTML = `
            <i class="fas fa-users text-white" style="font-size: 1.3rem;"></i>
        `;

        button.onclick = () => this.showCollaborativeModal();

        button.onmouseenter = () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 12px 30px rgba(17, 153, 142, 0.4)';
        };

        button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 8px 25px rgba(17, 153, 142, 0.3)';
        };

        document.body.appendChild(button);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            right: 70px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8rem;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        tooltip.textContent = 'IA Colaborativa';
        button.appendChild(tooltip);

        button.onmouseenter = () => {
            button.style.transform = 'scale(1.1)';
            tooltip.style.opacity = '1';
        };

        button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
            tooltip.style.opacity = '0';
        };
    }

    createGroupNotifications() {
        const activeGroups = this.activeStudyGroups.filter(group => group.status === 'active');

        if (activeGroups.length > 0) {
            setTimeout(() => {
                this.showGroupActivityNotification(activeGroups[0]);
            }, 5000);
        }
    }

    showGroupActivityNotification(group) {
        const notification = document.createElement('div');
        notification.className = 'position-fixed';
        notification.style.cssText = `
            top: 150px;
            right: 20px;
            z-index: 1050;
            max-width: 320px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.5s ease;
            cursor: pointer;
        `;

        notification.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="me-2" style="font-size: 1.5rem;">🤝</div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">Actividad en Grupo</h6>
                    <p class="mb-1 small">"${group.name}" tiene nuevas actualizaciones</p>
                    <small class="opacity-75">${group.members.length} miembros • ${group.subject}</small>
                </div>
                <button class="btn btn-sm text-white ms-2" onclick="this.parentElement.parentElement.remove()" style="opacity: 0.8;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        notification.onclick = () => {
            this.openGroupWorkspace(group.id);
            notification.remove();
        };

        document.body.appendChild(notification);

        // Mostrar con animación
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto-ocultar después de 8 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 500);
            }
        }, 8000);
    }

    showCollaborativeModal() {
        if (!this.currentUser) {
            alert('🔒 Debes iniciar sesión para acceder a la IA colaborativa.');
            return;
        }

        this.createCollaborativeModal();
    }

    createCollaborativeModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'collaborativeAIModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 15px;">
                    <div class="modal-header border-0 text-white">
                        <h5 class="modal-title fw-bold">🤝 IA Colaborativa BGE - ${this.currentUser.name}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-white" style="max-height: 70vh; overflow-y: auto;">
                        ${this.generateCollaborativeContent()}
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existing = document.getElementById('collaborativeAIModal');
        if (existing) existing.remove();

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    generateCollaborativeContent() {
        return `
            <div class="container-fluid">
                <!-- Header Stats -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.activeStudyGroups.length}</h3>
                            <small class="opacity-75">Grupos Activos</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.getTotalCollaborators()}</h3>
                            <small class="opacity-75">Colaboradores</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.getSharedResources()}</h3>
                            <small class="opacity-75">Recursos Compartidos</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.getAIInsights()}</h3>
                            <small class="opacity-75">Insights IA</small>
                        </div>
                    </div>
                </div>

                <!-- Navegación -->
                <nav class="navbar navbar-expand navbar-dark mb-4" style="background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <div class="container-fluid">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link active" href="#groups" onclick="collaborativeAI.showSection('groups')">
                                    👥 Mis Grupos
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#workspaces" onclick="collaborativeAI.showSection('workspaces')">
                                    🚀 Espacios de Trabajo
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#ai-insights" onclick="collaborativeAI.showSection('ai-insights')">
                                    🧠 Insights IA
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#discover" onclick="collaborativeAI.showSection('discover')">
                                    🔍 Descubrir
                                </a>
                            </li>
                        </ul>
                        <button class="btn btn-warning btn-sm" onclick="collaborativeAI.createNewGroup()">
                            ➕ Nuevo Grupo
                        </button>
                    </div>
                </nav>

                <!-- Secciones -->
                <div id="groups-section" class="collaboration-section">
                    ${this.generateGroupsSection()}
                </div>

                <div id="workspaces-section" class="collaboration-section d-none">
                    ${this.generateWorkspacesSection()}
                </div>

                <div id="ai-insights-section" class="collaboration-section d-none">
                    ${this.generateAIInsightsSection()}
                </div>

                <div id="discover-section" class="collaboration-section d-none">
                    ${this.generateDiscoverSection()}
                </div>
            </div>
        `;
    }

    generateGroupsSection() {
        return `
            <div class="row">
                <div class="col-12">
                    <h6 class="mb-3">👥 Tus Grupos de Estudio</h6>
                </div>
                ${this.activeStudyGroups.map(group => this.generateGroupCard(group)).join('')}
            </div>
        `;
    }

    generateGroupCard(group) {
        const lastActivity = this.getTimeAgo(group.lastActivity);
        const memberCount = group.members.length;
        const resourceCount = group.sharedResources.length;

        return `
            <div class="col-lg-6 col-xl-4 mb-3">
                <div class="card bg-white bg-opacity-15 border-0 h-100" style="backdrop-filter: blur(10px);">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-warning mb-0">${group.name}</h6>
                            <span class="badge bg-${this.getSubjectColor(group.subject)}">${group.subject}</span>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small>👥 Miembros</small>
                                <small>${memberCount}/6</small>
                            </div>
                            <div class="progress" style="height: 4px;">
                                <div class="progress-bar bg-warning" style="width: ${(memberCount/6)*100}%"></div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <small class="d-block mb-1">📚 Recursos: ${resourceCount}</small>
                            <small class="d-block mb-1">🧠 Nivel de grupo: ${group.groupLevel}</small>
                            <small class="d-block mb-1">🪙 Coins grupales: ${group.groupCoins}</small>
                            <small class="d-block opacity-75">⏰ Última actividad: ${lastActivity}</small>
                        </div>

                        <div class="mb-3">
                            <small class="d-block mb-1 opacity-75">Miembros activos:</small>
                            <div class="d-flex flex-wrap gap-1">
                                ${group.members.slice(0, 4).map(member => `
                                    <span class="badge bg-light text-dark" style="font-size: 0.7rem;">${member.split(' ')[0]}</span>
                                `).join('')}
                                ${group.members.length > 4 ? `<span class="badge bg-secondary" style="font-size: 0.7rem;">+${group.members.length - 4}</span>` : ''}
                            </div>
                        </div>

                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm flex-grow-1" onclick="collaborativeAI.openGroupWorkspace('${group.id}')">
                                🚀 Abrir Workspace
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="collaborativeAI.groupSettings('${group.id}')">
                                ⚙️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateWorkspacesSection() {
        return `
            <div class="row">
                <div class="col-12">
                    <h6 class="mb-3">🚀 Espacios de Trabajo Colaborativo</h6>
                    <div class="alert alert-info border-0 mb-4" style="background: rgba(255,255,255,0.1);">
                        <h6 class="alert-heading">💡 ¿Qué son los Workspaces?</h6>
                        <p class="mb-0">Espacios virtuales donde tu grupo puede trabajar en tiempo real con asistencia de IA. Incluyen pizarra compartida, chat grupal con IA, y recursos colaborativos.</p>
                    </div>
                </div>

                <div class="col-lg-6 mb-3">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-2">📊 Workspace de Matemáticas</h6>
                            <p class="small mb-3">Resolviendo ecuaciones diferenciales en grupo con IA</p>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Progreso del proyecto</small>
                                    <small>75%</small>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-success" style="width: 75%"></div>
                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-warning btn-sm flex-grow-1" onclick="collaborativeAI.openWorkspace('math-workspace')">
                                    Continuar Trabajo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-3">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-2">🧪 Laboratorio Virtual de Química</h6>
                            <p class="small mb-3">Simulando reacciones orgánicas con IA predictiva</p>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Experimentos completados</small>
                                    <small>12/20</small>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-info" style="width: 60%"></div>
                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-warning btn-sm flex-grow-1" onclick="collaborativeAI.openWorkspace('chemistry-lab')">
                                    Entrar al Lab
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateAIInsightsSection() {
        return `
            <div class="row">
                <div class="col-12">
                    <h6 class="mb-3">🧠 Insights de IA Colaborativa</h6>
                </div>

                <div class="col-lg-8 mb-3">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-3">📈 Análisis de Colaboración Grupal</h6>

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small>Efectividad del grupo</small>
                                        <small class="text-success">92%</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-success" style="width: 92%"></div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small>Sinergia IA-Humano</small>
                                        <small class="text-info">88%</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-info" style="width: 88%"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="alert alert-success border-0 mb-3" style="background: rgba(40, 167, 69, 0.2);">
                                <small><strong>🎉 IA Insight:</strong> Tu grupo "Matemáticas Avanzadas" resuelve problemas 40% más rápido cuando colabora con IA que trabajando individualmente.</small>
                            </div>

                            <div class="alert alert-info border-0 mb-3" style="background: rgba(23, 162, 184, 0.2);">
                                <small><strong>💡 Recomendación:</strong> Considera invitar a María López a tu grupo de Física - su estilo de aprendizaje complementa perfectamente al equipo.</small>
                            </div>

                            <div class="alert alert-warning border-0" style="background: rgba(255, 193, 7, 0.2);">
                                <small><strong>⚡ Oportunidad:</strong> El mejor momento para sesiones grupales es entre 3-5 PM basado en los patrones de actividad del equipo.</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 mb-3">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-3">🏆 Logros Grupales</h6>

                            <div class="mb-3">
                                <div class="d-flex align-items-center mb-2">
                                    <span class="badge bg-warning rounded-pill me-2">🥇</span>
                                    <small>Primer Lugar en Colaboración</small>
                                </div>
                                <div class="d-flex align-items-center mb-2">
                                    <span class="badge bg-success rounded-pill me-2">🧠</span>
                                    <small>Sinergia IA Perfecta</small>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-info rounded-pill me-2">⚡</span>
                                    <small>Resolución Rápida</small>
                                </div>
                            </div>

                            <hr style="border-color: rgba(255,255,255,0.2);">

                            <h6 class="mb-2">📊 Métricas del Mes</h6>
                            <small class="d-block mb-1">Sesiones colaborativas: 24</small>
                            <small class="d-block mb-1">Problemas resueltos: 156</small>
                            <small class="d-block mb-1">Insights IA generados: 89</small>
                            <small class="d-block">Coins grupales ganados: 1,240</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateDiscoverSection() {
        return `
            <div class="row">
                <div class="col-12">
                    <h6 class="mb-3">🔍 Descubrir Nuevas Colaboraciones</h6>
                </div>

                <div class="col-lg-6 mb-3">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-3">🎯 Grupos Recomendados por IA</h6>

                            <div class="border-bottom pb-2 mb-2" style="border-color: rgba(255,255,255,0.2);">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Física Cuántica Avanzada</strong>
                                    <span class="badge bg-success">95% match</span>
                                </div>
                                <small class="d-block mb-1">3 miembros • Nivel 8</small>
                                <small class="opacity-75">Buscando experto en mecánica cuántica</small>
                            </div>

                            <div class="border-bottom pb-2 mb-2" style="border-color: rgba(255,255,255,0.2);">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Cálculo Multivariable</strong>
                                    <span class="badge bg-info">87% match</span>
                                </div>
                                <small class="d-block mb-1">4 miembros • Nivel 6</small>
                                <small class="opacity-75">Preparando examen final</small>
                            </div>

                            <div class="pb-2">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Química Orgánica Plus</strong>
                                    <span class="badge bg-warning">82% match</span>
                                </div>
                                <small class="d-block mb-1">2 miembros • Nivel 5</small>
                                <small class="opacity-75">Síntesis de compuestos complejos</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-3">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-3">🌟 Estudiantes Destacados</h6>

                            <div class="border-bottom pb-2 mb-2" style="border-color: rgba(255,255,255,0.2);">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Isabella Cruz</strong>
                                    <span class="badge bg-primary">Nivel 12</span>
                                </div>
                                <small class="d-block mb-1">Especialista en Biología Molecular</small>
                                <small class="opacity-75">🧬 Experta en ADN y genética</small>
                            </div>

                            <div class="border-bottom pb-2 mb-2" style="border-color: rgba(255,255,255,0.2);">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Sebastián Jiménez</strong>
                                    <span class="badge bg-success">Nivel 11</span>
                                </div>
                                <small class="d-block mb-1">Maestro en Física Teórica</small>
                                <small class="opacity-75">⚛️ Relatividad y mecánica cuántica</small>
                            </div>

                            <div class="pb-2">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>Camila Herrera</strong>
                                    <span class="badge bg-warning">Nivel 10</span>
                                </div>
                                <small class="d-block mb-1">Genio Matemático</small>
                                <small class="opacity-75">📐 Cálculo y álgebra avanzada</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.collaboration-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Mostrar sección seleccionada
        document.getElementById(`${sectionName}-section`).classList.remove('d-none');

        // Actualizar navbar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    }

    openGroupWorkspace(groupId) {
        const group = this.activeStudyGroups.find(g => g.id === groupId);
        if (!group) return;

        this.createWorkspaceInterface(group);
    }

    createWorkspaceInterface(group) {
        alert(`🚀 Abriendo workspace para "${group.name}"\n\n` +
              `Funcionalidades disponibles:\n` +
              `• Pizarra colaborativa en tiempo real\n` +
              `• Chat grupal con IA moderadora\n` +
              `• Compartir recursos y archivos\n` +
              `• Resolución de problemas asistida por IA\n` +
              `• Seguimiento de progreso grupal\n\n` +
              `🤖 IA Colaborativa: "¡Hola equipo! Estoy lista para ayudarlos a resolver cualquier problema juntos."`);

        // Aquí se implementaría la interfaz completa del workspace
        this.trackWorkspaceAccess(group);
    }

    createNewGroup() {
        const groupName = prompt('📝 Nombre del nuevo grupo de estudio:');
        if (!groupName) return;

        const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'spanish', 'english'];
        const subjectNames = ['Matemáticas', 'Física', 'Química', 'Biología', 'Español', 'Inglés'];

        let subjectChoice = '';
        const subjectList = subjects.map((s, i) => `${i + 1}. ${subjectNames[i]}`).join('\n');

        const subjectIndex = parseInt(prompt(`🎯 Selecciona la materia:\n\n${subjectList}\n\nEscribe el número:`)) - 1;

        if (subjectIndex >= 0 && subjectIndex < subjects.length) {
            subjectChoice = subjects[subjectIndex];
        } else {
            alert('❌ Selección inválida');
            return;
        }

        const newGroup = this.createStudyGroup(groupName, subjectChoice, []);
        this.activeStudyGroups.push(newGroup);
        this.saveStudyGroups();

        alert(`✅ Grupo "${groupName}" creado exitosamente!\n\n` +
              `🎯 Materia: ${subjectNames[subjectIndex]}\n` +
              `👥 Miembros: Solo tú por ahora\n` +
              `🤖 IA: Lista para colaborar\n\n` +
              `Invita a compañeros para maximizar el aprendizaje colaborativo.`);

        // Refresh modal content
        this.showCollaborativeModal();
    }

    // Métodos auxiliares
    getTotalCollaborators() {
        const allMembers = new Set();
        this.activeStudyGroups.forEach(group => {
            group.members.forEach(member => allMembers.add(member));
        });
        return allMembers.size;
    }

    getSharedResources() {
        return this.activeStudyGroups.reduce((total, group) =>
            total + group.sharedResources.length, 0
        );
    }

    getAIInsights() {
        return this.activeStudyGroups.reduce((total, group) =>
            total + group.aiInsights.length, 0
        ) + 12; // Simular insights adicionales
    }

    getSubjectColor(subject) {
        const colors = {
            mathematics: 'primary',
            physics: 'success',
            chemistry: 'warning',
            biology: 'info',
            spanish: 'danger',
            english: 'secondary'
        };
        return colors[subject] || 'light';
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} min`;
        return 'ahora mismo';
    }

    generateGroupId() {
        return 'group_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveStudyGroups() {
        if (!this.currentUser) return;

        localStorage.setItem(
            `bge_study_groups_${this.currentUser.email}`,
            JSON.stringify(this.activeStudyGroups)
        );
    }

    trackWorkspaceAccess(group) {
        if (window.analyticsSystem) {
            window.analyticsSystem.trackEvent('collaborative_workspace_opened', {
                groupId: group.id,
                groupName: group.name,
                subject: group.subject,
                memberCount: group.members.length
            });
        }
    }

    initializeRealTimeSync() {
        // Simular sincronización en tiempo real
        setInterval(() => {
            this.updateGroupActivities();
        }, 30000);
    }

    updateGroupActivities() {
        // Simular actividades grupales
        this.activeStudyGroups.forEach(group => {
            if (Math.random() > 0.8) {
                group.lastActivity = Date.now();
                group.sharedResources.push(`Recurso ${Date.now()}`);
            }
        });
        this.saveStudyGroups();
    }
}

// Clase para IA Moderadora de Grupos
class AIGroupModerator {
    constructor() {
        this.moderationRules = this.initializeModerationRules();
        this.collaborationInsights = [];
    }

    initializeModerationRules() {
        return {
            encourageParticipation: true,
            detectOffTopic: true,
            suggestResources: true,
            facilitateDiscussion: true,
            trackProgress: true
        };
    }

    generateCollaborationInsight(group) {
        const insights = [
            `El grupo está trabajando muy bien en conjunto. La participación es equilibrada.`,
            `Recomiendo que ${group.members[0]} comparta más de sus conocimientos con el equipo.`,
            `El grupo podría beneficiarse de una sesión de lluvia de ideas sobre el tema actual.`,
            `Excelente sinergia detectada. El rendimiento grupal supera la suma individual.`,
            `Sugerencia: Dividan el problema en partes más pequeñas para mejor colaboración.`
        ];

        return insights[Math.floor(Math.random() * insights.length)];
    }

    moderateGroupSession(group) {
        // Lógica de moderación IA
        return {
            suggestion: this.generateCollaborationInsight(group),
            nextSteps: ['Continuar con el problema actual', 'Tomar un descanso de 5 minutos', 'Revisar recursos compartidos'],
            aiAssistance: 'IA lista para ayudar con preguntas específicas'
        };
    }
}

// Funciones globales
function openCollaborativeAI() {
    if (window.collaborativeAI) {
        window.collaborativeAI.showCollaborativeModal();
    }
}

function createStudyGroup() {
    if (window.collaborativeAI) {
        window.collaborativeAI.createNewGroup();
    }
}

// Inicializar sistema colaborativo
document.addEventListener('DOMContentLoaded', function() {
    window.collaborativeAI = new CollaborativeAISystem();
});