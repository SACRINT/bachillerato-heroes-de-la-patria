/**
 * 🔍 DEVICE FINGERPRINTING - SEMANA 25
 * Sistema de identificación de dispositivos (cliente)
 *
 * Features:
 * - Canvas fingerprinting
 * - WebGL fingerprinting
 * - Font detection
 * - Screen/Hardware characteristics
 * - Timezone/Language detection
 * - Audio context fingerprinting
 * - Portable y modular (sin dependencias BGE)
 *
 * Uso:
 * ```javascript
 * const fingerprinter = new DeviceFingerprint();
 * const fingerprint = await fingerprinter.generate();
 * console.log(fingerprint.hash); // "a1b2c3d4..."
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

class DeviceFingerprint {
    constructor(config = {}) {
        this.config = {
            includeCanvas: config.includeCanvas !== false,
            includeWebGL: config.includeWebGL !== false,
            includeFonts: config.includeFonts !== false,
            includeAudio: config.includeAudio !== false,
            onError: config.onError || null,
            ...config
        };

        this.components = {};
    }

    /**
     * GENERAR FINGERPRINT COMPLETO
     */
    async generate() {
        try {
            console.log('[DEVICE-FINGERPRINT] Generando fingerprint...');

            // 1. Características básicas del navegador
            this.components.userAgent = navigator.userAgent;
            this.components.language = navigator.language || navigator.userLanguage;
            this.components.languages = navigator.languages ? navigator.languages.join(',') : '';
            this.components.platform = navigator.platform;
            this.components.hardwareConcurrency = navigator.hardwareConcurrency || 0;
            this.components.deviceMemory = navigator.deviceMemory || 0;
            this.components.maxTouchPoints = navigator.maxTouchPoints || 0;

            // 2. Pantalla
            this.components.screenResolution = `${screen.width}x${screen.height}`;
            this.components.screenColorDepth = screen.colorDepth;
            this.components.screenPixelDepth = screen.pixelDepth;
            this.components.devicePixelRatio = window.devicePixelRatio || 1;

            // 3. Timezone
            this.components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.components.timezoneOffset = new Date().getTimezoneOffset();

            // 4. Plugins (legacy, pero útil)
            this.components.plugins = this.getPlugins();

            // 5. Canvas fingerprinting
            if (this.config.includeCanvas) {
                this.components.canvas = await this.getCanvasFingerprint();
            }

            // 6. WebGL fingerprinting
            if (this.config.includeWebGL) {
                this.components.webgl = await this.getWebGLFingerprint();
            }

            // 7. Fonts detection
            if (this.config.includeFonts) {
                this.components.fonts = await this.detectFonts();
            }

            // 8. Audio context fingerprinting
            if (this.config.includeAudio) {
                this.components.audio = await this.getAudioFingerprint();
            }

            // 9. Storage support
            this.components.localStorage = this.testLocalStorage();
            this.components.sessionStorage = this.testSessionStorage();
            this.components.indexedDB = !!window.indexedDB;

            // 10. Cookies enabled
            this.components.cookiesEnabled = navigator.cookieEnabled;

            // 11. Do Not Track
            this.components.doNotTrack = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || '0';

            // 12. Browser features
            this.components.webRTC = this.testWebRTC();
            this.components.webWorkers = typeof Worker !== 'undefined';
            this.components.serviceWorkers = 'serviceWorker' in navigator;

            // Generar hash del fingerprint
            const hash = await this.generateHash(this.components);

            const fingerprint = {
                hash: hash,
                components: this.components,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            console.log('[DEVICE-FINGERPRINT] ✅ Fingerprint generado:', hash);

            return fingerprint;

        } catch (error) {
            console.error('[DEVICE-FINGERPRINT] ❌ Error generando fingerprint:', error);

            if (this.config.onError) {
                this.config.onError(error);
            }

            throw error;
        }
    }

    /**
     * CANVAS FINGERPRINTING
     */
    async getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return 'unsupported';
            }

            canvas.width = 280;
            canvas.height = 60;

            // Draw complex text with various styles
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);

            ctx.fillStyle = '#069';
            ctx.font = '11pt Arial';
            ctx.fillText('Canvas Fingerprint 🔍', 2, 15);

            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.font = 'bold 18px Times New Roman';
            ctx.fillText('Fingerprint Test', 4, 45);

            // Get canvas data URL
            const dataURL = canvas.toDataURL();

            // Hash the canvas data
            return this.simpleHash(dataURL);

        } catch (error) {
            console.error('[DEVICE-FINGERPRINT] Error en canvas:', error);
            return 'error';
        }
    }

    /**
     * WEBGL FINGERPRINTING
     */
    async getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl) {
                return 'unsupported';
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

            const fingerprint = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
                unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
            };

            return this.simpleHash(JSON.stringify(fingerprint));

        } catch (error) {
            console.error('[DEVICE-FINGERPRINT] Error en WebGL:', error);
            return 'error';
        }
    }

    /**
     * DETECTAR FUENTES INSTALADAS
     */
    async detectFonts() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana',
            'Helvetica', 'Comic Sans MS', 'Trebuchet MS', 'Impact', 'Arial Black',
            'Tahoma', 'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype',
            'Garamond', 'Bookman Old Style', 'Comic Sans', 'Copperplate', 'Papyrus'
        ];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return 'unsupported';
        }

        // Función para medir ancho de texto
        const measureText = (font) => {
            ctx.font = `72px ${font}`;
            return ctx.measureText('mmmmmmmmmmlli').width;
        };

        // Medir fuentes base
        const baseWidths = {};
        baseFonts.forEach(font => {
            baseWidths[font] = measureText(font);
        });

        // Detectar fuentes instaladas
        const detectedFonts = [];

        for (const testFont of testFonts) {
            let detected = false;

            for (const baseFont of baseFonts) {
                const testWidth = measureText(`${testFont}, ${baseFont}`);

                if (testWidth !== baseWidths[baseFont]) {
                    detected = true;
                    break;
                }
            }

            if (detected) {
                detectedFonts.push(testFont);
            }
        }

        return this.simpleHash(detectedFonts.join(','));
    }

    /**
     * AUDIO CONTEXT FINGERPRINTING
     */
    async getAudioFingerprint() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;

            if (!AudioContext) {
                return 'unsupported';
            }

            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const gainNode = context.createGain();
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

            gainNode.gain.value = 0; // Mute
            oscillator.type = 'triangle';
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.start(0);

            return new Promise((resolve) => {
                scriptProcessor.onaudioprocess = (event) => {
                    const output = event.outputBuffer.getChannelData(0);
                    const fingerprint = Array.from(output.slice(0, 30)).join(',');

                    oscillator.stop();
                    scriptProcessor.disconnect();
                    context.close();

                    resolve(this.simpleHash(fingerprint));
                };
            });

        } catch (error) {
            console.error('[DEVICE-FINGERPRINT] Error en audio:', error);
            return 'error';
        }
    }

    /**
     * OBTENER PLUGINS DEL NAVEGADOR
     */
    getPlugins() {
        if (!navigator.plugins || navigator.plugins.length === 0) {
            return 'none';
        }

        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            plugins.push(plugin.name);
        }

        return this.simpleHash(plugins.join(','));
    }

    /**
     * TEST LOCALSTORAGE
     */
    testLocalStorage() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * TEST SESSIONSTORAGE
     */
    testSessionStorage() {
        try {
            const test = '__storage_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * TEST WEBRTC
     */
    testWebRTC() {
        return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    }

    /**
     * GENERAR HASH SHA-256 (usando Web Crypto API)
     */
    async generateHash(data) {
        const jsonString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(jsonString);

        // Usar Web Crypto API para SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

        // Convertir a hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
    }

    /**
     * SIMPLE HASH (fallback para componentes individuales)
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return '0';

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash).toString(16);
    }

    /**
     * COMPARAR DOS FINGERPRINTS
     */
    static compare(fingerprint1, fingerprint2) {
        if (!fingerprint1 || !fingerprint2) {
            return { match: false, score: 0 };
        }

        if (fingerprint1.hash === fingerprint2.hash) {
            return { match: true, score: 100 };
        }

        // Comparar componentes individuales
        const components1 = fingerprint1.components;
        const components2 = fingerprint2.components;

        if (!components1 || !components2) {
            return { match: false, score: 0 };
        }

        const keys = Object.keys(components1);
        let matchCount = 0;

        for (const key of keys) {
            if (components1[key] === components2[key]) {
                matchCount++;
            }
        }

        const score = Math.round((matchCount / keys.length) * 100);

        return {
            match: score >= 80, // 80% similarity threshold
            score: score,
            matchedComponents: matchCount,
            totalComponents: keys.length
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DeviceFingerprint = DeviceFingerprint;
}

// Exportar para Node.js (si se usa en testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceFingerprint;
}
