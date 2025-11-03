/**
 * 🎤 SISTEMA DE RECONOCIMIENTO DE VOZ PARA DICTADO IA
 * Portal BGE Héroes de la Patria
 * Sistema avanzado de reconocimiento de voz con IA para dictado inteligente
 */

class VoiceRecognitionAI {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.isSupported = false;
        this.currentLanguage = 'es-ES';
        this.aiContext = null;
        this.dictationHistory = [];
        this.voiceCommands = new Map();
        this.confidenceThreshold = 0.7;
        this.punctuationRules = new Map();
        this.subjectVocabulary = new Map();

        this.initializeVoiceRecognition();
        this.setupVoiceCommands();
        this.setupPunctuationRules();
        this.setupSubjectVocabulary();
        this.loadUserPreferences();
    }

    initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.isSupported = true;
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            this.isSupported = true;
        } else {
            console.warn('Speech Recognition no soportado en este navegador');
            return;
        }

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.showRecordingIndicator();
            this.triggerEvent('voiceStart');
        };

        this.recognition.onresult = (event) => {
            this.processVoiceResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleVoiceError(event);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.hideRecordingIndicator();
            this.triggerEvent('voiceEnd');
        };
    }

    setupVoiceCommands() {
        this.voiceCommands.set('nuevo párrafo', () => this.insertText('\n\n'));
        this.voiceCommands.set('punto y aparte', () => this.insertText('.\n\n'));
        this.voiceCommands.set('punto y seguido', () => this.insertText('. '));
        this.voiceCommands.set('coma', () => this.insertText(', '));
        this.voiceCommands.set('punto y coma', () => this.insertText('; '));
        this.voiceCommands.set('dos puntos', () => this.insertText(': '));
        this.voiceCommands.set('signo de pregunta', () => this.insertText('?'));
        this.voiceCommands.set('signo de exclamación', () => this.insertText('!'));
        this.voiceCommands.set('abrir paréntesis', () => this.insertText('('));
        this.voiceCommands.set('cerrar paréntesis', () => this.insertText(')'));
        this.voiceCommands.set('comillas', () => this.insertText('"'));
        this.voiceCommands.set('guión', () => this.insertText('-'));
        this.voiceCommands.set('borrar última palabra', () => this.deleteLastWord());
        this.voiceCommands.set('corregir', () => this.showCorrectionOptions());
        this.voiceCommands.set('guardar texto', () => this.saveText());
        this.voiceCommands.set('leer texto', () => this.readTextAloud());
        this.voiceCommands.set('cambiar a matemáticas', () => this.switchContext('mathematics'));
        this.voiceCommands.set('cambiar a física', () => this.switchContext('physics'));
        this.voiceCommands.set('cambiar a química', () => this.switchContext('chemistry'));
        this.voiceCommands.set('cambiar a biología', () => this.switchContext('biology'));
        this.voiceCommands.set('modo normal', () => this.switchContext('general'));
    }

    setupPunctuationRules() {
        this.punctuationRules.set(/\s+punto\s+/gi, '. ');
        this.punctuationRules.set(/\s+coma\s+/gi, ', ');
        this.punctuationRules.set(/\s+pregunta\s+/gi, '? ');
        this.punctuationRules.set(/\s+exclamación\s+/gi, '! ');
        this.punctuationRules.set(/\s+dos puntos\s+/gi, ': ');
        this.punctuationRules.set(/\s+punto y coma\s+/gi, '; ');
    }

    setupSubjectVocabulary() {
        this.subjectVocabulary.set('mathematics', {
            'más': '+',
            'menos': '-',
            'por': '×',
            'entre': '÷',
            'igual': '=',
            'mayor que': '>',
            'menor que': '<',
            'pi': 'π',
            'infinito': '∞',
            'raíz cuadrada': '√',
            'al cuadrado': '²',
            'al cubo': '³',
            'fracción': '/',
            'porcentaje': '%'
        });

        this.subjectVocabulary.set('physics', {
            'velocidad': 'v',
            'aceleración': 'a',
            'fuerza': 'F',
            'masa': 'm',
            'tiempo': 't',
            'distancia': 'd',
            'energía': 'E',
            'potencia': 'P',
            'newton': 'N',
            'metro por segundo': 'm/s',
            'metros por segundo al cuadrado': 'm/s²'
        });

        this.subjectVocabulary.set('chemistry', {
            'hidrógeno': 'H',
            'oxígeno': 'O',
            'carbono': 'C',
            'nitrógeno': 'N',
            'agua': 'H₂O',
            'dióxido de carbono': 'CO₂',
            'ácido': 'H⁺',
            'base': 'OH⁻',
            'ph': 'pH',
            'molaridad': 'M'
        });

        this.subjectVocabulary.set('biology', {
            'ácido desoxirribonucleico': 'ADN',
            'ácido ribonucleico': 'ARN',
            'adenosín trifosfato': 'ATP',
            'fotosíntesis': '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
            'respiración celular': 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP'
        });
    }

    startRecording(context = 'general', targetElement = null) {
        if (!this.isSupported) {
            this.showNotSupported();
            return false;
        }

        if (this.isRecording) {
            this.stopRecording();
            return false;
        }

        this.aiContext = context;
        this.targetElement = targetElement || this.getActiveTextElement();

        if (!this.targetElement) {
            this.showNoTargetElement();
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error al iniciar reconocimiento de voz:', error);
            this.showError('Error al iniciar el reconocimiento de voz');
            return false;
        }
    }

    stopRecording() {
        if (this.isRecording && this.recognition) {
            this.recognition.stop();
        }
    }

    processVoiceResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;

            if (event.results[i].isFinal) {
                if (confidence >= this.confidenceThreshold) {
                    finalTranscript += transcript;
                } else {
                    this.showLowConfidenceWarning(transcript);
                }
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            this.processTranscript(finalTranscript);
        }

        if (interimTranscript) {
            this.showInterimResult(interimTranscript);
        }
    }

    processTranscript(transcript) {
        let processedText = transcript.toLowerCase().trim();

        // Verificar comandos de voz
        if (this.voiceCommands.has(processedText)) {
            this.voiceCommands.get(processedText)();
            return;
        }

        // Aplicar vocabulario específico de materia
        if (this.aiContext && this.subjectVocabulary.has(this.aiContext)) {
            const vocabulary = this.subjectVocabulary.get(this.aiContext);
            for (const [spoken, written] of Object.entries(vocabulary)) {
                processedText = processedText.replace(new RegExp(spoken, 'gi'), written);
            }
        }

        // Aplicar reglas de puntuación
        for (const [pattern, replacement] of this.punctuationRules) {
            processedText = processedText.replace(pattern, replacement);
        }

        // Aplicar correcciones inteligentes
        processedText = this.applyIntelligentCorrections(processedText);

        // Capitalizar primera letra de oraciones
        processedText = this.capitalizeFirstLetter(processedText);

        // Insertar texto procesado
        this.insertText(processedText + ' ');

        // Guardar en historial
        this.dictationHistory.push({
            timestamp: Date.now(),
            original: transcript,
            processed: processedText,
            context: this.aiContext
        });

        // Actualizar XP del usuario
        this.awardVoiceXP(processedText.length);
    }

    applyIntelligentCorrections(text) {
        const corrections = {
            'bge': 'BGE',
            'heroes de la patria': 'Héroes de la Patria',
            'bachillerato general educativo': 'Bachillerato General Educativo',
            'ia': 'IA',
            'inteligencia artificial': 'Inteligencia Artificial'
        };

        let correctedText = text;
        for (const [incorrect, correct] of Object.entries(corrections)) {
            correctedText = correctedText.replace(new RegExp(incorrect, 'gi'), correct);
        }

        return correctedText;
    }

    capitalizeFirstLetter(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    insertText(text) {
        if (!this.targetElement) return;

        if (this.targetElement.tagName === 'INPUT' || this.targetElement.tagName === 'TEXTAREA') {
            const start = this.targetElement.selectionStart;
            const end = this.targetElement.selectionEnd;
            const value = this.targetElement.value;

            this.targetElement.value = value.substring(0, start) + text + value.substring(end);
            this.targetElement.selectionStart = this.targetElement.selectionEnd = start + text.length;
        } else if (this.targetElement.contentEditable === 'true') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        this.targetElement.focus();
        this.triggerEvent('textInserted', { text });
    }

    deleteLastWord() {
        if (!this.targetElement) return;

        if (this.targetElement.tagName === 'INPUT' || this.targetElement.tagName === 'TEXTAREA') {
            const value = this.targetElement.value;
            const trimmed = value.trimEnd();
            const lastSpaceIndex = trimmed.lastIndexOf(' ');
            this.targetElement.value = lastSpaceIndex > -1 ? trimmed.substring(0, lastSpaceIndex + 1) : '';
        }
    }

    switchContext(context) {
        this.aiContext = context;
        this.showContextSwitch(context);
        this.triggerEvent('contextChanged', { context });
    }

    showRecordingIndicator() {
        let indicator = document.getElementById('voice-recording-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'voice-recording-indicator';
            indicator.className = 'voice-recording-indicator';
            indicator.innerHTML = `
                <div class="recording-animation">
                    <div class="recording-dot"></div>
                    <div class="recording-pulse"></div>
                </div>
                <span class="recording-text">Escuchando...</span>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'flex';
    }

    hideRecordingIndicator() {
        const indicator = document.getElementById('voice-recording-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showInterimResult(text) {
        let preview = document.getElementById('voice-interim-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'voice-interim-preview';
            preview.className = 'voice-interim-preview';
            document.body.appendChild(preview);
        }
        preview.textContent = text;
        preview.style.display = 'block';
    }

    getActiveTextElement() {
        const activeElement = document.activeElement;

        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        )) {
            return activeElement;
        }

        // Buscar elementos de texto comunes
        const textElements = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
        return textElements.length > 0 ? textElements[0] : null;
    }

    awardVoiceXP(textLength) {
        const baseXP = Math.floor(textLength / 10);
        const bonusXP = this.aiContext !== 'general' ? Math.floor(baseXP * 0.5) : 0;
        const totalXP = baseXP + bonusXP;

        if (window.achievementSystem) {
            window.achievementSystem.addXP(totalXP);
        }

        this.triggerEvent('xpAwarded', { amount: totalXP, source: 'voice_dictation' });
    }

    showContextSwitch(context) {
        const contextNames = {
            general: 'General',
            mathematics: 'Matemáticas',
            physics: 'Física',
            chemistry: 'Química',
            biology: 'Biología'
        };

        this.showNotification(`Contexto cambiado a: ${contextNames[context] || context}`, 'info');
    }

    showNotification(message, type = 'info') {
        if (window.pushNotificationSystem) {
            window.pushNotificationSystem.showNotification({
                title: 'Reconocimiento de Voz',
                body: message,
                type: type
            });
        }
    }

    handleVoiceError(event) {
        const errorMessages = {
            'no-speech': 'No se detectó ningún discurso',
            'audio-capture': 'Error en la captura de audio',
            'not-allowed': 'Permisos de micrófono denegados',
            'network': 'Error de conexión de red',
            'language-not-supported': 'Idioma no soportado'
        };

        const message = errorMessages[event.error] || 'Error desconocido en el reconocimiento de voz';
        this.showNotification(message, 'error');

        this.triggerEvent('voiceError', { error: event.error, message });
    }

    loadUserPreferences() {
        const preferences = localStorage.getItem('voiceRecognitionPreferences');
        if (preferences) {
            const parsed = JSON.parse(preferences);
            this.currentLanguage = parsed.language || 'es-ES';
            this.confidenceThreshold = parsed.confidenceThreshold || 0.7;

            if (this.recognition) {
                this.recognition.lang = this.currentLanguage;
            }
        }
    }

    saveUserPreferences() {
        const preferences = {
            language: this.currentLanguage,
            confidenceThreshold: this.confidenceThreshold
        };
        localStorage.setItem('voiceRecognitionPreferences', JSON.stringify(preferences));
    }

    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(`voiceRecognition_${eventName}`, {
            detail: { ...data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // API pública
    createVoiceButton(targetElement, context = 'general') {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary voice-button';
        button.innerHTML = '<i class="fas fa-microphone"></i>';
        button.title = 'Dictado por voz';

        button.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-primary');
            } else {
                if (this.startRecording(context, targetElement)) {
                    button.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                    button.classList.remove('btn-outline-primary');
                    button.classList.add('btn-danger');
                }
            }
        });

        return button;
    }

    getDictationHistory() {
        return this.dictationHistory;
    }

    clearHistory() {
        this.dictationHistory = [];
    }

    isRecordingActive() {
        return this.isRecording;
    }

    getSupportedLanguages() {
        return [
            { code: 'es-ES', name: 'Español (España)' },
            { code: 'es-MX', name: 'Español (México)' },
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' }
        ];
    }

    setLanguage(languageCode) {
        this.currentLanguage = languageCode;
        if (this.recognition) {
            this.recognition.lang = languageCode;
        }
        this.saveUserPreferences();
    }

    setConfidenceThreshold(threshold) {
        this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold));
        this.saveUserPreferences();
    }
}

// CSS para los indicadores visuales
const voiceRecognitionCSS = `
    .voice-recording-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(220, 53, 69, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        display: none;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: 500;
    }

    .recording-animation {
        position: relative;
        width: 20px;
        height: 20px;
    }

    .recording-dot {
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: recordingPulse 1.5s infinite;
    }

    .recording-pulse {
        width: 20px;
        height: 20px;
        border: 2px solid white;
        border-radius: 50%;
        position: absolute;
        animation: recordingRing 1.5s infinite;
        opacity: 0;
    }

    .voice-interim-preview {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: rgba(0, 123, 255, 0.95);
        color: white;
        padding: 10px 15px;
        border-radius: 10px;
        display: none;
        z-index: 9998;
        font-style: italic;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .voice-button {
        min-width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .voice-button:hover {
        transform: scale(1.1);
    }

    @keyframes recordingPulse {
        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.2); }
    }

    @keyframes recordingRing {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0; transform: scale(1.5); }
    }

    @media (max-width: 768px) {
        .voice-recording-indicator {
            top: 10px;
            right: 10px;
            padding: 8px 15px;
            font-size: 14px;
        }

        .voice-interim-preview {
            bottom: 10px;
            left: 10px;
            right: 10px;
            font-size: 14px;
        }
    }
`;

// Inyectar CSS
const styleElement = document.createElement('style');
styleElement.textContent = voiceRecognitionCSS;
document.head.appendChild(styleElement);

// Inicializar y exponer globalmente
window.voiceRecognitionAI = new VoiceRecognitionAI();

// Auto-integración con elementos existentes
document.addEventListener('DOMContentLoaded', function() {
    // Agregar botones de voz a elementos de texto existentes
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        if (!input.dataset.voiceEnabled) {
            const container = input.parentElement;
            if (container && !container.querySelector('.voice-button')) {
                const voiceButton = window.voiceRecognitionAI.createVoiceButton(input);
                voiceButton.style.position = 'absolute';
                voiceButton.style.right = '5px';
                voiceButton.style.top = '50%';
                voiceButton.style.transform = 'translateY(-50%)';
                voiceButton.style.zIndex = '1000';

                container.style.position = 'relative';
                container.appendChild(voiceButton);
                input.dataset.voiceEnabled = 'true';
            }
        }
    });
});

console.log('🎤 Sistema de Reconocimiento de Voz IA cargado correctamente');