/**
 * 👤 PROFILE MANAGER - GESTIÓN DE PERFILES DE USUARIO
 * Sistema de perfiles con integración a gamificación
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserSession();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    openProfile() {
        if (!this.currentUser) {
            alert('🔐 Debes iniciar sesión para acceder a tu perfil.');
            return;
        }

        this.showProfileModal();
    }

    showProfileModal() {
        const userData = this.getUserProgress();

        const modalHTML = `
            <div class="modal fade" id="profileModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 15px;">
                        <div class="modal-header border-0 text-white">
                            <h5 class="modal-title fw-bold">👤 Mi Perfil - ${this.currentUser.name}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-white">
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <img src="${this.currentUser.picture}" class="rounded-circle mb-3" width="80" height="80">
                                    <h6>${this.currentUser.name}</h6>
                                    <p class="small">${this.getRoleDisplayName(this.currentUser.role)}</p>
                                </div>
                                <div class="col-md-8">
                                    <div class="row">
                                        <div class="col-sm-6">
                                            <div class="card bg-white bg-opacity-20 border-0 mb-3">
                                                <div class="card-body">
                                                    <h6 class="text-warning">📊 Estadísticas</h6>
                                                    <p class="mb-1">Nivel: ${userData.level}</p>
                                                    <p class="mb-1">IA Coins: ${userData.coins}</p>
                                                    <p class="mb-0">XP: ${userData.xp}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-sm-6">
                                            <div class="card bg-white bg-opacity-20 border-0 mb-3">
                                                <div class="card-body">
                                                    <h6 class="text-info">🎯 Progreso</h6>
                                                    <p class="mb-1">Prompts: ${userData.unlockedPrompts.length}/50</p>
                                                    <p class="mb-1">Logros: 0/25</p>
                                                    <p class="mb-0">Días activo: 1</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="card bg-white bg-opacity-20 border-0">
                                        <div class="card-body">
                                            <h6 class="text-success">🏆 Próximos Objetivos</h6>
                                            <ul class="list-unstyled small">
                                                <li>• Completar 5 sesiones de IA (+100 XP)</li>
                                                <li>• Desbloquear prompt avanzado (+50 coins)</li>
                                                <li>• Conectar 3 días seguidos (+logro)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-light" onclick="profileManager.editProfile()">Editar Perfil</button>
                            <button type="button" class="btn btn-warning" onclick="profileManager.viewAchievements()">Ver Logros</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('profileModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
    }

    getUserProgress() {
        if (!this.currentUser) return { level: 1, coins: 0, xp: 0, unlockedPrompts: [] };

        const saved = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            level: 1,
            coins: 0,
            xp: 0,
            unlockedPrompts: ['basic-summary']
        };
    }

    getRoleDisplayName(role) {
        const roles = {
            student: '🎓 Estudiante',
            teacher: '👨‍🏫 Docente',
            parent: '👨‍👩‍👧‍👦 Padre/Madre',
            admin: '👨‍💼 Administrador'
        };
        return roles[role] || '🎓 Estudiante';
    }

    editProfile() {
        alert('✏️ Función de editar perfil en desarrollo. ¡Próximamente!');
    }

    viewAchievements() {
        if (window.achievementSystem) {
            window.achievementSystem.showAchievements();
        } else {
            alert('🏆 Sistema de logros cargando... ¡Próximamente!');
        }
    }
}

// Funciones globales
function openProfile() {
    if (window.profileManager) {
        window.profileManager.openProfile();
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
});