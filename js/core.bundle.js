/*!
 * BGE Framework Core Bundle
 * Núcleo consolidado de funcionalidades básicas
 * Versión: 1.0.0
 */

// === NOTIFICATION SYSTEM ===
// Consolidación de notification-manager.js, notification-config-ui.js, notification-events.js

class NotificationManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔔 Sistema de Notificaciones Iniciado');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botón configurar notificaciones
        const notifBtn = document.querySelector('[description="Configurar notificaciones"]');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                this.showNotificationConfig();
            });
        }
    }

    showNotificationConfig() {
        alert('⚙️ Configuración de Notificaciones\n\nFuncionalidad lista para implementar.');
    }
}

// === AI TUTOR INTERFACE ===
// Consolidación de ai-tutor-interface.js

class AITutorInterface {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    init() {
        console.log('🤖 IA Tutor Iniciado');
        this.createFloatingButton();
        this.createWidget();
    }

    createFloatingButton() {
        // Crear botón flotante del robot
        const existingBtn = document.querySelector('#ai-tutor-btn');
        if (existingBtn) return;

        const btn = document.createElement('div');
        btn.id = 'ai-tutor-btn';
        btn.innerHTML = '🤖';
        btn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 450px;
            z-index: 9999;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #e91e63 0%, #ad1457 50%, #880e4f 100%);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 24px;
            box-shadow: 0 4px 20px rgba(233, 30, 99, 0.5), 0 0 30px rgba(173, 20, 87, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;

        btn.addEventListener('click', () => this.toggleWidget());
        document.body.appendChild(btn);
    }

    createWidget() {
        const existingWidget = document.querySelector('#ai-tutor-widget');
        if (existingWidget) return;

        const widget = document.createElement('div');
        widget.id = 'ai-tutor-widget';
        widget.className = 'ai-tutor-widget';
        widget.innerHTML = `
            <div class="ai-header">
                <span>🤖</span>
                <h4>IA Educativa</h4>
                <p>Listo para ayudarte</p>
                <div class="ai-controls">
                    <button onclick="aiTutor.toggleVoice()">🎤</button>
                    <button onclick="aiTutor.minimizeWidget()">−</button>
                    <button onclick="aiTutor.closeWidget()">×</button>
                </div>
            </div>
            <div class="ai-content">
                <div class="ai-message">
                    <p>¡Hola! Soy tu tutor de IA. ¿En qué puedo ayudarte hoy?</p>
                    <small>${new Date().toLocaleTimeString()}</small>
                </div>
                <div class="ai-subjects">
                    <button onclick="aiTutor.selectSubject('math')">📊 Matemáticas</button>
                    <button onclick="aiTutor.selectSubject('science')">🔬 Ciencias</button>
                    <button onclick="aiTutor.selectSubject('history')">📚 Historia</button>
                    <button onclick="aiTutor.selectSubject('tips')">💡 Recomendaciones</button>
                </div>
                <div class="ai-input">
                    <input type="text" placeholder="Escribe tu pregunta aquí..." id="ai-input">
                    <button onclick="aiTutor.sendMessage()">➤</button>
                </div>
            </div>
        `;

        widget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            z-index: 100001;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;

        document.body.appendChild(widget);
        this.addWidgetStyles();
    }

    addWidgetStyles() {
        if (document.querySelector('#ai-tutor-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-tutor-styles';
        styles.textContent = `
            .ai-tutor-widget .ai-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border-radius: 15px 15px 0 0;
                position: relative;
            }
            .ai-tutor-widget .ai-controls {
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                gap: 5px;
            }
            .ai-tutor-widget .ai-controls button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
            }
            .ai-tutor-widget .ai-content {
                padding: 15px;
            }
            .ai-tutor-widget .ai-subjects {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin: 15px 0;
            }
            .ai-tutor-widget .ai-subjects button {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                font-size: 12px;
            }
            .ai-tutor-widget .ai-input {
                display: flex;
                gap: 8px;
                margin-top: 15px;
            }
            .ai-tutor-widget .ai-input input {
                flex: 1;
                border: 1px solid #dee2e6;
                border-radius: 20px;
                padding: 8px 12px;
                outline: none;
            }
            .ai-tutor-widget .ai-input button {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(styles);
    }

    toggleWidget() {
        const widget = document.querySelector('#ai-tutor-widget');
        if (widget) {
            widget.style.display = this.isVisible ? 'none' : 'block';
            this.isVisible = !this.isVisible;
        }
    }

    closeWidget() {
        const widget = document.querySelector('#ai-tutor-widget');
        if (widget) {
            widget.style.display = 'none';
            this.isVisible = false;
        }
    }

    minimizeWidget() {
        // Implementar minimización
        this.closeWidget();
    }

    toggleVoice() {
        alert('🎤 Función de voz en desarrollo');
    }

    selectSubject(subject) {
        const subjects = {
            math: '📊 ¡Perfecto! Te ayudo con Matemáticas. ¿Qué tema específico necesitas?',
            science: '🔬 ¡Excelente! Hablemos de Ciencias. ¿Física, Química o Biología?',
            history: '📚 ¡Genial! Te ayudo con Historia. ¿Qué período te interesa?',
            tips: '💡 Te daré recomendaciones personalizadas. ¿Para estudios o vida escolar?'
        };

        alert(subjects[subject] || 'Tema no disponible');
    }

    sendMessage() {
        const input = document.querySelector('#ai-input');
        if (input && input.value.trim()) {
            alert(`🤖 Procesando: "${input.value}"\n\nRespuesta del tutor IA en desarrollo.`);
            input.value = '';
        }
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistemas consolidados
    window.notificationManager = new NotificationManager();
    window.aiTutor = new AITutorInterface();

    console.log('✅ BGE Framework Core Bundle Cargado');
});