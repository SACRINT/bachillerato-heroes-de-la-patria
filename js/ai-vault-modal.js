/**
 * 🤖 AI VAULT MODAL - SISTEMA DE BÓVEDA IA
 * Integración con sistema de gamificación y desbloqueo por logros
 */

class AIVaultModal {
    constructor() {
        this.currentUser = null;
        this.unlockedPrompts = [];
        this.init();
    }

    init() {
        this.loadUserSession();
        this.createModalHTML();
        this.setupEventListeners();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.loadUserProgress();
        }
    }

    loadUserProgress() {
        if (!this.currentUser) return;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        if (progress) {
            const userData = JSON.parse(progress);
            this.unlockedPrompts = userData.unlockedPrompts || ['basic-summary'];
        }
    }

    createModalHTML() {
        const modalHTML = `
            <div class="modal fade" id="aiVaultModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
                        <div class="modal-header border-0 text-white">
                            <h5 class="modal-title fw-bold">🤖 Bóveda IA - Sistema Gamificado</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-white" style="max-height: 70vh; overflow-y: auto;">
                            <div id="aiVaultContent">
                                <div class="text-center mb-4">
                                    <div class="spinner-border text-light" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                    <p class="mt-2">Cargando tu bóveda IA personalizada...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal si no existe
        if (!document.getElementById('aiVaultModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    show() {
        if (!this.currentUser) {
            this.showLoginRequired();
            return;
        }

        this.loadVaultContent();
        const modal = new bootstrap.Modal(document.getElementById('aiVaultModal'));
        modal.show();
    }

    showLoginRequired() {
        alert('🔐 Debes iniciar sesión para acceder a tu Bóveda IA personalizada.');
    }

    loadVaultContent() {
        const content = document.getElementById('aiVaultContent');

        setTimeout(() => {
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="card bg-white bg-opacity-10 border-0 mb-3">
                            <div class="card-body">
                                <h6 class="text-warning">📊 Tu Progreso</h6>
                                <p class="mb-1">Nivel: ${this.getUserLevel()}</p>
                                <p class="mb-1">IA Coins: ${this.getUserCoins()}</p>
                                <p class="mb-0">Prompts Desbloqueados: ${this.unlockedPrompts.length}</p>
                            </div>
                        </div>

                        <div class="card bg-white bg-opacity-10 border-0">
                            <div class="card-body">
                                <h6 class="text-info">🎯 Próximo Desbloqueo</h6>
                                <p class="small">Completa 3 tareas más para desbloquear:</p>
                                <p class="fw-bold text-warning">📝 Generador de Ensayos IA</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-8">
                        <h6 class="mb-3">🔓 Prompts Disponibles</h6>
                        <div class="row" id="promptsGrid">
                            ${this.generatePromptsGrid()}
                        </div>
                    </div>
                </div>
            `;
        }, 1000);
    }

    generatePromptsGrid() {
        const availablePrompts = [
            { id: 'basic-summary', title: '📄 Resumen Básico', unlocked: true },
            { id: 'advanced-analysis', title: '🔍 Análisis Avanzado', unlocked: false },
            { id: 'essay-generator', title: '📝 Generador de Ensayos', unlocked: false },
            { id: 'exam-prep', title: '📚 Preparación de Exámenes', unlocked: false }
        ];

        return availablePrompts.map(prompt => `
            <div class="col-md-6 mb-3">
                <div class="card ${prompt.unlocked ? 'bg-success bg-opacity-20' : 'bg-secondary bg-opacity-20'} border-0">
                    <div class="card-body">
                        <h6 class="card-title">${prompt.title}</h6>
                        <p class="card-text small">
                            ${prompt.unlocked ? '✅ Disponible' : '🔒 Bloqueado'}
                        </p>
                        ${prompt.unlocked ?
                            '<button class="btn btn-sm btn-warning">Usar Prompt</button>' :
                            '<button class="btn btn-sm btn-secondary" disabled>Desbloquear</button>'
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    getUserLevel() {
        if (!this.currentUser) return 1;
        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        return progress ? JSON.parse(progress).level || 1 : 1;
    }

    getUserCoins() {
        if (!this.currentUser) return 0;
        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        return progress ? JSON.parse(progress).coins || 0 : 0;
    }

    setupEventListeners() {
        // Configurar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            window.aiVaultModal = this;
        });
    }
}

// Inicializar globalmente
document.addEventListener('DOMContentLoaded', function() {
    window.aiVaultModal = new AIVaultModal();
});

// Función global para abrir la bóveda
function openAIVault() {
    if (window.aiVaultModal) {
        window.aiVaultModal.show();
    }
}